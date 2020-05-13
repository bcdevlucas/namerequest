import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Keycloak, { KeycloakInstance, KeycloakConfig } from 'keycloak-js'

import { createCacheAdapter, createCacheStore } from './api-client/cache'

import BaseClient from './api-client/client'

let keycloakConfig = {
  "realm": "master",
  // "url": "https://sso-dev.pathfinder.gov.bc.ca/auth",
  "url": "http://127.0.0.1:5010/auth",
  "clientId": "public-client"
} as KeycloakConfig

let baseURL = function () {
  if (process.env.NODE_ENV === 'development') {
    if (process.env.VUE_APP_MOCK_API === 'yes') {
      return process.env.VUE_APP_API_URL_MOCK
    }
  }
  return process.env.VUE_APP_API_URL
}

const cacheStore = createCacheStore()
const cache = createCacheAdapter(cacheStore)

class Axios extends BaseClient {
  static instance = undefined
  private instance: AxiosInstance

  static keycloak = undefined
  private keycloak: KeycloakInstance

  constructor (config) {
    super()

    this.keycloak = Keycloak(keycloakConfig)

    this.instance = axios.create(config)

    /* this.keycloak.init({
      onLoad: 'check-sso',
      flow: 'hybrid'
    }) */

    this.instance.interceptors.request.use(config => {
      return new Promise((resolve, reject) => {
        this.applyAuth(config)

        config.headers.Authorization = 'Bearer ' + this.keycloak.token
        resolve(config)
      })
    })
  }

  protected configureRequest () {
    let requestConfig: AxiosRequestConfig = {
      adapter: cache.adapter,
      baseURL: url,
      method: httpMethod,
      headers: defaultHeaders
    }

    // Set requestHandler if it is set by user
    if (this.requestHandler) {
      // todo: http or https?
      requestConfig.httpAgent = this.requestHandler
      requestConfig.httpsAgent = this.requestHandler
    }

    // Set request timeout
    requestConfig.timeout = this.timeout

    /* let contentType = XhrRequestHelper.jsonPreferredMime(contentTypes)
    if (contentType) {
      if (contentType !== 'multipart/form-data') {
        requestConfig.headers = Object.assign(requestConfig.headers, { 'Content-Type': contentType })
      }
    } else if (typeof requestConfig.headers['Content-Type'] === 'undefined') {
      requestConfig.headers = Object.assign(requestConfig.headers, { 'Content-Type': 'application/json;charset=UTF-8' })
    } */

    /* if (contentType === 'application/x-www-form-urlencoded') {
      // requestConfig.data = querystring.stringify(UrlHelper.normalizeParams(formParams))
    } else if (contentType === 'multipart/form-data') {
      let _formParams = UrlHelper.normalizeParams(formParams)
      for (let key in _formParams) {
        if (_formParams.hasOwnProperty(key)) {
          if (UrlHelper.isFileParam(_formParams[key])) {
            // TODO: Fix me!
            // file field
            // requestConfig.attach(key, _formParams[key])
          } else {
            // requestConfig.field(key, _formParams[key])
          }
        }
      }
    } */
    /* else if (bodyParam) {
      // Wrap arrays (deserialize on server as ListWrapper)
      // requestConfig.data = (bodyParam instanceof Array) ? { content: bodyParam } : bodyParam
    } */
  }

  protected applyAuth (config): Promise<AxiosRequestConfig> {
    // If the authHandler implements refreshTokenIfExpired, invoke it
    if (typeof this.authHandler.refreshTokenIfExpired === 'function') {
      return this.authHandler.refreshTokenIfExpired().then((debugInfo) => {
        if (debugInfo.refreshed) {
          // eslint-disable-next-line no-console
          console.log('Keycloak token was successfully refreshed - logging token info')
          // eslint-disable-next-line no-console
          console.log(debugInfo)
        }

        // Update the request config
        let updatedConfig = Object.assign({}, config)
        // Re-apply authentications
        this.applyAuthToRequest(updatedConfig, authNames)
        return Promise.resolve(updatedConfig)
      }).catch((err) => {
        if (error.hasOwnProperty('adapter') && error.hasOwnProperty('token')) {
          // eslint-disable-next-line no-console
          console.log('Failed to refresh the token, or the session has expired')
          // eslint-disable-next-line no-console
          console.log(err) // Will be the same type as debugInfo in the then() clause
        }

        if (err instanceof Error) {
          // this.handleError(err, onError, err.message)
        }
      })
    }

    return Promise.resolve(config)
  }

  get (url, config?): Promise<AxiosResponse<any>> {
    return this.instance.get(url, config)
  }

  post (url, config?): Promise<AxiosResponse<any>> {
    return this.instance.post(url, config)
  }

  put (url, config?): Promise<AxiosResponse<any>> {
    return this.instance.put(url, config)
  }

  delete (url, config?): Promise<AxiosResponse<any>> {
    return this.instance.delete(url, config)
  }
}

const configuredAxiosInstance = new Axios({
  baseURL: baseURL() + '/api/v1'
})

export default configuredAxiosInstance

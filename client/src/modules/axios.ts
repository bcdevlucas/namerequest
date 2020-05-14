import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Keycloak, { KeycloakInstance, KeycloakConfig } from 'keycloak-js'

import { createCacheAdapter, createCacheStore } from './api-client/cache'

import { Client, ApiClientConfig } from './api-client/client'

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

class Axios extends Client {
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
  }

  protected configureRequest (config) {
    let { axiosConfig, authNames } = config as ApiClientConfig
    const { method, url, headers } = axiosConfig as AxiosRequestConfig

    let requestConfig: AxiosRequestConfig = Object.assign({
      adapter: cache.adapter,
      baseURL: url,
      // method: httpMethod,
      headers: headers // TODO: Add default headers
    }, axiosConfig)

    // Set requestHandler if it has been overridden
    if (this.requestHandler) {
      // todo: http or https?
      requestConfig.httpAgent = this.requestHandler
      requestConfig.httpsAgent = this.requestHandler
    }

    // Set request timeout
    requestConfig.timeout = this.timeout

    // TODO: We may have to move this out
    this.instance.interceptors.request.use(async config => {
      // If the authHandler implements refreshTokenIfExpired, invoke it
      if (typeof this.authHandler.refreshTokenIfExpired === 'function') {
        let token = await this.authHandler.refreshTokenIfExpired()

        if (token.refreshed) {
          // eslint-disable-next-line no-console
          console.log('Keycloak token was successfully refreshed - logging token info')
          // eslint-disable-next-line no-console
          console.log(token)
        }

        // Update the request config
        let updatedConfig = Object.assign({}, config)
        // Re-apply authentications
        this.applyAuthToRequest(updatedConfig, authNames)

        return config
      }
    })

    return requestConfig
  }

  get (url, config: ApiClientConfig = {}): Promise<AxiosResponse<any>> {
    const axiosConfig = this.configureRequest(config)
    return this.instance.get(url, axiosConfig)
  }

  post (url, config: ApiClientConfig = {}): Promise<AxiosResponse<any>> {
    const axiosConfig = this.configureRequest(config)
    return this.instance.post(url, axiosConfig)
  }

  put (url, config: ApiClientConfig = {}): Promise<AxiosResponse<any>> {
    const axiosConfig = this.configureRequest(config)
    return this.instance.put(url, axiosConfig)
  }

  delete (url, config: ApiClientConfig = {}): Promise<AxiosResponse<any>> {
    const axiosConfig = this.configureRequest(config)
    return this.instance.delete(url, axiosConfig)
  }
}

const configuredAxiosInstance = new Axios({
  baseURL: baseURL() + '/api/v1'
})

export default configuredAxiosInstance

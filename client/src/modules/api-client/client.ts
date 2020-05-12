import axios from 'axios'

import assign from 'object-assign'
import querystring from 'querystring'

import UrlHelper from 'qc-react/helpers/URL'
import XhrRequestHelper from 'qc-react/helpers/XhrRequest'

import HashProxy from 'qc-react/utils/HashProxy'

import { createCacheAdapter, createCacheStore } from './cache'

import BasicAuthAdapter from './adapters/Basic'
import ApiKeyAuthAdapter from './adapters/ApiKey'
import OAuth2AuthAdapter from './adapters/OAuth2'

import { convertToType as _convertToType, constructFromObject as _constructFromObject } from './utils'

/**
 * @module ApiClient
 * @version 1.0.0
 */

const cacheStore = createCacheStore()
const cache = createCacheAdapter(cacheStore)

interface ApiClient {
  basePath: string
  authentications: any
  authHandlers: any
}

class BaseClient {
  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  static instance = null

  handler = null

  /**
   * The base URL against which to resolve every API call's (relative) path.
   * @type {String}
   * @default https://localhost
   */
  basePath = 'https://localhost'.replace(/\/+$/, '')
  /**
   * The authentication methods to be included for all API calls.
   * @type {Array.<String>}
   */
  authentications = { 'OAuth2': { type: 'oauth2' } }

  /**
   * A HashProxy of authentication handlers that can be used.
   */
  authHandlers = new HashProxy()

  /**
   * The default HTTP headers to be included for all API calls.
   * @type {Array.<String>}
   * @default {}
   */
  defaultHeaders = { 'Access-Control-Allow-Origin': '*' }

  /**
   * The default HTTP timeout for all API calls.
   * @type {Number}
   * @default 60000
   */
  timeout = 60000

  /**
   * If set to false an additional timestamp parameter is added to all API GET calls to
   * prevent browser caching
   * @type {Boolean}
   * @default true
   */
  cache = true

  /**
   * If set to true, the client will save the cookies from each server
   * response, and return them in the next request.
   * @default false
   */
  enableCookies = false

  /**
   * This functionality has been delegated to the OAuth2AuthAdapter.
   * @returns {any}
   */
  getToken () {
    return this.authHandler.getToken()
  }

  /**
   * This functionality has been delegated to the OAuth2AuthAdapter.
   * @returns {any}
   */
  getTokens () {
    return this.authHandler.getTokens()
  }

  /**
   * This functionality has been delegated to the OAuth2AuthAdapter.
   * @returns {any}
   */
  getParsedTokens () {
    return this.authHandler.getParsedTokens()
  }

  /**
   * This functionality has been delegated to the OAuth2AuthAdapter.
   */
  clearTokens () {
    this.authHandler.clearTokens()
  }

  /**
   * This functionality has been delegated to the OAuth2AuthAdapter.
   * @deprecated
   */
  checkToken () {
    // TODO: This is the old skool quickcommerce check
    // let authTokens = this.doLoginCheck()
    // return (authTokens) ? this.getToken() : false
  }
}

/**
 * Manages low level client-server communications, parameter marshalling, etc. There should not be any need for an
 * application to use this class directly - the *Api and model classes provide the public API for the service. The
 * contents of this file should be regarded as internal but are documented for completeness.
 * @alias module:ApiClient
 * @class
 */
class Client extends BaseClient implements ApiClient {
  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  static instance = null

  /**
   * Allows user to override axios agent.
   */
  requestHandler = null

  constructor () {
    super()

    if (Client.instance instanceof Client) return
    /*
     * Used to save and return cookies in a node.js (non-browser) setting,
     * if this.enableCookies is set to true.
     */
    if (typeof window === 'undefined') {
      this.handler = axios.create({
        adapter: cache.adapter,
        baseURL: this.basePath,
        timeout: this.timeout,
        headers: this.defaultHeaders
      })
    }

    Client.instance = this
  }

  /**
   * Registers authentication handlers.
   * @param handlers
   */
  registerAuthHandlers (handlers) {
    this.authHandlers = new HashProxy(handlers)
  }

  /**
   * Registers an authentication handler.
   * @param name
   * @param handler
   */
  registerAuthHandler (name, handler) {
    // if (this.authHandlers instanceof HashProxy) {
    this.authHandlers[name] = handler
    // }
  }

  /**
   * Set the default authentication handler to use.
   * @deprecated
   * @param handler
   */
  setCurrentAuthHandler (handler) {
    this.authHandler = handler
  }

  /**
   * @returns {*}
   */
  authenticate (authType) {
    this.setCurrentAuthHandler(this.authHandlers[authType])
    return this.authHandler.authenticate()
  }

  /**
   * @param type
   * @param value
   */
  setDefaultHeader (type, value) {
    let headers = this.defaultHeaders || {}

    // Fail silently if either the type or value is not supplied or if
    // either parameter is of the wrong type
    if (!(typeof type === 'string' || typeof value === 'string')) return

    headers[type] = value

    this.defaultHeaders = headers
  }

  /**
   * Applies authentication headers to the requestConfig.
   * @param {Object} requestConfig The requestConfig object created by an <code>axios</code> call.
   * @param {Array.<String>} authNames An array of authentication method names.
   */
  applyAuthToRequest (requestConfig, authNames) {
    authNames.forEach((authName) => {
      let authConfig = this.authentications[authName]
      let authHeaders = null

      switch (authConfig.type) {
        case 'basic':
          this.setCurrentAuthHandler(this.authHandlers[authConfig.type])
          if (this.authHandler instanceof BasicAuthAdapter) {
            this.authHandler.applyAuthToRequest(authConfig, requestConfig)
          } else {
            throw new Error('authHandler is not an instance of BasicAuthAdapter')
          }

          break
        case 'apiKey':
          this.setCurrentAuthHandler(this.authHandlers[authConfig.type])
          if (this.authHandler instanceof ApiKeyAuthAdapter) {
            this.authHandler.applyAuthToRequest(authConfig, requestConfig)
          } else {
            throw new Error('authHandler is not an instance of ApiKeyAuthAdapter')
          }

          break
        case 'oauth2':
          this.setCurrentAuthHandler(this.authHandlers[authConfig.type])
          if (this.authHandler instanceof OAuth2AuthAdapter) {
            this.authHandler.applyAuthToRequest(authConfig, requestConfig)
          } else {
            throw new Error('authHandler is not an instance of OAuth2AuthAdapter')
          }

          break
        default:
          throw new Error('Unknown authentication type: ' + authConfig.type)
      }

      requestConfig.headers = Object.assign((requestConfig.headers || {}), authHeaders)
    })
  }

  /**
   * Invokes the REST service using the supplied settings and parameters.
   * @param {String} path The base URL to invoke.
   * @param {String} httpMethod The HTTP method to use.
   * @param {Object.<String, String>} pathParams A map of path parameters and their values.
   * @param {Object.<String, Object>} queryParams A map of query parameters and their values.
   * @param {Object.<String, Object>} headerParams A map of header parameters and their values.
   * @param {Object.<String, Object>} formParams A map of form parameters and their values.
   * @param {Object} bodyParam The value to pass as the request body.
   * @param {Array.<String>} authNames An array of authentication type names.
   * @param {Array.<String>} contentTypes An array of request MIME types.
   * @param {Array.<String>} accepts An array of acceptable response MIME types.
   * @param {(String|Array|Object|Function)} returnType The required type to return can be a string for simple types or the
   * constructor for a complex type.
   * @param {module:ApiClient~callback} onSuccess The onSuccess callback function.
   * @param {module:ApiClient~callback} onError The onError callback function.
   * @returns {Object} The Axios request object.
   */
  callApi (path, httpMethod, pathParams,
    queryParams, headerParams, formParams, bodyParam, authNames, contentTypes, accepts,
    returnType, onSuccess, onError) {
    let defaultHeaders = this.defaultHeaders || {}

    let url = UrlHelper.buildUrl(path, pathParams)
    let requestConfig = {
      adapter: cache.adapter,
      baseURL: url,
      method: httpMethod,
      headers: defaultHeaders
    }

    // Apply authentications
    // this.applyAuthToRequest(requestConfig, authNames)

    // Set query parameters
    if (httpMethod.toUpperCase() === 'GET' && this.cache === false) {
      queryParams['_'] = new Date().getTime()
    }

    requestConfig.params = UrlHelper.normalizeParams(queryParams)

    // TODO: Set header parameters
    // requestConfig.set(this.defaultHeaders).set(UrlHelper.normalizeParams(headerParams))

    // Set requestHandler if it is set by user
    if (this.requestHandler) {
      // todo: http or https?
      requestConfig.httpAgent = this.requestHandler
      requestConfig.httpsAgent = this.requestHandler
    }

    // Set request timeout
    requestConfig.timeout = this.timeout

    let contentType = XhrRequestHelper.jsonPreferredMime(contentTypes)
    if (contentType) {
      if (contentType !== 'multipart/form-data') {
        requestConfig.headers = Object.assign(requestConfig.headers, { 'Content-Type': contentType })
      }
    } else if (typeof requestConfig.headers['Content-Type'] === 'undefined') {
      requestConfig.headers = Object.assign(requestConfig.headers, { 'Content-Type': 'application/json;charset=UTF-8' })
    }

    if (contentType === 'application/x-www-form-urlencoded') {
      requestConfig.data = querystring.stringify(UrlHelper.normalizeParams(formParams))
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
    } else if (bodyParam) {
      // Wrap arrays (deserialize on server as ListWrapper)
      requestConfig.data = (bodyParam instanceof Array) ? { content: bodyParam } : bodyParam
    }

    let accept = XhrRequestHelper.jsonPreferredMime(accepts)

    if (accept) {
      // requestConfig.accept(accept)
    }

    if (returnType === 'Blob') {
      requestConfig.responseType('blob')
    } else if (returnType === 'String') {
      requestConfig.responseType('string')
    }

    // Attach previously saved cookies, if enabled
    /* if (this.enableCookies) {
     if (typeof window === 'undefined') {
     this.handler.attachCookies(requestConfig)
     }
     else {
     requestConfig.withCredentials()
     }
     } */

    let that = this

    let instance = axios.create()
    // Dunno why these aren't copied over
    // https://github.com/axios/axios/issues/1330
    // instance.CancelToken = axios.CancelToken
    // instance.isCancel = axios.isCancel

    instance.interceptors.request.use((config) => {
      // If the authHandler implements refreshTokenIfExpired, invoke it
      if (typeof that.authHandler.refreshTokenIfExpired === 'function') {
        return that.authHandler.refreshTokenIfExpired().then((debugInfo) => {
          if (debugInfo.refreshed) {
            console.log('Keycloak token was successfully refreshed - logging token info')
            console.log(debugInfo)
          }

          // Update the request config
          let updatedConfig = Object.assign({}, config)
          // Re-apply authentications
          that.applyAuthToRequest(updatedConfig, authNames)
          return Promise.resolve(updatedConfig)
        }).catch((err) => {
          if (error.hasOwnProperty('adapter') && error.hasOwnProperty('token')) {
            console.log('Failed to refresh the token, or the session has expired')
            console.log(err) // Will be the same type as debugInfo in the then() clause
          }

          if (err instanceof Error) {
            Client.handleError(err, onError, err.message)
          }
        })
      }

      return Promise.resolve(config)
    })

    instance.request(requestConfig).then(response => {
      if (returnType === 'Blob') {
        // requestConfig.responseType('blob')
      } else if (returnType === 'String') {
        // requestConfig.responseType('string')
      }

      Client.handleResponse(response, onSuccess, onError)

      // Attach previously saved cookies, if enabled
      /* if (this.enableCookies) {
       if (typeof window === 'undefined') {
       this.handler.attachCookies(requestConfig)
       } else {
       requestConfig.withCredentials()
       }
       } */
    }).catch(err => {
      Client.handleError(err, onError, err.message)
    })

    return requestConfig
  }

  /**
   * @param response
   * @param onSuccess
   * @param onError
   * @param legacy
   */
  static handleResponse (response, onSuccess, onError, legacy = false) {
    // 200 OK, 201 Created
    if (response.success || response.status === 200 || response.status === 201 || response.status === 204) {
      if (response.hasOwnProperty('data')) {
        if (typeof onSuccess === 'function') {
          onSuccess(response.data)
        }
      } else {
        if (typeof onSuccess === 'function') {
          onSuccess()
        }
      }

      return
    }

    Client.handleApiError(response, onError)
  }

  /**
   * @param error
   * @param onError
   * @param customMessage
   */
  static handleError (error, onError, customMessage) {
    if (typeof onError === 'function') {
      onError(error, customMessage)
    } else {
      // Catch and re-throw
      throw new Error(customMessage + ': ' + JSON.stringify(error))
    }
  }

  /**
   * @param response
   * @param onError
   */
  static handleApiError (response, onError) {
    if (typeof onError === 'function') {
      onError()
    }
  }
}

export default Client

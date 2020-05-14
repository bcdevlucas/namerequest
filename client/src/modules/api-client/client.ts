import axios, { AxiosRequestConfig } from 'axios'

import { HashProxy } from './utils'

import { createCacheAdapter, createCacheStore } from './cache'

import BasicAuthAdapter from './adapters/Basic'
import ApiKeyAuthAdapter from './adapters/ApiKey'
import OAuth2AuthAdapter from './adapters/OAuth2'

/**
 * @module ApiClient
 * @version 1.0.0
 */

const cacheStore = createCacheStore()
const cache = createCacheAdapter(cacheStore)

export interface ApiClientConfig {
  axiosConfig?: AxiosRequestConfig,
  authNames?: string[]
}

export interface ApiClient {
  basePath: string
  authentications: any
  authHandlers: any
  authHandler: any
  defaultHeaders: {}
}

class BaseClient implements ApiClient {
  /**
   * The default API client implementation.
   * @type {module:ApiClient}
   */
  static instance = null

  handler = null

  /**
   * Allows user to override axios agent.
   */
  requestHandler = null

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

  // @ts-ignore
  /**
   * A HashProxy of authentication handlers that can be used.
   */
  authHandlers = HashProxy({}, {})

  /**
   * The active authentication handler.
   */
  authHandler = null

  /**
   * The default HTTP headers to be included for all API calls.
   * @type {Array.<String>}
   * @default {}
   */
  defaultHeaders = {}

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

  constructor () {
    if (Client.instance instanceof Client) return

    this.defaultHeaders = { 'Access-Control-Allow-Origin': '*' }
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

  /**
   * Registers authentication handlers.
   * @param handlers
   */
  registerAuthHandlers (handlers) {
    this.authHandlers = HashProxy(handlers, {})
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
      this.setCurrentAuthHandler(this.authHandlers[authConfig.type])
      this.authHandler.applyAuthToRequest(authConfig, requestConfig)

      requestConfig.headers = Object.assign((requestConfig.headers || {}), {})
    })
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
   * @param response
   * @param onSuccess
   * @param onError
   * @param legacy
   */
  handleResponse (response, onSuccess, onError, legacy = false) {
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

    this.handleApiError(response, onError)
  }

  /**
   * @param error
   * @param onError
   * @param customMessage
   */
  handleError (error, onError, customMessage) {
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
  handleApiError (response, onError) {
    if (typeof onError === 'function') {
      onError()
    }
  }
}

export { Client }

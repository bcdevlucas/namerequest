class OAuth2AuthAdapter {
  constructor (driver) {
    this.driver = driver
  }

  /**
   * @returns {Promise<any>}
   */
  authenticate () {
    return this.driver.authenticate()
  }

  /**
   * Applies authentication headers to the requestConfig.
   */
  applyAuthToRequest (authConfig, requestConfig) {
    let authHeaders = null

    if (authConfig.accessToken) {
      authHeaders = { 'Authorization': 'Bearer ' + authConfig.accessToken }
    } else {
      const authTokens = this.getTokens()
      authHeaders = { 'Authorization': 'Bearer ' + authTokens.token }
    }

    requestConfig.headers = Object.assign((requestConfig.headers || {}), authHeaders)
  }

  // If client credentials grant this needs to be done a little differently...

  setTokens (tokens) {
    this.driver.setStoredTokens(tokens)
  }

  getTokens () {
    return this.driver.getStoredTokens()
  }

  getParsedTokens () {
    return this.driver.getParsedActiveSessionTokens()
  }

  clearTokens () {
    this.driver.clearStoredTokens()
  }

  refreshTokenIfExpired () {
    return this.driver.refreshTokenIfExpired()
  }
}

export default OAuth2AuthAdapter

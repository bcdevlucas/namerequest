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

    // TODO: This first condition looks like it was previously used for a baked-in OAuth key or an API key
    // Don't remove it just yet, it doesn't hurt to leave it here, which gives me some context on how it was used
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

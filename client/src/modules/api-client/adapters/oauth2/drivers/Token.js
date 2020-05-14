class OAuth2TokenDriver {
  constructor (apiClient, adapter) {
    this.adapter = adapter
    this.apiClient = apiClient
  }

  async refreshTokenIfExpired () {
    throw new Error('refreshTokenIfExpired is not implemented in this driver')
  }

  static getToken () {
    throw new Error('getToken is not implemented in this driver')
  }

  static setToken (authTokens) {
    throw new Error('setToken is not implemented in this driver')
  }

  static clearToken () {
    throw new Error('clearToken is not implemented in this driver')
  }
}

export default OAuth2TokenDriver

import Keycloak from 'keycloak-js'

const DEFAULT_TOKENS = {
  token: '',
  refreshToken: ''
}

const TOKEN_SESSION_VAR = 'keycloak_token'
// const TOKEN_SESSION_PARSED_VAR = 'keycloak_tokenParsed'
const REFRESH_TOKEN_SESSION_VAR = 'keycloak_refreshToken'
// const REFRESH_TOKEN_SESSION_PARSED_VAR = 'keycloak_refreshTokenParsed'

class OAuth2KeycloakDriver {
  constructor (keycloak) {
    this.keycloak = (keycloak instanceof Keycloak) ? keycloak : new Keycloak(keycloak)
  }

  async authenticate () {
    await this.initialize()
    this.updateStoredTokens()
  }

  async initialize () {
    let storedTokens = this.getStoredTokens()

    try {
      /* this.keycloak.init({
        onLoad: 'check-sso',
        flow: 'hybrid'
      }) */

      let authenticated = await this.keycloak
        .init({
          onLoad: 'login-required',
          checkLoginIframe: false,
          responseMode: 'query',
          token: storedTokens.token,
          refreshToken: storedTokens.refreshToken
        })

      if (authenticated) {
        this.updateStoredTokens()
        // eslint-disable-next-line no-console
        console.log('Keycloak has authenticated')

        return {
          adapter: this.keycloak,
          token: this.keycloak.token,
          refreshToken: this.keycloak.refreshToken,
          idToken: this.keycloak.idToken
        }
      }

      // eslint-disable-next-line no-console
      console.log('Keycloak failed to authenticate')

      return {
        adapter: this.keycloak,
        token: this.keycloak.token,
        refreshToken: this.keycloak.refreshToken,
        idToken: this.keycloak.idToken,
        error: true
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Keycloak failed to authenticate due to an error')
      // eslint-disable-next-line no-console
      console.log(e)

      return {
        adapter: this.keycloak,
        token: this.keycloak.token,
        refreshToken: this.keycloak.refreshToken,
        idToken: this.keycloak.idToken,
        error: true
      }
    }
  }

  /**
   * @returns {Promise<{
   * adapter: Keycloak | Keycloak.KeycloakInstance | *,
   * refreshed: boolean,
   * idToken: string,
   * timestamp: Date,
   * token: string,
   * refreshToken: string}|{adapter: Keycloak | Keycloak.KeycloakInstance | *,
   * refreshed: boolean,
   * idToken: string,
   * error: boolean,
   * token: string, refreshToken: string}>}
   */
  async refreshTokenIfExpired () {
    try {
      const refreshed = await this.keycloak.updateToken(5)
      if (refreshed) {
        this.updateStoredTokens()
      }

      return {
        timestamp: new Date(),
        adapter: this.keycloak,
        token: this.keycloak.token,
        refreshToken: this.keycloak.refreshToken,
        idToken: this.keycloak.idToken,
        refreshed: refreshed
      }
    } catch (e) {
      // console.log(e)
      await this.keycloak.login()
      return {
        adapter: this.keycloak,
        token: this.keycloak.token,
        refreshToken: this.keycloak.refreshToken,
        idToken: this.keycloak.idToken,
        refreshed: false,
        error: true
      }
    }
  }

  getStoredTokens () {
    let sessionTokens = Object.assign({}, DEFAULT_TOKENS)

    if (sessionStorage.hasOwnProperty(TOKEN_SESSION_VAR)) {
      sessionTokens.token = sessionStorage.getItem(TOKEN_SESSION_VAR)
    }

    if (sessionStorage.hasOwnProperty(REFRESH_TOKEN_SESSION_VAR)) {
      sessionTokens.refreshToken = sessionStorage.getItem(REFRESH_TOKEN_SESSION_VAR)
    }

    return sessionTokens
  }

  setStoredTokens (keycloakTokens) {
    keycloakTokens = keycloakTokens || DEFAULT_TOKENS
    if (keycloakTokens.hasOwnProperty('token') && typeof keycloakTokens.token === 'string') {
      sessionStorage.setItem(TOKEN_SESSION_VAR, keycloakTokens.token)
    }

    if (keycloakTokens.hasOwnProperty('refreshToken') && typeof keycloakTokens.refreshToken === 'string') {
      sessionStorage.setItem(REFRESH_TOKEN_SESSION_VAR, keycloakTokens.refreshToken)
    }
  }

  updateStoredTokens () {
    let keycloakTokens = Object.assign({}, DEFAULT_TOKENS, {
      token: this.keycloak.token,
      // access: this.keycloak.token,
      refreshToken: this.keycloak.refreshToken
    })

    this.setStoredTokens(keycloakTokens)
  }

  getParsedActiveSessionTokens () {
    return {
      token: this.keycloak.idTokenParsed,
      refreshToken: this.keycloak.refreshTokenParsed
    }
  }

  clearStoredTokens () {
    if (sessionStorage.hasOwnProperty(TOKEN_SESSION_VAR)) {
      sessionStorage.removeItem(TOKEN_SESSION_VAR)
    }

    if (sessionStorage.hasOwnProperty(REFRESH_TOKEN_SESSION_VAR)) {
      sessionStorage.removeItem(REFRESH_TOKEN_SESSION_VAR)
    }
  }
}

export default OAuth2KeycloakDriver

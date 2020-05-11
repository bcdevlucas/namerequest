import axios, { AxiosInstance, AxiosResponse } from 'axios'
import Keycloak, { KeycloakInstance, KeycloakConfig } from 'keycloak-js'

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

class Axios {
  static instance = undefined
  private instance: AxiosInstance

  static keycloak = undefined
  private keycloak: KeycloakInstance

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

  constructor (config) {
    this.keycloak = Keycloak(keycloakConfig)

    this.instance = axios.create(config)
    this.keycloak.init({
      onLoad: 'check-sso',
      flow: 'hybrid'
    })

    this.instance.interceptors.request.use(config => {
      return new Promise((resolve, reject) => {
        config.headers.Authorization = 'Bearer ' + this.keycloak.token
        resolve(config)
      })
    })
  }
}

const configuredAxiosInstance = new Axios({
  baseURL: baseURL() + '/api/v1'
})

export default configuredAxiosInstance

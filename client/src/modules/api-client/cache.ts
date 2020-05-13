import localforage from 'localforage'
import memoryDriver from 'localforage-memoryStorageDriver'

import { setupCache } from 'axios-cache-adapter'

/**
 * Creates a localForage cache adapter for axios.
 * @param cacheStore
 * @returns {*}
 */
const createCacheAdapter = (cacheStore) => {
  return setupCache({
    maxAge: 15 * 60 * 1000,
    store: cacheStore,
    exclude: {
      filter: (request) => {
        // eg. Include URIs to cache...
        // const inclusionRegexArr = [
        //   /api\/v1\/
        // ]
        const inclusionRegexArr = []

        // Don't cache any requests by default
        let exclude = true

        for (let idx = 0; idx < inclusionRegexArr.length; idx++) {
          // TODO: Abstract? baseURL is specific to axios-cache-adapter
          if (request.baseURL.match(inclusionRegexArr[idx]) !== null) {
            exclude = null
            break
          }
        }

        return exclude
      }
    },
    // TODO: Remove in production, in a manner to-be-determined...
    debug: false
  })
}

/**
 * Creates a localForage cache store for axios.
 * @returns {*}
 */
const createCacheStore = () => {
  return localforage.createInstance({
    // List of drivers used
    driver: [
      localforage.INDEXEDDB,
      localforage.LOCALSTORAGE,
      memoryDriver
    ],
    // Prefix all storage keys to prevent conflicts
    name: 'lf-cache'
  })
}

export { createCacheAdapter, createCacheStore }

/**
 * Constructs a new map or array model from REST data.
 * @param data {Object|Array} The REST data.
 * @param obj {Object|Array} The target object or array.
 */
function constructFromObject (data, obj, itemType, convertToType = () => {}) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      // if (data.hasOwnProperty(i)) { obj[i] = convertToType(data[i], itemType) }
    }
  } else {
    for (let k in data) {
      // if (data.hasOwnProperty(k)) { obj[k] = convertToType(data[k], itemType) }
    }
  }
}

/**
 * Deserializes an HTTP response body into a value of the specified type.
 * @param {Object} response An Axios response object.
 * @param {(String|Array.<String>|Object.<String, Object>|Function)} returnType The type to return. Pass a string for simple types
 * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
 * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
 * all properties on <code>data<code> will be converted to this type.
 * @returns A value of the specified type.
 */
function deserialize (response, returnType) {
  if (response === null || returnType === null || response.status === 204) {
    return null
  }

  // Rely on Axios for parsing response body
  let data = response.body
  if (data === null || (typeof data === 'object' && typeof data.length === 'undefined' && !Object.keys(data).length)) {
    // Axios does not always produce a body, so use the unparsed response as a fallback
    data = response.text
  }

  // return Client.convertToType(data, returnType)
}

function HashProxy (obj, obj2) {
  const obj1 = {
    get: (hashTable, key) => {
      // Ignore non-strings
      if (typeof key !== 'string') {
        return undefined
      }

      return hashTable.getItem(key)
    },
    set: (hashTable, key, value) => {
      hashTable.setItem(key, value)
      return true
    },
    apply: (hashTable, context, argumentsList) => {
      return hashTable.apply(context, argumentsList)
    }
  }

  // @ts-ignore
  return new Proxy(new HashTable(obj), obj1, obj2)
}

class HashTable {
  length: number
  private items: {}

  constructor (obj) {
    obj = obj || null

    this.length = 0
    this.items = {}

    let p

    if (obj !== null) {
      for (p in obj) {
        if (obj.hasOwnProperty(p)) {
          this.items[p] = obj[p]
          this.length++
        }
      }
    }

    return this
  }

  setItem (key, value) {
    let previous

    if (this.hasItem(key)) {
      previous = this.items[key]
    } else {
      this.length++
    }

    this.items[key] = value
    return previous
  }

  getItem (key) {
    return this.hasItem(key) ? this.items[key] : undefined
  }

  hasItem (key) {
    return this.items.hasOwnProperty(key)
  }

  removeItem (key) {
    let previous

    if (this.hasItem(key)) {
      previous = this.items[key]
      this.length--
      delete this.items[key]
      return previous
    }

    return undefined
  }

  keys () {
    let keys = []; let k

    for (k in this.items) {
      if (this.hasItem(k)) {
        keys.push(k)
      }
    }

    return keys
  }

  values () {
    let values = []; let k

    for (k in this.items) {
      if (this.hasItem(k)) {
        values.push(this.items[k])
      }
    }

    return values
  }

  each (fn) {
    let k

    for (k in this.items) {
      if (this.hasItem(k)) {
        fn(k, this.items[k])
      }
    }
  }

  clear () {
    this.items = {}
    this.length = 0
  }

  // Alias for hasItem
  has (key) {
    return this.hasItem(key)
  }

  // Alias for getItem
  get (key) {
    return this.getItem(key)
  }

  // Chainable alias for setItem
  set (key, value) {
    this.setItem(key, value)
    return this
  }

  // Chainable alias for removeItem
  remove (key) {
    return (this.removeItem(key) !== undefined) ? this : false
  }

  count () {
    return Object.keys(this.items).length
  }
}

export { deserialize, constructFromObject, HashProxy, HashTable }

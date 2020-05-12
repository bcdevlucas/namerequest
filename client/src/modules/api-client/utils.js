import DateHelper, {_constructFromObject, _convertToType} from 'qc-react/helpers/Date'

/**
 * Converts a value to the specified type.
 * @param {(String|Object)} data The data to convert, as a string or object.
 * @param {(String|Array.<String>|Object.<String, Object>|Function)} type The type to return. Pass a string for simple types
 * or the constructor function for a complex type. Pass an array containing the type name to return an array of that type. To
 * return an object, pass an object with one property whose name is the key type and whose value is the corresponding value type:
 * all properties on <code>data<code> will be converted to this type.
 * @returns An instance of the specified type or null or undefined if data is null or undefined.
 */
function convertToType (data, type) {
  if (data === null || data === undefined) { return data }

  switch (type) {
    case 'Boolean':
      return Boolean(data)
    case 'Integer':
      return parseInt(data, 10)
    case 'Number':
      return parseFloat(data)
    case 'String':
      return String(data)
    case 'Date':
      return DateHelper.parseDate(String(data))
    case 'Blob':
      return data
    default:
      if (type === Object) {
        // Generic object, return directly
        return data
      } else if (typeof type === 'function') {
        // For model type like: User
        return type.constructFromObject(data)
      } else if (Array.isArray(type)) {
        // For array type like: ['String']
        let itemType = type[0]

        return data.map((item) => {
          return convertToType(item, itemType)
        })
      } else if (typeof type === 'object') {
        // For plain object type like: {'String': 'Integer'}
        let keyType, valueType
        for (let k in type) {
          if (type.hasOwnProperty(k)) {
            keyType = k
            valueType = type[k]
            break
          }
        }

        let result = {}
        for (let k in data) {
          if (data.hasOwnProperty(k)) {
            let key = convertToType(k, keyType)
            let value = convertToType(data[k], valueType)
            result[key] = value
          }
        }

        return result
      } else {
        // For unknown type, return the data directly
        return data
      }
  }
}

/**
 * Constructs a new map or array model from REST data.
 * @param data {Object|Array} The REST data.
 * @param obj {Object|Array} The target object or array.
 */
function constructFromObject (data, obj, itemType) {
  if (Array.isArray(data)) {
    for (let i = 0; i < data.length; i++) {
      if (data.hasOwnProperty(i)) { obj[i] = convertToType(data[i], itemType) }
    }
  } else {
    for (let k in data) {
      if (data.hasOwnProperty(k)) { obj[k] = convertToType(data[k], itemType) }
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

  return Client.convertToType(data, returnType)
}

export { convertToType, deserialize, constructFromObject }

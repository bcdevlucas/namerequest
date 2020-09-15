import * as types from './types'

export interface ErrorI {
  id: string,
  error: any
}

export const setError = ({ commit }, error: ErrorI) => {
  commit(types.SET_ERROR, error)
}

export const setErrors = ({ commit }, errors: ErrorI[]) => {
  commit(types.SET_ERRORS, errors)
}

export const clearError = ({ commit }, id: string) => {
  commit(types.CLEAR_ERROR, id)
}

export const clearErrors = ({ commit }) => {
  commit(types.CLEAR_ERRORS)
}

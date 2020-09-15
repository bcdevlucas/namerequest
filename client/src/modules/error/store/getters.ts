import * as types from './types'

import { STATE_KEY } from '../store'

export default {
  [types.HAS_ERRORS]: (state) => {
    return state[STATE_KEY] && state[STATE_KEY].length > 0
  },
  [types.GET_ERROR]: (state, errorId: string) => {
    return (state[STATE_KEY].has(errorId))
      ? state[STATE_KEY].get(errorId)
      : undefined
  },
  [types.GET_ERRORS]: (state) => {
    return state[STATE_KEY]
  }
}

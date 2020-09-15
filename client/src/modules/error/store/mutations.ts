import * as types from './types'

import { ErrorI } from '@/modules/error/store/actions'

import { STATE_KEY } from '../store'

export default {
  [types.SET_ERROR]: (state, err: ErrorI) => {
    state[STATE_KEY].set(err.id, err.error)
  },
  [types.SET_ERRORS]: (state, errArr: ErrorI[]) => {
    errArr.map((err) => {
      state[STATE_KEY].set(err.id, err.error)
    })
  },
  [types.CLEAR_ERROR]: (state, id: any) => {
    state[STATE_KEY].delete(id)
  },
  [types.CLEAR_ERRORS]: (state) => {
    state[STATE_KEY].clear()
  }
}

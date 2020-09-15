import * as types from './types'

import { ErrorI } from '@/modules/error/store/actions'

import { STATE_KEY } from '../store'

export default {
  [types.SET_ERROR]: (state, error: ErrorI) => {
  },
  [types.SET_ERRORS]: (state, errors: ErrorI[]) => {
  },
  [types.CLEAR_ERROR]: (state, id: any) => {
  },
  [types.CLEAR_ERRORS]: (state) => {
  }
}

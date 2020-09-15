<template>
  <v-dialog v-model="showModal" max-width="40%">
    <v-card class="pa-6">
      <v-card-text class="h3">Error</v-card-text>
      <v-card-text class="copy-normal">
        {{ JSON.stringify(errors) }}
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showModal = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import errorModule from '@/modules/error'
import { ErrorI } from '@/modules/error/store/actions'
import * as errorTypes from '@/modules/error/store/types'

import { Component, Vue } from 'vue-property-decorator'

@Component({
})
export default class ErrorModal extends Vue {
  get showModal () {
    return !!(errorModule[errorTypes.HAS_ERRORS])
  }
  set showModal (value: boolean) {
    // errorModule.mutateErrorModalVisible(value)
  }

  get errors (): ErrorI[] {
    return (errorModule[errorTypes.HAS_ERRORS] !== false)
      ? errorModule[errorTypes.GET_ERRORS]
      : [] as ErrorI[]
  }
}

</script>

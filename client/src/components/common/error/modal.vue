<template>
  <v-dialog v-model="showModal" max-width="40%">
    <v-card class="pa-6">
      <v-card-text class="h3">Error</v-card-text>
      <v-card-text class="copy-normal">
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="showModal = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import newReqModule from '@/store/new-request-module'
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class ErrorModal extends Vue {
  get showModal () {
    // return newReqModule.errorModalVisible
    return false
  }
  set showModal (value: boolean) {
    // newReqModule.mutateErrorModalVisible(value)
  }
}

</script>

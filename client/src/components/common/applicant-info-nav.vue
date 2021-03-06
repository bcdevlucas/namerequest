<template>
  <v-col cols="5" class="text-right py-0">
    <v-btn x-large
           :id="`submit-back-btn-${isValid}`"
           class="mr-3"
           v-if="showBack"
           @click="back">
      {{ backText }}
    </v-btn>
    <v-btn x-large
           @click="next"
           :disabled="!isValid"
           :id="`submit-continue-btn-${isValid}`">
      {{ nextText }}
    </v-btn>
  </v-col>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import newReqModule, { EXISTING_NR_TIMER_NAME, NR_COMPLETION_TIMER_NAME } from '@/store/new-request-module'
import paymentModule from '@/modules/payment'
import timerModule from '@/modules/vx-timer'

@Component({})
export default class ApplicantInfoNav extends Vue {
  @Prop(Boolean) isValid: boolean

  get backText () {
    if (this.editMode) {
      return 'Previous'
    }
    return 'Back'
  }
  get editMode () {
    return newReqModule.editMode
  }
  get nextText () {
    if (this.tab === 3) {
      if (this.editMode) {
        return 'Submit Changes'
      }
      return 'Continue To Payment'
    }
    if (this.editMode) {
      return 'Next'
    }
    return 'Continue'
  }
  get nrId () {
    return newReqModule.nrId
  }
  get nrState () {
    return newReqModule.nrState
  }
  get showBack () {
    if (this.tab < 2) {
      return false
    }
    if (this.tab === 2) {
      return (this.type === 'examination' || this.nrState === 'DRAFT')
    }
    if (this.tab === 3) {
      return true
    }
    return false
  }
  get tab () {
    return newReqModule.submissionTabNumber
  }
  get type () {
    return newReqModule.submissionType
  }
  back () {
    newReqModule.mutateSubmissionTabNumber(this.tab - 1)
  }
  next () {
    if (this.tab === 3) {
      this.submit()
      return
    }
    newReqModule.mutateSubmissionTabNumber(this.tab + 1)
  }
  async submit () {
    const { nrId } = this
    if (this.editMode) {
      await newReqModule.patchNameRequests()
      await newReqModule.checkinNameRequest()
      timerModule.stopTimer({ id: EXISTING_NR_TIMER_NAME })
      this.fetchNr(nrId).then(() => {})
    } else {
      if (!nrId) {
        await newReqModule.postNameRequests('draft')
      } else {
        if (!this.editMode && ['COND-RESERVE', 'RESERVED'].includes(this.nrState)) {
          let request = await newReqModule.getNameRequest(nrId)
          if (request.stateCd === 'CANCELLED') {
            newReqModule.setActiveComponent('Timeout')
            return
          }
        }
        await newReqModule.putNameReservation(nrId)
        timerModule.stopTimer({ id: NR_COMPLETION_TIMER_NAME })
      }
      await paymentModule.togglePaymentModal(true)
    }
  }
  async fetchNr (nrId) {
    const existingNr = await newReqModule.getNameRequest(nrId)
    await newReqModule.loadExistingNameRequest(existingNr)
  }
}

</script>

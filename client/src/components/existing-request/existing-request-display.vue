<template>
  <MainContainer id="existing-request-display" class="pa-10">
    <template v-slot:container-header>
      <v-col cols="auto" class="py-0">
        <span class="h3">{{ nr.nrNum }}</span>
        <span class="h6 ml-4">{{ entityTypeCdToText(nr.entity_type_cd) }}</span>
      </v-col>
    </template>

    <template v-slot:content>
      <names-block
        v-if="nr.nrNum"
        class="mt-5"
        :names="names"
      />

      <transition mode="out-in" name="fade">
        <v-row v-if="disableUnfurnished" class="mx-0 mt-5 bg-light-blue" :key="furnished">
          <v-col cols="12" class="font-italic px-4" key="initial-msg">
            We are currently processing your request.
            Click<a class="link" href="#" @click.prevent="refresh">&nbsp;Refresh&nbsp;</a>
            {{ $route.query && $route.query.paymentId ? '' : 'or retry your search ' }}
            after 5 minutes to enable all the buttons.
          </v-col>
        </v-row>
      </transition>

      <transition mode="out-in" name="fade">
        <v-container class="nr-data pa-0">
          <v-row class="mt-5" :key="refreshCount">
            <!-- labels and values -->
            <v-col cols="9" class="py-0">
              <v-row dense>
                <v-col cols="12">
                  <span>Last Update:</span>
                  &nbsp;{{ lastUpdate }}
                </v-col>
                <v-col cols="12">
                  <span>Request Status:</span>
                  &nbsp;{{ requestStatusText }}
                  <v-icon v-if="isAlertState" color="error" size="20" class="mt-n1 ml-1">
                    mdi-alert
                  </v-icon>
                  <a href="#"
                    class="link-sm ml-1"
                    v-if="nr.state === NrState.CONDITIONAL"
                    @click.prevent="showConditionsModal()"
                  >Conditions</a>
                </v-col>
                <v-col cols="12">
                  <span>Priority Request:</span>
                  &nbsp;{{ isPriorityReq ? 'Yes' : 'No' }}
                </v-col>
                <v-col cols="12" v-if="expiryDate">
                  <span>Expiry Date:</span>
                  &nbsp;{{ expiryDate }}
                </v-col>
                <v-col cols="12">
                  <span>Expiry Extensions Remaining:</span>
                  <!-- TODO: add tooltip here -->
                  &nbsp;{{ extensionsRemainingText }}
                </v-col>
                <v-col cols="12" v-if="nr.consentFlag && (nr.consentFlag !== 'N')">
                  <span>Consent Rec'd:</span>
                  &nbsp;{{ consentDate }}
                </v-col>
                <v-col cols="12">
                  <span>Applicant Name:</span>
                  &nbsp;{{ nr.applicants.lastName }},
                  &nbsp;{{ nr.applicants.firstName }}
                </v-col>
                <v-col cols="12">
                  <span>Address:</span>
                  &nbsp;{{ address }}
                </v-col>
              </v-row>
            </v-col>

            <!-- action buttons -->
            <v-col cols="3" class="py-0" v-if="nr.state !== NrState.CANCELLED">
              <v-row dense>
                <template v-for="action of actions">
                  <!-- incorporate action is a distinct button below -->
                  <template v-if="action !== NrAction.INCORPORATE">
                    <v-col cols="12" :key="action+'-button'">
                      <v-btn block
                             class="button"
                             :class="isRedButton(action) ? 'button-red' : 'button-blue'"
                             :disabled="disableUnfurnished && (action !== NrAction.RECEIPT)"
                             @click="handleButtonClick(action)">{{ actionText(action) }}</v-btn>
                    </v-col>
                  </template>
                </template>
              </v-row>
            </v-col>
          </v-row>

          <!-- incorporate button -->
          <div v-if="showIncorporateButton" class="mt-5 text-center">
            <v-btn @click="handleButtonClick(NrAction.INCORPORATE)">Incorporate Using This Name Request</v-btn>
          </div>
        </v-container>
      </transition>
    </template>
  </MainContainer>
</template>

<script lang="ts">
import { Component, Mixins, Vue } from 'vue-property-decorator'
import { mapGetters } from 'vuex'
import Moment from 'moment'

import MainContainer from '@/components/new-request/main-container.vue'
import newReqModule, { EXISTING_NR_TIMER_NAME, EXISTING_NR_TIMEOUT_MS } from '@/store/new-request-module'
import NrAffiliationMixin from '@/components/mixins/nr-affiliation-mixin'
import CommonMixin from '@/components/mixins/common-mixin'
import DateMixin from '@/components/mixins/date-mixin'
import paymentModule from '@/modules/payment'
import timerModule from '@/modules/vx-timer'
import * as types from '@/store/types'
import NamesBlock from './names-block.vue'
import { NameState, NrAction, NrState } from '@/enums'

@Component({
  components: { MainContainer, NamesBlock },
  computed: {
    ...mapGetters(['isAuthenticated'])
  }
})
export default class ExistingRequestDisplay extends Mixins(NrAffiliationMixin, CommonMixin, DateMixin) {
  // enums used in the template:
  NameState = NameState
  NrAction = NrAction
  NrState = NrState

  // external getter
  readonly isAuthenticated!: boolean

  /**
   * "checking" is True while refreshing the NR.
   * (Not used in template at the moment.)
   */
  private checking = false

  /**
   * "refreshCount" is used in the template as the transition key for the affected template,
   * triggering a fade in/out.
   */
  private refreshCount = 0

  /**
   * "furnished" is used in the template at the transition key for the affected template,
   * triggering a fade in/out.
   */
  private furnished = 'notfurnished'

  /** The actions list, with some buttons forced to the bottom. */
  private get actions () {
    const actions = this.nr.actions || []
    // move 'REFUND' or 'CANCEL' action (if present) to bottom of list
    // eg ['EDIT', 'REFUND', 'RECEIPT'] -> ['EDIT', 'RECEIPT', 'REFUND']
    // or ['EDIT', 'CANCEL', 'RECEIPT'] -> ['EDIT', 'RECEIPT', 'CANCEL']
    return actions.sort((a, b) => {
      if ([NrAction.REFUND, NrAction.CANCEL].includes(b)) return -1
      return 0
    })
  }

  get address () {
    const fields = ['addrLine2', 'city', 'stateProvinceCd', 'countryCd', 'postalCd']
    let output: string = this.nr.applicants.addrLine1
    for (let field of fields) {
      if (this.nr.applicants[field]) {
        output += ', ' + this.nr.applicants[field]
      }
    }
    return output
  }

  get addressLines () {
    const output = [ this.nr.applicants.addrLine1 ]
    if (this.nr.applicants.addrLine2) {
      output.push(this.nr.applicants.addrLine2)
    }
    return output
  }

  get cityProvPostal () {
    const { applicants } = this.nr
    return applicants.city + ', ' + applicants.stateProvinceCd + ', ' + applicants.postalCd
  }

  get consentDate () {
    if (this.nr.consent_dt) {
      return Moment(this.nr.consent_dt).utc().format('MMM Do[,] YYYY')
    }
    return 'Not Yet Received'
  }

  get expiryDate () {
    if (this.nr.expirationDate) {
      return Moment(this.nr.expirationDate).format('MMM Do[,] YYYY')
    }
    return ''
  }

  get lastUpdate () {
    if (this.nr.lastUpdate) {
      return Moment(this.nr.lastUpdate).format('MMM Do[,] YYYY')
    }
    return ''
  }

  get disableUnfurnished (): boolean {
    return (
      this.nr.furnished === 'N' &&
      [NrState.CONDITIONAL, NrState.REJECTED, NrState.APPROVED].includes(this.nr.stateCd)
    )
  }

  /** The names list, sorted by choice number. */
  get names () {
    return this.nr.names.sort((a, b) => {
      if (a.choice > b.choice) {
        return 1
      }
      if (a.choice < b.choice) {
        return -1
      }
      return 0
    })
  }

  get nr () {
    return newReqModule.nr
  }

  get isPriorityReq () {
    return (this.nr && this.nr.priorityCd && this.nr.priorityCd === 'Y')
  }

  /**
   * True if the incorporate button should be shown.
   * (It is shown as a distinct button instead of an action.)
   */
  private get showIncorporateButton (): boolean {
    return this.actions.includes(NrAction.INCORPORATE)
  }

  /** The display text for Expiry Extensions Remaining. */
  private get extensionsRemainingText (): string {
    const extensions = 2
    // total is # extensions + the original approval
    return `${extensions + 1 - this.nr.submitCount} / ${extensions}`
  }

  /** The display text for Request Status. */
  private get requestStatusText (): string {
    switch (this.nr.state) {
      case NrState.COMPLETED: {
        if (this.isNrConsumed) return `Approved / Used For ${this.approvedName.corpNum}`
        if (this.isNrExpired) return 'Expired'
        return 'Completed' // should never happen
      }
      case NrState.CONDITIONAL: return 'Conditional Approval'
      case NrState.HOLD: return 'In Progress' // this is not a typo
      case NrState.INPROGRESS: return 'In Progress'
      case NrState.REFUND_REQUESTED: return 'Cancelled, Refund Requested'
      default: return this.toTitleCase(this.nr.state)
    }
  }

  /** Whether this NR is consumed. */
  private get isNrConsumed (): boolean {
    // consumed = NR is completed + a name is approved + approved name is consumed
    return (this.isNrCompleted &&
      !!this.approvedName &&
      this.isApprovedNameConsumed)
  }

  // TODO: removed this when EXPIRED state is implemented (ticket #5669)
  /** Whether this NR is expired. */
  private get isNrExpired (): boolean {
    // expired = NR is completed + a name is approved + approved name is not consumed + expiry date has passed
    return (this.isNrCompleted &&
      !!this.approvedName &&
      !this.isApprovedNameConsumed &&
      this.hasExpirationDatePassed)
  }

  /** Whether this NR is in Completed state. */
  private get isNrCompleted (): boolean {
    return (this.nr.state === NrState.COMPLETED)
  }

  /** The NR's (first) approved name object, if any. */
  private get approvedName (): any {
    return this.nr.names.find(name => [NameState.APPROVED, NameState.CONDITION].includes(name.state))
  }

  /** Whether the Approved Name is consumed. */
  private get isApprovedNameConsumed (): boolean {
    // consumed = name is approved + has a consumption date + has a corp num
    return (!!this.approvedName?.consumptionDate && !!this.approvedName?.corpNum)
  }

  /** Whether the NR's expiration date has passed. */
  private get hasExpirationDatePassed (): boolean {
    const expireDays = this.daysFromToday(this.nr.expirationDate)
    // 0 means today (which means it's expired)
    return (isNaN(expireDays) || expireDays < 1)
  }

  /** True if the current state should display an alert icon. */
  private get isAlertState (): boolean {
    return ['Cancelled', 'Cancelled, Refund Requested', 'Expired'].includes(this.requestStatusText)
    // FUTURE: use enums when EXPIRED state is implemented (ticket #5669)
    // return [NrState.CANCELLED, NrState.REFUND_REQUESTED, NrState.EXPIRED].includes(this.nr.state)
  }

  /** Returns True if the specified action should display a red button. */
  private isRedButton (action: NrAction): boolean {
    return [NrAction.REFUND, NrAction.CANCEL].includes(action)
  }

  /** Returns display text for the specified action code. */
  private actionText (action: NrAction): string {
    switch (action) {
      case NrAction.UPGRADE: return 'Upgrade Priority ($100)'
      case NrAction.REAPPLY: return 'Extend Expiry ($30)'
      case NrAction.RESULTS: return 'Download Results'
      case NrAction.RECEIPTS: return 'Download Receipts'
      case NrAction.REFUND: return 'Cancel and Refund'
      case NrAction.CANCEL: return 'Cancel Name Request'
      default: return this.toTitleCase(action)
    }
  }

  async handleButtonClick (action) {
    let outcome = await newReqModule.confirmAction(action)
    if (outcome) {
      switch (action) {
        case NrAction.EDIT:
          // eslint-disable-next-line no-case-declarations
          const doCheckout = ([NrState.DRAFT, NrState.INPROGRESS].indexOf(newReqModule.nrState) > -1)
          // eslint-disable-next-line no-case-declarations
          let success: boolean | undefined
          if (doCheckout) {
            const { dispatch } = this.$store
            // Disable rollback on expire, it's only for new NRs
            await dispatch(types.SET_ROLLBACK_ON_EXPIRE, false)
            // Set check in on expire
            await dispatch(types.SET_CHECK_IN_ON_EXPIRE, true)
            // Check out the NR - this sets the INPROGRESS lock on the NR
            // and needs to be done before you can edit the Name Request
            success = await newReqModule.checkoutNameRequest()
          }

          // Only proceed with editing if the checkout was successful,
          // the Name Request could be locked by another user session!
          if (!doCheckout || (doCheckout && success)) {
            await newReqModule.editExistingRequest()
          }
          break
        case NrAction.UPGRADE:
          paymentModule.toggleUpgradeModal(true)
          break
        case NrAction.REAPPLY:
          paymentModule.toggleReapplyModal(true)
          break
        case NrAction.RECEIPTS:
          paymentModule.togglePaymentHistoryModal(true)
          break
        case NrAction.REFUND:
          paymentModule.toggleRefundModal(true)
          break
        case NrAction.INCORPORATE:
          await this.affiliateOrLogin()
          break
        default:
          await newReqModule.patchNameRequestsByAction(action)
          break
      }
    } else {
      newReqModule.setActiveComponent('InvalidActionMessage')
    }
  }

  async goBack () {
    await newReqModule.cancelEditExistingRequest()
    newReqModule.cancelAnalyzeName('Tabs')
  }

  async refresh (event) {
    this.refreshCount += 1
    this.checking = true
    try {
      let resp = await newReqModule.getNameRequest(this.nr.id)
      this.checking = false
      if (resp.furnished === 'Y') {
        this.furnished = 'furnished'
        newReqModule.setNrResponse(resp)
      }
    } catch (error) {
      this.checking = false
    }
  }

  showConditionsModal () {
    newReqModule.mutateConditionsModalVisible(true)
  }

  /** Affiliates the current NR if authenticated, or prompts login if unauthenticated. */
  async affiliateOrLogin (): Promise<any> {
    if (this.isAuthenticated) {
      await this.createAffiliation(this.nr)
    } else {
      // Persist Nr in session for use in affiliation upon authentication via SignIn.vue.
      sessionStorage.setItem('NR_DATA', JSON.stringify(this.nr))
      newReqModule.mutateIncorporateLoginModalVisible(true)
    }
  }
}
</script>

<style lang="scss" scoped>
@import "@/assets/scss/theme";

.nr-data .col {
  color: $text;
  font-size: 1rem;

  span {
    color: $dk-text;
    font-weight: bold;
  }
}
</style>

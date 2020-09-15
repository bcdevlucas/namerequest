export interface NameRequestPaymentResponse {
  id: number
  nrId: string
  token: number
  statusCode: string
  completionDate: string
  payment: any
  sbcPayment: any
}

export interface NameRequestPayment {
  payment?: any
  paymentSuccess: boolean
  paymentErrors?: any[]
  statusCode?: string
  httpStatusCode?: string
}

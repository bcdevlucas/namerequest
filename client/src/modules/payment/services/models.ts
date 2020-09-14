export interface PaymentResponseI {
  id: number
  nrId: string
  token: number
  statusCode: string
  completionDate: string
  payment: any
  sbcPayment: any
}

import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'

import {
  NameRequestPayment, NameRequestPaymentResponse
} from '@/modules/payment/models'

export class PaymentApiError extends Error {}

export async function createPaymentRequest (nrId, data): Promise<NameRequestPaymentResponse> {
  const url = `/payments/${nrId}`
  const response = await axios.post(url, data)

  if (response.status !== 201) {
    throw new PaymentApiError('Could not create Name Request payment')
  }

  return response.data
}

export async function getNameRequestPayment (nrId, paymentId, params): Promise<NameRequestPaymentResponse> {
  const url = `/payments/${nrId}/payment/${paymentId}`
  const response = await axios.get(url, params)

  if (response.status !== 200) {
    throw new PaymentApiError('Could not retrieve Name Request payment')
  }

  return response.data
}

export async function getPayment (paymentId, params): Promise<any> {
  const url = `/payments/${paymentId}`
  const response = await axios.get(url, params)

  if (response.status !== 200) {
    throw new PaymentApiError('Could not retrieve Service BC payment')
  }

  return response.data
}

export async function getPaymentFees (params): Promise<any> {
  const url = `/payments/fees`
  const response = await axios.post(url, params)

  if (response.status !== 200) {
    throw new PaymentApiError('Could not retrieve Service BC payment fees')
  }

  return response.data
}

export async function getInvoiceRequest (paymentId, params): Promise<any> {
  const url = `/payments/${paymentId}/invoice`
  const response = await axios.get(url, params)

  if (response.status !== 200) {
    throw new PaymentApiError('Could not retrieve Service BC payment invoice')
  }

  return response.data
}

export async function getInvoicesRequest (paymentId, params): Promise<any> {
  const url = `/payments/${paymentId}/invoices`
  const response = await axios.get(url, params)

  if (response.status !== 200) {
    throw new PaymentApiError('Could not retrieve Service BC payment invoices')
  }

  return response.data
}

export async function getReceiptRequest (paymentId, invoiceId, data): Promise<any> {
  const params = { responseType: 'blob' } as AxiosRequestConfig
  const url = `/payments/${paymentId}/receipt`
  const response = await axios.post(url, data, params)

  if (response.status !== 200) {
    throw new PaymentApiError('Could not retrieve Service BC payment receipt')
  }

  return response.data
}

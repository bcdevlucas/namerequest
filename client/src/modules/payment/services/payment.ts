import axios, { AxiosResponse, AxiosRequestConfig } from 'axios'

import {
  NameRequestPayment, NameRequestPaymentResponse
} from '@/modules/payment/models'

export class ApiError extends Error {}

export async function createPaymentRequest (nrId, data): Promise<NameRequestPaymentResponse> {
  const url = `/payments/${nrId}`
  const response = await axios.post(url, data)

  if (response.status !== 201) {
    throw new ApiError('Could not retrieve Name Request payment')
  }

  return response.data
}

export async function getNameRequestPayment (nrId, paymentId, params): Promise<NameRequestPaymentResponse> {
  const url = `/payments/${nrId}/payment/${paymentId}`
  const response = await axios.get(url, params)

  if (response.status !== 200) {
    throw new ApiError('Could not retrieve Name Request payment')
  }

  return response.data
}

export async function getPayment (paymentId, params): Promise<AxiosResponse<any>> {
  const url = `/payments/${paymentId}`
  return axios.get(url, params)
}

export async function getPaymentFees (params): Promise<AxiosResponse<any>> {
  const url = `/payments/fees`
  return axios.post(url, params)
}

export async function getInvoiceRequest (paymentId, params): Promise<AxiosResponse<any>> {
  const url = `/payments/${paymentId}/invoice`
  return axios.get(url, params)
}

export async function getInvoicesRequest (paymentId, params): Promise<AxiosResponse<any>> {
  const url = `/payments/${paymentId}/invoices`
  return axios.get(url, params)
}

export async function getReceiptRequest (paymentId, invoiceId, data): Promise<AxiosResponse<any>> {
  const params = { responseType: 'blob' } as AxiosRequestConfig
  const url = `/payments/${paymentId}/receipt`
  return axios.post(url, data, params)
}

import axios, { AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios'

import {
  NameRequestPayment, NameRequestPaymentResponse
} from '@/modules/payment/models'

export class PaymentApiError extends Error {}

function isAxiosError (err: AxiosError | Error): err is AxiosError {
  return (err as AxiosError).isAxiosError !== undefined
}

function handleApiError (err, defaultMessage = '') {
  if (isAxiosError(err)) {
    const { message } = err.response.data
    throw new PaymentApiError(message)
  } else {
    const { message } = err
    throw new PaymentApiError(message || defaultMessage)
  }
}

export async function createPaymentRequest (nrId, data): Promise<NameRequestPaymentResponse> {
  const url = `/payments/${nrId}`
  let response: AxiosResponse
  try {
    response = await axios.post(url, data)
    return response.data
  } catch (err) {
    handleApiError(err, 'Could not create Name Request payment')
  }
}

export async function getNameRequestPayment (nrId, paymentId, params): Promise<NameRequestPaymentResponse> {
  const url = `/payments/${nrId}/payment/${paymentId}`
  let response: AxiosResponse
  try {
    response = await axios.get(url, params)
    return response.data
  } catch (err) {
    handleApiError(err, 'Could not retrieve Name Request payment')
  }
}

export async function getPayment (paymentId, params): Promise<any> {
  const url = `/payments/${paymentId}`
  let response: AxiosResponse
  try {
    response = await axios.get(url, params)
    return response.data
  } catch (err) {
    handleApiError(err, 'Could not create Service BC payment')
  }
}

export async function getPaymentFees (params): Promise<any> {
  const url = `/payments/fees`
  let response: AxiosResponse
  try {
    response = await axios.get(url, params)
    return response.data
  } catch (err) {
    handleApiError(err, 'Could not retrieve Name Request payment fees')
  }
}

export async function getInvoiceRequest (paymentId, params): Promise<any> {
  const url = `/payments/${paymentId}/invoice`
  let response: AxiosResponse
  try {
    response = await axios.get(url, params)
    return response.data
  } catch (err) {
    handleApiError(err, 'Could not retrieve Name Request payment invoice')
  }
}

export async function getInvoicesRequest (paymentId, params): Promise<any> {
  const url = `/payments/${paymentId}/invoices`
  let response: AxiosResponse
  try {
    response = await axios.get(url, params)
    return response.data
  } catch (err) {
    handleApiError(err, 'Could not retrieve Name Request payment invoices')
  }
}

export async function getReceiptRequest (paymentId, invoiceId, data): Promise<any> {
  const params = { responseType: 'blob' } as AxiosRequestConfig
  const url = `/payments/${paymentId}/receipt`
  let response: AxiosResponse
  try {
    response = await axios.post(url, data, params)
    return response.data
  } catch (err) {
    handleApiError(err, 'Could not retrieve Name Request payment receipt')
  }
}

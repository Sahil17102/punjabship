import { saveAs } from 'file-saver'
import qs from 'qs'
import type { HydratedPickup } from '../types/generic.types'
import axiosInstance from './axiosInstance'

export type CreatePickupAddressPayload = Omit<
  HydratedPickup,
  'id' | 'createdAt' | 'updatedAt' | 'userId'
>

export const createPickupAddress = async (payload: CreatePickupAddressPayload) => {
  console.log('payload', payload)
  const response = await axiosInstance.post('/pickup-addresses', payload)
  return response.data as HydratedPickup
}

// ✅ Enhance API util
export interface PickupAddressFilters extends Partial<HydratedPickup> {
  page?: number
  limit?: number
  sortBy?: string
}

export const getPickupAddresses = async (filters?: PickupAddressFilters) => {
  const response = await axiosInstance.get('/pickup-addresses', {
    params: filters,
  })

  return {
    pickupAddresses: response.data.data as HydratedPickup[],
    totalCount: response.data.totalCount as number,
  }
}

export const updatePickupAddress = async (
  id: string,
  payload: Partial<HydratedPickup>,
): Promise<HydratedPickup> => {
  const res = await axiosInstance.patch(`/pickup-addresses/${id}`, payload)
  return res.data.data
}

export const exportPickupAddresses = async (filters: PickupAddressFilters) => {
  const response = await axiosInstance.get('/pickup-addresses/export', {
    params: filters,
    paramsSerializer: (params) => qs.stringify(params, { arrayFormat: 'repeat' }),
    responseType: 'blob', // Expecting a file
  })

  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
  saveAs(blob, 'pickup-addresses.csv')
}

export function importPickupAddresses(data: HydratedPickup[]) {
  return axiosInstance.post('/pickup-addresses/import', data)
}

export async function listPickups() {
  const res = await axiosInstance.get(`/pickups`)
  return res.data
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function schedulePickup(_orderId: string): Promise<never> {
  throw new Error('Pickup scheduling is disabled')
}

export async function cancelShipment(orderId: string) {
  const res = await axiosInstance.post(`/shipments/cancel`, { orderId })
  return res.data
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function holdShipment(_orderId: string): Promise<never> {
  throw new Error('Hold is disabled')
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function resumeShipment(_orderId: string): Promise<never> {
  throw new Error('Resume is disabled')
}

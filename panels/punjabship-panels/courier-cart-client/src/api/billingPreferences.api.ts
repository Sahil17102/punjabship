import type { BillingPreference, UpdateBillingPreferencePayload } from '../types/billing.types'
import axiosInstance from './axiosInstance'

/**
 * Get Billing Preference by User ID
 */
export const getBillingPreference = async (): Promise<BillingPreference> => {
  const response = await axiosInstance.get<BillingPreference>(`/billing-preferences/`)
  return response.data
}

/**
 * Create or Update Billing Preference
 */
export const updateBillingPreference = async (
  payload: UpdateBillingPreferencePayload,
): Promise<{ message: string }> => {
  const response = await axiosInstance.post<{ message: string }>(`/billing-preferences/`, payload)
  return response.data
}

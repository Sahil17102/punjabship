// services/labelPreferencesApi.ts
import axiosInstance from './axiosInstance'

const API_BASE = '/label-preference'

export type LabelPreferences = {
  id?: string
  user_id: string
  printer_type: 'thermal' | 'a4' | 'inkjet'
  order_info: Record<string, boolean>
  shipper_info: Record<string, boolean>
  product_info: Record<string, boolean>
  char_limit: number
  max_items: number
  brand_logo?: string | null
  powered_by?: string
  created_at?: string
  updated_at?: string
}

export const labelPreferencesApi = {
  async get(): Promise<LabelPreferences> {
    const { data } = await axiosInstance.get(`${API_BASE}`)
    return data
  },

  async save(prefs: Partial<LabelPreferences>): Promise<LabelPreferences> {
    const { data } = await axiosInstance.post(`${API_BASE}`, prefs)
    return data
  },
}

export type BillingFrequency = 'weekly' | 'monthly' | 'manual' | 'custom'

export interface BillingPreference {
  userId: string
  frequency: BillingFrequency
  autoGenerate: boolean
  customFrequencyDays?: number | null
  createdAt?: string
  updatedAt?: string
}

export interface UpdateBillingPreferencePayload {
  frequency: BillingFrequency
  autoGenerate: boolean
  customFrequencyDays?: number | null
}

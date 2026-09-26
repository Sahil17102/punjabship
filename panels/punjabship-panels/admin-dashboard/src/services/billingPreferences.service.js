import apiClient from './axios'

export const adminUpdateUserBillingPreference = async ({
  userId,
  frequency,
  autoGenerate,
  customFrequencyDays,
}) => {
  const { data } = await apiClient.post('/admin/billing-preferences/user', {
    userId,
    frequency,
    autoGenerate,
    customFrequencyDays,
  })
  return data
}

export const adminApplyBillingPreferenceToAll = async ({
  frequency,
  autoGenerate,
  customFrequencyDays,
}) => {
  const { data } = await apiClient.post('/admin/billing-preferences/all', {
    frequency,
    autoGenerate,
    customFrequencyDays,
  })
  return data
}



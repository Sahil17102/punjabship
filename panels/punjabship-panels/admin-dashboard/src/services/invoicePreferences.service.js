import apiClient from './axios'

export const getInvoicePreferences = async () => {
  const { data } = await apiClient.get('/invoice-preferences')
  return data
}

export const saveInvoicePreferences = async (preferences) => {
  const { data } = await apiClient.post('/invoice-preferences', preferences)
  return data
}


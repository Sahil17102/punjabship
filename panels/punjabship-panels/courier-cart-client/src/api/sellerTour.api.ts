import axiosInstance from './axiosInstance'

export type SellerTourStatus = 'pending' | 'active' | 'completed' | 'dismissed'
export type SellerTourAction = 'start' | 'dismiss' | 'complete-page' | 'finish' | 'reset'

export interface SellerTourProgress {
  version: number
  status: SellerTourStatus
  completedPages: string[]
}

export const getSellerTourProgress = async (): Promise<SellerTourProgress> => {
  const { data } = await axiosInstance.get('/dashboard/tour')
  if (!data?.success) throw new Error(data?.message || 'Could not load guide progress')
  return data.data
}

export const updateSellerTourProgress = async (
  action: SellerTourAction,
  page?: string,
): Promise<SellerTourProgress> => {
  const { data } = await axiosInstance.post('/dashboard/tour', { action, page })
  if (!data?.success) throw new Error(data?.message || 'Could not save guide progress')
  return data.data
}

import axiosInstance from './axiosInstance'

export interface DashboardPreferences {
  widgetVisibility: Record<string, boolean>
  widgetOrder: string[]
  layout: {
    columns?: number
    spacing?: number
    cardStyle?: 'default' | 'compact' | 'spacious'
    showGridLines?: boolean
  }
  dateRange: {
    defaultRange?: '7days' | '30days' | '90days' | 'custom'
    customStart?: string
    customEnd?: string
  }
}

export const getDashboardPreferences = async (): Promise<DashboardPreferences> => {
  const { data } = await axiosInstance.get('/dashboard/preferences')
  return data.success ? data.data : ({} as DashboardPreferences)
}

export const saveDashboardPreferences = async (
  preferences: Partial<DashboardPreferences>,
): Promise<DashboardPreferences> => {
  const { data } = await axiosInstance.post('/dashboard/preferences', preferences)
  return data.success ? data.data : ({} as DashboardPreferences)
}


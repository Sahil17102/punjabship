import axiosInstance from './axiosInstance'

export interface CodRemittance {
  id: string
  userId: string
  orderId: string
  orderType: 'b2c' | 'b2b'
  orderNumber: string
  awbNumber?: string
  courierPartner?: string
  codAmount: string
  codCharges: string
  shippingCharges: string
  deductions: string
  remittableAmount: string
  cycleName?: string
  cycleDays?: number
  cycleFee?: string
  eligibleAt?: string
  settledAmount?: string
  feeTransactionId?: string
  status: 'pending' | 'credited'
  collectedAt?: string
  creditedAt?: string
  walletTransactionId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CodStats {
  remittedTillDate: number
  lastRemittance: number
  nextRemittance: number
  totalDue: number
  creditedCount: number
  pendingCount: number
}

export interface CodDashboardData {
  stats: CodStats
  recentRemittances: CodRemittance[]
}

export interface CodCycle {
  id: string
  name: string
  days: number
  fee: string
  createdAt?: string
  assignedAt?: string
}

export async function getCodCycles() {
  const response = await axiosInstance.get<{ success: boolean; data: CodCycle[] }>(
    '/cod-remittance/cycles',
  )
  return response.data.data
}

export async function getMyCodCycle() {
  const response = await axiosInstance.get<{ success: boolean; data: CodCycle | null }>(
    '/cod-remittance/cycle',
  )
  return response.data.data
}

export async function selectMyCodCycle(cycleId: string) {
  const response = await axiosInstance.put<{ success: boolean; data: CodCycle }>(
    '/cod-remittance/cycle',
    { cycleId },
  )
  return response.data.data
}

/**
 * Get COD dashboard summary
 */
export async function getCodDashboard() {
  const response = await axiosInstance.get<{ success: boolean; data: CodDashboardData }>(
    '/cod-remittance/dashboard',
  )
  return response.data.data
}

/**
 * Get all COD remittances with filters
 */
export async function getCodRemittances(params?: {
  status?: string
  fromDate?: string
  toDate?: string
  page?: number
  limit?: number
}) {
  const response = await axiosInstance.get<{
    success: boolean
    data: {
      remittances: CodRemittance[]
      totalCount: number
      page: number
      limit: number
      totalPages: number
    }
  }>('/cod-remittance/remittances', { params })
  return response.data.data
}

/**
 * Get COD remittance statistics
 */
export async function getCodStats() {
  const response = await axiosInstance.get<{ success: boolean; data: CodStats }>(
    '/cod-remittance/remittances/stats',
  )
  return response.data.data
}

/**
 * Update remittance notes
 */
export async function updateCodRemittanceNotes(remittanceId: string, notes: string) {
  const response = await axiosInstance.patch<{ success: boolean; data: CodRemittance }>(
    `/cod-remittance/remittances/${remittanceId}`,
    { notes },
  )
  return response.data.data
}

/**
 * Export remittances as CSV
 */
export async function exportRemittances(params?: {
  status?: string
  fromDate?: string
  toDate?: string
}) {
  const response = await axiosInstance.get('/cod-remittance/remittances/export', {
    params,
    responseType: 'blob',
  })

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `cod_remittances_${new Date().toISOString().split('T')[0]}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
}

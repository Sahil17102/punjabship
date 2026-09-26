import axiosInstance from './axiosInstance'

export interface WeightDiscrepancy {
  id: string
  b2c_order_id?: string
  b2b_order_id?: string
  order_type: 'b2c' | 'b2b'
  user_id: string
  order_number: string
  awb_number?: string
  courier_partner?: string
  declared_weight: string
  actual_weight?: string
  volumetric_weight?: string
  charged_weight: string
  weight_difference: string
  declared_dimensions?: {
    length: number
    breadth: number
    height: number
  }
  actual_dimensions?: {
    length: number
    breadth: number
    height: number
  }
  original_shipping_charge?: string
  revised_shipping_charge?: string
  additional_charge: string
  weight_slab_original?: string
  weight_slab_charged?: string
  status: 'pending' | 'accepted' | 'disputed' | 'resolved' | 'rejected' | 'closed'
  auto_accepted: boolean
  acceptance_threshold?: string
  has_dispute: boolean
  dispute_id?: string
  courier_remarks?: string
  courier_weight_slip_url?: string
  courier_reported_at?: string
  admin_notes?: string
  resolution_notes?: string
  resolved_by?: string
  resolved_at?: string
  detected_at: string
  created_at: string
  updated_at: string
}

export interface WeightDispute {
  id: string
  discrepancy_id: string
  user_id: string
  dispute_reason: string
  customer_comment: string
  customer_evidence_urls?: string[]
  customer_claimed_weight?: string
  customer_claimed_dimensions?: {
    length: number
    breadth: number
    height: number
  }
  status: 'open' | 'under_review' | 'approved' | 'rejected' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  admin_response?: string
  reviewed_by?: string
  reviewed_at?: string
  resolution?: string
  refund_amount?: string
  final_weight?: string
  resolution_notes?: string
  created_at: string
  updated_at: string
  closed_at?: string
}

export interface WeightAdjustmentHistory {
  id: string
  discrepancy_id?: string
  b2c_order_id?: string
  b2b_order_id?: string
  action_type: string
  previous_weight?: string
  new_weight?: string
  weight_difference?: string
  charge_adjustment?: string
  changed_by?: string
  changed_by_type: 'system' | 'admin' | 'courier' | 'customer'
  reason?: string
  notes?: string
  source?: string
  created_at: string
}

export interface WeightReconciliationSettings {
  id: string
  user_id: string
  auto_accept_enabled: boolean
  auto_accept_threshold_kg: string
  auto_accept_threshold_percent: string
  notify_on_discrepancy: boolean
  notify_on_large_discrepancy: boolean
  large_discrepancy_threshold_kg: string
  email_daily_summary: boolean
  email_weekly_report: boolean
  created_at: string
  updated_at: string
}

export interface DiscrepanciesFilters {
  status?: string[]
  courierPartner?: string[]
  orderType?: 'b2c' | 'b2b'
  fromDate?: string
  toDate?: string
  hasDispute?: boolean
  minWeightDiff?: number
  minChargeDiff?: number
  page?: number
  limit?: number
}

export interface DisputesFilters {
  status?: string[]
  page?: number
  limit?: number
}

export interface ExportDiscrepanciesFilters {
  status?: string[]
  courierPartner?: string[]
  orderType?: 'b2c' | 'b2b'
  fromDate?: string
  toDate?: string
  hasDispute?: boolean
}

export interface PaginatedResponse<T> {
  discrepancies?: T[]
  disputes?: Array<{ dispute: WeightDispute; discrepancy: WeightDiscrepancy }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface DiscrepancyDetails {
  discrepancy: WeightDiscrepancy
  dispute: WeightDispute | null
  history: WeightAdjustmentHistory[]
  order: Record<string, unknown>
}

export interface WeightReconciliationSummary {
  summary: {
    totalDiscrepancies: number
    pendingCount: number
    acceptedCount: number
    disputedCount: number
    resolvedCount: number
    rejectedCount: number
    totalAdditionalCharges: number
    avgWeightDifference: number
    maxWeightDifference: number
    autoAcceptedCount: number
  }
  courierBreakdown: Array<{
    courierPartner: string
    count: number
    totalCharge: number
    avgWeightDiff: number
  }>
}

/**
 * Get weight discrepancies with filters
 */
export const getWeightDiscrepancies = async (
  filters?: DiscrepanciesFilters,
): Promise<PaginatedResponse<WeightDiscrepancy>> => {
  const params = new URLSearchParams()

  if (filters?.status) {
    filters.status.forEach((s) => params.append('status', s))
  }
  if (filters?.courierPartner) {
    filters.courierPartner.forEach((c) => params.append('courierPartner', c))
  }
  if (filters?.orderType) params.append('orderType', filters.orderType)
  if (filters?.fromDate) params.append('fromDate', filters.fromDate)
  if (filters?.toDate) params.append('toDate', filters.toDate)
  if (filters?.hasDispute !== undefined) params.append('hasDispute', String(filters.hasDispute))
  if (filters?.minWeightDiff) params.append('minWeightDiff', String(filters.minWeightDiff))
  if (filters?.minChargeDiff) params.append('minChargeDiff', String(filters.minChargeDiff))
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const response = await axiosInstance.get(`/weight-reconciliation/discrepancies?${params.toString()}`)
  return response.data
}

/**
 * Get a single discrepancy with full details
 */
export const getDiscrepancyById = async (id: string): Promise<DiscrepancyDetails> => {
  const response = await axiosInstance.get(`/weight-reconciliation/discrepancies/${id}`)
  return response.data
}

/**
 * Accept a weight discrepancy
 */
export const acceptDiscrepancy = async (id: string, notes?: string): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(`/weight-reconciliation/discrepancies/${id}/accept`, { notes })
  return response.data
}

/**
 * Reject a weight discrepancy
 */
export const rejectDiscrepancy = async (id: string, reason: string): Promise<{ success: boolean }> => {
  const response = await axiosInstance.post(`/weight-reconciliation/discrepancies/${id}/reject`, { reason })
  return response.data
}

/**
 * Bulk accept discrepancies
 */
export const bulkAcceptDiscrepancies = async (
  discrepancyIds: string[],
  notes?: string,
): Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }> => {
  const response = await axiosInstance.post(`/weight-reconciliation/discrepancies/bulk-accept`, {
    discrepancyIds,
    notes,
  })
  return response.data
}

/**
 * Bulk reject discrepancies
 */
export const bulkRejectDiscrepancies = async (
  discrepancyIds: string[],
  reason: string,
): Promise<{ success: boolean; results: Array<{ id: string; success: boolean; error?: string }> }> => {
  const response = await axiosInstance.post(`/weight-reconciliation/discrepancies/bulk-reject`, {
    discrepancyIds,
    reason,
  })
  return response.data
}

/**
 * Create a dispute for a discrepancy
 */
export const createWeightDispute = async (data: {
  discrepancyId: string
  disputeReason: string
  customerComment: string
  customerClaimedWeight?: number
  customerClaimedDimensions?: { length: number; breadth: number; height: number }
  evidenceUrls?: string[]
}): Promise<{ success: boolean; dispute: WeightDispute }> => {
  const response = await axiosInstance.post(`/weight-reconciliation/disputes`, data)
  return response.data
}

/**
 * Get weight disputes with filters
 */
export const getWeightDisputes = async (
  filters?: DisputesFilters,
): Promise<PaginatedResponse<{ dispute: WeightDispute; discrepancy: WeightDiscrepancy }>> => {
  const params = new URLSearchParams()

  if (filters?.status) {
    filters.status.forEach((s) => params.append('status', s))
  }
  if (filters?.page) params.append('page', String(filters.page))
  if (filters?.limit) params.append('limit', String(filters.limit))

  const response = await axiosInstance.get(`/weight-reconciliation/disputes?${params.toString()}`)
  return response.data
}

/**
 * Get weight reconciliation summary/analytics
 */
export const getWeightReconciliationSummary = async (
  fromDate?: string,
  toDate?: string,
): Promise<WeightReconciliationSummary> => {
  const params = new URLSearchParams()
  if (fromDate) params.append('fromDate', fromDate)
  if (toDate) params.append('toDate', toDate)

  const response = await axiosInstance.get(`/weight-reconciliation/summary?${params.toString()}`)
  return response.data
}

/**
 * Get user's weight reconciliation settings
 */
export const getWeightReconciliationSettings = async (): Promise<WeightReconciliationSettings> => {
  const response = await axiosInstance.get(`/weight-reconciliation/settings`)
  return response.data
}

/**
 * Update user's weight reconciliation settings
 */
export const updateWeightReconciliationSettings = async (updates: {
  autoAcceptEnabled?: boolean
  autoAcceptThresholdKg?: number
  autoAcceptThresholdPercent?: number
  notifyOnDiscrepancy?: boolean
  notifyOnLargeDiscrepancy?: boolean
  largeDiscrepancyThresholdKg?: number
  emailDailySummary?: boolean
  emailWeeklyReport?: boolean
}): Promise<{ success: boolean; settings: WeightReconciliationSettings }> => {
  const response = await axiosInstance.put(`/weight-reconciliation/settings`, updates)
  return response.data
}

/**
 * Export discrepancies as CSV (authenticated)
 */
export const exportWeightDiscrepancies = async (
  filters?: ExportDiscrepanciesFilters,
): Promise<Blob> => {
  const params = new URLSearchParams()

  if (filters?.status) {
    filters.status.forEach((s) => params.append('status', s))
  }
  if (filters?.courierPartner) {
    filters.courierPartner.forEach((c) => params.append('courierPartner', c))
  }
  if (filters?.orderType) params.append('orderType', filters.orderType)
  if (filters?.fromDate) params.append('fromDate', filters.fromDate)
  if (filters?.toDate) params.append('toDate', filters.toDate)
  if (filters?.hasDispute !== undefined) params.append('hasDispute', String(filters.hasDispute))

  const response = await axiosInstance.get(`/weight-reconciliation/export?${params.toString()}`, {
    responseType: 'blob',
  })

  return response.data
}

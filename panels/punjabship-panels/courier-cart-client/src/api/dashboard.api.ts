import axiosInstance from './axiosInstance'
import type { AxiosRequestConfig } from 'axios'

export interface Pickup {
  id: string
  awb_number: string | null
  courier_partner: string | null
  order_number: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pickup_details: any
  created_at: string
}

export interface PendingActions {
  ndrCount: number
  rtoCount: number
  weightDiscrepancyCount: number
}

export interface InvoiceStatus {
  pending: { count: number; totalAmount: number }
  paid: { count: number; totalAmount: number }
  overdue: { count: number; totalAmount: number }
}

export interface TopDestination {
  city: string
  state: string
  count: number
}

export interface CourierDistribution {
  courier: string
  count: number
}

export const getIncomingPickups = async (config?: AxiosRequestConfig): Promise<Pickup[]> => {
  const { data } = await axiosInstance.get('/dashboard/incoming', config)
  return data.success ? data.pickups : []
}

export const getPendingActions = async (config?: AxiosRequestConfig): Promise<PendingActions> => {
  const { data } = await axiosInstance.get('/dashboard/pending-actions', config)
  return data.success
    ? {
        ndrCount: data.ndrCount || 0,
        rtoCount: data.rtoCount || 0,
        weightDiscrepancyCount: data.weightDiscrepancyCount || 0,
      }
    : { ndrCount: 0, rtoCount: 0, weightDiscrepancyCount: 0 }
}

export const getInvoiceStatus = async (config?: AxiosRequestConfig): Promise<InvoiceStatus> => {
  const { data } = await axiosInstance.get('/dashboard/invoice-status', config)
  return data.success ? data.status : { pending: { count: 0, totalAmount: 0 }, paid: { count: 0, totalAmount: 0 }, overdue: { count: 0, totalAmount: 0 } }
}

export const getTopDestinations = async (
  limit = 10,
  config?: AxiosRequestConfig,
): Promise<TopDestination[]> => {
  const axiosConfig: AxiosRequestConfig = {
    ...config,
    params: {
      limit,
      ...(config?.params ?? {}),
    },
  }
  const { data } = await axiosInstance.get('/dashboard/top-destinations', axiosConfig)
  return data.success ? data.destinations : []
}

export const getCourierDistribution = async (
  config?: AxiosRequestConfig,
): Promise<CourierDistribution[]> => {
  const { data } = await axiosInstance.get('/dashboard/courier-distribution', config)
  return data.success ? data.distribution : []
}

// Merchant Dashboard Stats
export interface MerchantDashboardStats {
  asOfDate?: string
  isAllTime?: boolean
  todayOperations: {
    orders: number
    pending: number
    inTransit: number
    delivered: number
  }
  financial: {
    walletBalance: number
    todayRevenue: number
    totalRevenue: number
    totalShippingCharges: number
    totalFreightCharges: number
    profit: number
    codAmount: number
    codRemittanceDue: number
    codRemittanceCredited: number
  }
  operational: {
    deliverySuccessRate: number
    ndrRate: number
    rtoRate: number
    avgDeliveryTime: number
    totalOrders: number
    deliveredOrders: number
    ndrCount: number
    rtoCount: number
  }
  actions: {
    ndrCount: number
    rtoCount: number
    weightDiscrepancyCount: number
    openTickets: number
    inProgressTickets: number
    pendingInvoices: number
    pendingInvoiceAmount: number
    overdueInvoices: number
    overdueInvoiceAmount: number
  }
  couriers: {
    performance: Record<string, { count: number; delivered: number; revenue: number; deliveryRate: number }>
    distribution: CourierDistribution[]
  }
  geographic: {
    topDestinations: TopDestination[]
  }
  charts: {
    ordersByDate: { date: string; orders: number }[]
    revenueByDate: { date: string; revenue: number }[]
    ordersByDate30: { date: string; orders: number }[]
    revenueByDate30: { date: string; revenue: number }[]
    ordersByStatus: { status: string; count: number }[]
    revenueByOrderType: { type: string; revenue: number }[]
    ordersByCourier: { courier: string; count: number }[]
    revenueByCourier: { courier: string; revenue: number }[]
  }
  metrics: {
    avgOrderValue: number
    totalPrepaidOrders: number
    totalCodOrders: number
    prepaidRevenue: number
    codRevenue: number
    topRevenueCities: Array<{ city: string; revenue: number }>
  }
  recentOrders: Array<Record<string, unknown>>
  trends: {
    ordersGrowth: number
    revenueGrowth: number
    thisWeekOrders: number
    lastWeekOrders: number
    thisWeekRevenue: number
    lastWeekRevenue: number
  }
  recentActivity: {
    transactions: Array<{
      id: string
      type: 'credit' | 'debit'
      amount: number
      reason: string | null
      createdAt: Date | null
    }>
    recentOrders: Array<{
      id: string
      orderNumber: string
      status: string
      amount: number
      createdAt: Date | string
    }>
  }
}

export const getMerchantDashboardStats = async (
  selectedDate?: string,
  dateRange?: { fromDate?: string; toDate?: string },
  config?: AxiosRequestConfig,
): Promise<MerchantDashboardStats> => {
  const axiosConfig: AxiosRequestConfig = {
    ...config,
    timeout: 30000,
    params: {
      ...(config?.params ?? {}),
      ...(selectedDate ? { date: selectedDate } : {}),
      ...(dateRange?.fromDate ? { fromDate: dateRange.fromDate } : {}),
      ...(dateRange?.toDate ? { toDate: dateRange.toDate } : {}),
    },
  }
  const { data } = await axiosInstance.get('/dashboard/stats', axiosConfig)
  return data.success ? data.data : ({} as MerchantDashboardStats)
}

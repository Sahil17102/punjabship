// services/wallet.api.ts
import axiosInstance from './axiosInstance'

export async function createRechargeOrder(payload: {
  amount: number
  name: string
  email: string
  phone: string
}) {
  const res = await axiosInstance.post('/payments/wallet/topup', payload)
  return res.data // { orderId, amount, currency, key, name, description, prefill, theme }
}

export async function confirmRecharge({
  orderId,
  paymentId,
}: {
  orderId: string
  paymentId: string
}) {
  await axiosInstance.post('/payments/wallet/confirm', { orderId, paymentId })
}

export const fetchWalletBalance = async (): Promise<{
  data: { balance: number }
}> => {
  const response = await axiosInstance.get('/payments/wallet/balance')
  return response.data
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  amount: number
  type: 'credit' | 'debit'
  reason?: string
  ref?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: Record<string, any>
  currency?: string
  created_at: string
  awb_number?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  order?: Record<string, any> | null
  shipment_order_type?: string | null
  transaction_breakup?: {
    masked?: boolean
    currency?: string
    total?: number
    subtotal?: number | null
    gstPercent?: number | null
    gstAmount?: number | null
    lines?: Array<{
      key?: string
      label: string
      amount: number
      kind?: 'charge' | 'tax' | 'subtotal' | 'total'
      adminOnly?: boolean
      source?: string
    }>
    facts?: Array<{ label: string; value: string }>
  }
}

export interface WalletTransactionsResponse {
  wallet: {
    id: string
    balance: string
    currency: string
  }
  transactions: WalletTransaction[]
}

export type WalletTransactionCategory =
  | 'cod'
  | 'rto'
  | 'shipping_charges'
  | 'wallet_recharge'
  | 'weight_discrepancy'
  | 'adjustments'
  | 'whatsapp_service_charges'

interface WalletTransactionsParams {
  limit?: number
  page?: number
  type?: 'credit' | 'debit'
  dateFrom?: string
  dateTo?: string
  category?: WalletTransactionCategory
  search?: string
}

export const fetchWalletTransactions = async (
  params: WalletTransactionsParams = {},
): Promise<WalletTransactionsResponse> => {
  const { data } = await axiosInstance.get<WalletTransactionsResponse>(
    '/payments/wallet/transactions',
    { params }, // send page, limit, and optional filters to backend
  )
  return data
}

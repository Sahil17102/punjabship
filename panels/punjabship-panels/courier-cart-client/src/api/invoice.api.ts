import axiosInstance from './axiosInstance'

export type InvoicePreferences = {
  prefix: string
  suffix: string
  template: 'classic' | 'thermal'
  logoFile?: string
  signatureFile?: string
  sellerName?: string
  brandName?: string
  gstNumber?: string
  panNumber?: string
  sellerAddress?: string
  stateCode?: string
  supportEmail?: string
  supportPhone?: string
  invoiceNotes?: string
  termsAndConditions?: string
}

export async function getInvoicePreferences(): Promise<InvoicePreferences | null> {
  const res = await axiosInstance.get('/invoice-preferences')
  return res.data.preferences ?? null
}

export async function saveInvoicePreferences(
  data: InvoicePreferences,
): Promise<InvoicePreferences> {
  const res = await axiosInstance.post('/invoice-preferences', data)
  return res.data.preferences
}

export type InvoiceFilters = {
  status?: string
}

export type InvoiceItem = {
  carrier: string
  orderId: string
  discount: string
  weightSlab: string
  finalCharge: string
  shippingCharge: string
  awb: string
}

export type BillingInvoice = {
  id: string
  invoiceNo: string
  sellerId: string
  billingStart: string
  billingEnd: string
  taxableValue: string
  cgst: string
  sgst: string
  igst: string
  totalAmount: string
  gstRate: number
  status: 'pending' | 'paid' | 'disputed'
  type: 'weekly' | 'monthly_summary' | 'manual'
  pdfUrl: string
  csvUrl: string
  isDisputed: boolean
  remarks?: string | null
  createdAt: string
  updatedAt: string
}

export type BillingInvoiceResponse = {
  page: number
  limit: number
  total?: number
  totalPages?: number
  data: BillingInvoice[]
}

export const getBillingInvoices = async (
  page: number,
  limit: number,
  filters: InvoiceFilters = {},
): Promise<BillingInvoiceResponse> => {
  const params = { page, limit, ...filters }
  const { data } = await axiosInstance.get<BillingInvoiceResponse>('/billing/invoices', { params })
  return data
}

export type InvoiceStatement = {
  invoiceId: string
  invoiceNo: string
  sellerId: string
  period: { from: string; to: string }
  links: { pdf?: string; csv?: string }
  status: string
  totals: {
    netPayable: number
    taxBreakup: { cgst: number; sgst: number; igst: number }
    taxableValue: number
  }
  additions: {
    adjustments: number
    debits: number
    credits: number
    surcharges: number
    waivers: number
  }
  offsets: { codOffsets: number }
  payments: { received: number; breakdown: { method: string; amount: number }[] }
  outstanding: number
  disputes: { id: string; status: string; subject: string }[]
  adjustmentHistory: Array<{
    id: string
    type: 'credit' | 'debit' | 'waiver' | 'surcharge'
    amount: number
    reason: string | null
    createdAt: string
    createdBy: string | null
  }>
}

export const getInvoiceStatement = async (invoiceId: string): Promise<InvoiceStatement> => {
  const { data } = await axiosInstance.get(`/billing/invoices/${invoiceId}/statement`)
  return data
}

export type RaiseDisputePayload = {
  subject: string
  details: string
  lineItemRef?: string
}

export type InvoiceDispute = {
  id: string
  invoiceId: string
  sellerId: string
  status: 'open' | 'in_review' | 'resolved' | 'rejected'
  subject: string
  details: string
  lineItemRef?: string | null
  resolutionNotes?: string | null
  resolvedBy?: string | null
  createdAt: string
  updatedAt: string
}

export const raiseInvoiceDispute = async (
  invoiceId: string,
  payload: RaiseDisputePayload,
): Promise<InvoiceDispute> => {
  const { data } = await axiosInstance.post(`/billing/invoices/${invoiceId}/disputes`, payload)
  return data
}

export type RecordPaymentPayload = {
  method: 'upi' | 'neft' | 'pg' | 'wallet'
  amount: number
  reference?: string
  notes?: string
}

export const recordInvoicePayment = async (
  invoiceId: string,
  payload: RecordPaymentPayload,
): Promise<InvoiceStatement> => {
  const { data } = await axiosInstance.post(`/billing/invoices/${invoiceId}/payments`, payload)
  return data.statement
}

export const acceptInvoiceCredits = async (invoiceId: string): Promise<InvoiceStatement> => {
  const { data } = await axiosInstance.post(`/billing/invoices/${invoiceId}/accept-credits`)
  return data.statement
}

export type GenerateInvoicePayload = {
  startDate: string
  endDate: string
}

export type GenerateInvoiceResponse = {
  message: string
  invoice: BillingInvoice
}

export const generateManualInvoice = async (
  payload: GenerateInvoicePayload,
): Promise<GenerateInvoiceResponse> => {
  const { data } = await axiosInstance.post('/billing/invoices/generate', payload)
  return data
}

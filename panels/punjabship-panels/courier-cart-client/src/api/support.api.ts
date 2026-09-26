// src/api/support.api.ts
import axiosInstance from './axiosInstance'

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export interface CreateTicketPayload {
  subject: string
  category: string
  subcategory: string
  awbNumber?: string
  description: string
  attachments?: string[]
  dueDate?: string // ISO string
}

export interface SupportTicketOrderReference {
  orderId: string
  orderNumber: string
  awbNumber?: string | null
  buyerName?: string | null
  buyerPhone?: string | null
  buyerEmail?: string | null
  courierPartner?: string | null
  warehouseName?: string | null
  shipmentType?: 'b2c' | 'b2b'
  orderType?: 'prepaid' | 'cod' | string
  orderStatus?: string | null
}

export interface SupportTicketPrefill {
  orderReferences: SupportTicketOrderReference[]
}

export interface SupportTicket {
  id: string
  subject: string
  category: string
  subcategory: string
  awbNumber: string | null
  description: string
  attachments: string[]
  dueDate: string | null
  status: TicketStatus
  createdAt: string
  updatedAt: string
}

export const createSupportTicket = async (payload: CreateTicketPayload) => {
  const res = await axiosInstance.post<SupportTicket>('/support/tickets', payload)
  return res.data
}

// src/api/support.ts or similar

export const getMySupportTickets = async (page = 1, limit = 10, filters = {}) => {
  const flatParams = {
    page,
    limit,
    ...filters, // flatten the filter keys directly into the query
  }

  const res = await axiosInstance.get<{
    data: SupportTicket[]
    message: string
    totalCount: number,
     statusCounts: Record<TicketStatus, number>
  }>('/support/tickets', {
    params: flatParams,
  })

  return res.data
}

export const getSupportTicketById = async (id: string) => {
  const res = await axiosInstance.get<SupportTicket>(`/support/tickets/${id}`)
  return res.data
}

export const updateSupportTicket = async (
  id: string,
  data: Partial<Pick<SupportTicket, 'status' | 'dueDate'>>,
) => {
  const res = await axiosInstance.patch<SupportTicket>(`/support/tickets/${id}`, data)
  return res.data
}


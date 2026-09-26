// src/hooks/support.hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSupportTicket,
  getMySupportTickets,
  getSupportTicketById,
  updateSupportTicket,
  type CreateTicketPayload,
  type SupportTicket,
  type TicketStatus
} from '../../api/support.api'

export const useCreateTicket = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTicketPayload) => createSupportTicket(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })
}

interface UseMyTicketsOptions {
  page: number
  limit: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>
}

export const useMyTickets = ({ page, limit, filters }: UseMyTicketsOptions) =>
  useQuery<{
    data: SupportTicket[]
    message: string
    totalCount: number,
    statusCounts: Record<TicketStatus, number>
  }>({
    queryKey: ['support-tickets', page, limit, filters],
    queryFn: () => getMySupportTickets(page, limit, filters),
    refetchOnWindowFocus: false,
  })

export const useTicketById = (id: string) =>
  useQuery<SupportTicket>({
    queryKey: ['support-tickets', id],
    queryFn: () => getSupportTicketById(id),
    enabled: !!id,
  })

export const useUpdateTicket = (id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Pick<SupportTicket, 'status' | 'dueDate'>>) =>
      updateSupportTicket(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets', id] })
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] })
    },
  })
}





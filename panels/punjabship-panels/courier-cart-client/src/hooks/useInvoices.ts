import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBillingInvoices, raiseInvoiceDispute, recordInvoicePayment, acceptInvoiceCredits, generateManualInvoice, type InvoiceFilters, type BillingInvoiceResponse, type RaiseDisputePayload, type RecordPaymentPayload, type GenerateInvoicePayload } from '../api/invoice.api'

export const useInvoices = (page: number, limit: number, filters: InvoiceFilters = {}) => {
  return useQuery<BillingInvoiceResponse>({
    queryKey: ['billing-invoices', page, limit, filters],
    queryFn: () => getBillingInvoices(page, limit, filters),
  })
}

export const useRaiseDispute = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: RaiseDisputePayload }) =>
      raiseInvoiceDispute(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] })
    },
  })
}

export const useRecordPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: string; payload: RecordPaymentPayload }) =>
      recordInvoicePayment(invoiceId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-statement', variables.invoiceId] })
    },
  })
}

export const useAcceptCredits = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => acceptInvoiceCredits(invoiceId),
    onSuccess: (_, invoiceId) => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice-statement', invoiceId] })
    },
  })
}

export const useGenerateManualInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GenerateInvoicePayload) => generateManualInvoice(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-invoices'] })
    },
  })
}

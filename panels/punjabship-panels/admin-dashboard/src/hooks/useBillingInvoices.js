import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminAddCodOffset,
  adminCloseBillingInvoice,
  adminGenerateManualInvoice,
  adminRegenerateBillingInvoice,
  adminResolveDispute,
  getInvoiceStatement,
  listAdminBillingInvoices,
} from 'services/billingInvoices.service'

export function useAdminBillingInvoices(params) {
  const { page = 1, limit = 20, status, sellerId } = params || {}
  return useQuery({
    queryKey: ['admin-billing-invoices', page, limit, status, sellerId],
    queryFn: () => listAdminBillingInvoices({ page, limit, status, sellerId }),
    keepPreviousData: true,
  })
}

export function useAdminCodOffsetMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ invoiceId, codRemittanceId, amount }) =>
      adminAddCodOffset(invoiceId, { codRemittanceId, amount }),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice-statement', variables.invoiceId] })
    },
  })
}

export function useAdminCloseInvoiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId) => adminCloseBillingInvoice(invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
    },
  })
}

export function useAdminRegenerateInvoiceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId) => adminRegenerateBillingInvoice(invoiceId),
    onSuccess: (data, invoiceId) => {
      qc.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
      qc.invalidateQueries({ queryKey: ['invoice-statement', invoiceId] })
    },
  })
}

export function useAdminResolveDisputeMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ disputeId, status, resolutionNotes }) =>
      adminResolveDispute(disputeId, { status, resolutionNotes }),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
      // Invalidate statement if invoiceId is available in response
      if (data?.statement?.invoiceId) {
        qc.invalidateQueries({ queryKey: ['invoice-statement', data.statement.invoiceId] })
      }
    },
  })
}

export function useInvoiceStatement(invoiceId, enabled = true) {
  return useQuery({
    queryKey: ['invoice-statement', invoiceId],
    queryFn: () => getInvoiceStatement(invoiceId),
    enabled: enabled && !!invoiceId,
  })
}

export function useAdminGenerateManualInvoice() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, startDate, endDate }) =>
      adminGenerateManualInvoice(userId, { startDate, endDate }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
    },
  })
}

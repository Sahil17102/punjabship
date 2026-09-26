import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adjustAdminWalletBalance,
  downloadAdminWalletMisReportCsv,
  getAdminWallet,
  getAdminWalletMisReport,
  getAdminWalletTransactions,
  listAdminWallets,
} from 'services/wallet.service'

export function useAdminWallets(params) {
  const { page = 1, limit = 20, search = '', sortBy = 'updatedAt', sortOrder = 'desc' } = params || {}
  return useQuery({
    queryKey: ['admin-wallets', page, limit, search, sortBy, sortOrder],
    queryFn: () => listAdminWallets({ page, limit, search, sortBy, sortOrder }),
    keepPreviousData: true,
  })
}

export function useAdminWallet(userId, enabled = true) {
  return useQuery({
    queryKey: ['admin-wallet', userId],
    queryFn: () => getAdminWallet(userId),
    enabled: enabled && !!userId,
  })
}

export function useAdminWalletTransactions(userId, params, enabled = true) {
  const { page = 1, limit = 50, type, dateFrom, dateTo, category } = params || {}
  return useQuery({
    queryKey: ['admin-wallet-transactions', userId, page, limit, type, dateFrom, dateTo, category],
    queryFn: () => getAdminWalletTransactions(userId, { page, limit, type, dateFrom, dateTo, category }),
    enabled: enabled && !!userId,
    keepPreviousData: true,
  })
}

export function useAdminWalletMisReport(params, enabled = true) {
  return useQuery({
    queryKey: ['admin-wallet-mis-report', params],
    queryFn: () => getAdminWalletMisReport(params),
    enabled,
    keepPreviousData: true,
  })
}

export function useDownloadAdminWalletMisReportCsv() {
  return useMutation({
    mutationFn: (params) => downloadAdminWalletMisReportCsv(params),
  })
}

export function useAdjustWalletBalance() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, type, amount, reason, notes }) =>
      adjustAdminWalletBalance(userId, { type, amount, reason, notes }),
    onSuccess: (data, variables) => {
      qc.invalidateQueries({ queryKey: ['admin-wallets'] })
      qc.invalidateQueries({ queryKey: ['admin-wallet', variables.userId] })
      qc.invalidateQueries({ queryKey: ['admin-wallet-transactions', variables.userId] })
    },
  })
}


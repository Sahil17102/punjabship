import { useQuery } from '@tanstack/react-query'
import { fetchWalletBalance, fetchWalletTransactions } from '../api/wallet.api'
import type { WalletTransactionCategory } from '../api/wallet.api'

export const useWalletBalance = (enabled = true) => {
  const query = useQuery({
    queryKey: ['walletBalance'],
    queryFn: fetchWalletBalance,
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 30,
  })

  return query
}

interface UseWalletTransactionsOptions {
  limit?: number
  page?: number
  type?: 'credit' | 'debit'
  dateFrom?: string
  dateTo?: string
  category?: WalletTransactionCategory
  search?: string
  enabled?: boolean
}

export const useWalletTransactions = ({
  limit = 50,
  page = 0,
  type,
  dateFrom,
  dateTo,
  category,
  search,
  enabled = true,
}: UseWalletTransactionsOptions = {}) => {
  return useQuery({
    queryKey: ['walletTransactions', page, limit, type, dateFrom, dateTo, category, search],
    queryFn: () =>
      fetchWalletTransactions({
        limit,
        page,
        type,
        dateFrom,
        dateTo,
        category,
        search,
      }),
    enabled,
  })
}

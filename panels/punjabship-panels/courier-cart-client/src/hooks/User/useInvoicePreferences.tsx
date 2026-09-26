import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getInvoicePreferences,
  saveInvoicePreferences,
  type InvoicePreferences,
} from '../../api/invoice.api'

export function useInvoicePreferences() {
  const queryClient = useQueryClient()

  // ✅ New object-style API for query
  const {
    data: preferences,
    isPending: isLoading,
    isError,
  } = useQuery({
    queryKey: ['invoicePreferences'],
    queryFn: getInvoicePreferences,
  })

  // ✅ New object-style API for mutation
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: (data: InvoicePreferences) => saveInvoicePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoicePreferences'] })
    },
  })

  return {
    preferences,
    isLoading,
    isError,
    savePreferences,
    isSaving,
  }
}

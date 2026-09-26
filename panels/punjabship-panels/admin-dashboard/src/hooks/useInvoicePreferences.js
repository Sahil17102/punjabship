import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInvoicePreferences, saveInvoicePreferences } from '../services/invoicePreferences.service'

export const useInvoicePreferences = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data, isLoading } = useQuery({
    queryKey: ['invoice-preferences'],
    queryFn: () => getInvoicePreferences(),
  })

  const saveMutation = useMutation({
    mutationFn: (preferences) => saveInvoicePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-preferences'] })
      toast({
        title: 'Invoice preferences saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to save invoice preferences',
        description: error?.response?.data?.error || 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })

  return {
    preferences: data?.preferences || null,
    isLoading,
    savePreferences: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  }
}


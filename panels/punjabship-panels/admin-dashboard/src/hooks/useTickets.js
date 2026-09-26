// hooks/useAdminTickets.js

import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminGetTickets, adminUpdateTicket } from 'services/support.service'

export const useAdminTickets = ({ page = 1, limit = 10, filters = {} } = {}) => {
  return useQuery({
    queryKey: ['adminTickets', page, limit, filters],
    queryFn: () => adminGetTickets({ page, limit, filters }), // ✅ Correctly pass filters
    keepPreviousData: true,
  })
}

export const useUpdateTicket = (onClose) => {
  const toast = useToast()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminUpdateTicket,
    onSuccess: (data) => {
      toast({
        title: 'Ticket updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      // Optionally refetch this ticket
      queryClient.invalidateQueries({ queryKey: ['adminTickets'] })
      onClose?.()
    },
    onError: (err) => {
      toast({
        title: 'Error updating ticket',
        description: err?.response?.data?.message || err.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })
}

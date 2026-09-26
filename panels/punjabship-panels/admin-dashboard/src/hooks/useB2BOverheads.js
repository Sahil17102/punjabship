import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { b2bAdminService } from '../services/b2bAdmin.service'

export const useB2BOverheads = (filters = {}) => {
  const queryClient = useQueryClient()
  const toast = useToast()

  const queryKey = ['b2b-overheads', filters]

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => b2bAdminService.getOverheads(filters),
  })

  const upsertOverhead = useMutation({
    mutationFn: (payload) => b2bAdminService.upsertOverhead(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast({
        title: 'Overhead rule saved',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const deleteOverhead = useMutation({
    mutationFn: (id) => b2bAdminService.deleteOverhead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast({
        title: 'Overhead rule deleted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  return {
    overheads: data,
    isLoading,
    upsertOverhead,
    deleteOverhead,
  }
}


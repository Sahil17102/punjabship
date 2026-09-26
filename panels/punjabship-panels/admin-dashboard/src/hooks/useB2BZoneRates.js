import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { b2bAdminService } from '../services/b2bAdmin.service'

export const useB2BZoneRates = (filters = {}) => {
  const queryClient = useQueryClient()
  const toast = useToast()

  const queryKey = ['b2b-zone-rates', filters]

  const { data = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => b2bAdminService.getZoneRates(filters),
  })

  const upsertRate = useMutation({
    mutationFn: (payload) => b2bAdminService.upsertZoneRate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast({ title: 'Zone rate saved', status: 'success', duration: 3000, isClosable: true })
    },
  })

  const deleteRate = useMutation({
    mutationFn: (id) => b2bAdminService.deleteZoneRate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast({ title: 'Zone rate deleted', status: 'success', duration: 3000, isClosable: true })
    },
  })

  const importRates = useMutation({
    mutationFn: (formData) => b2bAdminService.importZoneRates(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
      toast({ title: 'Zone rates imported', status: 'success', duration: 3000, isClosable: true })
    },
  })

  return {
    rates: data,
    isLoading,
    upsertRate,
    deleteRate,
    importRates,
  }
}


import { useToast } from '@chakra-ui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ndrReattempt,
  ndrChangePhone,
  ndrChangeAddress,
  ndrBulk,
  delhiveryPickupReschedule,
} from 'services/ops.service'

export function useNdrReattempt() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ndrReattempt,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ndr'] })
      toast({ title: 'Reattempt requested', status: 'success', duration: 2500, isClosable: true })
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e?.message || 'Failed to request reattempt'
      toast({ title: 'Reattempt failed', description: msg, status: 'error', duration: 4000, isClosable: true })
    },
  })
}

export function useNdrChangePhone() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ndrChangePhone,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ndr'] })
      toast({ title: 'Phone updated', status: 'success', duration: 2500, isClosable: true })
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update phone'
      toast({ title: 'Change phone failed', description: msg, status: 'error', duration: 4000, isClosable: true })
    },
  })
}

export function useNdrChangeAddress() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ndrChangeAddress,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ndr'] })
      toast({ title: 'Address updated', status: 'success', duration: 2500, isClosable: true })
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e?.message || 'Failed to update address'
      toast({ title: 'Change address failed', description: msg, status: 'error', duration: 4000, isClosable: true })
    },
  })
}

export function useNdrBulk() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: ndrBulk,
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-ndr'] })
      const ineligible = data?.ineligible?.length || 0
      toast({
        title: 'Bulk action submitted',
        description: ineligible ? `${ineligible} shipments were ineligible` : undefined,
        status: 'success',
        duration: 3500,
        isClosable: true,
      })
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e?.message || 'Bulk action failed'
      toast({ title: 'Bulk action failed', description: msg, status: 'error', duration: 4000, isClosable: true })
    },
  })
}

export function useDelhiveryPickupReschedule() {
  const qc = useQueryClient()
  const toast = useToast()
  return useMutation({
    mutationFn: delhiveryPickupReschedule,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ndr'] })
      toast({ title: 'Pickup reschedule submitted', status: 'success', duration: 2500, isClosable: true })
    },
    onError: (e) => {
      const msg = e?.response?.data?.message || e?.message || 'Failed to submit pickup reschedule'
      toast({ title: 'Pickup reschedule failed', description: msg, status: 'error', duration: 4000, isClosable: true })
    },
  })
}



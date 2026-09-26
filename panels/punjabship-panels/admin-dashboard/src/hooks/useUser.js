import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveDocument,
  approveKyc,
  approveUser,
  fetchUserBankAccounts,
  getKyc,
  getTicketsByUserId,
  getUserInfo,
  rejectDocument,
  rejectKyc,
  revokeKyc,
  resetUserPassword,
  updateBankAccountStatus,
  updateUserBusinessType,
} from 'services/user.service'

export const useUserInfo = (id) =>
  useQuery({
    queryKey: ['userInfo', id],
    queryFn: () => getUserInfo(id),
    enabled: !!id,
    refetchOnWindowFocus: false,
  })

export function useApproveUser() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: approveUser,
    onSuccess: (data, userId) => {
      if (data?.success) {
        // userId is the variable passed to mutate, usually userId
        queryClient.invalidateQueries(['userInfo', userId])
        toast({
          title: 'User Approved',
          description: `User ID ${userId} has been successfully approved.`,
          status: 'success',
          duration: 4000,
          isClosable: true,
        })
      } else {
        toast({
          title: data?.message,
          description: 'An error occurred while approving the user.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
      // Optionally invalidate user list as well if needed
    },
    onError: (error) => {
      toast({
        title: 'Approval Failed',
        description: error?.message || 'An error occurred while approving the user.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })

      console.error('Failed to approve user:', error)
      // You can also use toast notifications here for UX feedback
    },
  })
}

export function useResetUserPassword() {
  return useMutation({
    mutationFn: resetUserPassword,
  })
}

export function useUpdateUserBusinessType() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ userId, businessType }) => updateUserBusinessType(userId, businessType),
    onSuccess: (_data, { userId }) => {
      toast({
        title: 'Business type updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['userInfo', userId])
      queryClient.invalidateQueries({ queryKey: ['users-with-role-user'] })
    },
    onError: (error) => {
      toast({
        title: 'Failed to update business type',
        description: error?.response?.data?.message || error?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export function useUserBankAccounts(userId) {
  return useQuery({
    queryKey: ['userBankAccounts', userId],
    queryFn: () => fetchUserBankAccounts(userId),
    enabled: !!userId,
    refetchOnWindowFocus: false,
  })
}

export function useUpdateBankAccountStatus(userId) {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ accountId, payload }) => updateBankAccountStatus(userId, accountId, payload),
    onSuccess: () => {
      toast({
        title: 'Bank account status updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['userBankAccounts', userId])
    },
    onError: (error) => {
      toast({
        title: 'Failed to update bank account status',
        description: error?.response?.data?.message || error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useUserKyc = (userId) => {
  return useQuery({
    queryKey: ['userKyc', userId],
    queryFn: () => getKyc(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  })
}

export const useApproveKyc = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (userId) => approveKyc(userId),
    onSuccess: (_data, userId) => {
      toast({
        title: 'KYC Approved',
        description: `User KYC for ${userId} has been approved.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['userKyc', userId])
    },
    onError: (error) => {
      toast({
        title: 'Failed to approve KYC',
        description: error?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useRejectKyc = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ userId, reason }) => rejectKyc(userId, reason),
    onSuccess: (_data, { userId }) => {
      toast({
        title: 'KYC Rejected',
        description: `User KYC for ${userId} has been rejected.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['userKyc', userId])
    },
    onError: (error) => {
      toast({
        title: 'Failed to reject KYC',
        description: error?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useRevokeKyc = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ userId, reason }) => revokeKyc(userId, reason),
    onSuccess: (_data, { userId }) => {
      toast({
        title: 'KYC Revoked',
        description: `User KYC for ${userId} has been moved back to verification.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['userKyc', userId])
    },
    onError: (error) => {
      toast({
        title: 'Failed to revoke KYC',
        description: error?.response?.data?.message || error?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useApproveDocument = (userId) => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: (key) => approveDocument(userId, key),
    onSuccess: (_data, key) => {
      toast({
        title: 'Document Approved',
        description: `Document "${key}" approved.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['userKyc', userId])
    },
    onError: (error) => {
      toast({
        title: 'Failed to approve document',
        description: error?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useRejectDocument = (userId) => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ key, reason }) => rejectDocument(userId, key, reason),
    onSuccess: (_data, { key }) => {
      toast({
        title: 'Document Rejected',
        description: `Document "${key}" rejected.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      queryClient.invalidateQueries(['userKyc', userId])
    },
    onError: (error) => {
      toast({
        title: 'Failed to reject document',
        description: error?.message || 'An error occurred.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useUserTickets = (userId, page, perPage) => {
  return useQuery({
    queryKey: ['userTickets', userId, page, perPage],
    queryFn: () => getTicketsByUserId(userId, page, perPage),
    enabled: !!userId, // only run when userId is truthy
  })
}

// src/hooks/useUsersWithRoleUser.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createUserTeamMember,
  deleteUser,
  deleteUserTeamMember,
  fetchUserTeamMembers,
  fetchUsersWithRoleUser,
  searchSellers,
  toggleUserTeamMemberStatus,
} from 'services/user.service'

export function useUsersWithRoleUser({
  page = 1,
  perPage = 10,
  search = '',
  businessTypes = [],
  onboardingComplete,
  kycStatus = '',
  sortBy = 'createdAt',
  sortOrder = 'desc',
  approved = '',
}) {
  return useQuery({
    queryKey: [
      'users-with-role-user',
      page,
      perPage,
      search,
      businessTypes,
      onboardingComplete,
      kycStatus,
      sortBy,
      sortOrder,
      approved,
    ],
    queryFn: () =>
      fetchUsersWithRoleUser({
        page,
        perPage,
        search,
        businessTypes,
        onboardingComplete,
        kycStatus,
        sortBy,
        sortOrder,
        approved,
      }),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
    refetchOnWindowFocus: false,
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      // Invalidate users list to refetch
      queryClient.invalidateQueries({ queryKey: ['users-with-role-user'] })
    },
  })
}

// Search sellers for autocomplete
export function useSearchSellers(query, limit = 20) {
  return useQuery({
    queryKey: ['search-sellers', query, limit],
    queryFn: () => searchSellers(query, limit),
    enabled: Boolean(query && query.trim().length >= 2),
    staleTime: 30 * 1000, // cache for 30 seconds
    refetchOnWindowFocus: false,
  })
}

export function useUserTeamMembers(userId, page = 1, limit = 10, filters = {}) {
  const filtersKey = JSON.stringify(filters || {})

  return useQuery({
    queryKey: ['user-team-members', userId, page, limit, filtersKey],
    queryFn: () => fetchUserTeamMembers(userId, page, limit, filters),
    enabled: Boolean(userId),
    keepPreviousData: true,
  })
}

export function useCreateTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }) => createUserTeamMember(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-team-members'] })
    },
  })
}

export function useToggleTeamMemberStatusMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, memberId, isActive }) =>
      toggleUserTeamMemberStatus(userId, memberId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-team-members'] })
    },
  })
}

export function useDeleteTeamMemberMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, memberId }) => deleteUserTeamMember(userId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-team-members'] })
    },
  })
}

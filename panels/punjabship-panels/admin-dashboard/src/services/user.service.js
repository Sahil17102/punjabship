import api from './axios'

const normalizeOptionalBooleanParam = (value) => {
  if (value === '' || value === undefined || value === null) return undefined
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    if (value === 'true') return true
    if (value === 'false') return false
  }
  return undefined
}

// --- User Management ---
export async function fetchUsersWithRoleUser({
  page = 1,
  perPage = 10,
  search = '',
  businessTypes = [],
  onboardingComplete,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  approved,
  kycStatus,
}) {
  const response = await api.get('/admin/users/users-management', {
    params: {
      page,
      perPage,
      search,
      businessTypes: businessTypes.length ? businessTypes : undefined,
      onboardingComplete: normalizeOptionalBooleanParam(onboardingComplete),
      approved: normalizeOptionalBooleanParam(approved),
      kycStatus: kycStatus || undefined,
      sortBy,
      sortOrder,
    },
  })
  return {
    data: response.data.data || [],
    totalCount: response.data.totalCount || 0,
  }
}

export async function deleteUser(userId) {
  const response = await api.delete(`/admin/users/${userId}`)
  return response.data
}

export const getUserInfo = async (id) => {
  const { data } = await api.get(`/user/user-info/${id}`)
  return data
}

export const approveUser = async (userId) => {
  const response = await api.patch(`/admin/users/${userId}/approve`)
  return response.data
}

export const updateUserBusinessType = async (userId, businessType) => {
  const response = await api.patch(`/admin/users/${userId}/business-type`, {
    businessType,
  })
  return response.data
}

export const resetUserPassword = async (userId) => {
  const response = await api.post(`/admin/users/${userId}/reset-password`)
  return response.data.tempPassword
}

export const createUserImpersonationSession = async (userId) => {
  const response = await api.post(`/admin/users/${userId}/impersonate`)
  return response.data
}

export async function fetchUserBankAccounts(userId) {
  const response = await api.get(`/admin/users/${userId}/bank-accounts`)
  return response.data.data
}

export async function updateBankAccountStatus(userId, accountId, payload) {
  const response = await api.patch(
    `/admin/users/${userId}/bank-accounts/${accountId}/status`,
    payload,
  )
  return response.data
}

// --- KYC APIs ---
export const getKyc = async (userId) => {
  const { data } = await api.get(`/admin/users/${userId}/kyc`)
  return data
}

export const approveKyc = async (userId) => {
  const { data } = await api.post(`/admin/users/kyc/approve/${userId}`)
  return data
}

export const rejectKyc = async (userId, reason) => {
  const { data } = await api.post(`/admin/users/kyc/reject/${userId}`, { reason })
  return data
}

export const revokeKyc = async (userId, reason) => {
  const { data } = await api.post(`/admin/users/kyc/revoke/${userId}`, { reason })
  return data
}

export const approveDocument = async (userId, key) => {
  const { data } = await api.post(`/admin/users/kyc/document/approve/${userId}/${key}`)
  return data
}

export const rejectDocument = async (userId, key, reason) => {
  const { data } = await api.post(`/admin/users/kyc/document/reject/${userId}/${key}`, { reason })
  return data
}

export const getTicketsByUserId = async (userId, page = 1, perPage = 10) => {
  const { data } = await api.get(`/admin/support-tickets/user/${userId}`, {
    params: { page, perPage },
  })
  return data // expected { tickets: [], totalCount: number }
}

// Search sellers for autocomplete
export const searchSellers = async (query, limit = 20) => {
  if (!query || query.trim().length < 2) {
    return { success: true, data: [] }
  }
  const { data } = await api.get('/admin/users/search-sellers', {
    params: { q: query.trim(), limit },
  })
  return data
}

const sanitizeParams = (params = {}) => {
  if (!params || typeof params !== 'object') return {}
  const sanitized = { ...params }
  Object.keys(sanitized).forEach((key) => {
    const value = sanitized[key]
    if (value === '' || value === undefined || value === null) {
      delete sanitized[key]
    }
  })
  return sanitized
}

export async function fetchUserTeamMembers(userId, page = 1, limit = 10, filters = {}) {
  const params = sanitizeParams({ page, limit, ...filters })
  const response = await api.get(`/admin/users/${userId}/team-members`, {
    params,
  })
  return response.data
}

export async function createUserTeamMember(userId, payload) {
  const response = await api.post(`/admin/users/${userId}/team-members`, payload)
  return response.data
}

export async function toggleUserTeamMemberStatus(userId, memberId, isActive) {
  const response = await api.patch(`/admin/users/${userId}/team-members/${memberId}/status`, {
    isActive,
  })
  return response.data
}

export async function deleteUserTeamMember(userId, memberId) {
  const response = await api.delete(`/admin/users/${userId}/team-members/${memberId}`)
  return response.data
}

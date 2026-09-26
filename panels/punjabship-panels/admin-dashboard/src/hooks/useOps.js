// src/hooks/useOps.js
import { useQuery } from '@tanstack/react-query'
import { getAdminNdr, getAdminRto, getAdminRtoKpis, getMyNdr, getMyRto } from 'services/ops.service'

export function useAdminNdr(params) {
  const {
    orderId,
    page = 1,
    limit = 20,
    search = '',
    fromDate,
    toDate,
    courier,
    integration_type,
    attempt_count,
    status,
  } = params || {}
  const sanitizedAttempt = attempt_count ? Number(attempt_count) : undefined
  const cleanParams = {
    page,
    limit,
    search: search || undefined,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    courier: courier || undefined,
    integration_type: integration_type || undefined,
    attempt_count: sanitizedAttempt,
    status: status || undefined,
  }
  return useQuery({
    queryKey: [
      'admin-ndr',
      orderId,
      page,
      limit,
      search,
      fromDate,
      toDate,
      courier,
      integration_type,
      sanitizedAttempt,
      status,
    ],
    queryFn: () => getAdminNdr(orderId, cleanParams),
    keepPreviousData: true,
  })
}

export function useAdminRto(params) {
  const { orderId, page = 1, limit = 20, search = '', fromDate, toDate, userId, courier } = params || {}
  return useQuery({
    queryKey: ['admin-rto', orderId, page, limit, search, fromDate, toDate, userId, courier],
    queryFn: () => getAdminRto(orderId, { page, limit, search, fromDate, toDate, userId, courier }),
    keepPreviousData: true,
  })
}

export function useMyNdr(orderId) {
  return useQuery({
    queryKey: ['my-ndr', orderId],
    queryFn: () => getMyNdr(orderId),
  })
}

export function useMyRto(orderId) {
  return useQuery({
    queryKey: ['my-rto', orderId],
    queryFn: () => getMyRto(orderId),
  })
}

export function useAdminRtoKpis(params) {
  const { search = '', fromDate, toDate, userId, courier } = params || {}
  return useQuery({
    queryKey: ['admin-rto-kpis', search, fromDate, toDate, userId, courier],
    queryFn: () => getAdminRtoKpis({ search, fromDate, toDate, userId, courier }),
  })
}



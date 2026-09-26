// src/services/ops.service.js
import api from './axios'

export async function getAdminNdr(orderId, params = {}) {
  // baseURL already includes /api – avoid double /api
  const { data } = await api.get('/admin/ndr', { params: { orderId, ...params } })
  return data
}

export async function getAdminRto(orderId, params = {}) {
  // baseURL already includes /api – avoid double /api
  const { data } = await api.get('/admin/rto', { params: { orderId, ...params } })
  return data
}

export async function getAdminRtoKpis(params = {}) {
  const { data } = await api.get('/admin/rto/kpis', { params })
  return data
}

export async function exportAdminRto(params = {}) {
  const res = await api.get('/admin/rto/export', { params, responseType: 'blob' })
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const ts = new Date().toISOString().split('T')[0]
  link.setAttribute('download', `rto_export_${ts}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function getMyNdr(orderId) {
  const { data } = await api.get('/ndr', { params: { orderId } })
  return data
}

export async function getMyRto(orderId) {
  const { data } = await api.get('/rto', { params: { orderId } })
  return data
}

// NDR admin actions
export async function ndrReattempt(payload) {
  const { data } = await api.post('/ndr/reattempt', payload)
  return data
}

export async function ndrChangeAddress(payload) {
  const { data } = await api.post('/ndr/change-address', payload)
  return data
}

export async function ndrChangePhone(payload) {
  const { data } = await api.post('/ndr/change-phone', payload)
  return data
}

export async function delhiveryPickupReschedule(awbs = []) {
  const { data } = await api.post('/ndr/delhivery/pickup-reschedule', { awbs })
  return data
}

export async function ndrBulk(items = []) {
  const { data } = await api.post('/ndr/bulk', { items })
  return data
}

export async function getDelhiveryUplStatus(uplId) {
  const { data } = await api.get('/ndr/delhivery/upl-status', { params: { uplId } })
  return data
}

export async function getNdrTimeline(params = {}) {
  const { data } = await api.get('/admin/ndr/timeline', { params })
  return data
}

export async function exportAdminNdr(params = {}) {
  // Use axios to include Authorization header; download as blob
  const res = await api.get('/admin/ndr/export', {
    params,
    responseType: 'blob',
  })
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const ts = new Date().toISOString().split('T')[0]
  link.setAttribute('download', `ndr_export_${ts}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export async function getAdminNdrKpis() {
  const { data } = await api.get('/admin/ndr/kpis')
  return data
}

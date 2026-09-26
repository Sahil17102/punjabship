import api from './axios'

export const getCrmSession = async () => (await api.get('/admin/crm/session')).data.data

export const getCrmRoles = async () => (await api.get('/admin/crm/roles')).data.data
export const createCrmRole = async (payload) =>
  (await api.post('/admin/crm/roles', payload)).data.data
export const updateCrmRole = async (id, payload) =>
  (await api.patch(`/admin/crm/roles/${id}`, payload)).data.data

export const getCrmEmployees = async (params = {}) =>
  (await api.get('/admin/crm/employees', { params })).data
export const createCrmEmployee = async (payload) =>
  (await api.post('/admin/crm/employees', payload)).data.data
export const updateCrmEmployee = async (id, payload) =>
  (await api.patch(`/admin/crm/employees/${id}`, payload)).data.data

export const getCrmSellers = async (params = {}) =>
  (await api.get('/admin/crm/sellers', { params })).data
export const createCrmAssignment = async (payload) =>
  (await api.post('/admin/crm/assignments', payload)).data.data

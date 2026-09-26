import api from './axios'

export const getManualCouriers = async () =>
  (await api.get('/admin/manual-couriers')).data.data

export const getManualCourier = async (id, params = {}) =>
  (await api.get(`/admin/manual-couriers/${id}`, { params })).data.data

export const createManualCourier = async (payload) =>
  (await api.post('/admin/manual-couriers', payload)).data.data

export const updateManualCourier = async (id, payload) =>
  (await api.patch(`/admin/manual-couriers/${id}`, payload)).data.data

export const replaceManualCourierPincodes = async (id, pincodes) =>
  (await api.put(`/admin/manual-couriers/${id}/pincodes`, { pincodes })).data.data

export const importManualCourierPincodes = async (id, file, mode = 'append') => {
  const body = new FormData()
  body.append('file', file)
  body.append('mode', mode)
  return (
    await api.post(`/admin/manual-couriers/${id}/pincodes/import`, body, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  ).data
}

export const removeManualCourierPincode = async (id, pincode) =>
  (await api.delete(`/admin/manual-couriers/${id}/pincodes/${pincode}`)).data

export const getManualShipmentStats = async () =>
  (await api.get('/admin/manual-couriers/shipments/stats')).data.data

export const getManualShipments = async (params) =>
  (await api.get('/admin/manual-couriers/shipments', { params })).data

export const getManualShipment = async (id) =>
  (await api.get(`/admin/manual-couriers/shipments/${id}`)).data.data

export const assignManualFulfilment = async (id) =>
  (await api.post(`/admin/manual-couriers/shipments/${id}/manual`)).data

export const addManualTracking = async (id, payload) =>
  (await api.post(`/admin/manual-couriers/shipments/${id}/tracking`, payload)).data

export const getManualProviderOptions = async (id, hubPickup) =>
  (
    await api.post(`/admin/manual-couriers/shipments/${id}/provider-options`, {
      hubPickup,
    })
  ).data.data

export const rebookManualShipment = async (id, payload) =>
  (await api.post(`/admin/manual-couriers/shipments/${id}/rebook`, payload)).data

export const releaseManualProviderBooking = async (id) =>
  (
    await api.post(
      `/admin/manual-couriers/shipments/${id}/release-provider-booking`,
    )
  ).data

export const reconcileManualAwb = async (id, payload) =>
  (await api.post(`/admin/manual-couriers/shipments/${id}/reconcile-awb`, payload)).data

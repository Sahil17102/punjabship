import api from './axios'

export async function fetchTracking(params) {
  try {
    const { data } = await api.get('/orders/track', { params })

    if (!data.success || !data.data) {
      throw new Error('No shipment found!')
    }

    return data.data
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking')
  }
}

export async function fetchAllOrders(page, limit = 10, filters = {}) {
  try {
    const response = await api.get(`/admin/orders/all-orders`, {
      params: {
        page,
        limit,
        ...filters,
      },
    })

    return response.data // { success, orders, totalCount, totalPages }
  } catch (error) {
    console.error('Error fetching orders:', error.message)
    throw error
  }
}

export async function fetchBulkTracking(awbs = []) {
  try {
    const cleaned = awbs.map((awb) => String(awb || '').trim()).filter(Boolean)
    const { data } = await api.get('/orders/track', {
      params: { awbs: cleaned.join(',') },
    })

    if (!data.success) {
      throw new Error('No shipment found!')
    }

    return data.results || []
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking')
  }
}

export async function fetchAssistedBookingSellers(search = '') {
  const response = await api.get('/admin/orders/assisted/sellers', {
    params: { q: search, limit: 50 },
  })
  return response.data?.data || []
}

export async function fetchAssistedSellerWarehouses(sellerId) {
  const response = await api.get(`/admin/orders/assisted/sellers/${sellerId}/warehouses`)
  return response.data?.data || []
}

export async function checkAssistedBookingRates(payload) {
  const response = await api.post('/admin/orders/assisted/rates', payload, {
    timeout: 60000,
  })
  return response.data?.data || []
}

export async function createAssistedBooking({ sellerId, shipment }) {
  const response = await api.post(
    '/admin/orders/assisted/create',
    { sellerId, shipment },
    { timeout: 210000 },
  )
  return response.data
}

export async function exportOrdersToCSV(filters = {}, report = 'orders') {
  try {
    const response = await api.get('/admin/orders/export', {
      params: { ...filters, report },
      responseType: 'blob', // Important for file download
    })

    // Create a download link
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${report === 'orders' ? 'orders_export' : report.replace(/-/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error) {
    console.error('Error exporting orders:', error.message)
    throw error
  }
}

export async function cancelAdminOrder(orderId) {
  try {
    const response = await api.post('/shipments/cancel', { orderId })
    return response.data
  } catch (error) {
    console.error('Error cancelling order:', error.response?.data || error.message)
    throw error
  }
}

export async function regenerateAdminOrderDocuments(
  orderId,
  { regenerateLabel = true, regenerateInvoice = true } = {},
) {
  try {
    const response = await api.post(`/admin/orders/${orderId}/regenerate-documents`, {
      regenerateLabel,
      regenerateInvoice,
    })
    return response.data
  } catch (error) {
    console.error('Error regenerating order documents:', error.response?.data || error.message)
    throw error
  }
}

export async function addManualNdrToOrder(
  orderId,
  { status = 'ndr', reason, remarks, attemptNo } = {},
) {
  try {
    const response = await api.post(`/admin/orders/${orderId}/ndr`, {
      status,
      reason,
      remarks,
      attemptNo,
    })
    return response.data
  } catch (error) {
    console.error('Error adding manual NDR to order:', error.response?.data || error.message)
    throw error
  }
}

export async function updateAdminOrderStatus(
  orderId,
  { status, reason, remarks, attemptNo } = {},
) {
  try {
    const response = await api.post(`/admin/orders/${orderId}/status`, {
      status,
      reason,
      remarks,
      attemptNo,
    })
    return response.data
  } catch (error) {
    console.error('Error updating order status:', error.response?.data || error.message)
    throw error
  }
}

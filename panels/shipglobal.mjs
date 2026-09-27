const DEFAULT_BASE_URL = 'https://app.shipglobal.in/apiv1'

const text = (value) => String(value ?? '').trim()

const splitName = (value) => {
  const parts = text(value).split(/\s+/).filter(Boolean)
  return {
    firstName: parts.shift() || 'Customer',
    lastName: parts.join(' ') || '-',
  }
}

const firstPresent = (...values) => values.find((value) => text(value))

export const normalizeShipGlobalStatus = (eventCode, providerStatus = '') => {
  const code = text(eventCode).toUpperCase()
  if (code === 'SGE_304') return 'delivered'
  if (code === 'SGE_303') return 'out_for_delivery'
  if (['SGE_502', 'SGE_503', 'SGE_504'].includes(code)) return code === 'SGE_504' ? 'rto_delivered' : 'rto_in_transit'
  if (['SGE_401', 'SGE_402', 'SGE_403', 'SGE_505', 'SGE_506'].includes(code) || code.startsWith('SGERROR_')) return 'undelivered'
  if (['SGE_001', 'SGE_101', 'SGE_102', 'SGE_103'].includes(code)) return code === 'SGE_001' ? 'shipment_created' : 'pickup_initiated'
  const status = text(providerStatus).toLowerCase()
  if (status.includes('deliver')) return 'delivered'
  if (status.includes('out for delivery')) return 'out_for_delivery'
  if (status.includes('return') || status.includes('rto')) return 'rto_in_transit'
  if (status.includes('cancel')) return 'cancelled'
  return 'in_transit'
}

export const mapPunjabShipOrderToShipGlobal = (order, defaults = {}) => {
  const consignee = order?.consignee || {}
  const { firstName, lastName } = splitName(consignee.name)
  const items = Array.isArray(order?.order_items) ? order.order_items : []
  return {
    invoice_no: text(order.invoice_no || order.order_number),
    invoice_date: text(order.invoice_date || order.order_date || new Date().toISOString().slice(0, 10)),
    order_reference: text(order.order_reference || order.order_number),
    service: text(order.service || defaults.service || 'Shipglobal Direct'),
    package_weight: text(order.package_weight),
    package_length: text(order.package_length),
    package_breadth: text(order.package_breadth),
    package_height: text(order.package_height),
    currency_code: text(order.currency_code || defaults.currencyCode || 'INR').toUpperCase(),
    csb5_status: Number(order.csb5_status || 0),
    customer_shipping_firstname: text(consignee.first_name || firstName),
    customer_shipping_lastname: text(consignee.last_name || lastName),
    customer_shipping_mobile: text(consignee.phone),
    customer_shipping_email: text(consignee.email),
    customer_shipping_company: text(consignee.company_name),
    customer_shipping_address: text(consignee.address || consignee.address_line_1),
    customer_shipping_address_2: text(consignee.address_2 || consignee.address_line_2 || consignee.locality),
    customer_shipping_address_3: text(consignee.address_3 || consignee.landmark),
    customer_shipping_city: text(consignee.city),
    customer_shipping_postcode: text(consignee.pincode),
    customer_shipping_country_code: text(consignee.country_code || order.customer_shipping_country_code || defaults.countryCode || 'IN').toUpperCase(),
    customer_shipping_state: text(consignee.state),
    ioss_number: text(order.ioss_number),
    customer_nickname: text(order.customer_nickname),
    vendor_order_items: items.map((item) => ({
      vendor_order_item_name: text(item.name),
      vendor_order_item_sku: text(item.sku),
      vendor_order_item_quantity: text(item.qty ?? item.quantity ?? 1),
      vendor_order_item_unit_price: text(item.price),
      vendor_order_item_hsn: text(item.hsn),
      vendor_order_item_tax_rate: text(item.tax_rate ?? 0),
    })),
  }
}

export const validateShipGlobalOrder = (payload) => {
  const required = [
    'invoice_no', 'invoice_date', 'order_reference', 'service', 'package_weight', 'package_length',
    'package_breadth', 'package_height', 'currency_code', 'customer_shipping_firstname',
    'customer_shipping_lastname', 'customer_shipping_mobile', 'customer_shipping_address',
    'customer_shipping_email', 'customer_shipping_city', 'customer_shipping_postcode', 'customer_shipping_country_code',
    'customer_shipping_state',
  ]
  const missing = required.filter((key) => !text(payload?.[key]))
  for (const key of ['package_weight', 'package_length', 'package_breadth', 'package_height']) {
    if (!(Number(payload?.[key]) > 0)) missing.push(key)
  }
  if (!['AED', 'AUD', 'CAD', 'EUR', 'GBP', 'INR', 'SAR', 'USD'].includes(text(payload?.currency_code).toUpperCase())) missing.push('currency_code')
  if (!Array.isArray(payload?.vendor_order_items) || !payload.vendor_order_items.length) missing.push('vendor_order_items')
  else payload.vendor_order_items.forEach((item, index) => {
    for (const key of ['vendor_order_item_name', 'vendor_order_item_quantity', 'vendor_order_item_unit_price', 'vendor_order_item_hsn', 'vendor_order_item_tax_rate']) {
      if (!text(item?.[key])) missing.push(`vendor_order_items.${index}.${key}`)
    }
  })
  return [...new Set(missing)]
}

export const extractShipGlobalAwb = (data, headers = {}) => {
  const candidates = [
    data?.tracking, data?.awb, data?.awb_number, data?.awbNumber,
    data?.data?.tracking, data?.data?.awb, data?.data?.awb_number, data?.data?.awbNumber,
    data?.shipment?.tracking, data?.shipment?.awb, data?.shipment?.awb_number,
    headers['x-awb-number'], headers['x-tracking-number'],
  ]
  const candidate = firstPresent(...candidates)
  if (candidate) return text(candidate)
  const serialized = typeof data === 'string' ? data : JSON.stringify(data || {})
  return serialized.match(/\bSG\d{10,20}\b/i)?.[0] || null
}

export const mapShipGlobalTracking = (response, order = {}) => {
  const data = response?.data || response || {}
  const info = data.awbInfo || data.awb_info || {}
  const events = Array.isArray(data.awbEvents) ? data.awbEvents : []
  const latest = events[0] || {}
  const awb = text(info.awb_number || order.awb_number)
  const providerStatus = text(info.awb_status || latest.awb_history_comment)
  return {
    id: text(order.id || awb),
    order_id: text(order.order_id || order.id),
    order_number: text(order.order_number),
    awb_number: awb,
    courier_name: text(info.partner_lastmile_display || order.courier_partner || 'ShipGlobal'),
    status: normalizeShipGlobalStatus(latest.awb_event_code, providerStatus),
    edd: text(info.edd || info.expected_delivery_date),
    history: events.map((event) => ({
      status_code: text(event.awb_event_code),
      location: text(event.awb_history_location),
      event_time: text(event.awb_history_datetime),
      message: text(event.awb_history_comment),
      scan_type: text(event.type),
    })),
    payment_type: text(order.payment_type || order.order_type),
    shipment_info: providerStatus,
    last_mile_awb: text(info.partner_lastmile_awb),
    last_mile_tracking_url: text(info.partner_lastmile_tracking_url),
  }
}

export const createShipGlobalClient = ({
  username = process.env.SHIPGLOBAL_USERNAME,
  password = process.env.SHIPGLOBAL_PASSWORD,
  baseUrl = process.env.SHIPGLOBAL_API_BASE_URL || DEFAULT_BASE_URL,
  timeoutMs = Number(process.env.SHIPGLOBAL_TIMEOUT_MS || 60000),
  fetchImpl = fetch,
} = {}) => {
  const configured = Boolean(text(username) && text(password))

  const request = async (endpoint, body) => {
    if (!configured) {
      const error = new Error('ShipGlobal credentials are not configured on the backend.')
      error.statusCode = 503
      throw error
    }
    const response = await fetchImpl(`${text(baseUrl).replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    })
    const raw = await response.text()
    let data = null
    if (raw) {
      try { data = JSON.parse(raw) } catch { data = raw }
    }
    const headers = Object.fromEntries(response.headers.entries())
    if (!response.ok || data?.success === false) {
      const error = new Error(data?.message || data?.msg || data?.error || `ShipGlobal request failed with HTTP ${response.status}.`)
      error.statusCode = response.status >= 400 && response.status < 500 ? response.status : 502
      error.providerResponse = data
      throw error
    }
    return { data, headers, status: response.status }
  }

  return {
    isConfigured: () => configured,
    baseUrl: text(baseUrl),
    addOrder: (payload) => request('/order/add', payload),
    track: (tracking) => request('/tools/tracking', { tracking }),
    cancelRefund: (tracking) => request('/order/cancelRefundOrder', { tracking }),
  }
}

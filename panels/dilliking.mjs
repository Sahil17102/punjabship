import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const text = (value) => String(value ?? '').trim()
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0
const isoDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const EUROPE_CODES = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH'])

const configCandidates = [...new Set([
  process.env.PUNJABSHIP_SHARED_DIR ? resolve(process.env.PUNJABSHIP_SHARED_DIR, 'dilliking.env') : '',
  resolve(process.cwd(), '../shared/dilliking.env'),
  resolve(process.cwd(), '../../../shared/dilliking.env'),
  '/var/www/punjabship/shared/dilliking.env',
].filter(Boolean))]
let configPath = configCandidates[0]
for (const candidate of configCandidates) {
  try {
    const config = readFileSync(candidate, 'utf8')
    configPath = candidate
    for (const line of config.split(/\r?\n/)) {
      const match = line.match(/^\s*(DILLIKING_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^(?:"(.*)"|'(.*)')$/, (_, a, b) => a ?? b)
    }
    break
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

export const dillikingServicesForCountry = (countryCode) => {
  const code = text(countryCode).toUpperCase()
  if (code === 'AU') return ['Australia Direct']
  if (code === 'NZ') return ['New Zealand Direct']
  if (code === 'US') return ['USA DIRECT']
  if (code === 'GB') return ['UK DPD']
  if (code === 'CA') return ['T PURO PAID', 'V PURO PAID']
  if (EUROPE_CODES.has(code)) return ['EU VIA AMS']
  return []
}

export const dillikingCountryName = (countryCode) => {
  const code = text(countryCode).toUpperCase()
  const overrides = { US: 'United States', GB: 'United Kingdom', CZ: 'Czech Republic' }
  if (overrides[code]) return overrides[code]
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code } catch { return code }
}

export const validateDillikingOrder = (order = {}, service = '') => {
  const consignee = order.consignee || {}
  const pickup = order.pickup || {}
  const kyc = order.__dillikingKyc || {}
  const required = [
    ['order number', order.order_number], ['Dilliking service', service],
    ['sender name', pickup.name || pickup.warehouse_name], ['sender phone', pickup.phone],
    ['sender company', pickup.warehouse_name || order.__seller?.companyInfo?.businessName || order.__seller?.company_name],
    ['sender address line 1', pickup.address || pickup.address_line_1], ['sender address line 2', pickup.address_line_2 || pickup.address_2 || pickup.locality],
    ['sender city', pickup.city], ['sender state', pickup.state], ['sender postal code', pickup.pincode],
    ['receiver name', consignee.name], ['receiver phone', consignee.phone], ['receiver email', consignee.email],
    ['receiver company', consignee.company_name || consignee.name], ['receiver address line 1', consignee.address_line_1 || consignee.address],
    ['receiver address line 2', consignee.address_line_2 || consignee.address_2], ['receiver city', consignee.city],
    ['receiver state', consignee.state], ['receiver postal code', consignee.pincode], ['receiver country', consignee.country],
    ['sender KYC type', kyc.type], ['sender KYC number', kyc.number], ['sender KYC filename', kyc.filename], ['sender KYC file', kyc.filedata],
  ]
  const missing = required.filter(([, value]) => !text(value)).map(([label]) => label)
  for (const [label, value] of [['weight', order.package_weight], ['length', order.package_length], ['breadth', order.package_breadth], ['height', order.package_height]]) {
    if (!positive(value)) missing.push(label)
  }
  if (!Array.isArray(order.order_items) || !order.order_items.length) missing.push('invoice items')
  return [...new Set(missing)]
}

const eventDateTime = (date, time) => {
  const digits = text(date).replace(/\D/g, '')
  const timeDigits = text(time).replace(/\D/g, '').padStart(4, '0')
  if (digits.length !== 8) return text(`${date} ${time}`)
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}T${timeDigits.slice(0, 2)}:${timeDigits.slice(2, 4)}:00`
}
const statusFromRemark = (value) => {
  const remark = text(value).toLowerCase()
  if (remark.includes('delivered')) return 'delivered'
  if (remark.includes('out for delivery')) return 'out_for_delivery'
  if (remark.includes('cancel')) return 'cancelled'
  if (remark.includes('transit') || remark.includes('dispatch') || remark.includes('airline') || remark.includes('arrived')) return 'in_transit'
  if (remark.includes('received') || remark.includes('processing') || remark.includes('label')) return 'shipment_created'
  return 'in_transit'
}

export const mapDillikingTracking = (data, order = {}) => {
  const events = Array.isArray(data?.data) ? data.data : []
  const latest = events[0] || {}
  const status = statusFromRemark(latest.remark || order.provider_last_status)
  return {
    id: order.id, order_id: order.order_id || order.id, order_number: order.order_number,
    awb_number: latest.airway_bill || order.awb_number, courier_name: 'Dilliking International', status,
    shipment_info: latest.remark || order.provider_last_status || 'Shipment created',
    history: events.map((event) => ({ status_code: statusFromRemark(event.remark), event_time: eventDateTime(event.event_date, event.event_time), location: text(event.location), message: text(event.remark) })),
    payment_type: order.payment_type || order.order_type || 'prepaid',
  }
}

export const createDillikingClient = ({
  email = process.env.DILLIKING_EMAIL,
  password = process.env.DILLIKING_PASSWORD,
  environment = process.env.DILLIKING_ENVIRONMENT || 'production',
  baseUrl = process.env.DILLIKING_API_BASE_URL,
  pcsType = process.env.DILLIKING_PCS_TYPE || 'SPX',
  fetchImpl = fetch,
} = {}) => {
  const settings = { email: text(email), password: text(password), environment: text(environment).toLowerCase(), baseUrl: text(baseUrl), pcsType: text(pcsType).toUpperCase() }
  let token = ''
  let tokenCreatedAt = 0
  const apiBaseUrl = () => settings.baseUrl || (settings.environment === 'production' ? 'https://api.dilliking.com' : 'https://sandbox.dilliking.com')
  const configured = () => Boolean(settings.email && settings.password)
  const responseData = async (response) => {
    const raw = await response.text()
    let data
    try { data = raw ? JSON.parse(raw) : null } catch { data = raw }
    if (!response.ok || data?.status === false || Number(data?.status) >= 400) throw Object.assign(new Error(data?.message || `Dilliking returned HTTP ${response.status}.`), { statusCode: response.status >= 400 && response.status < 500 ? response.status : 502, providerResponse: data })
    return data
  }
  const login = async (force = false) => {
    if (!configured()) throw Object.assign(new Error('Dilliking email and password are required.'), { statusCode: 400 })
    if (!force && token && Date.now() - tokenCreatedAt < 50 * 60 * 1000) return token
    const response = await fetchImpl(`${apiBaseUrl()}/auth/token`, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ email: settings.email, password: settings.password }), signal: AbortSignal.timeout(30000) })
    const data = await responseData(response)
    token = text(data?.data?.token)
    if (!token) throw Object.assign(new Error('Dilliking login succeeded without returning a token.'), { statusCode: 502, providerResponse: data })
    tokenCreatedAt = Date.now()
    return token
  }
  const authenticatedRequest = async (path, { method = 'GET', body, timeout = 60000 } = {}, retry = true) => {
    const bearer = await login()
    const response = await fetchImpl(`${apiBaseUrl()}${path}`, { method, headers: { Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}), Authorization: `Bearer ${bearer}` }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeout) })
    if (response.status === 401 && retry) { await login(true); return authenticatedRequest(path, { method, body, timeout }, false) }
    return responseData(response)
  }
  const save = () => {
    const values = { DILLIKING_EMAIL: settings.email, DILLIKING_PASSWORD: settings.password, DILLIKING_ENVIRONMENT: settings.environment, DILLIKING_PCS_TYPE: settings.pcsType, ...(settings.baseUrl ? { DILLIKING_API_BASE_URL: settings.baseUrl } : {}) }
    mkdirSync(dirname(configPath), { recursive: true })
    const tempPath = `${configPath}.tmp-${process.pid}`
    writeFileSync(tempPath, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { mode: 0o600 })
    chmodSync(tempPath, 0o600); renameSync(tempPath, configPath); chmodSync(configPath, 0o600)
    for (const [key, value] of Object.entries(values)) process.env[key] = value
  }
  const configure = async (next = {}) => {
    const previous = { ...settings }
    Object.assign(settings, { email: text(next.email) || settings.email, password: text(next.password) || settings.password, environment: text(next.environment || settings.environment || 'production').toLowerCase(), pcsType: text(next.pcsType || settings.pcsType || 'SPX').toUpperCase(), baseUrl: text(next.baseUrl) || settings.baseUrl })
    if (!['sandbox', 'production'].includes(settings.environment)) throw Object.assign(new Error('Dilliking environment must be sandbox or production.'), { statusCode: 400 })
    if (!['SPX', 'DOX'].includes(settings.pcsType)) throw Object.assign(new Error('Dilliking PCS type must be SPX or DOX.'), { statusCode: 400 })
    token = ''
    try { await login(true); save() } catch (error) { Object.assign(settings, previous); token = ''; throw error }
    return true
  }
  const createAwb = async (order, service) => {
    const consignee = order.consignee || {}; const pickup = order.pickup || {}; const seller = order.__seller || {}; const kyc = order.__dillikingKyc || {}
    const weightKg = number(order.package_weight) / 1000
    const payload = {
      invoice_date: text(order.invoice_date || isoDate()), destination_country: text(consignee.country), service: text(service), pcs_type: settings.pcsType,
      reference_no: text(order.invoice_no || order.order_number), third_party_label: false,
      kyc1: { kyc_type: Number(kyc.type), kyc_number: text(kyc.number), kyc_filename: text(kyc.filename), kyc_filedata: text(kyc.filedata) },
      shipper: { name: text(pickup.name || pickup.warehouse_name), phone_no: text(pickup.phone), company_name: text(pickup.warehouse_name || seller.companyInfo?.businessName || seller.company_name || pickup.name), address1: text(pickup.address || pickup.address_line_1), address2: text(pickup.address_line_2 || pickup.address_2 || pickup.locality), city: text(pickup.city), state: text(pickup.state), zip_code: text(pickup.pincode) },
      consignee: { name: text(consignee.name), phone_no: text(consignee.phone), email: text(consignee.email), company_name: text(consignee.company_name || consignee.name), address1: text(consignee.address_line_1 || consignee.address), address2: text(consignee.address_line_2 || consignee.address_2), city: text(consignee.city), state: text(consignee.state || 'NA'), zip_code: text(consignee.pincode), country: text(consignee.country) },
      boxes: [{ boxno: 1, actualwt: weightKg, bookinglength: number(order.package_length), bookingbreadth: number(order.package_breadth), bookingheight: number(order.package_height) }],
      items: (order.order_items || []).map((item) => { const quantity = Math.max(1, number(item.qty || item.quantity) || 1); const unitRate = number(item.price || item.unit_rate); return { boxno: 1, description: text(item.name || item.product_name), hscode: text(item.hsn || item.hscode), weight: Number((weightKg / Math.max(1, (order.order_items || []).length)).toFixed(3)), quantity, unit_rate: unitRate, sub_total: Number((quantity * unitRate).toFixed(2)) } }),
    }
    const data = await authenticatedRequest('/shipment/awb', { method: 'POST', body: payload, timeout: 120000 })
    const awb = text(data?.data?.AWB || data?.data?.awb || data?.AWB)
    if (!awb) throw Object.assign(new Error('Dilliking accepted the request but did not return an AWB. No PunjabShip shipment was saved.'), { statusCode: 502, providerResponse: data })
    const labelBase64 = text(data?.data?.Label || data?.data?.label).replace(/^data:application\/pdf;base64,/i, '')
    const providerData = data && typeof data === 'object' ? { ...data, data: data.data && typeof data.data === 'object' ? { ...data.data, Label: labelBase64 ? '[stored securely]' : undefined, label: undefined } : data.data } : data
    return { data: providerData, payload: { ...payload, kyc1: { ...payload.kyc1, kyc_filedata: '[redacted]' } }, awb, forwardingNo: text(data?.data?.ForwardingNo), labelBase64 }
  }
  const track = async (awb) => authenticatedRequest(`/tracking?airway_bill=${encodeURIComponent(text(awb))}`)
  return {
    isConfigured: configured, isBookingReady: configured, configure, login, createAwb, track,
    get apiBaseUrl() { return apiBaseUrl() },
    servicesForCountry: dillikingServicesForCountry,
    get defaults() { return { environment: settings.environment, pcsType: settings.pcsType } },
  }
}

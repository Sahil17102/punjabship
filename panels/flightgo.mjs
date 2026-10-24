import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'

const DEFAULT_BASE_URL = 'https://flightgoexpress.com'
const text = (value) => String(value ?? '').trim()
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0
const compactPostal = (value) => text(value).replace(/\s+/g, '').toUpperCase()
const indiaDate = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(value)
  const part = (type) => parts.find((item) => item.type === type)?.value
  return `${part('day')}-${part('month')}-${part('year')}`
}

try {
  const config = readFileSync(resolve(process.cwd(), '../shared/flightgo.env'), 'utf8')
  for (const line of config.split(/\r?\n/)) {
    const match = line.match(/^\s*(FLIGHTGO_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].replace(/^(?:"(.*)"|'(.*)')$/, (_, a, b) => a ?? b)
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

export const validateFlightGoOrder = (order = {}) => {
  const consignee = order.consignee || {}
  const pickup = order.pickup || {}
  const required = [
    ['order number', order.order_number], ['receiver name', consignee.name], ['receiver phone', consignee.phone],
    ['receiver email', consignee.email], ['receiver address', consignee.address || consignee.address_line_1],
    ['receiver city', consignee.city], ['receiver state', consignee.state], ['receiver postal code', consignee.pincode],
    ['receiver country code', consignee.country_code || order.country_code], ['sender name', pickup.name || pickup.warehouse_name],
    ['sender phone', pickup.phone], ['sender address', pickup.address], ['sender city', pickup.city],
    ['sender state', pickup.state], ['sender postal code', pickup.pincode],
  ]
  const missing = required.filter(([, value]) => !text(value)).map(([label]) => label)
  for (const [label, value] of [['weight', order.package_weight], ['length', order.package_length], ['width', order.package_breadth], ['height', order.package_height]]) {
    if (!positive(value)) missing.push(label)
  }
  if (!Array.isArray(order.order_items) || !order.order_items.length) missing.push('invoice items')
  return [...new Set(missing)]
}

export const createFlightGoClient = ({
  username = process.env.FLIGHTGO_USERNAME,
  password = process.env.FLIGHTGO_PASSWORD,
  apiKey = process.env.FLIGHTGO_API_KEY,
  packageCode = process.env.FLIGHTGO_PACKAGE_CODE || 'NDX',
  environment = process.env.FLIGHTGO_ENVIRONMENT || 'test',
  baseUrl = process.env.FLIGHTGO_API_BASE_URL || DEFAULT_BASE_URL,
  fetchImpl,
} = {}) => {
  const settings = { username: text(username), password: text(password), apiKey: text(apiKey), packageCode: text(packageCode).toUpperCase(), environment: text(environment).toLowerCase(), baseUrl: text(baseUrl).replace(/\/$/, '') }
  const quoteCache = new Map()
  const configured = () => Boolean(settings.username && settings.password && settings.apiKey)
  const authHeaders = () => ({ Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`${settings.username}:${settings.password}`).toString('base64')}` })
  const responseData = async (response) => {
    const raw = await response.text()
    let data
    try { data = raw ? JSON.parse(raw) : null } catch { data = raw }
    if (!response.ok || String(data?.status || '').toLowerCase() === 'error') throw Object.assign(new Error(data?.message || `FlightGo returned HTTP ${response.status}.`), { statusCode: response.status >= 400 && response.status < 500 ? response.status : 502, providerResponse: data })
    return data
  }
  const nodeRequest = (url, options, timeout) => new Promise((resolveRequest, rejectRequest) => {
    const parsed = new URL(url)
    const transport = parsed.protocol === 'http:' ? httpRequest : httpsRequest
    const requestBody = String(options.body || '')
    const requestHandle = transport(parsed, { method: options.method, headers: { ...options.headers, 'Content-Length': Buffer.byteLength(requestBody) } }, (response) => {
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolveRequest({ ok: response.statusCode >= 200 && response.statusCode < 300, status: response.statusCode, text: async () => raw })
      })
    })
    requestHandle.setTimeout(timeout, () => requestHandle.destroy(new Error('FlightGo request timed out.')))
    requestHandle.on('error', rejectRequest)
    requestHandle.end(requestBody)
  })
  const request = async (path, body, method = 'GET', timeout = 60000) => {
    const url = `${settings.baseUrl}${path}`
    const options = { method, headers: authHeaders(), body: JSON.stringify(body) }
    const response = fetchImpl
      ? await fetchImpl(url, { ...options, signal: AbortSignal.timeout(timeout) })
      : await nodeRequest(url, options, timeout)
    return responseData(response)
  }
  const save = () => {
    const filePath = resolve(process.cwd(), '../shared/flightgo.env')
    mkdirSync(dirname(filePath), { recursive: true })
    const values = { FLIGHTGO_USERNAME: settings.username, FLIGHTGO_PASSWORD: settings.password, FLIGHTGO_API_KEY: settings.apiKey, FLIGHTGO_PACKAGE_CODE: settings.packageCode, FLIGHTGO_ENVIRONMENT: settings.environment }
    const tempPath = `${filePath}.tmp-${process.pid}`
    writeFileSync(tempPath, Object.entries(values).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { mode: 0o600 })
    chmodSync(tempPath, 0o600); renameSync(tempPath, filePath); chmodSync(filePath, 0o600)
    for (const [key, value] of Object.entries(values)) process.env[key] = value
  }
  const configure = async (next = {}) => {
    const previous = { ...settings }
    Object.assign(settings, {
      username: text(next.username) || settings.username, password: text(next.password) || settings.password,
      apiKey: text(next.apiKey) || settings.apiKey, packageCode: text(next.packageCode || settings.packageCode || 'NDX').toUpperCase(),
      environment: text(next.environment || settings.environment || 'test').toLowerCase(),
    })
    if (!configured()) throw Object.assign(new Error('FlightGo API username, password, and access key are required.'), { statusCode: 400 })
    if (!['DOC', 'NDX'].includes(settings.packageCode)) throw Object.assign(new Error('FlightGo package code must be DOC or NDX.'), { statusCode: 400 })
    if (!['test', 'production'].includes(settings.environment)) throw Object.assign(new Error('FlightGo environment must be test or production.'), { statusCode: 400 })
    try {
      const result = await request('/api/location/country', { api_key: settings.apiKey })
      if (String(result?.status).toLowerCase() !== 'success' || !Array.isArray(result?.data)) throw new Error(result?.message || 'FlightGo credential verification failed.')
      save()
    } catch (error) { Object.assign(settings, previous); throw error }
    return true
  }
  const lookupZipcode = async (country, postalCode) => {
    const wanted = compactPostal(postalCode)
    const countryCode = text(country).toUpperCase()
    const outwardCode = text(postalCode).split(/\s+/)[0]
    const searches = [...new Set([
      text(postalCode), wanted, outwardCode,
      countryCode === 'CA' ? wanted.slice(0, 3) : '',
      countryCode === 'US' ? wanted.slice(0, 5) : '',
    ].filter(Boolean))]
    for (const search of searches) {
      const data = await request('/api/location/zipcode', { api_key: settings.apiKey, country: countryCode, search })
      const rows = Array.isArray(data?.data) ? data.data : []
      const match = rows.find((row) => {
        const candidate = compactPostal(row.zipcode_name)
        return candidate === wanted || (candidate.length >= 3 && wanted.startsWith(candidate))
      })
      if (match?.zipcode_id) return { id: text(match.zipcode_id), name: text(match.zipcode_name) }
    }
    throw Object.assign(new Error(`FlightGo does not recognize postal code ${text(postalCode)} for ${countryCode}.`), { statusCode: 422 })
  }
  const quoteRates = async (order = {}) => {
    if (!configured()) return []
    const country = text(order.deliveryCountryCode || order.destinationCountryCode || order.country_code || order.consignee?.country_code).toUpperCase()
    if (!country || country === 'IN') return []
    const postalCode = text(order.destination || order.deliveryPincode || order.consignee?.pincode)
    const weightKg = number(order.weight ?? order.package_weight) / 1000
    if (!postalCode || !positive(weightKg)) return []
    const zipcode = await lookupZipcode(country, postalCode)
    const dimensions = [{ units: 'cm', length: String(number(order.length ?? order.package_length) || 1), width: String(number(order.breadth ?? order.width ?? order.package_breadth) || 1), height: String(number(order.height ?? order.package_height) || 1), weightb: String(weightKg) }]
    const data = await request('/api/rates/check', { api_key: settings.apiKey, rate_request: { ship_date: indiaDate(), package_code: settings.packageCode, to_country: country, zipcode_id: zipcode.id, weight: { value: String(weightKg), units: 'kg' }, dimensions } })
    if (String(data?.status).toLowerCase() !== 'success' || !Array.isArray(data?.data)) throw Object.assign(new Error(data?.message || 'FlightGo did not return rate options.'), { statusCode: 422, providerResponse: data })
    const now = Date.now()
    for (const [key, quote] of quoteCache) if (quote.expiresAt <= now) quoteCache.delete(key)
    return data.data.flatMap((item) => {
      const company = item?.company || {}; const rate = item?.rate || {}
      const serviceCode = text(company.service_code); const branchName = text(company.branch_name)
      const total = number(company.total || rate['Grand Total'] || rate.Total); const freight = number(rate.Rate || rate.Total || total)
      if (!serviceCode || !branchName || !positive(total)) return []
      const subtotal = number(rate.Total) || freight; const gstAmount = number(rate['IGST (18%)']) || Math.max(0, total - subtotal)
      const isCod = text(order.payment_type || order.paymentType || order.order_type).toLowerCase() === 'cod'
      const canBook = !isCod
      const quoteId = randomUUID()
      quoteCache.set(quoteId, { serviceCode, branchName, zipcode, country, weightKg, postalCode: compactPostal(postalCode), canBook, expiresAt: now + 15 * 60 * 1000, providerRate: item })
      const displayName = text(company.name) && text(company.name).toLowerCase() !== country.toLowerCase() ? text(company.name) : `FlightGo ${serviceCode}`
      return [{ id: 99004, courier_id: 99004, name: displayName, displayName, integration_type: 'flightgo', serviceProvider: 'flightgo', service_provider: 'flightgo', courier_option_key: `flightgo:${quoteId}`, flightgo_quote_id: quoteId, service: serviceCode, service_code: serviceCode, mode: 'air', rate: freight, courier_cost_estimate: total, total_charges_without_gst: subtotal, gst_percent: 18, gst_amount: gstAmount, total_charges_with_gst: total, total_charges: subtotal, wallet_debit_amount: total, cod_charges: 0, booking_available: canBook, can_book: canBook, booking_blocked_reason: canBook ? null : 'FlightGo international API does not document COD collection. Use prepaid for this shipment.', provider_serviceability: { provider: 'FlightGo Express', service: serviceCode, booking_available: canBook, can_book: canBook }, approxZone: { code: country, name: country } }]
    })
  }
  const resolveQuote = (quoteId, order = {}) => {
    const quote = quoteCache.get(text(quoteId))
    if (!quote || quote.expiresAt <= Date.now()) throw Object.assign(new Error('FlightGo quote expired. Refresh courier rates and select a service again.'), { statusCode: 409 })
    const country = text(order.consignee?.country_code || order.country_code).toUpperCase()
    const postalCode = compactPostal(order.consignee?.pincode)
    const weightKg = number(order.package_weight) / 1000
    if (quote.country !== country || quote.postalCode !== postalCode || Math.abs(quote.weightKg - weightKg) > 0.0001) throw Object.assign(new Error('Shipment details changed after the FlightGo quote. Refresh rates before booking.'), { statusCode: 409 })
    if (!quote.canBook) throw Object.assign(new Error('This FlightGo quote is not bookable.'), { statusCode: 409 })
    quoteCache.delete(text(quoteId)); return quote
  }
  const createLabel = async (order, quote) => {
    const consignee = order.consignee || {}; const pickup = order.pickup || {}; const seller = order.__seller || {}
    const items = Array.isArray(order.order_items) ? order.order_items : []; const weightKg = number(order.package_weight) / 1000; const date = indiaDate()
    const payload = { api_key: settings.apiKey, label_request: { ship_date: date, package_code: settings.packageCode, to_country: quote.country, zipcode_id: quote.zipcode.id, service_code: quote.serviceCode, branch_name: quote.branchName, invoice_date: date, invoice_currency: text(order.currency_code || 'INR').toUpperCase(), invoice_no: text(order.invoice_no || order.order_number), advanced_options: { custom_field1: text(order.order_number), custom_field2: '' }, ship_to: { company: text(consignee.company_name || consignee.name), name: text(consignee.name), phone: text(consignee.phone), email: text(consignee.email), street1: text(consignee.address_line_1 || consignee.address), street2: text(consignee.address_line_2 || consignee.address_2), street3: text(consignee.landmark), city: text(consignee.city), state: text(consignee.state), postal_code: text(consignee.pincode), country: quote.country }, ship_from: { company: text(pickup.warehouse_name || seller.company_name || pickup.name), name: text(pickup.name || pickup.warehouse_name), phone: text(pickup.phone), email: text(seller.email), street1: text(pickup.address), street2: text(pickup.address_line_2 || pickup.locality), street3: text(pickup.landmark), city: text(pickup.city), state: text(pickup.state), postal_code: text(pickup.pincode), country: text(pickup.country_code || 'IN').toUpperCase(), ...(text(pickup.document_type) && text(pickup.document_no) ? { document_type: text(pickup.document_type), document_no: text(pickup.document_no) } : {}) }, weight: { value: String(weightKg), units: 'KG' }, dimensions: [{ units: 'cm', length: String(order.package_length), width: String(order.package_breadth), height: String(order.package_height), weightb: String(weightKg) }], custom_invoice: items.map((item) => ({ box_no: '1', nondg: '0', product_name: text(item.name), quantity: String(Math.max(1, number(item.qty || item.quantity) || 1)), price: String(number(item.price)), hsn_code: text(item.hsn), units: text(order.currency_code || 'INR').toUpperCase(), p_weight: String(weightKg / Math.max(1, items.length)), uom: text(item.unit || 'PCS') })) } }
    const data = await request('/api/labels/create', payload, 'POST', 120000)
    const roots = [data, data?.data, data?.result, data?.label, data?.data?.label].filter(Boolean)
    const awb = text(roots.map((root) => root.awb_no || root.awb || root.tracking_no || root.tracking_number || root.airway_bill_number).find(Boolean))
    if (!awb) throw Object.assign(new Error('FlightGo accepted the label request but did not return an AWB. No PunjabShip shipment was saved; verify the response with FlightGo support.'), { statusCode: 502, providerResponse: data })
    const labelUrl = text(roots.map((root) => root.label_url || root.label || root.pdf_url || root.download_url).find((value) => /^https?:\/\//i.test(text(value))))
    return { data, payload, awb, labelUrl }
  }
  return { isConfigured: configured, isBookingReady: configured, configure, quoteRates, resolveQuote, createLabel, apiBaseUrl: settings.baseUrl, defaults: { packageCode: settings.packageCode, environment: settings.environment } }
}

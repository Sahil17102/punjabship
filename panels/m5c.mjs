import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import http from 'node:http'
import https from 'node:https'

const text = (value) => String(value ?? '').trim()
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0
const DEFAULT_BASE_URL = 'https://apiv2.m5clogs.com'
const EUROPE_CODES = new Set(['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IE', 'IT', 'LV', 'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH'])

const configCandidates = [...new Set([
  process.env.PUNJABSHIP_SHARED_DIR ? resolve(process.env.PUNJABSHIP_SHARED_DIR, 'm5c.env') : '',
  resolve(process.cwd(), '../shared/m5c.env'),
  resolve(process.cwd(), '../../../shared/m5c.env'),
  '/var/www/punjabship/shared/m5c.env',
].filter(Boolean))]
let configPath = configCandidates[0]
for (const candidate of configCandidates) {
  try {
    const config = readFileSync(candidate, 'utf8')
    configPath = candidate
    for (const line of config.split(/\r?\n/)) {
      const match = line.match(/^\s*(M5C_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (!match || process.env[match[1]]) continue
      process.env[match[1]] = match[2].replace(/^(?:"(.*)"|'(.*)')$/, (_, a, b) => a ?? b)
    }
    break
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
}

const requestWithBody = (url, { method = 'POST', body, timeout = 60000 } = {}) => new Promise((resolveRequest, rejectRequest) => {
  const target = new URL(url)
  const payload = body === undefined ? '' : JSON.stringify(body)
  const client = target.protocol === 'http:' ? http : https
  const request = client.request(target, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }),
    },
  }, (response) => {
    const chunks = []
    response.on('data', (chunk) => chunks.push(chunk))
    response.on('end', () => resolveRequest({
      ok: Number(response.statusCode) >= 200 && Number(response.statusCode) < 300,
      status: Number(response.statusCode || 0),
      text: async () => Buffer.concat(chunks).toString('utf8'),
    }))
  })
  request.setTimeout(timeout, () => request.destroy(new Error('M5C request timed out.')))
  request.on('error', rejectRequest)
  if (payload) request.write(payload)
  request.end()
})

const sectorForCountry = (countryCode) => {
  const code = text(countryCode).toUpperCase()
  if (code === 'CA') return 'CANADA'
  if (code === 'AU') return 'AUSTRALIA'
  if (code === 'GB') return 'UK'
  if (code === 'US') return 'USA'
  if (EUROPE_CODES.has(code)) return 'EUROPE'
  return ''
}

export const m5cServicesForCountry = (services, countryCode) => {
  const sector = sectorForCountry(countryCode)
  if (!sector) return []
  return (Array.isArray(services) ? services : [])
    .filter((service) => text(service.Sector || service.sector).toUpperCase() === sector)
    .map((service) => ({
      code: text(service.Code || service.code),
      name: text(service.Name || service.name),
      sector,
    }))
    .filter((service) => service.code && service.name)
}

const packagesForOrder = (order) => {
  if (Array.isArray(order.boxes) && order.boxes.length) {
    return order.boxes.flatMap((box) => Array.from({ length: Math.max(1, Math.floor(number(box.quantity) || 1)) }, () => ({
      Length: number(box.lengthCm).toFixed(2),
      Width: number(box.breadthCm).toFixed(2),
      Height: number(box.heightCm).toFixed(2),
      Pcs: '1',
      PcsWeight: number(box.weightKg).toFixed(3),
    })))
  }
  return [{
    Length: number(order.package_length).toFixed(2),
    Width: number(order.package_breadth).toFixed(2),
    Height: number(order.package_height).toFixed(2),
    Pcs: '1',
    PcsWeight: (number(order.package_weight) / 1000).toFixed(3),
  }]
}

const itemsForOrder = (order) => {
  const items = Array.isArray(order.order_items) ? order.order_items : []
  if (items.length) return items.map((item, index) => {
    const quantity = Math.max(1, number(item.qty || item.quantity) || 1)
    const rate = number(item.price || item.unit_rate)
    return {
      Box: String(index + 1), Content: text(item.name || item.product_name || 'Commercial goods'),
      HSNCode: text(item.hsn || item.hscode), Qty: String(quantity), Rate: rate.toFixed(2), Amt: (quantity * rate).toFixed(2),
    }
  })
  const invoices = Array.isArray(order.invoices) ? order.invoices : []
  return [{
    Box: '1', Content: text(order.shipment_content || order.goods_description || 'Commercial goods'),
    HSNCode: text(order.hsn_code), Qty: String(Math.max(1, packagesForOrder(order).length)),
    Rate: number(invoices[0]?.invoiceValue || order.order_amount).toFixed(2),
    Amt: number(invoices.reduce((sum, invoice) => sum + number(invoice.invoiceValue), 0) || order.order_amount).toFixed(2),
  }]
}

export const mapPunjabShipOrderToM5C = (order, defaults = {}) => {
  const pickup = order.pickup || {}
  const consignee = order.consignee || {}
  const seller = order.__seller || {}
  const packages = packagesForOrder(order)
  const actualWeight = packages.reduce((sum, item) => sum + number(item.PcsWeight), 0)
  const items = itemsForOrder(order)
  const configuredKyc = text(defaults.kycNumber)
  const gstin = text(pickup.gst_number || pickup.gstNumber || seller.domesticKyc?.gstin || seller.companyInfo?.gstNumber)
  const pan = text(seller.domesticKyc?.panNumber)
  const kycNumber = configuredKyc || gstin || pan
  const kycType = text(defaults.kycType) || (configuredKyc ? 'GST Number' : gstin ? 'GST Number' : 'PAN Number')
  const invoice = order.invoices?.[0] || {}
  const invoiceValue = number(order.order_amount || invoice.invoiceValue || items.reduce((sum, item) => sum + number(item.Amt), 0))
  return {
    ReferenceNumber: text(order.order_number), ThirdPartyLabel: false,
    ConsignorName: text(pickup.name || pickup.contactName || pickup.warehouse_name),
    ConsignorContactPerson: text(pickup.name || pickup.contactName || pickup.warehouse_name),
    ConsignorAddressLine1: text(pickup.address || pickup.address_line_1 || pickup.addressLine1),
    ConsignorAddressLine2: text(pickup.address_line_2 || pickup.address_2 || pickup.addressLine2 || pickup.locality || pickup.city),
    ConsignorCity: text(pickup.city), ConsignorPostCode: text(pickup.pincode || pickup.zip_code),
    ConsignorState: text(pickup.state), ConsignorPhoneNo: text(pickup.phone || pickup.contactPhone || pickup.contactNumber),
    KYCType: kycType, KYCNo: kycNumber,
    ConsigneeName: text(consignee.name), ConsigneeContactPerson: text(consignee.contact_person || consignee.name),
    ConsigneeAddressLine1: text(consignee.address_line_1 || consignee.address),
    ConsigneeAddressLine2: text(consignee.address_line_2 || consignee.address_2 || consignee.locality || consignee.city),
    ConsigneeCity: text(consignee.city), ConsigneeZipCode: text(consignee.pincode), ConsigneeState: text(consignee.state || 'NA'),
    ConsigneeCountry: text(consignee.country), ConsigneePhoneNo: text(consignee.phone), ConsigneeEmaild: text(consignee.email),
    ServiceCode: text(order.__m5cServiceCode), GoodsDesc: text(defaults.goodsDescription || order.goods_description || 'NDox'),
    NumofItems: String(packages.length), ActWeight: actualWeight.toFixed(3), VolWeights: packages,
    CustomsValue: invoiceValue.toFixed(2), CustomsCurrencyCode: text(order.currency_code || defaults.currencyCode || 'INR'),
    ExportInvno: text(invoice.invoiceNumber || order.invoice_no || order.order_number), Handling: text(defaults.handling || 'N'),
    CSB: Number(order.csb5_status || 0) === 1 ? 'Y' : 'N', Descriptions: items,
    ShipmentContent: text(order.shipment_content || items[0]?.Content || 'Commercial goods'),
    HSNCode: text(order.hsn_code || items.find((item) => item.HSNCode)?.HSNCode),
    ShipperKYC: '', FileName: '', FileExt: '', OTP: text(order.m5c_otp || ''),
  }
}

export const validateM5COrder = (payload = {}) => {
  const required = [
    'ReferenceNumber', 'ConsignorName', 'ConsignorContactPerson', 'ConsignorAddressLine1', 'ConsignorAddressLine2',
    'ConsignorCity', 'ConsignorPostCode', 'ConsignorState', 'ConsignorPhoneNo', 'KYCType', 'KYCNo',
    'ConsigneeName', 'ConsigneeContactPerson', 'ConsigneeAddressLine1', 'ConsigneeAddressLine2', 'ConsigneeCity',
    'ConsigneeZipCode', 'ConsigneeState', 'ConsigneeCountry', 'ConsigneePhoneNo', 'ConsigneeEmaild', 'ServiceCode',
    'GoodsDesc', 'CustomsValue', 'CustomsCurrencyCode', 'ExportInvno', 'ShipmentContent',
  ]
  const missing = required.filter((key) => !text(payload[key]))
  if (!positive(payload.ActWeight)) missing.push('ActWeight')
  if (!Array.isArray(payload.VolWeights) || !payload.VolWeights.length) missing.push('VolWeights')
  else for (const [index, pkg] of payload.VolWeights.entries()) {
    for (const key of ['Length', 'Width', 'Height', 'Pcs', 'PcsWeight']) if (!positive(pkg[key])) missing.push(`VolWeights.${index}.${key}`)
  }
  if (!Array.isArray(payload.Descriptions) || !payload.Descriptions.length) missing.push('Descriptions')
  return [...new Set(missing)]
}

const nestedObjects = function* (value) {
  if (!value || typeof value !== 'object') return
  yield value
  for (const child of Array.isArray(value) ? value : Object.values(value)) yield* nestedObjects(child)
}

export const extractM5CShipment = (data) => {
  let awb = ''
  let label = ''
  let status = ''
  let description = ''
  for (const item of nestedObjects(data)) {
    awb ||= text(item.AWBNo || item.AwbNo || item.Awbno || item.awb_no || item.AWB || item.TrackingNo || item.tracking_no)
    label ||= text(item.Label || item.label || item.FileData || item.file_data)
    status ||= text(item.Status || item.status)
    description ||= text(item.Description || item.description || item.Message || item.message)
  }
  return { awb: awb || null, label: label.replace(/^data:application\/pdf;base64,/i, '') || null, status: status || null, description: description || null }
}

export const createM5CClient = ({
  accountCode = process.env.M5C_ACCOUNT_CODE,
  username = process.env.M5C_USERNAME,
  password = process.env.M5C_PASSWORD,
  accessKey = process.env.M5C_ACCESS_KEY,
  baseUrl = process.env.M5C_API_BASE_URL || DEFAULT_BASE_URL,
  kycType = process.env.M5C_KYC_TYPE,
  kycNumber = process.env.M5C_KYC_NUMBER,
  goodsDescription = process.env.M5C_GOODS_DESCRIPTION || 'NDox',
  currencyCode = process.env.M5C_CURRENCY || 'INR',
  fetchImpl = null,
} = {}) => {
  const settings = {
    accountCode: text(accountCode), username: text(username), password: text(password), accessKey: text(accessKey),
    baseUrl: text(baseUrl).replace(/\/+$/, ''), kycType: text(kycType), kycNumber: text(kycNumber),
    goodsDescription: text(goodsDescription), currencyCode: text(currencyCode),
  }
  let serviceCache = []
  let serviceCacheAt = 0
  const configured = () => Boolean(settings.accountCode && settings.username && settings.password && settings.accessKey)
  const responseData = async (response) => {
    const raw = await response.text()
    let data = null
    try { data = raw ? JSON.parse(raw) : null } catch { data = raw }
    if (!response.ok) throw Object.assign(new Error(data?.ExceptionMessage || data?.Message || `M5C returned HTTP ${response.status}.`), { statusCode: response.status >= 400 && response.status < 500 ? response.status : 502, providerResponse: data })
    return data
  }
  const request = async (path, { method = 'POST', body, timeout = 60000 } = {}) => {
    const response = fetchImpl
      ? await fetchImpl(`${settings.baseUrl}${path}`, { method, headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      : await requestWithBody(`${settings.baseUrl}${path}`, { method, body, timeout })
    return responseData(response)
  }
  const listServices = async (force = false) => {
    if (!settings.accountCode) throw Object.assign(new Error('M5C account code is required.'), { statusCode: 400 })
    if (!force && serviceCache.length && Date.now() - serviceCacheAt < 60 * 60 * 1000) return serviceCache
    const result = await request('/api/GetService/GetServiceList', { method: 'GET', body: { AccountCode: settings.accountCode }, timeout: 30000 })
    if (!Array.isArray(result) || !result.length) throw Object.assign(new Error('M5C did not return any services for this account.'), { statusCode: 422, providerResponse: result })
    serviceCache = result.map((item) => ({ Code: text(item.Code), Name: text(item.Name), Sector: text(item.Sector).toUpperCase() })).filter((item) => item.Code && item.Name && item.Sector)
    serviceCacheAt = Date.now()
    return serviceCache
  }
  const save = () => {
    const values = {
      M5C_ACCOUNT_CODE: settings.accountCode, M5C_USERNAME: settings.username, M5C_PASSWORD: settings.password,
      M5C_ACCESS_KEY: settings.accessKey, M5C_API_BASE_URL: settings.baseUrl,
      M5C_KYC_TYPE: settings.kycType, M5C_KYC_NUMBER: settings.kycNumber,
      M5C_GOODS_DESCRIPTION: settings.goodsDescription, M5C_CURRENCY: settings.currencyCode,
    }
    mkdirSync(dirname(configPath), { recursive: true })
    const temporary = `${configPath}.tmp-${process.pid}`
    writeFileSync(temporary, Object.entries(values).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join('\n') + '\n', { mode: 0o600 })
    chmodSync(temporary, 0o600); renameSync(temporary, configPath); chmodSync(configPath, 0o600)
    for (const [key, value] of Object.entries(values)) if (value) process.env[key] = value
  }
  const configure = async (next = {}) => {
    const previous = { ...settings }
    Object.assign(settings, {
      accountCode: text(next.accountCode) || settings.accountCode, username: text(next.username) || settings.username,
      password: text(next.password) || settings.password, accessKey: text(next.accessKey) || settings.accessKey,
      baseUrl: text(next.baseUrl).replace(/\/+$/, '') || settings.baseUrl,
      kycType: text(next.kycType) || settings.kycType, kycNumber: text(next.kycNumber) || settings.kycNumber,
      goodsDescription: text(next.goodsDescription) || settings.goodsDescription, currencyCode: text(next.currencyCode) || settings.currencyCode,
    })
    if (!configured()) { Object.assign(settings, previous); throw Object.assign(new Error('M5C account code, username, password and access key are required.'), { statusCode: 400 }) }
    serviceCache = []
    try { await listServices(true); save() } catch (error) { Object.assign(settings, previous); serviceCache = []; throw error }
    return true
  }
  const createShipment = async (order) => {
    if (!configured()) throw Object.assign(new Error('M5C production credentials are not configured.'), { statusCode: 503 })
    const shipment = mapPunjabShipOrderToM5C(order, settings)
    const missing = validateM5COrder(shipment)
    if (missing.length) throw Object.assign(new Error(`Missing M5C fields: ${missing.join(', ')}`), { statusCode: 400, missingFields: missing })
    const payload = { ValidateAccount: [{ AccountCode: settings.accountCode, Username: settings.username, Password: settings.password, AccessKey: settings.accessKey }], Shipment: [shipment] }
    const data = await request('/api/shipping/AddShipment', { method: 'POST', body: payload, timeout: 120000 })
    const extracted = extractM5CShipment(data)
    if (extracted.status && /fail|error|reject/i.test(extracted.status)) throw Object.assign(new Error(extracted.description || 'M5C rejected the shipment.'), { statusCode: 422, providerResponse: data })
    return { data, shipment, ...extracted }
  }
  return {
    isConfigured: configured, isBookingReady: configured, configure, listServices, createShipment,
    servicesForCountry: async (countryCode) => m5cServicesForCountry(await listServices(), countryCode),
    get apiBaseUrl() { return settings.baseUrl },
    get defaults() { return { kycType: settings.kycType, kycNumberConfigured: Boolean(settings.kycNumber), goodsDescription: settings.goodsDescription, currencyCode: settings.currencyCode } },
  }
}

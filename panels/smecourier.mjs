import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_BASE_URL = 'https://portal.smecourier.in'
const text = (value) => String(value ?? '').trim()
const first = (...values) => values.find((value) => text(value))

// On the VPS, keep provider secrets in PunjabShip's shared folder so they
// survive immutable release swaps without storing secrets in PM2's global dump.
try {
  const config = readFileSync(resolve(process.cwd(), '../shared/smecourier.env'), 'utf8')
  for (const line of config.split(/\r?\n/)) {
    const match = line.match(/^\s*(SMECOURIER_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match || process.env[match[1]]) continue
    const value = match[2].replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted)
    process.env[match[1]] = value
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

export const mapPunjabShipOrderToSME = (order, defaults = {}) => {
  const pickup = order?.pickup || {}
  const consignee = order?.consignee || {}
  const seller = order?.__seller || {}
  const items = Array.isArray(order?.order_items) ? order.order_items : []
  const totalItemWeight = Number(order.package_weight || 0)
  const itemTotal = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || item.quantity || 1), 0)
  return {
    Username: defaults.username,
    ShipmentType: first(order.shipment_type, defaults.shipmentType, 'NDox'),
    ServiceCode: first(order.service, defaults.serviceCode),
    ...(defaults.fedexAccountId ? { FedexAccountID: Number(defaults.fedexAccountId) } : {}),
    TrackingNo: text(order.order_number),
    ConsigneeName: first(consignee.company_name, consignee.name),
    ConsigneeContactPerson: first(consignee.name, consignee.company_name),
    ConsigneeAddressLine1: first(consignee.address_line_1, consignee.address),
    ConsigneeAddressLine2: first(consignee.address_line_2, consignee.address_2),
    ConsigneeAddressLine3: text(consignee.landmark),
    ConsigneeCity: text(consignee.city),
    ConsigneeZipCode: text(consignee.pincode),
    ConsigneeState: text(consignee.state),
    ConsigneePhoneNo: text(consignee.phone),
    ConsigneeEmail: text(consignee.email),
    ConsigneeCountryCode: text(consignee.country_code || order.country_code).toUpperCase(),
    ConsignorName: first(pickup.name, pickup.warehouse_name, seller.name),
    ConsignorCompanyName: first(pickup.warehouse_name, seller.company_name, pickup.name),
    ConsignorAddressLine1: text(pickup.address),
    ConsignorAddressLine2: text(pickup.address_2),
    ConsignorAddressLine3: text(pickup.landmark),
    ConsignorCity: text(pickup.city),
    ConsignorPostCode: text(pickup.pincode),
    ConsignorState: text(pickup.state),
    ConsignorPhoneNo: text(pickup.phone),
    ConsignorEmail: text(seller.email),
    ConsignorCountryCode: text(pickup.country_code || 'IN').toUpperCase(),
    DocType: first(defaults.docType, 'GSTIN'),
    DocValue: first(defaults.docValue, pickup.gst_number, seller.gstin, seller.gstNumber),
    ConsignorRef: text(order.order_number),
    ShipContents: items.map((item) => text(item.name)).filter(Boolean).join(', '),
    CurrencyCode: first(order.currency_code, defaults.currencyCode, 'INR').toUpperCase(),
    DutiableDeclaredvalue: Number(order.order_amount || itemTotal),
    DutiableDeclaredCurrency: first(order.currency_code, defaults.currencyCode, 'INR').toUpperCase(),
    GSTInvNo: first(order.invoice_no, order.order_number),
    GSTInvNoDate: first(order.invoice_date, order.order_date),
    PackageType: first(order.package_type, defaults.packageType),
    Packages: [{
      ...(defaults.packageId ? { PackageID: Number(defaults.packageId) } : {}),
      Actual_Weight: Number(order.package_weight),
      Length: Number(order.package_length), Width: Number(order.package_breadth), Height: Number(order.package_height),
    }],
    Items: items.map((item) => {
      const qty = Number(item.qty || item.quantity || 1)
      const amount = Number(item.price || 0) * qty
      return {
        Qty: qty, BoxNo: 1, Rate: Number(item.price || 0), HSNCode: text(item.hsn),
        Description: text(item.name), Unit: text(item.unit || 'PCS'),
        Weight: items.length === 1 ? totalItemWeight : totalItemWeight / items.length,
        Amount: Number(item.amount || amount), ...(item.igst != null ? { ShipPieceIGST: Number(item.igst) } : {}),
      }
    }),
  }
}

export const validateSMEOrder = (payload) => {
  const required = ['Username', 'ShipmentType', 'ServiceCode', 'ConsigneeName', 'ConsigneeContactPerson', 'ConsigneeAddressLine1', 'ConsigneeCity', 'ConsigneeZipCode', 'ConsigneeState', 'ConsigneePhoneNo', 'ConsigneeCountryCode', 'ConsignorName', 'ConsignorCompanyName', 'ConsignorAddressLine1', 'ConsignorCity', 'ConsignorPostCode', 'ConsignorState', 'ConsignorPhoneNo', 'ConsignorCountryCode', 'DocType', 'DocValue', 'ShipContents', 'CurrencyCode']
  const missing = required.filter((key) => !text(payload[key]))
  if (!payload.Packages?.length) missing.push('Packages')
  else for (const [i, pkg] of payload.Packages.entries()) for (const key of ['Actual_Weight', 'Length', 'Width', 'Height']) if (!(Number(pkg[key]) > 0)) missing.push(`Packages.${i}.${key}`)
  if (!payload.Items?.length) missing.push('Items')
  else for (const [i, item] of payload.Items.entries()) {
    for (const key of ['Qty', 'BoxNo', 'Rate', 'Description', 'Unit', 'Weight', 'Amount']) {
      if (key === 'Description' || key === 'Unit') {
        if (!text(item[key])) missing.push(`Items.${i}.${key}`)
      } else if (!(Number(item[key]) > 0)) missing.push(`Items.${i}.${key}`)
    }
  }
  return [...new Set(missing)]
}

export const extractSMEShipment = (data) => ({
  shipmentId: data?.ShipmentID ?? null,
  trackingNo: text(data?.TrackingNo || data?.FWDNo) || null,
  forwardNo: text(data?.FWDNo) || null,
  label: text(data?.Label) || null,
  invoice: text(data?.Invoice) || null,
})

export const createSMECourierClient = ({
  username = process.env.SMECOURIER_USERNAME,
  password = process.env.SMECOURIER_PASSWORD,
  baseUrl = process.env.SMECOURIER_API_BASE_URL || DEFAULT_BASE_URL,
  serviceCode = process.env.SMECOURIER_SERVICE_CODE || 'INTERNATIONAL PRIORITY',
  shipmentType = process.env.SMECOURIER_SHIPMENT_TYPE || 'NDox',
  docType = process.env.SMECOURIER_DOC_TYPE || 'GSTIN',
  docValue = process.env.SMECOURIER_DOC_VALUE,
  fedexAccountId = process.env.SMECOURIER_FEDEX_ACCOUNT_ID,
  packageId = process.env.SMECOURIER_PACKAGE_ID,
  fetchImpl = fetch,
} = {}) => {
  const settings = { username: text(username), password: text(password), baseUrl: text(baseUrl).replace(/\/$/, ''), serviceCode: text(serviceCode), shipmentType: text(shipmentType), docType: text(docType), docValue: text(docValue), fedexAccountId: text(fedexAccountId), packageId: text(packageId) }
  const configured = Boolean(settings.username && settings.password && settings.serviceCode)
  let token = ''
  let refreshToken = ''
  let tokenExpiresAt = 0
  let loginPromise

  const request = async (path, body, accessToken = '') => {
    const response = await fetchImpl(`${settings.baseUrl}${path}`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.timeout(Number(process.env.SMECOURIER_TIMEOUT_MS || 60000)),
    })
    const raw = await response.text()
    let data = null
    try { data = raw ? JSON.parse(raw) : null } catch { data = raw }
    if (!response.ok) throw Object.assign(new Error(data?.Message || `SME Courier returned HTTP ${response.status}.`), { statusCode: response.status >= 400 && response.status < 500 ? response.status : 502, providerResponse: data })
    return data
  }
  const getToken = async (force = false) => {
    if (!force && token && tokenExpiresAt > Date.now() + 30000) return token
    if (loginPromise) return loginPromise
    loginPromise = (async () => {
      if (!force && refreshToken) {
        try {
          const refreshed = await request('/api/user/refresh', { AccessToken: token, RefreshToken: refreshToken })
          if (refreshed?.AccessToken) {
            token = refreshed.AccessToken; refreshToken = refreshed.RefreshToken || refreshToken
            tokenExpiresAt = Date.now() + Number(refreshed.AccessTokenExpiresInMinutes || 15) * 60000
            return token
          }
        } catch { /* fall through to login when refresh token expires */ }
      }
      const result = await request('/api/user/login', { UserName: settings.username, Password: settings.password })
      if (!result?.Success || !result.AccessToken) throw Object.assign(new Error(result?.Message || 'SME Courier login failed.'), { statusCode: 502, providerResponse: result })
      token = result.AccessToken; refreshToken = result.RefreshToken || ''
      tokenExpiresAt = Date.now() + Number(result.AccessTokenExpiresInMinutes || 15) * 60000
      return token
    })().finally(() => { loginPromise = null })
    return loginPromise
  }
  return {
    isConfigured: () => configured,
    baseUrl: settings.baseUrl,
    serviceCode: settings.serviceCode,
    defaults: { ...settings, password: undefined },
    createShipment: async (payload) => {
      if (!configured) throw Object.assign(new Error('SME Courier credentials and service/document settings are not configured on the backend.'), { statusCode: 503 })
      let accessToken = await getToken()
      let result
      try {
        result = await request('/api/user/Shipment_Create', payload, accessToken)
      } catch (error) {
        if (error.statusCode !== 401) throw error
        tokenExpiresAt = 0
        accessToken = await getToken(true)
        result = await request('/api/user/Shipment_Create', payload, accessToken)
      }
      if (result?.Success === false && /token|auth|expired/i.test(text(result.Message))) {
        tokenExpiresAt = 0; accessToken = await getToken(true)
        result = await request('/api/user/Shipment_Create', payload, accessToken)
      }
      if (!result?.Status) throw Object.assign(new Error(result?.ErrorMessage || result?.Message || 'SME Courier rejected the shipment.'), { statusCode: 422, providerResponse: result })
      return { data: result }
    },
  }
}

import { chmodSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'

const DEFAULT_API_BASE_URL = 'https://skylink.skynetww.com'
const DEFAULT_RATE_BASE_URL = 'https://admin.skylink.skynetww.com'
const text = (value) => String(value ?? '').trim()
const first = (...values) => values.find((value) => text(value))
const amount = (value) => Number.isFinite(Number(value)) ? Number(value) : 0
const validNumber = (value) => Number.isFinite(Number(value)) && Number(value) > 0
const indiaDateTime = () => {
  const now = new Date()
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(now)
  return { date, time }
}
const safeReference = (value) => text(value).replace(/[^a-z0-9]/gi, '').slice(0, 40) || `PS${randomUUID().replace(/-/g, '').slice(0, 24)}`

try {
  const config = readFileSync(resolve(process.cwd(), '../shared/skylink.env'), 'utf8')
  for (const line of config.split(/\r?\n/)) {
    const match = line.match(/^\s*(SKYLINK_[A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
    if (!match || process.env[match[1]]) continue
    const value = match[2].replace(/^(?:"(.*)"|'(.*)')$/, (_, doubleQuoted, singleQuoted) => doubleQuoted ?? singleQuoted)
    process.env[match[1]] = value
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

export const validateSkylinkOrder = (order, settings) => {
  const errors = []
  const consignee = order?.consignee || {}
  const pickup = order?.pickup || {}
  const required = [
    ['tracking/order reference', order?.order_number], ['receiver name', consignee.name],
    ['receiver contact number', consignee.phone], ['receiver email', consignee.email],
    ['receiver address', consignee.address || consignee.address_line_1], ['receiver city', consignee.city],
    ['receiver country', consignee.country_code || order?.country_code], ['receiver postal code', consignee.pincode],
    ['sender name', pickup.name || pickup.warehouse_name], ['sender company', pickup.warehouse_name || order?.__seller?.company_name],
    ['sender contact number', pickup.phone], ['sender email', order?.__seller?.email],
    ['sender address', pickup.address], ['sender city', pickup.city], ['sender state', pickup.state],
    ['sender postal code', pickup.pincode], ['sender GST number', pickup.gst_number || order?.__seller?.gstin || order?.__seller?.gstNumber],
    ['invoice number', order?.invoice_no || order?.order_number], ['Skylink invoice type ID', settings.invoiceTypeId],
  ]
  for (const [label, value] of required) if (!text(value)) errors.push(label)
  for (const [label, value] of [['weight', order?.package_weight], ['length', order?.package_length], ['width', order?.package_breadth], ['height', order?.package_height], ['shipment value', order?.order_amount]]) {
    if (!validNumber(value)) errors.push(label)
  }
  if (!Array.isArray(order?.order_items) || !order.order_items.length) errors.push('invoice items')
  else for (const [index, item] of order.order_items.entries()) {
    if (!text(item.name)) errors.push(`invoice item ${index + 1} description`)
    if (!text(item.hsn)) errors.push(`invoice item ${index + 1} HSN code`)
    if (!validNumber(item.qty || item.quantity || 1)) errors.push(`invoice item ${index + 1} quantity`)
    if (!validNumber(item.price)) errors.push(`invoice item ${index + 1} rate`)
  }
  return [...new Set(errors)]
}

export const createSkylinkClient = ({
  email = process.env.SKYLINK_EMAIL,
  password = process.env.SKYLINK_PASSWORD,
  rateUsername = process.env.SKYLINK_RATE_USERNAME,
  ratePassword = process.env.SKYLINK_RATE_PASSWORD,
  customerCode = process.env.SKYLINK_CUSTOMER_CODE,
  companyId = process.env.SKYLINK_COMPANY_ID || '3',
  rateOriginCode = process.env.SKYLINK_RATE_ORIGIN_CODE,
  productCode = process.env.SKYLINK_PRODUCT_CODE || 'NONDOX',
  invoiceTypeId = process.env.SKYLINK_FREE_FORM_INVOICE_TYPE_ID || '1',
  termsOfTrade = process.env.SKYLINK_TERMS_OF_TRADE || 'DDU',
  invoiceNoteCode = process.env.SKYLINK_INVOICE_NOTE_CODE || 'COMMERCIAL',
  apiBaseUrl = process.env.SKYLINK_API_BASE_URL || DEFAULT_API_BASE_URL,
  rateBaseUrl = process.env.SKYLINK_RATE_BASE_URL || DEFAULT_RATE_BASE_URL,
  fetchImpl = fetch,
} = {}) => {
  const settings = {
    email: text(email), password: text(password), rateUsername: text(rateUsername), ratePassword: text(ratePassword),
    customerCode: text(customerCode), companyId: text(companyId), rateOriginCode: text(rateOriginCode),
    productCode: text(productCode).toUpperCase(), invoiceTypeId: text(invoiceTypeId),
    termsOfTrade: text(termsOfTrade).toUpperCase(), invoiceNoteCode: text(invoiceNoteCode).toUpperCase(),
    apiBaseUrl: text(apiBaseUrl).replace(/\/$/, ''), rateBaseUrl: text(rateBaseUrl).replace(/\/$/, ''),
  }
  const configured = () => Boolean(settings.email && settings.password && settings.customerCode && settings.companyId)
  const bookingReady = () => configured() && /^\d+$/.test(settings.invoiceTypeId)
  const quoteCache = new Map()

  const responseData = async (response) => {
    const raw = await response.text()
    let data = null
    try { data = raw ? JSON.parse(raw) : null } catch { data = raw }
    if (!response.ok) throw Object.assign(new Error(data?.message || data?.errors?.[0] || `Skylink returned HTTP ${response.status}.`), { statusCode: response.status >= 400 && response.status < 500 ? response.status : 502, providerResponse: data })
    return data
  }
  const requestToken = async () => {
    const response = await fetchImpl(`${settings.apiBaseUrl}/docket_api/get_token`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: settings.email, password: settings.password }), signal: AbortSignal.timeout(60000),
    })
    const data = await responseData(response)
    const token = text(data?.data?.token || data?.token)
    const customerId = Number(data?.data?.customer_id || data?.customer_id)
    if (!data?.success || !token || !Number.isInteger(customerId) || customerId <= 0) {
      throw Object.assign(new Error(data?.errors?.[0] || 'Skylink login did not return a valid bearer token and customer ID.'), { statusCode: 422, providerResponse: data })
    }
    return { token, customerId }
  }
  const configure = async (next = {}) => {
    const nextSettings = {
      email: text(next.email) || settings.email,
      password: text(next.password) || settings.password,
      rateUsername: text(next.rateUsername) || settings.rateUsername, ratePassword: text(next.ratePassword) || settings.ratePassword,
      customerCode: text(next.customerCode) || settings.customerCode,
      companyId: text(next.companyId) || settings.companyId || '3',
      rateOriginCode: text(next.rateOriginCode) || settings.rateOriginCode, productCode: text(next.productCode || settings.productCode || 'NONDOX').toUpperCase(),
      invoiceTypeId: text(next.invoiceTypeId) || settings.invoiceTypeId, termsOfTrade: text(next.termsOfTrade || settings.termsOfTrade || 'DDU').toUpperCase(),
      invoiceNoteCode: text(next.invoiceNoteCode || 'COMMERCIAL').toUpperCase(),
    }
    if (!nextSettings.email || !nextSettings.password || !nextSettings.customerCode || !/^\d+$/.test(nextSettings.companyId)) {
      throw Object.assign(new Error('Email, password, customer code, and a numeric API company ID are required.'), { statusCode: 400 })
    }
    if (!['DOX', 'NONDOX'].includes(nextSettings.productCode)) throw Object.assign(new Error('Product code must be DOX or NONDOX.'), { statusCode: 400 })
    if (!['DDU', 'DDP'].includes(nextSettings.termsOfTrade)) throw Object.assign(new Error('Terms of trade must be DDU or DDP.'), { statusCode: 400 })
    if (!['GIFT', 'SAMPLE', 'COMMERCIAL'].includes(nextSettings.invoiceNoteCode)) throw Object.assign(new Error('Invoice purpose must be GIFT, SAMPLE, or COMMERCIAL.'), { statusCode: 400 })

    const previous = { ...settings }
    Object.assign(settings, nextSettings)
    try { await requestToken() } catch (error) { Object.assign(settings, previous); throw error }
    const filePath = resolve(process.cwd(), '../shared/skylink.env')
    mkdirSync(dirname(filePath), { recursive: true })
    const values = {
      SKYLINK_EMAIL: settings.email, SKYLINK_PASSWORD: settings.password,
      SKYLINK_RATE_USERNAME: settings.rateUsername, SKYLINK_RATE_PASSWORD: settings.ratePassword,
      SKYLINK_CUSTOMER_CODE: settings.customerCode, SKYLINK_COMPANY_ID: settings.companyId,
      SKYLINK_RATE_ORIGIN_CODE: settings.rateOriginCode, SKYLINK_PRODUCT_CODE: settings.productCode,
      SKYLINK_FREE_FORM_INVOICE_TYPE_ID: settings.invoiceTypeId, SKYLINK_TERMS_OF_TRADE: settings.termsOfTrade,
      SKYLINK_INVOICE_NOTE_CODE: settings.invoiceNoteCode,
    }
    const contents = Object.entries(values).filter(([, value]) => value !== '').map(([key, value]) => `${key}=${value}`).join('\n') + '\n'
    const tempPath = `${filePath}.tmp-${process.pid}`
    writeFileSync(tempPath, contents, { mode: 0o600 })
    chmodSync(tempPath, 0o600)
    renameSync(tempPath, filePath)
    chmodSync(filePath, 0o600)
    for (const key of Object.keys(values)) process.env[key] = values[key]
    for (const key of Object.keys(values)) if (!values[key]) delete process.env[key]
    return true
  }

  const quoteRates = async (order) => {
    if (!configured()) return []
    const originCode = first(settings.rateOriginCode, order?.origin, order?.pickupPincode, order?.pickup_pincode)
    const destinationCode = first(order?.deliveryCountryCode, order?.destinationCountryCode, order?.destination_country_code, order?.consignee?.country_code, 'IN').toUpperCase()
    // PunjabShip's B2C form and create-order payload express package weight in grams;
    // Skylink's customer_rate_cals endpoint expects kilograms.
    const weightKg = amount(order?.weight ?? order?.package_weight) / 1000
    const pieces = Math.max(1, Math.floor(amount(order?.pcs || order?.pieces) || 1))
    if (!originCode || !destinationCode || !validNumber(weightKg)) return []
    const { date } = indiaDateTime()
    const form = new FormData()
    form.set('product_code', settings.productCode)
    form.set('destination_code', destinationCode)
    form.set('booking_date', date)
    form.set('origin_code', originCode)
    form.set('pcs', String(pieces))
    form.set('actual_weight', String(weightKg))
    form.set('customer_code', settings.customerCode)
    form.set('username', Buffer.from(settings.rateUsername || settings.email, 'utf8').toString('base64'))
    form.set('password', Buffer.from(settings.ratePassword || settings.password, 'utf8').toString('base64'))
    const url = new URL(`${settings.rateBaseUrl}/docket_api/customer_rate_cals`)
    url.searchParams.set('api_company_id', settings.companyId)
    const response = await fetchImpl(url, { method: 'POST', headers: { Accept: 'application/json' }, body: form, signal: AbortSignal.timeout(60000) })
    const data = await responseData(response)
    if (!data?.success || !Array.isArray(data.data)) throw Object.assign(new Error(data?.errors?.[0] || 'Skylink did not return rate options.'), { statusCode: 422, providerResponse: data })
    const now = Date.now()
    for (const [key, quote] of quoteCache) if (quote.expiresAt <= now) quoteCache.delete(key)
    return data.data.flatMap((rate) => {
      const serviceCode = text(rate?.internal_api_service_code || rate?.code)
      if (!serviceCode || !validNumber(rate?.total ?? rate?.rate)) return []
      const freight = amount(rate.rate ?? rate.sub_total)
      const otherCharges = amount(rate.other_charges) + amount(rate.fsc)
      const codCharges = amount(rate.cod_charges)
      const subtotal = amount(rate.sub_total ?? (freight + otherCharges + codCharges))
      const total = amount(rate.total ?? rate.rate)
      const reportedTax = amount(rate.igst) + amount(rate.cgst) + amount(rate.sgst)
      const gstAmount = reportedTax > 0 ? reportedTax : Math.max(0, total - subtotal)
      const expectedSubtotal = Number((freight + otherCharges + codCharges).toFixed(2))
      const expectedTotal = Number((subtotal + gstAmount).toFixed(2))
      const priceBreakdownMatches = Math.abs(expectedSubtotal - subtotal) <= 0.02 && Math.abs(expectedTotal - total) <= 0.02
      const isCodOrder = text(order?.payment_type || order?.paymentType || order?.order_type).toLowerCase() === 'cod'
      const bookingBlockedReasons = []
      if (!bookingReady()) bookingBlockedReasons.push('Enter the Skylink free-form invoice type ID in admin courier credentials before booking.')
      if (isCodOrder) bookingBlockedReasons.push('Skylink booking does not send COD/payment collection details to the carrier. Change this international order to prepaid or use a carrier that supports COD.')
      if (!priceBreakdownMatches) bookingBlockedReasons.push('Skylink quote surcharge fields do not reconcile with its payable total. Confirm the surcharge treatment with Skylink before booking.')
      const canBookQuote = bookingReady() && !isCodOrder && priceBreakdownMatches
      const quoteId = randomUUID()
      quoteCache.set(quoteId, {
        rate, serviceCode, canBook: canBookQuote,
        bookingBlockedReason: bookingBlockedReasons.join(' '),
        order: { originCode, destinationCode, weightKg, pieces }, expiresAt: now + 15 * 60 * 1000,
      })
      return [{
        id: 99003, courier_id: 99003, name: text(rate.vendor_name || rate.code || serviceCode),
        displayName: text(rate.vendor_name || rate.code || serviceCode), integration_type: 'skylink',
        serviceProvider: 'skylink', service_provider: 'skylink', courier_option_key: `skylink:${quoteId}`,
        skylink_quote_id: quoteId, service: serviceCode, service_code: serviceCode, mode: 'air',
        rate: freight, courier_cost_estimate: total,
        total_charges_without_gst: subtotal, total_charges_with_gst: total,
        total_charges: subtotal, wallet_debit_amount: total,
        cod_charges: codCharges, gst_percent: amount(rate.gst_per) || 18, gst_amount: gstAmount,
        other_charges: otherCharges, booking_available: canBookQuote, can_book: canBookQuote,
        booking_blocked_reason: bookingBlockedReasons.join(' ') || null,
        provider_serviceability: { provider: 'Skylink', service: serviceCode, booking_available: canBookQuote, can_book: canBookQuote, booking_blocked_reason: bookingBlockedReasons.join(' ') || null },
        approxZone: { code: destinationCode, name: destinationCode },
      }]
    })
  }

  const resolveQuote = (quoteId, order) => {
    const quote = quoteCache.get(text(quoteId))
    if (!quote || quote.expiresAt <= Date.now()) throw Object.assign(new Error('Skylink quote expired. Refresh courier rates and select a service again.'), { statusCode: 409 })
    if (!quote.canBook) throw Object.assign(new Error(quote.bookingBlockedReason || 'This Skylink quote is not safe to book.'), { statusCode: 409 })
    const originCode = first(settings.rateOriginCode, order?.pickup?.pincode, order?.origin)
    const destinationCode = first(order?.consignee?.country_code, order?.country_code, 'IN').toUpperCase()
    const weightKg = amount(order?.package_weight ?? order?.weight) / 1000
    if (quote.order.originCode !== originCode || quote.order.destinationCode !== destinationCode || Math.abs(quote.order.weightKg - weightKg) > 0.0001) {
      throw Object.assign(new Error('Shipment details changed after the Skylink quote. Refresh rates before booking.'), { statusCode: 409 })
    }
    quoteCache.delete(text(quoteId))
    return quote
  }

  const createDocket = async (order, quote) => {
    if (!bookingReady()) throw Object.assign(new Error('Skylink credentials and the free-form invoice type ID must be configured before booking.'), { statusCode: 503 })
    const { token, customerId } = await requestToken()
    const consignee = order.consignee || {}
    const pickup = order.pickup || {}
    const seller = order.__seller || {}
    const items = Array.isArray(order.order_items) ? order.order_items : []
    const totalQty = items.reduce((sum, item) => sum + Math.max(1, amount(item.qty || item.quantity) || 1), 0)
    const weightKg = amount(order.package_weight) / 1000
    const invoiceCurrency = text(order.currency_code || 'INR').toUpperCase()
    const reference = safeReference(order.order_number)
    const { date, time } = indiaDateTime()
    const payload = {
      label_no: reference, tracking_no: reference, reference_name: text(order.order_number), customer_id: customerId,
      origin_code: text(pickup.pincode), product_code: settings.productCode,
      destination_code: text(consignee.country_code || order.country_code).toUpperCase(),
      booking_date: date, booking_time: time, pcs: '1', shipment_value: String(amount(order.order_amount)),
      shipment_value_currency: invoiceCurrency, actual_weight: String(weightKg),
      shipment_invoice_no: text(order.invoice_no || order.order_number), shipment_invoice_date: text(order.invoice_date || order.order_date || date).slice(0, 10),
      shipment_content: items.map((item) => text(item.name)).filter(Boolean).join(', ').slice(0, 250), remark: '', entry_type: 2,
      api_service_code: quote.serviceCode, new_docket_free_form_invoice: '1',
      free_form_invoice_type_id: Number(settings.invoiceTypeId), free_form_currency: invoiceCurrency,
      terms_of_trade: settings.termsOfTrade, free_form_note_master_code: settings.invoiceNoteCode,
      shipper_name: text(pickup.name || pickup.warehouse_name), shipper_company_name: text(pickup.warehouse_name || seller.company_name),
      shipper_contact_no: text(pickup.phone), shipper_email: text(seller.email), shipper_address_line_1: text(pickup.address),
      shipper_address_line_2: text(pickup.address_2), shipper_address_line_3: text(pickup.landmark),
      shipper_city: text(pickup.city), shipper_state: text(pickup.state), shipper_country: text(pickup.country_code || 'IN').toUpperCase(),
      shipper_zip_code: text(pickup.pincode), shipper_gstin_type: text(pickup.gstin_type || 'GSTIN (Normal)'),
      shipper_gstin_no: text(pickup.gst_number || seller.gstin || seller.gstNumber),
      consignee_name: text(consignee.name), consignee_company_name: text(consignee.company_name || consignee.name),
      consignee_contact_no: text(consignee.phone), consignee_email: text(consignee.email),
      consignee_address_line_1: text(consignee.address_line_1 || consignee.address),
      consignee_address_line_2: text(consignee.address_line_2 || consignee.address_2), consignee_address_line_3: text(consignee.landmark),
      consignee_city: text(consignee.city), consignee_state: text(consignee.state),
      consignee_country: text(consignee.country_code || order.country_code).toUpperCase(), consignee_zip_code: text(consignee.pincode),
      ...(consignee.gstin ? { consignee_gstin_type: text(consignee.gstin_type || 'GSTIN (Normal)'), consignee_gstin_no: text(consignee.gstin) } : {}),
      pickup_address_name: text(pickup.name || pickup.warehouse_name), pickup_address_code: text(pickup.warehouse_name),
      pickup_address_contact_no: text(pickup.phone), pickup_address_email: text(seller.email),
      pickup_address_address_line_1: text(pickup.address), pickup_address_address_line_2: text(pickup.address_2),
      pickup_address_address_line_3: text(pickup.landmark), pickup_address_city: text(pickup.city),
      pickup_address_state: text(pickup.state), pickup_address_country: text(pickup.country_code || 'IN').toUpperCase(),
      pickup_address_zip_code: text(pickup.pincode), pickup_address_gstin_type: text(pickup.gstin_type || 'GSTIN (Normal)'),
      pickup_address_gstin_no: text(pickup.gst_number || seller.gstin || seller.gstNumber),
      docket_items: [{ actual_weight: String(weightKg), length: String(order.package_length), width: String(order.package_breadth), height: String(order.package_height), number_of_boxes: '1' }],
      free_form_line_items: items.map((item) => {
        const qty = Math.max(1, amount(item.qty || item.quantity) || 1)
        const rate = amount(item.price)
        const total = amount(item.amount) || rate * qty
        return {
          total: total.toFixed(2), no_of_packages: String(qty), box_no: '1', rate: rate.toFixed(2),
          hscode: text(item.hsn), description: text(item.name), unit_of_measurement: text(item.unit || 'PCS'),
          unit_weight: String(weightKg / totalQty), igst_amount: amount(item.igst ?? item.tax_amount).toFixed(2),
        }
      }),
    }
    const response = await fetchImpl(`${settings.apiBaseUrl}/docket_api/create_docket`, {
      method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(120000),
    })
    const data = await responseData(response)
    if (!data?.success) throw Object.assign(new Error(data?.errors?.[0] || data?.message || 'Skylink rejected docket creation.'), { statusCode: 422, providerResponse: data })
    return { data, payload }
  }

  const track = async (trackingNo) => {
    if (!configured()) throw Object.assign(new Error('Skylink credentials are not configured.'), { statusCode: 503 })
    const url = new URL(`${settings.rateBaseUrl}/api/tracking_api/get_tracking_data`)
    url.searchParams.set('api_company_id', settings.companyId)
    url.searchParams.set('customer_code', settings.customerCode)
    url.searchParams.set('tracking_no', text(trackingNo))
    const response = await fetchImpl(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30000) })
    return responseData(response)
  }

  return {
    isConfigured: configured, isBookingReady: bookingReady, configure,
    apiBaseUrl: settings.apiBaseUrl, rateBaseUrl: settings.rateBaseUrl,
    defaults: { ...settings, password: undefined, ratePassword: undefined },
    quoteRates, resolveQuote, createDocket, track,
  }
}

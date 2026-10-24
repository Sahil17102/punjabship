import assert from 'node:assert/strict'
import test from 'node:test'
import { createSkylinkClient, validateSkylinkOrder } from './skylink.mjs'

const canadaRate = {
  code: 'UPS EXPRESS SAVER',
  internal_api_service_code: 'UPS EXPRESS SAVER',
  vendor_name: 'UPS EXPRESS SAVER',
  weight: '0.5',
  rate: 1145,
  other_charges: 78,
  fsc: 642.08,
  igst: 335.71,
  cgst: '',
  sgst: '',
  gst_per: '18.00',
  sub_total: 1865.08,
  total: 2200.79,
  per_kg: 4401.59,
}

const configuredClient = (fetchImpl, overrides = {}) => createSkylinkClient({
  email: 'test@example.invalid',
  password: 'not-a-real-password',
  customerCode: 'TEST-CUSTOMER',
  companyId: '3',
  rateOriginCode: '126116',
  productCode: 'NONDOX',
  ...overrides,
  fetchImpl,
})

const jsonResponse = (body) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
})

test('maps Skylink freight, FSC, surcharge, GST and total without double counting', async () => {
  let requestForm
  const client = configuredClient(async (_url, options) => {
    requestForm = options.body
    return jsonResponse({ success: true, data: [canadaRate] })
  })

  const [quote] = await client.quoteRates({
    origin: '126116',
    destinationCountryCode: 'CA',
    destination: 'A0A1B0',
    weight: 500,
    pieces: 1,
    payment_type: 'prepaid',
  })

  assert.equal(requestForm.get('origin_code'), '126116')
  assert.equal(requestForm.get('destination_code'), 'CA')
  assert.equal(requestForm.get('actual_weight'), '0.5')
  assert.equal(requestForm.get('product_code'), 'NONDOX')
  assert.equal(quote.rate, 1145)
  assert.equal(quote.other_charges, 720.08)
  assert.equal(quote.total_charges_without_gst, 1865.08)
  assert.equal(quote.gst_amount, 335.71)
  assert.equal(quote.total_charges_with_gst, 2200.79)
  assert.equal(quote.booking_available, true)
  assert.equal(quote.can_book, true)
})

test('keeps Skylink COD booking blocked while allowing a reconciled prepaid quote', async () => {
  const client = configuredClient(async () => jsonResponse({ success: true, data: [canadaRate] }))

  const [quote] = await client.quoteRates({
    origin: '126116',
    destinationCountryCode: 'CA',
    destination: 'A0A1B0',
    weight: 500,
    pieces: 1,
    payment_type: 'cod',
  })

  assert.equal(quote.booking_available, false)
  assert.match(quote.booking_blocked_reason, /does not send COD\/payment collection details/i)
  assert.throws(
    () => client.resolveQuote(quote.skylink_quote_id, {
      pickup: { pincode: '126116' },
      consignee: { country_code: 'CA' },
      package_weight: 500,
    }),
    (error) => error.statusCode === 409 && /COD\/payment collection details/i.test(error.message),
  )
})

test('blocks booking when Skylink quote components do not reconcile', async () => {
  const inconsistentRate = { ...canadaRate, other_charges: 100 }
  const client = configuredClient(async () => jsonResponse({ success: true, data: [inconsistentRate] }))

  const [quote] = await client.quoteRates({
    origin: '126116',
    destinationCountryCode: 'CA',
    destination: 'A0A1B0',
    weight: 500,
    pieces: 1,
    payment_type: 'prepaid',
  })

  assert.equal(quote.booking_available, false)
  assert.match(quote.booking_blocked_reason, /do not reconcile/i)
})

test('sends invoice type 1 and all required NONDOX invoice item fields in the booking payload', async () => {
  let docketRequest
  const client = configuredClient(async (url, options) => {
    if (String(url).endsWith('/docket_api/get_token')) {
      return jsonResponse({ success: true, data: { token: 'test-token', customer_id: 1184 } })
    }
    if (String(url).endsWith('/docket_api/create_docket')) {
      docketRequest = { url: String(url), headers: options.headers, body: JSON.parse(options.body) }
      return jsonResponse({ success: true, data: { tracking_no: 'TEST-AWB' } })
    }
    throw new Error(`Unexpected mocked URL: ${url}`)
  }, { invoiceTypeId: '1' })

  const order = {
    order_number: 'TEST-CA-ORDER',
    order_amount: 1000,
    package_weight: 500,
    package_length: 10,
    package_breadth: 10,
    package_height: 10,
    invoice_no: 'INV-100',
    invoice_date: '2026-10-25',
    payment_type: 'prepaid',
    consignee: {
      name: 'Test Receiver', phone: '+10000000000', email: 'receiver@example.invalid',
      address: '1 Main St', address_line_2: 'Unit 4', city: 'Avondale', state: 'NL', country_code: 'CA', pincode: 'A0A1B0',
    },
    pickup: {
      name: 'Test Sender', warehouse_name: 'Test Warehouse', phone: '+910000000000',
      address: '1 Test Road', city: 'Narwana', state: 'Haryana', country_code: 'IN',
      pincode: '126116', gst_number: 'TESTGST',
    },
    __seller: { email: 'seller@example.invalid', company_name: 'Test Company', gstin: 'TESTGST' },
    order_items: [{ name: 'Test garment', hsn: '62032200', qty: 1, price: 1000, amount: 1000, unit: 'PCS' }],
  }

  await client.createDocket(order, { serviceCode: 'UPS EXPRESS SAVER' })
  const payload = docketRequest.body
  const item = payload.free_form_line_items[0]
  const requiredItemFields = [
    'total', 'no_of_packages', 'box_no', 'rate', 'hscode', 'description',
    'unit_of_measurement', 'unit_weight', 'igst_amount',
  ]

  assert.equal(docketRequest.url, 'https://skylink.skynetww.com/docket_api/create_docket')
  assert.equal(docketRequest.headers.Authorization, 'Bearer test-token')
  assert.equal(payload.api_service_code, 'UPS EXPRESS SAVER')
  assert.equal(payload.new_docket_free_form_invoice, '1')
  assert.equal(payload.free_form_invoice_type_id, 1)
  assert.equal(payload.free_form_currency, 'INR')
  assert.equal(payload.free_form_note_master_code, 'COMMERCIAL')
  assert.equal(payload.consignee_address_line_1, '1 Main St')
  assert.equal(payload.consignee_address_line_2, 'Unit 4')
  assert.deepEqual(Object.keys(item).sort(), requiredItemFields.sort())
  assert.equal(item.total, '1000.00')
  assert.equal(item.hscode, '62032200')
})

test('requires recipient address line 2 before a Skylink international booking', () => {
  const order = {
    order_number: 'TEST-CA-ORDER', order_amount: 1000, package_weight: 500,
    package_length: 10, package_breadth: 10, package_height: 10,
    invoice_no: 'INV-100', invoice_date: '2026-10-25',
    consignee: {
      name: 'Test Receiver', phone: '+10000000000', email: 'receiver@example.invalid',
      address: '1 Main St', city: 'Avondale', state: 'NL', country_code: 'CA', pincode: 'A0A1B0',
    },
    pickup: {
      name: 'Test Sender', warehouse_name: 'Test Warehouse', phone: '+910000000000',
      address: '1 Test Road', city: 'Narwana', state: 'Haryana', country_code: 'IN',
      pincode: '126116', gst_number: 'TESTGST',
    },
    __seller: { email: 'seller@example.invalid', company_name: 'Test Company', gstin: 'TESTGST' },
    order_items: [{ name: 'Test garment', hsn: '62032200', qty: 1, price: 1000, amount: 1000, unit: 'PCS' }],
  }

  assert.ok(validateSkylinkOrder(order, { invoiceTypeId: '1' }).includes('receiver address line 2'))
  assert.deepEqual(validateSkylinkOrder({
    ...order,
    consignee: { ...order.consignee, address_line_2: 'Unit 4' },
  }, { invoiceTypeId: '1' }), [])
})

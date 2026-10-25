import test from 'node:test'
import assert from 'node:assert/strict'
import { createFlightGoClient, validateFlightGoOrder } from './flightgo.mjs'

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const baseOrder = {
  deliveryCountryCode: 'CA', destination: 'A0A 1B0', weight: 500, length: 20, breadth: 15, height: 10,
  payment_type: 'prepaid',
}

test('FlightGo resolves the exact postcode and maps a live rate', async () => {
  const calls = []
  const client = createFlightGoClient({ username: 'user', password: 'pass', apiKey: 'key', fetchImpl: async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) })
    if (url.endsWith('/api/location/zipcode')) return jsonResponse({ status: 'success', data: [{ zipcode_id: 'wrong', zipcode_name: 'A0A 1B1' }, { zipcode_id: 'right', zipcode_name: 'A0A1B0' }] })
    return jsonResponse({ status: 'success', data: [{ company: { name: 'Canada', service_code: 'DHL1', branch_name: 'DELHI', total: '1180' }, rate: { Rate: '1000', Total: '1000', 'IGST (18%)': '180', 'Grand Total': '1180' } }] })
  } })
  const [quote] = await client.quoteRates(baseOrder)
  assert.equal(quote.integration_type, 'flightgo')
  assert.equal(quote.total_charges_with_gst, 1180)
  assert.equal(calls[1].body.rate_request.zipcode_id, 'right')
  assert.match(quote.courier_option_key, /^flightgo:/)
})

test('FlightGo safely falls back to a Canadian FSA postal prefix', async () => {
  const searches = []
  const client = createFlightGoClient({ username: 'user', password: 'pass', apiKey: 'key', fetchImpl: async (url, options) => {
    const body = JSON.parse(options.body)
    if (url.endsWith('/api/location/zipcode')) {
      searches.push(body.search)
      return jsonResponse({ status: 'success', data: body.search === 'M5V' ? [{ zipcode_id: '303', zipcode_name: 'M5V' }] : [] })
    }
    return jsonResponse({ status: 'success', data: [{ company: { service_code: 'FG-CA', branch_name: 'DELHI', total: 1000 }, rate: { Total: 900, 'IGST (18%)': 100 } }] })
  } })
  const [quote] = await client.quoteRates({ ...baseOrder, destination: 'M5V 3A8' })
  assert.equal(quote.service_code, 'FG-CA')
  assert.deepEqual(searches, ['M5V 3A8', 'M5V3A8', 'M5V'])
})

test('FlightGo sandbox rates cannot be booked as real shipments', async () => {
  const client = createFlightGoClient({ username: 'user', password: 'pass', apiKey: 'key', environment: 'test', fetchImpl: async (url) => {
    if (url.endsWith('/api/location/zipcode')) return jsonResponse({ status: 'success', data: [{ zipcode_id: '22', zipcode_name: 'A0A1B0' }] })
    return jsonResponse({ status: 'success', data: [{ company: { service_code: 'DHL1', branch_name: 'DELHI', total: 1180 }, rate: { Rate: 1000, Total: 1000, 'IGST (18%)': 180 } }] })
  } })
  const [option] = await client.quoteRates(baseOrder)
  assert.equal(client.isBookingReady(), false)
  assert.equal(option.can_book, false)
  assert.match(option.booking_blocked_reason, /sandbox rates are for testing only/i)
})

test('FlightGo production label request returns AWB and never treats an empty response as booked', async () => {
  let labelHasExpectedShape = false
  const client = createFlightGoClient({ username: 'user', password: 'pass', apiKey: 'key', environment: 'production', fetchImpl: async (url, options) => {
    if (url.endsWith('/api/location/zipcode')) return jsonResponse({ status: 'success', data: [{ zipcode_id: '22', zipcode_name: 'A0A1B0' }] })
    if (url.endsWith('/api/rates/check')) return jsonResponse({ status: 'success', data: [{ company: { service_code: 'DHL1', branch_name: 'DELHI', total: 1180 }, rate: { Rate: 1000, Total: 1000, 'IGST (18%)': 180 } }] })
    const body = JSON.parse(options.body)
    labelHasExpectedShape = body.label_request.service_code === 'DHL1' && body.label_request.zipcode_id === '22' && body.label_request.ship_to.postal_code === 'A0A 1B0'
    return jsonResponse({ status: 'success', data: { awb_no: 'FG12345', label_url: 'https://example.test/label.pdf' } })
  } })
  const [option] = await client.quoteRates(baseOrder)
  const order = { order_number: 'PS-1', package_weight: 500, package_length: 20, package_breadth: 15, package_height: 10, country_code: 'CA', consignee: { name: 'Buyer', phone: '1234567890', email: 'buyer@example.com', address: '123 Street', city: 'Avondale', state: 'NL', pincode: 'A0A 1B0', country_code: 'CA' }, pickup: { name: 'Seller', warehouse_name: 'Warehouse', phone: '9999999999', address: 'Ludhiana', city: 'Ludhiana', state: 'Punjab', pincode: '141001', country_code: 'IN' }, order_items: [{ name: 'Shirt', hsn: '6105', qty: 1, price: 100 }], __seller: { email: 'seller@example.com' } }
  const quote = client.resolveQuote(option.flightgo_quote_id, order)
  const result = await client.createLabel(order, quote)
  assert.equal(result.awb, 'FG12345')
  assert.equal(labelHasExpectedShape, true)

  const emptyClient = createFlightGoClient({ username: 'user', password: 'pass', apiKey: 'key', fetchImpl: async () => jsonResponse({ status: 'success' }) })
  await assert.rejects(() => emptyClient.createLabel(order, { ...quote }), /did not return an AWB/)
})

test('FlightGo validation reports missing international shipment data', () => {
  assert.deepEqual(validateFlightGoOrder({}), ['order number', 'receiver name', 'receiver phone', 'receiver email', 'receiver address', 'receiver city', 'receiver state', 'receiver postal code', 'receiver country code', 'sender name', 'sender phone', 'sender address', 'sender city', 'sender state', 'sender postal code', 'weight', 'length', 'width', 'height', 'invoice items'])
})

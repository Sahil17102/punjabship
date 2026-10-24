import test from 'node:test'
import assert from 'node:assert/strict'
import { createDillikingClient, dillikingServicesForCountry, mapDillikingTracking, validateDillikingOrder } from './dilliking.mjs'

const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const order = { order_number: 'PS-1', package_weight: 1000, package_length: 10, package_breadth: 10, package_height: 10, consignee: { name: 'Buyer', phone: '123', email: 'b@example.com', company_name: 'Buyer Co', address: 'One', address_line_2: 'Two', city: 'Sydney', state: 'NSW', pincode: '2000', country: 'Australia' }, pickup: { name: 'Seller', phone: '999', warehouse_name: 'Seller Co', address: 'One', address_line_2: 'Two', city: 'Delhi', state: 'Delhi', pincode: '110001' }, order_items: [{ name: 'Pencil', hsn: '96099020', qty: 2, price: 50 }], __seller: {}, __dillikingKyc: { type: 3, number: 'ABCDE1234F', filename: 'pan.pdf', filedata: 'BASE64' } }

test('Dilliking authenticates, maps AWB payload and extracts label', async () => {
  const calls = []
  const client = createDillikingClient({ email: 'test@example.com', password: 'secret', fetchImpl: async (url, options) => {
    calls.push({ url, options })
    if (url.endsWith('/auth/token')) return jsonResponse({ status: true, data: { token: 'token' } })
    return jsonResponse({ status: true, data: { AWB: 'DK1', ForwardingNo: 'F1', Label: 'UERG' } })
  } })
  const result = await client.createAwb(order, 'Australia Direct')
  const payload = JSON.parse(calls[1].options.body)
  assert.equal(result.awb, 'DK1')
  assert.equal(result.labelBase64, 'UERG')
  assert.equal(payload.kyc1.kyc_type, 3)
  assert.equal(payload.items[0].sub_total, 100)
  assert.equal(calls[1].options.headers.Authorization, 'Bearer token')
})

test('Dilliking refuses a successful response without an AWB', async () => {
  const client = createDillikingClient({ email: 'test@example.com', password: 'secret', fetchImpl: async (url) => url.endsWith('/auth/token') ? jsonResponse({ status: true, data: { token: 'token' } }) : jsonResponse({ status: true, data: {} }) })
  await assert.rejects(() => client.createAwb(order, 'Australia Direct'), /did not return an AWB/)
})

test('Dilliking service and tracking mappings follow documented values', () => {
  assert.deepEqual(dillikingServicesForCountry('CA'), ['T PURO PAID', 'V PURO PAID'])
  assert.deepEqual(dillikingServicesForCountry('AU'), ['Australia Direct'])
  const tracking = mapDillikingTracking({ data: [{ airway_bill: 'DK1', event_date: '20260129', event_time: '1335', location: 'Sydney', remark: 'Delivered' }] }, order)
  assert.equal(tracking.status, 'delivered')
  assert.equal(tracking.history[0].event_time, '2026-01-29T13:35:00')
})

test('Dilliking validation enforces address line 2 and sender KYC file', () => {
  const invalid = { ...order, consignee: { ...order.consignee, address_line_2: '' }, __dillikingKyc: {} }
  const missing = validateDillikingOrder(invalid, 'Australia Direct')
  assert.ok(missing.includes('receiver address line 2'))
  assert.ok(missing.includes('sender KYC file'))
})

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  createShipGlobalClient,
  extractShipGlobalAwb,
  mapPunjabShipOrderToShipGlobal,
  mapShipGlobalTracking,
} from './shipglobal.mjs'

test('maps a PunjabShip B2C order to ShipGlobal production fields', () => {
  const payload = mapPunjabShipOrderToShipGlobal({
    order_number: 'PS-1001', order_date: '2026-09-27', package_weight: 0.5,
    package_length: 10, package_breadth: 12, package_height: 8,
    consignee: { name: 'John Smith', phone: '+19999999999', email: 'john@example.com', address: '4 Building', city: 'San Jose', state: 'CA', pincode: '95134', country_code: 'US' },
    order_items: [{ name: 'Mug', sku: 'MUG-1', qty: 2, price: 25, hsn: '691200', tax_rate: 0 }],
  }, { service: 'Shipglobal Direct', currencyCode: 'USD' })
  assert.equal(payload.invoice_no, 'PS-1001')
  assert.equal(payload.customer_shipping_firstname, 'John')
  assert.equal(payload.customer_shipping_lastname, 'Smith')
  assert.equal(payload.customer_shipping_country_code, 'US')
  assert.equal(payload.vendor_order_items[0].vendor_order_item_quantity, '2')
})

test('extracts an AWB from common ShipGlobal response shapes', () => {
  assert.equal(extractShipGlobalAwb({ data: { awb_number: 'SG32407261079582' } }), 'SG32407261079582')
  assert.equal(extractShipGlobalAwb('Created SG3240604941499 successfully'), 'SG3240604941499')
})

test('maps ShipGlobal tracking events to the shared tracking contract', () => {
  const tracking = mapShipGlobalTracking({ data: {
    awbEvents: [{ awb_event_code: 'SGE_304', awb_history_datetime: '2026-09-27 10:00:00', awb_history_location: 'Delhi', awb_history_comment: 'Delivered', type: 'lastmile' }],
    awbInfo: { awb_number: 'SG32407261079582', awb_status: 'DELIVERED', partner_lastmile_display: 'UPS' },
  } }, { id: '1', order_number: 'PS-1001', payment_type: 'prepaid' })
  assert.equal(tracking.status, 'delivered')
  assert.equal(tracking.courier_name, 'UPS')
  assert.equal(tracking.history[0].status_code, 'SGE_304')
})

test('uses Basic Auth without exposing credentials in the request body', async () => {
  let captured
  const client = createShipGlobalClient({ username: 'vendor@example.com', password: 'secret', fetchImpl: async (url, options) => {
    captured = { url, options }
    return new Response(JSON.stringify({ success: true, data: { awb_number: 'SG32407261079582' } }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } })
  await client.addOrder({ invoice_no: 'PS-1' })
  assert.match(captured.options.headers.Authorization, /^Basic /)
  assert.equal(captured.options.body.includes('secret'), false)
})

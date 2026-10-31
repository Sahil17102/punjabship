import test from 'node:test'
import assert from 'node:assert/strict'
import { createM5CClient, extractM5CShipment, mapPunjabShipOrderToM5C, m5cServicesForCountry, validateM5COrder } from './m5c.mjs'

const jsonResponse = (data, status = 200) => new Response(data === null ? '' : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const order = {
  order_number: 'PS-M5-1', order_amount: 5000, currency_code: 'INR', invoice_no: 'INV-1',
  package_weight: 1200, package_length: 20, package_breadth: 15, package_height: 10,
  consignee: { name: 'Buyer', phone: '123', email: 'buyer@example.com', address: 'One', address_line_2: 'Two', city: 'Toronto', state: 'ON', pincode: 'M5V 3A8', country: 'Canada' },
  pickup: { name: 'Seller', phone: '999', warehouse_name: 'Seller Co', address: 'One', address_line_2: 'Two', city: 'Delhi', state: 'Delhi', pincode: '110001', gst_number: '03ABCDE1234F1Z1' },
  order_items: [{ name: 'Shirt', hsn: '6205', qty: 2, price: 2500 }], __seller: {}, __m5cServiceCode: 'S113',
}

test('M5C maps B2C shipment payload and validates required fields', () => {
  const payload = mapPunjabShipOrderToM5C(order)
  assert.equal(payload.ServiceCode, 'S113')
  assert.equal(payload.ActWeight, '1.200')
  assert.equal(payload.Descriptions[0].Amt, '5000.00')
  assert.deepEqual(validateM5COrder(payload), [])
})

test('M5C maps multi-box B2B shipments', () => {
  const payload = mapPunjabShipOrderToM5C({ ...order, package_weight: undefined, boxes: [{ lengthCm: 30, breadthCm: 20, heightCm: 10, weightKg: 2, quantity: 2 }], invoices: [{ invoiceNumber: 'B2B-1', invoiceValue: 8000 }], order_items: undefined })
  assert.equal(payload.NumofItems, '2')
  assert.equal(payload.ActWeight, '4.000')
  assert.equal(payload.CustomsValue, '5000.00')
})

test('M5C lists account services and submits authenticated shipment', async () => {
  const calls = []
  const client = createM5CClient({ accountCode: 'A', username: 'U', password: 'P', accessKey: 'K', fetchImpl: async (url, options) => {
    calls.push({ url, options })
    if (url.includes('GetServiceList')) return jsonResponse([{ Code: 'S113', Name: 'Canada UPS', Sector: 'CANADA' }])
    return jsonResponse([{ ShipmentResponses: [{ Status: 'Success' }], shipmentDetails: [{ Awbno: 'M5P123', Label: 'UERG' }] }])
  } })
  const services = await client.servicesForCountry('CA')
  const result = await client.createShipment(order)
  assert.equal(services[0].code, 'S113')
  assert.equal(result.awb, 'M5P123')
  const submitted = JSON.parse(calls[1].options.body)
  assert.equal(submitted.ValidateAccount[0].AccessKey, 'K')
  assert.equal(submitted.Shipment[0].ReferenceNumber, 'PS-M5-1')
})

test('M5C service filtering and recursive response extraction are tolerant', () => {
  assert.equal(m5cServicesForCountry([{ Code: 'AUS', Name: 'Australia', Sector: 'AUSTRALIA' }], 'AU')[0].code, 'AUS')
  assert.equal(extractM5CShipment({ data: { TrackingNo: 'M5-9', FileData: 'PDF' } }).awb, 'M5-9')
})

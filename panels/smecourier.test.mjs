import assert from 'node:assert/strict'
import test from 'node:test'

import { mapPunjabShipOrderToSME, validateSMEOrder } from './smecourier.mjs'

test('maps the saved PunjabShip pickup shape and converts B2C grams to SME kilograms', () => {
  const payload = mapPunjabShipOrderToSME({
    shipment_type: 'b2c',
    order_number: 'TEST-SME-1',
    order_amount: 100,
    package_weight: 500,
    package_length: 10,
    package_breadth: 10,
    package_height: 10,
    consignee: {
      name: 'Receiver', address_line_1: '123 Test Street', city: 'Avondale',
      pincode: 'A0A 1B0', state: 'Newfoundland and Labrador', phone: '9050790505', country_code: 'CA',
    },
    pickup: {
      addressNickname: 'Primary Warehouse', contactName: 'Sender', contactNumber: '9999999999',
      addressLine1: 'Model Town', addressLine2: 'Unit 2', city: 'Ludhiana', state: 'Punjab', pincode: '141001',
    },
    order_items: [{ name: 'Test product', quantity: 1, price: 100 }],
    __seller: { email: 'sender@example.com', companyInfo: { businessName: 'Sender Company', gstNumber: '03ABCDE1234F1Z5' } },
  }, { username: 'SMEUSER', serviceCode: 'INTERNATIONAL PRIORITY', shipmentType: 'NDox', docType: 'GSTIN' })

  assert.equal(payload.ConsignorName, 'Sender')
  assert.equal(payload.ConsignorCompanyName, 'Primary Warehouse')
  assert.equal(payload.ConsignorAddressLine1, 'Model Town')
  assert.equal(payload.ConsignorAddressLine2, 'Unit 2')
  assert.equal(payload.ConsignorPhoneNo, '9999999999')
  assert.equal(payload.DocValue, '03ABCDE1234F1Z5')
  assert.equal(payload.ConsigneeState, 'NL')
  assert.equal(payload.Packages[0].Actual_Weight, 0.5)
  assert.equal(payload.Items[0].Weight, 0.5)
  assert.deepEqual(validateSMEOrder(payload), [])
})

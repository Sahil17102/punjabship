import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import test from 'node:test'

const request = async (url, { token, method = 'GET', body } = {}) => {
  const response = await fetch(url, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  return { response, payload: await response.json() }
}

test('B2C and B2B zones persist domestic and international countries', { timeout: 30_000 }, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'punjabship-zone-country-'))
  const port = 31000 + Math.floor(Math.random() * 1000)
  const baseUrl = `http://127.0.0.1:${port}`
  const diagnostics = []
  const child = spawn(process.execPath, ['panels/local-api.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      ADMIN_PASSWORD: 'CountryTest@123',
      PUNJABSHIP_DATA_FILE: join(directory, 'state.json'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  child.stdout.on('data', (chunk) => diagnostics.push(chunk.toString()))
  child.stderr.on('data', (chunk) => diagnostics.push(chunk.toString()))
  t.after(async () => {
    child.kill('SIGTERM')
    await rm(directory, { recursive: true, force: true })
  })

  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API exited early: ${diagnostics.join('')}`)
    try {
      const health = await fetch(`${baseUrl}/api/health`)
      if (health.ok) break
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const login = await request(`${baseUrl}/api/auth/admin/login`, {
    method: 'POST',
    body: { email: 'admin@punjabshiplogistics.com', password: 'CountryTest@123' },
  })
  assert.equal(login.response.status, 200)
  const token = login.payload.accessToken

  const b2c = await request(`${baseUrl}/api/admin/zones`, {
    token,
    method: 'POST',
    body: { code: 'EU', name: 'Europe', business_type: 'B2C', countries: ['France', 'Germany'] },
  })
  assert.equal(b2c.response.status, 201)
  assert.deepEqual(b2c.payload.countries, ['France', 'Germany'])
  assert.equal(b2c.payload.country, 'France')

  const b2b = await request(`${baseUrl}/api/admin/b2b/zones`, {
    token,
    method: 'POST',
    body: { code: 'AE', name: 'UAE', countries: ['United Arab Emirates'], states: [] },
  })
  assert.equal(b2b.response.status, 201)
  assert.deepEqual(b2b.payload.data.countries, ['United Arab Emirates'])

  const rate = await request(`${baseUrl}/api/admin/couriers/shipping-rate/91001/starter-b2c`, {
    token,
    method: 'PUT',
    body: {
      courier_id: 91001,
      courier_name: 'PunjabShip Manual',
      service_provider: 'manual',
      businessType: 'b2c',
      mode: 'standard',
      min_weight: 0.5,
      rates: { Europe: { forward: 1250, rto: 1000 } },
      zone_slabs: {
        Europe: {
          forward: [{ weight_from: 0, weight_to: 0.5, rate: 1250, extra_rate: 400, extra_weight_unit: 0.5 }],
          rto: [{ weight_from: 0, weight_to: 0.5, rate: 1000, extra_rate: 350, extra_weight_unit: 0.5 }],
        },
      },
    },
  })
  assert.equal(rate.response.status, 200)

  const quote = await request(`${baseUrl}/api/couriers/available-to-user`, {
    method: 'POST',
    body: {
      origin: '141001', destination: '75001', pickupCountryCode: 'IN', deliveryCountryCode: 'FR',
      shipment_type: 'b2c', payment_type: 'prepaid', weight: 500, order_amount: 2000,
    },
  })
  assert.equal(quote.response.status, 200)
  assert.equal(quote.payload.data[0].approxZone.id, b2c.payload.id)
  assert.equal(quote.payload.data[0].rate, 1250)

  const sellerLogin = await request(`${baseUrl}/api/auth/request-password-login`, {
    method: 'POST',
    body: { email: 'client@punjabshiplogistics.com', password: 'Demo@123' },
  })
  assert.equal(sellerLogin.response.status, 200)
  const sellerToken = sellerLogin.payload.accessToken
  await request(`${baseUrl}/api/pickup-addresses/import`, {
    token: sellerToken,
    method: 'POST',
    body: [{ pickup: { contactName: 'Test Warehouse', addressLine1: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001' } }],
  })
  const internationalOrder = await request(`${baseUrl}/api/orders/b2c/create`, {
    token: sellerToken,
    method: 'POST',
    body: {
      order_number: `INT-${Date.now()}`, order_date: '2026-10-05', payment_type: 'prepaid', order_amount: 2000,
      package_weight: 0.5, package_length: 10, package_breadth: 10, package_height: 10,
      courier_id: 91001, courier_partner: 'PunjabShip Manual', integration_type: 'manual', freight_charges: 0,
      consignee: { name: 'Jean Test', phone: '+33123456789', address: '1 Test Street', city: 'Paris', state: 'Ile-de-France', pincode: '75001', country_code: 'FR' },
      pickup: { name: 'Test Warehouse', phone: '9000000000', address: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001', country_code: 'IN' },
      order_items: [{ name: 'Test Product', sku: 'TEST', qty: 1, price: 2000, hsn: '9999', discount: 0, tax_rate: 0 }],
    },
  })
  assert.equal(internationalOrder.response.status, 201, JSON.stringify(internationalOrder.payload))
  assert.equal(internationalOrder.payload.shipment.country, 'France')
  assert.equal(internationalOrder.payload.shipment.country_code, 'FR')

  const domestic = await request(`${baseUrl}/api/admin/zones?business_type=b2c`)
  assert.equal(domestic.response.status, 200)
  assert.deepEqual(domestic.payload.find((zone) => zone.id === 'b2c-local').countries, ['India'])
})

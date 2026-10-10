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
    body: { code: 'OC', name: 'Oceania', business_type: 'B2C', countries: ['Australia', 'New Zealand'] },
  })
  assert.equal(b2c.response.status, 201)
  assert.deepEqual(b2c.payload.countries, ['Australia', 'New Zealand'])
  assert.equal(b2c.payload.country, 'Australia')

  const b2b = await request(`${baseUrl}/api/admin/b2b/zones`, {
    token,
    method: 'POST',
    body: { code: 'AE', name: 'UAE', countries: ['United Arab Emirates'], states: [] },
  })
  assert.equal(b2b.response.status, 201)
  assert.deepEqual(b2b.payload.data.countries, ['United Arab Emirates'])

  for (const expected of [
    { id: 'b2c-canada', code: 'CA', postalCode: 'K1A 0B1' },
    { id: 'b2c-usa', code: 'US', postalCode: '10001' },
    { id: 'b2c-europe', code: 'FR', postalCode: '75001' },
  ]) {
    const internationalQuote = await request(`${baseUrl}/api/couriers/available-to-user`, {
      method: 'POST',
      body: {
        origin: '141001', destination: expected.postalCode,
        pickupCountryCode: 'IN', deliveryCountryCode: expected.code,
        shipment_type: 'b2c', payment_type: 'prepaid', weight: 500, order_amount: 2000,
      },
    })
    assert.equal(internationalQuote.response.status, 200)
    assert.equal(internationalQuote.payload.data[0].approxZone.id, expected.id)

    const b2bQuote = await request(`${baseUrl}/api/couriers/b2b-rate-quotes`, {
      method: 'POST',
      body: {
        origin: '141001', destination: expected.postalCode,
        pickupCountryCode: 'IN', deliveryCountryCode: expected.code,
        shipment_type: 'b2b', payment_type: 'prepaid', weight: 10000, order_amount: 2000,
      },
    })
    assert.equal(b2bQuote.response.status, 200)
    assert.equal(b2bQuote.payload.data[0].approxZone.id, expected.id.replace('b2c-', 'b2b-'))
  }

  for (const legacyCountryValue of ['Canada', undefined]) {
    const legacyCanadaQuote = await request(`${baseUrl}/api/couriers/available-to-user`, {
      method: 'POST',
      body: {
        origin: '141001', destination: 'K1A 0B1',
        pickupCountryCode: 'IN',
        ...(legacyCountryValue ? { deliveryCountryCode: legacyCountryValue } : {}),
        shipment_type: 'b2c', payment_type: 'prepaid', weight: 500, order_amount: 2000,
      },
    })
    assert.equal(legacyCanadaQuote.response.status, 200)
    assert.equal(legacyCanadaQuote.payload.data[0].name, 'PunjabShip Manual')
    assert.equal(legacyCanadaQuote.payload.data[0].approxZone.id, 'b2c-canada')
  }

  const postalOptions = await request(`${baseUrl}/api/admin/zones/postal-options?country=Canada&search=A0A&limit=10`, { token })
  assert.equal(postalOptions.response.status, 200)
  assert.equal(postalOptions.payload.data[0].pincode, 'A0A')
  assert.equal(postalOptions.payload.data[0].country, 'Canada')

  const uniqueIndiaPostalOption = await request(`${baseUrl}/api/admin/zones/postal-options?country=India&states=TELANGANA&search=500005&limit=10`, { token })
  assert.equal(uniqueIndiaPostalOption.response.status, 200)
  assert.equal(uniqueIndiaPostalOption.payload.total, 1)
  assert.equal(uniqueIndiaPostalOption.payload.data[0].pincode, '500005')

  const restrictAndQuote = async ({ zoneId, businessType, country, countryCode, pincode, destination, expectedZoneId }) => {
    const restricted = await request(`${baseUrl}/api/admin/zones/${zoneId}`, {
      token,
      method: 'PUT',
      body: { postal_codes: [{ country, pincode }] },
    })
    assert.equal(restricted.response.status, 200)
    assert.equal(restricted.payload.postal_codes[0].pincode, pincode)

    const endpoint = businessType === 'b2b' ? '/api/couriers/b2b-rate-quotes' : '/api/couriers/available-to-user'
    const quote = await request(`${baseUrl}${endpoint}`, {
      method: 'POST',
      body: {
        origin: '110001', destination,
        pickupCountryCode: 'IN', deliveryCountryCode: countryCode,
        shipment_type: businessType, payment_type: 'prepaid',
        weight: businessType === 'b2b' ? 10000 : 500, order_amount: 2000,
      },
    })
    assert.equal(quote.response.status, 200)
    assert.equal(quote.payload.data[0].approxZone.id, expectedZoneId)

    const reset = await request(`${baseUrl}/api/admin/zones/${zoneId}`, {
      token,
      method: 'PUT',
      body: { postal_codes: [] },
    })
    assert.equal(reset.response.status, 200)
  }

  await restrictAndQuote({
    zoneId: 'b2c-canada', businessType: 'b2c', country: 'Canada', countryCode: 'CA',
    pincode: 'A0A', destination: 'A0A 1B2', expectedZoneId: 'b2c-canada',
  })
  await restrictAndQuote({
    zoneId: 'b2b-canada', businessType: 'b2b', country: 'Canada', countryCode: 'CA',
    pincode: 'A0A', destination: 'A0A 1B2', expectedZoneId: 'b2b-canada',
  })
  await restrictAndQuote({
    zoneId: 'b2c-special', businessType: 'b2c', country: 'India', countryCode: 'IN',
    pincode: '141001', destination: '141001', expectedZoneId: 'b2c-special',
  })
  await restrictAndQuote({
    zoneId: 'b2b-south', businessType: 'b2b', country: 'India', countryCode: 'IN',
    pincode: '141001', destination: '141001', expectedZoneId: 'b2b-south',
  })

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
      rates: { Oceania: { forward: 1250, rto: 1000 } },
      zone_slabs: {
        Oceania: {
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
      origin: '141001', destination: '2000', pickupCountryCode: 'IN', deliveryCountryCode: 'AU',
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
      consignee: { name: 'Alex Test', phone: '+61234567890', address: '1 Test Street', city: 'Sydney', state: 'NSW', pincode: '2000', country_code: 'AU' },
      pickup: { name: 'Test Warehouse', phone: '9000000000', address: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001', country_code: 'IN' },
      order_items: [{ name: 'Test Product', sku: 'TEST', qty: 1, price: 2000, hsn: '9999', discount: 0, tax_rate: 0 }],
    },
  })
  assert.equal(internationalOrder.response.status, 201, JSON.stringify(internationalOrder.payload))
  assert.equal(internationalOrder.payload.shipment.country, 'Australia')
  assert.equal(internationalOrder.payload.shipment.country_code, 'AU')

  const domestic = await request(`${baseUrl}/api/admin/zones?business_type=b2c`)
  assert.equal(domestic.response.status, 200)
  assert.deepEqual(domestic.payload.find((zone) => zone.id === 'b2c-local').countries, ['India'])

  const canadaServiceability = await request(`${baseUrl}/api/serviceability/locations?country=Canada&pincode=A0A`)
  assert.equal(canadaServiceability.response.status, 200)
  assert.equal(canadaServiceability.payload.data[0].country, 'Canada')
  assert.equal(canadaServiceability.payload.data[0].pincode, 'A0A')
  assert.equal(canadaServiceability.payload.data[0].postalCodeType, 'routing-prefix')
  assert.deepEqual(canadaServiceability.payload.data[0].tags, ['routing-area'])
  assert.match(canadaServiceability.payload.data[0].city, /Avalon Peninsula/)

  const francePostalCodes = await request(`${baseUrl}/api/serviceability/locations?country=France&pincode=75`)
  assert.equal(francePostalCodes.response.status, 200)
  assert.ok(francePostalCodes.payload.total > 100)
  assert.equal(francePostalCodes.payload.data[0].country, 'France')
  assert.ok(francePostalCodes.payload.data[0].pincode.includes('75'))
  assert.equal(francePostalCodes.payload.data[0].isSystemPostalCode, true)
  assert.equal(francePostalCodes.payload.data[0].postalCodeType, 'full')
  assert.deepEqual(francePostalCodes.payload.data[0].tags, ['full-postal-code'])

  const allCanadaPostalCodes = await request(`${baseUrl}/api/serviceability/locations?country=Canada`)
  assert.equal(allCanadaPostalCodes.response.status, 200)
  assert.ok(allCanadaPostalCodes.payload.total > 1600)
  assert.equal(allCanadaPostalCodes.payload.data[0].country, 'Canada')
  assert.notEqual(allCanadaPostalCodes.payload.data[0].pincode, 'All valid postal codes')

  const customUsLocation = await request(`${baseUrl}/api/serviceability/locations`, {
    token,
    method: 'POST',
    body: { country: 'United States', pincode: '10001', city: 'New York', state: 'New York', tags: ['country-wide'] },
  })
  assert.equal(customUsLocation.response.status, 201)
  assert.equal(customUsLocation.payload.country, 'United States')

})

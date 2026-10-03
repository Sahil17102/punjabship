import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import test from 'node:test'

const waitForHealth = async (baseUrl, child, diagnostics) => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API exited early: ${diagnostics.join('')}`)
    try {
      const response = await fetch(`${baseUrl}/api/health`)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`API did not become ready: ${diagnostics.join('')}`)
}

const jsonRequest = async (url, { token, method = 'GET', body } = {}) => {
  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) })
  const payload = await response.json()
  return { response, payload }
}

const csvRequest = async (url, token, csv, fields = {}) => {
  const form = new FormData()
  form.append('file', new Blob([csv], { type: 'text/csv' }), 'import.csv')
  for (const [key, value] of Object.entries(fields)) form.append(key, String(value))
  const response = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form })
  return { response, payload: await response.json() }
}

test('PunjabShip import endpoints accept their downloaded CSV formats', { timeout: 30_000 }, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'punjabship-import-test-'))
  const port = 23000 + Math.floor(Math.random() * 8000)
  const baseUrl = `http://127.0.0.1:${port}`
  const diagnostics = []
  const child = spawn(process.execPath, ['panels/local-api.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      ADMIN_PASSWORD: 'ImportTest@123',
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
  await waitForHealth(baseUrl, child, diagnostics)

  const adminLogin = await jsonRequest(`${baseUrl}/api/auth/admin/login`, {
    method: 'POST',
    body: { email: 'admin@punjabshiplogistics.com', password: 'ImportTest@123' },
  })
  assert.equal(adminLogin.response.status, 200)
  const adminToken = adminLogin.payload.accessToken

  const b2bRates = await csvRequest(
    `${baseUrl}/api/admin/b2b/zone-rates/import`, adminToken,
    'origin_zone_code,destination_zone_code,rate_per_kg,min_charge,max_weight_limit\nN,W,13.25,132.5,1000\n',
    { courier_id: 91001, service_provider: 'manual', plan_id: 'starter-b2b' },
  )
  assert.equal(b2bRates.response.status, 200, JSON.stringify(b2bRates.payload))
  assert.equal(b2bRates.payload.updated, 1)

  const overheads = await csvRequest(
    `${baseUrl}/api/admin/b2b/additional-charges/import`, adminToken,
    'courier_id,service_provider,plan_id,awb_charges,cft_factor,cod_method\n91001,manual,starter-b2b,50,5,whichever_is_higher\n',
  )
  assert.equal(overheads.response.status, 200, JSON.stringify(overheads.payload))
  assert.equal(overheads.payload.inserted, 1)

  const b2bPincodes = await csvRequest(
    `${baseUrl}/api/admin/b2b/pincodes/import`, adminToken,
    'pincode,is_oda,is_remote,is_mall,is_sez,is_airport,is_high_security\n141001,1,no,0,false,false,yes\n',
    { zoneId: 'b2b-north' },
  )
  assert.equal(b2bPincodes.response.status, 200, JSON.stringify(b2bPincodes.payload))
  assert.equal(b2bPincodes.payload.inserted, 1)

  const mappings = await csvRequest(
    `${baseUrl}/api/admin/zones/b2c-local/mappings/import`, adminToken,
    'pincode,city,state\n141002,Ludhiana,Punjab\n',
  )
  assert.equal(mappings.response.status, 200, JSON.stringify(mappings.payload))
  assert.equal(mappings.payload.inserted, 1)

  const b2bCard = await csvRequest(
    `${baseUrl}/api/admin/couriers/shipping-rates/import?planId=starter-b2b&businessType=b2b`, adminToken,
    'Courier ID,Courier Name,Service Provider,Mode,Business Type,Min Weight,North (Per Kg Forward),North (Per Kg RTO),COD Charges,COD Percent,Other Charges\n91001,PunjabShip Manual,manual,surface,b2b,10,12,10,75,1,0\n',
  )
  assert.equal(b2bCard.response.status, 200, JSON.stringify(b2bCard.payload))
  assert.equal(b2bCard.payload.data.savedRows, 1)

  const b2cCard = await csvRequest(
    `${baseUrl}/api/admin/couriers/shipping-rates/import?planId=starter-b2c&businessType=b2c&importScope=single&courierId=91001&courierName=PunjabShip%20Manual&serviceProvider=manual`, adminToken,
    'Slab,Courier ID,Courier,Service Provider,Mode,Weight (KG),Slab Type,Local,COD Rs,COD %,RTO %\n500 GM,91001,PunjabShip Manual,manual,standard,0.5,First,45,35,1.5,90\n',
  )
  assert.equal(b2cCard.response.status, 200, JSON.stringify(b2cCard.payload))
  assert.equal(b2cCard.payload.data.savedRows, 1)

  const manualPincodes = await csvRequest(
    `${baseUrl}/api/admin/manual-couriers/manual-punjabship/pincodes/import`, adminToken,
    'pincode\n141003\n', { mode: 'append' },
  )
  assert.equal(manualPincodes.response.status, 200, JSON.stringify(manualPincodes.payload))

  const sellerLogin = await jsonRequest(`${baseUrl}/api/auth/request-password-login`, {
    method: 'POST', body: { email: 'client@punjabshiplogistics.com', password: 'Demo@123' },
  })
  assert.equal(sellerLogin.response.status, 200)
  const pickupImport = await jsonRequest(`${baseUrl}/api/pickup-addresses/import`, {
    method: 'POST', token: sellerLogin.payload.accessToken,
    body: [{ pickup: { contactName: 'Import Warehouse', addressLine1: 'Model Town', pincode: '141004' } }],
  })
  assert.equal(pickupImport.response.status, 200, JSON.stringify(pickupImport.payload))
  assert.equal(pickupImport.payload.imported, 1)
})


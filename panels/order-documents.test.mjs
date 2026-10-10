import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'

const jsonRequest = async (url, { token, method = 'GET', body } = {}) => {
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

test('fresh order documents contain current international order details', { timeout: 30_000 }, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'punjabship-documents-'))
  const port = 32000 + Math.floor(Math.random() * 1000)
  const baseUrl = `http://127.0.0.1:${port}`
  const diagnostics = []
  const child = spawn(process.execPath, ['panels/local-api.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', PUNJABSHIP_DATA_FILE: join(directory, 'state.json') },
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
      if ((await fetch(`${baseUrl}/api/health`)).ok) break
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  const login = await jsonRequest(`${baseUrl}/api/auth/request-password-login`, {
    method: 'POST', body: { email: 'client@punjabshiplogistics.com', password: 'Demo@123' },
  })
  assert.equal(login.response.status, 200)
  const token = login.payload.accessToken
  const sellerId = login.payload.user?.id || login.payload.data?.user?.id
  assert.ok(sellerId)

  const pickup = await jsonRequest(`${baseUrl}/api/pickup-addresses/import`, {
    token,
    method: 'POST',
    body: [{ pickup: { contactName: 'Punjab Warehouse', addressLine1: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001' } }],
  })
  assert.equal(pickup.response.status, 200, JSON.stringify(pickup.payload))

  const adminLogin = await jsonRequest(`${baseUrl}/api/auth/admin/login`, {
    method: 'POST', body: { email: 'admin@punjabshiplogistics.com', password: 'Demo@123' },
  })
  assert.equal(adminLogin.response.status, 200)
  const credit = await jsonRequest(`${baseUrl}/api/admin/wallets/${sellerId}/adjust`, {
    token: adminLogin.payload.accessToken,
    method: 'POST',
    body: { type: 'credit', amount: 1000, reason: 'Document test setup' },
  })
  assert.equal(credit.response.status, 200, JSON.stringify(credit.payload))

  const created = await jsonRequest(`${baseUrl}/api/orders/b2c/create`, {
    token,
    method: 'POST',
    body: {
      order_number: 'DOC-CA-1001', order_date: '2026-10-05', invoice_date: '2026-10-05', invoice_no: 'INV-CA-1001',
      payment_type: 'prepaid', order_amount: 225, shipping_charges: 25, package_weight: 0.5,
      package_length: 10, package_breadth: 10, package_height: 10, courier_id: 91001,
      courier_partner: 'PunjabShip Manual', integration_type: 'manual', currency_code: 'CAD',
      consignee: { name: 'Alex Canada', phone: '+1 613 555 0100', email: 'alex@example.com', address: '111 Wellington Street', city: 'Ottawa', state: 'Ontario', pincode: 'K1A 0A9', country_code: 'CA' },
      pickup: { name: 'Punjab Warehouse', address: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001', country_code: 'IN' },
      order_items: [{ name: 'Cotton Shirt', sku: 'SHIRT-01', qty: 2, price: 100, hsn: '610510' }],
    },
  })
  assert.equal(created.response.status, 201, JSON.stringify(created.payload))
  const order = created.payload.shipment

  const unauthenticated = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(order.id)}/documents/label`)
  assert.equal(unauthenticated.status, 401)

  const expectedByType = {
    label: ['Alex Canada', 'Ottawa, Ontario, K1A 0A9, Canada', 'VALUE: CAD 225.00'],
    invoice: ['Cotton Shirt', 'SKU: SHIRT-01 | HSN: 610510', 'Invoice Total', 'CAD 225.00', 'Date: 05/10/2026'],
  }
  const previewDirectory = process.env.PUNJABSHIP_PDF_OUTPUT_DIR
  if (previewDirectory) await mkdir(previewDirectory, { recursive: true })
  for (const [type, expectedText] of Object.entries(expectedByType)) {
    const response = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(order.id)}/documents/${type}`, { headers: { Authorization: `Bearer ${token}` } })
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'application/pdf')
    assert.match(response.headers.get('cache-control') || '', /no-store/)
    const pdfBuffer = Buffer.from(await response.arrayBuffer())
    if (previewDirectory) await writeFile(join(previewDirectory, `${type}.pdf`), pdfBuffer)
    const pdf = pdfBuffer.toString('latin1')
    expectedText.forEach((value) => assert.match(pdf, new RegExp(value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))))
  }

  const manifested = await jsonRequest(`${baseUrl}/api/orders/b2c/manifest`, {
    token, method: 'POST', body: { awbs: [order.awb_number], type: 'b2c' },
  })
  assert.equal(manifested.response.status, 200, JSON.stringify(manifested.payload))
  const manifestResponse = await fetch(`${baseUrl}/api/orders/${encodeURIComponent(order.id)}/documents/manifest`, { headers: { Authorization: `Bearer ${token}` } })
  assert.equal(manifestResponse.status, 200)
  const manifestBuffer = Buffer.from(await manifestResponse.arrayBuffer())
  if (previewDirectory) await writeFile(join(previewDirectory, 'manifest.pdf'), manifestBuffer)
  const manifestPdf = manifestBuffer.toString('latin1')
  assert.match(manifestPdf, /Alex Canada/)
  assert.match(manifestPdf, /Destination: Ottawa, Ontario, K1A 0A9, Canada/)
})

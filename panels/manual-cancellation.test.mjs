import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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
  const payload = await response.json()
  return { response, payload }
}

test('manual shipment cancellation updates tracking and refunds freight exactly once', { timeout: 30_000 }, async (t) => {
  const directory = await mkdtemp(join(tmpdir(), 'punjabship-manual-cancel-'))
  const dataFile = join(directory, 'state.json')
  const port = 33000 + Math.floor(Math.random() * 1000)
  const baseUrl = `http://127.0.0.1:${port}`
  const diagnostics = []
  const child = spawn(process.execPath, ['panels/local-api.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), HOST: '127.0.0.1', PUNJABSHIP_DATA_FILE: dataFile },
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

  const login = await request(`${baseUrl}/api/auth/request-password-login`, {
    method: 'POST', body: { email: 'client@punjabshiplogistics.com', password: 'Demo@123' },
  })
  assert.equal(login.response.status, 200)
  const token = login.payload.accessToken
  const sellerId = login.payload.user?.id || login.payload.data?.user?.id
  assert.ok(sellerId)

  const pickup = await request(`${baseUrl}/api/pickup-addresses/import`, {
    token, method: 'POST',
    body: [{ pickup: { contactName: 'Cancel Test Warehouse', addressLine1: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001' } }],
  })
  assert.equal(pickup.response.status, 200)

  const adminLogin = await request(`${baseUrl}/api/auth/admin/login`, {
    method: 'POST', body: { email: 'admin@punjabshiplogistics.com', password: 'Demo@123' },
  })
  assert.equal(adminLogin.response.status, 200)
  const credit = await request(`${baseUrl}/api/admin/wallets/${sellerId}/adjust`, {
    token: adminLogin.payload.accessToken, method: 'POST',
    body: { type: 'credit', amount: 2500, reason: 'Manual cancellation test setup' },
  })
  assert.equal(credit.response.status, 200)

  const created = await request(`${baseUrl}/api/orders/b2c/create`, {
    token, method: 'POST',
    body: {
      order_number: 'MANUAL-CANCEL-1001', order_date: '2026-10-10', payment_type: 'prepaid', order_amount: 1000,
      package_weight: 0.5, package_length: 10, package_breadth: 10, package_height: 10,
      courier_id: 91001, courier_partner: 'PunjabShip Manual', integration_type: 'manual', walletDebitAmount: 450,
      consignee: { name: 'Cancellation Test', phone: '9000000000', address: 'Test Address', city: 'Delhi', state: 'Delhi', pincode: '110001', country_code: 'IN' },
      pickup: { name: 'Cancel Test Warehouse', address: 'Model Town', city: 'Ludhiana', state: 'Punjab', pincode: '141001', country_code: 'IN' },
      order_items: [{ name: 'Test item', sku: 'CANCEL-1', qty: 1, price: 1000, hsn: '9999' }],
    },
  })
  assert.equal(created.response.status, 201, JSON.stringify(created.payload))
  const order = created.payload.shipment

  const unauthenticated = await request(`${baseUrl}/api/shipments/cancel`, {
    method: 'POST', body: { orderId: order.id },
  })
  assert.equal(unauthenticated.response.status, 401)

  const beforeCancel = await request(`${baseUrl}/api/payments/wallet/balance`, { token })
  assert.equal(beforeCancel.payload.balance, 2050)

  const cancelled = await request(`${baseUrl}/api/shipments/cancel`, {
    token, method: 'POST', body: { orderId: order.id },
  })
  assert.equal(cancelled.response.status, 200, JSON.stringify(cancelled.payload))
  assert.equal(cancelled.payload.order.order_status, 'cancelled')
  assert.equal(cancelled.payload.walletRefund, 450)
  assert.equal(cancelled.payload.walletBalance, 2500)

  const repeat = await request(`${baseUrl}/api/shipments/cancel`, {
    token, method: 'POST', body: { orderId: order.id },
  })
  assert.equal(repeat.response.status, 200)
  assert.equal(repeat.payload.alreadyCancelled, true)

  const afterCancel = await request(`${baseUrl}/api/payments/wallet/balance`, { token })
  assert.equal(afterCancel.payload.balance, 2500)

  await new Promise((resolve) => setTimeout(resolve, 100))
  const savedState = JSON.parse(await readFile(dataFile, 'utf8'))
  const savedOrder = savedState.orders.find((item) => item.id === order.id)
  const shipment = savedState.manualShipments.find((item) => item.orderId === order.id)
  const refundTransactions = savedState.walletTransactions.filter((item) => item.meta?.order_id === order.id && item.reason === 'shipment_cancellation_refund')
  assert.equal(savedOrder.order_status, 'cancelled')
  assert.equal(savedOrder.tracking_events[0].status_code, 'cancelled')
  assert.equal(shipment.operationStatus, 'cancelled')
  assert.equal(refundTransactions.length, 1)
})

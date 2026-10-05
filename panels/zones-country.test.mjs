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

  const domestic = await request(`${baseUrl}/api/admin/zones?business_type=b2c`)
  assert.equal(domestic.response.status, 200)
  assert.deepEqual(domestic.payload.find((zone) => zone.id === 'b2c-local').countries, ['India'])
})

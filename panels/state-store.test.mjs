import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { createStateStore } from './state-store.mjs'

test('local fallback persists state atomically across restarts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'punjabship-state-'))
  const localFile = pathToFileURL(join(directory, 'state.json'))

  try {
    const first = await createStateStore({ defaultState: { orders: [] }, localFile })
    first.state.orders.push({ id: 'order-1' })
    await first.save(first.state)

    const second = await createStateStore({ defaultState: { orders: [] }, localFile })
    assert.equal(second.mode, 'local-file')
    assert.deepEqual(second.state.orders, [{ id: 'order-1' }])
    assert.deepEqual(JSON.parse(await readFile(localFile, 'utf8')).orders, [{ id: 'order-1' }])
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})

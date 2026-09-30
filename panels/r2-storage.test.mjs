import assert from 'node:assert/strict'
import test from 'node:test'
import { createObjectKey, isOwnerKey, isPunjabShipKey } from './r2-storage.mjs'

test('isolates object keys beneath the PunjabShip user prefix', () => {
  const key = createObjectKey({
    ownerId: 'seller-123',
    folder: 'kyc',
    filename: '../../passport scan.pdf',
  })

  assert.match(key, /^punjabship\/users\/seller-123\/kyc\/\d{4}-\d{2}-\d{2}\/[a-f0-9-]+-passport-scan\.pdf$/)
  assert.equal(isPunjabShipKey(key), true)
  assert.equal(isOwnerKey(key, 'seller-123'), true)
  assert.equal(isOwnerKey(key, 'another-seller'), false)
})

test('keeps public content inside the PunjabShip public prefix', () => {
  const key = createObjectKey({ ownerId: 'admin', folder: 'about-us', filename: 'hero.png', publicObject: true })
  assert.match(key, /^punjabship\/public\/about-us\//)
  assert.equal(isPunjabShipKey(key), true)
})

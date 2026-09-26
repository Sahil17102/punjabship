import assert from 'node:assert/strict'
import test from 'node:test'
import { buildSellerTourSteps } from '../src/components/tour/sellerTourSteps'
import { getTourPageId } from '../src/utils/sellerTour'

test('B2C sellers only receive the B2C order tour', () => {
  const ids = buildSellerTourSteps(['b2c']).map((step) => step.id)
  assert.ok(ids.includes('b2c-shipments'))
  assert.ok(!ids.includes('b2b-shipments'))
})

test('B2B sellers only receive the B2B order tour', () => {
  const ids = buildSellerTourSteps(['b2b']).map((step) => step.id)
  assert.ok(ids.includes('b2b-shipments'))
  assert.ok(!ids.includes('b2c-shipments'))
})

test('mixed and legacy sellers receive both applicable order tours', () => {
  for (const businessType of [['b2c', 'b2b'], []]) {
    const ids = buildSellerTourSteps(businessType).map((step) => step.id)
    assert.ok(ids.includes('b2c-shipments'))
    assert.ok(ids.includes('b2b-shipments'))
  }
})

test('all routed steps have matching stable selectors', () => {
  for (const step of buildSellerTourSteps(['b2c', 'b2b'])) {
    if (!step.path) continue
    assert.equal(step.selector, `[data-tour-page="${step.id}"]`)
    assert.equal(getTourPageId(step.path), step.id)
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { getAdminNotificationTarget } from './notificationNavigation.js'

for (const [title, expected] of [
  ['NDR captured (Delhivery)', '/admin/ops/ndr?search=ORD-123'],
  ['RTO event (Delhivery)', '/admin/ops/rto?search=ORD-123'],
  ['COD remittance created', '/admin/cod-remittance'],
  ['New Support Ticket', '/admin/support'],
  ['Order status updated', '/admin/orders?search=ORD-123'],
]) {
  test(`routes ${title} to its operational page`, () => {
    assert.equal(getAdminNotificationTarget({ title, message: 'Order ORD-123 status updated' }), expected)
  })
}

test('routes an account alert to its merchant', () => {
  assert.equal(
    getAdminNotificationTarget({ title: 'KYC review', message: 'User dde59694-c853-47d8-9e29-ceec99fc0e53 needs review' }),
    '/admin/users-management/dde59694-c853-47d8-9e29-ceec99fc0e53/overview',
  )
})

test('falls back to the dashboard for an unknown event', () => {
  assert.equal(getAdminNotificationTarget({ title: 'General notice' }), '/admin/dashboard')
})

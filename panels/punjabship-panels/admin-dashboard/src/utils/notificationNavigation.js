const getNotificationText = (notification = {}) =>
  `${notification.title || ''} ${notification.message || ''}`.trim()

const extractOrderReference = (text) => {
  const match = String(text || '').match(/\bORD-[A-Z0-9-]+\b/i)
  return match?.[0] || ''
}

const extractUserId = (text) => {
  const match = String(text || '').match(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i,
  )
  return match?.[0] || ''
}

const withSearch = (path, search) =>
  search ? `${path}?search=${encodeURIComponent(search)}` : path

export const getAdminNotificationTarget = (notification = {}) => {
  const text = getNotificationText(notification)
  const normalized = text.toLowerCase()
  const orderReference = extractOrderReference(text)
  const userId = extractUserId(text)

  if (/\bndr\b|delivery attempt|undelivered/.test(normalized)) {
    return withSearch('/admin/ops/ndr', orderReference)
  }

  if (/\brto\b|return to origin/.test(normalized)) {
    return withSearch('/admin/ops/rto', orderReference)
  }

  if (/\bcod\b|remittance|settlement/.test(normalized)) return '/admin/cod-remittance'
  if (/support|ticket/.test(normalized)) return '/admin/support'
  if (/wallet|recharge|payment/.test(normalized)) return '/admin/wallet'
  if (/weight|discrepancy/.test(normalized)) return '/admin/weight-reconciliation'
  if (/courier|serviceability|provider balance/.test(normalized)) {
    return '/admin/courier-credentials'
  }
  if (/shopify|privacy|integration|api request/.test(normalized)) {
    return '/admin/api-integration'
  }
  if (/order|shipment|delivery|delivered|document|pod|sla|oda/.test(normalized)) {
    return withSearch('/admin/orders', orderReference)
  }
  if (/kyc|merchant|onboarding|account|user/.test(normalized)) {
    return userId
      ? `/admin/users-management/${encodeURIComponent(userId)}/overview`
      : '/admin/users-management'
  }

  return '/admin/dashboard'
}

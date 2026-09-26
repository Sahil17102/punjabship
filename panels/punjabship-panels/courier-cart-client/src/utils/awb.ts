export const normalizeAwb = (awb?: string | null) => String(awb || '').trim().toUpperCase()

export const isValidAwb = (awb?: string | null) => /^[A-Z0-9-]{6,30}$/.test(normalizeAwb(awb))

export const getAwbTrackingPath = (awb: string) => `/tracking/${encodeURIComponent(normalizeAwb(awb))}`

export const getClientAwbTrackingPath = (awb: string) =>
  `/tools/order_tracking?awb=${encodeURIComponent(normalizeAwb(awb))}`

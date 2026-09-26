import type { BusinessType } from '../types/user.types'

export type OrderBusinessType = 'b2c' | 'b2b'

const normalizeBusinessTypes = (value: unknown): BusinessType[] => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => String(item).trim().toLowerCase())
    .filter((item): item is BusinessType => item === 'b2c' || item === 'b2b' || item === 'd2c')
}

export const getVisibleOrderTypes = (value: unknown): OrderBusinessType[] => {
  const businessTypes = normalizeBusinessTypes(value)

  // Profiles created before business-type gating have no preference saved.
  if (businessTypes.length === 0) return ['b2c', 'b2b']

  const visible: OrderBusinessType[] = []
  if (businessTypes.includes('b2c') || businessTypes.includes('d2c')) visible.push('b2c')
  if (businessTypes.includes('b2b')) visible.push('b2b')
  return visible
}

export const canAccessOrderType = (value: unknown, orderType: OrderBusinessType) =>
  getVisibleOrderTypes(value).includes(orderType)


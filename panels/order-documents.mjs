const finitePositive = (value) => Number.isFinite(Number(value)) && Number(value) > 0

export const documentWeightKg = (order = {}) => {
  const source = [order.package_weight, order.weight, order.chargeable_weight].find(finitePositive)
  if (source === undefined) return 0.5
  const rawWeight = Number(source)
  const kilograms = String(order.type || '').toLowerCase() === 'b2c' ? rawWeight / 1000 : rawWeight
  return Number(kilograms.toFixed(3))
}

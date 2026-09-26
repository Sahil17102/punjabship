import { getDefaultPickupSlot } from '../../utils/pickupSchedule'
import type { B2CFormData, Product } from './b2c/B2COrderForm'

const toMoney = (value: unknown) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const normalizeObject = (value: unknown): Record<string, any> => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }

  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {}
}

const normalizeProducts = (value: unknown): Product[] => {
  const raw = (() => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  })()

  const products = raw.map((item: any) => ({
    productName: item?.productName ?? item?.name ?? item?.title ?? 'Product',
    price: Number(item?.price ?? 0),
    quantity: Number(item?.quantity ?? item?.qty ?? 1) || 1,
    discount: Number(item?.discount ?? 0),
    taxRate: Number(item?.taxRate ?? item?.tax_rate ?? 0),
    hsnCode: item?.hsnCode ?? item?.hsn ?? '',
    sku: item?.sku ?? 'NA',
  }))

  return products.length ? products : [{ productName: 'Product', price: 0, quantity: 1 }]
}

const getProductTotals = (products: Product[], fallback: unknown) => {
  const totalWithTax = products.reduce((sum, product) => {
    const lineTaxable = Math.max(
      0,
      toMoney(product.price) * Math.max(1, toMoney(product.quantity ?? 1)) -
        toMoney(product.discount),
    )
    return sum + lineTaxable + lineTaxable * (Math.max(0, toMoney(product.taxRate)) / 100)
  }, 0)
  const fallbackAmount = toMoney(fallback)
  return totalWithTax > 0 ? totalWithTax : fallbackAmount
}

const normalizeAddressPart = (value: unknown) => String(value || '').trim().replace(/\s+/g, ' ')

const buildDeliveryAddress = (order: Record<string, any>) => {
  const structuredParts = [
    order?.address_line_1,
    order?.address_line_2,
    order?.address_landmark,
    order?.address_locality,
  ]
    .map(normalizeAddressPart)
    .filter(Boolean)
  const parts = structuredParts.length
    ? structuredParts
    : [order?.address, order?.city].map(normalizeAddressPart).filter(Boolean)

  return parts.filter((part, index) => {
    const normalizedPart = part.toLowerCase()
    return parts.findIndex((candidate) => candidate.toLowerCase() === normalizedPart) === index
  }).join(', ')
}

const normalizePhone = (value: unknown) => {
  const digits = String(value || '').replace(/\D/g, '')
  return digits.length > 10 ? digits.slice(-10) : digits
}

export const buildB2CCloneFormValues = (order: Record<string, any>): Partial<B2CFormData> => {
  const products = normalizeProducts(order?.products)
  const productTotal = getProductTotals(products, order?.order_amount)
  const pickupDetails = normalizeObject(order?.pickup_details)
  const rtoDetails = normalizeObject(order?.rto_details)
  const defaultPickupSlot = getDefaultPickupSlot()
  const orderType = String(order?.order_type || '').toLowerCase() === 'cod' ? 'cod' : 'prepaid'
  const prepaidAmount = Number(order?.prepaid_amount ?? (orderType === 'prepaid' ? productTotal : 0))

  return {
    buyerName: order?.buyer_name || '',
    buyerPhone: normalizePhone(order?.buyer_phone),
    buyerEmail: order?.buyer_email || '',
    address: buildDeliveryAddress(order),
    addressLocality: order?.address_locality || order?.address_landmark || '',
    pincode: order?.pincode || '',
    city: order?.city || '',
    state: order?.state || '',
    country: order?.country || 'India',
    products,
    weight: Number(order?.weight ?? 0),
    length: Number(order?.length ?? 10),
    breadth: Number(order?.breadth ?? 10),
    height: Number(order?.height ?? 10),
    orderDate: new Date().toISOString().slice(0, 10),
    orderType,
    courierPartner: '',
    courierPartnerId: '',
    courierOptionKey: '',
    shippingCharges: Number(order?.shipping_charges ?? 0),
    transactionFee: Number(order?.transaction_fee ?? 0),
    giftWrap: Number(order?.gift_wrap ?? 0),
    discount: Number(order?.discount ?? 0),
    prepaidAmount,
    courierCod: 0,
    otherCharges: 0,
    forwardCharges: 0,
    courierCost: null,
    isRtoSame: !rtoDetails?.pincode,
    orderAmount:
      productTotal +
      Number(order?.shipping_charges ?? 0) +
      Number(order?.transaction_fee ?? 0) +
      Number(order?.gift_wrap ?? 0) -
      Number(order?.discount ?? 0) -
      prepaidAmount,
    pickupDate: defaultPickupSlot.pickupDate,
    pickupTime: defaultPickupSlot.pickupTime,
    pickupLocationId: String(order?.pickup_location_id || pickupDetails?.id || ''),
    pickupLocationName: pickupDetails?.warehouse_name || pickupDetails?.name || '',
    pickupAddress: pickupDetails?.address || '',
    pickupLocationPOCName: pickupDetails?.name || pickupDetails?.poc_name || '',
    pickupLocationPOCPhone: normalizePhone(pickupDetails?.phone || pickupDetails?.poc_phone),
    pickupCity: pickupDetails?.city || '',
    pickupState: pickupDetails?.state || '',
    pickupLocationPincode: pickupDetails?.pincode || '',
    rtoLocationName: rtoDetails?.warehouse_name || rtoDetails?.name || '',
    rtoAddress: rtoDetails?.address || '',
    rtoLocationPOCName: rtoDetails?.name || rtoDetails?.poc_name || '',
    rtoLocationPOCPhone: normalizePhone(rtoDetails?.phone || rtoDetails?.poc_phone),
    rtoCity: rtoDetails?.city || '',
    rtoState: rtoDetails?.state || '',
    rtoLocationPincode: rtoDetails?.pincode || '',
    integrationType: undefined,
    selectedMaxSlabWeight: null,
    amazonRequestToken: null,
    amazonRateId: null,
    amazonServiceId: null,
    amazonCarrierId: null,
    shadowfaxForwardMode: undefined,
    shadowfaxServiceMode: undefined,
    zone: '',
    zoneId: '',
    chargeableWeight: null,
    volumetricWeight: null,
    slabs: null,
  }
}

export const getCloneOrderNavigationState = (
  order: Record<string, any>,
  mode: 'clone' | 'reship',
) => ({
  cloneOrder: buildB2CCloneFormValues(order),
  cloneMode: mode,
  sourceOrderNumber: order?.order_number || order?.order_id || '',
})

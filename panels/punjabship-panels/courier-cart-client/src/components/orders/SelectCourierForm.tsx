import { Box, Chip, CircularProgress, Divider, Grid, MenuItem, Paper, Select, Stack, Typography, alpha } from '@mui/material'
import { useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { BiCalendar, BiCheckCircle, BiMap, BiPackage, BiUser } from 'react-icons/bi'
import { TbPlane, TbTruck } from 'react-icons/tb'
import {
  useAvailableCouriers,
  type UseAvailableCouriersParams,
} from '../../hooks/Integrations/useCouriers'
import { courierLogos, defaultLogo } from '../../utils/constants'
import type { Box as B2BBox, B2BFormData } from './b2b/B2BOrderForm'
import type { B2CFormData } from './b2c/B2COrderForm'

const ACCENT = '#0877C9'
const TEXT_PRIMARY = '#17171A'
const TEXT_SECONDARY = '#4C6185'
const SURFACE = '#F6F8FC'
type CourierSortOption = 'recommended' | 'price_low_to_high' | 'faster_delivery'

const breakdownRowStyles = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 1.2,
  alignItems: 'center',
} as const

const toMoney = (value: unknown) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

export const SelectCourierForm = ({ shipment_type }: { shipment_type: 'b2b' | 'b2c' }) => {
  const { watch, setValue, clearErrors } = useFormContext<B2BFormData | B2CFormData>()
  const [courierSort, setCourierSort] = useState<CourierSortOption>('recommended')
  const watchFormValue = watch as any
  const setFormValue = setValue as any

  const products = watch('products') ?? []
  const deliveryPincode = watch('pincode') ?? ''
  const pickupPincode = watch('pickupLocationPincode') ?? ''
  const pickupName = watch('pickupLocationName') ?? ''
  const pickupId = watch('pickupLocationId') ?? ''
  const pickupPhone = watchFormValue('pickupLocationPOCPhone') ?? ''
  const pickupAddressLine = watch('pickupAddress') ?? ''
  const pickupCity = watch('pickupCity') ?? ''
  const pickupState = watch('pickupState') ?? ''
  const buyerName = watchFormValue('buyerName') ?? ''
  const buyerPhone = watchFormValue('buyerPhone') ?? ''
  const deliveryAddressLine = watch('address') ?? ''
  const deliveryCity = watch('city') ?? ''
  const deliveryState = watch('state') ?? ''
  const length = watch('length') ?? 0
  const breadth = watch('breadth') ?? 0
  const height = watch('height') ?? 0
  const prepaidAmount = Number(watch('prepaidAmount') ?? 0)
  const orderType = watch('orderType') ?? 'prepaid'
  const selectedCourierId = watch('courierPartnerId') ?? ''
  const selectedCourierOptionKey = watch('courierOptionKey') ?? ''
  const selectedShadowfaxForwardMode = watch('shadowfaxForwardMode') ?? undefined
  const selectedShadowfaxServiceMode = watch('shadowfaxServiceMode') ?? undefined
  const freightMode = String(watchFormValue('freightMode') || 'fod') as 'fop' | 'fod'
  const rovType = String(watchFormValue('rovType') || 'owner') as 'owner' | 'courier' | 'none'
  const shippingCharges = Number(watch('shippingCharges') || 0)
  const transactionFee = Number(watch('transactionFee') || 0)
  const giftWrap = Number(watch('giftWrap') || 0)
  const discount = Number(watch('discount') || 0)
  const courierCod = Number(watch('courierCod') || 0)
  const forwardCharges = Number(watch('forwardCharges') || 0)
  const otherCharges = Number(watch('otherCharges') || 0)
  const gstPercent = Number(watchFormValue('gstPercent') || 0)
  const gstAmount = Number(watchFormValue('gstAmount') || 0)
  const walletDebitAmount = Number(watchFormValue('walletDebitAmount') || 0)
  const formOrderAmount = Math.max(0, toMoney(watchFormValue('orderAmount')))
  const activeRateKey = 'forward'
  const effectivePaymentType: 'cod' | 'prepaid' = orderType
  const originPincode = pickupPincode
  const destinationPincode = deliveryPincode
  const originName = pickupName
  const originPhone = pickupPhone
  const originAddressLine = pickupAddressLine
  const originCity = pickupCity
  const originState = pickupState
  const destinationName = buyerName
  const destinationPhone = buyerPhone
  const destinationAddressLine = deliveryAddressLine
  const destinationCity = deliveryCity
  const destinationState = deliveryState

  // COMPUTE TOTAL WEIGHT AND PRICE
  let totalWeight = 0
  let totalProductTaxable = 0
  let totalProductTax = 0
  let b2bMaxLength = 0
  let b2bMaxBreadth = 0
  let b2bMaxHeight = 0

  if (shipment_type === 'b2b') {
    const boxes = watch('boxes') as B2BBox[] | undefined
    if (boxes && Array.isArray(boxes)) {
      boxes.forEach((box: B2BBox) => {
        const actualWeightKg = Number(box.weightKg ?? 0)
        const quantity = Math.max(1, Number(box.quantity ?? 1))
        const boxLength = Number(box.lengthCm ?? 0)
        const boxBreadth = Number(box.breadthCm ?? 0)
        const boxHeight = Number(box.heightCm ?? 0)

        totalWeight += actualWeightKg * quantity * 1000
        b2bMaxLength = Math.max(b2bMaxLength, boxLength)
        b2bMaxBreadth = Math.max(b2bMaxBreadth, boxBreadth)
        b2bMaxHeight = Math.max(b2bMaxHeight, boxHeight)
      })
    }
    totalProductTaxable = (watch('invoices') as { invoiceValue?: number }[] | undefined)?.reduce(
      (sum, invoice) => sum + Number(invoice.invoiceValue || 0),
      0,
    ) ?? 0
  } else if (shipment_type === 'b2c') {
    totalWeight = watch('weight') ?? 0
    ;(products || []).forEach((p: any) => {
      const lineTaxable = Math.max(
        0,
        toMoney(p.price) * Math.max(1, toMoney(p.quantity ?? p.qty ?? 1)) - toMoney(p.discount),
      )
      const lineTax = lineTaxable * (Math.max(0, toMoney(p.taxRate ?? p.tax_rate)) / 100)
      totalProductTaxable += lineTaxable
      totalProductTax += lineTax
    })
  }

  const totalProductPrice = totalProductTaxable + totalProductTax
  // Total shown to seller: customer-facing charges only (what customer pays)
  // Includes: products + item taxes + shipping + transaction_fee + gift_wrap - discount - prepaid
  // Does NOT include courier freight/COD/other charges (those are what seller pays to courier)
  const computedCollectableValue =
    totalProductPrice + shippingCharges + transactionFee + giftWrap - discount - prepaidAmount
  const courierPayloadOrderAmount =
    shipment_type === 'b2c'
      ? Math.max(formOrderAmount || computedCollectableValue, 0)
      : Math.max(totalProductPrice, 0)
  const totalOrderValue =
    shipment_type === 'b2c' ? courierPayloadOrderAmount : computedCollectableValue

  const cod = effectivePaymentType === 'cod' ? 1 : 0
  const hasRequiredPackageDetails =
    Number(totalWeight) > 0 &&
    (shipment_type !== 'b2c' ||
      (Number(length) > 0 && Number(breadth) > 0 && Number(height) > 0))
  const hasRequiredOrderAmount = shipment_type !== 'b2c' || courierPayloadOrderAmount > 0
  const canFetchCouriers = Boolean(
    originPincode && destinationPincode && hasRequiredPackageDetails && hasRequiredOrderAmount,
  )

  const preferredShadowfaxForwardMode: 'marketplace' | 'warehouse' | undefined =
    selectedShadowfaxForwardMode ?? 'marketplace'

  // COURIER API payload
  const courierPayload: UseAvailableCouriersParams = {
    pickupPincode: originPincode,
    deliveryPincode: destinationPincode,
    pickupName: originName,
    pickupId,
    pickupPhone: originPhone,
    pickupAddress: originAddressLine,
    pickupCity: originCity,
    pickupState: originState,
    deliveryName: destinationName,
    deliveryPhone: destinationPhone,
    deliveryAddress: destinationAddressLine,
    deliveryCity: destinationCity,
    deliveryState: destinationState,
    pickupAddressKey: `${originPincode}-${originAddressLine}-${originCity}-${originState}`,
    deliveryAddressKey: `${destinationPincode}-${destinationAddressLine}-${destinationCity}-${destinationState}`,
    weight: totalWeight,
    cod,
    payment_type: effectivePaymentType,
    orderAmount: courierPayloadOrderAmount,
    shipmentType: shipment_type,
    enabled: canFetchCouriers,
    ...(shipment_type === 'b2c'
      ? {
          context: 'shipment_courier_selection',
        }
      : {}),
    ...(preferredShadowfaxForwardMode ? { shadowfax_forward_mode: preferredShadowfaxForwardMode } : {}),
    shadowfax_service_mode: selectedShadowfaxServiceMode ?? undefined,
    ...(shipment_type === 'b2b'
      ? {
          length: b2bMaxLength,
          breadth: b2bMaxBreadth,
          height: b2bMaxHeight,
          freight_mode: freightMode,
          rov_type: rovType,
          deliveryAddress: deliveryAddressLine,
        }
      : {}),
  }

  if (shipment_type === 'b2c') {
    courierPayload.length = length
    courierPayload.breadth = breadth
    courierPayload.height = height
  }

  const { data: couriers, isLoading, isError, isFetching } = useAvailableCouriers(courierPayload)
  const availableCouriers = couriers ?? []

  const getCourierOptionKey = (courier: any) =>
    String(courier?.courier_option_key ?? courier?.id ?? courier?.courier_id ?? '')
  const isCourierBookingUnavailable = (courier: any) =>
    courier?.booking_available === false ||
    courier?.can_book === false ||
    courier?.provider_serviceability?.booking_available === false ||
    courier?.provider_serviceability?.can_book === false
  const getCourierBookingBlockedReason = (courier: any) =>
    String(
      courier?.booking_blocked_reason ||
        courier?.provider_serviceability?.booking_blocked_reason ||
        'This courier is not bookable for the current pickup and delivery combination.',
    )

  useEffect(() => {
    if (effectivePaymentType !== 'cod') {
      setValue('courierCod', 0)
    }
  }, [effectivePaymentType, setValue])

  useEffect(() => {
    const selectedCourier = availableCouriers.find((courier) => {
      const courierOptionKey = getCourierOptionKey(courier)
      return selectedCourierOptionKey
        ? selectedCourierOptionKey === courierOptionKey
        : String(selectedCourierId) === String(courier?.id ?? courier?.courier_id ?? '')
    })

    if (!selectedCourier || !isCourierBookingUnavailable(selectedCourier)) return

    setValue('courierPartner', '')
    setValue('courierPartnerId', '')
    setValue('courierOptionKey', '')
    setValue('amazonRequestToken', null)
    setValue('amazonRateId', null)
    setValue('amazonServiceId', null)
    setValue('amazonCarrierId', null)
    setValue('selectedMaxSlabWeight', null)
    setValue('courierCod', 0)
    setValue('forwardCharges', 0)
    setValue('otherCharges', 0)
    setFormValue('gstPercent', 0)
    setFormValue('gstAmount', 0)
    setFormValue('walletDebitAmount', 0)
    setValue('courierCost', null)
    setValue('integrationType', undefined)
    setValue('shadowfaxForwardMode', undefined)
    setValue('shadowfaxServiceMode', undefined)
    setValue('zone', '')
    setValue('zoneId', '')
    setValue('chargeableWeight', null)
    setValue('volumetricWeight', null)
    setValue('slabs', null)
  }, [availableCouriers, selectedCourierId, selectedCourierOptionKey, setFormValue, setValue])

  if (!canFetchCouriers) {
    return <Typography>Fill pickup, delivery, package, and order value first to fetch couriers</Typography>
  }
  if (isLoading || isFetching)
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress color="primary" size={28} sx={{ mb: 2 }} />
        <Typography variant="body1" color="text.secondary">
          Checking serviceability and rates…
        </Typography>
      </Paper>
    )
  if (isError) return <Typography color="error">Failed to fetch couriers</Typography>
  if (!availableCouriers.length) return <Typography>No couriers available</Typography>

  const getModeIcon = (mode?: string) => {
    const normalizedMode = String(mode || '').toLowerCase()
    if (normalizedMode === 'air') return <TbPlane size={16} />
    if (normalizedMode === 'surface') return <TbTruck size={16} />
    return null
  }

  const formatCurrency = (value?: number | string | null) => `₹${Number(value || 0).toFixed(2)}`

  const formatWeightDisplay = (value?: number | string | null) => {
    const grams = Number(value ?? 0)
    if (!Number.isFinite(grams) || grams <= 0) return '-'
    if (grams < 1000) return `${Math.round(grams).toLocaleString('en-IN')} g`
    return `${(grams / 1000).toFixed(2)} kg`
  }
  const getCourierDisplayName = (courier: any) => courier?.displayName || courier?.name || 'Courier'
  const getActiveLocalRate = (courier: any) =>
    courier?.localRates?.[activeRateKey] ?? courier?.localRates?.forward ?? {}
  const getZoneDisplayName = (courier: any) => {
    const zone = courier?.approxZone || getActiveLocalRate(courier)
    const zoneName = String(zone?.name || '').trim()
    const zoneCode = String(zone?.code || '').trim()
    return (
      zoneName ||
      zoneCode ||
      String(courier?.zone_name || courier?.zone || courier?.zone_code || '').trim()
    )
  }
  const getCourierChargeableWeight = (courier: any) => {
    const activeChargeableWeight = getActiveLocalRate(courier)?.chargeable_weight
    if (shipment_type === 'b2c') {
      return activeChargeableWeight !== undefined && activeChargeableWeight !== null
        ? activeChargeableWeight
        : null
    }

    return activeChargeableWeight ?? courier?.chargeable_weight ?? null
  }
  const getCourierForwardCharge = (courier: any) =>
    getActiveLocalRate(courier)?.rate !== undefined && getActiveLocalRate(courier)?.rate !== null
      ? Number(getActiveLocalRate(courier).rate)
      : courier?.rate !== undefined && courier?.rate !== null
      ? Number(courier.rate)
      : 0
  const getCourierCodCharge = (courier: any) =>
    effectivePaymentType === 'cod'
      ? Number(getActiveLocalRate(courier)?.cod_charges ?? courier?.cod_charges ?? 0)
      : 0
  const getCourierOtherCharge = (courier: any) =>
    Number(getActiveLocalRate(courier)?.other_charges ?? courier?.other_charges ?? 0)
  const getCourierChargeBreakdown = (courier?: any) => {
    const breakdown = courier
      ? getActiveLocalRate(courier)?.charge_breakdown ?? courier?.charge_breakdown
      : null
    return Array.isArray(breakdown) ? breakdown : []
  }
  const getCourierAdditionalChargeRows = (courier?: any) =>
    getCourierChargeBreakdown(courier)
      .filter((charge) => String(charge?.code || '').toUpperCase() !== 'COD')
      .map((charge) => ({
        label: String(charge?.name || charge?.code || 'Additional Charge'),
        value: Number(charge?.amount || 0),
      }))
      .filter((row) => row.value > 0)
  const getCourierTotalCharge = (courier: any) => {
    const explicitTotal = getActiveLocalRate(courier)?.total_charges ?? courier?.total_charges
    if (explicitTotal !== undefined && explicitTotal !== null) return Number(explicitTotal)
    return getCourierForwardCharge(courier) + getCourierCodCharge(courier) + getCourierOtherCharge(courier)
  }
  const getCourierGstPercent = (courier: any) =>
    Number(getActiveLocalRate(courier)?.gst_percent ?? courier?.gst_percent ?? 0)
  const getCourierGstAmount = (courier: any) =>
    Number(getActiveLocalRate(courier)?.gst_amount ?? courier?.gst_amount ?? 0)
  const getCourierTaxInclusiveCharge = (courier: any) => {
    const explicitTotal =
      getActiveLocalRate(courier)?.total_charges_with_gst ??
      courier?.total_charges_with_gst ??
      getActiveLocalRate(courier)?.wallet_debit_amount ??
      courier?.wallet_debit_amount
    if (explicitTotal !== undefined && explicitTotal !== null) return Number(explicitTotal)
    return getCourierTotalCharge(courier) + getCourierGstAmount(courier)
  }
  const getSelectedCourierChargeRows = (courier?: any) => {
    const forwardCharge = courier ? getCourierForwardCharge(courier) : Math.max(0, forwardCharges)
    const codCharge = courier
      ? getCourierCodCharge(courier)
      : effectivePaymentType === 'cod'
        ? Math.max(0, courierCod)
        : 0
    const otherCharge = courier ? getCourierOtherCharge(courier) : Math.max(0, otherCharges)
    const overheadRows = courier ? getCourierAdditionalChargeRows(courier) : []
    const subtotal = courier ? getCourierTotalCharge(courier) : Math.max(0, forwardCharge + codCharge + otherCharge)
    const gstCharge = courier ? getCourierGstAmount(courier) : Math.max(0, gstAmount)
    const totalCharge = courier
      ? getCourierTaxInclusiveCharge(courier)
      : Math.max(0, selectedWalletDebitAmount || subtotal + gstCharge)

    const rows = [
      { label: 'Base Freight', value: forwardCharge },
      { label: 'COD Charges', value: codCharge, hide: effectivePaymentType !== 'cod' },
      ...(overheadRows.length ? overheadRows : [{ label: 'Other Charges Total', value: otherCharge }]),
      { label: 'Subtotal Before GST', value: subtotal, emphasized: true },
      {
        label: `GST (${(courier ? getCourierGstPercent(courier) : gstPercent).toFixed(2)}%)`,
        value: gstCharge,
      },
      { label: 'Final Rate', value: totalCharge, total: true },
    ]

    return rows.filter((row) => !row.hide)
  }
  const toRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const parseDateValue = (value: string) => {
    const trimmed = value.trim()
    const ymdMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/)
    let parsed: Date | null = null

    if (ymdMatch) {
      parsed = new Date(Number(ymdMatch[1]), Number(ymdMatch[2]) - 1, Number(ymdMatch[3]))
    } else if (dmyMatch) {
      const year = Number(dmyMatch[3]) < 100 ? 2000 + Number(dmyMatch[3]) : Number(dmyMatch[3])
      parsed = new Date(year, Number(dmyMatch[2]) - 1, Number(dmyMatch[1]))
    } else {
      const date = new Date(trimmed)
      parsed = Number.isNaN(date.getTime()) ? null : date
    }

    if (!parsed || Number.isNaN(parsed.getTime())) return null
    parsed.setHours(0, 0, 0, 0)
    return parsed
  }
  const getDeliveryDaysFromValue = (value?: unknown) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : Number.POSITIVE_INFINITY
    if (value === undefined || value === null) return Number.POSITIVE_INFINITY

    const rawValue = String(value).trim()
    if (!rawValue) return Number.POSITIVE_INFINITY

    const normalizedValue = rawValue.toLowerCase()
    if (normalizedValue.includes('today')) return 0
    if (normalizedValue.includes('tomorrow')) return 1

    const dateValue = parseDateValue(rawValue)
    if (dateValue) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const daysUntilDelivery = Math.ceil((dateValue.getTime() - today.getTime()) / 86400000)
      return Math.max(daysUntilDelivery, 0)
    }

    const numericParts = rawValue.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? []
    if (!numericParts.length) return Number.POSITIVE_INFINITY

    const fastestValue = Math.min(...numericParts)
    if (normalizedValue.includes('hour')) return fastestValue / 24
    return fastestValue
  }
  const getCourierDeliveryRank = (courier: unknown) => {
    const courierRecord = toRecord(courier)
    const ratesByType = toRecord(courierRecord.localRates)
    const activeRates = toRecord(ratesByType[activeRateKey] ?? ratesByType.forward)
    const deliveryValues = [
      courierRecord.estimated_delivery_days,
      courierRecord.edd_days,
      courierRecord.tat,
      activeRates.estimated_delivery_days,
      activeRates.edd_days,
      activeRates.tat,
      courierRecord.estimated_delivery_date,
      activeRates.estimated_delivery_date,
      courierRecord.edd,
    ]

    for (const value of deliveryValues) {
      const days = getDeliveryDaysFromValue(value)
      if (Number.isFinite(days)) return days
    }

    return Number.POSITIVE_INFINITY
  }
  const getCourierPriceRank = (courier: unknown) => {
    const price = getCourierTaxInclusiveCharge(courier)
    return Number.isFinite(price) ? price : Number.POSITIVE_INFINITY
  }
  const sortedAvailableCouriers = availableCouriers
    .map((courier, index) => ({ courier, index }))
    .sort((a, b) => {
      if (courierSort === 'price_low_to_high') {
        return getCourierPriceRank(a.courier) - getCourierPriceRank(b.courier) || a.index - b.index
      }

      if (courierSort === 'faster_delivery') {
        const fastestTagDelta =
          (a.courier?.tag === 'fastest' ? 0 : 1) - (b.courier?.tag === 'fastest' ? 0 : 1)

        return (
          getCourierDeliveryRank(a.courier) - getCourierDeliveryRank(b.courier) ||
          fastestTagDelta ||
          a.index - b.index
        )
      }

      return a.index - b.index
    })
    .map(({ courier }) => courier)
  const selectedWalletDebitAmount =
    walletDebitAmount ||
    forwardCharges + (effectivePaymentType === 'cod' ? courierCod : 0) + otherCharges + gstAmount

  const selectedCourierSummary = availableCouriers.find((courier) => {
    const courierOptionKey = getCourierOptionKey(courier)
    return selectedCourierOptionKey
      ? selectedCourierOptionKey === courierOptionKey
      : String(selectedCourierId) === String(courier?.id ?? courier?.courier_id ?? '')
  })
  const shipmentZoneDisplay =
    getZoneDisplayName(selectedCourierSummary) ||
    availableCouriers.map(getZoneDisplayName).find(Boolean) ||
    ''
  const selectedCourierChargeRows = getSelectedCourierChargeRows(selectedCourierSummary)
  const hasSelectedCourierChargePreview = Boolean(selectedCourierSummary) && selectedCourierChargeRows.length > 0
  const totalBoxCount =
    shipment_type === 'b2b'
      ? ((watch('boxes') as B2BBox[] | undefined) ?? []).reduce(
          (sum, box) => sum + Math.max(1, Number(box.quantity ?? 1)),
          0,
        )
      : 0

  return (
    <Grid container spacing={1.4}>
      <Grid size={{ md: 4.5, xs: 12 }}>
        <Stack spacing={1.25} sx={{ position: { md: 'sticky' }, top: { md: 6 } }}>
          <Paper
            sx={{
              p: 0,
              overflow: 'hidden',
              borderRadius: 2,
              border: `1px solid ${alpha(ACCENT, 0.14)}`,
              boxShadow: '0 22px 44px rgba(13,59,142,0.08)',
            }}
          >
            <Box
              sx={{
                px: 1.4,
                py: 1.15,
                color: '#fff',
                background:
                  'linear-gradient(135deg, #0877C9 0%, #1A5DD1 55%, #3D8BFF 100%)',
              }}
            >
                <Typography sx={{ fontSize: 10, letterSpacing: '0.08em', opacity: 0.88, color: '#fff' }}>
                SHIPMENT SNAPSHOT
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.25, fontWeight: 800, color: '#fff' }}>
                {watch('orderId') || 'Pending Order ID'}
              </Typography>
              <Typography sx={{ mt: 0.35, opacity: 0.9, color: '#fff', fontSize: 12 }}>
                {shipment_type.toUpperCase()} • {effectivePaymentType.toUpperCase()} •{' '}
                {(Number(totalWeight) / 1000).toFixed(2)} kg
              </Typography>
            </Box>

            <Box sx={{ p: 1.35, bgcolor: '#fff' }}>
              <Grid container spacing={0.75}>
                {[
                  {
                    label: 'Customer Total',
                    value: formatCurrency(totalOrderValue),
                  },
                  { label: 'Courier Options', value: String(availableCouriers.length) },
                  { label: 'Zone', value: shipmentZoneDisplay || '-' },
                  { label: 'Pickup', value: originPincode || '-' },
                  { label: 'Delivery', value: destinationPincode || '-' },
                ].map((item) => (
                  <Grid key={item.label} size={{ xs: 6 }}>
                    <Box
                      sx={{
                        p: 0.85,
                        borderRadius: 1.5,
                        bgcolor: SURFACE,
                        border: '1px solid rgba(13,59,142,0.08)',
                      }}
                    >
                      <Typography sx={{ fontSize: 10, color: TEXT_SECONDARY }}>{item.label}</Typography>
                      <Typography sx={{ mt: 0.25, fontWeight: 800, color: TEXT_PRIMARY, fontSize: 12 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 1.1 }} />

              <Stack spacing={0.65}>
                <Typography sx={{ fontSize: 12, fontWeight: 800, color: TEXT_SECONDARY }}>
                  Price Breakup
                </Typography>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: TEXT_SECONDARY }}>Product Subtotal</Typography>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {formatCurrency(totalProductTaxable)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: TEXT_SECONDARY }}>Product Tax</Typography>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {formatCurrency(totalProductTax)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: TEXT_SECONDARY }}>Shipping</Typography>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {formatCurrency(shippingCharges)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: TEXT_SECONDARY }}>Transaction Fee</Typography>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {formatCurrency(transactionFee)}
                  </Typography>
                </Stack>
                {giftWrap > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: TEXT_SECONDARY }}>Gift Wrap</Typography>
                    <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                      {formatCurrency(giftWrap)}
                    </Typography>
                  </Stack>
                )}
                {discount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: '#B42318' }}>Discount</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#B42318' }}>
                      -{formatCurrency(discount)}
                    </Typography>
                  </Stack>
                )}
                {prepaidAmount > 0 && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography sx={{ color: '#B42318' }}>Prepaid Amount</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#B42318' }}>
                      -{formatCurrency(prepaidAmount)}
                    </Typography>
                  </Stack>
                )}
                <Divider sx={{ my: 0.45 }} />
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ color: ACCENT, fontWeight: 800 }}>Total Collectable</Typography>
                  <Typography sx={{ color: ACCENT, fontWeight: 900 }}>
                    {formatCurrency(courierPayloadOrderAmount)}
                  </Typography>
                </Stack>
              </Stack>

              {hasSelectedCourierChargePreview && (
                <>
                  <Divider sx={{ my: 1.1 }} />
                  <Stack spacing={0.65}>
                    <Typography sx={{ fontSize: 12, fontWeight: 800, color: TEXT_SECONDARY }}>
                      Final Rate Breakdown
                    </Typography>
                    <Box sx={{ ...breakdownRowStyles, pb: 0.45, borderBottom: '1px solid rgba(13,59,142,0.08)' }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: TEXT_SECONDARY }}>
                        Charge Name
                      </Typography>
                      <Typography sx={{ fontSize: 11, fontWeight: 800, color: TEXT_SECONDARY }}>
                        Amount
                      </Typography>
                    </Box>
                    {selectedCourierChargeRows.map((row, index) => (
                      <Box key={row.label}>
                        {row.total && index > 0 ? <Divider sx={{ my: 0.7 }} /> : null}
                        <Box sx={breakdownRowStyles}>
                          <Typography
                            sx={{
                              color: row.total ? TEXT_PRIMARY : TEXT_SECONDARY,
                              fontWeight: row.total || row.emphasized ? 800 : 400,
                            }}
                          >
                            {row.label}
                          </Typography>
                          <Typography
                            sx={{
                              color: TEXT_PRIMARY,
                              fontWeight: row.total ? 900 : row.emphasized ? 800 : 700,
                            }}
                          >
                            {formatCurrency(row.value)}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 1.25, borderRadius: 2, bgcolor: '#fff' }}>
            <Typography sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>
              Delivery Summary
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 0.85 }}>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiUser color={ACCENT} size={18} />
                <Box>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {buyerName || 'Customer'}
                  </Typography>
                  <Typography sx={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                    {buyerPhone || '-'}
                  </Typography>
                  <Typography sx={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                    {watch('buyerEmail') || '-'}
                  </Typography>
                </Box>
              </Stack>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiMap color={ACCENT} size={18} />
                <Typography sx={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                  {deliveryAddressLine || '-'}, {deliveryCity || '-'}, {deliveryState || '-'} -{' '}
                  {deliveryPincode || '-'}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiPackage color={ACCENT} size={18} />
                <Typography sx={{ color: TEXT_SECONDARY, fontSize: 14 }}>
                  {shipment_type === 'b2b'
                    ? `${totalBoxCount} boxes`
                    : `${products?.length || 0} products`}
                </Typography>
              </Stack>
            </Stack>
          </Paper>

          <Paper sx={{ p: 1.25, borderRadius: 2, bgcolor: '#fff' }}>
            <Typography sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>
              Pickup Summary
            </Typography>
            <Stack spacing={0.75} sx={{ mt: 0.85 }}>
              <Stack direction="row" spacing={1.2} alignItems="flex-start">
                <BiCalendar color={ACCENT} size={18} />
                <Box>
                  <Typography sx={{ fontWeight: 700, color: TEXT_PRIMARY }}>
                    {pickupName || 'Pickup Location'}
                  </Typography>
                  <Typography sx={{ color: TEXT_SECONDARY, fontSize: 12 }}>
                    {pickupAddressLine || '-'}, {pickupCity || '-'}, {pickupState || '-'} -{' '}
                    {pickupPincode || '-'}
                  </Typography>
                </Box>
              </Stack>
              {selectedCourierSummary && (
                <>
                  <Divider />
                  <Box
                    sx={{
                      p: 0.9,
                      borderRadius: 1.5,
                      bgcolor: alpha(ACCENT, 0.05),
                      border: `1px solid ${alpha(ACCENT, 0.12)}`,
                    }}
                  >
                    <Typography sx={{ fontSize: 11, color: TEXT_SECONDARY, letterSpacing: '0.08em' }}>
                      SELECTED COURIER
                    </Typography>
                    <Typography sx={{ mt: 0.5, fontWeight: 800, color: TEXT_PRIMARY }}>
                      {getCourierDisplayName(selectedCourierSummary)}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
                      <Chip
                        size="small"
                        label={`Freight ${formatCurrency(getCourierForwardCharge(selectedCourierSummary))}`}
                      />
                      <Chip
                        size="small"
                        label={`Rate + taxes ${formatCurrency(
                          getCourierTaxInclusiveCharge(selectedCourierSummary),
                        )}`}
                      />
                      <Chip
                        size="small"
                        label={`Chargeable ${formatWeightDisplay(
                          getCourierChargeableWeight(selectedCourierSummary),
                        )}`}
                      />
                      {getZoneDisplayName(selectedCourierSummary) && (
                        <Chip size="small" label={`Zone ${getZoneDisplayName(selectedCourierSummary)}`} />
                      )}
                    </Stack>
                  </Box>
                </>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Grid>

      <Grid size={{ md: 7.5, xs: 12 }}>
        <Paper
          sx={{
            p: 1.35,
            borderRadius: 2,
            border: `1px solid ${alpha(ACCENT, 0.1)}`,
            boxShadow: '0 18px 40px rgba(16,42,84,0.06)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={1}
            sx={{ mb: 1.25 }}
          >
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>
                Select Courier Partner
              </Typography>
              <Typography sx={{ mt: 0.25, color: TEXT_SECONDARY, fontSize: 12 }}>
                Compare freight, speed and chargeable weight before locking the shipment.
              </Typography>
            </Box>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Stack direction="row" spacing={0.6} alignItems="center">
                <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY, fontWeight: 700 }}>
                  Sort by
                </Typography>
                <Select
                  size="small"
                  value={courierSort}
                  onChange={(event) => setCourierSort(event.target.value as CourierSortOption)}
                  sx={{
                    minWidth: 172,
                    height: 34,
                    bgcolor: '#fff',
                    borderRadius: 1.5,
                    '& .MuiSelect-select': {
                      py: 0.75,
                      fontSize: 13,
                      fontWeight: 800,
                      color: TEXT_PRIMARY,
                    },
                  }}
                >
                  <MenuItem value="recommended">Recommended</MenuItem>
                  <MenuItem value="price_low_to_high">Price low to high</MenuItem>
                  <MenuItem value="faster_delivery">Faster delivery</MenuItem>
                </Select>
              </Stack>
              <Chip
                label={`${availableCouriers.length} options`}
                sx={{
                  bgcolor: alpha(ACCENT, 0.08),
                  color: ACCENT,
                  fontWeight: 700,
                  borderRadius: '999px',
                }}
              />
            </Stack>
          </Stack>

          <Stack spacing={1}>
            {sortedAvailableCouriers?.map((courier) => {
              const activeLocalRate = getActiveLocalRate(courier)
              const zoneDisplay = getZoneDisplayName(courier)
              const courierOptionKey = getCourierOptionKey(courier)
              const bookingUnavailable = isCourierBookingUnavailable(courier)
              const bookingBlockedReason = getCourierBookingBlockedReason(courier)
              const isSelected = selectedCourierOptionKey
                ? selectedCourierOptionKey === courierOptionKey
                : String(selectedCourierId) === String(courier?.id ?? courier?.courier_id ?? '')

              const forwardCharge = getCourierForwardCharge(courier)
              const codCharge = getCourierCodCharge(courier)
              const otherCharge = getCourierOtherCharge(courier)
              const additionalChargeRows = getCourierAdditionalChargeRows(courier)
              const courierGstPercent = getCourierGstPercent(courier)
              const courierGstAmount = getCourierGstAmount(courier)
              const taxInclusiveCharge = getCourierTaxInclusiveCharge(courier)

              return (
                <Paper
                  key={courierOptionKey}
                  aria-disabled={bookingUnavailable}
                  onClick={() => {
                    if (bookingUnavailable) return

                    setValue('courierPartner', courier?.name ?? '')
                    setValue('courierPartnerId', courier?.id ?? '')
                    setValue('courierOptionKey', courierOptionKey)
                    setValue('amazonRequestToken', courier?.amazon_request_token ?? null)
                    setValue('amazonRateId', courier?.amazon_rate_id ?? null)
                    setValue('amazonServiceId', courier?.amazon_service_id ?? null)
                    setValue('amazonCarrierId', courier?.amazon_carrier_id ?? null)
                    setValue('selectedMaxSlabWeight', courier?.max_slab_weight ?? null)
                    setValue(
                      'courierCod',
                      effectivePaymentType === 'cod' ? Number(activeLocalRate?.cod_charges ?? 0) : 0,
                    )
                    setValue('forwardCharges', forwardCharge)
                    setValue('otherCharges', otherCharge)
                    setFormValue('gstPercent', courierGstPercent)
                    setFormValue('gstAmount', courierGstAmount)
                    setFormValue('walletDebitAmount', taxInclusiveCharge)
                    setValue('courierCost', courier?.courier_cost_estimate ?? null) // Estimated courier cost from serviceability
                    setValue('integrationType', courier?.integration_type)
                    setValue(
                      'shadowfaxForwardMode',
                      courier?.provider_serviceability?.mode ??
                        courier?.provider_serviceability?.shipping_mode ??
                        courier?.mode ??
                        null,
                    )
                    setValue(
                      'shadowfaxServiceMode',
                      courier?.provider_serviceability?.service_mode ??
                        courier?.service_mode ??
                        null,
                    )
                    setValue('zone', courier?.approxZone?.code ?? courier?.approxZone?.name ?? '')
                    setValue('zoneId', courier?.approxZone?.id ?? '')
                    setValue('chargeableWeight', getCourierChargeableWeight(courier))
                    setValue(
                      'volumetricWeight',
                      activeLocalRate?.volumetric_weight ?? courier?.volumetric_weight ?? null,
                    )
                    setValue('slabs', activeLocalRate?.slabs ?? courier?.slabs ?? null)
                    clearErrors('courierPartnerId')
                  }}
                  sx={{
                    p: 1.15,
                    cursor: bookingUnavailable ? 'not-allowed' : 'pointer',
                    borderRadius: 2,
                    border: bookingUnavailable
                      ? `1px solid ${alpha('#F79009', 0.34)}`
                      : isSelected
                      ? `2px solid ${alpha(ACCENT, 0.42)}`
                      : `1px solid ${alpha('#17171A', 0.12)}`,
                    bgcolor: bookingUnavailable
                      ? alpha('#F79009', 0.06)
                      : isSelected
                      ? alpha(ACCENT, 0.045)
                      : '#fff',
                    opacity: bookingUnavailable ? 0.78 : 1,
                    boxShadow: isSelected && !bookingUnavailable
                      ? '0 18px 36px rgba(13,59,142,0.14)'
                      : '0 8px 22px rgba(16,42,84,0.06)',
                    transition: '0.25s ease',
                    '&:hover': bookingUnavailable
                      ? {
                          borderColor: alpha('#F79009', 0.42),
                        }
                      : {
                          borderColor: alpha(ACCENT, 0.38),
                          boxShadow: '0 18px 36px rgba(13,59,142,0.12)',
                          transform: 'translateY(-1px)',
                        },
                  }}
                >
                  <Stack spacing={0.9}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                      spacing={0.9}
                    >
                      <Stack direction="row" spacing={0.9} alignItems="center">
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: SURFACE,
                            border: `1px solid ${alpha(ACCENT, 0.08)}`,
                            display: 'grid',
                            placeItems: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={
                              Object.entries(courierLogos)?.find(([key]) =>
                                courier?.name?.toLowerCase().includes(key.toLowerCase()),
                              )?.[1] ?? defaultLogo
                            }
                            alt={courier?.name}
                            style={{ width: 28, height: 28, objectFit: 'contain' }}
                          />
                        </Box>
                        <Box>
                          <Stack direction="row" spacing={0.8} alignItems="center" flexWrap="wrap">
                            {getModeIcon(activeLocalRate?.mode || courier?.mode)}
                            <Typography sx={{ fontWeight: 800, color: TEXT_PRIMARY }}>
                              {getCourierDisplayName(courier)}
                            </Typography>
                            {courier?.tag === 'fastest' && (
                              <Chip
                                size="small"
                                label="Fastest"
                                sx={{ bgcolor: '#E8F1FF', color: ACCENT, fontWeight: 700 }}
                              />
                            )}
                            {courier?.tag === 'economy' && (
                              <Chip
                                size="small"
                                label="Best Rate"
                                sx={{ bgcolor: '#ECFDF3', color: '#067647', fontWeight: 700 }}
                              />
                            )}
                            {zoneDisplay && (
                              <Chip
                                size="small"
                                label={zoneDisplay}
                                sx={{
                                  bgcolor: alpha(ACCENT, 0.08),
                                  color: ACCENT,
                                  fontWeight: 700,
                                  border: `1px solid ${alpha(ACCENT, 0.18)}`,
                                }}
                              />
                            )}
                            {bookingUnavailable && (
                              <Chip
                                size="small"
                                label="Live unavailable"
                                sx={{
                                  bgcolor: alpha('#F79009', 0.12),
                                  color: '#B54708',
                                  fontWeight: 700,
                                  border: `1px solid ${alpha('#F79009', 0.24)}`,
                                }}
                              />
                            )}
                          </Stack>
                          <Typography sx={{ mt: 0.2, fontSize: 12, color: TEXT_SECONDARY }}>
                            {courier?.edd ? `Estimated delivery: ${courier.edd}` : 'EDD unavailable'}
                          </Typography>
                          {bookingUnavailable && (
                            <Typography sx={{ mt: 0.25, fontSize: 12, color: '#B54708' }}>
                              {bookingBlockedReason}
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      <Stack alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={0.25}>
                        <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY }}>
                          Courier rate + taxes
                        </Typography>
                        <Typography sx={{ fontSize: 22, fontWeight: 900, color: TEXT_PRIMARY }}>
                          {formatCurrency(taxInclusiveCharge)}
                        </Typography>
                      </Stack>
                    </Stack>

                    <Grid container spacing={0.65}>
                      {[
                        ['Freight', formatCurrency(forwardCharge)] as [string, string],
                        ...(effectivePaymentType === 'cod'
                          ? [['COD', formatCurrency(codCharge)] as [string, string]]
                          : []),
                        [
                          additionalChargeRows.length ? 'Other Total' : 'Other',
                          formatCurrency(otherCharge),
                        ] as [string, string],
                        [
                          `GST (${courierGstPercent.toFixed(2)}%)`,
                          formatCurrency(courierGstAmount),
                        ] as [string, string],
                        ['Rate + taxes', formatCurrency(taxInclusiveCharge)] as [string, string],
                        ['Zone', zoneDisplay || '-'] as [string, string],
                        ['Chargeable', formatWeightDisplay(getCourierChargeableWeight(courier))] as [
                          string,
                          string,
                        ],
                        [
                          'Volumetric',
                          formatWeightDisplay(
                            activeLocalRate?.volumetric_weight ?? courier?.volumetric_weight,
                          ),
                        ] as [string, string],
                      ].map(([label, value]) => (
                        <Grid key={label} size={{ xs: 6, lg: 3 }}>
                          <Box
                            sx={{
                              p: 0.75,
                              borderRadius: 1.5,
                              bgcolor: SURFACE,
                              border: '1px solid rgba(13,59,142,0.08)',
                            }}
                          >
                            <Typography sx={{ fontSize: 10, color: TEXT_SECONDARY }}>{label}</Typography>
                            <Typography sx={{ mt: 0.2, fontWeight: 800, color: TEXT_PRIMARY, fontSize: 12 }}>
                              {value}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    {additionalChargeRows.length > 0 && (
                      <Box
                        sx={{
                          p: 0.9,
                          borderRadius: 1.5,
                          bgcolor: alpha('#0D3B8E', 0.03),
                          border: '1px solid rgba(13,59,142,0.08)',
                        }}
                      >
                        <Typography sx={{ fontSize: 11, fontWeight: 800, color: TEXT_SECONDARY, mb: 0.55 }}>
                          Other Charges Breakdown
                        </Typography>
                        <Stack spacing={0.45}>
                          <Box sx={{ ...breakdownRowStyles, pb: 0.35, borderBottom: '1px solid rgba(13,59,142,0.08)' }}>
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: TEXT_SECONDARY }}>
                              Charge Name
                            </Typography>
                            <Typography sx={{ fontSize: 11, fontWeight: 800, color: TEXT_SECONDARY }}>
                              Amount
                            </Typography>
                          </Box>
                          {additionalChargeRows.map((row) => (
                            <Box
                              key={`${courierOptionKey}-${row.label}`}
                              sx={breakdownRowStyles}
                            >
                              <Typography sx={{ fontSize: 12, color: TEXT_SECONDARY }}>
                                {row.label}
                              </Typography>
                              <Typography sx={{ fontSize: 12, fontWeight: 800, color: TEXT_PRIMARY }}>
                                {formatCurrency(row.value)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {courier?.prepaid === false && (
                        <Chip size="small" variant="outlined" color="error" label="Prepaid N/A" />
                      )}
                      {courier?.cod === false && (
                        <Chip size="small" variant="outlined" color="error" label="COD N/A" />
                      )}
                    </Stack>

                    {isSelected && !bookingUnavailable && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiCheckCircle size={20} color={ACCENT} />
                        <Typography sx={{ fontWeight: 800, color: ACCENT }}>
                          Selected for booking
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              )
            })}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  )
}

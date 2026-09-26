import {
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Controller, FormProvider, useForm } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import CourierRateCards from '../../components/CourierRateCard'
import B2BRateCalculator from '../../components/tools/B2BRateCalculator'
import B2CRateCalculator from '../../components/tools/B2CRateCalculator'
import CustomIconLoadingButton from '../../components/UI/button/CustomLoadingButton'
import CustomInput from '../../components/UI/inputs/CustomInput'
import { SmartTabs } from '../../components/UI/tab/Tabs'
import { BRAND_GREEN } from '../../components/user/profile/UserProfileForm'
import {
  useAvailableCouriersMutation,
  useB2BRateQuotesMutation,
} from '../../hooks/Integrations/useCouriers'
import { usePaymentOptions } from '../../hooks/usePaymentOptions'
import { usePincodeLookup } from '../../hooks/User/usePincodeLookup'
import { defaultLogo } from '../../utils/constants'

type ShipmentType = 'b2b' | 'b2c'

type RateCalculatorBox = {
  lengthCm: number
  breadthCm: number
  heightCm: number
  weightKg: number
  quantity: number
}

const RATE_CALCULATOR_BOX_TEMPLATE: RateCalculatorBox = {
  lengthCm: 0,
  breadthCm: 0,
  heightCm: 0,
  weightKg: 0,
  quantity: 1,
}

const buildB2BBoxSummary = (boxes: unknown) => {
  const normalizedBoxes = Array.isArray(boxes) && boxes.length
    ? boxes.map((box) => ({
        lengthCm: Math.max(0, Number((box as RateCalculatorBox)?.lengthCm || 0)),
        breadthCm: Math.max(0, Number((box as RateCalculatorBox)?.breadthCm || 0)),
        heightCm: Math.max(0, Number((box as RateCalculatorBox)?.heightCm || 0)),
        weightKg: Math.max(0, Number((box as RateCalculatorBox)?.weightKg || 0)),
        quantity: Math.max(1, Number((box as RateCalculatorBox)?.quantity || 1)),
      }))
    : [{ ...RATE_CALCULATOR_BOX_TEMPLATE }]

  return normalizedBoxes.reduce(
    (summary, box) => ({
      boxes: [...summary.boxes, box],
      totalUnits: summary.totalUnits + box.quantity,
      totalActualWeight: summary.totalActualWeight + box.weightKg * box.quantity,
      maxLength: Math.max(summary.maxLength, box.lengthCm),
      maxBreadth: Math.max(summary.maxBreadth, box.breadthCm),
      maxHeight: Math.max(summary.maxHeight, box.heightCm),
    }),
    {
      boxes: [] as RateCalculatorBox[],
      totalUnits: 0,
      totalActualWeight: 0,
      maxLength: 0,
      maxBreadth: 0,
      maxHeight: 0,
    },
  )
}

const termsAndConditions = {
  b2c: [
    'Above Shared Commercials are Exclusive GST.',
    'Above pricing subject to change based on courier company updation or change in any commercials.',
    'Freight Weight is Picked - Volumetric or Dead weight whichever is higher will be charged.',
    "Return charges as same as Forward for currier's where special RTO pricing is not shared.",
    'Fixed COD charge or COD % of the order value whichever is higher.',
    'Other charges like address correction charges if applicable shall be charged extra.',
    'Prohibited item not to be ship, if any penalty will charge to seller.',
    'No Claim would be entertained for Glassware, Fragile products, Concealed damages and improper packaging.',
    'Any weight dispute due to incorrect weight declaration cannot be claimed.',
    'Chargeable weight would be volumetric or actual weight, whichever is higher (LxBxH/5000).',
    'Delhivery 2 KG, 5 KG & 10 KG accounts have 4000 volumetric divisor.',
    'Liability of Reverse QC check - maximum limit INR 2000 or product value whichever is lower.',
  ],
  b2b: [
    'Above Shared Commercials are Exclusive GST.',
    'Above pricing subject to change based on courier company updation or change in any commercials.',
    'Freight Weight is Picked - Volumetric or Dead weight whichever is higher will be charged.',
    'Other charges like address correction charges if applicable shall be charged extra.',
    'Prohibited item not to be ship, if any penalty will charge to seller.',
    'No Claim would be entertained for Glassware, Fragile products, Concealed damages and improper packaging.',
    'Any weight dispute due to incorrect weight declaration cannot be claimed.',
    'Chargeable weight would be volumetric or actual weight, whichever is higher.',
    'Delhivery: (LxBxH/27000)*CFT',
    {
      text: 'The Transporter Id are as Follows',
      sub: ['Delhivery B2B is 06AAPCS9575E1ZR'],
    },
  ],
}

export const cardStyles = {
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  background: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: 3,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

type RateCalculatorCourier = {
  localRates?: {
    forward?: {
      rate?: number | string | null
      cod_charges?: number | string | null
      other_charges?: number | string | null
      total_charges?: number | string | null
      total_charges_with_gst?: number | string | null
      wallet_debit_amount?: number | string | null
    } | null
  } | null
  rate?: number | string | null
  cod_charges?: number | string | null
  other_charges?: number | string | null
  total_charges?: number | string | null
  total_charges_with_gst?: number | string | null
  wallet_debit_amount?: number | string | null
}

const getDisplayedCourierPrice = (courier: RateCalculatorCourier, paymentType: string) => {
  const forward = courier?.localRates?.forward ?? {}
  const explicitTotal =
    forward?.total_charges_with_gst ??
    courier?.total_charges_with_gst ??
    forward?.wallet_debit_amount ??
    courier?.wallet_debit_amount ??
    forward?.total_charges ??
    courier?.total_charges
  const total =
    explicitTotal !== undefined && explicitTotal !== null
      ? Number(explicitTotal)
      : Number(forward?.rate ?? courier?.rate ?? 0) +
        (paymentType === 'cod' ? Number(forward?.cod_charges ?? courier?.cod_charges ?? 0) : 0) +
        Number(forward?.other_charges ?? courier?.other_charges ?? 0)

  return Number.isFinite(total) && total > 0 ? total : Number.POSITIVE_INFINITY
}

const sortCouriersByDisplayedPrice = (
  couriers: RateCalculatorCourier[] = [],
  paymentType: string,
) =>
  couriers
    .map((courier, index) => ({ courier, index, price: getDisplayedCourierPrice(courier, paymentType) }))
    .sort((a, b) => a.price - b.price || a.index - b.index)
    .map(({ courier }) => courier)

export function RateCalculator() {
  const {
    mutateAsync: fetchB2CCouriers,
    isPending: isFetchingB2C,
    isError: isB2CError,
    error: b2cError,
  } = useAvailableCouriersMutation()
  const {
    mutateAsync: fetchB2BRateQuotes,
    isPending: isFetchingB2B,
    isError: isB2BError,
    error: b2bError,
  } = useB2BRateQuotesMutation()
  const couriersRef = useRef<HTMLDivElement | null>(null) // 👈 ref for scrolling
  const [shipmentType, setShipmentType] = useState<ShipmentType>('b2c')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableB2CCouriers, setAvailableB2CCouriers] = useState<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [availableB2BQuotes, setAvailableB2BQuotes] = useState<any[]>([])
  const { data: paymentOptions } = usePaymentOptions()

  const methods = useForm({
    mode: 'onBlur',
    defaultValues: {
      pickupPincode: '',
      pickupCity: '',
      pickupState: '',
      deliveryPincode: '',
      deliveryCity: '',
      deliveryState: '',
      paymentType: 'cod',
      length: '',
      breadth: '',
      height: '',
      weight: '',
      totalWeight: '',
      numberOfBoxes: '',
      boxes: [{ ...RATE_CALCULATOR_BOX_TEMPLATE }],
      freightMode: 'fod',
      orderAmount: '', // ✅ added shipment value
      rovType: 'owner',
    },
  })

  const {
    watch,
    setValue,
    setError,
    clearErrors,
    register,
    handleSubmit,
    formState: { errors },
  } = methods

  const pickupPincode = watch('pickupPincode')
  const deliveryPincode = watch('deliveryPincode')

  // ✅ Single hook handles both lookups
  const loadingPickup = usePincodeLookup(pickupPincode, 'pickup', setValue, setError, clearErrors)
  const loadingDelivery = usePincodeLookup(
    deliveryPincode,
    'delivery',
    setValue,
    setError,
    clearErrors,
  )

  // ✅ Submit
  const visibleCouriers = shipmentType === 'b2b' ? availableB2BQuotes : availableB2CCouriers
  const isPending = shipmentType === 'b2b' ? isFetchingB2B : isFetchingB2C
  const isError = shipmentType === 'b2b' ? isB2BError : isB2CError
  const error = shipmentType === 'b2b' ? b2bError : b2cError

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = async (formData: any) => {
    try {
      // convert to numbers
      const boxSummary = buildB2BBoxSummary(formData.boxes)
      const length =
        shipmentType === 'b2b'
          ? boxSummary.maxLength || Number(formData.length) || 0
          : Number(formData.length) || 0
      const breadth =
        shipmentType === 'b2b'
          ? boxSummary.maxBreadth || Number(formData.breadth) || 0
          : Number(formData.breadth) || 0
      const height =
        shipmentType === 'b2b'
          ? boxSummary.maxHeight || Number(formData.height) || 0
          : Number(formData.height) || 0
      const actualWeightKg =
        shipmentType === 'b2b'
          ? boxSummary.totalActualWeight || Number(formData.totalWeight || 0) || 0
          : Number(formData.weight) || 0

      // convert actual weight from kg → grams
      const actualWeightGrams = actualWeightKg * 1000
      const pieceCountValue =
        shipmentType === 'b2b'
          ? boxSummary.totalUnits || Number(formData.numberOfBoxes || 0)
          : Number(formData.numberOfBoxes || 0)
      const pieceCount = Number.isFinite(pieceCountValue) && pieceCountValue > 0 ? pieceCountValue : undefined

      const orderAmountValue = Number(formData.orderAmount || 0)

      const payload = {
        pickupPincode: formData.pickupPincode,
        deliveryPincode: formData.deliveryPincode,
        // Send actual declared weight; backend computes volumetric and final billable weight.
        weight: actualWeightGrams,
        cod: formData.paymentType === 'cod' ? Math.max(orderAmountValue, 1) : 0,
        length,
        breadth,
        height,
        orderAmount: orderAmountValue > 0 ? orderAmountValue : undefined,
        shipmentType: shipmentType,
        payment_type: formData?.paymentType,
        freight_mode: shipmentType === 'b2b' ? formData.freightMode : undefined,
        rov_type: shipmentType === 'b2b' ? formData.rovType : undefined,
        pieceCount: shipmentType === 'b2b' ? pieceCount : undefined,
        boxes: shipmentType === 'b2b' ? boxSummary.boxes : undefined,
        // Hint to backend that this is just a rate calculator call (can skip heavy live checks)
        context: 'rate_calculator',
      }

      let result: RateCalculatorCourier[] = []

      if (shipmentType === 'b2b') {
        result = await fetchB2BRateQuotes(payload)
        setAvailableB2CCouriers([])
        setAvailableB2BQuotes(sortCouriersByDisplayedPrice(result ?? [], formData.paymentType))
      } else {
        result = await fetchB2CCouriers(payload)
        setAvailableB2BQuotes([])
        setAvailableB2CCouriers(sortCouriersByDisplayedPrice(result ?? [], formData.paymentType))
      }

      console.log('Available couriers:', result)
    } catch (err) {
      setAvailableB2CCouriers([])
      setAvailableB2BQuotes([])
      console.error('Failed fetching couriers:', err)
    }
  }

  useEffect(() => {
    if (visibleCouriers?.length > 0 && couriersRef.current) {
      couriersRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [visibleCouriers])

  useEffect(() => {
    setAvailableB2CCouriers([])
    setAvailableB2BQuotes([])
  }, [shipmentType])

  // Set default payment type based on enabled options
  useEffect(() => {
    if (paymentOptions) {
      const currentPaymentType = methods.watch('paymentType')
      const isCurrentEnabled =
        (currentPaymentType === 'cod' && paymentOptions.codEnabled) ||
        (currentPaymentType === 'prepaid' && paymentOptions.prepaidEnabled)

      if (!isCurrentEnabled) {
        // Set to first available option
        if (paymentOptions.codEnabled) {
          methods.setValue('paymentType', 'cod')
        } else if (paymentOptions.prepaidEnabled) {
          methods.setValue('paymentType', 'prepaid')
        }
      }
    }
  }, [paymentOptions, methods])

  return (
    <Stack>
      <FormProvider {...methods}>
        <CardContent
          sx={{
            position: 'relative',
            width: '100%',
            overflow: 'hidden',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: 3,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            p: 3,
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
            Rate Calculator
          </Typography>

          {/* Tabs */}
          <SmartTabs
            value={shipmentType}
            onChange={(val) => setShipmentType(val)}
            tabs={[
              { label: 'B2C', value: 'b2c' },
              { label: 'B2B', value: 'b2b' },
            ]}
          />

          <Divider sx={{ my: 2 }} />

          {/* Pickup Section */}
          <Grid container spacing={2}>
            <Grid size={4}>
              <CustomInput
                label="Pickup Pincode"
                {...register('pickupPincode', {
                  required: 'Pickup pincode is required',
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: 'Enter valid 6-digit pincode',
                  },
                })}
                error={!!errors.pickupPincode}
                helperText={errors.pickupPincode?.message as string}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Pickup City"
                {...register('pickupCity')}
                fullWidth
                disabled
                postfix={loadingPickup ? <CircularProgress size={16} /> : null}
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Pickup State"
                {...register('pickupState')}
                fullWidth
                disabled
                postfix={loadingPickup ? <CircularProgress size={16} /> : null}
              />
            </Grid>

            {/* Delivery Section */}
            <Grid size={4}>
              <CustomInput
                label="Delivery Pincode"
                {...register('deliveryPincode', {
                  required: 'Delivery pincode is required',
                  pattern: {
                    value: /^[1-9][0-9]{5}$/,
                    message: 'Enter valid 6-digit pincode',
                  },
                })}
                error={!!errors.deliveryPincode}
                helperText={errors.deliveryPincode?.message as string}
                fullWidth
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Delivery City"
                {...register('deliveryCity')}
                fullWidth
                disabled
                postfix={loadingDelivery ? <CircularProgress size={16} /> : null}
              />
            </Grid>
            <Grid size={4}>
              <CustomInput
                label="Delivery State"
                {...register('deliveryState')}
                fullWidth
                disabled
                postfix={loadingDelivery ? <CircularProgress size={16} /> : null}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Conditional Forms */}
          {shipmentType === 'b2c' ? <B2CRateCalculator /> : <B2BRateCalculator />}

          <Divider sx={{ my: 2 }} />
          <Controller
            name="paymentType"
            control={methods?.control}
            rules={{ required: 'Please select a payment type' }}
            render={({ field, fieldState }) => (
              <Stack mb={3}>
                <Typography color="#7F8C8D" sx={{ fontSize: '15px' }}>
                  {' '}
                  Payment Type
                </Typography>
                <Stack direction={'column'} mt={2}>
                  <ToggleButtonGroup
                    value={field.value}
                    exclusive
                    onChange={(_, newValue) => {
                      if (newValue !== null) field.onChange(newValue)
                    }}
                  >
                    {(!paymentOptions || paymentOptions.prepaidEnabled) && (
                      <ToggleButton
                        value="prepaid"
                        sx={{
                          px: 3,
                          mx: 1,
                          py: 1,
                          borderRadius: '10px !important',
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          color: '#6B7280',
                          border: '1px solid #E2E8F0',
                          transition: 'all 0.25s ease',
                          '&.Mui-selected': {
                            background: BRAND_GREEN,
                            color: '#FFFFFF',
                            transform: 'scale(1.05)',
                          },
                          '&:hover': {
                            borderColor: BRAND_GREEN,
                            color: '#0877C9',
                          },
                        }}
                      >
                        Prepaid
                      </ToggleButton>
                    )}

                    {(!paymentOptions || paymentOptions.codEnabled) && (
                      <ToggleButton
                        value="cod"
                        sx={{
                          px: 3,
                          py: 1,
                          mx: 1,
                          borderRadius: '10px !important',
                          textTransform: 'none',
                          fontWeight: 500,
                          fontSize: '0.95rem',
                          color: '#6B7280',
                          border: '1px solid #E2E8F0',
                          transition: 'all 0.25s ease',
                          '&.Mui-selected': {
                            background: BRAND_GREEN,
                            color: '#FFFFFF',
                            transform: 'scale(1.05)',
                          },
                          '&:hover': {
                            borderColor: BRAND_GREEN,
                            color: '#0877C9',
                          },
                        }}
                      >
                        COD
                      </ToggleButton>
                    )}
                  </ToggleButtonGroup>

                  {fieldState?.error && (
                    <p className="text-red-500 text-sm mt-2">{fieldState.error.message}</p>
                  )}
                </Stack>
              </Stack>
            )}
          />

          <Divider sx={{ my: 2 }} />

          <Grid size={4}>
            <CustomInput
              label={
                watch('paymentType') === 'cod'
                  ? 'Shipment Amount (Rs.)'
                  : 'Total Shipment Value (Rs.)'
              }
              type="number"
              placeholder="Enter shipment value"
              {...register('orderAmount', {
                required: 'Order amount is required',
                min: { value: 1, message: 'Order amount must be at least 1' },
              })}
              error={!!errors.orderAmount}
              helperText={
                (errors.orderAmount?.message as string) ||
                (watch('paymentType') === 'cod'
                  ? 'Used as the shipment amount for COD rate calculation.'
                  : 'Total shipment value used for this rate calculation.')
              }
              fullWidth
              prefix={<BiRupee />}
            />
          </Grid>
          <Divider sx={{ my: 2 }} />

          <CustomIconLoadingButton
            text="Calculate Rate"
            loadingText="Calculating Rate.."
            loading={isPending}
            onClick={handleSubmit(onSubmit)}
          ></CustomIconLoadingButton>
        </CardContent>
      </FormProvider>
      {isPending && (
        <Typography sx={{ color: '#0877C9', textAlign: 'center', py: 2 }}>
          Loading available couriers...
        </Typography>
      )}

      {isError ? (
        <Typography sx={{ color: '#E74C3C', textAlign: 'center', py: 2 }}>
          Failed to fetch couriers: {error?.message ?? 'Unknown error'}
        </Typography>
      ) : (
        <CourierRateCards
          shipmentType={watch('paymentType')}
          serviceType={shipmentType}
          availableCouriers={visibleCouriers}
          defaultLogo={defaultLogo}
        />
      )}

      <Divider />
      <CardContent
        sx={{
          mt: 3,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 3,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          p: 3,
        }}
      >
        <Typography variant="h6" gutterBottom sx={{ color: '#0877C9', fontWeight: 700 }}>
          Terms & Conditions ({shipmentType.toUpperCase()})
        </Typography>

        <Stack spacing={1}>
          {termsAndConditions[shipmentType].map((term, idx) => {
            if (typeof term === 'string') {
              return (
                <Typography
                  key={idx}
                  variant="body2"
                  sx={{ color: '#6B7280', fontSize: '0.85rem', lineHeight: 1.6 }}
                >
                  • {term}
                </Typography>
              )
            }

            // If it’s an object with sub-items
            return (
              <Stack key={idx} spacing={0.5}>
                <Typography
                  variant="body2"
                  sx={{ color: '#0877C9', fontSize: '0.85rem', lineHeight: 1.6, fontWeight: 600 }}
                >
                  • {term.text}
                </Typography>
                <Stack pl={3} spacing={0.3}>
                  {term.sub.map((subItem, subIdx) => (
                    <Typography
                      key={subIdx}
                      variant="body2"
                      sx={{ color: '#6B7280', fontSize: '0.8rem', lineHeight: 1.5 }}
                    >
                      ◦ {subItem}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            )
          })}
        </Stack>
      </CardContent>
    </Stack>
  )
}

import type { JSX } from '@emotion/react/jsx-runtime'
import {
  alpha,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { BiPackage, BiRupee, BiTimeFive } from 'react-icons/bi'
import { FaShippingFast, FaWeight } from 'react-icons/fa'
import { courierLogos } from '../utils/constants'

/* Types */
type ForwardRate = {
  mode?: string | null
  rate?: number | null
  cod_charges?: number | null
  cod_percent?: number | null
  other_charges?: number | null
  total_charges?: number | null
  gst_percent?: number | null
  gst_amount?: number | null
  total_charges_with_gst?: number | null
  wallet_debit_amount?: number | null
  chargeable_weight?: number | null
  volumetric_weight?: number | null
  freight_mode?: string | null
  rov_type?: string | null
  charge_breakdown?: ChargeBreakdownEntry[] | null
  is_prepaid?: boolean
  is_cod?: boolean
}

type LocalRates = {
  forward?: ForwardRate | null
}

type ChargeBreakdownEntry = {
  id?: string | number | null
  code?: string | null
  name?: string | null
  amount?: number | null
}

type ChargeRow = {
  label: string
  value: number
  emphasized?: boolean
  total?: boolean
}

export type Courier = {
  id: string
  courier_id?: string | number | null
  courier_option_key?: string | null
  name?: string | null
  chargeable_weight?: number | null
  volumetric_weight?: number | null
  slabs?: number | null
  rate?: number | null
  cod_charges?: number | null
  other_charges?: number | null
  total_charges?: number | null
  gst_percent?: number | null
  gst_amount?: number | null
  total_charges_with_gst?: number | null
  wallet_debit_amount?: number | null
  freight_mode?: string | null
  rov_type?: string | null
  charge_breakdown?: ChargeBreakdownEntry[] | null
  edd?: string | null
  localRates?: LocalRates | null
  special_zone?: boolean | null
  notes?: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  approxZone: any
}

type Props = {
  availableCouriers?: Courier[]
  defaultLogo?: string
  onSelect?: (courier: Courier) => void
  shipmentType?: string
  serviceType?: 'b2b' | 'b2c'
}

const ACCENT = '#0877C9'
const TEXT_PRIMARY = '#17171A'
const TEXT_MUTED = '#496189'
const BORDER = '#E2E8F0'
const BREAKDOWN_ROW_SX = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 1.2,
  alignItems: 'center',
} as const

const formatWeightDisplay = (value?: number | string | null) => {
  const grams = Number(value ?? 0)
  if (!Number.isFinite(grams) || grams <= 0) return '—'
  if (grams < 1000) return `${Math.round(grams).toLocaleString('en-IN')} g`
  return `${(grams / 1000).toFixed(2)} kg`
}

const formatFreightMode = (value?: string | null) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
  if (normalized === 'fop') return 'Bill to Client'
  if (normalized === 'fod') return 'Freight on Delivery'
  return ''
}

const formatInsuranceType = (value?: string | null) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase()
  if (normalized === 'courier' || normalized === 'carrier') return 'Courier Insurance'
  if (normalized === 'none') return 'No Insurance'
  if (normalized === 'owner') return 'Owner Risk / Insurance'
  return ''
}

const toAmount = (value?: number | string | null) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const buildChargeRows = ({
  forward,
  courier,
  isCOD,
}: {
  forward: ForwardRate
  courier: Courier
  isCOD: boolean
}) => {
  const freight =
    forward?.rate !== undefined && forward?.rate !== null
      ? toAmount(forward.rate)
      : toAmount(courier?.rate)
  const codCharges = isCOD ? toAmount(forward?.cod_charges ?? courier?.cod_charges) : 0
  const otherCharges = toAmount(forward?.other_charges ?? courier?.other_charges)
  const subtotalCharges =
    forward?.total_charges !== undefined && forward?.total_charges !== null
      ? toAmount(forward.total_charges)
      : courier?.total_charges !== undefined && courier?.total_charges !== null
        ? toAmount(courier.total_charges)
        : freight + codCharges + otherCharges
  const explicitFinal =
    forward?.total_charges_with_gst ??
    courier?.total_charges_with_gst ??
    forward?.wallet_debit_amount ??
    courier?.wallet_debit_amount
  const gstPercent = toAmount(forward?.gst_percent ?? courier?.gst_percent)
  const gstAmount =
    forward?.gst_amount !== undefined && forward?.gst_amount !== null
      ? toAmount(forward.gst_amount)
      : courier?.gst_amount !== undefined && courier?.gst_amount !== null
        ? toAmount(courier.gst_amount)
        : Math.max(0, toAmount(explicitFinal) - subtotalCharges)
  const finalTotal =
    explicitFinal !== undefined && explicitFinal !== null
      ? toAmount(explicitFinal)
      : subtotalCharges + gstAmount
  const breakdown = forward?.charge_breakdown ?? courier?.charge_breakdown
  const additionalRows: ChargeRow[] = (Array.isArray(breakdown) ? breakdown : [])
    .filter(
      (charge) =>
        toAmount(charge?.amount) > 0 && String(charge?.code || '').trim().toUpperCase() !== 'COD',
    )
    .map((charge) => ({
      label: String(charge?.name || charge?.code || 'Additional Charge'),
      value: toAmount(charge?.amount),
    }))

  const rows: ChargeRow[] = [
    { label: 'Base Freight', value: freight },
    ...(isCOD ? [{ label: 'COD Charges', value: codCharges }] : []),
    ...(additionalRows.length
      ? additionalRows
      : otherCharges > 0
        ? [{ label: 'Other Charges Total', value: otherCharges }]
        : []),
    { label: 'Subtotal Before GST', value: subtotalCharges, emphasized: true },
    { label: gstPercent > 0 ? `GST (${gstPercent.toFixed(2)}%)` : 'GST', value: gstAmount },
    { label: 'Final Rate', value: finalTotal, total: true },
  ].filter((row) => row.value > 0 || row.emphasized || row.total || row.label === 'COD Charges')

  return {
    rows,
    codCharges,
    otherCharges,
    subtotalCharges,
    finalTotal,
  }
}

export default function CourierRateList({
  availableCouriers = [],
  defaultLogo = '',
  onSelect,
  shipmentType,
  serviceType,
}: Props): JSX.Element {
  if (!availableCouriers || availableCouriers.length === 0) {
    return (
      <Box
        py={8}
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        sx={{
          background: '#FFFFFF',
          borderRadius: 4,
          border: `1px dashed ${alpha(ACCENT, 0.3)}`,
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: alpha(ACCENT, 0.08),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <FaShippingFast size={30} color={ACCENT} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: TEXT_PRIMARY,
            mb: 1,
          }}
        >
          No courier rates available
        </Typography>
        <Typography variant="body2" color={TEXT_MUTED} sx={{ textAlign: 'center', maxWidth: 400 }}>
          Please check your input parameters and try again
        </Typography>
      </Box>
    )
  }

  return (
    <Box mt={4}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: TEXT_PRIMARY,
          mb: 3,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        Available Couriers ({availableCouriers.length})
      </Typography>

      <Grid container spacing={3}>
        {availableCouriers?.map((courier) => {
          const logo =
            Object.entries(courierLogos || {}).find(([key]) =>
              courier?.name?.toLowerCase().includes(key.toLowerCase()),
            )?.[1] ?? defaultLogo

          const forward: ForwardRate = courier?.localRates?.forward ?? {}
          const zoneDisplay =
            String(courier?.approxZone?.name || '').trim() ||
            String(courier?.approxZone?.code || '').trim() ||
            String(
              (courier as any)?.zone_name || (courier as any)?.zone || (courier as any)?.zone_code || '',
            ).trim()
          const chargeableWeight = forward?.chargeable_weight ?? null
          const courierOptionKey = String(
            courier?.courier_option_key ?? courier?.id ?? courier?.courier_id ?? courier?.name ?? '',
          )

          const isCOD = shipmentType === 'cod'
          const showDetailedBreakup = serviceType === 'b2b'
          const { rows: chargeRows, codCharges, otherCharges, subtotalCharges, finalTotal } =
            buildChargeRows({
              forward,
              courier,
              isCOD,
            })
          const freightModeLabel = formatFreightMode(
            forward?.freight_mode ?? courier?.freight_mode ?? null,
          )
          const insuranceLabel = formatInsuranceType(
            forward?.rov_type ?? courier?.rov_type ?? null,
          )

          // Parse EDD
          const eddText = courier?.edd ?? '—'
          const isClickable = Boolean(onSelect)

          return (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={courierOptionKey}>
              <Card
                onClick={isClickable ? () => onSelect?.(courier) : undefined}
                sx={{
                  height: '100%',
                  overflow: 'hidden',
                  borderRadius: 3,
                  border: `1px solid ${BORDER}`,
                  boxShadow: `0 2px 8px ${alpha('#000000', 0.05)}`,
                  transition: 'all 0.2s ease',
                  background: '#FFFFFF',
                  cursor: isClickable ? 'pointer' : 'default',
                  '&:hover': {
                    boxShadow: `0 10px 24px ${alpha(ACCENT, 0.1)}`,
                    borderColor: alpha(ACCENT, 0.28),
                  },
                }}
              >
                <Box
                  sx={{
                    height: 3,
                    background: alpha(ACCENT, 0.9),
                  }}
                />

                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={2.5}>
                    <Avatar
                      src={logo}
                      alt={courier?.name ?? 'logo'}
                      variant="rounded"
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: 2,
                        border: `1px solid ${alpha(ACCENT, 0.14)}`,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 700,
                          color: TEXT_PRIMARY,
                          lineHeight: 1.3,
                          mb: 0.5,
                        }}
                        noWrap
                      >
                        {courier?.name ?? 'Unknown Courier'}
                      </Typography>
                      {zoneDisplay && (
                        <Chip
                          label={zoneDisplay}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            background: alpha(ACCENT, 0.08),
                            color: ACCENT,
                            border: `1px solid ${alpha(ACCENT, 0.2)}`,
                          }}
                        />
                      )}
                    </Box>
                  </Stack>

                  <Box
                    sx={{
                      background: alpha(ACCENT, 0.04),
                      borderRadius: 2,
                      p: 2,
                      mb: 2.5,
                      border: `1px solid ${alpha(ACCENT, 0.14)}`,
                    }}
                  >
                    <Stack direction="row" alignItems="baseline" spacing={1}>
                      <BiRupee size={20} color={ACCENT} />
                      <Typography
                        variant="h4"
                        sx={{
                          fontWeight: 800,
                          color: TEXT_PRIMARY,
                          fontSize: '2rem',
                          lineHeight: 1,
                        }}
                      >
                        {finalTotal > 0 ? finalTotal.toLocaleString('en-IN') : 'N/A'}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{
                        color: TEXT_MUTED,
                        fontWeight: 500,
                        mt: 0.5,
                        display: 'block',
                      }}
                    >
                      {finalTotal > subtotalCharges
                        ? 'Including COD, surcharges and GST'
                        : isCOD
                        ? 'Including COD Charges'
                        : 'Prepaid Rate'}
                    </Typography>
                  </Box>

                  {/* Details Grid */}
                  <Grid container spacing={1.5} mb={2}>
                    {/* EDD */}
                    <Grid size={{ xs: 6 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          background: '#F8FAFC',
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        <BiTimeFive size={18} color={ACCENT} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEXT_MUTED,
                              fontSize: '0.7rem',
                              display: 'block',
                              lineHeight: 1.2,
                            }}
                          >
                            EDD
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: TEXT_PRIMARY,
                              fontSize: '0.85rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {eddText}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>

                    {/* Chargeable Weight */}
                    <Grid size={{ xs: 6 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          background: '#F8FAFC',
                          border: `1px solid ${BORDER}`,
                        }}
                      >
                        <FaWeight size={16} color={ACCENT} />
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEXT_MUTED,
                              fontSize: '0.7rem',
                              display: 'block',
                              lineHeight: 1.2,
                            }}
                          >
                            Weight
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: TEXT_PRIMARY,
                              fontSize: '0.85rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {formatWeightDisplay(chargeableWeight)}
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>

                  {/* Additional Info */}
                  <Stack spacing={1}>
                    {forward?.mode && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiPackage size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          Mode: <strong>{forward.mode}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {!showDetailedBreakup && isCOD && codCharges > 0 && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiRupee size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          COD Charges: <strong>₹{codCharges.toLocaleString('en-IN')}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {!showDetailedBreakup && otherCharges > 0 && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiRupee size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          Other Charges: <strong>₹{otherCharges.toLocaleString('en-IN')}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {freightModeLabel && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiPackage size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          Freight Mode: <strong>{freightModeLabel}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {insuranceLabel && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiPackage size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          Insurance: <strong>{insuranceLabel}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {!showDetailedBreakup && finalTotal > subtotalCharges && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BiRupee size={14} color={TEXT_MUTED} />
                        <Typography variant="caption" color={TEXT_MUTED} sx={{ fontSize: '0.75rem' }}>
                          Freight Before GST: <strong>₹{subtotalCharges.toLocaleString('en-IN')}</strong>
                        </Typography>
                      </Stack>
                    )}
                    {courier?.notes && (
                      <Tooltip title={courier.notes} arrow>
                        <Chip
                          label="Special Notes"
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            background: alpha(ACCENT, 0.08),
                            color: ACCENT,
                            border: `1px solid ${alpha(ACCENT, 0.2)}`,
                            cursor: 'help',
                            '&:hover': {
                              background: alpha(ACCENT, 0.12),
                            },
                          }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                  {showDetailedBreakup && chargeRows.length > 0 && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        background: '#F8FAFC',
                        border: `1px solid ${BORDER}`,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: TEXT_MUTED,
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          display: 'block',
                          mb: 1,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        Final Rate Breakdown
                      </Typography>
                      <Stack spacing={0.85}>
                        <Box
                          sx={{
                            ...BREAKDOWN_ROW_SX,
                            pb: 0.45,
                            borderBottom: `1px solid ${BORDER}`,
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEXT_MUTED,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                            }}
                          >
                            Charge Name
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: TEXT_MUTED,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                            }}
                          >
                            Amount
                          </Typography>
                        </Box>
                        {chargeRows.map((row, index) => (
                          <Box key={`${courierOptionKey}-${row.label}`}>
                            {row.total && index > 0 ? (
                              <Box
                                sx={{
                                  borderTop: `1px solid ${BORDER}`,
                                  my: 0.85,
                                }}
                              />
                            ) : null}
                            <Box sx={BREAKDOWN_ROW_SX}>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: row.total ? TEXT_PRIMARY : TEXT_MUTED,
                                  fontSize: '0.76rem',
                                  fontWeight: row.total || row.emphasized ? 800 : 600,
                                }}
                              >
                                {row.label}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: TEXT_PRIMARY,
                                  fontSize: '0.76rem',
                                  fontWeight: row.total ? 900 : row.emphasized ? 800 : 700,
                                }}
                              >
                                ₹{row.value.toLocaleString('en-IN', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>
    </Box>
  )
}

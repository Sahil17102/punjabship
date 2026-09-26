'use client'

import {
  alpha,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import {
  FaBuilding,
  FaBoxOpen,
  FaEnvelopeOpenText,
  FaHashtag,
  FaPhoneAlt,
  FaReceipt,
  FaSearch,
  FaShippingFast,
  FaStore,
  FaTruck,
} from 'react-icons/fa'
import { MdLocationOn, MdSchedule } from 'react-icons/md'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { fetchBulkTracking, type TrackingBulkResult, type TrackingHistory } from '../../api/tracking.service'
import AWBLink from '../../components/UI/AWBLink'
import CustomInput from '../../components/UI/inputs/CustomInput'
import { SmartTabs } from '../../components/UI/tab/Tabs'
import { useTracking } from '../../hooks/Orders/useTracking'
import {
  getAwbTrackingPath,
  getClientAwbTrackingPath,
  isValidAwb,
  normalizeAwb,
} from '../../utils/awb'

type FormValues = {
  awb: string
  orderNumber: string
  contact: string
}

const formatTrackingEventTime = (value: string) =>
  new Date(value).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const trackingStages = [
  { label: 'Booked', icon: FaStore },
  { label: 'Pending Pickup', icon: FaBuilding },
  { label: 'In Transit', icon: FaTruck },
  { label: 'Out for Delivery', icon: FaShippingFast },
  { label: 'Delivered', icon: FaBoxOpen },
]

const normalizeStatus = (value?: string | null) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const getStageIndexFromStatus = (value?: string | null) => {
  const status = normalizeStatus(value)
  if (!status) return -1
  if (['dl', 'delivered', 'rto_delivered', 'rt_dl'].includes(status)) return 4
  if (['ofd', 'out_for_delivery', 'out_for_delivery_pending'].includes(status)) return 3
  if (['ndr', 'undelivered', 'exception', 'ex'].includes(status)) return 3
  if (['it', 'in_transit', 'rt', 'rto', 'rt_it', 'rto_in_transit'].includes(status)) return 2
  if (['pp', 'picked_up', 'pickup_done', 'pickup_initiated', 'manifested'].includes(status)) return 1
  if (['booked', 'new', 'pending', 'shipment_created', 'order_created'].includes(status)) return 0
  if (['can', 'cancelled', 'canceled'].includes(status)) return 0
  return -1
}

const getCurrentStage = (tracking?: { status?: string; history?: TrackingHistory[] } | null) => {
  const directStage = getStageIndexFromStatus(tracking?.status)
  if (directStage >= 0) return directStage

  return Math.max(
    0,
    ...(tracking?.history || []).map((event) =>
      Math.max(
        getStageIndexFromStatus(event.status_code),
        getStageIndexFromStatus(event.message),
      ),
    ),
  )
}

const getTrackingEventHub = (event: TrackingHistory) =>
  String(event.hub_name || event.location || 'Hub unavailable').trim()

export default function OrderTrackingForm() {
  const BRAND_PRIMARY = '#0877C9'
  const BRAND_ACCENT = '#B8D719'
  const shellCardStyles = {
    borderRadius: 2.5,
    border: `1px solid ${alpha(BRAND_PRIMARY, 0.12)}`,
    boxShadow: '0 12px 26px rgba(20, 20, 20, 0.07)',
    background:
      'radial-gradient(circle at top right, rgba(232,85,0,0.09) 0%, transparent 24%), linear-gradient(180deg, #FFFFFF 0%, #FBF7F4 100%)',
  }

  const navigate = useNavigate()
  const location = useLocation()
  const { awb: awbParam } = useParams<{ awb?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mode, setMode] = useState<'awb' | 'order'>('awb')
  const [error, setError] = useState('')
  const [bulkResults, setBulkResults] = useState<TrackingBulkResult[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)

  const routeAwb = normalizeAwb(awbParam)
  const queryAwb = normalizeAwb(searchParams.get('awb'))
  const activeAwb = routeAwb || queryAwb
  const activeOrder = searchParams.get('orderNumber')
  const activeContact = searchParams.get('contact')
  const isClientTrackingRoute = location.pathname.startsWith('/tools/order_tracking')
  const trackingBasePath = isClientTrackingRoute ? '/tools/order_tracking' : '/tracking'

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      awb: '',
      orderNumber: '',
      contact: '',
    },
  })

  const formValues = watch()
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.contact)
  const isPhone = /^[0-9+\-\s()]{7,}$/.test(formValues.contact)
  const isContactValid = !formValues.contact || isEmail || isPhone

  const {
    data: tracking,
    isFetching: trackingLoading,
    isError: trackingError,
    error: trackingErrorObj,
    isSuccess,
  } = useTracking(
    isValidAwb(activeAwb) ? activeAwb : null,
    activeOrder ?? null,
    activeContact ?? null,
  )

  useEffect(() => {
    if (activeAwb) {
      setMode('awb')
      reset({
        awb: activeAwb,
        orderNumber: '',
        contact: '',
      })
      if (!isValidAwb(activeAwb)) {
        setError('Invalid AWB')
      }
      return
    }

    if (activeOrder || activeContact) {
      setMode('order')
      reset({
        awb: '',
        orderNumber: activeOrder || '',
        contact: activeContact || '',
      })
      return
    }

    reset({
      awb: '',
      orderNumber: '',
      contact: '',
    })
  }, [activeAwb, activeContact, activeOrder, reset])

  useEffect(() => {
    if (activeAwb && !isValidAwb(activeAwb)) {
      setError('Invalid AWB')
      return
    }

    if (trackingError) {
      setError(
        trackingErrorObj instanceof Error ? trackingErrorObj.message : 'Failed to fetch tracking',
      )
    } else if (isSuccess) {
      setError('')
    }
  }, [activeAwb, isSuccess, trackingError, trackingErrorObj])

  const parseAwbs = (value: string) =>
    Array.from(new Set(value.split(/[\s,;|]+/).map((item) => normalizeAwb(item)).filter(Boolean)))

  const enteredAwbs = parseAwbs(formValues.awb || '')
  const canSubmit =
    mode === 'awb'
      ? enteredAwbs.length > 1
        ? enteredAwbs.every(isValidAwb)
        : isValidAwb(formValues.awb)
      : formValues.orderNumber.trim().length > 2 &&
        formValues.contact.trim().length > 3 &&
        isContactValid

  const onSubmit = async (data: FormValues) => {
    if (!canSubmit) return
    setError('')
    setBulkResults([])

    if (mode === 'awb') {
      const awbList = parseAwbs(data.awb)
      if (awbList.length > 1) {
        if (!awbList.every(isValidAwb)) {
          setError('One or more AWB numbers are invalid')
          return
        }
        setBulkLoading(true)
        try {
          setBulkResults(await fetchBulkTracking(awbList))
        } catch (fetchError) {
          setError(fetchError instanceof Error ? fetchError.message : 'Failed to fetch tracking')
        } finally {
          setBulkLoading(false)
        }
        return
      }

      const normalizedAwb = normalizeAwb(data.awb)
      if (!isValidAwb(normalizedAwb)) {
        setError('Invalid AWB')
        return
      }
      navigate(
        isClientTrackingRoute
          ? getClientAwbTrackingPath(normalizedAwb)
          : getAwbTrackingPath(normalizedAwb),
      )
      return
    }

    const params = new URLSearchParams({
      orderNumber: data.orderNumber.trim(),
      contact: data.contact.trim(),
    })

    navigate(`${trackingBasePath}?${params.toString()}`)
  }

  const sortedHistory = useMemo<TrackingHistory[]>(() => {
    if (!tracking?.history) return []
    return [...tracking.history].sort(
      (a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime(),
    )
  }, [tracking])

  const currentStage = getCurrentStage(tracking)
  const normalizedTrackingStatus = normalizeStatus(tracking?.status)
  const isCancelled = ['can', 'cancelled', 'canceled'].includes(normalizedTrackingStatus)
  const isRto =
    normalizedTrackingStatus.includes('rto') || normalizedTrackingStatus.startsWith('rt')

  const resetResults = () => {
    setError('')
    setSearchParams({})
  }

  return (
    <Stack sx={{ py: { xs: 1, md: 1.4 } }} spacing={{ xs: 1.25, md: 1.5 }}>
      <Box
        sx={{
          p: { xs: 1.6, md: 2 },
          borderRadius: 2.5,
          border: `1px solid ${alpha(BRAND_PRIMARY, 0.12)}`,
          boxShadow: '0 10px 24px rgba(20, 20, 20, 0.07)',
          background:
            'radial-gradient(circle at top right, rgba(26,117,0,0.08) 0%, transparent 26%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,247,245,0.98) 100%)',
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: '1.2rem', md: '1.45rem' },
            fontWeight: 800,
            color: '#17171A',
            lineHeight: 1.12,
          }}
        >
          Shipment tracking
        </Typography>
        <Typography sx={{ mt: 0.5, maxWidth: 760, color: '#6E6763', fontSize: '0.88rem' }}>
          Track every PunjabShip shipment from a single clean workspace using either AWB details or
          your order reference with customer contact.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.8} mt={1.1}>
          {[
            'Live courier event timeline',
            'Search by AWB or order reference',
            'Clear shipment overview and delivery ETA',
          ].map((item) => (
            <Chip
              key={item}
              label={item}
              sx={{
                alignSelf: 'flex-start',
                bgcolor: alpha(BRAND_PRIMARY, 0.08),
                color: BRAND_PRIMARY,
                borderRadius: '999px',
                fontWeight: 700,
                height: 26,
                fontSize: '0.74rem',
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        sx={{ p: { xs: 1.6, md: 2.2 }, ...shellCardStyles }}
      >
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: '#17171A', mb: 0.25 }}>
          Find a shipment
        </Typography>
        <Typography variant="body2" sx={{ color: '#6E6763', mb: 1.4, fontSize: '0.84rem' }}>
          Enter the strongest identifier you have and we&apos;ll pull the latest tracking activity.
        </Typography>

        <SmartTabs
          onChange={(value) => {
            const nextMode = value as 'awb' | 'order'
            setMode(nextMode)
            reset({
              awb: '',
              orderNumber: '',
              contact: '',
            })
            setError('')
            resetResults()
            if (nextMode === 'order' && location.pathname.startsWith('/tracking/')) {
              navigate(trackingBasePath)
            }
          }}
          tabs={[
            { label: 'Track By AWB', value: 'awb' },
            { label: 'Track By Order ID', value: 'order' },
          ]}
          value={mode}
        />

        {mode === 'awb' ? (
          <FormControl fullWidth sx={{ mb: 1.6 }}>
            <Controller
              name="awb"
              control={control}
              render={({ field }) => (
                <CustomInput
                  {...field}
                  id="awb"
                  placeholder="Single AWB or paste multiple AWBs separated by comma, space, or new line"
                  prefix={<FaHashtag />}
                  error={!!errors.awb}
                  helperText={errors.awb?.message || 'Paste multiple AWBs to search them together'}
                  label="AWB Number(s)"
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                />
              )}
              rules={{
                required: 'AWB number is required',
                validate: (value) => parseAwbs(value).every(isValidAwb) || 'Invalid AWB',
              }}
            />
            {errors.awb && <FormHelperText error>{errors.awb.message}</FormHelperText>}
          </FormControl>
        ) : (
          <>
            <FormControl fullWidth sx={{ mb: 1.6 }}>
              <Controller
                name="orderNumber"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    id="orderNumber"
                    placeholder="e.g. ORD-2025-0001"
                    prefix={<FaReceipt />}
                    error={!!errors.orderNumber}
                    label="Order ID"
                  />
                )}
                rules={{ required: 'Order ID is required' }}
              />
              {errors.orderNumber && (
                <FormHelperText error>{errors.orderNumber.message}</FormHelperText>
              )}
            </FormControl>

            <FormControl fullWidth sx={{ mb: 1.6 }}>
              <Controller
                name="contact"
                control={control}
                render={({ field }) => (
                  <CustomInput
                    {...field}
                    id="contact"
                    placeholder="you@example.com or +91 98765 43210"
                    prefix={isEmail ? <FaEnvelopeOpenText /> : <FaPhoneAlt />}
                    error={!isContactValid}
                    label="Email or Phone"
                  />
                )}
                rules={{ required: 'Email or Phone is required' }}
              />
              {!isContactValid && (
                <FormHelperText error>Enter a valid email or phone number</FormHelperText>
              )}
            </FormControl>
          </>
        )}

        {error && (
          <Typography
            variant="body2"
            mb={2}
            sx={{
              color: '#B42318',
              bgcolor: 'rgba(180,35,24,0.06)',
              border: '1px solid rgba(180,35,24,0.12)',
              borderRadius: 2,
              px: 1.6,
              py: 0.9,
            }}
          >
            {error}
          </Typography>
        )}

        <Box display="flex" gap={1.2} alignItems="center" flexWrap="wrap">
          <Button
            type="submit"
            variant="contained"
            startIcon={trackingLoading || bulkLoading ? <CircularProgress size={18} /> : <FaSearch />}
            disabled={!canSubmit || trackingLoading || bulkLoading}
            sx={{
              borderRadius: '8px',
              minHeight: 38,
              px: 2,
              py: 0.8,
              bgcolor: BRAND_PRIMARY,
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': { bgcolor: '#591AA4' },
            }}
          >
            {trackingLoading || bulkLoading ? 'Tracking...' : 'Track Order'}
          </Button>
          <Button
            type="button"
            variant="text"
            color="inherit"
            onClick={() => {
              reset({
                awb: '',
                orderNumber: '',
                contact: '',
              })
              resetResults()
              if (location.pathname.startsWith('/tracking')) {
                navigate(trackingBasePath)
              }
            }}
            sx={{
              borderRadius: '8px',
              color: '#6E6763',
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Reset
          </Button>
        </Box>
      </Box>

      {bulkResults.length > 0 && (
        <Card sx={shellCardStyles}>
          <CardContent>
            <Typography variant="h6" fontWeight={800} gutterBottom color="#17171A">
              Multiple AWB search
            </Typography>
            <Grid container spacing={1.2}>
              {bulkResults.map((item) => (
                <Grid key={item.awb} size={{ xs: 12, md: 6 }}>
                  <Box
                    sx={{
                      p: 1.4,
                      borderRadius: 2,
                      border: `1px solid ${alpha(item.success ? '#16A34A' : '#DC2626', 0.18)}`,
                      bgcolor: item.success ? alpha('#16A34A', 0.05) : alpha('#DC2626', 0.05),
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                      <AWBLink awb={item.awb} compact />
                      <Chip
                        size="small"
                        label={item.success ? item.data?.status || 'Found' : 'Not found'}
                        color={item.success ? 'success' : 'error'}
                      />
                    </Stack>
                    <Typography sx={{ mt: 0.7, fontSize: '0.8rem', color: '#6E6763' }}>
                      {item.success
                        ? `${item.data?.courier_name || 'Courier'} | ${item.data?.order_number || 'Order unavailable'}`
                        : item.message || 'Tracking unavailable'}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {isSuccess && tracking && (activeAwb || (activeOrder && activeContact)) && (
        <Stack spacing={1.5} mt={1.5}>
          <Card sx={shellCardStyles}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} gutterBottom color="#17171A">
                Shipment Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    AWB Number
                  </Typography>
                  <Typography fontWeight={600}>
                    {tracking.awb_number ? <AWBLink awb={tracking.awb_number} /> : '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Number
                  </Typography>
                  <Typography fontWeight={600}>{tracking.order_number || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Courier
                  </Typography>
                  <Typography fontWeight={600}>{tracking.courier_name || '-'}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={tracking.status || 'Unknown'}
                    color={(() => {
                      const normalized = (tracking.status || '').toLowerCase()
                      if (normalized.includes('deliver')) return 'success'
                      if (normalized.includes('transit')) return 'info'
                      if (normalized.includes('cancel')) return 'error'
                      if (normalized.includes('rto')) return 'warning'
                      return 'default'
                    })()}
                    size="small"
                    sx={{ fontWeight: 700, borderRadius: '999px' }}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Type
                  </Typography>
                  <Typography fontWeight={600} textTransform="uppercase">
                    {tracking.payment_type || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    Estimated Delivery
                  </Typography>
                  <Typography fontWeight={600}>
                    {tracking.edd ? new Date(tracking.edd).toLocaleDateString() : '-'}
                  </Typography>
                </Grid>
              </Grid>
              {tracking.shipment_info && (
                <Box mt={3}>
                  <Typography variant="body2" color="text.secondary" gutterBottom fontWeight={700}>
                    Shipment Info
                  </Typography>
                  <Typography fontSize={14}>{tracking.shipment_info}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={shellCardStyles}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
                spacing={1}
                mb={1}
              >
                <Typography variant="h6" fontWeight={800} color="#17171A">
                  Travel pipeline
                </Typography>
                <Chip
                  label={`${sortedHistory.length} event${sortedHistory.length === 1 ? '' : 's'}`}
                  sx={{
                    bgcolor: alpha(BRAND_ACCENT, 0.1),
                    color: BRAND_ACCENT,
                    borderRadius: '999px',
                    fontWeight: 800,
                  }}
                />
              </Stack>
              <Divider sx={{ mb: 1.5 }} />
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} sx={{ mb: 1.4 }}>
                {trackingStages.map((stage, index) => {
                  const StageIcon = stage.icon
                  const active = !isCancelled && index <= currentStage
                  const label =
                    isCancelled && index === 0
                      ? 'Cancelled'
                      : isRto && index === trackingStages.length - 1
                        ? normalizedTrackingStatus.includes('delivered')
                          ? 'RTO Delivered'
                          : 'RTO'
                        : stage.label

                  return (
                    <Box
                      key={stage.label}
                      sx={{
                        flex: 1,
                        p: 1.1,
                        minHeight: 76,
                        borderRadius: 2,
                        border: `1px solid ${alpha(active ? BRAND_PRIMARY : isCancelled && index === 0 ? '#DC2626' : '#CBD5E1', 0.34)}`,
                        bgcolor: active
                          ? alpha(BRAND_PRIMARY, 0.08)
                          : isCancelled && index === 0
                            ? alpha('#DC2626', 0.08)
                            : '#FFFFFF',
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={0.9}>
                        <Box
                          sx={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            display: 'grid',
                            placeItems: 'center',
                            bgcolor: active
                              ? BRAND_PRIMARY
                              : isCancelled && index === 0
                                ? '#DC2626'
                                : '#E5E7EB',
                            color: active || (isCancelled && index === 0) ? '#FFFFFF' : '#64748B',
                          }}
                        >
                          <StageIcon size={14} />
                        </Box>
                        <Typography sx={{ fontSize: '0.76rem', fontWeight: 800, color: '#17171A' }}>
                          {label}
                        </Typography>
                      </Stack>
                    </Box>
                  )
                })}
              </Stack>
              <Typography variant="h6" fontWeight={700} gutterBottom sx={{ display: 'none' }}>
                Tracking Timeline
              </Typography>
              {sortedHistory.length === 0 ? (
                <Typography color="text.secondary">No tracking events available yet.</Typography>
              ) : (
                <List>
                  {sortedHistory.map((event, idx) => (
                    <Fragment key={`${event.event_time}-${idx}`}>
                      <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          {idx === 0 ? (
                            <FaBoxOpen color="#0877C9" size={20} />
                          ) : (
                            <MdLocationOn color="#6B7280" size={20} />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography fontWeight={600}>
                                {event.message || event.status_code}
                              </Typography>
                            </Stack>
                          }
                          secondary={
                            <Stack
                              direction={{ xs: 'column', sm: 'row' }}
                              spacing={1}
                              mt={0.5}
                              alignItems={{ sm: 'center' }}
                            >
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <MdSchedule size={16} />
                                <Typography variant="caption">
                                  {formatTrackingEventTime(event.event_time)}
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                Hub: {getTrackingEventHub(event)}
                              </Typography>
                            </Stack>
                          }
                        />
                      </ListItem>
                      {idx !== sortedHistory.length - 1 && <Divider component="li" />}
                    </Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Stack>
      )}
    </Stack>
  )
}

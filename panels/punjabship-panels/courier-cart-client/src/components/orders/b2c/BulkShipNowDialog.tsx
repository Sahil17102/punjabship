import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { fetchAvailableCouriers } from '../../../api/courier'
import { bookExistingB2COrderCourier } from '../../../api/order.service'
import type { B2COrder } from '../../../types/generic.types'
import { toast } from '../../UI/Toast'

// Provider-specific serviceability metadata is intentionally open-ended.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CourierOption = Record<string, any>

type Props = {
  open: boolean
  orders: B2COrder[]
  onClose: () => void
  onComplete: () => void
}

const courierKey = (courier: CourierOption) =>
  String(courier.courier_option_key ?? courier.id ?? courier.courier_id ?? '')

const courierLabel = (courier: CourierOption) =>
  String(courier.displayName ?? courier.name ?? courier.courier_name ?? 'Courier')

const getIntegrationType = (courier: CourierOption) =>
  String(courier.integration_type ?? courier.integrationType ?? courier.serviceProvider ?? 'punjabship')
    .trim()
    .toLowerCase()

const getRateCardId = (courier: CourierOption) =>
  String(
    courier.rate_card_id ??
      courier.shipping_rate_id ??
      courier.localRates?.forward?.shipping_rate_id ??
      '',
  ).trim()

const getQuotedRate = (courier: CourierOption) =>
  Number(courier.rate ?? courier.total_charges ?? courier.shipping_charges ?? 0)

const isBookableRate = (courier: CourierOption) =>
  courier?.booking_available !== false &&
  courier?.can_book !== false &&
  courier?.provider_serviceability?.booking_available !== false &&
  courier?.provider_serviceability?.can_book !== false &&
  Boolean(courierKey(courier)) &&
  Boolean(getRateCardId(courier)) &&
  Number.isFinite(getQuotedRate(courier))

const courierIdentity = (courier: CourierOption) =>
  [
    courier.id ?? courier.courier_id ?? '',
    getIntegrationType(courier),
    courier.shipping_mode ?? courier.mode ?? '',
    courier.max_slab_weight ?? courier.selected_max_slab_weight ?? '',
  ]
    .map((value) => String(value).trim().toLowerCase())
    .join('__')

const errorMessage = (error: unknown) => {
  const candidate = error as {
    response?: { data?: { error?: unknown; message?: unknown } }
    message?: unknown
  }
  return String(
    candidate?.response?.data?.error ||
      candidate?.response?.data?.message ||
      candidate?.message ||
      'Booking failed',
  )
}

const fetchOrderCouriers = async (order: B2COrder) => {
  const pickup = order.pickup_details || {}
  const options = await fetchAvailableCouriers({
    origin: pickup.pincode,
    destination: order.pincode,
    pickupId: order.pickup_location_id,
    pickupName: pickup.warehouse_name || pickup.name,
    pickupPhone: pickup.phone,
    pickupAddress: pickup.address,
    pickupCity: pickup.city,
    pickupState: pickup.state,
    deliveryName: order.buyer_name,
    deliveryPhone: order.buyer_phone,
    deliveryAddress: order.address,
    deliveryCity: order.city,
    deliveryState: order.state,
    payment_type: order.order_type,
    order_amount: Number(order.order_amount || 0),
    cod: order.order_type === 'cod' ? 1 : 0,
    weight: Number(order.weight || 0),
    length: Number(order.length || 0),
    breadth: Number(order.breadth || 0),
    height: Number(order.height || 0),
    shipment_type: 'b2c',
    context: 'shipment_courier_selection',
  })

  return options.filter(isBookableRate)
}

const BulkShipNowDialog = ({ open, orders, onClose, onComplete }: Props) => {
  const [globalCourier, setGlobalCourier] = useState('')
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({})
  const [couriersByOrder, setCouriersByOrder] = useState<Record<string, CourierOption[]>>({})
  const [errorsByOrder, setErrorsByOrder] = useState<Record<string, string>>({})
  const [isLoadingCouriers, setIsLoadingCouriers] = useState(false)
  const [isBooking, setIsBooking] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setGlobalCourier('')
    setSelectedCouriers({})
    setCouriersByOrder({})
    setErrorsByOrder({})
    setIsLoadingCouriers(true)

    void Promise.all(
      orders.map(async (order) => {
        try {
          return { orderId: String(order.id), options: await fetchOrderCouriers(order), error: '' }
        } catch (error) {
          return { orderId: String(order.id), options: [], error: errorMessage(error) }
        }
      }),
    ).then((results) => {
      if (cancelled) return
      const nextOptions = Object.fromEntries(results.map((result) => [result.orderId, result.options]))
      setCouriersByOrder(nextOptions)
      setErrorsByOrder(
        Object.fromEntries(results.filter((result) => result.error).map((result) => [result.orderId, result.error])),
      )
      setSelectedCouriers(
        Object.fromEntries(
          results.map((result) => [result.orderId, courierKey(result.options[0] || {})]),
        ),
      )
      setIsLoadingCouriers(false)
    })

    return () => {
      cancelled = true
    }
  }, [open, orders])

  const globalCourierOptions = useMemo(() => {
    if (!orders.length) return []
    const firstOptions = couriersByOrder[String(orders[0].id)] || []
    return firstOptions.filter((option) =>
      orders.every((order) =>
        (couriersByOrder[String(order.id)] || []).some(
          (candidate) => courierIdentity(candidate) === courierIdentity(option),
        ),
      ),
    )
  }, [couriersByOrder, orders])

  const hasMissingSelection = orders.some((order) => !selectedCouriers[String(order.id)])

  const applyGlobalCourier = (identity: string) => {
    setGlobalCourier(identity)
    if (!identity) return
    setSelectedCouriers(
      Object.fromEntries(
        orders.map((order) => {
          const match = (couriersByOrder[String(order.id)] || []).find(
            (courier) => courierIdentity(courier) === identity,
          )
          return [String(order.id), courierKey(match || {})]
        }),
      ),
    )
  }

  const bookOrders = async () => {
    if (!orders.length || hasMissingSelection) return
    setIsBooking(true)
    let successCount = 0
    const failures: string[] = []

    for (const order of orders) {
      const orderId = String(order.id)
      const selected = (couriersByOrder[orderId] || []).find(
        (courier) => courierKey(courier) === selectedCouriers[orderId],
      )
      if (!selected) {
        failures.push(`${order.order_number}: select a courier`)
        continue
      }

      try {
        const pickup = order.pickup_details || {}
        await bookExistingB2COrderCourier(orderId, {
          payment_type: order.order_type,
          package_weight: Number(order.weight || 0),
          package_length: Number(order.length || 0),
          package_breadth: Number(order.breadth || 0),
          package_height: Number(order.height || 0),
          shipping_charges: Number(order.shipping_charges || 0),
          freight_charges: getQuotedRate(selected),
          cod_charges: Number(selected.cod_charges || 0),
          other_charges: Number(selected.other_charges || 0),
          courier_cost: selected.courier_cost_estimate ?? undefined,
          courier_id: Number(selected.id ?? selected.courier_id),
          courier_partner: courierLabel(selected),
          integration_type: getIntegrationType(selected),
          courier_option_key: courierKey(selected),
          selected_rate_card_id: getRateCardId(selected),
          selected_max_slab_weight: Number(
            selected.max_slab_weight ?? selected.selected_max_slab_weight ?? 0,
          ) || undefined,
          shipping_mode: selected.shipping_mode ?? selected.mode ?? undefined,
          zone_id: selected.zone_id ? String(selected.zone_id) : undefined,
          chargedWeight: selected.charged_weight ?? selected.chargedWeight ?? null,
          volumetricWeight: selected.volumetric_weight ?? selected.volumetricWeight ?? null,
          pickup_location_id: order.pickup_location_id ?? undefined,
          pickup_date: order.pickup_details?.pickup_date,
          pickup_time: order.pickup_details?.pickup_time,
          delivery_location: order.city,
          consignee: {
            name: order.buyer_name,
            phone: order.buyer_phone,
            email: order.buyer_email ?? undefined,
            address: order.address,
            city: order.city,
            state: order.state,
            pincode: order.pincode,
          },
          pickup: {
            warehouse_name: pickup.warehouse_name || pickup.name || '',
            address: pickup.address || '',
            city: pickup.city || '',
            state: pickup.state || '',
            pincode: pickup.pincode || '',
            phone: pickup.phone || '',
          },
        })
        successCount += 1
      } catch (error) {
        failures.push(`${order.order_number}: ${errorMessage(error)}`)
      }
    }

    setIsBooking(false)
    if (failures.length) {
      toast.open({
        message: `${successCount} booked. ${failures.length} failed: ${failures.slice(0, 2).join('; ')}`,
        severity: successCount ? 'warning' : 'error',
      })
    } else {
      toast.open({ message: `${successCount} order(s) booked successfully.`, severity: 'success' })
    }
    onComplete()
    onClose()
  }

  return (
    <Dialog open={open} onClose={isBooking ? undefined : onClose} fullWidth maxWidth="lg">
      <DialogTitle sx={{ pb: 0.5, fontWeight: 800 }}>Book &amp; Ship {orders.length} drafts</DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Choose one available courier for all orders or set a different courier on each row. Wallet charges happen only when booking starts.
        </Typography>
        {isLoadingCouriers && (
          <Alert icon={<CircularProgress size={18} />} severity="info" sx={{ mb: 2 }}>
            Checking serviceability and your assigned rate cards...
          </Alert>
        )}
        {!isLoadingCouriers && orders.length > 0 && globalCourierOptions.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No single courier is available for every order. Choose a courier on each row.
          </Alert>
        )}
        <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={isLoadingCouriers}>
          <InputLabel>Courier for all</InputLabel>
          <Select label="Courier for all" value={globalCourier} onChange={(event) => applyGlobalCourier(event.target.value)}>
            <MenuItem value="">Keep individual selections</MenuItem>
            {globalCourierOptions.map((courier) => (
              <MenuItem key={courierIdentity(courier)} value={courierIdentity(courier)}>
                {courierLabel(courier)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead><TableRow><TableCell>Order</TableCell><TableCell>Destination</TableCell><TableCell>Weight</TableCell><TableCell sx={{ minWidth: 300 }}>Courier</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
            <TableBody>
              {orders.map((order) => {
                const orderId = String(order.id)
                const options = couriersByOrder[orderId] || []
                const rowError = errorsByOrder[orderId]
                return (
                  <TableRow key={order.id}>
                    <TableCell><Typography fontWeight={700}>{order.order_number}</Typography><Typography variant="caption">{order.buyer_name}</Typography></TableCell>
                    <TableCell>{order.city}, {order.state} {order.pincode}</TableCell>
                    <TableCell>{Number(order.weight || 0).toFixed(2)} kg</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small" disabled={isLoadingCouriers || !options.length}>
                        <Select
                          value={selectedCouriers[orderId] || ''}
                          displayEmpty
                          onChange={(event) => {
                            setGlobalCourier('')
                            setSelectedCouriers((current) => ({ ...current, [orderId]: event.target.value }))
                          }}
                        >
                          {!options.length && <MenuItem value="">No rated courier available</MenuItem>}
                          {options.map((courier) => (
                            <MenuItem key={courierKey(courier)} value={courierKey(courier)}>
                              {courierLabel(courier)} - Rs {getQuotedRate(courier).toFixed(2)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      {rowError && <Typography variant="caption" color="error">{rowError}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography color={options.length ? 'success.main' : 'error.main'} fontWeight={700}>
                        {options.length ? (order.order_status === 'failed' ? 'Ready to reship' : 'Ready to book') : 'Rate unavailable'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isBooking}>Cancel</Button>
        <Button variant="contained" onClick={bookOrders} disabled={isBooking || isLoadingCouriers || hasMissingSelection}>
          {isBooking ? 'Booking...' : `Book & Ship ${orders.length}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default BulkShipNowDialog

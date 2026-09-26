import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { quoteReverse } from '../../../api/returns'
import { fetchWalletBalance } from '../../../api/wallet.api'

const GST_PERCENT = 18
const SUPPORTED_REVERSE_PROVIDERS = new Set([
  'delhivery',
  'shadowfax',
  'xpressbees',
  'ekart',
  'amazon',
])

type ProductLike = {
  name?: string
  productName?: string
  sku?: string
  qty?: number
  quantity?: number
  price?: number
  hsn?: string
  hsnCode?: string
  discount?: number
  tax_rate?: number
  taxRate?: number
}

export type OrderForReverse = {
  id: string | number
  order_number?: string
  weight?: number
  length?: number
  breadth?: number
  height?: number
  integration_type: string
  courier_partner?: string | null
  pickup_details?: {
    warehouse_name?: string
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
  } | null
  buyer_name?: string
  buyer_phone?: string
  address?: string
  city?: string
  state?: string
  pincode?: string
  products?: ProductLike[]
}

export type ReverseCreatePayload = {
  original_order_id: string
  order_number: string
  payment_type: 'reverse'
  order_amount: number
  order_date: string
  package_length?: number
  package_breadth?: number
  package_height?: number
  shipping_charges: number
  prepaid_amount: number
  is_rto_different: 'no'
  discount: number
  integration_type: string
  transaction_fee: number
  gift_wrap: number
  pickup_location_id?: string
  request_auto_pickup?: 'Yes' | 'No'
  consignee: {
    name: string
    address: string
    city: string
    state: string
    pincode: string
    email: string
    phone: string
  }
  pickup: {
    warehouse_name: string
    address: string
    name: string
    phone: string
    city: string
    state: string
    pincode: string
  }
  rto?: {
    warehouse_name: string
    address: string
    name: string
    phone: string
    city: string
    state: string
    pincode: string
  }
  order_items: {
    name: string
    sku: string
    qty: number
    price: number
    hsn: string
    discount: number
    tax_rate: number
  }[]
}

interface ReverseModalProps {
  open: boolean
  onClose: () => void
  order: OrderForReverse | null
  onConfirm: (payload: ReverseCreatePayload) => void
  confirming?: boolean
}

const money = (value: number) => `Rs. ${Number(value || 0).toFixed(2)}`

const extractErrorMessage = (error: unknown, fallback: string) => {
  const err = error as { response?: { data?: { message?: string } }; message?: string }
  return err?.response?.data?.message || err?.message || fallback
}

export default function ReverseModal({
  open,
  onClose,
  order,
  onConfirm,
  confirming = false,
}: ReverseModalProps) {
  const [rate, setRate] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [wallet, setWallet] = useState<number>(0)
  const [eddDays, setEddDays] = useState<number | null>(null)
  const [isOda, setIsOda] = useState<boolean>(false)

  const provider = String(order?.integration_type || '').trim().toLowerCase()
  const isProviderSupported = !provider || SUPPORTED_REVERSE_PROVIDERS.has(provider)
  const gstAmount = useMemo(() => Number(((rate * GST_PERCENT) / 100).toFixed(2)), [rate])
  const estimatedWalletDebit = useMemo(
    () => Number((rate + gstAmount).toFixed(2)),
    [gstAmount, rate],
  )
  const hasInsufficientBalance = estimatedWalletDebit > 0 && estimatedWalletDebit > wallet

  useEffect(() => {
    const orderId = order?.id ? String(order.id) : ''
    if (!open || !orderId) {
      setRate(0)
      setError(null)
      setEddDays(null)
      setIsOda(false)
      return
    }

    ;(async () => {
      try {
        setLoading(true)
        setError(null)

        if (!isProviderSupported) {
          throw new Error('Reverse pickup is available only for Delhivery, Shadowfax, Xpressbees, Ekart, and Amazon.')
        }

        const [quoteRes, walletRes] = await Promise.all([
          quoteReverse({ orderId }),
          fetchWalletBalance(),
        ])
        setRate(Number(quoteRes?.quote?.rate || 0))
        setEddDays(quoteRes?.quote?.eddDays ?? null)
        setIsOda(Boolean(quoteRes?.quote?.oda))
        setWallet(Number(walletRes?.data?.balance || 0))
      } catch (e: unknown) {
        setError(extractErrorMessage(e, 'Failed to get reverse pickup quote'))
      } finally {
        setLoading(false)
      }
    })()
  }, [isProviderSupported, open, order?.id])

  const confirm = () => {
    if (!order || rate <= 0 || hasInsufficientBalance) return

    const merchantAddress = order.pickup_details || {}
    const merchantName =
      merchantAddress.name || merchantAddress.warehouse_name || 'Return Warehouse'
    const orderId = String(order.id)

    const payload: ReverseCreatePayload = {
      original_order_id: orderId,
      order_number: `${order.order_number || orderId}-R`,
      payment_type: 'reverse',
      order_amount: 0,
      order_date: new Date().toISOString(),
      package_length: Number(order?.length || 0),
      package_breadth: Number(order?.breadth || 0),
      package_height: Number(order?.height || 0),
      shipping_charges: rate,
      prepaid_amount: 0,
      is_rto_different: 'no',
      discount: 0,
      integration_type: order.integration_type,
      transaction_fee: 0,
      gift_wrap: 0,
      request_auto_pickup: 'Yes',
      consignee: {
        name: order.buyer_name || 'Customer',
        address: order.address || '',
        city: order.city || '',
        state: order.state || '',
        pincode: order.pincode || '',
        email: '',
        phone: order.buyer_phone || '',
      },
      pickup: {
        warehouse_name: merchantAddress.warehouse_name || merchantName,
        address: merchantAddress.address || '',
        name: merchantName,
        phone: merchantAddress.phone || '',
        city: merchantAddress.city || '',
        state: merchantAddress.state || '',
        pincode: merchantAddress.pincode || '',
      },
      rto: {
        warehouse_name: merchantAddress.warehouse_name || merchantName,
        address: merchantAddress.address || '',
        name: merchantName,
        phone: merchantAddress.phone || '',
        city: merchantAddress.city || '',
        state: merchantAddress.state || '',
        pincode: merchantAddress.pincode || '',
      },
      order_items: (Array.isArray(order.products) ? order.products : []).map(
        (p): ReverseCreatePayload['order_items'][number] => ({
          name: p?.name || p?.productName || 'Item',
          sku: p?.sku || 'NA',
          qty: Number(p?.qty ?? p?.quantity ?? 1),
          price: Number(p?.price ?? 0),
          hsn: p?.hsn || p?.hsnCode || '',
          discount: Number(p?.discount ?? 0),
          tax_rate: Number(p?.tax_rate ?? p?.taxRate ?? 0),
        }),
      ),
    }

    onConfirm(payload)
  }

  return (
    <Dialog open={open} onClose={confirming ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Create Reverse Pickup</DialogTitle>
      {loading && <LinearProgress />}
      <DialogContent>
        <Stack spacing={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            The courier will pick up from the customer and return the shipment to your pickup
            address.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Pickup from
              </Typography>
              <Typography fontWeight={700}>{order?.buyer_name || 'Customer'}</Typography>
              <Typography variant="body2" color="text.secondary">
                {[order?.city, order?.state, order?.pincode].filter(Boolean).join(', ') || '-'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Return to
              </Typography>
              <Typography fontWeight={700}>
                {order?.pickup_details?.warehouse_name || order?.pickup_details?.name || 'Warehouse'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {[order?.pickup_details?.city, order?.pickup_details?.state, order?.pickup_details?.pincode]
                  .filter(Boolean)
                  .join(', ') || '-'}
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Stack spacing={0.75}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Reverse freight
              </Typography>
              <Typography fontWeight={700}>{money(rate)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                GST ({GST_PERCENT}%)
              </Typography>
              <Typography>{money(gstAmount)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Estimated wallet debit
              </Typography>
              <Typography fontWeight={800}>{money(estimatedWalletDebit)}</Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Wallet balance
              </Typography>
              <Typography color={hasInsufficientBalance ? 'error.main' : 'text.primary'}>
                {money(wallet)}
              </Typography>
            </Stack>
            {eddDays !== null && (
              <Typography variant="body2" color="text.secondary">
                Estimated delivery: {eddDays} days
              </Typography>
            )}
          </Stack>

          {isOda && (
            <Alert severity="warning">
              ODA area detected. Delivery may take longer and surcharge handling can apply.
            </Alert>
          )}

          {hasInsufficientBalance && (
            <Alert severity="error">
              Insufficient wallet balance. Required {money(estimatedWalletDebit)}, available{' '}
              {money(wallet)}.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={confirming}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={confirm}
          disabled={
            loading ||
            confirming ||
            Boolean(error) ||
            rate <= 0 ||
            hasInsufficientBalance ||
            !isProviderSupported
          }
        >
          {confirming ? 'Creating...' : 'Confirm Reverse Pickup'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

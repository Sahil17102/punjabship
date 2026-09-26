import {
  Alert,
  AlertTitle,
  alpha,
  Box,
  Button,
  Chip,
  ClickAwayListener,
  CircularProgress,
  Divider,
  Fade,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Popper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { saveAs } from 'file-saver'
import moment from 'moment'
import Papa from 'papaparse'
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import {
  MdAdd,
  MdAssignment,
  MdCancel,
  MdContentCopy,
  MdDownload,
  MdKeyboardReturn,
  MdLocalOffer,
  MdLocalShipping,
  MdMoreVert,
  MdOutlineHelpCenter,
  MdReceipt,
  MdReplay,
  MdSync,
  MdVisibility,
} from 'react-icons/md'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'
import {
  downloadBulkOrderDocumentsZip,
  fetchAllOrders,
  fetchOrdersForCsvExport,
  generateManifestService,
} from '../../api/order.service'
import { fetchTracking } from '../../api/tracking.service'
import ShipmentTrackingDialog from './ShipmentTrackingDialog'
import {
  useAllOrders,
  useCancelShipment,
  useCreateReverseShipment,
  useRegenerateOrderDocuments,
  useRetryFailedManifest,
} from '../../hooks/Orders/useOrders'
import { usePickupAddresses } from '../../hooks/Pickup/usePickupAddresses'
import { usePresignedDownloadMutation } from '../../hooks/Uploads/usePresignedDownloadUrls'
import { FilterBar, type FilterField } from '../FilterBar'
import { SupportTicketForm } from '../support/SupportTicketForm'
import StatusChip from '../UI/chip/StatusChip'
import CustomDrawer from '../UI/drawer/CustomDrawer'
import CustomSelect from '../UI/inputs/CustomSelect'
import DataTable, { type Column } from '../UI/table/DataTable'
import AWBLink from '../UI/AWBLink'
import TableSkeleton from '../UI/table/TableSkeleton'
import { toast } from '../UI/Toast'
import { statusColorMap } from './b2c/B2COrdersList'
import ShipmentStageFilter from './ShipmentStageFilter'
import {
  CLIENT_ORDER_ADDED_HEADERS,
  downloadClientOrdersCsv,
} from '../../utils/orderCsvExport'
import {
  getDefaultPickupDateInput,
  getDefaultPickupTimeInput,
} from '../../utils/pickupSchedule'
import {
  getOrderCourierDisplayName,
  getOrderSourceChipStatus,
  getOrderSourceLabel,
} from '../../utils/orderSource'
import {
  BULK_DOCUMENT_DOWNLOAD_LIMIT,
  BULK_LABEL_PDF_DOWNLOAD_LIMIT,
  downloadFile,
  getArchiveFileNameFromHeaders,
  getActionableErrorMessage,
  getB2CManifestIdentifier,
  getB2CManifestProvider,
  getDocumentReference,
  getDownloadFileName,
  isB2CManifestEligible,
  isHttpUrl,
  summarizeMessages,
  summarizeOrderNumbers,
  type DocumentType,
} from './bulkActionUtils'
import ManifestPickupScheduleDialog from './ManifestPickupScheduleDialog'
import { OrderExpandedRow } from './OrderExpandedRow'
import ReverseModal from './reverse/ReverseModal'
import SourceOrderCourierDrawer from './SourceOrderCourierDrawer'
import { getCloneOrderNavigationState } from './orderCloneUtils'

interface Order {
  id: string | number
  type?: 'b2c' | 'b2b'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

type OrdersFilters = {
  status?: string
  fromDate?: string
  toDate?: string
  search?: string
  productQuery?: string
  sortBy?: 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

type BulkFeedback = {
  severity: 'info' | 'success' | 'error' | 'warning'
  title: string
  message: string
}

type PickupSchedulePayload = {
  pickup_date: string
  pickup_time: string
  pickup_location: string
  expected_package_count: number
}

const getOrderTypeKey = (order: Order) => String(order.type || '').trim().toLowerCase()

const getOrderStatusKey = (order: Order) =>
  String(order.order_status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')

const isB2COrder = (order: Order) => getOrderTypeKey(order) === 'b2c'

const isMarketplaceSourceOrder = (order: Order) => {
  const integrationType = String(order.integration_type || '').trim().toLowerCase()
  const localOrderId = String(order.order_id || '').trim().toLowerCase()
  return (
    ['shopify', 'woocommerce'].includes(integrationType) ||
    localOrderId.startsWith('shopify_') ||
    localOrderId.startsWith('woocommerce_')
  )
}

const formatOrderDateTime = (value: unknown) =>
  value ? moment(value).format('DD MMM YYYY, hh:mm A') : '-'

const terminalB2CStatuses = new Set(['cancellation_requested', 'cancelled', 'delivered', 'rto_delivered'])
const reversePickupSupportedProviders = new Set([
  'delhivery',
  'shadowfax',
  'xpressbees',
  'ekart',
  'amazon',
])

const documentGenerationStatuses = new Set([
  'booked',
  'shipment_created',
  'pickup_initiated',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'ndr',
  'undelivered',
  'rto',
  'rto_in_transit',
  'rto_delivered',
])

const actionMenuItemSx = {
  minHeight: 38,
  px: 1.25,
  py: 0.75,
  gap: 0.75,
  color: 'text.primary',
  '&:hover': {
    bgcolor: 'rgba(232, 85, 0, 0.06)',
  },
  '&.Mui-disabled': {
    opacity: 0.48,
  },
}

const actionMenuDangerItemSx = {
  ...actionMenuItemSx,
  color: 'error.main',
  '& .MuiListItemIcon-root': {
    color: 'error.main',
  },
}

const actionMenuIconSx = {
  minWidth: 28,
  color: 'text.secondary',
  '& svg': {
    fontSize: 18,
  },
}

const parsePickupDetails = (value: unknown) => {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return {}
    }
  }
  return value as Record<string, unknown>
}

const getManifestPickupLocation = (order: Order) => {
  const details = parsePickupDetails(order.pickup_details)
  return String(
    details?.warehouse_name ||
      order.pickup_location ||
      order.pickup_location_name ||
      order.pickup_location_id ||
      '',
  ).trim()
}

const getManifestGroupKey = (order: Order) => {
  const providerKey = getB2CManifestProvider(order)
  if (providerKey !== 'delhivery') return providerKey

  return `${providerKey}:${getManifestPickupLocation(order).toLowerCase()}`
}

const getProviderFromManifestGroupKey = (groupKey: string) => groupKey.split(':')[0] || groupKey

const AllOrders = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedOrderIds, setSelectedOrderIds] = useState<Array<Order['id']>>([])
  const [downloadingDocumentType, setDownloadingDocumentType] = useState<DocumentType | null>(null)
  const [bulkManifesting, setBulkManifesting] = useState(false)
  const [manifestingOrderId, setManifestingOrderId] = useState<string | null>(null)
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null)
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null)
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const [trackingAwb, setTrackingAwb] = useState<string | null>(null)
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(null)
  const [activeActionOrderId, setActiveActionOrderId] = useState<Order['id'] | null>(null)
  const [detailsOrder, setDetailsOrder] = useState<Order | null>(null)
  const [documentGenerationRef, setDocumentGenerationRef] = useState<string | null>(null)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [bulkFeedback, setBulkFeedback] = useState<BulkFeedback | null>(null)
  const [pickupDialogOpen, setPickupDialogOpen] = useState(false)
  const [pickupDialogTitle, setPickupDialogTitle] = useState('Confirm pickup schedule')
  const [pickupDialogDescription, setPickupDialogDescription] = useState('')
  const [pickupDialogDate, setPickupDialogDate] = useState(getDefaultPickupDateInput())
  const [pickupDialogTime, setPickupDialogTime] = useState(getDefaultPickupTimeInput())
  const [pickupDialogLocation, setPickupDialogLocation] = useState('')
  const [pickupDialogPackageCount, setPickupDialogPackageCount] = useState(1)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [createOrderAnchorEl, setCreateOrderAnchorEl] = useState<null | HTMLElement>(null)
  const [selectedTab, setSelectedTab] = useState<string>('')
  const [ticketDialogOpen, setTicketDialogOpen] = useState(false)
  const [courierSelectionOrder, setCourierSelectionOrder] = useState<Order | null>(null)
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null)
  const [downloadingByWarehouse, setDownloadingByWarehouse] = useState(false)
  const [warehousePopoverAnchor, setWarehousePopoverAnchor] = useState<HTMLElement | null>(null)
  const [warehouseFromDate, setWarehouseFromDate] = useState('')
  const [warehouseToDate, setWarehouseToDate] = useState(getDefaultPickupDateInput())
  const downloadAnchorRef = useRef<HTMLButtonElement>(null)
  const createOrderButtonRef = useRef<HTMLButtonElement>(null)
  const warehouseSelectorRef = useRef<HTMLDivElement>(null)

  const pickupDialogResolverRef = useRef<((value: PickupSchedulePayload | null) => void) | null>(
    null,
  )
  const [filters, setFilters] = useState<OrdersFilters>({
    status: undefined,
    fromDate: undefined,
    toDate: undefined,
    search: undefined,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const effectiveFilters: OrdersFilters = {
    ...filters,
    status: selectedTab || undefined,
    sortBy: filters.sortBy || 'created_at',
    sortOrder: filters.sortOrder || 'desc',
  }
  const queryClient = useQueryClient()
  const { mutateAsync: presignDownloads } = usePresignedDownloadMutation()
  const { mutateAsync: retryFailedManifest } = useRetryFailedManifest()
  const { mutateAsync: regenerateDocuments, isPending: regeneratingDocuments } =
    useRegenerateOrderDocuments()
  const { mutateAsync: cancelShipment } = useCancelShipment()
  const { mutate: createReverse } = useCreateReverseShipment()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reverseOrder, setReverseOrder] = useState<any | null>(null)

  const { data, isLoading, isError } = useAllOrders({
    page,
    limit: rowsPerPage,
    ...effectiveFilters,
  })

  const { data: warehouseData } = usePickupAddresses({ page: 1, limit: 100 })

  const clearSelection = () => {
    setSelectedOrderIds([])
  }

  const handleActionMenuOpen = (event: MouseEvent<HTMLElement>, orderId: Order['id']) => {
    event.stopPropagation()
    setActionMenuAnchor(event.currentTarget)
    setActiveActionOrderId(orderId)
  }

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null)
    setActiveActionOrderId(null)
  }

  const runActionFromMenu = (
    event: MouseEvent<HTMLElement>,
    action: () => void | Promise<void>,
  ) => {
    event.stopPropagation()
    handleActionMenuClose()
    void action()
  }

  const handleViewDetails = (order: Order) => {
    setDetailsOrder(order)
  }

  const handleTrackShipment = (order: Order) => {
    const awb = String(order.awb_number || '').trim()
    if (!awb) {
      toast.open({ message: 'AWB number is not available for this order.', severity: 'info' })
      return
    }

    setTrackingAwb(awb)
  }

  const requestDelhiveryPickupSchedule = (ordersForPickup: Order[], label: string) =>
    new Promise<PickupSchedulePayload | null>((resolve) => {
      const details = parsePickupDetails(ordersForPickup[0]?.pickup_details)
      const initialDate =
        typeof details?.pickup_date === 'string' && details.pickup_date.trim()
          ? details.pickup_date.slice(0, 10)
          : getDefaultPickupDateInput()
      const initialTimeRaw =
        typeof details?.pickup_time === 'string' && details.pickup_time.trim()
          ? details.pickup_time.trim()
          : getDefaultPickupTimeInput()
      const initialPickupLocation = getManifestPickupLocation(ordersForPickup[0])

      pickupDialogResolverRef.current = resolve
      setPickupDialogTitle('Confirm Pickup Before Manifest')
      setPickupDialogDescription(label)
      setPickupDialogDate(initialDate)
      setPickupDialogTime(initialTimeRaw.slice(0, 5))
      setPickupDialogLocation(initialPickupLocation)
      setPickupDialogPackageCount(Math.max(1, ordersForPickup.length))
      setPickupDialogOpen(true)
    })

  const closePickupDialog = (value: PickupSchedulePayload | null) => {
    setPickupDialogOpen(false)
    pickupDialogResolverRef.current?.(value)
    pickupDialogResolverRef.current = null
  }

  const handleSyncLiveTracking = async (order: Order) => {
    if (!order.awb_number) {
      toast.open({ message: 'AWB is required to sync live status.', severity: 'error' })
      return
    }

    const orderId = String(order.id)
    setTrackingOrderId(orderId)
    try {
      const tracking = await fetchTracking({ awb: order.awb_number })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])
      toast.open({
        message: `Live status synced: ${tracking.status || 'updated'}`,
        severity: 'success',
      })
    } catch (error) {
      const message = getActionableErrorMessage(error, 'Unable to sync live tracking status.')
      toast.open({ message, severity: 'error' })
    } finally {
      setTrackingOrderId((current) => (current === orderId ? null : current))
    }
  }

  const isCancellable = (order: Order) => {
    if (!isB2COrder(order)) return false

    const status = getOrderStatusKey(order)
    return !terminalB2CStatuses.has(status)
  }

  const canManifestOrder = (order: Order) => {
    if (!isB2COrder(order)) return false
    if (isMarketplaceSourceOrder(order) && !String(order.awb_number || '').trim()) return false
    if (!getB2CManifestIdentifier(order)) return false

    const status = getOrderStatusKey(order)
    if (terminalB2CStatuses.has(status)) return false

    return isB2CManifestEligible(order)
  }

  const canSelectCourierForOrder = (order: Order) => {
    if (!isB2COrder(order)) return false
    if (!isMarketplaceSourceOrder(order)) return false
    if (String(order.awb_number || '').trim()) return false

    const status = getOrderStatusKey(order)
    return !terminalB2CStatuses.has(status)
  }

  const getProviderKey = (order: Order) => {
    const providerText = String(`${order.integration_type || ''} ${order.courier_partner || ''}`)
      .trim()
      .toLowerCase()

    if (providerText.includes('delhivery')) return 'delhivery'
    if (providerText.includes('ekart')) return 'ekart'
    if (providerText.includes('xpressbees') || providerText.includes('xpress bees')) {
      return 'xpressbees'
    }
    if (providerText.includes('shadowfax')) return 'shadowfax'
    if (providerText.includes('amazon')) return 'amazon'

    return providerText
  }

  const hasDocument = (order: Order, type: DocumentType) => {
    const { key, url } = getDocumentReference(order, type)
    return Boolean(key || url)
  }

  const isDocumentGenerationReady = (order: Order) => {
    if (!isB2COrder(order)) return false

    const normalizedStatus = getOrderStatusKey(order)
    return (
      Boolean(String(order.manifest || order.awb_number || '').trim()) ||
      documentGenerationStatuses.has(normalizedStatus)
    )
  }

  const handleSingleManifest = async (order: Order) => {
    const manifestRef = getB2CManifestIdentifier(order)
    if (!manifestRef || !canManifestOrder(order)) {
      const message = `Manifest cannot be started for ${order.order_number || order.id} yet.`
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest unavailable',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    const orderId = String(order.id)
    setManifestingOrderId(orderId)
    try {
      const providerKey = getB2CManifestProvider(order)
      const pickupSchedule =
        providerKey === 'delhivery'
          ? await requestDelhiveryPickupSchedule(
              [order],
              `Set the pickup date and time for ${order.order_number || order.id} before generating the manifest.`,
            )
          : null

      if (providerKey === 'delhivery' && !pickupSchedule) {
        setBulkFeedback({
          severity: 'info',
          title: 'Manifest cancelled',
          message: `Manifest was cancelled for ${order.order_number || order.id}.`,
        })
        return
      }

      setBulkFeedback({
        severity: 'info',
        title: 'Manifest in progress',
        message: `Processing ${order.order_number || order.id}.`,
      })

      const response = await generateManifestService({
        awbs: [manifestRef],
        type: 'b2c',
        ...(pickupSchedule || {}),
      })

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])

      const successMessage = `Manifest completed for ${order.order_number || order.id}.`
      const warningSummary = summarizeMessages(response.warnings || [])
      const finalMessage = warningSummary ? `${successMessage} ${warningSummary}` : successMessage

      setBulkFeedback({
        severity: warningSummary ? 'warning' : 'success',
        title: warningSummary ? 'Manifest completed with warnings' : 'Manifest completed',
        message: finalMessage,
      })
      toast.open({ message: finalMessage, severity: warningSummary ? 'info' : 'success' })
    } catch (error) {
      if (!isEmbeddedShopifyContext()) {
        console.error('Manifest failed for order:', order.order_number || order.id, error)
      }
      const errorMessage = getActionableErrorMessage(
        error,
        `Manifest failed for ${order.order_number || order.id}.`,
      )
      const message = `${order.order_number || order.id}: ${errorMessage}`
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest failed',
        message,
      })
      toast.open({ message, severity: 'error' })
    } finally {
      setManifestingOrderId((current) => (current === orderId ? null : current))
    }
  }

  const handleRetryManifest = async (order: Order) => {
    if (!isB2COrder(order) || !order.id) return

    const orderId = String(order.id)
    setRetryingOrderId(orderId)
    try {
      await retryFailedManifest(orderId)
    } finally {
      setRetryingOrderId((current) => (current === orderId ? null : current))
    }
  }

  const handleGenerateOrderDocument = async (order: Order, type: 'label' | 'invoice') => {
    if (!isB2COrder(order)) {
      toast.open({ message: 'Document generation is available for B2C shipments only.', severity: 'info' })
      return
    }

    const orderId = String(order.id || '').trim()
    if (!orderId) {
      toast.open({ message: 'Order identifier is not available.', severity: 'error' })
      return
    }

    if (!isDocumentGenerationReady(order)) {
      toast.open({
        message: 'Generate the manifest before creating label or invoice documents.',
        severity: 'info',
      })
      return
    }

    const documentRef = `${order.id}-${type}`
    try {
      setDocumentGenerationRef(documentRef)
      await regenerateDocuments({
        orderId,
        regenerateLabel: type === 'label',
        regenerateInvoice: type === 'invoice',
      })
    } catch (error) {
      if (!isEmbeddedShopifyContext()) {
        console.error(`Failed to generate ${type} for order:`, order.order_number || order.id, error)
      }
      return
    } finally {
      setDocumentGenerationRef((current) => (current === documentRef ? null : current))
    }
  }

  const handleCancelOrder = async (order: Order) => {
    if (!isCancellable(order)) {
      const message = `Order ${order.order_number || order.id} cannot be cancelled right now.`
      setBulkFeedback({
        severity: 'error',
        title: 'Cancel unavailable',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    if (!window.confirm(`Cancel order ${order.order_number || order.id}?`)) {
      return
    }

    const orderId = String(order.id)
    setCancellingOrderId(orderId)
    try {
      await cancelShipment(orderId)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
        queryClient.invalidateQueries({ queryKey: ['orders'] }),
      ])
    } finally {
      setCancellingOrderId((current) => (current === orderId ? null : current))
    }
  }

  useEffect(() => {
    const status = searchParams.get('status') || undefined
    if (status && selectedTab !== status) {
      setSelectedTab(status)
      setPage(1)
      clearSelection()
      setBulkFeedback(null)
    }
  }, [searchParams, selectedTab])

  if (isError)
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
          px: 3,
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        }}
      >
        <Typography
          color="error"
          textAlign="center"
          fontSize="16px"
          fontWeight={600}
          sx={{ color: '#E74C3C' }}
        >
          Failed to fetch orders
        </Typography>
        <Typography textAlign="center" fontSize="14px" sx={{ color: '#6B7280', mt: 1 }}>
          Please try refreshing the page
        </Typography>
      </Box>
    )

  const orders: Order[] = data?.orders ?? []
  const totalCount = data?.totalCount ?? 0
  const selectedOrders: Order[] = orders.filter((order) => selectedOrderIds.includes(order.id))
  const manifestValidationMessage =
    selectedOrders.length === 0
      ? 'Select orders to start a bulk action.'
      : selectedOrders.some((order) => !canManifestOrder(order))
          ? 'Some selected orders are not ready for manifest yet.'
          : ''

  const handleBulkManifest = async () => {
    if (!selectedOrders.length) {
      const message = 'Select eligible orders to manifest.'
      setBulkFeedback({
        severity: 'error',
        title: 'No orders selected',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    if (manifestValidationMessage) {
      setBulkFeedback({
        severity: 'error',
        title: 'Manifest unavailable',
        message: manifestValidationMessage,
      })
      toast.open({ message: manifestValidationMessage, severity: 'error' })
      return
    }

    setBulkManifesting(true)
    setBulkFeedback({
      severity: 'info',
      title: 'Manifest in progress',
      message: `Processing ${selectedOrders.length} selected order(s).`,
    })

    try {
      const b2cManifestGroups = selectedOrders.reduce<Record<string, Order[]>>((groups, order) => {
        if (!isB2COrder(order)) return groups

        const manifestIdentifier = getB2CManifestIdentifier(order)
        if (!manifestIdentifier) return groups

        const groupKey = getManifestGroupKey(order)
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(order)
        return groups
      }, {})

      const failedOrders: Order[] = []
      const failureReasons: string[] = []
      const warningMessages: string[] = []
      let successCount = 0

      for (const [groupKey, providerOrders] of Object.entries(b2cManifestGroups)) {
        const providerKey = getProviderFromManifestGroupKey(groupKey)
        const identifiers = providerOrders
          .map((order) => getB2CManifestIdentifier(order))
          .filter((value): value is string => Boolean(value))

        if (!identifiers.length) continue

        try {
          const pickupSchedule =
            providerKey === 'delhivery'
              ? await requestDelhiveryPickupSchedule(
                  providerOrders,
                  `Set the pickup date and time for ${providerOrders.length} order(s) before generating the manifest.`,
                )
              : null

          if (providerKey === 'delhivery' && !pickupSchedule) {
            failedOrders.push(...providerOrders)
            failureReasons.push(`${providerKey}: Manifest cancelled before pickup confirmation.`)
            continue
          }

          const response = await generateManifestService({
            awbs: identifiers,
            type: 'b2c',
            ...(pickupSchedule || {}),
          })
          successCount += providerOrders.length
          if (response.warnings?.length) {
            warningMessages.push(...response.warnings)
          }
        } catch (error) {
          if (!isEmbeddedShopifyContext()) {
            console.error('Bulk manifest provider batch failed:', error)
          }
          failedOrders.push(...providerOrders)
          failureReasons.push(
            `${providerKey}: ${getActionableErrorMessage(
              error,
              'Manifest could not be completed for this batch.',
            )}`,
          )
        }
      }

      if (successCount > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] }),
          queryClient.invalidateQueries({ queryKey: ['orders'] }),
        ])
      }

      if (failedOrders.length > 0) {
        const failedOrderIds = failedOrders.map((order) => order.id)
        const failedOrderNumbers = summarizeOrderNumbers(
          failedOrders.map((order) => order.order_number || order.id),
        )
        const message =
          successCount > 0
            ? `Completed ${successCount} order(s). Failed for ${failedOrders.length}: ${failedOrderNumbers}. ${failureReasons.join(' ')}`
            : `Failed for ${failedOrders.length} order(s): ${failedOrderNumbers}. ${failureReasons.join(' ')}`
        const warningSummary = summarizeMessages(warningMessages)
        const finalMessage = warningSummary ? `${message} ${warningSummary}` : message

        setSelectedOrderIds(failedOrderIds)
        setBulkFeedback({
          severity: successCount > 0 ? 'warning' : 'error',
          title: successCount > 0 ? 'Manifest partially completed' : 'Manifest failed',
          message: finalMessage,
        })
        toast.open({ message: finalMessage, severity: 'error' })
        return
      }

      const successMessage = `Manifest completed for ${successCount} order(s).`
      const warningSummary = summarizeMessages(warningMessages)
      if (warningSummary) {
        const warningMessage = `${successMessage} ${warningSummary}`
        setBulkFeedback({
          severity: 'warning',
          title: 'Manifest completed with warnings',
          message: warningMessage,
        })
        toast.open({ message: warningMessage, severity: 'info' })
        clearSelection()
        return
      }
      setBulkFeedback({
        severity: 'success',
        title: 'Manifest completed',
        message: successMessage,
      })
      toast.open({ message: successMessage, severity: 'success' })
      clearSelection()
    } finally {
      setBulkManifesting(false)
    }
  }

  const handleBulkDownload = async (type: DocumentType) => {
    const isLabelDownload = type === 'label'
    const bulkLimit = isLabelDownload ? BULK_LABEL_PDF_DOWNLOAD_LIMIT : BULK_DOCUMENT_DOWNLOAD_LIMIT
    const downloadFormat = isLabelDownload ? 'PDF' : 'ZIP'

    if (!selectedOrders.length) {
      const message = 'Select at least one order to download documents.'
      setBulkFeedback({
        severity: 'error',
        title: 'No orders selected',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    if (selectedOrders.length > bulkLimit) {
      const message = isLabelDownload
        ? `You can download up to ${bulkLimit} labels in one PDF.`
        : `You can download up to ${bulkLimit} orders in one ZIP.`
      setBulkFeedback({
        severity: 'error',
        title: 'Download limit exceeded',
        message,
      })
      toast.open({ message, severity: 'error' })
      return
    }

    setDownloadingDocumentType(type)
    setBulkFeedback({
      severity: 'info',
      title: `Downloading ${type}s`,
      message: `Preparing 1 ${downloadFormat} for ${selectedOrders.length} selected order(s).`,
    })

    try {
      const { blob, headers } = await downloadBulkOrderDocumentsZip(
        selectedOrders.map((order) => order.id),
        type,
      )
      const archiveName = getArchiveFileNameFromHeaders(
        headers,
        `punjabship-${type}s-${new Date().toISOString().slice(0, 10)}.${isLabelDownload ? 'pdf' : 'zip'}`,
      )
      saveAs(blob, archiveName)

      const downloadedCount = Number(headers['x-punjabship-document-count'] || 0)
      const missingCount = Number(headers['x-punjabship-missing-count'] || 0)
      const deduplicatedCount = Number(headers['x-punjabship-deduplicated-count'] || 0)
      const details = [
        missingCount > 0 ? `${missingCount} selected order(s) did not have ready files.` : '',
        deduplicatedCount > 0 ? `${deduplicatedCount} duplicate document(s) were merged.` : '',
      ]
        .filter(Boolean)
        .join(' ')

      const summaryMessage =
        details.length > 0
          ? `Downloaded 1 ${downloadFormat} with ${downloadedCount} ${type} file(s). ${details}`
          : `Downloaded 1 ${downloadFormat} with ${downloadedCount} ${type} file(s).`

      setBulkFeedback({
        severity: missingCount > 0 ? 'warning' : 'success',
        title:
          missingCount > 0
            ? `${type[0].toUpperCase()}${type.slice(1)} ${downloadFormat} downloaded with warnings`
            : `${type[0].toUpperCase()}${type.slice(1)} ${downloadFormat} downloaded`,
        message: summaryMessage,
      })
      toast.open({ message: summaryMessage, severity: missingCount > 0 ? 'info' : 'success' })
    } catch (error) {
      if (!isEmbeddedShopifyContext()) console.error(`Bulk ${type} download failed:`, error)
      const message = getActionableErrorMessage(
        error,
        `Failed to download selected ${type} files. Please try again.`,
      )
      setBulkFeedback({
        severity: 'error',
        title: `${type[0].toUpperCase()}${type.slice(1)} download failed`,
        message,
      })
      toast.open({ message, severity: 'error' })
    } finally {
      setDownloadingDocumentType(null)
    }
  }

  const handleDownloadLabelsByWarehouse = async () => {
    if (!selectedWarehouse) {
      toast.open({ message: 'Please select a warehouse', severity: 'warning' })
      return
    }

    setDownloadingByWarehouse(true)
    try {
      // Fetch all orders for the selected warehouse with date range filter
      const warehouseFilters = {
        warehouse: selectedWarehouse,
        fromDate: warehouseFromDate || undefined,
        toDate: warehouseToDate || undefined,
      }

      // Fetch all pages of data for the warehouse
      let allOrders: Order[] = []
      let currentPage = 1
      let hasMore = true

      while (hasMore) {
        const response = await fetchAllOrders({
          page: currentPage,
          limit: 100,
          ...warehouseFilters,
        })
        if (response?.orders && response.orders.length > 0) {
          allOrders = [...allOrders, ...response.orders]
          if (response.orders.length < 100) {
            hasMore = false
          } else {
            currentPage += 1
          }
        } else {
          hasMore = false
        }
      }

      if (allOrders.length === 0) {
        const dateInfo =
          warehouseFromDate || warehouseToDate ? ' within the selected date range' : ''
        toast.open({
          message: `No orders found for the selected warehouse${dateInfo}`,
          severity: 'warning',
        })
        setDownloadingByWarehouse(false)
        return
      }

      if (allOrders.length > BULK_LABEL_PDF_DOWNLOAD_LIMIT) {
        toast.open({
          message: `This warehouse selection has ${allOrders.length} orders. Narrow it to ${BULK_LABEL_PDF_DOWNLOAD_LIMIT} or fewer for a single PDF download.`,
          severity: 'warning',
        })
        setDownloadingByWarehouse(false)
        return
      }

      const { blob, headers } = await downloadBulkOrderDocumentsZip(
        allOrders.map((order) => order.id),
        'label',
      )
      const archiveName = getArchiveFileNameFromHeaders(
        headers,
        `punjabship-warehouse-labels-${new Date().toISOString().slice(0, 10)}.pdf`,
      )
      saveAs(blob, archiveName)

      const downloadedCount = Number(headers['x-punjabship-document-count'] || 0)
      const missingCount = Number(headers['x-punjabship-missing-count'] || 0)
      const message =
        missingCount > 0
          ? `Downloaded 1 PDF with ${downloadedCount} label file(s). ${missingCount} order(s) did not have ready labels.`
          : `Downloaded 1 PDF with ${downloadedCount} label file(s).`
      toast.open({ message, severity: missingCount > 0 ? 'info' : 'success' })
    } catch (error) {
      if (!isEmbeddedShopifyContext()) console.error('Warehouse label download failed:', error)
      toast.open({ message: 'Failed to download labels', severity: 'error' })
    } finally {
      setDownloadingByWarehouse(false)
    }
  }

  const handleSingleDocumentDownload = async (order: Order, type: DocumentType) => {
    const reference = getDocumentReference(order, type)
    const keyValue = reference.key ? String(reference.key).trim() : ''
    const urlValue = reference.url ? String(reference.url).trim() : ''

    if (isEmbeddedShopifyContext() && order.id) {
      try {
        const { blob, headers } = await downloadBulkOrderDocumentsZip([order.id], type)
        const fileName = getArchiveFileNameFromHeaders(
          headers,
          `punjabship-${type}-${String(order.order_number || order.id)}.${type === 'label' ? 'pdf' : 'zip'}`,
        )
        saveAs(blob, fileName)
      } catch (error) {
        toast.open({
          message: getActionableErrorMessage(error, `Unable to download ${type}. Please try again.`),
          severity: 'error',
        })
      }
      return
    }

    if (keyValue) {
      try {
        const urls = await presignDownloads({ keys: [keyValue] })
        const signedUrl = Array.isArray(urls) ? urls[0] : urls
        if (!signedUrl) {
          throw new Error(`${type} is not available yet.`)
        }
        await downloadFile(signedUrl, getDownloadFileName(order, type, keyValue))
        return
      } catch (error) {
        toast.open({
          message: getActionableErrorMessage(error, `Unable to download ${type}.`),
          severity: 'error',
        })
        return
      }
    }

    if (urlValue && isHttpUrl(urlValue)) {
      window.open(urlValue, '_blank', 'noopener,noreferrer')
      return
    }

    toast.open({
      message: `${type === 'label' ? 'Label' : type === 'invoice' ? 'Invoice' : 'Manifest'} is not available yet.`,
      severity: 'error',
    })
  }

  const renderOrderActionsMenu = (row: Order) => {
    const rowId = String(row.id)
    const isManifestingRow = manifestingOrderId === rowId
    const isRetryingRow = retryingOrderId === rowId
    const isCancellingRow = cancellingOrderId === rowId
    const isTrackingRow = trackingOrderId === rowId
    const retriesRemaining = Number(row.manifest_retries_remaining ?? 0)
    const providerKey = getProviderKey(row)
    const reversePickupSupported = reversePickupSupportedProviders.has(providerKey)
    const hasManifestWarning =
      Boolean(String(row.manifest || '').trim()) && Boolean(String(row.manifest_error || '').trim())
    const canRetryManifest = row.can_retry_manifest === true
    const hasPickupFailure =
      providerKey === 'delhivery' &&
      canRetryManifest &&
      (String(row.pickup_status || '').toLowerCase() === 'failed' ||
        String(row.order_status || '').toLowerCase() === 'shipment_created')
    const canRetryRowManifest =
      isB2COrder(row) &&
      canRetryManifest &&
      (getOrderStatusKey(row) === 'manifest_failed' || hasManifestWarning || hasPickupFailure)
    const canTrackShipment = Boolean(String(row.awb_number || '').trim())
    const isCancelled = getOrderStatusKey(row) === 'cancelled'
    const isDocumentReady = isDocumentGenerationReady(row)
    const isLabelGenerating = documentGenerationRef === `${row.id}-label`
    const isInvoiceGenerating = documentGenerationRef === `${row.id}-invoice`
    const isMenuOpen = activeActionOrderId === row.id && Boolean(actionMenuAnchor)
    const hasAnyDocument =
      hasDocument(row, 'label') || hasDocument(row, 'invoice') || hasDocument(row, 'manifest')
    const showB2CActions = isB2COrder(row)

    const renderActionItem = ({
      key,
      icon,
      label,
      onClick,
      disabled = false,
      loading = false,
      danger = false,
    }: {
      key: string
      icon: ReactNode
      label: string
      onClick: () => void | Promise<void>
      disabled?: boolean
      loading?: boolean
      danger?: boolean
    }) => (
      <MenuItem
        key={key}
        disabled={disabled || loading}
        onClick={(event) => runActionFromMenu(event, onClick)}
        sx={danger ? actionMenuDangerItemSx : actionMenuItemSx}
      >
        <ListItemIcon sx={danger ? { ...actionMenuIconSx, color: 'error.main' } : actionMenuIconSx}>
          {loading ? <CircularProgress size={16} /> : icon}
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{ fontSize: 13, fontWeight: 700 }}
        />
      </MenuItem>
    )

    return (
      <>
        <Button
          size="small"
          variant={isMenuOpen ? 'contained' : 'outlined'}
          endIcon={<MdMoreVert size={16} />}
          onClick={(event) => handleActionMenuOpen(event, row.id)}
          aria-haspopup="menu"
          aria-expanded={isMenuOpen ? 'true' : undefined}
          sx={{
            minHeight: 32,
            px: 1.15,
            borderRadius: '8px',
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            borderColor: 'rgba(232, 85, 0, 0.32)',
            color: isMenuOpen ? '#FFFFFF' : '#0877C9',
            bgcolor: isMenuOpen ? '#0877C9' : '#FFFFFF',
            boxShadow: isMenuOpen ? '0 10px 20px rgba(232, 85, 0, 0.16)' : 'none',
            '&:hover': {
              borderColor: '#0877C9',
              bgcolor: isMenuOpen ? '#D34B00' : 'rgba(232, 85, 0, 0.06)',
            },
          }}
        >
          Actions
        </Button>
        <Menu
          anchorEl={actionMenuAnchor}
          open={isMenuOpen}
          onClose={handleActionMenuClose}
          onClick={(event) => event.stopPropagation()}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{
            paper: {
              sx: {
                mt: 0.75,
                minWidth: 260,
                borderRadius: '10px',
                border: '1px solid rgba(17, 24, 39, 0.10)',
                background: 'rgba(255, 255, 255, 0.98)',
                boxShadow: '0 18px 38px rgba(17, 24, 39, 0.16)',
                overflow: 'hidden',
              },
            },
            list: {
              dense: true,
              sx: { py: 0.45 },
            },
          }}
        >
          {renderActionItem({
            key: 'view-details',
            icon: <MdVisibility />,
            label: 'View Details',
            onClick: () => handleViewDetails(row),
          })}
          {showB2CActions &&
            renderActionItem({
              key: 'clone-order',
              icon: <MdContentCopy />,
              label: 'Clone Order',
              onClick: () => handleCloneOrder(row, 'clone'),
              disabled: isManifestingRow || isRetryingRow || isCancellingRow,
            })}
          {showB2CActions &&
            isCancelled &&
            renderActionItem({
              key: 'reship-order',
              icon: <MdLocalShipping />,
              label: 'Reship Order',
              onClick: () => handleCloneOrder(row, 'reship'),
              disabled: isManifestingRow || isRetryingRow || isCancellingRow,
            })}
          {canSelectCourierForOrder(row) &&
            renderActionItem({
              key: 'select-courier',
              icon: <MdLocalShipping />,
              label: 'Select Courier',
              onClick: () => setCourierSelectionOrder(row),
              disabled: isTrackingRow || isManifestingRow || isRetryingRow || isCancellingRow,
            })}

          {showB2CActions && <Divider sx={{ my: 0.35 }} />}
          {showB2CActions &&
            renderActionItem({
              key: 'generate-manifest',
              icon: <MdAssignment />,
              label: isManifestingRow ? 'Generating Manifest' : 'Generate Manifest',
              onClick: () => handleSingleManifest(row),
              disabled:
                isCancelled ||
                !canManifestOrder(row) ||
                bulkManifesting ||
                isManifestingRow ||
                isRetryingRow ||
                isCancellingRow,
              loading: isManifestingRow,
            })}
          {showB2CActions &&
            renderActionItem({
              key: 'generate-label',
              icon: <MdLocalOffer />,
              label: isLabelGenerating
                ? 'Generating Label'
                : hasDocument(row, 'label')
                  ? 'Regenerate Label'
                  : 'Generate Label',
              onClick: () => handleGenerateOrderDocument(row, 'label'),
              disabled:
                isCancelled ||
                !isDocumentReady ||
                regeneratingDocuments ||
                Boolean(documentGenerationRef),
              loading: isLabelGenerating,
            })}
          {showB2CActions &&
            renderActionItem({
              key: 'generate-invoice',
              icon: <MdReceipt />,
              label: isInvoiceGenerating
                ? 'Generating Invoice'
                : hasDocument(row, 'invoice')
                  ? 'Regenerate Invoice'
                  : 'Generate Invoice',
              onClick: () => handleGenerateOrderDocument(row, 'invoice'),
              disabled:
                isCancelled ||
                !isDocumentReady ||
                regeneratingDocuments ||
                Boolean(documentGenerationRef),
              loading: isInvoiceGenerating,
            })}

          {hasAnyDocument && <Divider sx={{ my: 0.35 }} />}
          {hasDocument(row, 'label') &&
            renderActionItem({
              key: 'download-label',
              icon: <MdDownload />,
              label: 'Download Label',
              onClick: () => handleSingleDocumentDownload(row, 'label'),
              disabled: isManifestingRow || isRetryingRow || isCancellingRow,
            })}
          {hasDocument(row, 'invoice') &&
            renderActionItem({
              key: 'download-invoice',
              icon: <MdDownload />,
              label: 'Download Invoice',
              onClick: () => handleSingleDocumentDownload(row, 'invoice'),
              disabled: isManifestingRow || isRetryingRow || isCancellingRow,
            })}
          {hasDocument(row, 'manifest') &&
            renderActionItem({
              key: 'download-manifest',
              icon: <MdDownload />,
              label: 'Download Manifest',
              onClick: () => handleSingleDocumentDownload(row, 'manifest'),
              disabled: isManifestingRow || isRetryingRow || isCancellingRow,
            })}

          {(canRetryRowManifest || getOrderStatusKey(row) === 'delivered' || isCancellable(row)) && (
            <Divider sx={{ my: 0.35 }} />
          )}
          {canRetryRowManifest &&
            renderActionItem({
              key: 'retry-manifest',
              icon: <MdReplay />,
              label: hasPickupFailure
                ? `Retry Pickup (${retriesRemaining} left)`
                : hasManifestWarning && providerKey !== 'delhivery'
                  ? `Retry Invoice (${retriesRemaining} left)`
                  : `Retry Manifest (${retriesRemaining} left)`,
              onClick: () => handleRetryManifest(row),
              disabled: isRetryingRow || isManifestingRow || isCancellingRow,
              loading: isRetryingRow,
            })}
          {showB2CActions &&
            getOrderStatusKey(row) === 'delivered' &&
            renderActionItem({
              key: 'reverse',
              icon: <MdKeyboardReturn />,
              label: reversePickupSupported ? 'Create Reverse Pickup' : 'Reverse Pickup Unavailable',
              onClick: () => setReverseOrder(row),
              disabled: !reversePickupSupported,
            })}
          {isCancellable(row) &&
            renderActionItem({
              key: 'cancel',
              icon: <MdCancel />,
              label: isCancellingRow ? 'Cancelling Shipment' : 'Cancel Shipment',
              onClick: () => handleCancelOrder(row),
              disabled: isCancellingRow || isManifestingRow || isRetryingRow,
              loading: isCancellingRow,
              danger: true,
            })}

          <Divider sx={{ my: 0.35 }} />
          {renderActionItem({
            key: 'track-shipment',
            icon: <MdLocalShipping />,
            label: 'Track Shipment',
            onClick: () => handleTrackShipment(row),
            disabled: !canTrackShipment,
          })}
          {renderActionItem({
            key: 'sync-live-status',
            icon: <MdSync />,
            label: isTrackingRow ? 'Syncing Live Status' : 'Sync Live Status',
            onClick: () => handleSyncLiveTracking(row),
            disabled:
              !canTrackShipment ||
              isTrackingRow ||
              isManifestingRow ||
              isRetryingRow ||
              isCancellingRow,
            loading: isTrackingRow,
          })}
        </Menu>
      </>
    )
  }

  const columns: Column<Order>[] = [
    {
      id: 'order_number',
      label: 'Order #',
      minWidth: 150,
      showCellTooltip: false,
      render: (value) => (
        <Typography
          sx={{
            color: '#111111',
            fontSize: '0.85rem',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          {String(value || '-')}
        </Typography>
      ),
    },
    {
      id: 'source',
      label: 'Source',
      minWidth: 90,
      render: (_value, row) => (
        <StatusChip
          label={getOrderSourceLabel(row)}
          status={getOrderSourceChipStatus(row)}
        />
      ),
    },
    { id: 'type', label: 'Type', minWidth: 80 },
    {
      id: 'awb_number',
      label: 'AWB',
      render: (value) => <AWBLink awb={String(value || '')} compact />,
    },
    { id: 'buyer_name', label: 'Buyer Name' },
    { id: 'order_amount', label: 'Amount' },
    {
      id: 'courier_partner',
      label: 'Courier',
      minWidth: 125,
      render: (_value, row) =>
        getOrderCourierDisplayName({
          ...row,
          courier_partner: row.courier_partner,
        }) || '—',
    },
    {
      label: 'Status',
      id: 'order_status',
      minWidth: 120,
      showCellTooltip: false,
      render: (v) => {
        return (
          <Stack
            direction="row"
            alignItems="center"
            sx={{
              minWidth: 0,
              '@keyframes spin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
              },
            }}
          >
            <StatusChip label={v} status={statusColorMap[v] || 'info'} />
          </Stack>
        )
      },
    },
    {
      label: 'Created At',
      id: 'created_at',
      minWidth: 125,
      render: (_value, row) => formatOrderDateTime(row.created_at || row.createdAt),
    },
    {
      label: 'Updated At',
      id: 'updated_at',
      minWidth: 125,
      render: (_value, row) =>
        formatOrderDateTime(row.updated_at || row.updatedAt || row.last_tracking_update_at),
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 120,
      showCellTooltip: false,
      stickyRight: true,
      render: (_value, row) => renderOrderActionsMenu(row),
    },
  ]

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'Order # / Buyer Name',
    },
    {
      name: 'productQuery',
      label: 'Product / SKU',
      type: 'text',
      placeholder: 'Search by product or SKU',
    },
    {
      name: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
    },
    {
      name: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'YYYY-MM-DD',
    },
  ]

  const handleTabChange = (newValue: string) => {
    setSelectedTab(newValue)
    setPage(1)
    clearSelection()
    setBulkFeedback(null)
  }

  const hasActiveFilters = Object.entries(effectiveFilters).some(
    ([key, value]) => !['sortBy', 'sortOrder'].includes(key) && value !== undefined && value !== '',
  )
  const filterChips = [
    filters.status && { label: `Status: ${filters.status}`, key: 'status' },
    filters.search && { label: `Search: ${filters.search}`, key: 'search' },
    filters.productQuery && { label: `Product: ${filters.productQuery}`, key: 'productQuery' },
    filters.fromDate && { label: `From: ${filters.fromDate}`, key: 'fromDate' },
    filters.toDate && { label: `To: ${filters.toDate}`, key: 'toDate' },
  ].filter(Boolean) as Array<{ label: string; key: keyof OrdersFilters }>

  const handleCreateOrderClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setCreateOrderAnchorEl(e.currentTarget)
  }

  const handleSelectOrderType = (type: 'b2c' | 'b2b') => {
    // Navigate to create order page based on type
    navigate(`/orders/create?type=${type}`)
    setCreateOrderAnchorEl(null)
  }

  const handleCloneOrder = (order: Order, mode: 'clone' | 'reship' = 'clone') => {
    if (!isB2COrder(order)) {
      toast.open({ message: 'Clone is available for B2C orders only.', severity: 'info' })
      return
    }

    navigate('/orders/create?type=b2c', {
      state: getCloneOrderNavigationState(order, mode),
    })
  }

  const handleExportCSV = async () => {
    if (exportingCsv) return

    setExportingCsv(true)
    try {
      const exportOrders = await fetchOrdersForCsvExport('all', effectiveFilters)
      if (!exportOrders.length) {
        toast.open({ message: 'No orders to export', severity: 'warning' })
        return
      }

      downloadClientOrdersCsv(exportOrders, 'all')
      toast.open({
        message: `Exported ${exportOrders.length} orders with ${CLIENT_ORDER_ADDED_HEADERS.length} added columns.`,
        severity: 'success',
      })
    } catch {
      toast.open({ message: 'Failed to export orders', severity: 'error' })
    } finally {
      setExportingCsv(false)
    }

    if (Date.now() < 0) {
    const csvData = orders.map((order) => ({
      'Order #': order.order_number,
      Type: order.type?.toUpperCase() || 'N/A',
      'Buyer Name': order.buyer_name,
      City: order.city,
      State: order.state,
      Amount: order.order_amount,
      Status: order.order_status,
      'Created At': order.created_at || '',
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.open({ message: 'Orders exported successfully', severity: 'success' })
    }
  }

  return (
    <Stack gap={0} sx={{ pb: selectedOrders.length > 0 ? 6 : 2, position: 'relative' }}>
      <ShipmentTrackingDialog awb={trackingAwb} onClose={() => setTrackingAwb(null)} />
      {/* Page Header - Title + Controls Bar in One Row */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
        mb={2}
        sx={{ flexWrap: 'wrap' }}
      >
        {/* Page Heading */}
        <Typography
          sx={{
            fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' },
            fontWeight: 900,
            color: '#111827',
            whiteSpace: 'nowrap',
            minWidth: 'fit-content',
          }}
        >
          All Shipments
        </Typography>

        {/* Controls Bar - Filter Button + Export + Create Order Button */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          gap={1}
          sx={{ flex: '0 1 auto', flexWrap: { xs: 'wrap', md: 'nowrap' } }}
        >
          {/* <FilterBar
            fields={filterFields}
            defaultValues={filters}
            onApply={(appliedFilters) => {
              setFilters(appliedFilters)
              setPage(1)
              clearSelection()
              setBulkFeedback(null)
            }}
            mode="button"
            buttonLabel="Filters"
            appliedCount={
              Object.values(filters).filter((v) => v !== undefined && v !== '' && v !== 'latest')
                .length
            }
          /> */}

          {/* Warehouse Selector */}
          {warehouseData?.pickupAddresses && warehouseData.pickupAddresses.length > 0 && (
            <Box ref={warehouseSelectorRef}>
              <CustomSelect
                value={selectedWarehouse ?? ''}
                onSelect={(warehouseId) => {
                  setSelectedWarehouse(warehouseId as string)
                  // Open popover when warehouse is selected
                  setTimeout(() => {
                    if (warehouseSelectorRef.current) {
                      setWarehousePopoverAnchor(warehouseSelectorRef.current)
                    }
                  }, 0)
                }}
                items={warehouseData.pickupAddresses.map((w: { id?: string; pickup?: { addressNickname?: string; city?: string; state?: string } }) => ({
                  key: w.id || w.pickup?.addressNickname || '',
                  label: w.pickup?.addressNickname || 'Warehouse',
                  description:
                    w.pickup?.city && w.pickup?.state ? `${w.pickup.city}, ${w.pickup.state}` : '',
                }))}
                placeholder="Choose warehouse"
                width="400px"
              />
            </Box>
          )}

          {/* Date Range Popover */}
          {selectedWarehouse && (
            <Popover
              open={Boolean(warehousePopoverAnchor)}
              anchorEl={warehousePopoverAnchor}
              onClose={() => {
                setWarehousePopoverAnchor(null)
                setSelectedWarehouse(null)
              }}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  minWidth: '340px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, mb: 1.5 }}>
                      📅 Select Date Range
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#6B7280', mb: 2 }}>
                      Download labels for orders within this date range (by default shows all)
                    </Typography>
                  </Box>

                  <Stack spacing={1.5}>
                    <Box>
                      <TextField
                        type="date"
                        label="From Date (Optional)"
                        value={warehouseFromDate}
                        onChange={(e) => setWarehouseFromDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        fullWidth
                        helperText="Leave empty to show all orders from the beginning"
                      />
                    </Box>
                    <Box>
                      <TextField
                        type="date"
                        label="To Date"
                        value={warehouseToDate}
                        onChange={(e) => setWarehouseToDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        fullWidth
                      />
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button
                      variant="text"
                      onClick={() => {
                        setWarehousePopoverAnchor(null)
                        setSelectedWarehouse(null)
                        setWarehouseFromDate('')
                        setWarehouseToDate(getDefaultPickupDateInput())
                      }}
                      sx={{ textTransform: 'none' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={
                        downloadingByWarehouse ? (
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-flex',
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              },
                            }}
                          >
                            <MdDownload size={18} />
                          </Box>
                        ) : (
                          <MdDownload size={18} />
                        )
                      }
                      onClick={async () => {
                        await handleDownloadLabelsByWarehouse()
                        setWarehousePopoverAnchor(null)
                        setSelectedWarehouse(null)
                        setWarehouseFromDate('')
                        setWarehouseToDate(getDefaultPickupDateInput())
                      }}
                      disabled={downloadingByWarehouse}
                      sx={{
                        bgcolor: '#0877C9',
                        textTransform: 'none',
                        '&:hover': { bgcolor: '#B40312' },
                      }}
                    >
                      {downloadingByWarehouse ? 'Downloading...' : 'Download'}
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            </Popover>
          )}

          <Button
            onClick={handleExportCSV}
            startIcon={<MdDownload size={16} />}
            variant="outlined"
            disabled={exportingCsv || orders.length === 0}
            sx={{
              minHeight: 28,
              py: 0.75,
              px: 1.5,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderRadius: '8px',
              borderColor: '#0877C9',
              color: '#0877C9',
              '&:hover': {
                borderColor: '#B40312',
                backgroundColor: alpha('#0877C9', 0.06),
              },
              '&:disabled': {
                borderColor: alpha('#0877C9', 0.4),
                color: alpha('#0877C9', 0.4),
              },
            }}
          >
            {exportingCsv ? 'Exporting...' : 'Export'}
          </Button>

          <Button
            ref={createOrderButtonRef}
            onClick={handleCreateOrderClick}
            startIcon={<MdAdd size={16} />}
            variant="contained"
            sx={{
              minHeight: 28,
              py: 0.75,
              px: 1.5,
              bgcolor: '#0877C9',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.8rem',
              textTransform: 'none',
              borderRadius: '8px',
              boxShadow: '0 12px 24px rgba(217, 4, 22, 0.22)',
              transition: 'all 200ms ease',
              '&:hover': {
                bgcolor: '#B40312',
                boxShadow: '0 14px 28px rgba(217, 4, 22, 0.28)',
              },
              '&:disabled': {
                bgcolor: alpha('#0877C9', 0.4),
              },
            }}
          >
            Create Order
          </Button>
        </Stack>
      </Stack>

      {/* Create Order Popover */}
      <Popover
        open={Boolean(createOrderAnchorEl)}
        anchorEl={createOrderAnchorEl}
        onClose={() => setCreateOrderAnchorEl(null)}
        slots={{ transition: Fade }}
        transitionDuration={200}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              backdropFilter: 'blur(16px)',
              background: 'rgba(255, 255, 255, 0.98)',
              border: '1px solid rgba(17, 17, 19, 0.08)',
              boxShadow: '0 24px 50px rgba(17, 17, 19, 0.12)',
              borderRadius: '24px',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            },
          },
        }}
      >
        {[
          { label: 'Create B2C Order', type: 'b2c' as const },
          { label: 'Create B2B Order', type: 'b2b' as const },
        ].map((action) => (
          <Button
            key={action.type}
            variant="outlined"
            onClick={() => handleSelectOrderType(action.type)}
            sx={{
              borderColor: 'rgba(17, 17, 19, 0.12)',
              color: '#17171A',
              fontWeight: 700,
              textTransform: 'none',
              px: 2.5,
              py: 1,
              borderRadius: '999px',
              '&:hover': {
                borderColor: '#0877C9',
                backgroundColor: alpha('#0877C9', 0.06),
                color: '#0877C9',
              },
            }}
          >
            {action.label}
          </Button>
        ))}
      </Popover>

      <ShipmentStageFilter
        value={selectedTab}
        onChange={handleTabChange}
        counts={data?.statusCounts}
      />

      {/* Sort and filters row */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        px={0}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        gap={2}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: '100%' }}>
          <Box sx={{ width: { xs: '100%', sm: 220 } }}>
            <CustomSelect
              label="Sort by Created At"
              value={
                filters.sortBy === 'created_at' ? filters.sortOrder || 'desc' : 'desc'
              }
              onSelect={(value) => {
                const sortOrder = (value as 'asc' | 'desc') || 'desc'
                setFilters((prev) => ({ ...prev, sortBy: 'created_at', sortOrder }))
                setPage(1)
                clearSelection()
                setBulkFeedback(null)
              }}
              items={[
                { key: 'desc', label: 'Newest first' },
                { key: 'asc', label: 'Oldest first' },
              ]}
            />
          </Box>

          <Box sx={{ width: { xs: '100%', sm: 220 } }}>
            <CustomSelect
              label="Sort by Updated At"
              value={filters.sortBy === 'updated_at' ? filters.sortOrder || 'desc' : 'desc'}
              onSelect={(value) => {
                const sortOrder = (value as 'asc' | 'desc') || 'desc'
                setFilters((prev) => ({ ...prev, sortBy: 'updated_at', sortOrder }))
                setPage(1)
                clearSelection()
                setBulkFeedback(null)
              }}
              items={[
                { key: 'desc', label: 'Newest first' },
                { key: 'asc', label: 'Oldest first' },
              ]}
            />
          </Box>
        </Stack>

        <Box mt={4}>
          <FilterBar
            fields={filterFields}
            onApply={(appliedFilters) => {
              setFilters((prev) => ({
                ...prev,
                ...appliedFilters,
              }))
              setPage(1)
              clearSelection()
              setBulkFeedback(null)
            }}
            mode="button"
            buttonLabel="Filters"
            defaultValues={filters}
            appliedCount={
              Object.values(filters).filter(
                (v) => v !== undefined && v !== '' && v !== 'created_at' && v !== 'desc',
              ).length
            }
          />
        </Box>
      </Stack>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <Stack
          direction="row"
          gap={1}
          mb={1.5}
          flexWrap="wrap"
          sx={{
            animation: 'fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes fadeIn': {
              from: { opacity: 0, transform: 'translateY(-8px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          {filterChips.map((chip) => (
            <Chip
              key={chip.key}
              label={chip.label}
              onDelete={() => {
                setFilters((prev) => ({
                  ...prev,
                  [chip.key]: undefined,
                }))
                setPage(1)
                clearSelection()
              }}
              size={isMobile ? 'small' : 'medium'}
              sx={{
                backgroundColor: alpha('#0877C9', 0.08),
                color: '#0877C9',
                fontWeight: 500,
                border: `1px solid ${alpha('#0877C9', 0.2)}`,
                '& .MuiChip-deleteIcon': {
                  color: alpha('#0877C9', 0.6),
                  '&:hover': {
                    color: '#0877C9',
                  },
                },
              }}
            />
          ))}
        </Stack>
      )}

      {/* Feedback Alert */}
      {bulkFeedback && (
        <Alert
          severity={bulkFeedback.severity}
          onClose={() => setBulkFeedback(null)}
          sx={{
            mb: 1.5,
            alignItems: 'flex-start',
            animation: 'slideDown 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes slideDown': {
              from: { opacity: 0, transform: 'translateY(-12px)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <AlertTitle>{bulkFeedback.title}</AlertTitle>
          {bulkFeedback.message}
        </Alert>
      )}

      {/* Main Content - Table Section */}
      <Box
        sx={{
          backgroundColor: '#FFFFFF',
          borderRadius: 2.5,
          border: `1px solid ${alpha('#000', 0.08)}`,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
          minHeight: 400,
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {isLoading ? (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <TableSkeleton />
          </Box>
        ) : orders.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: { xs: 6, md: 8 },
              px: 3,
              animation: 'fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              '@keyframes fadeIn': {
                from: { opacity: 0 },
                to: { opacity: 1 },
              },
            }}
          >
            <Box
              sx={{
                width: { xs: 60, md: 80 },
                height: { xs: 60, md: 80 },
                borderRadius: '50%',
                backgroundColor: alpha('#0877C9', 0.08),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <Typography sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>📦</Typography>
            </Box>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                fontWeight: 700,
                color: '#111827',
                textAlign: 'center',
              }}
            >
              {hasActiveFilters ? 'No orders found' : 'No orders yet'}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.85rem', md: '0.95rem' },
                color: '#6B7280',
                textAlign: 'center',
                mt: 1,
              }}
            >
              {hasActiveFilters
                ? "Try adjusting your filters to find what you're looking for"
                : 'Create your first shipment to get started'}
            </Typography>
          </Box>
        ) : (
          <DataTable<Order>
            rows={orders}
            columns={columns}
            wrapCells
            title=""
            pagination
            selectable
            currentPage={page - 1}
            onPageChange={(newPage) => {
              setPage(newPage + 1)
              clearSelection()
              setBulkFeedback(null)
            }}
            onRowsPerPageChange={(newRowsPerPage) => {
              setRowsPerPage(newRowsPerPage)
              setPage(1)
              clearSelection()
              setBulkFeedback(null)
            }}
            defaultRowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onSelectRows={(ids) => setSelectedOrderIds(ids as Array<Order['id']>)}
            selectedRowIds={selectedOrderIds}
            expandable
            renderExpandedRow={(row) => <OrderExpandedRow row={row} />}
          />
        )}
      </Box>

      {/* Sticky Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: { xs: 76, md: 76 },
            right: 0,
            backgroundColor: alpha('#FFFFFF', 0.98),
            backdropFilter: 'blur(10px)',
            borderTop: `1px solid ${alpha('#000', 0.08)}`,
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.1)',
            p: 1,
            zIndex: 40,
            animation: 'slideUp 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            '@keyframes slideUp': {
              from: { opacity: 0, transform: 'translateY(100%)' },
              to: { opacity: 1, transform: 'translateY(0)' },
            },
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
            sx={{ flexWrap: 'nowrap' }}
          >
            {/* Selection Info */}
            <Box sx={{ flex: 0, whiteSpace: 'nowrap' }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#0877C9',
                  fontSize: '0.85rem',
                }}
              >
                {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
              </Typography>
              {manifestValidationMessage && (
                <Typography
                  sx={{ color: '#C0392B', fontSize: '0.75rem', mt: 0.2 }}
                >
                  {manifestValidationMessage}
                </Typography>
              )}
            </Box>

            {/* Action Buttons */}
            <Stack
              direction="row"
              gap={0.6}
              sx={{ flexWrap: 'nowrap', overflow: 'auto' }}
            >
              <Button
                variant="contained"
                onClick={handleBulkManifest}
                disabled={bulkManifesting || Boolean(manifestValidationMessage)}
                sx={{
                  textTransform: 'none',
                  minHeight: 28,
                  py: 0.75,
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}
              >
                {bulkManifesting ? 'Manifesting...' : 'Manifest'}
              </Button>

              {/* Download Dropdown */}
              <Box sx={{ position: 'relative' }}>
                <Button
                  ref={downloadAnchorRef}
                  onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                  variant="outlined"
                  disabled={downloadingDocumentType !== null}
                  endIcon={<MdMoreVert size={14} />}
                  sx={{
                    textTransform: 'none',
                    minHeight: 28,
                    py: 0.75,
                    px: 1.5,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Downloads
                </Button>

                <Popper
                  open={downloadMenuOpen}
                  anchorEl={downloadAnchorRef.current}
                  placement="top-end"
                  style={{ zIndex: 41 }}
                >
                  <ClickAwayListener onClickAway={() => setDownloadMenuOpen(false)}>
                    <Paper
                      sx={{
                        mt: 1,
                        backgroundColor: alpha('#FFFFFF', 0.98),
                        backdropFilter: 'blur(16px)',
                        boxShadow:
                          '0 25px 50px rgba(0, 0, 0, 0.1), 0 10px 20px rgba(0, 0, 0, 0.05)',
                        border: `1px solid ${alpha('#000', 0.08)}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <Stack sx={{ minWidth: 180 }}>
                        {[
                          { type: 'label' as DocumentType, label: 'Download Labels' },
                          { type: 'invoice' as DocumentType, label: 'Download Invoices' },
                          { type: 'manifest' as DocumentType, label: 'Download Manifests' },
                        ].map((item, index) => (
                          <Box
                            key={item.type}
                            onClick={() => {
                              handleBulkDownload(item.type)
                              setDownloadMenuOpen(false)
                            }}
                            sx={{
                              p: '10px 16px',
                              cursor: 'pointer',
                              transition: 'all 200ms ease',
                              backgroundColor: 'transparent',
                              '&:hover': {
                                backgroundColor: alpha('#0877C9', 0.06),
                                transform: 'translateX(4px)',
                              },
                              borderBottom: index < 2 ? `1px solid ${alpha('#000', 0.06)}` : 'none',
                              animation: `slideUp 200ms cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 40}ms backwards`,
                              '@keyframes slideUp': {
                                from: { opacity: 0, transform: 'translateY(8px)' },
                                to: { opacity: 1, transform: 'translateY(0)' },
                              },
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                color:
                                  downloadingDocumentType === item.type ? '#0877C9' : '#111827',
                              }}
                            >
                              {downloadingDocumentType === item.type
                                ? 'Downloading...'
                                : item.label}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Paper>
                  </ClickAwayListener>
                </Popper>
              </Box>

              <Button
                variant="outlined"
                onClick={() => setTicketDialogOpen(true)}
                startIcon={<MdOutlineHelpCenter size={14} />}
                sx={{
                  textTransform: 'none',
                  minHeight: 28,
                  py: 0.75,
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#0877C9',
                  borderColor: '#0877C9',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#0877C9',
                    backgroundColor: 'rgba(217, 4, 22, 0.04)',
                  },
                }}
              >
                Raise Ticket
              </Button>

              <Button
                variant="text"
                onClick={() => {
                  clearSelection()
                  setBulkFeedback(null)
                }}
                sx={{
                  textTransform: 'none',
                  minHeight: 28,
                  py: 0.75,
                  px: 1.5,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#6B7280',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    color: '#0877C9',
                    backgroundColor: alpha('#0877C9', 0.05),
                  },
                }}
              >
                Clear
              </Button>
            </Stack>
          </Stack>
        </Box>
      )}

      <ReverseModal
        open={Boolean(reverseOrder)}
        order={reverseOrder}
        onClose={() => setReverseOrder(null)}
        onConfirm={(payload) => {
          createReverse(payload)
          setReverseOrder(null)
        }}
      />

      <CustomDrawer
        width={isMobile ? '100%' : 820}
        open={Boolean(detailsOrder)}
        onClose={() => setDetailsOrder(null)}
        title={detailsOrder?.order_number ? `Order ${detailsOrder.order_number}` : 'Order Details'}
      >
        {detailsOrder && <OrderExpandedRow row={detailsOrder} />}
      </CustomDrawer>

      <ManifestPickupScheduleDialog
        open={pickupDialogOpen}
        title={pickupDialogTitle}
        description={pickupDialogDescription}
        pickupDate={pickupDialogDate}
        pickupTime={pickupDialogTime}
        pickupLocation={pickupDialogLocation}
        expectedPackageCount={pickupDialogPackageCount}
        minDate={getDefaultPickupDateInput()}
        onPickupDateChange={setPickupDialogDate}
        onPickupTimeChange={setPickupDialogTime}
        onPickupLocationChange={setPickupDialogLocation}
        onExpectedPackageCountChange={setPickupDialogPackageCount}
        onCancel={() => closePickupDialog(null)}
        onConfirm={() =>
          closePickupDialog({
            pickup_date: pickupDialogDate,
            pickup_time: pickupDialogTime,
            pickup_location: pickupDialogLocation.trim(),
            expected_package_count: Math.max(1, Math.round(pickupDialogPackageCount)),
          })
        }
      />

      <SourceOrderCourierDrawer
        open={Boolean(courierSelectionOrder)}
        order={courierSelectionOrder}
        onClose={() => setCourierSelectionOrder(null)}
      />

      <CustomDrawer
        open={ticketDialogOpen}
        onClose={() => setTicketDialogOpen(false)}
        anchor="right"
        width={isMobile ? '100%' : 500}
        title="Raise Support Ticket"
      >
        <SupportTicketForm
          initialPrefill={{
            orderReferences: selectedOrders.map((order) => ({
              orderId: String(order.id),
              orderNumber: order.order_number || String(order.id),
              awbNumber: order.awb_number || undefined,
              buyerName: order.buyer_name || undefined,
              buyerPhone: order.buyer_phone || undefined,
              buyerEmail: order.buyer_email || undefined,
              courierPartner: order.courier_partner || undefined,
              warehouseName: order.warehouse_name || undefined,
              shipmentType: order.type || 'b2c',
              orderType: order.order_type || 'prepaid',
              orderStatus: order.order_status || undefined,
            })),
          }}
          onSuccess={() => {
            setTicketDialogOpen(false)
            clearSelection()
            toast.open({
              message: 'Support ticket created successfully',
              severity: 'success',
            })
          }}
          onCancel={() => setTicketDialogOpen(false)}
        />
      </CustomDrawer>
    </Stack>
  )
}

export default AllOrders

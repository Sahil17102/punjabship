import {
  Badge,
  Box,
  Button,
  Code,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
  Input,
  Select,
  Text,
  Textarea,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import Card from 'components/Card/Card'
import TableFilters from 'components/Tables/TableFilters'
import {
  useDeveloperLiveLogs,
  useDeveloperLogs,
  useRetryDeveloperManifest,
  useShopifyOAuthCredentials,
  useTriggerShadowfaxWebhookTest,
  useUpdateShopifyOAuthCredentials,
  useUpdateDeveloperIssue,
} from 'hooks/useDeveloperLogs'
import { useEffect, useMemo, useState } from 'react'
import {
  FiAlertCircle,
  FiArrowUpRight,
  FiBell,
  FiCheckCircle,
  FiClipboard,
  FiCode,
  FiCopy,
  FiEye,
  FiExternalLink,
  FiKey,
  FiPauseCircle,
  FiPlayCircle,
  FiRefreshCw,
  FiSave,
  FiSend,
  FiTool,
  FiTruck,
  FiUserCheck,
} from 'react-icons/fi'
import { useHistory } from 'react-router-dom'
import { useAuthStore } from 'store/useAuthStore'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const ISSUE_OWNER_LABELS = {
  merchant: 'Merchant',
  courier: 'Courier',
  platform: 'Platform',
  unknown: 'Unknown',
}

const ACTION_REQUIRED_LABELS = {
  retry: 'Retry',
  contact_merchant: 'Contact merchant',
  fix_data: 'Fix data',
  ignore: 'Ignore',
  escalate: 'Escalate',
}

const StatCard = ({ label, value, icon, tone = 'blue' }) => {
  const bg = useColorModeValue(`${tone}.50`, `${tone}.900`)
  const border = useColorModeValue(`${tone}.100`, `${tone}.700`)
  const valueColor = useColorModeValue(`${tone}.700`, `${tone}.200`)

  return (
    <Flex
      bg={bg}
      borderWidth="1px"
      borderColor={border}
      borderRadius="xl"
      p={4}
      align="center"
      gap={3}
    >
      <Flex
        align="center"
        justify="center"
        w={11}
        h={11}
        borderRadius="lg"
        bg={useColorModeValue('white', 'rgba(15,23,42,0.35)')}
      >
        <Icon as={icon} />
      </Flex>
      <Box>
        <Text fontSize="xs" color="gray.500" fontWeight="600" textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="2xl" fontWeight="800" color={valueColor}>
          {value ?? 0}
        </Text>
      </Box>
    </Flex>
  )
}

const InfoBlock = ({ label, children }) => (
  <Box>
    <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="700" mb={1}>
      {label}
    </Text>
    {children}
  </Box>
)

const formatDateTime = (value) => {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleString()
}

export default function DeveloperLogs() {
  const history = useHistory()
  const toast = useToast()
  const currentAdminId = useAuthStore((state) => state.userId)
  const detailsDisclosure = useDisclosure()
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [liveLogsEnabled, setLiveLogsEnabled] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [filters, setFilters] = useState({
    search: '',
    source: '',
    status: '',
    priority: '',
    issueOwner: '',
    actionRequired: '',
    actionable: '',
    courier: '',
    merchant: '',
    rootCause: '',
    fromDate: '',
    toDate: '',
  })

  const { data, isLoading, isFetching, refetch } = useDeveloperLogs(page, perPage, filters)
  const liveLogsQuery = useDeveloperLiveLogs(liveLogsEnabled, 1000)
  const shopifyOAuthCredentialsQuery = useShopifyOAuthCredentials()
  const updateShopifyOAuthCredentialsMutation = useUpdateShopifyOAuthCredentials()
  const updateIssueMutation = useUpdateDeveloperIssue()
  const retryManifestMutation = useRetryDeveloperManifest()
  const triggerShadowfaxWebhookMutation = useTriggerShadowfaxWebhookTest()
  const logs = data?.logs || []
  const summary = data?.summary || {}
  const alerts = data?.alerts || []
  const filterMeta = data?.filterMeta || {}
  const textColor = useColorModeValue('gray.700', 'white')
  const mutedColor = useColorModeValue('gray.600', 'gray.300')
  const cardBg = useColorModeValue('white', '#0F172A')
  const headerIconBg = useColorModeValue('red.500', 'red.400')
  const alertBg = useColorModeValue('red.50', 'rgba(127,29,29,0.22)')
  const alertBorder = useColorModeValue('red.100', 'red.900')
  const alertItemBg = useColorModeValue('white', 'rgba(15,23,42,0.4)')
  const alertItemBorder = useColorModeValue('red.100', 'rgba(248,113,113,0.3)')
  const logSurfaceBg = useColorModeValue('gray.900', 'gray.950')
  const logSurfaceColor = useColorModeValue('green.100', 'green.200')
  const shopifyIconBg = useColorModeValue('green.50', 'rgba(20,83,45,0.24)')
  const shopifyIconColor = useColorModeValue('green.600', 'green.200')
  const [shadowfaxTestForm, setShadowfaxTestForm] = useState({
    template: 'forward_in_transit',
    awb: '',
    orderRef: '',
    remarks: '',
    location: '',
    chargedWeight: '',
    actualWeight: '',
    volumetricWeight: '',
    rawPayload: '',
  })
  const [shopifyOAuthForm, setShopifyOAuthForm] = useState({
    clientId: '',
    clientSecret: '',
  })
  const shopifyOAuthCredentials = shopifyOAuthCredentialsQuery.data?.data || {}

  useEffect(() => {
    if (shopifyOAuthCredentials.clientId) {
      setShopifyOAuthForm((current) => ({
        ...current,
        clientId: shopifyOAuthCredentials.clientId,
      }))
    }
  }, [shopifyOAuthCredentials.clientId])

  const liveLogData = liveLogsQuery.data?.data
  const liveLogText = useMemo(() => {
    const stdout = liveLogData?.sources?.stdout?.lines || []
    const stderr = liveLogData?.sources?.stderr?.lines || []

    return [
      `# stdout (${stdout.length} lines)`,
      ...stdout,
      '',
      `# stderr (${stderr.length} lines)`,
      ...stderr,
    ].join('\n')
  }, [liveLogData])

  const rootCauseOptions = useMemo(
    () => (filterMeta.rootCauses || []).map((option) => ({ value: option.value, label: option.label })),
    [filterMeta.rootCauses],
  )

  const filterOptions = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Order, AWB, merchant, or error text',
    },
    {
      key: 'source',
      label: 'Source',
      type: 'select',
      placeholder: 'All sources',
      options: [
        { value: 'manifest_failure', label: 'Manifest Failure' },
        { value: 'pickup_failure', label: 'Pickup Failure' },
        { value: 'warehouse_registration_failure', label: 'Warehouse Registration Failure' },
        { value: 'pending_webhook', label: 'Pending Webhook' },
        { value: 'webhook_delivery_failed', label: 'Outbound Webhook Failure' },
      ],
    },
    {
      key: 'status',
      label: 'Issue Status',
      type: 'select',
      placeholder: 'Open or resolved',
      options: [
        { value: 'open', label: 'Open' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      placeholder: 'All priorities',
      options: [
        { value: 'high', label: 'High' },
        { value: 'medium', label: 'Medium' },
        { value: 'low', label: 'Low' },
      ],
    },
    {
      key: 'issueOwner',
      label: 'Issue Owner',
      type: 'select',
      placeholder: 'All owners',
      options: [
        { value: 'merchant', label: 'Merchant' },
        { value: 'courier', label: 'Courier' },
        { value: 'platform', label: 'Platform' },
        { value: 'unknown', label: 'Unknown' },
      ],
    },
    {
      key: 'actionRequired',
      label: 'Action Required',
      type: 'select',
      placeholder: 'All actions',
      options: [
        { value: 'retry', label: 'Retry' },
        { value: 'contact_merchant', label: 'Contact merchant' },
        { value: 'fix_data', label: 'Fix data' },
        { value: 'ignore', label: 'Ignore' },
        { value: 'escalate', label: 'Escalate' },
      ],
    },
    {
      key: 'actionable',
      label: 'Actionable',
      type: 'select',
      placeholder: 'All',
      options: [
        { value: 'yes', label: 'Yes' },
        { value: 'no', label: 'No' },
      ],
    },
    {
      key: 'rootCause',
      label: 'Root Cause',
      type: 'select',
      placeholder: 'All causes',
      options: rootCauseOptions,
    },
    {
      key: 'courier',
      label: 'Courier',
      type: 'text',
      placeholder: 'Filter by courier',
    },
    {
      key: 'merchant',
      label: 'Merchant',
      type: 'text',
      placeholder: 'Filter by merchant',
    },
    { key: 'fromDate', label: 'From Date', type: 'date' },
    { key: 'toDate', label: 'To Date', type: 'date' },
  ]

  const captions = useMemo(
    () => [
      'When',
      'Issue Status',
      'Priority',
      'Classification',
      'Where Error Came',
      'For Whom',
      'Why This Matters',
      'What Admin Should Do',
    ],
    [],
  )

  const columnKeys = useMemo(
    () => [
      'created_at',
      'status_label',
      'priority',
      'classification',
      'where_it_happened',
      'for_whom',
      'why_this_matters',
      'recommendation',
    ],
    [],
  )

  const openIssueDetails = (row) => {
    setSelectedIssue(row)
    detailsDisclosure.onOpen()
  }

  const notifySuccess = (title, description) => {
    toast({
      title,
      description,
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const notifyError = (title, error) => {
    toast({
      title,
      description: error?.response?.data?.message || error?.message || 'Please try again.',
      status: 'error',
      duration: 4000,
      isClosable: true,
    })
  }

  const handleCopy = async (label, value) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(String(value))
      notifySuccess(`${label} copied`, String(value))
    } catch (error) {
      notifyError(`Failed to copy ${label.toLowerCase()}`, error)
    }
  }

  const handleIssueUpdate = async (issueKey, payload, successMessage) => {
    try {
      await updateIssueMutation.mutateAsync({ issueKey, payload })
      notifySuccess(successMessage, '')
    } catch (error) {
      notifyError('Action failed', error)
    }
  }

  const handleShadowfaxTestChange = (field, value) => {
    setShadowfaxTestForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleShopifyOAuthChange = (field, value) => {
    setShopifyOAuthForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleSaveShopifyOAuthCredentials = async () => {
    try {
      const payload = {
        clientId: shopifyOAuthForm.clientId.trim(),
      }
      if (shopifyOAuthForm.clientSecret.trim()) {
        payload.clientSecret = shopifyOAuthForm.clientSecret.trim()
      }

      await updateShopifyOAuthCredentialsMutation.mutateAsync(payload)
      setShopifyOAuthForm((current) => ({ ...current, clientSecret: '' }))
      notifySuccess('Shopify credentials saved', 'OAuth credentials are active on the backend.')
    } catch (error) {
      notifyError('Shopify credentials failed', error)
    }
  }

  const handleTriggerShadowfaxWebhook = async () => {
    try {
      const requestPayload = shadowfaxTestForm.rawPayload.trim()
        ? { payload: shadowfaxTestForm.rawPayload }
        : {
            template: shadowfaxTestForm.template,
            awb: shadowfaxTestForm.awb || undefined,
            orderRef: shadowfaxTestForm.orderRef || undefined,
            remarks: shadowfaxTestForm.remarks || undefined,
            location: shadowfaxTestForm.location || undefined,
            chargedWeight:
              shadowfaxTestForm.chargedWeight !== '' ? Number(shadowfaxTestForm.chargedWeight) : undefined,
            actualWeight:
              shadowfaxTestForm.actualWeight !== '' ? Number(shadowfaxTestForm.actualWeight) : undefined,
            volumetricWeight:
              shadowfaxTestForm.volumetricWeight !== ''
                ? Number(shadowfaxTestForm.volumetricWeight)
                : undefined,
          }

      const response = await triggerShadowfaxWebhookMutation.mutateAsync(requestPayload)
      notifySuccess(
        'Shadowfax test triggered',
        `Result: ${response?.data?.result?.success ? 'processed' : response?.data?.result?.reason || 'handled'}`,
      )
    } catch (error) {
      notifyError('Shadowfax test failed', error)
    }
  }

  const getRetryOrder = (row) => row.related_orders?.find((order) => order.can_retry_manifest)

  const handleRetryManifest = async (row, overrideOrderId = null) => {
    const retryOrder = overrideOrderId
      ? row.related_orders?.find((order) => order.id === overrideOrderId)
      : getRetryOrder(row)

    if (!retryOrder?.id) {
      notifyError('Retry unavailable', new Error('No retryable next-step order found for this issue.'))
      return
    }

    try {
      await retryManifestMutation.mutateAsync({ orderId: retryOrder.id, issueKey: row.issue_key })
      notifySuccess(
        'Retry started',
        `Retried the next provider step for order ${retryOrder.order_number || retryOrder.id}.`,
      )
    } catch (error) {
      notifyError('Retry failed', error)
    }
  }

  const openOrder = (rowOrOrder) => {
    const keyword = rowOrOrder?.order_number || rowOrOrder?.awb_number
    if (!keyword) return
    history.push(`/admin/orders?search=${encodeURIComponent(keyword)}`)
  }

  const openMerchant = (merchantUserId) => {
    if (!merchantUserId) return
    history.push(`/admin/users-management/${merchantUserId}/overview`)
  }

  const openTracking = (awb) => {
    if (!awb) return
    history.push(`/admin/order-tracking?awb=${encodeURIComponent(awb)}`)
  }

  const renderers = {
    created_at: (_value, row) => (
      <Box maxW="220px">
        <HStack spacing={2} mb={1} wrap="wrap">
          {row.has_new_alert ? (
            <Badge colorScheme="red" borderRadius="md" px={2}>
              NEW ALERT
            </Badge>
          ) : null}
          <Badge colorScheme={row.actionable ? 'orange' : 'gray'} borderRadius="md" px={2}>
            {row.actionable ? 'ACTIONABLE' : 'NON-ACTIONABLE'}
          </Badge>
        </HStack>
        <Text fontWeight="700">Last seen: {formatDateTime(row.last_seen_at || row.created_at)}</Text>
        <Text fontSize="xs" color="gray.500">
          First seen: {formatDateTime(row.first_seen_at)}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Repeat count: {row.occurrence_count} • Orders: {row.affected_order_count || 0}
        </Text>
      </Box>
    ),
    status_label: (_value, row) => (
      <VStack align="start" spacing={2}>
        <Badge colorScheme={row.status_label === 'resolved' ? 'green' : 'red'} borderRadius="md" px={2}>
          {row.status_label === 'resolved' ? 'RESOLVED' : 'OPEN'}
        </Badge>
        <Text fontSize="xs" color="gray.500">
          {row.owner_admin_name || 'Unassigned'}
        </Text>
      </VStack>
    ),
    priority: (_value, row) => (
      <VStack align="start" spacing={2}>
        <Badge
          colorScheme={row.priority === 'high' ? 'red' : row.priority === 'medium' ? 'orange' : 'gray'}
          borderRadius="md"
          px={2}
        >
          {row.priority?.toUpperCase?.() || 'MEDIUM'}
        </Badge>
        {row.resolved_at ? (
          <Text fontSize="xs" color="gray.500">
            Resolved {formatDateTime(row.resolved_at)}
          </Text>
        ) : null}
      </VStack>
    ),
    classification: (_value, row) => (
      <Box maxW="240px">
        <HStack spacing={2} mb={2} wrap="wrap">
          <Badge colorScheme="purple" borderRadius="md" px={2}>
            {row.root_cause_label}
          </Badge>
        </HStack>
        <Text fontWeight="700">{ISSUE_OWNER_LABELS[row.issue_owner] || 'Unknown'}</Text>
        <Text fontSize="sm" color={mutedColor}>
          Owner: {ISSUE_OWNER_LABELS[row.issue_owner] || 'Unknown'}
        </Text>
        <Text fontSize="sm" color={mutedColor}>
          Action: {ACTION_REQUIRED_LABELS[row.action_required] || 'Review'}
        </Text>
      </Box>
    ),
    where_it_happened: (_value, row) => (
      <Box maxW="260px">
        <Badge colorScheme="blue" variant="subtle" borderRadius="md" px={2} mb={2}>
          {row.source_label}
        </Badge>
        <Text fontWeight="700" mb={1}>
          {row.where_it_happened}
        </Text>
        <Text fontSize="sm" color={mutedColor}>
          {row.how_it_happened}
        </Text>
      </Box>
    ),
    for_whom: (_value, row) => (
      <Box maxW="320px">
        <Text fontWeight="700" mb={1}>
          {row.merchant_name || 'Unknown merchant'}
        </Text>
        <Text fontSize="sm" color={mutedColor} mb={1}>
          {row.for_whom}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Latest order status: {row.status || 'unknown'}
        </Text>
      </Box>
    ),
    why_this_matters: (_value, row) => (
      <Box maxW="250px">
        <Text fontWeight="700" mb={1}>
          {row.why_this_matters}
        </Text>
        <Tooltip label={row.summary} hasArrow placement="top-start">
          <Text fontSize="sm" color={mutedColor} noOfLines={3}>
            {row.summary}
          </Text>
        </Tooltip>
      </Box>
    ),
    recommendation: (_value, row) => (
      <Box maxW="320px">
        <Text fontSize="sm" color={mutedColor} mb={2}>
          {row.recommendation}
        </Text>
        <Text fontSize="xs" color="gray.500">
          Assigned to: {row.owner_admin_name || 'No owner'} {row.owner_admin_email ? `(${row.owner_admin_email})` : ''}
        </Text>
      </Box>
    ),
  }

  const handleMarkAlertSeen = (issueKey) =>
    handleIssueUpdate(issueKey, { markAlertSeen: true }, 'Alert marked as seen')

  const renderRowActions = (row) => {
    const retryOrder = getRetryOrder(row)
    return (
      <Flex direction="column" gap={2}>
        <Button size="xs" leftIcon={<FiEye />} onClick={() => openIssueDetails(row)}>
          Details
        </Button>

        {row.owner_admin_id !== currentAdminId ? (
          <Button
            size="xs"
            variant="outline"
            leftIcon={<FiUserCheck />}
            onClick={() => handleIssueUpdate(row.issue_key, { assignToMe: true }, 'Issue assigned to you')}
            isLoading={updateIssueMutation.isPending}
          >
            Assign to me
          </Button>
        ) : (
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleIssueUpdate(row.issue_key, { clearOwner: true }, 'Issue owner cleared')}
            isLoading={updateIssueMutation.isPending}
          >
            Unassign
          </Button>
        )}

        {row.merchant_user_id ? (
          <Button size="xs" variant="outline" leftIcon={<FiExternalLink />} onClick={() => openMerchant(row.merchant_user_id)}>
            Open Merchant
          </Button>
        ) : null}

        {row.order_number || row.awb_number ? (
          <Button size="xs" variant="outline" leftIcon={<FiArrowUpRight />} onClick={() => openOrder(row)}>
            Open Order
          </Button>
        ) : null}

        {row.awb_number ? (
          <Button size="xs" variant="outline" leftIcon={<FiCopy />} onClick={() => handleCopy('AWB', row.awb_number)}>
            Copy AWB
          </Button>
        ) : null}

        {retryOrder?.id ? (
          <Button
            size="xs"
            colorScheme="blue"
            leftIcon={<FiRefreshCw />}
            onClick={() => handleRetryManifest(row)}
            isLoading={retryManifestMutation.isPending}
          >
            Retry Next Step
          </Button>
        ) : null}

        {row.status_label === 'resolved' ? (
          <Button
            size="xs"
            colorScheme="orange"
            onClick={() => handleIssueUpdate(row.issue_key, { status: 'open' }, 'Issue reopened')}
            isLoading={updateIssueMutation.isPending}
          >
            Reopen
          </Button>
        ) : (
          <Button
            size="xs"
            colorScheme="green"
            leftIcon={<FiCheckCircle />}
            onClick={() => handleIssueUpdate(row.issue_key, { status: 'resolved' }, 'Issue marked resolved')}
            isLoading={updateIssueMutation.isPending}
          >
            Mark Resolved
          </Button>
        )}
      </Flex>
    )
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <Flex justify="space-between" align="center" mb={6} gap={4} wrap="wrap">
        <HStack spacing={3}>
          <Flex
            align="center"
            justify="center"
            w={12}
            h={12}
            borderRadius="xl"
            bg={headerIconBg}
          >
            <Icon as={FiCode} w={6} h={6} color="white" />
          </Flex>
          <Box>
            <Heading size="lg" color={textColor}>
              Developer
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Grouped operational issues with clear ownership, action, alerting, and audit trail.
            </Text>
          </Box>
        </HStack>
        <Button
          leftIcon={<FiRefreshCw />}
          onClick={() => refetch()}
          isLoading={isFetching}
          variant="outline"
        >
          Refresh
        </Button>
      </Flex>

      {alerts.length > 0 ? (
        <Card mb={4} p={4} bg={alertBg} borderWidth="1px" borderColor={alertBorder}>
          <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap" mb={3}>
            <Box>
              <Heading size="sm" mb={1}>
                New high-priority alerts
              </Heading>
              <Text fontSize="sm" color={mutedColor}>
                Only unseen high-priority open issues appear here.
              </Text>
            </Box>
            <Badge colorScheme="red" borderRadius="md" px={3} py={1}>
              {alerts.length} alert{alerts.length > 1 ? 's' : ''}
            </Badge>
          </Flex>
          <VStack spacing={3} align="stretch">
            {alerts.map((alert) => (
              <Flex
                key={alert.issue_key}
                justify="space-between"
                align={{ base: 'start', md: 'center' }}
                gap={3}
                p={3}
                borderRadius="lg"
                bg={alertItemBg}
                borderWidth="1px"
                borderColor={alertItemBorder}
                wrap="wrap"
              >
                <Box>
                  <Text fontWeight="700">{alert.title}</Text>
                  <Text fontSize="sm" color={mutedColor}>
                    {alert.root_cause_label} • {alert.why_this_matters}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {alert.merchant_name || 'Unknown merchant'} • Last seen {formatDateTime(alert.last_seen_at)}
                  </Text>
                </Box>
                <HStack spacing={2} wrap="wrap">
                  <Button size="xs" variant="outline" onClick={() => openIssueDetails(alert)}>
                    View
                  </Button>
                  <Button size="xs" variant="outline" onClick={() => handleMarkAlertSeen(alert.issue_key)}>
                    Mark seen
                  </Button>
                </HStack>
              </Flex>
            ))}
          </VStack>
        </Card>
      ) : null}

      <Grid
        templateColumns={{
          base: 'repeat(2, 1fr)',
          md: 'repeat(4, 1fr)',
          xl: 'repeat(8, 1fr)',
        }}
        gap={3}
        mb={4}
      >
        <StatCard label="Total" value={summary.total} icon={FiAlertCircle} tone="red" />
        <StatCard label="Open" value={summary.open} icon={FiAlertCircle} tone="orange" />
        <StatCard label="Actionable" value={summary.actionable} icon={FiTool} tone="yellow" />
        <StatCard label="New Alerts" value={summary.alerts} icon={FiBell} tone="red" />
        <StatCard label="Open > 1 Hour" value={summary.slaOpenOver1Hour} icon={FiClipboard} tone="orange" />
        <StatCard label="Open > 1 Day" value={summary.slaOpenOver1Day} icon={FiAlertCircle} tone="red" />
        <StatCard label="Manifest" value={summary.manifest} icon={FiTruck} tone="orange" />
        <StatCard label="Warehouse Sync" value={summary.warehouseRegistration} icon={FiTool} tone="purple" />
        <StatCard label="Webhook Fails" value={summary.failedWebhookDelivery} icon={FiSend} tone="blue" />
      </Grid>

      <Card mb={4} p={4}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap" mb={4}>
          <Box>
            <Heading size="sm" mb={1}>
              Live Backend Logs
            </Heading>
            <Text fontSize="sm" color={mutedColor}>
              Fetches the latest 1000 backend lines and refreshes every 3 seconds until you stop it.
            </Text>
            <Text fontSize="xs" color="gray.500" mt={1}>
              {liveLogData?.fetchedAt
                ? `Last updated ${formatDateTime(liveLogData.fetchedAt)}`
                : 'Start the stream to begin polling.'}
            </Text>
          </Box>
          <HStack spacing={2} wrap="wrap">
            <Badge colorScheme={liveLogsEnabled ? 'green' : 'gray'} borderRadius="md" px={2} py={1}>
              {liveLogsEnabled ? 'LIVE' : 'STOPPED'}
            </Badge>
            <Button
              colorScheme={liveLogsEnabled ? 'orange' : 'green'}
              leftIcon={liveLogsEnabled ? <FiPauseCircle /> : <FiPlayCircle />}
              onClick={() => setLiveLogsEnabled((current) => !current)}
            >
              {liveLogsEnabled ? 'Stop' : 'Start'}
            </Button>
            <Button
              variant="outline"
              leftIcon={<FiRefreshCw />}
              onClick={() => liveLogsQuery.refetch()}
              isLoading={liveLogsQuery.isFetching}
            >
              Refresh now
            </Button>
            <Button
              variant="outline"
              leftIcon={<FiCopy />}
              onClick={() => handleCopy('Live logs', liveLogText)}
              isDisabled={!liveLogText.trim()}
            >
              Copy logs
            </Button>
          </HStack>
        </Flex>

        <HStack spacing={3} mb={3} wrap="wrap">
          <Badge colorScheme="blue" borderRadius="md" px={2}>
            stdout: {liveLogData?.sources?.stdout?.lineCount || 0}
          </Badge>
          <Badge colorScheme="red" borderRadius="md" px={2}>
            stderr: {liveLogData?.sources?.stderr?.lineCount || 0}
          </Badge>
        </HStack>

        <Box
          as="pre"
          p={4}
          borderRadius="xl"
          bg={logSurfaceBg}
          color={logSurfaceColor}
          fontSize="xs"
          lineHeight="1.55"
          overflow="auto"
          maxH="520px"
          whiteSpace="pre-wrap"
        >
          {liveLogsQuery.isError
            ? liveLogsQuery.error?.response?.data?.message ||
              liveLogsQuery.error?.message ||
              'Failed to load live logs.'
            : liveLogText || 'No log lines fetched yet.'}
        </Box>
      </Card>

      <Card mb={4} p={4}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap" mb={4}>
          <HStack spacing={3} align="start">
            <Flex
              align="center"
              justify="center"
              w={10}
              h={10}
              borderRadius="lg"
              bg={shopifyIconBg}
              color={shopifyIconColor}
            >
              <Icon as={FiKey} />
            </Flex>
            <Box>
              <Heading size="sm" mb={1}>
                Shopify OAuth Credentials
              </Heading>
              <HStack spacing={2} wrap="wrap">
                <Badge
                  colorScheme={shopifyOAuthCredentials.configured ? 'green' : 'orange'}
                  borderRadius="md"
                  px={2}
                >
                  {shopifyOAuthCredentials.configured ? 'Configured' : 'Missing'}
                </Badge>
                <Badge colorScheme="purple" borderRadius="md" px={2}>
                  {shopifyOAuthCredentials.credentialsSource || 'env'}
                </Badge>
              </HStack>
            </Box>
          </HStack>
          <Button
            colorScheme="green"
            leftIcon={<FiSave />}
            onClick={handleSaveShopifyOAuthCredentials}
            isLoading={updateShopifyOAuthCredentialsMutation.isPending}
            isDisabled={shopifyOAuthCredentialsQuery.isLoading}
          >
            Save
          </Button>
        </Flex>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          <FormControl>
            <FormLabel>SHOPIFY_CLIENT_ID</FormLabel>
            <Input
              placeholder="Client ID"
              value={shopifyOAuthForm.clientId}
              onChange={(e) => handleShopifyOAuthChange('clientId', e.target.value)}
              autoComplete="off"
            />
          </FormControl>
          <FormControl>
            <FormLabel>SHOPIFY_CLIENT_SECRET</FormLabel>
            <Input
              type="password"
              placeholder={
                shopifyOAuthCredentials.hasClientSecret
                  ? 'Leave blank to keep existing secret'
                  : 'Client secret'
              }
              value={shopifyOAuthForm.clientSecret}
              onChange={(e) => handleShopifyOAuthChange('clientSecret', e.target.value)}
              autoComplete="new-password"
            />
          </FormControl>
        </Grid>

        <HStack spacing={3} mt={4} wrap="wrap">
          <Badge colorScheme={shopifyOAuthCredentials.hasClientId ? 'blue' : 'gray'} borderRadius="md" px={2}>
            ID: {shopifyOAuthCredentials.clientIdMasked || 'not set'}
          </Badge>
          <Badge colorScheme={shopifyOAuthCredentials.hasClientSecret ? 'blue' : 'gray'} borderRadius="md" px={2}>
            Secret: {shopifyOAuthCredentials.clientSecretMasked || 'not set'}
          </Badge>
          <Badge colorScheme="gray" borderRadius="md" px={2}>
            Env: {shopifyOAuthCredentials.envFileName || '-'}
          </Badge>
        </HStack>
        <Text fontSize="xs" color="gray.500" mt={3}>
          {shopifyOAuthCredentials.redirectUri || 'Redirect URI unavailable'}
        </Text>
      </Card>

      <Card mb={4} p={4}>
        <Flex justify="space-between" align={{ base: 'start', md: 'center' }} gap={4} wrap="wrap" mb={4}>
          <Box>
            <Heading size="sm" mb={1}>
              Shadowfax Webhook Tester
            </Heading>
            <Text fontSize="sm" color={mutedColor}>
              Trigger sample forward, reverse, NDR, RTO, or weight discrepancy webhook payloads directly from the developer tab.
            </Text>
          </Box>
          <Button
            colorScheme="blue"
            leftIcon={<FiSend />}
            onClick={handleTriggerShadowfaxWebhook}
            isLoading={triggerShadowfaxWebhookMutation.isPending}
          >
            Trigger Test
          </Button>
        </Flex>

        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
          <FormControl>
            <FormLabel>Template</FormLabel>
            <Select
              value={shadowfaxTestForm.template}
              onChange={(e) => handleShadowfaxTestChange('template', e.target.value)}
            >
              <option value="forward_in_transit">Forward In Transit</option>
              <option value="forward_delivered">Forward Delivered</option>
              <option value="forward_ndr">Forward NDR</option>
              <option value="forward_rto">Forward RTO</option>
              <option value="reverse_pickup">Reverse Pickup</option>
              <option value="weight_discrepancy">Weight Discrepancy</option>
            </Select>
          </FormControl>
          <FormControl>
            <FormLabel>AWB / Request ID</FormLabel>
            <Input
              placeholder="Use a real Shadowfax AWB or request ID"
              value={shadowfaxTestForm.awb}
              onChange={(e) => handleShadowfaxTestChange('awb', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Order Ref</FormLabel>
            <Input
              placeholder="Order number or client order id"
              value={shadowfaxTestForm.orderRef}
              onChange={(e) => handleShadowfaxTestChange('orderRef', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Location</FormLabel>
            <Input
              placeholder="Hub or event location"
              value={shadowfaxTestForm.location}
              onChange={(e) => handleShadowfaxTestChange('location', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Remarks</FormLabel>
            <Input
              placeholder="Optional remarks"
              value={shadowfaxTestForm.remarks}
              onChange={(e) => handleShadowfaxTestChange('remarks', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Charged Weight</FormLabel>
            <Input
              type="number"
              step="0.001"
              placeholder="2.5"
              value={shadowfaxTestForm.chargedWeight}
              onChange={(e) => handleShadowfaxTestChange('chargedWeight', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Actual Weight</FormLabel>
            <Input
              type="number"
              step="0.001"
              placeholder="2.2"
              value={shadowfaxTestForm.actualWeight}
              onChange={(e) => handleShadowfaxTestChange('actualWeight', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Volumetric Weight</FormLabel>
            <Input
              type="number"
              step="0.001"
              placeholder="2.4"
              value={shadowfaxTestForm.volumetricWeight}
              onChange={(e) => handleShadowfaxTestChange('volumetricWeight', e.target.value)}
            />
          </FormControl>
        </Grid>

        <FormControl mt={4}>
          <FormLabel>Raw Payload JSON Override</FormLabel>
          <Textarea
            rows={8}
            placeholder='{"awb_number":"SFX123","status":"nc"}'
            value={shadowfaxTestForm.rawPayload}
            onChange={(e) => handleShadowfaxTestChange('rawPayload', e.target.value)}
          />
          <Text fontSize="xs" color="gray.500" mt={2}>
            If raw JSON is provided, it overrides the template fields above.
          </Text>
        </FormControl>
      </Card>

      <Card mb={4} p={4}>
        <TableFilters
          filters={filterOptions}
          values={filters}
          onApply={(nextFilters) => {
            setFilters(nextFilters)
            setPage(1)
          }}
        />
      </Card>

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        totalCount={data?.totalCount || 0}
        perPage={perPage}
        setPerPage={setPerPage}
        title="Developer Issue Queue"
        data={logs}
        captions={captions}
        columnKeys={columnKeys}
        renderers={renderers}
        columnWidths={{
          created_at: '220px',
          status_label: '120px',
          priority: '130px',
          classification: '240px',
          where_it_happened: '280px',
          for_whom: '320px',
          why_this_matters: '250px',
          recommendation: '320px',
        }}
        renderActions={renderRowActions}
        actionsColumnWidth="180px"
      />

      <DrawerPlacement
        isOpen={detailsDisclosure.isOpen}
        onClose={detailsDisclosure.onClose}
        issue={selectedIssue}
        cardBg={cardBg}
        mutedColor={mutedColor}
        onCopy={handleCopy}
        onOpenMerchant={openMerchant}
        onOpenOrder={openOrder}
        onOpenTracking={openTracking}
        onRetryManifest={handleRetryManifest}
        onIssueUpdate={handleIssueUpdate}
        isUpdating={updateIssueMutation.isPending}
        isRetrying={retryManifestMutation.isPending}
      />
    </Box>
  )
}

function DrawerPlacement({
  isOpen,
  onClose,
  issue,
  cardBg,
  mutedColor,
  onCopy,
  onOpenMerchant,
  onOpenOrder,
  onOpenTracking,
  onRetryManifest,
  onIssueUpdate,
  isUpdating,
  isRetrying,
}) {
  if (!issue) return null

  return (
    <Box>
      <DrawerShell isOpen={isOpen} onClose={onClose}>
        <VStack align="stretch" spacing={5}>
          <Box>
            <Heading size="md" mb={2}>
              {issue.title}
            </Heading>
            <Text color={mutedColor} mb={3}>
              {issue.summary}
            </Text>
            <HStack spacing={2} wrap="wrap">
              <Badge colorScheme={issue.priority === 'high' ? 'red' : issue.priority === 'medium' ? 'orange' : 'gray'}>
                {issue.priority?.toUpperCase?.()}
              </Badge>
              <Badge colorScheme={issue.status_label === 'resolved' ? 'green' : 'red'}>
                {issue.status_label === 'resolved' ? 'RESOLVED' : 'OPEN'}
              </Badge>
              <Badge colorScheme="purple">{issue.root_cause_label}</Badge>
              <Badge colorScheme="blue">{ISSUE_OWNER_LABELS[issue.issue_owner] || 'Unknown'}</Badge>
              <Badge colorScheme={issue.action_required === 'ignore' ? 'gray' : 'orange'}>
                {ACTION_REQUIRED_LABELS[issue.action_required] || 'Review'}
              </Badge>
            </HStack>
          </Box>

          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            <Card p={4} bg={cardBg}>
              <VStack align="stretch" spacing={4}>
                <InfoBlock label="Where Error Came">
                  <Text fontWeight="700">{issue.where_it_happened}</Text>
                </InfoBlock>
                <InfoBlock label="How It Happened">
                  <Text>{issue.how_it_happened}</Text>
                </InfoBlock>
                <InfoBlock label="Why This Matters">
                  <Text fontWeight="700">{issue.why_this_matters}</Text>
                </InfoBlock>
                <InfoBlock label="What Admin Should Do">
                  <Text>{issue.recommendation}</Text>
                </InfoBlock>
              </VStack>
            </Card>

            <Card p={4} bg={cardBg}>
              <VStack align="stretch" spacing={4}>
                <InfoBlock label="For Whom">
                  <Text>{issue.for_whom}</Text>
                </InfoBlock>
                <InfoBlock label="Assigned To">
                  <Text>
                    {issue.owner_admin_name || 'Unassigned'}
                    {issue.owner_admin_email ? ` (${issue.owner_admin_email})` : ''}
                  </Text>
                </InfoBlock>
                <InfoBlock label="First Seen / Last Seen">
                  <Text>
                    {formatDateTime(issue.first_seen_at)} / {formatDateTime(issue.last_seen_at)}
                  </Text>
                </InfoBlock>
                <InfoBlock label="Repeat Count">
                  <Text>{issue.occurrence_count}</Text>
                </InfoBlock>
              </VStack>
            </Card>
          </Grid>

          <Card p={4} bg={cardBg}>
            <VStack align="stretch" spacing={3}>
              <Heading size="sm">Direct actions</Heading>
              <HStack spacing={2} wrap="wrap">
                {issue.merchant_user_id ? (
                  <Button size="sm" variant="outline" onClick={() => onOpenMerchant(issue.merchant_user_id)}>
                    Open Merchant
                  </Button>
                ) : null}
                {issue.order_number || issue.awb_number ? (
                  <Button size="sm" variant="outline" onClick={() => onOpenOrder(issue)}>
                    Open Order
                  </Button>
                ) : null}
                {issue.awb_number ? (
                  <Button size="sm" variant="outline" onClick={() => onCopy('AWB', issue.awb_number)}>
                    Copy AWB
                  </Button>
                ) : null}
                {issue.awb_number ? (
                  <Button size="sm" variant="outline" onClick={() => onOpenTracking(issue.awb_number)}>
                    Track AWB
                  </Button>
                ) : null}
                {issue.can_retry_manifest ? (
                  <Button size="sm" colorScheme="blue" onClick={() => onRetryManifest(issue)} isLoading={isRetrying}>
                    Retry Next Step
                  </Button>
                ) : null}
                {issue.status_label === 'resolved' ? (
                  <Button
                    size="sm"
                    colorScheme="orange"
                    onClick={() => onIssueUpdate(issue.issue_key, { status: 'open' }, 'Issue reopened')}
                    isLoading={isUpdating}
                  >
                    Reopen
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => onIssueUpdate(issue.issue_key, { status: 'resolved' }, 'Issue marked resolved')}
                    isLoading={isUpdating}
                  >
                    Mark Resolved
                  </Button>
                )}
                {issue.owner_admin_id ? null : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onIssueUpdate(issue.issue_key, { assignToMe: true }, 'Issue assigned to you')}
                    isLoading={isUpdating}
                  >
                    Assign to me
                  </Button>
                )}
              </HStack>
            </VStack>
          </Card>

          {issue.related_orders?.length ? (
            <Card p={4} bg={cardBg}>
              <VStack align="stretch" spacing={3}>
                <Heading size="sm">Related orders</Heading>
                {issue.related_orders.map((order) => (
                  <Box key={order.id} p={3} borderWidth="1px" borderRadius="lg">
                    <Flex justify="space-between" gap={3} wrap="wrap">
                      <Box>
                        <Text fontWeight="700">{order.order_number || order.id}</Text>
                        <Text fontSize="sm" color={mutedColor}>
                          Status: {order.order_status || 'unknown'} • Repeat count: {order.occurrence_count}
                        </Text>
                        <Text fontSize="sm" color={mutedColor}>
                          AWB: {order.awb_number || 'Not assigned'}
                        </Text>
                      </Box>
                      <HStack spacing={2} wrap="wrap">
                        {order.order_number || order.awb_number ? (
                          <Button size="xs" variant="outline" onClick={() => onOpenOrder(order)}>
                            Open Order
                          </Button>
                        ) : null}
                        {order.awb_number ? (
                          <Button size="xs" variant="outline" onClick={() => onCopy('AWB', order.awb_number)}>
                            Copy AWB
                          </Button>
                        ) : null}
                        {order.awb_number ? (
                          <Button size="xs" variant="outline" onClick={() => onOpenTracking(order.awb_number)}>
                            Track AWB
                          </Button>
                        ) : null}
                        {order.can_retry_manifest ? (
                          <Button
                            size="xs"
                            colorScheme="blue"
                            onClick={() => onRetryManifest(issue, order.id)}
                            isLoading={isRetrying}
                          >
                            Retry Next Step
                          </Button>
                        ) : null}
                      </HStack>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </Card>
          ) : null}

          {issue.related_pending_webhooks?.length ? (
            <Card p={4} bg={cardBg}>
              <Heading size="sm" mb={3}>
                Related pending webhooks
              </Heading>
              <VStack align="stretch" spacing={2}>
                {issue.related_pending_webhooks.map((row) => (
                  <Box key={row.id} p={3} borderWidth="1px" borderRadius="lg">
                    <Text fontWeight="700">
                      {row.awb_number || 'Unknown AWB'} • {row.status || 'pending'}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      Record ID: {row.id}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      Received: {formatDateTime(row.created_at)}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Card>
          ) : null}

          {issue.related_webhook_deliveries?.length ? (
            <Card p={4} bg={cardBg}>
              <Heading size="sm" mb={3}>
                Related webhook deliveries
              </Heading>
              <VStack align="stretch" spacing={2}>
                {issue.related_webhook_deliveries.map((row) => (
                  <Box key={row.id} p={3} borderWidth="1px" borderRadius="lg">
                    <Text fontWeight="700">
                      {row.event_type || 'Event'} • Attempt {row.attempt_count}/{row.max_attempts}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      Delivery ID: {row.id} • Event ID: {row.event_id || 'Unknown'}
                    </Text>
                    <Text fontSize="sm" color={mutedColor}>
                      HTTP status: {row.http_status || 'No response'} • Failed at {formatDateTime(row.failed_at)}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Card>
          ) : null}

          <Card p={4} bg={cardBg}>
            <Heading size="sm" mb={3}>
              Audit trail
            </Heading>
            {issue.audit_trail?.length ? (
              <VStack align="stretch" spacing={3}>
                {issue.audit_trail.map((item) => (
                  <Box key={item.id} p={3} borderWidth="1px" borderRadius="lg">
                    <Text fontWeight="700">{item.note || item.action}</Text>
                    <Text fontSize="sm" color={mutedColor}>
                      {item.admin_name || 'System'}
                      {item.admin_email ? ` (${item.admin_email})` : ''} • {formatDateTime(item.created_at)}
                    </Text>
                    {item.metadata ? (
                      <Code whiteSpace="pre-wrap" width="100%" mt={2} p={2}>
                        {JSON.stringify(item.metadata, null, 2)}
                      </Code>
                    ) : null}
                  </Box>
                ))}
              </VStack>
            ) : (
              <Text color={mutedColor}>No audit history yet.</Text>
            )}
          </Card>

          <Card p={4} bg={cardBg}>
            <Heading size="sm" mb={3}>
              Raw system details
            </Heading>
            <InfoBlock label="System message">
              <Code whiteSpace="pre-wrap" width="100%" p={3}>
                {issue.raw_error || 'No raw error message'}
              </Code>
            </InfoBlock>
            <Divider my={4} />
            <InfoBlock label="Raw payload / context">
              <Code whiteSpace="pre-wrap" width="100%" p={3} maxH="360px" overflowY="auto">
                {issue.raw_payload || 'No raw payload'}
              </Code>
            </InfoBlock>
            <Divider my={4} />
            <InfoBlock label="Related record refs">
              <Code whiteSpace="pre-wrap" width="100%" p={3}>
                {JSON.stringify(issue.related_record_refs || {}, null, 2)}
              </Code>
            </InfoBlock>
          </Card>
        </VStack>
      </DrawerShell>
    </Box>
  )
}

function DrawerShell({ isOpen, onClose, children }) {
  const drawerBg = useColorModeValue('white', '#0F172A')

  return (
    <Box>
      {isOpen ? (
        <Box
          position="fixed"
          inset={0}
          zIndex={1400}
          bg="blackAlpha.600"
          onClick={onClose}
        >
          <Box
            position="absolute"
            right={0}
            top={0}
            h="100%"
            w={{ base: '100%', md: '720px' }}
            bg={drawerBg}
            p={5}
            overflowY="auto"
            onClick={(event) => event.stopPropagation()}
          >
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Issue details</Heading>
              <Button size="sm" variant="outline" onClick={onClose}>
                Close
              </Button>
            </Flex>
            {children}
          </Box>
        </Box>
      ) : null}
    </Box>
  )
}

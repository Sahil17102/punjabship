import {
  Avatar,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Skeleton,
  SkeletonText,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import {
  IconAdjustments,
  IconDownload,
  IconEye,
  IconMinus,
  IconPlus,
  IconReportMoney,
  IconWallet,
} from '@tabler/icons-react'
import StatusBadge from 'components/Badge/StatusBadge'
import CustomDatePicker from 'components/Input/CustomDatePicker'
import CustomModal from 'components/Modal/CustomModal'
import SortControls from 'components/SortControls'
import OrderDetailsModal from 'components/Tables/OrderDetailsModal'
import CopyableAwb from 'components/Orders/CopyableAwb'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAdjustWalletBalance,
  useAdminWalletMisReport,
  useAdminWallets,
  useAdminWalletTransactions,
  useDownloadAdminWalletMisReportCsv,
} from 'hooks/useWallet'
import { useState } from 'react'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const walletFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Email, Company Name, Brand, or Contact Person',
  },
]

const walletMisTransactionAgainstOptions = [
  'COD',
  'RTO',
  'Shipping Charges',
  'Wallet Recharge',
  'Weight Discrepancy',
  'Adjustments',
  'WhatsApp Service Charges',
].map((value) => ({ label: value, value }))

const walletTransactionCategoryOptions = [
  { label: 'All Categories', value: '' },
  { label: 'COD', value: 'cod' },
  { label: 'RTO', value: 'rto' },
  { label: 'Shipping Charges', value: 'shipping_charges' },
  { label: 'Wallet Recharge', value: 'wallet_recharge' },
  { label: 'Weight Discrepancy', value: 'weight_discrepancy' },
  { label: 'Adjustments', value: 'adjustments' },
  { label: 'WhatsApp Service Charges', value: 'whatsapp_service_charges' },
]

const walletMisFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Customer, email, AWB, reason, or reference',
  },
  {
    key: 'dateFrom',
    label: 'Date From',
    type: 'date',
  },
  {
    key: 'dateTo',
    label: 'Date To',
    type: 'date',
  },
  {
    key: 'type',
    label: 'Transaction Type',
    type: 'select',
    placeholder: 'All Types',
    options: [
      { label: 'Credit', value: 'credit' },
      { label: 'Debit', value: 'debit' },
    ],
  },
  {
    key: 'transactionAgainst',
    label: 'Transaction Against',
    type: 'select',
    placeholder: 'All Categories',
    options: walletMisTransactionAgainstOptions,
  },
  {
    key: 'awb',
    label: 'AWB',
    type: 'text',
    placeholder: 'Search AWB',
  },
  {
    key: 'courier',
    label: 'Courier',
    type: 'text',
    placeholder: 'Courier partner',
  },
  {
    key: 'customerId',
    label: 'Customer ID',
    type: 'text',
    placeholder: 'UUID',
  },
  {
    key: 'minWeight',
    label: 'Min Weight',
    type: 'number',
    placeholder: 'kg',
  },
  {
    key: 'maxWeight',
    label: 'Max Weight',
    type: 'number',
    placeholder: 'kg',
  },
  {
    key: 'shipmentOnly',
    label: 'Shipment Link',
    type: 'select',
    placeholder: 'All Transactions',
    options: [{ label: 'Shipment-linked only', value: 'true' }],
  },
]

const initialWalletMisFilters = {
  search: '',
  dateFrom: '',
  dateTo: '',
  type: '',
  transactionAgainst: '',
  awb: '',
  courier: '',
  customerId: '',
  minWeight: '',
  maxWeight: '',
  shipmentOnly: '',
}

const WALLET_TRANSACTION_GST_PERCENT = 18

const displayWalletReason = (value) =>
  String(value || '').replace(/B2C COD Service Charges/gi, 'B2C COD Shipping Charges')

export default function AdminWallets() {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('updatedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [selectedWallet, setSelectedWallet] = useState(null)

  // Modals
  const {
    isOpen: isTransactionsOpen,
    onOpen: onTransactionsOpen,
    onClose: onTransactionsClose,
  } = useDisclosure()
  const { isOpen: isAdjustOpen, onOpen: onAdjustOpen, onClose: onAdjustClose } = useDisclosure()
  const {
    isOpen: isOrderDetailsOpen,
    onOpen: onOrderDetailsOpen,
    onClose: onOrderDetailsClose,
  } = useDisclosure()
  const {
    isOpen: isTransactionDetailsOpen,
    onOpen: onTransactionDetailsOpen,
    onClose: onTransactionDetailsClose,
  } = useDisclosure()
  const {
    isOpen: isWalletMisOpen,
    onOpen: onWalletMisOpen,
    onClose: onWalletMisClose,
  } = useDisclosure()

  // Transactions modal state
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [transactionsLimit] = useState(50)
  const [transactionType, setTransactionType] = useState('')
  const [transactionCategory, setTransactionCategory] = useState('')
  const [transactionDateFrom, setTransactionDateFrom] = useState(null)
  const [transactionDateTo, setTransactionDateTo] = useState(null)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [selectedTransactionOrder, setSelectedTransactionOrder] = useState(null)
  const [walletMisPage, setWalletMisPage] = useState(1)
  const [walletMisLimit] = useState(50)
  const [walletMisFilters, setWalletMisFilters] = useState(initialWalletMisFilters)

  // Adjust wallet form
  const [adjustForm, setAdjustForm] = useState({
    type: 'credit',
    amount: '',
    reason: '',
    notes: '',
  })

  const { data: walletsData, isLoading } = useAdminWallets({
    page,
    limit,
    search,
    sortBy,
    sortOrder,
  })

  const { data: transactionsData, isLoading: transactionsLoading } = useAdminWalletTransactions(
    selectedUserId,
    {
      page: transactionsPage,
      limit: transactionsLimit,
      type: transactionType || undefined,
      dateFrom: transactionDateFrom,
      dateTo: transactionDateTo,
      category: transactionCategory || undefined,
    },
    isTransactionsOpen && !!selectedUserId,
  )

  const walletMisParams = {
    page: walletMisPage,
    limit: walletMisLimit,
    ...Object.fromEntries(
      Object.entries(walletMisFilters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
  }

  const { data: walletMisData, isLoading: walletMisLoading } = useAdminWalletMisReport(
    walletMisParams,
    isWalletMisOpen,
  )

  const adjustMutation = useAdjustWalletBalance()
  const walletMisExportMutation = useDownloadAdminWalletMisReportCsv()

  const wallets = walletsData?.data || []
  const totalCount = walletsData?.totalCount || 0
  const walletMisRows = walletMisData?.data || []
  const walletMisTotalCount = walletMisData?.totalCount || 0

  const handleSortByChange = (e) => {
    setSortBy(e)
    setPage(1)
  }

  const handleSortOrderChange = (e) => {
    setSortOrder(e)
    setPage(1)
  }

  const handleViewTransactions = (wallet) => {
    setSelectedUserId(wallet.userId)
    setSelectedWallet(wallet)
    setTransactionsPage(1)
    setTransactionType('')
    setTransactionCategory('')
    setTransactionDateFrom(null)
    setTransactionDateTo(null)
    onTransactionsOpen()
  }

  const handleCloseTransactions = () => {
    onTransactionsClose()
    onTransactionDetailsClose()
    onOrderDetailsClose()
    setSelectedTransaction(null)
    setSelectedTransactionOrder(null)
  }

  const handleViewTransactionDetails = (transaction) => {
    if (!transaction) return
    setSelectedTransaction(transaction)
    onTransactionDetailsOpen()
  }

  const handleCloseTransactionDetails = () => {
    onTransactionDetailsClose()
    setSelectedTransaction(null)
  }

  const handleViewTransactionOrder = (order) => {
    if (!order) return
    setSelectedTransactionOrder(order)
    onOrderDetailsOpen()
  }

  const handleCloseOrderDetails = () => {
    onOrderDetailsClose()
    setSelectedTransactionOrder(null)
  }

  const handleOpenWalletMis = () => {
    setWalletMisPage(1)
    onWalletMisOpen()
  }

  const handleWalletMisExport = async () => {
    try {
      const { blob, filename } = await walletMisExportMutation.mutateAsync({
        ...walletMisParams,
        page: 1,
        limit: 5000,
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast({
        status: 'success',
        title: 'Wallet MIS exported',
        description: 'The report download has started.',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        status: 'error',
        title: 'Export failed',
        description: error.response?.data?.message || 'Failed to export wallet MIS report',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const handleAdjustWallet = (wallet) => {
    setSelectedUserId(wallet.userId)
    setSelectedWallet(wallet)
    setAdjustForm({ type: 'credit', amount: '', reason: '', notes: '' })
    onAdjustOpen()
  }

  const handleAdjustSubmit = async () => {
    if (!adjustForm.amount || !adjustForm.reason) {
      toast({
        status: 'error',
        title: 'Validation Error',
        description: 'Amount and reason are required',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const amountNum = parseFloat(adjustForm.amount)
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        status: 'error',
        title: 'Validation Error',
        description: 'Amount must be a positive number',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await adjustMutation.mutateAsync({
        userId: selectedUserId,
        type: adjustForm.type,
        amount: amountNum,
        reason: adjustForm.reason,
        notes: adjustForm.notes,
      })
      toast({
        status: 'success',
        title: 'Wallet Adjusted',
        description: `Wallet ${adjustForm.type === 'credit' ? 'credited' : 'debited'} successfully`,
        duration: 3000,
        isClosable: true,
      })
      onAdjustClose()
      setAdjustForm({ type: 'credit', amount: '', reason: '', notes: '' })
    } catch (error) {
      toast({
        status: 'error',
        title: 'Error',
        description: error.response?.data?.message || 'Failed to adjust wallet balance',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  const captions = ['User', 'Email', 'Balance', 'Currency', 'Last Updated']
  const columnKeys = ['user', 'userEmail', 'balance', 'currency', 'updatedAt']
  const walletColumnWidths = {
    user: '230px',
    userEmail: '260px',
    balance: '140px',
    currency: '90px',
    updatedAt: '180px',
  }

  const formatBalance = (balance) => {
    const num = parseFloat(balance || 0)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(num)
  }

  const formatDate = (date) => {
    if (!date) return '—'
    return new Date(date).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getCompanyName = (companyInfo) => {
    if (!companyInfo) return '—'
    return companyInfo.brandName || companyInfo.businessName || companyInfo.name || '—'
  }

  const getContactPerson = (companyInfo) => {
    if (!companyInfo) return '—'
    return companyInfo.contactPerson || '—'
  }

  const getTransactionMeta = (txn) =>
    txn?.meta && typeof txn.meta === 'object' && !Array.isArray(txn.meta) ? txn.meta : {}

  const toAmount = (value) => {
    if (value === undefined || value === null || value === '') return null
    const amount = Number(value)
    return Number.isFinite(amount) ? amount : null
  }

  const firstAmount = (...values) => {
    for (const value of values) {
      const amount = toAmount(value)
      if (amount !== null) return amount
    }
    return null
  }

  const firstText = (...values) => {
    for (const value of values) {
      const text = String(value || '').trim()
      if (text) return text
    }
    return ''
  }

  const getTransactionAwb = (txn) => {
    const meta = getTransactionMeta(txn)
    return (
      txn?.awb_number ||
      txn?.awbNumber ||
      txn?.order?.awb_number ||
      meta.awb_number ||
      meta.awbNumber ||
      meta.awb ||
      ''
    )
  }

  const getTransactionOrderNumber = (txn) => {
    const meta = getTransactionMeta(txn)
    return firstText(txn?.order?.order_number, meta.order_number, meta.orderNumber, txn?.ref)
  }

  const getTransactionCourier = (txn) => {
    const meta = getTransactionMeta(txn)
    return firstText(
      txn?.order?.courier_partner,
      meta.courier_name,
      meta.courier_partner,
      meta.integration_type,
    )
  }

  const getTransactionBreakupLines = (txn) => {
    const backendLines = txn?.transaction_breakup?.lines || []
    if (backendLines.length) return backendLines

    const meta = getTransactionMeta(txn)
    const order = txn?.order || {}
    const reason = String(txn?.reason || '').toLowerCase()
    const paymentType = firstText(meta.payment_type, order.order_type).toLowerCase()
    const isCod = paymentType === 'cod' || reason.includes('cod')
    const lines = []
    const addLine = (key, label, amount, kind = 'charge', includeZero = false) => {
      if (amount === null) return
      if (amount === 0 && !includeZero) return
      lines.push({ key, label, amount, kind })
    }

    addLine(
      'freight_charges',
      'Freight charge',
      firstAmount(meta.freight_charges, meta.freightCharges, order.freight_charges),
    )
    addLine('other_charges', 'Other charge', firstAmount(meta.other_charges, order.other_charges))
    addLine(
      'cod_charges',
      'COD charge',
      firstAmount(meta.cod_charges, order.cod_charges),
      'charge',
      isCod,
    )
    addLine('taxable_subtotal', 'Taxable subtotal', firstAmount(meta.wallet_base_debit), 'subtotal')
    const gstPercent = WALLET_TRANSACTION_GST_PERCENT
    const taxableSubtotal =
      firstAmount(meta.wallet_base_debit, order.wallet_debit_amount) ??
      lines
        .filter((line) => line.kind === 'charge')
        .reduce((sum, line) => sum + Number(line.amount || 0), 0)
    addLine(
      'gst_amount',
      `GST (${gstPercent}%)`,
      taxableSubtotal > 0 ? Number(((taxableSubtotal * gstPercent) / 100).toFixed(2)) : null,
      'tax',
      taxableSubtotal > 0,
    )
    addLine(
      'courier_cost',
      'Courier actual cost',
      firstAmount(meta.courier_cost, order.courier_cost),
      'charge',
    )
    addLine(
      'provider_quote_charge',
      'Provider quoted charge',
      firstAmount(meta.provider_quote_charge, meta.providerQuoteCharge),
      'charge',
    )
    addLine(
      'final_courier_charge',
      'Final courier charge',
      firstAmount(meta.final_courier_charge, meta.finalCourierCharge),
      'charge',
    )

    if (!lines.some((line) => line.kind === 'charge')) {
      const fallbackLabel = reason.includes('rto freight')
        ? 'RTO freight charge'
        : reason.includes('weight discrepancy')
        ? 'Weight discrepancy charge'
        : reason.includes('reverse')
        ? 'Reverse shipment charge'
        : 'Shipment charge'
      addLine('shipment_charge', fallbackLabel, firstAmount(txn?.amount), 'charge', true)
    }

    addLine(
      'wallet_transaction_total',
      txn?.type === 'credit' ? 'Wallet credit total' : 'Wallet debit total',
      firstAmount(meta.total_wallet_debit, order.wallet_debit_amount, txn?.amount),
      'total',
      true,
    )

    return lines
  }

  const getTransactionFacts = (txn) => {
    const meta = getTransactionMeta(txn)
    const backendFacts = txn?.transaction_breakup?.facts || []
    const facts = [...backendFacts]
    const existingLabels = new Set(facts.map((fact) => fact.label))
    const addFact = (label, value, suffix = '') => {
      if (existingLabels.has(label)) return
      const text = firstText(value)
      if (!text) return
      facts.push({ label, value: `${text}${suffix}` })
      existingLabels.add(label)
    }

    addFact('Order number', getTransactionOrderNumber(txn))
    addFact('Courier', getTransactionCourier(txn))
    addFact('Payment type', firstText(meta.payment_type, txn?.order?.order_type).toUpperCase())
    addFact('Charged weight', firstText(meta.charged_weight, txn?.order?.charged_weight), ' kg')
    addFact('Volumetric weight', firstText(meta.volumetric_weight, txn?.order?.volumetric_weight), ' kg')
    addFact('Provider ref', firstText(meta.provider_reference, txn?.order?.provider_reference))

    return facts
  }

  const renderTransactionAwb = (txn) => {
    const awb = getTransactionAwb(txn)
    if (!awb) {
      return (
        <Text fontSize="xs" color="gray.400">
          -
        </Text>
      )
    }

    return (
      <HStack spacing={2}>
        <CopyableAwb awb={awb} />
        <Tooltip label="View transaction details" hasArrow>
          <Button
            variant="link"
            size="xs"
            colorScheme="blue"
            onClick={() => handleViewTransactionDetails(txn)}
          >
            Details
          </Button>
        </Tooltip>
      </HStack>
    )
  }

  const renderTransactionReason = (txn) => {
    const lines = getTransactionBreakupLines(txn)
      .filter((line) => ['charge', 'tax', 'subtotal', 'total'].includes(line.kind))
      .slice(0, 5)

    return (
      <VStack align="start" spacing={1}>
        <Text fontSize="sm" fontWeight="700" color="gray.800">
          {displayWalletReason(txn.reason) || '-'}
        </Text>
        {lines.length > 0 && (
          <Flex gap={1.5} flexWrap="wrap">
            {lines.map((line) => (
              <Box
                key={`${txn.id}-${line.key || line.label}`}
                px={2}
                py={1}
                borderRadius="md"
                bg={line.kind === 'total' ? 'gray.100' : 'purple.50'}
                border="1px"
                borderColor={line.kind === 'total' ? 'gray.200' : 'purple.100'}
              >
                <Text fontSize="11px" fontWeight="800" color="gray.700" whiteSpace="nowrap">
                  {line.label}: {formatBalance(line.amount)}
                </Text>
              </Box>
            ))}
          </Flex>
        )}
      </VStack>
    )
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <TableFilters
        filters={walletFilterOptions}
        values={{ search }}
        onApply={(finalFilters) => {
          setSearch(finalFilters.search || '')
          setPage(1)
        }}
      />

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        sortByComponent={
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={handleSortByChange}
            onSortOrderChange={handleSortOrderChange}
            sortOptions={[
              { value: 'balance', label: 'Balance' },
              { value: 'updatedAt', label: 'Last Updated' },
              { value: 'createdAt', label: 'Created At' },
              { value: 'email', label: 'Email' },
              { value: 'companyName', label: 'Company Name' },
            ]}
          />
        }
        totalCount={totalCount}
        perPage={limit}
        setPerPage={setLimit}
        title="Wallets Management"
        titleActions={
          <Button
            size="sm"
            colorScheme="teal"
            leftIcon={<IconReportMoney size={16} />}
            onClick={handleOpenWalletMis}
          >
            Wallet MIS Report
          </Button>
        }
        data={wallets}
        captions={captions}
        columnKeys={columnKeys}
        columnWidths={walletColumnWidths}
        actionsColumnWidth="240px"
        renderActions={(row) => (
          <HStack spacing={2} minW="230px" justify="flex-start">
            <Tooltip label="View Transactions">
              <Button
                size="sm"
                colorScheme="blue"
                leftIcon={<IconEye size={16} />}
                onClick={() => handleViewTransactions(row)}
                minW="128px"
              >
                Transactions
              </Button>
            </Tooltip>
            <Tooltip label="Adjust Balance">
              <Button
                size="sm"
                colorScheme="purple"
                leftIcon={<IconAdjustments size={16} />}
                onClick={() => handleAdjustWallet(row)}
                minW="92px"
              >
                Adjust
              </Button>
            </Tooltip>
          </HStack>
        )}
        renderers={{
          user: (value, row) => {
            const companyName = getCompanyName(row?.companyInfo)
            const contactPerson = getContactPerson(row?.companyInfo)
            return (
              <Stack direction="row" alignItems="center" gap={2}>
                <Avatar
                  name={contactPerson !== '—' ? contactPerson : companyName}
                  size="sm"
                  _hover={{ zIndex: '3', cursor: 'pointer' }}
                />
                <VStack align="start" spacing={0}>
                  <Text fontWeight="500" fontSize="sm">
                    {companyName}
                  </Text>
                  {contactPerson !== '—' && (
                    <Text fontSize="xs" color="gray.500">
                      {contactPerson}
                    </Text>
                  )}
                </VStack>
              </Stack>
            )
          },
          userEmail: (value) => <Text>{value || '—'}</Text>,
          balance: (value) => {
            const num = parseFloat(value || 0)
            return (
              <Text fontWeight="bold" color={num >= 0 ? 'green.500' : 'red.500'}>
                {formatBalance(value)}
              </Text>
            )
          },
          currency: (value) => <Text>{value || 'INR'}</Text>,
          updatedAt: (value) => <Text fontSize="sm">{formatDate(value)}</Text>,
        }}
      />

      {/* Wallet MIS Report Modal */}
      <CustomModal
        isOpen={isWalletMisOpen}
        onClose={onWalletMisClose}
        size="6xl"
        title={
          <VStack align="start" spacing={1}>
            <HStack>
              <IconReportMoney size={24} />
              <Text>Wallet MIS Report</Text>
            </HStack>
            <Text fontSize="sm" color="gray.500" fontWeight="normal">
              Consolidated wallet transactions across all customers
            </Text>
          </VStack>
        }
        footer={<Button onClick={onWalletMisClose}>Close</Button>}
      >
        <VStack spacing={4} align="stretch">
          <TableFilters
            filters={walletMisFilterOptions}
            values={walletMisFilters}
            onApply={(finalFilters) => {
              setWalletMisFilters({ ...initialWalletMisFilters, ...finalFilters })
              setWalletMisPage(1)
            }}
            actions={[
              {
                label: 'Export CSV',
                icon: <IconDownload size={16} />,
                colorScheme: 'teal',
                variant: 'solid',
                onClick: handleWalletMisExport,
                isLoading: walletMisExportMutation.isPending,
                loadingText: 'Exporting',
              },
            ]}
          />

          {walletMisLoading ? (
            <VStack spacing={4} align="stretch">
              <Skeleton height="40px" />
              <SkeletonText mt="4" noOfLines={6} spacing="4" />
            </VStack>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Customer Name</Th>
                    <Th>Customer id</Th>
                    <Th>transaction Date</Th>
                    <Th>wallet transaction Amount</Th>
                    <Th>Transaction against</Th>
                    <Th>transaction type</Th>
                    <Th>AWB</Th>
                    <Th>Courier partner name</Th>
                    <Th>Weight</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {walletMisRows.length > 0 ? (
                    walletMisRows.map((row) => (
                      <Tr key={row.id}>
                        <Td>
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="600" fontSize="sm">
                              {row.customerName || '-'}
                            </Text>
                            {row.customerEmail && (
                              <Text fontSize="xs" color="gray.500">
                                {row.customerEmail}
                              </Text>
                            )}
                          </VStack>
                        </Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {row.customerId || '-'}
                          </Text>
                        </Td>
                        <Td>{formatDate(row.transactionDate)}</Td>
                        <Td
                          fontWeight="bold"
                          color={row.transactionType === 'CREDIT' ? 'green.500' : 'red.500'}
                        >
                          {formatBalance(row.walletTransactionAmount)}
                        </Td>
                        <Td>{displayWalletReason(row.transactionAgainst) || '-'}</Td>
                        <Td>
                          <StatusBadge
                            status={row.transactionType || '-'}
                            type={row.transactionType === 'CREDIT' ? 'success' : 'error'}
                          />
                        </Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {row.awb || '-'}
                          </Text>
                        </Td>
                        <Td>{row.courierPartnerName || '-'}</Td>
                        <Td>{row.weight || '-'}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={9} textAlign="center" py={8}>
                        <Text color="gray.500">No MIS transactions found</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {walletMisTotalCount > walletMisLimit && (
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <Text fontSize="sm" color="gray.500">
                Showing {walletMisLimit * (walletMisPage - 1) + 1} to{' '}
                {Math.min(walletMisLimit * walletMisPage, walletMisTotalCount)} of{' '}
                {walletMisTotalCount} transactions
              </Text>
              <HStack>
                <Button
                  size="sm"
                  onClick={() => setWalletMisPage((p) => Math.max(1, p - 1))}
                  isDisabled={walletMisPage === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm">
                  Page {walletMisPage} of {Math.ceil(walletMisTotalCount / walletMisLimit)}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setWalletMisPage((p) => p + 1)}
                  isDisabled={walletMisPage >= Math.ceil(walletMisTotalCount / walletMisLimit)}
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </VStack>
      </CustomModal>

      {/* Transactions Modal */}
      <CustomModal
        isOpen={isTransactionsOpen}
        onClose={handleCloseTransactions}
        size="6xl"
        title={
          <VStack align="start" spacing={1}>
            <HStack>
              <IconWallet size={24} />
              <Text>Wallet Transactions</Text>
            </HStack>
            {selectedWallet && (
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {getCompanyName(selectedWallet.companyInfo)} - Balance:{' '}
                {formatBalance(selectedWallet.balance)}
              </Text>
            )}
          </VStack>
        }
        footer={<Button onClick={handleCloseTransactions}>Close</Button>}
      >
        <VStack spacing={4} align="stretch">
          {/* Filters */}
          <Flex gap={4} flexWrap="wrap">
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="sm">Category</FormLabel>
              <Select
                value={transactionCategory}
                onChange={(e) => {
                  setTransactionCategory(e.target.value)
                  setTransactionsPage(1)
                }}
              >
                {walletTransactionCategoryOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="sm">Transaction Type</FormLabel>
              <Select
                value={transactionType}
                onChange={(e) => {
                  setTransactionType(e.target.value)
                  setTransactionsPage(1)
                }}
                placeholder="All Types"
              >
                <option value="credit">Credit</option>
                <option value="debit">Debit</option>
              </Select>
            </FormControl>
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="sm">Date From</FormLabel>
              <CustomDatePicker
                selected={transactionDateFrom}
                onChange={(date) => {
                  setTransactionDateFrom(date)
                  setTransactionsPage(1)
                }}
                placeholderText="Select start date"
              />
            </FormControl>
            <FormControl flex="1" minW="200px">
              <FormLabel fontSize="sm">Date To</FormLabel>
              <CustomDatePicker
                selected={transactionDateTo}
                onChange={(date) => {
                  setTransactionDateTo(date)
                  setTransactionsPage(1)
                }}
                placeholderText="Select end date"
              />
            </FormControl>
          </Flex>

          {/* Transactions Table */}
          {transactionsLoading ? (
            <VStack spacing={4} align="stretch">
              <Skeleton height="40px" />
              <SkeletonText mt="4" noOfLines={5} spacing="4" />
              <SkeletonText mt="4" noOfLines={5} spacing="4" />
              <SkeletonText mt="4" noOfLines={5} spacing="4" />
            </VStack>
          ) : (
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Date</Th>
                    <Th>Type</Th>
                    <Th>Amount</Th>
                    <Th>Reason</Th>
                    <Th>Charges</Th>
                    <Th>AWB</Th>
                    <Th>Reference</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {transactionsData?.transactions?.length > 0 ? (
                    transactionsData.transactions.map((txn) => (
                      <Tr key={txn.id}>
                        <Td>{formatDate(txn.created_at)}</Td>
                        <Td>
                          <StatusBadge
                            status={txn.type?.toUpperCase()}
                            type={txn.type === 'credit' ? 'success' : 'error'}
                          />
                        </Td>
                        <Td
                          fontWeight="bold"
                          color={txn.type === 'credit' ? 'green.500' : 'red.500'}
                        >
                          {txn.type === 'credit' ? '+' : '-'}
                          {formatBalance(txn.amount)}
                        </Td>
                        <Td>{displayWalletReason(txn.reason) || '—'}</Td>
                        <Td minW="280px">{renderTransactionReason(txn)}</Td>
                        <Td>{renderTransactionAwb(txn)}</Td>
                        <Td>
                          <Text fontSize="xs" fontFamily="mono">
                            {txn.ref || '—'}
                          </Text>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={7} textAlign="center" py={8}>
                        <Text color="gray.500">No transactions found</Text>
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}

          {/* Pagination */}
          {transactionsData?.totalCount > transactionsLimit && (
            <Flex justify="space-between" align="center">
              <Text fontSize="sm" color="gray.500">
                Showing {transactionsLimit * (transactionsPage - 1) + 1} to{' '}
                {Math.min(transactionsLimit * transactionsPage, transactionsData?.totalCount || 0)}{' '}
                of {transactionsData?.totalCount || 0} transactions
              </Text>
              <HStack>
                <Button
                  size="sm"
                  onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                  isDisabled={transactionsPage === 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm">
                  Page {transactionsPage} of{' '}
                  {Math.ceil((transactionsData?.totalCount || 0) / transactionsLimit)}
                </Text>
                <Button
                  size="sm"
                  onClick={() => setTransactionsPage((p) => p + 1)}
                  isDisabled={
                    transactionsPage >=
                    Math.ceil((transactionsData?.totalCount || 0) / transactionsLimit)
                  }
                >
                  Next
                </Button>
              </HStack>
            </Flex>
          )}
        </VStack>
      </CustomModal>

      {selectedTransaction && (
        <CustomModal
          isOpen={isTransactionDetailsOpen}
          onClose={handleCloseTransactionDetails}
          size="2xl"
          title={
            <VStack align="start" spacing={1}>
              <Text>Transaction Details</Text>
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                AWB {getTransactionAwb(selectedTransaction) || '-'}
              </Text>
            </VStack>
          }
          footer={
            <HStack>
              {selectedTransaction.order && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const order = selectedTransaction.order
                    handleCloseTransactionDetails()
                    handleViewTransactionOrder(order)
                  }}
                >
                  View Order
                </Button>
              )}
              <Button onClick={handleCloseTransactionDetails}>Close</Button>
            </HStack>
          }
        >
          <VStack spacing={4} align="stretch">
            <Box p={4} bg="gray.50" borderRadius="md" border="1px" borderColor="gray.100">
              <Box
                display="grid"
                gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                gap={3}
              >
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
                    Order
                  </Text>
                  <Text fontSize="sm" fontWeight="700">
                    {getTransactionOrderNumber(selectedTransaction) || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
                    Courier
                  </Text>
                  <Text fontSize="sm" fontWeight="700">
                    {getTransactionCourier(selectedTransaction) || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
                    Type
                  </Text>
                  <Text fontSize="sm" fontWeight="700">
                    {selectedTransaction.type?.toUpperCase() || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
                    Date
                  </Text>
                  <Text fontSize="sm" fontWeight="700">
                    {formatDate(selectedTransaction.created_at)}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
                    Reason
                  </Text>
                  <Text fontSize="sm" fontWeight="700">
                    {selectedTransaction.reason || '-'}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
                    Reference
                  </Text>
                  <Text fontSize="sm" fontFamily="mono" fontWeight="700">
                    {selectedTransaction.ref || '-'}
                  </Text>
                </Box>
              </Box>
            </Box>

            <Box>
              <Text fontWeight="700" mb={2}>
                Price Breakup
              </Text>
              <VStack
                align="stretch"
                spacing={0}
                border="1px"
                borderColor="gray.100"
                borderRadius="md"
                overflow="hidden"
              >
                {getTransactionBreakupLines(selectedTransaction).map((line) => (
                  <Flex
                    key={`${line.key || line.label}-${line.kind || 'line'}`}
                    justify="space-between"
                    align="center"
                    px={4}
                    py={3}
                    bg={line.kind === 'total' ? 'gray.50' : 'white'}
                    borderBottom={line.kind === 'total' ? '0' : '1px'}
                    borderColor="gray.100"
                  >
                    <VStack align="start" spacing={0}>
                      <Text
                        fontSize="sm"
                        fontWeight={line.kind === 'total' || line.kind === 'subtotal' ? '700' : '600'}
                        color="gray.700"
                      >
                        {line.label}
                      </Text>
                      {line.adminOnly && (
                        <Text fontSize="xs" color="purple.500" fontWeight="600">
                          Admin
                        </Text>
                      )}
                    </VStack>
                    <Text
                      fontSize="sm"
                      fontWeight="800"
                      color={line.kind === 'tax' ? 'orange.500' : 'gray.800'}
                    >
                      {formatBalance(line.amount)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </Box>

            {getTransactionFacts(selectedTransaction).length > 0 && (
              <Box>
                <Text fontWeight="700" mb={2}>
                  Shipment Details
                </Text>
                <Box
                  display="grid"
                  gridTemplateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}
                  gap={3}
                >
                  {getTransactionFacts(selectedTransaction).map((fact) => (
                    <Box key={`${fact.label}-${fact.value}`} p={3} bg="gray.50" borderRadius="md">
                      <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase">
                        {fact.label}
                      </Text>
                      <Text fontSize="sm" fontWeight="700">
                        {fact.value || '-'}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </VStack>
        </CustomModal>
      )}

      {selectedTransactionOrder && (
        <OrderDetailsModal
          isOpen={isOrderDetailsOpen}
          onClose={handleCloseOrderDetails}
          order={selectedTransactionOrder}
        />
      )}

      {/* Adjust Wallet Modal */}
      <CustomModal
        isOpen={isAdjustOpen}
        onClose={onAdjustClose}
        size="md"
        title={
          <VStack align="start" spacing={1}>
            <HStack>
              <IconAdjustments size={24} />
              <Text>Adjust Wallet Balance</Text>
            </HStack>
            {selectedWallet && (
              <Text fontSize="sm" color="gray.500" fontWeight="normal">
                {getCompanyName(selectedWallet.companyInfo)} - Current Balance:{' '}
                {formatBalance(selectedWallet.balance)}
              </Text>
            )}
          </VStack>
        }
        footer={
          <HStack>
            <Button variant="ghost" onClick={onAdjustClose} isDisabled={adjustMutation.isLoading}>
              Cancel
            </Button>
            <Button
              colorScheme={adjustForm.type === 'credit' ? 'green' : 'red'}
              onClick={handleAdjustSubmit}
              isLoading={adjustMutation.isLoading}
              loadingText={adjustForm.type === 'credit' ? 'Crediting...' : 'Debiting...'}
              leftIcon={
                adjustForm.type === 'credit' ? <IconPlus size={16} /> : <IconMinus size={16} />
              }
            >
              {adjustForm.type === 'credit' ? 'Credit' : 'Debit'} Wallet
            </Button>
          </HStack>
        }
      >
        {adjustMutation.isLoading ? (
          <VStack spacing={4} align="stretch" py={4}>
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            <Skeleton height="100px" />
          </VStack>
        ) : (
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Type</FormLabel>
              <Select
                value={adjustForm.type}
                onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}
                isDisabled={adjustMutation.isLoading}
              >
                <option value="credit">Credit (Add Money)</option>
                <option value="debit">Debit (Deduct Money)</option>
              </Select>
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Amount (INR)</FormLabel>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={adjustForm.amount}
                onChange={(e) => setAdjustForm({ ...adjustForm, amount: e.target.value })}
                placeholder="Enter amount"
                isDisabled={adjustMutation.isLoading}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Reason</FormLabel>
              <Input
                value={adjustForm.reason}
                onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                placeholder="e.g., Manual adjustment, Refund, etc."
                isDisabled={adjustMutation.isLoading}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Notes (Optional)</FormLabel>
              <Textarea
                value={adjustForm.notes}
                onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
                isDisabled={adjustMutation.isLoading}
              />
            </FormControl>

            {adjustForm.type === 'debit' &&
              parseFloat(selectedWallet?.balance || 0) < parseFloat(adjustForm.amount || 0) && (
                <Box p={3} bg="orange.50" borderRadius="md" border="1px" borderColor="orange.200">
                  <Text fontSize="sm" color="orange.700" fontWeight="bold">
                    Warning: Wallet will go negative
                  </Text>
                  <Text fontSize="xs" color="orange.700" mt={1}>
                    Current balance ({formatBalance(selectedWallet?.balance)}) is less than the
                    debit amount ({formatBalance(adjustForm.amount)}). This admin debit will still
                    be processed and the wallet balance can go below zero.
                  </Text>
                </Box>
              )}
          </VStack>
        )}
      </CustomModal>
    </Flex>
  )
}

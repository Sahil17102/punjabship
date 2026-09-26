import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
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
import StatusBadge from 'components/Badge/StatusBadge'
import CodCycles from './CodCycles'
import Card from 'components/Card/Card'
import { SellerAutocomplete } from 'components/Input/SellerAutocomplete'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAllCodRemittances,
  useCodPayableReport,
  useCodPlatformStats,
  useConfirmCourierSettlement,
  useManualMarkSettlement,
  usePreviewCourierSettlement,
  useUserCodRemittances,
  useUpdateRemittanceNotes,
} from 'hooks/useCodRemittance'
import { useEffect, useMemo, useState } from 'react'
import { useHistory } from 'react-router-dom'
import {
  downloadSettlementCsvTemplate,
  exportAllCodRemittances,
} from 'services/codRemittance.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

// Filter options for COD remittances
const remittanceFilterOptions = [
  { key: 'courierPartner', label: 'Courier name', type: 'text' },
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Order Number, AWB, Email',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Pending', value: 'pending' },
      { label: 'Credited', value: 'credited' },
    ],
  },
  {
    key: 'fromDate',
    label: 'From Date',
    type: 'date',
  },
  {
    key: 'toDate',
    label: 'To Date',
    type: 'date',
  },
]

const payableReportFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Customer, AWB, order, courier',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Pending Payables', value: 'pending' },
      { label: 'Credited', value: 'credited' },
      { label: 'All', value: 'all' },
    ],
  },
  {
    key: 'courierPartner',
    label: 'Courier',
    type: 'text',
    placeholder: 'Courier partner',
  },
  {
    key: 'customerId',
    label: 'Customer ID',
    type: 'text',
    placeholder: 'Seller UUID',
  },
  {
    key: 'fromDate',
    label: 'Delivered From',
    type: 'date',
  },
  {
    key: 'toDate',
    label: 'Delivered To',
    type: 'date',
  },
]

const initialPayableReportFilters = {
  search: '',
  status: 'pending',
  courierPartner: '',
  customerId: '',
  fromDate: '',
  toDate: '',
}

export default function AdminCodRemittancePage() {
  const history = useHistory()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [filters, setFilters] = useState({})
  const [selectedRemittance, setSelectedRemittance] = useState(null)
  const [notes, setNotes] = useState('')
  const [payableReportFilters, setPayableReportFilters] = useState(initialPayableReportFilters)
  const [courierReceivedAmounts, setCourierReceivedAmounts] = useState({})

  // CSV Upload States
  const [csvFile, setCsvFile] = useState(null)
  const [courierPartner, setCourierPartner] = useState('delhivery')
  const [csvPreviewData, setCsvPreviewData] = useState(null)
  const [selectedForCredit, setSelectedForCredit] = useState([])
  const [utrNumber, setUtrNumber] = useState('')
  const [settlementAmountEdits, setSettlementAmountEdits] = useState({})
  const [settlementNotes, setSettlementNotes] = useState('')
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().split('T')[0])
  const [manualSettlementDate, setManualSettlementDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [manualCodAmount, setManualCodAmount] = useState('')
  const [manualFreightCharges, setManualFreightCharges] = useState('')
  const [manualCodCharges, setManualCodCharges] = useState('')
  const [manualTotalDeductions, setManualTotalDeductions] = useState('')
  const [manualSettlementAmount, setManualSettlementAmount] = useState('')
  const [manualSettlementUtr, setManualSettlementUtr] = useState('')
  const [manualSettlementNotes, setManualSettlementNotes] = useState('Settlement marked by admin')
  const [reviewTabIndex, setReviewTabIndex] = useState(0)
  const [bulkSellerId, setBulkSellerId] = useState('')
  const [bulkSelectedRemittanceIds, setBulkSelectedRemittanceIds] = useState([])
  const [bulkSettlementAmountEdits, setBulkSettlementAmountEdits] = useState({})
  const [bulkSettlementUtr, setBulkSettlementUtr] = useState('')
  const [bulkSettlementNotes, setBulkSettlementNotes] = useState('Bulk settlement marked by admin')
  const [bulkSettlementDate, setBulkSettlementDate] = useState(new Date().toISOString().split('T')[0])

  const { isOpen: isNotesOpen, onOpen: onNotesOpen, onClose: onNotesClose } = useDisclosure()
  const { isOpen: isCreditOpen, onOpen: onCreditOpen, onClose: onCreditClose } = useDisclosure()
  const {
    isOpen: isBulkSettlementOpen,
    onOpen: onBulkSettlementOpen,
    onClose: onBulkSettlementClose,
  } = useDisclosure()
  const {
    isOpen: isCsvUploadOpen,
    onOpen: onCsvUploadOpen,
    onClose: onCsvUploadClose,
  } = useDisclosure()
  const {
    isOpen: isCsvReviewOpen,
    onOpen: onCsvReviewOpen,
    onClose: onCsvReviewClose,
  } = useDisclosure()

  // Hooks
  const { data: stats, isLoading: statsLoading } = useCodPlatformStats()
  const { data: remittanceData, isLoading: remittancesLoading } = useAllCodRemittances({
    page,
    limit: perPage,
    ...filters,
  })
  const payableReportParams = {
    limit: 1000,
    ...Object.fromEntries(
      Object.entries(payableReportFilters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
  }
  const { data: payableReportData, isLoading: payableReportLoading } =
    useCodPayableReport(payableReportParams)
  const { data: sellerRemittanceData, isLoading: sellerRemittancesLoading } =
    useUserCodRemittances(bulkSellerId)
  const manualSettlementMutation = useManualMarkSettlement()
  const updateNotesMutation = useUpdateRemittanceNotes()
  const previewCsvMutation = usePreviewCourierSettlement()
  const confirmSettlementMutation = useConfirmCourierSettlement()

  const remittances = remittanceData?.data?.remittances || []
  const totalCount = remittanceData?.data?.totalCount || 0
  const payableReport = payableReportData?.data || {}
  const payableSummary = payableReport.summary || {}
  const customerPayables = payableReport.customerPayables || []
  const deliveryRows = payableReport.deliveryRows || []
  const courierReceivables = payableReport.courierReceivables || []
  const sellerInfo = sellerRemittanceData?.data?.user || null
  const sellerPendingRemittances = useMemo(
    () =>
      (sellerRemittanceData?.data?.remittances || []).filter((item) => item.status === 'pending'),
    [sellerRemittanceData],
  )

  useEffect(() => {
    if (!bulkSellerId) {
      setBulkSelectedRemittanceIds([])
      setBulkSettlementAmountEdits({})
      return
    }

    const nextEdits = {}
    sellerPendingRemittances.forEach((item) => {
      nextEdits[item.id] = item.remittableAmount ?? ''
    })
    setBulkSettlementAmountEdits(nextEdits)
    setBulkSelectedRemittanceIds(sellerPendingRemittances.map((item) => item.id))
  }, [bulkSellerId, sellerPendingRemittances])

  // Handlers
  const handleExport = async () => {
    try {
      await exportAllCodRemittances(filters)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      await downloadSettlementCsvTemplate()
    } catch (error) {
      toast({
        title: 'Download failed',
        description: 'Unable to download template CSV right now.',
        status: 'error',
        duration: 4000,
      })
    }
  }

  const handleOpenNotes = (remittance) => {
    setSelectedRemittance(remittance)
    setNotes(remittance.notes || '')
    onNotesOpen()
  }

  const handleSaveNotes = async () => {
    if (selectedRemittance) {
      await updateNotesMutation.mutateAsync({
        remittanceId: selectedRemittance.id,
        notes,
      })
      onNotesClose()
    }
  }

  const handleOpenCredit = (remittance) => {
    setSelectedRemittance(remittance)
    setManualSettlementDate(new Date().toISOString().split('T')[0])
    setManualCodAmount(remittance?.codAmount ? String(remittance.codAmount) : '')
    setManualFreightCharges(remittance?.shippingCharges ? String(remittance.shippingCharges) : '')
    setManualCodCharges(remittance?.codCharges ? String(remittance.codCharges) : '')
    setManualTotalDeductions(remittance?.deductions ? String(remittance.deductions) : '')
    setManualSettlementAmount(remittance?.remittableAmount ? String(remittance.remittableAmount) : '')
    setManualSettlementUtr('')
    setManualSettlementNotes('Settlement marked by admin')
    onCreditOpen()
  }

  const handleOpenBulkSettlement = () => {
    setBulkSellerId('')
    setBulkSelectedRemittanceIds([])
    setBulkSettlementAmountEdits({})
    setBulkSettlementUtr('')
    setBulkSettlementNotes('Bulk settlement marked by admin')
    setBulkSettlementDate(new Date().toISOString().split('T')[0])
    onBulkSettlementOpen()
  }

  const handleManualSettlement = async () => {
    if (selectedRemittance) {
      const payload = {
        settledDate: manualSettlementDate,
        utrNumber: manualSettlementUtr || undefined,
        settledAmount: manualSettlementAmount ? Number(manualSettlementAmount) : undefined,
        notes: manualSettlementNotes || 'Settlement marked by admin',
      }

      if (payload.settledAmount !== undefined && (!Number.isFinite(payload.settledAmount) || payload.settledAmount <= 0)) {
        toast({
          title: 'Invalid amount',
          description: 'Settled amount must be a positive number.',
          status: 'warning',
          duration: 3000,
        })
        return
      }

      await manualSettlementMutation.mutateAsync({
        remittanceId: selectedRemittance.id,
        payload,
      })
      onCreditClose()
    }
  }

  const handleBulkToggleSelect = (remittanceId) => {
    setBulkSelectedRemittanceIds((prev) =>
      prev.includes(remittanceId)
        ? prev.filter((id) => id !== remittanceId)
        : [...prev, remittanceId],
    )
  }

  const handleBulkSelectAll = () => {
    const ids = sellerPendingRemittances.map((item) => item.id)
    const allSelected = ids.length > 0 && ids.every((id) => bulkSelectedRemittanceIds.includes(id))
    setBulkSelectedRemittanceIds(allSelected ? [] : ids)
  }

  const getBulkEditedAmount = (remittance) => {
    const editValue = bulkSettlementAmountEdits[remittance.id]
    if (editValue === '' || editValue === undefined || editValue === null) {
      return toAmount(remittance.remittableAmount)
    }
    const parsed = Number(editValue)
    return Number.isFinite(parsed) ? parsed : toAmount(remittance.remittableAmount)
  }

  const handleBulkAmountChange = (remittanceId, value) => {
    setBulkSettlementAmountEdits((prev) => ({
      ...prev,
      [remittanceId]: value,
    }))
  }

  const handleBulkSellerSettlement = async () => {
    if (!bulkSellerId) {
      toast({
        title: 'Seller required',
        description: 'Please select a seller first.',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    if (bulkSelectedRemittanceIds.length === 0) {
      toast({
        title: 'No remittances selected',
        description: 'Please select at least one pending remittance.',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    if (!bulkSettlementUtr.trim()) {
      toast({
        title: 'UTR Required',
        description: 'Please enter the UTR/Transaction number for this seller settlement.',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const remittancesToSettle = sellerPendingRemittances
      .filter((item) => bulkSelectedRemittanceIds.includes(item.id))
      .map((item) => ({
        remittanceId: item.id,
        awb: item.awbNumber,
        orderNumber: item.orderNumber,
        courierAmount: getBulkEditedAmount(item),
        notes: bulkSettlementNotes,
      }))

    const invalidRow = remittancesToSettle.find(
      (item) => !Number.isFinite(Number(item.courierAmount)) || Number(item.courierAmount) <= 0,
    )

    if (invalidRow) {
      toast({
        title: 'Invalid Amount',
        description: 'Each selected remittance must have a valid positive settlement amount.',
        status: 'warning',
        duration: 3500,
      })
      return
    }

    const apiResult = await confirmSettlementMutation.mutateAsync({
      remittances: remittancesToSettle,
      utrNumber: bulkSettlementUtr,
      settlementDate: bulkSettlementDate,
      courierPartner: 'manual-admin',
      settlementNotes: bulkSettlementNotes,
    })

    const credited = apiResult?.data?.results?.credited || []
    const failed = apiResult?.data?.results?.failed || []
    const creditedIds = new Set(credited.map((item) => item.remittanceId))

    if (failed.length > 0) {
      setBulkSelectedRemittanceIds((prev) => prev.filter((id) => !creditedIds.has(id)))
      toast({
        title: 'Bulk settlement partially processed',
        description: `Settled ${credited.length}, failed ${failed.length}. Review the remaining rows and retry.`,
        status: 'warning',
        duration: 6000,
      })
      return
    }

    toast({
      title: 'Bulk settlement complete',
      description: `Successfully settled ${credited.length} remittances for this seller.`,
      status: 'success',
      duration: 5000,
    })

    onBulkSettlementClose()
    setBulkSellerId('')
    setBulkSelectedRemittanceIds([])
    setBulkSettlementAmountEdits({})
    setBulkSettlementUtr('')
    setBulkSettlementNotes('Bulk settlement marked by admin')
    setBulkSettlementDate(new Date().toISOString().split('T')[0])
  }

  const handleViewUser = (userId) => {
    history.push(`/admin/users-management/${userId}/overview`)
  }

  // CSV Upload Handlers
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
    if (!isCsv) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a valid .csv file.',
        status: 'warning',
        duration: 3500,
      })
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'CSV file size must be under 10MB.',
        status: 'warning',
        duration: 3500,
      })
      return
    }

    setCsvFile(file)
  }

  const handleUploadCsv = async () => {
    if (!csvFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to upload',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const csvContent = e.target.result
      try {
        const result = await previewCsvMutation.mutateAsync({
          courierPartner,
          csvData: csvContent,
        })

        setCsvPreviewData(result.data)
        const summary = result.data?.summary || {}
        const nextTabIndex =
          summary.matched > 0
            ? 0
            : summary.discrepancies > 0
            ? 1
            : summary.notFound > 0
            ? 2
            : summary.alreadyCredited > 0
            ? 3
            : summary.errors > 0
            ? 4
            : 0
        setReviewTabIndex(nextTabIndex)

        // Auto-select all matched orders
        const matchedIds = result.data.results.matched.map((m) => m.remittanceId)
        const updatedSettlementEdits = {}
        ;[...result.data.results.matched, ...result.data.results.discrepancies].forEach((item) => {
          updatedSettlementEdits[item.remittanceId] = item.courierAmount ?? ''
        })
        setSettlementAmountEdits(updatedSettlementEdits)
        setSettlementNotes('')
        setSelectedForCredit(matchedIds)

        onCsvUploadClose()
        onCsvReviewOpen()
      } catch (error) {
        toast({
          title: 'CSV Upload Failed',
          description: error.response?.data?.message || 'Failed to parse CSV',
          status: 'error',
          duration: 5000,
        })
      }
    }
    reader.readAsText(csvFile)
  }

  const handleToggleSelect = (remittanceId) => {
    setSelectedForCredit((prev) =>
      prev.includes(remittanceId)
        ? prev.filter((id) => id !== remittanceId)
        : [...prev, remittanceId],
    )
  }

  const handleSelectAll = (items) => {
    const ids = items.map((item) => item.remittanceId)
    setSelectedForCredit((prev) => {
      const allSelected = ids.every((id) => prev.includes(id))
      if (allSelected) {
        return prev.filter((id) => !ids.includes(id))
      } else {
        return [...new Set([...prev, ...ids])]
      }
    })
  }

  const handleConfirmCredit = async () => {
    if (selectedForCredit.length === 0) {
      toast({
        title: 'No orders selected',
        description: 'Please select at least one order to settle',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    if (!utrNumber.trim()) {
      toast({
        title: 'UTR Required',
        description: 'Please enter the UTR/Transaction number',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    try {
      // Get selected remittances data
      const remittancesToCredit = [
        ...csvPreviewData.results.matched,
        ...csvPreviewData.results.discrepancies,
      ]
        .filter((item) => selectedForCredit.includes(item.remittanceId))
        .map((item) => ({
          ...item,
          courierAmount:
            settlementAmountEdits[item.remittanceId] !== undefined &&
            settlementAmountEdits[item.remittanceId] !== ''
              ? Number(settlementAmountEdits[item.remittanceId])
              : item.courierAmount,
          notes: settlementNotes,
        }))

      const invalidRow = remittancesToCredit.find(
        (item) => !Number.isFinite(Number(item.courierAmount)) || Number(item.courierAmount) <= 0,
      )

      if (invalidRow) {
        toast({
          title: 'Invalid Amount',
          description: 'All selected settlement amounts must be valid positive numbers.',
          status: 'warning',
          duration: 3500,
        })
        return
      }

      const apiResult = await confirmSettlementMutation.mutateAsync({
        remittances: remittancesToCredit,
        utrNumber,
        settlementDate,
        courierPartner,
        settlementNotes,
      })

      const credited = apiResult?.data?.results?.credited || []
      const failed = apiResult?.data?.results?.failed || []
      const creditedIds = new Set(credited.map((item) => item.remittanceId))

      if (failed.length > 0) {
        setSelectedForCredit((prev) => prev.filter((id) => !creditedIds.has(id)))
        toast({
          title: 'Settlement partially processed',
          description: `Settled ${credited.length}, failed ${failed.length}. Review and retry failed rows.`,
          status: 'warning',
          duration: 6000,
        })
        return
      }

      toast({
        title: 'Settlement Confirmed',
        description: `Successfully settled ${credited.length} orders`,
        status: 'success',
        duration: 5000,
      })

      // Reset and close
      onCsvReviewClose()
      setCsvPreviewData(null)
      setSelectedForCredit([])
      setUtrNumber('')
      setCsvFile(null)
    } catch (error) {
      toast({
        title: 'Settlement Failed',
        description: error.response?.data?.message || 'Failed to confirm settlement',
        status: 'error',
        duration: 5000,
      })
    }
  }

  // Table columns
  const captions = [
    'Reference ID',
    'Bank Holder Name',
    'Amount',
    'Date & Time',
    'Status',
    'Cycle / Fee / Eligibility',
    'Order',
    'User',
    'Courier',
    'COD Amount',
    'Settlement Adjustments',
    'Remittable',
    'Collected',
    'Credited',
    'Actions',
  ]

  const columnKeys = [
    'referenceId',
    'bankHolderName',
    'amount',
    'dateTime',
    'status',
    'cycleName',
    'orderNumber',
    'userEmail',
    'courierPartner',
    'codAmount',
    'deductions',
    'remittableAmount',
    'collectedAt',
    'creditedAt',
  ]

  const hasCreditableRows = useMemo(() => {
    if (!csvPreviewData) return false
    return (
      (csvPreviewData.results?.matched?.length || 0) +
        (csvPreviewData.results?.discrepancies?.length || 0) >
      0
    )
  }, [csvPreviewData])

  const toAmount = (value) => {
    const n = Number(value ?? 0)
    return Number.isFinite(n) ? n : 0
  }

  const formatMoney = (value) =>
    `₹${toAmount(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`

  const getCourierReceivedAmount = (courierPartner) => {
    const value = courierReceivedAmounts[courierPartner]
    const amount = Number(value || 0)
    return Number.isFinite(amount) ? amount : 0
  }

  const getEditedAmount = (item) => {
    const editValue = settlementAmountEdits[item.remittanceId]
    if (editValue === '' || editValue === undefined || editValue === null) {
      return toAmount(item.courierAmount)
    }
    const parsed = Number(editValue)
    return Number.isFinite(parsed) ? parsed : toAmount(item.courierAmount)
  }

  const handleEditedAmountChange = (remittanceId, value) => {
    setSettlementAmountEdits((prev) => ({
      ...prev,
      [remittanceId]: value,
    }))
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <CodCycles />
      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing="24px" mb="20px">
        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Total Pending
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="orange.500">
              ₹{stats?.data?.totalPending?.amount?.toLocaleString('en-IN') || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              {stats?.data?.totalPending?.count || 0} orders
            </StatHelpText>
          </Stat>
        </Card>

        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Today's Credited
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="green.500">
              ₹{stats?.data?.todayCredited?.amount?.toLocaleString('en-IN') || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              {stats?.data?.todayCredited?.count || 0} orders
            </StatHelpText>
          </Stat>
        </Card>

        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Total Credited
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="blue.500">
              ₹{stats?.data?.totalCredited?.amount?.toLocaleString('en-IN') || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              {stats?.data?.totalCredited?.count || 0} orders
            </StatHelpText>
          </Stat>
        </Card>

        <Card>
          <Stat>
            <StatLabel fontSize="sm" color="gray.500" fontWeight="bold" mb="4px">
              Users with Pending
            </StatLabel>
            <StatNumber fontSize="2xl" fontWeight="bold" color="purple.500">
              {stats?.data?.usersWithPending || 0}
            </StatNumber>
            <StatHelpText fontSize="xs" color="gray.400">
              Sellers
            </StatHelpText>
          </Stat>
        </Card>
      </SimpleGrid>

      <Card mb="20px">
        <VStack align="stretch" spacing={4}>
          <Flex justify="space-between" align="flex-start" gap={3} flexWrap="wrap">
            <Box>
              <Text fontSize="xl" fontWeight="800">
                COD Payable Report
              </Text>
              <Text fontSize="sm" color="gray.500">
                Customer payable, wallet adjustment, delivery, and courier receivable view
              </Text>
            </Box>
            {payableReportLoading && (
              <Text fontSize="sm" color="gray.500">
                Loading report...
              </Text>
            )}
          </Flex>

          <TableFilters
            filters={payableReportFilterOptions}
            values={payableReportFilters}
            onApply={(finalFilters) => {
              setPayableReportFilters({ ...initialPayableReportFilters, ...finalFilters })
              setCourierReceivedAmounts({})
            }}
          />

          <SimpleGrid columns={{ base: 1, md: 2, lg: 5 }} spacing={3}>
            <Box p={3} bg="orange.50" borderRadius="md" borderWidth={1} borderColor="orange.200">
              <Text fontSize="xs" color="gray.600" fontWeight="700">
                COD Payable
              </Text>
              <Text fontSize="xl" fontWeight="800" color="orange.600">
                {formatMoney(payableSummary.codPayableAmount)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {payableSummary.pendingOrderCount || 0} delivered COD orders
              </Text>
            </Box>
            <Box p={3} bg="red.50" borderRadius="md" borderWidth={1} borderColor="red.200">
              <Text fontSize="xs" color="gray.600" fontWeight="700">
                Negative Wallet Adjustment
              </Text>
              <Text fontSize="xl" fontWeight="800" color="red.600">
                {formatMoney(payableSummary.negativeWalletAdjustment)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Customer dues recovered from COD
              </Text>
            </Box>
            <Box p={3} bg="green.50" borderRadius="md" borderWidth={1} borderColor="green.200">
              <Text fontSize="xs" color="gray.600" fontWeight="700">
                Net Payable
              </Text>
              <Text fontSize="xl" fontWeight="800" color="green.600">
                {formatMoney(payableSummary.netPayableBalance)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                After wallet adjustment
              </Text>
            </Box>
            <Box p={3} bg="blue.50" borderRadius="md" borderWidth={1} borderColor="blue.200">
              <Text fontSize="xs" color="gray.600" fontWeight="700">
                Courier Receivable
              </Text>
              <Text fontSize="xl" fontWeight="800" color="blue.600">
                {formatMoney(payableSummary.courierReceivableAmount)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Expected from courier partners
              </Text>
            </Box>
            <Box p={3} bg="purple.50" borderRadius="md" borderWidth={1} borderColor="purple.200">
              <Text fontSize="xs" color="gray.600" fontWeight="700">
                Customers
              </Text>
              <Text fontSize="xl" fontWeight="800" color="purple.600">
                {payableSummary.customerCount || 0}
              </Text>
              <Text fontSize="xs" color="gray.500">
                With COD payable rows
              </Text>
            </Box>
          </SimpleGrid>

          <Tabs variant="enclosed">
            <TabList overflowX="auto">
              <Tab>User-wise COD Remittance</Tab>
              <Tab>Seller-wise COD Reports</Tab>
              <Tab>Courier Wise Receivables</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px={0}>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Customer</Th>
                        <Th>Customer ID</Th>
                        <Th>COD Payable</Th>
                        <Th>Wallet Balance</Th>
                        <Th>Negative Adjustment</Th>
                        <Th>Net Payable</Th>
                        <Th>Orders</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {customerPayables.length > 0 ? (
                        customerPayables.map((row) => (
                          <Tr key={row.customerId}>
                            <Td>
                              <VStack align="start" spacing={0}>
                                <Text fontWeight="700" fontSize="sm">
                                  {row.customerName || '-'}
                                </Text>
                                <Text fontSize="xs" color="gray.500">
                                  {row.customerEmail || '-'}
                                </Text>
                              </VStack>
                            </Td>
                            <Td>
                              <Text fontSize="xs" fontFamily="mono">
                                {row.customerId}
                              </Text>
                            </Td>
                            <Td fontWeight="700">{formatMoney(row.codPayableAmount)}</Td>
                            <Td color={toAmount(row.walletBalance) < 0 ? 'red.600' : 'green.600'}>
                              {formatMoney(row.walletBalance)}
                            </Td>
                            <Td color="red.600">{formatMoney(row.negativeWalletAdjustment)}</Td>
                            <Td fontWeight="800" color="green.600">
                              {formatMoney(row.netPayableBalance)}
                            </Td>
                            <Td>{row.codOrderCount}</Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={6}>
                            <Text color="gray.500">No customer payables found</Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>

              <TabPanel px={0}>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Reference ID</Th>
                        <Th>Bank Holder Name</Th>
                        <Th>Amount</Th>
                        <Th>Date & Time</Th>
                        <Th>Status</Th>
                        <Th>Order</Th>
                        <Th>Customer</Th>
                        <Th>AWB</Th>
                        <Th>Courier</Th>
                        <Th>COD Amount</Th>
                        <Th>Settlement Adjustments</Th>
                        <Th>Remittable</Th>
                        <Th>Delivered/Collected</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {deliveryRows.length > 0 ? (
                        deliveryRows.map((row) => (
                          <Tr key={row.id}>
                            <Td>
                              <Text fontSize="xs" fontFamily="mono" maxW="160px" noOfLines={1} title={row.referenceId || row.id}>
                                {row.referenceId || row.id || '-'}
                              </Text>
                            </Td>
                            <Td>{row.bankHolderName || 'N/A'}</Td>
                            <Td fontWeight="700">{formatMoney(row.amount || row.remittableAmount)}</Td>
                            <Td fontSize="xs">
                              {row.dateTime ? new Date(row.dateTime).toLocaleString('en-IN') : '-'}
                            </Td>
                            <Td>
                              <StatusBadge
                                status={row.status === 'pending' ? 'PENDING' : 'CREDITED'}
                                type={row.status === 'pending' ? 'warning' : 'success'}
                              />
                            </Td>
                            <Td fontWeight="700">{row.orderNumber}</Td>
                            <Td>{row.customerName}</Td>
                            <Td>
                              <Text fontSize="xs" fontFamily="mono">
                                {row.awbNumber || '-'}
                              </Text>
                            </Td>
                            <Td>{row.courierPartner || '-'}</Td>
                            <Td>{formatMoney(row.codAmount)}</Td>
                            <Td color="red.600">{formatMoney(row.deductions)}</Td>
                            <Td fontWeight="700" color="green.600">
                              {formatMoney(row.remittableAmount)}
                            </Td>
                            <Td fontSize="xs">
                              {row.collectedAt
                                ? new Date(row.collectedAt).toLocaleDateString()
                                : '-'}
                            </Td>
                          </Tr>
                        ))
                      ) : (
                        <Tr>
                          <Td colSpan={13} textAlign="center" py={6}>
                            <Text color="gray.500">No delivered COD rows found</Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>

              <TabPanel px={0}>
                <Alert status="info" borderRadius="md" mb={4}>
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Receivable calculator</AlertTitle>
                    <AlertDescription fontSize="xs">
                      Enter the amount received from each courier to preview the remaining receivable.
                      Use the existing settlement actions below to actually mark remittances settled.
                    </AlertDescription>
                  </Box>
                </Alert>
                <Box overflowX="auto">
                  <Table size="sm" variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Courier Partner</Th>
                        <Th>Delivered COD Orders</Th>
                        <Th>COD To Be Collected</Th>
                        <Th>Settlement Adjustments</Th>
                        <Th>Expected Receivable</Th>
                        <Th>Received Amount</Th>
                        <Th>New Receivable</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {courierReceivables.length > 0 ? (
                        courierReceivables.map((row) => {
                          const receivedAmount = getCourierReceivedAmount(row.courierPartner)
                          const newReceivable = Math.max(
                            0,
                            toAmount(row.expectedReceivable) - receivedAmount,
                          )
                          return (
                            <Tr key={row.courierPartner}>
                              <Td fontWeight="700">{row.courierPartner}</Td>
                              <Td>{row.deliveredCodOrders}</Td>
                              <Td>{formatMoney(row.codToBeCollectedAmount)}</Td>
                              <Td color="red.600">{formatMoney(row.deductions)}</Td>
                              <Td fontWeight="700" color="blue.600">
                                {formatMoney(row.expectedReceivable)}
                              </Td>
                              <Td>
                                <Input
                                  size="sm"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={courierReceivedAmounts[row.courierPartner] || ''}
                                  onChange={(e) =>
                                    setCourierReceivedAmounts((prev) => ({
                                      ...prev,
                                      [row.courierPartner]: e.target.value,
                                    }))
                                  }
                                  placeholder="0.00"
                                />
                              </Td>
                              <Td fontWeight="800" color={newReceivable > 0 ? 'orange.600' : 'green.600'}>
                                {formatMoney(newReceivable)}
                              </Td>
                            </Tr>
                          )
                        })
                      ) : (
                        <Tr>
                          <Td colSpan={7} textAlign="center" py={6}>
                            <Text color="gray.500">No courier receivables found</Text>
                          </Td>
                        </Tr>
                      )}
                    </Tbody>
                  </Table>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Card>

      {/* Filters */}
      <HStack mb={3} flexWrap="wrap">
        <Button onClick={() => { setFilters({ ...filters, status: 'pending' }); setPage(1) }} variant={filters.status === 'pending' ? 'solid' : 'outline'}>Pending remittances</Button>
        <Button onClick={() => { setFilters({ ...filters, status: 'credited' }); setPage(1) }} variant={filters.status === 'credited' ? 'solid' : 'outline'}>Remittance History</Button>
        <SellerAutocomplete value={filters.userId || ''} onChange={(userId) => { setFilters({ ...filters, userId }); setPage(1) }} placeholder="Select seller for remittance report" />
      </HStack>
      <TableFilters
        filters={remittanceFilterOptions}
        values={filters}
        onApply={(finalFilters) => {
          setFilters(finalFilters)
          setPage(1)
        }}
      />

      {/* Actions */}
      <Flex mb="20px" gap={3}>
        <Button colorScheme="green" size="sm" onClick={handleOpenBulkSettlement}>
          Bulk Settle Seller
        </Button>
        <Button colorScheme="purple" size="sm" onClick={onCsvUploadOpen}>
          Upload Settlement CSV
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          Download Template
        </Button>
        <Button colorScheme="teal" size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </Flex>

      {/* Table */}
      <GenericTable
        paginated
        loading={remittancesLoading || statsLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        title={filters.status === 'credited' ? 'Remittance History' : 'User-wise COD Remittance'}
        data={remittances}
        captions={captions}
        columnKeys={columnKeys}
        renderActions={(row) => (
          <HStack spacing={2}>
            {row.status === 'pending' && (
              <Tooltip label="Mark settlement">
                <Button size="xs" colorScheme="green" onClick={() => handleOpenCredit(row)}>
                  Settle
                </Button>
              </Tooltip>
            )}
            <Tooltip label="Add/Edit Notes">
              <Button size="xs" colorScheme="blue" onClick={() => handleOpenNotes(row)}>
                Notes
              </Button>
            </Tooltip>
            <Tooltip label="View User">
              <Button size="xs" variant="outline" onClick={() => handleViewUser(row.userId)}>
                User
              </Button>
            </Tooltip>
          </HStack>
        )}
        renderers={{
          referenceId: (value) => (
            <Text fontSize="xs" fontFamily="mono" maxW="180px" noOfLines={1} title={value || ''}>
              {value || '-'}
            </Text>
          ),
          bankHolderName: (value) => <Text fontSize="sm">{value || 'N/A'}</Text>,
          amount: (value) => <Text fontWeight="700">₹{toAmount(value).toLocaleString('en-IN')}</Text>,
          dateTime: (value) => (
            <Text fontSize="xs">
              {value ? new Date(value).toLocaleString('en-IN') : '-'}
            </Text>
          ),
          cycleName: (value, row) => <Text fontSize="sm">{value || 'Legacy'} · {Number(row.cycleFee || 0).toFixed(2)}%{row.eligibleAt ? ` · Due ${new Date(row.eligibleAt).toLocaleDateString('en-IN')}` : ''}</Text>,
          orderNumber: (value, row) => (
            <Tooltip label={`AWB: ${row.awbNumber || 'N/A'}`}>
              <Text fontWeight="600" fontSize="sm">
                {value}
              </Text>
            </Tooltip>
          ),
          userEmail: (value, row) => (
            <Box>
              <Text fontSize="sm" fontWeight="500">
                {value}
              </Text>
              {row.userName && (
                <Text fontSize="xs" color="gray.500">
                  {row.userName}
                </Text>
              )}
            </Box>
          ),
          codAmount: (value) => <Text fontWeight="600">₹{value?.toLocaleString('en-IN')}</Text>,
          deductions: (value) => <Text color="red.500">₹{value?.toLocaleString('en-IN')}</Text>,
          remittableAmount: (value) => (
            <Text fontWeight="700" color="green.600">
              ₹{value?.toLocaleString('en-IN')}
            </Text>
          ),
          status: (value) => (
            <StatusBadge
              status={value === 'pending' ? 'PENDING' : 'CREDITED'}
              type={value === 'pending' ? 'warning' : 'success'}
            />
          ),
          collectedAt: (value) => (
            <Text fontSize="xs">{value ? new Date(value).toLocaleDateString() : 'N/A'}</Text>
          ),
          creditedAt: (value) => (
            <Text fontSize="xs" color="green.600">
              {value ? new Date(value).toLocaleDateString() : '—'}
            </Text>
          ),
        }}
      />

      {/* Notes Modal */}
      <Modal isOpen={isNotesOpen} onClose={onNotesClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Notes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text fontSize="sm" mb="8px" fontWeight="500">
              Order: {selectedRemittance?.orderNumber}
            </Text>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this remittance..."
              rows={6}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onNotesClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveNotes}
              isLoading={updateNotesMutation.isPending}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manual Settlement Modal */}
      <Modal isOpen={isCreditOpen} onClose={onCreditClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Manual COD Settlement</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text mb="12px">Please review the COD settlement breakup before marking settlement:</Text>
            <Box p="12px" bg="gray.50" borderRadius="md" mb="12px">
              <Text fontSize="sm" fontWeight="600">
                Order: {selectedRemittance?.orderNumber}
              </Text>
              <Text fontSize="sm">User: {selectedRemittance?.userEmail}</Text>
              <Text fontSize="xs" color="gray.600">
                AWB: {selectedRemittance?.awbNumber || 'N/A'} | Courier:{' '}
                {selectedRemittance?.courierPartner || 'N/A'}
              </Text>
            </Box>

            <Box p="12px" border="1px solid" borderColor="gray.200" borderRadius="md" mb="12px">
              <Flex align="center" justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  COD Collected
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  size="sm"
                  width="180px"
                  value={manualCodAmount}
                  onChange={(e) => setManualCodAmount(e.target.value)}
                  onBlur={() => setManualCodAmount(String(toAmount(manualCodAmount) || ''))}
                />
              </Flex>
              <Flex align="center" justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  Freight Charges (Already Wallet-Debited)
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  size="sm"
                  width="180px"
                  color="red.500"
                  value={manualFreightCharges}
                  onChange={(e) => setManualFreightCharges(e.target.value)}
                  onBlur={() => setManualFreightCharges(String(toAmount(manualFreightCharges) || ''))}
                />
              </Flex>
              <Flex align="center" justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  COD Charges (Already Wallet-Debited)
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  size="sm"
                  width="180px"
                  color="red.500"
                  value={manualCodCharges}
                  onChange={(e) => setManualCodCharges(e.target.value)}
                  onBlur={() => setManualCodCharges(String(toAmount(manualCodCharges) || ''))}
                />
              </Flex>
              <Flex align="center" justify="space-between" mb="6px">
                <Text fontSize="sm" color="gray.700">
                  Settlement Adjustments
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  size="sm"
                  width="180px"
                  color="red.600"
                  value={manualTotalDeductions}
                  onChange={(e) => setManualTotalDeductions(e.target.value)}
                  onBlur={() => setManualTotalDeductions(String(toAmount(manualTotalDeductions) || ''))}
                />
              </Flex>
              <Flex align="center" justify="space-between" pt="8px" borderTop="1px solid" borderColor="gray.200">
                <Text fontSize="sm" fontWeight="700">
                  Net Settlement Amount
                </Text>
                <Input
                  type="number"
                  step="0.01"
                  size="sm"
                  width="180px"
                  fontWeight="700"
                  color="green.600"
                  value={manualSettlementAmount}
                  onChange={(e) => setManualSettlementAmount(e.target.value)}
                  onBlur={() => setManualSettlementAmount(String(toAmount(manualSettlementAmount) || ''))}
                />
              </Flex>
            </Box>

            <Box p="10px" bg="orange.50" borderRadius="md" mb="12px">
              <Text fontSize="xs" color="orange.800">
                Reason: Courier collected COD from customer. Platform deducts freight + COD handling
                charges and records the net settlement amount under COD remittance.
              </Text>
            </Box>
            <VStack align="stretch" spacing={3} mb="12px">
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">
                  UTR / Transaction Number
                </FormLabel>
                <Input
                  value={manualSettlementUtr}
                  onChange={(e) => setManualSettlementUtr(e.target.value)}
                  placeholder="Enter UTR/Reference number"
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">
                  Settlement Date
                </FormLabel>
                <Input
                  type="date"
                  value={manualSettlementDate}
                  onChange={(e) => setManualSettlementDate(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">
                  Settlement Notes
                </FormLabel>
                <Input
                  value={manualSettlementNotes}
                  onChange={(e) => setManualSettlementNotes(e.target.value)}
                  placeholder="Optional settlement notes"
                />
              </FormControl>
            </VStack>
            <Text fontSize="xs" color="red.500">
              This action updates COD remittance only. It does not create any wallet transaction.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreditClose}>
              Cancel
            </Button>
            <Button
              colorScheme="green"
              onClick={handleManualSettlement}
              isLoading={manualSettlementMutation.isPending}
            >
              Confirm Settlement
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Seller-wise Bulk Settlement Modal */}
      <Modal isOpen={isBulkSettlementOpen} onClose={onBulkSettlementClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>Bulk COD Settlement by Seller</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="70vh" overflowY="auto">
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Seller-wise manual settlement</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Pick a seller, review pending remittances, edit settlement amounts if needed,
                    then confirm one bulk settlement for that seller.
                  </AlertDescription>
                </Box>
              </Alert>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Seller
                  </FormLabel>
                  <SellerAutocomplete
                    value={bulkSellerId}
                    onChange={setBulkSellerId}
                    placeholder="Search seller by name or email..."
                  />
                </FormControl>

                <Box
                  borderWidth={1}
                  borderColor="gray.200"
                  borderRadius="md"
                  p={3}
                  bg="gray.50"
                >
                  <Text fontSize="xs" color="gray.500" mb={1}>
                    Selected Seller
                  </Text>
                  <Text fontSize="sm" fontWeight="600">
                    {sellerInfo?.email || 'Choose a seller to load pending COD remittances'}
                  </Text>
                  {bulkSellerId && (
                    <Text fontSize="xs" color="gray.600" mt={1}>
                      Pending remittances: {sellerPendingRemittances.length}
                    </Text>
                  )}
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="600">
                    UTR / Transaction Number
                  </FormLabel>
                  <Input
                    value={bulkSettlementUtr}
                    onChange={(e) => setBulkSettlementUtr(e.target.value)}
                    placeholder="Enter UTR/Reference number"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Settlement Date
                  </FormLabel>
                  <Input
                    type="date"
                    value={bulkSettlementDate}
                    onChange={(e) => setBulkSettlementDate(e.target.value)}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="600">
                    Settlement Notes
                  </FormLabel>
                  <Input
                    value={bulkSettlementNotes}
                    onChange={(e) => setBulkSettlementNotes(e.target.value)}
                    placeholder="Optional settlement notes"
                  />
                </FormControl>
              </SimpleGrid>

              {bulkSellerId && !sellerRemittancesLoading && sellerPendingRemittances.length === 0 && (
                <Alert status="warning" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription fontSize="sm">
                    This seller has no pending COD remittances to settle right now.
                  </AlertDescription>
                </Alert>
              )}

              {bulkSellerId && sellerPendingRemittances.length > 0 && (
                <>
                  <Flex align="center" justify="space-between">
                    <HStack spacing={3}>
                      <Checkbox
                        isChecked={
                          sellerPendingRemittances.length > 0 &&
                          sellerPendingRemittances.every((item) =>
                            bulkSelectedRemittanceIds.includes(item.id),
                          )
                        }
                        onChange={handleBulkSelectAll}
                      >
                        <Text fontSize="sm" fontWeight="600">
                          Select All Pending
                        </Text>
                      </Checkbox>
                      <Text fontSize="xs" color="gray.500">
                        {bulkSelectedRemittanceIds.length} selected
                      </Text>
                    </HStack>
                    <Text fontSize="sm" fontWeight="600" color="green.600">
                      Total Selected: ₹
                      {sellerPendingRemittances
                        .filter((item) => bulkSelectedRemittanceIds.includes(item.id))
                        .reduce((sum, item) => sum + getBulkEditedAmount(item), 0)
                        .toLocaleString('en-IN')}
                    </Text>
                  </Flex>

                  <Box overflowX="auto" borderWidth={1} borderColor="gray.200" borderRadius="md">
                    <Table size="sm" variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Select</Th>
                          <Th>Order #</Th>
                          <Th>AWB</Th>
                          <Th>Courier</Th>
                          <Th>Remittable</Th>
                          <Th>Settle Amount</Th>
                          <Th>Collected</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {sellerPendingRemittances.map((item) => (
                          <Tr key={item.id}>
                            <Td>
                              <Checkbox
                                isChecked={bulkSelectedRemittanceIds.includes(item.id)}
                                onChange={() => handleBulkToggleSelect(item.id)}
                              />
                            </Td>
                            <Td fontSize="xs">{item.orderNumber}</Td>
                            <Td fontSize="xs">{item.awbNumber || 'N/A'}</Td>
                            <Td fontSize="xs">{item.courierPartner || 'N/A'}</Td>
                            <Td fontSize="xs" fontWeight="600">
                              ₹{toAmount(item.remittableAmount).toLocaleString('en-IN')}
                            </Td>
                            <Td minW="160px">
                              <Input
                                size="xs"
                                type="number"
                                step="0.01"
                                value={bulkSettlementAmountEdits[item.id] ?? ''}
                                onChange={(e) => handleBulkAmountChange(item.id, e.target.value)}
                              />
                            </Td>
                            <Td fontSize="xs">
                              {item.collectedAt ? new Date(item.collectedAt).toLocaleDateString() : 'N/A'}
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </>
              )}
            </VStack>
          </ModalBody>
          <ModalFooter bg="gray.50" borderTopWidth={1}>
            <HStack spacing={3} width="100%" justify="space-between">
              <Text fontSize="xs" color="gray.600">
                This bulk action updates COD remittance records only. Wallet remains unchanged.
              </Text>
              <HStack>
                <Button variant="ghost" onClick={onBulkSettlementClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleBulkSellerSettlement}
                  isLoading={confirmSettlementMutation.isPending}
                  isDisabled={!bulkSellerId || bulkSelectedRemittanceIds.length === 0 || !bulkSettlementUtr}
                >
                  Confirm Seller Settlement ({bulkSelectedRemittanceIds.length})
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal isOpen={isCsvUploadOpen} onClose={onCsvUploadClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Upload Courier Settlement CSV</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">2-step settlement flow</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Step 1: Upload and review. Step 2: Confirm selected rows with UTR.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">
                  Courier Partner
                </FormLabel>
                <Select value={courierPartner} onChange={(e) => setCourierPartner(e.target.value)}>
                  <option value="delhivery">Delhivery</option>
                  <option value="ekart">Ekart</option>
                  <option value="xpressbees">Xpressbees</option>
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm" fontWeight="600">
                  Select CSV File
                </FormLabel>
                <Input type="file" accept=".csv" onChange={handleCsvFileChange} p={1} />
                {csvFile && (
                  <Text fontSize="xs" color="green.500" mt={2}>
                    ✓ {csvFile.name}
                  </Text>
                )}
              </FormControl>

              <Box bg="blue.50" p={3} borderRadius="md" fontSize="xs">
                <Text fontWeight="600" mb={1}>
                  📝 Instructions:
                </Text>
                <Text>1. Login to your courier dashboard</Text>
                <Text>2. Navigate to Reports → COD Settlement</Text>
                <Text>3. Select date range and download CSV</Text>
                <Text>4. Upload the CSV file here</Text>
                <Text mt={1} color="gray.600">
                  Tip: Use the template if your courier export format varies.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCsvUploadClose}>
              Cancel
            </Button>
            <Button
              colorScheme="purple"
              onClick={handleUploadCsv}
              isLoading={previewCsvMutation.isPending}
            >
              Upload & Preview
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* CSV Review Modal */}
      <Modal isOpen={isCsvReviewOpen} onClose={onCsvReviewClose} size="6xl">
        <ModalOverlay />
        <ModalContent maxW="90vw">
          <ModalHeader>Review Settlement Data</ModalHeader>
          <ModalCloseButton />
          <ModalBody maxH="70vh" overflowY="auto">
            {csvPreviewData && (
              <VStack spacing={4} align="stretch">
                {/* Summary Cards */}
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                  <Box
                    bg="green.50"
                    p={3}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="green.200"
                  >
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Matched Orders
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.600">
                      {csvPreviewData.summary.matched}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      ₹{csvPreviewData.summary.totalMatchedAmount?.toLocaleString('en-IN')}
                    </Text>
                  </Box>

                  <Box
                    bg="orange.50"
                    p={3}
                    borderRadius="md"
                    borderWidth={1}
                    borderColor="orange.200"
                  >
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Discrepancies
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="orange.600">
                      {csvPreviewData.summary.discrepancies}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Amount mismatches
                    </Text>
                  </Box>

                  <Box bg="red.50" p={3} borderRadius="md" borderWidth={1} borderColor="red.200">
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Not Found
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="red.600">
                      {csvPreviewData.summary.notFound}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Not in system
                    </Text>
                  </Box>

                  <Box bg="gray.50" p={3} borderRadius="md" borderWidth={1} borderColor="gray.200">
                    <Text fontSize="xs" color="gray.600" fontWeight="600">
                      Already Credited
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="gray.600">
                      {csvPreviewData.summary.alreadyCredited}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Previously settled
                    </Text>
                  </Box>
                </SimpleGrid>

                {/* UTR and Date Inputs */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                  <FormControl isRequired>
                    <FormLabel fontSize="sm" fontWeight="600">
                      UTR / Transaction Number
                    </FormLabel>
                    <Input
                      value={utrNumber}
                      onChange={(e) => setUtrNumber(e.target.value)}
                      placeholder="Enter UTR/Reference number"
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Settlement Date
                    </FormLabel>
                    <Input
                      type="date"
                      value={settlementDate}
                      onChange={(e) => setSettlementDate(e.target.value)}
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel fontSize="sm" fontWeight="600">
                      Settlement Notes
                    </FormLabel>
                    <Input
                      value={settlementNotes}
                      onChange={(e) => setSettlementNotes(e.target.value)}
                      placeholder="Optional settlement notes"
                    />
                  </FormControl>
                </SimpleGrid>

                {csvPreviewData.summary.errors > 0 && (
                  <Alert status="warning" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">Rows with parsing issues detected</AlertTitle>
                      <AlertDescription fontSize="xs">
                        {csvPreviewData.summary.errors} row(s) have missing/invalid data. Review the
                        "Errors" tab before final confirmation.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {!hasCreditableRows && (csvPreviewData.summary.notFound > 0 || csvPreviewData.summary.alreadyCredited > 0) && (
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Box>
                      <AlertTitle fontSize="sm">No creditable rows found</AlertTitle>
                      <AlertDescription fontSize="xs">
                        All rows are currently either not found in your remittance records or already credited.
                        Check AWB/order mapping in the "Not Found" tab, then retry.
                      </AlertDescription>
                    </Box>
                  </Alert>
                )}

                {/* Tabs for different categories */}
                <Tabs index={reviewTabIndex} onChange={setReviewTabIndex}>
                  <TabList>
                    <Tab>Matched ({csvPreviewData.results.matched.length}) ✅</Tab>
                    <Tab>Discrepancies ({csvPreviewData.results.discrepancies.length}) ⚠️</Tab>
                    <Tab>Not Found ({csvPreviewData.results.notFound.length}) ❌</Tab>
                    <Tab>Already Credited ({csvPreviewData.results.alreadyCredited.length})</Tab>
                    <Tab>Errors ({csvPreviewData.results.errors.length})</Tab>
                  </TabList>

                  <TabPanels>
                    {/* Matched Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.matched.length > 0 ? (
                        <>
                          <Flex mb={2} align="center" gap={2}>
                            <Checkbox
                              isChecked={
                                csvPreviewData.results.matched.length > 0 &&
                                csvPreviewData.results.matched.every((item) =>
                                  selectedForCredit.includes(item.remittanceId),
                                )
                              }
                              onChange={() => handleSelectAll(csvPreviewData.results.matched)}
                            >
                              <Text fontSize="sm" fontWeight="600">
                                Select All Matched
                              </Text>
                            </Checkbox>
                            <Text fontSize="xs" color="gray.500">
                              ({selectedForCredit.length} selected)
                            </Text>
                          </Flex>
                          <Box overflowX="auto">
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  <Th>Select</Th>
                                  <Th>Order #</Th>
                                  <Th>AWB</Th>
                                  <Th>Courier Amount</Th>
                                  <Th>Our Amount</Th>
                                  <Th>Difference</Th>
                                  <Th>Status</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {csvPreviewData.results.matched.map((item) => (
                                  <Tr key={item.remittanceId}>
                                    <Td>
                                      <Checkbox
                                        isChecked={selectedForCredit.includes(item.remittanceId)}
                                        onChange={() => handleToggleSelect(item.remittanceId)}
                                      />
                                    </Td>
                                    <Td fontSize="xs">{item.orderNumber}</Td>
                                    <Td fontSize="xs">{item.awb}</Td>
                                    <Td fontSize="xs" fontWeight="600">
                                      <Input
                                        size="xs"
                                        type="number"
                                        step="0.01"
                                        value={settlementAmountEdits[item.remittanceId] ?? ''}
                                        onChange={(e) => handleEditedAmountChange(item.remittanceId, e.target.value)}
                                      />
                                    </Td>
                                    <Td fontSize="xs">
                                      ₹{item.ourAmount?.toLocaleString('en-IN')}
                                    </Td>
                                    <Td fontSize="xs" color="green.600">
                                      ₹{Math.abs(getEditedAmount(item) - toAmount(item.ourAmount)).toFixed(2)}
                                    </Td>
                                    <Td>
                                      <StatusBadge status="MATCHED" type="success" />
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No matched orders
                        </Text>
                      )}
                    </TabPanel>

                    {/* Discrepancies Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.discrepancies.length > 0 ? (
                        <>
                          <Flex mb={2} align="center" gap={2}>
                            <Checkbox
                              isChecked={
                                csvPreviewData.results.discrepancies.length > 0 &&
                                csvPreviewData.results.discrepancies.every((item) =>
                                  selectedForCredit.includes(item.remittanceId),
                                )
                              }
                              onChange={() => handleSelectAll(csvPreviewData.results.discrepancies)}
                            >
                              <Text fontSize="sm" fontWeight="600">
                                Select All (Review amounts carefully!)
                              </Text>
                            </Checkbox>
                          </Flex>
                          <Box overflowX="auto">
                            <Table size="sm" variant="simple">
                              <Thead>
                                <Tr>
                                  <Th>Select</Th>
                                  <Th>Order #</Th>
                                  <Th>AWB</Th>
                                  <Th>Courier Amount</Th>
                                  <Th>Our Amount</Th>
                                  <Th>Difference</Th>
                                  <Th>Status</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {csvPreviewData.results.discrepancies.map((item) => (
                                  <Tr key={item.remittanceId} bg="orange.50">
                                    <Td>
                                      <Checkbox
                                        isChecked={selectedForCredit.includes(item.remittanceId)}
                                        onChange={() => handleToggleSelect(item.remittanceId)}
                                      />
                                    </Td>
                                    <Td fontSize="xs">{item.orderNumber}</Td>
                                    <Td fontSize="xs">{item.awb}</Td>
                                    <Td fontSize="xs" fontWeight="600" color="orange.600">
                                      <Input
                                        size="xs"
                                        type="number"
                                        step="0.01"
                                        value={settlementAmountEdits[item.remittanceId] ?? ''}
                                        onChange={(e) => handleEditedAmountChange(item.remittanceId, e.target.value)}
                                      />
                                    </Td>
                                    <Td fontSize="xs">
                                      ₹{item.ourAmount?.toLocaleString('en-IN')}
                                    </Td>
                                    <Td fontSize="xs" fontWeight="600" color="red.600">
                                      {item.difference !== null && item.difference !== undefined
                                        ? `${getEditedAmount(item) - toAmount(item.ourAmount) > 0 ? '+' : ''}₹${(
                                            getEditedAmount(item) - toAmount(item.ourAmount)
                                          ).toFixed(2)}`
                                        : 'N/A'}
                                    </Td>
                                    <Td>
                                      <StatusBadge status="MISMATCH" type="warning" />
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </Box>
                        </>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No discrepancies
                        </Text>
                      )}
                    </TabPanel>

                    {/* Not Found Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.notFound.length > 0 ? (
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>AWB</Th>
                                <Th>Order #</Th>
                                <Th>Amount</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {csvPreviewData.results.notFound.map((item, index) => (
                                <Tr key={index} bg="red.50">
                                  <Td fontSize="xs">{item.awb}</Td>
                                  <Td fontSize="xs">{item.orderNumber}</Td>
                                  <Td fontSize="xs">
                                    ₹{item.courierAmount?.toLocaleString('en-IN')}
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          All orders found in system
                        </Text>
                      )}
                    </TabPanel>

                    {/* Already Credited Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.alreadyCredited.length > 0 ? (
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>AWB</Th>
                                <Th>Order #</Th>
                                <Th>Credited At</Th>
                                <Th>Amount</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {csvPreviewData.results.alreadyCredited.map((item) => (
                                <Tr key={item.remittanceId} bg="gray.50">
                                  <Td fontSize="xs">{item.awb}</Td>
                                  <Td fontSize="xs">{item.orderNumber}</Td>
                                  <Td fontSize="xs">
                                    {new Date(item.creditedAt).toLocaleString()}
                                  </Td>
                                  <Td fontSize="xs" color="green.600">
                                    ₹{item.creditedAmount?.toLocaleString('en-IN')}
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No previously credited orders
                        </Text>
                      )}
                    </TabPanel>

                    {/* Errors Tab */}
                    <TabPanel p={0} pt={4}>
                      {csvPreviewData.results.errors.length > 0 ? (
                        <Box overflowX="auto">
                          <Table size="sm" variant="simple">
                            <Thead>
                              <Tr>
                                <Th>#</Th>
                                <Th>Error</Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {csvPreviewData.results.errors.map((item, index) => (
                                <Tr key={index} bg="red.50">
                                  <Td fontSize="xs">{index + 1}</Td>
                                  <Td fontSize="xs">{item.error || 'Invalid row data'}</Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      ) : (
                        <Text color="gray.500" fontSize="sm">
                          No parse errors found
                        </Text>
                      )}
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter bg="gray.50" borderTopWidth={1}>
            <HStack spacing={3} width="100%" justify="space-between">
              <Box>
                <Text fontSize="sm" fontWeight="600">
                  Selected: {selectedForCredit.length} orders
                </Text>
                <Text fontSize="xs" color="gray.500">
                  Total: ₹
                  {[
                    ...(csvPreviewData?.results?.matched || []),
                    ...(csvPreviewData?.results?.discrepancies || []),
                  ]
                  .filter((item) => selectedForCredit.includes(item.remittanceId))
                    .reduce((sum, item) => sum + getEditedAmount(item), 0)
                    .toLocaleString('en-IN')}
                </Text>
              </Box>
              <HStack>
                <Button variant="ghost" onClick={onCsvReviewClose}>
                  Cancel
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleConfirmCredit}
                  isLoading={confirmSettlementMutation.isPending}
                  isDisabled={selectedForCredit.length === 0 || !utrNumber}
                >
                  Confirm Credit ({selectedForCredit.length})
                </Button>
              </HStack>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

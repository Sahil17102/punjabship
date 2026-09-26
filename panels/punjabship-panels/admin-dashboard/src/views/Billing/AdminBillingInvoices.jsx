import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Switch,
  Tag,
  TagLabel,
  TagLeftIcon,
  Text,
  Textarea,
  Tooltip,
  useToast,
  VStack,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import {
  IconAdjustments,
  IconAlertCircle,
  IconAlertTriangle,
  IconArrowRight,
  IconCalculator,
  IconCalendar,
  IconCash,
  IconCircleCheck,
  IconFileTypeCsv,
  IconFileTypePdf,
  IconInfoCircle,
  IconReceipt,
  IconWallet,
} from '@tabler/icons-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import CustomDatePicker from 'components/Input/CustomDatePicker'
import { SellerAutocomplete } from 'components/Input/SellerAutocomplete'
import CustomModal from 'components/Modal/CustomModal'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAdminBillingInvoices,
  useAdminCloseInvoiceMutation,
  useAdminCodOffsetMutation,
  useAdminGenerateManualInvoice,
  useAdminRegenerateInvoiceMutation,
  useAdminResolveDisputeMutation,
  useInvoiceStatement,
} from 'hooks/useBillingInvoices'
import { useMemo, useState } from 'react'
import { adminApplyBillingPreferenceToAll, adminUpdateUserBillingPreference } from 'services/billingPreferences.service'
import {
  adminAddInvoiceAdjustment,
  adminBulkInvoiceAdjustments,
  adminResolveDispute,
  getInvoiceDisputes,
  getInvoiceOrders,
} from 'services/billingInvoices.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

export default function AdminBillingInvoices() {
  const formatDateYmdLocal = (value) => {
    if (!value) return ''
    if (typeof value === 'string') return value
    const date = value instanceof Date ? value : new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [status, setStatus] = useState('')
  const [sellerId, setSellerId] = useState('')
  const { data, isLoading } = useAdminBillingInvoices({ page, limit, status, sellerId })
  const closeMutation = useAdminCloseInvoiceMutation()
  const regenerateMutation = useAdminRegenerateInvoiceMutation()
  const codOffsetMutation = useAdminCodOffsetMutation()
  const disputeMutation = useAdminResolveDisputeMutation()
  const [codForm, setCodForm] = useState({ invoiceId: '', codRemittanceId: '', amount: '' })
  const [disputeForm, setDisputeForm] = useState({
    invoiceId: '',
    disputeId: '',
    status: 'resolved',
    resolutionNotes: '',
  })
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null)
  const [isCodModalOpen, setIsCodModalOpen] = useState(false)
  const [isAdjModalOpen, setIsAdjModalOpen] = useState(false)
  const [isOrderAdjModalOpen, setIsOrderAdjModalOpen] = useState(false)
  const [orderRows, setOrderRows] = useState([])
  const [orderAdjMap, setOrderAdjMap] = useState({})
  const [orderNotesMap, setOrderNotesMap] = useState({})
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)
  const [isResolvingAll, setIsResolvingAll] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    userId: '',
    startDate: null,
    endDate: null,
  })
  const generateInvoiceMutation = useAdminGenerateManualInvoice()
  const toast = useToast()
  const queryClient = useQueryClient()

  // Billing preferences (admin-only)
  const [billingPrefForm, setBillingPrefForm] = useState({
    userId: '',
    frequency: 'monthly',
    autoGenerate: true,
    customFrequencyDays: '',
    applyToAll: false,
  })
  const [isUpdatingBillingPref, setIsUpdatingBillingPref] = useState(false)

  const handleBillingPrefChange = (field, value) => {
    setBillingPrefForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveBillingPreferences = async () => {
    const { userId, frequency, autoGenerate, customFrequencyDays, applyToAll } = billingPrefForm

    if (!applyToAll && !userId) {
      toast({ status: 'error', title: 'Please select a seller or enable Apply to all' })
      return
    }

    if (frequency === 'custom' && !customFrequencyDays) {
      toast({ status: 'error', title: 'Please provide custom frequency (days)' })
      return
    }

    setIsUpdatingBillingPref(true)
    try {
      if (applyToAll) {
        await adminApplyBillingPreferenceToAll({
          frequency,
          autoGenerate,
          customFrequencyDays: customFrequencyDays ? Number(customFrequencyDays) : null,
        })
        toast({ status: 'success', title: 'Billing preferences applied to all users' })
      } else {
        await adminUpdateUserBillingPreference({
          userId,
          frequency,
          autoGenerate,
          customFrequencyDays: customFrequencyDays ? Number(customFrequencyDays) : null,
        })
        toast({ status: 'success', title: 'Billing preferences updated for user' })
      }
    } catch (e) {
      toast({ status: 'error', title: 'Failed to update billing preferences' })
    } finally {
      setIsUpdatingBillingPref(false)
    }
  }

  // Memoize filter values to prevent infinite loops
  const filterValues = useMemo(() => ({ sellerId, status }), [sellerId, status])

  const { data: disputesData } = useQuery({
    queryKey: ['invoice-disputes', disputeForm.invoiceId],
    queryFn: () => getInvoiceDisputes(disputeForm.invoiceId),
    enabled: !!disputeForm.invoiceId && isDisputeModalOpen,
  })

  const [adjForm, setAdjForm] = useState({ invoiceId: '', type: 'credit', amount: '', notes: '' })

  const openOrderAdjustModal = async (invoiceId) => {
    try {
      const resp = await getInvoiceOrders(invoiceId)
      setOrderRows(resp?.orders || [])
      setOrderAdjMap({})
      setOrderNotesMap({})
      setSelectedInvoiceId(invoiceId)
      setIsOrderAdjModalOpen(true)
    } catch (e) {
      toast({ status: 'error', title: 'Failed to load invoice orders' })
    }
  }

  const handleBulkAdjust = async () => {
    if (!selectedInvoiceId) return
    const rows = Object.entries(orderAdjMap)
      .map(([orderId, amount]) => ({
        orderId,
        amount: Number(amount),
        notes: orderNotesMap[orderId]?.trim() || undefined,
      }))
      .filter((r) => !!r.amount)
    if (rows.length === 0) {
      toast({ status: 'info', title: 'No adjustments to apply' })
      return
    }
    try {
      await adminBulkInvoiceAdjustments(selectedInvoiceId, rows)
      toast({ status: 'success', title: 'Adjustments applied' })
      queryClient.invalidateQueries({ queryKey: ['invoice-statement', selectedInvoiceId] })
      queryClient.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
      setIsOrderAdjModalOpen(false)
      setOrderAdjMap({})
      setOrderNotesMap({})
    } catch (e) {
      toast({ status: 'error', title: 'Failed to apply adjustments' })
    }
  }

  const handleAddAdjustment = async () => {
    if (!adjForm.invoiceId || !adjForm.type || !adjForm.amount) return
    try {
      const result = await adminAddInvoiceAdjustment(adjForm.invoiceId, {
        type: adjForm.type,
        amount: Number(adjForm.amount),
        notes: adjForm.notes,
      })
      const statement = result?.statement
      toast({
        status: 'success',
        title: 'Adjustment added',
        description: statement
          ? `Net adjustment: ${statement.additions.adjustments >= 0 ? '+' : ''}₹${Number(
              statement.additions.adjustments || 0,
            ).toFixed(2)} | Outstanding: ₹${Number(statement.outstanding || 0).toFixed(2)}`
          : undefined,
      })
      queryClient.invalidateQueries({ queryKey: ['invoice-statement', adjForm.invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
      setIsAdjModalOpen(false)
      setSelectedInvoiceId(adjForm.invoiceId)
      setIsStatementModalOpen(true)
      setAdjForm({ invoiceId: '', type: 'credit', amount: '', notes: '' })
    } catch (e) {
      toast({ status: 'error', title: 'Failed to add adjustment' })
    }
  }

  const { data: statementData, isLoading: isStatementLoading } = useInvoiceStatement(
    selectedInvoiceId,
    isStatementModalOpen && !!selectedInvoiceId,
  )

  const handleCodOffset = async () => {
    if (!codForm.invoiceId || !codForm.codRemittanceId || !codForm.amount) return
    try {
      await codOffsetMutation.mutateAsync({
        invoiceId: codForm.invoiceId,
        codRemittanceId: codForm.codRemittanceId,
        amount: Number(codForm.amount),
      })
      toast({ status: 'success', title: 'COD offset added' })
      queryClient.invalidateQueries({ queryKey: ['invoice-statement', codForm.invoiceId] })
      setCodForm({ invoiceId: '', codRemittanceId: '', amount: '' })
    } catch (e) {
      toast({ status: 'error', title: 'Failed to add COD offset' })
    }
  }

  const handleClose = async (invoiceId) => {
    try {
      await closeMutation.mutateAsync(invoiceId)
      toast({ status: 'success', title: 'Invoice closed' })
    } catch (e) {
      toast({ status: 'error', title: 'Failed to close invoice' })
    }
  }

  const handleRegenerateInvoice = async (invoiceId) => {
    const shouldProceed = window.confirm(
      'Regenerate this invoice and reset status to pending? This will rebuild invoice artifacts.',
    )
    if (!shouldProceed) return

    try {
      const result = await regenerateMutation.mutateAsync(invoiceId)
      toast({
        status: 'success',
        title: 'Invoice regenerated',
        description:
          result?.message || 'Invoice files regenerated and status reset to pending.',
      })
      setSelectedInvoiceId(invoiceId)
      setIsStatementModalOpen(true)
    } catch (e) {
      toast({
        status: 'error',
        title: e?.response?.data?.error || 'Failed to regenerate invoice',
      })
    }
  }

  const handleViewStatement = (invoiceId) => {
    setSelectedInvoiceId(invoiceId)
    setIsStatementModalOpen(true)
  }

  const handleManageDisputes = (invoiceId) => {
    setDisputeForm({ invoiceId, disputeId: '', status: 'resolved', resolutionNotes: '' })
    setIsDisputeModalOpen(true)
  }

  const handleResolveDispute = async () => {
    if (!disputeForm.disputeId || !disputeForm.status) return
    try {
      await disputeMutation.mutateAsync({
        disputeId: disputeForm.disputeId,
        status: disputeForm.status,
        resolutionNotes: disputeForm.resolutionNotes,
      })
      toast({ status: 'success', title: 'Dispute resolved' })
      queryClient.invalidateQueries({ queryKey: ['invoice-disputes', disputeForm.invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['invoice-statement', disputeForm.invoiceId] })
      queryClient.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
      setIsDisputeModalOpen(false)
      setDisputeForm({ invoiceId: '', disputeId: '', status: 'resolved', resolutionNotes: '' })
    } catch (e) {
      toast({ status: 'error', title: 'Failed to resolve dispute' })
    }
  }

  const handleResolveAllDisputes = async () => {
    if (!disputesData?.disputes?.length) return
    const openDisputes = disputesData.disputes.filter((d) => d.status === 'open')
    if (openDisputes.length === 0) {
      toast({ status: 'info', title: 'No open disputes to resolve' })
      return
    }

    setIsResolvingAll(true)
    try {
      const results = await Promise.allSettled(
        openDisputes.map((d) =>
          adminResolveDispute(d.id, { status: 'resolved', resolutionNotes: 'Bulk resolved' }),
        ),
      )

      const succeeded = results.filter((r) => r.status === 'fulfilled').length
      const failed = results.filter((r) => r.status === 'rejected').length

      if (succeeded > 0) {
        toast({
          status: 'success',
          title: `Resolved ${succeeded} dispute(s)${failed > 0 ? `, ${failed} failed` : ''}`,
        })
        queryClient.invalidateQueries({ queryKey: ['invoice-disputes', disputeForm.invoiceId] })
        queryClient.invalidateQueries({ queryKey: ['invoice-statement', disputeForm.invoiceId] })
        queryClient.invalidateQueries({ queryKey: ['admin-billing-invoices'] })
      } else {
        toast({ status: 'error', title: `Failed to resolve disputes` })
      }
    } catch (e) {
      toast({ status: 'error', title: 'Failed to resolve all disputes' })
    } finally {
      setIsResolvingAll(false)
    }
  }

  const handleGenerateInvoice = async () => {
    if (!generateForm.userId || !generateForm.startDate || !generateForm.endDate) {
      toast({ status: 'error', title: 'Please fill all fields' })
      return
    }

    // Format dates to YYYY-MM-DD
    const startDateStr = formatDateYmdLocal(generateForm.startDate)
    const endDateStr = formatDateYmdLocal(generateForm.endDate)

    if (startDateStr > endDateStr) {
      toast({ status: 'error', title: 'Start date must be before end date' })
      return
    }

    try {
      await generateInvoiceMutation.mutateAsync({
        userId: generateForm.userId,
        startDate: startDateStr,
        endDate: endDateStr,
      })
      toast({ status: 'success', title: 'Invoice generated successfully' })
      setIsGenerateModalOpen(false)
      setGenerateForm({ userId: '', startDate: null, endDate: null })
    } catch (err) {
      toast({
        status: 'error',
        title: err?.response?.data?.error || 'Failed to generate invoice',
      })
    }
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <Stack spacing={4}>
        <HStack justify="space-between" align="center">
          <Text fontSize="xl" fontWeight="bold">
            Billing Invoices
          </Text>
          <Button
            colorScheme="blue"
            leftIcon={<IconFileTypePdf size={16} />}
            onClick={() => setIsGenerateModalOpen(true)}
          >
            Generate Invoice
          </Button>
        </HStack>

        {/* Admin Billing Preferences (Accordion) */}
        <Accordion allowToggle>
          <AccordionItem borderWidth="1px" borderRadius="lg">
            <h2>
              <AccordionButton>
                <HStack flex="1" textAlign="left" spacing={2}>
                  <IconCalendar size={18} />
                  <Text fontWeight="semibold">Billing Preferences</Text>
                </HStack>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <Stack spacing={3}>
                <HStack spacing={4} align="flex-end">
                  <Box flex="1">
                    <FormLabel>Seller (for per-user setting)</FormLabel>
                    <SellerAutocomplete
                      value={billingPrefForm.userId}
                      onChange={(val) => handleBillingPrefChange('userId', val)}
                      isDisabled={billingPrefForm.applyToAll}
                    />
                  </Box>
                  <Box>
                    <FormControl display="flex" alignItems="center">
                      <HStack>
                        <FormLabel mb="0">Apply to all users</FormLabel>
                        <Switch
                          isChecked={billingPrefForm.applyToAll}
                          onChange={(e) => handleBillingPrefChange('applyToAll', e.target.checked)}
                        />
                      </HStack>
                    </FormControl>
                  </Box>
                </HStack>

                <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                  <Box>
                    <FormLabel>Frequency</FormLabel>
                    <Select
                      value={billingPrefForm.frequency}
                      onChange={(e) => handleBillingPrefChange('frequency', e.target.value)}
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="manual">Manual</option>
                      <option value="custom">Custom</option>
                    </Select>
                  </Box>
                  {billingPrefForm.frequency === 'custom' && (
                    <Box>
                      <FormLabel>Custom frequency (days)</FormLabel>
                      <Input
                        type="number"
                        value={billingPrefForm.customFrequencyDays}
                        onChange={(e) =>
                          handleBillingPrefChange('customFrequencyDays', e.target.value)
                        }
                      />
                    </Box>
                  )}
                  <Box>
                    <FormLabel>Auto-generate invoices</FormLabel>
                    <Switch
                      isChecked={billingPrefForm.autoGenerate}
                      isDisabled={billingPrefForm.frequency === 'manual'}
                      onChange={(e) => handleBillingPrefChange('autoGenerate', e.target.checked)}
                    />
                  </Box>
                </SimpleGrid>

                <HStack justify="flex-end">
                  <Button
                    leftIcon={<IconAdjustments size={16} />}
                    colorScheme="blue"
                    size="sm"
                    isLoading={isUpdatingBillingPref}
                    onClick={handleSaveBillingPreferences}
                  >
                    Save Billing Preferences
                  </Button>
                </HStack>
              </Stack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
        <TableFilters
          filters={[
            { key: 'sellerId', label: 'Seller ID', type: 'text', placeholder: 'UUID' },
            {
              key: 'status',
              label: 'Status',
              type: 'select',
              options: [
                { label: 'All', value: '' },
                { label: 'Pending', value: 'pending' },
                { label: 'Paid', value: 'paid' },
                { label: 'Disputed', value: 'disputed' },
              ],
            },
          ]}
          values={filterValues}
          onChange={(k, v) => {
            if (k === 'status') setStatus(v)
            if (k === 'sellerId') setSellerId(v)
            setPage(1)
          }}
        />

        <Box
          borderWidth="1px"
          borderColor="gray.200"
          bg="gray.50"
          borderRadius="md"
          px={4}
          py={3}
        >
          <Text fontSize="sm" fontWeight="600" mb={1}>
            Billing Flow (Recommended)
          </Text>
          <Text fontSize="xs" color="gray.700">
            1. Open <b>Statement</b> to verify outstanding and breakdown.
            {'  '}2. Use <b>Order Adjust</b> or <b>Invoice Adjust</b> for corrections.
            {'  '}3. Use <b>COD Offset (Manual)</b> only when auto-offset did not apply.
            {'  '}4. Click <b>Finalize Paid</b> only when outstanding is zero.
          </Text>
        </Box>

        {isLoading ? (
          <Spinner />
        ) : (
          <>
            <GenericTable
              title="Billing Invoices"
              sortByComponent={
                <Tooltip
                  label="COD remittances auto-apply as COD offsets to oldest pending invoice (once per remittance). Invoices auto‑mark Paid when outstanding is 0."
                  hasArrow
                >
                  <IconButton
                    aria-label="Automation info"
                    size="sm"
                    variant="ghost"
                    icon={<IconInfoCircle size={16} />}
                  />
                </Tooltip>
              }
              captions={['Invoice #', 'Seller', 'Period', 'Generated At', 'Amount', 'Status', 'Actions']}
              columnKeys={[
                'invoiceNo',
                'sellerId',
                'period',
                'generatedAt',
                'totalAmount',
                'status',
                'actions',
              ]}
              data={(data?.data || []).map((inv) => ({
                ...inv,
                period: `${new Date(inv.billingStart).toLocaleDateString()} → ${new Date(
                  inv.billingEnd,
                ).toLocaleDateString()}`,
                generatedAt: inv.createdAt,
                totalAmount: `₹${Number(inv.totalAmount).toFixed(2)}`,
                actions: (
                  <Wrap spacing={2}>
                    <IconButton
                      aria-label="Open PDF"
                      size="xs"
                      variant="outline"
                      colorScheme="red"
                      icon={<IconFileTypePdf size={16} />}
                      onClick={() => window.open(inv.pdfUrl, '_blank')}
                    />
                    <IconButton
                      aria-label="Open CSV"
                      size="xs"
                      variant="outline"
                      colorScheme="green"
                      icon={<IconFileTypeCsv size={16} />}
                      onClick={() => {
                        // Force download CSV instead of opening in new tab
                        const link = document.createElement('a')
                        link.href = inv.csvUrl
                        link.setAttribute('download', `${inv.invoiceNo || 'invoice'}.csv`)
                        link.setAttribute('target', '_blank')
                        document.body.appendChild(link)
                        link.click()
                        document.body.removeChild(link)
                      }}
                    />
                    <Tooltip
                      label="Regenerate invoice PDF/CSV and reset status to pending"
                      hasArrow
                    >
                      <WrapItem>
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="cyan"
                          onClick={() => handleRegenerateInvoice(inv.id)}
                          isLoading={regenerateMutation.isPending}
                        >
                          Regenerate & Reset
                        </Button>
                      </WrapItem>
                    </Tooltip>
                    <WrapItem>
                      <Button
                        size="xs"
                        variant="outline"
                        colorScheme="teal"
                        onClick={() => handleViewStatement(inv.id)}
                      >
                        1. Statement
                      </Button>
                    </WrapItem>

                    {inv.status !== 'paid' && (
                      <>
                        <WrapItem>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="pink"
                            onClick={() => openOrderAdjustModal(inv.id)}
                          >
                            2. Order Adjust
                          </Button>
                        </WrapItem>
                        <WrapItem>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="purple"
                            onClick={() => {
                              setAdjForm({ invoiceId: inv.id, type: 'credit', amount: '', notes: '' })
                              setIsAdjModalOpen(true)
                            }}
                          >
                            2. Invoice Adjust
                          </Button>
                        </WrapItem>
                      </>
                    )}
                    {inv.isDisputed && (
                      <WrapItem>
                        <Button
                          size="xs"
                          variant="outline"
                          colorScheme="orange"
                          onClick={() => handleManageDisputes(inv.id)}
                        >
                          Disputes
                        </Button>
                      </WrapItem>
                    )}
                    {inv.status !== 'paid' && (
                      <Tooltip
                        label="Create a manual COD offset if you need to override auto-application"
                        hasArrow
                      >
                        <WrapItem>
                          <Button
                            size="xs"
                            variant="outline"
                            colorScheme="blue"
                            onClick={() => {
                              setCodForm({ invoiceId: inv.id, codRemittanceId: '', amount: '' })
                              setIsCodModalOpen(true)
                            }}
                          >
                            3. COD Offset (Manual)
                          </Button>
                        </WrapItem>
                      </Tooltip>
                    )}
                    {inv.status !== 'paid' && (
                      <Tooltip
                        label="Invoices auto-mark as Paid when outstanding = 0. Use this only if auto-mark didn't trigger."
                        hasArrow
                      >
                        <WrapItem>
                          <Button size="xs" colorScheme="green" onClick={() => handleClose(inv.id)}>
                            4. Finalize Paid
                          </Button>
                        </WrapItem>
                      </Tooltip>
                    )}
                  </Wrap>
                ),
              }))}
              renderers={{
                sellerId: (_value, row) => (
                  <Button
                    variant="link"
                    colorScheme="blue"
                    onClick={() =>
                      window.open(`/admin/users-management/${row.sellerId}/overview`, '_blank')
                    }
                  >
                    {row.sellerName || row.sellerId}
                  </Button>
                ),
                generatedAt: (_value, row) =>
                  row.createdAt
                    ? new Date(row.createdAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-',
                period: (_value, row) => {
                  const fmt = (d) =>
                    new Date(d).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  return (
                    <HStack spacing={2} align="center">
                      <Tag size="sm" colorScheme="gray" variant="subtle">
                        <TagLeftIcon as={IconCalendar} />
                        <TagLabel>From: {fmt(row.billingStart)}</TagLabel>
                      </Tag>
                      <IconArrowRight size={14} color="#718096" />
                      <Tag size="sm" colorScheme="gray" variant="subtle">
                        <TagLeftIcon as={IconCalendar} />
                        <TagLabel>To: {fmt(row.billingEnd)}</TagLabel>
                      </Tag>
                    </HStack>
                  )
                },
              }}
              page={page}
              setPage={setPage}
              perPage={limit}
              setPerPage={setLimit}
              totalCount={data?.total || 0}
            />
          </>
        )}

        <CustomModal
          isOpen={isAdjModalOpen}
          onClose={() => setIsAdjModalOpen(false)}
          title="Add Adjustment"
          footer={
            <HStack>
              <Button variant="ghost" onClick={() => setIsAdjModalOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="purple" onClick={handleAddAdjustment}>
                Apply
              </Button>
            </HStack>
          }
        >
          <Stack spacing={3}>
            <Input placeholder="Invoice ID" value={adjForm.invoiceId} isDisabled />
            <select
              value={adjForm.type}
              onChange={(e) => setAdjForm((f) => ({ ...f, type: e.target.value }))}
              style={{ padding: 8, borderRadius: 6, border: '1px solid #e2e8f0' }}
            >
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
              <option value="waiver">Waiver</option>
              <option value="surcharge">Surcharge</option>
            </select>
            <Input
              placeholder="Amount"
              type="number"
              value={adjForm.amount}
              onChange={(e) => setAdjForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <Input
              placeholder="Notes (optional)"
              value={adjForm.notes}
              onChange={(e) => setAdjForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </Stack>
        </CustomModal>

        <CustomModal
          isOpen={isOrderAdjModalOpen}
          onClose={() => setIsOrderAdjModalOpen(false)}
          title="Adjust Orders in Invoice"
          size="2xl"
          footer={
            <HStack>
              <Button variant="ghost" onClick={() => setIsOrderAdjModalOpen(false)}>
                Close
              </Button>
              <Button colorScheme="pink" onClick={handleBulkAdjust}>
                Apply Adjustments
              </Button>
            </HStack>
          }
        >
          <Stack spacing={3}>
            <Box overflowX="auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ borderBottom: '1px solid #eee', textAlign: 'left', padding: 6 }}>
                      Order #
                    </th>
                    <th style={{ borderBottom: '1px solid #eee', textAlign: 'left', padding: 6 }}>
                      AWB
                    </th>
                    <th style={{ borderBottom: '1px solid #eee', textAlign: 'right', padding: 6 }}>
                      Freight
                    </th>
                    <th style={{ borderBottom: '1px solid #eee', textAlign: 'right', padding: 6 }}>
                      COD
                    </th>
                    <th style={{ borderBottom: '1px solid #eee', textAlign: 'right', padding: 6 }}>
                      Adj (+/-)
                    </th>
                    <th style={{ borderBottom: '1px solid #eee', textAlign: 'left', padding: 6 }}>
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orderRows.map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: 6 }}>{r.order_number}</td>
                      <td style={{ padding: 6 }}>{r.awb_number || '-'}</td>
                      <td style={{ padding: 6, textAlign: 'right' }}>
                        ₹{Number(r.freight_charges || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: 6, textAlign: 'right' }}>
                        ₹{Number(r.cod_charges || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: 6, textAlign: 'right' }}>
                        <Input
                          placeholder="0"
                          value={orderAdjMap[r.id] || ''}
                          onChange={(e) =>
                            setOrderAdjMap((m) => ({ ...m, [r.id]: e.target.value }))
                          }
                        />
                      </td>
                      <td style={{ padding: 6 }}>
                        <Input
                          placeholder="Adjustment notes (optional)"
                          size="sm"
                          value={orderNotesMap[r.id] || ''}
                          onChange={(e) =>
                            setOrderNotesMap((m) => ({ ...m, [r.id]: e.target.value }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Stack>
        </CustomModal>

        <CustomModal
          isOpen={isCodModalOpen}
          onClose={() => setIsCodModalOpen(false)}
          title="Add COD Offset"
          footer={
            <HStack>
              <Button variant="ghost" onClick={() => setIsCodModalOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleCodOffset}
                isLoading={codOffsetMutation.isPending}
              >
                Apply
              </Button>
            </HStack>
          }
        >
          <Stack spacing={3}>
            <Input placeholder="Invoice ID" value={codForm.invoiceId} isDisabled />
            <Input
              placeholder="COD Remittance ID"
              value={codForm.codRemittanceId}
              onChange={(e) => setCodForm((f) => ({ ...f, codRemittanceId: e.target.value }))}
            />
            <Input
              placeholder="Amount"
              type="number"
              value={codForm.amount}
              onChange={(e) => setCodForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </Stack>
        </CustomModal>

        <CustomModal
          isOpen={isDisputeModalOpen}
          onClose={() => setIsDisputeModalOpen(false)}
          title="Manage Disputes"
          size="xl"
          footer={
            <HStack>
              <Button variant="ghost" onClick={() => setIsDisputeModalOpen(false)}>
                Close
              </Button>
              <Button
                colorScheme="purple"
                variant="outline"
                onClick={handleResolveAllDisputes}
                isLoading={isResolvingAll}
                isDisabled={!disputesData?.disputes?.some((d) => d.status === 'open')}
              >
                Mark All Resolved
              </Button>
              {disputeForm.disputeId && (
                <Button
                  colorScheme="blue"
                  onClick={handleResolveDispute}
                  isLoading={disputeMutation.isPending}
                >
                  Resolve
                </Button>
              )}
            </HStack>
          }
        >
          <Stack spacing={4}>
            {disputesData?.disputes?.length === 0 ? (
              <Text color="gray.500">No disputes for this invoice</Text>
            ) : (
              disputesData?.disputes?.map((dispute) => (
                <Box key={dispute.id} p={4} borderWidth="1px" borderRadius="md">
                  <Stack spacing={2}>
                    <Text fontWeight="600">{dispute.subject}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {dispute.details}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      Status: {dispute.status}
                    </Text>
                    {dispute.lineItemRef && (
                      <Text fontSize="xs" color="gray.500">
                        Line Item: {dispute.lineItemRef}
                      </Text>
                    )}
                    {dispute.status === 'open' && (
                      <HStack>
                        <Button
                          size="sm"
                          colorScheme="green"
                          onClick={() =>
                            setDisputeForm((f) => ({
                              ...f,
                              disputeId: dispute.id,
                              status: 'resolved',
                            }))
                          }
                        >
                          Mark Resolved
                        </Button>
                        <Button
                          size="sm"
                          colorScheme="red"
                          onClick={() =>
                            setDisputeForm((f) => ({
                              ...f,
                              disputeId: dispute.id,
                              status: 'rejected',
                            }))
                          }
                        >
                          Reject
                        </Button>
                      </HStack>
                    )}
                    {disputeForm.disputeId === dispute.id && (
                      <FormControl>
                        <FormLabel>Resolution Notes</FormLabel>
                        <Textarea
                          value={disputeForm.resolutionNotes}
                          onChange={(e) =>
                            setDisputeForm((f) => ({ ...f, resolutionNotes: e.target.value }))
                          }
                          placeholder="Enter resolution notes..."
                        />
                      </FormControl>
                    )}
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        </CustomModal>

        <CustomModal
          isOpen={isStatementModalOpen}
          onClose={() => {
            setIsStatementModalOpen(false)
            setSelectedInvoiceId(null)
          }}
          title={`Invoice Statement ${statementData?.invoiceNo || ''}`}
          size="2xl"
          footer={
            <Button
              variant="ghost"
              onClick={() => {
                setIsStatementModalOpen(false)
                setSelectedInvoiceId(null)
              }}
            >
              Close
            </Button>
          }
        >
          {isStatementLoading ? (
            <Flex justify="center" py={8}>
              <Spinner size="lg" />
            </Flex>
          ) : statementData ? (
            <Stack spacing={4}>
              {/* Invoice Details */}
              <Box
                p={5}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                shadow="sm"
              >
                <HStack mb={3} align="center">
                  <IconReceipt size={20} color="var(--chakra-colors-blue-500)" />
                  <Text fontWeight="600" fontSize="md">
                    Invoice Details
                  </Text>
                </HStack>
                <Divider mb={3} />
                <SimpleGrid columns={2} spacing={3}>
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Invoice Number
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      {statementData.invoiceNo}
                    </Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Status
                    </Text>
                    <Tag
                      size="sm"
                      colorScheme={
                        statementData.status === 'paid'
                          ? 'green'
                          : statementData.status === 'pending'
                          ? 'yellow'
                          : 'red'
                      }
                    >
                      {statementData.status.toUpperCase()}
                    </Tag>
                  </Box>
                  <Box gridColumn="span 2">
                    <Text fontSize="xs" color="gray.500" mb={1}>
                      Billing Period
                    </Text>
                    <Text fontSize="sm" fontWeight="500">
                      {new Date(statementData.period.from).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      →{' '}
                      {new Date(statementData.period.to).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </Box>
                </SimpleGrid>
              </Box>

              {/* Totals */}
              <Box
                p={5}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="lg"
                bg="white"
                shadow="sm"
              >
                <HStack mb={3} align="center">
                  <IconCalculator size={20} color="var(--chakra-colors-purple-500)" />
                  <Text fontWeight="600" fontSize="md">
                    Totals
                  </Text>
                </HStack>
                <Divider mb={3} />
                <Stack spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Taxable Value:
                    </Text>
                    <Text fontSize="sm" fontWeight="600">
                      ₹{statementData.totals.taxableValue.toFixed(2)}
                    </Text>
                  </HStack>
                  {statementData.totals.taxBreakup.cgst > 0 && (
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        CGST:
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        ₹{statementData.totals.taxBreakup.cgst.toFixed(2)}
                      </Text>
                    </HStack>
                  )}
                  {statementData.totals.taxBreakup.sgst > 0 && (
                    <HStack justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        SGST:
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        ₹{statementData.totals.taxBreakup.sgst.toFixed(2)}
                      </Text>
                    </HStack>
                  )}
                  <Divider />
                  <HStack justify="space-between">
                    <Text fontSize="sm" fontWeight="600">
                      Net Payable:
                    </Text>
                    <Text fontSize="md" fontWeight="700" color="blue.600">
                      ₹{statementData.totals.netPayable.toFixed(2)}
                    </Text>
                  </HStack>
                </Stack>
              </Box>

              {/* Adjustments */}
              {(statementData.additions.adjustments !== 0 ||
                statementData.additions.credits > 0 ||
                statementData.additions.waivers > 0 ||
                statementData.additions.debits > 0 ||
                statementData.additions.surcharges > 0) && (
                <Box
                  p={5}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="white"
                  shadow="sm"
                >
                  <HStack mb={3} align="center">
                    <IconAdjustments size={20} color="var(--chakra-colors-orange-500)" />
                    <Text fontWeight="600" fontSize="md">
                      Adjustments
                    </Text>
                  </HStack>
                  <Divider mb={3} />
                  <Stack spacing={2}>
                    {statementData.additions.credits > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Credits:
                        </Text>
                        <Text fontSize="sm" fontWeight="600" color="green.600">
                          -₹{statementData.additions.credits.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    {statementData.additions.waivers > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Waivers:
                        </Text>
                        <Text fontSize="sm" fontWeight="600" color="green.600">
                          -₹{statementData.additions.waivers.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    {statementData.additions.debits > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Debits:
                        </Text>
                        <Text fontSize="sm" fontWeight="600" color="red.600">
                          +₹{statementData.additions.debits.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    {statementData.additions.surcharges > 0 && (
                      <HStack justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          Surcharges:
                        </Text>
                        <Text fontSize="sm" fontWeight="600" color="red.600">
                          +₹{statementData.additions.surcharges.toFixed(2)}
                        </Text>
                      </HStack>
                    )}
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="600">
                        Net Adjustment:
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight="700"
                        color={statementData.additions.adjustments >= 0 ? 'red.600' : 'green.600'}
                      >
                        {statementData.additions.adjustments >= 0 ? '+' : ''}₹
                        {statementData.additions.adjustments.toFixed(2)}
                      </Text>
                    </HStack>
                  </Stack>
                </Box>
              )}

              {/* Payments */}
              {statementData.payments.received > 0 && (
                <Box
                  p={5}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="white"
                  shadow="sm"
                >
                  <HStack mb={3} align="center">
                    <IconWallet size={20} color="var(--chakra-colors-green-500)" />
                    <Text fontWeight="600" fontSize="md">
                      Payments
                    </Text>
                  </HStack>
                  <Divider mb={3} />
                  <Stack spacing={2}>
                    {statementData.payments.breakdown.map((payment, idx) => (
                      <HStack key={idx} justify="space-between">
                        <Text fontSize="sm" color="gray.600" textTransform="capitalize">
                          {payment.method}:
                        </Text>
                        <Text fontSize="sm" fontWeight="600">
                          ₹{payment.amount.toFixed(2)}
                        </Text>
                      </HStack>
                    ))}
                    <Divider />
                    <HStack justify="space-between">
                      <Text fontSize="sm" fontWeight="600">
                        Total Received:
                      </Text>
                      <Text fontSize="md" fontWeight="700" color="green.600">
                        ₹{statementData.payments.received.toFixed(2)}
                      </Text>
                    </HStack>
                  </Stack>
                </Box>
              )}

              {/* COD Offsets */}
              {statementData.offsets.codOffsets > 0 && (
                <Box
                  p={5}
                  borderWidth="1px"
                  borderColor="gray.200"
                  borderRadius="lg"
                  bg="white"
                  shadow="sm"
                >
                  <HStack mb={3} align="center">
                    <IconCash size={20} color="var(--chakra-colors-teal-500)" />
                    <Text fontWeight="600" fontSize="md">
                      COD Offsets
                    </Text>
                  </HStack>
                  <Divider mb={3} />
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="gray.600">
                      Total Applied:
                    </Text>
                    <Text fontSize="md" fontWeight="700" color="teal.600">
                      ₹{statementData.offsets.codOffsets.toFixed(2)}
                    </Text>
                  </HStack>
                </Box>
              )}

              {/* Outstanding */}
              <Box
                p={5}
                borderWidth="2px"
                borderColor={statementData.outstanding === 0 ? 'green.300' : 'orange.300'}
                borderRadius="lg"
                bg={statementData.outstanding === 0 ? 'green.50' : 'orange.50'}
                shadow="md"
              >
                <HStack justify="space-between" align="center">
                  <VStack align="start" spacing={1}>
                    <Text fontSize="xs" color="gray.600" fontWeight="500">
                      Outstanding Amount
                    </Text>
                    <Text
                      fontSize="2xl"
                      fontWeight="700"
                      color={statementData.outstanding === 0 ? 'green.700' : 'orange.700'}
                    >
                      ₹{statementData.outstanding.toFixed(2)}
                    </Text>
                  </VStack>
                  {statementData.outstanding === 0 ? (
                    <IconCircleCheck size={32} color="var(--chakra-colors-green-500)" />
                  ) : (
                    <IconAlertCircle size={32} color="var(--chakra-colors-orange-500)" />
                  )}
                </HStack>
              </Box>

              {/* Disputes */}
              {statementData.disputes.length > 0 && (
                <Box
                  p={5}
                  borderWidth="1px"
                  borderColor="red.200"
                  borderRadius="lg"
                  bg="red.50"
                  shadow="sm"
                >
                  <HStack mb={3} align="center">
                    <IconAlertTriangle size={20} color="var(--chakra-colors-red-500)" />
                    <Text fontWeight="600" fontSize="md" color="red.700">
                      Disputes ({statementData.disputes.length})
                    </Text>
                  </HStack>
                  <Divider mb={3} borderColor="red.200" />
                  <Stack spacing={2}>
                    {statementData.disputes.map((dispute) => (
                      <HStack key={dispute.id} justify="space-between">
                        <Text fontSize="sm" color="gray.700">
                          {dispute.subject}
                        </Text>
                        <Tag
                          size="sm"
                          colorScheme={
                            dispute.status === 'resolved'
                              ? 'green'
                              : dispute.status === 'rejected'
                              ? 'gray'
                              : 'red'
                          }
                        >
                          {dispute.status.toUpperCase()}
                        </Tag>
                      </HStack>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : (
            <Flex justify="center" py={8}>
              <Text color="red.500">Failed to load statement</Text>
            </Flex>
          )}
        </CustomModal>

        <CustomModal
          isOpen={isGenerateModalOpen}
          onClose={() => {
            setIsGenerateModalOpen(false)
            setGenerateForm({ userId: '', startDate: null, endDate: null })
          }}
          title="Generate Invoice"
          size="md"
          footer={
            <HStack>
              <Button
                variant="outline"
                onClick={() => {
                  setIsGenerateModalOpen(false)
                  setGenerateForm({ userId: '', startDate: null, endDate: null })
                }}
                isDisabled={generateInvoiceMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleGenerateInvoice}
                isLoading={generateInvoiceMutation.isLoading}
                loadingText="Generating..."
                isDisabled={
                  generateInvoiceMutation.isLoading ||
                  !generateForm.userId ||
                  !generateForm.startDate ||
                  !generateForm.endDate ||
                  (generateForm.startDate &&
                    generateForm.endDate &&
                    generateForm.startDate > generateForm.endDate)
                }
              >
                Generate Invoice
              </Button>
            </HStack>
          }
        >
          <Stack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Seller</FormLabel>
              <SellerAutocomplete
                value={generateForm.userId}
                onChange={(userId) => setGenerateForm({ ...generateForm, userId })}
                placeholder="Search seller by name..."
                isRequired
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Start Date</FormLabel>
              <CustomDatePicker
                selectedDate={generateForm.startDate}
                onChange={(date) => setGenerateForm({ ...generateForm, startDate: date })}
                maxDate={generateForm.endDate || new Date().toISOString().split('T')[0]}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>End Date</FormLabel>
              <CustomDatePicker
                selectedDate={generateForm.endDate}
                onChange={(date) => setGenerateForm({ ...generateForm, endDate: date })}
                minDate={
                  generateForm.startDate
                    ? generateForm.startDate instanceof Date
                      ? generateForm.startDate.toISOString().split('T')[0]
                      : generateForm.startDate
                    : undefined
                }
                maxDate={new Date().toISOString().split('T')[0]}
              />
            </FormControl>
            <Text fontSize="sm" color="gray.500">
              Select a user ID and date range to generate an invoice for all orders within that
              period. Only orders with status "Pickup Initiated" will be included.
            </Text>
          </Stack>
        </CustomModal>
      </Stack>
    </Box>
  )
}

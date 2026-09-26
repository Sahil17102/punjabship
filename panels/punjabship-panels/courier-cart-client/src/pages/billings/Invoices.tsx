/* eslint-disable @typescript-eslint/no-explicit-any */
import { Alert, Button, Chip, Divider, IconButton, Stack, Typography, Box } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FaCheckCircle, FaExclamationTriangle, FaFileCsv, FaFilePdf } from 'react-icons/fa'
import { FaListUl, FaReceipt } from 'react-icons/fa6'
import type { BillingInvoice, InvoiceStatement } from '../../api/invoice.api'
import { getInvoiceStatement } from '../../api/invoice.api'
import { FilterBar } from '../../components/FilterBar'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import CustomInput from '../../components/UI/inputs/CustomInput'
import CustomDialog from '../../components/UI/modal/CustomModal'
import type { Column } from '../../components/UI/table/DataTable'
import DataTable from '../../components/UI/table/DataTable'
import TableSkeleton from '../../components/UI/table/TableSkeleton'
import { toast } from '../../components/UI/Toast'
import { usePresignedDownloadMutation } from '../../hooks/Uploads/usePresignedDownloadUrls'
import {
  useAcceptCredits,
  useGenerateManualInvoice,
  useInvoices,
  useRaiseDispute,
  useRecordPayment,
} from '../../hooks/useInvoices'

const formatDate = (d?: string | Date) =>
  d
    ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'

const statusColor = (s?: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  const status = String(s || '').toLowerCase()
  if (status === 'paid') return 'success'
  if (status === 'pending') return 'warning'
  if (status === 'disputed') return 'error'
  return 'default'
}

const isHttpUrl = (s?: string) => !!s && /^https?:\/\//i.test(s)

const Invoices = () => {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState({})
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [disputeForm, setDisputeForm] = useState({ subject: '', details: '', lineItemRef: '' })
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false)
  const [isDisputesListOpen, setIsDisputesListOpen] = useState(false)
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false)

  const { data, isLoading } = useInvoices(page, rowsPerPage, filters)
  const presignMutation = usePresignedDownloadMutation()
  const raiseDisputeMutation = useRaiseDispute()
  const recordPaymentMutation = useRecordPayment()
  const acceptCreditsMutation = useAcceptCredits()
  const [paymentForm, setPaymentForm] = useState({
    method: 'wallet' as const,
    amount: '',
    notes: '',
  })
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [generateForm, setGenerateForm] = useState({ startDate: '', endDate: '' })
  const generateInvoiceMutation = useGenerateManualInvoice()

  const { data: statementData, isLoading: loadingStatement } = useQuery<
    InvoiceStatement | undefined
  >({
    queryKey: ['invoice-statement', selectedInvoiceId, isDisputesListOpen || isStatementModalOpen],
    queryFn: async () => {
      if (!selectedInvoiceId || (!isDisputesListOpen && !isStatementModalOpen)) return undefined
      return await getInvoiceStatement(selectedInvoiceId)
    },
    enabled: !!selectedInvoiceId && (isDisputesListOpen || isStatementModalOpen),
  })

  // Helper to extract filename from URL or key, removing query parameters
  const extractFilename = (urlOrKey: string, defaultName = 'invoice.csv'): string => {
    try {
      // Remove query parameters and hash from the string first
      const withoutQuery = urlOrKey.split('?')[0].split('#')[0]

      // If it looks like a URL, try to parse it
      if (withoutQuery.startsWith('http://') || withoutQuery.startsWith('https://')) {
        try {
          const url = new URL(withoutQuery)
          const pathname = url.pathname
          const filename = pathname.split('/').pop() || defaultName
          return filename || defaultName
        } catch {
          // If URL parsing fails, extract from path-like string
          const parts = withoutQuery.split('/')
          const lastPart = parts[parts.length - 1] || defaultName
          return lastPart || defaultName
        }
      }

      // For keys (not full URLs), get the last part after the last slash
      const parts = withoutQuery.split('/')
      const filename = parts[parts.length - 1] || defaultName
      return filename || defaultName
    } catch {
      // Ultimate fallback: just take everything after last slash and before first ?
      const clean = urlOrKey.split('?')[0]
      const parts = clean.split('/')
      return parts[parts.length - 1] || defaultName
    }
  }

  const handleDownload = async (urlOrKey?: string, isCsv = false) => {
    if (!urlOrKey) return
    try {
      // For CSV files, ALWAYS fetch as blob to ensure proper download from R2
      if (isCsv) {
        let downloadUrl = urlOrKey

        // If it's not already a URL, get presigned URL first
        if (!isHttpUrl(urlOrKey)) {
          const result = await presignMutation.mutateAsync({ keys: [urlOrKey] })
          downloadUrl = result?.[0] || ''
          if (!downloadUrl) throw new Error('No signed URL returned')
        }

        // Fetch the file as blob from R2
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            Accept: 'text/csv,application/csv,*/*',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.statusText}`)
        }

        const blob = await response.blob()
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = extractFilename(urlOrKey, 'invoice.csv') // Use original key/url for filename extraction
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Clean up the blob URL after a delay to ensure download starts
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100)
        return
      }

      // For PDF files
      if (isHttpUrl(urlOrKey)) {
        window.open(urlOrKey, '_blank', 'noopener,noreferrer')
        return
      }

      const result = await presignMutation.mutateAsync({ keys: [urlOrKey] })
      const signedUrl = result?.[0]
      if (!signedUrl) throw new Error('No signed URL returned')

      const link = document.createElement('a')
      link.href = signedUrl
      link.download = extractFilename(urlOrKey, 'invoice.pdf')
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Failed to download invoice:', err)
      toast.open({
        message: 'Failed to download file. Please try again.',
        severity: 'error',
      })
    }
  }

  const handleOpenDispute = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setDisputeForm({ subject: '', details: '', lineItemRef: '' })
    setIsDisputeModalOpen(true)
  }

  const handleOpenDisputesList = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setIsDisputesListOpen(true)
  }

  const handleOpenStatement = (invoiceId: string) => {
    setSelectedInvoiceId(invoiceId)
    setIsStatementModalOpen(true)
  }

  const handlePayNow = () => {
    if (!selectedInvoiceId || !statementData) return
    setPaymentForm({ ...paymentForm, amount: statementData.outstanding.toFixed(2) })
    setIsPaymentModalOpen(true)
  }

  const handleAcceptCredits = async () => {
    if (!selectedInvoiceId) return
    try {
      await acceptCreditsMutation.mutateAsync(selectedInvoiceId)
      toast.open({
        message: 'Credits/waivers accepted and wallet credited! ✅',
        severity: 'success',
      })
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.error || 'Failed to accept credits',
        severity: 'error',
      })
      console.error('Failed to accept credits:', err)
    }
  }

  const handleSubmitPayment = async () => {
    if (!selectedInvoiceId || !paymentForm.amount) return
    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: selectedInvoiceId,
        payload: {
          method: 'wallet',
          amount: Number(paymentForm.amount),
          notes: paymentForm.notes || undefined,
        },
      })
      setIsPaymentModalOpen(false)
      setPaymentForm({ method: 'wallet', amount: '', notes: '' })
      toast.open({ message: 'Payment recorded successfully! ✅', severity: 'success' })
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.error || 'Failed to record payment',
        severity: 'error',
      })
      console.error('Failed to record payment:', err)
    }
  }

  const handleSubmitDispute = async () => {
    if (!selectedInvoiceId || !disputeForm.subject || !disputeForm.details) return

    try {
      await raiseDisputeMutation.mutateAsync({
        invoiceId: selectedInvoiceId,
        payload: {
          subject: disputeForm.subject,
          details: disputeForm.details,
          lineItemRef: disputeForm.lineItemRef || undefined,
        },
      })
      setIsDisputeModalOpen(false)
      setSelectedInvoiceId(null)
      setDisputeForm({ subject: '', details: '', lineItemRef: '' })
    } catch (err) {
      console.error('Failed to raise dispute:', err)
    }
  }

  const invoiceColumns: Column<BillingInvoice & { actions?: string }>[] = [
    {
      id: 'invoiceNo',
      label: 'Invoice #',
      render: (val, row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight={600}>{val}</Typography>
          {row.isDisputed && (
            <Chip
              size="small"
              label="Disputed"
              color="error"
              icon={<FaExclamationTriangle size={12} />}
            />
          )}
        </Stack>
      ),
    },
    {
      id: 'billingStart',
      label: 'Period',
      render: (_val, row) => (
        <Typography variant="body2">
          {formatDate(row.billingStart)}{' '}
          <Typography component="span" color="text.secondary">
            {' '}
            →{' '}
          </Typography>
          {formatDate(row.billingEnd)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      render: (val) => (
        <Chip size="small" label={String(val).toUpperCase()} color={statusColor(val)} />
      ),
    },
    {
      id: 'totalAmount',
      label: 'Amount',
      align: 'right',
      render: (val) => `₹${Number(val)?.toFixed(2)}`,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      render: (_val, row) => (
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDownload(row.pdfUrl)}
            disabled={presignMutation.isPending}
          >
            <FaFilePdf />
          </IconButton>
          <IconButton
            size="small"
            color="success"
            onClick={() => handleDownload(row.csvUrl, true)}
            disabled={presignMutation.isPending}
          >
            <FaFileCsv />
          </IconButton>
          <IconButton
            size="small"
            color="info"
            onClick={() => handleOpenStatement(row.id)}
            title="View Statement"
          >
            <FaReceipt />
          </IconButton>
          <IconButton
            size="small"
            color="warning"
            onClick={() => handleOpenDispute(row.id)}
            title="Raise Dispute"
          >
            <FaExclamationTriangle />
          </IconButton>
          {row.isDisputed && (
            <IconButton
              size="small"
              color="primary"
              onClick={() => handleOpenDisputesList(row.id)}
              title="View Disputes"
            >
              <FaListUl />
            </IconButton>
          )}
        </Stack>
      ),
    },
  ]

  const handleGenerateInvoice = async () => {
    if (!generateForm.startDate || !generateForm.endDate) {
      toast.open({ message: 'Please select both start and end dates', severity: 'error' })
      return
    }

    try {
      await generateInvoiceMutation.mutateAsync({
        startDate: generateForm.startDate,
        endDate: generateForm.endDate,
      })
      toast.open({ message: 'Invoice generated successfully', severity: 'success' })
      setIsGenerateModalOpen(false)
      setGenerateForm({ startDate: '', endDate: '' })
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.error || 'Failed to generate invoice',
        severity: 'error',
      })
    }
  }

  const controls = (
    <Box sx={{ px: 2 }}>
      <FilterBar
        fields={[
          {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Pending', value: 'pending' },
              { label: 'Paid', value: 'paid' },
              { label: 'Disputed', value: 'disputed' },
            ],
          },
        ]}
        defaultValues={{}}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
        mode="button"
        buttonLabel="Filters"
        appliedCount={Object.keys(filters).filter((k) => filters[k as keyof typeof filters]).length}
      />
    </Box>
  )

  const table = isLoading ? (
    <TableSkeleton />
  ) : (
    <DataTable
      title="All Invoices"
      rows={(data?.data || []).map((inv) => ({ ...inv }))}
      columns={invoiceColumns}
      pagination
      currentPage={page}
      onPageChange={(newPage) => setPage(newPage + 1)}
      onRowsPerPageChange={(val) => setRowsPerPage(val)}
      totalCount={(data?.totalPages || 0) * rowsPerPage}
      defaultRowsPerPage={rowsPerPage}
    />
  )

  return (
    <ListPageLayout
      title="Invoices"
      description="Manage and track your billing invoices"
      actions={[
        {
          label: 'Generate Invoice',
          onClick: () => setIsGenerateModalOpen(true),
          icon: <FaFilePdf />,
          variant: 'contained',
        },
      ]}
      controls={controls}
    >
      {table}

      <CustomDialog
        open={isDisputeModalOpen}
        onClose={() => {
          setIsDisputeModalOpen(false)
          setSelectedInvoiceId(null)
          setDisputeForm({ subject: '', details: '', lineItemRef: '' })
        }}
        title="Raise Invoice Dispute"
        maxWidth="md"
        footer={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsDisputeModalOpen(false)
                setSelectedInvoiceId(null)
                setDisputeForm({ subject: '', details: '', lineItemRef: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleSubmitDispute}
              disabled={
                !disputeForm.subject || !disputeForm.details || raiseDisputeMutation.isPending
              }
            >
              {raiseDisputeMutation.isPending ? 'Submitting...' : 'Submit Dispute'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={3}>
          <Typography variant="body2" color="text.secondary">
            If you notice any discrepancies in your invoice, please raise a dispute. Our team will
            review it promptly.
          </Typography>

          <CustomInput
            label="Subject"
            required
            value={disputeForm.subject}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setDisputeForm({ ...disputeForm, subject: e.target.value })
            }
            placeholder="e.g., Incorrect shipping charges"
          />

          <CustomInput
            label="Details"
            required
            multiline
            rows={4}
            value={disputeForm.details}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setDisputeForm({ ...disputeForm, details: e.target.value })
            }
            placeholder="Please provide details about the issue..."
          />

          <CustomInput
            label="Line Item Reference (Optional)"
            value={disputeForm.lineItemRef}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setDisputeForm({ ...disputeForm, lineItemRef: e.target.value })
            }
            placeholder="e.g., Order ID or AWB number if disputing a specific item"
          />
        </Stack>
      </CustomDialog>

      <CustomDialog
        open={isDisputesListOpen}
        onClose={() => {
          setIsDisputesListOpen(false)
          setSelectedInvoiceId(null)
        }}
        title="Your Disputes"
        maxWidth="sm"
      >
        {loadingStatement ? (
          <Typography>Loading...</Typography>
        ) : statementData?.disputes?.length ? (
          <Stack spacing={1}>
            {statementData.disputes.map((d) => (
              <Stack
                key={d.id}
                spacing={0.5}
                sx={{ p: 1.5, border: '1px solid #eee', borderRadius: 1 }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip
                    size="small"
                    label={d.status.toUpperCase()}
                    color={
                      d.status === 'open'
                        ? 'warning'
                        : d.status === 'resolved'
                        ? 'success'
                        : d.status === 'rejected'
                        ? 'error'
                        : 'default'
                    }
                  />
                  <Typography fontWeight={600}>{d.subject}</Typography>
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography color="text.secondary">No disputes raised yet for this invoice.</Typography>
        )}
      </CustomDialog>

      <CustomDialog
        open={isStatementModalOpen}
        onClose={() => {
          setIsStatementModalOpen(false)
          setSelectedInvoiceId(null)
        }}
        title="Invoice Statement"
        maxWidth="md"
      >
        {loadingStatement ? (
          <Typography>Loading...</Typography>
        ) : statementData ? (
          <Stack spacing={3}>
            {/* Invoice Header */}
            <Stack spacing={1}>
              <Typography variant="h6" fontWeight={600}>
                Invoice #{statementData.invoiceNo}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Period: {formatDate(statementData.period.from)} →{' '}
                {formatDate(statementData.period.to)}
              </Typography>
              <Chip
                size="small"
                label={statementData.status.toUpperCase()}
                color={statusColor(statementData.status)}
                sx={{ width: 'fit-content' }}
              />
            </Stack>

            <Divider />

            {/* Totals */}
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={600}>
                Totals
              </Typography>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Taxable Value:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  ₹{statementData.totals.taxableValue.toFixed(2)}
                </Typography>
              </Stack>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">Net Payable:</Typography>
                <Typography variant="body2" fontWeight={600}>
                  ₹{statementData.totals.netPayable.toFixed(2)}
                </Typography>
              </Stack>
            </Stack>

            {/* Adjustments Summary */}
            {statementData.additions.adjustments !== 0 && (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>
                      Adjustments
                    </Typography>
                    <Chip
                      size="small"
                      label={statementData.additions.adjustments >= 0 ? 'Amount Due' : 'Refund'}
                      color={statementData.additions.adjustments >= 0 ? 'error' : 'success'}
                      sx={{ fontSize: '0.7rem' }}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
                    {statementData.additions.adjustments >= 0
                      ? '⚠️ You need to pay this additional amount'
                      : '✅ This amount reduces what you owe'}
                  </Typography>
                  {statementData.additions.credits > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" color="success.main">
                          Credits:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Refund/Correction)
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        -₹{statementData.additions.credits.toFixed(2)}
                      </Typography>
                    </Stack>
                  )}
                  {statementData.additions.debits > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" color="error.main">
                          Debits:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Additional Charge)
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="error.main" fontWeight={600}>
                        +₹{statementData.additions.debits.toFixed(2)}
                      </Typography>
                    </Stack>
                  )}
                  {statementData.additions.waivers > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" color="success.main">
                          Waivers:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Fee Waived)
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="success.main" fontWeight={600}>
                        -₹{statementData.additions.waivers.toFixed(2)}
                      </Typography>
                    </Stack>
                  )}
                  {statementData.additions.surcharges > 0 && (
                    <Stack direction="row" justifyContent="space-between">
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2" color="error.main">
                          Surcharges:
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          (Extra Fee)
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="error.main" fontWeight={600}>
                        +₹{statementData.additions.surcharges.toFixed(2)}
                      </Typography>
                    </Stack>
                  )}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      Net Adjustment:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        statementData.additions.adjustments >= 0 ? 'error.main' : 'success.main'
                      }
                    >
                      {statementData.additions.adjustments >= 0 ? '+' : ''}₹
                      {statementData.additions.adjustments.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
              </>
            )}

            {/* Adjustment History */}
            {statementData.adjustmentHistory && statementData.adjustmentHistory.length > 0 && (
              <>
                <Divider />
                <Stack spacing={2}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Adjustment History
                  </Typography>
                  <Stack spacing={1}>
                    {statementData.adjustmentHistory.map((adj) => (
                      <Stack
                        key={adj.id}
                        spacing={0.5}
                        sx={{
                          p: 1.5,
                          border: '1px solid #eee',
                          borderRadius: 1,
                          bgcolor: '#fafafa',
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          justifyContent="space-between"
                        >
                          <Chip
                            size="small"
                            label={adj.type.toUpperCase()}
                            color={
                              adj.type === 'credit' || adj.type === 'waiver'
                                ? 'success'
                                : adj.type === 'debit' || adj.type === 'surcharge'
                                ? 'error'
                                : 'default'
                            }
                          />
                          <Typography
                            variant="body2"
                            fontWeight={600}
                            color={
                              adj.type === 'credit' || adj.type === 'waiver'
                                ? 'success.main'
                                : 'error.main'
                            }
                          >
                            {adj.type === 'credit' || adj.type === 'waiver' ? '-' : '+'}₹
                            {adj.amount.toFixed(2)}
                          </Typography>
                        </Stack>
                        {adj.reason && (
                          <Typography variant="caption" color="text.secondary">
                            {adj.reason}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(adj.createdAt)} at{' '}
                          {new Date(adj.createdAt).toLocaleTimeString('en-GB', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>
              </>
            )}

            {/* Payments */}
            {statementData.payments.received > 0 && (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Payments
                  </Typography>
                  {statementData.payments.breakdown.map((p, idx) => (
                    <Stack key={idx} direction="row" justifyContent="space-between">
                      <Typography variant="body2" textTransform="capitalize">
                        {p.method}:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{p.amount.toFixed(2)}
                      </Typography>
                    </Stack>
                  ))}
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mt: 1, pt: 1, borderTop: '1px solid #eee' }}
                  >
                    <Typography variant="body2" fontWeight={600}>
                      Total Received:
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      ₹{statementData.payments.received.toFixed(2)}
                    </Typography>
                  </Stack>
                </Stack>
              </>
            )}

            {/* COD Offsets */}
            {statementData.offsets.codOffsets > 0 && (
              <>
                <Divider />
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2">COD Offsets:</Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    -₹{statementData.offsets.codOffsets.toFixed(2)}
                  </Typography>
                </Stack>
              </>
            )}

            {/* Outstanding */}
            <Divider />
            <Stack spacing={1} sx={{ pt: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h6" fontWeight={600}>
                  Outstanding Amount:
                </Typography>
                <Typography
                  variant="h6"
                  fontWeight={600}
                  color={statementData.outstanding === 0 ? 'success.main' : 'error.main'}
                >
                  ₹{statementData.outstanding.toFixed(2)}
                </Typography>
              </Stack>
              {statementData.outstanding > 0 && (
                <Stack spacing={1} sx={{ mt: 1 }}>
                  <Typography variant="caption" color="error.main" sx={{ fontStyle: 'italic' }}>
                    ⚠️ You need to pay ₹{statementData.outstanding.toFixed(2)} to settle this
                    invoice
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={handlePayNow}
                    disabled={recordPaymentMutation.isPending}
                  >
                    {recordPaymentMutation.isPending ? 'Processing...' : 'Pay Now'}
                  </Button>
                </Stack>
              )}
              {statementData.additions.credits > 0 || statementData.additions.waivers > 0 ? (
                <Stack
                  spacing={2}
                  sx={{
                    mt: 2,
                    p: 2.5,
                    borderRadius: 2,
                    backgroundColor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.300',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <FaCheckCircle style={{ color: '#10b981', fontSize: '20px' }} />
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      Credits & Waivers Available
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    You have{' '}
                    <Typography
                      component="span"
                      variant="body2"
                      fontWeight={600}
                      color="success.main"
                    >
                      ₹
                      {(statementData.additions.credits + statementData.additions.waivers).toFixed(
                        2,
                      )}
                    </Typography>{' '}
                    in credits and waivers that can be applied to this invoice. Accept them to
                    credit your wallet.
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleAcceptCredits}
                    disabled={acceptCreditsMutation.isPending}
                    sx={{ alignSelf: 'flex-start', mt: 0.5 }}
                  >
                    {acceptCreditsMutation.isPending ? 'Processing...' : 'Accept Credits & Waivers'}
                  </Button>
                </Stack>
              ) : null}
              {statementData.outstanding === 0 && (
                <Alert
                  severity="success"
                  icon={false}
                  sx={{
                    mt: 2,
                    borderRadius: 2,
                    backgroundColor: 'success.light',
                    color: 'success.dark',
                    '& .MuiAlert-message': {
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 500,
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="body2" fontWeight={600}>
                      Invoice Fully Settled
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No payment required
                    </Typography>
                  </Stack>
                </Alert>
              )}
            </Stack>
          </Stack>
        ) : (
          <Typography color="text.secondary">Unable to load invoice statement.</Typography>
        )}
      </CustomDialog>

      <CustomDialog
        open={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false)
          setPaymentForm({ method: 'wallet', amount: '', notes: '' })
        }}
        title="Record Payment"
        maxWidth="sm"
        footer={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsPaymentModalOpen(false)
                setPaymentForm({ method: 'wallet', amount: '', notes: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitPayment}
              disabled={!paymentForm.amount || recordPaymentMutation.isPending}
            >
              {recordPaymentMutation.isPending ? 'Processing...' : 'Record Payment'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={3}>
          <CustomInput
            label="Payment Method"
            value="Wallet"
            disabled
            helperText="Payments are processed from your wallet balance"
          />
          <CustomInput
            label="Amount"
            required
            type="number"
            value={paymentForm.amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setPaymentForm({ ...paymentForm, amount: e.target.value })
            }
            placeholder="Enter payment amount"
          />
          <CustomInput
            label="Notes (Optional)"
            multiline
            rows={3}
            value={paymentForm.notes}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setPaymentForm({ ...paymentForm, notes: e.target.value })
            }
            placeholder="Additional notes about this payment"
          />
        </Stack>
      </CustomDialog>

      <CustomDialog
        open={isGenerateModalOpen}
        onClose={() => {
          setIsGenerateModalOpen(false)
          setGenerateForm({ startDate: '', endDate: '' })
        }}
        title="Generate Invoice"
        maxWidth="sm"
        footer={
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setIsGenerateModalOpen(false)
                setGenerateForm({ startDate: '', endDate: '' })
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleGenerateInvoice}
              disabled={
                !generateForm.startDate ||
                !generateForm.endDate ||
                generateInvoiceMutation.isPending
              }
            >
              {generateInvoiceMutation.isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={3}>
          <CustomInput
            label="Start Date"
            type="date"
            value={generateForm.startDate}
            onChange={(e) => setGenerateForm({ ...generateForm, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <CustomInput
            label="End Date"
            type="date"
            value={generateForm.endDate}
            onChange={(e) => setGenerateForm({ ...generateForm, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            inputProps={{
              max: new Date().toISOString().split('T')[0],
            }}
          />
          <Typography variant="caption" color="text.secondary">
            Select a date range to generate an invoice for all orders within that period. Only
            orders with status "Pickup Initiated" will be included.
          </Typography>
        </Stack>
      </CustomDialog>
    </ListPageLayout>
  )
}

export default Invoices

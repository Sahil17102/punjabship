import { Box, Button, Flex, Heading, Stack, Text, Textarea } from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import CustomModal from 'components/Modal/CustomModal'
import TableFilters from 'components/Tables/TableFilters'
import {
  useAllWeightDisputes,
  useApproveDispute,
  useRejectDispute,
} from 'hooks/useWeightReconciliation'
import { useState } from 'react'
import { FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const filterOptions = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All', value: '' },
      { label: 'Open', value: 'open' },
      { label: 'Under Review', value: 'under_review' },
      { label: 'Approved', value: 'approved' },
      { label: 'Rejected', value: 'rejected' },
      { label: 'Closed', value: 'closed' },
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

const getStatusType = (status) => {
  switch (status) {
    case 'open':
      return 'warning'
    case 'under_review':
      return 'info'
    case 'approved':
      return 'success'
    case 'rejected':
      return 'error'
    case 'closed':
      return 'neutral'
    default:
      return 'neutral'
  }
}

export default function AdminDisputeManagement() {
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [adminComment, setAdminComment] = useState('')
  const [actionType, setActionType] = useState(null) // 'approve' or 'reject'
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [filters, setFilters] = useState({})

  // Use hooks
  const { data: disputesData, isLoading } = useAllWeightDisputes({
    ...filters,
    page,
    limit: perPage,
  })

  const approveMutation = useApproveDispute()
  const rejectMutation = useRejectDispute()

  // Filter out any null/undefined items and ensure proper structure
  const disputes = (disputesData?.disputes || []).filter((item) => item && item.dispute)
  const totalCount = disputesData?.pagination?.total || 0

  const handleOpenModal = (dispute, action) => {
    console.log('🔍 Selected Dispute:', dispute)
    console.log('📎 Evidence URLs:', dispute?.dispute?.customer_evidence_urls)
    console.log('📦 Full Dispute Object:', JSON.stringify(dispute, null, 2))
    setSelectedDispute(dispute)
    setActionType(action)
    setAdminComment('')
  }

  const handleCloseModal = () => {
    setSelectedDispute(null)
    setActionType(null)
    setAdminComment('')
  }

  const handleSubmitAction = async () => {
    if (!selectedDispute || !actionType || !adminComment.trim()) return

    const disputeId = selectedDispute.dispute.id
    const data = { adminComment }

    if (actionType === 'approve') {
      await approveMutation.mutateAsync({ disputeId, data })
    } else {
      await rejectMutation.mutateAsync({ disputeId, data })
    }

    handleCloseModal()
  }

  const tableColumns = [
    'Order #',
    'User',
    'Reason',
    'Comment',
    'Claimed Weight',
    'Discrepancy',
    'Status',
    'Priority',
    'Date',
    'Actions',
  ]

  const columnKeys = [
    'order_number',
    'user',
    'reason',
    'comment',
    'claimed_weight',
    'discrepancy',
    'status',
    'priority',
    'created_at',
    'actions',
  ]

  const renderers = {
    order_number: (value, row) => row?.discrepancy?.order_number || 'N/A',
    user: (value, row) => (
      <Text fontSize="sm">{row?.user?.email || row?.user?.phone || 'N/A'}</Text>
    ),
    reason: (value, row) => <Text fontSize="sm">{row?.dispute?.dispute_reason || 'N/A'}</Text>,
    comment: (value, row) => (
      <Text fontSize="xs" noOfLines={2} maxW="200px">
        {row?.dispute?.customer_comment || 'N/A'}
      </Text>
    ),
    claimed_weight: (value, row) =>
      row?.dispute?.customer_claimed_weight
        ? `${(Number(row.dispute.customer_claimed_weight) / 1000).toFixed(3)} kg`
        : 'N/A',
    discrepancy: (value, row) =>
      row?.discrepancy?.weight_difference
        ? `${(Number(row.discrepancy.weight_difference) / 1000).toFixed(3)} kg`
        : 'N/A',
    status: (value, row) => (
      <StatusBadge
        status={row?.dispute?.status || 'unknown'}
        type={getStatusType(row?.dispute?.status)}
      />
    ),
    priority: (value, row) => (
      <StatusBadge
        status={row?.dispute?.priority || 'normal'}
        type={row?.dispute?.priority === 'high' ? 'error' : 'neutral'}
      />
    ),
    created_at: (value, row) => (
      <Text fontSize="xs" color="gray.500">
        {row?.dispute?.created_at ? new Date(row.dispute.created_at).toLocaleDateString() : 'N/A'}
      </Text>
    ),
  }

  const renderActions = (row) => {
    if (row?.dispute?.status === 'open' || row?.dispute?.status === 'under_review') {
      return (
        <Flex gap={2}>
          <Button
            size="xs"
            colorScheme="green"
            leftIcon={<FiCheckCircle />}
            onClick={() => handleOpenModal(row, 'approve')}
          >
            Approve
          </Button>
          <Button
            size="xs"
            colorScheme="red"
            leftIcon={<FiXCircle />}
            onClick={() => handleOpenModal(row, 'reject')}
          >
            Reject
          </Button>
        </Flex>
      )
    }
    return (
      <StatusBadge
        status={row?.dispute?.status || 'unknown'}
        type={getStatusType(row?.dispute?.status)}
      />
    )
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Header */}
      <Heading size="lg" color="#333369" mb={6}>
        Dispute Management
      </Heading>

      {/* Filters */}
      <TableFilters filters={filterOptions} values={filters} onApply={setFilters} />

      {/* Disputes Table */}
      <GenericTable
        title="All Disputes"
        data={disputes}
        captions={tableColumns}
        columnKeys={columnKeys}
        renderers={renderers}
        renderActions={renderActions}
        loading={isLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        paginated={true}
      />

      {/* Action Modal */}
      <CustomModal
        isOpen={!!selectedDispute}
        onClose={handleCloseModal}
        title={`${actionType === 'approve' ? 'Approve' : 'Reject'} Dispute`}
        size="lg"
        footer={
          <Flex gap={3}>
            <Button variant="ghost" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              colorScheme={actionType === 'approve' ? 'green' : 'red'}
              onClick={handleSubmitAction}
              isDisabled={!adminComment.trim()}
              isLoading={approveMutation.isPending || rejectMutation.isPending}
            >
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </Button>
          </Flex>
        }
      >
        {selectedDispute && (
          <Stack spacing={4}>
            <Box>
              <Text fontWeight="600" mb={2}>
                Order: {selectedDispute.discrepancy?.order_number}
              </Text>
              <Text fontSize="sm" color="gray.600" mb={2}>
                User: {selectedDispute.user?.email}
              </Text>
              <Text fontSize="sm" mb={4}>
                Reason: {selectedDispute.dispute.dispute_reason}
              </Text>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2}>
                Customer Comment:
              </Text>
              <Box bg="gray.50" p={3} borderRadius="md">
                <Text fontSize="sm">{selectedDispute.dispute.customer_comment}</Text>
              </Box>
            </Box>

            {/* Weight Details */}
            {selectedDispute.discrepancy && (
              <Box>
                <Text fontSize="sm" fontWeight="600" mb={2}>
                  Weight Details:
                </Text>
                <Box bg="gray.50" p={3} borderRadius="md">
                  <Flex gap={4} flexWrap="wrap">
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Declared
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        {(Number(selectedDispute.discrepancy.declared_weight) / 1000).toFixed(3)} kg
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Charged
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="red.500">
                        {(Number(selectedDispute.discrepancy.charged_weight) / 1000).toFixed(3)} kg
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Customer Claims
                      </Text>
                      <Text fontSize="sm" fontWeight="600" color="blue.500">
                        {selectedDispute.dispute.customer_claimed_weight
                          ? `${(
                              Number(selectedDispute.dispute.customer_claimed_weight) / 1000
                            ).toFixed(3)} kg`
                          : 'N/A'}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">
                        Difference
                      </Text>
                      <Text fontSize="sm" fontWeight="600">
                        {(Number(selectedDispute.discrepancy.weight_difference) / 1000).toFixed(3)}{' '}
                        kg
                      </Text>
                    </Box>
                  </Flex>
                </Box>
              </Box>
            )}

            {/* Customer Evidence */}
            {selectedDispute.dispute.customer_evidence_urls &&
              selectedDispute.dispute.customer_evidence_urls.length > 0 && (
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={2}>
                    Customer Evidence ({selectedDispute.dispute.customer_evidence_urls.length} file
                    {selectedDispute.dispute.customer_evidence_urls.length > 1 ? 's' : ''}):
                  </Text>
                  <Box bg="gray.50" p={3} borderRadius="md">
                    <Stack spacing={2}>
                      {selectedDispute.dispute.customer_evidence_urls.map((url, index) => {
                        // Extract filename from presigned URL (remove query params)
                        const urlWithoutParams = url.split('?')[0]
                        const fileName =
                          urlWithoutParams.split('/').pop() || `evidence-${index + 1}`

                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(urlWithoutParams)
                        const isVideo = /\.(mp4|webm|mov|avi)$/i.test(urlWithoutParams)
                        const isPDF = /\.pdf$/i.test(urlWithoutParams)

                        return (
                          <Box key={index} borderWidth="1px" borderRadius="md" p={2}>
                            {isImage && (
                              <Box>
                                <img
                                  src={url}
                                  alt={`Evidence ${index + 1}`}
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                  }}
                                />
                                <Button
                                  as="a"
                                  href={url}
                                  target="_blank"
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                >
                                  Open Full Size
                                </Button>
                              </Box>
                            )}

                            {isVideo && (
                              <Box>
                                <video
                                  controls
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '300px',
                                    borderRadius: '4px',
                                    marginBottom: '8px',
                                  }}
                                >
                                  <source src={url} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                                <Button
                                  as="a"
                                  href={url}
                                  target="_blank"
                                  download
                                  size="sm"
                                  colorScheme="blue"
                                  variant="outline"
                                >
                                  Download Video
                                </Button>
                              </Box>
                            )}

                            {isPDF && (
                              <Box>
                                <Flex align="center" gap={2} mb={2}>
                                  <Text fontSize="sm" fontWeight="600">
                                    📄 {fileName}
                                  </Text>
                                </Flex>
                                <Flex gap={2}>
                                  <Button
                                    as="a"
                                    href={url}
                                    target="_blank"
                                    size="sm"
                                    colorScheme="blue"
                                  >
                                    View PDF
                                  </Button>
                                  <Button
                                    as="a"
                                    href={url}
                                    download
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                  >
                                    Download
                                  </Button>
                                </Flex>
                              </Box>
                            )}

                            {!isImage && !isVideo && !isPDF && (
                              <Box>
                                <Text fontSize="sm" mb={2}>
                                  📎 {fileName}
                                </Text>
                                <Button
                                  as="a"
                                  href={url}
                                  target="_blank"
                                  download
                                  size="sm"
                                  colorScheme="blue"
                                >
                                  Download File
                                </Button>
                              </Box>
                            )}
                          </Box>
                        )
                      })}
                    </Stack>
                  </Box>
                </Box>
              )}

            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2}>
                Admin Response: <span style={{ color: 'red' }}>*</span>
              </Text>
              <Textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="Enter your response to the customer..."
                rows={4}
              />
            </Box>
          </Stack>
        )}
      </CustomModal>
    </Box>
  )
}

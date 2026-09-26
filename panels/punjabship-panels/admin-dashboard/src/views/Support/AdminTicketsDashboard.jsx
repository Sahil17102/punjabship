// components/AdminTicketDashboard.tsx

import { EmailIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  Select,
  SimpleGrid,
  Spinner,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import { IconAlertCircle, IconCheck, IconClockHour10, IconPhone, IconX } from '@tabler/icons-react'
import MetricTile from 'components/Admin/MetricTile'
import PageHeader from 'components/Admin/PageHeader'
import StatusBadge from 'components/Badge/StatusBadge'
import CustomModal from 'components/Modal/CustomModal'
import { TicketModal } from 'components/Modal/TicketModal'
import TableFilters from 'components/Tables/TableFilters'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import { useAdminTickets } from 'hooks/useTickets'
import { useUserInfo } from 'hooks/useUser'
import moment from 'moment'
import { useEffect, useState } from 'react'
import { supportCategories } from 'utils/constants'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  overdue: 'Overdue',
}

const statusIcons = {
  open: IconAlertCircle,
  in_progress: IconAlertCircle,
  resolved: IconCheck,
  closed: IconX,
  overdue: IconClockHour10,
}

const captions = ['Ticket ID', 'Due By', 'Subject', 'Status', 'Category', 'AWB']
const columnKeys = ['id', 'dueDate', 'subject', 'status', 'category', 'awbNumber']

// Helper function to get category and subcategory labels
const getCategoryLabel = (categoryKey, subcategoryKey) => {
  const category = supportCategories.find((c) => c.key === categoryKey)
  if (!category) return `${categoryKey} > ${subcategoryKey}`

  const subcategory = category.subcategories.find((s) => s.key === subcategoryKey)
  if (!subcategory) return `${category.label} > ${subcategoryKey}`

  return `${category.label} > ${subcategory.label}`
}

const renderers = {
  dueDate: (value, row) => {
    if (!value) return <Text color="gray.400">—</Text>

    const dueMoment = moment(value)
    const now = moment()
    const hoursDiff = dueMoment.diff(now, 'hours')

    let color = 'gray.700'

    const isActionableStatus = row?.status !== 'closed' && row?.status !== 'resolved'

    if (isActionableStatus && hoursDiff < 0) {
      color = 'red.500' // Overdue
    } else if (isActionableStatus && hoursDiff <= 24) {
      color = 'orange.500' // Due soon
    }

    return (
      <Text fontWeight="medium" color={color}>
        {dueMoment.format('DD MMM YYYY')}
      </Text>
    )
  },
  status: (value) => (
    <StatusBadge
      status={value}
      type={
        value === 'open'
          ? 'info'
          : value === 'closed'
          ? 'error'
          : value === 'in_progress'
          ? 'warning'
          : 'success'
      }
    />
  ),
  category: (value, row) => {
    return <Text>{getCategoryLabel(row?.category || '', row?.subcategory || '')}</Text>
  },
}
export default function AdminTicketDashboard() {
  const [page, setPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [filters, setFilters] = useState({
    status: [],
    category: '',
    awbNumber: '',
    userId: '',
  })
  const sortSelectBg = useColorModeValue('white', 'gray.700')
  const sortSelectBorder = useColorModeValue('gray.300', 'gray.600')
  const sortSelectHoverBorder = useColorModeValue('blue.500', 'blue.300')
  const [perPage, setPerPage] = useState(10) // Default to 10
  const [sortBy, setSortBy] = useState('latest')

  const { data, isLoading, error } = useAdminTickets({
    page,
    limit: perPage,
    filters: { ...filters, sortBy },
  })

  const { data: userInfo, isLoading: userLoading, error: userError } = useUserInfo(
    selectedTicket?.userId,
  )

  const {
    data: presignedUrls,
    isLoading: loadingAttachments,
    error: attachmentError,
    refetch, // <-- this should exist
  } = usePresignedDownloadUrls({
    keys: selectedTicket?.attachments || [],
    enabled: (selectedTicket?.attachments?.length || 0) > 0,
  })

  useEffect(() => {
    if ((selectedTicket?.attachments?.length || 0) > 0) {
      refetch()
    }
  }, [selectedTicket?.attachments, refetch])

  if (error) return <div>Error loading tickets</div>
  const { data: tickets = [], totalCount = 0, statusCounts = {} } = data || {}

  const handleView = (ticketId) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    setSelectedTicket(ticket)
    // setEditedStatus(ticket.status)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedTicket(null)
  }

  const handleEdit = (ticketId) => {
    setSelectedTicket(tickets.find((t) => t.id === ticketId))
    setOpenEditModal(true)
  }
  const handleStatusTileClick = (status) => {
    setFilters((current) => ({
      ...current,
      status: current.status?.length === 1 && current.status[0] === status ? [] : [status],
    }))
    setPage(1)
  }
  const handleSortChange = (event) => {
    setSortBy(event.target.value)
    setPage(1) // Reset page to 1 on sort change
  }
  const filterOptions = [
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect',
      options: [
        { label: 'Open', value: 'open' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Closed', value: 'closed' },
        { label: 'Overdue', value: 'overdue' },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: supportCategories.map((category) => ({
        label: category.label,
        value: category.key,
      })),
    },
    {
      key: 'subCategory',
      label: 'Subcategory',
      type: 'select',
      dependsOn: 'category',
      options: (filters) => {
        const selectedCategory = supportCategories.find(
          (category) => category.key === filters?.category,
        )
        return (
          selectedCategory?.subcategories.map((sub) => ({
            label: sub.label,
            value: sub.key,
          })) || []
        )
      },
    },
    {
      key: 'awbNumber',
      label: 'AWB Number',
      type: 'text',
    },
    {
      key: 'userId',
      label: 'User ID',
      type: 'text',
    },
    {
      key: 'userName',
      label: 'User Name',
      type: 'text',
    },
  ]

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <Box mb={5}>
        <PageHeader
          eyebrow="Support"
          title="Ticket operations for merchant support"
          description="Prioritise urgent conversations, work due dates with confidence and reach the right merchant context before a ticket slips."
          meta={[
            {
              label: 'Total tickets',
              value: (totalCount ?? 0).toLocaleString(),
            },
            {
              label: 'Open',
              value: (statusCounts?.open ?? 0).toLocaleString(),
            },
            {
              label: 'Overdue',
              value: (statusCounts?.overdue ?? 0).toLocaleString(),
            },
          ]}
        />
      </Box>

      <Grid
        templateColumns={{
          base: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)',
        }}
        gap={4}
        mb={6}
      >
        {Object.keys(statusLabels).map((status) => (
          <MetricTile
            key={status}
            icon={<Icon as={statusIcons[status]} h="20px" w="20px" />}
            label={statusLabels[status]}
            value={statusCounts?.[status] ?? 0}
            muted={status === 'overdue' ? 'Escalate first' : 'Live support queue'}
            accent={
              status === 'resolved' ? 'green.500' : status === 'closed' ? 'red.500' : 'brand.500'
            }
            active={filters.status?.length === 1 && filters.status[0] === status}
            onClick={() => handleStatusTileClick(status)}
          />
        ))}
      </Grid>
      <Box mb={3}>
        <TableFilters
          filters={filterOptions}
          values={filters}
          onApply={(finalFilters) => {
            setFilters(finalFilters)
            setPage(1)
          }}
          cardStyle
        />
      </Box>

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        sortByComponent={
          <FormControl width={{ base: '100%', md: '300px' }} maxW="300px">
            <FormLabel htmlFor="sort-select" fontSize="sm" color="gray.600" mb={1}>
              Sort By
            </FormLabel>
            <Select
              id="sort-select"
              value={sortBy}
              onChange={handleSortChange}
              size="sm"
              bg={sortSelectBg}
              borderColor={sortSelectBorder}
              _hover={{ borderColor: sortSelectHoverBorder }}
              _focus={{
                borderColor: sortSelectHoverBorder,
                boxShadow: '0 0 0 1px blue',
              }}
              borderRadius="md"
              transition="border-color 0.2s, box-shadow 0.2s"
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="dueSoon">Due Soon</option>
              <option value="dueLatest">Due Latest</option>
            </Select>
          </FormControl>
        }
        totalCount={totalCount ?? 0}
        perPage={perPage}
        setPerPage={setPerPage}
        title="Support Tickets"
        data={tickets}
        captions={captions}
        columnKeys={columnKeys}
        renderActions={(row) => (
          <HStack spacing={2}>
            <Button size="sm" colorScheme="blue" onClick={() => handleView(row.id)}>
              View Details
            </Button>
            <Button size="sm" colorScheme="purple" onClick={() => handleEdit(row.id)}>
              Edit
            </Button>
          </HStack>
        )}
        renderers={renderers}
      />

      {/* 🔍 Modal */}

      <CustomModal
        size="2xl"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={`Ticket #${selectedTicket?.id}`}
        footer={
          <HStack spacing={3}>
            <Button onClick={handleCloseModal} variant="ghost">
              Cancel
            </Button>
          </HStack>
        }
      >
        {selectedTicket && (
          <>
            {/* Ticket Info */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Subject
                </Heading>
                <Text>{selectedTicket.subject}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Status
                </Heading>
                <Text textTransform="capitalize">{selectedTicket.status}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Category
                </Heading>
                <Text>{selectedTicket.category}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  Sub Category
                </Heading>
                <Text>{selectedTicket.subcategory || '—'}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2}>
                  AWB Number
                </Heading>
                <Text>{selectedTicket.awbNumber || '—'}</Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2} color="green.700">
                  Created At
                </Heading>
                <Text fontWeight="medium">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </Text>
              </Box>

              <Box p={3} borderRadius="md" bg="gray.50">
                <Heading as="h4" size="sm" mb={2} color="red.600">
                  Due By
                </Heading>
                <Text fontWeight="medium">
                  {selectedTicket.dueDate ? new Date(selectedTicket.dueDate).toLocaleString() : '—'}
                </Text>
              </Box>

              <Box
                gridColumn={{ base: '1 / -1', md: '1 / -1' }}
                p={3}
                borderRadius="md"
                bg="gray.50"
              >
                <Heading as="h4" size="sm" mb={2}>
                  Description
                </Heading>
                <Text
                  whiteSpace="pre-wrap"
                  fontStyle={!selectedTicket.description ? 'italic' : 'normal'}
                >
                  {selectedTicket.description || 'No description.'}
                </Text>
              </Box>
            </SimpleGrid>

            <Divider mb={6} />

            {/* User Info Section */}
            <Box mb={6}>
              <Heading as="h3" size="md" mb={4}>
                User Info
              </Heading>

              {userLoading ? (
                <Spinner size="sm" />
              ) : userError ? (
                <Text color="red.400">Failed to load user info.</Text>
              ) : (
                <VStack align="start" spacing={3} pl={2}>
                  <HStack spacing={3}>
                    <Icon as={IconPhone} boxSize={6} color="blue.500" />
                    <Link
                      href={`tel:${userInfo?.data?.phone || ''}`}
                      color="blue.600"
                      isExternal
                      fontWeight="medium"
                    >
                      {userInfo?.data?.phone || 'N/A'}
                    </Link>
                  </HStack>

                  <HStack spacing={3}>
                    <Icon as={EmailIcon} boxSize={6} color="blue.500" />
                    <Link
                      href={`mailto:${userInfo?.data?.email || ''}`}
                      color="blue.600"
                      isExternal
                      fontWeight="medium"
                    >
                      {userInfo?.data?.email || 'N/A'}
                    </Link>
                  </HStack>

                  <HStack spacing={3} pt={1}>
                    <Button
                      size="sm"
                      colorScheme="blue"
                      leftIcon={<Icon as={IconPhone} />}
                      as={Link}
                      href={userInfo?.data?.phone ? `tel:${userInfo?.data?.phone}` : undefined}
                      isDisabled={!userInfo?.data?.phone}
                    >
                      Call Merchant
                    </Button>
                    <Button
                      size="sm"
                      colorScheme="teal"
                      leftIcon={<EmailIcon />}
                      as={Link}
                      href={userInfo?.data?.email ? `mailto:${userInfo?.data?.email}` : undefined}
                      isDisabled={!userInfo?.data?.email}
                    >
                      Email Merchant
                    </Button>
                  </HStack>

                  <HStack spacing={2}>
                    <ExternalLinkIcon boxSize={5} color="gray.500" />
                    <Link
                      href={`/admin/users-management/${selectedTicket.userId}/overview`}
                      color="gray.600"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      View full profile
                    </Link>
                  </HStack>
                </VStack>
              )}
            </Box>

            <Divider mb={6} />

            {/* Attachments */}
            <Box>
              <Heading as="h3" size="md" mb={4}>
                Attachments
              </Heading>

              {loadingAttachments ? (
                <Spinner />
              ) : attachmentError ? (
                <Text color="red.500">Failed to load attachments</Text>
              ) : presignedUrls && presignedUrls.length > 0 ? (
                <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>
                  {presignedUrls.map((url, index) => {
                    // Extract filename from URL path
                    const filename =
                      url.split('/').pop()?.split('?')[0] || `Attachment-${index + 1}`
                    return (
                      <Link
                        key={url}
                        href={url}
                        isExternal
                        rel="noopener noreferrer"
                        borderRadius="md"
                        overflow="hidden"
                        boxShadow="md"
                        cursor="pointer"
                        _hover={{
                          boxShadow: 'lg',
                          transform: 'scale(1.05)',
                          transition: 'all 0.2s',
                        }}
                        display="block"
                      >
                        <Image
                          src={url}
                          alt={filename}
                          objectFit="cover"
                          width="100%"
                          maxHeight="150px"
                          fallbackSrc="https://via.placeholder.com/200?text=Loading..."
                          borderRadius="md"
                          mb={2}
                        />
                        <Text
                          fontSize="sm"
                          isTruncated
                          maxW="100%"
                          textAlign="center"
                          px={1}
                          mb={1}
                        >
                          {filename}
                        </Text>
                      </Link>
                    )
                  })}
                </SimpleGrid>
              ) : (
                <Text>No attachments</Text>
              )}
            </Box>
          </>
        )}
      </CustomModal>

      <CustomModal
        size="lg"
        isOpen={openEditModal}
        onClose={() => {
          setOpenEditModal(false)
          setSelectedTicket(null)
        }}
        title={`Ticket #${selectedTicket?.id}`}
        footer={
          <HStack spacing={3}>
            <Button
              onClick={() => {
                setOpenEditModal(false)
                setSelectedTicket(null)
              }}
              variant="ghost"
            >
              Cancel
            </Button>
          </HStack>
        }
      >
        <TicketModal
          selectedTicket={selectedTicket}
          onClose={() => {
            setOpenEditModal(false)
            setSelectedTicket(null)
          }}
        />
      </CustomModal>
    </Flex>
  )
}

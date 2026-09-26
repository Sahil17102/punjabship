import {
  Avatar,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import PageHeader from 'components/Admin/PageHeader'
import StatusBadge from 'components/Badge/StatusBadge'
import SortControls from 'components/SortControls'
import TableFilters from 'components/Tables/TableFilters'
import { useDeleteUser, useUsersWithRoleUser } from 'hooks/useUsers'
import { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom/cjs/react-router-dom.min'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'
const userFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Short ID, brand, contact, email, or business name',
  },
  {
    key: 'businessTypes',
    label: 'Business Type',
    type: 'multiselect',
    options: [
      { label: 'D2C', value: 'd2c' },
      { label: 'B2B', value: 'b2b' },
      { label: 'B2C', value: 'b2c' },
    ],
  },
  {
    key: 'onboardingComplete',
    label: 'Onboarding Complete',
    type: 'select',
    options: [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ],
  },
  {
    key: 'approved',
    label: 'Account Status',
    type: 'select',
    options: [
      { label: 'Approved', value: true },
      { label: 'Not Approved', value: false },
    ],
  },
  {
    key: 'kycStatus',
    label: 'KYC Status',
    type: 'select',
    options: [
      { label: 'Awaiting Review', value: 'verification_in_progress' },
      { label: 'Not Submitted', value: 'pending' },
      { label: 'Verified', value: 'verified' },
      { label: 'Rejected', value: 'rejected' },
    ],
  },
]

const formatKycStatus = (status) => {
  if (status === 'verification_in_progress') return 'Awaiting Review'
  if (!status) return 'Not Submitted'
  return String(status).replace(/_/g, ' ')
}

const getKycBadgeType = (status) => {
  if (status === 'verified') return 'success'
  if (status === 'rejected') return 'error'
  if (status === 'verification_in_progress') return 'warning'
  return 'neutral'
}

const getFiltersFromSearch = (search) => {
  const params = new URLSearchParams(search)
  const businessTypes = [
    ...params.getAll('businessTypes'),
    ...params.getAll('businessTypes[]'),
  ]
    .flatMap((value) => String(value || '').split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  return {
    search: params.get('search') || '',
    businessTypes,
    approved: params.get('approved') || '',
    kycStatus: params.get('kycStatus') || '',
    onboardingComplete: params.get('onboardingComplete') || '',
  }
}

export default function UsersManagementPage() {
  const history = useHistory()
  const location = useLocation()
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filters, setFilters] = useState(() => getFiltersFromSearch(location.search))
  const [selectedUserId, setSelectedUserId] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')

  const deleteUserMutation = useDeleteUser()

  useEffect(() => {
    setFilters(getFiltersFromSearch(location.search))
    setPage(1)
  }, [location.search])

  const handleSortByChange = (e) => {
    setSortBy(e)
    setPage(1)
  }

  const handleSortOrderChange = (e) => {
    setSortOrder(e)
    setPage(1)
  }

  const { data: usersResponse, isLoading } = useUsersWithRoleUser({
    page,
    perPage,
    sortBy,
    sortOrder,
    ...filters,
  })

  const users = usersResponse?.data ?? []
  const totalCount = usersResponse?.totalCount ?? 0
  const approvedUsers = users.filter((user) => user.approved).length
  const onboardingCompleteUsers = users.filter((user) => user.onboardingComplete).length

  const captions = [
    'User ID',
    'Contact Person',
    'Contact Number',
    'Email',
    'KYC Status',
    'Account Status',
    'Role',
  ]
  const columnKeys = ['publicId', 'contactPerson', 'contactNumber', 'email', 'kycStatus', 'approved', 'role']

  const handleView = (id) => {
    history.push(`/admin/users-management/${id}/overview`)
  }

  const handleDeleteClick = (userId) => {
    setSelectedUserId(userId)
    onOpen()
  }

  const handleDeleteConfirm = async () => {
    try {
      await deleteUserMutation.mutateAsync(selectedUserId)
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      onClose()
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete user',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <VStack spacing={5} align="stretch" mb={5}>
        <PageHeader
          eyebrow="Users"
          title="Merchant accounts, onboarding and verification"
          description="Monitor new merchants, review account quality and move quickly into user detail when support or operations needs action."
          meta={[
            { label: 'Visible users', value: totalCount.toLocaleString() },
            { label: 'Approved', value: approvedUsers.toLocaleString() },
            { label: 'Onboarding complete', value: onboardingCompleteUsers.toLocaleString() },
          ]}
        />
      </VStack>

      <TableFilters
        filters={userFilterOptions}
        values={filters}
        onApply={(finalFilters) => {
          setFilters(finalFilters)
          setPage(1) // reset to first page
        }}
        cardStyle
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
          />
        }
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        title="Users Management"
        data={users}
        captions={captions}
        columnKeys={columnKeys}
        actionsColumnWidth="230px"
        renderActions={(row) => (
          <HStack spacing={2} minW="198px" justify="flex-start">
            <Button
              size="sm"
              colorScheme="blue"
              borderRadius="6px"
              minW="112px"
              flexShrink={0}
              whiteSpace="nowrap"
              onClick={() => handleView(row.id)}
            >
              View Details
            </Button>
            <Button
              size="sm"
              colorScheme="red"
              borderRadius="6px"
              minW="78px"
              flexShrink={0}
              whiteSpace="nowrap"
              onClick={() => handleDeleteClick(row.id)}
            >
              Delete
            </Button>
          </HStack>
        )}
        renderers={{
          publicId: (value) => (
            <Text as="span" fontWeight="800" color="brand.600">
              #{value}
            </Text>
          ),
          approved: (value) => (
            <StatusBadge
              status={value ? 'APPROVED' : 'NOT APPROVED'}
              type={value ? 'success' : 'warning'}
            />
          ),
          kycStatus: (value) => (
            <StatusBadge status={formatKycStatus(value)} type={getKycBadgeType(value)} />
          ),
          contactPerson: (value, row) => (
            <Stack direction={'row'} alignItems={'center'} gap={1}>
              <Avatar
                name={value}
                src={row?.profilePicture}
                _hover={{ zIndex: '3', cursor: 'pointer' }}
                size="sm"
              />
              <span style={{ fontWeight: '500' }}>{value || '—'}</span>
            </Stack>
          ),
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius="24px" borderWidth="1px" borderColor="rgba(148, 163, 184, 0.18)">
          <ModalHeader>Delete User</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this user?</Text>
            <Text mt={2} color="red.500" fontWeight="bold">
              This action cannot be undone!
            </Text>
            <Text mt={2} fontSize="sm" color="gray.600">
              All user data including profile, wallet, addresses, bank accounts, and KYC details
              will be permanently deleted.
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleDeleteConfirm}
              isLoading={deleteUserMutation.isLoading}
            >
              Delete User
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Flex>
  )
}

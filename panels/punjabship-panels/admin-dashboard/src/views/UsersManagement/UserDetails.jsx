import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Select,
  Stack,
  Text,
  Tooltip,
  useColorModeValue,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { IconHelpCircle, IconUsersGroup } from '@tabler/icons-react'
import ProfileBgImage from 'assets/img/ProfileBackground.png'
import OrdersTable from 'components/Tables/OrdersTable'
import TableFilters from 'components/Tables/TableFilters'
import { useOrders } from 'hooks/useOrders'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import { useUserInfo } from 'hooks/useUser'
import {
  useCreateTeamMemberMutation,
  useDeleteTeamMemberMutation,
  useToggleTeamMemberStatusMutation,
  useUserTeamMembers,
} from 'hooks/useUsers'
import { useEffect, useMemo, useRef, useState } from 'react'
import { BsBox } from 'react-icons/bs'
import { CiBank } from 'react-icons/ci'
import { FaCube, FaUserCog } from 'react-icons/fa'
import { FiExternalLink, FiMoreVertical, FiPlus, FiPower, FiRefreshCw, FiTrash } from 'react-icons/fi'
import { MdOutlineHomeWork } from 'react-icons/md'
import { Route, Switch, useHistory, useLocation, useParams } from 'react-router-dom'
import BankAccountsTab from 'views/Dashboard/Profile/components/BankAccountsTab'
import CompanyDetails from 'views/Dashboard/Profile/components/CompanyDetails'
import Header from 'views/Dashboard/Profile/components/Header'
import ProfileInformation from 'views/Dashboard/Profile/components/ProfileInformation'
import UserKycPage from 'views/Dashboard/Profile/components/UserKycTab'
import UserTicketsPage from 'views/Dashboard/Profile/components/UserTicketsTab'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'
import { createUserImpersonationSession } from 'services/user.service'

const CompanyTab = ({ user, companyLogoUrl }) => (
  <CompanyDetails companyLogoUrl={companyLogoUrl} companyInfo={user?.companyInfo} />
)

const orderFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search by Order ID, AWB, or Customer...',
  },
  {
    key: 'status',
    label: 'Order Status',
    type: 'select',
    placeholder: 'All Statuses',
    options: [
      { value: 'pending', label: 'Pending' },
      { value: 'shipment_created', label: 'Shipment Created' },
      { value: 'in_transit', label: 'In Transit' },
      { value: 'out_for_delivery', label: 'Out for Delivery' },
      { value: 'delivered', label: 'Delivered' },
      { value: 'cancellation_requested', label: 'Cancellation Requested' },
      { value: 'cancelled', label: 'Cancelled' },
      { value: 'rto', label: 'RTO' },
      { value: 'rto_in_transit', label: 'RTO In Transit' },
      { value: 'rto_delivered', label: 'RTO Delivered' },
    ],
  },
  {
    key: 'fromDate',
    label: 'From Date',
    type: 'date',
    placeholder: 'Start Date',
  },
  {
    key: 'toDate',
    label: 'To Date',
    type: 'date',
    placeholder: 'End Date',
  },
]

const teamFilterOptions = [
  {
    key: 'search',
    label: 'Search',
    type: 'search',
    placeholder: 'Search by name, email, or phone...',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    placeholder: 'All statuses',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
]

const teamRoleOptions = [
  { label: 'Employee', value: 'employee' },
  { label: 'Manager', value: 'manager' },
  { label: 'Support', value: 'support' },
  { label: 'Operations', value: 'operations' },
]

const defaultTeamMemberForm = {
  name: '',
  email: '',
  phone: '',
  role: 'employee',
  password: '',
}

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const OrdersTab = ({ userId }) => {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    fromDate: '',
    toDate: '',
  })

  const queryFilters = useMemo(() => ({ ...filters, userId }), [filters, userId])

  const { data: ordersData, isLoading, isFetching, refetch } = useOrders(
    page,
    perPage,
    queryFilters,
  )

  return (
    <>
      <TableFilters
        filters={orderFilterOptions}
        values={filters}
        onApply={(appliedFilters) => {
          setFilters(appliedFilters)
          setPage(1)
        }}
      />

      <OrdersTable
        orders={ordersData?.orders || []}
        totalCount={ordersData?.totalCount || 0}
        page={page}
        setPage={setPage}
        perPage={perPage}
        setPerPage={setPerPage}
        loading={isLoading || isFetching}
        onRefresh={refetch}
      />
    </>
  )
}
const TeamTab = ({ userId }) => {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(10)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  })
  const [formState, setFormState] = useState(defaultTeamMemberForm)
  const [showPassword, setShowPassword] = useState(false)
  const [memberToDelete, setMemberToDelete] = useState(null)

  const { data: teamData, isLoading, isFetching, refetch } = useUserTeamMembers(
    userId,
    page,
    perPage,
    filters,
  )

  const createMemberModal = useDisclosure()
  const deleteMemberDialog = useDisclosure()
  const cancelRef = useRef()

  const createMemberMutation = useCreateTeamMemberMutation()
  const toggleStatusMutation = useToggleTeamMemberStatusMutation()
  const deleteMemberMutation = useDeleteTeamMemberMutation()

  const members = teamData?.members || []
  const totalCount = teamData?.totalCount || 0

  const tableData = useMemo(
    () =>
      members.map((member) => ({
        ...member,
        status: member.isActive ? 'Active' : 'Inactive',
        lastSeen: member.updatedAt || member.createdAt,
      })),
    [members],
  )

  const handleFiltersApply = (appliedFilters) => {
    setFilters(appliedFilters)
    setPage(1)
  }

  const handleToggleStatus = async (member) => {
    try {
      await toggleStatusMutation.mutateAsync({
        userId,
        memberId: member.id,
        isActive: !member.isActive,
      })
      toast({
        title: 'Team member updated',
        description: `${member.name || member.email} is now ${
          member.isActive ? 'inactive' : 'active'
        }.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      refetch()
    } catch (error) {
      toast({
        title: 'Action failed',
        description:
          error.response?.data?.message || error.message || 'Failed to update team member status.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return

    try {
      await deleteMemberMutation.mutateAsync({
        userId,
        memberId: memberToDelete.id,
      })
      toast({
        title: 'Team member removed',
        description: `${memberToDelete.name || memberToDelete.email} has been deleted.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      setMemberToDelete(null)
      deleteMemberDialog.onClose()
      refetch()
    } catch (error) {
      toast({
        title: 'Deletion failed',
        description:
          error.response?.data?.message || error.message || 'Failed to delete team member.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const resetForm = () => {
    setFormState(defaultTeamMemberForm)
    setShowPassword(false)
  }

  const handleCreateMember = async () => {
    if (!formState.name.trim() || !formState.email.trim()) {
      toast({
        title: 'Missing information',
        description: 'Name and email are required.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (!formState.password || formState.password.trim().length < 6) {
      toast({
        title: 'Invalid password',
        description: 'Password must be at least 6 characters long.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      await createMemberMutation.mutateAsync({
        userId,
        payload: {
          ...formState,
          moduleAccess: {},
        },
      })
      toast({
        title: 'Team member added',
        description: `${formState.name} has been created successfully.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      resetForm()
      createMemberModal.onClose()
      refetch()
    } catch (error) {
      toast({
        title: 'Creation failed',
        description:
          error.response?.data?.message || error.message || 'Failed to create team member.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    }
  }

  const renderActions = (member) => (
    <Menu>
      <MenuButton
        as={IconButton}
        icon={<FiMoreVertical />}
        variant="ghost"
        aria-label="Team member actions"
        size="sm"
      />
      <Portal>
        <MenuList>
          <MenuItem
            icon={<FiPower />}
            onClick={() => handleToggleStatus(member)}
            isDisabled={toggleStatusMutation.isPending}
          >
            {member.isActive ? 'Deactivate' : 'Activate'}
          </MenuItem>
          <MenuItem
            icon={<FiTrash />}
            onClick={() => {
              setMemberToDelete(member)
              deleteMemberDialog.onOpen()
            }}
            isDisabled={deleteMemberMutation.isPending}
          >
            Delete
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )

  const renderers = {
    status: (_, row) => (
      <Badge colorScheme={row.isActive ? 'green' : 'red'}>
        {row.isActive ? 'Active' : 'Inactive'}
      </Badge>
    ),
    lastSeen: (value) => (
      <Text fontSize="sm" color="gray.600">
        {formatDateTime(value)}
      </Text>
    ),
    name: (value, row) => (
      <Stack spacing={0}>
        <Text fontWeight="600">{value || '—'}</Text>
        {row?.moduleAccess && Object.keys(row.moduleAccess || {}).length > 0 && (
          <Tooltip
            label={
              Object.keys(row.moduleAccess)
                .filter((key) => row.moduleAccess[key])
                .join(', ') || 'No modules assigned'
            }
          >
            <Text fontSize="xs" color="gray.500">
              Module access: {Object.keys(row.moduleAccess || {}).length}
            </Text>
          </Tooltip>
        )}
      </Stack>
    ),
    email: (value) => (
      <Text fontSize="sm" fontWeight="500" color="gray.700">
        {value || '—'}
      </Text>
    ),
    phone: (value) => (
      <Text fontSize="sm" color="gray.600">
        {value || '—'}
      </Text>
    ),
    role: (value) => (
      <Badge colorScheme="purple" variant="subtle">
        {value ? value.toUpperCase() : '—'}
      </Badge>
    ),
  }

  return (
    <>
      <Stack spacing={4}>
        <TableFilters
          filters={teamFilterOptions}
          values={filters}
          onApply={handleFiltersApply}
          actions={[
            {
              label: 'Refresh',
              icon: <FiRefreshCw size={14} />,
              variant: 'outline',
              onClick: () => refetch(),
              isLoading: isFetching,
            },
            {
              label: 'Add Member',
              icon: <FiPlus size={14} />,
              colorScheme: 'blue',
              onClick: createMemberModal.onOpen,
              isLoading: createMemberMutation.isPending,
            },
          ]}
        />

        <GenericTable
          title="Team Members"
          data={tableData}
          captions={['Name', 'Email', 'Phone', 'Role', 'Status', 'Last Updated']}
          columnKeys={['name', 'email', 'phone', 'role', 'status', 'lastSeen']}
          renderers={renderers}
          renderActions={renderActions}
          loading={isLoading || isFetching}
          paginated
          page={page}
          setPage={setPage}
          totalCount={totalCount}
          perPage={perPage}
          setPerPage={setPerPage}
          perPageOptions={[5, 10, 20, 50]}
          columnWidths={{
            email: '220px',
            phone: '150px',
            role: '140px',
            status: '120px',
            lastSeen: '180px',
          }}
        />
      </Stack>

      <Modal
        isOpen={createMemberModal.isOpen}
        onClose={() => {
          resetForm()
          createMemberModal.onClose()
        }}
        size="lg"
        isCentered
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add Team Member</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  placeholder="Full name"
                  value={formState.name}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formState.email}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, email: event.target.value }))
                  }
                />
              </FormControl>
              <FormControl>
                <FormLabel>Phone</FormLabel>
                <Input
                  type="tel"
                  placeholder="Optional phone number"
                  value={formState.phone}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, phone: event.target.value }))
                  }
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Temporary password"
                    value={formState.password}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, password: event.target.value }))
                    }
                  />
                  <InputRightElement width="4.5rem">
                    <Button
                      h="1.75rem"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={formState.role}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, role: event.target.value }))
                  }
                >
                  {teamRoleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => {
                resetForm()
                createMemberModal.onClose()
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreateMember}
              isLoading={createMemberMutation.isPending}
            >
              Create Member
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={deleteMemberDialog.isOpen}
        leastDestructiveRef={cancelRef}
        onClose={() => {
          setMemberToDelete(null)
          deleteMemberDialog.onClose()
        }}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remove Team Member
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to remove{' '}
              <Text as="span" fontWeight="semibold">
                {memberToDelete?.name || memberToDelete?.email}
              </Text>
              ? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button
                ref={cancelRef}
                onClick={() => {
                  setMemberToDelete(null)
                  deleteMemberDialog.onClose()
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="red"
                ml={3}
                onClick={handleDeleteConfirm}
                isLoading={deleteMemberMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  )
}

const TabContentWrapper = ({ children }) => (
  <Flex
    direction="column"
    flex="1"
    minHeight="500px"
    width="100%"
    mt={20}
    p={6}
    borderRadius="xl"
    boxShadow="md"
    gap={4}
    overflowX="auto"
  >
    {children}
  </Flex>
)

const renderWithWrapper = (Component, extraProps = {}) => (routeProps) => (
  <TabContentWrapper>
    <Component {...routeProps} {...extraProps} />
  </TabContentWrapper>
)

export default function UserDetails() {
  const { id } = useParams()
  const history = useHistory()
  const location = useLocation()

  const { data: profileData } = useUserInfo(id)
  const toast = useToast()
  const [openingClientPanel, setOpeningClientPanel] = useState(false)

  const companyInfo = profileData?.data?.companyInfo || {}
  const profilePictureKey = companyInfo.profilePicture
  const companyLogoKey = companyInfo.companyLogoUrl

  const keysToFetch = useMemo(() => {
    const keys = []
    if (profilePictureKey) keys.push(profilePictureKey)
    if (companyLogoKey) keys.push(companyLogoKey)
    return keys
  }, [profilePictureKey, companyLogoKey])

  const { data: presignedUrls, refetch } = usePresignedDownloadUrls({ keys: keysToFetch })

  useEffect(() => {
    if (keysToFetch.length > 0) {
      refetch()
    }
  }, [keysToFetch, refetch])

  // presignedUrls is expected to be array matching keys order
  const avatarUrl = profilePictureKey
    ? presignedUrls?.[keysToFetch.indexOf(profilePictureKey)]
    : undefined
  const companyLogoUrl = companyLogoKey
    ? presignedUrls?.[keysToFetch.indexOf(companyLogoKey)]
    : undefined

  const bgProfile = useColorModeValue(
    'hsla(0,0%,100%,.8)',
    'linear-gradient(112.83deg, rgba(255, 255, 255, 0.21) 0%, rgba(255, 255, 255, 0) 110.84%)',
  )

  const tabRoutes = [
    { name: 'OVERVIEW', icon: <FaCube />, path: `/admin/users-management/${id}/overview` },
    {
      name: 'COMPANY DETAILS',
      icon: <MdOutlineHomeWork />,
      path: `/admin/users-management/${id}/company-details`,
    },
    { name: 'ORDERS', icon: <BsBox />, path: `/admin/users-management/${id}/orders` },
    {
      name: 'BANK ACCOUNTS',
      icon: <CiBank />,
      path: `/admin/users-management/${id}/bank-accounts`,
    },
    { name: 'KYC', icon: <FaUserCog />, path: `/admin/users-management/${id}/kyc` },
    {
      name: 'TEAM MEMBERS',
      icon: <IconUsersGroup stroke={2} size={18} />,
      path: `/admin/users-management/${id}/team-members`,
    },
    {
      name: 'SUPPORT TICKETS',
      icon: <IconHelpCircle stroke={2} size={18} />,
      path: `/admin/users-management/${id}/support-tickets`,
    },
  ]

  const handleTabClick = (path) => {
    history.push(path)
  }

  const activeTab = tabRoutes.find((tab) => location.pathname === tab.path)
  const isOverviewTab = location.pathname === `/admin/users-management/${id}/overview`

  // Defensive check for userId fallback
  const userId = id ?? ''

  const showClientPanelLoadingWindow = (clientWindow) => {
    if (!clientWindow) return

    try {
      clientWindow.opener = null
      clientWindow.document.title = 'Opening PunjabShip Client Panel'
      clientWindow.document.body.innerHTML = `
        <main style="
          min-height: 100vh;
          margin: 0;
          display: grid;
          place-items: center;
          background: #f7f8fb;
          color: #17171a;
          font-family: Inter, Arial, sans-serif;
        ">
          <section style="
            width: min(420px, calc(100vw - 40px));
            padding: 28px;
            border: 1px solid #e2e8f0;
            border-radius: 18px;
            background: #ffffff;
            box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
            text-align: center;
          ">
            <div style="
              width: 44px;
              height: 44px;
              margin: 0 auto 18px;
              border-radius: 14px;
              display: grid;
              place-items: center;
              background: #f0edff;
              color: #0877C9;
              font-weight: 900;
              font-size: 20px;
            ">S</div>
            <h1 style="margin: 0; font-size: 22px; line-height: 1.25;">Opening client panel</h1>
            <p style="margin: 10px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
              Creating a secure admin session for this seller. This tab will continue automatically.
            </p>
          </section>
        </main>
      `
    } catch (_error) {
      // If the browser blocks document access, the redirect below still handles the flow.
    }
  }

  const handleOpenClientPanel = async () => {
    if (!userId) return
    const clientWindow = window.open('', '_blank')
    showClientPanelLoadingWindow(clientWindow)
    setOpeningClientPanel(true)
    try {
      const result = await createUserImpersonationSession(userId)
      if (!result?.clientUrl) {
        throw new Error('Client panel URL was not returned')
      }
      toast({
        title: 'Opening client panel',
        description: 'A short-lived admin session has been created for this seller.',
        status: 'success',
        duration: 3500,
        isClosable: true,
      })
      if (clientWindow) {
        clientWindow.location.href = result.clientUrl
      } else {
        window.location.href = result.clientUrl
      }
    } catch (error) {
      if (clientWindow) clientWindow.close()
      toast({
        title: 'Could not open client panel',
        description: error.response?.data?.message || error.message || 'Failed to create session',
        status: 'error',
        duration: 4500,
        isClosable: true,
      })
    } finally {
      setOpeningClientPanel(false)
    }
  }

  return (
    <Flex p={6} pt={{ base: '120px', md: '75px' }} direction="column" width="100%" flex="1">
      {/* Fixed Header with tabs */}
      <Header
        backgroundHeader={companyLogoUrl || ProfileBgImage}
        backgroundProfile={bgProfile}
        avatarImage={avatarUrl}
        name={companyInfo.contactPerson || ''}
        email={profileData?.data?.email || ''}
        phone={profileData?.data?.phone || ''}
        tabs={tabRoutes}
        activeTab={activeTab}
        userId={userId}
        publicUserId={profileData?.data?.publicId}
        onTabClick={handleTabClick}
        actionSlot={
          isOverviewTab ? (
            <Button
              leftIcon={<FiExternalLink />}
              onClick={handleOpenClientPanel}
              isLoading={openingClientPanel}
              loadingText="Opening..."
              bg="brand.500"
              color="white"
              size="sm"
              h="38px"
              px="16px"
              borderRadius="10px"
              boxShadow="0 10px 22px rgba(8,119,201,0.22)"
              _hover={{ bg: 'brand.600', transform: 'translateY(-1px)' }}
            >
              Enter User Panel
            </Button>
          ) : null
        }
      />

      {/* Tab Content */}
      <Switch>
        <Route
          exact
          path={`/admin/users-management/:id/overview`}
          children={renderWithWrapper(ProfileInformation, { user: profileData?.data })}
        />
        <Route
          exact
          path={`/admin/users-management/:id/company-details`}
          children={renderWithWrapper(CompanyTab, { user: profileData?.data, companyLogoUrl })}
        />
        <Route
          exact
          path={`/admin/users-management/:id/orders`}
          children={renderWithWrapper(OrdersTab, { userId })}
        />
        <Route
          exact
          path={`/admin/users-management/:id/bank-accounts`}
          children={renderWithWrapper(BankAccountsTab, { userId })}
        />
        <Route
          exact
          path={`/admin/users-management/:id/kyc`}
          children={renderWithWrapper(UserKycPage, { userId })}
        />
        <Route
          exact
          path={`/admin/users-management/:id/team-members`}
          children={renderWithWrapper(TeamTab, { userId })}
        />
        <Route
          exact
          path={`/admin/users-management/:id/support-tickets`}
          children={renderWithWrapper(UserTicketsPage, { userId })}
        />
      </Switch>
    </Flex>
  )
}

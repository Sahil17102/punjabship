import { AddIcon, SearchIcon } from '@chakra-ui/icons'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { useCallback, useEffect, useState } from 'react'
import {
  createCrmAssignment,
  createCrmEmployee,
  createCrmRole,
  getCrmEmployees,
  getCrmRoles,
  getCrmSellers,
  updateCrmEmployee,
  updateCrmRole,
} from 'services/adminCrm.service'
import { useAuthStore } from 'store/useAuthStore'
import { hasAdminAccess } from 'utils/adminRouteAccess'

const PERMISSION_LEVELS = ['none', 'view', 'operate', 'approve', 'manage']
const PERMISSION_MODULES = [
  ['employees', 'Employee management'],
  ['assignments', 'Seller assignments'],
  ['sellers', 'User management'],
  ['orders', 'Orders'],
  ['kyc', 'KYC'],
  ['ndr', 'NDR'],
  ['rto', 'RTO'],
  ['wallet', 'Wallet'],
  ['cod', 'COD remittance'],
  ['billing', 'Billing'],
  ['support', 'Support'],
  ['manualCouriers', 'Manual couriers'],
  ['shipping', 'Shipping configuration'],
  ['disputes', 'Weight disputes'],
  ['franchise', 'Franchise management'],
  ['developer', 'Developer tools'],
]

const EMPTY_EMPLOYEE = {
  name: '',
  email: '',
  phone: '',
  password: '',
  employeeCode: '',
  department: 'Relationship Management',
  designation: 'Relationship Manager',
  roleId: '',
  managerStaffId: '',
  scopeType: 'assigned',
  permissionOverrides: {},
  isActive: true,
}

const EMPTY_ROLE = {
  code: '',
  name: '',
  description: '',
  permissions: { employees: 'view', assignments: 'view' },
  isActive: true,
}

const companyName = (row) =>
  row?.companyInfo?.companyName ||
  row?.companyInfo?.businessName ||
  row?.companyInfo?.brandName ||
  row?.email ||
  'Unnamed seller'

const errorMessage = (error) =>
  error?.response?.data?.message || error?.message || 'Operation failed'

const Header = ({ title, subtitle, actions }) => (
  <Flex
    justify="space-between"
    align={{ base: 'stretch', md: 'center' }}
    direction={{ base: 'column', md: 'row' }}
    gap={3}
  >
    <Box>
      <Text fontSize="2xl" fontWeight="700">{title}</Text>
      <Text color="gray.500" fontSize="sm">{subtitle}</Text>
    </Box>
    {actions && <HStack>{actions}</HStack>}
  </Flex>
)

const Loading = () => <Flex py={12} justify="center"><Spinner /></Flex>

const EmptyRow = ({ columns, children = 'No records found.' }) => (
  <Tr>
    <Td colSpan={columns} py={10} textAlign="center" color="gray.500">{children}</Td>
  </Tr>
)

function EmployeesPanel() {
  const toast = useToast()
  const modal = useDisclosure()
  const session = useAuthStore((state) => state.adminAccess)
  const canManage = session?.actorType === 'admin'
  const [rows, setRows] = useState([])
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_EMPLOYEE)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [staff, roleRows] = await Promise.all([
        getCrmEmployees({ search, limit: 100 }),
        getCrmRoles(),
      ])
      setRows(staff.data || [])
      setRoles(roleRows || [])
    } catch (error) {
      toast({
        title: 'Could not load employees',
        description: errorMessage(error),
        status: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...EMPTY_EMPLOYEE, roleId: roles.find((role) => role.isActive)?.id || '' })
    modal.onOpen()
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      ...EMPTY_EMPLOYEE,
      ...row,
      password: '',
      managerStaffId: row.managerStaffId || '',
      permissionOverrides: { ...(row.permissionOverrides || {}) },
    })
    modal.onOpen()
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) await updateCrmEmployee(editing.id, form)
      else await createCrmEmployee(form)
      toast({ title: editing ? 'Employee updated' : 'Employee created', status: 'success' })
      modal.onClose()
      await load()
    } catch (error) {
      toast({
        title: 'Could not save employee',
        description: errorMessage(error),
        status: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <VStack align="stretch" spacing={4}>
      <Flex justify="space-between" gap={3} direction={{ base: 'column', md: 'row' }}>
        <InputGroup maxW="420px">
          <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
          <Input
            bg="white"
            placeholder="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </InputGroup>
        {canManage && (
          <Button colorScheme="brand" leftIcon={<AddIcon />} onClick={openCreate}>
            Add employee
          </Button>
        )}
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" overflowX="auto">
        {loading ? <Loading /> : (
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Employee</Th>
                <Th>Role</Th>
                <Th>Department</Th>
                <Th>Seller scope</Th>
                <Th isNumeric>Assigned sellers</Th>
                <Th>Status</Th>
                <Th />
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <HStack>
                      <Avatar size="sm" name={row.name} />
                      <Box>
                        <Text fontWeight="600">{row.name}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {row.email}{row.employeeCode ? ` / ${row.employeeCode}` : ''}
                        </Text>
                      </Box>
                    </HStack>
                  </Td>
                  <Td>{row.roleName}</Td>
                  <Td>
                    {row.department}
                    <Text fontSize="xs" color="gray.500">{row.designation}</Text>
                  </Td>
                  <Td><Badge>{row.scopeType}</Badge></Td>
                  <Td isNumeric>{row.assignedSellerCount}</Td>
                  <Td>
                    <Badge colorScheme={row.isActive ? 'green' : 'gray'}>
                      {row.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    {canManage && (
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
                    )}
                  </Td>
                </Tr>
              ))}
              {!rows.length && <EmptyRow columns={7} />}
            </Tbody>
          </Table>
        )}
      </Box>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Edit employee' : 'Create employee'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              {[
                ['name', 'Name'],
                ['email', 'Email'],
                ['phone', 'Phone'],
                ['employeeCode', 'Employee code'],
                ['department', 'Department'],
                ['designation', 'Designation'],
              ].map(([key, label]) => (
                <FormControl
                  key={key}
                  isRequired={['name', 'email', 'department', 'designation'].includes(key)}
                >
                  <FormLabel>{label}</FormLabel>
                  <Input
                    isDisabled={Boolean(editing) && key === 'email'}
                    value={form[key] || ''}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  />
                </FormControl>
              ))}
              <FormControl isRequired={!editing}>
                <FormLabel>{editing ? 'New password (optional)' : 'Temporary password'}</FormLabel>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Role</FormLabel>
                <Select
                  value={form.roleId}
                  onChange={(event) => setForm({ ...form, roleId: event.target.value })}
                >
                  {roles.filter((role) => role.isActive).map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Manager</FormLabel>
                <Select
                  value={form.managerStaffId || ''}
                  onChange={(event) => setForm({ ...form, managerStaffId: event.target.value })}
                >
                  <option value="">No manager</option>
                  {rows.filter((row) => row.id !== editing?.id && row.isActive).map((row) => (
                    <option key={row.id} value={row.id}>{row.name}</option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Seller visibility</FormLabel>
                <Select
                  value={form.scopeType}
                  onChange={(event) => setForm({ ...form, scopeType: event.target.value })}
                >
                  <option value="assigned">Assigned sellers</option>
                  <option value="team">Own team</option>
                  <option value="all">All sellers</option>
                </Select>
              </FormControl>
              <FormControl display="flex" alignItems="center" pt={8}>
                <FormLabel mb="0">Active login</FormLabel>
                <Switch
                  isChecked={form.isActive}
                  onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                />
              </FormControl>
            </Grid>

            <Divider my={5} />
            <Text fontWeight="700" mb={3}>Individual permission overrides</Text>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
              {PERMISSION_MODULES.map(([module, label]) => (
                <FormControl key={module}>
                  <FormLabel fontSize="sm">{label}</FormLabel>
                  <Select
                    size="sm"
                    value={form.permissionOverrides?.[module] || ''}
                    onChange={(event) => {
                      const next = { ...(form.permissionOverrides || {}) }
                      if (event.target.value) next[module] = event.target.value
                      else delete next[module]
                      setForm({ ...form, permissionOverrides: next })
                    }}
                  >
                    <option value="">Inherit from role</option>
                    {PERMISSION_LEVELS.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Grid>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={modal.onClose}>Cancel</Button>
            <Button colorScheme="brand" isLoading={saving} onClick={save}>Save employee</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

function SellerAssignmentsPanel() {
  const toast = useToast()
  const session = useAuthStore((state) => state.adminAccess)
  const canAssign = hasAdminAccess(session, 'assignments', 'manage')
  const [sellers, setSellers] = useState([])
  const [staff, setStaff] = useState([])
  const [selected, setSelected] = useState({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sellerResult, staffResult] = await Promise.all([
        getCrmSellers({ search, limit: 100 }),
        getCrmEmployees({ status: 'active', limit: 100 }),
      ])
      setSellers(sellerResult.data || [])
      setStaff(staffResult.data || [])
    } catch (error) {
      toast({
        title: 'Could not load seller assignments',
        description: errorMessage(error),
        status: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [search, toast])

  useEffect(() => {
    const timer = setTimeout(load, 250)
    return () => clearTimeout(timer)
  }, [load])

  const assign = async (seller) => {
    const staffId = selected[seller.id]
    if (!staffId) return
    setBusy(seller.id)
    try {
      await createCrmAssignment({
        sellerId: seller.id,
        staffId,
        assignmentType: 'primary',
        reason: 'Assigned from Employee Management',
      })
      toast({ title: 'Seller assigned', status: 'success' })
      await load()
    } catch (error) {
      toast({
        title: 'Assignment failed',
        description: errorMessage(error),
        status: 'error',
      })
    } finally {
      setBusy('')
    }
  }

  return (
    <VStack align="stretch" spacing={4}>
      <InputGroup maxW="420px">
        <InputLeftElement><SearchIcon color="gray.400" /></InputLeftElement>
        <Input
          bg="white"
          placeholder="Search sellers"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </InputGroup>
      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" overflowX="auto">
        {loading ? <Loading /> : (
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Seller</Th>
                <Th>Current owner</Th>
                <Th>Assign primary owner</Th>
              </Tr>
            </Thead>
            <Tbody>
              {sellers.map((seller) => (
                <Tr key={seller.id}>
                  <Td>
                    <Text fontWeight="600">{companyName(seller)}</Text>
                    <Text fontSize="xs" color="gray.500">{seller.email}</Text>
                  </Td>
                  <Td>
                    {seller.primaryStaffName || <Badge colorScheme="red">Unassigned</Badge>}
                  </Td>
                  <Td>
                    <HStack>
                      <Select
                        size="sm"
                        minW="210px"
                        placeholder="Select employee"
                        value={selected[seller.id] || ''}
                        isDisabled={!canAssign}
                        onChange={(event) => setSelected({
                          ...selected,
                          [seller.id]: event.target.value,
                        })}
                      >
                        {staff.map((person) => (
                          <option key={person.id} value={person.id}>
                            {person.name} ({person.assignedSellerCount} sellers)
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        colorScheme="brand"
                        isLoading={busy === seller.id}
                        isDisabled={!canAssign || !selected[seller.id]}
                        onClick={() => assign(seller)}
                      >
                        Assign
                      </Button>
                    </HStack>
                  </Td>
                </Tr>
              ))}
              {!sellers.length && <EmptyRow columns={3} />}
            </Tbody>
          </Table>
        )}
      </Box>
    </VStack>
  )
}

function EmployeeManagementView() {
  const session = useAuthStore((state) => state.adminAccess)
  const canViewAssignments = hasAdminAccess(session, 'assignments', 'view')

  return (
    <VStack align="stretch" spacing={5}>
      <Header
        title="Employee Management"
        subtitle="Create employee accounts, control their access and assign seller ownership."
      />
      <Tabs colorScheme="brand" variant="enclosed" isLazy>
        <TabList>
          <Tab>Employees</Tab>
          {canViewAssignments && <Tab>Seller Assignment</Tab>}
        </TabList>
        <TabPanels>
          <TabPanel px={0} pt={5}><EmployeesPanel /></TabPanel>
          {canViewAssignments && (
            <TabPanel px={0} pt={5}><SellerAssignmentsPanel /></TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

function RolesView() {
  const toast = useToast()
  const modal = useDisclosure()
  const session = useAuthStore((state) => state.adminAccess)
  const canManage = session?.actorType === 'admin'
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(EMPTY_ROLE)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    try {
      setRows(await getCrmRoles())
    } catch (error) {
      toast({
        title: 'Could not load roles',
        description: errorMessage(error),
        status: 'error',
      })
    }
  }, [toast])

  useEffect(() => { load() }, [load])

  const open = (role = null) => {
    setEditing(role)
    setForm(role
      ? { ...role, permissions: { ...(role.permissions || {}) } }
      : { ...EMPTY_ROLE, permissions: { ...EMPTY_ROLE.permissions } })
    modal.onOpen()
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editing) await updateCrmRole(editing.id, form)
      else await createCrmRole(form)
      toast({ title: 'Role saved', status: 'success' })
      modal.onClose()
      await load()
    } catch (error) {
      toast({
        title: 'Could not save role',
        description: errorMessage(error),
        status: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <VStack align="stretch" spacing={5}>
      <Header
        title="Roles & Permissions"
        subtitle="Define which admin sections and actions each employee can access."
        actions={canManage && (
          <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={() => open()}>
            Add role
          </Button>
        )}
      />
      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" overflowX="auto">
        <Table size="sm">
          <Thead bg="gray.50">
            <Tr><Th>Role</Th><Th>Permissions</Th><Th>Status</Th><Th /></Tr>
          </Thead>
          <Tbody>
            {rows.map((row) => (
              <Tr key={row.id}>
                <Td>
                  <Text fontWeight="600">{row.name}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {row.code}{row.isSystem ? ' / System' : ''}
                  </Text>
                </Td>
                <Td>
                  <HStack wrap="wrap">
                    {Object.entries(row.permissions || {})
                      .filter(([module, level]) =>
                        PERMISSION_MODULES.some(([key]) => key === module) && level !== 'none')
                      .slice(0, 6)
                      .map(([module, level]) => (
                        <Badge key={module}>{module}: {level}</Badge>
                      ))}
                  </HStack>
                </Td>
                <Td>
                  <Badge colorScheme={row.isActive ? 'green' : 'gray'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Td>
                <Td>
                  {canManage && (
                    <Button size="sm" variant="outline" onClick={() => open(row)}>Edit</Button>
                  )}
                </Td>
              </Tr>
            ))}
            {!rows.length && <EmptyRow columns={4} />}
          </Tbody>
        </Table>
      </Box>

      <Modal isOpen={modal.isOpen} onClose={modal.onClose} size="2xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Edit role' : 'Create role'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack align="stretch" spacing={4}>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Code</FormLabel>
                  <Input
                    isDisabled={Boolean(editing)}
                    value={form.code}
                    onChange={(event) => setForm({ ...form, code: event.target.value })}
                  />
                </FormControl>
              </Grid>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={form.description || ''}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                />
              </FormControl>
              <Divider />
              <Text fontWeight="700">Permission matrix</Text>
              <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                {PERMISSION_MODULES.map(([module, label]) => (
                  <FormControl key={module}>
                    <FormLabel fontSize="sm">{label}</FormLabel>
                    <Select
                      size="sm"
                      value={form.permissions?.[module] || 'none'}
                      onChange={(event) => setForm({
                        ...form,
                        permissions: { ...form.permissions, [module]: event.target.value },
                      })}
                    >
                      {PERMISSION_LEVELS.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              </Grid>
              <Checkbox
                isChecked={form.isActive !== false}
                onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
              >
                Role is active
              </Checkbox>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={modal.onClose}>Cancel</Button>
            <Button colorScheme="brand" isLoading={saving} onClick={save}>Save role</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

export default function EmployeeManagementWorkspace({ mode }) {
  const content = mode === 'roles' ? <RolesView /> : <EmployeeManagementView />
  return <Flex direction="column" pt={{ base: '120px', md: '75px' }}>{content}</Flex>
}

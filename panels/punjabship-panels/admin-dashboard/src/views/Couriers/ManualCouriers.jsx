import {
  AddIcon,
  CheckIcon,
  DeleteIcon,
  EditIcon,
  SearchIcon,
} from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Switch,
  Table,
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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  createManualCourier,
  getManualCourier,
  getManualCouriers,
  importManualCourierPincodes,
  removeManualCourierPincode,
  replaceManualCourierPincodes,
  updateManualCourier,
} from 'services/manualCourier.service'

const emptyForm = {
  code: '',
  displayName: '',
  supportsB2c: true,
  supportsB2b: false,
  supportsPrepaid: true,
  supportsCod: true,
  minWeightKg: '0.5',
  maxWeightKg: '30',
  isEnabled: true,
  pincodes: '',
}

const parsePincodes = (value) =>
  Array.from(
    new Set(
      String(value || '')
        .split(/[\s,;]+/)
        .map((entry) => entry.replace(/\D/g, '').slice(0, 6))
        .filter((entry) => entry.length === 6),
    ),
  )

const Metric = ({ label, value }) => (
  <Stat border="1px solid" borderColor="gray.200" bg="white" p={4} borderRadius="md">
    <StatLabel color="gray.500" fontSize="sm">
      {label}
    </StatLabel>
    <StatNumber fontSize="2xl">{value}</StatNumber>
  </Stat>
)

export default function ManualCouriers() {
  const toast = useToast()
  const editor = useDisclosure()
  const detailDrawer = useDisclosure()
  const fileRef = useRef()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [coveragePage, setCoveragePage] = useState(1)
  const [coverageSearch, setCoverageSearch] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [importMode, setImportMode] = useState('append')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await getManualCouriers())
    } catch (error) {
      toast({
        title: 'Could not load manual couriers',
        description: error?.response?.data?.message,
        status: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchesSearch = `${row.displayName} ${row.code} ${row.courierId}`
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesStatus =
          !status || (status === 'active' ? row.isEnabled : !row.isEnabled)
        return matchesSearch && matchesStatus
      }),
    [rows, search, status],
  )

  const totals = useMemo(
    () => ({
      active: rows.filter((row) => row.isEnabled).length,
      coverage: rows.reduce((sum, row) => sum + Number(row.pincodeCount || 0), 0),
      shipments: rows.reduce((sum, row) => sum + Number(row.shipmentCount || 0), 0),
    }),
    [rows],
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    editor.onOpen()
  }

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      ...emptyForm,
      ...row,
      minWeightKg: String(row.minWeightKg),
      maxWeightKg: String(row.maxWeightKg),
      pincodes: '',
    })
    editor.onOpen()
  }

  const openDetail = async (row) => {
    setDetail(null)
    setDetailLoading(true)
    setCoveragePage(1)
    setCoverageSearch('')
    detailDrawer.onOpen()
    try {
      setDetail(await getManualCourier(row.id, { pincodePage: 1, pincodeLimit: 100 }))
    } catch (error) {
      toast({ title: 'Could not load courier coverage', status: 'error' })
    } finally {
      setDetailLoading(false)
    }
  }

  const loadCoverage = async (page = coveragePage, search = coverageSearch) => {
    if (!detail?.id) return
    setDetailLoading(true)
    try {
      const next = await getManualCourier(detail.id, {
        pincodePage: page,
        pincodeLimit: 100,
        pincodeSearch: search.trim(),
      })
      setCoveragePage(page)
      setDetail(next)
    } catch (error) {
      toast({
        title: 'Could not load pincode coverage',
        description: error?.response?.data?.message,
        status: 'error',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const save = async () => {
    if (!form.displayName.trim() || !form.code.trim()) {
      toast({ title: 'Courier name and code are required', status: 'warning' })
      return
    }
    if (!form.supportsB2c && !form.supportsB2b) {
      toast({ title: 'Enable B2C, B2B, or both', status: 'warning' })
      return
    }
    if (!form.supportsPrepaid && !form.supportsCod) {
      toast({ title: 'Enable prepaid, COD, or both', status: 'warning' })
      return
    }
    const payload = {
      ...form,
      minWeightKg: Number(form.minWeightKg),
      maxWeightKg: Number(form.maxWeightKg),
      pincodes: parsePincodes(form.pincodes),
    }
    setSaving(true)
    try {
      if (editing) {
        await updateManualCourier(editing.id, payload)
        if (payload.pincodes.length) {
          await replaceManualCourierPincodes(editing.id, payload.pincodes)
        }
      } else {
        await createManualCourier(payload)
      }
      toast({ title: editing ? 'Courier updated' : 'Courier created', status: 'success' })
      editor.onClose()
      await load()
    } catch (error) {
      toast({
        title: 'Could not save courier',
        description: error?.response?.data?.message || error.message,
        status: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const uploadCsv = async (file) => {
    if (!detail || !file) return
    setSaving(true)
    try {
      const response = await importManualCourierPincodes(detail.id, file, importMode)
      toast({ title: response.message || 'Pincodes imported', status: 'success' })
      setCoveragePage(1)
      setCoverageSearch('')
      setDetail(await getManualCourier(detail.id, { pincodePage: 1, pincodeLimit: 100 }))
      await load()
    } catch (error) {
      toast({
        title: 'Pincode import failed',
        description: error?.response?.data?.message,
        status: 'error',
      })
    } finally {
      setSaving(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={5}>
      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} gap={3} wrap="wrap">
        <Box>
          <Text fontSize="2xl" fontWeight="700">
            Manual Courier Setup
          </Text>
          <Text color="gray.500" fontSize="sm">
            Manage commercial courier identities, serviceable pincodes, weight limits and payment support.
          </Text>
        </Box>
        <HStack>
          <Button as={RouterLink} to="/admin/manual-courier/shipments" variant="outline">
            Shipment operations
          </Button>
          <Button colorScheme="brand" leftIcon={<AddIcon />} onClick={openCreate}>
            Add courier
          </Button>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
        <Metric label="Configured couriers" value={rows.length} />
        <Metric label="Active couriers" value={totals.active} />
        <Metric label="Pincode coverage" value={totals.coverage.toLocaleString('en-IN')} />
        <Metric label="Shipments booked" value={totals.shipments.toLocaleString('en-IN')} />
      </SimpleGrid>

      <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
        <InputGroup maxW={{ md: '420px' }}>
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.400" />
          </InputLeftElement>
          <Input
            bg="white"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, code or courier ID"
          />
        </InputGroup>
        <Select
          bg="white"
          maxW={{ md: '190px' }}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" overflowX="auto">
        {loading ? (
          <Flex p={12} justify="center">
            <Spinner />
          </Flex>
        ) : (
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Courier</Th>
                <Th>Services</Th>
                <Th>Payments</Th>
                <Th>Weight</Th>
                <Th isNumeric>Pincodes</Th>
                <Th isNumeric>Shipments</Th>
                <Th>Status</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filtered.map((row) => (
                <Tr key={row.id}>
                  <Td>
                    <Text fontWeight="600">{row.displayName}</Text>
                    <Text color="gray.500" fontSize="xs">
                      {row.code} / ID {row.courierId}
                    </Text>
                  </Td>
                  <Td>
                    <HStack>
                      {row.supportsB2c && <Badge colorScheme="blue">B2C</Badge>}
                      {row.supportsB2b && <Badge colorScheme="purple">B2B</Badge>}
                    </HStack>
                  </Td>
                  <Td>
                    <HStack>
                      {row.supportsPrepaid && <Badge>Prepaid</Badge>}
                      {row.supportsCod && <Badge colorScheme="green">COD</Badge>}
                    </HStack>
                  </Td>
                  <Td>
                    {row.minWeightKg}-{row.maxWeightKg} kg
                  </Td>
                  <Td isNumeric>
                    <Button variant="link" size="sm" onClick={() => openDetail(row)}>
                      {Number(row.pincodeCount || 0).toLocaleString('en-IN')}
                    </Button>
                  </Td>
                  <Td isNumeric>{Number(row.shipmentCount || 0).toLocaleString('en-IN')}</Td>
                  <Td>
                    <Badge colorScheme={row.isEnabled ? 'green' : 'gray'}>
                      {row.isEnabled ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    <HStack justify="flex-end">
                      <Tooltip label="Edit courier">
                        <IconButton
                          aria-label="Edit courier"
                          size="sm"
                          icon={<EditIcon />}
                          onClick={() => openEdit(row)}
                        />
                      </Tooltip>
                      <Tooltip label="View pincode coverage">
                        <IconButton
                          aria-label="View pincode coverage"
                          size="sm"
                          icon={<SearchIcon />}
                          onClick={() => openDetail(row)}
                        />
                      </Tooltip>
                    </HStack>
                  </Td>
                </Tr>
              ))}
              {!filtered.length && (
                <Tr>
                  <Td colSpan={8} py={10} textAlign="center" color="gray.500">
                    No couriers match these filters.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        )}
      </Box>

      <Modal isOpen={editor.isOpen} onClose={editor.onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editing ? 'Edit manual courier' : 'Create manual courier'}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
              <FormControl isRequired>
                <FormLabel>Courier name</FormLabel>
                <Input
                  value={form.displayName}
                  onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                  placeholder="Northline Express"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Internal code</FormLabel>
                <Input
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                  placeholder="NORTHLINE"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Minimum weight (kg)</FormLabel>
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.minWeightKg}
                  onChange={(event) => setForm({ ...form, minWeightKg: event.target.value })}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Maximum weight (kg)</FormLabel>
                <Input
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={form.maxWeightKg}
                  onChange={(event) => setForm({ ...form, maxWeightKg: event.target.value })}
                />
              </FormControl>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <FormLabel mb={2}>Shipment types</FormLabel>
                <HStack spacing={6}>
                  <Checkbox
                    isChecked={form.supportsB2c}
                    onChange={(event) => setForm({ ...form, supportsB2c: event.target.checked })}
                  >
                    B2C
                  </Checkbox>
                  <Checkbox
                    isChecked={form.supportsB2b}
                    onChange={(event) => setForm({ ...form, supportsB2b: event.target.checked })}
                  >
                    B2B
                  </Checkbox>
                </HStack>
              </GridItem>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <FormLabel mb={2}>Payment support</FormLabel>
                <HStack spacing={6}>
                  <Checkbox
                    isChecked={form.supportsPrepaid}
                    onChange={(event) =>
                      setForm({ ...form, supportsPrepaid: event.target.checked })
                    }
                  >
                    Prepaid
                  </Checkbox>
                  <Checkbox
                    isChecked={form.supportsCod}
                    onChange={(event) => setForm({ ...form, supportsCod: event.target.checked })}
                  >
                    COD
                  </Checkbox>
                </HStack>
              </GridItem>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <FormControl>
                  <FormLabel>
                    Pincodes {editing ? '(replace only when provided)' : ''}
                  </FormLabel>
                  <Textarea
                    value={form.pincodes}
                    onChange={(event) => setForm({ ...form, pincodes: event.target.value })}
                    placeholder="110001, 110002, 110003"
                    minH="110px"
                  />
                </FormControl>
              </GridItem>
              <GridItem colSpan={{ base: 1, md: 2 }}>
                <Flex justify="space-between" align="center">
                  <Text fontWeight="600">Courier active</Text>
                  <Switch
                    colorScheme="green"
                    isChecked={form.isEnabled}
                    onChange={(event) => setForm({ ...form, isEnabled: event.target.checked })}
                  />
                </Flex>
              </GridItem>
            </Grid>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button variant="ghost" onClick={editor.onClose}>
              Cancel
            </Button>
            <Button colorScheme="brand" isLoading={saving} leftIcon={<CheckIcon />} onClick={save}>
              Save courier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Drawer isOpen={detailDrawer.isOpen} onClose={detailDrawer.onClose} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Pincode coverage</DrawerHeader>
          <DrawerBody>
            {detailLoading ? (
              <Spinner />
            ) : detail ? (
              <VStack align="stretch" spacing={5}>
                <Box>
                  <Text fontWeight="700" fontSize="lg">
                    {detail.displayName}
                  </Text>
                  <Text color="gray.500" fontSize="sm">
                    Both pickup and destination pincodes must be in this coverage list.
                  </Text>
                </Box>
                <Divider />
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={coverageSearch}
                    onChange={(event) => setCoverageSearch(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') loadCoverage(1, coverageSearch)
                    }}
                    placeholder="Search pincode"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Search pincode"
                      icon={<SearchIcon />}
                      size="sm"
                      variant="ghost"
                      onClick={() => loadCoverage(1, coverageSearch)}
                    />
                  </InputRightElement>
                </InputGroup>
                <Box>
                  <FormLabel>Import CSV</FormLabel>
                  <HStack align="stretch">
                    <Select
                      maxW="130px"
                      value={importMode}
                      onChange={(event) => setImportMode(event.target.value)}
                    >
                      <option value="append">Append</option>
                      <option value="replace">Replace</option>
                    </Select>
                    <Input
                      ref={fileRef}
                      type="file"
                      accept=".csv,text/csv"
                      p={1}
                      onChange={(event) => uploadCsv(event.target.files?.[0])}
                    />
                  </HStack>
                </Box>
                <Text fontSize="sm" fontWeight="600">
                  {Number(detail.pincodeTotal || 0).toLocaleString('en-IN')} serviceable pincodes
                </Text>
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" maxH="55vh" overflowY="auto">
                  {detail.pincodes.map((entry) => (
                    <Flex
                      key={entry.id}
                      px={3}
                      py={2}
                      align="center"
                      justify="space-between"
                      borderBottom="1px solid"
                      borderColor="gray.100"
                    >
                      <Text fontFamily="mono">{entry.pincode}</Text>
                      <Tooltip label="Remove pincode">
                        <IconButton
                          aria-label="Remove pincode"
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          icon={<DeleteIcon />}
                          onClick={async () => {
                            await removeManualCourierPincode(detail.id, entry.pincode)
                            await loadCoverage(coveragePage, coverageSearch)
                            await load()
                          }}
                        />
                      </Tooltip>
                    </Flex>
                  ))}
                  {!detail.pincodes.length && (
                    <Text p={6} color="gray.500" textAlign="center">
                      No serviceable pincodes configured.
                    </Text>
                  )}
                </Box>
                <Flex justify="space-between" align="center">
                  <Button
                    size="sm"
                    isDisabled={coveragePage <= 1}
                    onClick={() => loadCoverage(coveragePage - 1, coverageSearch)}
                  >
                    Previous
                  </Button>
                  <Text fontSize="sm">
                    Page {coveragePage} of {Math.max(1, Number(detail.pincodeTotalPages || 1))}
                  </Text>
                  <Button
                    size="sm"
                    isDisabled={coveragePage >= Number(detail.pincodeTotalPages || 1)}
                    onClick={() => loadCoverage(coveragePage + 1, coverageSearch)}
                  >
                    Next
                  </Button>
                </Flex>
              </VStack>
            ) : null}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  )
}

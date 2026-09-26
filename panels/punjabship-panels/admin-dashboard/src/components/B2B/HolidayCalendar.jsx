import {
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
  Text,
  Textarea,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { IconPlus, IconTrash, IconCalendar as TablerIconCalendar } from '@tabler/icons-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { useCouriers } from '../../hooks/useCouriers'
import { b2bAdminService } from '../../services/b2bAdmin.service'

const localizer = momentLocalizer(moment)

const HOLIDAY_TYPES = [
  { value: 'national', label: 'National Holiday', color: 'red' },
  { value: 'state', label: 'State Holiday', color: 'blue' },
  { value: 'courier', label: 'Courier Holiday', color: 'purple' },
]

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry',
]

const HolidayCalendar = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedHoliday, setSelectedHoliday] = useState(null)
  const [deleteHolidayId, setDeleteHolidayId] = useState(null)
  const [filters, setFilters] = useState({
    type: '',
    state: '',
    courierId: '',
    serviceProvider: '',
  })

  const { data: couriers = [] } = useCouriers()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    type: 'national',
    state: '',
    courierId: '',
    serviceProvider: '',
    description: '',
    isRecurring: false,
    year: '',
    isActive: true,
  })

  // Get current month start and end for initial load
  const currentMonth = moment()
  const monthStart = currentMonth.clone().startOf('month').format('YYYY-MM-DD')
  const monthEnd = currentMonth.clone().endOf('month').format('YYYY-MM-DD')

  // Seed holiday mutation (defined early so it can be used in useQuery)
  const seedMutation = useMutation({
    mutationFn: (year) => b2bAdminService.seedNationalHolidays(year),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['holidays'])
      queryClient.invalidateQueries(['holidays-count'])
      toast({
        title: 'National holidays seeded',
        description: data?.message || `Created ${data?.data?.created?.length || 0} new holidays`,
        status: 'success',
        duration: 5000,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to seed holidays',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Fetch holidays - expand range to show more context
  const expandedStart = moment(monthStart).subtract(1, 'month').format('YYYY-MM-DD')
  const expandedEnd = moment(monthEnd).add(1, 'month').format('YYYY-MM-DD')

  const { data: holidays = [], isLoading } = useQuery({
    queryKey: ['holidays', filters, expandedStart, expandedEnd],
    queryFn: () =>
      b2bAdminService.getHolidays({
        start_date: expandedStart,
        end_date: expandedEnd,
        ...filters,
      }),
  })

  // Transform holidays for calendar
  const calendarEvents = useMemo(() => {
    return holidays.map((holiday) => {
      const date = moment(holiday.date)
      const typeConfig = HOLIDAY_TYPES.find((t) => t.value === holiday.type) || HOLIDAY_TYPES[0]

      return {
        id: holiday.id,
        title: holiday.name,
        start: date.toDate(),
        end: date.toDate(),
        allDay: true,
        holiday: holiday,
        type: holiday.type,
        typeColor: typeConfig.color,
      }
    })
  }, [holidays])

  // Create holiday mutation
  const createMutation = useMutation({
    mutationFn: (data) => b2bAdminService.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['holidays'])
      queryClient.invalidateQueries(['holidays-count'])
      toast({
        title: 'Holiday created',
        status: 'success',
        duration: 3000,
      })
      onClose()
      resetForm()
    },
    onError: (error) => {
      toast({
        title: 'Failed to create holiday',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Update holiday mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => b2bAdminService.updateHoliday(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['holidays'])
      queryClient.invalidateQueries(['holidays-count'])
      toast({
        title: 'Holiday updated',
        status: 'success',
        duration: 3000,
      })
      onClose()
      resetForm()
    },
    onError: (error) => {
      toast({
        title: 'Failed to update holiday',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  // Delete holiday mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => b2bAdminService.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['holidays'])
      queryClient.invalidateQueries(['holidays-count'])
      toast({
        title: 'Holiday deleted',
        status: 'success',
        duration: 3000,
      })
      onDeleteClose()
      setDeleteHolidayId(null)
      resetForm()
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete holiday',
        description: error.response?.data?.error || error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  const resetForm = () => {
    setFormData({
      name: '',
      date: '',
      type: 'national',
      state: '',
      courierId: '',
      serviceProvider: '',
      description: '',
      isRecurring: false,
      year: '',
      isActive: true,
    })
    setSelectedHoliday(null)
    setSelectedDate(null)
  }

  const handleDateSelect = ({ start }) => {
    setSelectedDate(moment(start).format('YYYY-MM-DD'))
    resetForm()
    setFormData((prev) => ({ ...prev, date: moment(start).format('YYYY-MM-DD') }))
    onOpen()
  }

  const handleEventSelect = (event) => {
    const holiday = event.holiday
    setSelectedHoliday(holiday)
    setFormData({
      name: holiday.name,
      date: holiday.date,
      type: holiday.type,
      state: holiday.state || '',
      courierId: holiday.courier_id?.toString() || '',
      serviceProvider: holiday.service_provider || '',
      description: holiday.description || '',
      isRecurring: holiday.is_recurring || false,
      year: holiday.year?.toString() || '',
      isActive: holiday.is_active !== false,
    })
    setSelectedDate(null)
    onOpen()
  }

  const handleSubmit = () => {
    const payload = {
      name: formData.name,
      date: formData.date,
      type: formData.type,
      state: formData.type === 'state' ? formData.state : null,
      courier_id:
        formData.type === 'courier'
          ? formData.courierId
            ? Number(formData.courierId)
            : null
          : null,
      service_provider: formData.type === 'courier' ? formData.serviceProvider : null,
      description: formData.description || null,
      is_recurring: formData.isRecurring,
      year: formData.isRecurring ? null : formData.year ? Number(formData.year) : null,
      is_active: formData.isActive,
    }

    if (selectedHoliday) {
      updateMutation.mutate({ id: selectedHoliday.id, ...payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (holidayId) => {
    setDeleteHolidayId(holidayId)
    onDeleteOpen()
  }

  const confirmDelete = () => {
    if (deleteHolidayId) {
      deleteMutation.mutate(deleteHolidayId)
    }
  }

  const eventColorMap = {
    red: useColorModeValue('red.500', 'red.400'),
    blue: useColorModeValue('blue.500', 'blue.400'),
    purple: useColorModeValue('purple.500', 'purple.400'),
  }

  const eventStyleGetter = (event) => {
    const typeConfig = HOLIDAY_TYPES.find((t) => t.value === event.type) || HOLIDAY_TYPES[0]
    return {
      style: {
        backgroundColor: eventColorMap[typeConfig.color] || eventColorMap.red,
        color: 'white',
        borderRadius: '6px',
        border: 'none',
        padding: '4px 8px',
        fontSize: '12px',
        fontWeight: '600',
        boxShadow: 'sm',
      },
    }
  }

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const textColor = useColorModeValue('gray.700', 'gray.300')

  const todayBg = useColorModeValue('blue.50', 'blue.900')
  const offRangeBg = useColorModeValue('gray.50', 'gray.900')
  const toolbarHoverBg = useColorModeValue('gray.100', 'gray.700')

  return (
    <Box py={4}>
      <Box maxW="100%" mx="auto" px={4}>
        <VStack spacing={4} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={4}>
            <Box>
              <Text fontSize="2xl" fontWeight="bold" mb={1}>
                Holiday Calendar
              </Text>
              <Text color={textColor} fontSize="sm">
                Manage national, state, and courier-specific holidays for B2B holiday charges.
                Sundays are automatically considered holidays.
              </Text>
            </Box>
            <HStack spacing={3}>
              <Button
                leftIcon={<TablerIconCalendar size={18} />}
                onClick={() => seedMutation.mutate(moment().year())}
                isLoading={seedMutation.isPending}
                variant="outline"
                size="sm"
              >
                Seed {moment().year()} Holidays
              </Button>
              <Button
                leftIcon={<IconPlus size={18} />}
                onClick={() => {
                  resetForm()
                  onOpen()
                }}
                colorScheme="blue"
                size="sm"
              >
                Add Holiday
              </Button>
            </HStack>
          </Flex>

          {/* Filters */}
          <Box bg={cardBg} p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
            <HStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Type</FormLabel>
                <Select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  size="sm"
                >
                  <option value="">All Types</option>
                  {HOLIDAY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>
              {filters.type === 'state' && (
                <FormControl>
                  <FormLabel fontSize="sm">State</FormLabel>
                  <Select
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    size="sm"
                  >
                    <option value="">All States</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}
              {filters.type === 'courier' && (
                <>
                  <FormControl>
                    <FormLabel fontSize="sm">Courier</FormLabel>
                    <Select
                      value={filters.courierId}
                      onChange={(e) => setFilters({ ...filters, courierId: e.target.value })}
                      size="sm"
                    >
                      <option value="">All Couriers</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  setFilters({ type: '', state: '', courierId: '', serviceProvider: '' })
                }
              >
                Clear Filters
              </Button>
            </HStack>
          </Box>

          {/* Calendar */}
          <Box
            bg={cardBg}
            p={6}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            {isLoading ? (
              <Box textAlign="center" py={20}>
                <Text color={textColor}>Loading holidays...</Text>
              </Box>
            ) : (
              <Box
                sx={{
                  '& .rbc-calendar': {
                    fontFamily: 'inherit',
                  },
                  '& .rbc-header': {
                    borderBottom: `2px solid`,
                    borderBottomColor: borderColor,
                    padding: '12px 8px',
                    fontWeight: '600',
                    color: textColor,
                  },
                  '& .rbc-day-bg': {
                    borderColor: borderColor,
                  },
                  '& .rbc-today': {
                    backgroundColor: todayBg,
                  },
                  '& .rbc-off-range-bg': {
                    backgroundColor: offRangeBg,
                  },
                  '& .rbc-event': {
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 'sm',
                    },
                  },
                  '& .rbc-event-content': {
                    overflow: 'visible',
                  },
                  '& .rbc-toolbar': {
                    marginBottom: '20px',
                    '& button': {
                      borderColor: borderColor,
                      color: textColor,
                      '&:hover': {
                        backgroundColor: toolbarHoverBg,
                      },
                      '&.rbc-active': {
                        backgroundColor: 'blue.500',
                        color: 'white',
                        borderColor: 'blue.500',
                      },
                    },
                  },
                }}
              >
                <Calendar
                  localizer={localizer}
                  events={calendarEvents}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 650 }}
                  onSelectSlot={handleDateSelect}
                  onSelectEvent={handleEventSelect}
                  selectable
                  eventPropGetter={eventStyleGetter}
                  views={['month', 'week', 'day']}
                  defaultView="month"
                  popup
                  messages={{
                    next: 'Next',
                    previous: 'Previous',
                    today: 'Today',
                    month: 'Month',
                    week: 'Week',
                    day: 'Day',
                  }}
                />
              </Box>
            )}
          </Box>

          {/* Legend and Stats */}
          <Box
            bg={cardBg}
            p={4}
            borderRadius="lg"
            borderWidth="1px"
            borderColor={borderColor}
            shadow="sm"
          >
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Box>
                <Text fontWeight="bold" mb={3} fontSize="md">
                  Legend
                </Text>
                <HStack spacing={4} flexWrap="wrap">
                  {HOLIDAY_TYPES.map((type) => (
                    <HStack key={type.value} spacing={2}>
                      <Box
                        w={4}
                        h={4}
                        borderRadius="sm"
                        bg={`${type.color}.500`}
                        borderWidth="1px"
                        borderColor={borderColor}
                      />
                      <Text fontSize="sm" color={textColor}>
                        {type.label}
                      </Text>
                    </HStack>
                  ))}
                </HStack>
              </Box>
              <Box textAlign="right">
                <Text fontSize="sm" color={textColor} mb={1}>
                  Total Holidays
                </Text>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {holidays.length}
                </Text>
              </Box>
            </Flex>
          </Box>
        </VStack>
      </Box>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose()
          resetForm()
        }}
        size="lg"
      >
        <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
        <ModalContent>
          <ModalHeader fontSize="xl" fontWeight="bold">
            {selectedHoliday ? 'Edit Holiday' : 'Add Holiday'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Holiday Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Republic Day, Diwali"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {HOLIDAY_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </FormControl>

              {formData.type === 'state' && (
                <FormControl isRequired>
                  <FormLabel>State</FormLabel>
                  <Select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  >
                    <option value="">Select State</option>
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              {formData.type === 'courier' && (
                <>
                  <FormControl>
                    <FormLabel>Courier</FormLabel>
                    <Select
                      value={formData.courierId}
                      onChange={(e) => setFormData({ ...formData, courierId: e.target.value })}
                    >
                      <option value="">All Couriers</option>
                      {couriers.map((courier) => (
                        <option key={courier.id} value={courier.id}>
                          {courier.name}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Service Provider</FormLabel>
                    <Select
                      placeholder="Select Service Provider"
                      value={formData.serviceProvider}
                      onChange={(e) =>
                        setFormData({ ...formData, serviceProvider: e.target.value })
                      }
                    >
                      <option value="delhivery">Delhivery</option>
                      <option value="ekart">Ekart</option>
                      <option value="amazon">Amazon</option>
                    </Select>
                  </FormControl>
                </>
              )}

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                />
              </FormControl>

              <FormControl>
                <Checkbox
                  isChecked={formData.isRecurring}
                  onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                >
                  Recurring (applies every year)
                </Checkbox>
              </FormControl>

              {!formData.isRecurring && (
                <FormControl>
                  <FormLabel>Year (optional, leave empty for all years)</FormLabel>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="e.g., 2024"
                  />
                </FormControl>
              )}

              <FormControl>
                <Checkbox
                  isChecked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                >
                  Active
                </Checkbox>
              </FormControl>

              {selectedHoliday && (
                <Button
                  colorScheme="red"
                  variant="outline"
                  leftIcon={<IconTrash size={18} />}
                  onClick={() => handleDelete(selectedHoliday.id)}
                  w="full"
                >
                  Delete Holiday
                </Button>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSubmit}
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {selectedHoliday ? 'Update' : 'Create'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Holiday</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text>Are you sure you want to delete this holiday? This action cannot be undone.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onDeleteClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDelete} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default HolidayCalendar

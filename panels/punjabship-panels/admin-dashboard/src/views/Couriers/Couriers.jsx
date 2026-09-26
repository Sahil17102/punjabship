import { AddIcon, DeleteIcon, SearchIcon } from '@chakra-ui/icons'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
  Select,
  Spinner,
  Switch,
  Text,
  Tooltip,
  useToast,
  VStack,
} from '@chakra-ui/react'
import CustomModal from 'components/Modal/CustomModal'
import {
  useCouriers,
  useCreateCourier,
  useDeleteCourier,
  useUpdateCourierStatus,
} from 'hooks/useCouriers'
import { useDebounce } from 'hooks/useDebounce'
import { useState } from 'react'

import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'
import { COURIER_PROVIDER_OPTIONS } from '../../constants/courierProviders'

const Couriers = () => {
  const [filters, setFilters] = useState({
    search: '',
    serviceProvider: '',
  })
  const debouncedSearch = useDebounce(filters.search, 500)

  const { data: couriers = [], isLoading, error } = useCouriers({
    search: debouncedSearch || undefined,
    serviceProvider: filters.serviceProvider || undefined,
  })
  const createCourier = useCreateCourier()
  const deleteCourier = useDeleteCourier()
  const updateCourierStatus = useUpdateCourierStatus()
  const [isModalOpen, setModalOpen] = useState(false)
  // In your component:
  const [openPopoverId, setOpenPopoverId] = useState(null)
  const [formData, setFormData] = useState({ businessType: ['b2c', 'b2b'] })
  const toast = useToast()

  const columnKeys = ['id', 'name', 'serviceProvider', 'businessType', 'isEnabled', 'createdAt']
  const captions = [
    'Courier ID',
    'Courier Name',
    'Service Provider',
    'Business Type',
    'Status',
    'Created At',
  ]

  const renderers = {
    isEnabled: (value) => (
      <Text fontWeight="semibold" color={value ? 'green.500' : 'red.500'}>
        {value ? 'Enabled' : 'Disabled'}
      </Text>
    ),
    businessType: (value, row) => {
      const types = Array.isArray(value) ? value : value ? [value] : ['b2c', 'b2b']

      const handleToggle = (type) => {
        const currentTypes = types || ['b2c', 'b2b']
        let newTypes = []

        if (currentTypes.includes(type)) {
          // Unchecking - only allow if other type is selected
          if (type === 'b2c' && currentTypes.includes('b2b')) {
            newTypes = ['b2b']
          } else if (type === 'b2b' && currentTypes.includes('b2c')) {
            newTypes = ['b2c']
          } else {
            // Can't uncheck the last one
            return
          }
        } else {
          // Checking - add the type
          newTypes = [...currentTypes, type]
        }

        updateCourierStatus.mutate(
          {
            id: row.id,
            serviceProvider: row.serviceProvider,
            businessType: newTypes,
          },
          {
            onSuccess: () => {
              toast({
                title: 'Business type updated successfully',
                status: 'success',
              })
            },
            onError: () => {
              toast({
                title: 'Failed to update business type',
                status: 'error',
              })
            },
          },
        )
      }

      const isB2CActive = types.includes('b2c')
      const isB2BActive = types.includes('b2b')

      return (
        <HStack spacing={1.5}>
          <Tooltip
            label={
              isB2CActive
                ? 'Click to disable B2C support for this courier'
                : 'Click to enable B2C support for this courier'
            }
            hasArrow
            placement="top"
          >
            <Badge
              as="button"
              cursor="pointer"
              colorScheme={isB2CActive ? 'facebook' : 'gray'}
              variant={isB2CActive ? 'solid' : 'outline'}
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
              transition="all 0.2s"
              _hover={{
                opacity: 0.8,
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              opacity={isB2CActive ? 1 : 0.5}
              onClick={() => handleToggle('b2c')}
              disabled={updateCourierStatus.isPending}
            >
              B2C
            </Badge>
          </Tooltip>
          <Tooltip
            label={
              isB2BActive
                ? 'Click to disable B2B support for this courier'
                : 'Click to enable B2B support for this courier'
            }
            hasArrow
            placement="top"
          >
            <Badge
              as="button"
              cursor="pointer"
              colorScheme={isB2BActive ? 'facebook' : 'gray'}
              variant={isB2BActive ? 'solid' : 'outline'}
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="md"
              transition="all 0.2s"
              _hover={{
                opacity: 0.8,
                transform: 'scale(1.05)',
              }}
              _active={{
                transform: 'scale(0.95)',
              }}
              opacity={isB2BActive ? 1 : 0.5}
              onClick={() => handleToggle('b2b')}
              disabled={updateCourierStatus.isPending}
            >
              B2B
            </Badge>
          </Tooltip>
        </HStack>
      )
    },
    createdAt: (value) => {
      if (!value) return ''
      return new Date(value).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    },
  }

  const handleSave = () => {
    if (!formData?.courierName || !formData?.courierId || !formData?.serviceProvider) {
      toast({ title: 'Please fill all the required fields', status: 'warning' })
      return
    }

    // Ensure at least one business type is selected
    const businessType =
      formData?.businessType && formData.businessType.length > 0
        ? formData.businessType
        : ['b2c', 'b2b']

    createCourier.mutate(
      { ...formData, businessType },
      {
        onSuccess: () => {
          toast({ title: 'Courier added successfully', status: 'success' })
          setFormData({ businessType: ['b2c', 'b2b'] })
          setModalOpen(false)
        },
        onError: (error) => {
          toast({
            title: error?.response?.data?.message ?? 'Failed to add courier',
            status: 'error',
          })
        },
      },
    )
  }

  if (isLoading) return <Spinner size="md" />
  if (error) return <Text color="red.500">Failed to load couriers</Text>

  // Check if there are Delhivery couriers and show info
  const delhiveryCouriers = couriers.filter((c) => c.serviceProvider === 'delhivery')
  const hasDelhiveryExpress = delhiveryCouriers.some((c) => c.id === 99)
  const hasDelhiverySurface = delhiveryCouriers.some((c) => c.id === 100)

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      {/* Delhivery Service Info */}
      {delhiveryCouriers.length > 0 && (
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle fontSize="sm" mb={1}>
              Delhivery Service Information
            </AlertTitle>
            <AlertDescription fontSize="xs">
              <Text mb={1}>
                <strong>Delhivery Express</strong> (ID: 99) - Uses{' '}
                <Badge colorScheme="blue">Express</Badge> shipping mode (air transport)
              </Text>
              <Text>
                <strong>Delhivery Surface</strong> (ID: 100) - Uses{' '}
                <Badge colorScheme="green">Surface</Badge> shipping mode (road transport)
              </Text>
              {!hasDelhiveryExpress && (
                <Text mt={2} color="orange.600" fontSize="xs">
                  ⚠️ Delhivery Express (ID: 99) not found
                </Text>
              )}
              {!hasDelhiverySurface && (
                <Text mt={2} color="orange.600" fontSize="xs">
                  ⚠️ Delhivery Surface (ID: 100) not found
                </Text>
              )}
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Filters and Add Courier Button */}
      <Flex direction={{ base: 'column', md: 'row' }} gap={4} justifyContent="space-between">
        <HStack spacing={3} flex={1} maxW={{ md: '600px' }}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search by name or ID..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </InputGroup>
          <Select
            placeholder="All Providers"
            value={filters.serviceProvider}
            onChange={(e) => setFilters((prev) => ({ ...prev, serviceProvider: e.target.value }))}
            maxW="200px"
          >
            {COURIER_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </Select>
          {(filters.search || filters.serviceProvider) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setFilters({ search: '', serviceProvider: '' })}
            >
              Clear
            </Button>
          )}
        </HStack>
        <Button
          colorScheme="brand"
          leftIcon={<AddIcon />}
          onClick={() => {
            setFormData({ businessType: ['b2c', 'b2b'] })
            setModalOpen(true)
          }}
        >
          Add Courier
        </Button>
      </Flex>

      {/* Couriers Table */}
      <GenericTable
        title="Couriers List"
        data={couriers}
        columnKeys={columnKeys}
        captions={captions}
        renderers={renderers}
        loading={isLoading}
        paginated={false}
        renderActions={(row) => (
          <HStack spacing={3} align="center">
            <Switch
              colorScheme="green"
              isChecked={row.isEnabled}
              onChange={() =>
                updateCourierStatus.mutate(
                  {
                    id: row.id,
                    serviceProvider: row.serviceProvider,
                    isEnabled: !row.isEnabled,
                  },
                  {
                    onSuccess: () => {
                      toast({
                        title: `Courier ${row.isEnabled ? 'disabled' : 'enabled'} successfully`,
                        status: 'success',
                      })
                    },
                    onError: () => {
                      toast({
                        title: 'Failed to update courier status',
                        status: 'error',
                      })
                    },
                  },
                )
              }
            />
            <Popover
              isLazy
              placement="auto"
              closeOnBlur={true}
              isOpen={openPopoverId === row?.id} // control open state per row
              onClose={() => setOpenPopoverId(null)}
            >
              <PopoverTrigger>
                <IconButton
                  icon={<DeleteIcon color="red" />}
                  aria-label="Delete courier"
                  size="sm"
                  onClick={() => setOpenPopoverId(row.id)}
                />
              </PopoverTrigger>
              <Portal>
                <PopoverContent w="200px">
                  <PopoverArrow />
                  <PopoverCloseButton onClick={() => setOpenPopoverId(null)} />
                  <PopoverHeader fontSize="sm">Confirm Delete</PopoverHeader>
                  <PopoverBody fontSize="sm">
                    Are you sure you want to delete <b>{row.name}</b>?
                  </PopoverBody>
                  <PopoverFooter display="flex" justifyContent="flex-end" gap={2}>
                    <Button size="xs" onClick={() => setOpenPopoverId(null)}>
                      Cancel
                    </Button>
                    <Button
                      size="xs"
                      colorScheme="red"
                      isLoading={deleteCourier?.isPending}
                      onClick={() => {
                        deleteCourier.mutate(
                          { id: row.id, serviceProvider: row.serviceProvider },
                          {
                            onSuccess: () => {
                              toast({ title: 'Courier deleted', status: 'success' })
                              setOpenPopoverId(null) // ✅ close popover on success
                            },
                            onError: () => {
                              toast({ title: 'Failed to delete', status: 'error' })
                            },
                          },
                        )
                      }}
                    >
                      Delete
                    </Button>
                  </PopoverFooter>
                </PopoverContent>
              </Portal>
            </Popover>
          </HStack>
        )}
      />

      {/* Custom Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false)
          setFormData({ businessType: ['b2c', 'b2b'] })
        }}
        title="Add Courier"
        footer={
          <Flex gap={2}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button colorScheme="blue" onClick={handleSave} isLoading={createCourier?.isPending}>
              Save
            </Button>
          </Flex>
        }
      >
        <VStack spacing={4}>
          <Input
            placeholder="Courier ID"
            required
            isRequired
            value={formData?.courierId}
            onChange={(e) => setFormData((prev) => ({ ...prev, courierId: e.target.value }))}
          />
          <Input
            placeholder="Courier Name"
            value={formData?.courierName}
            required
            isRequired
            onChange={(e) => setFormData((prev) => ({ ...prev, courierName: e.target.value }))}
          />

          <Select
            placeholder="Select Service Provider"
            value={formData?.serviceProvider || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, serviceProvider: e.target.value }))}
            required
            isRequired
          >
            {COURIER_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </Select>

          <FormControl>
            <FormLabel fontSize="sm" fontWeight="medium" mb={2}>
              Business Type
            </FormLabel>
            <VStack spacing={3} align="stretch">
              <HStack spacing={3}>
                <Button
                  flex={1}
                  size="md"
                  colorScheme={formData?.businessType?.includes('b2c') ? 'blue' : 'gray'}
                  variant={formData?.businessType?.includes('b2c') ? 'solid' : 'outline'}
                  onClick={() => {
                    const currentTypes = formData?.businessType || ['b2c', 'b2b']
                    if (currentTypes.includes('b2c')) {
                      // Unchecking B2C - only allow if B2B is selected
                      if (currentTypes.includes('b2b')) {
                        setFormData((prev) => ({ ...prev, businessType: ['b2b'] }))
                      }
                    } else {
                      // Checking B2C
                      setFormData((prev) => ({ ...prev, businessType: [...currentTypes, 'b2c'] }))
                    }
                  }}
                >
                  B2C
                </Button>
                <Button
                  flex={1}
                  size="md"
                  colorScheme={formData?.businessType?.includes('b2b') ? 'purple' : 'gray'}
                  variant={formData?.businessType?.includes('b2b') ? 'solid' : 'outline'}
                  onClick={() => {
                    const currentTypes = formData?.businessType || ['b2c', 'b2b']
                    if (currentTypes.includes('b2b')) {
                      // Unchecking B2B - only allow if B2C is selected
                      if (currentTypes.includes('b2c')) {
                        setFormData((prev) => ({ ...prev, businessType: ['b2c'] }))
                      }
                    } else {
                      // Checking B2B
                      setFormData((prev) => ({ ...prev, businessType: [...currentTypes, 'b2b'] }))
                    }
                  }}
                >
                  B2B
                </Button>
              </HStack>
              <HStack spacing={2} justify="center">
                {formData?.businessType?.includes('b2c') && <Badge colorScheme="blue">B2C</Badge>}
                {formData?.businessType?.includes('b2b') && <Badge colorScheme="purple">B2B</Badge>}
                {(!formData?.businessType || formData.businessType.length === 0) && (
                  <Text fontSize="xs" color="red.500">
                    Select at least one business type
                  </Text>
                )}
              </HStack>
            </VStack>
          </FormControl>
        </VStack>
      </CustomModal>
    </Flex>
  )
}

export default Couriers

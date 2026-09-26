import { Button, Flex, FormControl, FormLabel, Input, Select, useToast } from '@chakra-ui/react'
import { useCreateCourier } from 'hooks/useCouriers'
import { useState } from 'react'
import { COURIER_PROVIDER_OPTIONS } from '../../constants/courierProviders'
import CustomModal from './CustomModal'

const AddCourierModal = ({ isOpen, onClose }) => {
  console.log('isopen', isOpen)
  const toast = useToast()
  const createCourier = useCreateCourier()
  const [courierId, setCourierId] = useState('')
  const [courierName, setCourierName] = useState('')
  const [serviceProvider, setServiceProvider] = useState('')

  const resetForm = () => {
    setCourierId('')
    setCourierName('')
    setServiceProvider('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = () => {
    if (!courierId.trim() || !courierName.trim() || !serviceProvider) {
      return toast({ title: 'Please fill all the required fields', status: 'warning' })
    }

    createCourier.mutate(
      {
        courierId: courierId.trim(),
        courierName: courierName.trim(),
        serviceProvider,
        businessType: ['b2c', 'b2b'],
      },
      {
        onSuccess: () => {
          toast({ title: 'Courier added successfully', status: 'success' })
          handleClose()
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

  if (!isOpen) return null

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Courier"
      footer={
        <Flex justify="flex-end" gap={2}>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={createCourier.isPending || createCourier.isLoading}
          >
            Add Courier
          </Button>
        </Flex>
      }
    >
      <Flex direction="column" p={6} gap={4} bg="white" borderRadius="md" minW="300px">
        <FormControl>
          <FormLabel>Courier ID</FormLabel>
          <Input value={courierId} onChange={(e) => setCourierId(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Courier Name</FormLabel>
          <Input value={courierName} onChange={(e) => setCourierName(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Service Provider</FormLabel>
          <Select
            placeholder="Select Service Provider"
            value={serviceProvider}
            onChange={(e) => setServiceProvider(e.target.value)}
          >
            {COURIER_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </Select>
        </FormControl>
      </Flex>{' '}
    </CustomModal>
  )
}

export default AddCourierModal

import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Switch,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import { usePaymentOptions, useUpdatePaymentOptions } from 'hooks/usePaymentOptions'
import { useEffect, useState } from 'react'
import { FiRefreshCw, FiSave } from 'react-icons/fi'

export default function PaymentOptionsSettings() {
  const { data: paymentOptions, error, isError, isLoading, refetch } = usePaymentOptions()
  const updatePaymentOptions = useUpdatePaymentOptions()
  const toast = useToast()

  const [formData, setFormData] = useState({
    codEnabled: true,
    prepaidEnabled: true,
    minWalletRecharge: 0,
    gstPercent: 0,
  })

  useEffect(() => {
    if (paymentOptions?.settings) {
      setFormData({
        codEnabled: paymentOptions.settings.codEnabled ?? true,
        prepaidEnabled: paymentOptions.settings.prepaidEnabled ?? true,
        minWalletRecharge: paymentOptions.settings.minWalletRecharge ?? 0,
        gstPercent: paymentOptions.settings.gstPercent ?? 0,
      })
    } else if (paymentOptions) {
      // Handle direct response format
      setFormData({
        codEnabled: paymentOptions.codEnabled ?? true,
        prepaidEnabled: paymentOptions.prepaidEnabled ?? true,
        minWalletRecharge: paymentOptions.minWalletRecharge ?? 0,
        gstPercent: paymentOptions.gstPercent ?? 0,
      })
    }
  }, [paymentOptions])

  const handleToggle = (field) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleSave = () => {
    const payload = {
      codEnabled: formData.codEnabled,
      prepaidEnabled: formData.prepaidEnabled,
      minWalletRecharge:
        formData.minWalletRecharge && Number(formData.minWalletRecharge) >= 0
          ? Number(formData.minWalletRecharge)
          : 0,
      gstPercent:
        formData.gstPercent !== '' && Number(formData.gstPercent) >= 0
          ? Number(formData.gstPercent)
          : 0,
    }

    updatePaymentOptions.mutate(payload, {
      onSuccess: () => {
        toast({
          title: 'Payment options updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      },
      onError: (error) => {
        toast({
          title: 'Failed to update payment options',
          description: error?.response?.data?.error || 'An error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      },
    })
  }

  // All hooks must be called before any conditional returns
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const grayBg = useColorModeValue('gray.50', 'gray.700')

  if (isLoading) {
    return (
      <Box pt={{ base: '120px', md: '75px' }}>
        <Text>Loading...</Text>
      </Box>
    )
  }

  if (isError) {
    const message =
      error?.response?.data?.error || error?.message || 'Failed to load payment options'

    return (
      <Box pt={{ base: '120px', md: '75px' }}>
        <Alert status="error" borderRadius="md" alignItems="flex-start">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Payment options could not be loaded</AlertTitle>
            <AlertDescription display="block" mt={1}>
              {message}
            </AlertDescription>
          </Box>
          <Button
            leftIcon={<FiRefreshCw />}
            size="sm"
            ml={4}
            onClick={() => refetch()}
            variant="outline"
          >
            Retry
          </Button>
        </Alert>
      </Box>
    )
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <Box
        bg={cardBg}
        borderColor={borderColor}
        borderWidth="1px"
        borderRadius="lg"
        p={6}
        shadow="md"
      >
        <Box mb={6}>
          <Heading size="md" mb={2}>
            Payment Options Settings
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Control which payment options are available to the merchant in the client forms (orders,
            rate cards, calculators)
          </Text>
        </Box>
        <Box mb={6}>
          <Flex
            justify="space-between"
            align="center"
            mb={4}
            p={4}
            bg={grayBg}
            borderRadius="md"
          >
            <Box>
              <Text fontWeight="semibold" mb={1}>
                Cash on Delivery (COD)
              </Text>
              <Text fontSize="sm" color="gray.500">
                Enable or disable COD payment option in client forms
              </Text>
            </Box>
            <Switch
              isChecked={formData.codEnabled}
              onChange={() => handleToggle('codEnabled')}
              colorScheme="purple"
              size="lg"
            />
          </Flex>

          <Flex
            justify="space-between"
            align="center"
            p={4}
            bg={grayBg}
            borderRadius="md"
          >
            <Box>
              <Text fontWeight="semibold" mb={1}>
                Prepaid
              </Text>
              <Text fontSize="sm" color="gray.500">
                Enable or disable Prepaid payment option in client forms
              </Text>
            </Box>
            <Switch
              isChecked={formData.prepaidEnabled}
              onChange={() => handleToggle('prepaidEnabled')}
              colorScheme="purple"
              size="lg"
            />
          </Flex>

          <Flex
            justify="space-between"
            align="center"
            mt={4}
            p={4}
            bg={grayBg}
            borderRadius="md"
            gap={4}
          >
            <Box flex="1">
              <Text fontWeight="semibold" mb={1}>
                Minimum Wallet Recharge (INR)
              </Text>
              <Text fontSize="sm" color="gray.500">
                Set the minimum amount users must add when recharging their wallet. Set to 0 for no
                minimum.
              </Text>
            </Box>
            <Box width="150px">
              <Input
                type="number"
                min={0}
                step={100}
                value={formData.minWalletRecharge}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    minWalletRecharge: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </Box>
          </Flex>

          <Flex
            justify="space-between"
            align="center"
            mt={4}
            p={4}
            bg={grayBg}
            borderRadius="md"
            gap={4}
          >
            <Box flex="1">
              <Text fontWeight="semibold" mb={1}>
                GST Percent (%)
              </Text>
              <Text fontSize="sm" color="gray.500">
                Set the GST percentage added to courier wallet deductions. Keep 0 until the current
                government rate needs to be applied.
              </Text>
            </Box>
            <Box width="150px">
              <Input
                type="number"
                min={0}
                step={0.01}
                value={formData.gstPercent}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    gstPercent: e.target.value === '' ? '' : Number(e.target.value),
                  }))
                }
                placeholder="0"
              />
            </Box>
          </Flex>
        </Box>

        <Flex justify="flex-end" gap={3}>
          <Button
            onClick={handleSave}
            leftIcon={<FiSave />}
            colorScheme="purple"
            isLoading={updatePaymentOptions.isPending}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </Flex>
      </Box>
    </Box>
  )
}

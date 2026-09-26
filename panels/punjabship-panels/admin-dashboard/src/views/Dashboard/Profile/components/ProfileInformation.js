import { CopyIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  SimpleGrid,
  Text,
  Tooltip,
  useClipboard,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import CardHeader from 'components/Card/CardHeader'
import AssignPlanInline from 'components/UserDetails/AssignPlanInline'
import { useApproveUser, useResetUserPassword, useUpdateUserBusinessType } from 'hooks/useUser'
import { useEffect, useState } from 'react'
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa'

const StatusIcon = ({ status }) =>
  status ? (
    <Icon as={FaCheckCircle} color="green.400" ml="5px" />
  ) : (
    <Icon as={FaTimesCircle} color="red.400" ml="5px" />
  )

const InfoGrid = ({ items }) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const labelColor = useColorModeValue('gray.600', 'gray.300')

  return (
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacingX={{ base: 4, lg: 8 }} spacingY={3} width="100%">
      {items?.map(({ label, value, highlight, isStatus, extra }) => (
        <Flex
          key={label}
          align={{ base: 'flex-start', sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
          gap={1}
          minW="0"
        >
          <Text
            fontSize="sm"
            color={labelColor}
            fontWeight="600"
            minW={{ base: 'auto', sm: '120px' }}
            maxW={{ base: '100%', sm: '120px' }}
            flexShrink={0}
            whiteSpace={{ base: 'normal', sm: 'nowrap' }}
            wordBreak="break-word"
            overflowWrap="break-word"
          >
            {label}:
          </Text>

          {isStatus ? (
            <StatusIcon status={value} />
          ) : (
          <Text
            fontSize="sm"
            color={highlight ? textColor : 'gray.500'}
            fontWeight={highlight ? 'bold' : '400'}
            maxW="100%"
              overflowWrap="break-word"
              wordBreak="break-word"
              whiteSpace="normal"
              flexGrow={1}
              display="flex"
              alignItems="center"
              gap={2}
            >
              {value || '—'}
              {extra ?? null}
            </Text>
          )}
        </Flex>
      ))}
    </SimpleGrid>
  )
}

const ProfileInformation = ({ user }) => {
  const textColor = useColorModeValue('gray.700', 'white')
  const labelColor = useColorModeValue('gray.600', 'gray.300')
  const toast = useToast()

  const approveUserMutation = useApproveUser()
  const resetPasswordMutation = useResetUserPassword()
  const updateBusinessTypeMutation = useUpdateUserBusinessType()
  const [tempPassword, setTempPassword] = useState('')
  const [selectedBusinessTypes, setSelectedBusinessTypes] = useState(user?.businessType || [])
  const { hasCopied, onCopy } = useClipboard(tempPassword || '')

  useEffect(() => {
    setSelectedBusinessTypes(Array.isArray(user?.businessType) ? user.businessType : [])
  }, [user?.businessType])

  const handleApprove = () => approveUserMutation.mutate(user?.userId)
  const handleResetPassword = () => {
    resetPasswordMutation.mutate(user?.userId, {
      onSuccess: (tempPwd) => {
        setTempPassword(tempPwd)
        toast({
          title: 'One-time access generated',
          description: 'The user password was not changed. This code can be used once.',
          status: 'success',
          duration: 6000,
          isClosable: true,
        })
      },
      onError: (error) => {
        toast({
          title: 'One-time access failed',
          description: error?.response?.data?.message || error.message || 'Try again later.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      },
    })
  }

  const businessTypeOptions = ['b2b', 'b2c', 'd2c']
  const hasBusinessTypeChanges =
    JSON.stringify([...(selectedBusinessTypes || [])].sort()) !==
    JSON.stringify([...(Array.isArray(user?.businessType) ? user.businessType : [])].sort())

  const toggleBusinessType = (type) => {
    setSelectedBusinessTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type],
    )
  }

  const handleBusinessTypeSave = () => {
    if (!selectedBusinessTypes.length) {
      toast({
        title: 'Select at least one business type',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    updateBusinessTypeMutation.mutate({
      userId: user?.userId,
      businessType: selectedBusinessTypes,
    })
  }

  const accountSummaryItems = [
    { label: 'Email', value: user?.email },
    { label: 'Email Verified', value: user?.emailVerified, isStatus: true },
    { label: 'Phone', value: user?.phone },
    { label: 'Phone Verified', value: user?.phoneVerified, isStatus: true },
    { label: 'Role', value: user?.role },
    {
      label: 'Approved',
      value: user?.approved ? 'Yes' : 'No',
      extra: user?.approved ? null : (
        <Button
          size="sm"
          colorScheme="green"
          onClick={handleApprove}
          isLoading={approveUserMutation.isPending}
          loadingText="Approving"
        >
          Approve
        </Button>
      ),
    },
  ]

  const activityItems = [
    { label: 'Monthly Orders', value: user?.monthlyOrderCount },
    {
      label: 'Business Type',
      value: Array.isArray(user?.businessType) ? user.businessType.join(', ') : user?.businessType,
    },
    {
      label: 'Created At',
      value: user?.submittedAt ? new Date(user.submittedAt).toLocaleString() : '—',
    },
    {
      label: 'Last Updated',
      value: user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—',
    },
  ]

  return (
    <Flex direction="column" gap={4} width="100%" minW="0">
      {/* Row 1: Account Summary + Assigned Plan */}
      <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={{ base: 3, md: 4 }} alignItems="stretch">
        <Card gridColumn={{ base: 'auto', xl: 'span 8' }} alignSelf="stretch" minW="0">
          <CardHeader p={{ base: '10px 5px', md: '12px 5px' }} mb="6px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              Account Summary
            </Text>
          </CardHeader>
          <CardBody px="5px" display="flex" alignItems="center">
            <InfoGrid items={accountSummaryItems} />
          </CardBody>
        </Card>

        <Card gridColumn={{ base: 'auto', xl: 'span 4' }} maxW="100%" alignSelf="stretch" minW="0">
          <CardHeader p={{ base: '10px 5px', md: '12px 5px' }} mb="6px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              Assigned Plans
            </Text>
          </CardHeader>
          <CardBody px="5px" minW="0">
            <AssignPlanInline
              userId={user?.userId}
              currentPlanId={user?.currentPlanId}
              currentB2CPlanId={user?.currentB2CPlanId}
              currentB2BPlanId={user?.currentB2BPlanId}
            />
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Row 2: One-time Access + KYC & Compliance */}
      <SimpleGrid columns={{ base: 1, xl: 12 }} spacing={{ base: 3, md: 4 }}>
        <Card gridColumn={{ base: 'auto', xl: 'span 4' }} minW="0">
          <CardHeader p="12px 5px" mb="12px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              One-time Panel Access
            </Text>
          </CardHeader>
          <CardBody px="5px" display="flex" flexDirection="column" gap={2}>
            <Text fontSize="sm" color={labelColor}>
              Generate a one-use login password without changing the user's saved password.
            </Text>
            <Button
              colorScheme="purple"
              onClick={handleResetPassword}
              isLoading={resetPasswordMutation.isPending}
              loadingText="Generating"
              width="100%"
            >
              Generate One-time Password
            </Button>

            {tempPassword && (
              <Flex alignItems={'center'}>
                <Text
                  fontSize="sm"
                  color="purple.600"
                  fontWeight="bold"
                  mt={2}
                  wordBreak="break-word"
                >
                  One-time Password: {tempPassword}
                </Text>
                <Tooltip label={hasCopied ? 'Copied!' : 'Copy One-time Password'}>
                  <IconButton
                    icon={<CopyIcon />}
                    size="xs"
                    ml={2}
                    variant="ghost"
                    onClick={onCopy}
                    aria-label="Copy one-time password"
                  />
                </Tooltip>
              </Flex>
            )}
          </CardBody>
        </Card>

        <Card gridColumn={{ base: 'auto', xl: 'span 8' }} minW="0">
          <CardHeader p="12px 5px" mb="12px">
            <Text fontSize="lg" color={textColor} fontWeight="bold">
              KYC & Compliance
            </Text>
          </CardHeader>
          <CardBody px="5px">
            <Flex align="center" justify="space-between" gap={4} maxW="100%" overflow="hidden" wrap="wrap">
              <Box>
                <Text fontSize="sm" color={labelColor} fontWeight="600">
                  Domestic KYC Status
                </Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Seller verification and compliance state
                </Text>
              </Box>
              <StatusBadge
                status={user?.domesticKyc?.status}
                type={
                  user?.domesticKyc?.status === 'verification_in_progress'
                    ? 'info'
                    : user?.domesticKyc?.status === 'pending'
                    ? 'warning'
                    : user?.domesticKyc?.status === 'verified'
                    ? 'success'
                    : 'error'
                }
              />
            </Flex>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Card>
        <CardHeader p="12px 5px" mb="12px">
          <Text fontSize="lg" color={textColor} fontWeight="bold">
            Business Type
          </Text>
        </CardHeader>
        <CardBody px="5px">
          <Flex direction="column" gap={4}>
            <Text fontSize="sm" color={labelColor}>
              Reassign the user’s business type from admin.
            </Text>
            <Flex wrap="wrap" gap={3}>
              {businessTypeOptions.map((type) => {
                const isActive = selectedBusinessTypes.includes(type)
                return (
                  <Button
                    key={type}
                    size="sm"
                    variant={isActive ? 'solid' : 'outline'}
                    colorScheme={type === 'b2b' ? 'purple' : type === 'b2c' ? 'blue' : 'orange'}
                    onClick={() => toggleBusinessType(type)}
                  >
                    {type.toUpperCase()}
                  </Button>
                )
              })}
            </Flex>
            <Flex align="center" justify="space-between" wrap="wrap" gap={3}>
              <Flex wrap="wrap" gap={2}>
                {(selectedBusinessTypes || []).map((type) => (
                  <Badge
                    key={type}
                    colorScheme={type === 'b2b' ? 'purple' : type === 'b2c' ? 'blue' : 'orange'}
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {type.toUpperCase()}
                  </Badge>
                ))}
                {!selectedBusinessTypes.length && <Text fontSize="sm">No business type selected</Text>}
              </Flex>
              <Button
                colorScheme="green"
                onClick={handleBusinessTypeSave}
                isDisabled={!hasBusinessTypeChanges || !selectedBusinessTypes.length}
                isLoading={updateBusinessTypeMutation.isPending}
                loadingText="Saving"
              >
                Save Business Type
              </Button>
            </Flex>
          </Flex>
        </CardBody>
      </Card>

      {/* Activity Section */}
      <Card>
        <CardHeader p="12px 5px" mb="12px">
          <Text fontSize="lg" color={textColor} fontWeight="bold">
            Activity
          </Text>
        </CardHeader>
        <CardBody px="5px">
          <InfoGrid items={activityItems} />
        </CardBody>
      </Card>
    </Flex>
  )
}

export default ProfileInformation

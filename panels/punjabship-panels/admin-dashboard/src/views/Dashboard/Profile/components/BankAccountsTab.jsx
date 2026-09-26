import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  Link,
  SimpleGrid,
  Spinner,
  StackDivider,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import { useUpdateBankAccountStatus, useUserBankAccounts } from 'hooks/useUser'
import { useEffect, useMemo } from 'react'
import BankAccountRow from './BankAccountRow'

const BankAccountCard = ({ account, onUpdateStatus, signedChequeUrl }) => {
  const labelColor = useColorModeValue('gray.600', 'gray.300')
  const valueColor = useColorModeValue('gray.800', 'whiteAlpha.900')
  const cardBg = useColorModeValue('white', 'gray.700')
  const rejectionBg = useColorModeValue('red.50', 'red.900')
  const rejectionColor = useColorModeValue('red.700', 'red.300')

  return (
    <Box
      borderRadius="xl"
      boxShadow="sm"
      bg={cardBg}
      p={4}
      width="100%"
    >
      <Flex justify="space-between" align="center" mb={3} gap={2}>
        <Text fontSize="lg" fontWeight="bold" color={valueColor} flex="1">
          {account.bankName || 'Bank Name'}
        </Text>

        {account.isPrimary && (
          <Badge
            colorScheme="blue"
            fontSize="0.7em"
            textTransform="uppercase"
            px={2}
            py={1}
            borderRadius="md"
          >
            Primary
          </Badge>
        )}

        <StatusBadge
          status={account.status}
          type={
            account.status === 'pending'
              ? 'warning'
              : account.status === 'verified'
              ? 'success'
              : 'error'
          }
        />
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={3}>
        <Box>
          <Text fontWeight="600" color={labelColor}>
            Account Number:
          </Text>
          <Text color={valueColor}>{account.accountNumber || '—'}</Text>
        </Box>
        <Box>
          <Text fontWeight="600" color={labelColor}>
            Account Holder:
          </Text>
          <Text color={valueColor}>
            {account.accountHolderName || account.accountHolder || '—'}
          </Text>
        </Box>
        <Box>
          <Text fontWeight="600" color={labelColor}>
            IFSC Code:
          </Text>
          <Text color={valueColor}>{account.ifscCode || account.ifsc || '—'}</Text>
        </Box>
        <Box>
          <Text fontWeight="600" color={labelColor}>
            Branch:
          </Text>
          <Text color={valueColor}>{account.branch || '—'}</Text>
        </Box>
      </SimpleGrid>

      {/* Rejection Note */}
      {account.status === 'rejected' && account.internalNote && (
        <Box
          p={3}
          bg={rejectionBg}
          borderRadius="md"
          color={rejectionColor}
          mb={3}
        >
          <Text fontWeight="600">Rejection Note:</Text>
          <Text whiteSpace="pre-wrap">{account.internalNote}</Text>
        </Box>
      )}

      {/* Signed Cheque Preview/Download Button */}
      {signedChequeUrl && (
        <Link href={signedChequeUrl} isExternal style={{ textDecoration: 'none' }}>
          <Button size="sm" colorScheme="teal" mb={3}>
            Preview Signed Cheque
          </Button>
        </Link>
      )}

      {/* Pending Status Action */}
      {account?.status === 'pending' && (
        <BankAccountRow account={account} onUpdateStatus={onUpdateStatus} />
      )}
    </Box>
  )
}

const BankAccountsTab = ({ userId }) => {
  // All hooks must be called before any conditional returns
  const bg = useColorModeValue('gray.50', 'gray.800')
  const dividerBorderColor = useColorModeValue('gray.200', 'gray.600')
  const emptyTextColor = useColorModeValue('gray.500', 'gray.400')

  // Fetch user bank accounts with React Query hook
  const { data: bankAccounts, isLoading, error } = useUserBankAccounts(userId)
  const { mutateAsync: updateStatus, isPending: isUpdating } = useUpdateBankAccountStatus(userId)

  const chequeKeys = useMemo(() => {
    if (!bankAccounts) return []
    return bankAccounts?.map((account) => account?.chequeImageUrl).filter(Boolean) // remove undefined/null
  }, [bankAccounts])

  // Fetch presigned URLs for all cheque keys
  const { data: chequeUrls, refetch: refetchCheques } = usePresignedDownloadUrls({
    keys: chequeKeys,
  })

  // Refetch when keys change
  useEffect(() => {
    if (chequeKeys.length) {
      refetchCheques()
    }
  }, [chequeKeys, refetchCheques])

  const handleUpdateStatus = async (accountId, status, rejectionReason = '') => {
    try {
      await updateStatus({ accountId, payload: { status, rejectionReason } })
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  if (isLoading) {
    return (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center minH="400px">
        <Text color="red.500">Failed to load bank accounts.</Text>
      </Center>
    )
  }
  console.log(chequeUrls)

  return (
    <Box p={6} w="100%" maxW="900px" mx="auto" bg={bg} borderRadius="xl" minH="400px">
      <Flex justifyContent="space-between" alignItems="center" mb={6}>
        <Text fontSize="2xl" fontWeight="bold">
          Bank Accounts
        </Text>
      </Flex>

      {bankAccounts && bankAccounts?.length > 0 ? (
        <VStack
          divider={<StackDivider borderColor={dividerBorderColor} />}
          spacing={6}
          align="stretch"
        >
          {bankAccounts.map((account) => (
            <BankAccountCard
              key={account.id}
              account={account}
              onUpdateStatus={handleUpdateStatus}
              signedChequeUrl={chequeUrls?.[0]}
            />
          ))}
        </VStack>
      ) : (
        <Text textAlign="center" color={emptyTextColor}>
          No bank accounts available.
        </Text>
      )}
    </Box>
  )
}

export default BankAccountsTab

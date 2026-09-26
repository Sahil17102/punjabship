import { ExternalLinkIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Center,
  Flex,
  Grid,
  Heading,
  Input,
  Link,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Spinner,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import StatusBadge from 'components/Badge/StatusBadge'
import Card from 'components/Card/Card'
import { usePresignedDownloadUrls } from 'hooks/usePresignedUrls'
import {
  useApproveDocument,
  useApproveKyc,
  useRevokeKyc,
  useRejectDocument,
  useRejectKyc,
  useUserKyc,
} from 'hooks/useUser'
import { useMemo, useState } from 'react'

// StatusChip to map status to badge color
const StatusChip = ({ status }) => {
  let colorScheme = 'gray'
  if (status === 'verified') colorScheme = 'success'
  else if (status === 'pending' || status === 'verification_in_progress') colorScheme = 'warning'
  else if (status === 'rejected') colorScheme = 'error'
  return <StatusBadge status={status} type={colorScheme} />
}

// Card for each document
const DocCard = ({ label, presignedUrl, status, onApprove, onReject, kycStatus }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const hoverBg = useColorModeValue('gray.100', 'gray.600')
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('')

  const handleReject = () => {
    onReject(reason)
    setReason('')
    setIsOpen(false)
  }

  return (
    <Box
      p={4}
      bg={bgColor}
      borderRadius="lg"
      shadow="sm"
      transition="all 0.2s"
      _hover={{ transform: 'translateY(-4px)', shadow: 'md', bg: hoverBg }}
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontWeight="600">{label}</Text>
        <StatusChip status={status} />
      </Flex>

      {presignedUrl ? (
        <Link href={presignedUrl} isExternal color="blue.500" fontWeight="bold">
          View Document <ExternalLinkIcon mx="2px" />
        </Link>
      ) : (
        <Text color="gray.500">Not uploaded</Text>
      )}

      <Flex mt={2} gap={2}>
        <Button
          size="sm"
          colorScheme="green"
          zIndex={2}
          onClick={onApprove}
          isDisabled={status === 'verified'}
        >
          Approve
        </Button>

        <Popover isOpen={isOpen} onClose={() => setIsOpen(false)} placement="auto-end" isLazy>
          <PopoverTrigger>
            <Button
              disabled={kycStatus === 'verified'}
              zIndex={2}
              size="sm"
              colorScheme="red"
              onClick={() => setIsOpen(true)}
            >
              Reject
            </Button>
          </PopoverTrigger>
          <PopoverContent zIndex={2000} portal>
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>Rejection Reason</PopoverHeader>
            <PopoverBody>
              <Input
                placeholder="Enter reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </PopoverBody>
            <PopoverFooter display="flex" justifyContent="flex-end">
              <Button size="sm" colorScheme="red" onClick={handleReject} isDisabled={!reason}>
                Submit
              </Button>
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </Flex>
    </Box>
  )
}

const formatKycValue = (value) => {
  if (!value) return '-'
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

const InfoTile = ({ label, value, mono = false }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box p={4} bg={bgColor} border="1px solid" borderColor={borderColor} borderRadius="lg">
      <Text fontSize="xs" color="gray.500" fontWeight="700" textTransform="uppercase" mb={1}>
        {label}
      </Text>
      <Text
        fontWeight="700"
        fontSize="md"
        fontFamily={mono ? 'mono' : 'inherit'}
        letterSpacing={mono ? '0.04em' : 'normal'}
        color={value ? 'gray.800' : 'gray.500'}
      >
        {value || '-'}
      </Text>
    </Box>
  )
}

const UserKycPage = ({ userId }) => {
  console.log('user id', userId)
  const { data: kycData, isLoading, isError, refetch } = useUserKyc(userId)
  const kyc = kycData?.kyc ?? {}
  const [rejectingReason, setRejectingReason] = useState('')
  const [revokingReason, setRevokingReason] = useState('')

  const { mutate: approveKycMutate, isLoading: approving } = useApproveKyc()
  const { mutate: rejectKycMutate } = useRejectKyc()
  const { mutate: revokeKycMutate, isLoading: revoking } = useRevokeKyc()
  const approveDocumentMutation = useApproveDocument(userId)
  const rejectDocumentMutation = useRejectDocument(userId)

  // Document keys
  const docKeys = useMemo(() => {
    if (!kyc) return []
    return Object.entries(kyc)
      .filter(([key, value]) => key.toLowerCase().includes('url') && value)
      .map(([_, value]) => value)
  }, [kyc])

  const { data: presignedUrlsData, isLoading: urlsLoading } = usePresignedDownloadUrls({
    keys: docKeys,
  })

  const presignedUrlMap = useMemo(() => {
    if (!presignedUrlsData) return {}
    const map = {}
    docKeys.forEach((key, index) => {
      map[key] = presignedUrlsData[index]
    })
    return map
  }, [presignedUrlsData, docKeys])

  const handleApproveKyc = () => approveKycMutate(userId, { onSuccess: () => refetch() })
  const handleRejectKyc = (reason) =>
    rejectKycMutate({ userId, reason }, { onSuccess: () => refetch() })
  const handleRevokeKyc = (reason) =>
    revokeKycMutate({ userId, reason }, { onSuccess: () => refetch() })

  const handleApproveDoc = (key) =>
    approveDocumentMutation.mutate(key, { onSuccess: () => refetch() })
  const handleRejectDoc = ({ key, reason }) =>
    rejectDocumentMutation.mutate({ key, reason }, { onSuccess: () => refetch() })

  if (isLoading || urlsLoading)
    return (
      <Center minH="400px">
        <Spinner size="xl" />
      </Center>
    )

  if (isError)
    return (
      <Center minH="400px">
        <Text color="red.500">Failed to load KYC details.</Text>
      </Center>
    )

  if (!kyc)
    return (
      <Center minH="400px">
        <Text>No KYC data available.</Text>
      </Center>
    )

  const textFields = [
    { label: 'PAN Number', value: kyc.panNumber, mono: true },
    { label: 'GST Number', value: kyc.gstin, mono: true },
    { label: 'Business Structure', value: formatKycValue(kyc.structure) },
    { label: 'Company Type', value: formatKycValue(kyc.companyType) },
    { label: 'KYC Status', value: formatKycValue(kyc.status) },
    {
      label: 'Last Updated',
      value: kyc.updatedAt ? new Date(kyc.updatedAt).toLocaleString() : '-',
    },
  ]

  const docFields = [
    { label: 'Aadhaar', key: 'aadhaarUrl', status: kyc.aadhaarStatus },
    { label: 'Board Resolution', key: 'boardResolutionUrl', status: kyc.boardResolutionStatus },
    { label: 'Business PAN', key: 'businessPanUrl', status: kyc.businessPanStatus },
    { label: 'Cancelled Cheque', key: 'cancelledChequeUrl', status: kyc.cancelledChequeStatus },
    {
      label: 'Company Address Proof',
      key: 'companyAddressProofUrl',
      status: kyc.companyAddressProofStatus,
    },
    { label: 'GST Certificate', key: 'gstCertificateUrl', status: kyc.gstCertificateStatus },
    { label: 'LLP Agreement', key: 'llpAgreementUrl', status: kyc.llpAgreementStatus },
    { label: 'PAN Card', key: 'panCardUrl', status: kyc.panCardStatus },
    { label: 'Partnership Deed', key: 'partnershipDeedUrl', status: kyc.partnershipDeedStatus },
  ].filter((f) => kyc[f?.key])

  return (
    <Card p={6} borderRadius="xl" boxShadow="md">
      <Heading size="lg" mb={6} textAlign="center">
        User KYC Details
      </Heading>

      {/* Approve / Reject KYC */}
      {['verification_in_progress', 'rejected'].includes(kyc.status) && (
        <Flex justify="flex-end" gap={2} mb={4}>
          <Button colorScheme="green" onClick={handleApproveKyc} isLoading={approving}>
            Approve KYC
          </Button>
          <Popover placement="bottom" isLazy>
            <PopoverTrigger>
              <Button colorScheme="red">Reject KYC</Button>
            </PopoverTrigger>
            <PopoverContent zIndex={2000} portal>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>Rejection Reason</PopoverHeader>
              <PopoverBody>
                <Input
                  placeholder="Enter reason"
                  value={rejectingReason}
                  onChange={(e) => setRejectingReason(e.target.value)}
                />
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <Button
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleRejectKyc(rejectingReason)}
                  isDisabled={!rejectingReason}
                >
                  Submit
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </Flex>
      )}

      {/* Revoke KYC */}
      {kyc.status === 'verified' && (
        <Flex justify="flex-end" gap={2} mb={4}>
          <Popover placement="bottom" isLazy>
            <PopoverTrigger>
              <Button colorScheme="orange" isLoading={revoking}>
                Revoke KYC
              </Button>
            </PopoverTrigger>
            <PopoverContent zIndex={2000} portal>
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader>Revocation Reason</PopoverHeader>
              <PopoverBody>
                <Input
                  placeholder="Enter reason for re-verification"
                  value={revokingReason}
                  onChange={(e) => setRevokingReason(e.target.value)}
                />
              </PopoverBody>
              <PopoverFooter display="flex" justifyContent="flex-end">
                <Button
                  size="sm"
                  colorScheme="orange"
                  onClick={() => handleRevokeKyc(revokingReason)}
                  isDisabled={!revokingReason}
                >
                  Confirm Revoke
                </Button>
              </PopoverFooter>
            </PopoverContent>
          </Popover>
        </Flex>
      )}

      {/* Text fields */}
      <Box mb={6}>
        <Heading size="md" mb={3}>
          Identity Details
        </Heading>
        <Grid templateColumns={['1fr', '1fr 1fr', 'repeat(3, 1fr)']} gap={4}>
          {textFields.map((field) => (
            <InfoTile
              key={field.label}
              label={field.label}
              value={field.value}
              mono={field.mono}
            />
          ))}
        </Grid>
      </Box>

      {/* Document fields */}
      <Heading size="md" mb={3}>
        Uploaded Documents
      </Heading>
      <Grid templateColumns={['1fr', '1fr 1fr']} gap={4}>
        {docFields.map((doc) => (
          <DocCard
            key={doc.key}
            label={doc.label}
            presignedUrl={presignedUrlMap[kyc[doc.key]]}
            status={doc.status}
            onApprove={() => handleApproveDoc(doc.key)}
            onReject={(reason) => handleRejectDoc({ key: doc.key, reason })}
            kycStatus={kyc?.status}
          />
        ))}
      </Grid>
    </Card>
  )
}

export default UserKycPage

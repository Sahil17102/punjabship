import {
  Box,
  Flex,
  Icon,
  Image,
  SimpleGrid,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import Card from 'components/Card/Card'
import CardBody from 'components/Card/CardBody'
import CardHeader from 'components/Card/CardHeader'
import { MdBusiness } from 'react-icons/md'

const InfoRow = ({ label, value }) => {
  const labelColor = useColorModeValue('gray.600', 'gray.300')
  const valueColor = useColorModeValue('gray.800', 'whiteAlpha.900')

  return (
    <Flex direction={{ base: 'column', sm: 'row' }} gap={2} mb={3}>
      <Text
        fontWeight="600"
        color={labelColor}
        minW={{ sm: '140px' }}
        whiteSpace="nowrap"
        flexShrink={0}
      >
        {label}:
      </Text>
      <Text color={valueColor} wordBreak="break-word" flex="1">
        {value || '—'}
      </Text>
    </Flex>
  )
}

const CompanyDetails = ({ companyInfo, companyLogoUrl }) => {
  // All hooks must be called before any conditional returns
  const cardBg = useColorModeValue('white', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const logoBoxBg = useColorModeValue('white', 'gray.700')
  const logoBoxBorder = useColorModeValue('gray.300', 'gray.600')
  const placeholderBg = useColorModeValue('gray.100', 'gray.800')
  const placeholderColor = useColorModeValue('gray.500', 'gray.400')
  const placeholderBorder = useColorModeValue('gray.300', 'gray.600')
  const titleColor = useColorModeValue('gray.700', 'whiteAlpha.900')

  if (!companyInfo) {
    return (
      <Box p={6} textAlign="center" color="gray.500">
        No company details available.
      </Box>
    )
  }

  console.log(companyInfo)
  return (
    <Card
      bg={cardBg}
      borderColor={borderColor}
      borderRadius="xl"
      p={6}
      maxW="800px"
      mx="auto"
      width="100%"
    >
      <CardHeader>
        <Flex alignItems="center" gap={4} mb={10}>
          {companyLogoUrl ? (
            <Tooltip label="View full-size logo" openDelay={300}>
              <Box
                as="a"
                href={companyLogoUrl}
                target="_blank"
                rel="noopener noreferrer"
                borderRadius="md"
                overflow="hidden"
                boxShadow="md"
                transition="transform 0.25s ease, box-shadow 0.25s ease"
                _hover={{ transform: 'scale(1.1)', boxShadow: 'lg' }}
                cursor="pointer"
                aria-label="Company Logo Link"
                maxW="64px"
                maxH="64px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bg={logoBoxBg}
                border="1px solid"
                borderColor={logoBoxBorder}
              >
                <Image
                  src={companyLogoUrl}
                  alt={`${companyInfo.companyName} Logo`}
                  objectFit="contain"
                  width="64px"
                  height="64px"
                  loading="lazy"
                  fallbackSrc="https://via.placeholder.com/64?text=Logo"
                  opacity={0}
                  onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                  transition="opacity 0.3s ease-in-out"
                />
              </Box>
            </Tooltip>
          ) : (
            <Box
              boxSize="64px"
              bg={placeholderBg}
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontWeight="bold"
              fontSize="2xl"
              color={placeholderColor}
              border="1px solid"
              borderColor={placeholderBorder}
            >
              <Icon as={MdBusiness} boxSize={8} />
            </Box>
          )}

          <Text
            fontSize="2xl"
            fontWeight="bold"
            color={titleColor}
          >
            {companyInfo?.businessName || 'Company'}
          </Text>
        </Flex>
      </CardHeader>

      <CardBody>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <InfoRow label="Contact Person" value={companyInfo.contactPerson} />
          <InfoRow label="Email" value={companyInfo?.contactEmail} />
          <InfoRow label="Phone" value={companyInfo?.contactNumber} />
          <InfoRow label="Address" value={companyInfo?.companyAddress} />
          <InfoRow label="City" value={companyInfo?.city} />
          <InfoRow label="State" value={companyInfo?.state} />
          <InfoRow label="Postal Code" value={companyInfo?.pincode} />
          <InfoRow label="Website" value={companyInfo?.website ?? 'N/A'} />
          {/* Add more fields as necessary */}
        </SimpleGrid>
      </CardBody>
    </Card>
  )
}

export default CompanyDetails

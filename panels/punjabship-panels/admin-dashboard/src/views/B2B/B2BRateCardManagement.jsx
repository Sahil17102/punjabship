import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import {
  IconCalculator,
  IconCalendar,
  IconFileSpreadsheet,
  IconReceipt,
  IconSettings,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import B2BAdditionalCharges from '../../components/B2B/B2BAdditionalCharges'
import B2BQuoteCalculator from '../../components/B2B/B2BQuoteCalculator'
import B2BRateMatrix from '../../components/B2B/B2BRateMatrix'
import B2BSurchargeManagement from '../../components/B2B/B2BSurchargeManagement'
import HolidayCalendar from '../../components/B2B/HolidayCalendar'
import { b2bAdminService } from '../../services/b2bAdmin.service'

const B2BRateCardManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const cardBg = useColorModeValue('white', 'gray.800')
  const [tabIndex, setTabIndex] = useState(0)

  // Fetch quick stats (with error handling)
  const { data: zones = [] } = useQuery({
    queryKey: ['b2b-zones-stats'],
    queryFn: () => b2bAdminService.getZones({}),
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  })

  const { data: rates = [] } = useQuery({
    queryKey: ['b2b-rates-stats'],
    queryFn: () => b2bAdminService.getZoneRates({}),
    retry: 1,
    staleTime: 30000,
  })

  const { data: surcharges = [] } = useQuery({
    queryKey: ['b2b-overheads-stats'],
    queryFn: () => b2bAdminService.getOverheads({}),
    retry: 1,
    staleTime: 30000,
  })

  const stats = [
    {
      label: 'Zones',
      value: zones.length || 0,
      icon: IconFileSpreadsheet,
      color: 'blue',
    },
    {
      label: 'Rate Entries',
      value: rates.length || 0,
      icon: IconReceipt,
      color: 'green',
    },
    {
      label: 'Surcharges',
      value: surcharges.length || 0,
      icon: IconSettings,
      color: 'purple',
    },
  ]

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} px={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" mb={2}>
              B2B Pricing Configuration
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Manage zones, rates, surcharges, and all pricing settings in one centralized location
            </Text>
          </Box>
        </Flex>

        {/* Quick Stats Cards */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
          {stats.map((stat, idx) => (
            <Box
              key={idx}
              bg={cardBg}
              p={5}
              borderRadius="lg"
              borderWidth="1px"
              borderColor={borderColor}
              shadow="sm"
            >
              <HStack justify="space-between" align="flex-start">
                <Box flex={1}>
                  <Stat>
                    <StatLabel fontSize="sm" color="gray.600" mb={1}>
                      {stat.label}
                    </StatLabel>
                    <StatNumber fontSize="2xl" fontWeight="bold">
                      {stat.value}
                    </StatNumber>
                  </Stat>
                </Box>
                <Box p={3} borderRadius="md" bg={`${stat.color}.50`} color={`${stat.color}.600`}>
                  <Icon as={stat.icon} boxSize={5} />
                </Box>
              </HStack>
            </Box>
          ))}
        </SimpleGrid>

        {/* Main Content Tabs */}
        <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} shadow="md">
          <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="blue" variant="enclosed">
            <Box px={6} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
              <TabList>
                <Tab
                  _selected={{
                    color: 'blue.600',
                    borderColor: 'blue.500',
                    borderBottomColor: 'transparent',
                  }}
                  fontWeight="medium"
                >
                  <Icon as={IconFileSpreadsheet} mr={2} boxSize={4} />
                  Rate Matrix
                </Tab>
                <Tab
                  _selected={{
                    color: 'blue.600',
                    borderColor: 'blue.500',
                    borderBottomColor: 'transparent',
                  }}
                  fontWeight="medium"
                >
                  <Icon as={IconReceipt} mr={2} boxSize={4} />
                  Surcharges
                </Tab>
                <Tab
                  _selected={{
                    color: 'blue.600',
                    borderColor: 'blue.500',
                    borderBottomColor: 'transparent',
                  }}
                  fontWeight="medium"
                >
                  <Icon as={IconSettings} mr={2} boxSize={4} />
                  Additional Charges
                </Tab>
                <Tab
                  _selected={{
                    color: 'blue.600',
                    borderColor: 'blue.500',
                    borderBottomColor: 'transparent',
                  }}
                  fontWeight="medium"
                >
                  <Icon as={IconCalculator} mr={2} boxSize={4} />
                  Quote Calculator
                </Tab>
                <Tab
                  _selected={{
                    color: 'blue.600',
                    borderColor: 'blue.500',
                    borderBottomColor: 'transparent',
                  }}
                  fontWeight="medium"
                >
                  <Icon as={IconCalendar} mr={2} boxSize={4} />
                  Holiday Calendar
                </Tab>
              </TabList>
            </Box>

            <TabPanels>
              <TabPanel px={6} py={6}>
                <Box mb={4}>
                  <Text fontSize="sm" color="gray.600">
                    Configure base shipping rates between zones. Rates are charged per kilogram.
                  </Text>
                </Box>
                <B2BRateMatrix />
              </TabPanel>
              <TabPanel px={6} py={6}>
                <Box mb={4}>
                  <Text fontSize="sm" color="gray.600">
                    Set conditional surcharges that apply based on shipment conditions (e.g., COD,
                    ODA, remote areas).
                  </Text>
                </Box>
                <B2BSurchargeManagement />
              </TabPanel>
              <TabPanel px={6} py={6}>
                <Box mb={4}>
                  <Text fontSize="sm" color="gray.600">
                    Configure fixed charges like AWB fees, fuel surcharge, handling charges, and
                    other additional fees.
                  </Text>
                </Box>
                <B2BAdditionalCharges />
              </TabPanel>
              <TabPanel px={6} py={6}>
                <Box mb={4}>
                  <Text fontSize="sm" color="gray.600">
                    Test your pricing configuration by calculating rates for sample shipments. See a
                    detailed breakdown of all charges.
                  </Text>
                </Box>
                <B2BQuoteCalculator />
              </TabPanel>
              <TabPanel px={0} py={0}>
                <HolidayCalendar />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  )
}

export default B2BRateCardManagement

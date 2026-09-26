import {
  Box,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import { IconCoinRupee, IconFileSpreadsheet } from '@tabler/icons-react'
import { lazy, Suspense, useState } from 'react'
import ZonesManagement from '../Zones/ZonesManagement'

// Lazy load rate card container
const RateCardContainer = lazy(() =>
  import('../../components/RateCard/RateCardContainer').then((module) => ({
    default: module.RateCardContainer,
  })),
)

const B2CPricingManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [subTabIndex, setSubTabIndex] = useState(0) // 0 = Zones, 1 = Pricing

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} px={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch">
        {/* Header Section */}
        <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" mb={2}>
              B2C Pricing & Zones
            </Heading>
            <Text color="gray.600" fontSize="sm">
              Manage zones and pricing configurations for retail customers
            </Text>
          </Box>
        </Flex>

        {/* Main Content Tabs */}
        <Box bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor} shadow="md">
          <Tabs
            index={subTabIndex}
            onChange={setSubTabIndex}
            colorScheme="purple"
            variant="enclosed"
          >
            <Box px={6} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
              <TabList>
                <Tab
                  _selected={{
                    color: 'purple.600',
                    borderColor: 'purple.500',
                    borderBottomColor: 'transparent',
                  }}
                  fontWeight="medium"
                >
                  <IconFileSpreadsheet size={18} style={{ marginRight: '8px' }} />
                  Zones
                </Tab>
                <Tab
                  _selected={{
                    color: 'purple.600',
                    borderColor: 'purple.500',
                    borderBottomColor: 'transparent',
                  }}
                  fontWeight="medium"
                >
                  <IconCoinRupee size={18} style={{ marginRight: '8px' }} />
                  Pricing
                </Tab>
              </TabList>
            </Box>

            <TabPanels>
              {/* Zones Tab */}
              <TabPanel px={0} py={0}>
                <ZonesManagement defaultBusinessType="B2C" />
              </TabPanel>

              {/* Pricing Tab */}
              <TabPanel px={6} py={6}>
                <Suspense fallback={<Box p={6}>Loading rate card...</Box>}>
                  <RateCardContainer forceBusinessType="B2C" embedded={true} />
                </Suspense>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  )
}

export default B2CPricingManagement

import {
  Box,
  Flex,
  HStack,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react'
import { IconCoinRupee, IconFileSpreadsheet } from '@tabler/icons-react'
import PageHeader from 'components/Admin/PageHeader'
import { useState } from 'react'
import B2BAdditionalCharges from '../../components/B2B/B2BAdditionalCharges'
import B2BQuoteCalculator from '../../components/B2B/B2BQuoteCalculator'
import B2BRateMatrix from '../../components/B2B/B2BRateMatrix'
import B2BSurchargeManagement from '../../components/B2B/B2BSurchargeManagement'
import { RateCardContainer } from '../../components/RateCard/RateCardContainer'
import ZonesManagement from '../Zones/ZonesManagement'

const PricingManagement = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [businessTypeTab, setBusinessTypeTab] = useState(0) // 0 = B2B, 1 = B2C
  const [b2bSubTabIndex, setB2bSubTabIndex] = useState(0) // 0 = Zones, 1 = Pricing
  const [b2cSubTabIndex, setB2cSubTabIndex] = useState(0) // 0 = Zones, 1 = Pricing

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} px={{ base: 4, md: 6 }}>
      <VStack spacing={6} align="stretch">
        <PageHeader
          eyebrow="Pricing"
          title="Rate architecture for B2B and B2C shipping"
          description="Control zone definitions, surface charges and pricing logic from one admin workspace built for operations teams."
          meta={[
            { label: 'Business views', value: 'B2B + B2C' },
            { label: 'B2B section', value: b2bSubTabIndex === 0 ? 'Zones' : 'Pricing' },
            { label: 'B2C section', value: b2cSubTabIndex === 0 ? 'Zones' : 'Pricing' },
          ]}
        />

        {/* Main Tabs: B2B / B2C */}
        <Box bg={bgColor} borderRadius="24px" borderWidth="1px" borderColor={borderColor} shadow="md">
          <Tabs
            index={businessTypeTab}
            onChange={setBusinessTypeTab}
            variant="unstyled"
          >
            <Box px={6} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
              <TabList gap={2}>
                <Tab
                  flex={1}
                  px={6}
                  py={4}
                  borderRadius="18px"
                  alignItems="flex-start"
                  borderWidth="1px"
                  borderColor="transparent"
                  _selected={{ bg: 'brand.50', shadow: 'sm', color: 'brand.500', borderColor: 'rgba(109, 40, 217, 0.18)', cursor: 'pointer' }}
                  _focus={{ boxShadow: 'none' }}
                >
                  <Stack spacing={1} align="flex-start" width="100%">
                    <HStack spacing={2}>
                      <Tag bg="brand.50" color="brand.500" size="sm">
                        B2B
                      </Tag>
                      <Text fontWeight="semibold">Enterprise</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      Zone-based pricing for business customers
                    </Text>
                  </Stack>
                </Tab>
                <Tab
                  flex={1}
                  px={6}
                  py={4}
                  borderRadius="18px"
                  alignItems="flex-start"
                  _selected={{
                    bg: 'secondary.50',
                    shadow: 'sm',
                    color: 'secondary.500',
                    borderColor: 'rgba(249, 115, 22, 0.2)',
                    cursor: 'pointer',
                  }}
                  borderWidth="1px"
                  borderColor="transparent"
                  _focus={{ boxShadow: 'none' }}
                >
                  <Stack spacing={1} align="flex-start" width="100%">
                    <HStack spacing={2}>
                      <Tag bg="secondary.50" color="secondary.500" size="sm">
                        B2C
                      </Tag>
                      <Text fontWeight="semibold">Retail</Text>
                    </HStack>
                    <Text fontSize="sm" color="gray.600">
                      Standard pricing for direct-to-consumer shipments
                    </Text>
                  </Stack>
                </Tab>
              </TabList>
            </Box>

            <TabPanels>
              {/* B2B Tab Panel */}
              <TabPanel px={0} py={0}>
                <Box>
                  <Tabs
                    index={b2bSubTabIndex}
                    onChange={setB2bSubTabIndex}
                    variant="enclosed"
                  >
                    <Box px={6} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
                      <TabList gap={2}>
                        <Tab
                          _selected={{
                            color: 'brand.500',
                            borderColor: 'brand.500',
                            borderBottomColor: 'transparent',
                          }}
                          fontWeight="medium"
                          borderTopRadius="14px"
                        >
                          <IconFileSpreadsheet size={18} style={{ marginRight: '8px' }} />
                          Zones
                        </Tab>
                        <Tab
                          _selected={{
                            color: 'brand.500',
                            borderColor: 'brand.500',
                            borderBottomColor: 'transparent',
                          }}
                          fontWeight="medium"
                          borderTopRadius="14px"
                        >
                          <IconCoinRupee size={18} style={{ marginRight: '8px' }} />
                          Pricing
                        </Tab>
                      </TabList>
                    </Box>

                    <TabPanels>
                      {/* B2B Zones Tab */}
                      <TabPanel px={0} py={0}>
                        <ZonesManagement defaultBusinessType="B2B" />
                      </TabPanel>

                      {/* B2B Pricing Tab */}
                      <TabPanel px={0} py={6}>
                        <B2BPricingContent />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </TabPanel>

              {/* B2C Tab Panel */}
              <TabPanel px={0} py={0}>
                <Box>
                  <Tabs
                    index={b2cSubTabIndex}
                    onChange={setB2cSubTabIndex}
                    variant="enclosed"
                  >
                    <Box px={6} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
                      <TabList gap={2}>
                        <Tab
                          _selected={{
                            color: 'secondary.500',
                            borderColor: 'secondary.500',
                            borderBottomColor: 'transparent',
                          }}
                          fontWeight="medium"
                          borderTopRadius="14px"
                        >
                          <IconFileSpreadsheet size={18} style={{ marginRight: '8px' }} />
                          Zones
                        </Tab>
                        <Tab
                          _selected={{
                            color: 'secondary.500',
                            borderColor: 'secondary.500',
                            borderBottomColor: 'transparent',
                          }}
                          fontWeight="medium"
                          borderTopRadius="14px"
                        >
                          <IconCoinRupee size={18} style={{ marginRight: '8px' }} />
                          Pricing
                        </Tab>
                      </TabList>
                    </Box>

                    <TabPanels>
                      {/* B2C Zones Tab */}
                      <TabPanel px={0} py={0}>
                        <ZonesManagement defaultBusinessType="B2C" />
                      </TabPanel>

                      {/* B2C Pricing Tab */}
                      <TabPanel px={0} py={6}>
                        <RateCardContainer />
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </VStack>
    </Box>
  )
}

// B2B Pricing Content Component
const B2BPricingContent = () => {
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [pricingTabIndex, setPricingTabIndex] = useState(0)

  return (
    <Box>
      <Tabs index={pricingTabIndex} onChange={setPricingTabIndex} variant="enclosed">
        <Box px={0} pt={0} borderBottomWidth="1px" borderColor={borderColor}>
          <TabList gap={2}>
            <Tab
              _selected={{
                color: 'brand.500',
                borderColor: 'brand.500',
                borderBottomColor: 'transparent',
              }}
              fontWeight="medium"
              borderTopRadius="14px"
            >
              Rate Matrix
            </Tab>
            <Tab
              _selected={{
                color: 'brand.500',
                borderColor: 'brand.500',
                borderBottomColor: 'transparent',
              }}
              fontWeight="medium"
              borderTopRadius="14px"
            >
              Surcharges
            </Tab>
            <Tab
              _selected={{
                color: 'brand.500',
                borderColor: 'brand.500',
                borderBottomColor: 'transparent',
              }}
              fontWeight="medium"
              borderTopRadius="14px"
            >
              Additional Charges
            </Tab>
            <Tab
              _selected={{
                color: 'brand.500',
                borderColor: 'brand.500',
                borderBottomColor: 'transparent',
              }}
              fontWeight="medium"
              borderTopRadius="14px"
            >
              Quote Calculator
            </Tab>
          </TabList>
        </Box>

        <TabPanels>
          <TabPanel px={0} py={6}>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.600">
                Configure base shipping rates between zones. Rates are charged per kilogram.
              </Text>
            </Box>
            <B2BRateMatrix />
          </TabPanel>
          <TabPanel px={0} py={6}>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.600">
                Set conditional surcharges that apply based on shipment conditions (e.g., COD, ODA,
                remote areas).
              </Text>
            </Box>
            <B2BSurchargeManagement />
          </TabPanel>
          <TabPanel px={0} py={6}>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.600">
                Configure fixed charges like AWB fees, fuel surcharge, handling charges, and other
                additional fees.
              </Text>
            </Box>
            <B2BAdditionalCharges />
          </TabPanel>
          <TabPanel px={0} py={6}>
            <Box mb={4}>
              <Text fontSize="sm" color="gray.600">
                Test your pricing configuration by calculating rates for sample shipments. See a
                detailed breakdown of all charges.
              </Text>
            </Box>
            <B2BQuoteCalculator />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default PricingManagement

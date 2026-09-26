import {
  Box,
  Divider,
  HStack,
  Select,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { IconCalendar } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import B2BAdditionalCharges from '../../../components/B2B/B2BAdditionalCharges'
import B2BRateMatrix from '../../../components/B2B/B2BRateMatrix'
import B2BSurchargeManagement from '../../../components/B2B/B2BSurchargeManagement'
import HolidayCalendar from '../../../components/B2B/HolidayCalendar'
import { useCouriers } from '../../../hooks/useCouriers'
import { PlansService } from '../../../services/plan.service'

const B2BPricingContent = () => {
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const [pricingTabIndex, setPricingTabIndex] = useState(0)
  const { data: plans = [] } = useQuery({
    queryKey: ['plans', { businessType: 'b2b', status: 'active' }],
    queryFn: () => PlansService.getPlans({ businessType: 'b2b', status: 'active' }),
  })

  // Default to first plan if available
  const [selectedPlanId, setSelectedPlanId] = useState('')

  const [selectedCourierKey, setSelectedCourierKey] = useState('')
  const { data: delhiveryB2BCouriers = [] } = useCouriers({
    businessType: 'b2b',
    serviceProvider: 'delhivery',
  })

  // Default to the Basic B2B plan because Delhivery workbook data is seeded there.
  useEffect(() => {
    if (plans?.length > 0 && !selectedPlanId) {
      const basicPlan =
        plans.find((plan) => String(plan.name || '').trim().toLowerCase() === 'basic') || plans[0]
      setSelectedPlanId(basicPlan.id)
    }
  }, [plans, selectedPlanId])

  useEffect(() => {
    if (!delhiveryB2BCouriers.length) {
      if (selectedCourierKey) {
        setSelectedCourierKey('')
      }
      return
    }

    const hasSelectedCourier = delhiveryB2BCouriers.some((courier) => {
      const provider = courier.serviceProvider || courier.service_provider || ''
      return `${courier.id}|${provider}` === selectedCourierKey
    })

    if (!hasSelectedCourier) {
      const preferredCourier =
        delhiveryB2BCouriers.find((courier) =>
          String(courier.name || '')
            .trim()
            .toLowerCase()
            .includes('surface'),
        ) || delhiveryB2BCouriers[0]
      const provider = preferredCourier.serviceProvider || preferredCourier.service_provider || ''
      setSelectedCourierKey(`${preferredCourier.id}|${provider}`)
    }
  }, [delhiveryB2BCouriers, selectedCourierKey])

  const selectedCourier = delhiveryB2BCouriers.find((courier) => {
    const provider = courier.serviceProvider || courier.service_provider || ''
    return `${courier.id}|${provider}` === selectedCourierKey
  })
  const scopedCourierId = selectedCourier ? String(selectedCourier.id) : ''
  const scopedServiceProvider =
    selectedCourier?.serviceProvider || selectedCourier?.service_provider || 'delhivery'

  return (
    <Box>
      {/* Plan Selector - Simplified */}
      {(plans?.length > 0 || delhiveryB2BCouriers.length > 1) && (
        <Box mb={4} px={6} pt={4}>
          <HStack spacing={3} align="center">
            {plans?.length > 0 && (
              <>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="80px">
                  Select Plan:
                </Text>
                <Select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  maxW="200px"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
              </>
            )}
            {delhiveryB2BCouriers.length > 1 && (
              <>
                <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="140px">
                  Delhivery B2B Courier:
                </Text>
                <Select
                  value={selectedCourierKey}
                  onChange={(e) => setSelectedCourierKey(e.target.value)}
                  maxW="320px"
                >
                  {delhiveryB2BCouriers.map((courier) => {
                    const provider = courier.serviceProvider || courier.service_provider || ''
                    const courierKey = `${courier.id}|${provider}`
                    return (
                      <option key={courierKey} value={courierKey}>
                        {courier.name}
                      </option>
                    )
                  })}
                </Select>
              </>
            )}
          </HStack>
          <Divider mt={4} />
        </Box>
      )}

      {!delhiveryB2BCouriers.length && (
        <Box px={6} pb={4}>
          <Text fontSize="sm" color="red.500">
            No Delhivery B2B courier is configured yet. Add or enable a Delhivery courier with B2B
            business type to manage this rate card.
          </Text>
        </Box>
      )}

      <Tabs index={pricingTabIndex} onChange={setPricingTabIndex} colorScheme="blue" variant="line">
        <Box px={6} pt={4} borderBottomWidth="1px" borderColor={borderColor}>
          <TabList gap={2}>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              Rate Matrix
            </Tab>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              Overhead Charges
            </Tab>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              Additional Charges
            </Tab>
            <Tab
              _selected={{
                color: 'blue.600',
                borderBottomColor: 'blue.500',
                fontWeight: 'semibold',
              }}
              fontWeight="medium"
              px={4}
              py={3}
              color="gray.600"
              borderBottomWidth="2px"
              borderBottomColor="transparent"
              _hover={{
                color: 'blue.500',
              }}
              transition="all 0.2s"
            >
              <IconCalendar size={18} style={{ marginRight: '8px', display: 'inline' }} />
              Holiday Calendar
            </Tab>
          </TabList>
        </Box>

        <TabPanels>
          <TabPanel px={6} py={4}>
            {pricingTabIndex === 0 && scopedCourierId && (
              <B2BRateMatrix
                planId={selectedPlanId}
                courierId={scopedCourierId}
                serviceProvider={scopedServiceProvider}
              />
            )}
          </TabPanel>
          <TabPanel px={6} py={4}>
            {pricingTabIndex === 1 && scopedCourierId && (
              <B2BSurchargeManagement
                planId={selectedPlanId}
                courierId={scopedCourierId}
                serviceProvider={scopedServiceProvider}
              />
            )}
          </TabPanel>
          <TabPanel px={6} py={4}>
            {pricingTabIndex === 2 && scopedCourierId && (
              <B2BAdditionalCharges
                planId={selectedPlanId}
                courierId={scopedCourierId}
                serviceProvider={scopedServiceProvider}
              />
            )}
          </TabPanel>
          <TabPanel px={0} py={0}>
            {pricingTabIndex === 3 && <HolidayCalendar />}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  )
}

export default B2BPricingContent

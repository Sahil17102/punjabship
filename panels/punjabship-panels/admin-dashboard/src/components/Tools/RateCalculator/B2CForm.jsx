/* eslint-disable */
import {
  Badge,
  Box,
  Flex,
  FormControl,
  FormLabel,
  Input,
  SimpleGrid,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import { useEffect, useMemo, useState } from 'react'
import { TbRulerMeasure, TbScale } from 'react-icons/tb'

export default function B2CForm({ formData, onChange, shipmentType }) {
  const [length, setLength] = useState(formData.length || '')
  const [breadth, setBreadth] = useState(formData.breadth || '')
  const [height, setHeight] = useState(formData.height || '')
  const [weight, setWeight] = useState(formData.weight || '')

  useEffect(() => {
    onChange('length', length)
    onChange('breadth', breadth)
    onChange('height', height)
    onChange('weight', weight)
  }, [length, breadth, height, weight])

  const volumetricWeightGrams = useMemo(() => {
    const volKg = (Number(length) * Number(breadth) * Number(height)) / 5000
    const volGrams = volKg * 1000
    return isNaN(volGrams) ? 0 : Math.round(volGrams)
  }, [length, breadth, height])

  const applicableWeightGrams = useMemo(() => {
    const actual = Number(weight) || 0
    return Math.max(actual, volumetricWeightGrams, 500)
  }, [weight, volumetricWeightGrams])

  const volumetricWeightKg = (volumetricWeightGrams / 1000).toFixed(2)
  const applicableWeightKg = (applicableWeightGrams / 1000).toFixed(2)

  const sectionBg = useColorModeValue('white', '#111E37')
  const sectionBorder = useColorModeValue('rgba(148,163,184,0.3)', 'rgba(148,163,184,0.24)')
  const tileBg = useColorModeValue('gray.50', 'rgba(148,163,184,0.1)')
  const labelColor = useColorModeValue('gray.700', 'gray.200')
  const subtitleColor = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box bg={sectionBg} borderWidth="1px" borderColor={sectionBorder} borderRadius="16px" p={{ base: 4, md: 5 }}>
      <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }} gap={2} mb={4}>
        <Text fontWeight="800" color={labelColor}>
          B2C Package Details
        </Text>
        <Badge bg="brand.100" color="brand.700" borderRadius="full" px={2.5} py={1}>
          Volumetric Auto-Calc
        </Badge>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <FormControl isRequired={shipmentType === 'b2c'}>
          <FormLabel color={labelColor}>Actual Weight (g)</FormLabel>
          <Input
            name="weight"
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Enter weight in grams"
            bg={useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')}
            borderColor={sectionBorder}
            _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }}
          />
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mt={4}>
        <FormControl isRequired={shipmentType === 'b2c'}>
          <FormLabel color={labelColor}>Length (cm)</FormLabel>
          <Input name="length" type="number" value={length} onChange={(e) => setLength(e.target.value)} placeholder="e.g. 20" bg={useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')} borderColor={sectionBorder} _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }} />
        </FormControl>
        <FormControl isRequired={shipmentType === 'b2c'}>
          <FormLabel color={labelColor}>Breadth (cm)</FormLabel>
          <Input name="breadth" type="number" value={breadth} onChange={(e) => setBreadth(e.target.value)} placeholder="e.g. 15" bg={useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')} borderColor={sectionBorder} _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }} />
        </FormControl>
        <FormControl isRequired={shipmentType === 'b2c'}>
          <FormLabel color={labelColor}>Height (cm)</FormLabel>
          <Input name="height" type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 10" bg={useColorModeValue('white', 'rgba(15, 35, 66, 0.8)')} borderColor={sectionBorder} _focus={{ borderColor: 'brand.500', boxShadow: '0 0 0 3px rgba(31,79,168,0.12)' }} />
        </FormControl>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mt={6}>
        <Flex bg={tileBg} p={4} borderRadius="12px" align="center" gap={3} borderWidth="1px" borderColor={sectionBorder}>
          <TbRulerMeasure size={22} color="#1F4FA8" />
          <Box>
            <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" fontWeight="700">
              Volumetric Weight
            </Text>
            <Text fontSize="lg" fontWeight="800" color={labelColor}>
              {volumetricWeightGrams} g ({volumetricWeightKg} kg)
            </Text>
          </Box>
        </Flex>

        <Flex bg={tileBg} p={4} borderRadius="12px" align="center" gap={3} borderWidth="1px" borderColor={sectionBorder}>
          <TbScale size={22} color="#F57C22" />
          <Box>
            <Text fontSize="xs" color={subtitleColor} textTransform="uppercase" fontWeight="700">
              Billable Weight
            </Text>
            <Text fontSize="lg" fontWeight="800" color={applicableWeightGrams === 500 ? 'orange.500' : labelColor}>
              {applicableWeightGrams} g ({applicableWeightKg} kg)
            </Text>
          </Box>
        </Flex>
      </SimpleGrid>
    </Box>
  )
}

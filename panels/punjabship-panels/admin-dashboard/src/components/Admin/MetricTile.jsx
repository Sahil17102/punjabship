import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react'

export default function MetricTile({
  icon,
  label,
  value,
  accent = 'brand.500',
  muted,
  onClick,
  active = false,
}) {
  const washes = {
    'brand.500': '#F1EDFF',
    'orange.500': '#FFF2D9',
    'secondary.500': '#E8F7FA',
    'green.500': '#E9F8EF',
    'red.500': '#FFEDEF',
  }
  const bg = useColorModeValue(washes[accent] || '#F1EDFF', '#171820')
  const activeBorderColor = useColorModeValue('brand.400', 'brand.300')
  const inactiveBorderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const borderColor = active ? activeBorderColor : inactiveBorderColor
  const titleColor = useColorModeValue('gray.500', 'gray.400')
  const valueColor = useColorModeValue('gray.800', 'white')

  return (
    <Flex
      direction="column"
      justify="space-between"
      minH="92px"
      p={3}
      borderRadius="8px"
      borderWidth="1px"
      borderColor={borderColor}
      bg={bg}
      overflow="hidden"
      position="relative"
      borderTopWidth="3px"
      borderTopColor={accent}
      boxShadow="0 3px 0 rgba(31,35,48,0.06), 0 10px 20px rgba(31,35,48,0.05)"
      cursor={onClick ? 'pointer' : 'default'}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? active : undefined}
      transition="transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease"
      _hover={
        onClick
          ? {
              transform: 'translateY(-4px)',
              borderColor: accent,
              boxShadow: '0 7px 0 rgba(31,35,48,0.07), 0 16px 28px rgba(31,35,48,0.12)',
            }
          : undefined
      }
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
    >
      <Flex align="center" justify="space-between" mb={2.5}>
        <Text fontSize="xs" fontWeight="650" color={titleColor}>
          {label}
        </Text>
        <Flex
          align="center"
          justify="center"
          w="26px"
          h="26px"
          borderRadius="4px"
          bg="whiteAlpha.800"
          color={accent}
        >
          {icon}
        </Flex>
      </Flex>
      <Box>
        <Text
          fontFamily="'Hahmlet Variable', Georgia, serif"
          fontSize={{ base: 'xl', md: '2xl' }}
          fontWeight="650"
          letterSpacing="0"
          color={valueColor}
        >
          {value}
        </Text>
        {muted ? (
          <Text mt={1} fontSize="xs" lineHeight="1.4" color={titleColor}>
            {muted}
          </Text>
        ) : null}
      </Box>
    </Flex>
  )
}

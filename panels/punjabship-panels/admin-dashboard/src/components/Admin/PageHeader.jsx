import { Box, Grid, HStack, Text, useColorModeValue } from '@chakra-ui/react'

export default function PageHeader({ title, description, actions = null, meta = [] }) {
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const muted = useColorModeValue('gray.600', 'gray.400')

  return (
    <Box
      p={{ base: '14px', md: 4 }}
      bg="#F1EDFF"
      border="1px solid"
      borderColor="#C9BEF7"
      borderRadius="8px"
      boxShadow="0 4px 0 rgba(75,53,181,0.09), 0 14px 28px rgba(75,53,181,0.08)"
      backgroundImage={'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'32\' height=\'32\' viewBox=\'0 0 32 32\'%3E%3Ccircle cx=\'5\' cy=\'5\' r=\'1\' fill=\'%230877C9\' fill-opacity=\'.15\'/%3E%3C/svg%3E")'}
    >
      <Grid
        templateColumns={{ base: '1fr', xl: 'minmax(260px, 0.8fr) minmax(360px, 1.25fr) auto' }}
        alignItems="end"
        columnGap={{ xl: 10 }}
        rowGap={2}
      >
        <Box maxW="520px">
          <Text
            fontFamily="'Hahmlet Variable', Georgia, serif"
            fontSize={{ base: '23px', md: '26px' }}
            lineHeight="1.12"
            fontWeight="650"
            color="#30236E"
            textShadow="0 2px 0 rgba(255,255,255,0.8)"
          >
            {title}
          </Text>
          <Box mt={2} w="42px" h="3px" bg="#F1B928" borderRadius="full" />
        </Box>
        {description ? (
          <Text
            color="#514D63"
            fontFamily="'Andada Pro Variable', Georgia, serif"
            fontSize={{ base: '13px', md: '14px' }}
            lineHeight="1.45"
            maxW="680px"
          >
            {description}
          </Text>
        ) : <Box />}
        {actions ? <Box justifySelf={{ xl: 'end' }} w={{ base: '100%', xl: 'auto' }}>{actions}</Box> : null}
      </Grid>

      {meta.length > 0 ? (
        <HStack spacing={0} mt={3} pt={2} borderTop="1px solid" borderColor={borderColor} flexWrap="wrap" align="stretch">
          {meta.map((item, index) => (
            <Box
              key={item.label}
              minW="96px"
              pl={index === 0 ? 0 : 5}
              pr={5}
              py={0.5}
              borderLeft={index === 0 ? '0' : '1px solid'}
              borderColor={borderColor}
            >
              <Text fontSize="11px" color={muted}>{item.label}</Text>
              <Text mt={0.5} fontSize="sm" fontWeight="700" color="gray.900">{item.value}</Text>
            </Box>
          ))}
        </HStack>
      ) : null}
    </Box>
  )
}

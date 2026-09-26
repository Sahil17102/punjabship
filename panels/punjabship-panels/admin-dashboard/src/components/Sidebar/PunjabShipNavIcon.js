import { Box, Flex } from '@chakra-ui/react'
import React from 'react'

const palettes = {
  command: { surface: '#E9E3FF', border: '#C9BCFA', ink: '#5739D4', active: '#6043DC' },
  shipment: { surface: '#DFF5F3', border: '#A9DDD8', ink: '#087B75', active: '#07877F' },
  exception: { surface: '#FFE9E4', border: '#F5C2B7', ink: '#C84D35', active: '#D4573E' },
  people: { surface: '#FCE7F1', border: '#F0BFD4', ink: '#B63770', active: '#C23F78' },
  network: { surface: '#EDE6FF', border: '#CFC0F8', ink: '#6844C8', active: '#7049CF' },
  finance: { surface: '#FFF2D7', border: '#F1D292', ink: '#A76400', active: '#B97208' },
  control: { surface: '#E5F1FF', border: '#B9D5F4', ink: '#2866A8', active: '#3273B8' },
  support: { surface: '#E8F5E8', border: '#BDDEBE', ink: '#2D7A42', active: '#34864A' },
}

const resolvePalette = (name = '', path = '') => {
  const value = `${name} ${path}`.toLowerCase()
  if (/ndr|rto|manual|dispute|exception/.test(value)) return palettes.exception
  if (/employee|user|seller|onboarding/.test(value)) return palettes.people
  if (/franchise|territor|network/.test(value)) return palettes.network
  if (/billing|invoice|wallet|cod|payment|plan|pricing|rate/.test(value)) return palettes.finance
  if (/courier|shipment|order|track|serviceability|zone/.test(value)) return palettes.shipment
  if (/support|about|notification/.test(value)) return palettes.support
  if (/tool|api|developer|setting|credential|password|reconciliation|weight/.test(value)) return palettes.control
  return palettes.command
}

export default function PunjabShipNavIcon({ icon, name, path, active = false, compact = false }) {
  const palette = resolvePalette(name, path)
  const glyph = React.isValidElement(icon)
    ? React.cloneElement(icon, { size: compact ? 14 : 15, strokeWidth: active ? 2.15 : 1.85 })
    : icon

  return (
    <Box
      position="relative"
      flex="0 0 auto"
      w={compact ? '25px' : '28px'}
      h={compact ? '25px' : '28px'}
      overflow="hidden"
      border="1px solid"
      borderColor={active ? palette.active : `${palette.border}CC`}
      borderRadius="8px"
      bg={active ? palette.active : `linear-gradient(145deg, #FFFFFF 0%, ${palette.surface} 100%)`}
      color={active ? 'white' : palette.ink}
      boxShadow={active ? `0 8px 16px ${palette.active}34` : '0 1px 2px rgba(35, 29, 52, 0.07), inset 0 1px 0 rgba(255,255,255,0.9)'}
      transition="background-color 0.16s ease, border-color 0.16s ease, transform 0.16s ease, box-shadow 0.16s ease"
    >
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        h="38%"
        bg={active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)'}
        pointerEvents="none"
      />
      <Flex position="absolute" inset="0" align="center" justify="center">
        {glyph}
      </Flex>
    </Box>
  )
}

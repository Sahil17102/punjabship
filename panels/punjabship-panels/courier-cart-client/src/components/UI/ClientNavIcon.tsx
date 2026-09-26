import { Box } from '@mui/material'
import type { ReactNode } from 'react'

const palettes = {
  command: { surface: '#E9E3FF', border: '#C9BCFA', ink: '#5739D4', active: '#6043DC' },
  shipment: { surface: '#DFF5F3', border: '#A9DDD8', ink: '#087B75', active: '#07877F' },
  exception: { surface: '#FFE9E4', border: '#F5C2B7', ink: '#C84D35', active: '#D4573E' },
  people: { surface: '#FCE7F1', border: '#F0BFD4', ink: '#B63770', active: '#C23F78' },
  finance: { surface: '#FFF2D7', border: '#F1D292', ink: '#A76400', active: '#B97208' },
  control: { surface: '#E5F1FF', border: '#B9D5F4', ink: '#2866A8', active: '#3273B8' },
  support: { surface: '#E8F5E8', border: '#BDDEBE', ink: '#2D7A42', active: '#34864A' },
}

const resolvePalette = (name = '', path = '') => {
  const value = `${name} ${path}`.toLowerCase()
  if (/ndr|rto|exception|audit|reconciliation/.test(value)) return palettes.exception
  if (/user|profile|workspace|pickup/.test(value)) return palettes.people
  if (/billing|invoice|wallet|cod|finance|rate/.test(value)) return palettes.finance
  if (/shipment|order|track|channel|store/.test(value)) return palettes.shipment
  if (/support|about|ticket/.test(value)) return palettes.support
  if (/tool|setting|api|report|insight/.test(value)) return palettes.control
  return palettes.command
}

interface ClientNavIconProps {
  icon: ReactNode
  name: string
  path?: string
  active?: boolean
  compact?: boolean
}

export default function ClientNavIcon({
  icon,
  name,
  path,
  active = false,
  compact = false,
}: ClientNavIconProps) {
  const palette = resolvePalette(name, path)
  const size = compact ? 25 : 28

  return (
    <Box
      sx={{
        position: 'relative',
        flex: '0 0 auto',
        width: size,
        height: size,
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
        border: '1px solid',
        borderColor: active ? palette.active : `${palette.border}CC`,
        borderRadius: '8px',
        background: active
          ? palette.active
          : `linear-gradient(145deg, #FFFFFF 0%, ${palette.surface} 100%)`,
        color: active ? '#FFFFFF' : palette.ink,
        boxShadow: active
          ? `0 8px 16px ${palette.active}34`
          : '0 1px 2px rgba(35,29,52,0.07), inset 0 1px 0 rgba(255,255,255,0.9)',
        transition:
          'background-color 160ms ease, border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease',
        '& svg': {
          width: compact ? 14 : 15,
          height: compact ? 14 : 15,
          transform: 'none',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '38%',
          bgcolor: active ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)',
          pointerEvents: 'none',
        },
      }}
    >
      {icon}
    </Box>
  )
}

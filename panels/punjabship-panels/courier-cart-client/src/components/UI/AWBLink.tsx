import { alpha, Box, IconButton, Link as MuiLink, Tooltip } from '@mui/material'
import type React from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { MdContentCopy, MdOpenInNew } from 'react-icons/md'
import {
  getAwbTrackingPath,
  getClientAwbTrackingPath,
  isValidAwb,
  normalizeAwb,
} from '../../utils/awb'

interface AWBLinkProps {
  awb?: string | null
  stopPropagation?: boolean
  compact?: boolean
}

export default function AWBLink({ awb, stopPropagation = true, compact = false }: AWBLinkProps) {
  const normalizedAwb = normalizeAwb(awb)
  const location = useLocation()

  if (!isValidAwb(normalizedAwb)) {
    return <>{normalizedAwb || '—'}</>
  }

  const trackingPath = location.pathname.startsWith('/tracking')
    ? getAwbTrackingPath(normalizedAwb)
    : getClientAwbTrackingPath(normalizedAwb)

  const stop = (event: React.MouseEvent) => {
    if (stopPropagation) event.stopPropagation()
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.2,
        maxWidth: '100%',
        flexWrap: compact ? 'wrap' : 'nowrap',
      }}
    >
      <MuiLink
        component={RouterLink}
        to={trackingPath}
        underline="hover"
        onClick={stop}
        sx={{
          color: '#0877C9',
          cursor: 'pointer',
          fontWeight: 800,
          fontFamily: 'monospace',
          textDecorationColor: alpha('#0877C9', 0.45),
          textUnderlineOffset: '0.14em',
          minWidth: 0,
          maxWidth: '100%',
          overflowWrap: compact ? 'anywhere' : 'normal',
          '&:hover': {
            color: '#A80311',
          },
        }}
      >
        {normalizedAwb}
      </MuiLink>
      <Tooltip title="Copy AWB" arrow>
        <IconButton
          size="small"
          aria-label="Copy AWB"
          onClick={async (event) => {
            stop(event)
            await navigator.clipboard.writeText(normalizedAwb)
          }}
          sx={{
            width: compact ? 20 : 26,
            height: compact ? 20 : 26,
            color: '#0877C9',
            flexShrink: 0,
          }}
        >
          <MdContentCopy size={compact ? 14 : 16} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Open tracking in new tab" arrow>
        <IconButton
          size="small"
          aria-label="Open tracking in new tab"
          onClick={(event) => {
            stop(event)
            window.open(trackingPath, '_blank', 'noopener,noreferrer')
          }}
          sx={{
            width: compact ? 20 : 26,
            height: compact ? 20 : 26,
            color: '#0877C9',
            flexShrink: 0,
          }}
        >
          <MdOpenInNew size={compact ? 15 : 17} />
        </IconButton>
      </Tooltip>
    </Box>
  )
}

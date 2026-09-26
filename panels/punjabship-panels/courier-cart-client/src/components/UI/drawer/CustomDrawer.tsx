import {
  alpha,
  Box,
  Divider,
  Drawer,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React from 'react'
import { IoClose } from 'react-icons/io5'

interface GlassDrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  width?: number | string
  anchor?: 'left' | 'right'
  children: React.ReactNode
}

const BRAND = '#0877C9'
const TEXT = '#141414'

const CustomDrawer: React.FC<GlassDrawerProps> = ({
  open,
  onClose,
  title,
  width = 420,
  anchor = 'right',
  children,
}) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  const isFullWidth = width === '100%' || width === '100vw' || width === '100dvw'

  return (
    <Drawer
      anchor={anchor}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isMobile ? '100%' : isFullWidth ? '100vw' : width,
            maxWidth: '100vw',
            height: '100%',
            bgcolor: '#fff',
            color: TEXT,
            overflow: 'hidden',
            borderLeft:
              anchor === 'right' && !isFullWidth ? `1px solid ${alpha('#000', 0.06)}` : 'none',
            borderRight:
              anchor === 'left' && !isFullWidth ? `1px solid ${alpha('#000', 0.06)}` : 'none',
            boxShadow: isFullWidth ? 'none' : '0 12px 36px rgba(0,0,0,0.08)',
          },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 1.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: 68,
          bgcolor: '#fff',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            noWrap
            sx={{
              fontSize: '1rem',
              fontWeight: 800,
              color: TEXT,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            width: 34,
            height: 34,
            color: alpha(TEXT, 0.75),
            border: `1px solid ${alpha('#000', 0.06)}`,
            bgcolor: '#fff',
            '&:hover': {
              bgcolor: alpha(BRAND, 0.04),
              color: BRAND,
            },
          }}
        >
          <IoClose size={18} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: alpha('#000', 0.06) }} />

      {/* Content */}
      <Box
        sx={{
          px: { xs: 2, sm: 2.5 },
          py: 2,
          height: 'calc(100% - 69px)',
          overflowY: 'auto',
          bgcolor: '#fff',

          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha('#000', 0.12),
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: alpha('#000', 0.22),
          },
        }}
      >
        {children}
      </Box>
    </Drawer>
  )
}

export default CustomDrawer

import { Box, CircularProgress, Divider, IconButton, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type React from 'react'
import { FaWhatsapp } from 'react-icons/fa'
import { FcGoogle } from 'react-icons/fc'

const BRAND_GREEN = '#4b8e40'
const BRAND_ORANGE = '#f89a3a'

interface ISocialLoginOptions {
  onSelect: (method: 'phone' | 'whatsapp' | 'google' | 'shopify') => void
  googleLoading: boolean
}

export default function SocialLoginOptions({ onSelect, googleLoading }: ISocialLoginOptions) {
  const buttons: {
    aria: string
    method: 'phone' | 'whatsapp' | 'google' | 'shopify'
    icon: React.ReactElement
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sx: Record<string, any>
  }[] = [
    {
      aria: googleLoading ? 'Connecting to Google' : 'Continue with Google',
      icon: googleLoading ? (
        <CircularProgress size={20} sx={{ color: BRAND_GREEN }} />
      ) : (
        <FcGoogle size={20} />
      ),
      method: 'google',
      sx: {
        color: BRAND_GREEN,
        borderColor: alpha(BRAND_GREEN, 0.4),
        backgroundColor: alpha('#ffffff', 0.8),
        '&:hover': {
          borderColor: BRAND_GREEN,
          boxShadow: '0 10px 30px rgba(75, 142, 64, 0.15)',
          backgroundColor: '#ffffff',
        },
      },
    },
    {
      aria: 'Continue with WhatsApp',
      icon: <FaWhatsapp size={18} title="WhatsApp Login" />,
      method: 'whatsapp',
      sx: {
        color: BRAND_ORANGE,
        borderColor: alpha(BRAND_ORANGE, 0.4),
        backgroundColor: alpha(BRAND_ORANGE, 0.08),
        '&:hover': {
          borderColor: BRAND_ORANGE,
          backgroundColor: alpha(BRAND_ORANGE, 0.15),
          boxShadow: '0 10px 30px rgba(248, 154, 58, 0.2)',
        },
      },
    },
  ]

  return (
    <>
      <Divider sx={{ my: 1, width: '100%' }}>
        <Typography
          variant="subtitle2"
          color={BRAND_GREEN}
          sx={{ userSelect: 'none', fontWeight: 600 }}
        >
          or continue with
        </Typography>
      </Divider>

      <Box
        display="flex"
        flexDirection="row"
        gap={1.5}
        width="100%"
        justifyContent="center"
        mx="auto"
      >
        {buttons?.map(({ aria, method, icon, sx }) => (
          <Tooltip key={aria} title={aria}>
            <span>
              <IconButton
                aria-label={aria}
                onClick={() => onSelect(method)}
                disabled={method === 'google' && googleLoading}
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '40%',
                  borderWidth: 1.6,
                  borderStyle: 'solid',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...sx,
                }}
              >
                {icon}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Box>
    </>
  )
}

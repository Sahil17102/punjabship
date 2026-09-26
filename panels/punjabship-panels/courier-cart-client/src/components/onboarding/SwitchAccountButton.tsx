import {
  alpha,
  Box,
  Button,
  Fade,
  IconButton,
  Popover,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { AiOutlineUserSwitch } from 'react-icons/ai'
import { MdClose } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'

export default function SwitchAccountButton() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const { logout } = useAuth()
  const navigate = useNavigate()

  /* ---------- handlers ---------- */
  const openPopover = (e: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(e.currentTarget)
  const closePopover = () => setAnchorEl(null)

  const handleConfirm = async () => {
    closePopover()
    await logout()
    navigate('/')
  }

  const BRAND_GREEN = '#4b8e40'
  const BRAND_ORANGE = '#f89a3a'

  /* ---------- styles (glass) ----- */
  const glass = {
    backdropFilter: 'blur(17px)',
    background: '#ffffff',
    border: `1px solid ${alpha(BRAND_GREEN, 0.2)}`,
    boxShadow: '0 12px 40px rgba(75, 142, 64, 0.15)',
    borderRadius: 3,
    p: 3,
    width: { xs: 280, sm: 320 },
  }

  return (
    <>
      <Button
        variant="outlined"
        size="small"
        startIcon={!isMobile && <AiOutlineUserSwitch />}
        sx={{
          textTransform: 'none',
          borderColor: alpha(BRAND_GREEN, 0.3),
          color: BRAND_GREEN,
          '&:hover': {
            borderColor: BRAND_GREEN,
            backgroundColor: alpha(BRAND_GREEN, 0.08),
          },
        }}
        onClick={openPopover}
        aria-haspopup="dialog"
        aria-label="Switch account"
      >
        {isMobile ? <AiOutlineUserSwitch /> : 'Switch account'}
      </Button>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        sx={{ mt: 1 }}
        onClose={closePopover}
        slots={{ transition: Fade }}
        transitionDuration={200}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: glass } }}
      >
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={600} color="#1a1a1a">
              Use a different account?
            </Typography>
            <IconButton
              size="small"
              onClick={closePopover}
              aria-label="Close"
              sx={{ color: '#6b6b6b' }}
            >
              <MdClose size={18} />
            </IconButton>
          </Box>

          {/* Body */}
          <Typography variant="body2" color="#6b6b6b">
            You'll be signed out and can log in with another email&nbsp;/&nbsp;phone.
          </Typography>

          {/* Actions */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button
              size="small"
              onClick={closePopover}
              sx={{
                color: '#6b6b6b',
                '&:hover': {
                  backgroundColor: alpha(BRAND_GREEN, 0.08),
                },
              }}
            >
              Cancel
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={handleConfirm}
              sx={{
                borderColor: BRAND_ORANGE,
                color: BRAND_ORANGE,
                '&:hover': {
                  borderColor: BRAND_ORANGE,
                  backgroundColor: alpha(BRAND_ORANGE, 0.08),
                },
              }}
            >
              Logout
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  )
}

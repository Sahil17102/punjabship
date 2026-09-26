import {
  alpha,
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Popover,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React, { useState } from 'react'
import { BsKeyboardFill } from 'react-icons/bs'
import { FaGavel } from 'react-icons/fa6'
import { MdAccountCircle, MdExplore, MdLogout, MdSettings } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { usePresignedDownloadUrls } from '../../hooks/Uploads/usePresignedDownloadUrls'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'
import WalletMenu from './WalletMenu'
import { requestSellerTourReplay } from '../../utils/sellerTour'
import { getImpersonationSession } from '../../utils/impersonationSession'
import { isSellerEmployeeAccount } from '../../utils/sellerEmployee'

const BRAND_PRIMARY = '#0877C9'
const BRAND_INK = '#17171A'
const BRAND_MUTED = '#6E6763'

export const getInitials = (fullName?: string) => {
  if (!fullName) return 'U'

  const parts = fullName.trim().split(/\s+/)
  const firstInitial = parts[0]?.[0] ?? ''
  const lastInitial = parts.length > 1 ? parts.at(-1)?.[0] ?? '' : ''

  return `${firstInitial}${lastInitial}`.toUpperCase()
}

const UserMenu = () => {
  const { user, logout } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const { isReady: isMerchantReady } = useMerchantReadiness()
  const isSellerWorkspace = user.role !== 'admin' && !isSellerEmployeeAccount(user)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const { data: avatarUrl } = usePresignedDownloadUrls({
    keys: user?.companyInfo?.profilePicture,
    enabled: !!user?.companyInfo?.profilePicture,
  })

  const handleClose = () => setAnchorEl(null)

  const menuItems: {
    key: string
    label?: string
    icon?: React.ElementType
    onClick?: () => void
  }[] = [
    {
      key: 'profile',
      label: 'Profile',
      icon: MdAccountCircle,
      onClick: () => {
        navigate('/profile/user_profile/settings/user')
        handleClose()
      },
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: MdSettings,
      onClick: () => {
        navigate('/settings')
        handleClose()
      },
    },

    ...(isSellerWorkspace && isMerchantReady && !getImpersonationSession() ? [{
      key: 'guided-tour',
      label: 'Guided Tour',
      icon: MdExplore,
      onClick: () => {
        handleClose()
        requestSellerTourReplay()
      },
    }] : []),
    {
      key: 'keyboard-shortcuts',
      label: 'Keyboard Shortcuts',
      icon: BsKeyboardFill,
      onClick: () => {
        navigate('/help/shortcuts')
        handleClose()
      },
    },
    {
      key: 'terms-conditions',
      label: 'Legal & Policies',
      icon: FaGavel,
      onClick: () => {
        navigate('/policies/refund_cancellation')
        handleClose()
      },
    },
    { key: 'divider' },
    {
      key: 'logout',
      label: 'Logout',
      icon: MdLogout,
      onClick: () => {
        logout()
        handleClose()
      },
    },
  ]

  return (
    <Box>
      <IconButton
        onClick={handleClick}
        sx={{
          p: 0.35,
          borderRadius: 2,
          border: '1px solid rgba(0, 0, 0, 0.08)',
          bgcolor: 'rgba(0, 0, 0, 0.02)',
          transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            bgcolor: `rgba(217, 4, 22, 0.08)`,
            borderColor: `rgba(217, 4, 22, 0.2)`,
            boxShadow: `0 4px 12px rgba(217, 4, 22, 0.12)`,
            transform: 'translateY(-2px)',
          },
        }}
      >
        {avatarUrl && !Array.isArray(avatarUrl) ? (
          <Avatar alt="User" src={avatarUrl} sx={{ width: 32, height: 32 }} />
        ) : (
          <Avatar
            sx={{
              width: { xs: 32, sm: 40 },
              height: { xs: 32, sm: 40 },
              fontSize: 'calc(0.8rem + 0.2vw)',
              bgcolor: BRAND_PRIMARY,
              color: '#fff',
              border: `2px solid ${alpha(BRAND_MUTED, 0.2)}`,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: BRAND_MUTED,
              },
            }}
          >
            {getInitials(user?.companyInfo?.contactPerson)}
          </Avatar>
        )}
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 240,
              bgcolor: alpha('#ffffff', 0.98),
              color: BRAND_INK,
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: 3.5,
              overflow: 'hidden',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.04)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              position: 'relative',
              animation: open ? 'popoverFadeIn 250ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
              '@keyframes popoverFadeIn': {
                from: { opacity: 0, transform: 'translateY(-8px) scale(0.95)' },
                to: { opacity: 1, transform: 'translateY(0) scale(1)' },
              },
            },
          },
        }}
      >
        <List dense disablePadding>
          {isMobile ? (
            <Box sx={{ px: 0.75, py: 0.75, mb: 0.5 }}>
              <WalletMenu />
            </Box>
          ) : null}
          {menuItems.map((item, index) =>
            item.key === 'divider' ? (
              <Divider key="divider" sx={{ my: 0.5, bgcolor: alpha(BRAND_PRIMARY, 0.08) }} />
            ) : (
              <ListItemButton
                key={item.key}
                onClick={item.onClick}
                sx={{
                  bgcolor: item?.key === 'logout' ? 'transparent' : 'transparent',
                  color: item?.key === 'logout' ? '#EF4444' : BRAND_INK,
                  mx: 0.5,
                  my: 0.3,
                  borderRadius: 2.5,
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  border: '1px solid transparent',
                  animation: open ? `menuItemSlide 250ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 30}ms both` : 'none',
                  '@keyframes menuItemSlide': {
                    from: { opacity: 0, transform: 'translateY(-6px) translateX(4px)' },
                    to: { opacity: 1, transform: 'translateY(0) translateX(0)' },
                  },
                  '&:hover': {
                    bgcolor:
                      item?.key === 'logout' ? alpha('#EF4444', 0.08) : alpha(BRAND_PRIMARY, 0.06),
                    color: item?.key === 'logout' ? '#DC2626' : BRAND_INK,
                    borderColor: item?.key === 'logout' ? alpha('#DC2626', 0.15) : alpha(BRAND_PRIMARY, 0.15),
                    transform: 'translateX(2px)',
                    '& .MuiListItemIcon-root': {
                      color: item?.key === 'logout' ? '#DC2626' : BRAND_PRIMARY,
                      transform: 'scale(1.05)',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: item?.key === 'logout' ? '#EF4444' : alpha(BRAND_PRIMARY, 0.7),
                    transition: 'all 200ms ease',
                  }}
                >
                  {item.icon && React.createElement(item.icon, { size: 18 })}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      fontSize="13px"
                      fontWeight={600}
                      sx={{
                        color: 'inherit',
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                />
              </ListItemButton>
            ),
          )}
        </List>
      </Popover>
    </Box>
  )
}

export default UserMenu

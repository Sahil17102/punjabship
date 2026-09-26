import { Box, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { BiLock, BiUserCircle } from 'react-icons/bi'
import { useLocation, useNavigate } from 'react-router-dom'
import PasswordSettingsForm from './profile/PasswordSettings'
import UserProfileForm from './profile/UserProfileForm'

const BRAND_NAVY = '#0877C9'

const tabs = [
  {
    id: 'profile',
    label: 'Personal details',
    icon: <BiUserCircle size={18} />,
    description: 'Update name, email, phone, and profile image',
  },
  {
    id: 'password',
    label: 'Login password',
    icon: <BiLock size={18} />,
    description: 'Change the password used to access your account',
  },
] as const

export default function UserProfileSettings() {
  const location = useLocation()
  const navigate = useNavigate()

  const isPasswordTab = location.pathname.includes('/profile/password')
  const currentTab = isPasswordTab ? 'password' : 'profile'

  return (
    <Stack spacing={1.5} width="100%">
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1, md: 1.2 },
          borderRadius: 3,
          border: `1px solid ${alpha(BRAND_NAVY, 0.13)}`,
          background: 'rgba(255,255,255,0.94)',
        }}
      >
        <Stack direction="row" spacing={0.9} sx={{ overflowX: 'auto', pb: 0.2 }}>
          {tabs.map((tab) => {
            const active = currentTab === tab.id
            return (
              <Box
                key={tab.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(tab.id === 'password' ? '/profile/password' : '/profile/user_profile')
                }
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    navigate(tab.id === 'password' ? '/profile/password' : '/profile/user_profile')
                  }
                }}
                sx={{
                  minWidth: { xs: 188, sm: 220 },
                  flex: { md: 1 },
                  borderRadius: 2.5,
                  p: { xs: 1, sm: 1.15 },
                  border: `1px solid ${active ? alpha(BRAND_NAVY, 0.35) : alpha(BRAND_NAVY, 0.14)}`,
                  backgroundColor: active ? alpha(BRAND_NAVY, 0.08) : '#fff',
                  cursor: 'pointer',
                  transition: 'all .2s ease',
                }}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box
                    sx={{
                      color: active ? BRAND_NAVY : '#5f769d',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {tab.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: active ? BRAND_NAVY : '#17171A',
                      fontSize: '0.9rem',
                    }}
                  >
                    {tab.label}
                  </Typography>
                </Stack>
                <Typography
                  sx={{ color: '#6E6763', fontSize: '0.78rem', mt: 0.35, lineHeight: 1.45 }}
                >
                  {tab.description}
                </Typography>
              </Box>
            )
          })}
        </Stack>
      </Paper>

      {currentTab === 'password' ? <PasswordSettingsForm /> : <UserProfileForm />}
    </Stack>
  )
}

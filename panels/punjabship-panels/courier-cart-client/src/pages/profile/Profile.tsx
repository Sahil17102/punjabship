import { alpha, Box, Paper, Stack, Typography } from '@mui/material'
import { Suspense } from 'react'
import { FiCreditCard, FiFileText, FiShield, FiUser } from 'react-icons/fi'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

type TopSection = 'user_profile' | 'company' | 'bank_details' | 'kyc_details'

const BRAND_PRIMARY = '#0877C9'
const BRAND_WINE = '#B8D719'
const BRAND_TEXT = '#17171A'
const BRAND_MUTED = '#6E6763'

const sectionTabs: Array<{
  label: string
  value: TopSection
  icon: React.ReactNode
  shortLabel: string
}> = [
  {
    label: 'Personal details',
    value: 'user_profile',
    icon: <FiUser size={18} />,
    shortLabel: 'Personal',
  },
  {
    label: 'Company details',
    value: 'company',
    icon: <FiFileText size={18} />,
    shortLabel: 'Company',
  },
  {
    label: 'Bank accounts',
    value: 'bank_details',
    icon: <FiCreditCard size={18} />,
    shortLabel: 'Bank',
  },
  {
    label: 'KYC verification',
    value: 'kyc_details',
    icon: <FiShield size={18} />,
    shortLabel: 'KYC',
  },
]

function resolveActiveSection(pathname: string): TopSection {
  if (pathname.includes('/profile/company')) return 'company'
  if (pathname.includes('/profile/bank_details')) return 'bank_details'
  if (pathname.includes('/profile/kyc_details')) return 'kyc_details'
  return 'user_profile'
}

export default function ProfileLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const active = resolveActiveSection(location.pathname)

  return (
    <Stack spacing={1.2} sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 0.8, md: 1 },
          borderRadius: 3,
          border: `1px solid ${alpha('#111113', 0.08)}`,
          background: 'rgba(255,255,255,0.96)',
          boxShadow: '0 8px 22px rgba(17, 17, 19, 0.04)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 0.8,
            overflowX: 'auto',
            pb: 0.1,
          }}
        >
          {sectionTabs.map((tab) => {
            const isActive = tab.value === active

            return (
              <Box
                key={tab.value}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/profile/${tab.value}`)}
                onKeyUp={(e) => e.key === 'Enter' && navigate(`/profile/${tab.value}`)}
                sx={{
                  minWidth: { xs: 128, sm: 148, md: 168 },
                  px: 1.05,
                  py: 0.85,
                  borderRadius: 2.5,
                  border: `1px solid ${
                    isActive ? alpha(BRAND_PRIMARY, 0.28) : alpha('#111113', 0.08)
                  }`,
                  backgroundColor: isActive ? alpha(BRAND_PRIMARY, 0.06) : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all .18s ease',
                  '&:hover': {
                    borderColor: alpha(BRAND_PRIMARY, 0.22),
                    backgroundColor: alpha(BRAND_PRIMARY, 0.035),
                  },
                }}
              >
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      flexShrink: 0,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: 2,
                      backgroundColor: isActive ? alpha(BRAND_PRIMARY, 0.11) : '#F8F3F1',
                      color: isActive ? BRAND_PRIMARY : BRAND_WINE,
                    }}
                  >
                    {tab.icon}
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: { xs: '0.8rem', sm: '0.84rem' },
                        fontWeight: 800,
                        color: BRAND_TEXT,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {tab.shortLabel}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.15,
                        fontSize: '0.68rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        fontWeight: 800,
                        color: isActive ? BRAND_PRIMARY : BRAND_MUTED,
                      }}
                    >
                      {isActive ? 'Active' : 'Open'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )
          })}
        </Box>
      </Paper>

      <Box sx={{ width: '100%' }}>
        <Suspense
          fallback={<Box key={`profile-fallback-${location.pathname}`} sx={{ minHeight: 120 }} />}
        >
          <Box key={location.pathname}>
            <Outlet />
          </Box>
        </Suspense>
      </Box>
    </Stack>
  )
}

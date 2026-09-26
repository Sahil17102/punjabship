import { Avatar, Box, Button, Card, Grid, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import {
  FiBell,
  FiHome,
  FiLogOut,
  FiPackage,
  FiPlus,
  FiSearch,
  FiSettings,
  FiTrendingUp,
} from 'react-icons/fi'

const BRAND_ORANGE = '#0877C9'
const BRAND_DARK = '#0f172a'
const BG_LIGHT = '#f8fafc'

interface NavItem {
  icon: React.ReactNode
  label: string
  id: string
}

const navItems: NavItem[] = [
  { icon: <FiHome size={20} />, label: 'Dashboard', id: 'dashboard' },
  { icon: <FiPackage size={20} />, label: 'Shipments', id: 'shipments' },
  { icon: <FiTrendingUp size={20} />, label: 'Analytics', id: 'analytics' },
  { icon: <FiSettings size={20} />, label: 'Settings', id: 'settings' },
]

export default function MerchantDashboard() {
  const [activeNav, setActiveNav] = useState('dashboard')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${BG_LIGHT} 0%, #f1f5f9 100%)`,
        p: { xs: 2, sm: 3, md: 4 },
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
      }}
    >
      {/* Main Dashboard Container */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 1600,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr', lg: '280px 1fr 320px' },
          gap: { xs: 0, md: 3 },
          background: '#ffffff',
          borderRadius: { xs: '20px', md: '32px' },
          boxShadow: '0 15px 50px rgba(0, 0, 0, 0.08)',
          overflow: 'hidden',
        }}
      >
        {/* LEFT SIDEBAR */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            p: 3,
            background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
            borderRight: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          {/* Logo */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                fontSize: '24px',
                fontWeight: 900,
                color: BRAND_ORANGE,
                letterSpacing: '-0.5px',
              }}
            >
              ⬡ PunjabShip
            </Box>
          </Box>

          {/* Merchant Profile */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              background: '#f1f5f9',
              borderRadius: '16px',
              mb: 4,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: '#e2e8f0',
              },
            }}
          >
            <Avatar
              sx={{
                width: 44,
                height: 44,
                background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, #ff6b6b 100%)`,
                fontWeight: 700,
                fontSize: '18px',
              }}
            >
              JM
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: BRAND_DARK }}>
                John's Store
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                Premium Merchant
              </Typography>
            </Box>
          </Box>

          {/* Navigation Menu */}
          <Stack spacing={1.5} sx={{ flex: 1 }}>
            {navItems.map((item) => (
              <Box
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2.5,
                  p: '12px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeNav === item.id ? BRAND_ORANGE : 'transparent',
                  color: activeNav === item.id ? '#ffffff' : '#475569',
                  fontWeight: activeNav === item.id ? 600 : 500,
                  fontSize: '0.95rem',
                  '&:hover': {
                    background: activeNav === item.id ? BRAND_ORANGE : '#f1f5f9',
                  },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>{item.icon}</Box>
                {item.label}
              </Box>
            ))}
          </Stack>

          {/* Decorative Blob */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: '120px',
              margin: '20px -12px -12px',
              background: `linear-gradient(135deg, ${BRAND_ORANGE}15 0%, #3b82f615 100%)`,
              borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
              opacity: 0.6,
            }}
          />

          {/* Logout */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: '12px 16px',
              borderRadius: '12px',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: '#fee2e2',
                color: BRAND_ORANGE,
              },
            }}
          >
            <FiLogOut size={20} />
            Logout
          </Box>
        </Box>

        {/* CENTER MAIN CONTENT */}
        <Box
          sx={{
            p: { xs: 3, md: 4, lg: 5 },
            overflowY: 'auto',
            maxHeight: '100vh',
          }}
        >
          {/* Header Section */}
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                fontWeight: 800,
                color: BRAND_DARK,
                mb: 0.5,
              }}
            >
              Hello, John 👋
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.95rem' }}>
              Monday, 21 April 2026 • 4:30 PM IST
            </Typography>
          </Box>

          {/* Search & Action Bar */}
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              mb: 4,
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <TextField
              placeholder="Search shipments, tracking..."
              size="small"
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  '&:hover': { border: `1px solid ${BRAND_ORANGE}40` },
                  '&.Mui-focused': { border: `2px solid ${BRAND_ORANGE}` },
                },
              }}
              InputProps={{
                startAdornment: (
                  <FiSearch size={18} style={{ marginRight: '10px', color: '#94a3b8' }} />
                ),
              }}
            />
            <Button
              variant="contained"
              sx={{
                background: BRAND_ORANGE,
                px: 3,
                borderRadius: '12px',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': {
                  background: '#b8030d',
                  boxShadow: `0 10px 25px ${BRAND_ORANGE}30`,
                },
              }}
              startIcon={<FiPlus size={18} />}
            >
              Create Shipment
            </Button>
          </Box>

          {/* Stats Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {[
              { label: 'Active Shipments', value: '24', color: '#3b82f6' },
              { label: 'Delivered Today', value: '18', color: '#10b981' },
              { label: 'Pending', value: '5', color: '#f59e0b' },
              { label: 'Revenue', value: '₹12,450', color: '#8b5cf6' },
            ].map((stat, i) => (
              <Grid size={{ xs: 6, sm: 3 }} key={i}>
                <Card
                  sx={{
                    p: 2.5,
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mb: 1 }}>
                    {stat.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      background: `linear-gradient(135deg, ${stat.color} 0%, ${stat.color}cc 100%)`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {stat.value}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Recent Shipments */}
          <Box>
            <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: BRAND_DARK, mb: 2 }}>
              Recent Shipments
            </Typography>

            <Stack spacing={2}>
              {[
                {
                  id: 'SHP001',
                  destination: 'Mumbai',
                  status: 'In Transit',
                  date: '2m ago',
                  color: '#3b82f6',
                },
                {
                  id: 'SHP002',
                  destination: 'Delhi',
                  status: 'Delivered',
                  date: '1h ago',
                  color: '#10b981',
                },
                {
                  id: 'SHP003',
                  destination: 'Bangalore',
                  status: 'Processing',
                  date: '3h ago',
                  color: '#f59e0b',
                },
              ].map((shipment) => (
                <Card
                  key={shipment.id}
                  onMouseEnter={() => setHoveredCard(shipment.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                    background: hoveredCard === shipment.id ? '#f8fafc' : '#ffffff',
                    '&:hover': {
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.12)',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: BRAND_DARK, mb: 0.5 }}>
                      {shipment.id}
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                      📍 {shipment.destination}
                    </Typography>
                  </Box>

                  <Box sx={{ textAlign: 'right' }}>
                    <Box
                      sx={{
                        display: 'inline-block',
                        px: 2,
                        py: 0.75,
                        background: `${shipment.color}15`,
                        color: shipment.color,
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        mb: 0.5,
                      }}
                    >
                      {shipment.status}
                    </Box>
                    <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                      {shipment.date}
                    </Typography>
                  </Box>
                </Card>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* RIGHT UTILITY PANEL */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'flex' },
            flexDirection: 'column',
            p: 3,
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
            borderLeft: '1px solid #e2e8f0',
            position: 'sticky',
            top: 0,
            height: '100vh',
            overflow: 'auto',
          }}
        >
          {/* Notifications */}
          <Box sx={{ mb: 4 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}
            >
              <Typography sx={{ fontWeight: 700, color: BRAND_DARK }}>Notifications</Typography>
              <Box sx={{ position: 'relative', cursor: 'pointer' }}>
                <FiBell size={20} />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    width: '8px',
                    height: '8px',
                    background: BRAND_ORANGE,
                    borderRadius: '50%',
                  }}
                />
              </Box>
            </Box>

            <Stack spacing={2}>
              {[
                { title: 'Shipment Delivered', desc: 'SHP001 to Mumbai', time: '2m ago' },
                { title: 'Low Balance Alert', desc: 'Recharge wallet', time: '1h ago' },
                { title: 'Rate Update', desc: 'New courier rates available', time: '3h ago' },
              ].map((notif, i) => (
                <Box
                  key={i}
                  sx={{
                    p: 2,
                    background: '#f1f5f9',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: `${BRAND_ORANGE}15`,
                    },
                  }}
                >
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: BRAND_DARK }}>
                    {notif.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 0.5 }}>
                    {notif.desc}
                  </Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {notif.time}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          {/* Quick Stats */}
          <Box>
            <Typography sx={{ fontWeight: 700, color: BRAND_DARK, mb: 2 }}>This Month</Typography>

            <Stack spacing={2}>
              {[
                { label: 'Shipments', value: '342', change: '+12%' },
                { label: 'Earnings', value: '₹45,320', change: '+8%' },
                { label: 'Avg Rating', value: '4.8/5', change: '+0.2' },
              ].map((stat, i) => (
                <Box key={i} sx={{ p: 2, background: '#f1f5f9', borderRadius: '12px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {stat.label}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
                      {stat.change}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: BRAND_DARK }}>
                    {stat.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

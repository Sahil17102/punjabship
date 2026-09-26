import { Box, Container, Tab, Tabs, Typography } from '@mui/material'
import { useEffect, useMemo, useState, type SyntheticEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { getVisibleOrderTypes, type OrderBusinessType } from '../../utils/businessTypes'
import B2BOrderForm from './b2b/B2BOrderForm'
import B2COrderFormSteps from './b2c/B2COrderForm'

const getRequestedOrderType = (value: string | null): OrderBusinessType =>
  value === 'b2b' ? 'b2b' : 'b2c'

const CreateOrderWrapper = () => {
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const visibleOrderTypes = useMemo(
    () => getVisibleOrderTypes(user?.businessType),
    [user?.businessType],
  )
  const requestedType = getRequestedOrderType(searchParams.get('type'))
  const initialType = visibleOrderTypes.includes(requestedType)
    ? requestedType
    : visibleOrderTypes[0]
  const [activeTab, setActiveTab] = useState<OrderBusinessType>(initialType)

  useEffect(() => {
    setActiveTab(
      visibleOrderTypes.includes(requestedType) ? requestedType : visibleOrderTypes[0],
    )
  }, [requestedType, visibleOrderTypes])

  const handleTabChange = (_event: SyntheticEvent, newValue: OrderBusinessType) => {
    setActiveTab(newValue)
  }

  return (
    <Container
      maxWidth={false}
      sx={{
        px: { xs: 0, sm: 0.25, md: 0.4 },
        py: 0,
        height: { md: 'calc(100dvh - 52px)' },
      }}
    >
      <Box
        sx={{
          flex: 1,
          bgcolor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: { xs: 1.5, sm: 2 },
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
          p: { xs: 0.65, sm: 0.75, md: 0.85 },
          minHeight: { xs: 'calc(100dvh - 52px)', md: '100%' },
          height: { md: '100%' },
          overflow: 'hidden',
        }}
      >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: 1,
              borderColor: 'divider',
              mb: 0.55,
              gap: 0.75,
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              minHeight: 30,
            }}
          >
            <Typography variant="body2" fontWeight={700} color="text.primary">
              Create Order
            </Typography>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="order type tabs"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                  minHeight: 28,
                  px: { xs: 0.85, sm: 1.1 },
                },
                '& .Mui-selected': {
                  color: '#0877C9',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#0877C9',
                  height: 3,
                },
              }}
            >
              {visibleOrderTypes.includes('b2c') && <Tab label="B2C Order" value="b2c" />}
              {visibleOrderTypes.includes('b2b') && <Tab label="B2B Order" value="b2b" />}
            </Tabs>
          </Box>

          <Box sx={{ height: { md: 'calc(100% - 36px)' }, minHeight: 0 }}>
            {activeTab === 'b2c' ? <B2COrderFormSteps /> : <B2BOrderForm />}
          </Box>
        </Box>
    </Container>
  )
}

export default CreateOrderWrapper

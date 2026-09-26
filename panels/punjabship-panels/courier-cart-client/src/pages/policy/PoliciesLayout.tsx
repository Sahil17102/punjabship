import { Box, Stack } from '@mui/material'
import { Suspense } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { SmartTabs } from '../../components/UI/tab/Tabs'
// adjust this import if SmartTabs is in a different folder

// Define your tab keys
type TabKey = 'refund_cancellation' | 'privacy_policy' | 'terms_of_service' | 'contact_us'

const TABS: { value: TabKey; label: string }[] = [
  { value: 'refund_cancellation', label: 'Refund & Cancellation' },
  { value: 'privacy_policy', label: 'Privacy Policy' },
  { value: 'terms_of_service', label: 'Terms of Service' },
  { value: 'contact_us', label: 'Contact Us' },
]

const PoliciesLayout = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // detect current active tab from pathname
  const currentPath = location.pathname.split('/').pop() as TabKey
  const activeTab: TabKey = (TABS.find((t) => t.value === currentPath)?.value ||
    'privacy_policy') as TabKey

  return (
    <Stack>
      {/* Tabs */}
      <SmartTabs
        value={activeTab}
        onChange={(value: TabKey) => {
          navigate(`/policies/${value}`)
        }}
        tabs={TABS}
      />

      {/* Page content */}
      <div style={{ marginTop: '32px' }}>
        <Suspense fallback={<Box key={`policy-fallback-${location.pathname}`} sx={{ minHeight: 80 }} />}>
          <Box key={location.pathname}>
            <Outlet />
          </Box>
        </Suspense>
      </div>
    </Stack>
  )
}

export default PoliciesLayout

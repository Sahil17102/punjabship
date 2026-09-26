import { Stack } from '@mui/material'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AdminPageShell from '../../components/admin/AdminPageShell'
import AllChannelOptions from '../../components/channels/AllChannelOptions'
import UserConnectedChannels from '../../components/channels/UserConnectedChannels'
import { toast } from '../../components/UI/Toast'

const Channels = () => {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const shopifyStatus = params.get('shopify')
    if (!shopifyStatus) return

    const message = params.get('message') || ''
    const shop = params.get('shop') || ''
    toast.open({
      message:
        shopifyStatus === 'connected'
          ? message || `Shopify store ${shop || ''} connected successfully`.trim()
          : message || 'Shopify connection failed',
      severity: shopifyStatus === 'connected' ? 'success' : 'error',
    })

    params.delete('shopify')
    params.delete('message')
    params.delete('shop')
    navigate(
      {
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      },
      { replace: true },
    )
  }, [location.pathname, location.search, navigate])

  return (
    <AdminPageShell
      title="Channel connection workspace"
      badge="Integrations"
      description="Connect sales channels, review live store links, and keep inbound order sources organized under one PunjabShip admin surface."
      metrics={[
        { label: 'Primary channels', value: 'Shopify + WooCommerce', hint: 'Live connections currently supported' },
        { label: 'Connection model', value: 'Centralized', hint: 'Stores managed in one workspace' },
        { label: 'Order intake', value: 'Structured', hint: 'Connected sources stay visible and editable' },
      ]}
    >
      <Stack spacing={2} sx={{ p: { xs: 1.5, md: 2.2 } }}>
        <UserConnectedChannels />
        <AllChannelOptions />
      </Stack>
    </AdminPageShell>
  )
}

export default Channels

import { Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { TbEditCircle } from 'react-icons/tb'
import type { Stores } from '../../api/integrations'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import { useAuth } from '../../context/auth/AuthContext'
import {
  useDeleteIntegration,
  useUserChannelIntegrations,
} from '../../hooks/Integrations/useUserChannelIntegrations'
import {
  useIntegrateWooCommerce,
  useSyncShopifyOrders,
  useSyncWooCommerceOrders,
  useUpdateShopifySettings,
} from '../../hooks/useIntegrations'
import { channelIntegrationImageMapping } from '../../utils/utility'
import ShopifyConnectionModal from '../integrations/ShopifyConnectionModal'
import type { ShopifyForm } from '../integrations/ShopifyIntegration'
import WooCommerceConnectionModal from '../integrations/woocommerce/WooCommerceConnectionModal'
import type { WooCommerceForm } from '../integrations/woocommerce/WooCommerceIntegration'
import TableSkeleton from '../UI/table/TableSkeleton'
import { toast } from '../UI/Toast'

const getApiErrorMessage = (error: any, fallback: string) =>
  error?.response?.data?.error ||
  error?.response?.data?.message ||
  error?.message ||
  fallback

const withShopifySyncDefaults = (settings?: ShopifyForm['settings']) => ({
  fulfillTrigger: 'order_booked',
  customerNotifyOnFulfill: 'do_not_notify',
  autoUpdateShipmentStatus: true,
  autoCancelOrders: true,
  markCodPaidOnDelivery: false,
  ...(settings || {}),
})

const withWooCommerceSyncDefaults = (settings?: WooCommerceForm['settings']) => ({
  autoUpdateStatus: true,
  autoUpdateShipmentStatus: true,
  markCodPaid: false,
  historicalTerminalSyncDays: 10,
  ...(settings || {}),
})

const UserConnectedChannels = () => {
  const { user: userData, refetchUser } = useAuth()
  const { mutate: deleteIntegration, isPending: deleting } = useDeleteIntegration()

  const { data: stores, isLoading } = useUserChannelIntegrations()

  const { mutate: updateShopifySettings, isPending: integrating } = useUpdateShopifySettings()
  const { mutate: syncShopifyOrders, isPending: syncingShopify } = useSyncShopifyOrders()
  const { mutate: integrateWooCommerce, isPending: integratingWooCommerce } =
    useIntegrateWooCommerce()
  const { mutate: syncWooCommerceOrders, isPending: syncingWooCommerce } =
    useSyncWooCommerceOrders()
  const [selectedStore, setSelectedStore] = useState<{
    platform: number | null
    channelId: string
  }>({ channelId: '', platform: null })

  const [details, setDetails] = useState({})

  const columns: Column<Stores>[] = [
    {
      id: 'id',
      label: 'Channel Id',
    },
    {
      id: 'name',
      label: 'Store',
    },
    {
      id: 'domain',
      label: 'Domain',
    },
    {
      id: 'platformId',
      label: 'Platform',
      render: (platformId) => (
        <Stack>
          <img
            height={'30px'}
            width={'65px'}
            style={{ objectFit: 'cover', borderRadius: '5px' }}
            src={channelIntegrationImageMapping[platformId]}
          />
        </Stack>
      ),
    },
    {
      id: 'id',
      label: 'Action',
      render: (value, row) => (
        <Stack direction="row" alignItems={'center'} spacing={1.5}>
          <Stack
            onClick={() => {
              setSelectedStore({ channelId: value, platform: row?.platformId })
              const metadata = (row as any)?.metadata || {}
              const credentialDetails =
                row?.platformId === 2
                  ? {
                      storeUrl: row?.domain,
                      consumerKey: row?.apiKey || '',
                      consumerSecret: row?.adminApiAccessToken || '',
                      webhookSecret: metadata?.wooWebhookSecret || metadata?.webhookSecret || '',
                      settings: withWooCommerceSyncDefaults(row?.settings),
                    }
                  : {
                      storeUrl: row?.domain,
                      settings: withShopifySyncDefaults(row?.settings),
                    }

              setDetails({
                ...row,
                ...credentialDetails,
              })
            }}
            sx={{ color: '#ffd25e', cursor: 'pointer' }}
            direction="row"
            alignItems={'center'}
            spacing={1}
          >
            <TbEditCircle />
            <Typography fontWeight={600} fontSize={'12px'}>
              Edit
            </Typography>
          </Stack>
          {(row?.platformId === 1 || row?.platformId === 2) && (
            <Typography
              fontWeight={600}
              fontSize={'12px'}
              sx={{
                color:
                  (row?.platformId === 1 ? syncingShopify : syncingWooCommerce)
                    ? '#9ca3af'
                    : '#34d399',
                cursor:
                  (row?.platformId === 1 ? syncingShopify : syncingWooCommerce)
                    ? 'default'
                    : 'pointer',
              }}
              onClick={() => {
                const isShopify = row?.platformId === 1
                const isSyncing = isShopify ? syncingShopify : syncingWooCommerce
                const syncOrders = isShopify ? syncShopifyOrders : syncWooCommerceOrders
                const label = isShopify ? 'Shopify' : 'WooCommerce'

                if (isSyncing) return
                syncOrders(
                  { limit: 100, storeId: row?.id },
                  {
                    onSuccess: (data: any) => {
                      toast.open({
                        message: `${label} sync complete: ${data?.created ?? 0} created, ${data?.updated ?? 0} updated`,
                        severity: 'success',
                      })
                    },
                    onError: (error: any) => {
                      toast.open({
                        message:
                          error?.response?.data?.error || `Failed to sync ${label} orders`,
                        severity: 'error',
                      })
                    },
                  },
                )
              }}
            >
              {(row?.platformId === 1 ? syncingShopify : syncingWooCommerce)
                ? 'Syncing...'
                : 'Sync Orders'}
            </Typography>
          )}
        </Stack>
      ),
    },
  ]

  const handleUpdateShopify = () => {
    const payload = {
      storeId: selectedStore.channelId,
      settings: ((details as any)?.settings || {}) as ShopifyForm['settings'],
    }

    updateShopifySettings(payload, {
      onSuccess: (data) => {
        toast.open({
          message: data?.warning ? `${data?.message}. ${data.warning}` : data?.message,
          severity: data?.warning ? 'warning' : 'success',
        })
        setSelectedStore({ channelId: '', platform: null })
      },
      onError: (error: any) => {
        const message = getApiErrorMessage(error, 'Error integrating Shopify store')
        console.error('Error integrating Shopify store:', message)
        toast.open({
          message,
          severity: 'error',
        })
      },
    })
  }

  const handleUpdateWooCommerce = () => {
    const metadata = (details as any)?.metadata || {}
    const payload = {
      ...(details as any),
      storeUrl: (details as any)?.storeUrl || (details as any)?.domain,
      consumerKey: (details as any)?.consumerKey || (details as any)?.apiKey,
      consumerSecret:
        (details as any)?.consumerSecret || (details as any)?.adminApiAccessToken,
      webhookSecret:
        (details as any)?.webhookSecret ||
        metadata?.wooWebhookSecret ||
        metadata?.webhookSecret ||
        '',
      userId: userData?.userId,
    } as WooCommerceForm

    integrateWooCommerce(payload, {
      onSuccess: (data) => {
        toast.open({
          message: data?.warning ? `${data?.message}. ${data.warning}` : data?.message,
          severity: data?.warning ? 'warning' : 'success',
        })
        setSelectedStore({ channelId: '', platform: null })
      },
      onError: (error: any) => {
        const message = getApiErrorMessage(error, 'Error connecting WooCommerce store')
        console.error('Error integrating WooCommerce store:', message)
        toast.open({
          message,
          severity: 'error',
        })
      },
    })
  }

  const handleDeleteStore = () => {
    deleteIntegration({ storeId: selectedStore.channelId, platformId: selectedStore.platform }, {
      onSuccess: () => {
        refetchUser()
        toast.open({
          message:
            selectedStore.platform === 1
              ? 'Shopify store disconnected. Your imported orders are still available.'
              : 'Store deleted successfully',
          severity: 'success',
        })
        setSelectedStore({ channelId: '', platform: null })
      },
      onError: (error: unknown) => {
        console.error('Delete error:', error)
        toast.open({
          message: getApiErrorMessage(error, 'Failed to remove store'),
          severity: 'error',
        })
      },
    })
  }

  return (
    <>
      {isLoading ? (
        <TableSkeleton />
      ) : (
        <DataTable<Stores>
          rows={stores ?? []}
          columns={columns}
          title="Your Connected Stores"
          subTitle="Manage the stores you’ve integrated with your sales channels"
          pagination
          onSelectRows={(ids) => console.log('Selected store IDs:', ids)}
        />
      )}

      {selectedStore?.platform === 1 && (
        <ShopifyConnectionModal
          deleting={deleting}
          handleDelete={handleDeleteStore}
          integrating={integrating}
          handleConnect={handleUpdateShopify}
          isEditing={selectedStore?.platform ? true : false}
          setShopifyDetails={setDetails}
          shopifyDetails={details as ShopifyForm}
          openModal={selectedStore?.platform ? true : false}
          onSetOpen={() => setSelectedStore({ channelId: '', platform: null })}
        />
      )}

      {selectedStore?.platform === 2 && (
        <WooCommerceConnectionModal
          deleting={deleting}
          handleDelete={handleDeleteStore}
          integrating={integratingWooCommerce}
          handleConnect={handleUpdateWooCommerce}
          isEditing={selectedStore?.platform ? true : false}
          setWooDetails={setDetails as any}
          wooDetails={details as WooCommerceForm}
          openModal={selectedStore?.platform ? true : false}
          onSetOpen={() => setSelectedStore({ channelId: '', platform: null })}
        />
      )}

      {/* Add more modals here as needed */}
    </>
  )
}

export default UserConnectedChannels

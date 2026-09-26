import { Box, Button, Stack } from '@mui/material'
import { useState } from 'react'
import { MdAdd, MdDownload } from 'react-icons/md'
import type { WebhookSubscription } from '../../api/apiIntegration'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import { SmartTabs } from '../../components/UI/tab/Tabs'
import { toast } from '../../components/UI/Toast'
import {
  useApiKeys,
  useCreateApiKey,
  useCreateWebhook,
  useDeleteApiKey,
  useDeleteWebhook,
  useRegenerateWebhookSecret,
  useUpdateApiKey,
  useUpdateWebhook,
  useWebhooks,
} from '../../hooks/useApiIntegration'
import { ApiKeysTable } from './apiIntegration/ApiKeysTable'
import { CreateApiKeyModal } from './apiIntegration/CreateApiKeyModal'
import { SamplePayloadModal } from './apiIntegration/SamplePayloadModal'
import { ViewApiKeyModal } from './apiIntegration/ViewApiKeyModal'
import { ViewWebhookSecretModal } from './apiIntegration/ViewWebhookSecretModal'
import { WebhookFormModal } from './apiIntegration/WebhookFormModal'
import { WebhookInfoPanel } from './apiIntegration/WebhookInfoPanel'
import { WebhooksTable } from './apiIntegration/WebhooksTable'

const ApiIntegration = () => {
  const [activeTab, setActiveTab] = useState<'apiKeys' | 'webhooks'>('apiKeys')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null)

  // API Keys - only fetch when apiKeys tab is active
  const { data: apiKeysData, isLoading: apiKeysLoading } = useApiKeys(activeTab === 'apiKeys')
  const apiKeys = apiKeysData?.data || []
  const createApiKey = useCreateApiKey()
  const updateApiKey = useUpdateApiKey()
  const deleteApiKey = useDeleteApiKey()

  // Webhooks - only fetch when webhooks tab is active
  const { data: webhooksData, isLoading: webhooksLoading } = useWebhooks(activeTab === 'webhooks')
  const webhooks = webhooksData?.data || []
  const createWebhook = useCreateWebhook()
  const updateWebhook = useUpdateWebhook()
  const deleteWebhook = useDeleteWebhook()
  const regenerateWebhookSecret = useRegenerateWebhookSecret()

  // Modals
  const [apiKeyModalOpen, setApiKeyModalOpen] = useState(false)
  const [webhookModalOpen, setWebhookModalOpen] = useState(false)
  const [apiKeyViewModalOpen, setApiKeyViewModalOpen] = useState(false)
  const [webhookSecretModalOpen, setWebhookSecretModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<WebhookSubscription | null>(null)
  const [samplePayloadModalOpen, setSamplePayloadModalOpen] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)

  // Form states
  const [newApiKey, setNewApiKey] = useState<{
    api_key: string
    api_secret: string
    key_name: string
  } | null>(null)
  const [newWebhookSecret, setNewWebhookSecret] = useState<{
    secret: string
    name: string | null
    url: string
  } | null>(null)

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    toast.open({ message: 'Copied to clipboard', severity: 'success' })
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleCopySecret = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSecret(label)
    toast.open({ message: 'Copied to clipboard', severity: 'success' })
    setTimeout(() => setCopiedSecret(null), 2000)
  }

  const handleCreateApiKey = (data: { key_name: string }) => {
    createApiKey.mutate(data, {
      onSuccess: (response) => {
        setNewApiKey(response.data)
        setApiKeyModalOpen(false)
        setApiKeyViewModalOpen(true)
        toast.open({ message: 'API Key created successfully', severity: 'success' })
      },
      onError: (error: unknown) => {
        const errorMessage =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to create API key'
        toast.open({
          message: errorMessage,
          severity: 'error',
        })
      },
    })
  }

  const handleUpdateApiKey = (id: string, data: { is_active?: boolean }) => {
    updateApiKey.mutate(
      { id, data },
      {
        onSuccess: () => {
          toast.open({ message: 'API Key updated successfully', severity: 'success' })
        },
        onError: (error: unknown) => {
          const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to update API key'
          toast.open({
            message: errorMessage,
            severity: 'error',
          })
        },
      },
    )
  }

  const handleDeleteApiKey = (id: string) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      deleteApiKey.mutate(id, {
        onSuccess: () => {
          toast.open({ message: 'API Key deleted successfully', severity: 'success' })
        },
        onError: (error: unknown) => {
          const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to delete API key'
          toast.open({
            message: errorMessage,
            severity: 'error',
          })
        },
      })
    }
  }

  const handleCreateWebhook = (data: {
    url: string
    name: string
    events: string[]
    is_active: boolean
  }) => {
    if (editingItem) {
      updateWebhook.mutate(
        { id: editingItem.id, data },
        {
          onSuccess: () => {
            setEditingItem(null)
            setWebhookModalOpen(false)
            toast.open({ message: 'Webhook updated successfully', severity: 'success' })
          },
          onError: (error: unknown) => {
            const errorMessage =
              (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              'Failed to update webhook'
            toast.open({
              message: errorMessage,
              severity: 'error',
            })
          },
        },
      )
    } else {
      createWebhook.mutate(data, {
        onSuccess: (response) => {
          setNewWebhookSecret({
            secret: response.data.secret,
            name: response.data.name,
            url: response.data.url,
          })
          setWebhookModalOpen(false)
          setWebhookSecretModalOpen(true)
          toast.open({ message: 'Webhook created successfully', severity: 'success' })
        },
        onError: (error: unknown) => {
          const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to create webhook'
          toast.open({
            message: errorMessage,
            severity: 'error',
          })
        },
      })
    }
  }

  const handleDeleteWebhook = (id: string) => {
    if (window.confirm('Are you sure you want to delete this webhook subscription?')) {
      deleteWebhook.mutate(id, {
        onSuccess: () => {
          toast.open({ message: 'Webhook deleted successfully', severity: 'success' })
        },
        onError: (error: unknown) => {
          const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to delete webhook'
          toast.open({
            message: errorMessage,
            severity: 'error',
          })
        },
      })
    }
  }

  const handleEditWebhook = (webhook: WebhookSubscription) => {
    setEditingItem(webhook)
    setWebhookModalOpen(true)
  }

  const handleRegenerateWebhookSecret = (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to regenerate the webhook secret? The old secret will no longer work for verifying webhook signatures.',
      )
    ) {
      regenerateWebhookSecret.mutate(id, {
        onSuccess: (response) => {
          setNewWebhookSecret({
            secret: response.data.secret,
            name: response.data.name,
            url: response.data.url,
          })
          setWebhookSecretModalOpen(true)
          toast.open({ message: 'Webhook secret regenerated successfully', severity: 'success' })
        },
        onError: (error: unknown) => {
          const errorMessage =
            (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Failed to regenerate webhook secret'
          toast.open({
            message: errorMessage,
            severity: 'error',
          })
        },
      })
    }
  }

  const handleViewSamplePayloads = () => {
    setSelectedEventType(null)
    setSamplePayloadModalOpen(true)
  }

  const handleSelectEvent = (event: string) => {
    setSelectedEventType(event)
    setSamplePayloadModalOpen(true)
  }

  const handleDownloadDocumentation = () => {
    const link = document.createElement('a')
    link.href = '/API_DOCUMENTATION.pdf'
    link.download = 'PunjabShip-API-Documentation.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const controls = (
    <Box sx={{ px: 2 }}>
      <SmartTabs
        tabs={[
          { label: 'API Keys', value: 'apiKeys' },
          { label: 'Webhooks', value: 'webhooks' },
        ]}
        value={activeTab}
        onChange={(value) => setActiveTab(value as 'apiKeys' | 'webhooks')}
      />
    </Box>
  )

  return (
    <ListPageLayout
      title="API Integration"
      description="Manage API keys, webhooks, and integrations"
      actions={[
        {
          label: 'Download Documentation',
          onClick: handleDownloadDocumentation,
          icon: <MdDownload />,
          variant: 'outlined',
        },
      ]}
      controls={controls}
    >

        {/* API Keys Tab */}
        {activeTab === 'apiKeys' && (
          <Box>
            <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={2}>
              <Button
                variant="contained"
                startIcon={<MdAdd />}
                onClick={() => setApiKeyModalOpen(true)}
              >
                Create API Key
              </Button>
            </Stack>
            <ApiKeysTable
              apiKeys={apiKeys}
              isLoading={apiKeysLoading}
              onUpdate={handleUpdateApiKey}
              onDelete={handleDeleteApiKey}
            />
          </Box>
        )}

        {/* Webhooks Tab */}
        {activeTab === 'webhooks' && (
          <Stack direction="row" spacing={3}>
            <WebhookInfoPanel
              onViewSamplePayloads={handleViewSamplePayloads}
              onSelectEvent={handleSelectEvent}
            />
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" justifyContent="flex-end" alignItems="center" mb={2}>
                <Button
                  variant="contained"
                  startIcon={<MdAdd />}
                  onClick={() => {
                    setEditingItem(null)
                    setWebhookModalOpen(true)
                  }}
                >
                  Create Webhook
                </Button>
              </Stack>
              <WebhooksTable
                webhooks={webhooks}
                isLoading={webhooksLoading}
                onEdit={handleEditWebhook}
                onDelete={handleDeleteWebhook}
                onRegenerateSecret={handleRegenerateWebhookSecret}
              />
            </Box>
          </Stack>
        )}

        {/* Modals */}
        <CreateApiKeyModal
          open={apiKeyModalOpen}
          onClose={() => setApiKeyModalOpen(false)}
          onSubmit={handleCreateApiKey}
          isLoading={createApiKey.isPending}
        />

        <ViewApiKeyModal
          open={apiKeyViewModalOpen}
          onClose={() => setApiKeyViewModalOpen(false)}
          apiKey={newApiKey}
          copiedKey={copiedKey}
          onCopy={handleCopy}
        />

        <WebhookFormModal
          open={webhookModalOpen}
          onClose={() => {
            setWebhookModalOpen(false)
            setEditingItem(null)
          }}
          onSubmit={handleCreateWebhook}
          editingItem={editingItem}
          isLoading={createWebhook.isPending || updateWebhook.isPending}
        />

        <SamplePayloadModal
          open={samplePayloadModalOpen}
          onClose={() => {
            setSamplePayloadModalOpen(false)
            setSelectedEventType(null)
          }}
          selectedEventType={selectedEventType}
          onSelectEvent={handleSelectEvent}
        />

        <ViewWebhookSecretModal
          open={webhookSecretModalOpen}
          onClose={() => {
            setWebhookSecretModalOpen(false)
            setNewWebhookSecret(null)
          }}
          webhook={newWebhookSecret}
          copiedSecret={copiedSecret}
          onCopy={handleCopySecret}
        />
    </ListPageLayout>
  )
}

export default ApiIntegration

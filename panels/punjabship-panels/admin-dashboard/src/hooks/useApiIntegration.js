import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  apiKeyService,
  shopifyIntegrationService,
  webhookService,
} from '../services/apiIntegration.service'

// API Keys hooks
export const useApiKeys = () => {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => apiKeyService.getApiKeys(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useCreateApiKey = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: apiKeyService.createApiKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['apiKeys'])
      toast({
        title: 'API Key created successfully',
        description: 'Please save your API key and secret securely. They will not be shown again.',
        status: 'success',
        duration: 8000,
        isClosable: true,
      })
      return data
    },
    onError: (error) => {
      toast({
        title: 'Failed to create API key',
        description: error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })
}

export const useUpdateApiKey = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => apiKeyService.updateApiKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['apiKeys'])
      toast({
        title: 'API Key updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to update API key',
        description: error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })
}

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: apiKeyService.deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries(['apiKeys'])
      toast({
        title: 'API Key deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete API key',
        description: error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })
}

// Webhooks hooks
export const useWebhooks = () => {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhookService.getWebhooks(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export const useWebhook = (id) => {
  return useQuery({
    queryKey: ['webhook', id],
    queryFn: () => webhookService.getWebhook(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateWebhook = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: webhookService.createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks'])
      toast({
        title: 'Webhook subscription created successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to create webhook',
        description: error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })
}

export const useUpdateWebhook = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ id, data }) => webhookService.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks'])
      toast({
        title: 'Webhook updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to update webhook',
        description: error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })
}

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: webhookService.deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries(['webhooks'])
      toast({
        title: 'Webhook deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete webhook',
        description: error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })
}

export const useShopifyStatus = () => {
  return useQuery({
    queryKey: ['shopifyStatus'],
    queryFn: () => shopifyIntegrationService.getStatus(),
    staleTime: 60 * 1000,
    retry: false,
  })
}

export const useConnectShopifyEnvStore = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: shopifyIntegrationService.connectEnvStore,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['shopifyStatus'])
      toast({
        title: 'Shopify store connected',
        description: data?.data?.warning || 'Custom app credentials are now bound in PunjabShip.',
        status: data?.data?.warning ? 'warning' : 'success',
        duration: 5000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to connect Shopify store',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useStartShopifyOAuth = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: shopifyIntegrationService.startOAuth,
    onSuccess: (data) => {
      queryClient.invalidateQueries(['shopifyStatus'])
      const authUrl = data?.authUrl || data?.data?.authUrl
      if (authUrl) {
        window.location.assign(authUrl)
        return
      }
      toast({
        title: 'Shopify OAuth started',
        description: data?.message || 'Authorization URL created.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to connect Shopify store',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

export const useSyncShopifyOrders = () => {
  const toast = useToast()

  return useMutation({
    mutationFn: shopifyIntegrationService.syncOrders,
    onSuccess: (data) => {
      toast({
        title: 'Shopify orders synced',
        description: `Created: ${data?.created || 0}, Updated: ${data?.updated || 0}, Skipped: ${data?.skipped || 0}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to sync Shopify orders',
        description: error?.response?.data?.error || error?.response?.data?.message || 'Something went wrong',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

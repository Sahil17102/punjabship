import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiKey } from '../api/apiIntegration'
import { apiKeyService, webhookService } from '../api/apiIntegration'

// API Keys hooks
export const useApiKeys = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: () => apiKeyService.getApiKeys(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  })
}

export const useCreateApiKey = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiKeyService.createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })
}

export const useUpdateApiKey = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ApiKey> }) =>
      apiKeyService.updateApiKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })
}

export const useDeleteApiKey = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: apiKeyService.deleteApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiKeys'] })
    },
  })
}

// Webhooks hooks
export const useWebhooks = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhookService.getWebhooks(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled,
  })
}

export const useWebhook = (id: string) => {
  return useQuery({
    queryKey: ['webhook', id],
    queryFn: () => webhookService.getWebhook(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  })
}

export const useCreateWebhook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: webhookService.createWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })
}

export const useUpdateWebhook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: { url?: string; name?: string; events?: string[]; is_active?: boolean }
    }) => webhookService.updateWebhook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })
}

export const useDeleteWebhook = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: webhookService.deleteWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })
}

export const useRegenerateWebhookSecret = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: webhookService.regenerateSecret,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })
}

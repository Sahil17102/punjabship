import { useMutation, useQuery } from '@tanstack/react-query'
import { getPresignedDownloadUrls } from '../../api/upload.api'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'

type UsePresignedDownloadOptions = {
  keys: string | string[] | undefined
  enabled?: boolean
}

/**
 * React Query hook to fetch presigned download URL(s)
 * - Accepts string or string[]
 */
export const usePresignedDownloadUrls = ({ keys, enabled = true }: UsePresignedDownloadOptions) => {
  return useQuery({
    queryKey: ['presigned-download', keys],
    queryFn: () => {
      if (!keys) throw new Error('No keys provided')
      return getPresignedDownloadUrls(keys)
    },
    enabled: enabled,
    staleTime: isEmbeddedShopifyContext()
      ? 1000 * 60 * 60 * 23 // refresh before the 24-hour signed URL expires during review
      : 1000 * 60 * 60 * 24,
  })
}

type PresignedDownloadMutationProps = {
  keys: string[]
}

export const usePresignedDownloadMutation = () => {
  return useMutation({
    mutationFn: async ({ keys }: PresignedDownloadMutationProps) => {
      if (!keys?.length) throw new Error('No keys provided for download')
      return getPresignedDownloadUrls(keys)
    },
  })
}

import { useQuery } from '@tanstack/react-query'
import { getPresignedDownloadUrls } from 'services/upload.service'

export const usePresignedDownloadUrls = ({ keys = [], enabled = true }) => {
  return useQuery({
    queryKey: ['presigned-download', ...keys],
    queryFn: () => {
      if (!keys.length) throw new Error('No keys provided')
      return getPresignedDownloadUrls(keys)
    },
    enabled: enabled && keys.length > 0,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  })
}

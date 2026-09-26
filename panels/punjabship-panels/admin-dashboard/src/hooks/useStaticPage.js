import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { StaticPagesAPI } from 'services/staticPages.service'

const STATIC_PAGE_KEY = (slug) => ['static-page', slug]

export const useStaticPage = (slug) => {
  return useQuery({
    queryKey: STATIC_PAGE_KEY(slug),
    queryFn: () => StaticPagesAPI.getPage(slug),
    enabled: !!slug,
    refetchOnWindowFocus: false,
  })
}

export const useUpdateStaticPage = (slug) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => StaticPagesAPI.updatePage(slug, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATIC_PAGE_KEY(slug) })
    },
  })
}





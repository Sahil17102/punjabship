import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BlogAPI } from 'services/blog.service'

// Fetch blogs with optional params (filters, pagination)
export const useBlogs = (params) => {
  return useQuery({
    queryKey: ['blogs', params],
    queryFn: () => BlogAPI.getBlogs(params),
    keepPreviousData: true,
  })
}

// Fetch blog stats
export const useBlogStats = () => {
  return useQuery({
    queryKey: ['blogs-stats'],
    queryFn: () => BlogAPI.getStats(),
  })
}

export const useSingleBlog = (id) => {
  return useQuery({
    queryKey: ['blog', id],
    queryFn: () => BlogAPI.getSingleBlog(id),
    refetchOnWindowFocus: false,
    enabled: !!id,
  })
}

// Create a new blog
export const useCreateBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => BlogAPI.createBlog(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blogs'] }),
  })
}

// Update an existing blog
export const useUpdateBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => BlogAPI.updateBlog(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blogs'] }),
  })
}

export const useDeleteBlog = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => BlogAPI.deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] })
      queryClient.invalidateQueries({ queryKey: ['blogs-stats'] })
    },
  })
}

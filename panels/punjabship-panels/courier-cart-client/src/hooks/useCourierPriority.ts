import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { courierPriorityService } from '../api/courierPriority.service'
import { toast } from '../components/UI/Toast'

// Fetch all profiles for a user
export const useCourierPriorities = () => {
  return useQuery({
    queryKey: ['courierPriorities'],
    queryFn: () => courierPriorityService.getByUser(),
  })
}

// Fetch a single profile
export const useCourierPriority = (id: number) => {
  return useQuery({
    queryKey: ['courierPriority', id],
    queryFn: () => courierPriorityService.getOne(id),
    enabled: !!id,
  })
}

// Create a new profile
export const useCreateCourierPriority = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: courierPriorityService.create,
    onSuccess: () => {
      toast.open({ message: 'Priority Saved successfully!', severity: 'success' })
      queryClient.invalidateQueries({
        queryKey: ['courierPriorities'],
      })
    },
  })
}

interface IUpdateCourierPriority {
  data: Partial<{
    name: 'fastest' | 'economical' | 'personalised'
    personalised_order: { courierId: number; priority: number }[]
  }>
  id: number
}
// Update a profile
export const useUpdateCourierPriority = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: IUpdateCourierPriority) => courierPriorityService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['courierPriority', variables.id],
      })
    },
  })
}

// Delete a profile
export const useDeleteCourierPriority = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: courierPriorityService.delete,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['courierPriorities'] })
      queryClient.removeQueries({ queryKey: ['courierPriority', id] })
    },
  })
}

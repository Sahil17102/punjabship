/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  toggleEmployeeStatus,
  updateEmployee,
  type IEmployeePayload,
} from '../../api/employee.service'
import { toast } from '../../components/UI/Toast'

export const useCreateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: IEmployeePayload) => createEmployee(payload),
    onSuccess: () => {
      toast.open({ message: 'Employee created successfully', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (err: any) => {
      toast.open({
        message: err.response?.data?.error || 'Failed to create employee',
        severity: 'error',
      })
    },
  })
}

export const useEmployees = (limit = 20, search?: string) => {
  return useInfiniteQuery({
    queryKey: ['employees', limit, search],
    queryFn: ({ pageParam = 1 }) => fetchEmployees(pageParam, limit, search),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextPage : undefined),
    initialPageParam: 1,
  })
}

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      toast.open({ message: 'Employee deleted successfully', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (err: any) => {
      toast.open({
        message: err.response?.data?.error || 'Failed to delete employee',
        severity: 'error',
      })
    },
  })
}

// ✅ Update Employee Hook
export const useUpdateEmployee = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IEmployeePayload> }) =>
      updateEmployee(id, data as IEmployeePayload),
    onSuccess: () => {
      toast.open({ message: 'Employee updated successfully', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (err: any) => {
      toast.open({
        message: err.response?.data?.error || 'Failed to update employee',
        severity: 'error',
      })
    },
  })
}

// ✅ Toggle Employee Status Hook
export const useToggleEmployeeStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleEmployeeStatus(id, isActive),
    onSuccess: () => {
      toast.open({
        message: `Employee status toggled`,
        severity: 'success',
      })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
    onError: (err: any) => {
      toast.open({
        message: err.response?.data?.error || 'Failed to toggle employee',
        severity: 'error',
      })
    },
  })
}

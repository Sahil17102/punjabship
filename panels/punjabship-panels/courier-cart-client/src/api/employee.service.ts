// services/employeeService.ts
import axiosInstance from './axiosInstance'

const API_BASE = '/user-management' // adjust to your backend route

export interface IEmployeePayload {
  id?: string
  adminId?: string
  name: string
  email: string
  phone?: string
  role: string
  password: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  moduleAccess?: Record<string, any>
}

export const createEmployee = async (payload: IEmployeePayload) => {
  const { data } = await axiosInstance.post(`${API_BASE}/create`, payload)
  return data
}

export const fetchEmployees = async (page: number, limit = 20, search?: string) => {
  const { data } = await axiosInstance.get(`${API_BASE}/users`, {
    params: { page, limit, search },
  })
  return data
}

export const deleteEmployee = async (id: string) => {
  const res = await axiosInstance.delete(`${API_BASE}/delete/${id}`)
  return res.data
}

export const toggleEmployeeStatus = async (id: string, isActive: boolean) => {
  const res = await axiosInstance.patch(`${API_BASE}/${id}/toggle`, { isActive })
  return res.data
}

// ✅ Update Employee
export const updateEmployee = async (id: string, data: IEmployeePayload) => {
  const res = await axiosInstance.patch(`${API_BASE}/update/${id}`, data)
  return res.data
}

export const getEmployeeByUserId = async (userId: string) => {
  const { data } = await axiosInstance.get(`${API_BASE}/${userId}`)
  return data
}

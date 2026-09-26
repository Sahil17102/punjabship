import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../../context/auth/AuthContext'
import {
  canAccessEmployeeModule,
  getFirstEmployeePath,
  getModuleForClientPath,
} from '../../../utils/employeeAccess'

export default function RequireEmployeeModule({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()
  const module = getModuleForClientPath(location.pathname)

  if (!module || canAccessEmployeeModule(user, module)) return children

  const fallback = getFirstEmployeePath(user)
  if (fallback === location.pathname) return null

  return <Navigate to={fallback} replace />
}

import { useEffect } from 'react'
import { getEmployeeByUserId } from '../api/employee.service'
import { useAuth } from '../context/auth/AuthContext'
import { disconnectSocket, registerUserSocket } from './User/useUserOnline'

export const useEmployeeSocket = () => {
  const { user, isAuthenticated } = useAuth()
  const authUserId = user?.actorUserId || user?.id
  const isEmployee = user?.role === 'employee'

  useEffect(() => {
    if (!isAuthenticated || !authUserId || !isEmployee) return

    const initSocket = async () => {
      try {
        const employee = await getEmployeeByUserId(authUserId)
        if (employee?.employee?.isActive) {
          registerUserSocket({ id: authUserId, role: 'employee' })
        }
      } catch {
        disconnectSocket()
      }
    }

    void initSocket()
    return () => disconnectSocket()
  }, [authUserId, isAuthenticated, isEmployee])
}

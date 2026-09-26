import { useAuth } from '../../context/auth/AuthContext'
import {
  canAccessEmployeeModule,
  type EmployeeModule,
} from '../../utils/employeeAccess'

const getEmployeeOrderAccess = (moduleAccess: Record<string, any> | null | undefined) => {
  if (!moduleAccess || typeof moduleAccess !== 'object') return {}
  const ordersAccess = moduleAccess.orders
  return ordersAccess && typeof ordersAccess === 'object' ? ordersAccess : {}
}

export const useEmployeePermissions = () => {
  const { user } = useAuth()

  const isEmployee = user.role === 'employee'
  const orderAccess = getEmployeeOrderAccess(user.moduleAccess as Record<string, any> | null)

  const allowForNonEmployees = (value: boolean | undefined) =>
    isEmployee ? value === true : true
  const canUseOrdersModule = canAccessEmployeeModule(user, 'orders')

  return {
    isEmployee,
    employeeRole: user.employeeRole ?? null,
    employeeIsActive: user.employeeIsActive ?? null,
    canCancelOrders: allowForNonEmployees(orderAccess.cancelOrders),
    // Booking and its completion documents belong to the same Orders workflow.
    // Keep the explicit flag for legacy records, but inherit it from Orders access.
    canExportOrders: allowForNonEmployees(orderAccess.exportOrders || canUseOrdersModule),
    canExportCustomerDetails: allowForNonEmployees(orderAccess.exportCustomerDetails),
    canViewCustomerDetails: allowForNonEmployees(orderAccess.viewCustomerDetails),
    canChangePaymentMode: allowForNonEmployees(orderAccess.changePaymentMode),
    canAccessModule: (module: EmployeeModule) => canAccessEmployeeModule(user, module),
  }
}

export default useEmployeePermissions

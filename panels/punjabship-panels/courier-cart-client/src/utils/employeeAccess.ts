import type { IUserProfileDB } from '../types/user.types'

export const EMPLOYEE_MODULES = [
  'overview',
  'dashboard',
  'orders',
  'exceptions',
  'finance',
  'audits',
  'utilities',
  'reports',
  'channels',
  'workspace',
  'support',
] as const

export type EmployeeModule = (typeof EMPLOYEE_MODULES)[number]
export type EmployeeModuleFlags = Record<EmployeeModule, boolean>

export const DEFAULT_EMPLOYEE_MODULE_FLAGS: EmployeeModuleFlags = {
  overview: false,
  dashboard: false,
  orders: false,
  exceptions: false,
  finance: false,
  audits: false,
  utilities: false,
  reports: false,
  channels: false,
  workspace: false,
  support: false,
}

const hasConfiguredModules = (user?: IUserProfileDB | null) =>
  Boolean(
    user?.role === 'employee' &&
      user.moduleAccess &&
      typeof user.moduleAccess.modules === 'object' &&
      user.moduleAccess.modules !== null,
  )

export const canAccessEmployeeModule = (
  user: IUserProfileDB | null | undefined,
  module: EmployeeModule,
) => {
  if (user?.role !== 'employee' || !hasConfiguredModules(user)) return true
  return user.moduleAccess?.modules?.[module] === true
}

export const getFirstEmployeePath = (user: IUserProfileDB | null | undefined) => {
  const candidates: Array<[string, EmployeeModule]> = [
    ['/home', 'overview'],
    ['/dashboard', 'dashboard'],
    ['/orders/list', 'orders'],
    ['/ops/ndr', 'exceptions'],
    ['/billing/wallet_transactions', 'finance'],
    ['/reconciliation/weight', 'audits'],
    ['/tools/rate_card', 'utilities'],
    ['/reports', 'reports'],
    ['/channels/connected', 'channels'],
    ['/settings', 'workspace'],
    ['/support/tickets', 'support'],
  ]

  return (
    candidates.find(([, module]) => canAccessEmployeeModule(user, module))?.[0] ||
    '/profile/user_profile/settings/user'
  )
}

export const getModuleForClientPath = (pathname: string): EmployeeModule | null => {
  if (pathname === '/home') return 'overview'
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/orders')) return 'orders'
  if (pathname.startsWith('/ops/')) return 'exceptions'
  if (pathname.startsWith('/billing/') || pathname === '/cod-remittance') return 'finance'
  if (pathname.startsWith('/reconciliation/')) return 'audits'
  if (pathname.startsWith('/tools/')) return 'utilities'
  if (pathname.startsWith('/reports')) return 'reports'
  if (pathname.startsWith('/channels/')) return 'channels'
  if (pathname.startsWith('/support/')) return 'support'
  if (
    pathname.startsWith('/settings') ||
    pathname.startsWith('/profile/company') ||
    pathname.startsWith('/profile/bank_details') ||
    pathname.startsWith('/profile/kyc_details') ||
    pathname.startsWith('/couriers/')
  ) {
    return 'workspace'
  }
  return null
}

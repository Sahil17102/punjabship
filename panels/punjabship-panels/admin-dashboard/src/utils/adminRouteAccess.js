const LEVELS = ['none', 'view', 'operate', 'approve', 'manage']

export const hasAdminAccess = (session, module, required = 'view') => {
  if (!session || session.actorType === 'admin') return true
  const current = session.permissions?.[module] || 'none'
  return LEVELS.indexOf(current) >= LEVELS.indexOf(required)
}

const inferRouteModule = (route) => {
  if (route.permission) return route.permission
  const path = String(route.path || '').toLowerCase()
  if (path.includes('manual-courier')) return 'manualCouriers'
  if (path.includes('ndr')) return 'ndr'
  if (path.includes('rto')) return 'rto'
  if (path.includes('order')) return 'orders'
  if (path.includes('wallet')) return 'wallet'
  if (path.includes('cod-remittance')) return 'cod'
  if (path.includes('billing') || path.includes('invoice')) return 'billing'
  if (path.includes('weight') || path.includes('dispute')) return 'disputes'
  if (path.includes('support')) return 'support'
  if (path.includes('user')) return 'sellers'
  if (path.includes('courier') || path.includes('pricing') || path.includes('zone')) return 'shipping'
  if (path.includes('franchise')) return 'franchise'
  if (path.includes('developer')) return 'developer'
  return null
}

export const filterAdminRoutes = (routes, session) => {
  if (!session || session.actorType === 'admin') return routes
  return routes
    .map((route) => {
      if (route.category && route.views) {
        const views = filterAdminRoutes(route.views, session)
        return views.length ? { ...route, views } : null
      }
      const module = inferRouteModule(route)
      if (!module) return null
      if (!route.permission && session.scopeType !== 'all') return null
      if (route.fullScopeOnly && session.scopeType !== 'all') return null
      return hasAdminAccess(session, module, route.permissionLevel || 'view') ? route : null
    })
    .filter(Boolean)
}

export const getAdminHomePath = (session) => {
  if (!session || session.actorType === 'admin') return '/admin/dashboard'
  if (hasAdminAccess(session, 'employees', 'view')) return '/admin/employee-management/employees'
  if (session.scopeType === 'all' && hasAdminAccess(session, 'orders', 'view')) return '/admin/orders'
  if (session.scopeType === 'all' && hasAdminAccess(session, 'sellers', 'view')) return '/admin/users-management'
  if (session.scopeType === 'all' && hasAdminAccess(session, 'support', 'view')) return '/admin/support'
  return '/auth/signin'
}

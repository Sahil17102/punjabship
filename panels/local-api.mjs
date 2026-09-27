import http from 'node:http'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

const dataFile = new URL('./local-data.json', import.meta.url)
const DEMO_OTP = process.env.DEMO_OTP || '123456'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@punjabshiplogistics.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Demo@123'
const CLIENT_EMAIL = 'client@punjabshiplogistics.com'
const CLIENT_PASSWORD = 'Demo@123'

const createSeller = (email, overrides = {}) => {
  const now = new Date().toISOString()
  const id = overrides.id || `seller-${randomUUID()}`
  const normalizedEmail = String(email || '').trim().toLowerCase()

  return {
    id,
    userId: id,
    email: normalizedEmail,
    displayName: '',
    role: 'user',
    onboardingComplete: false,
    profileComplete: false,
    approved: false,
    onboardingStep: 0,
    businessType: [],
    salesChannels: {},
    monthlyOrderCount: '0-100',
    companyInfo: {
      businessName: '', brandName: '', contactPerson: '', companyAddress: '', city: '', state: '', pincode: '',
      contactEmail: normalizedEmail, companyEmail: normalizedEmail, companyContactNumber: '', contactNumber: '', website: '',
      POCEmailVerified: true, POCPhoneVerified: false,
    },
    domesticKyc: { status: 'pending', updatedAt: null },
    bankDetails: { count: 0, primaryAccount: null },
    gstDetails: {},
    currentPlanName: null,
    currentPlanId: null,
    currentB2CPlanName: null,
    currentB2BPlanName: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

const demoUser = createSeller(CLIENT_EMAIL, {
  id: 'local-client', userId: 'local-client', displayName: 'Demo Client', onboardingComplete: true,
  profileComplete: true, approved: true, onboardingStep: 3, businessType: ['b2c', 'b2b', 'd2c'],
  monthlyOrderCount: '100-500', currentPlanName: 'Standard', currentPlanId: 'demo-plan',
  currentB2CPlanName: 'Standard', currentB2BPlanName: 'Standard',
  companyInfo: {
    businessName: 'Demo Store', brandName: 'Demo Store', contactPerson: 'Demo Client', companyAddress: 'Model Town',
    city: 'Ludhiana', state: 'Punjab', pincode: '141001', contactEmail: CLIENT_EMAIL, companyEmail: CLIENT_EMAIL,
    companyContactNumber: '9000000000', contactNumber: '9000000000', website: '', POCEmailVerified: true, POCPhoneVerified: true,
  },
  domesticKyc: { status: 'verified', updatedAt: new Date().toISOString() },
})

const orders = Array.from({ length: 12 }, (_, i) => ({
  id: `demo-${i + 1}`, user_id: demoUser.id, order_number: `DEMO-${1001 + i}`, order_id: `DEMO-${1001 + i}`,
  awb_number: `DEMOAWB${1001 + i}`, order_status: ['delivered', 'in_transit', 'pending', 'booked'][i % 4],
  status: ['delivered', 'in_transit', 'pending', 'booked'][i % 4], courier_partner: ['Delhivery', 'DTDC', 'Blue Dart'][i % 3],
  order_amount: 1250 + i * 100, total_amount: 1250 + i * 100, shipping_charges: 65 + i, freight_charges: 50,
  payment_type: i % 2 ? 'cod' : 'prepaid', order_type: i % 2 ? 'cod' : 'prepaid',
  customer_name: ['Aman Singh', 'Priya Sharma', 'Rahul Mehta'][i % 3], customer_city: ['Delhi', 'Mumbai', 'Jaipur'][i % 3],
  customer_state: 'Delhi', customer_pincode: '110001', customer_phone: '9000000000',
  pickup_details: { city: 'Ludhiana', state: 'Punjab', pincode: '141001', name: 'Demo Store' },
  shipping_details: { city: 'Delhi', state: 'Delhi', pincode: '110001', name: 'Demo Customer' },
  products: [{ name: 'Sample product', quantity: 1, price: 1250 }],
  created_at: new Date(Date.now() - i * 86400000).toISOString(), updated_at: new Date().toISOString(), weight: 0.5,
}))

const defaultState = {
  users: [demoUser], orders, pendingOtps: {},
  preferences: {
    widgetVisibility: {},
    widgetOrder: ['quickStats', 'quickActions', 'insights', 'actionItems', 'performanceMetrics', 'ordersTrend', 'financialHealth', 'recentActivity', 'todaysOperations', 'orderStatusChart', 'courierComparison', 'metricsOverview', 'courierPerformance', 'topDestinations'],
    layout: {}, dateRange: {},
  },
}
const state = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : defaultState
if (!Array.isArray(state.users)) state.users = state.user ? [state.user] : [demoUser]
state.orders ??= orders
state.pendingOtps ??= {}
state.preferences ??= defaultState.preferences

const save = () => writeFileSync(dataFile, JSON.stringify(state, null, 2))
const brandAddress = 'SODHI ONLINE SERVICES, Near Verka Plant, Barnala Raikot Road, Mahal Kalan, Barnala, Punjab 148104'
state.invoicePreferences ??= { brandName: 'PunjabShip', sellerAddress: brandAddress, supportEmail: 'info@punjabshiplogistics.com', supportPhone: '+91 84878 81121', prefix: 'PS-INV', template: 'classic', includeLogo: true, includeSignature: false }
state.aboutUs ??= { slug: 'about_us', title: 'About PunjabShip', content: `<h2>PunjabShip - Ship the world</h2><p>Plan domestic and international shipments with air, sea, road and courier choices in one clear booking workflow.</p><h3>Contact us</h3><p>${brandAddress}</p><p><a href="mailto:info@punjabshiplogistics.com">info@punjabshiplogistics.com</a></p><p><a href="tel:+918487881121">+91 84878 81121</a></p>` }

const token = (role, id) => `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ id, role, exp: Math.floor(Date.now() / 1000) + 86400 })).toString('base64url')}.local`
const decodeToken = (req) => {
  try {
    const value = String(req.headers.authorization || req.headers['x-punjabship-access-token'] || '')
    const raw = value.startsWith('Bearer ') ? value.slice(7) : value
    return JSON.parse(Buffer.from(raw.split('.')[1], 'base64url').toString('utf8'))
  } catch { return null }
}
const currentSeller = (req) => {
  const session = decodeToken(req)
  return state.users.find((item) => item.id === session?.id) || null
}
const authPayload = (seller) => {
  const accessToken = token('user', seller.id)
  return { success: true, message: 'Login successful', token: accessToken, accessToken, refreshToken: accessToken, user: seller }
}

const stats = (seller) => {
  const sellerOrders = seller?.id === demoUser.id ? state.orders : []
  return {
    todayOperations: { orders: sellerOrders.length, pending: 3, inTransit: 3, delivered: 3 },
    financial: { walletBalance: 5000, todayRevenue: 1250, totalRevenue: 21600, totalShippingCharges: 846, totalFreightCharges: 600, profit: 246, codAmount: 10800, codRemittanceDue: 5400, codRemittanceCredited: 5400 },
    operational: { deliverySuccessRate: 94, ndrRate: 2, rtoRate: 4, avgDeliveryTime: 72, totalOrders: sellerOrders.length, deliveredOrders: 3, ndrCount: 0, rtoCount: 0 },
    actions: { ndrCount: 0, rtoCount: 0, weightDiscrepancyCount: 0, openTickets: 0, inProgressTickets: 0, pendingInvoices: 0, pendingInvoiceAmount: 0, overdueInvoices: 0, overdueInvoiceAmount: 0 },
    couriers: { performance: {}, distribution: [{ courier: 'Delhivery', count: 4 }, { courier: 'DTDC', count: 4 }, { courier: 'Blue Dart', count: 4 }] },
    geographic: { topDestinations: [{ city: 'Delhi', state: 'Delhi', count: 4 }] },
    charts: { ordersByDate: sellerOrders.map((o) => ({ date: o.created_at.slice(0, 10), orders: 1 })), revenueByDate: sellerOrders.map((o) => ({ date: o.created_at.slice(0, 10), revenue: o.order_amount })), ordersByDate30: [], revenueByDate30: [], ordersByStatus: ['delivered', 'in_transit', 'pending', 'booked'].map((status) => ({ status, count: 3 })), revenueByOrderType: [], ordersByCourier: [], revenueByCourier: [] },
    metrics: { avgOrderValue: 1800, totalPrepaidOrders: 6, totalCodOrders: 6, prepaidRevenue: 10800, codRevenue: 10800, topRevenueCities: [] },
    recentOrders: sellerOrders,
    trends: { ordersGrowth: 12, revenueGrowth: 8, thisWeekOrders: 7, lastWeekOrders: 5, thisWeekRevenue: 13000, lastWeekRevenue: 8600 },
    recentActivity: { transactions: [], recentOrders: sellerOrders.slice(0, 5).map((o) => ({ id: o.id, orderNumber: o.order_number, status: o.status, amount: o.order_amount, createdAt: o.created_at })) },
  }
}

const allowedOrigin = (origin) => {
  if (!origin) return '*'
  if (/^http:\/\/(localhost|127\.0\.0\.1):(5174|3001)$/.test(origin)) return origin
  if (/^https:\/\/punjabship(client1|admin)?\.onrender\.com$/.test(origin)) return origin
  return ''
}

const applyOnboarding = (seller, step, data) => {
  const basic = data?.basicInfo || {}
  const legal = data?.businessLegal || {}
  seller.companyInfo = {
    ...seller.companyInfo,
    businessName: basic.companyName ?? seller.companyInfo.businessName,
    brandName: legal.brandName ?? seller.companyInfo.brandName,
    contactPerson: [basic.firstName, basic.lastName].filter(Boolean).join(' ') || seller.companyInfo.contactPerson,
    city: basic.city ?? seller.companyInfo.city,
    state: basic.state ?? seller.companyInfo.state,
    pincode: basic.pincode ?? seller.companyInfo.pincode,
    contactEmail: basic.email || seller.email,
    companyEmail: basic.email || seller.email,
    contactNumber: basic.phone ?? seller.companyInfo.contactNumber,
    companyContactNumber: basic.phone ?? seller.companyInfo.companyContactNumber,
    website: basic.personalWebsite ?? seller.companyInfo.website,
  }
  seller.displayName = seller.companyInfo.contactPerson || seller.companyInfo.businessName || seller.email
  seller.businessType = legal.businessCategory ?? seller.businessType
  seller.monthlyOrderCount = legal.monthlyShipments ?? seller.monthlyOrderCount
  seller.salesChannels = data?.platformIntegration ?? seller.salesChannels
  seller.onboardingStep = Math.max(Number(seller.onboardingStep || 0), Number(step || 0))
  seller.onboardingComplete = Number(step) >= 3
  seller.profileComplete = seller.onboardingComplete
  seller.updatedAt = new Date().toISOString()
}

http.createServer(async (req, res) => {
  const origin = String(req.headers.origin || '')
  const corsOrigin = allowedOrigin(origin)
  if (origin && !corsOrigin) { res.writeHead(403); res.end(); return }
  res.setHeader('Access-Control-Allow-Origin', corsOrigin || '*')
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-refresh-token, X-PunjabShip-Access-Token')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }

  const send = (data, code = 200) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }
  try {
    const requestUrl = new URL(req.url, 'http://localhost')
    const path = requestUrl.pathname.replace(/\/$/, '')
    let raw = ''
    for await (const chunk of req) raw += chunk
    const body = raw ? JSON.parse(raw) : {}
    console.log(req.method, path)

    if (path === '' || path === '/api/health') return send({ success: true, mode: 'punjabship-demo-api' })
    if (path === '/api/auth/request-otp' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send({ error: 'Enter a valid email address.' }, 400)
      state.pendingOtps[email] = { otp: DEMO_OTP, expiresAt: Date.now() + 10 * 60 * 1000 }
      save()
      return send({ message: 'Verification code generated.', demoOtp: DEMO_OTP, demoOtpExpiresAt: new Date(state.pendingOtps[email].expiresAt).toISOString() })
    }
    if (path === '/api/auth/verify-otp' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase()
      const pending = state.pendingOtps[email]
      if (!pending || pending.expiresAt < Date.now()) return send({ error: 'OTP expired. Please request a new code.' }, 401)
      if (String(body.otp || '') !== String(pending.otp)) return send({ error: 'Invalid verification code.' }, 401)
      let seller = state.users.find((item) => item.email === email)
      if (!seller) { seller = createSeller(email); state.users.push(seller) }
      delete state.pendingOtps[email]
      save()
      return send(authPayload(seller))
    }
    if (path === '/api/auth/request-password-login' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase()
      if (email !== CLIENT_EMAIL || body.password !== CLIENT_PASSWORD) return send({ error: `Use the demo credentials: ${CLIENT_EMAIL} / ${CLIENT_PASSWORD}` }, 401)
      return send(authPayload(state.users.find((item) => item.email === CLIENT_EMAIL) || demoUser))
    }
    if (path === '/api/auth/admin/login' && req.method === 'POST') {
      if (String(body.email || '').trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase() || body.password !== ADMIN_PASSWORD) return send({ error: 'Invalid admin email or password.' }, 401)
      const accessToken = token('admin', 'local-admin')
      return send({ success: true, message: 'Admin login successful', token: accessToken, accessToken, refreshToken: accessToken, user: { id: 'local-admin', role: 'admin', adminAccess: { actorType: 'admin', scopeType: 'all', permissions: {} } } })
    }
    if (path === '/api/auth/refresh-token' && req.method === 'POST') {
      const session = decodeToken(req) || (() => { try { return JSON.parse(Buffer.from(String(body.refreshToken || '').split('.')[1], 'base64url').toString('utf8')) } catch { return null } })()
      if (!session?.id) return send({ error: 'Invalid refresh token.' }, 401)
      const refreshed = token(session.role || 'user', session.id)
      return send({ accessToken: refreshed, refreshToken: refreshed })
    }
    if (path === '/api/auth/logout') return send({ success: true })
    if (path === '/api/profile/user' && req.method === 'GET') {
      const seller = currentSeller(req)
      return seller ? send(seller) : send({ error: 'Authentication required.' }, 401)
    }
    if (path === '/api/user/complete-user-onboarding' && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      applyOnboarding(seller, body.step, body.data)
      save()
      return send({ success: true, message: seller.onboardingComplete ? 'Onboarding completed.' : 'Onboarding step saved.', user: seller })
    }
    if (path === '/api/profile/readiness') {
      const seller = currentSeller(req)
      return send({ onboardingComplete: Boolean(seller?.onboardingComplete), approved: Boolean(seller?.approved), hasCompanyInfo: Boolean(seller?.companyInfo?.businessName), kycVerified: seller?.domesticKyc?.status === 'verified', hasAssignedPlan: Boolean(seller?.currentPlanId), assignedPlanName: seller?.currentPlanName, hasPickupAddress: false, walletReady: true, walletBalance: 5000, requiredWalletBalance: 100, isEmployee: false, isReady: Boolean(seller?.onboardingComplete) })
    }
    if (path === '/api/profile' && req.method === 'PATCH') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      Object.assign(seller, body, { updatedAt: new Date().toISOString() })
      save()
      return send({ message: 'Saved', user: seller })
    }
    if (path === '/api/admin/users/users-management' && req.method === 'GET') {
      const search = String(requestUrl.searchParams.get('search') || '').trim().toLowerCase()
      const onboarding = requestUrl.searchParams.get('onboardingComplete')
      const approved = requestUrl.searchParams.get('approved')
      const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1))
      const perPage = Math.max(1, Number(requestUrl.searchParams.get('perPage') || 10))
      let users = [...state.users]
      if (search) users = users.filter((item) => JSON.stringify(item).toLowerCase().includes(search))
      if (onboarding === 'true' || onboarding === 'false') users = users.filter((item) => item.onboardingComplete === (onboarding === 'true'))
      if (approved === 'true' || approved === 'false') users = users.filter((item) => item.approved === (approved === 'true'))
      users.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
      const start = (page - 1) * perPage
      return send({ success: true, data: users.slice(start, start + perPage).map((item) => ({ ...item, companyName: item.companyInfo?.businessName || item.displayName || item.email })), totalCount: users.length })
    }
    if (path === '/api/admin/users/search-sellers' && req.method === 'GET') {
      const search = String(requestUrl.searchParams.get('q') || '').trim().toLowerCase()
      const limit = Math.max(1, Number(requestUrl.searchParams.get('limit') || 20))
      const matches = state.users.filter((item) => JSON.stringify(item).toLowerCase().includes(search)).slice(0, limit)
      return send({ success: true, data: matches.map((item) => ({ value: item.id, id: item.id, label: item.companyInfo?.businessName || item.displayName || item.email, email: item.email })) })
    }
    const userInfoMatch = path.match(/^\/api\/user\/user-info\/([^/]+)$/)
    if (userInfoMatch && req.method === 'GET') {
      const seller = state.users.find((item) => item.id === userInfoMatch[1])
      return seller ? send(seller) : send({ error: 'Seller not found.' }, 404)
    }
    if (path === '/api/invoice-preferences') {
      if (req.method === 'POST') { state.invoicePreferences = { ...state.invoicePreferences, ...body }; save() }
      return send({ success: true, preferences: state.invoicePreferences })
    }
    if (path === '/api/static-pages/about_us') {
      if (req.method === 'PUT') { state.aboutUs = { ...state.aboutUs, ...body, updated_at: new Date().toISOString() }; save() }
      return send({ success: true, data: state.aboutUs })
    }
    if (path === '/api/admin/crm/session') return send({ success: true, data: { actorType: 'admin', scopeType: 'all', permissions: {} }, actorType: 'admin', scopeType: 'all', permissions: {} })
    if (path === '/api/wallet/balance') return send({ success: true, data: { balance: 5000 }, balance: 5000 })
    if (path === '/api/dashboard/stats') return send({ success: true, data: stats(currentSeller(req)) })
    if (path === '/api/dashboard/preferences') {
      if (req.method === 'POST') { state.preferences = { ...state.preferences, ...body }; save() }
      return send({ success: true, data: state.preferences })
    }
    if (path === '/api/dashboard/tour') return send({ success: true, data: { version: 1, status: 'dismissed', completedPages: [] } })
    if (path === '/api/dashboard/invoice-status') return send({ success: true, status: { pending: { count: 0, totalAmount: 0 }, paid: { count: 0, totalAmount: 0 }, overdue: { count: 0, totalAmount: 0 } } })
    if (/orders/.test(path) && req.method === 'GET') return send({ success: true, orders: state.orders, data: state.orders, totalCount: state.orders.length, total: state.orders.length, totalPages: 1, page: 1, counts: {} })
    if (/notifications/.test(path)) return send({ success: true, data: [], notifications: [], unreadCount: 0, total: 0 })
    if (/\/kpis$|cod-remittance\/stats$|payable-report$/.test(path)) return send({ success: true, data: {} })
    if (path.includes('/cod-remittance/remittances')) return send({ success: true, data: { remittances: [], total: 0 } })
    if (req.method !== 'GET') return send({ success: false, error: 'This action needs a connected production backend.', message: 'This action needs a connected production backend.' }, 501)
    return send({ success: true, data: [], orders: [], pickups: [], destinations: [], distribution: [], transactions: [], tickets: [], couriers: [], warehouses: [], addresses: [], items: [], total: 0, totalCount: 0, totalPages: 1, page: 1, statusCounts: {}, balance: 5000 })
  } catch (error) {
    console.error(error)
    send({ success: false, error: error.message }, 500)
  }
}).listen(Number(process.env.PORT || 5004), process.env.HOST || '0.0.0.0', () => {
  console.log(`PunjabShip API listening on port ${process.env.PORT || 5004}`)
})

import http from 'node:http'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import {
  createShipGlobalClient,
  extractShipGlobalAwb,
  mapPunjabShipOrderToShipGlobal,
  mapShipGlobalTracking,
  validateShipGlobalOrder,
} from './shipglobal.mjs'

const require = createRequire(import.meta.url)
const { loadData: loadIndiaPostData } = require('india-pincode')

const dataFile = new URL('./local-data.json', import.meta.url)
const DEMO_OTP = process.env.DEMO_OTP || '123456'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@punjabshiplogistics.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Demo@123'
const CLIENT_EMAIL = 'client@punjabshiplogistics.com'
const CLIENT_PASSWORD = 'Demo@123'
const PRIMARY_SELLER_EMAIL = process.env.PRIMARY_SELLER_EMAIL || 'sahilmittal1920@gmail.com'
const SERVICEABILITY_SEED_SIZE = 27000
const SHIPGLOBAL_SERVICE = process.env.SHIPGLOBAL_SERVICE || 'Shipglobal Direct'
const SHIPGLOBAL_CURRENCY = process.env.SHIPGLOBAL_CURRENCY || 'INR'
const shipGlobal = createShipGlobalClient()

const toServiceabilityLocation = (office, index) => ({
  id: `india-post-${index + 1}`,
  pincode: office.pincode,
  city: office.area,
  district: office.district,
  state: office.state,
  country: 'India',
  tags: office.delivery ? ['delivery'] : [],
  officeType: office.officeType,
  source: 'India Post',
})

const buildServiceabilitySeed = () => {
  const deliveryOffices = loadIndiaPostData().filter((office) => office.delivery)
  const uniquePincodes = new Map()
  for (const office of deliveryOffices) {
    if (!uniquePincodes.has(office.pincode)) uniquePincodes.set(office.pincode, office)
  }

  const selected = [...uniquePincodes.values()]
  const selectedOffices = new Set(selected.map((office) => `${office.pincode}|${office.area}|${office.officeType}`))
  for (const office of deliveryOffices) {
    if (selected.length >= SERVICEABILITY_SEED_SIZE) break
    const key = `${office.pincode}|${office.area}|${office.officeType}`
    if (!selectedOffices.has(key)) {
      selected.push(office)
      selectedOffices.add(key)
    }
  }

  return selected
    .sort((a, b) => a.pincode.localeCompare(b.pincode) || a.area.localeCompare(b.area))
    .map(toServiceabilityLocation)
}

let seededServiceabilityLocations = null
const getSeededServiceabilityLocations = () => {
  if (!seededServiceabilityLocations) seededServiceabilityLocations = buildServiceabilitySeed()
  return seededServiceabilityLocations
}

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
    walletBalance: 5000,
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

const primarySeller = createSeller(PRIMARY_SELLER_EMAIL, {
  id: 'primary-seller', userId: 'primary-seller', displayName: 'Sahil Mittal', onboardingComplete: true,
  profileComplete: true, approved: true, onboardingStep: 3, businessType: ['b2c', 'b2b', 'd2c'],
  monthlyOrderCount: '100-500', currentPlanName: 'Starter B2C', currentPlanId: 'starter-b2c',
  currentB2CPlanName: 'Starter B2C', currentB2CPlanId: 'starter-b2c',
  companyInfo: {
    businessName: 'Sahil Mittal', brandName: 'Sahil Mittal', contactPerson: 'Sahil Mittal', companyAddress: '',
    city: 'Ludhiana', state: 'Punjab', pincode: '141001', contactEmail: PRIMARY_SELLER_EMAIL,
    companyEmail: PRIMARY_SELLER_EMAIL, companyContactNumber: '', contactNumber: '', website: '',
    POCEmailVerified: true, POCPhoneVerified: false,
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
  users: [demoUser, primarySeller], orders, pendingOtps: {}, pickupAddresses: {},
  customServiceabilityLocations: [], serviceabilityOverrides: {}, deletedServiceabilityLocationIds: [],
  plans: [
    { id: 'starter-b2c', name: 'Starter B2C', business_type: 'b2c', is_active: true },
    { id: 'growth-b2c', name: 'Growth B2C', business_type: 'b2c', is_active: true },
    { id: 'starter-b2b', name: 'Starter B2B', business_type: 'b2b', is_active: true },
    { id: 'growth-b2b', name: 'Growth B2B', business_type: 'b2b', is_active: true },
  ],
  preferences: {
    widgetVisibility: {},
    widgetOrder: ['quickStats', 'quickActions', 'insights', 'actionItems', 'performanceMetrics', 'ordersTrend', 'financialHealth', 'recentActivity', 'todaysOperations', 'orderStatusChart', 'courierComparison', 'metricsOverview', 'courierPerformance', 'topDestinations'],
    layout: {}, dateRange: {},
  },
}
const state = existsSync(dataFile) ? JSON.parse(readFileSync(dataFile, 'utf8')) : defaultState
if (!Array.isArray(state.users)) state.users = state.user ? [state.user] : [demoUser]
const existingPrimarySeller = state.users.find((item) => item.email === PRIMARY_SELLER_EMAIL)
if (existingPrimarySeller) {
  Object.assign(existingPrimarySeller, {
    onboardingComplete: true,
    profileComplete: true,
    approved: true,
    onboardingStep: 3,
    businessType: existingPrimarySeller.businessType?.length ? existingPrimarySeller.businessType : primarySeller.businessType,
    currentPlanName: existingPrimarySeller.currentPlanName || primarySeller.currentPlanName,
    currentPlanId: existingPrimarySeller.currentPlanId || primarySeller.currentPlanId,
    currentB2CPlanName: existingPrimarySeller.currentB2CPlanName || primarySeller.currentB2CPlanName,
    currentB2CPlanId: existingPrimarySeller.currentB2CPlanId || primarySeller.currentB2CPlanId,
    companyInfo: { ...primarySeller.companyInfo, ...existingPrimarySeller.companyInfo, POCEmailVerified: true },
    domesticKyc: { ...existingPrimarySeller.domesticKyc, status: 'verified' },
  })
} else {
  state.users.push(primarySeller)
}
state.orders ??= orders
state.pendingOtps ??= {}
state.pickupAddresses ??= {}
const primarySellerState = state.users.find((item) => item.email === PRIMARY_SELLER_EMAIL)
if (primarySellerState && !state.pickupAddresses[primarySellerState.id]?.length) {
  state.pickupAddresses[primarySellerState.id] = [{
    id: 'primary-pickup',
    pickupId: 'primary-pickup',
    userId: primarySellerState.id,
    pickup: {
      id: 'primary-pickup',
      addressNickname: 'Primary Warehouse',
      contactName: 'Sahil Mittal',
      contactNumber: '8487881121',
      addressLine1: 'Ludhiana',
      addressLine2: '',
      city: 'Ludhiana',
      state: 'Punjab',
      pincode: '141001',
      country: 'India',
    },
    createdAt: primarySellerState.createdAt,
    updatedAt: primarySellerState.updatedAt,
  }]
}
state.customServiceabilityLocations ??= []
state.serviceabilityOverrides ??= {}
state.deletedServiceabilityLocationIds ??= []
state.plans ??= defaultState.plans
state.preferences ??= defaultState.preferences
state.walletTransactions ??= []

for (const seller of state.users) {
  if (
    Number(seller.walletBalance ?? 5000) !== 0 &&
    !state.walletTransactions.some((transaction) => transaction.user_id === seller.id)
  ) {
    state.walletTransactions.push({
      id: `wallet-opening-${seller.id}`,
      wallet_id: `wallet-${seller.id}`,
      user_id: seller.id,
      amount: Math.abs(Number(seller.walletBalance ?? 5000)),
      type: Number(seller.walletBalance ?? 5000) >= 0 ? 'credit' : 'debit',
      reason: 'opening_balance',
      category: 'wallet_recharge',
      ref: `OPENING-${seller.id}`,
      meta: { source: 'PunjabShip', notes: 'Opening wallet balance' },
      currency: 'INR',
      created_at: seller.createdAt || new Date().toISOString(),
      balance_after: Number(seller.walletBalance ?? 5000),
    })
  }
}

const save = () => writeFileSync(dataFile, JSON.stringify(state, null, 2))
const serviceabilityLocations = () => {
  const deleted = new Set(state.deletedServiceabilityLocationIds)
  const seeded = getSeededServiceabilityLocations()
    .filter((location) => !deleted.has(location.id))
    .map((location) => ({ ...location, ...(state.serviceabilityOverrides[location.id] || {}) }))
  return [...seeded, ...state.customServiceabilityLocations.filter((location) => !deleted.has(location.id))]
}
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
const isAdminRequest = (req) => decodeToken(req)?.role === 'admin'
const authPayload = (seller) => {
  const accessToken = token('user', seller.id)
  return { success: true, message: 'Login successful', token: accessToken, accessToken, refreshToken: accessToken, user: seller }
}

const walletBalanceOf = (seller) => Number(seller?.walletBalance ?? 5000)
const walletIdOf = (seller) => `wallet-${seller.id}`
const walletCategoryOf = (transaction) => transaction.category || (
  String(transaction.reason || '').includes('recharge') || String(transaction.reason || '').includes('opening')
    ? 'wallet_recharge'
    : 'adjustments'
)
const walletTransactionsFor = (userId) => state.walletTransactions
  .filter((transaction) => transaction.user_id === userId)
  .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))

const filterWalletTransactions = (transactions, requestUrl) => {
  const type = String(requestUrl.searchParams.get('type') || '').toLowerCase()
  const category = String(requestUrl.searchParams.get('category') || '').toLowerCase()
  const search = String(requestUrl.searchParams.get('search') || '').trim().toLowerCase()
  const dateFrom = requestUrl.searchParams.get('dateFrom')
  const dateTo = requestUrl.searchParams.get('dateTo')
  const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
  const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null

  return transactions.filter((transaction) => {
    const timestamp = new Date(transaction.created_at || 0).getTime()
    return (!type || transaction.type === type) &&
      (!category || walletCategoryOf(transaction) === category) &&
      (!search || JSON.stringify(transaction).toLowerCase().includes(search)) &&
      (!fromTime || timestamp >= fromTime) &&
      (!toTime || timestamp <= toTime)
  })
}

const paginate = (items, requestUrl, defaultLimit = 20) => {
  const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1))
  const limit = Math.min(5000, Math.max(1, Number(requestUrl.searchParams.get('limit') || defaultLimit)))
  const start = (page - 1) * limit
  return {
    data: items.slice(start, start + limit),
    totalCount: items.length,
    total: items.length,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(items.length / limit)),
  }
}

const adminWalletRow = (seller) => ({
  id: walletIdOf(seller),
  walletId: walletIdOf(seller),
  userId: seller.id,
  user: seller.displayName || seller.companyInfo?.contactPerson || seller.email,
  userEmail: seller.email,
  email: seller.email,
  companyInfo: seller.companyInfo || {},
  balance: walletBalanceOf(seller),
  currency: 'INR',
  createdAt: seller.createdAt,
  updatedAt: seller.updatedAt || seller.createdAt,
})

const walletMisRow = (transaction) => {
  const seller = state.users.find((item) => item.id === transaction.user_id)
  const meta = transaction.meta || {}
  return {
    id: transaction.id,
    customerName: seller?.companyInfo?.businessName || seller?.displayName || seller?.email || 'Unknown customer',
    customerEmail: seller?.email || '',
    customerId: transaction.user_id,
    transactionDate: transaction.created_at,
    walletTransactionAmount: Number(transaction.amount || 0),
    transactionAgainst: walletCategoryOf(transaction).split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    transactionType: String(transaction.type || '').toUpperCase(),
    awb: transaction.awb_number || meta.awb_number || '',
    courierPartnerName: meta.courier_partner || meta.courier || '',
    weight: meta.weight || '',
    reference: transaction.ref || '',
  }
}

const stats = (seller) => {
  const sellerOrders = seller?.id === demoUser.id ? state.orders : []
  return {
    todayOperations: { orders: sellerOrders.length, pending: 3, inTransit: 3, delivered: 3 },
    financial: { walletBalance: walletBalanceOf(seller), todayRevenue: 1250, totalRevenue: 21600, totalShippingCharges: 846, totalFreightCharges: 600, profit: 246, codAmount: 10800, codRemittanceDue: 5400, codRemittanceCredited: 5400 },
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

const adminDashboardStats = (requestUrl) => {
  const fromDate = requestUrl.searchParams.get('fromDate')
  const toDate = requestUrl.searchParams.get('toDate')
  const userId = requestUrl.searchParams.get('userId')
  const statusFilter = requestUrl.searchParams.get('status')
  const courierFilter = requestUrl.searchParams.get('courier')
  const start = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null
  const end = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null
  const amount = (order) => Number(order.order_amount ?? order.total_amount ?? 0) || 0
  const freight = (order) => Number(order.freight_charges ?? order.shipping_charges ?? 0) || 0
  const statusOf = (order) => String(order.order_status || order.status || 'pending').toLowerCase()
  const courierOf = (order) => String(order.courier_partner || order.courier_name || 'Unassigned')
  const createdAt = (order) => new Date(order.created_at || order.createdAt || 0).getTime()
  const dateKey = (order) => new Date(order.created_at || order.createdAt || Date.now()).toISOString().slice(0, 10)
  const cityOf = (order, type) => order[`${type}_details`]?.city || order[`customer_${type === 'shipping' ? 'city' : 'pickup_city'}`] || 'Unknown'
  const pincodeOf = (order) => String(order.shipping_details?.pincode || order.customer_pincode || '')
  const includesStatus = (order, values) => values.some((value) => statusOf(order).includes(value))
  const isDelivered = (order) => statusOf(order) === 'delivered'
  const isRto = (order) => includesStatus(order, ['rto', 'return'])
  const isNdr = (order) => includesStatus(order, ['ndr', 'undelivered'])
  const isTransit = (order) => includesStatus(order, ['transit', 'shipped', 'ofd', 'out_for_delivery'])
  const isPending = (order) => includesStatus(order, ['pending', 'booked', 'pickup'])
  const isCod = (order) => String(order.payment_type || order.order_type || '').toLowerCase() === 'cod'

  const selectedOrders = state.orders.filter((order) => {
    const created = createdAt(order)
    return (!start || created >= start) && (!end || created <= end) &&
      (!userId || String(order.user_id || order.userId) === userId) &&
      (!statusFilter || statusOf(order) === statusFilter) &&
      (!courierFilter || courierOf(order) === courierFilter)
  })
  const totalOrders = selectedOrders.length
  const deliveredOrders = selectedOrders.filter(isDelivered).length
  const rtoOrders = selectedOrders.filter(isRto).length
  const ndrOrders = selectedOrders.filter(isNdr).length
  const codOrders = selectedOrders.filter(isCod)
  const totalRevenue = selectedOrders.reduce((sum, order) => sum + amount(order), 0)
  const totalFreightCharges = selectedOrders.reduce((sum, order) => sum + freight(order), 0)
  const codAmount = codOrders.reduce((sum, order) => sum + amount(order), 0)
  const percentage = (value) => totalOrders ? Number(((value / totalOrders) * 100).toFixed(1)) : 0
  const countBy = (items, key) => items.reduce((result, item) => {
    const value = key(item)
    result[value] = (result[value] || 0) + 1
    return result
  }, {})
  const topLocations = (type) => Object.entries(countBy(selectedOrders, (order) => cityOf(order, type)))
    .map(([city, count]) => ({ city, count })).sort((a, b) => b.count - a.count).slice(0, 10)

  const daily = new Map()
  for (const order of selectedOrders) {
    const date = dateKey(order)
    const row = daily.get(date) || { date, orders: 0, revenue: 0, collected: 0, remitted: 0, created: 0, pickupGenerated: 0, pickedUp: 0, shipped: 0, ofd: 0, delivered: 0, rto: 0, ndr: 0 }
    const status = statusOf(order)
    row.orders += 1
    row.created += 1
    row.revenue += amount(order)
    if (isCod(order)) row.collected += amount(order)
    if (status.includes('pickup')) row.pickupGenerated += 1
    if (status.includes('picked')) row.pickedUp += 1
    if (status.includes('shipped') || status.includes('transit')) row.shipped += 1
    if (status.includes('ofd') || status.includes('out_for_delivery')) row.ofd += 1
    if (isDelivered(order)) row.delivered += 1
    if (isRto(order)) row.rto += 1
    if (isNdr(order)) row.ndr += 1
    daily.set(date, row)
  }
  const timeline = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date))

  const courierPerformance = {}
  for (const order of selectedOrders) {
    const name = courierOf(order)
    const current = courierPerformance[name] || { count: 0, delivered: 0, revenue: 0 }
    current.count += 1
    current.delivered += isDelivered(order) ? 1 : 0
    current.revenue += amount(order)
    courierPerformance[name] = current
  }
  for (const value of Object.values(courierPerformance)) value.deliveryRate = value.count ? Number(((value.delivered / value.count) * 100).toFixed(1)) : 0

  const codBySeller = new Map()
  for (const order of codOrders.filter((item) => !isDelivered(item) || !item.cod_remitted)) {
    const sellerId = order.user_id || order.userId
    const seller = state.users.find((item) => item.id === sellerId)
    const current = codBySeller.get(sellerId) || { customerId: sellerId, customerName: seller?.companyInfo?.businessName || seller?.displayName, customerEmail: seller?.email, codOrderCount: 0, netPayableBalance: 0 }
    current.codOrderCount += 1
    current.netPayableBalance += amount(order)
    codBySeller.set(sellerId, current)
  }
  const topCodPayables = [...codBySeller.values()].sort((a, b) => b.netPayableBalance - a.netPayableBalance).slice(0, 10)
  const pendingCod = topCodPayables.reduce((sum, item) => sum + item.netPayableBalance, 0)
  const now = Date.now()
  const today = new Date().toISOString().slice(0, 10)
  const pendingKyc = state.users.filter((user) => user.domesticKyc?.status !== 'verified').length
  const statuses = countBy(selectedOrders, statusOf)
  const riskyPincodes = Object.entries(countBy(selectedOrders.filter((order) => isRto(order) || isNdr(order)), pincodeOf))
    .filter(([pincode]) => pincode).map(([pincode, count]) => ({ pincode, count })).sort((a, b) => b.count - a.count).slice(0, 20)

  return {
    isAllTime: !fromDate && !toDate,
    todayOperations: {
      orders: selectedOrders.filter((order) => dateKey(order) === today).length,
      pending: selectedOrders.filter(isPending).length,
      inTransit: selectedOrders.filter(isTransit).length,
      delivered: deliveredOrders,
    },
    financial: {
      todayRevenue: selectedOrders.filter((order) => dateKey(order) === today).reduce((sum, order) => sum + amount(order), 0),
      totalRevenue, totalShippingCharges: totalFreightCharges, totalFreightCharges, totalCourierCosts: totalFreightCharges,
      codAmount, codRemittanceDue: pendingCod,
      codStats: { pendingRemittance: pendingCod, pendingOrders: topCodPayables.reduce((sum, item) => sum + item.codOrderCount, 0) },
      codPayableSummary: { codPayableAmount: pendingCod, negativeWalletAdjustment: 0, netPayableBalance: pendingCod, customerCount: topCodPayables.length },
      topCodPayables,
    },
    operational: {
      totalOrders, deliveredOrders, rtoOrders, rtoCount: rtoOrders, ndrOrders, ndrCount: ndrOrders,
      deliverySuccessRate: percentage(deliveredOrders), rtoRate: percentage(rtoOrders), ndrRate: percentage(ndrOrders), avgDeliveryTime: 0,
    },
    alerts: {
      openTickets: 0, inProgressTickets: 0, overdueTickets: 0,
      merchantAccounts: { accountPendingApproval: state.users.filter((user) => !user.approved).length, documentsNotUploaded: pendingKyc, partialDocumentsUploaded: 0 },
      shipmentPickups: { pendingForPickup: selectedOrders.filter(isPending).length, notScheduled: selectedOrders.filter((order) => statusOf(order) === 'pending').length },
    },
    couriers: { performance: courierPerformance },
    geographic: { topOriginCities: topLocations('pickup'), topDestinationCities: topLocations('shipping'), highRiskPincodes: riskyPincodes },
    users: {
      total: state.users.length, active: state.users.filter((user) => user.approved).length,
      today: state.users.filter((user) => String(user.createdAt || '').startsWith(today)).length,
      lastWeek: state.users.filter((user) => now - new Date(user.createdAt || 0).getTime() <= 7 * 86400000).length,
      pendingKyc,
    },
    metrics: {
      avgOrderValue: totalOrders ? totalRevenue / totalOrders : 0,
      totalPrepaidOrders: selectedOrders.filter((order) => !isCod(order)).length,
      totalCodOrders: codOrders.length,
    },
    filters: {
      couriers: [...new Set(state.orders.map(courierOf))].filter(Boolean).sort(),
      users: state.users.map((user) => ({ id: user.id, name: user.companyInfo?.businessName || user.displayName || user.email })),
    },
    charts: { ordersByDate: timeline, statusActivityByDate: timeline, codMovementByDate: timeline, revenueByDate: timeline },
    orderStatusCounts: statuses,
    recentOrders: selectedOrders.slice().sort((a, b) => createdAt(b) - createdAt(a)).slice(0, 10),
    recentActivity: selectedOrders.slice().sort((a, b) => createdAt(b) - createdAt(a)).slice(0, 10).map((order) => ({
      id: order.id, type: 'order', title: order.order_number || order.order_id || 'Shipment', detail: statusOf(order).replace(/_/g, ' '),
      occurredAt: order.updated_at || order.created_at || new Date().toISOString(), route: '/admin/orders',
    })),
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

const merchantReadiness = (seller) => {
  const walletBalance = Number(seller?.walletBalance ?? 5000)
  const requiredWalletBalance = 100
  const hasAssignedPlan = Boolean(seller?.currentPlanId || seller?.currentB2CPlanId || seller?.currentB2BPlanId)
  const hasPickupAddress = Boolean(state.pickupAddresses[seller?.id]?.length)
  const result = {
    onboardingComplete: Boolean(seller?.onboardingComplete),
    approved: Boolean(seller?.approved),
    hasCompanyInfo: Boolean(seller?.companyInfo?.businessName),
    kycVerified: seller?.domesticKyc?.status === 'verified',
    hasAssignedPlan,
    assignedPlanName: seller?.currentPlanName || seller?.currentB2CPlanName || seller?.currentB2BPlanName || null,
    assignedPlanId: seller?.currentPlanId || seller?.currentB2CPlanId || seller?.currentB2BPlanId || null,
    hasPickupAddress,
    walletReady: walletBalance >= requiredWalletBalance,
    walletBalance,
    requiredWalletBalance,
    isEmployee: false,
  }
  return { ...result, isReady: Object.entries(result).every(([key, value]) => key.startsWith('assignedPlan') || key === 'isEmployee' || Boolean(value)) }
}

const isShipGlobalOrder = (order) => `${order?.integration_type || ''} ${order?.courier_partner || ''}`.toLowerCase().includes('shipglobal')

const orderForPanels = (order) => {
  const seller = state.users.find((item) => item.id === order.user_id)
  return {
    ...order,
    type: order.type || 'b2c',
    merchantName: seller?.companyInfo?.businessName || seller?.displayName || seller?.email || 'Unknown Merchant',
    merchantEmail: seller?.email || '',
    buyer_name: order.buyer_name || order.consignee?.name || order.customer_name || '',
    buyer_phone: order.buyer_phone || order.consignee?.phone || order.customer_phone || '',
    order_type: order.order_type || order.payment_type || 'prepaid',
    order_status: order.order_status || order.status || 'pending',
    order_date: order.order_date || order.created_at,
  }
}

const filterAndPaginateOrders = (ordersToFilter, requestUrl) => {
  const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1))
  const limit = Math.min(1000, Math.max(1, Number(requestUrl.searchParams.get('limit') || 10)))
  const search = String(requestUrl.searchParams.get('search') || '').trim().toLowerCase()
  const status = String(requestUrl.searchParams.get('status') || '').trim().toLowerCase()
  const sortOrder = String(requestUrl.searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
  let filtered = ordersToFilter.map(orderForPanels)
  if (search) filtered = filtered.filter((order) => JSON.stringify(order).toLowerCase().includes(search))
  if (status) filtered = filtered.filter((order) => String(order.order_status || '').toLowerCase() === status)
  filtered.sort((a, b) => sortOrder === 'asc'
    ? String(a.created_at || '').localeCompare(String(b.created_at || ''))
    : String(b.created_at || '').localeCompare(String(a.created_at || '')))
  const statusCounts = filtered.reduce((counts, order) => {
    const key = order.order_status || 'pending'
    counts[key] = (counts[key] || 0) + 1
    return counts
  }, {})
  const start = (page - 1) * limit
  return { orders: filtered.slice(start, start + limit), totalCount: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / limit)), page, limit, statusCounts }
}

const localTracking = (order) => ({
  id: order.id,
  order_id: order.order_id || order.id,
  order_number: order.order_number,
  awb_number: order.awb_number,
  courier_name: order.courier_partner || 'PunjabShip',
  status: order.order_status || order.status || 'shipment_created',
  edd: order.edd || '',
  history: order.tracking_events || [{ status_code: 'LOCAL', location: '', event_time: order.updated_at || order.created_at, message: order.provider_last_status || 'Shipment created' }],
  payment_type: order.payment_type || order.order_type || 'prepaid',
  shipment_info: order.provider_last_status || order.delivery_message || '',
})

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

    if (path === '' || path === '/api/health') return send({ success: true, mode: 'punjabship-demo-api', integrations: { shipglobal: { configured: shipGlobal.isConfigured(), service: SHIPGLOBAL_SERVICE } } })
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
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      return send(merchantReadiness(seller))
    }
    if (path === '/api/profile/kyc' && req.method === 'GET') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      return send({ success: true, kyc: seller.domesticKyc || { status: 'pending' } })
    }
    if (path === '/api/profile/kyc' && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      seller.domesticKyc = { ...seller.domesticKyc, ...body, status: 'verification_in_progress', updatedAt: new Date().toISOString() }
      seller.updatedAt = new Date().toISOString()
      save()
      return send({ success: true, message: 'KYC submitted for verification.', kyc: seller.domesticKyc })
    }
    if (path === '/api/pickup-addresses' && req.method === 'GET') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      const addresses = state.pickupAddresses[seller.id] || []
      return send({ success: true, data: addresses, totalCount: addresses.length })
    }
    if (path === '/api/pickup-addresses' && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      const now = new Date().toISOString()
      const address = { ...body, id: `pickup-${randomUUID()}`, userId: seller.id, createdAt: now, updatedAt: now }
      state.pickupAddresses[seller.id] = [...(state.pickupAddresses[seller.id] || []), address]
      save()
      return send(address, 201)
    }
    const pickupMatch = path.match(/^\/api\/pickup-addresses\/([^/]+)$/)
    if (pickupMatch && req.method === 'PATCH') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      const addresses = state.pickupAddresses[seller.id] || []
      const address = addresses.find((item) => item.id === pickupMatch[1])
      if (!address) return send({ error: 'Pickup address not found.' }, 404)
      Object.assign(address, body, { updatedAt: new Date().toISOString() })
      save()
      return send({ success: true, data: address })
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
    const approveUserMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/approve$/)
    if (approveUserMatch && req.method === 'PATCH') {
      const seller = state.users.find((item) => item.id === approveUserMatch[1])
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      seller.approved = true
      seller.approvedAt = new Date().toISOString()
      seller.updatedAt = seller.approvedAt
      save()
      return send({ success: true, message: 'Seller account approved.', user: seller })
    }
    if (path === '/api/plans' && req.method === 'GET') return send({ success: true, data: state.plans })
    if (path === '/api/plans/assign-to-user' && req.method === 'POST') {
      const seller = state.users.find((item) => item.id === body.userId)
      const plan = state.plans.find((item) => item.id === body.planId)
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      if (!plan) return send({ error: 'Plan not found.' }, 404)
      const businessType = body.businessType === 'b2b' ? 'b2b' : 'b2c'
      if (businessType === 'b2b') {
        seller.currentB2BPlanId = plan.id
        seller.currentB2BPlanName = plan.name
      } else {
        seller.currentB2CPlanId = plan.id
        seller.currentB2CPlanName = plan.name
        seller.currentPlanId = plan.id
        seller.currentPlanName = plan.name
      }
      seller.updatedAt = new Date().toISOString()
      save()
      return send({ success: true, message: `${businessType.toUpperCase()} plan assigned.`, user: seller })
    }
    if (path === '/api/admin/integrations/shipglobal/status' && req.method === 'GET') {
      return send({
        success: true,
        data: {
          provider: 'ShipGlobal',
          configured: shipGlobal.isConfigured(),
          liveBookingEnabled: shipGlobal.isConfigured(),
          service: SHIPGLOBAL_SERVICE,
          apiBaseUrl: shipGlobal.baseUrl,
          credentialsSource: 'server_environment',
        },
      })
    }
    const adminKycMatch = path.match(/^\/api\/admin\/users\/([^/]+)\/kyc$/)
    if (adminKycMatch && req.method === 'GET') {
      const seller = state.users.find((item) => item.id === adminKycMatch[1])
      return seller ? send({ success: true, kyc: seller.domesticKyc || { status: 'pending' } }) : send({ error: 'Seller not found.' }, 404)
    }
    const approveKycMatch = path.match(/^\/api\/admin\/users\/kyc\/approve\/([^/]+)$/)
    if (approveKycMatch && req.method === 'POST') {
      const seller = state.users.find((item) => item.id === approveKycMatch[1])
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      seller.domesticKyc = { ...seller.domesticKyc, status: 'verified', rejectionReason: null, updatedAt: new Date().toISOString() }
      seller.updatedAt = new Date().toISOString()
      save()
      return send({ success: true, message: 'KYC approved.', kyc: seller.domesticKyc })
    }
    const rejectKycMatch = path.match(/^\/api\/admin\/users\/kyc\/(reject|revoke)\/([^/]+)$/)
    if (rejectKycMatch && req.method === 'POST') {
      const seller = state.users.find((item) => item.id === rejectKycMatch[2])
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      seller.domesticKyc = { ...seller.domesticKyc, status: rejectKycMatch[1] === 'reject' ? 'rejected' : 'verification_in_progress', rejectionReason: body.reason || null, updatedAt: new Date().toISOString() }
      seller.updatedAt = new Date().toISOString()
      save()
      return send({ success: true, message: `KYC ${rejectKycMatch[1]}d.`, kyc: seller.domesticKyc })
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
    if (path === '/api/admin/dashboard/stats' && req.method === 'GET') return send({ success: true, data: adminDashboardStats(requestUrl) })

    if (path === '/api/payments/wallet/balance' && req.method === 'GET') {
      const seller = currentSeller(req)
      if (!seller) return send({ success: false, message: 'Authentication required.' }, 401)
      const balance = walletBalanceOf(seller)
      return send({ success: true, data: { balance, currency: 'INR', walletId: walletIdOf(seller) }, balance })
    }
    if (path === '/api/payments/wallet/transactions' && req.method === 'GET') {
      const seller = currentSeller(req)
      if (!seller) return send({ success: false, message: 'Authentication required.' }, 401)
      const filtered = filterWalletTransactions(walletTransactionsFor(seller.id), requestUrl)
      const pageData = paginate(filtered, requestUrl, 50)
      return send({
        success: true,
        wallet: { id: walletIdOf(seller), balance: String(walletBalanceOf(seller)), currency: 'INR' },
        transactions: pageData.data,
        totalCount: pageData.totalCount,
        total: pageData.total,
        page: pageData.page,
        limit: pageData.limit,
        totalPages: pageData.totalPages,
      })
    }
    if (path === '/api/wallet/balance' && req.method === 'GET') {
      const seller = currentSeller(req)
      const balance = walletBalanceOf(seller)
      return send({ success: true, data: { balance }, balance })
    }

    if (path === '/api/admin/wallets' && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const search = String(requestUrl.searchParams.get('search') || '').trim().toLowerCase()
      const sortBy = String(requestUrl.searchParams.get('sortBy') || 'updatedAt')
      const sortOrder = String(requestUrl.searchParams.get('sortOrder') || 'desc').toLowerCase() === 'asc' ? 1 : -1
      let wallets = state.users.map(adminWalletRow)
      if (search) wallets = wallets.filter((wallet) => JSON.stringify(wallet).toLowerCase().includes(search))
      wallets.sort((a, b) => {
        const left = sortBy === 'companyName' ? a.companyInfo?.businessName : a[sortBy]
        const right = sortBy === 'companyName' ? b.companyInfo?.businessName : b[sortBy]
        if (sortBy === 'balance') return (Number(left || 0) - Number(right || 0)) * sortOrder
        return String(left || '').localeCompare(String(right || '')) * sortOrder
      })
      return send({ success: true, ...paginate(wallets, requestUrl, 20) })
    }

    if (path === '/api/admin/wallets/mis-report' && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      let rows = state.walletTransactions.map(walletMisRow)
      const search = String(requestUrl.searchParams.get('search') || '').trim().toLowerCase()
      const type = String(requestUrl.searchParams.get('type') || '').trim().toUpperCase()
      const transactionAgainst = String(requestUrl.searchParams.get('transactionAgainst') || '').trim().toLowerCase()
      const customerId = String(requestUrl.searchParams.get('customerId') || '').trim()
      const awb = String(requestUrl.searchParams.get('awb') || '').trim().toLowerCase()
      const courier = String(requestUrl.searchParams.get('courier') || '').trim().toLowerCase()
      const dateFrom = requestUrl.searchParams.get('dateFrom')
      const dateTo = requestUrl.searchParams.get('dateTo')
      const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null
      const toTime = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null
      rows = rows.filter((row) => {
        const timestamp = new Date(row.transactionDate || 0).getTime()
        return (!search || JSON.stringify(row).toLowerCase().includes(search)) &&
          (!type || row.transactionType === type) &&
          (!transactionAgainst || row.transactionAgainst.toLowerCase() === transactionAgainst) &&
          (!customerId || row.customerId === customerId) &&
          (!awb || row.awb.toLowerCase().includes(awb)) &&
          (!courier || row.courierPartnerName.toLowerCase().includes(courier)) &&
          (!fromTime || timestamp >= fromTime) &&
          (!toTime || timestamp <= toTime)
      })
      rows.sort((a, b) => String(b.transactionDate || '').localeCompare(String(a.transactionDate || '')))
      return send({ success: true, ...paginate(rows, requestUrl, 50) })
    }

    if (path === '/api/admin/wallets/mis-report/export' && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const rows = state.walletTransactions.map(walletMisRow)
      const columns = ['Customer Name', 'Customer Email', 'Customer ID', 'Transaction Date', 'Amount', 'Transaction Against', 'Type', 'AWB', 'Courier', 'Weight', 'Reference']
      const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
      const csv = [columns, ...rows.map((row) => [row.customerName, row.customerEmail, row.customerId, row.transactionDate, row.walletTransactionAmount, row.transactionAgainst, row.transactionType, row.awb, row.courierPartnerName, row.weight, row.reference])]
        .map((row) => row.map(escapeCsv).join(','))
        .join('\n')
      res.writeHead(200, {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="wallet_mis_${new Date().toISOString().slice(0, 10)}.csv"`,
      })
      res.end(csv)
      return
    }

    const adminWalletTransactionsMatch = path.match(/^\/api\/admin\/wallets\/([^/]+)\/transactions$/)
    if (adminWalletTransactionsMatch && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const seller = state.users.find((item) => item.id === adminWalletTransactionsMatch[1])
      if (!seller) return send({ success: false, message: 'Seller wallet not found.' }, 404)
      const filtered = filterWalletTransactions(walletTransactionsFor(seller.id), requestUrl)
      const pageData = paginate(filtered, requestUrl, 50)
      return send({
        success: true,
        wallet: { id: walletIdOf(seller), balance: String(walletBalanceOf(seller)), currency: 'INR' },
        transactions: pageData.data,
        totalCount: pageData.totalCount,
        page: pageData.page,
        limit: pageData.limit,
        totalPages: pageData.totalPages,
      })
    }

    const adminWalletAdjustMatch = path.match(/^\/api\/admin\/wallets\/([^/]+)\/adjust$/)
    if (adminWalletAdjustMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const seller = state.users.find((item) => item.id === adminWalletAdjustMatch[1])
      if (!seller) return send({ success: false, message: 'Seller wallet not found.' }, 404)
      const type = String(body.type || '').toLowerCase()
      const amount = Number(body.amount)
      if (!['credit', 'debit'].includes(type) || !Number.isFinite(amount) || amount <= 0 || !String(body.reason || '').trim()) {
        return send({ success: false, message: 'Type, positive amount, and reason are required.' }, 400)
      }
      const currentBalance = walletBalanceOf(seller)
      if (type === 'debit' && amount > currentBalance) return send({ success: false, message: 'Insufficient wallet balance.' }, 400)
      const now = new Date().toISOString()
      seller.walletBalance = Number((currentBalance + (type === 'credit' ? amount : -amount)).toFixed(2))
      seller.updatedAt = now
      const transaction = {
        id: `wallet-transaction-${randomUUID()}`,
        wallet_id: walletIdOf(seller),
        user_id: seller.id,
        amount,
        type,
        reason: String(body.reason).trim(),
        category: 'adjustments',
        ref: `ADMIN-${Date.now()}`,
        meta: { notes: String(body.notes || '').trim(), source: 'admin_adjustment' },
        currency: 'INR',
        created_at: now,
        balance_after: seller.walletBalance,
      }
      state.walletTransactions.unshift(transaction)
      save()
      return send({ success: true, message: 'Wallet balance adjusted.', data: adminWalletRow(seller), transaction })
    }

    const adminWalletMatch = path.match(/^\/api\/admin\/wallets\/([^/]+)$/)
    if (adminWalletMatch && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const seller = state.users.find((item) => item.id === adminWalletMatch[1])
      return seller
        ? send({ success: true, data: adminWalletRow(seller), wallet: adminWalletRow(seller) })
        : send({ success: false, message: 'Seller wallet not found.' }, 404)
    }

    if (path === '/api/dashboard/stats') return send({ success: true, data: stats(currentSeller(req)) })
    if (path === '/api/dashboard/preferences') {
      if (req.method === 'POST') { state.preferences = { ...state.preferences, ...body }; save() }
      return send({ success: true, data: state.preferences })
    }
    if (path === '/api/dashboard/tour') return send({ success: true, data: { version: 1, status: 'dismissed', completedPages: [] } })
    if (path === '/api/dashboard/invoice-status') return send({ success: true, status: { pending: { count: 0, totalAmount: 0 }, paid: { count: 0, totalAmount: 0 }, overdue: { count: 0, totalAmount: 0 } } })
    if (path === '/api/couriers/available-to-user' && req.method === 'POST') {
      const configured = shipGlobal.isConfigured()
      const courier = {
        id: 99001,
        courier_id: 99001,
        name: 'ShipGlobal',
        displayName: 'ShipGlobal International',
        integration_type: 'shipglobal',
        courier_option_key: 'shipglobal-direct',
        service: SHIPGLOBAL_SERVICE,
        mode: 'air',
        rate: 0,
        courier_cost_estimate: null,
        booking_available: configured,
        can_book: configured,
        booking_blocked_reason: configured ? null : 'ShipGlobal production credentials must be configured by the administrator.',
        provider_serviceability: {
          provider: 'ShipGlobal',
          service: SHIPGLOBAL_SERVICE,
          booking_available: configured,
          can_book: configured,
          booking_blocked_reason: configured ? null : 'ShipGlobal production credentials must be configured by the administrator.',
        },
      }
      return send({ success: true, data: [courier] })
    }
    if (path === '/api/orders/check-order-number' && req.method === 'GET') {
      const orderNumber = String(requestUrl.searchParams.get('orderNumber') || '').trim().toLowerCase()
      const available = Boolean(orderNumber) && !state.orders.some((order) => String(order.order_number || '').toLowerCase() === orderNumber)
      return send({ success: true, available, data: { available, message: available ? 'Order ID is available.' : 'This Order ID is already used.' } })
    }
    if (path === '/api/orders/b2c/create' && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ success: false, message: 'Authentication required.' }, 401)
      const readiness = merchantReadiness(seller)
      if (!readiness.isReady) return send({ success: false, message: 'Complete account approval, KYC, plan and pickup setup before booking a shipment.', readiness }, 403)
      if (!isShipGlobalOrder(body)) return send({ success: false, message: 'Select ShipGlobal as the courier partner for live booking.' }, 400)
      if (!shipGlobal.isConfigured()) return send({ success: false, message: 'ShipGlobal production credentials are not configured yet.' }, 503)
      if (state.orders.some((order) => String(order.order_number) === String(body.order_number))) return send({ success: false, message: 'Order number already exists.' }, 409)

      const providerPayload = mapPunjabShipOrderToShipGlobal(body, { service: SHIPGLOBAL_SERVICE, currencyCode: SHIPGLOBAL_CURRENCY })
      const missing = validateShipGlobalOrder(providerPayload)
      if (missing.length) return send({ success: false, message: `Missing ShipGlobal fields: ${missing.join(', ')}`, missingFields: missing }, 400)

      const providerResult = await shipGlobal.addOrder(providerPayload)
      const awb = extractShipGlobalAwb(providerResult.data, providerResult.headers)
      const now = new Date().toISOString()
      const order = {
        ...body,
        id: `shipglobal-${randomUUID()}`,
        order_id: body.order_number,
        user_id: seller.id,
        type: 'b2c',
        integration_type: 'shipglobal',
        courier_partner: 'ShipGlobal',
        awb_number: awb,
        status: awb ? 'shipment_created' : 'booking_accepted',
        order_status: awb ? 'shipment_created' : 'booking_accepted',
        provider: 'shipglobal',
        provider_service: providerPayload.service,
        provider_last_status: awb ? 'Shipment created' : 'Order accepted; AWB pending from provider',
        provider_response: providerResult.data,
        shipglobal_booking_status: awb ? 'booked' : 'accepted_pending_awb',
        buyer_name: body.consignee?.name || '',
        buyer_phone: body.consignee?.phone || '',
        customer_name: body.consignee?.name || '',
        customer_phone: body.consignee?.phone || '',
        created_at: now,
        updated_at: now,
      }
      state.orders.unshift(order)
      save()
      return send({ success: true, message: awb ? 'ShipGlobal shipment created.' : 'ShipGlobal accepted the order; AWB is pending.', shipment: orderForPanels(order), providerResponse: providerResult.data }, 201)
    }
    if (['/api/orders/b2c/list', '/api/orders/b2b/list', '/api/orders/all'].includes(path) && req.method === 'GET') {
      const seller = currentSeller(req)
      if (!seller) return send({ success: false, message: 'Authentication required.' }, 401)
      const type = path.includes('/b2b/') ? 'b2b' : path.includes('/b2c/') ? 'b2c' : null
      const sellerOrders = state.orders.filter((order) => order.user_id === seller.id && (!type || (order.type || 'b2c') === type))
      return send({ success: true, ...filterAndPaginateOrders(sellerOrders, requestUrl) })
    }
    if (path === '/api/admin/orders/all-orders' && req.method === 'GET') {
      return send({ success: true, ...filterAndPaginateOrders(state.orders, requestUrl) })
    }
    if (path === '/api/orders/track' && req.method === 'GET') {
      const requested = String(requestUrl.searchParams.get('awbs') || requestUrl.searchParams.get('awb') || requestUrl.searchParams.get('orderNumber') || '').split(',').map((value) => value.trim()).filter(Boolean)
      if (!requested.length) return send({ success: false, message: 'AWB or order number is required.' }, 400)
      const results = []
      for (const reference of requested.slice(0, 50)) {
        const order = state.orders.find((item) => [item.awb_number, item.order_number, item.order_id, item.id].map(String).includes(reference))
        try {
          let tracking
          if ((order && isShipGlobalOrder(order)) || /^SG\d+$/i.test(reference)) {
            if (!shipGlobal.isConfigured()) throw Object.assign(new Error('ShipGlobal production credentials are not configured yet.'), { statusCode: 503 })
            const trackingReference = order?.awb_number || reference
            const providerResult = await shipGlobal.track(trackingReference)
            tracking = mapShipGlobalTracking(providerResult.data, order || { awb_number: trackingReference })
            if (order) {
              order.order_status = tracking.status
              order.status = tracking.status
              order.provider_last_status = tracking.shipment_info
              order.tracking_events = tracking.history
              order.updated_at = new Date().toISOString()
              save()
            }
          } else if (order) tracking = localTracking(order)
          else throw Object.assign(new Error('No shipment found.'), { statusCode: 404 })
          results.push({ awb: reference, success: true, data: tracking })
        } catch (error) {
          results.push({ awb: reference, success: false, message: error.message })
        }
      }
      if (requested.length === 1) {
        const result = results[0]
        return result.success ? send({ success: true, data: result.data }) : send({ success: false, message: result.message }, result.message.includes('credentials') ? 503 : 404)
      }
      return send({ success: true, results, summary: { total: results.length, found: results.filter((item) => item.success).length, failed: results.filter((item) => !item.success).length } })
    }
    if (path === '/api/shipments/cancel' && req.method === 'POST') {
      const order = state.orders.find((item) => String(item.id) === String(body.orderId) || String(item.order_number) === String(body.orderId))
      if (!order) return send({ success: false, message: 'Order not found.' }, 404)
      if (!isShipGlobalOrder(order)) return send({ success: false, message: 'This live cancellation route currently supports ShipGlobal orders.' }, 400)
      if (!order.awb_number) return send({ success: false, message: 'ShipGlobal AWB is required before cancellation.' }, 400)
      const providerResult = await shipGlobal.cancelRefund(order.awb_number)
      order.order_status = 'cancelled'
      order.status = 'cancelled'
      order.provider_last_status = providerResult.data?.msg || providerResult.data?.message || 'Cancelled and refund requested'
      order.cancelled_at = new Date().toISOString()
      order.updated_at = order.cancelled_at
      save()
      return send({ success: true, message: order.provider_last_status, order: orderForPanels(order), providerResponse: providerResult.data })
    }
    if (path === '/api/serviceability/locations' && req.method === 'GET') {
      const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1))
      const limit = Math.min(2000, Math.max(1, Number(requestUrl.searchParams.get('limit') || 50)))
      const pincode = String(requestUrl.searchParams.get('pincode') || '').trim().toLowerCase()
      const city = String(requestUrl.searchParams.get('city') || '').trim().toLowerCase()
      const stateName = String(requestUrl.searchParams.get('state') || '').trim().toLowerCase()
      let locations = serviceabilityLocations()
      if (pincode) locations = locations.filter((item) => item.pincode.toLowerCase().includes(pincode))
      if (city) locations = locations.filter((item) => `${item.city} ${item.district || ''}`.toLowerCase().includes(city))
      if (stateName) locations = locations.filter((item) => item.state.toLowerCase().includes(stateName))
      const start = (page - 1) * limit
      return send({ success: true, data: locations.slice(start, start + limit), total: locations.length, totalCount: locations.length, page, limit, totalPages: Math.max(1, Math.ceil(locations.length / limit)) })
    }
    if (path === '/api/serviceability/locations' && req.method === 'POST') {
      const pincode = String(body.pincode || '').trim()
      if (!/^[1-9]\d{5}$/.test(pincode) || !body.city || !body.state) return send({ success: false, error: 'Valid pincode, city and state are required.' }, 400)
      const location = { id: `custom-location-${randomUUID()}`, pincode, city: String(body.city).trim(), state: String(body.state).trim(), country: 'India', tags: Array.isArray(body.tags) ? body.tags : [], source: 'PunjabShip' }
      state.customServiceabilityLocations.push(location)
      save()
      return send(location, 201)
    }
    const serviceabilityMatch = path.match(/^\/api\/serviceability\/locations\/([^/]+)$/)
    if (serviceabilityMatch && req.method === 'GET') {
      const location = serviceabilityLocations().find((item) => item.id === serviceabilityMatch[1])
      return location ? send(location) : send({ success: false, error: 'Location not found.' }, 404)
    }
    if (serviceabilityMatch && req.method === 'PUT') {
      const id = serviceabilityMatch[1]
      const location = serviceabilityLocations().find((item) => item.id === id)
      if (!location) return send({ success: false, error: 'Location not found.' }, 404)
      const updated = { ...location, ...body, id, country: 'India' }
      const customIndex = state.customServiceabilityLocations.findIndex((item) => item.id === id)
      if (customIndex >= 0) state.customServiceabilityLocations[customIndex] = updated
      else state.serviceabilityOverrides[id] = updated
      save()
      return send(updated)
    }
    if (serviceabilityMatch && req.method === 'DELETE') {
      const id = serviceabilityMatch[1]
      if (!serviceabilityLocations().some((item) => item.id === id)) return send({ success: false, error: 'Location not found.' }, 404)
      state.customServiceabilityLocations = state.customServiceabilityLocations.filter((item) => item.id !== id)
      delete state.serviceabilityOverrides[id]
      if (!state.deletedServiceabilityLocationIds.includes(id)) state.deletedServiceabilityLocationIds.push(id)
      save()
      return send({ success: true, message: 'Location removed.' })
    }
    if (/orders/.test(path) && req.method === 'GET') return send({ success: true, orders: state.orders, data: state.orders, totalCount: state.orders.length, total: state.orders.length, totalPages: 1, page: 1, counts: {} })
    if (/notifications/.test(path)) return send({ success: true, data: [], notifications: [], unreadCount: 0, total: 0 })
    if (/\/kpis$|cod-remittance\/stats$|payable-report$/.test(path)) return send({ success: true, data: {} })
    if (path.includes('/cod-remittance/remittances')) return send({ success: true, data: { remittances: [], total: 0 } })
    if (req.method !== 'GET') return send({ success: false, error: 'This action needs a connected production backend.', message: 'This action needs a connected production backend.' }, 501)
    return send({ success: true, data: [], orders: [], pickups: [], destinations: [], distribution: [], transactions: [], tickets: [], couriers: [], warehouses: [], addresses: [], items: [], total: 0, totalCount: 0, totalPages: 1, page: 1, statusCounts: {}, balance: 5000 })
  } catch (error) {
    console.error(error)
    send({ success: false, error: error.message, message: error.message }, Number(error.statusCode || 500))
  }
}).listen(Number(process.env.PORT || 5004), process.env.HOST || '0.0.0.0', () => {
  console.log(`PunjabShip API listening on port ${process.env.PORT || 5004}`)
})

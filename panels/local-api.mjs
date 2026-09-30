import http from 'node:http'
import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { createRequire } from 'node:module'
import Busboy from 'busboy'
import {
  createShipGlobalClient,
  extractShipGlobalAwb,
  mapPunjabShipOrderToShipGlobal,
  mapShipGlobalTracking,
  validateShipGlobalOrder,
} from './shipglobal.mjs'
import { createStateStore } from './state-store.mjs'
import { isMailConfigured, mailStatus, sendOtpEmail, sendPasswordResetEmail } from './mailer.mjs'
import {
  createObjectKey,
  isOwnerKey,
  isPunjabShipKey,
  isStorageConfigured,
  putObject,
  signedDownloadUrl,
  signedUploadUrl,
  storageBucket,
  storageStatus,
} from './r2-storage.mjs'

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
const otpRequestAttempts = new Map()

const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}
const passwordMatches = (password, encoded) => {
  if (!encoded?.includes(':')) return false
  const [salt, expectedHex] = encoded.split(':')
  const expected = Buffer.from(expectedHex, 'hex')
  const actual = scryptSync(password, salt, expected.length)
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

const DEFAULT_MANUAL_COURIER_ID = 91001
const DEFAULT_B2C_ZONES = [
  { id: 'b2c-local', code: 'A', name: 'Local', description: 'Same city / nearby pincode cluster', business_type: 'b2c', is_active: true },
  { id: 'b2c-state', code: 'B', name: 'Within State', description: 'Pickup and delivery in the same state', business_type: 'b2c', is_active: true },
  { id: 'b2c-metro', code: 'C', name: 'Metro', description: 'Major metro destination', business_type: 'b2c', is_active: true },
  { id: 'b2c-roi', code: 'D', name: 'Rest of India', description: 'All standard India destinations', business_type: 'b2c', is_active: true },
  { id: 'b2c-special', code: 'E', name: 'Special', description: 'North East, Jammu & Kashmir and island destinations', business_type: 'b2c', is_active: true },
]
const DEFAULT_B2B_ZONES = [
  { id: 'b2b-north', code: 'N', name: 'North', description: 'North India', states: ['Punjab', 'Haryana', 'Himachal Pradesh', 'Delhi', 'Uttar Pradesh', 'Uttarakhand', 'Chandigarh', 'Rajasthan'], business_type: 'b2b', is_active: true },
  { id: 'b2b-west', code: 'W', name: 'West', description: 'West India', states: ['Gujarat', 'Maharashtra', 'Goa', 'Dadra & Nagar Haveli', 'Daman & Diu'], business_type: 'b2b', is_active: true },
  { id: 'b2b-south', code: 'S', name: 'South', description: 'South India', states: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'Puducherry'], business_type: 'b2b', is_active: true },
  { id: 'b2b-east', code: 'E', name: 'East', description: 'East India', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'], business_type: 'b2b', is_active: true },
  { id: 'b2b-central', code: 'C', name: 'Central', description: 'Central India', states: ['Madhya Pradesh', 'Chhattisgarh'], business_type: 'b2b', is_active: true },
  { id: 'b2b-northeast', code: 'NE', name: 'North East', description: 'North East and special destinations', states: ['Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura', 'Jammu & Kashmir', 'Ladakh', 'Andaman & Nicobar Islands'], business_type: 'b2b', is_active: true },
]

const defaultManualCourier = () => ({
  id: 'manual-punjabship', courierId: DEFAULT_MANUAL_COURIER_ID, code: 'PUNJABSHIP',
  displayName: 'PunjabShip Manual', serviceProvider: 'manual', supportsB2c: true,
  supportsB2b: true, supportsPrepaid: true, supportsCod: true, minWeightKg: 0.5,
  maxWeightKg: 1000, isEnabled: true, pincodeScope: 'all_india', pincodes: [],
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
})

const makeSlab = (rate, rto, extra, extraRto) => ({
  forward: [{ weight_from: 0, weight_to: 0.5, rate, extra_rate: extra, extra_weight_unit: 0.5 }],
  rto: [{ weight_from: 0, weight_to: 0.5, rate: rto, extra_rate: extraRto, extra_weight_unit: 0.5 }],
})
const defaultB2cRate = () => ({
  id: 'rate-punjabship-b2c', plan_id: 'starter-b2c', businessType: 'b2c',
  courier_id: DEFAULT_MANUAL_COURIER_ID, courier_name: 'PunjabShip Manual',
  service_provider: 'manual', mode: 'standard', min_weight: 0.5,
  cod_charges: 35, cod_percent: 1.5, other_charges: 0,
  rates: {
    Local: { forward: 45, rto: 40 }, 'Within State': { forward: 55, rto: 50 },
    Metro: { forward: 65, rto: 60 }, 'Rest of India': { forward: 75, rto: 70 },
    Special: { forward: 95, rto: 90 },
  },
  zone_slabs: {
    Local: makeSlab(45, 40, 22, 20), 'Within State': makeSlab(55, 50, 26, 24),
    Metro: makeSlab(65, 60, 30, 28), 'Rest of India': makeSlab(75, 70, 35, 32),
    Special: makeSlab(95, 90, 45, 42),
  },
})
const defaultB2bRate = () => ({
  id: 'rate-punjabship-b2b', plan_id: 'starter-b2b', businessType: 'b2b',
  courier_id: DEFAULT_MANUAL_COURIER_ID, courier_name: 'PunjabShip Manual',
  service_provider: 'manual', mode: 'surface', min_weight: 10,
  cod_charges: 75, cod_percent: 1, other_charges: 0,
  rates: {
    North: { forward_per_kg: 12, rto_per_kg: 10, min_weight: 10 },
    West: { forward_per_kg: 15, rto_per_kg: 13, min_weight: 10 },
    South: { forward_per_kg: 18, rto_per_kg: 16, min_weight: 10 },
    East: { forward_per_kg: 17, rto_per_kg: 15, min_weight: 10 },
    Central: { forward_per_kg: 14, rto_per_kg: 12, min_weight: 10 },
    'North East': { forward_per_kg: 24, rto_per_kg: 22, min_weight: 10 },
  },
})
const defaultB2bZoneRates = () => {
  const perKg = { North: 12, West: 15, South: 18, East: 17, Central: 14, 'North East': 24 }
  return DEFAULT_B2B_ZONES.flatMap((origin) => DEFAULT_B2B_ZONES.map((destination) => ({
    id: `b2b-rate-${origin.code.toLowerCase()}-${destination.code.toLowerCase()}`,
    originZoneId: origin.id, origin_zone_id: origin.id,
    destinationZoneId: destination.id, destination_zone_id: destination.id,
    courier_id: DEFAULT_MANUAL_COURIER_ID, service_provider: 'manual', plan_id: 'starter-b2b',
    ratePerKg: perKg[destination.name], rate_per_kg: perKg[destination.name],
    min_charge: perKg[destination.name] * 10, min_charge_weight: 10,
    volumetric_factor: 5000, is_active: true,
  })))
}

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
    walletBalance: 0,
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
  users: [demoUser, primarySeller], orders: [], pendingOtps: {}, pickupAddresses: {},
  paymentOptions: { codEnabled: true, prepaidEnabled: true, minWalletRecharge: 100, gstPercent: 18 },
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
  manualCouriers: [defaultManualCourier()],
  zones: [...DEFAULT_B2C_ZONES, ...DEFAULT_B2B_ZONES],
  shippingRates: [defaultB2cRate(), defaultB2bRate()],
  b2bZoneRates: defaultB2bZoneRates(),
  manualShipments: [], manualShipmentEvents: [], manualShipmentLegs: [],
}
const stateStore = await createStateStore({
  defaultState,
  localFile: dataFile,
  databaseUrl: process.env.DATABASE_URL,
})
const state = stateStore.state
let stateNeedsSave = false

// One-time clean baseline requested before durable order storage goes live.
// The marker is stored with the state, so future restarts never clear new orders.
if (Number(state.orderResetVersion || 0) < 1) {
  state.orders = []
  state.manualShipments = []
  state.manualShipmentEvents = []
  state.manualShipmentLegs = []
  state.orderResetVersion = 1
  stateNeedsSave = true
}
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
state.passwordResetOtps ??= {}
state.passwordResetTokens ??= {}
state.pickupAddresses ??= {}
state.paymentOptions = {
  codEnabled: state.paymentOptions?.codEnabled ?? true,
  prepaidEnabled: state.paymentOptions?.prepaidEnabled ?? true,
  minWalletRecharge: Number(state.paymentOptions?.minWalletRecharge ?? 100),
  gstPercent: Number(state.paymentOptions?.gstPercent ?? 18),
}
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
for (const addresses of Object.values(state.pickupAddresses)) {
  if (!Array.isArray(addresses)) continue
  for (const address of addresses) {
    const pickupId = address.pickupId || address.id || `pickup-${randomUUID()}`
    address.id = pickupId
    address.pickupId = pickupId
    address.pickup = address.pickup || {}
    address.pickup.id ||= address.addressId || `address-${pickupId}`
    address.addressId ||= address.pickup.id
    address.pickup.contactPhone ||= address.pickup.contactNumber || ''
    if (!address.rto && address.rtoAddress) address.rto = address.rtoAddress
    address.isPickupEnabled ??= true
    address.isPrimary ??= false
    address.isRTOSame ??= !address.rto
  }
  if (addresses.length && !addresses.some((address) => address.isPrimary)) addresses[0].isPrimary = true
}
state.customServiceabilityLocations ??= []
state.serviceabilityOverrides ??= {}
state.deletedServiceabilityLocationIds ??= []
state.plans ??= defaultState.plans
state.preferences ??= defaultState.preferences
state.walletTransactions ??= []

// Reset the historical seeded balance once. The marker keeps genuine future
// wallet adjustments intact across restarts.
if (Number(state.walletResetVersion || 0) < 1) {
  for (const seller of state.users) seller.walletBalance = 0
  state.walletTransactions = state.walletTransactions.filter((transaction) => (
    transaction.reason !== 'opening_balance' && !String(transaction.id || '').startsWith('wallet-opening-')
  ))
  state.walletResetVersion = 1
  stateNeedsSave = true
}
state.manualCouriers ??= []
state.zones ??= []
state.shippingRates ??= []
state.b2bZoneRates ??= []
state.manualShipments ??= []
state.manualShipmentEvents ??= []
state.manualShipmentLegs ??= []
if (!state.manualCouriers.some((item) => item.id === 'manual-punjabship')) state.manualCouriers.push(defaultManualCourier())
for (const zone of [...DEFAULT_B2C_ZONES, ...DEFAULT_B2B_ZONES]) {
  const existingZone = state.zones.find((item) => item.id === zone.id)
  if (!existingZone) state.zones.push(zone)
  else if (zone.states?.length && !existingZone.states?.length) existingZone.states = zone.states
}
if (!state.shippingRates.some((item) => item.id === 'rate-punjabship-b2c')) state.shippingRates.push(defaultB2cRate())
if (!state.shippingRates.some((item) => item.id === 'rate-punjabship-b2b')) state.shippingRates.push(defaultB2bRate())
for (const rate of defaultB2bZoneRates()) {
  if (!state.b2bZoneRates.some((item) => item.id === rate.id)) state.b2bZoneRates.push(rate)
}
for (const seller of state.users) {
  if (seller.approved && (seller.businessType || []).map((item) => String(item).toLowerCase()).includes('b2b')) {
    seller.currentB2BPlanId ||= 'starter-b2b'
    seller.currentB2BPlanName ||= 'Starter B2B'
  }
}

for (const seller of state.users) {
  if (
    Number(seller.walletBalance ?? 0) !== 0 &&
    !state.walletTransactions.some((transaction) => transaction.user_id === seller.id)
  ) {
    state.walletTransactions.push({
      id: `wallet-opening-${seller.id}`,
      wallet_id: `wallet-${seller.id}`,
      user_id: seller.id,
      amount: Math.abs(Number(seller.walletBalance ?? 0)),
      type: Number(seller.walletBalance ?? 0) >= 0 ? 'credit' : 'debit',
      reason: 'opening_balance',
      category: 'wallet_recharge',
      ref: `OPENING-${seller.id}`,
      meta: { source: 'PunjabShip', notes: 'Opening wallet balance' },
      currency: 'INR',
      created_at: seller.createdAt || new Date().toISOString(),
      balance_after: Number(seller.walletBalance ?? 0),
    })
  }
}

const save = () => {
  void stateStore.save(state).catch((error) => {
    console.error('Unable to persist PunjabShip state.', error)
  })
}
if (stateNeedsSave) await stateStore.save(state)
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

const walletBalanceOf = (seller) => Number(seller?.walletBalance ?? 0)
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
  if (/^https:\/\/(www\.)?punjabship\.com$/.test(origin)) return origin
  if (/^https:\/\/admin\.punjabship\.com$/.test(origin)) return origin
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
  const walletBalance = Number(seller?.walletBalance ?? 0)
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
  const isReady = Boolean(
    result.onboardingComplete &&
    result.hasCompanyInfo &&
    result.approved &&
    result.kycVerified &&
    result.hasAssignedPlan &&
    result.hasPickupAddress
  )
  return { ...result, isReady }
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
    city: order.city || order.consignee?.city || order.shipping_details?.city || '',
    state: order.state || order.consignee?.state || order.shipping_details?.state || '',
    pincode: order.pincode || order.consignee?.pincode || order.shipping_details?.pincode || '',
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
  const statusCounts = filtered.reduce((counts, order) => {
    const key = order.order_status || 'pending'
    counts[key] = (counts[key] || 0) + 1
    counts.all += 1
    return counts
  }, { all: 0 })
  if (status) filtered = filtered.filter((order) => String(order.order_status || '').toLowerCase() === status)
  filtered.sort((a, b) => sortOrder === 'asc'
    ? String(a.created_at || '').localeCompare(String(b.created_at || ''))
    : String(b.created_at || '').localeCompare(String(a.created_at || '')))
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

const normalizeBusinessType = (value) => String(value || 'b2c').trim().toLowerCase()
const assignDefaultPlans = (seller) => {
  const types = new Set((seller.businessType || []).map(normalizeBusinessType))
  if (!types.size) types.add('b2c')
  if (types.has('d2c')) types.add('b2c')
  for (const businessType of ['b2c', 'b2b']) {
    if (!types.has(businessType)) continue
    const idField = businessType === 'b2b' ? 'currentB2BPlanId' : 'currentB2CPlanId'
    const nameField = businessType === 'b2b' ? 'currentB2BPlanName' : 'currentB2CPlanName'
    if (seller[idField]) continue
    const plan = state.plans.find((item) => normalizeBusinessType(item.business_type) === businessType && item.is_active !== false)
    if (!plan) continue
    seller[idField] = plan.id
    seller[nameField] = plan.name
    if (businessType === 'b2c') {
      seller.currentPlanId = plan.id
      seller.currentPlanName = plan.name
    }
  }
}
const markKycDocuments = (kyc, status) => {
  for (const [key, value] of Object.entries(kyc || {})) {
    if (key.endsWith('Url') && value) kyc[`${key.slice(0, -3)}Status`] = status
  }
}
const normalizePincodes = (values) => Array.from(new Set((Array.isArray(values) ? values : [])
  .map((value) => String(value || '').replace(/\D/g, '').slice(0, 6))
  .filter((value) => /^[1-9]\d{5}$/.test(value))))
const courierShipmentCount = (courier) => state.manualShipments.filter((item) => item.manualCourierId === courier.id).length
const courierPincodes = (courier) => courier.pincodeScope === 'all_india'
  ? serviceabilityLocations().map((item) => item.pincode).filter((item) => !(courier.excludedPincodes || []).includes(item))
  : normalizePincodes(courier.pincodes)
const manualCourierRow = (courier) => ({
  ...courier,
  pincodeCount: courier.pincodeScope === 'all_india'
    ? new Set(getSeededServiceabilityLocations().map((item) => item.pincode).filter((value) => !(courier.excludedPincodes || []).includes(value))).size
    : normalizePincodes(courier.pincodes).length,
  shipmentCount: courierShipmentCount(courier),
})

let pincodeOfficeMap = null
const pincodeOfficeRank = (office) => ({ HO: 3, SO: 2, PO: 2, BO: 1 }[String(office?.officeType || '').toUpperCase()] || 0)
const officeForPincode = (pincode) => {
  if (!pincodeOfficeMap) {
    pincodeOfficeMap = new Map()
    for (const office of loadIndiaPostData()) {
      const key = String(office.pincode)
      const current = pincodeOfficeMap.get(key)
      if (
        !current ||
        pincodeOfficeRank(office) > pincodeOfficeRank(current) ||
        (pincodeOfficeRank(office) === pincodeOfficeRank(current) && String(office.area || '').length < String(current.area || '').length)
      ) pincodeOfficeMap.set(key, office)
    }
  }
  return pincodeOfficeMap.get(String(pincode || '').trim()) || null
}
const normalizedState = (pincode) => String(officeForPincode(pincode)?.state || '').trim().toLowerCase()
const SPECIAL_STATES = new Set(['andaman & nicobar islands', 'arunachal pradesh', 'assam', 'jammu & kashmir', 'ladakh', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'])
const METRO_PREFIXES = ['110', '122', '201', '400', '560', '600', '700', '500', '411', '380']
const b2cZoneFor = (origin, destination) => {
  const originState = normalizedState(origin)
  const destinationState = normalizedState(destination)
  if (String(origin).slice(0, 3) === String(destination).slice(0, 3)) return state.zones.find((item) => item.id === 'b2c-local')
  if (originState && originState === destinationState) return state.zones.find((item) => item.id === 'b2c-state')
  if (SPECIAL_STATES.has(destinationState)) return state.zones.find((item) => item.id === 'b2c-special')
  if (METRO_PREFIXES.includes(String(destination).slice(0, 3))) return state.zones.find((item) => item.id === 'b2c-metro')
  return state.zones.find((item) => item.id === 'b2c-roi')
}
const B2B_STATE_ZONE = {
  'punjab': 'North', 'haryana': 'North', 'himachal pradesh': 'North', 'delhi': 'North', 'uttar pradesh': 'North', 'uttarakhand': 'North', 'chandigarh': 'North', 'rajasthan': 'North',
  'gujarat': 'West', 'maharashtra': 'West', 'goa': 'West', 'dadra & nagar haveli': 'West', 'daman & diu': 'West',
  'karnataka': 'South', 'kerala': 'South', 'tamil nadu': 'South', 'telangana': 'South', 'andhra pradesh': 'South', 'puducherry': 'South',
  'west bengal': 'East', 'odisha': 'East', 'bihar': 'East', 'jharkhand': 'East',
  'madhya pradesh': 'Central', 'chhattisgarh': 'Central',
}
const b2bZoneFor = (destination) => {
  const stateName = normalizedState(destination)
  const name = SPECIAL_STATES.has(stateName) ? 'North East' : (B2B_STATE_ZONE[stateName] || 'North East')
  return state.zones.find((item) => item.business_type === 'b2b' && item.name === name)
}
const courierSupportsRoute = (courier, origin, destination, shipmentType, paymentType, weightKg) => {
  if (!courier.isEnabled) return false
  if (shipmentType === 'b2b' ? !courier.supportsB2b : !courier.supportsB2c) return false
  if (paymentType === 'cod' ? !courier.supportsCod : !courier.supportsPrepaid) return false
  // The courier minimum is a billing slab, not a serviceability cutoff. Orders
  // below it (including a temporarily missing/zero UI weight) are quoted at the
  // minimum chargeable weight by manualCourierQuote below.
  if (weightKg > Number(courier.maxWeightKg || Infinity)) return false
  if (courier.pincodeScope === 'all_india') return Boolean(officeForPincode(origin) && officeForPincode(destination))
  const covered = new Set(normalizePincodes(courier.pincodes))
  return covered.has(String(origin)) && covered.has(String(destination))
}
const calculateB2cFreight = (rate, zoneName, weightKg) => {
  const slab = rate.zone_slabs?.[zoneName]?.forward?.[0]
  if (!slab) return null
  const baseWeight = Number(slab.weight_to || rate.min_weight || 0.5)
  const excess = Math.max(0, weightKg - baseWeight)
  const increments = Math.ceil(excess / Number(slab.extra_weight_unit || 0.5))
  return Number(slab.rate || 0) + increments * Number(slab.extra_rate || 0)
}
const manualCourierQuote = (courier, rate, body) => {
  const shipmentType = normalizeBusinessType(body.shipment_type || body.shipmentType)
  const origin = String(body.origin || body.pickupPincode || '')
  const destination = String(body.destination || body.deliveryPincode || '')
  const weightKg = Math.max(0, Number(body.weight || 0) / 1000)
  const paymentType = String(body.payment_type || (Number(body.cod) ? 'cod' : 'prepaid')).toLowerCase()
  if (!courierSupportsRoute(courier, origin, destination, shipmentType, paymentType, weightKg)) return null
  const zone = shipmentType === 'b2b' ? b2bZoneFor(destination) : b2cZoneFor(origin, destination)
  if (!zone) return null
  const chargeableWeight = Math.max(weightKg, Number(rate.min_weight || courier.minWeightKg || 0.5))
  const zoneRate = rate.rates?.[zone.name] || {}
  const freight = shipmentType === 'b2b'
    ? chargeableWeight * Number(zoneRate.forward_per_kg || 0)
    : calculateB2cFreight(rate, zone.name, chargeableWeight)
  if (!Number.isFinite(freight) || freight <= 0) return null
  const orderAmount = Number(body.order_amount || body.orderAmount || 0)
  const codCharge = paymentType === 'cod'
    ? Math.max(Number(rate.cod_charges || 0), orderAmount * Number(rate.cod_percent || 0) / 100)
    : 0
  const other = Number(rate.other_charges || 0)
  const subtotal = Number((freight + codCharge + other).toFixed(2))
  const gstAmount = Number((subtotal * 0.18).toFixed(2))
  const total = Number((subtotal + gstAmount).toFixed(2))
  const optionKey = `manual:${courier.id}:${shipmentType}:${rate.id}`
  return {
    id: courier.courierId, courier_id: courier.courierId, name: courier.displayName,
    displayName: courier.displayName, courier_option_key: optionKey,
    integration_type: 'manual', serviceProvider: 'manual', mode: rate.mode,
    rate: Number(freight.toFixed(2)), courier_cost_estimate: total,
    chargeable_weight: Number((chargeableWeight * 1000).toFixed(0)),
    minWeight: rate.min_weight, max_slab_weight: courier.maxWeightKg,
    cod_charges: codCharge, other_charges: other, gst_percent: 18, gst_amount: gstAmount,
    total_charges_without_gst: subtotal, total_charges_with_gst: total,
    total_charges: total, wallet_debit_amount: total, booking_available: true, can_book: true,
    approxZone: { id: zone.id, code: zone.code, name: zone.name }, zone_id: zone.id,
    localRates: { forward: { shipping_rate_id: rate.id, zone_id: zone.id, forward_charges: Number(freight.toFixed(2)), cod_charges: codCharge, other_charges: other, gst_percent: 18, gst_amount: gstAmount, total_charges: total, wallet_debit_amount: total } },
    provider_serviceability: { provider: 'PunjabShip Manual', booking_available: true, can_book: true },
    edd: shipmentType === 'b2b' ? '4-8 business days' : '2-6 business days',
  }
}
const availableManualQuotes = (body) => {
  const businessType = normalizeBusinessType(body.shipment_type || body.shipmentType)
  return state.manualCouriers.flatMap((courier) => {
    const rate = state.shippingRates.find((item) => Number(item.courier_id) === Number(courier.courierId) && normalizeBusinessType(item.businessType) === businessType)
    const quote = rate ? manualCourierQuote(courier, rate, body) : null
    return quote ? [quote] : []
  })
}

const isManualCourierOrder = (body) => String(`${body?.integration_type || ''} ${body?.courier_partner || ''} ${body?.courier_option_key || ''}`).toLowerCase().includes('manual') || state.manualCouriers.some((item) => Number(item.courierId) === Number(body?.courier_id))
const orderDestinationPincode = (order) => String(order.pincode || order.consignee?.pincode || order.shipping_details?.pincode || '')
const orderPickupPincode = (order) => String(order.pickup?.pincode || order.pickup_details?.pincode || order.pickupLocationPincode || '')
const manualShipmentRow = (shipment) => {
  const order = state.orders.find((item) => item.id === shipment.orderId) || {}
  const seller = state.users.find((item) => item.id === order.user_id) || {}
  return {
    ...shipment, orderNumber: order.order_number || order.order_id || order.id,
    orderType: order.type || 'b2c', paymentType: order.payment_type || order.order_type || 'prepaid',
    orderAmount: Number(order.order_amount || order.total_amount || 0), merchantEmail: seller.email || '',
    buyerName: order.buyer_name || order.customer_name || order.consignee?.name || '',
    destinationPincode: orderDestinationPincode(order), createdAt: shipment.createdAt,
  }
}
const createManualShipmentOrder = (seller, body, type) => {
  const courier = state.manualCouriers.find((item) => Number(item.courierId) === Number(body.courier_id)) || state.manualCouriers.find((item) => String(body.courier_option_key || '').includes(item.id))
  if (!courier?.isEnabled || (type === 'b2b' ? !courier.supportsB2b : !courier.supportsB2c)) throw Object.assign(new Error('Selected manual courier is not available for this shipment.'), { statusCode: 400 })
  if (state.orders.some((item) => String(item.order_number) === String(body.order_number))) throw Object.assign(new Error('Order number already exists.'), { statusCode: 409 })
  const now = new Date().toISOString()
  const orderId = `manual-order-${randomUUID()}`
  const localAwb = `PSM${Date.now()}${Math.floor(Math.random() * 900 + 100)}`
  const freight = Number(body.walletDebitAmount || body.wallet_debit_amount || body.total_charges_with_gst || body.forwardCharges || body.freight_charges || 0)
  if (freight > walletBalanceOf(seller)) throw Object.assign(new Error('Insufficient wallet balance for this shipment.'), { statusCode: 400 })
  const order = {
    ...body, id: orderId, order_id: body.order_number, user_id: seller.id, type,
    integration_type: 'manual', courier_partner: courier.displayName, courier_id: courier.courierId,
    courier_option_key: body.courier_option_key || `manual:${courier.id}:${type}`,
    awb_number: localAwb, local_awb: localAwb, status: 'booked', order_status: 'booked',
    freight_charges: freight, wallet_debit_amount: freight,
    buyer_name: body.buyer_name || body.consignee?.name || body.name || '',
    buyer_phone: body.buyer_phone || body.consignee?.phone || body.phone || '',
    created_at: now, updated_at: now,
  }
  state.orders.unshift(order)
  const shipment = {
    id: `manual-shipment-${randomUUID()}`, orderId, manualCourierId: courier.id,
    localAwb, commercialCourierName: courier.displayName, fulfilmentMode: 'unassigned',
    operationStatus: 'booked', createdAt: now, updatedAt: now,
  }
  state.manualShipments.unshift(shipment)
  state.manualShipmentEvents.unshift({ id: `event-${randomUUID()}`, shipmentId: shipment.id, statusCode: 'booked', statusText: 'Shipment booked', location: '', remarks: '', eventAt: now, source: 'system' })
  order.tracking_events = [{ status_code: 'booked', event_time: now, message: 'Shipment booked', location: '' }]
  if (freight > 0) {
    seller.walletBalance = Number((walletBalanceOf(seller) - freight).toFixed(2))
    state.walletTransactions.unshift({ id: `wallet-transaction-${randomUUID()}`, wallet_id: walletIdOf(seller), user_id: seller.id, amount: freight, type: 'debit', reason: 'shipment_booking', category: 'shipping_charges', ref: localAwb, meta: { courier_partner: courier.displayName, order_id: orderId }, currency: 'INR', created_at: now, balance_after: seller.walletBalance })
  }
  return { order, shipment }
}

const pdfEscape = (value) => String(value ?? '').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)').replace(/[^\x20-\x7E]/g, '')
const pdfText = (x, y, size, value, bold = false) => `BT /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${pdfEscape(value)}) Tj ET`
const pdfLine = (x1, y1, x2, y2, width = 1) => `${width} w ${x1} ${y1} m ${x2} ${y2} l S`
const pdfRect = (x, y, width, height, fill = false) => `${x} ${y} ${width} ${height} re ${fill ? 'f' : 'S'}`
const createPdf = (width, height, commands) => {
  const stream = commands.join('\n')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ]
  let output = '%PDF-1.4\n'
  const offsets = [0]
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(output))
    output += `${index + 1} 0 obj\n${object}\nendobj\n`
  })
  const xref = Buffer.byteLength(output)
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  output += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('')
  output += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return Buffer.from(output)
}
const documentFileName = (order, type) => `${String(order.order_number || order.order_id || order.id).replace(/[^A-Za-z0-9_-]/g, '_')}-${type}.pdf`
const createOrderDocumentPdf = (order, type) => {
  const seller = state.users.find((item) => item.id === order.user_id) || {}
  const pickup = order.pickup || order.pickup_details || {}
  const consignee = order.consignee || order.shipping_details || {}
  const orderNumber = order.order_number || order.order_id || order.id
  const awb = order.awb_number || order.local_awb || '-'
  const courier = order.courier_partner || 'PunjabShip Manual'
  const recipient = order.buyer_name || order.customer_name || consignee.name || '-'
  const phone = order.buyer_phone || order.customer_phone || consignee.phone || '-'
  const address = consignee.address || order.address || order.customer_address || ''
  const cityLine = [consignee.city || order.city, consignee.state || order.state, consignee.pincode || order.pincode].filter(Boolean).join(', ')
  const pickupName = pickup.addressNickname || pickup.name || seller.companyInfo?.businessName || 'PunjabShip Merchant'
  const pickupLine = [pickup.address || pickup.addressLine1, pickup.city, pickup.state, pickup.pincode].filter(Boolean).join(', ')
  const amount = Number(order.order_amount || order.total_amount || 0)
  const freight = Number(order.freight_charges || order.wallet_debit_amount || 0)
  const rawWeight = Number(order.weight || order.chargeable_weight || 0)
  const weight = String(order.type || '').toLowerCase() === 'b2c' && rawWeight > 50 ? rawWeight / 1000 : rawWeight
  const products = Array.isArray(order.products) ? order.products : []
  const now = new Date().toISOString().slice(0, 10)

  if (type === 'label') {
    const commands = ['0 G', '0 g', pdfRect(12, 12, 264, 408), pdfRect(20, 372, 248, 45, true), '1 g', pdfText(30, 394, 20, 'PUNJABSHIP', true), pdfText(30, 379, 9, 'SHIPMENT LABEL', true), '0 g']
    commands.push(pdfText(22, 350, 9, 'AWB', true), pdfText(22, 326, 18, awb, true), pdfText(22, 306, 9, `ORDER: ${orderNumber}`), pdfText(22, 291, 9, `COURIER: ${courier}`), pdfText(22, 276, 9, `PAYMENT: ${String(order.payment_type || order.order_type || 'prepaid').toUpperCase()}`), pdfLine(20, 263, 268, 263))
    commands.push(pdfText(22, 246, 10, 'DELIVER TO', true), pdfText(22, 228, 13, recipient, true), pdfText(22, 212, 9, phone), pdfText(22, 196, 9, address.slice(0, 48)), pdfText(22, 180, 9, cityLine.slice(0, 48)), pdfLine(20, 165, 268, 165))
    commands.push(pdfText(22, 148, 10, 'SHIP FROM', true), pdfText(22, 131, 10, pickupName.slice(0, 42), true), pdfText(22, 115, 8, pickupLine.slice(0, 52)), pdfText(22, 92, 9, `WEIGHT: ${weight || 0.5} kg`), pdfText(160, 92, 9, `VALUE: INR ${amount.toFixed(2)}`))
    for (let i = 0; i < 58; i += 1) if (i % 3 !== 1) commands.push(pdfRect(28 + i * 3.65, 35, i % 4 === 0 ? 2.2 : 1.1, 38, true))
    commands.push(pdfText(74, 20, 7, awb))
    return createPdf(288, 432, commands)
  }

  const commands = ['0 G', '0 g', pdfRect(28, 28, 539, 786), pdfRect(28, 752, 539, 62, true), '1 g', pdfText(48, 784, 23, 'PUNJABSHIP', true), pdfText(48, 765, 10, type === 'manifest' ? 'DISPATCH MANIFEST' : 'COMMERCIAL INVOICE', true), '0 g']
  if (type === 'manifest') {
    commands.push(pdfText(48, 724, 10, `Manifest ID: ${order.manifest_id || `MNF-${String(orderNumber).slice(-10)}`}`, true), pdfText(360, 724, 10, `Date: ${now}`), pdfText(48, 704, 10, `Courier: ${courier}`), pdfText(48, 686, 9, `Pickup: ${pickupName} - ${pickupLine}`), pdfLine(48, 670, 547, 670))
    commands.push(pdfText(48, 650, 9, 'AWB', true), pdfText(195, 650, 9, 'ORDER', true), pdfText(330, 650, 9, 'RECIPIENT', true), pdfText(472, 650, 9, 'PINCODE', true), pdfLine(48, 642, 547, 642))
    commands.push(pdfText(48, 622, 9, awb), pdfText(195, 622, 9, String(orderNumber).slice(0, 20)), pdfText(330, 622, 9, recipient.slice(0, 22)), pdfText(472, 622, 9, consignee.pincode || order.pincode || '-'), pdfLine(48, 608, 547, 608))
    commands.push(pdfText(48, 570, 10, 'Shipment Summary', true), pdfText(48, 550, 9, 'Packages: 1'), pdfText(180, 550, 9, `Weight: ${weight || 0.5} kg`), pdfText(330, 550, 9, `Declared Value: INR ${amount.toFixed(2)}`), pdfText(48, 490, 9, 'Declaration: The shipment details above are accurate and ready for dispatch.'), pdfLine(48, 410, 225, 410), pdfLine(370, 410, 547, 410), pdfText(48, 394, 8, 'Merchant Signature'), pdfText(370, 394, 8, 'PunjabShip Operations'))
  } else {
    commands.push(pdfText(48, 724, 10, `Invoice / Order No: ${orderNumber}`, true), pdfText(380, 724, 10, `Date: ${now}`), pdfText(48, 698, 10, 'BILL TO', true), pdfText(48, 680, 11, recipient, true), pdfText(48, 663, 9, `${address} ${cityLine}`.slice(0, 75)), pdfText(48, 646, 9, `Phone: ${phone}`), pdfLine(48, 626, 547, 626))
    commands.push(pdfText(48, 606, 9, 'DESCRIPTION', true), pdfText(350, 606, 9, 'QTY', true), pdfText(430, 606, 9, 'RATE', true), pdfText(505, 606, 9, 'AMOUNT', true), pdfLine(48, 596, 547, 596))
    let y = 574
    const rows = products.length ? products.slice(0, 8) : [{ name: 'Shipment goods', quantity: 1, price: amount }]
    for (const product of rows) {
      const name = product.productName || product.name || 'Shipment goods'
      const qty = Number(product.quantity || 1)
      const price = Number(product.price || 0)
      commands.push(pdfText(48, y, 9, String(name).slice(0, 45)), pdfText(360, y, 9, qty), pdfText(430, y, 9, price.toFixed(2)), pdfText(505, y, 9, (qty * price).toFixed(2)))
      y -= 22
    }
    commands.push(pdfLine(330, 365, 547, 365), pdfText(350, 340, 10, 'Subtotal', true), pdfText(490, 340, 10, `INR ${amount.toFixed(2)}`), pdfText(350, 318, 10, 'Shipping', true), pdfText(490, 318, 10, `INR ${freight.toFixed(2)}`), pdfLine(330, 304, 547, 304), pdfText(350, 278, 12, 'Grand Total', true), pdfText(475, 278, 12, `INR ${(amount + freight).toFixed(2)}`, true), pdfText(48, 215, 9, `AWB: ${awb}`), pdfText(48, 198, 9, `Courier: ${courier}`), pdfText(48, 150, 9, 'This is a computer-generated invoice and does not require a physical signature.'), pdfText(48, 95, 9, 'Thank you for shipping with PunjabShip.', true))
  }
  return createPdf(595, 842, commands)
}

const persistOrderDocument = async (order, type) => {
  if (!isStorageConfigured()) return `manual-doc:${type}:${order.id}`
  const pdf = createOrderDocumentPdf(order, type)
  const key = createObjectKey({ ownerId: order.user_id, folder: `documents-${type}`, filename: documentFileName(order, type) })
  await putObject({ key, body: pdf, contentType: 'application/pdf', metadata: { documentType: type, orderId: String(order.id) } })
  return key
}

const parseMultipart = (raw, contentType) => new Promise((resolve, reject) => {
  const result = {}
  let parseError
  let parser
  try {
    parser = Busboy({
      headers: { 'content-type': contentType },
      limits: { files: 1, fileSize: 10 * 1024 * 1024, fields: 20, fieldSize: 256 * 1024 },
    })
  } catch (error) {
    reject(error)
    return
  }
  parser.on('field', (name, value) => { result[name] = value })
  parser.on('file', (name, stream, info) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('limit', () => { parseError = Object.assign(new Error('File exceeds the 10 MB upload limit.'), { statusCode: 413 }) })
    stream.on('end', () => {
      result[name] = { buffer: Buffer.concat(chunks), filename: info.filename, mimeType: info.mimeType, encoding: info.encoding }
    })
  })
  parser.on('filesLimit', () => { parseError = Object.assign(new Error('Upload one file at a time.'), { statusCode: 400 }) })
  parser.on('error', reject)
  parser.on('finish', () => parseError ? reject(parseError) : resolve(result))
  parser.end(raw)
})

const allowedUploadMimeTypes = new Set([
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
  'text/csv', 'application/csv', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const allowedUploadExtensions = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.csv', '.doc', '.docx'])
const uploadFile = async ({ file, folder, ownerId, publicObject = false }) => {
  if (!isStorageConfigured()) throw Object.assign(new Error('Cloud storage is not configured.'), { statusCode: 503 })
  if (!file?.buffer?.length) throw Object.assign(new Error('Select a file to upload.'), { statusCode: 400 })
  const filename = String(file.filename || 'file')
  const extension = filename.includes('.') ? `.${filename.split('.').pop().toLowerCase()}` : ''
  if (!allowedUploadMimeTypes.has(file.mimeType) || !allowedUploadExtensions.has(extension)) {
    throw Object.assign(new Error('Unsupported file type. Upload PDF, JPG, PNG, WEBP, CSV, DOC, or DOCX files only.'), { statusCode: 415 })
  }
  const key = createObjectKey({ ownerId, folder, filename, publicObject })
  await putObject({ key, body: file.buffer, contentType: file.mimeType, metadata: { originalName: filename.replace(/[^\x20-\x7E]/g, '').slice(0, 120) } })
  return key
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
    const chunks = []
    let rawSize = 0
    for await (const chunk of req) {
      rawSize += chunk.length
      if (rawSize > 22 * 1024 * 1024) throw Object.assign(new Error('Request body exceeds the 22 MB limit.'), { statusCode: 413 })
      chunks.push(chunk)
    }
    const raw = Buffer.concat(chunks)
    const contentType = String(req.headers['content-type'] || '')
    const body = !raw.length ? {} : contentType.includes('multipart/form-data')
      ? await parseMultipart(raw, contentType)
      : JSON.parse(raw.toString('utf8'))
    console.log(req.method, path)

    if (path === '' || path === '/api/health') return send({ success: true, mode: 'punjabship-demo-api', storage: stateStore.mode, integrations: { shipglobal: { configured: shipGlobal.isConfigured(), service: SHIPGLOBAL_SERVICE }, email: mailStatus(), objectStorage: storageStatus() } })
    if (path === '/api/auth/request-otp' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send({ error: 'Enter a valid email address.' }, 400)
      const now = Date.now()
      const pending = state.pendingOtps[email]
      if (pending?.requestedAt && pending.requestedAt > now - 60 * 1000) {
        return send({ error: 'Please wait one minute before requesting another code.' }, 429)
      }
      const requester = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim()
      const recentAttempts = (otpRequestAttempts.get(requester) || []).filter((time) => time > now - 10 * 60 * 1000)
      if (recentAttempts.length >= 5) return send({ error: 'Too many verification codes requested. Please try again later.' }, 429)
      const otp = isMailConfigured() ? String(randomInt(100000, 1000000)) : DEMO_OTP
      if (isMailConfigured()) await sendOtpEmail({ to: email, otp, expiresMinutes: 10 })
      otpRequestAttempts.set(requester, [...recentAttempts, now])
      state.pendingOtps[email] = { otp, requestedAt: now, expiresAt: now + 10 * 60 * 1000 }
      save()
      return send({
        message: isMailConfigured() ? 'Verification code sent to your email.' : 'Verification code generated.',
        ...(isMailConfigured() ? {} : { demoOtp: otp }),
        expiresAt: new Date(state.pendingOtps[email].expiresAt).toISOString(),
      })
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
      const seller = state.users.find((item) => item.email === email)
      const validPassword = seller?.passwordHash
        ? passwordMatches(String(body.password || ''), seller.passwordHash)
        : email === CLIENT_EMAIL && body.password === CLIENT_PASSWORD
      if (!seller || !validPassword) return send({ error: 'Invalid email or password.' }, 401)
      return send(authPayload(seller))
    }
    if (path === '/api/auth/forgot-password/request' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send({ error: 'Enter a valid email address.' }, 400)
      const seller = state.users.find((item) => item.email === email)
      if (seller) {
        const otp = isMailConfigured() ? String(randomInt(100000, 1000000)) : DEMO_OTP
        if (isMailConfigured()) await sendPasswordResetEmail({ to: email, otp, expiresMinutes: 10 })
        state.passwordResetOtps[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 }
        save()
      }
      return send({ message: 'If that account exists, a password reset code has been sent.' })
    }
    if (path === '/api/auth/forgot-password/verify' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase()
      const pending = state.passwordResetOtps[email]
      if (!pending || pending.expiresAt < Date.now() || String(body.otp || '') !== String(pending.otp)) {
        return send({ error: 'That reset code is invalid or expired.' }, 401)
      }
      const resetToken = randomBytes(32).toString('hex')
      state.passwordResetTokens[email] = { token: resetToken, expiresAt: Date.now() + 10 * 60 * 1000 }
      delete state.passwordResetOtps[email]
      save()
      return send({ message: 'Reset code verified.', resetToken })
    }
    if (path === '/api/auth/forgot-password/reset' && req.method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase()
      const pending = state.passwordResetTokens[email]
      const password = String(body.newPassword || '')
      if (!pending || pending.expiresAt < Date.now() || String(body.resetToken || '') !== pending.token) {
        return send({ error: 'That password reset session is invalid or expired.' }, 401)
      }
      if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[@$!%*?&]/.test(password)) {
        return send({ error: 'Password does not meet the security requirements.' }, 400)
      }
      const seller = state.users.find((item) => item.email === email)
      if (!seller) return send({ error: 'Account not found.' }, 404)
      seller.passwordHash = hashPassword(password)
      seller.updatedAt = new Date().toISOString()
      delete state.passwordResetTokens[email]
      save()
      return send({ message: 'Your password has been updated.' })
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
      if (!String(body.selfieUrl || '').trim()) return send({ success: false, message: 'A live face selfie is required before KYC submission.' }, 400)
      const previousKyc = seller.domesticKyc || {}
      const nextKyc = { ...previousKyc, ...body, status: 'verification_in_progress', rejectionReason: null, updatedAt: new Date().toISOString() }
      for (const [key, value] of Object.entries(body)) {
        if (key.endsWith('Url') && value && value !== previousKyc[key]) nextKyc[`${key.slice(0, -3)}Status`] = 'verification_in_progress'
      }
      seller.domesticKyc = nextKyc
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
      const addresses = state.pickupAddresses[seller.id] || []
      const pickupId = `pickup-${randomUUID()}`
      const isPrimary = body.isPrimary === true || addresses.length === 0
      const pickup = { ...(body.pickup || {}), id: body.pickup?.id || `address-${randomUUID()}` }
      const rto = body.rtoAddress ? { ...body.rtoAddress, id: body.rtoAddress.id || `address-${randomUUID()}` } : null
      const address = {
        ...body,
        id: pickupId,
        pickupId,
        addressId: pickup.id,
        rtoAddressId: rto?.id || null,
        userId: seller.id,
        pickup,
        rto,
        isPrimary,
        isPickupEnabled: body.isPickupEnabled !== false,
        isRTOSame: !rto,
        createdAt: now,
        updatedAt: now,
      }
      delete address.rtoAddress
      if (isPrimary) addresses.forEach((item) => { item.isPrimary = false })
      state.pickupAddresses[seller.id] = [...addresses, address]
      save()
      return send(address, 201)
    }
    const pickupMatch = path.match(/^\/api\/pickup-addresses\/([^/]+)$/)
    if (pickupMatch && req.method === 'PATCH') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      const addresses = state.pickupAddresses[seller.id] || []
      const pickupId = decodeURIComponent(pickupMatch[1])
      const address = addresses.find((item) => item.id === pickupId || item.pickupId === pickupId)
      if (!address) return send({ error: 'Pickup address not found.' }, 404)
      if (body.isPrimary === true) addresses.forEach((item) => { item.isPrimary = item === address })
      const updates = { ...body }
      if ('rtoAddress' in updates) {
        updates.rto = updates.rtoAddress || null
        updates.rtoAddressId = updates.rto?.id || null
        updates.isRTOSame = !updates.rto
        delete updates.rtoAddress
      }
      Object.assign(address, updates, { id: address.id || pickupId, pickupId: address.pickupId || pickupId, updatedAt: new Date().toISOString() })
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
    if (path === '/api/payment-options' && req.method === 'GET') {
      return send(state.paymentOptions)
    }
    if (path === '/api/admin/payment-options' && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      return send({ success: true, settings: state.paymentOptions })
    }
    if (path === '/api/admin/payment-options' && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const next = {
        codEnabled: body.codEnabled ?? state.paymentOptions.codEnabled,
        prepaidEnabled: body.prepaidEnabled ?? state.paymentOptions.prepaidEnabled,
        minWalletRecharge: Number(body.minWalletRecharge ?? state.paymentOptions.minWalletRecharge),
        gstPercent: Number(body.gstPercent ?? state.paymentOptions.gstPercent),
      }
      if (!next.codEnabled && !next.prepaidEnabled) return send({ success: false, message: 'Enable COD, prepaid, or both.' }, 400)
      if (!Number.isFinite(next.minWalletRecharge) || next.minWalletRecharge < 0 || !Number.isFinite(next.gstPercent) || next.gstPercent < 0) {
        return send({ success: false, message: 'Wallet recharge and GST values must be zero or greater.' }, 400)
      }
      state.paymentOptions = next
      save()
      return send({ success: true, settings: state.paymentOptions, message: 'Payment options updated.' })
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
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const seller = state.users.find((item) => item.id === approveUserMatch[1])
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      seller.approved = true
      seller.approvedAt = new Date().toISOString()
      seller.updatedAt = seller.approvedAt
      assignDefaultPlans(seller)
      save()
      return send({ success: true, message: 'Seller account approved.', user: seller })
    }
    if (path === '/api/plans' && req.method === 'GET') {
      const businessType = String(requestUrl.searchParams.get('businessType') || '').toLowerCase()
      const status = String(requestUrl.searchParams.get('status') || '').toLowerCase()
      let plans = state.plans
      if (businessType) plans = plans.filter((item) => normalizeBusinessType(item.business_type) === businessType)
      if (status) plans = plans.filter((item) => status === 'active' ? item.is_active !== false : item.is_active === false)
      return send({ success: true, data: plans })
    }
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
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const seller = state.users.find((item) => item.id === adminKycMatch[1])
      return seller ? send({ success: true, kyc: seller.domesticKyc || { status: 'pending' } }) : send({ error: 'Seller not found.' }, 404)
    }
    const approveKycMatch = path.match(/^\/api\/admin\/users\/kyc\/approve\/([^/]+)$/)
    if (approveKycMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const seller = state.users.find((item) => item.id === approveKycMatch[1])
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      if (!seller.domesticKyc?.selfieUrl) return send({ success: false, message: 'The seller must submit a live face selfie before KYC can be approved.' }, 400)
      const now = new Date().toISOString()
      seller.domesticKyc = { ...seller.domesticKyc, status: 'verified', rejectionReason: null, updatedAt: now }
      markKycDocuments(seller.domesticKyc, 'verified')
      seller.approved = true
      seller.approvedAt ||= now
      seller.updatedAt = now
      assignDefaultPlans(seller)
      save()
      return send({ success: true, message: 'KYC and seller account approved.', kyc: seller.domesticKyc, user: seller, readiness: merchantReadiness(seller) })
    }
    const rejectKycMatch = path.match(/^\/api\/admin\/users\/kyc\/(reject|revoke)\/([^/]+)$/)
    if (rejectKycMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const seller = state.users.find((item) => item.id === rejectKycMatch[2])
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      seller.domesticKyc = { ...seller.domesticKyc, status: rejectKycMatch[1] === 'reject' ? 'rejected' : 'verification_in_progress', rejectionReason: body.reason || null, updatedAt: new Date().toISOString() }
      seller.updatedAt = new Date().toISOString()
      save()
      return send({ success: true, message: `KYC ${rejectKycMatch[1]}d.`, kyc: seller.domesticKyc })
    }
    const documentKycMatch = path.match(/^\/api\/admin\/users\/kyc\/document\/(approve|reject)\/([^/]+)\/([^/]+)$/)
    if (documentKycMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const [, action, userId, rawKey] = documentKycMatch
      const key = decodeURIComponent(rawKey)
      const seller = state.users.find((item) => item.id === userId)
      if (!seller) return send({ error: 'Seller not found.' }, 404)
      if (!key.endsWith('Url') || !seller.domesticKyc?.[key]) return send({ error: 'KYC document not found.' }, 404)
      const statusKey = `${key.slice(0, -3)}Status`
      const rejectionKey = `${key.slice(0, -3)}RejectionReason`
      seller.domesticKyc[statusKey] = action === 'approve' ? 'verified' : 'rejected'
      seller.domesticKyc[rejectionKey] = action === 'approve' ? null : String(body.reason || '').trim() || 'Rejected by administrator'
      seller.domesticKyc.updatedAt = new Date().toISOString()
      seller.updatedAt = seller.domesticKyc.updatedAt
      save()
      return send({ success: true, message: `KYC document ${action}d.`, kyc: seller.domesticKyc })
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

    if (path === '/api/admin/manual-couriers' && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      return send({ success: true, data: state.manualCouriers.map(manualCourierRow) })
    }
    if (path === '/api/admin/manual-couriers' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const displayName = String(body.displayName || '').trim()
      const code = String(body.code || '').trim().toUpperCase()
      const minWeightKg = Number(body.minWeightKg)
      const maxWeightKg = Number(body.maxWeightKg)
      if (!displayName || !code) return send({ success: false, message: 'Courier name and internal code are required.' }, 400)
      if (state.manualCouriers.some((item) => item.code === code)) return send({ success: false, message: 'A courier with this internal code already exists.' }, 409)
      if (!Number.isFinite(minWeightKg) || !Number.isFinite(maxWeightKg) || minWeightKg <= 0 || maxWeightKg < minWeightKg) return send({ success: false, message: 'Enter a valid minimum and maximum weight.' }, 400)
      const pincodes = normalizePincodes(body.pincodes)
      const courier = {
        id: `manual-${randomUUID()}`, courierId: Math.max(DEFAULT_MANUAL_COURIER_ID, ...state.manualCouriers.map((item) => Number(item.courierId) || 0)) + 1,
        code, displayName, serviceProvider: 'manual', supportsB2c: Boolean(body.supportsB2c),
        supportsB2b: Boolean(body.supportsB2b), supportsPrepaid: Boolean(body.supportsPrepaid),
        supportsCod: Boolean(body.supportsCod), minWeightKg, maxWeightKg,
        isEnabled: body.isEnabled !== false, pincodeScope: pincodes.length ? 'selected' : 'all_india', pincodes,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      }
      if (!courier.supportsB2c && !courier.supportsB2b) return send({ success: false, message: 'Enable B2C, B2B, or both.' }, 400)
      if (!courier.supportsPrepaid && !courier.supportsCod) return send({ success: false, message: 'Enable prepaid, COD, or both.' }, 400)
      state.manualCouriers.push(courier)
      save()
      return send({ success: true, data: manualCourierRow(courier), message: 'Manual courier created.' }, 201)
    }
    if (path === '/api/admin/manual-couriers/shipments/stats' && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const rows = state.manualShipments
      return send({ success: true, data: {
        total: rows.length, unassigned: rows.filter((item) => item.fulfilmentMode === 'unassigned').length,
        manual: rows.filter((item) => item.fulfilmentMode === 'manual').length,
        integrated: rows.filter((item) => item.fulfilmentMode === 'integrated').length,
        actionRequired: rows.filter((item) => item.operationStatus === 'action_required').length,
      } })
    }
    if (path === '/api/admin/manual-couriers/shipments' && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const search = String(requestUrl.searchParams.get('search') || '').toLowerCase()
      const status = String(requestUrl.searchParams.get('status') || '')
      const fulfilmentMode = String(requestUrl.searchParams.get('fulfilmentMode') || '')
      let rows = state.manualShipments.map(manualShipmentRow)
      if (search) rows = rows.filter((item) => JSON.stringify(item).toLowerCase().includes(search))
      if (status) rows = rows.filter((item) => item.operationStatus === status)
      if (fulfilmentMode) rows = rows.filter((item) => item.fulfilmentMode === fulfilmentMode)
      rows.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      const pageData = paginate(rows, requestUrl, 20)
      return send({ success: true, ...pageData })
    }
    const manualShipmentDetailMatch = path.match(/^\/api\/admin\/manual-couriers\/shipments\/([^/]+)$/)
    if (manualShipmentDetailMatch && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const shipment = state.manualShipments.find((item) => item.id === manualShipmentDetailMatch[1])
      if (!shipment) return send({ success: false, message: 'Manual shipment not found.' }, 404)
      const order = state.orders.find((item) => item.id === shipment.orderId)
      const merchant = state.users.find((item) => item.id === order?.user_id) || {}
      return send({ success: true, data: { shipment: manualShipmentRow(shipment), order: orderForPanels(order), merchant, events: state.manualShipmentEvents.filter((item) => item.shipmentId === shipment.id).sort((a, b) => String(b.eventAt).localeCompare(String(a.eventAt))), legs: state.manualShipmentLegs.filter((item) => item.shipmentId === shipment.id), transactions: state.walletTransactions.filter((item) => item.meta?.order_id === order?.id) } })
    }
    const manualShipmentActionMatch = path.match(/^\/api\/admin\/manual-couriers\/shipments\/([^/]+)\/(manual|tracking|provider-options|release-provider-booking|reconcile-awb)$/)
    if (manualShipmentActionMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const shipment = state.manualShipments.find((item) => item.id === manualShipmentActionMatch[1])
      if (!shipment) return send({ success: false, message: 'Manual shipment not found.' }, 404)
      const action = manualShipmentActionMatch[2]
      const order = state.orders.find((item) => item.id === shipment.orderId)
      if (action === 'provider-options') return send({ success: true, data: shipGlobal.isConfigured() ? [{ id: 99001, courier_id: 99001, name: 'ShipGlobal', displayName: 'ShipGlobal International', integration_type: 'shipglobal', courier_option_key: 'shipglobal-direct', booking_available: true, can_book: true }] : [] })
      if (action === 'manual') { shipment.fulfilmentMode = 'manual'; shipment.operationStatus = 'manual_processing' }
      if (action === 'release-provider-booking') { shipment.fulfilmentMode = 'unassigned'; shipment.operationStatus = 'action_required' }
      if (action === 'reconcile-awb') {
        if (!String(body.actualAwb || '').trim()) return send({ success: false, message: 'Actual provider AWB is required.' }, 400)
        shipment.fulfilmentMode = 'integrated'; shipment.operationStatus = 'provider_booked'
        state.manualShipmentLegs.push({ id: `leg-${randomUUID()}`, shipmentId: shipment.id, provider: body.integrationType, providerCourierName: body.courierPartner || body.integrationType, actualAwb: String(body.actualAwb).trim(), providerReference: body.providerReference || '', status: 'booked', isActive: true, createdAt: new Date().toISOString() })
      }
      if (action === 'tracking') {
        const event = { id: `event-${randomUUID()}`, shipmentId: shipment.id, statusCode: body.statusCode || 'in_transit', statusText: body.statusText || 'Shipment updated', location: body.location || '', remarks: body.remarks || '', eventAt: body.eventAt || new Date().toISOString(), source: 'admin' }
        state.manualShipmentEvents.unshift(event); shipment.operationStatus = event.statusCode; order.status = event.statusCode; order.order_status = event.statusCode; order.provider_last_status = event.statusText; order.updated_at = new Date().toISOString()
        order.tracking_events = state.manualShipmentEvents.filter((item) => item.shipmentId === shipment.id).map((item) => ({ status_code: item.statusCode, event_time: item.eventAt, message: item.statusText, location: item.location }))
      }
      shipment.updatedAt = new Date().toISOString(); save()
      return send({ success: true, message: 'Manual shipment updated.', data: manualShipmentRow(shipment) })
    }
    const manualShipmentRebookMatch = path.match(/^\/api\/admin\/manual-couriers\/shipments\/([^/]+)\/rebook$/)
    if (manualShipmentRebookMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const shipment = state.manualShipments.find((item) => item.id === manualShipmentRebookMatch[1])
      if (!shipment) return send({ success: false, message: 'Manual shipment not found.' }, 404)
      const idempotencyKey = String(body.idempotencyKey || '').trim()
      const prior = idempotencyKey && state.manualShipmentLegs.find((item) => item.shipmentId === shipment.id && item.idempotencyKey === idempotencyKey)
      if (prior) return send({ success: true, message: 'Existing provider booking returned.', data: prior })
      if (String(body.integrationType || '').toLowerCase() !== 'shipglobal') return send({ success: false, message: 'Only the configured ShipGlobal provider is available from this backend.' }, 400)
      if (!shipGlobal.isConfigured()) return send({ success: false, message: 'ShipGlobal production credentials are not configured yet.' }, 503)
      const order = state.orders.find((item) => item.id === shipment.orderId)
      if (!order) return send({ success: false, message: 'Source order not found.' }, 404)
      const providerPayload = mapPunjabShipOrderToShipGlobal({ ...order, pickup: { ...(order.pickup || {}), ...(body.hubPickup || {}) } }, { service: SHIPGLOBAL_SERVICE, currencyCode: SHIPGLOBAL_CURRENCY })
      const missing = validateShipGlobalOrder(providerPayload)
      if (missing.length) return send({ success: false, message: `Missing ShipGlobal fields: ${missing.join(', ')}`, missingFields: missing }, 400)
      shipment.operationStatus = 'provider_booking'; shipment.updatedAt = new Date().toISOString(); save()
      try {
        const providerResult = await shipGlobal.addOrder(providerPayload)
        const actualAwb = extractShipGlobalAwb(providerResult.data, providerResult.headers)
        const leg = { id: `leg-${randomUUID()}`, shipmentId: shipment.id, idempotencyKey, provider: 'shipglobal', providerCourierName: body.courierPartner || 'ShipGlobal', actualAwb: actualAwb || '', providerReference: providerResult.data?.reference || '', status: actualAwb ? 'booked' : 'accepted_pending_awb', isActive: true, createdAt: new Date().toISOString(), providerResponse: providerResult.data }
        state.manualShipmentLegs.push(leg); shipment.fulfilmentMode = 'integrated'; shipment.operationStatus = actualAwb ? 'provider_booked' : 'action_required'; shipment.updatedAt = new Date().toISOString(); save()
        return send({ success: true, message: actualAwb ? 'Provider AWB linked.' : 'Provider accepted booking; AWB reconciliation is required.', data: leg })
      } catch (error) {
        shipment.operationStatus = 'action_required'; shipment.updatedAt = new Date().toISOString(); save(); throw error
      }
    }
    const manualCourierMatch = path.match(/^\/api\/admin\/manual-couriers\/([^/]+)$/)
    if (manualCourierMatch && req.method === 'GET') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const courier = state.manualCouriers.find((item) => item.id === manualCourierMatch[1])
      if (!courier) return send({ success: false, message: 'Manual courier not found.' }, 404)
      const page = Math.max(1, Number(requestUrl.searchParams.get('pincodePage') || 1))
      const limit = Math.min(500, Math.max(1, Number(requestUrl.searchParams.get('pincodeLimit') || 100)))
      const search = String(requestUrl.searchParams.get('pincodeSearch') || '').trim()
      const pincodes = courierPincodes(courier).filter((item) => !search || item.includes(search))
      const start = (page - 1) * limit
      return send({ success: true, data: { ...manualCourierRow(courier), pincodes: pincodes.slice(start, start + limit).map((pincode) => ({ id: `${courier.id}-${pincode}`, pincode })), pincodePage: page, pincodeLimit: limit, pincodeTotal: pincodes.length, pincodeTotalPages: Math.max(1, Math.ceil(pincodes.length / limit)) } })
    }
    if (manualCourierMatch && req.method === 'PATCH') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const courier = state.manualCouriers.find((item) => item.id === manualCourierMatch[1])
      if (!courier) return send({ success: false, message: 'Manual courier not found.' }, 404)
      const allowed = ['displayName', 'supportsB2c', 'supportsB2b', 'supportsPrepaid', 'supportsCod', 'minWeightKg', 'maxWeightKg', 'isEnabled']
      for (const key of allowed) if (body[key] !== undefined) courier[key] = body[key]
      if (body.code !== undefined) courier.code = String(body.code).trim().toUpperCase()
      courier.minWeightKg = Number(courier.minWeightKg)
      courier.maxWeightKg = Number(courier.maxWeightKg)
      courier.updatedAt = new Date().toISOString()
      save()
      return send({ success: true, data: manualCourierRow(courier), message: 'Manual courier updated.' })
    }
    const manualPincodesMatch = path.match(/^\/api\/admin\/manual-couriers\/([^/]+)\/pincodes$/)
    if (manualPincodesMatch && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const courier = state.manualCouriers.find((item) => item.id === manualPincodesMatch[1])
      if (!courier) return send({ success: false, message: 'Manual courier not found.' }, 404)
      courier.pincodeScope = 'selected'; courier.pincodes = normalizePincodes(body.pincodes); courier.excludedPincodes = []; courier.updatedAt = new Date().toISOString(); save()
      return send({ success: true, data: manualCourierRow(courier), message: 'Pincode coverage replaced.' })
    }
    const manualPincodeImportMatch = path.match(/^\/api\/admin\/manual-couriers\/([^/]+)\/pincodes\/import$/)
    if (manualPincodeImportMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const courier = state.manualCouriers.find((item) => item.id === manualPincodeImportMatch[1])
      if (!courier) return send({ success: false, message: 'Manual courier not found.' }, 404)
      const imported = normalizePincodes(String(body.file?.buffer || body.file || '').match(/[1-9]\d{5}/g) || [])
      courier.pincodeScope = 'selected'
      courier.excludedPincodes = []
      courier.pincodes = String(body.mode || 'append') === 'replace' ? imported : normalizePincodes([...(courier.pincodes || []), ...imported])
      courier.updatedAt = new Date().toISOString(); save()
      return send({ success: true, data: manualCourierRow(courier), message: `${imported.length} pincodes imported.` })
    }
    const manualPincodeDeleteMatch = path.match(/^\/api\/admin\/manual-couriers\/([^/]+)\/pincodes\/([1-9]\d{5})$/)
    if (manualPincodeDeleteMatch && req.method === 'DELETE') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const courier = state.manualCouriers.find((item) => item.id === manualPincodeDeleteMatch[1])
      if (!courier) return send({ success: false, message: 'Manual courier not found.' }, 404)
      if (courier.pincodeScope === 'all_india') courier.excludedPincodes = normalizePincodes([...(courier.excludedPincodes || []), manualPincodeDeleteMatch[2]])
      else courier.pincodes = normalizePincodes(courier.pincodes).filter((item) => item !== manualPincodeDeleteMatch[2])
      save()
      return send({ success: true, message: 'Pincode removed.' })
    }

    if (path === '/api/admin/zones' && req.method === 'GET') {
      const businessType = normalizeBusinessType(requestUrl.searchParams.get('business_type') || '')
      const zones = requestUrl.searchParams.get('business_type') ? state.zones.filter((item) => normalizeBusinessType(item.business_type) === businessType) : state.zones
      return send(zones)
    }
    if (path === '/api/admin/zones' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      if (!body.name || !body.code) return send({ success: false, message: 'Zone name and code are required.' }, 400)
      const zone = { ...body, id: body.id || `zone-${randomUUID()}`, business_type: normalizeBusinessType(body.business_type || body.businessType), is_active: body.is_active !== false }
      state.zones.push(zone); save(); return send(zone, 201)
    }
    const zoneMatch = path.match(/^\/api\/admin\/zones\/([^/]+)$/)
    if (zoneMatch && req.method === 'GET') {
      const zone = state.zones.find((item) => item.id === zoneMatch[1]); return zone ? send(zone) : send({ message: 'Zone not found.' }, 404)
    }
    if (zoneMatch && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const zone = state.zones.find((item) => item.id === zoneMatch[1]); if (!zone) return send({ message: 'Zone not found.' }, 404)
      Object.assign(zone, body, { id: zone.id }); save(); return send(zone)
    }
    if (zoneMatch && req.method === 'DELETE') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const before = state.zones.length; state.zones = state.zones.filter((item) => item.id !== zoneMatch[1]); if (before === state.zones.length) return send({ message: 'Zone not found.' }, 404)
      save(); return send({ success: true })
    }

    if (path === '/api/admin/b2b/states' && req.method === 'GET') {
      const states = Array.from(new Set(loadIndiaPostData().map((item) => String(item.state || '').trim()).filter(Boolean))).sort()
      return send({ success: true, data: states })
    }
    if (path === '/api/admin/b2b/zones' && req.method === 'GET') {
      return send({ success: true, data: state.zones
        .filter((item) => normalizeBusinessType(item.business_type) === 'b2b')
        .map((item) => ({ ...item, created_at: item.created_at || item.createdAt || '2026-09-28T00:00:00.000Z' })) })
    }
    if (path === '/api/admin/b2b/zones' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      if (!String(body.name || '').trim() || !String(body.code || '').trim()) return send({ success: false, message: 'Zone name and code are required.' }, 400)
      const zone = { ...body, id: body.id || `b2b-zone-${randomUUID()}`, code: String(body.code).trim().toUpperCase(), name: String(body.name).trim(), business_type: 'b2b', states: Array.isArray(body.states) ? body.states : [], is_active: body.is_active !== false, created_at: new Date().toISOString() }
      state.zones.push(zone); save(); return send({ success: true, data: zone }, 201)
    }
    const b2bZoneMatch = path.match(/^\/api\/admin\/b2b\/zones\/([^/]+)$/)
    if (b2bZoneMatch && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const zone = state.zones.find((item) => item.id === b2bZoneMatch[1] && normalizeBusinessType(item.business_type) === 'b2b')
      if (!zone) return send({ success: false, message: 'B2B zone not found.' }, 404)
      Object.assign(zone, body, { id: zone.id, business_type: 'b2b', updated_at: new Date().toISOString() }); save(); return send({ success: true, data: zone })
    }
    if (b2bZoneMatch && req.method === 'DELETE') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const before = state.zones.length; state.zones = state.zones.filter((item) => item.id !== b2bZoneMatch[1])
      if (before === state.zones.length) return send({ success: false, message: 'B2B zone not found.' }, 404)
      state.b2bZoneRates = state.b2bZoneRates.filter((item) => item.originZoneId !== b2bZoneMatch[1] && item.destinationZoneId !== b2bZoneMatch[1]); save(); return send({ success: true })
    }
    const b2bZoneRemapMatch = path.match(/^\/api\/admin\/b2b\/zones\/([^/]+)\/remap$/)
    if (b2bZoneRemapMatch && req.method === 'POST') return send({ success: true, message: 'Zone state mappings refreshed.' })

    if (path === '/api/admin/b2b/zone-rates' && req.method === 'GET') {
      const courierId = String(requestUrl.searchParams.get('courier_id') || '')
      const provider = String(requestUrl.searchParams.get('service_provider') || '').toLowerCase()
      const planId = String(requestUrl.searchParams.get('plan_id') || '')
      let rates = state.b2bZoneRates
      if (courierId) rates = rates.filter((item) => String(item.courier_id) === courierId)
      if (provider) rates = rates.filter((item) => String(item.service_provider || '').toLowerCase() === provider)
      if (planId) rates = rates.filter((item) => String(item.plan_id) === planId)
      return send({ success: true, data: rates })
    }
    if (path === '/api/admin/b2b/zone-rates' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const originZoneId = body.originZoneId || body.origin_zone_id
      const destinationZoneId = body.destinationZoneId || body.destination_zone_id
      if (!originZoneId || !destinationZoneId || !Number.isFinite(Number(body.ratePerKg ?? body.rate_per_kg))) return send({ success: false, message: 'Origin, destination and per-kg rate are required.' }, 400)
      const ratePerKg = Number(body.ratePerKg ?? body.rate_per_kg)
      const rate = { ...body, id: `b2b-zone-rate-${randomUUID()}`, originZoneId, origin_zone_id: originZoneId, destinationZoneId, destination_zone_id: destinationZoneId, courier_id: Number(body.courier_id || DEFAULT_MANUAL_COURIER_ID), service_provider: body.service_provider || 'manual', plan_id: body.plan_id || 'starter-b2b', ratePerKg, rate_per_kg: ratePerKg, updated_at: new Date().toISOString() }
      state.b2bZoneRates.push(rate); save(); return send({ success: true, data: rate }, 201)
    }
    const b2bZoneRateMatch = path.match(/^\/api\/admin\/b2b\/zone-rates\/([^/]+)$/)
    if (b2bZoneRateMatch && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const rate = state.b2bZoneRates.find((item) => item.id === b2bZoneRateMatch[1]); if (!rate) return send({ success: false, message: 'B2B zone rate not found.' }, 404)
      const ratePerKg = Number(body.ratePerKg ?? body.rate_per_kg ?? rate.rate_per_kg)
      Object.assign(rate, body, { ratePerKg, rate_per_kg: ratePerKg, updated_at: new Date().toISOString() }); save(); return send({ success: true, data: rate })
    }
    if (b2bZoneRateMatch && req.method === 'DELETE') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const before = state.b2bZoneRates.length; state.b2bZoneRates = state.b2bZoneRates.filter((item) => item.id !== b2bZoneRateMatch[1]); if (before === state.b2bZoneRates.length) return send({ success: false, message: 'B2B zone rate not found.' }, 404)
      save(); return send({ success: true })
    }

    if ((path === '/api/admin/couriers/shipping-rates' || path === '/api/couriers/shipping-rates') && req.method === 'GET') {
      const businessType = normalizeBusinessType(requestUrl.searchParams.get('businessType') || 'b2c')
      const planId = String(requestUrl.searchParams.get('planId') || '')
      let rates = state.shippingRates.filter((item) => normalizeBusinessType(item.businessType) === businessType)
      if (planId) rates = rates.filter((item) => String(item.plan_id) === planId)
      return send({ success: true, data: rates })
    }
    const shippingRateMatch = path.match(/^\/api\/admin\/couriers\/shipping-rate\/([^/]+)\/([^/]+)$/)
    if (shippingRateMatch && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const courierId = Number(body.courier_id || shippingRateMatch[1])
      const planId = decodeURIComponent(shippingRateMatch[2])
      const businessType = normalizeBusinessType(body.businessType)
      let rate = state.shippingRates.find((item) => Number(item.courier_id) === courierId && String(item.plan_id) === planId && normalizeBusinessType(item.businessType) === businessType)
      if (!rate) { rate = { id: `rate-${randomUUID()}`, courier_id: courierId, plan_id: planId, businessType }; state.shippingRates.push(rate) }
      Object.assign(rate, body, { courier_id: courierId, plan_id: planId, businessType, updated_at: new Date().toISOString() })
      save(); return send({ success: true, data: rate, message: 'Shipping rate saved.' })
    }
    if (path === '/api/couriers/full-list' || path === '/api/admin/couriers/list' || path === '/api/couriers/list') {
      const businessType = normalizeBusinessType(requestUrl.searchParams.get('businessType') || '')
      const couriers = state.manualCouriers
        .filter((item) => !requestUrl.searchParams.get('businessType') || (businessType === 'b2b' ? item.supportsB2b : item.supportsB2c))
        .map((item) => ({ id: item.courierId, courierId: item.courierId, name: item.displayName, displayName: item.displayName, serviceProvider: 'manual', service_provider: 'manual', isEnabled: item.isEnabled, businessType: [item.supportsB2c && 'b2c', item.supportsB2b && 'b2b'].filter(Boolean) }))
      return send({ success: true, data: couriers })
    }

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
    if (['/api/couriers/available-to-user', '/api/admin/couriers/available', '/api/couriers/b2b-rate-quotes'].includes(path) && req.method === 'POST') {
      const configured = shipGlobal.isConfigured()
      const manualQuotes = availableManualQuotes({ ...body, shipment_type: path.includes('b2b-rate-quotes') ? 'b2b' : body.shipment_type })
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
      // Do not offer sellers a courier that cannot be booked. Integration
      // readiness remains visible to administrators through the status route.
      const includeShipGlobal = configured && normalizeBusinessType(body.shipment_type) === 'b2c' && path !== '/api/couriers/b2b-rate-quotes'
      return send({ success: true, data: [...manualQuotes, ...(includeShipGlobal ? [courier] : [])] })
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
      if (isManualCourierOrder(body)) {
        const { order, shipment } = createManualShipmentOrder(seller, body, 'b2c')
        await stateStore.save(state)
        return send({ success: true, message: 'Manual courier shipment booked.', shipment: orderForPanels(order), manualShipment: shipment }, 201)
      }
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
      await stateStore.save(state)
      return send({ success: true, message: awb ? 'ShipGlobal shipment created.' : 'ShipGlobal accepted the order; AWB is pending.', shipment: orderForPanels(order), providerResponse: providerResult.data }, 201)
    }
    if (path === '/api/orders/b2b/create' && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ success: false, message: 'Authentication required.' }, 401)
      const readiness = merchantReadiness(seller)
      if (!readiness.isReady) return send({ success: false, message: 'Complete account approval, KYC, plan and pickup setup before booking a shipment.', readiness }, 403)
      if (!isManualCourierOrder(body)) return send({ success: false, message: 'Select PunjabShip Manual for B2B booking.' }, 400)
      const { order, shipment } = createManualShipmentOrder(seller, body, 'b2b')
      await stateStore.save(state)
      return send({ success: true, message: 'Manual B2B shipment booked.', shipment: orderForPanels(order), manualShipment: shipment }, 201)
    }
    if (path === '/api/orders/b2c/manifest' && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ success: false, message: 'Authentication required.' }, 401)
      const references = Array.isArray(body.awbs) ? body.awbs.map(String) : []
      const matched = state.orders.filter((order) => order.user_id === seller.id && references.includes(String(order.awb_number || order.id)))
      if (!matched.length) return send({ success: false, message: 'No eligible shipments found for this manifest.' }, 404)
      const manifestId = `MNF-${Date.now()}`
      for (const order of matched) {
        const key = await persistOrderDocument({ ...order, manifest_id: manifestId }, 'manifest')
        order.manifest_id = manifestId
        order.manifest = key
        order.manifest_key = key
        order.order_status = 'manifested'
        order.status = 'manifested'
        order.updated_at = new Date().toISOString()
      }
      save()
      return send({ manifest_id: manifestId, manifest_url: matched[0].manifest_key, warnings: [] })
    }
    const regenerateDocumentsMatch = path.match(/^\/api\/orders\/([^/]+)\/regenerate-documents$/)
    if (regenerateDocumentsMatch && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ success: false, message: 'Authentication required.' }, 401)
      const order = state.orders.find((item) => item.user_id === seller.id && item.id === decodeURIComponent(regenerateDocumentsMatch[1]))
      if (!order) return send({ success: false, message: 'Order not found.' }, 404)
      if (body.regenerateLabel !== false) {
        order.label_key = await persistOrderDocument(order, 'label')
        order.label = order.label_key
      }
      if (body.regenerateInvoice !== false) {
        order.invoice_key = await persistOrderDocument(order, 'invoice')
        order.invoice_link = order.invoice_key
      }
      order.updated_at = new Date().toISOString()
      save()
      return send({ success: true, order: orderForPanels(order), message: 'Shipment documents generated.' })
    }
    if (['/api/uploads/file', '/api/uploads/shopify-file'].includes(path) && req.method === 'POST') {
      const seller = currentSeller(req)
      const admin = isAdminRequest(req)
      if (!seller && !admin) return send({ success: false, message: 'Authentication required.' }, 401)
      const folder = String(body.folder || 'files')
      const publicObject = admin && folder === 'about-us'
      const key = await uploadFile({ file: body.file, folder, ownerId: seller?.id || 'admin', publicObject })
      const protocol = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0]
      const host = req.headers.host
      const publicUrl = publicObject
        ? `${protocol}://${host}/api/uploads/public?key=${encodeURIComponent(key)}`
        : await signedDownloadUrl(key, 3600)
      return send({ key, publicUrl, bucket: storageBucket }, 201)
    }
    if (path === '/api/uploads/presign' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const contentType = String(body.contentType || '')
      if (!contentType.startsWith('image/')) return send({ success: false, message: 'Only images can be embedded in public content.' }, 415)
      const key = createObjectKey({ ownerId: 'admin', folder: body.folder || 'about-us', filename: body.filename || 'image', publicObject: true })
      const uploadUrl = await signedUploadUrl({ key, contentType, expiresIn: 900 })
      const protocol = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0]
      const publicUrl = `${protocol}://${req.headers.host}/api/uploads/public?key=${encodeURIComponent(key)}`
      return send({ key, uploadUrl, publicUrl, expiresIn: 900 })
    }
    if (path === '/api/uploads/public' && req.method === 'GET') {
      const key = String(requestUrl.searchParams.get('key') || '')
      if (!key.startsWith(`${storageStatus().prefix || ''}public/`)) return send({ success: false, message: 'File not found.' }, 404)
      const url = await signedDownloadUrl(key, 300)
      res.writeHead(302, { Location: url, 'Cache-Control': 'public, max-age=240' })
      res.end()
      return
    }
    if (path === '/api/uploads/presign-download-url' && req.method === 'POST') {
      const seller = currentSeller(req)
      const admin = isAdminRequest(req)
      if (!seller && !admin) return send({ success: false, message: 'Authentication required.' }, 401)
      const keys = Array.isArray(body.keys) ? body.keys : [body.keys]
      const protocol = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0]
      const host = req.headers.host
      const urls = await Promise.all(keys.map(async (key) => {
        const match = String(key || '').match(/^manual-doc:(label|invoice|manifest):(.+)$/)
        if (match) {
          const order = state.orders.find((item) => (admin || item.user_id === seller?.id) && item.id === match[2])
          return order ? `${protocol}://${host}/api/orders/documents/download?key=${encodeURIComponent(key)}` : null
        }
        if (!isPunjabShipKey(key) || (!admin && !isOwnerKey(key, seller.id))) return null
        return signedDownloadUrl(key, 25 * 60 * 60)
      }))
      return Array.isArray(body.keys) ? send({ urls }) : send({ url: urls[0] })
    }
    if (path === '/api/orders/documents/download' && req.method === 'GET') {
      const key = String(requestUrl.searchParams.get('key') || '')
      const match = key.match(/^manual-doc:(label|invoice|manifest):(.+)$/)
      const order = match ? state.orders.find((item) => item.id === match[2]) : null
      if (!match || !order) return send({ success: false, message: 'Document not found.' }, 404)
      const type = match[1]
      const pdf = createOrderDocumentPdf(order, type)
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': pdf.length,
        'Content-Disposition': `inline; filename="${documentFileName(order, type)}"`,
        'Cache-Control': 'private, max-age=300',
      })
      res.end(pdf)
      return
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
      if (/^[1-9]\d{5}$/.test(pincode) && !city && !stateName) {
        const custom = state.customServiceabilityLocations.find((item) => item.pincode === pincode)
        const office = officeForPincode(pincode)
        const location = custom || (office ? {
          id: `india-pincode-${pincode}`,
          pincode,
          city: office.area,
          district: office.district,
          state: office.state,
          country: 'India',
          tags: office.delivery ? ['delivery'] : [],
          officeType: office.officeType,
          source: 'India Post',
        } : null)
        const locations = location ? [location] : []
        return send({ success: true, data: locations, total: locations.length, totalCount: locations.length, page: 1, limit, totalPages: 1 })
      }
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
    return send({ success: true, data: [], orders: [], pickups: [], destinations: [], distribution: [], transactions: [], tickets: [], couriers: [], warehouses: [], addresses: [], items: [], total: 0, totalCount: 0, totalPages: 1, page: 1, statusCounts: {}, balance: 0 })
  } catch (error) {
    console.error(error)
    send({ success: false, error: error.message, message: error.message }, Number(error.statusCode || 500))
  }
}).listen(Number(process.env.PORT || 5004), process.env.HOST || '0.0.0.0', () => {
  console.log(`PunjabShip API listening on port ${process.env.PORT || 5004}`)
})

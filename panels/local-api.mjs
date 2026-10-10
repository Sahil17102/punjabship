import http from 'node:http'
import { randomBytes, randomInt, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gunzipSync } from 'node:zlib'
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
import { csvBoolean, csvHeaderKey, csvNumber, parseCsvObjects } from './csv-imports.mjs'
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

const dataFile = process.env.PUNJABSHIP_DATA_FILE
  ? pathToFileURL(resolve(process.env.PUNJABSHIP_DATA_FILE))
  : new URL('./local-data.json', import.meta.url)
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
const globalPostalData = (() => {
  try {
    return JSON.parse(gunzipSync(readFileSync(new URL('./data/global-postal-codes.json.gz', import.meta.url))))
  } catch (error) {
    console.error('Unable to load global postal-code data.', error.message)
    return { countries: {}, rows: [] }
  }
})()
const globalPostalRows = Array.isArray(globalPostalData.rows) ? globalPostalData.rows : []
const globalPostalCountries = globalPostalData.countries || {}
const globalPostalCodeTypes = globalPostalData.postalCodeTypes || {}

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
const EUROPE_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia', 'Denmark',
  'Estonia', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'Iceland',
  'Ireland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Malta', 'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Slovakia',
  'Slovenia', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom',
]
const INTERNATIONAL_ZONE_DEFINITIONS = [
  { key: 'canada', code: 'CA', name: 'Canada', countries: ['Canada'], b2cRate: 1450, b2cRto: 1200, b2cExtra: 480, b2cExtraRto: 420, b2bPerKg: 210 },
  { key: 'usa', code: 'US', name: 'United States', countries: ['United States'], b2cRate: 1350, b2cRto: 1150, b2cExtra: 450, b2cExtraRto: 400, b2bPerKg: 195 },
  { key: 'europe', code: 'EU', name: 'Europe', countries: EUROPE_COUNTRIES, b2cRate: 1550, b2cRto: 1300, b2cExtra: 520, b2cExtraRto: 460, b2bPerKg: 225 },
]
const DEFAULT_B2C_ZONES = [
  { id: 'b2c-local', code: 'A', name: 'Local', description: 'Same city / nearby pincode cluster', business_type: 'b2c', is_active: true },
  { id: 'b2c-state', code: 'B', name: 'Within State', description: 'Pickup and delivery in the same state', business_type: 'b2c', is_active: true },
  { id: 'b2c-metro', code: 'C', name: 'Metro', description: 'Major metro destination', business_type: 'b2c', is_active: true },
  { id: 'b2c-roi', code: 'D', name: 'Rest of India', description: 'All standard India destinations', business_type: 'b2c', is_active: true },
  { id: 'b2c-special', code: 'E', name: 'Special', description: 'North East, Jammu & Kashmir and island destinations', business_type: 'b2c', is_active: true },
].map((zone) => ({ ...zone, country: 'India', countries: ['India'] })).concat(
  INTERNATIONAL_ZONE_DEFINITIONS.map((zone) => ({
    id: `b2c-${zone.key}`, code: zone.code, name: zone.name,
    description: `All valid postal codes in ${zone.name}`,
    business_type: 'b2c', is_active: true,
    country: zone.countries[0], countries: zone.countries,
  })),
)
const DEFAULT_B2B_ZONES = [
  { id: 'b2b-north', code: 'N', name: 'North', description: 'North India', states: ['Punjab', 'Haryana', 'Himachal Pradesh', 'Delhi', 'Uttar Pradesh', 'Uttarakhand', 'Chandigarh', 'Rajasthan'], business_type: 'b2b', is_active: true },
  { id: 'b2b-west', code: 'W', name: 'West', description: 'West India', states: ['Gujarat', 'Maharashtra', 'Goa', 'Dadra & Nagar Haveli', 'Daman & Diu'], business_type: 'b2b', is_active: true },
  { id: 'b2b-south', code: 'S', name: 'South', description: 'South India', states: ['Karnataka', 'Kerala', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh', 'Puducherry'], business_type: 'b2b', is_active: true },
  { id: 'b2b-east', code: 'E', name: 'East', description: 'East India', states: ['West Bengal', 'Odisha', 'Bihar', 'Jharkhand'], business_type: 'b2b', is_active: true },
  { id: 'b2b-central', code: 'C', name: 'Central', description: 'Central India', states: ['Madhya Pradesh', 'Chhattisgarh'], business_type: 'b2b', is_active: true },
  { id: 'b2b-northeast', code: 'NE', name: 'North East', description: 'North East and special destinations', states: ['Assam', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Sikkim', 'Tripura', 'Jammu & Kashmir', 'Ladakh', 'Andaman & Nicobar Islands'], business_type: 'b2b', is_active: true },
].map((zone) => ({ ...zone, country: 'India', countries: ['India'] })).concat(
  INTERNATIONAL_ZONE_DEFINITIONS.map((zone) => ({
    id: `b2b-${zone.key}`, code: zone.code, name: zone.name,
    description: `All valid postal codes in ${zone.name}`,
    states: [], business_type: 'b2b', is_active: true,
    country: zone.countries[0], countries: zone.countries,
  })),
)

const normalizeZoneCountries = (zone = {}) => {
  const countries = (Array.isArray(zone.countries) ? zone.countries : [zone.country])
    .map((country) => String(country || '').trim())
    .filter(Boolean)
  return [...new Set(countries.length ? countries : ['India'])]
}

const normalizeZonePostalCodes = (zone = {}) => {
  const defaultCountry = normalizeZoneCountries(zone)[0] || 'India'
  const values = Array.isArray(zone.postal_codes)
    ? zone.postal_codes
    : Array.isArray(zone.pincodes)
      ? zone.pincodes
      : []
  const unique = new Map()
  for (const value of values) {
    const item = typeof value === 'object' && value !== null
      ? value
      : { country: defaultCountry, pincode: value }
    const pincode = String(item.pincode || item.postalCode || '').trim().toUpperCase()
    const country = String(item.country || defaultCountry).trim()
    if (!pincode || !country) continue
    const key = `${country.toLowerCase()}::${pincode.replace(/\s+/g, '')}`
    unique.set(key, {
      country,
      pincode,
      city: String(item.city || '').trim(),
      state: String(item.state || '').trim(),
    })
  }
  return [...unique.values()]
}

const withNormalizedZoneCountries = (zone = {}) => {
  const countries = normalizeZoneCountries(zone)
  const postal_codes = normalizeZonePostalCodes({ ...zone, countries })
  return { ...zone, country: countries[0], countries, postal_codes }
}

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
    ...Object.fromEntries(INTERNATIONAL_ZONE_DEFINITIONS.map((zone) => [zone.name, { forward: zone.b2cRate, rto: zone.b2cRto }])),
  },
  zone_slabs: {
    Local: makeSlab(45, 40, 22, 20), 'Within State': makeSlab(55, 50, 26, 24),
    Metro: makeSlab(65, 60, 30, 28), 'Rest of India': makeSlab(75, 70, 35, 32),
    Special: makeSlab(95, 90, 45, 42),
    ...Object.fromEntries(INTERNATIONAL_ZONE_DEFINITIONS.map((zone) => [zone.name, makeSlab(zone.b2cRate, zone.b2cRto, zone.b2cExtra, zone.b2cExtraRto)])),
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
    ...Object.fromEntries(INTERNATIONAL_ZONE_DEFINITIONS.map((zone) => [zone.name, { forward_per_kg: zone.b2bPerKg, rto_per_kg: zone.b2bPerKg, min_weight: 10 }])),
  },
})
const defaultB2bZoneRates = () => {
  const perKg = {
    North: 12, West: 15, South: 18, East: 17, Central: 14, 'North East': 24,
    ...Object.fromEntries(INTERNATIONAL_ZONE_DEFINITIONS.map((zone) => [zone.name, zone.b2bPerKg])),
  }
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
  b2bAdditionalCharges: [],
  zoneMappings: [],
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
state.b2bAdditionalCharges ??= []
state.zoneMappings ??= []
state.manualShipments ??= []
state.manualShipmentEvents ??= []
state.manualShipmentLegs ??= []
if (!state.manualCouriers.some((item) => item.id === 'manual-punjabship')) state.manualCouriers.push(defaultManualCourier())
for (const zone of [...DEFAULT_B2C_ZONES, ...DEFAULT_B2B_ZONES]) {
  const existingZone = state.zones.find((item) => item.id === zone.id)
  if (!existingZone) {
    state.zones.push(zone)
    stateNeedsSave = true
  } else if (zone.states?.length && !existingZone.states?.length) {
    existingZone.states = zone.states
    stateNeedsSave = true
  }
}
for (let index = 0; index < state.zones.length; index += 1) {
  const zone = state.zones[index]
  const normalized = withNormalizedZoneCountries(zone)
  if (zone.country !== normalized.country || !Array.isArray(zone.countries)) {
    state.zones[index] = normalized
    stateNeedsSave = true
  }
}
for (const defaultRate of [defaultB2cRate(), defaultB2bRate()]) {
  const existingRate = state.shippingRates.find((item) => item.id === defaultRate.id)
  if (!existingRate) {
    state.shippingRates.push(defaultRate)
    stateNeedsSave = true
    continue
  }
  existingRate.rates ??= {}
  for (const [zoneName, zoneRate] of Object.entries(defaultRate.rates || {})) {
    if (!existingRate.rates[zoneName]) {
      existingRate.rates[zoneName] = zoneRate
      stateNeedsSave = true
    }
  }
  if (defaultRate.zone_slabs) {
    existingRate.zone_slabs ??= {}
    for (const [zoneName, slabs] of Object.entries(defaultRate.zone_slabs)) {
      if (!existingRate.zone_slabs[zoneName]) {
        existingRate.zone_slabs[zoneName] = slabs
        stateNeedsSave = true
      }
    }
  }
}
for (const rate of defaultB2bZoneRates()) {
  if (!state.b2bZoneRates.some((item) => item.id === rate.id)) {
    state.b2bZoneRates.push(rate)
    stateNeedsSave = true
  }
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
    country: order.country || order.consignee?.country || order.shipping_details?.country || 'India',
    country_code: order.country_code || order.consignee?.country_code || 'IN',
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
const uploadedCsv = (body) => {
  const file = body?.file
  if (!file?.buffer?.length) throw Object.assign(new Error('Select a CSV file to import.'), { statusCode: 400 })
  if (file.buffer.length > 10 * 1024 * 1024) throw Object.assign(new Error('CSV file exceeds the 10 MB upload limit.'), { statusCode: 413 })
  const filename = String(file.filename || '').toLowerCase()
  if (filename && !filename.endsWith('.csv')) throw Object.assign(new Error('Only CSV files are supported for this import.'), { statusCode: 415 })
  const parsed = parseCsvObjects(file.buffer)
  if (!parsed.headers.length) throw Object.assign(new Error('The CSV file is empty or has no header row.'), { statusCode: 400 })
  return parsed
}
const requireCsvHeaders = (headers, required) => {
  const missing = required.filter((header) => !headers.includes(header))
  if (missing.length) throw Object.assign(new Error(`Missing CSV columns: ${missing.join(', ')}`), { statusCode: 400 })
}
const importScopeValue = (body, key, fallback = '') => String(body?.[key] ?? fallback).trim()
const sameImportScope = (item, { courierId, serviceProvider, planId }) => (
  String(item.courier_id ?? '') === String(courierId ?? '') &&
  String(item.service_provider ?? '').toLowerCase() === String(serviceProvider ?? '').toLowerCase() &&
  String(item.plan_id ?? '') === String(planId ?? '')
)
const csvZone = (value, businessType) => {
  const needle = String(value || '').trim().toLowerCase()
  if (!needle) return null
  return state.zones.find((zone) => (
    normalizeBusinessType(zone.business_type) === businessType &&
    [zone.id, zone.code, zone.name].some((candidate) => String(candidate || '').trim().toLowerCase() === needle)
  )) || null
}
const camelToSnake = (value) => String(value || '').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase()
const normalizedChargePayload = (payload = {}) => {
  const result = {}
  for (const [key, value] of Object.entries(payload)) {
    if (['file', 'fieldDefinitions'].includes(key)) continue
    if (key === 'customFields') result.custom_fields = value
    else result[camelToSnake(key)] = value
  }
  return result
}
const locationFields = (pincode) => {
  const office = officeForPincode(pincode)
  return { city: office?.area || office?.district || '', state: office?.state || '' }
}
const COUNTRY_CODE_ALIASES = new Map([
  ['INDIA', 'IN'],
  ['CANADA', 'CA'],
  ['UNITED STATES', 'US'],
  ['UNITED STATES OF AMERICA', 'US'],
  ['USA', 'US'],
  ['AMERICA', 'US'],
  ['UNITED KINGDOM', 'GB'],
  ['UK', 'GB'],
])
const normalizeCountryCode = (value) => {
  const normalized = String(value || 'IN').trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(normalized)) return normalized
  const alias = COUNTRY_CODE_ALIASES.get(normalized)
  if (alias) return alias
  return Object.entries(globalPostalCountries)
    .find(([, name]) => String(name || '').trim().toUpperCase() === normalized)?.[0] || normalized
}
const countryDisplayNames = new Intl.DisplayNames(['en'], { type: 'region' })
const countryNameFromCode = (value) => {
  const code = normalizeCountryCode(value)
  try { return countryDisplayNames.of(code) || code } catch { return code }
}
const postalCodeIsValid = (countryCode, value) => {
  const code = normalizeCountryCode(countryCode)
  const postalCode = String(value || '').trim().toUpperCase()
  const patterns = {
    IN: /^[1-9]\d{5}$/,
    CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/,
    US: /^\d{5}(?:[ -]\d{4})?$/,
    AT: /^\d{4}$/, BE: /^\d{4}$/, BG: /^\d{4}$/, HR: /^\d{5}$/,
    CY: /^\d{4}$/, CZ: /^\d{3} ?\d{2}$/, DK: /^\d{4}$/, EE: /^\d{5}$/,
    FI: /^\d{5}$/, FR: /^\d{2} ?\d{3}$/, DE: /^\d{5}$/, GR: /^\d{3} ?\d{2}$/,
    HU: /^\d{4}$/, IS: /^\d{3}$/, IE: /^[\dA-Z]{3} ?[\dA-Z]{4}$/,
    IT: /^\d{5}$/, LV: /^LV-\d{4}$/, LI: /^(?:948[5-9]|949[0-8])$/,
    LT: /^\d{5}$/, LU: /^\d{4}$/, MT: /^[A-Z]{3} ?\d{2,4}$/,
    NL: /^[1-9]\d{3} ?(?:[A-RT-Z][A-Z]|S[BCE-RT-Z])$/, NO: /^\d{4}$/,
    PL: /^\d{2}-\d{3}$/, PT: /^\d{4}-\d{3}$/, RO: /^\d{6}$/,
    SK: /^\d{3} ?\d{2}$/, SI: /^\d{4}$/, ES: /^\d{5}$/, SE: /^\d{3} ?\d{2}$/,
    CH: /^\d{4}$/,
    GB: /^(?:GIR ?0AA|(?:[A-Z]{1,2}\d[A-Z\d]? ?\d[ABD-HJLNP-UW-Z]{2})|BFPO ?\d{1,4})$/,
  }
  return patterns[code]
    ? patterns[code].test(postalCode)
    : /^[A-Z0-9][A-Z0-9 -]{1,10}[A-Z0-9]$/.test(postalCode)
}
const destinationCountryCodeFor = (body, postalCode) => {
  const explicit = body.deliveryCountryCode || body.delivery_country_code || body.country_code
  if (String(explicit || '').trim()) return normalizeCountryCode(explicit)
  // Older cached seller bundles did not send the destination country. Canadian
  // postal codes are unambiguous, so keep those orders serviceable as well.
  if (postalCodeIsValid('CA', postalCode)) return 'CA'
  return 'IN'
}
const serviceabilityCountryCode = (value) => {
  const country = String(value || '').trim().toLowerCase()
  if (!country) return ''
  if (country === 'india' || country === 'in') return 'IN'
  if (country === 'america' || country === 'usa') return 'US'
  return Object.entries(globalPostalCountries)
    .find(([code, name]) => code.toLowerCase() === country || String(name).toLowerCase() === country)?.[0] || ''
}
const globalPostalLocation = (row) => {
  const postalCodeType = globalPostalCodeTypes[row[0]] || 'full'
  return {
    id: `postal-${row[0]}-${String(row[1]).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    pincode: row[1],
    city: row[2] || '',
    state: row[3] || '',
    country: globalPostalCountries[row[0]] || countryNameFromCode(row[0]),
    countryCode: row[0],
    postalCodeType,
    tags: [postalCodeType === 'routing-prefix' ? 'routing-area' : 'full-postal-code'],
    source: 'GeoNames',
    isSystemPostalCode: true,
  }
}
const normalizedPostalValue = (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
const zonePostalCodes = (zone) => normalizeZonePostalCodes(zone)
const postalSelectionMatches = (selection, countryCode, postalCode) => {
  const selectedCountryCode = serviceabilityCountryCode(selection.country)
  const code = normalizeCountryCode(countryCode)
  if (selectedCountryCode && selectedCountryCode !== code) return false
  const selected = normalizedPostalValue(selection.pincode)
  const destination = normalizedPostalValue(postalCode)
  if (!selected || !destination) return false
  return destination === selected || destination.startsWith(selected)
}
const zoneAllowsPostalCode = (zone, countryCode, postalCode) => {
  const selections = zonePostalCodes(zone)
  return selections.length === 0 || selections.some((selection) => postalSelectionMatches(selection, countryCode, postalCode))
}
const explicitZoneForPostalCode = (businessType, countryCode, postalCode) => state.zones.find((zone) => (
  normalizeBusinessType(zone.business_type) === businessType &&
  zonePostalCodes(zone).some((selection) => postalSelectionMatches(selection, countryCode, postalCode))
))
const zoneForCountry = (businessType, countryCode, postalCode = '') => {
  const code = normalizeCountryCode(countryCode)
  const name = countryNameFromCode(code).toLowerCase()
  const candidates = state.zones.filter((zone) => {
    if (normalizeBusinessType(zone.business_type) !== businessType) return false
    const countries = normalizeZoneCountries(zone).map((country) => String(country).trim().toLowerCase())
    return countries.includes(code.toLowerCase()) || countries.includes(name)
  })
  if (postalCode) {
    const explicit = candidates.find((zone) => zonePostalCodes(zone).length > 0 && zoneAllowsPostalCode(zone, code, postalCode))
    if (explicit) return explicit
  }
  return candidates.find((zone) => zonePostalCodes(zone).length === 0)
}
const normalizedState = (pincode) => String(officeForPincode(pincode)?.state || '').trim().toLowerCase()
const SPECIAL_STATES = new Set(['andaman & nicobar islands', 'arunachal pradesh', 'assam', 'jammu & kashmir', 'ladakh', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'sikkim', 'tripura'])
const METRO_PREFIXES = ['110', '122', '201', '400', '560', '600', '700', '500', '411', '380']
const b2cZoneFor = (origin, destination) => {
  const explicit = explicitZoneForPostalCode('b2c', 'IN', destination)
  if (explicit) return explicit
  const originState = normalizedState(origin)
  const destinationState = normalizedState(destination)
  const preferredId = String(origin).slice(0, 3) === String(destination).slice(0, 3)
    ? 'b2c-local'
    : originState && originState === destinationState
      ? 'b2c-state'
      : SPECIAL_STATES.has(destinationState)
        ? 'b2c-special'
        : METRO_PREFIXES.includes(String(destination).slice(0, 3))
          ? 'b2c-metro'
          : 'b2c-roi'
  const preferred = state.zones.find((item) => item.id === preferredId)
  if (preferred && zoneAllowsPostalCode(preferred, 'IN', destination)) return preferred
  return state.zones.find((item) => normalizeBusinessType(item.business_type) === 'b2c' && zonePostalCodes(item).length === 0)
}
const B2B_STATE_ZONE = {
  'punjab': 'North', 'haryana': 'North', 'himachal pradesh': 'North', 'delhi': 'North', 'uttar pradesh': 'North', 'uttarakhand': 'North', 'chandigarh': 'North', 'rajasthan': 'North',
  'gujarat': 'West', 'maharashtra': 'West', 'goa': 'West', 'dadra & nagar haveli': 'West', 'daman & diu': 'West',
  'karnataka': 'South', 'kerala': 'South', 'tamil nadu': 'South', 'telangana': 'South', 'andhra pradesh': 'South', 'puducherry': 'South',
  'west bengal': 'East', 'odisha': 'East', 'bihar': 'East', 'jharkhand': 'East',
  'madhya pradesh': 'Central', 'chhattisgarh': 'Central',
}
const b2bZoneFor = (destination) => {
  const explicit = explicitZoneForPostalCode('b2b', 'IN', destination)
  if (explicit) return explicit
  const stateName = normalizedState(destination)
  const name = SPECIAL_STATES.has(stateName) ? 'North East' : (B2B_STATE_ZONE[stateName] || 'North East')
  const configured = state.zones.find((item) => (
    normalizeBusinessType(item.business_type) === 'b2b' &&
    Array.isArray(item.states) &&
    item.states.some((value) => String(value).trim().toLowerCase() === stateName) &&
    zoneAllowsPostalCode(item, 'IN', destination)
  ))
  if (configured) return configured
  const preferred = state.zones.find((item) => normalizeBusinessType(item.business_type) === 'b2b' && item.name === name)
  return preferred && zoneAllowsPostalCode(preferred, 'IN', destination) ? preferred : undefined
}
const zoneForShipmentDestination = (shipmentType, destination, destinationCountryCode) => {
  const code = normalizeCountryCode(destinationCountryCode)
  if (code !== 'IN') return zoneForCountry(shipmentType, code, destination)
  return shipmentType === 'b2b' ? b2bZoneFor(destination) : null
}
const courierSupportsRoute = (courier, origin, destination, shipmentType, paymentType, weightKg, originCountryCode, destinationCountryCode) => {
  if (!courier.isEnabled) return false
  if (shipmentType === 'b2b' ? !courier.supportsB2b : !courier.supportsB2c) return false
  if (paymentType === 'cod' ? !courier.supportsCod : !courier.supportsPrepaid) return false
  // The courier minimum is a billing slab, not a serviceability cutoff. Orders
  // below it (including a temporarily missing/zero UI weight) are quoted at the
  // minimum chargeable weight by manualCourierQuote below.
  if (weightKg > Number(courier.maxWeightKg || Infinity)) return false
  const originCountry = normalizeCountryCode(originCountryCode)
  const destinationCountry = normalizeCountryCode(destinationCountryCode)
  if (originCountry !== 'IN' || destinationCountry !== 'IN') {
    return originCountry === 'IN' && postalCodeIsValid(destinationCountry, destination) && Boolean(zoneForCountry(shipmentType, destinationCountry, destination))
  }
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
  const originCountryCode = normalizeCountryCode(body.pickupCountryCode || body.pickup_country_code || 'IN')
  const destinationCountryCode = destinationCountryCodeFor(body, destination)
  if (!courierSupportsRoute(courier, origin, destination, shipmentType, paymentType, weightKg, originCountryCode, destinationCountryCode)) return null
  const zone = destinationCountryCode === 'IN'
    ? (shipmentType === 'b2b' ? b2bZoneFor(destination) : b2cZoneFor(origin, destination))
    : zoneForShipmentDestination(shipmentType, destination, destinationCountryCode)
  if (!zone) return null
  const chargeableWeight = Math.max(weightKg, Number(rate.min_weight || courier.minWeightKg || 0.5))
  const zoneRate = rate.rates?.[zone.name] || {}
  const originZone = shipmentType === 'b2b'
    ? (originCountryCode === 'IN' ? b2bZoneFor(origin) : zoneForCountry('b2b', originCountryCode, origin))
    : null
  const matrixRate = shipmentType === 'b2b' && originZone
    ? state.b2bZoneRates.find((item) => (
        String(item.originZoneId || item.origin_zone_id) === String(originZone.id) &&
        String(item.destinationZoneId || item.destination_zone_id) === String(zone.id) &&
        String(item.courier_id) === String(courier.courierId) &&
        (!rate.plan_id || !item.plan_id || String(item.plan_id) === String(rate.plan_id))
      ))
    : null
  const b2bPerKg = Number(matrixRate?.rate_per_kg ?? matrixRate?.ratePerKg ?? zoneRate.forward_per_kg ?? 0)
  const freight = shipmentType === 'b2b'
    ? chargeableWeight * b2bPerKg
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
    approxZone: { id: zone.id, code: zone.code, name: zone.name, country: countryNameFromCode(destinationCountryCode), countries: normalizeZoneCountries(zone) }, zone_id: zone.id,
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
const validateOrderPayload = (body, type) => {
  const errors = []
  const consignee = body?.consignee || {}
  const countryCode = normalizeCountryCode(consignee.country_code || body.country_code)
  const postalCode = String(consignee.pincode || '').trim()
  if (!/^[A-Z]{2}$/.test(countryCode)) errors.push('consignee.country_code must be a valid 2-letter ISO code')
  if (!String(consignee.name || '').trim()) errors.push('consignee.name is required')
  if (!String(consignee.phone || '').trim()) errors.push('consignee.phone is required')
  if (!String(consignee.address || consignee.address_line_1 || '').trim()) errors.push('consignee.address is required')
  if (!String(consignee.city || '').trim()) errors.push('consignee.city is required')
  if (!String(consignee.state || '').trim()) errors.push('consignee.state is required')
  if (!postalCodeIsValid(countryCode, postalCode)) {
    errors.push(countryCode === 'IN' ? 'India delivery pincode must be 6 digits' : `Delivery postal code is invalid for ${countryNameFromCode(countryCode)}`)
  }
  if (!String(body?.order_number || '').trim()) errors.push('order_number is required')
  if (type === 'b2c') {
    for (const field of ['package_weight', 'package_length', 'package_breadth', 'package_height']) {
      if (!Number.isFinite(Number(body?.[field])) || Number(body[field]) <= 0) errors.push(`${field} must be greater than 0`)
    }
    if (!Array.isArray(body?.order_items) || !body.order_items.length) errors.push('At least one order item is required')
  } else {
    if (!Array.isArray(body?.boxes) || !body.boxes.length) errors.push('At least one box is required')
    for (const [index, box] of (body?.boxes || []).entries()) {
      for (const field of ['lengthCm', 'breadthCm', 'heightCm', 'weightKg', 'quantity']) {
        if (!Number.isFinite(Number(box?.[field])) || Number(box[field]) <= 0) errors.push(`boxes.${index}.${field} must be greater than 0`)
      }
    }
  }
  return { errors, countryCode, countryName: countryNameFromCode(countryCode) }
}
const withNormalizedOrderCountry = (body, validation) => ({
  ...body,
  country: validation.countryName,
  country_code: validation.countryCode,
  consignee: {
    ...(body.consignee || {}),
    country: validation.countryName,
    country_code: validation.countryCode,
  },
  pickup: { ...(body.pickup || {}), country: 'India', country_code: normalizeCountryCode(body.pickup?.country_code || 'IN') },
})
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
const pdfWrappedText = (commands, x, y, size, value, maxChars, maxLines = 2, lineHeight = size + 3, bold = false) => {
  const words = String(value || '-').trim().split(/\s+/).filter(Boolean)
  const lines = []
  for (const word of words) {
    const current = lines.at(-1)
    if (!current || `${current} ${word}`.length > maxChars) lines.push(word)
    else lines[lines.length - 1] = `${current} ${word}`
  }
  const visible = lines.slice(0, maxLines)
  if (lines.length > maxLines && visible.length) visible[visible.length - 1] = `${visible.at(-1).slice(0, Math.max(1, maxChars - 3))}...`
  visible.forEach((line, index) => commands.push(pdfText(x, y - index * lineHeight, size, line, bold)))
  return y - visible.length * lineHeight
}
const documentDate = (value) => {
  const parsed = value ? new Date(value) : null
  if (!parsed || Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata' })
}
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
  const email = order.buyer_email || order.customer_email || consignee.email || '-'
  const destinationCountry = consignee.country || order.country || countryNameFromCode(consignee.country_code || order.country_code) || '-'
  const address = consignee.address || consignee.address_line_1 || order.address || order.customer_address || ''
  const cityLine = [consignee.city || order.city, consignee.state || order.state, consignee.pincode || order.pincode, destinationCountry].filter(Boolean).join(', ')
  const pickupName = pickup.addressNickname || pickup.warehouse_name || pickup.name || seller.companyInfo?.businessName || seller.name || 'PunjabShip Merchant'
  const pickupAddress = pickup.address || pickup.addressLine1 || pickup.address_line_1 || ''
  const pickupLine = [pickupAddress, pickup.city, pickup.state, pickup.pincode, pickup.country || 'India'].filter(Boolean).join(', ')
  const amount = Number(order.order_amount || order.total_amount || 0)
  const customerShipping = Number(order.shipping_charges || 0)
  const otherCharges = Number(order.other_charges || order.transaction_fee || 0)
  const discount = Number(order.discount || order.total_discount || 0)
  const rawWeight = Number(order.package_weight || order.weight || order.chargeable_weight || 0)
  const weight = String(order.type || '').toLowerCase() === 'b2c' && rawWeight > 50 ? rawWeight / 1000 : rawWeight
  const products = Array.isArray(order.order_items) ? order.order_items : Array.isArray(order.products) ? order.products : []
  const issueDate = documentDate(order.invoice_date || order.order_date || order.created_at)
  const paymentType = String(order.payment_type || order.order_type || 'prepaid').toUpperCase()
  const currency = String(order.currency_code || order.currency || 'INR').toUpperCase()
  const itemSubtotal = products.reduce((sum, product) => sum + Number(product.quantity || product.qty || 1) * Number(product.price || product.unit_price || product.selling_price || 0), 0)
  const subtotal = itemSubtotal > 0 ? itemSubtotal : amount
  const calculatedTotal = Math.max(0, subtotal + customerShipping + otherCharges - discount)
  const grandTotal = amount > 0 ? amount : calculatedTotal

  if (type === 'label') {
    const commands = ['0 G', '0 g', pdfRect(12, 12, 264, 408), pdfRect(20, 372, 248, 45, true), '1 g', pdfText(30, 394, 20, 'PUNJABSHIP', true), pdfText(30, 379, 9, 'SHIPMENT LABEL', true), '0 g']
    commands.push(pdfText(22, 350, 9, 'AWB', true), pdfText(22, 326, 18, awb, true), pdfText(22, 306, 9, `ORDER: ${orderNumber}`), pdfText(22, 291, 9, `COURIER: ${courier}`), pdfText(22, 276, 9, `PAYMENT: ${paymentType}`), pdfLine(20, 263, 268, 263))
    commands.push(pdfText(22, 246, 10, 'DELIVER TO', true), pdfText(22, 228, 13, recipient, true), pdfText(22, 212, 9, phone))
    pdfWrappedText(commands, 22, 196, 8, `${address}, ${cityLine}`, 55, 3, 12)
    commands.push(pdfLine(20, 158, 268, 158), pdfText(22, 143, 10, 'SHIP FROM', true), pdfText(22, 127, 10, pickupName, true))
    pdfWrappedText(commands, 22, 112, 8, pickupLine, 55, 2, 11)
    commands.push(pdfText(22, 86, 9, `WEIGHT: ${weight || 0.5} kg`), pdfText(152, 86, 9, `VALUE: ${currency} ${grandTotal.toFixed(2)}`))
    for (let i = 0; i < 58; i += 1) if (i % 3 !== 1) commands.push(pdfRect(28 + i * 3.65, 35, i % 4 === 0 ? 2.2 : 1.1, 38, true))
    commands.push(pdfText(74, 20, 7, awb))
    return createPdf(288, 432, commands)
  }

  const commands = ['0 G', '0 g', pdfRect(28, 28, 539, 786), pdfRect(28, 752, 539, 62, true), '1 g', pdfText(48, 784, 23, 'PUNJABSHIP', true), pdfText(48, 765, 10, type === 'manifest' ? 'DISPATCH MANIFEST' : 'COMMERCIAL INVOICE', true), '0 g']
  if (type === 'manifest') {
    commands.push(pdfText(48, 724, 10, `Manifest ID: ${order.manifest_id || `MNF-${String(orderNumber).slice(-10)}`}`, true), pdfText(360, 724, 10, `Order Date: ${issueDate}`), pdfText(48, 704, 10, `Courier: ${courier}`), pdfText(48, 686, 9, `Pickup: ${pickupName}`))
    pdfWrappedText(commands, 48, 670, 8, pickupLine, 95, 2, 11)
    commands.push(pdfLine(48, 642, 547, 642))
    commands.push(pdfText(48, 622, 9, 'AWB', true), pdfText(195, 622, 9, 'ORDER', true), pdfText(330, 622, 9, 'RECIPIENT', true), pdfText(472, 622, 9, 'POSTAL CODE', true), pdfLine(48, 614, 547, 614))
    commands.push(pdfText(48, 594, 9, awb), pdfText(195, 594, 9, String(orderNumber).slice(0, 20)), pdfText(330, 594, 9, recipient.slice(0, 22)), pdfText(472, 594, 9, consignee.pincode || order.pincode || '-'), pdfLine(48, 580, 547, 580))
    commands.push(pdfText(48, 548, 10, 'Shipment Summary', true), pdfText(48, 528, 9, 'Packages: 1'), pdfText(180, 528, 9, `Weight: ${weight || 0.5} kg`), pdfText(330, 528, 9, `Declared Value: ${currency} ${grandTotal.toFixed(2)}`), pdfText(48, 505, 9, `Destination: ${cityLine}`), pdfText(48, 470, 9, 'Declaration: The shipment details above are accurate and ready for dispatch.'), pdfLine(48, 410, 225, 410), pdfLine(370, 410, 547, 410), pdfText(48, 394, 8, 'Merchant Signature'), pdfText(370, 394, 8, 'PunjabShip Operations'))
  } else {
    commands.push(pdfText(48, 724, 10, `Invoice No: ${order.invoice_no || orderNumber}`, true), pdfText(380, 724, 10, `Date: ${issueDate}`), pdfText(48, 704, 9, `Order: ${orderNumber}  |  AWB: ${awb}`), pdfText(48, 681, 10, 'BILL TO', true), pdfText(48, 663, 11, recipient, true))
    pdfWrappedText(commands, 48, 646, 8, `${address}, ${cityLine}`, 92, 2, 12)
    commands.push(pdfText(48, 618, 8, `Phone: ${phone}  |  Email: ${email}`), pdfLine(48, 604, 547, 604))
    commands.push(pdfText(48, 584, 9, 'DESCRIPTION / SKU / HSN', true), pdfText(350, 584, 9, 'QTY', true), pdfText(430, 584, 9, 'RATE', true), pdfText(505, 584, 9, 'AMOUNT', true), pdfLine(48, 574, 547, 574))
    let y = 552
    const rows = products.length ? products.slice(0, 8) : [{ name: 'Shipment goods', quantity: 1, price: amount }]
    for (const product of rows) {
      const name = product.productName || product.name || 'Shipment goods'
      const qty = Number(product.quantity || product.qty || 1)
      const price = Number(product.price || product.unit_price || product.selling_price || 0)
      const identifiers = [product.sku && `SKU: ${product.sku}`, (product.hsn || product.hsnCode) && `HSN: ${product.hsn || product.hsnCode}`].filter(Boolean).join(' | ')
      commands.push(pdfText(48, y, 9, String(name).slice(0, 48)), pdfText(360, y, 9, qty), pdfText(430, y, 9, price.toFixed(2)), pdfText(505, y, 9, (qty * price).toFixed(2)))
      if (identifiers) commands.push(pdfText(48, y - 11, 7, identifiers.slice(0, 65)))
      y -= 28
    }
    commands.push(pdfLine(330, 315, 547, 315), pdfText(350, 292, 9, 'Item subtotal', true), pdfText(480, 292, 9, `${currency} ${subtotal.toFixed(2)}`), pdfText(350, 273, 9, 'Customer shipping', true), pdfText(480, 273, 9, `${currency} ${customerShipping.toFixed(2)}`), pdfText(350, 254, 9, 'Other / Discount', true), pdfText(480, 254, 9, `${currency} ${(otherCharges - discount).toFixed(2)}`), pdfLine(330, 240, 547, 240), pdfText(350, 216, 11, 'Invoice Total', true), pdfText(465, 216, 11, `${currency} ${grandTotal.toFixed(2)}`, true), pdfText(48, 292, 9, `Payment: ${paymentType}`), pdfText(48, 273, 9, `Courier: ${courier}`), pdfText(48, 254, 9, `Ship from: ${pickupName}`))
    pdfWrappedText(commands, 48, 235, 8, pickupLine, 50, 2, 11)
    commands.push(pdfText(48, 150, 9, 'This is a computer-generated invoice and does not require a physical signature.'), pdfText(48, 95, 9, 'Thank you for shipping with PunjabShip.', true))
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
    if (path === '/api/pickup-addresses/import' && req.method === 'POST') {
      const seller = currentSeller(req)
      if (!seller) return send({ error: 'Authentication required.' }, 401)
      if (!Array.isArray(body) || !body.length) return send({ success: false, message: 'Add at least one pickup address to import.' }, 400)
      const addresses = state.pickupAddresses[seller.id] || []
      const now = new Date().toISOString()
      const imported = []
      const skipped = []
      for (const [index, source] of body.entries()) {
        const pickupSource = source?.pickup || source || {}
        const pincode = String(pickupSource.pincode || '').replace(/\D/g, '').slice(0, 6)
        const contactName = String(pickupSource.contactName || pickupSource.name || '').trim()
        const addressLine1 = String(pickupSource.addressLine1 || pickupSource.address || '').trim()
        if (!/^[1-9]\d{5}$/.test(pincode) || !contactName || !addressLine1) {
          skipped.push({ row: index + 1, reason: 'Contact name, address and valid pincode are required.' })
          continue
        }
        const pickupId = `pickup-${randomUUID()}`
        const pickup = {
          ...pickupSource,
          id: `address-${randomUUID()}`,
          pincode,
          contactName,
          addressLine1,
          ...(!pickupSource.city || !pickupSource.state ? locationFields(pincode) : {}),
        }
        const address = {
          ...source,
          id: pickupId,
          pickupId,
          addressId: pickup.id,
          userId: seller.id,
          pickup,
          rto: source.rto || source.rtoAddress || null,
          isPrimary: source.isPrimary === true || (!addresses.length && !imported.length),
          isPickupEnabled: source.isPickupEnabled !== false,
          isRTOSame: !source.rto && !source.rtoAddress,
          createdAt: now,
          updatedAt: now,
        }
        delete address.rtoAddress
        imported.push(address)
      }
      if (!imported.length) return send({ success: false, message: 'No valid pickup addresses were found.', skipped }, 400)
      if (imported.some((item) => item.isPrimary)) addresses.forEach((item) => { item.isPrimary = false })
      state.pickupAddresses[seller.id] = [...addresses, ...imported]
      save()
      return send({ success: true, data: imported, imported: imported.length, skipped, message: `${imported.length} pickup address(es) imported.` })
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

    if (path === '/api/admin/zones/postal-options' && req.method === 'GET') {
      const country = String(requestUrl.searchParams.get('country') || '').trim()
      const countryCode = serviceabilityCountryCode(country)
      const search = String(requestUrl.searchParams.get('search') || '').trim().toLowerCase()
      const selectedStates = new Set(
        String(requestUrl.searchParams.get('states') || '')
          .split('|')
          .map((value) => value.trim().toLowerCase())
          .filter(Boolean),
      )
      const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1))
      const limit = Math.min(100, Math.max(1, Number(requestUrl.searchParams.get('limit') || 50)))
      let locations = []
      if (countryCode === 'IN') {
        locations = serviceabilityLocations().filter((item) => String(item.country || 'India').toLowerCase() === 'india')
      } else if (countryCode) {
        locations = globalPostalRows
          .filter((row) => row[0] === countryCode)
          .map(globalPostalLocation)
      }
      if (selectedStates.size) {
        locations = locations.filter((item) => selectedStates.has(String(item.state || '').trim().toLowerCase()))
      }
      if (search) {
        locations = locations.filter((item) => (
          `${item.pincode || ''} ${item.city || ''} ${item.state || ''} ${item.country || ''}`
            .toLowerCase()
            .includes(search)
        ))
      }
      locations = [...new Map(locations.map((item) => [
        `${String(item.country || country).toLowerCase()}::${normalizedPostalValue(item.pincode)}`,
        item,
      ])).values()]
      const start = (page - 1) * limit
      return send({
        success: true,
        data: locations.slice(start, start + limit),
        total: locations.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(locations.length / limit)),
      })
    }
    if (path === '/api/admin/zones' && req.method === 'GET') {
      const businessType = normalizeBusinessType(requestUrl.searchParams.get('business_type') || '')
      const zones = requestUrl.searchParams.get('business_type') ? state.zones.filter((item) => normalizeBusinessType(item.business_type) === businessType) : state.zones
      return send(zones)
    }
    if (path === '/api/admin/zones' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      if (!body.name || !body.code) return send({ success: false, message: 'Zone name and code are required.' }, 400)
      const zone = withNormalizedZoneCountries({ ...body, id: body.id || `zone-${randomUUID()}`, business_type: normalizeBusinessType(body.business_type || body.businessType), is_active: body.is_active !== false })
      state.zones.push(zone); save(); return send(zone, 201)
    }
    const zoneMappingsMatch = path.match(/^\/api\/admin\/zones\/([^/]+)\/mappings$/)
    if (zoneMappingsMatch && req.method === 'GET') {
      const zoneId = decodeURIComponent(zoneMappingsMatch[1])
      const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1))
      const limit = Math.min(500, Math.max(1, Number(requestUrl.searchParams.get('limit') || 20)))
      const searchPincode = String(requestUrl.searchParams.get('pincode') || '').trim()
      const city = String(requestUrl.searchParams.get('city') || '').trim().toLowerCase()
      const stateName = String(requestUrl.searchParams.get('state') || '').trim().toLowerCase()
      let mappings = state.zoneMappings.filter((item) => item.zone_id === zoneId && normalizeBusinessType(item.business_type) !== 'b2b')
      if (searchPincode) mappings = mappings.filter((item) => String(item.pincode).includes(searchPincode))
      if (city) mappings = mappings.filter((item) => String(item.city || '').toLowerCase().includes(city))
      if (stateName) mappings = mappings.filter((item) => String(item.state || '').toLowerCase().includes(stateName))
      const start = (page - 1) * limit
      return send({ data: mappings.slice(start, start + limit), total: mappings.length, page, limit })
    }
    if (zoneMappingsMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const pincode = String(body.pincode || '').replace(/\D/g, '').slice(0, 6)
      if (!/^[1-9]\d{5}$/.test(pincode)) return send({ success: false, message: 'A valid six-digit pincode is required.' }, 400)
      const zoneId = decodeURIComponent(zoneMappingsMatch[1])
      if (state.zoneMappings.some((item) => item.zone_id === zoneId && item.pincode === pincode)) return send({ success: false, message: 'This pincode is already mapped to the zone.' }, 409)
      const mapping = { id: `zone-mapping-${randomUUID()}`, ...locationFields(pincode), ...body, pincode, zone_id: zoneId, business_type: 'b2c', created_at: new Date().toISOString() }
      state.zoneMappings.push(mapping); save(); return send(mapping, 201)
    }
    const zoneMappingImportMatch = path.match(/^\/api\/admin\/zones\/([^/]+)\/mappings\/import$/)
    if (zoneMappingImportMatch && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const zoneId = decodeURIComponent(zoneMappingImportMatch[1])
      const { headers, records } = uploadedCsv(body)
      requireCsvHeaders(headers, ['pincode'])
      let choices = {}
      try { choices = body.userChoices ? JSON.parse(body.userChoices) : {} } catch { return send({ success: false, message: 'Duplicate choices are invalid.' }, 400) }
      const inserted = []
      const overridden = []
      const skipped = []
      const duplicates = records.flatMap((row) => {
        const pincode = String(row.pincode || '').replace(/\D/g, '').slice(0, 6)
        const existing = state.zoneMappings.find((item) => item.pincode === pincode && normalizeBusinessType(item.business_type) !== 'b2b')
        if (!existing || existing.zone_id === zoneId || choices[existing.id]) return []
        return [{ row: row.__row, incomingMapping: { ...locationFields(pincode), city: row.city, state: row.state, pincode, zone_id: zoneId }, existingMapping: existing }]
      })
      if (duplicates.length) return send({ success: true, duplicates, inserted: 0, overridden: [], skipped: [] })
      for (const row of records) {
        const pincode = String(row.pincode || '').replace(/\D/g, '').slice(0, 6)
        if (!/^[1-9]\d{5}$/.test(pincode)) { skipped.push({ row: row.__row, reason: 'Invalid pincode.' }); continue }
        const existing = state.zoneMappings.find((item) => item.pincode === pincode && normalizeBusinessType(item.business_type) !== 'b2b')
        const next = { ...locationFields(pincode), city: row.city || locationFields(pincode).city, state: row.state || locationFields(pincode).state, pincode, zone_id: zoneId, business_type: 'b2c', updated_at: new Date().toISOString() }
        if (existing) {
          if (choices[existing.id] === 'skip') { skipped.push({ row: row.__row, pincode, reason: 'Skipped by user.' }); continue }
          Object.assign(existing, next); overridden.push(existing)
        } else {
          const mapping = { id: `zone-mapping-${randomUUID()}`, ...next, created_at: new Date().toISOString() }
          state.zoneMappings.push(mapping); inserted.push(mapping)
        }
      }
      save()
      return send({ success: true, inserted: inserted.length, overridden, skipped, message: `${inserted.length + overridden.length} mapping(s) imported.` })
    }
    const zoneMappingItemMatch = path.match(/^\/api\/admin\/zones\/mappings\/([^/]+)$/)
    if (zoneMappingItemMatch && ['PUT', 'DELETE'].includes(req.method)) {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const index = state.zoneMappings.findIndex((item) => item.id === zoneMappingItemMatch[1])
      if (index < 0) return send({ success: false, message: 'Zone mapping not found.' }, 404)
      if (req.method === 'DELETE') { state.zoneMappings.splice(index, 1); save(); return send({ success: true }) }
      const mapping = state.zoneMappings[index]
      Object.assign(mapping, body, { id: mapping.id, updated_at: new Date().toISOString() }); save(); return send(mapping)
    }
    const zoneMatch = path.match(/^\/api\/admin\/zones\/([^/]+)$/)
    if (zoneMatch && req.method === 'GET') {
      const zone = state.zones.find((item) => item.id === zoneMatch[1]); return zone ? send(zone) : send({ message: 'Zone not found.' }, 404)
    }
    if (zoneMatch && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const zone = state.zones.find((item) => item.id === zoneMatch[1]); if (!zone) return send({ message: 'Zone not found.' }, 404)
      Object.assign(zone, withNormalizedZoneCountries({ ...zone, ...body }), { id: zone.id }); save(); return send(zone)
    }
    if (zoneMatch && req.method === 'DELETE') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const before = state.zones.length; state.zones = state.zones.filter((item) => item.id !== zoneMatch[1]); if (before === state.zones.length) return send({ message: 'Zone not found.' }, 404)
      save(); return send({ success: true })
    }

    if (path === '/api/admin/b2b/pincodes' && req.method === 'GET') {
      const page = Math.max(1, Number(requestUrl.searchParams.get('page') || 1))
      const limit = Math.min(500, Math.max(1, Number(requestUrl.searchParams.get('limit') || 20)))
      const zoneId = String(requestUrl.searchParams.get('zone_id') || '')
      const searchPincode = String(requestUrl.searchParams.get('pincode') || '').trim()
      const city = String(requestUrl.searchParams.get('city') || '').trim().toLowerCase()
      const stateName = String(requestUrl.searchParams.get('state') || '').trim().toLowerCase()
      let mappings = state.zoneMappings.filter((item) => normalizeBusinessType(item.business_type) === 'b2b')
      if (zoneId) mappings = mappings.filter((item) => item.zone_id === zoneId)
      if (searchPincode) mappings = mappings.filter((item) => String(item.pincode).includes(searchPincode))
      if (city) mappings = mappings.filter((item) => String(item.city || '').toLowerCase().includes(city))
      if (stateName) mappings = mappings.filter((item) => String(item.state || '').toLowerCase().includes(stateName))
      for (const key of ['is_oda', 'is_remote', 'is_mall', 'is_sez', 'is_airport', 'is_high_security']) {
        const value = requestUrl.searchParams.get(key)
        if (value === 'true' || value === 'false') mappings = mappings.filter((item) => Boolean(item[key]) === (value === 'true'))
      }
      const start = (page - 1) * limit
      return send({ success: true, data: mappings.slice(start, start + limit), pagination: { total: mappings.length, page, limit, totalPages: Math.max(1, Math.ceil(mappings.length / limit)) } })
    }
    if (path === '/api/admin/b2b/pincodes' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const pincode = String(body.pincode || '').replace(/\D/g, '').slice(0, 6)
      const zoneId = String(body.zoneId || body.zone_id || '')
      if (!/^[1-9]\d{5}$/.test(pincode) || !zoneId) return send({ success: false, message: 'Pincode and zone are required.' }, 400)
      if (state.zoneMappings.some((item) => item.pincode === pincode && normalizeBusinessType(item.business_type) === 'b2b')) return send({ success: false, message: 'This B2B pincode already exists.' }, 409)
      const flags = body.flags || {}
      const mapping = {
        id: `b2b-pincode-${randomUUID()}`, ...locationFields(pincode), ...body, pincode, zone_id: zoneId, business_type: 'b2b',
        is_oda: Boolean(flags.isOda ?? body.is_oda), is_remote: Boolean(flags.isRemote ?? body.is_remote),
        is_mall: Boolean(flags.isMall ?? body.is_mall), is_sez: Boolean(flags.isSez ?? body.is_sez),
        is_airport: Boolean(flags.isAirport ?? body.is_airport), is_high_security: Boolean(flags.isHighSecurity ?? body.is_high_security),
        created_at: new Date().toISOString(),
      }
      delete mapping.flags
      state.zoneMappings.push(mapping); save(); return send({ success: true, data: mapping }, 201)
    }
    if (path === '/api/admin/b2b/pincodes/import' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const { headers, records } = uploadedCsv(body)
      requireCsvHeaders(headers, ['pincode'])
      const defaultZoneId = importScopeValue(body, 'zoneId', importScopeValue(body, 'defaultZoneId'))
      if (!defaultZoneId) return send({ success: false, message: 'Select a B2B zone before importing pincodes.' }, 400)
      let inserted = 0
      let updated = 0
      const skipped = []
      for (const row of records) {
        const pincode = String(row.pincode || '').replace(/\D/g, '').slice(0, 6)
        if (!/^[1-9]\d{5}$/.test(pincode)) { skipped.push({ row: row.__row, reason: 'Invalid pincode.' }); continue }
        const existing = state.zoneMappings.find((item) => item.pincode === pincode && normalizeBusinessType(item.business_type) === 'b2b')
        if (existing && existing.zone_id !== defaultZoneId) { skipped.push({ row: row.__row, pincode, reason: 'Pincode belongs to another B2B zone.' }); continue }
        const values = {
          ...locationFields(pincode), pincode, zone_id: defaultZoneId, business_type: 'b2b',
          is_oda: csvBoolean(row.is_oda), is_remote: csvBoolean(row.is_remote), is_mall: csvBoolean(row.is_mall),
          is_sez: csvBoolean(row.is_sez), is_airport: csvBoolean(row.is_airport), is_high_security: csvBoolean(row.is_high_security),
          updated_at: new Date().toISOString(),
        }
        if (existing) { Object.assign(existing, values); updated += 1 }
        else { state.zoneMappings.push({ id: `b2b-pincode-${randomUUID()}`, ...values, created_at: new Date().toISOString() }); inserted += 1 }
      }
      if (!inserted && !updated) return send({ success: false, message: 'No valid pincodes were found for this zone.', skipped }, 400)
      save()
      return send({ success: true, inserted, updated, skipped, message: `${inserted + updated} pincode attribute row(s) imported.` })
    }
    const b2bPincodeMatch = path.match(/^\/api\/admin\/b2b\/pincodes\/([^/]+)$/)
    if (b2bPincodeMatch && ['PUT', 'DELETE'].includes(req.method)) {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const index = state.zoneMappings.findIndex((item) => item.id === b2bPincodeMatch[1] && normalizeBusinessType(item.business_type) === 'b2b')
      if (index < 0) return send({ success: false, message: 'B2B pincode not found.' }, 404)
      if (req.method === 'DELETE') { state.zoneMappings.splice(index, 1); save(); return send({ success: true }) }
      const mapping = state.zoneMappings[index]
      const flags = body.flags || {}
      Object.assign(mapping, body, {
        id: mapping.id,
        is_oda: Boolean(flags.isOda ?? body.is_oda ?? mapping.is_oda), is_remote: Boolean(flags.isRemote ?? body.is_remote ?? mapping.is_remote),
        is_mall: Boolean(flags.isMall ?? body.is_mall ?? mapping.is_mall), is_sez: Boolean(flags.isSez ?? body.is_sez ?? mapping.is_sez),
        is_airport: Boolean(flags.isAirport ?? body.is_airport ?? mapping.is_airport), is_high_security: Boolean(flags.isHighSecurity ?? body.is_high_security ?? mapping.is_high_security),
        updated_at: new Date().toISOString(),
      })
      delete mapping.flags
      save(); return send({ success: true, data: mapping })
    }
    if (path === '/api/admin/b2b/pincodes/bulk-delete' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const ids = new Set(Array.isArray(body.ids) ? body.ids : [])
      const before = state.zoneMappings.length
      state.zoneMappings = state.zoneMappings.filter((item) => !ids.has(item.id))
      save(); return send({ success: true, deleted: before - state.zoneMappings.length })
    }
    if (path === '/api/admin/b2b/pincodes/bulk-move' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const ids = new Set(Array.isArray(body.ids) ? body.ids : [])
      let updated = 0
      for (const mapping of state.zoneMappings) if (ids.has(mapping.id)) { mapping.zone_id = body.targetZoneId; updated += 1 }
      save(); return send({ success: true, updated })
    }
    if (path === '/api/admin/b2b/pincodes/bulk-update-flags' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const ids = new Set(Array.isArray(body.ids) ? body.ids : [])
      const flags = body.flags || {}
      const map = { isOda: 'is_oda', isRemote: 'is_remote', isMall: 'is_mall', isSez: 'is_sez', isAirport: 'is_airport', isHighSecurity: 'is_high_security' }
      let updated = 0
      for (const mapping of state.zoneMappings) {
        if (!ids.has(mapping.id)) continue
        for (const [source, target] of Object.entries(map)) if (flags[source] !== undefined) mapping[target] = Boolean(flags[source])
        updated += 1
      }
      save(); return send({ success: true, updated })
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
      const zone = withNormalizedZoneCountries({ ...body, id: body.id || `b2b-zone-${randomUUID()}`, code: String(body.code).trim().toUpperCase(), name: String(body.name).trim(), business_type: 'b2b', states: Array.isArray(body.states) ? body.states : [], is_active: body.is_active !== false, created_at: new Date().toISOString() })
      state.zones.push(zone); save(); return send({ success: true, data: zone }, 201)
    }
    const b2bZoneMatch = path.match(/^\/api\/admin\/b2b\/zones\/([^/]+)$/)
    if (b2bZoneMatch && req.method === 'PUT') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const zone = state.zones.find((item) => item.id === b2bZoneMatch[1] && normalizeBusinessType(item.business_type) === 'b2b')
      if (!zone) return send({ success: false, message: 'B2B zone not found.' }, 404)
      Object.assign(zone, withNormalizedZoneCountries({ ...zone, ...body }), { id: zone.id, business_type: 'b2b', updated_at: new Date().toISOString() }); save(); return send({ success: true, data: zone })
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
    if (path === '/api/admin/b2b/zone-rates/import' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const { headers, records } = uploadedCsv(body)
      requireCsvHeaders(headers, ['origin_zone_code', 'destination_zone_code', 'rate_per_kg'])
      const scope = {
        courierId: Number(importScopeValue(body, 'courier_id', DEFAULT_MANUAL_COURIER_ID)),
        serviceProvider: importScopeValue(body, 'service_provider', 'manual').toLowerCase(),
        planId: importScopeValue(body, 'plan_id', 'starter-b2b'),
      }
      let inserted = 0
      let updated = 0
      const skipped = []
      for (const row of records) {
        const origin = csvZone(row.origin_zone_code, 'b2b')
        const destination = csvZone(row.destination_zone_code, 'b2b')
        const ratePerKg = csvNumber(row.rate_per_kg)
        if (!origin || !destination || ratePerKg === null || ratePerKg < 0) {
          skipped.push({ row: row.__row, reason: !origin || !destination ? 'Unknown origin or destination zone.' : 'Invalid rate_per_kg.' })
          continue
        }
        const values = {
          originZoneId: origin.id, origin_zone_id: origin.id,
          destinationZoneId: destination.id, destination_zone_id: destination.id,
          courier_id: scope.courierId, service_provider: scope.serviceProvider, plan_id: scope.planId,
          ratePerKg, rate_per_kg: ratePerKg,
          min_charge: csvNumber(row.min_charge), max_weight_limit: csvNumber(row.max_weight_limit),
          updated_at: new Date().toISOString(),
        }
        const existing = state.b2bZoneRates.find((item) => (
          (item.originZoneId || item.origin_zone_id) === origin.id &&
          (item.destinationZoneId || item.destination_zone_id) === destination.id &&
          sameImportScope(item, scope)
        ))
        if (existing) { Object.assign(existing, values); updated += 1 }
        else { state.b2bZoneRates.push({ id: `b2b-zone-rate-${randomUUID()}`, ...values, created_at: new Date().toISOString() }); inserted += 1 }
      }
      if (!inserted && !updated) return send({ success: false, message: 'No valid B2B rate rows were found in the CSV.', skipped }, 400)
      save()
      return send({ success: true, inserted, updated, skipped, message: `${inserted + updated} B2B rate row(s) imported.` })
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

    if (path === '/api/admin/b2b/additional-charges' && req.method === 'GET') {
      const scope = {
        courierId: importScopeValue(Object.fromEntries(requestUrl.searchParams), 'courier_id'),
        serviceProvider: importScopeValue(Object.fromEntries(requestUrl.searchParams), 'service_provider').toLowerCase(),
        planId: importScopeValue(Object.fromEntries(requestUrl.searchParams), 'plan_id'),
      }
      const charges = state.b2bAdditionalCharges.find((item) => sameImportScope(item, scope))
      return charges ? send({ success: true, data: charges }) : send({})
    }
    if (path === '/api/admin/b2b/additional-charges' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const normalized = normalizedChargePayload(body)
      const scope = {
        courierId: importScopeValue(normalized, 'courier_id'),
        serviceProvider: importScopeValue(normalized, 'service_provider').toLowerCase(),
        planId: importScopeValue(normalized, 'plan_id'),
      }
      if (!scope.planId) return send({ success: false, message: 'Plan is required for overhead charges.' }, 400)
      let charges = state.b2bAdditionalCharges.find((item) => sameImportScope(item, scope))
      if (charges) Object.assign(charges, normalized, { updated_at: new Date().toISOString() })
      else {
        charges = { id: `b2b-charges-${randomUUID()}`, ...normalized, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        state.b2bAdditionalCharges.push(charges)
      }
      save(); return send({ success: true, data: charges, message: 'Overhead charges saved.' })
    }
    if (path === '/api/admin/b2b/additional-charges/import' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const { headers, records } = uploadedCsv(body)
      const supported = headers.filter((header) => !['courier_id', 'service_provider', 'plan_id'].includes(header))
      if (!supported.length) return send({ success: false, message: 'The CSV has no overhead charge columns.' }, 400)
      let inserted = 0
      let updated = 0
      const skipped = []
      for (const row of records) {
        if (row.courier_id && !Number.isFinite(Number(row.courier_id))) { skipped.push({ row: row.__row, reason: 'Invalid courier ID.' }); continue }
        const scope = {
          courierId: importScopeValue(row, 'courier_id', importScopeValue(body, 'courier_id')),
          serviceProvider: importScopeValue(row, 'service_provider', importScopeValue(body, 'service_provider')).toLowerCase(),
          planId: importScopeValue(row, 'plan_id', importScopeValue(body, 'plan_id')),
        }
        if (!scope.planId || (!scope.courierId && !scope.serviceProvider)) { skipped.push({ row: row.__row, reason: 'Plan and courier scope are required.' }); continue }
        const values = { courier_id: scope.courierId, service_provider: scope.serviceProvider, plan_id: scope.planId, updated_at: new Date().toISOString() }
        for (const header of supported) {
          const rawValue = row[header]
          if (rawValue === '') continue
          if (header.endsWith('_method')) values[header] = rawValue
          else {
            const number = csvNumber(rawValue)
            if (number !== null) values[header] = number
          }
        }
        let charges = state.b2bAdditionalCharges.find((item) => sameImportScope(item, scope))
        if (charges) { Object.assign(charges, values); updated += 1 }
        else { charges = { id: `b2b-charges-${randomUUID()}`, ...values, created_at: new Date().toISOString() }; state.b2bAdditionalCharges.push(charges); inserted += 1 }
      }
      if (!inserted && !updated) return send({ success: false, message: 'No valid overhead charge rows were found.', skipped }, 400)
      save(); return send({ success: true, inserted, updated, skipped, message: `${inserted + updated} overhead charge row(s) imported.` })
    }

    if (path === '/api/admin/couriers/shipping-rates/import' && req.method === 'POST') {
      if (!isAdminRequest(req)) return send({ success: false, message: 'Administrator authentication required.' }, 401)
      const { headers, records } = uploadedCsv(body)
      const businessType = normalizeBusinessType(requestUrl.searchParams.get('businessType') || 'b2c')
      const planId = String(requestUrl.searchParams.get('planId') || (businessType === 'b2b' ? 'starter-b2b' : 'starter-b2c'))
      const fixedCourierId = String(requestUrl.searchParams.get('courierId') || '')
      const fixedCourierName = String(requestUrl.searchParams.get('courierName') || '')
      const fixedProvider = String(requestUrl.searchParams.get('serviceProvider') || '').toLowerCase()
      let savedRows = 0
      const skipped = []

      if (businessType === 'b2b') {
        requireCsvHeaders(headers, ['courier_id'])
        for (const row of records) {
          const courierId = Number(row.courier_id || fixedCourierId)
          if (!Number.isFinite(courierId)) { skipped.push({ row: row.__row, reason: 'Invalid courier ID.' }); continue }
          const courierName = row.courier_name || fixedCourierName || state.manualCouriers.find((item) => Number(item.courierId) === courierId)?.displayName || ''
          const serviceProvider = String(row.service_provider || fixedProvider || 'manual').toLowerCase()
          const rates = {}
          let zoneValueCount = 0
          for (const zone of state.zones.filter((item) => normalizeBusinessType(item.business_type) === 'b2b')) {
            const key = csvHeaderKey(zone.name)
            const forward = csvNumber(row[`${key}_per_kg_forward`])
            const rto = csvNumber(row[`${key}_per_kg_rto`])
            if (forward !== null || rto !== null) zoneValueCount += 1
            rates[zone.name] = { forward_per_kg: forward ?? 0, rto_per_kg: rto ?? forward ?? 0, min_weight: csvNumber(row.min_weight) ?? 0 }
          }
          if (!zoneValueCount) { skipped.push({ row: row.__row, reason: 'No zone rate values found.' }); continue }
          const scope = { courierId, serviceProvider, planId }
          let rate = state.shippingRates.find((item) => normalizeBusinessType(item.businessType) === 'b2b' && sameImportScope(item, scope))
          const values = {
            courier_id: courierId, courier_name: courierName, service_provider: serviceProvider, plan_id: planId,
            businessType: 'b2b', mode: row.mode || 'surface', min_weight: csvNumber(row.min_weight) ?? 0,
            cod_charges: csvNumber(row.cod_charges) ?? 0, cod_percent: csvNumber(row.cod_percent) ?? 0,
            other_charges: csvNumber(row.other_charges) ?? 0, rates, updated_at: new Date().toISOString(),
          }
          if (rate) Object.assign(rate, values)
          else { rate = { id: `rate-${randomUUID()}`, ...values, created_at: new Date().toISOString() }; state.shippingRates.push(rate) }
          savedRows += 1
        }
      } else {
        requireCsvHeaders(headers, ['weight_kg'])
        const groups = new Map()
        for (const row of records) {
          const courierId = Number(fixedCourierId || row.courier_id)
          if (!Number.isFinite(courierId)) { skipped.push({ row: row.__row, reason: 'Invalid courier ID.' }); continue }
          const serviceProvider = String(fixedProvider || row.service_provider || 'manual').toLowerCase()
          const mode = String(row.mode || 'standard').toLowerCase()
          const weight = csvNumber(row.weight_kg)
          if (weight === null || weight <= 0) { skipped.push({ row: row.__row, reason: 'Invalid slab weight.' }); continue }
          const key = `${courierId}|${serviceProvider}|${mode}`
          if (!groups.has(key)) groups.set(key, {
            courierId, serviceProvider, mode,
            courierName: fixedCourierName || row.courier || row.courier_name || state.manualCouriers.find((item) => Number(item.courierId) === courierId)?.displayName || '',
            rows: [],
          })
          groups.get(key).rows.push({ ...row, weight })
        }
        for (const group of groups.values()) {
          const scope = { courierId: group.courierId, serviceProvider: group.serviceProvider, planId }
          let rate = state.shippingRates.find((item) => normalizeBusinessType(item.businessType) === 'b2c' && sameImportScope(item, scope) && String(item.mode || '') === group.mode)
          const zoneSlabs = {}
          const simpleRates = {}
          for (const zone of state.zones.filter((item) => normalizeBusinessType(item.business_type) === 'b2c')) {
            const zoneKey = csvHeaderKey(zone.name)
            const forward = group.rows
              .map((row) => ({ row, amount: csvNumber(row[zoneKey]) }))
              .filter((item) => item.amount !== null)
              .sort((a, b) => a.row.weight - b.row.weight)
            if (!forward.length) continue
            const forwardSlabs = forward.map(({ row, amount }, index) => ({
              weight_from: index ? forward[index - 1].row.weight : 0,
              weight_to: row.weight,
              rate: amount,
              extra_rate: amount,
              extra_weight_unit: Math.max(0.001, row.weight - (index ? forward[index - 1].row.weight : 0)),
            }))
            const rtoSlabs = forwardSlabs.map((slab, index) => {
              const percent = csvNumber(forward[index].row.rto_percent)
              return { ...slab, rate: percent === null ? slab.rate : Number((slab.rate * percent / 100).toFixed(2)) }
            })
            zoneSlabs[zone.name] = { forward: forwardSlabs, rto: rtoSlabs }
            simpleRates[zone.name] = { forward: forwardSlabs[0].rate, rto: rtoSlabs[0].rate }
          }
          if (!Object.keys(zoneSlabs).length) { skipped.push({ courier_id: group.courierId, reason: 'No zone rate values found.' }); continue }
          const first = group.rows[0]
          const values = {
            courier_id: group.courierId, courier_name: group.courierName, service_provider: group.serviceProvider,
            plan_id: planId, businessType: 'b2c', mode: group.mode, min_weight: Math.min(...group.rows.map((row) => row.weight)),
            cod_charges: csvNumber(first.cod_rs) ?? 0, cod_percent: csvNumber(first.cod_percent) ?? 0,
            rates: simpleRates, zone_slabs: zoneSlabs, updated_at: new Date().toISOString(),
          }
          if (rate) Object.assign(rate, values)
          else { rate = { id: `rate-${randomUUID()}`, ...values, created_at: new Date().toISOString() }; state.shippingRates.push(rate) }
          savedRows += group.rows.length
        }
      }

      if (!savedRows) return send({ success: false, message: 'No valid shipping rate rows were found in the CSV.', skipped }, 400)
      save()
      return send({ success: true, data: { savedRows, skipped }, message: `${savedRows} shipping rate row(s) imported.` })
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
      const validation = validateOrderPayload(body, 'b2c')
      if (validation.errors.length) return send({ success: false, message: validation.errors[0], errors: validation.errors }, 400)
      const normalizedBody = withNormalizedOrderCountry(body, validation)
      if (isManualCourierOrder(normalizedBody)) {
        const { order, shipment } = createManualShipmentOrder(seller, normalizedBody, 'b2c')
        await stateStore.save(state)
        return send({ success: true, message: 'Manual courier shipment booked.', shipment: orderForPanels(order), manualShipment: shipment }, 201)
      }
      if (!isShipGlobalOrder(normalizedBody)) return send({ success: false, message: 'Select ShipGlobal as the courier partner for live booking.' }, 400)
      if (!shipGlobal.isConfigured()) return send({ success: false, message: 'ShipGlobal production credentials are not configured yet.' }, 503)
      if (state.orders.some((order) => String(order.order_number) === String(normalizedBody.order_number))) return send({ success: false, message: 'Order number already exists.' }, 409)

      const providerPayload = mapPunjabShipOrderToShipGlobal(normalizedBody, { service: SHIPGLOBAL_SERVICE, currencyCode: SHIPGLOBAL_CURRENCY })
      const missing = validateShipGlobalOrder(providerPayload)
      if (missing.length) return send({ success: false, message: `Missing ShipGlobal fields: ${missing.join(', ')}`, missingFields: missing }, 400)

      const providerResult = await shipGlobal.addOrder(providerPayload)
      const awb = extractShipGlobalAwb(providerResult.data, providerResult.headers)
      const now = new Date().toISOString()
      const order = {
        ...normalizedBody,
        id: `shipglobal-${randomUUID()}`,
        order_id: normalizedBody.order_number,
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
        buyer_name: normalizedBody.consignee?.name || '',
        buyer_phone: normalizedBody.consignee?.phone || '',
        customer_name: normalizedBody.consignee?.name || '',
        customer_phone: normalizedBody.consignee?.phone || '',
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
      const validation = validateOrderPayload(body, 'b2b')
      if (validation.errors.length) return send({ success: false, message: validation.errors[0], errors: validation.errors }, 400)
      const normalizedBody = withNormalizedOrderCountry(body, validation)
      if (!isManualCourierOrder(normalizedBody)) return send({ success: false, message: 'Select PunjabShip Manual for B2B booking.' }, 400)
      const { order, shipment } = createManualShipmentOrder(seller, normalizedBody, 'b2b')
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
    const freshDocumentMatch = path.match(/^\/api\/orders\/([^/]+)\/documents\/(label|invoice|manifest)$/)
    if (freshDocumentMatch && req.method === 'GET') {
      const seller = currentSeller(req)
      const admin = isAdminRequest(req)
      if (!seller && !admin) return send({ success: false, message: 'Authentication required.' }, 401)
      const orderId = decodeURIComponent(freshDocumentMatch[1])
      const order = state.orders.find((item) => item.id === orderId && (admin || item.user_id === seller.id))
      if (!order) return send({ success: false, message: 'Order not found.' }, 404)
      const type = freshDocumentMatch[2]
      if (type === 'manifest' && !order.manifest_id && !order.manifest && !order.manifest_key) {
        return send({ success: false, message: 'Manifest is not available yet.' }, 404)
      }
      const pdf = createOrderDocumentPdf(order, type)
      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': pdf.length,
        'Content-Disposition': `attachment; filename="${documentFileName(order, type)}"`,
        'Cache-Control': 'private, no-store',
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
      const country = String(requestUrl.searchParams.get('country') || '').trim()
      const countryLower = country.toLowerCase()
      const selectedCountryCode = serviceabilityCountryCode(country)
      const lookupCountryCode = selectedCountryCode || (!country && /^[1-9]\d{5}$/.test(pincode) ? 'IN' : '')
      if (lookupCountryCode === 'IN' && postalCodeIsValid('IN', pincode) && !city && !stateName) {
        const custom = state.customServiceabilityLocations.find((item) => item.pincode.toLowerCase() === pincode && String(item.country || 'India').toLowerCase() === 'india')
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

      let postalRows = selectedCountryCode === 'IN' ? [] : globalPostalRows
      if (country && !selectedCountryCode) postalRows = []
      else if (selectedCountryCode && selectedCountryCode !== 'IN') postalRows = postalRows.filter((row) => row[0] === selectedCountryCode)
      if (pincode) postalRows = postalRows.filter((row) => String(row[1]).toLowerCase().includes(pincode))
      if (city) postalRows = postalRows.filter((row) => String(row[2]).toLowerCase().includes(city))
      if (stateName) postalRows = postalRows.filter((row) => String(row[3]).toLowerCase().includes(stateName))

      let locations = serviceabilityLocations()
      if (pincode) locations = locations.filter((item) => item.pincode.toLowerCase().includes(pincode))
      if (city) locations = locations.filter((item) => `${item.city} ${item.district || ''}`.toLowerCase().includes(city))
      if (stateName) locations = locations.filter((item) => item.state.toLowerCase().includes(stateName))
      if (country) locations = locations.filter((item) => String(item.country || 'India').toLowerCase() === countryLower)

      const start = (page - 1) * limit
      const total = postalRows.length + locations.length
      const data = []
      if (start < postalRows.length) {
        data.push(...postalRows.slice(start, Math.min(postalRows.length, start + limit)).map(globalPostalLocation))
      }
      const localStart = Math.max(0, start - postalRows.length)
      if (data.length < limit && localStart < locations.length) {
        data.push(...locations.slice(localStart, localStart + (limit - data.length)))
      }
      return send({ success: true, data, total, totalCount: total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) })
    }
    if (path === '/api/serviceability/locations' && req.method === 'POST') {
      const pincode = String(body.pincode || '').trim().toUpperCase()
      const country = String(body.country || 'India').trim()
      const countryLower = country.toLowerCase()
      const countryCode = countryLower === 'india' ? 'IN' : countryLower === 'canada' ? 'CA' : countryLower === 'united states' ? 'US' : 'INT'
      if (!postalCodeIsValid(countryCode, pincode) || !body.city || !body.state) return send({ success: false, error: 'Valid postal code, city, state/province and country are required.' }, 400)
      const location = { id: `custom-location-${randomUUID()}`, pincode, city: String(body.city).trim(), state: String(body.state).trim(), country, tags: Array.isArray(body.tags) ? body.tags : [], source: 'PunjabShip' }
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
      if (location.isSystemPostalCode) return send({ success: false, error: 'Imported postal-code data cannot be edited here.' }, 409)
      const updated = { ...location, ...body, id, pincode: String(body.pincode ?? location.pincode).trim().toUpperCase(), country: String(body.country ?? location.country ?? 'India').trim() }
      const customIndex = state.customServiceabilityLocations.findIndex((item) => item.id === id)
      if (customIndex >= 0) state.customServiceabilityLocations[customIndex] = updated
      else state.serviceabilityOverrides[id] = updated
      save()
      return send(updated)
    }
    if (serviceabilityMatch && req.method === 'DELETE') {
      const id = serviceabilityMatch[1]
      const location = serviceabilityLocations().find((item) => item.id === id)
      if (!location) return send({ success: false, error: 'Location not found.' }, 404)
      if (location.isSystemPostalCode) return send({ success: false, error: 'Imported postal-code data cannot be deleted here.' }, 409)
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

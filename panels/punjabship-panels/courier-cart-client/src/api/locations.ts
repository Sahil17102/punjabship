import axiosInstance from './axiosInstance'

export type ServiceabilityLocation = {
  pincode?: string
  city?: string
  state?: string
  country?: string
}

export type PincodeLocation = {
  pincode: string
  city: string
  state: string
  country?: string
}

export const normalizePincode = (value: unknown) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 6)

type PincodeChunk = Record<string, Omit<PincodeLocation, 'pincode'>>
const pincodeChunkCache = new Map<string, Promise<PincodeChunk | null>>()

const loadPincodeChunk = (prefix: string) => {
  const cached = pincodeChunkCache.get(prefix)
  if (cached) return cached

  const request = fetch(`/pincodes/${prefix}.json`, { cache: 'force-cache' })
    .then((response) => (response.ok ? response.json() as Promise<PincodeChunk> : null))
    .catch(() => null)
  pincodeChunkCache.set(prefix, request)
  return request
}

const lookupViaStaticIndex = async (pincode: string): Promise<PincodeLocation | null> => {
  const chunk = await loadPincodeChunk(pincode.slice(0, 2))
  const location = chunk?.[pincode]
  return location ? { pincode, ...location } : null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchLocations = async (params: any) => {
  const res = await axiosInstance.get(`/serviceability/locations`, { params })
  return res.data
}

const findExactLocation = (rows: ServiceabilityLocation[], pincode: string) =>
  rows.find((row) => String(row?.pincode || '') === pincode) ?? rows[0]

const lookupViaServiceability = async (pincode: string): Promise<PincodeLocation | null> => {
  const result = await fetchLocations({ pincode, limit: 1 })
  const rows: ServiceabilityLocation[] = Array.isArray(result?.data) ? result.data : []
  const location = findExactLocation(rows, pincode)

  if (!location?.city || !location?.state) return null

  return {
    pincode,
    city: location.city,
    state: location.state,
    country: location.country || 'India',
  }
}

const lookupViaPostalApi = async (pincode: string): Promise<PincodeLocation | null> => {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`)
  if (!res.ok) return null

  const data = await res.json()
  const loc = data?.[0]?.PostOffice?.[0]
  const status = data?.[0]?.Status

  if (status !== 'Success' || !loc) return null

  return {
    pincode,
    city: loc?.District || '',
    state: loc?.State || '',
    country: 'India',
  }
}

export const lookupPincodeLocation = async (
  value: unknown,
  options: { fallbackToPostalApi?: boolean } = {},
): Promise<PincodeLocation | null> => {
  const pincode = normalizePincode(value)
  if (!/^\d{6}$/.test(pincode)) return null

  const staticLocation = await lookupViaStaticIndex(pincode)
  if (staticLocation) return staticLocation

  try {
    const serviceabilityLocation = await lookupViaServiceability(pincode)
    if (serviceabilityLocation) return serviceabilityLocation
  } catch {
    // Keep the fallback path available when the backend is temporarily unavailable.
  }

  if (options.fallbackToPostalApi === false) return null
  return lookupViaPostalApi(pincode)
}

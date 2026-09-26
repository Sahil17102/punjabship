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

  try {
    const serviceabilityLocation = await lookupViaServiceability(pincode)
    if (serviceabilityLocation) return serviceabilityLocation
  } catch {
    // Keep the fallback path available when the backend is temporarily unavailable.
  }

  if (options.fallbackToPostalApi === false) return null
  return lookupViaPostalApi(pincode)
}

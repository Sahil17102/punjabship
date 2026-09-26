export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export const GST_STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '26': 'Dadra and Nagar Haveli and Daman and Diu',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
  '97': 'Other Territory',
}

export type GSTDetailsResult =
  | {
      isValid: true
      normalizedGstin: string
      stateCode: string
      stateName: string
      pan: string
    }
  | {
      isValid: false
      error: 'Invalid GSTIN' | 'Invalid State Code'
      normalizedGstin: string
      stateCode?: string
      pan?: string
    }

export const extractGSTDetails = (gstin?: string | null): GSTDetailsResult => {
  const normalizedGstin = String(gstin || '').trim().toUpperCase()

  if (!normalizedGstin || !GSTIN_REGEX.test(normalizedGstin)) {
    return {
      isValid: false,
      error: 'Invalid GSTIN',
      normalizedGstin,
    }
  }

  const stateCode = normalizedGstin.substring(0, 2)
  const pan = normalizedGstin.substring(2, 12)
  const stateName = GST_STATE_CODES[stateCode]

  if (!stateName) {
    return {
      isValid: false,
      error: 'Invalid State Code',
      normalizedGstin,
      stateCode,
      pan,
    }
  }

  return {
    isValid: true,
    normalizedGstin,
    stateCode,
    stateName,
    pan,
  }
}

export type BusinessStructure = 'individual' | 'company' | 'partnership_firm' | 'sole_proprietor'

export type CompanyType =
  | 'private_limited'
  | 'public_limited'
  | 'one_person_company'
  | 'llp'
  | 'section_8_company'

// src/types/generic.types.ts
export type AddressType = 'pickup' | 'rto' | 'billing'

export interface IAddress {
  id?: string
  userId?: string
  type?: AddressType

  contactName?: string
  contactPhone?: string
  contactEmail?: string
  addressNickname?: string
  contactPersonRole?: string

  addressLine1?: string
  addressLine2?: string
  landmark?: string

  city?: string
  state?: string
  country?: string
  pincode?: string

  latitude?: string
  longitude?: string
  gstNumber?: string

  createdAt?: string
  updatedAt?: string
}

export interface HydratedPickup {
  id: string
  userId: string
  addressId: string
  rtoAddressId?: string | null
  pickupId: string
  isPrimary: boolean
  isPickupEnabled: boolean
  pickup: IAddress
  rto?: IAddress | null
  createdAt: string
  isRTOSame: boolean
  updatedAt: string
}

export interface PickupFormValues {
  useDifferentRTO: boolean
  pickup: {
    addressNickname?: string
    id?: string
    contactName?: string
    contactPhone?: string
    contactEmail?: string
    contactPersonRole?: string
    addressLine1?: string
    addressLine2?: string
    landmark?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
    latitude?: string
    longitude?: string
    gstNumber?: string
  }
  rtoAddress?: {
    addressNickname?: string
    contactName?: string
    contactPhone?: string
    id?: string
    contactEmail?: string
    contactPersonRole?: string
    addressLine1?: string
    addressLine2?: string
    landmark?: string
    city?: string
    state?: string
    country?: string
    pincode?: string
    latitude?: string
    longitude?: string
    gstNumber?: string
  }
}

export interface CreatePickupDto {
  pickup: IAddress
  rtoAddress?: IAddress
  isPrimary?: boolean
  isPickupEnabled?: boolean
}

export interface UpdatePickupDto {
  pickup?: IAddress
  rtoAddress?: IAddress
  isPrimary?: boolean
  isPickupEnabled?: boolean
}

export interface B2COrder {
  id: number

  // User reference
  user_id: string

  // Order info
  totalAmount: string
  order_number: string
  order_date: string
  order_amount: number
  order_id?: string | null

  // Buyer info
  buyer_name: string
  buyer_phone: string
  buyer_email?: string | null
  address: string
  city: string
  state: string
  country: string
  integration_type:
    | 'delhivery'
    | 'ekart'
    | 'shadowfax'
    | 'xpressbees'
    | 'icarry'
    | 'punjabship'
    | 'amazon'
    | 'indiapost'
  pincode: string

  // Product info
  products: {
    productName: string
    price: number
    quantity: number
    sku?: string
    hsnCode?: string
    discount?: number
    taxRate?: number
  }[]

  // Package info
  weight: number
  charged_weight?: number | string | null
  length: number
  breadth: number
  height: number

  // Charges
  order_type: 'prepaid' | 'cod'
  prepaid_amount?: number | null
  shipping_charges?: number | null
  cod_charges?: number | null
  other_charges?: number | null
  transaction_fee?: number | null
  gift_wrap?: number | null
  discount?: number | null

  // Order status
  order_status: string
  pickup_status?: string | null
  pickup_error?: string | null

  // Courier info
  courier_partner?: string | null
  courier_id?: number | null
  shipment_id?: string | null
  is_insurance: boolean
  label?: string | null
  manifest?: string | null
  manifest_error?: string | null
  manifest_retry_count?: number | null
  manifest_last_retry_at?: string | null
  manifest_retries_remaining?: number | null
  can_retry_manifest?: boolean
  awb_number?: string | null

  // Pickup & RTO info
  pickup_location_id?: string | null
  pickup_details?: {
    warehouse_name?: string
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    gst_number?: string
    pickup_date?: string
    pickup_time?: string
  } | null
  rto_details?: {
    warehouse_name?: string
    name?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    gst_number?: string
  } | null
  is_rto_different: boolean

  // Order source flag
  is_external_api?: boolean // true if created via external API, false if created locally
  source?: 'manual' | 'shopify' | 'woocommerce' | 'api' | string

  // Tags / meta
  tags?: string | null

  // Timestamps
  created_at: string
  updated_at: string
  last_tracking_update_at?: string | null
}

export interface B2BOrder {
  id: string
  order_number: string
  order_id?: string // optional, if you store shipment id from Nimbus
  order_date: string // or Date if you parse it
  order_amount: number
  buyer_name: string
  buyer_phone?: string
  buyer_email?: string
  company_name?: string
  company_gst?: string
  address: string
  city: string
  state: string
  country: string
  pincode?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  packages?: any // JSON of boxes array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products?: any // JSON of order items
  order_type?: string // prepaid / cod
  order_status: string
  shipping_charges?: number
  charged_weight?: number | string | null
  transaction_fee?: number
  discount?: number
  courier_partner?: string
  courier_id?: string | null
  shipment_id?: string
  awb_number?: string
  label?: string
  manifest?: string
  pickup_location_id?: string
  created_at: string // or Date
  updated_at: string // or Date
  is_insurance?: boolean
  is_rto_different?: boolean
  is_external_api?: boolean // true if created via external API, false if created locally
  source?: 'manual' | 'shopify' | 'woocommerce' | 'api' | string
  tags?: string
}

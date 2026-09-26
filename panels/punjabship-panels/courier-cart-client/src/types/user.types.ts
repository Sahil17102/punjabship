import type { BusinessStructure, CompanyType } from "./generic.types";

export interface BusinessInfo {
  brandName: string;
  gstNumber?: string;
  panNumber?: string;
  businessCategory?: string[]; // e.g., D2C, marketplace, manufacturer
  websiteUrl?: string;
  monthlyShipments?: string;
}

export interface UserBasicInfo {
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  pincode: string;
  state?: string;
  city?: string;
  phone: string;
  personalWebsite?: string;
}

export interface LocationInfo {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface SalesChannels {
  amazon?: string; // store URL or seller ID
  flipkart?: string; // store URL or seller ID
  shopify?: string;
  woocommerce?: string;
  customWebsite?: string;
  // add any other sales channels here
}

export interface ShippingPreferences {
  preferredCouriers: string[]; // e.g. ["FedEx", "DHL"]
  packagingType: "standard" | "custom" | "eco-friendly";
  deliverySpeedPreference?: "standard" | "express" | "overnight";
  returnPickupRequired?: boolean;
}

export interface PaymentDetails {
  bankAccountNumber: string;
  ifscCode: string;
  upiId?: string;
  paymentGateway?: string; // e.g. "Razorpay", "Paytm"
  taxId?: string; // GST or equivalent
}

export interface Documents {
  gstCertificateUrl?: string;
  panCardUrl?: string;
  businessLicenseUrl?: string;
  otherDocsUrls?: string[]; // any additional document URLs
}

export interface UserInfoData {
  basicInfo: UserBasicInfo;
  businessLegal: BusinessInfo;
  platformIntegration: SalesChannels;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// src/types/user.ts
// types/profileBlocks.ts
export type CompanyStatus =
  | "ONBOARDING"
  | "UNDER_REVIEW"
  | "ACTIVE"
  | "INACTIVE";

export interface CompanyInfo {
  businessName: string;
  contactPerson: string;
  profilePicture?: string;
  companyAddress: string;
  companyContactNumber: string;
  pincode: string;
  POCEmailVerified: boolean;
  POCPhoneVerified: boolean;
  state: string;
  city: string;
  contactNumber: string;
  contactEmail: string;
  brandName: string;
  companyEmail: string;
  companyLogoUrl?: string;
  website?: string;
}

export type BusinessType = "b2b" | "b2c" | "d2c";

export interface EmployeeOrderAccess {
  cancelOrders?: boolean;
  exportOrders?: boolean;
  exportCustomerDetails?: boolean;
  viewCustomerDetails?: boolean;
  changePaymentMode?: boolean;
}

export interface EmployeeModuleAccess {
  modules?: Record<string, boolean>;
  orders?: EmployeeOrderAccess;
  [key: string]: any;
}

export interface IUserProfileDB {
  id: string;
  userId: string;

  onboardingStep: number;
  monthlyOrderCount: string;
  onboardingComplete: boolean;
  profileComplete: boolean;
  salesChannels: Record<string, boolean>;

  companyInfo: CompanyInfo;
  domesticKyc: DomesticKyc | null;
  bankDetails: BankDetails | null;
  gstDetails: GstDetails | null;
  businessType: BusinessType[];

  approved: boolean;
  approvedAt: string | null;
  rejectionReason: string | null;
  currentPlanId?: string | null;
  currentPlanName?: string | null;
  currentB2CPlanId?: string | null;
  currentB2CPlanName?: string | null;
  currentB2BPlanId?: string | null;
  currentB2BPlanName?: string | null;
  role?: string | null;
  actorUserId?: string | null;
  merchantUserId?: string | null;
  hasPassword?: boolean;
  employeeId?: string | null;
  employeeRole?: string | null;
  employeeIsActive?: boolean | null;
  employeeName?: string | null;
  employeeEmail?: string | null;
  employeePhone?: string | null;
  displayName?: string | null;
  moduleAccess?: EmployeeModuleAccess | null;

  submittedAt: string;
  updatedAt: string;
}

export type KycStatus =
  | "pending"
  | "verification_in_progress"
  | "verified"
  | "rejected";

export interface DomesticKyc {
  updatedAt: Date | null;
  status: KycStatus;
}

export interface BankAccount {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch?: string;
  id: string;
  accountType?: "Savings" | "Current";
  upiId?: string;
  chequeImageUrl?: string;
  status: "verified" | "pending" | "rejected"; // ✅ verified/unverified status
  rejectionReason?: string;
  isPrimary: boolean;
}

export interface BankDetails {
  count: number; // how many accounts exist
  primaryAccount: BankAccount | null;
}

export interface GstDetails {
  gstNumber: string; // 15‑char GSTIN
  legalName?: string;
  registrationDate?: string; // ISO date
  state?: string;
  documentUrl?: string; // GST cert PDF/image
}

export interface KycDetails {
  /* ─ Primary / relations ─ */
  id: string; // uuid
  userId: string; // uuid → users.id FK
  structure: BusinessStructure;
  companyType: CompanyType;

  /* ─ PAN & IDs ─ */
  gstin?: string;
  panNumber?: string;
  cin?: string;

  /* ─ File URLs or R2 object keys ─ */
  panCardUrl?: string;
  aadhaarUrl?: string;
  msmeCertUrl?: string;
  cancelledChequeUrl?: string;
  boardResolutionUrl?: string;
  partnershipDeedUrl?: string;
  businessPanUrl?: string;
  companyAddressProofUrl?: string;
  gstCertificateUrl?: string;
  llpAgreementUrl?: string;

  /* ─ Optional MIME types ─ */
  panCardMime?: string;
  aadhaarMime?: string;
  msmeCertMime?: string;
  cancelledChequeMime?: string;
  boardResolutionMime?: string;
  partnershipDeedMime?: string;
  llpAgreementMime?: string;

  /* ─ Per-field status ─ */
  panCardStatus?: "pending" | "verified" | "rejected";
  aadhaarStatus?: "pending" | "verified" | "rejected";
  msmeCertStatus?: "pending" | "verified" | "rejected";
  cancelledChequeStatus?: "pending" | "verified" | "rejected";
  boardResolutionStatus?: "pending" | "verified" | "rejected";
  partnershipDeedStatus?: "pending" | "verified" | "rejected";
  cinStatus?: "pending" | "verified" | "rejected";
  llpAgreementStatus: "pending" | "verified" | "rejected";

  /* ─ Rejection reasons ─ */
  panCardRejectionReason?: string;
  aadhaarRejectionReason?: string;
  msmeCertRejectionReason?: string;
  cancelledChequeRejectionReason?: string;
  boardResolutionRejectionReason?: string;
  partnershipDeedRejectionReason?: string;
  cinRejectionReason?: string;
  llpAgreementReason?: string;

  /* ─ Workflow ─ */
  rejectionReason?: string; // global rejection reason (optional)
  status: "verification_in_progress" | "pending" | "verified" | "rejected";

  /* ─ Timestamps ─ */
  createdAt: Date;
  updatedAt: Date;
}

export const PLATFORMS = {
  SHOPIFY: 1,
  WOOCOMMERCE: 2,
  AMAZON: 3,
  MAGENTO: 4,
} as const;

export type PLATFORM = (typeof PLATFORMS)[keyof typeof PLATFORMS];

export const PLATFORM_LABELS: Record<number, string> = {
  [PLATFORMS.SHOPIFY]: "Shopify",
  [PLATFORMS.WOOCOMMERCE]: "WooCommerce",
  [PLATFORMS.AMAZON]: "Amazon",
  [PLATFORMS.MAGENTO]: "Magento",
};

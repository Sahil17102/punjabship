import type { IUserProfileDB, UserInfoData } from "../types/user.types";

export const initialFormData: UserInfoData = {
  basicInfo: {
    firstName: "",
    companyName: "",
    email: "",
    lastName: "",
    pincode: "",
    state: "",
    city: "",
    phone: "",
    personalWebsite: "",
  },
  businessLegal: {
    brandName: "",
    businessCategory: [],
    monthlyShipments: "0-100",
    gstNumber: "",
    panNumber: "",
  },
  platformIntegration: {},
  warehouseSetup: {
    packagingType: "custom",
    preferredCouriers: [],
    deliverySpeedPreference: "standard",
  },
};

export const emptyUserProfile: IUserProfileDB = {
  id: "",
  userId: "",

  onboardingStep: 0,
  monthlyOrderCount: "",
  onboardingComplete: false,
  profileComplete: false,
  salesChannels: {},

  companyInfo: {
    companyContactNumber: "",
    businessName: "",
    contactPerson: "",
    companyAddress: "",
    city: "",
    pincode: "",
    POCEmailVerified: false,
    POCPhoneVerified: false,
    state: "",
    profilePicture: "",
    contactNumber: "",
    contactEmail: "",
    brandName: "",
    companyEmail: "",
    companyLogoUrl: "",
    website: "",
  },

  domesticKyc: {
    status: "pending",
    updatedAt: null,
  },

  bankDetails: {
    count: 0,
    primaryAccount: null,
  },

  gstDetails: {
    gstNumber: "",
    legalName: "",
    registrationDate: "",
    state: "",
    documentUrl: "",
  },

  businessType: [],

  approved: false,
  approvedAt: null,
  rejectionReason: null,
  currentPlanId: null,
  currentPlanName: null,
  currentB2CPlanId: null,
  currentB2CPlanName: null,
  currentB2BPlanId: null,
  currentB2BPlanName: null,
  role: null,
  employeeId: null,
  employeeRole: null,
  employeeIsActive: null,
  employeeName: null,
  employeeEmail: null,
  employeePhone: null,
  displayName: null,
  moduleAccess: null,

  submittedAt: "",
  updatedAt: "",
};

export const channelIntegrationImageMapping: Record<number, string> = {
  1: "/logo/integrations/shopify.webp",
  2: "/logo/integrations/woocommerce.webp",
};

// Keyframe animation
export const fadeInStyle = {
  "@keyframes fadeInUp": {
    "0%": { opacity: 0, transform: "translateY(20px)" },
    "100%": { opacity: 1, transform: "translateY(0)" },
  },
  animation: "fadeInUp 0.6s ease-out forwards",
};

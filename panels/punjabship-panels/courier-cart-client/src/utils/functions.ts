import type { ChangeEvent } from "react";
import type { FormErrors } from "../pages/onboarding/UserOnboarding";
import type { UserInfoData } from "../types/user.types";

export const emptyErrors: FormErrors = {
  basicInfo: {
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    pincode: "",
    phone: "",
  },
  businessLegal: {
    brandName: "",
    businessCategory: [],
    gstNumber: "",
    panNumber: "",
  },
  platformIntegration: {},
  warehouseSetup: {
    packagingType: "",
    preferredCouriers: [],
    deliverySpeedPreference: "",
  },
};

export const validateOnboardingFields = (
  fields: UserInfoData,
  step: number
): FormErrors => {
  const errors: FormErrors = JSON.parse(JSON.stringify(emptyErrors));

  // Step 1: Basic Info
  if (step === 1) {
    const {
      firstName,
      state,
      city,
      lastName,
      companyName,
      email,
      pincode,
      phone,
    } = fields.basicInfo;

    if (!firstName?.trim())
      errors.basicInfo.firstName = "First name is required";

    if (!lastName?.trim()) errors.basicInfo.lastName = "Last name is required";

    if (!companyName?.trim())
      errors.basicInfo.companyName = "Company name is required";

    if (!email?.trim()) {
      errors.basicInfo.email = "Email is required";
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      errors.basicInfo.email = "Enter a valid email";
    }

    if (pincode && !/^\d{6}$/.test(pincode)) {
      errors.basicInfo.pincode = "Pincode must be 6 digits";
    }

    if (!phone?.trim()) {
      errors.basicInfo.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      errors.basicInfo.phone = "Enter a valid 10-digit phone number";
    }
    if (pincode && (!state || !city)) {
      errors.basicInfo.pincode =
        "Location not found. Maybe check your pincode?";
    }
  }

  // Step 2: Business Legal
  if (step === 2) {
    const { brandName, businessCategory } = fields.businessLegal;

    if (!businessCategory?.length)
      errors.businessLegal.businessCategory =
        "Please choose one of the following category";
    if (!brandName?.trim()) {
      errors.businessLegal.brandName = "Brand name is required";
    }

    // Future optional: GST, PAN, category validations
  }

  if (step === 3) {
    const { personalWebsite } = fields.basicInfo;

    if (personalWebsite?.trim()) {
      const isValidURL =
        /^(https?:\/\/)?([\w\d-]+\.)+[\w]{2,}(\/[\w\d#?&=.-]*)*\/?$/.test(
          personalWebsite.trim()
        );
      if (!isValidURL) {
        errors.basicInfo.personalWebsite =
          "Enter a valid website URL (e.g., https://yourstore.com)";
      }
    }

    // Future optional: GST, PAN, category validations
  }

  return errors;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hasValidationErrors = (obj: any): boolean => {
  return Object.values(obj).some((val) => {
    if (typeof val === "string") return val !== "";
    if (typeof val === "object" && val !== null)
      return hasValidationErrors(val);
    return false;
  });
};

export function createSyntheticEvent(
  name: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
): ChangeEvent<HTMLInputElement> {
  return {
    target: { name, value },
  } as ChangeEvent<HTMLInputElement>;
}

import { matchPath } from "react-router-dom";

/**
 * Returns true if `pathname` starts with `pattern`, while respecting
 * React‑Router patterns like `/orders/:id`.
 */
export function isActive(pattern: string, pathname: string) {
  return !!matchPath({ path: pattern, end: false }, pathname);
}

export const getMimeType = (filename: string): string => {
  const clean = filename.split("?")[0]; // Remove query params
  const ext = clean.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "svg":
      return "image/svg+xml";
    case "pdf":
      return "application/pdf";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "xls":
      return "application/vnd.ms-excel";
    case "xlsx":
      return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    case "txt":
      return "text/plain";
    default:
      return "application/octet-stream";
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
};

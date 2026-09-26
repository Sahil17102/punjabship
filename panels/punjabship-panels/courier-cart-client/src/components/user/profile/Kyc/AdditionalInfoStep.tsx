import React, { useEffect } from "react";
import { Box, Button, Grid, Stack, Typography } from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import type {
  BusinessStructure,
  CompanyType,
} from "../../../../types/generic.types";
import FileUploader from "../../../UI/uploader/FileUploader";
import CustomInput from "../../../UI/inputs/CustomInput";
import {
  requiredKycDetails,
  requiredKycFieldMap,
} from "../../../../utils/constants";

export interface AdditionalKYCForm {
  gstin?: string;
  panNumber?: string;
  cin?: string;
  aadhaarUrl?: string;
  businessPanUrl?: string;
  companyAddressProofUrl?: string;
  gstCertificateUrl?: string;
  panCardUrl?: string;
  partnershipDeedUrl?: string;
  boardResolutionUrl?: string;
  llpAgreementUrl?: string;
  cancelledChequeUrl?: string;
}

interface Props {
  structure?: BusinessStructure;
  companyType?: CompanyType;
  defaultValue?: Partial<AdditionalKYCForm>;
  onComplete: (data?: AdditionalKYCForm) => void;
  submitting?: boolean;
}

const fieldLabels: Record<keyof AdditionalKYCForm, string> = {
  gstin: "GST Number (GSTIN)",
  panNumber: "PAN Number",
  cin: "CIN (Corporate Identification Number)",
  panCardUrl: "Upload PAN Card",
  gstCertificateUrl: "Upload GST Certificate",
  aadhaarUrl: "Upload Your Aadhaar Card",
  partnershipDeedUrl: "Upload Partnership Deed",
  businessPanUrl: "Upload Business PAN",
  companyAddressProofUrl: "Upload Company Address Proof",
  boardResolutionUrl: "Upload Board Resolution",
  cancelledChequeUrl: "Upload Cancelled Cheque",
  llpAgreementUrl: "Upload LLP Agreement",
};

const inputPlaceholders: Partial<Record<keyof AdditionalKYCForm, string>> = {
  gstin: "Example: 27ABCDE1234F1Z5",
  panNumber: "Example: ABCDE1234F",
  cin: "Example: U12345MH2020PTC123456",
};

const inputHelpText: Partial<Record<keyof AdditionalKYCForm, string>> = {
  gstin: "15 characters. The middle 10 characters should match the PAN.",
  panNumber: "10 characters: five letters, four digits, one letter.",
  cin: "21 characters from the MCA registration certificate.",
};

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const CIN_REGEX = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;

const allowedMimeTypes: Partial<Record<keyof AdditionalKYCForm, string>> = {
  aadhaarUrl: "image/jpeg,image/png,application/pdf",
  panCardUrl: "image/jpeg,image/png,application/pdf",
  cancelledChequeUrl: "image/jpeg,image/png,application/pdf",
  partnershipDeedUrl: "application/pdf",
  boardResolutionUrl: "application/pdf",
  companyAddressProofUrl: "application/pdf,image/jpeg,image/png",
  businessPanUrl: "image/jpeg,image/png,application/pdf",
  gstCertificateUrl: "image/jpeg,image/png,application/pdf",
  llpAgreementUrl: "application/pdf",
};

const isFileField = (field: keyof AdditionalKYCForm) =>
  [
    "aadhaarUrl",
    "panCardUrl",
    "partnershipDeedUrl",
    "boardResolutionUrl",
    "llpAgreementUrl",
    "companyAddressProofUrl",
    "cancelledChequeUrl",
    "businessPanUrl",
    "gstCertificateUrl",
  ].includes(field);

export default function AdditionalDetailsStep({
  structure = "individual",
  defaultValue,
  companyType,
  onComplete,
  submitting = false,
}: Props) {
  const {
    control,
    setValue,
    handleSubmit,
    watch,
    formState: { isValid },
  } = useForm<AdditionalKYCForm>({
    defaultValues: defaultValue ?? {},
    mode: "onChange",
  });

  const requiredFields: (keyof AdditionalKYCForm)[] = React.useMemo(() => {
    const config = requiredKycDetails[structure];

    if (
      structure === "company" &&
      companyType &&
      typeof config === "object" &&
      !Array.isArray(config)
    ) {
      return config[companyType as CompanyType] ?? [];
    }

    if (Array.isArray(config)) {
      return config;
    }

    return [];
  }, [structure, companyType]);

  const optionalFields: (keyof AdditionalKYCForm)[] = React.useMemo(
    () => (structure === "individual" ? ["gstin"] : []),
    [structure]
  );

  const filePlaceholder = (field: keyof AdditionalKYCForm) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    watch(`${field}_key` as any);

  const isRequiredField = (field: keyof AdditionalKYCForm) =>
    structure === "company" && companyType
      ? (
          requiredKycFieldMap[structure] as Record<
            CompanyType,
            Partial<Record<keyof AdditionalKYCForm, boolean>>
          >
        )[companyType]?.[field] ?? false
      : (
          requiredKycFieldMap[structure] as Partial<
            Record<keyof AdditionalKYCForm, boolean>
          >
        )?.[field] ?? false;

  const displayedFields = React.useMemo(
    () => [...requiredFields, ...optionalFields.filter((field) => !requiredFields.includes(field))],
    [requiredFields, optionalFields]
  );

  const textFields = displayedFields.filter((field) => !isFileField(field));
  const fileFields = requiredFields.filter(isFileField);

  const normalizeTextValue = (field: keyof AdditionalKYCForm, value?: string) => {
    const next = String(value ?? "").trim().toUpperCase();
    if (field === "panNumber") return next.replace(/[^A-Z0-9]/g, "").slice(0, 10);
    if (field === "gstin") return next.replace(/[^A-Z0-9]/g, "").slice(0, 15);
    if (field === "cin") return next.replace(/[^A-Z0-9]/g, "").slice(0, 21);
    return String(value ?? "");
  };

  const getTextRules = (field: keyof AdditionalKYCForm) => ({
    required: isRequiredField(field) ? `${fieldLabels[field]} is required` : false,
    validate: (value?: string) => {
      const normalized = normalizeTextValue(field, value);
      if (!normalized) return true;

      if (field === "panNumber") {
        if (!PAN_REGEX.test(normalized)) {
          return "Invalid PAN format. Use 10 characters like ABCDE1234F";
        }
        const gstin = normalizeTextValue("gstin", watch("gstin"));
        if (gstin && gstin.substring(2, 12) !== normalized) {
          return "PAN number must match characters 3-12 of the GSTIN";
        }
      }

      if (field === "gstin") {
        if (!GSTIN_REGEX.test(normalized)) {
          return "Invalid GSTIN format. Use 15 characters like 27ABCDE1234F1Z5";
        }
        const panNumber = normalizeTextValue("panNumber", watch("panNumber"));
        if (panNumber && normalized.substring(2, 12) !== panNumber) {
          return "GSTIN must contain the same PAN number";
        }
      }

      if (field === "cin" && !CIN_REGEX.test(normalized)) {
        return "Invalid CIN format. Use 21 characters like U12345MH2020PTC123456";
      }

      return true;
    },
  });

  useEffect(() => {
    requiredFields.forEach((field) => {
      const url = defaultValue?.[field];
      const keyField = `${field}_key` as keyof AdditionalKYCForm;

      if (url && !watch(keyField)) {
        const originalName = decodeURIComponent(
          url.split("/").pop() ?? "Uploaded file"
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setValue(keyField as any, originalName);
      }
    });
  }, []);

  const getStatus = (field: keyof AdditionalKYCForm) =>
    defaultValue?.[
      `${field.replace("Url", "")}Status` as keyof typeof defaultValue
    ] as string | undefined;

  const getRejectionReason = (field: keyof AdditionalKYCForm) =>
    defaultValue?.[
      `${field.replace("Url", "")}RejectionReason` as keyof typeof defaultValue
    ] as string | undefined;

  return (
    <Box component="form" onSubmit={handleSubmit(onComplete)}>
      <Typography variant="h6" mb={0.5} fontWeight={700} color="#111827">
        Enter Additional KYC Details
      </Typography>
      <Typography fontSize={13} color="#6B7280" mb={2}>
        Add the official identifiers and upload documents that match the same legal entity.
      </Typography>

      {textFields.length > 0 && (
        <Box
          sx={{
            p: { xs: 1.5, md: 2 },
            mb: 3,
            border: "1px solid rgba(15, 23, 42, 0.08)",
            bgcolor: "#F8FAFC",
          }}
        >
          <Typography fontSize={14} fontWeight={800} color="#111827" mb={1}>
            Business identifiers
          </Typography>
          <Grid container spacing={2}>
            {textFields.map((field) => (
              <Grid key={field} size={{ md: 6, xs: 12 }}>
                <Controller
                  name={field}
                  control={control}
                  rules={getTextRules(field)}
                  render={({ field: ctrl, fieldState }) => (
                    <CustomInput
                      {...ctrl}
                      value={(ctrl.value as string | undefined) ?? ""}
                      onChange={(event) =>
                        ctrl.onChange(normalizeTextValue(field, event.target.value))
                      }
                      required={isRequiredField(field)}
                      fullWidth
                      label={fieldLabels[field]}
                      placeholder={
                        inputPlaceholders[field] ?? `Enter ${fieldLabels[field]}`
                      }
                      maxLength={field === "cin" ? 21 : field === "gstin" ? 15 : 10}
                      error={!!fieldState.error}
                      helperText={
                        fieldState.error?.message ??
                        (field === "gstin" && !isRequiredField(field)
                          ? "Optional for individual sellers. If entered, the middle 10 characters should match the PAN."
                          : inputHelpText[field])
                      }
                    />
                  )}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Typography fontSize={14} fontWeight={800} color="#111827" mb={1}>
        Required documents
      </Typography>
      <Grid container spacing={3}>
        {fileFields.map((field) => (
          <Grid key={field} size={{ md: 6, xs: 12 }}>
            <Controller
              name={field}
              control={control}
              rules={{
                required: isRequiredField(field)
                  ? `${fieldLabels[field]} is required`
                  : false,
              }}
              render={({ field: ctrl, fieldState }) => (
                <Stack mt={1.5}>
                  <FileUploader
                    required={isRequiredField(field)}
                    folderKey="kyc"
                    fullWidth
                    showAccept={Boolean(filePlaceholder(field)) === false}
                    accept={allowedMimeTypes[field]}
                    variant="button"
                    label={fieldLabels[field]}
                    placeholder={filePlaceholder(field) as string}
                    onUploaded={async (files) => {
                      const file = files?.[0];
                      const fileKey = file?.key;
                      setValue(field, fileKey);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setValue(`${field}_key` as any, file?.originalName);
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      setValue(`${field}_mime` as any, file?.mime);
                      ctrl.onChange(fileKey);
                    }}
                  />
                  {!watch(field) || watch(field) === defaultValue?.[field]
                    ? (() => {
                        const status = getStatus(field);
                        const reason = getRejectionReason(field);
                        if (status === "rejected") {
                          return (
                            <Typography
                              variant="caption"
                              color="error"
                              mt={0.5}
                            >
                              Rejected: {reason || "No reason provided"}
                            </Typography>
                          );
                        } else if (status === "verified") {
                          return (
                            <Typography
                              variant="caption"
                              color="success.main"
                              mt={0.5}
                            >
                              Verified
                            </Typography>
                          );
                        } else if (status === "verification_in_progress") {
                          return (
                            <Typography
                              variant="caption"
                              color="info.main"
                              mt={0.5}
                            >
                              Verification in progress
                            </Typography>
                          );
                        }
                        return null;
                      })()
                    : null}
                  {fieldState.error && (
                    <Typography variant="caption" color="error">
                      {fieldState.error.message}
                    </Typography>
                  )}
                </Stack>
              )}
            />
          </Grid>
        ))}
      </Grid>

      <Box mt={4} display="flex" justifyContent="flex-end">
        <Button variant="contained" type="submit" disabled={!isValid || submitting}>
          {submitting ? "Submitting KYC..." : "Submit KYC"}
        </Button>
      </Box>
    </Box>
  );
}

import {
    Box,
    Button,
    Card,
    CardContent,
    Divider,
    FormControl,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material'
import { useEffect, useMemo } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { usePresignedDownloadUrls } from '../../hooks/Uploads/usePresignedDownloadUrls'
import { useInvoicePreferences } from '../../hooks/User/useInvoicePreferences'
import { extractGSTDetails } from '../../utils/gstin'
import PageHeading from '../UI/heading/PageHeading'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'
import { toast } from '../UI/Toast'
import FileUploader from '../UI/uploader/FileUploader'

type InvoicePreferencesForm = {
  prefix: string
  suffix: string
  template: 'classic' | 'thermal'
  logoFile?: string
  signatureFile?: string
  sellerName?: string
  brandName?: string
  gstNumber?: string
  panNumber?: string
  sellerAddress?: string
  stateCode?: string
  supportEmail?: string
  supportPhone?: string
  invoiceNotes?: string
  termsAndConditions?: string
}

export default function InvoicePreferences() {
  const { preferences, isLoading, savePreferences, isSaving } = useInvoicePreferences()

  const {
    handleSubmit,
    clearErrors,
    control,
    setError,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InvoicePreferencesForm>({
    defaultValues: {
      prefix: 'INV',
      suffix: '',
      template: 'classic',
      logoFile: undefined,
      signatureFile: undefined,
      sellerName: '',
      brandName: '',
      gstNumber: '',
      panNumber: '',
      sellerAddress: '',
      stateCode: '',
      supportEmail: '',
      supportPhone: '',
      invoiceNotes: '',
      termsAndConditions: '',
    },
  })
  const gstNumberValue = watch('gstNumber')

  // Collect keys for logo & signature
  const fileKeys = useMemo(() => {
    const keys: string[] = []
    if (preferences?.logoFile) keys.push(preferences.logoFile)
    if (preferences?.signatureFile) keys.push(preferences.signatureFile)
    return keys
  }, [preferences])

  // Fetch presigned download URLs (returns URLs in same order as keys)
  const { data: fileUrls } = usePresignedDownloadUrls({ 
    keys: fileKeys.length > 0 ? fileKeys : undefined,
    enabled: fileKeys.length > 0,
  })

  // Map keys to URLs using array index (URLs are returned in same order as keys)
  const logoUrl = useMemo(() => {
    if (!preferences?.logoFile || !fileUrls || !Array.isArray(fileUrls)) return undefined
    const logoIndex = fileKeys.indexOf(preferences.logoFile)
    return logoIndex >= 0 && logoIndex < fileUrls.length ? fileUrls[logoIndex] : undefined
  }, [preferences?.logoFile, fileUrls, fileKeys])

  const signatureUrl = useMemo(() => {
    if (!preferences?.signatureFile || !fileUrls || !Array.isArray(fileUrls)) return undefined
    const signatureIndex = fileKeys.indexOf(preferences.signatureFile)
    return signatureIndex >= 0 && signatureIndex < fileUrls.length ? fileUrls[signatureIndex] : undefined
  }, [preferences?.signatureFile, fileUrls, fileKeys])

  // Prefill form when preferences arrive
  useEffect(() => {
    if (preferences) {
      reset(preferences)
    }
  }, [preferences, reset])

  useEffect(() => {
    const normalizedGstin = String(gstNumberValue || '').trim().toUpperCase()

    if (!normalizedGstin) {
      clearErrors(['gstNumber', 'stateCode'])
      return
    }

    const timeout = window.setTimeout(() => {
      const gstDetails = extractGSTDetails(normalizedGstin)

      setValue('gstNumber', normalizedGstin, { shouldDirty: true })

      if (!gstDetails.isValid) {
        setError('gstNumber', { type: 'manual', message: gstDetails.error })
        if (gstDetails.error === 'Invalid State Code') {
          setError('stateCode', { type: 'manual', message: gstDetails.error })
        } else {
          clearErrors('stateCode')
        }
        return
      }

      clearErrors(['gstNumber', 'stateCode'])
      setValue('panNumber', gstDetails.pan, { shouldDirty: true, shouldValidate: true })
      setValue('stateCode', gstDetails.stateCode, { shouldDirty: true, shouldValidate: true })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [clearErrors, gstNumberValue, setError, setValue])

  const onSubmit = async (data: InvoicePreferencesForm) => {
    try {
      await savePreferences(data)
      toast.open({ message: 'Invoice preferences saved successfully ', severity: 'success' })
    } catch {
      toast.open({ message: 'Failed to save preferences ', severity: 'error' })
    }
  }

  return (
    <Stack gap={3}>
      <PageHeading title="Invoice Preferences" />

      <Card
        elevation={0}
        sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', background: '#FFFFFF' }}
      >
        <CardContent>
          {isLoading ? (
            // 🔹 Skeleton Loader
            <Stack spacing={4}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Numbering Format
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Skeleton variant="rounded" width="100%" height={56} />
                  <Skeleton variant="rounded" width="100%" height={56} />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Template
                </Typography>
                <Skeleton variant="rounded" width="100%" height={56} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Company Logo
                </Typography>
                <Skeleton variant="rounded" width="100%" height={120} />
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>
                  Authorized Signature
                </Typography>
                <Skeleton variant="rounded" width="100%" height={120} />
              </Box>

              <Box display="flex" justifyContent="flex-end" mt={4}>
                <Skeleton variant="rounded" width={160} height={48} />
              </Box>
            </Stack>
          ) : (
            // 🔹 Actual Form
            <form onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={4}>
                {/* Prefix & Suffix */}
                <Stack>
                  <Typography variant="h6" gutterBottom>
                    Numbering Format
                  </Typography>
                  <Stack direction="row" width="100%" spacing={2}>
                    <Controller
                      name="prefix"
                      control={control}
                      render={({ field }) => (
                        <CustomInput
                          {...field}
                          label="Invoice Prefix"
                          helperText="e.g. INV"
                          width={'40vw'}
                        />
                      )}
                    />
                    <Controller
                      name="suffix"
                      control={control}
                      render={({ field }) => (
                        <CustomInput
                          {...field}
                          width={'40vw'}
                          label="Invoice Suffix"
                          helperText="e.g. -2025"
                        />
                      )}
                    />
                  </Stack>
                </Stack>

                <Divider />

                {/* Template */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Template
                  </Typography>
                  <FormControl fullWidth>
                    <Controller
                      name="template"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          label="Template Type"
                          value={field.value ?? ''}
                          onSelect={(val) => field.onChange(val)}
                          items={[
                            { key: 'classic', label: 'Classic (A4 PDF)' },
                            { key: 'thermal', label: 'Thermal Printer' },
                          ]}
                          placeholder="Select Template"
                          required
                          width="100%"
                        />
                      )}
                    />
                  </FormControl>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Seller Branding
                  </Typography>
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={2}>
                      <Controller
                        name="sellerName"
                        control={control}
                        render={({ field }) => (
                          <CustomInput {...field} label="Seller Name" width="100%" />
                        )}
                      />
                      <Controller
                        name="brandName"
                        control={control}
                        render={({ field }) => (
                          <CustomInput {...field} label="Brand Name" width="100%" />
                        )}
                      />
                    </Stack>
                    <Stack direction="row" spacing={2}>
                      <Controller
                        name="gstNumber"
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            {...field}
                            label="GST Number"
                            width="100%"
                            value={field.value ?? ''}
                            onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                            helperText={errors.gstNumber?.message || 'Enter a valid 15-character GSTIN'}
                            error={!!errors.gstNumber}
                          />
                        )}
                      />
                      <Controller
                        name="panNumber"
                        control={control}
                        render={({ field }) => (
                          <CustomInput
                            {...field}
                            label="PAN Number (Auto-filled from GST)"
                            width="100%"
                            value={field.value ?? ''}
                            disabled
                            helperText="Automatically extracted from GSTIN"
                          />
                        )}
                      />
                    </Stack>
                    <Controller
                      name="sellerAddress"
                      control={control}
                      render={({ field }) => (
                        <CustomInput
                          {...field}
                          label="Seller Address"
                          placeholder="Line 1&#10;Line 2"
                          multiline
                          rows={3}
                        />
                      )}
                    />
                    <Controller
                      name="stateCode"
                      control={control}
                      render={({ field }) => (
                        <CustomInput
                          {...field}
                          label="State Code (Auto-filled from GST)"
                          value={field.value ?? ''}
                          disabled
                          helperText={errors.stateCode?.message || 'Automatically extracted from GSTIN'}
                          error={!!errors.stateCode}
                        />
                      )}
                    />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Support Contact
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Controller
                      name="supportEmail"
                      control={control}
                      render={({ field }) => (
                        <CustomInput {...field} label="Support Email" helperText="Invoice support channel" width="100%" />
                      )}
                    />
                    <Controller
                      name="supportPhone"
                      control={control}
                      render={({ field }) => (
                        <CustomInput {...field} label="Support Phone" helperText="Include country code if needed" width="100%" />
                      )}
                    />
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Invoice Notes
                  </Typography>
                  <Controller
                    name="invoiceNotes"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        {...field}
                        multiline
                        rows={3}
                        label="Notes shown on invoice"
                        helperText="Displayed beneath the item section"
                      />
                    )}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography variant="h6" gutterBottom>
                    Terms &amp; Conditions
                  </Typography>
                  <Controller
                    name="termsAndConditions"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        {...field}
                        multiline
                        rows={4}
                        label="Terms & Conditions"
                        helperText="Shown in the invoice footer"
                      />
                    )}
                  />
                </Box>

                <Divider />

                {/* Logo */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Company Logo
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box flex={1}>
                      <FileUploader
                        variant="dnd"
                        accept="image/*"
                        showPlaceholderImgByDefault
                        folderKey="logos"
                        label="Upload Company Logo"
                        placeholder={logoUrl}
                        onUploaded={(files) => {
                          // If files array is empty, clear the logoFile (set to empty string to allow clearing)
                          // If files exist, use the first file's key
                          const fileKey = files && files.length > 0 ? files[0]?.key : ''
                          setValue('logoFile', fileKey, { shouldValidate: true })
                        }}
                        fullWidth
                      />
                    </Box>
                  </Stack>
                </Box>

                <Divider />

                {/* Signature */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Authorized Signature
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box flex={1}>
                      <FileUploader
                        variant="dnd"
                        accept="image/*"
                        folderKey="signatures"
                        showPlaceholderImgByDefault
                        label="Upload Signature"
                        placeholder={signatureUrl}
                        onUploaded={(files) => {
                          // If files array is empty, clear the signatureFile (set to empty string to allow clearing)
                          // If files exist, use the first file's key
                          const fileKey = files && files.length > 0 ? files[0]?.key : ''
                          setValue('signatureFile', fileKey, { shouldValidate: true })
                        }}
                        fullWidth
                      />
                    </Box>
                  </Stack>
                </Box>
              </Stack>

              {/* Save Button */}
              <Box display="flex" justifyContent="flex-end" mt={4}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || isSaving}
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  {isSaving ? 'Saving...' : 'Save Preferences'}
                </Button>
              </Box>
            </form>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}

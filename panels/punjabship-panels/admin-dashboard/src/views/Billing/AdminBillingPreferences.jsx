import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Switch,
  Textarea,
  Text,
  useColorModeValue,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { IconAdjustments, IconCalendar, IconPhoto } from '@tabler/icons-react'
import { SellerAutocomplete } from 'components/Input/SellerAutocomplete'
import FileUploader from 'components/upload/FileUploader'
import { useInvoicePreferences } from 'hooks/useInvoicePreferences'
import { useEffect, useState } from 'react'
import {
  adminApplyBillingPreferenceToAll,
  adminUpdateUserBillingPreference,
} from 'services/billingPreferences.service'
import { getPresignedDownloadUrls } from 'services/upload.service'

export default function AdminBillingPreferences() {
  const toast = useToast()
  const {
    preferences,
    isLoading: prefsLoading,
    savePreferences,
    isSaving: isSavingPrefs,
  } = useInvoicePreferences()

  const [billingPrefForm, setBillingPrefForm] = useState({
    userId: '',
    frequency: 'monthly',
    autoGenerate: true,
    customFrequencyDays: '',
    applyToAll: false,
  })
  const [isUpdating, setIsUpdating] = useState(false)

  // Signature state
  const [signatureForm, setSignatureForm] = useState({
    includeSignature: true,
    signatureFile: null,
  })
  const [signatureUrl, setSignatureUrl] = useState(null)
  const [isUploadingSignature, setIsUploadingSignature] = useState(false)
  const [logoForm, setLogoForm] = useState({
    includeLogo: true,
    logoFile: null,
  })
  const [logoUrl, setLogoUrl] = useState(null)
  const [issuerForm, setIssuerForm] = useState({
    prefix: 'INV',
    suffix: '',
    template: 'classic',
    brandName: '',
    gstNumber: '',
    panNumber: '',
    issuerAddress: '',
    stateCode: '',
    supportEmail: '',
    supportPhone: '',
    invoiceNotes: '',
    termsAndConditions: '',
  })

  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const grayBg = useColorModeValue('gray.50', 'gray.700')

  // Load preferences into form state
  useEffect(() => {
    if (preferences) {
      setSignatureForm({
        includeSignature: preferences.includeSignature ?? true,
        signatureFile: preferences.signatureFile || null,
      })
      setLogoForm({
        includeLogo: preferences.includeLogo ?? true,
        logoFile: preferences.logoFile || null,
      })
      setIssuerForm({
        prefix: preferences.prefix ?? 'INV',
        suffix: preferences.suffix ?? '',
        template: preferences.template ?? 'classic',
        brandName: preferences.brandName ?? '',
        gstNumber: preferences.gstNumber ?? '',
        panNumber: preferences.panNumber ?? '',
        issuerAddress: preferences.sellerAddress ?? '',
        stateCode: preferences.stateCode ?? '',
        supportEmail: preferences.supportEmail ?? '',
        supportPhone: preferences.supportPhone ?? '',
        invoiceNotes: preferences.invoiceNotes ?? '',
        termsAndConditions: preferences.termsAndConditions ?? '',
      })
    }
  }, [preferences])

  // Fetch presigned URL for signature whenever signatureFile changes
  useEffect(() => {
    const fetchSignatureUrl = async () => {
      const fileKey = signatureForm.signatureFile || preferences?.signatureFile
      if (!fileKey) {
        setSignatureUrl(null)
        return
      }

      try {
        console.log('🔍 Fetching presigned URL for signature:', fileKey)
        const urls = await getPresignedDownloadUrls([fileKey])
        console.log('📦 Presigned URLs response:', urls)

        if (!Array.isArray(urls) || urls.length === 0) {
          console.warn('⚠️ No URLs returned or invalid response format')
          setSignatureUrl(null)
          return
        }

        // URLs can be either:
        // 1. Array of strings: ["https://...", ...]
        // 2. Array of objects: [{ key: "...", url: "..." }, ...]
        const firstUrl = typeof urls[0] === 'string' ? urls[0] : urls[0]?.url

        if (firstUrl) {
          console.log('✅ Setting signature URL:', firstUrl)
          setSignatureUrl(firstUrl)
        } else {
          console.warn('⚠️ No valid URL found in response')
          setSignatureUrl(null)
        }
      } catch (err) {
        console.error('❌ Failed to fetch presigned URLs:', err)
        setSignatureUrl(null)
      }
    }

    fetchSignatureUrl()
  }, [signatureForm.signatureFile, preferences?.signatureFile])

  const fetchLogoPreview = async (fileKey) => {
    if (!fileKey) {
      setLogoUrl(null)
      return
    }

    try {
      const urls = await getPresignedDownloadUrls([fileKey])
      if (!Array.isArray(urls) || urls.length === 0) {
        setLogoUrl(null)
        return
      }

      const firstUrl = typeof urls[0] === 'string' ? urls[0] : urls[0]?.url
      setLogoUrl(firstUrl || null)
    } catch (err) {
      console.error('Failed to fetch brand logo preview URL:', err)
      setLogoUrl(null)
    }
  }

  useEffect(() => {
    fetchLogoPreview(logoForm.logoFile)
  }, [logoForm.logoFile])

  const buildInvoicePreferencesPayload = ({
    includeLogo: includeLogoOverride,
    logoFile: logoFileOverride,
    includeSignature: includeSignatureOverride,
    signatureFile: signatureFileOverride,
  } = {}) => ({
    prefix: issuerForm.prefix ?? 'INV',
    suffix: issuerForm.suffix ?? '',
    template: issuerForm.template ?? 'classic',
    includeLogo:
      includeLogoOverride ??
      logoForm.includeLogo ??
      preferences?.includeLogo ??
      true,
    logoFile:
      logoFileOverride ??
      logoForm.logoFile ??
      preferences?.logoFile ??
      null,
    includeSignature:
      includeSignatureOverride ??
      signatureForm.includeSignature ??
      preferences?.includeSignature ??
      true,
    signatureFile:
      signatureFileOverride ??
      signatureForm.signatureFile ??
      preferences?.signatureFile ??
      null,
    brandName: issuerForm.brandName || null,
    gstNumber: issuerForm.gstNumber || null,
    panNumber: issuerForm.panNumber || null,
    // Stored in legacy DB column name, but used as platform issuer address.
    sellerAddress: issuerForm.issuerAddress || null,
    stateCode: issuerForm.stateCode || null,
    supportEmail: issuerForm.supportEmail || null,
    supportPhone: issuerForm.supportPhone || null,
    invoiceNotes: issuerForm.invoiceNotes || null,
    termsAndConditions: issuerForm.termsAndConditions || null,
  })

  const handleChange = (field, value) => {
    setBillingPrefForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleIssuerFieldChange = (field, value) => {
    setIssuerForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveIssuerDetails = async () => {
    try {
      await savePreferences(buildInvoicePreferencesPayload())
      toast({
        status: 'success',
        title: 'Billing invoice details saved successfully',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error('Failed to save billing invoice details:', err)
      toast({
        status: 'error',
        title: 'Failed to save billing invoice details',
        description: err?.response?.data?.error || err?.message || 'An error occurred',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSaveSignature = async () => {
    if (!signatureForm.signatureFile && signatureForm.includeSignature) {
      toast({
        status: 'warning',
        title: 'Please upload a signature file first',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const payload = buildInvoicePreferencesPayload({
      includeSignature: signatureForm.includeSignature,
      signatureFile: signatureForm.signatureFile,
    })

    try {
      await savePreferences(payload)
      if (signatureForm.signatureFile) {
        try {
          const urls = await getPresignedDownloadUrls([signatureForm.signatureFile])
          if (Array.isArray(urls) && urls.length > 0) {
            const url = typeof urls[0] === 'string' ? urls[0] : urls[0]?.url
            if (url) {
              setSignatureUrl(url)
            }
          }
        } catch (urlErr) {
          console.error('Failed to refresh signature URL:', urlErr)
        }
      }
      toast({
        status: 'success',
        title: 'Billing invoice signature saved successfully',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error('Failed to save signature:', err)
      toast({
        status: 'error',
        title: 'Failed to save signature',
        description: err?.response?.data?.error || err?.message || 'An error occurred',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSaveLogo = async () => {
    if (logoForm.includeLogo && !logoForm.logoFile) {
      toast({
        status: 'warning',
        title: 'Please upload a brand logo first',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const payload = buildInvoicePreferencesPayload({
      includeLogo: logoForm.includeLogo,
      logoFile: logoForm.logoFile,
    })

    try {
      await savePreferences(payload)
      await fetchLogoPreview(logoForm.logoFile)
      toast({
        status: 'success',
        title: 'Brand logo saved successfully',
        description: 'The logo will be used on invoices, labels, and related documents',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error('Failed to save brand logo:', err)
      toast({
        status: 'error',
        title: 'Failed to save brand logo',
        description: err?.response?.data?.error || err?.message || 'An error occurred',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  const handleSave = async () => {
    const { userId, frequency, autoGenerate, customFrequencyDays, applyToAll } = billingPrefForm

    if (!applyToAll && !userId) {
      toast({ status: 'error', title: 'Please select a seller or enable Apply to all' })
      return
    }

    if (frequency === 'custom' && !customFrequencyDays) {
      toast({ status: 'error', title: 'Please provide custom frequency (days)' })
      return
    }

    setIsUpdating(true)
    try {
      if (applyToAll) {
        await adminApplyBillingPreferenceToAll({
          frequency,
          autoGenerate,
          customFrequencyDays: customFrequencyDays ? Number(customFrequencyDays) : null,
        })
        toast({ status: 'success', title: 'Billing preferences applied to all users' })
      } else {
        await adminUpdateUserBillingPreference({
          userId,
          frequency,
          autoGenerate,
          customFrequencyDays: customFrequencyDays ? Number(customFrequencyDays) : null,
        })
        toast({ status: 'success', title: 'Billing preferences updated for user' })
      }
    } catch (e) {
      toast({ status: 'error', title: 'Failed to update billing preferences' })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <Stack spacing={4}>
        <HStack justify="space-between" align="center">
          <HStack>
            <IconCalendar size={20} />
            <Text fontSize="xl" fontWeight="bold">
              Billing Preferences
            </Text>
          </HStack>
        </HStack>

        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Stack spacing={4}>
            <HStack spacing={4} align="flex-end">
              <Box flex="1">
                <FormLabel>Seller (for per-user setting)</FormLabel>
                <SellerAutocomplete
                  value={billingPrefForm.userId}
                  onChange={(val) => handleChange('userId', val)}
                  isDisabled={billingPrefForm.applyToAll}
                />
              </Box>
              <Box>
                <FormControl display="flex" alignItems="center">
                  <HStack>
                    <FormLabel mb="0">Apply to all users</FormLabel>
                    <Switch
                      isChecked={billingPrefForm.applyToAll}
                      onChange={(e) => handleChange('applyToAll', e.target.checked)}
                    />
                  </HStack>
                </FormControl>
              </Box>
            </HStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <FormLabel>Frequency</FormLabel>
                <Select
                  value={billingPrefForm.frequency}
                  onChange={(e) => handleChange('frequency', e.target.value)}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="manual">Manual</option>
                  <option value="custom">Custom</option>
                </Select>
              </Box>
              {billingPrefForm.frequency === 'custom' && (
                <Box>
                  <FormLabel>Custom frequency (days)</FormLabel>
                  <Input
                    type="number"
                    value={billingPrefForm.customFrequencyDays}
                    onChange={(e) => handleChange('customFrequencyDays', e.target.value)}
                  />
                </Box>
              )}
              <Box>
                <FormLabel>Auto-generate invoices</FormLabel>
                <Switch
                  isChecked={billingPrefForm.autoGenerate}
                  isDisabled={billingPrefForm.frequency === 'manual'}
                  onChange={(e) => handleChange('autoGenerate', e.target.checked)}
                />
              </Box>
            </SimpleGrid>

            <HStack justify="flex-end">
              <Button
                leftIcon={<IconAdjustments size={16} />}
                colorScheme="blue"
                size="sm"
                isLoading={isUpdating}
                onClick={handleSave}
              >
                Save Billing Preferences
              </Button>
            </HStack>
          </Stack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Stack spacing={4}>
            <HStack>
              <IconAdjustments size={20} />
              <Text fontSize="lg" fontWeight="bold">
                Billing Invoice Details
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              These details appear as the invoice issuer on billing invoices. Seller details are
              still shown separately in the Bill To section.
            </Text>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <FormLabel>Invoice Prefix</FormLabel>
                <Input
                  value={issuerForm.prefix}
                  onChange={(e) => handleIssuerFieldChange('prefix', e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>Invoice Suffix</FormLabel>
                <Input
                  value={issuerForm.suffix}
                  onChange={(e) => handleIssuerFieldChange('suffix', e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>Template</FormLabel>
                <Select
                  value={issuerForm.template}
                  onChange={(e) => handleIssuerFieldChange('template', e.target.value)}
                >
                  <option value="classic">Classic</option>
                  <option value="thermal">Thermal</option>
                </Select>
              </Box>
            </SimpleGrid>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <FormLabel>Issuer Name</FormLabel>
                <Input
                  placeholder="PunjabShip"
                  value={issuerForm.brandName}
                  onChange={(e) => handleIssuerFieldChange('brandName', e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>GST Number</FormLabel>
                <Input
                  value={issuerForm.gstNumber}
                  onChange={(e) => handleIssuerFieldChange('gstNumber', e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>PAN Number</FormLabel>
                <Input
                  value={issuerForm.panNumber}
                  onChange={(e) => handleIssuerFieldChange('panNumber', e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>State Code</FormLabel>
                <Input
                  value={issuerForm.stateCode}
                  onChange={(e) => handleIssuerFieldChange('stateCode', e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>Support Email</FormLabel>
                <Input
                  value={issuerForm.supportEmail}
                  onChange={(e) => handleIssuerFieldChange('supportEmail', e.target.value)}
                />
              </Box>
              <Box>
                <FormLabel>Support Phone</FormLabel>
                <Input
                  value={issuerForm.supportPhone}
                  onChange={(e) => handleIssuerFieldChange('supportPhone', e.target.value)}
                />
              </Box>
            </SimpleGrid>

            <Box>
              <FormLabel>Issuer Address</FormLabel>
              <Textarea
                value={issuerForm.issuerAddress}
                onChange={(e) => handleIssuerFieldChange('issuerAddress', e.target.value)}
                rows={3}
              />
            </Box>

            <Box>
              <FormLabel>Invoice Notes</FormLabel>
              <Textarea
                value={issuerForm.invoiceNotes}
                onChange={(e) => handleIssuerFieldChange('invoiceNotes', e.target.value)}
                rows={3}
              />
            </Box>

            <Box>
              <FormLabel>Terms & Conditions</FormLabel>
              <Textarea
                value={issuerForm.termsAndConditions}
                onChange={(e) => handleIssuerFieldChange('termsAndConditions', e.target.value)}
                rows={5}
              />
            </Box>

            <Flex justify="flex-end">
              <Button
                leftIcon={<IconAdjustments size={16} />}
                colorScheme="blue"
                size="sm"
                isLoading={isSavingPrefs}
                onClick={handleSaveIssuerDetails}
              >
                Save Invoice Details
              </Button>
            </Flex>
          </Stack>
        </Box>

        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Stack spacing={4}>
            <HStack>
              <IconPhoto size={20} />
              <Text fontSize="lg" fontWeight="bold">
                Brand Logo
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Upload your brand logo once; it will be used across invoices, labels, and other
              generated documents.
            </Text>

            <VStack spacing={4} align="stretch">
              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <FormLabel mb={0}>Include Brand Logo</FormLabel>
                  <Switch
                    isChecked={logoForm.includeLogo}
                    onChange={(e) =>
                      setLogoForm((prev) => ({ ...prev, includeLogo: e.target.checked }))
                    }
                  />
                </Flex>
                {logoForm.includeLogo && (
                  <Box mt={3} p={4} bg={grayBg} borderRadius="md">
                    <FormLabel mb={2}>Brand Logo Image</FormLabel>
                    <Text fontSize="xs" color="gray.500" mb={3}>
                      This logo will show up on invoices, labels, and any autogenerated documents
                      so your customers see consistent branding.
                    </Text>
                    <FileUploader
                      onUploaded={async (files) => {
                        if (files && files.length > 0) {
                          const file = files[0]
                          const key = file.key || file.url?.split('/').pop()
                          if (key) {
                            setLogoForm((prev) => ({ ...prev, logoFile: key }))
                            await fetchLogoPreview(key)
                            toast({
                              status: 'success',
                              title: 'Logo uploaded',
                              description: 'Click "Save Brand Logo" to persist the change',
                              duration: 3000,
                              isClosable: true,
                            })
                          }
                        }
                      }}
                      getUrl={true}
                      folderKey="logos"
                      showUploadButton={false}
                    />
                    {(logoUrl || logoForm.logoFile) && (
                      <Box mt={3}>
                        <Text fontSize="sm" mb={2} fontWeight="semibold">
                          {logoForm.logoFile ? 'Current brand logo:' : 'Brand logo preview:'}
                        </Text>
                        {logoUrl ? (
                          <Box
                            as="img"
                            src={logoUrl}
                            alt="Brand logo preview"
                            maxH="120px"
                            borderRadius="md"
                            border="1px solid"
                            borderColor={borderColor}
                            p={2}
                            bg="white"
                          />
                        ) : logoForm.logoFile ? (
                          <Text fontSize="xs" color="gray.500" fontStyle="italic">
                            Logo file saved. Refresh to see preview.
                          </Text>
                        ) : null}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              <Flex justify="flex-end">
                <Button
                  leftIcon={<IconAdjustments size={16} />}
                  colorScheme="blue"
                  size="sm"
                  isLoading={isSavingPrefs}
                  onClick={handleSaveLogo}
                >
                  Save Brand Logo
                </Button>
              </Flex>
            </VStack>
          </Stack>
        </Box>

        {/* Billing Invoice Signature Section */}
        <Box borderWidth="1px" borderRadius="lg" p={4}>
          <Stack spacing={4}>
            <HStack>
              <IconAdjustments size={20} />
              <Text fontSize="lg" fontWeight="bold">
                Billing Invoice Signature
              </Text>
            </HStack>
            <Text fontSize="sm" color="gray.500">
              Upload authorized signature that will be displayed on all billing invoices generated
              for sellers
            </Text>

            <VStack spacing={4} align="stretch">
              {/* Signature */}
              <Box>
                <Flex justify="space-between" align="center" mb={2}>
                  <FormLabel mb={0}>Include Authorized Signature</FormLabel>
                  <Switch
                    isChecked={signatureForm.includeSignature}
                    onChange={(e) =>
                      setSignatureForm({ ...signatureForm, includeSignature: e.target.checked })
                    }
                  />
                </Flex>
                {signatureForm.includeSignature && (
                  <Box mt={3} p={4} bg={grayBg} borderRadius="md">
                    <FormLabel mb={2}>Authorized Signature Image</FormLabel>
                    <Text fontSize="xs" color="gray.500" mb={3}>
                      This signature will be used on all billing invoices generated for sellers
                    </Text>
                    <FileUploader
                      onUploaded={async (files) => {
                        if (files && files.length > 0) {
                          const file = files[0]
                          const key = file.key || file.url?.split('/').pop()
                          if (key) {
                            setSignatureForm({ ...signatureForm, signatureFile: key })
                            // Fetch the uploaded file URL to show preview immediately
                            try {
                              const urls = await getPresignedDownloadUrls([key])
                              if (Array.isArray(urls) && urls.length > 0) {
                                // URLs can be strings or objects with url property
                                const url = typeof urls[0] === 'string' ? urls[0] : urls[0]?.url
                                if (url) {
                                  setSignatureUrl(url)
                                }
                              }
                            } catch (err) {
                              console.error('Failed to fetch preview URL:', err)
                            }
                            toast({
                              status: 'success',
                              title: 'Signature uploaded successfully',
                              description: 'Click "Save Signature" to save your preferences',
                              duration: 3000,
                              isClosable: true,
                            })
                          }
                        }
                      }}
                      getUrl={true}
                      folderKey="signatures"
                      showUploadButton={false}
                      uploadLoading={isUploadingSignature}
                    />
                    {(signatureUrl || signatureForm.signatureFile) && (
                      <Box mt={3}>
                        <Text fontSize="sm" mb={2} fontWeight="semibold">
                          {signatureForm.signatureFile
                            ? 'Current Signature:'
                            : 'Signature Preview:'}
                        </Text>
                        {signatureUrl ? (
                          <Box
                            as="img"
                            src={signatureUrl}
                            alt="Current signature"
                            maxH="120px"
                            borderRadius="md"
                            border="1px solid"
                            borderColor={borderColor}
                            p={2}
                            bg="white"
                          />
                        ) : signatureForm.signatureFile ? (
                          <Text fontSize="xs" color="gray.500" fontStyle="italic">
                            Signature file saved. Refresh to see preview.
                          </Text>
                        ) : null}
                      </Box>
                    )}
                  </Box>
                )}
              </Box>

              {/* Save Signature Button */}
              <Flex justify="flex-end">
                <Button
                  leftIcon={<IconAdjustments size={16} />}
                  colorScheme="blue"
                  size="sm"
                  isLoading={isSavingPrefs}
                  onClick={handleSaveSignature}
                >
                  Save Signature
                </Button>
              </Flex>
            </VStack>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}

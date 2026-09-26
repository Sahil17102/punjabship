import {
  Box,
  Divider,
  Spinner,
  Text,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { memo, useEffect, useState } from 'react'
import { useCouriers } from '../../hooks/useCouriers'
import { b2bAdminService } from '../../services/b2bAdmin.service'
import { PlansService } from '../../services/plan.service'
import B2BAdditionalChargesFilters from './B2BAdditionalChargesFilters'
import ImportChargesModal from './ImportChargesModal'
import { useB2BChargesForm } from './hooks/useB2BChargesForm'
import StarLogisticsVASSection from './sections/StarLogisticsVASSection'
import WorkbookImportedRatesSection from './sections/WorkbookImportedRatesSection'

const B2BAdditionalCharges = ({
  planId,
  courierId: propCourierId = '',
  serviceProvider: propServiceProvider = '',
}) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const {
    isOpen: isImportModalOpen,
    onOpen: onImportModalOpen,
    onClose: onImportModalClose,
  } = useDisclosure()
  const [importFile, setImportFile] = useState(null)

  // Use props if provided, otherwise fallback to local state (for backward compatibility)
  const [localPlanId, setLocalPlanId] = useState('')
  const [localCourierId, setLocalCourierId] = useState('')
  const [localServiceProvider, setLocalServiceProvider] = useState('')
  const effectivePlanId = planId || localPlanId
  const courierId = propCourierId || localCourierId
  const serviceProvider = propServiceProvider || localServiceProvider
  const isCourierScopeLocked = Boolean(propCourierId || propServiceProvider)

  const { data: b2bPlans = [] } = useQuery({
    queryKey: ['plans', { businessType: 'b2b', status: 'active' }],
    queryFn: () => PlansService.getPlans({ businessType: 'b2b', status: 'active' }),
  })

  const { data: couriers = [] } = useCouriers({ businessType: 'b2b' })

  useEffect(() => {
    if (planId || localPlanId || !b2bPlans.length) {
      return
    }

    const basicPlan =
      b2bPlans.find((plan) => String(plan.name || '').trim().toLowerCase() === 'basic') ||
      b2bPlans[0]

    if (basicPlan?.id) {
      setLocalPlanId(basicPlan.id)
    }
  }, [b2bPlans, localPlanId, planId])

  useEffect(() => {
    if (isCourierScopeLocked || courierId || !couriers.length) {
      return
    }

    const preferredCourier =
      couriers.find((courier) => {
        const provider = String(courier.serviceProvider || courier.service_provider || '')
          .trim()
          .toLowerCase()
        const name = String(courier.name || '').trim().toLowerCase()
        return provider === 'delhivery' && name.includes('surface')
      }) ||
      couriers.find((courier) => {
        const provider = String(courier.serviceProvider || courier.service_provider || '')
          .trim()
          .toLowerCase()
        return provider === 'delhivery'
      }) ||
      couriers[0]

    if (preferredCourier) {
      const provider = preferredCourier.serviceProvider || preferredCourier.service_provider || ''
      setLocalCourierId(String(preferredCourier.id))
      setLocalServiceProvider(provider)
    }
  }, [courierId, couriers, isCourierScopeLocked])

  // Handle combined courier-service provider selection
  const handleCourierServiceChange = (value) => {
    if (!value) {
      setLocalCourierId('')
      setLocalServiceProvider('')
      return
    }
    // Value format: "courierId|serviceProvider"
    const [id, provider] = value.split('|')
    setLocalCourierId(id)
    setLocalServiceProvider(provider || '')
  }

  // Get current combined value for the dropdown
  const getCombinedCourierValue = () => {
    if (!courierId) return ''
    return `${courierId}|${serviceProvider || ''}`
  }

  const { data: charges, isLoading } = useQuery({
    queryKey: ['b2b-additional-charges', courierId, serviceProvider, effectivePlanId],
    queryFn: () =>
      b2bAdminService.getAdditionalCharges({
        courier_id: courierId || undefined,
        service_provider: serviceProvider || undefined,
        plan_id: effectivePlanId,
      }),
    enabled: !!effectivePlanId,
  })

  // Use custom hook for form state management
  const { formData, updateField, updateCustomField, buildPayload } = useB2BChargesForm(charges)
  const hasWorkbookImportedRates = Object.values(formData.fieldDefinitions || {}).some(
    (definition) => definition?.group === 'Workbook Imported Rates',
  )

  const saveMutation = useMutation({
    mutationFn: (data) =>
      b2bAdminService.upsertAdditionalCharges({
        ...data,
        courier_id: courierId || undefined,
        service_provider: serviceProvider || undefined,
        plan_id: effectivePlanId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['b2b-additional-charges'])
      toast({
        title: 'Overhead charges saved',
        status: 'success',
        duration: 3000,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to save',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  const importChargesMutation = useMutation({
    mutationFn: (formData) => b2bAdminService.importAdditionalCharges(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['b2b-additional-charges'])
      toast({
        title: 'Import successful',
        description: data.message || `Imported ${data.inserted || 0} records`,
        status: 'success',
        duration: 5000,
      })
      onImportModalClose()
      setImportFile(null)
    },
    onError: (error) => {
      toast({
        title: 'Import failed',
        description: error.response?.data?.error || error.message || 'Failed to import charges',
        status: 'error',
        duration: 5000,
      })
    },
  })

  const handleImportCSV = () => {
    if (!importFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)
    if (effectivePlanId) formData.append('plan_id', effectivePlanId)
    if (courierId) formData.append('courier_id', courierId)
    if (serviceProvider) formData.append('service_provider', serviceProvider)

    importChargesMutation.mutate(formData)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setImportFile(file)
  }

  const handleSave = () => {
    const payload = buildPayload()
    saveMutation.mutate(payload)
  }

  const bgColor = useColorModeValue('white', 'gray.800')
  const cardBg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" color="blue.500" />
        <Text mt={4} color="gray.600">
          Loading charges configuration...
        </Text>
      </Box>
    )
  }

  return (
    <Box bg={bgColor} py={4}>
      <Box maxW="1400px" mx="auto" px={6}>
        <VStack spacing={4} align="stretch">
          <B2BAdditionalChargesFilters
            couriers={couriers}
            courierId={courierId}
            serviceProvider={serviceProvider}
            onCourierChange={handleCourierServiceChange}
            getCombinedCourierValue={getCombinedCourierValue}
            showCourierSelector={!isCourierScopeLocked}
            onSave={handleSave}
            isSaving={saveMutation.isPending}
            charges={charges}
            onImportClick={onImportModalOpen}
          />

          {/* Main Form Grid */}
          <Box bg={cardBg} borderRadius="lg" borderWidth="1px" borderColor={borderColor} p={6}>
            <VStack spacing={6} align="stretch">
              <StarLogisticsVASSection formData={formData} onFieldChange={updateField} />

              {hasWorkbookImportedRates && (
                <>
                  <Divider />
                  <WorkbookImportedRatesSection
                    customFields={formData.customFields}
                    fieldDefinitions={formData.fieldDefinitions}
                    onCustomFieldChange={updateCustomField}
                  />
                </>
              )}
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Import CSV Modal */}
      <ImportChargesModal
        isOpen={isImportModalOpen}
        onClose={() => {
          onImportModalClose()
          setImportFile(null)
        }}
        importFile={importFile}
        onFileSelect={handleFileSelect}
        onImport={handleImportCSV}
        isLoading={importChargesMutation.isPending}
        planId={effectivePlanId}
        courierId={courierId}
        serviceProvider={serviceProvider}
      />
    </Box>
  )
}

export default memo(B2BAdditionalCharges)

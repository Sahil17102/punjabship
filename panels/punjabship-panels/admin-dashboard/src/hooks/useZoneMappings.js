import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { b2bAdminService } from '../services/b2bAdmin.service'
import { zoneService } from '../services/zones.service'

export function useZoneMappings(
  zoneId,
  page = 1,
  limit = 20,
  filters = {},
  options = {},
) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const {
    businessType,
    courierId,
    serviceProvider,
    includeGlobal = true,
  } = options

  const normalizedType = businessType ? String(businessType).toUpperCase() : null
  const isB2B = normalizedType === 'B2B'

  const { data: mappingsData = {}, isLoading, isError } = useQuery({
    queryKey: [
      'zoneMappings',
      zoneId,
      page,
      limit,
      filters,
      normalizedType,
      courierId,
      serviceProvider,
    ],
    queryFn: () =>
      isB2B
        ? b2bAdminService.getPincodes({
            zone_id: zoneId,
            page,
            limit,
            include_global: includeGlobal,
            courier_id: courierId,
            service_provider: serviceProvider,
            ...filters,
          })
        : zoneService.getZoneMappings(zoneId, { page, limit, ...filters }),
    enabled: !!zoneId,
  })

  const rawMappings = isB2B ? mappingsData.data || [] : mappingsData.data || []
  const mappings = isB2B
    ? rawMappings.map((item) => ({
        ...item,
        is_oda: item.is_oda ?? item.isOda ?? false,
        is_remote: item.is_remote ?? item.isRemote ?? false,
        is_mall: item.is_mall ?? item.isMall ?? false,
        is_sez: item.is_sez ?? item.isSez ?? false,
        is_airport: item.is_airport ?? item.isAirport ?? false,
        is_high_security: item.is_high_security ?? item.isHighSecurity ?? false,
      }))
    : rawMappings
  const total = isB2B
    ? mappingsData.pagination?.total || 0
    : mappingsData.total || 0

  const createMapping = useMutation({
    mutationFn: (data) =>
      isB2B
        ? b2bAdminService.createPincode({
            ...data,
            zoneId,
            courierId,
            serviceProvider,
          })
        : zoneService.createZoneMapping(zoneId, data),
    onSuccess: (newMapping) => {
      queryClient.setQueryData(['zoneMappings', zoneId], (old) =>
        old ? [...old, newMapping] : [newMapping],
      )
      toast({
        title: 'Mapping created successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const updateMapping = useMutation({
    mutationFn: ({ mappingId, mappingData }) =>
      isB2B
        ? b2bAdminService.updatePincode(mappingId, {
            ...mappingData,
            // Only include courier scope if explicitly provided in mappingData
            // Zones are global, so courier scope is not needed for flag updates
            ...(mappingData.courierId && { courierId }),
            ...(mappingData.serviceProvider && { serviceProvider }),
          })
        : zoneService.updateZoneMapping(mappingId, mappingData),
    onSuccess: () => {
      queryClient.invalidateQueries(['zoneMappings', zoneId])
      toast({
        title: isB2B ? 'Pincode attributes updated.' : 'Mapping updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const deleteMapping = useMutation({
    mutationFn: (mappingId) =>
      isB2B ? b2bAdminService.deletePincode(mappingId) : zoneService.deleteZoneMapping(mappingId),
    onSuccess: (id) => {
      queryClient.invalidateQueries(['zoneMappings', zoneId])
      toast({
        title: 'Mapping deleted successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const bulkDeleteMappings = useMutation({
    mutationFn: (mappingIds) =>
      isB2B
        ? b2bAdminService.bulkDeletePincodes({ ids: mappingIds })
        : zoneService.bulkDeleteMappings(mappingIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['zoneMappings', zoneId])
      toast({
        title: 'Selected mappings deleted successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const bulkMoveMappings = useMutation({
    mutationFn: ({ mappingIds, zoneId: newZoneId }) =>
      isB2B
        ? b2bAdminService.bulkMovePincodes({ ids: mappingIds, targetZoneId: newZoneId })
        : zoneService.bulkMoveMappings(mappingIds, newZoneId),
    onSuccess: () => {
      queryClient.invalidateQueries(['zoneMappings', zoneId])
      toast({
        title: 'Selected mappings moved successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
  })

  const bulkUpdateFlags = useMutation({
    mutationFn: ({ mappingIds, flags }) => {
      if (!isB2B) {
        throw new Error('Bulk flag update is only available for B2B zones')
      }
      return b2bAdminService.bulkUpdatePincodeFlags({ ids: mappingIds, flags })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['zoneMappings', zoneId])
      toast({
        title: 'Pincode attributes updated successfully!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to update pincode attributes',
        description: error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })

  const importMappings = useMutation({
    mutationFn: ({ file, additionalFields }) => {
      if (!file) throw new Error('File is required')

      if (isB2B) {
        const formData = new FormData()
        formData.append('file', file?.file ?? file)
        if (courierId) formData.append('courier_id', courierId)
        if (serviceProvider) formData.append('service_provider', serviceProvider)
        if (additionalFields?.defaultZoneId) {
          formData.append('defaultZoneId', additionalFields.defaultZoneId)
        }
        // Pass zoneId to filter updates to current zone only
        if (zoneId) {
          formData.append('zoneId', zoneId)
        }
        return b2bAdminService.importPincodes(formData)
      }

      return zoneService.importZoneMappings(zoneId, file, additionalFields?.userChoices)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['zoneMappings', zoneId])
    },
  })

  const remapZone = useMutation({
    mutationFn: () => b2bAdminService.remapZone(zoneId),
    onSuccess: () => {
      queryClient.invalidateQueries(['zoneMappings', zoneId])
      toast({
        title: 'Pincodes remapped from state list.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Failed to remap pincodes',
        description: error?.message,
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })

  return {
    mappings,
    isLoading,
    isError,
    total,
    createMapping,
    updateMapping,
    deleteMapping,
    bulkDeleteMappings,
    bulkMoveMappings,
    bulkUpdateFlags,
    importMappings,
    remapZone,
  }
}

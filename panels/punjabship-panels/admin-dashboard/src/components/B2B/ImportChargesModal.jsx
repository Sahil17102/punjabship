import { Box, Button, HStack, Text, useToast, VStack } from '@chakra-ui/react'
import { memo, useEffect, useState } from 'react'
import DownloadSampleCSVButton from '../CSV/DownloadSampleCSVButton'
import CustomModal from '../Modal/CustomModal'
import FileUploader from '../upload/FileUploader'

/**
 * Import Charges Modal Component
 * Handles CSV import for overhead charges
 */
const ImportChargesModal = memo(
  ({
    isOpen,
    onClose,
    importFile,
    onFileSelect,
    onImport,
    isLoading,
    planId,
    courierId,
    serviceProvider,
  }) => {
    const toast = useToast()
    const [selectedFile, setSelectedFile] = useState(null)

    // Reset selected file when modal closes
    useEffect(() => {
      if (!isOpen) {
        setSelectedFile(null)
      }
    }, [isOpen])

    // Sync with prop when it changes externally
    useEffect(() => {
      if (importFile && !selectedFile) {
        setSelectedFile(importFile)
      }
    }, [importFile, selectedFile])

    // Handle file upload from FileUploader
    const handleFileUploaded = (uploadedFiles) => {
      if (uploadedFiles && uploadedFiles.length > 0) {
        const file = uploadedFiles[0].file || uploadedFiles[0]
        if (file instanceof File) {
          // Validate CSV file
          if (!file.name.endsWith('.csv')) {
            toast({
              title: 'Invalid file type',
              description: 'Please select a CSV file',
              status: 'error',
              duration: 3000,
            })
            return
          }
          setSelectedFile(file)
          // Also call the parent's onFileSelect if provided (for backward compatibility)
          if (onFileSelect) {
            // Create a synthetic event-like object
            const syntheticEvent = {
              target: {
                files: [file],
              },
            }
            onFileSelect(syntheticEvent)
          }
        }
      }
    }

    // Use selectedFile from FileUploader or fallback to importFile prop
    const currentFile = selectedFile || importFile
    const csvHeaders = [
      {
        courier_id: 'Numeric ID',
        service_provider: 'Text (must be: delhivery)',
        plan_id: planId || 'Optional UUID',
        awb_charges: 'Numeric',
        cft_factor: 'Numeric',
        minimum_chargeable_amount: 'Numeric',
        minimum_chargeable_weight: 'Numeric',
        minimum_chargeable_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        free_storage_days: 'Numeric',
        demurrage_per_awb_day: 'Numeric',
        demurrage_per_kg_day: 'Numeric',
        demurrage_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        public_holiday_pickup_charge: 'Numeric',
        fuel_surcharge_percentage: 'Numeric',
        green_tax: 'Numeric',
        oda_charges: 'Numeric',
        oda_per_kg_charge: 'Numeric',
        oda_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        csd_delivery_charge: 'Numeric',
        time_specific_per_kg: 'Numeric',
        time_specific_per_awb: 'Numeric',
        time_specific_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        mall_delivery_per_kg: 'Numeric',
        mall_delivery_per_awb: 'Numeric',
        mall_delivery_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        delivery_reattempt_per_kg: 'Numeric',
        delivery_reattempt_per_awb: 'Numeric',
        delivery_reattempt_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        handling_single_piece: 'Numeric',
        handling_below_100_kg: 'Numeric',
        handling_100_to_200_kg: 'Numeric',
        handling_above_200_kg: 'Numeric',
        insurance_charge: 'Numeric',
        cod_fixed_amount: 'Numeric',
        cod_percentage: 'Numeric',
        cod_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        rov_fixed_amount: 'Numeric',
        rov_percentage: 'Numeric',
        rov_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
        liability_limit: 'Numeric',
        liability_method: 'DROPDOWN: whichever_is_higher | whichever_is_lower',
      },
      {
        courier_id: '1',
        service_provider: 'delhivery',
        plan_id: planId || '',
        awb_charges: '50',
        cft_factor: '5',
        minimum_chargeable_amount: '100',
        minimum_chargeable_weight: '0.5',
        minimum_chargeable_method: 'whichever_is_higher',
        free_storage_days: '3',
        demurrage_per_awb_day: '10',
        demurrage_per_kg_day: '2',
        demurrage_method: 'whichever_is_higher',
        public_holiday_pickup_charge: '50',
        fuel_surcharge_percentage: '5',
        green_tax: '10',
        oda_charges: '50',
        oda_per_kg_charge: '5',
        oda_method: 'whichever_is_higher',
        csd_delivery_charge: '25',
        time_specific_per_kg: '5',
        time_specific_per_awb: '100',
        time_specific_method: 'whichever_is_higher',
        mall_delivery_per_kg: '5',
        mall_delivery_per_awb: '100',
        mall_delivery_method: 'whichever_is_higher',
        delivery_reattempt_per_kg: '5',
        delivery_reattempt_per_awb: '100',
        delivery_reattempt_method: 'whichever_is_higher',
        handling_single_piece: '20',
        handling_below_100_kg: '10',
        handling_100_to_200_kg: '15',
        handling_above_200_kg: '20',
        insurance_charge: '0',
        cod_fixed_amount: '50',
        cod_percentage: '1',
        cod_method: 'whichever_is_higher',
        rov_fixed_amount: '100',
        rov_percentage: '0.5',
        rov_method: 'whichever_is_higher',
        liability_limit: '5000',
        liability_method: 'whichever_is_lower',
      },
    ]

    return (
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title="Import Overhead Charges from CSV"
        size="xl"
        action={
          <DownloadSampleCSVButton
            headers={csvHeaders}
            filename={`b2b_overhead_charges_template_${new Date().toISOString().split('T')[0]}.csv`}
            buttonText="Download Template"
            size="sm"
            colorScheme="blue"
            tooltip="Download a sample CSV file with the correct format"
          />
        }
        footer={
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={onImport}
              isLoading={isLoading}
              isDisabled={!currentFile}
              leftIcon={<Text>📥</Text>}
            >
              Import CSV
            </Button>
          </HStack>
        }
      >
        <VStack spacing={4} align="stretch">
          <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
            <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={2}>
              CSV Format Requirements:
            </Text>
            <VStack align="stretch" spacing={1} fontSize="xs" color="blue.600">
              <Text>• Row 2 shows dropdown options for method columns</Text>
              <Text>• Include courier_id and/or service_provider columns</Text>
              <Text>• All numeric values should be numbers only (no currency symbols)</Text>
              <Text>• Method columns: use "whichever_is_higher" or "whichever_is_lower"</Text>
              <Text>• Empty cells will be treated as null/not set</Text>
            </VStack>
          </Box>

          <FileUploader
            onUploaded={handleFileUploaded}
            multiple={false}
            maxSizeMb={10}
            showUploadButton={false}
            getUrl={false}
            uploadLoading={false}
          />

          {currentFile && (
            <Box p={3} bg="green.50" borderRadius="md" borderWidth="1px" borderColor="green.200">
              <HStack spacing={2}>
                <Text fontSize="sm" color="green.700">
                  File selected: <strong>{currentFile.name}</strong> (
                  {(currentFile.size / 1024).toFixed(2)} KB)
                </Text>
              </HStack>
            </Box>
          )}

          {(courierId || serviceProvider) && (
            <Box p={3} bg="orange.50" borderRadius="md" borderWidth="1px" borderColor="orange.200">
              <Text fontSize="xs" color="orange.700">
                <strong>Note:</strong> Current filter: {courierId && `Courier ID: ${courierId}`}
                {courierId && serviceProvider && ', '}
                {serviceProvider && `Service Provider: ${serviceProvider}`}. CSV values will
                override these filters if provided.
              </Text>
            </Box>
          )}
        </VStack>
      </CustomModal>
    )
  },
)

ImportChargesModal.displayName = 'ImportChargesModal'

export default ImportChargesModal

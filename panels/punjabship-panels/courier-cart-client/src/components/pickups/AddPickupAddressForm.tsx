// AddPickupAddressForm.tsx
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material'
import type { AxiosError } from 'axios'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FaMapMarkedAlt } from 'react-icons/fa'
import { MdExpandMore } from 'react-icons/md'
import {
  useCreatePickupAddress,
  useUpdatePickupAddress,
} from '../../hooks/Pickup/usePickupAddresses'
import type { PickupFormValues } from '../../types/generic.types'
import { glassStyles } from '../UI/accordion/FormSectionAccordion'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomCheckbox from '../UI/inputs/CustomCheckbox'
import { toast } from '../UI/Toast'
import PickupAddressSection from './PickupAddressSection'

const AddPickupAddressForm = ({
  setDrawer,
  initialData,
}: {
  setDrawer: (v: boolean) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: any
}) => {
  const createPickupAddressMutation = useCreatePickupAddress()
  const updatePickupAddressMutation = useUpdatePickupAddress()
  const [serverError, setServerError] = useState<string | null>(null)

  const isEdit = !!initialData?.pickupId

  const { control, handleSubmit, setValue, watch, reset } = useForm<PickupFormValues>({
    mode: 'onBlur',
    defaultValues: {
      pickup: initialData?.pickup ?? {},
      rtoAddress: initialData?.rto ?? {},
      useDifferentRTO: initialData ? !initialData?.isRTOSame : false,
    },
  })

  const useDifferentRTO = watch('useDifferentRTO')

  const onSubmit = async (formData: PickupFormValues) => {
    try {
      setServerError(null)
      const payload = {
        ...initialData,
        pickup: formData.pickup,
        rtoAddress: formData.useDifferentRTO ? formData.rtoAddress : undefined,
      }

      if (isEdit && initialData?.pickup?.id) {
        await updatePickupAddressMutation.mutateAsync({ id: initialData.pickupId, payload })
        toast.open({ message: 'Pickup address updated successfully', severity: 'success' })
      } else {
        await createPickupAddressMutation.mutateAsync(payload)
        toast.open({ message: 'Pickup address saved successfully', severity: 'success' })
      }

      setDrawer(false)
      reset()
    } catch (err) {
      console.error(err)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosErr = err as AxiosError<any>
      const code = axiosErr.response?.data?.code
      const message = axiosErr.response?.data?.message

      if (code === 'DELHIVERY_WAREHOUSE_NAME_EXISTS') {
        setServerError(
          message ||
            'A warehouse with this nickname already exists in our system. Please choose a different warehouse nickname.',
        )
      } else {
        setServerError(message || 'Failed to save pickup address. Please try again.')
      }
    }
  }

  const required = (field: string) => ({ required: `${field} is required` })

  return (
    <Stack component="form" onSubmit={handleSubmit(onSubmit)} sx={{ color: '#fff', p: 2 }} gap={2}>
      {serverError && (
        <Box mb={1}>
          <Alert
            severity="error"
            onClose={() => {
              setServerError(null)
            }}
          >
            {serverError}
          </Alert>
        </Box>
      )}
      {/* Pickup Address Section */}
      <Accordion defaultExpanded disableGutters sx={glassStyles}>
        <AccordionSummary expandIcon={<MdExpandMore color="#fff" />}>
          <Typography fontWeight={600} display="flex" alignItems="center">
            <FaMapMarkedAlt style={{ marginRight: 8 }} />
            Pickup Address
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {/* PASS setValue DIRECTLY — do NOT prefix here */}
          <PickupAddressSection
            setValue={setValue}
            control={control}
            isEdit={isEdit}
            required={required}
            prefix="pickup"
          />
        </AccordionDetails>
      </Accordion>

      {/* RTO toggle + section */}
      <Box mt={2} sx={glassStyles} p={2}>
        <FormControlLabel
          control={
            <Controller
              name="useDifferentRTO"
              control={control}
              render={({ field }) => (
                <CustomCheckbox color="primary" checked={field.value} onChange={field.onChange} />
              )}
            />
          }
          label="Use a different RTO address"
        />

        {useDifferentRTO && (
          <Box mt={2}>
            <Accordion defaultExpanded disableGutters sx={glassStyles}>
              <AccordionSummary expandIcon={<MdExpandMore color="#fff" />}>
                <Typography fontWeight={600} display="flex" alignItems="center">
                  <FaMapMarkedAlt style={{ marginRight: 8 }} />
                  RTO Address
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <PickupAddressSection
                  setValue={setValue}
                  control={control}
                  isEdit={initialData?.pickupId}
                  required={required}
                  prefix="rtoAddress"
                />
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>

      <Box display={'flex'} justifyContent={'flex-end'} mt={2}>
        <Stack alignItems="flex-end" spacing={1} width="100%">
          {serverError && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {serverError}
            </Alert>
          )}
          <CustomIconLoadingButton
            type="submit"
            text={isEdit ? 'Update Address' : 'Save Address'}
            loading={
              isEdit ? updatePickupAddressMutation?.isPending : createPickupAddressMutation?.isPending
            }
          />
        </Stack>
      </Box>
    </Stack>
  )
}

export default AddPickupAddressForm

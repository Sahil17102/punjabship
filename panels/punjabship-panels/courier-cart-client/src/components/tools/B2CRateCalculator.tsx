import { Alert, Box, Grid, Typography } from '@mui/material'
import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { FiInfo } from 'react-icons/fi'
import { TbRulerMeasure, TbScale } from 'react-icons/tb'
import {
  B2C_MIN_CHARGEABLE_WEIGHT_GRAMS,
  B2C_MIN_CHARGEABLE_WEIGHT_KG,
} from '../../utils/constants'
import CustomInput from '../UI/inputs/CustomInput'

export default function B2CRateCalculator() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext()

  // Watch form values
  const length = useWatch({ control, name: 'length' }) || 0
  const breadth = useWatch({ control, name: 'breadth' }) || 0
  const height = useWatch({ control, name: 'height' }) || 0
  const actualWeightKg = useWatch({ control, name: 'weight' }) || 0 // kg

  // Volumetric weight in grams (unchanged – API still expects grams)
  const volumetricWeightGrams = useMemo(() => {
    const volKg = (Number(length) * Number(breadth) * Number(height)) / 5000
    const volGrams = volKg * 1000
    return isNaN(volGrams) ? 0 : Math.round(volGrams)
  }, [length, breadth, height])

  // Applicable weight in grams
  const applicableWeightGrams = useMemo(() => {
    const actualWeightGrams = (Number(actualWeightKg) || 0) * 1000
    return Math.max(actualWeightGrams, volumetricWeightGrams, B2C_MIN_CHARGEABLE_WEIGHT_GRAMS)
  }, [actualWeightKg, volumetricWeightGrams])

  // Convert to Kg for display
  const volumetricWeightKg = (volumetricWeightGrams / 1000).toFixed(2)
  const applicableWeightKg = (applicableWeightGrams / 1000).toFixed(2)

  return (
    <Grid container spacing={2}>
      {/* Actual Weight (in Kg for input) */}
      <Grid size={6}>
        <CustomInput
          label="Actual Weight *"
          type="number"
          {...register('weight', {
            required: 'Actual weight is required',
            min: { value: 0.1, message: 'Weight must be greater than 0' },
          })}
          postfix="Kg" // ✅ customer inputs in Kg (e.g. 0.5, 1, 2)
          fullWidth
          error={!!errors.weight}
          helperText={errors.weight?.message as string}
        />
      </Grid>

      {/* Clear Note */}
      <Grid mt={4} size={6} display="flex" alignItems="center">
        <Alert icon={<FiInfo size={18} />} severity="info" sx={{ width: '100%' }}>
          Minimum chargeable weight is{' '}
          <b>
            {B2C_MIN_CHARGEABLE_WEIGHT_GRAMS} g ({B2C_MIN_CHARGEABLE_WEIGHT_KG.toFixed(2)} Kg)
          </b>
        </Alert>
      </Grid>

      <Grid size={4}>
        <CustomInput
          label="Length (cm)"
          type="number"
          {...register('length', {
            required: 'Length is required',
            min: { value: 1, message: 'Must be greater than 0' },
          })}
          error={!!errors.length}
          helperText={errors.length?.message as string}
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <CustomInput
          label="Breadth (cm)"
          type="number"
          {...register('breadth', {
            required: 'Breadth is required',
            min: { value: 1, message: 'Must be greater than 0' },
          })}
          error={!!errors.breadth}
          helperText={errors.breadth?.message as string}
          fullWidth
        />
      </Grid>
      <Grid size={4}>
        <CustomInput
          label="Height (cm)"
          type="number"
          {...register('height', {
            required: 'Height is required',
            min: { value: 1, message: 'Must be greater than 0' },
          })}
          error={!!errors.height}
          helperText={errors.height?.message as string}
          fullWidth
        />
      </Grid>

      {/* Calculations */}
      <Grid size={6}>
        <Box
          sx={{
            p: 2,
            border: '1px solid #ddd',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TbRulerMeasure size={24} color="#1976d2" />
          <Box>
            <Typography variant="subtitle2">Volumetric Weight</Typography>
            <Typography variant="h6">
              {volumetricWeightGrams} g ({volumetricWeightKg} Kg)
            </Typography>
          </Box>
        </Box>
      </Grid>

      <Grid size={6}>
        <Box
          sx={{
            p: 2,
            border: '1px solid #ddd',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <TbScale size={24} color="#2e7d32" />
          <Box>
            <Typography variant="subtitle2">Applicable Weight</Typography>
            <Typography
              variant="h6"
              color={
                applicableWeightGrams === B2C_MIN_CHARGEABLE_WEIGHT_GRAMS
                  ? 'error'
                  : 'text.primary'
              }
            >
              {applicableWeightGrams} g ({applicableWeightKg} Kg)
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  )
}

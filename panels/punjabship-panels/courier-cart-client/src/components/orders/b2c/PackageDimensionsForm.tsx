import { Alert, Box, Grid, Paper, Stack, Typography, alpha } from '@mui/material'
import { Controller, useFormContext, useWatch } from 'react-hook-form'
import { FaWeightHanging } from 'react-icons/fa'
import {
  B2C_MIN_CHARGEABLE_WEIGHT_GRAMS,
  B2C_MIN_CHARGEABLE_WEIGHT_KG,
} from '../../../utils/constants'
import CustomInput from '../../UI/inputs/CustomInput'
import type { B2CFormData } from './B2COrderForm'

const ACCENT = '#0877C9'
const TEXT_PRIMARY = '#17171A'
const TEXT_MUTED = '#496189'

const formatWeightDisplay = (grams: number) => {
  if (!Number.isFinite(grams) || grams <= 0) return '-'
  if (grams < 1000) return `${Math.round(grams).toLocaleString('en-IN')} g`
  return `${(grams / 1000).toFixed(2)} kg`
}

const PackageDimensionsForm = () => {
  const { control } = useFormContext<B2CFormData>()

  const weight = useWatch({ control, name: 'weight' }) || 0
  const length = useWatch({ control, name: 'length' }) || 0
  const breadth = useWatch({ control, name: 'breadth' }) || 0
  const height = useWatch({ control, name: 'height' }) || 0

  const actualWeightGrams = Number(weight) || 0
  const actualWeightKg = actualWeightGrams / 1000
  const volumetricWeightKg = (Number(length) * Number(breadth) * Number(height)) / 5000
  const volumetricWeightGrams = Math.round(Math.max(volumetricWeightKg, 0) * 1000)
  const chargedWeightGrams = Math.max(
    actualWeightGrams,
    volumetricWeightGrams,
    B2C_MIN_CHARGEABLE_WEIGHT_GRAMS,
  )

  const fields = ['weight', 'length', 'breadth', 'height'] as const

  return (
    <>
      <Alert
        severity="info"
        sx={{
          mb: 0.55,
          py: 0,
          px: 1,
          fontSize: '0.78rem',
          backgroundColor: alpha(ACCENT, 0.05),
          border: `1px solid ${alpha(ACCENT, 0.16)}`,
          color: TEXT_PRIMARY,
          borderRadius: 2,
          '& .MuiAlert-icon': {
            color: ACCENT,
          },
        }}
      >
        Note: The minimum chargeable weight is {B2C_MIN_CHARGEABLE_WEIGHT_KG.toFixed(2)} Kg
      </Alert>

      <Grid container spacing={0.9}>
        {fields.map((key) => (
          <Grid size={{ xs: 12, md: 3 }} key={key}>
            <Controller
              name={key}
              control={control}
              defaultValue={0}
              rules={{
                required: `${key.charAt(0).toUpperCase() + key.slice(1)} is required`,
                min: { value: 0.01, message: 'Cannot be zero or negative' },
              }}
              render={({ field, fieldState }) => (
                <CustomInput
                  label={
                    key.charAt(0).toUpperCase() +
                    key.slice(1) +
                    (key === 'weight' ? ' (g)' : ' (cm)')
                  }
                  type="number"
                  required
                  {...field}
                  value={field.value === 0 ? '' : field.value}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  topMargin={false}
                  dense
                />
              )}
            />
          </Grid>
        ))}
      </Grid>

      <Paper
        elevation={0}
        sx={{
          p: 1,
          mt: 0.65,
          borderRadius: 2,
          border: `1px solid ${alpha(ACCENT, 0.14)}`,
          background: '#FFFFFF',
        }}
      >
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: TEXT_PRIMARY }}
        >
          <FaWeightHanging size={14} color={ACCENT} />
          Package Weight Summary
        </Typography>
        <Typography variant="caption" sx={{ color: TEXT_MUTED, mb: 0.55, display: 'block', fontSize: '0.68rem' }}>
          {`Chargeable weight is calculated as max of actual, volumetric, or minimum weight (${B2C_MIN_CHARGEABLE_WEIGHT_GRAMS} g)`}
        </Typography>

        <Grid container spacing={0.65}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 0.65,
                borderRadius: 2,
                border: `1px solid ${alpha(ACCENT, 0.12)}`,
                background: alpha(ACCENT, 0.03),
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ color: TEXT_MUTED }}>
                ACTUAL WEIGHT
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: TEXT_PRIMARY, mt: 0.2 }}>
                {formatWeightDisplay(actualWeightGrams)}
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {actualWeightKg.toFixed(2)} kg
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 0.65,
                borderRadius: 2,
                border: `1px solid ${alpha(ACCENT, 0.12)}`,
                background: '#FFFFFF',
              }}
            >
              <Typography variant="caption" fontWeight={700} sx={{ color: TEXT_MUTED }}>
                VOLUMETRIC WEIGHT
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ color: TEXT_PRIMARY, mt: 0.2 }}>
                {formatWeightDisplay(volumetricWeightGrams)}
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                L×B×H ÷ 5000
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                p: 0.65,
                borderRadius: 2,
                border: `2px solid ${alpha(ACCENT, 0.4)}`,
                background: alpha(ACCENT, 0.05),
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight={700} sx={{ color: ACCENT }}>
                  CHARGEABLE WEIGHT
                </Typography>
                <Box
                  sx={{
                    px: 0.65,
                    py: 0.15,
                    borderRadius: 1,
                    bgcolor: alpha(ACCENT, 0.12),
                  }}
                >
                  <Typography variant="caption" fontWeight={700} sx={{ color: ACCENT }}>
                    {chargedWeightGrams === B2C_MIN_CHARGEABLE_WEIGHT_GRAMS
                      ? 'MIN'
                      : chargedWeightGrams === actualWeightGrams
                      ? 'ACTUAL'
                      : 'VOLUMETRIC'}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body2" fontWeight={800} sx={{ color: TEXT_PRIMARY, mt: 0.2 }}>
                {formatWeightDisplay(chargedWeightGrams)}
              </Typography>
              <Typography variant="caption" sx={{ color: TEXT_MUTED }}>
                {chargedWeightGrams === B2C_MIN_CHARGEABLE_WEIGHT_GRAMS
                  ? 'Minimum weight applied'
                  : chargedWeightGrams === actualWeightGrams
                  ? 'Based on actual weight'
                  : 'Based on dimensions'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Paper>
    </>
  )
}

export default PackageDimensionsForm

import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { AiOutlineDelete } from 'react-icons/ai'
import { FaBoxOpen } from 'react-icons/fa'
import axiosInstance from '../../../api/axiosInstance'
import { useDebouncedEffect } from '../../../hooks/useDebounceEffect'
import CustomInput from '../../UI/inputs/CustomInput'
import type { B2BFormData, Box as B2BBox } from './B2BOrderForm'

const ACCENT = '#0877C9'
const SUCCESS = '#3DD598'
const TEXT_SECONDARY = '#4A5568'
const BOX_TEMPLATE: B2BBox = {
  lengthCm: 0,
  breadthCm: 0,
  heightCm: 0,
  weightKg: 0,
  quantity: 1,
}

const fieldDefinitions: Array<{
  name: keyof B2BBox
  label: string
  type: 'number'
  min: number
  helper: string
}> = [
  {
    name: 'lengthCm',
    label: 'Length (cm)',
    type: 'number',
    min: 0,
    helper: 'Box length in centimeters',
  },
  {
    name: 'breadthCm',
    label: 'Breadth (cm)',
    type: 'number',
    min: 0,
    helper: 'Box breadth in centimeters',
  },
  {
    name: 'heightCm',
    label: 'Height (cm)',
    type: 'number',
    min: 0,
    helper: 'Box height in centimeters',
  },
  {
    name: 'weightKg',
    label: 'Weight (kg)',
    type: 'number',
    min: 0,
    helper: 'Actual weight for one box',
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    min: 1,
    helper: 'How many boxes have these same dimensions',
  },
]

const ProductBoxesForm = () => {
  const { control, setValue, trigger, watch } = useFormContext<B2BFormData>()
  const [weightCalculations, setWeightCalculations] = useState<{
    totalChargeableWeight: number
    cftFactor: number
    loading: boolean
  }>({
    totalChargeableWeight: 0,
    cftFactor: 5000,
    loading: false,
  })

  const boxes = useWatch({ control, name: 'boxes' })
  const {
    fields: boxFields,
    append: appendBox,
    remove: removeBox,
  } = useFieldArray({
    control,
    name: 'boxes',
  })

  useEffect(() => {
    if (!Array.isArray(boxes) || boxes.length === 0) {
      setValue('boxes', [BOX_TEMPLATE], { shouldDirty: false })
    }
  }, [boxes, setValue])

  const pickupPincode = watch('pickupLocationPincode')
  const deliveryPincode = watch('pincode')

  useDebouncedEffect(
    () => {
      const calculateWeights = async () => {
        if (!boxes || boxes.length === 0) return

        const hasValidBox = boxes.some(
          (box) =>
            Number(box.lengthCm || 0) > 0 &&
            Number(box.breadthCm || 0) > 0 &&
            Number(box.heightCm || 0) > 0,
        )

        const totalActualWeight = boxes.reduce(
          (sum, box) => sum + Number(box.weightKg || 0) * Math.max(1, Number(box.quantity || 1)),
          0,
        )

        if (!hasValidBox) {
          setWeightCalculations({
            totalChargeableWeight: totalActualWeight,
            cftFactor: 5000,
            loading: false,
          })
          return
        }

        setWeightCalculations((prev) => ({ ...prev, loading: true }))

        try {
          let maxLength = 0
          let maxBreadth = 0
          let maxHeight = 0

          boxes.forEach((box) => {
            const length = Number(box.lengthCm || 0)
            const breadth = Number(box.breadthCm || 0)
            const height = Number(box.heightCm || 0)
            if (length > 0 && breadth > 0 && height > 0) {
              maxLength = Math.max(maxLength, length)
              maxBreadth = Math.max(maxBreadth, breadth)
              maxHeight = Math.max(maxHeight, height)
            }
          })

          const apiPayload: {
            originPincode: string
            destinationPincode: string
            weightKg: number
            length?: number
            width?: number
            height?: number
          } = {
            originPincode: pickupPincode || '110001',
            destinationPincode: deliveryPincode || '110001',
            weightKg: totalActualWeight,
          }

          if (maxLength > 0) apiPayload.length = maxLength
          if (maxBreadth > 0) apiPayload.width = maxBreadth
          if (maxHeight > 0) apiPayload.height = maxHeight

          const response = await axiosInstance.post('/admin/b2b/calculate-rate', apiPayload)

          if (response.data?.data) {
            const calculation = response.data.data.calculation || {}
            const config = response.data.data.config || {}

            setWeightCalculations({
              totalChargeableWeight: Number(calculation.billableWeight || totalActualWeight),
              cftFactor: Number(config.cftFactor || calculation.cftFactor || 5000),
              loading: false,
            })
            return
          }

          setWeightCalculations({
            totalChargeableWeight: totalActualWeight,
            cftFactor: 5000,
            loading: false,
          })
        } catch (error: unknown) {
          console.error('Error calculating weights from backend:', error)

          const totalVolumetricWeight = boxes.reduce((sum, box) => {
            const length = Number(box.lengthCm || 0)
            const breadth = Number(box.breadthCm || 0)
            const height = Number(box.heightCm || 0)
            const quantity = Math.max(1, Number(box.quantity || 1))
            if (length <= 0 || breadth <= 0 || height <= 0) return sum
            return sum + ((length * breadth * height) / 5000) * quantity
          }, 0)

          setWeightCalculations({
            totalChargeableWeight: Math.max(totalActualWeight, totalVolumetricWeight),
            cftFactor: 5000,
            loading: false,
          })
        }
      }

      calculateWeights()
    },
    [boxes, pickupPincode, deliveryPincode],
    500,
  )

  const canAddNewRow = async () => {
    const lastIndex = boxFields.length - 1
    if (lastIndex < 0) return true

    const valid = await trigger(
      fieldDefinitions.map((field) => `boxes.${lastIndex}.${field.name}` as const),
    )
    return valid
  }

  const handleAddBox = async () => {
    const valid = await canAddNewRow()
    if (!valid) return
    appendBox({ ...BOX_TEMPLATE })
  }

  const allBoxes = useWatch({ control, name: 'boxes' }) || []
  const totalBoxUnits = allBoxes.reduce(
    (sum, box) => sum + Math.max(1, Number(box.quantity || 1)),
    0,
  )
  const totalDeadWeight = allBoxes.reduce(
    (sum, box) => sum + Number(box.weightKg || 0) * Math.max(1, Number(box.quantity || 1)),
    0,
  )

  return (
    <Stack gap={2} mt={1}>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: `1px solid ${alpha(ACCENT, 0.12)}`,
          background: alpha(ACCENT, 0.03),
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          gap={1}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>
              Shipment Boxes
            </Typography>
            <Typography variant="body2" color={TEXT_SECONDARY}>
              Add one or more boxes. Each box can have its own dimensions, weight, and quantity.
            </Typography>
          </Box>
          <Button variant="outlined" onClick={handleAddBox}>
            Add Another Box
          </Button>
        </Stack>
      </Paper>

      {boxFields.map((box, boxIndex) => (
        <Paper
          key={box.id}
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: `1px solid ${alpha(SUCCESS, 0.18)}`,
            background: '#FFFFFF',
            boxShadow: '0 10px 24px rgba(17, 24, 39, 0.05)',
          }}
        >
          <Stack gap={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(ACCENT, 0.1),
                    color: ACCENT,
                  }}
                >
                  <FaBoxOpen size={16} />
                </Box>
                <Box>
                  <Typography fontWeight={700}>{`Box ${boxIndex + 1}`}</Typography>
                  <Typography variant="caption" color={TEXT_SECONDARY}>
                    Use this when this box has dimensions different from the others.
                  </Typography>
                </Box>
              </Stack>

              <IconButton
                color="error"
                onClick={() => removeBox(boxIndex)}
                disabled={boxFields.length === 1}
                aria-label={`Remove box ${boxIndex + 1}`}
              >
                <AiOutlineDelete />
              </IconButton>
            </Stack>

            <Box
              display="grid"
              gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' }}
              gap={2}
            >
              {fieldDefinitions.map((fieldDef) => (
                <Controller
                  key={`${box.id}-${fieldDef.name}`}
                  name={`boxes.${boxIndex}.${fieldDef.name}` as const}
                  control={control}
                  rules={{
                    required: `${fieldDef.label} is required`,
                    min: {
                      value: fieldDef.min,
                      message:
                        fieldDef.name === 'quantity'
                          ? 'Minimum quantity is 1'
                          : 'Cannot be negative',
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      {...field}
                      fullWidth
                      type={fieldDef.type}
                      label={fieldDef.label}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message || fieldDef.helper}
                    />
                  )}
                />
              ))}
            </Box>
          </Stack>
        </Paper>
      ))}

      {allBoxes.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: '1px solid #E0E6ED',
            background: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            position: 'relative',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: `linear-gradient(90deg, ${ACCENT} 0%, ${SUCCESS} 100%)`,
              borderRadius: '12px 12px 0 0',
            },
          }}
        >
          <Stack gap={2}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              gap={1.5}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color={ACCENT}>
                  Box Summary
                </Typography>
                <Typography variant="body2" color={TEXT_SECONDARY}>
                  {`${allBoxes.length} box configuration${allBoxes.length > 1 ? 's' : ''} | ${totalBoxUnits} total box unit${totalBoxUnits > 1 ? 's' : ''}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={700} color={ACCENT}>
                  Actual Weight
                </Typography>
                <Typography variant="body2" color={TEXT_SECONDARY}>
                  {`${totalDeadWeight.toFixed(2)} kg`}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: '#F5F7FA',
                border: '1px solid #E0E6ED',
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" fontWeight={600} color={ACCENT}>
                    Chargeable Weight
                  </Typography>
                  {weightCalculations.loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Typography variant="h6" fontWeight={700} color={ACCENT}>
                      {weightCalculations.totalChargeableWeight.toFixed(2)} kg
                    </Typography>
                  )}
                </Stack>
                <Typography variant="caption" color={TEXT_SECONDARY}>
                  Formula: max(Actual Weight, Volumetric Weight) | Volumetric = (L x B x H) /{' '}
                  {weightCalculations.cftFactor}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Paper>
      )}
    </Stack>
  )
}

export default ProductBoxesForm

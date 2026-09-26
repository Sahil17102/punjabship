import {
  Box,
  Button,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import { useEffect } from 'react'
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import { AiOutlineDelete } from 'react-icons/ai'
import { FaBoxOpen } from 'react-icons/fa'
import CustomInput from '../UI/inputs/CustomInput'

const ACCENT = '#0877C9'
const TEXT_SECONDARY = '#4A5568'

type RateCalculatorBox = {
  lengthCm: string | number
  breadthCm: string | number
  heightCm: string | number
  weightKg: string | number
  quantity: string | number
}

type RateCalculatorFormValues = {
  boxes: RateCalculatorBox[]
  totalWeight?: string
  numberOfBoxes?: string
  length?: string
  breadth?: string
  height?: string
  rovType?: string
  freightMode?: string
}

const BOX_TEMPLATE: RateCalculatorBox = {
  lengthCm: '',
  breadthCm: '',
  heightCm: '',
  weightKg: '',
  quantity: '1',
}

const fieldDefinitions: Array<{
  name: keyof RateCalculatorBox
  label: string
  min: number
  helper: string
}> = [
  { name: 'lengthCm', label: 'Length (cm)', min: 0, helper: 'Box length in centimeters' },
  { name: 'breadthCm', label: 'Breadth (cm)', min: 0, helper: 'Box breadth in centimeters' },
  { name: 'heightCm', label: 'Height (cm)', min: 0, helper: 'Box height in centimeters' },
  { name: 'weightKg', label: 'Weight (kg)', min: 0, helper: 'Actual weight for one box' },
  { name: 'quantity', label: 'Quantity', min: 1, helper: 'How many boxes have these same dimensions' },
]

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const normalizeBoxes = (boxes: RateCalculatorBox[] | undefined) => {
  if (!Array.isArray(boxes) || !boxes.length) return [{ ...BOX_TEMPLATE }]
  return boxes.map((box) => ({
    lengthCm: box?.lengthCm ?? '',
    breadthCm: box?.breadthCm ?? '',
    heightCm: box?.heightCm ?? '',
    weightKg: box?.weightKg ?? '',
    quantity: box?.quantity ?? '1',
  }))
}

const buildBoxSummary = (boxes: RateCalculatorBox[] | undefined) =>
  normalizeBoxes(boxes).reduce(
    (summary, box) => {
      const quantity = Math.max(1, toNumber(box.quantity, 1))
      const length = Math.max(0, toNumber(box.lengthCm, 0))
      const breadth = Math.max(0, toNumber(box.breadthCm, 0))
      const height = Math.max(0, toNumber(box.heightCm, 0))
      const weight = Math.max(0, toNumber(box.weightKg, 0))
      return {
        totalUnits: summary.totalUnits + quantity,
        totalActualWeight: summary.totalActualWeight + weight * quantity,
        maxLength: Math.max(summary.maxLength, length),
        maxBreadth: Math.max(summary.maxBreadth, breadth),
        maxHeight: Math.max(summary.maxHeight, height),
      }
    },
    { totalUnits: 0, totalActualWeight: 0, maxLength: 0, maxBreadth: 0, maxHeight: 0 },
  )

export default function B2BRateCalculator() {
  const { control, setValue, watch } = useFormContext<RateCalculatorFormValues>()
  const rovType = watch('rovType')
  const boxes = useWatch({ control, name: 'boxes' }) as RateCalculatorBox[] | undefined
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'boxes',
  })
  const boxSummary = buildBoxSummary(boxes)

  useEffect(() => {
    if (rovType === 'none') {
      setValue('rovType', 'owner')
    }
  }, [rovType, setValue])

  useEffect(() => {
    if (!Array.isArray(boxes) || boxes.length === 0) {
      setValue('boxes', [{ ...BOX_TEMPLATE }], { shouldDirty: false })
    }
  }, [boxes, setValue])

  useEffect(() => {
    setValue('totalWeight', boxSummary.totalActualWeight > 0 ? boxSummary.totalActualWeight.toFixed(2) : '')
    setValue('numberOfBoxes', boxSummary.totalUnits > 0 ? String(boxSummary.totalUnits) : '')
    setValue('length', boxSummary.maxLength > 0 ? String(boxSummary.maxLength) : '')
    setValue('breadth', boxSummary.maxBreadth > 0 ? String(boxSummary.maxBreadth) : '')
    setValue('height', boxSummary.maxHeight > 0 ? String(boxSummary.maxHeight) : '')
  }, [
    boxSummary.maxBreadth,
    boxSummary.maxHeight,
    boxSummary.maxLength,
    boxSummary.totalActualWeight,
    boxSummary.totalUnits,
    setValue,
  ])

  const addBox = () => append({ ...BOX_TEMPLATE })

  const removeBox = (index: number) => {
    if (fields.length === 1) return
    remove(index)
  }

  return (
    <Grid container spacing={2.5}>
      <Grid size={12}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: `1px solid ${alpha(ACCENT, 0.12)}`,
            background: alpha(ACCENT, 0.03),
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'center' }}
            gap={2}
          >
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                Shipment Boxes
              </Typography>
              <Typography variant="body2" sx={{ color: TEXT_SECONDARY }}>
                Add one or more boxes. Each box can have its own dimensions, weight, and quantity.
              </Typography>
            </Box>
            <Button variant="outlined" onClick={addBox} sx={{ borderColor: ACCENT, color: ACCENT }}>
              Add Another Box
            </Button>
          </Stack>
        </Paper>
      </Grid>

      {fields.map((field, boxIndex) => (
        <Grid size={12} key={field.id}>
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${alpha('#3DD598', 0.2)}`,
              boxShadow: '0 10px 24px rgba(17, 24, 39, 0.05)',
            }}
          >
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
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
                    <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
                      Use this when this box has dimensions different from the others.
                    </Typography>
                  </Box>
                </Stack>

                <IconButton
                  color="error"
                  onClick={() => removeBox(boxIndex)}
                  disabled={fields.length === 1}
                  aria-label={`Remove box ${boxIndex + 1}`}
                >
                  <AiOutlineDelete />
                </IconButton>
              </Stack>

              <Grid container spacing={2}>
                {fieldDefinitions.map((fieldDef) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${field.id}-${fieldDef.name}`}>
                    <Controller
                      name={`boxes.${boxIndex}.${fieldDef.name}`}
                      control={control}
                      defaultValue={BOX_TEMPLATE[fieldDef.name]}
                      render={({ field: controllerField }) => (
                        <CustomInput
                          {...controllerField}
                          label={fieldDef.label}
                          type="number"
                          fullWidth
                          helpText={fieldDef.helper}
                          inputProps={{ min: fieldDef.min, step: '0.01' }}
                        />
                      )}
                    />
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>
        </Grid>
      ))}

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(17,24,39,0.08)' }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: TEXT_SECONDARY }}>
            Box Summary
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} mt={1}>
            {`${fields.length} configuration${fields.length > 1 ? 's' : ''} | ${boxSummary.totalUnits} total unit${boxSummary.totalUnits === 1 ? '' : 's'}`}
          </Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(17,24,39,0.08)' }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: TEXT_SECONDARY }}>
            Actual Weight
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} mt={1}>
            {`${boxSummary.totalActualWeight.toFixed(2)} kg`}
          </Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid rgba(17,24,39,0.08)' }}>
          <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', color: TEXT_SECONDARY }}>
            Representative Dimensions
          </Typography>
          <Typography variant="subtitle1" fontWeight={700} mt={1}>
            {boxSummary.maxLength > 0 || boxSummary.maxBreadth > 0 || boxSummary.maxHeight > 0
              ? `${boxSummary.maxLength} x ${boxSummary.maxBreadth} x ${boxSummary.maxHeight} cm`
              : 'Add dimensions to calculate'}
          </Typography>
        </Paper>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomInput
          label="Total Weight (kg)"
          type="number"
          value={watch('totalWeight') || ''}
          fullWidth
          InputProps={{ readOnly: true }}
          helpText="Derived automatically from all box weights"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <CustomInput
          label="Number of Boxes"
          type="number"
          value={watch('numberOfBoxes') || ''}
          fullWidth
          InputProps={{ readOnly: true }}
          helpText="Total units from all box quantities"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 4 }}>
        <CustomInput
          label="Length Used (cm)"
          type="number"
          value={watch('length') || ''}
          fullWidth
          InputProps={{ readOnly: true }}
          helpText="Largest box length"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomInput
          label="Width Used (cm)"
          type="number"
          value={watch('breadth') || ''}
          fullWidth
          InputProps={{ readOnly: true }}
          helpText="Largest box width"
        />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <CustomInput
          label="Height Used (cm)"
          type="number"
          value={watch('height') || ''}
          fullWidth
          InputProps={{ readOnly: true }}
          helpText="Largest box height"
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="freightMode"
          control={control}
          defaultValue="fod"
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="b2b-rate-freight-mode-label">Freight Mode</InputLabel>
              <Select {...field} labelId="b2b-rate-freight-mode-label" label="Freight Mode">
                <MenuItem value="fop">Bill to Client (FOP)</MenuItem>
                <MenuItem value="fod">Freight on Delivery (FOD)</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Controller
          name="rovType"
          control={control}
          defaultValue="owner"
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="b2b-rate-rov-type-label">Insurance Type</InputLabel>
              <Select {...field} labelId="b2b-rate-rov-type-label" label="Insurance Type">
                <MenuItem value="owner">Owner Risk / Insurance</MenuItem>
                <MenuItem value="courier">Courier Insurance</MenuItem>
              </Select>
            </FormControl>
          )}
        />
      </Grid>

      <Grid size={12}>
        <Typography variant="caption" sx={{ color: TEXT_SECONDARY }}>
          The rate calculator uses the combined box weight, total box units, and the largest box dimensions from this list.
        </Typography>
      </Grid>
    </Grid>
  )
}

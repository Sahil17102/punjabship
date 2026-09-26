import { Box, Button, Grid, IconButton, Paper, Stack, Typography, alpha } from '@mui/material'
import {
  type Control,
  Controller,
  type UseFieldArrayAppend,
  type UseFieldArrayRemove,
} from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import { FaPlus, FaTrash } from 'react-icons/fa'
import { TbPercentage } from 'react-icons/tb'
import CustomInput from '../../UI/inputs/CustomInput'
import type { B2CFormData } from './B2COrderForm'

const ACCENT = '#0877C9'

interface PackageDetailsFormProps {
  control: Control<B2CFormData>
  fields: { id: string }[]
  remove: UseFieldArrayRemove
  append: UseFieldArrayAppend<B2CFormData, 'products'>
}

const PackageDetailsForm = ({ control, fields, remove, append }: PackageDetailsFormProps) => {
  return (
    <Stack gap={0.65}>
      {fields.map((item, index) => (
        <Paper
          key={item.id}
          elevation={0}
          sx={{
            p: { xs: 0.7, sm: 0.8 },
            borderRadius: 2,
            border: `1px solid ${alpha(ACCENT, 0.12)}`,
            background: '#FFFFFF',
          }}
        >
          <Stack gap={0.6}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" fontWeight={700} sx={{ color: '#17171A' }}>
                Product {index + 1}
              </Typography>
              <IconButton
                size="small"
                color="error"
                onClick={() => remove(index)}
                sx={{
                  width: 24,
                  height: 24,
                  border: `1px solid ${alpha('#ef4444', 0.35)}`,
                  backgroundColor: alpha('#ef4444', 0.06),
                }}
              >
                <FaTrash size={12} />
              </IconButton>
            </Stack>

            <Grid container spacing={0.65} alignItems="flex-start">
              <Grid size={{ xs: 12, md: 4, xl: 3 }}>
                <Controller
                  name={`products.${index}.productName` as const}
                  control={control}
                  rules={{ required: 'Name is required' }}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      label="Name"
                      required
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      topMargin={false}
                      dense
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 2, xl: 1.5 }}>
                <Controller
                  name={`products.${index}.price` as const}
                  control={control}
                  rules={{
                    required: 'Price is required',
                    min: { value: 1, message: 'Min 1' },
                  }}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      label="Price ₹"
                      type="number"
                      required
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      topMargin={false}
                      dense
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 2, xl: 1.5 }}>
                <Controller
                  name={`products.${index}.quantity` as const}
                  control={control}
                  rules={{
                    required: 'Quantity is required',
                    min: { value: 1, message: 'Minimum 1' },
                  }}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      label="Quantity"
                      type="number"
                      required
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      topMargin={false}
                      dense
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 2, xl: 1.5 }}>
                <Controller
                  name={`products.${index}.discount` as const}
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      prefix={<BiRupee />}
                      label="Discount ₹"
                      type="number"
                      topMargin={false}
                      dense
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 2, xl: 1.5 }}>
                <Controller
                  name={`products.${index}.taxRate` as const}
                  control={control}
                  render={({ field }) => (
                    <CustomInput
                      postfix={<TbPercentage />}
                      label="Tax Rate %"
                      type="number"
                      topMargin={false}
                      dense
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 3, xl: 1.5 }}>
                <Controller
                  name={`products.${index}.hsnCode` as const}
                  control={control}
                  render={({ field }) => (
                    <CustomInput label="HSN Code (Optional)" topMargin={false} dense {...field} />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 6, md: 3, xl: 1.5 }}>
                <Controller
                  name={`products.${index}.sku` as const}
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      label="SKU"
                      {...field}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      topMargin={false}
                      dense
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Stack>
        </Paper>
      ))}

      <Box>
        <Button
          variant="outlined"
          startIcon={<FaPlus />}
          onClick={() => append({ productName: '', price: 0, quantity: 1 })}
          sx={{
            mt: 0.25,
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: alpha(ACCENT, 0.35),
            color: ACCENT,
            fontWeight: 700,
            minHeight: 28,
            fontSize: '0.78rem',
            px: 2,
            '&:hover': {
              borderColor: ACCENT,
              backgroundColor: alpha(ACCENT, 0.06),
            },
          }}
        >
          Add Product
        </Button>
      </Box>
    </Stack>
  )
}

export default PackageDetailsForm

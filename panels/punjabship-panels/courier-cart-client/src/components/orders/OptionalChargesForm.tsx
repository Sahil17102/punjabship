import { Grid } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'
import { BiRupee } from 'react-icons/bi'
import CustomInput from '../UI/inputs/CustomInput'

const OptionalChargesForm = () => {
  const { control, watch } = useFormContext()
  const orderType = String(watch('orderType') || '').trim().toLowerCase()
  const isCod = orderType === 'cod'

  return (
    <Grid container spacing={2}>
      <Grid size={{ md: isCod ? 6 : 4, xs: 12 }}>
        <Controller
          name="orderAmount"
          control={control}
          render={({ field }) => (
            <CustomInput
              label={isCod ? 'Shipment Amount (Rs.)' : 'Total Shipment Value (Rs.)'}
              type="number"
              prefix={<BiRupee />}
              {...field}
              helperText={
                isCod
                  ? 'Auto-calculated shipment amount used for this COD order'
                  : 'Auto-calculated from invoice totals'
              }
              disabled
            />
          )}
        />
      </Grid>

      {isCod && (
        <Grid size={{ md: 6, xs: 12 }}>
          <Controller
            name="codAmount"
            control={control}
            rules={{
              required: 'Amount to collect is required for COD orders',
              validate: (value) =>
                Number(value ?? 0) > 0 || 'Amount to collect must be greater than 0',
            }}
            render={({ field, fieldState }) => (
              <CustomInput
                label="Collectable Payment (COD Rs.)"
                type="number"
                prefix={<BiRupee />}
                {...field}
                error={!!fieldState.error}
                helperText={
                  fieldState.error?.message ||
                  'Sent to the courier as the amount to collect on delivery'
                }
              />
            )}
          />
        </Grid>
      )}

      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="shippingCharges"
          control={control}
          render={({ field }) => (
            <CustomInput
              label="Shipping Charge (Customer Rs.)"
              type="number"
              prefix={<BiRupee />}
              {...field}
              helperText="What the customer pays for shipping"
            />
          )}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="transactionFee"
          control={control}
          render={({ field }) => (
            <CustomInput
              label="Transaction Fee (Optional Rs.)"
              type="number"
              prefix={<BiRupee />}
              {...field}
            />
          )}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="discount"
          control={control}
          render={({ field }) => (
            <CustomInput label="Discount (Optional Rs.)" type="number" prefix="- Rs." {...field} />
          )}
        />
      </Grid>

      <Grid size={{ md: 4, xs: 12 }}>
        <Controller
          name="prepaidAmount"
          control={control}
          render={({ field }) => (
            <CustomInput
              label="Prepaid Amount (Optional Rs.)"
              type="number"
              prefix="- Rs."
              {...field}
            />
          )}
        />
      </Grid>
    </Grid>
  )
}

export default OptionalChargesForm

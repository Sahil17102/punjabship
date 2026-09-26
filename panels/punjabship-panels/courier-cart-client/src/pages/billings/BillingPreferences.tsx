import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Stack,
  Typography,
} from '@mui/material'
import React, { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { FaClock, FaCogs } from 'react-icons/fa'
import { MdOutlineAutorenew } from 'react-icons/md'
import { RiMoneyRupeeCircleFill } from 'react-icons/ri'
import PageHeading from '../../components/UI/heading/PageHeading'
import CustomInput from '../../components/UI/inputs/CustomInput'
import CustomSelect from '../../components/UI/inputs/CustomSelect'
import CustomSwitch from '../../components/UI/inputs/CustomSwitch'
import { useBillingPreference } from '../../hooks/Billing/useBillingPreferences'
import type { BillingPreference } from '../../types/billing.types'

const BillingPreferencesPage: React.FC = () => {
  // ✅ React Query hooks
  const { data: pref, isLoading } = useBillingPreference()

  // ✅ React Hook Form setup
  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      frequency: 'weekly',
      autoGenerate: true,
      customFrequencyDays: null,
    },
  })

  useEffect(() => {
    if (pref) {
      const typedPref = pref as BillingPreference
      reset({
        frequency: typedPref.frequency,
        autoGenerate: typedPref.autoGenerate,
        // keep null to satisfy current form typing; field is read-only anyway
        customFrequencyDays: null,
      })
    }
  }, [pref, reset])

  const frequency = watch('frequency')

  const onSubmit = () => {
    // Billing preferences are now managed by admin only
    return
  }

  return (
    <Box p={{ xs: 2, sm: 4 }} display={'flex'} justifyContent={'center'} margin={'auto'}>
      {isLoading ? (
        <CircularProgress />
      ) : (
        <Card
          elevation={10}
          sx={{
            width: '100%',
            maxWidth: 600,
            borderRadius: 5,
            p: 3,
            background: '#FFFFFF',
            border: '1px solid #E0E6ED',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <CardContent>
            {/* Header */}
            <Stack direction="row" alignItems="start" spacing={2} mb={3}>
              <RiMoneyRupeeCircleFill size={36} color="#0877C9" />
              <Box>
                <PageHeading
                  title="Billing Preferences"
                  subtitle="Manage your invoice frequency and automation settings"
                />
              </Box>
            </Stack>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Frequency */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <FaClock color="#0877C9" />
                <Typography fontWeight={500}>Billing Frequency</Typography>
              </Stack>
              <FormControl fullWidth margin="normal" variant="outlined" size="small">
                <Controller
                  name="frequency"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      topMargin={false}
                      label="Select Frequency"
                      value={field.value}
                      onSelect={(val) => field.onChange(val)}
                      items={[
                        { key: 'weekly', label: 'Weekly' },
                        { key: 'monthly', label: 'Monthly' },
                        { key: 'manual', label: 'Manual' },
                        { key: 'custom', label: 'Custom' },
                      ]}
                      placeholder="Choose frequency..."
                      helperText="Select how often invoices should generate"
                    />
                  )}
                />
              </FormControl>

              {/* Custom Frequency */}
              {frequency === 'custom' && (
                <Box mt={2}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <FaCogs color="#F39C12" />
                    <Typography fontWeight={500}>Custom Frequency (days)</Typography>
                  </Stack>
                  <Controller
                    name="customFrequencyDays"
                    control={control}
                    render={({ field }) => (
                      <CustomInput
                        {...field}
                        type="number"
                        topMargin={false}
                        fullWidth
                        margin="normal"
                        placeholder="Add custom Frequency (days)"
                        disabled
                      />
                    )}
                  />
                </Box>
              )}

              {/* Auto-generate toggle */}
              <Stack direction="row" alignItems="center" spacing={1} mt={3}>
                <MdOutlineAutorenew color="#3DD598" />
                <Controller
                  name="autoGenerate"
                  control={control}
                  render={({ field }) => (
                    <CustomSwitch
                      {...field}
                      label="Auto-generate invoices"
                      checked={field.value}
                      disabled // fully read-only for customers
                    />
                  )}
                />
              </Stack>

              <Stack mt={4}>
                <Alert severity="info">
                  Billing preferences are managed by your account administrator. Please contact
                  support to request changes.
                </Alert>
              </Stack>
            </form>
          </CardContent>
        </Card>
      )}

      {/* No mutation snackbars; page is read-only */}
    </Box>
  )
}

export default BillingPreferencesPage

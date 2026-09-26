/* eslint-disable @typescript-eslint/no-explicit-any */
import { CircularProgress, Grid } from '@mui/material'
import { useEffect } from 'react'
import { Controller, type FieldErrors, useFormContext } from 'react-hook-form'
import { normalizePincode, type ServiceabilityLocation } from '../../api/locations'
import { useLocations } from '../../hooks/useLocations'
import CustomInput from '../UI/inputs/CustomInput'
import type { B2BFormData } from './b2b/B2BOrderForm'
import type { B2CFormData } from './b2c/B2COrderForm'

type FormType = 'b2b' | 'b2c'

const getExactLocation = (rows: ServiceabilityLocation[] = [], pincode: string) =>
  rows.find((row) => String(row?.pincode || '') === pincode) ?? rows[0]

const DeliveryDetailsForm = ({ type = 'b2c' }: { type?: FormType }) => {
  const {
    control,
    setValue,
    watch,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useFormContext<B2CFormData | B2BFormData>()

  const pincode = watch('pincode')
  const normalizedPincode = normalizePincode(pincode)

  const {
    data: locationData,
    isFetching: pinFetching,
    isError,
  } = useLocations(
    { pincode: normalizedPincode },
    Boolean(/^\d{6}$/.test(normalizedPincode)),
    ['locationLookup', normalizedPincode],
  )

  useEffect(() => {
    if (!/^\d{6}$/.test(normalizedPincode)) {
      clearErrors('pincode')
      setValue('city', '', { shouldValidate: false })
      setValue('state', '', { shouldValidate: false })
      return
    }

    if (isError) {
      setError('pincode', { type: 'manual', message: 'PIN lookup failed' })
      return
    }

    if (locationData) {
      const rows: ServiceabilityLocation[] = Array.isArray(locationData?.data)
        ? locationData.data
        : []
      const location = getExactLocation(rows, normalizedPincode)
      const city = location?.city
      const state = location?.state

      if (!city || !state) {
        setError('pincode', { type: 'manual', message: 'Invalid pincode' })
        setValue('city', '', { shouldValidate: false })
        setValue('state', '', { shouldValidate: false })
      } else {
        clearErrors('pincode')
        setValue('city', city, { shouldValidate: true })
        setValue('state', state, { shouldValidate: true })
      }
    }
  }, [locationData, isError, normalizedPincode, setError, clearErrors, setValue, getValues])

  const fields = [
    { name: 'buyerName', label: 'Name' },
    { name: 'buyerPhone', label: 'Phone' },
    { name: 'buyerEmail', label: 'Email' },
    { name: 'pincode', label: 'Pincode' },
    { name: 'city', label: 'City' },
    { name: 'state', label: 'State' },
    { name: 'address', label: 'Address' },
    { name: 'addressLocality', label: 'Locality / Landmark' },
    ...(type === 'b2b'
      ? [
          { name: 'companyName', label: 'Company Name' },
          { name: 'gstin', label: 'GSTIN (Optional)' },
        ]
      : []),
  ] as const

  const getFieldError = (fieldName: string) => {
    return (errors as FieldErrors<B2CFormData & B2BFormData>)[
      fieldName as keyof (B2CFormData & B2BFormData)
    ]?.message
  }

  return (
    <Grid container spacing={0.65}>
      {fields.map((fieldItem) => {
        const isNonEditable = fieldItem.name === 'city' || fieldItem.name === 'state'
        const showLoader = fieldItem.name === 'pincode' ? pinFetching : false
        const isOptionalField =
          fieldItem.name === 'buyerEmail' ||
          fieldItem.name === 'gstin' ||
          fieldItem.name === 'addressLocality'
        const isAddressField = fieldItem.name === 'address'

        return (
          <Grid
            key={fieldItem.name}
            size={{
              xs: 12,
              sm: isAddressField ? 12 : 6,
              md: isAddressField ? 12 : 4,
              xl: isAddressField ? 4 : 2,
            }}
          >
            <Controller
              name={fieldItem.name as keyof (B2CFormData & B2BFormData)}
              control={control}
              rules={{
                ...(!isOptionalField ? { required: `${fieldItem.label} is required` } : {}),
                ...(fieldItem.name === 'buyerPhone' && {
                  pattern: { value: /^[0-9]{10}$/, message: 'Enter valid 10-digit phone' },
                }),
                ...(fieldItem.name === 'pincode' && {
                  pattern: { value: /^\d{6}$/, message: 'Enter 6-digit pincode' },
                }),
              }}
              render={({ field }) => (
                <CustomInput
                  label={fieldItem.label}
                  required={!isOptionalField}
                  {...field}
                  onChange={(event) => {
                    if (fieldItem.name === 'pincode') {
                      field.onChange(normalizePincode(event.target.value))
                      return
                    }
                    field.onChange(event)
                  }}
                  multiline={isAddressField}
                  rows={isAddressField ? 1 : undefined}
                  maxLength={isAddressField ? 200 : undefined}
                  disabled={isNonEditable}
                  error={!!getFieldError(fieldItem.name)}
                  helperText={getFieldError(fieldItem.name)}
                  postfix={showLoader ? <CircularProgress size={16} /> : null}
                  topMargin={false}
                  dense
                />
              )}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}

export default DeliveryDetailsForm

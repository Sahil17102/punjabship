/* eslint-disable @typescript-eslint/no-explicit-any */
import { Autocomplete, CircularProgress, Grid, TextField } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Controller, type FieldErrors, useFormContext } from 'react-hook-form'
import { lookupPincodeLocation, normalizePincode } from '../../api/locations'
import CustomInput from '../UI/inputs/CustomInput'
import type { B2BFormData } from './b2b/B2BOrderForm'
import type { B2CFormData } from './b2c/B2COrderForm'
import { COUNTRY_OPTIONS } from '../../utils/countries'

type FormType = 'b2b' | 'b2c'

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

  const pincode = String(watch('pincode') || '')
  const countryCode = String(watch('country') || 'IN').trim().toUpperCase()
  const isIndia = countryCode === 'IN'
  const isCanada = countryCode === 'CA'
  const normalizedPincode = isIndia ? normalizePincode(pincode) : pincode.trim().toUpperCase()
  const postalCodePattern = isIndia
    ? { value: /^\d{6}$/, message: 'Enter 6-digit pincode' }
    : isCanada
      ? {
          value: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/,
          message: 'Enter the full Canadian postal code, e.g. A0A 1B0',
        }
      : {
          value: /^[A-Za-z0-9][A-Za-z0-9 -]{2,11}$/,
          message: 'Enter a valid postal code',
        }
  const postalCodeHint = isCanada
    ? 'Use the complete 6-character postal code, e.g. A0A 1B0 (not only A0A)'
    : undefined

  const {
    data: location,
    isFetching: pinFetching,
    isError,
  } = useQuery({
    queryKey: ['pincodeLocation', normalizedPincode],
    queryFn: () => lookupPincodeLocation(normalizedPincode),
    enabled: Boolean(isIndia && /^\d{6}$/.test(normalizedPincode)),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  })

  useEffect(() => {
    if (!isIndia) {
      clearErrors('pincode')
      return
    }

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

    if (location !== undefined) {
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
  }, [location, isError, isIndia, normalizedPincode, setError, clearErrors, setValue, getValues])

  const fields = [
    { name: 'buyerName', label: 'Name' },
    { name: 'buyerPhone', label: 'Phone' },
    { name: 'buyerEmail', label: 'Email' },
    { name: 'country', label: 'Country' },
    { name: 'pincode', label: isIndia ? 'Pincode' : 'Postal / ZIP Code' },
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
        const isNonEditable = isIndia && (fieldItem.name === 'city' || fieldItem.name === 'state')
        const showLoader = fieldItem.name === 'pincode' ? pinFetching : false
        const isOptionalField =
          (fieldItem.name === 'buyerEmail' && type === 'b2b') ||
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
                  pattern: { value: /^\+?[0-9][0-9 -]{7,18}$/, message: 'Enter a valid phone with country code' },
                }),
                ...(fieldItem.name === 'buyerEmail' && {
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                }),
                ...(fieldItem.name === 'pincode' && {
                  pattern: postalCodePattern,
                }),
                ...(fieldItem.name === 'country' && {
                  pattern: { value: /^[A-Za-z]{2}$/, message: 'Use a 2-letter ISO country code' },
                }),
              }}
              render={({ field }) => (
                fieldItem.name === 'country' ? (
                  <Autocomplete
                    options={COUNTRY_OPTIONS}
                    value={COUNTRY_OPTIONS.find((country) => country.code === field.value) || COUNTRY_OPTIONS[0]}
                    onChange={(_event, option) => {
                      const nextCountry = option?.code || 'IN'
                      if (nextCountry !== countryCode) {
                        setValue('pincode', '', { shouldValidate: false })
                        setValue('city', '', { shouldValidate: false })
                        setValue('state', '', { shouldValidate: false })
                      }
                      field.onChange(nextCountry)
                    }}
                    disableClearable
                    autoHighlight
                    getOptionLabel={(option) => `${option.name} (${option.code})`}
                    isOptionEqualToValue={(option, value) => option.code === value.code}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={fieldItem.label}
                        required
                        size="small"
                        error={!!getFieldError(fieldItem.name)}
                        helperText={getFieldError(fieldItem.name) || (isIndia ? 'Domestic India shipment' : 'International destination')}
                      />
                    )}
                  />
                ) : (
                <CustomInput
                  label={fieldItem.label}
                  required={!isOptionalField}
                  {...field}
                  onChange={(event) => {
                    if (fieldItem.name === 'pincode') {
                      if (isIndia) {
                        field.onChange(normalizePincode(event.target.value))
                        return
                      }
                      if (isCanada) {
                        const compact = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
                        field.onChange(compact.length > 3 ? `${compact.slice(0, 3)} ${compact.slice(3)}` : compact)
                        return
                      }
                      field.onChange(event.target.value.toUpperCase().slice(0, 12))
                      return
                    }
                    field.onChange(event)
                  }}
                  multiline={isAddressField}
                  rows={isAddressField ? 1 : undefined}
                  maxLength={isAddressField ? 200 : undefined}
                  disabled={isNonEditable}
                  error={!!getFieldError(fieldItem.name)}
                  helperText={getFieldError(fieldItem.name) || (fieldItem.name === 'pincode' ? postalCodeHint : undefined)}
                  postfix={showLoader ? <CircularProgress size={16} /> : null}
                  topMargin={false}
                  dense
                />
                )
              )}
            />
          </Grid>
        )
      })}
    </Grid>
  )
}

export default DeliveryDetailsForm

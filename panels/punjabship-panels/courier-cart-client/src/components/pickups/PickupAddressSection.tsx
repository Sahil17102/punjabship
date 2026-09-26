/* eslint-disable @typescript-eslint/no-explicit-any */
// PickupAddressSection.tsx
import { Box, Button, CircularProgress, Grid, IconButton, Typography } from '@mui/material'
import axios from 'axios'
import L from 'leaflet'
import { useMemo, useRef, useState } from 'react'
import {
  type Control,
  Controller,
  type Path,
  type UseFormSetValue,
  useWatch,
} from 'react-hook-form'
import { IoChevronBack } from 'react-icons/io5'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { fetchLocations } from '../../api/locations'
import { useDebouncedEffect } from '../../hooks/useDebounceEffect'
import type { PickupFormValues } from '../../types/generic.types'
import AutocompleteDropdown from '../UI/inputs/AutoCompleteDropdown'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'
import PickupAddressMapConfirmModal from './PickupAddressMapConfirmModal'

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

interface IPickupAddressSectionProps {
  control: Control<PickupFormValues>
  setValue: UseFormSetValue<PickupFormValues>
  required: (label: string) => { required: string }
  isEdit: boolean
  prefix: 'pickup' | 'rtoAddress'
}

type LocationSuggestion = {
  key: string
  label: string
  lat: number
  lon: number
  address: Record<string, string>
  source: 'geoapify' | 'nominatim'
  raw?: any
}

type ServiceabilityLocation = {
  pincode?: string
  city?: string
  state?: string
  country?: string
}

const GEOAPIFY_AUTOCOMPLETE_URL = 'https://api.geoapify.com/v1/geocode/autocomplete'
const GEOAPIFY_REVERSE_URL = 'https://api.geoapify.com/v1/geocode/reverse'
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search'
const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse'
const NOMINATIM_EMAIL = 'info@punjabshiplogistics.com'

const mapGeoapifyFeatureToSuggestion = (feature: any): LocationSuggestion | null => {
  const props = feature?.properties
  if (!props?.lat || !props?.lon) return null

  const key =
    props.place_id?.toString() ??
    props.osm_id?.toString() ??
    `${props.lat}-${props.lon}-${props.name || props.address_line1 || ''}`

  const address: Record<string, string> = {
    name: props.address_line1 || props.name || '',
    road: props.street || props.address_line2 || props.name || '',
    city: props.city || props.district || props.county || '',
    state: props.state || '',
    country: props.country || '',
    postcode: props.postcode || '',
  }

  return {
    key,
    label: props.formatted || props.address_line1 || props.name || `${props.lat}, ${props.lon}`,
    lat: typeof props.lat === 'string' ? parseFloat(props.lat) : props.lat,
    lon: typeof props.lon === 'string' ? parseFloat(props.lon) : props.lon,
    address,
    source: 'geoapify',
    raw: feature,
  }
}

const mapNominatimResultToSuggestion = (result: any): LocationSuggestion | null => {
  if (!result) return null
  const lat = parseFloat(result.lat)
  const lon = parseFloat(result.lon)
  if (Number.isNaN(lat) || Number.isNaN(lon)) return null

  const address = result.address ?? {}

  return {
    key: result.place_id?.toString() ?? `${lat}-${lon}-${result.display_name || ''}`,
    label: result.display_name || `${lat}, ${lon}`,
    lat,
    lon,
    address: {
      name: address.road || address.neighbourhood || address.suburb || '',
      road: address.road || '',
      city: address.city || address.town || address.village || address.county || '',
      state: address.state || '',
      country: address.country || '',
      postcode: address.postcode || '',
    },
    source: 'nominatim',
    raw: result,
  }
}

const PickupAddressSection = ({
  control,
  setValue,
  required,
  isEdit = false,
  prefix,
}: IPickupAddressSectionProps) => {
  const [step, setStep] = useState(isEdit ? 2 : 1)
  const [inputValue, setInputValue] = useState('')
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([])
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [selectedPlace, setSelectedPlace] = useState<LocationSuggestion | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [loadingLocation, setLoadingLocation] = useState(false)
  const [confirmingMap, setConfirmingMap] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.209 })
  const [fetchingSuggestions, setFetchingSuggestions] = useState(false)
  const [pincodeLookup, setPincodeLookup] = useState({ loading: false, message: '' })
  const latestPincodeLookupRef = useRef(0)

  const geoapifyKey = useMemo(() => import.meta.env.VITE_PUBLIC_GEOAPIFY_KEY ?? '', [])
  const watchedPincode = useWatch({
    control,
    name: `${prefix}.pincode` as Path<PickupFormValues>,
  })

  const fetchGeoapifySuggestions = async (query: string) => {
    if (!geoapifyKey) return []
    const res = await axios.get(GEOAPIFY_AUTOCOMPLETE_URL, {
      params: {
        text: query,
        limit: 6,
        lang: 'en',
        apiKey: geoapifyKey,
        filter: 'countrycode:in',
      },
    })
    const features: any[] = res.data?.features ?? []
    return features
      .map(mapGeoapifyFeatureToSuggestion)
      .filter((suggestion): suggestion is LocationSuggestion => Boolean(suggestion))
  }

  const fetchNominatimSuggestions = async (query: string) => {
    const res = await axios.get(NOMINATIM_SEARCH_URL, {
      params: {
        q: query,
        format: 'json',
        addressdetails: 1,
        limit: 6,
        countrycodes: 'in',
        email: NOMINATIM_EMAIL,
      },
    })
    return (res.data ?? [])
      .map(mapNominatimResultToSuggestion)
      .filter((suggestion: LocationSuggestion | null): suggestion is LocationSuggestion =>
        Boolean(suggestion),
      )
  }

  const resolveSuggestions = async (query: string) => {
    setFetchingSuggestions(true)
    try {
      try {
        const primary = await fetchGeoapifySuggestions(query)
        if (primary.length > 0) {
          setSuggestions(primary)
          return
        }
      } catch (err) {
        console.warn('Geoapify suggestion lookup failed, falling back to Nominatim', err)
      }

      try {
        const fallback = await fetchNominatimSuggestions(query)
        setSuggestions(fallback)
      } catch (err) {
        console.error('Fallback Nominatim suggestion lookup failed', err)
        setSuggestions([])
      }
    } finally {
      setFetchingSuggestions(false)
    }
  }

  const reverseGeoapify = async (lat: number, lng: number) => {
    if (!geoapifyKey) return null
    const res = await axios.get(GEOAPIFY_REVERSE_URL, {
      params: {
        lat,
        lon: lng,
        apiKey: geoapifyKey,
        lang: 'en',
      },
    })
    const feature = res.data?.features?.[0]
    return feature ? mapGeoapifyFeatureToSuggestion(feature) : null
  }

  const reverseNominatim = async (lat: number, lng: number) => {
    const res = await axios.get(NOMINATIM_REVERSE_URL, {
      params: {
        lat,
        lon: lng,
        format: 'json',
        addressdetails: 1,
        email: NOMINATIM_EMAIL,
      },
    })
    return mapNominatimResultToSuggestion(res.data)
  }

  const resolveReverseGeocode = async (lat: number, lng: number) => {
    try {
      const primary = await reverseGeoapify(lat, lng)
      if (primary) return primary
    } catch (err) {
      console.warn('Geoapify reverse geocode failed, attempting fallback', err)
    }

    try {
      return await reverseNominatim(lat, lng)
    } catch (err) {
      console.error('Nominatim reverse geocode failed', err)
      return null
    }
  }

  // 🔹 Autocomplete using Geoapify (fallback to Nominatim)
  useDebouncedEffect(
    () => {
      if (inputValue.length < 3) {
        setSuggestions([])
        return
      }
      resolveSuggestions(inputValue)
    },
    [inputValue],
    400,
  )

  useDebouncedEffect(
    () => {
      const pincode = String(watchedPincode ?? '').trim()
      if (!/^[1-9][0-9]{5}$/.test(pincode)) {
        latestPincodeLookupRef.current += 1
        setPincodeLookup({ loading: false, message: '' })
        return
      }

      const lookupId = latestPincodeLookupRef.current + 1
      latestPincodeLookupRef.current = lookupId
      setPincodeLookup({ loading: true, message: '' })

      const lookupPincode = async () => {
        try {
          const result = await fetchLocations({ pincode, limit: 5 })
          if (latestPincodeLookupRef.current !== lookupId) return

          const serviceabilityLocations: ServiceabilityLocation[] = Array.isArray(result?.data)
            ? result.data
            : []
          const location =
            serviceabilityLocations.find((item) => String(item.pincode ?? '').trim() === pincode) ??
            serviceabilityLocations[0]

          if (!location?.city || !location?.state) {
            setValue(`${prefix}.city` as Path<PickupFormValues>, '')
            setValue(`${prefix}.state` as Path<PickupFormValues>, '')
            setPincodeLookup({
              loading: false,
              message: 'No city/state found for this pincode',
            })
            return
          }

          setValue(`${prefix}.city` as Path<PickupFormValues>, location.city, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setValue(`${prefix}.state` as Path<PickupFormValues>, location.state, {
            shouldDirty: true,
            shouldValidate: true,
          })
          setValue(`${prefix}.country` as Path<PickupFormValues>, location.country || 'India', {
            shouldDirty: true,
            shouldValidate: true,
          })
          setPincodeLookup({ loading: false, message: '' })
        } catch {
          if (latestPincodeLookupRef.current !== lookupId) return
          setPincodeLookup({
            loading: false,
            message: 'Could not auto-fill city/state. Please enter manually.',
          })
        }
      }

      lookupPincode()
    },
    [watchedPincode, prefix],
    450,
  )

  const applyGeoPropsToForm = (props: any, lat: number, lng: number) => {
    const getSafe = (v?: string) => v ?? ''
    setValue(`${prefix}.latitude` as Path<PickupFormValues>, lat.toFixed(6))
    setValue(`${prefix}.longitude` as Path<PickupFormValues>, lng.toFixed(6))
    setValue(`${prefix}.addressLine1` as Path<PickupFormValues>, getSafe(props.name || props.road))
    setValue(`${prefix}.city` as Path<PickupFormValues>, getSafe(props.city || props.county))
    setValue(`${prefix}.state` as Path<PickupFormValues>, getSafe(props.state))
    setValue(`${prefix}.country` as Path<PickupFormValues>, getSafe(props.country))
    setValue(`${prefix}.pincode` as Path<PickupFormValues>, getSafe(props.postcode))
  }

  // 🔹 Handle selection from autocomplete
  const handlePlaceSelect = (key: string) => {
    const selected = suggestions.find((s) => s.key === key)
    if (!selected) return
    setSelectedPlace(selected)
    setSelectedKey(key)
    setInputValue(selected.label || '')
    const lat = selected.lat
    const lng = selected.lon
    setCoords({ lat, lng })
    applyGeoPropsToForm(selected.address, lat, lng)
  }

  // 🔹 Reverse geocode confirm from map
  const handleMapConfirm = async () => {
    const updatedLat = +coords.lat.toFixed(6)
    const updatedLng = +coords.lng.toFixed(6)
    setConfirmingMap(true)
    try {
      const suggestion = await resolveReverseGeocode(updatedLat, updatedLng)
      if (suggestion) {
        applyGeoPropsToForm(suggestion.address, updatedLat, updatedLng)
        setInputValue(suggestion.label)
        setSelectedPlace(suggestion)
        setSelectedKey(suggestion.key)
      } else {
        // If reverse geocode fails, still proceed with manual entry
        // Just set coordinates and default country
        setValue(`${prefix}.latitude` as Path<PickupFormValues>, updatedLat.toFixed(6))
        setValue(`${prefix}.longitude` as Path<PickupFormValues>, updatedLng.toFixed(6))
        setValue(`${prefix}.country` as Path<PickupFormValues>, 'India')
        setInputValue('')
      }
    } catch {
      // If reverse geocode fails, still proceed with manual entry
      setValue(`${prefix}.latitude` as Path<PickupFormValues>, updatedLat.toFixed(6))
      setValue(`${prefix}.longitude` as Path<PickupFormValues>, updatedLng.toFixed(6))
      setValue(`${prefix}.country` as Path<PickupFormValues>, 'India')
      setInputValue('')
    }
    setConfirmingMap(false)
    setMapOpen(false)
    setStep(2)
  }

  // 🔹 Spot Me (browser geolocation + reverse geocode)
  const handleSpotMe = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported')
      return
    }
    setLoadingLocation(true)
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        setCoords({ lat, lng })
        try {
          const suggestion = await resolveReverseGeocode(lat, lng)
          if (suggestion) {
            applyGeoPropsToForm(suggestion.address, lat, lng)
            setInputValue(suggestion.label)
            setSelectedPlace(suggestion)
            setSelectedKey(suggestion.key)
          } else {
            // If reverse geocode fails, still proceed with manual entry
            setValue(`${prefix}.latitude` as Path<PickupFormValues>, lat.toFixed(6))
            setValue(`${prefix}.longitude` as Path<PickupFormValues>, lng.toFixed(6))
            setValue(`${prefix}.country` as Path<PickupFormValues>, 'India')
            setInputValue('')
            setStep(2)
          }
        } catch {
          // If reverse geocode fails, still proceed with manual entry
          setValue(`${prefix}.latitude` as Path<PickupFormValues>, lat.toFixed(6))
          setValue(`${prefix}.longitude` as Path<PickupFormValues>, lng.toFixed(6))
          setValue(`${prefix}.country` as Path<PickupFormValues>, 'India')
          setInputValue('')
          setStep(2)
        }
        setLoadingLocation(false)
      },
      () => {
        alert('Unable to retrieve your current location.')
        setLoadingLocation(false)
      },
    )
  }

  return (
    <Box>
      {step === 1 && !isEdit && (
        <Grid container spacing={2}>
          <Grid size={12}>
            <AutocompleteDropdown
              label={`Search ${prefix === 'pickup' ? 'Pickup' : 'RTO'} location`}
              required
              inputValue={inputValue}
              value={selectedKey}
              onInputChange={(val) => {
                setInputValue(val)
                setSelectedKey('')
              }}
              options={suggestions.map((s) => ({
                key: s.key,
                label: s.label,
              }))}
              onChange={handlePlaceSelect}
              helperText={
                fetchingSuggestions
                  ? 'Searching...'
                  : suggestions.length === 0 && inputValue.length >= 3
                    ? 'No results found. Try manual entry below.'
                    : 'Enter at least 3 characters'
              }
            />

            <Typography color="info" textAlign={'right'} mt={-2} fontSize={'12px'}>
              * Search by pincode or city for more accurate results
            </Typography>
          </Grid>

          <Grid size={12} display="flex" justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={handleSpotMe}
              disabled={loadingLocation}
              startIcon={loadingLocation ? <CircularProgress size={18} /> : undefined}
            >
              {loadingLocation ? 'Locating...' : '📍 Spot Me'}
            </Button>
            <Button
              variant="text"
              size="small"
              onClick={() => setMapOpen(true)}
              sx={{ textTransform: 'none', fontStyle: 'italic' }}
            >
              📍 Didn't find? Set on the map
            </Button>
          </Grid>

          {suggestions.length === 0 && inputValue.length >= 3 && !fetchingSuggestions && (
            <Grid size={12}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'warning.light',
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'warning.main',
                }}
              >
                <Typography variant="body2" color="warning.dark" gutterBottom>
                  No results found. Please try a different search or enter address manually.
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid size={12} display="flex" justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              color="secondary"
              onClick={() => {
                // Set default coordinates if not set
                if (!coords.lat || !coords.lng) {
                  setCoords({ lat: 28.6139, lng: 77.209 })
                }
                // Set default country to India
                setValue(`${prefix}.country` as Path<PickupFormValues>, 'India')
                setStep(2)
              }}
            >
              ✏️ Enter Manually
            </Button>
            <Button
              variant="contained"
              disabled={!selectedPlace}
              onClick={() => {
                if (selectedPlace) {
                  setMapOpen(true)
                }
              }}
            >
              Continue
            </Button>
          </Grid>

          <PickupAddressMapConfirmModal
            loading={confirmingMap}
            open={mapOpen}
            onClose={() => setMapOpen(false)}
            coords={coords}
            setCoords={setCoords}
            onConfirm={handleMapConfirm}
          />
        </Grid>
      )}

      {step === 2 && (
        <Grid container spacing={2}>
          <Grid size={12}>
            <Box display="flex" alignItems="center" mb={1}>
              {!isEdit && (
                <IconButton onClick={() => setStep(1)} sx={{ mr: 1 }}>
                  <IoChevronBack />
                </IconButton>
              )}
              <Typography variant="h6">
                {prefix === 'pickup' ? 'Pickup' : 'RTO'} Address Details
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ md: 8, xs: 12 }}>
            <Grid container spacing={2}>
              <Grid size={6}>
                <Controller
                  name={`${prefix}.addressNickname` as Path<PickupFormValues>}
                  control={control}
                  rules={required('Address Nickname')}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      placeholder="Enter Address Nickname"
                      label="Address Nickname"
                      required
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid size={6}>
                <Controller
                  name={`${prefix}.contactName` as Path<PickupFormValues>}
                  control={control}
                  rules={required('Contact Name')}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      placeholder="Enter Contact Name"
                      label="Contact Name"
                      required
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid size={6}>
                <Controller
                  name={`${prefix}.contactPhone` as Path<PickupFormValues>}
                  control={control}
                  rules={{
                    ...required('Phone'),
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Phone number must be exactly 10 digits',
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      placeholder="Enter Phone"
                      label="Phone"
                      required
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid size={6}>
                <Controller
                  name={`${prefix}.contactEmail` as Path<PickupFormValues>}
                  control={control}
                  render={({ field, fieldState }) => (
                    <CustomInput
                      placeholder="Enter Email"
                      label="Email"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>

              <Grid size={6}>
                <Controller
                  name={`${prefix}.contactPersonRole` as Path<PickupFormValues>}
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      width="100%"
                      label="Select Role"
                      value={field.value as string}
                      placeholder="Select Role"
                      onSelect={field.onChange}
                      items={[
                        { label: 'Warehouse Manager', key: 'warehouse_manager' },
                        { label: 'Warehouse Assistant', key: 'warehouse_assistant' },
                        { label: 'Warehouse Helper', key: 'warehouse_helper' },
                      ]}
                    />
                  )}
                />
              </Grid>

              {[
                { name: 'addressLine1', label: 'Address Line 1', required: true },
                { name: 'addressLine2', label: 'Address Line 2' },
                { name: 'landmark', label: 'Landmark' },
                { name: 'city', label: 'City', required: true },
                { name: 'state', label: 'State', required: true },
                { name: 'country', label: 'Country', required: true },
                { name: 'pincode', label: 'Pincode', required: true },
                { name: 'gstNumber', label: 'GST Number' },
              ].map(({ name, label, required: isReq }) => {
                const isPincodeField = name === 'pincode'
                const rules =
                  name === 'addressLine1'
                    ? {
                        ...(isReq ? required(label) : {}),
                        validate: (value: unknown) =>
                          typeof value !== 'string' || value.trim().length >= 10
                            ? true
                            : 'Address length cannot be less than 10 characters',
                      }
                    : isPincodeField
                      ? {
                          ...(isReq ? required(label) : {}),
                          pattern: {
                            value: /^[1-9][0-9]{5}$/,
                            message: 'Enter a valid 6-digit pincode',
                          },
                        }
                      : isReq
                        ? required(label)
                        : undefined

                return (
                  <Grid size={6} key={name}>
                    <Controller
                      name={`${prefix}.${name}` as Path<PickupFormValues>}
                      control={control}
                      rules={rules}
                      render={({ field, fieldState }) => (
                        <CustomInput
                          placeholder={`Enter ${label}`}
                          label={label}
                          required={isReq}
                          fullWidth
                          maxLength={
                            isPincodeField ? 6 : name.startsWith('addressLine') ? 200 : undefined
                          }
                          error={!!fieldState.error}
                          helperText={
                            fieldState.error?.message ||
                            (isPincodeField ? pincodeLookup.message : undefined)
                          }
                          postfix={
                            isPincodeField && pincodeLookup.loading ? (
                              <CircularProgress size={16} />
                            ) : null
                          }
                          {...field}
                          value={(field.value as string | undefined) ?? ''}
                          onChange={(event) => {
                            if (isPincodeField) {
                              field.onChange(event.target.value.replace(/\D/g, '').slice(0, 6))
                              return
                            }
                            field.onChange(event)
                          }}
                        />
                      )}
                    />
                  </Grid>
                )
              })}
            </Grid>
          </Grid>

          <Grid size={{ md: 4, xs: 12 }}>
            <Box sx={{ height: 400, borderRadius: 2, overflow: 'hidden', boxShadow: 3 }}>
              <MapContainer
                center={[coords.lat, coords.lng]}
                zoom={16}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coords.lat, coords.lng]} icon={markerIcon} />
              </MapContainer>
            </Box>
          </Grid>
        </Grid>
      )}
    </Box>
  )
}

export default PickupAddressSection

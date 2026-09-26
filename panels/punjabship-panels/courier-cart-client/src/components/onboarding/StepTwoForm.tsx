import {
  Box,
  ButtonBase,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useMemo, useState } from 'react'
import { MdBusiness, MdTrendingUp } from 'react-icons/md'
import type { UserInfoData } from '../../types/user.types'
import type { FormErrors } from '../../pages/onboarding/UserOnboarding'
import { createSyntheticEvent } from '../../utils/functions'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'

interface StepTwoFormProps {
  formData: UserInfoData
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    subKey: keyof UserInfoData,
  ) => void
  errors: FormErrors
}

const BRAND_ORANGE = '#0877C9'
const BRAND_INK = '#141414'

type BusinessOption = {
  key: string
  title: string
  subtitle: string
  values?: string[]
}

const BUSINESS_OPTIONS: BusinessOption[] = [
  {
    key: 'b2b',
    title: 'B2B',
    subtitle: 'I sell to other businesses',
  },
  {
    key: 'b2c',
    title: 'Marketplace B2C',
    subtitle: 'I sell on Amazon, Flipkart, etc.',
  },
  {
    key: 'd2c',
    title: 'D2C',
    subtitle: 'I sell via website, social, or store',
  },
  {
    key: 'b2c_b2b',
    title: 'B2C + B2B',
    subtitle: 'I sell to customers and businesses',
    values: ['b2c', 'b2b'],
  },
]

export default function StepTwoForm({ formData, onChange, errors }: StepTwoFormProps) {
  const [sameAsCompany, setSameAsCompany] = useState(false)

  const selectedCategories = useMemo(
    () =>
      Array.isArray(formData?.businessLegal?.businessCategory)
        ? formData.businessLegal.businessCategory
        : [],
    [formData?.businessLegal?.businessCategory],
  )

  useEffect(() => {
    if (!sameAsCompany) return

    const companyName = formData.basicInfo?.companyName || ''
    onChange(createSyntheticEvent('brandName', companyName), 'businessLegal')
  }, [sameAsCompany, formData.basicInfo?.companyName, onChange])

  const toggleCategory = (value: string, values = [value]) => {
    const isSelected = values.every((item) => selectedCategories.includes(item))
    const next = isSelected
      ? selectedCategories.filter((item) => !values.includes(item))
      : Array.from(new Set([...selectedCategories, ...values]))

    onChange(createSyntheticEvent('businessCategory', next), 'businessLegal')
  }

  return (
    <Stack spacing={{ xs: 2.2, md: 2.8 }}>
      <Typography variant="body2" sx={{ color: '#6E6A66', lineHeight: 1.7 }}>
        Choose your business model and shipping volume so we can configure your account defaults.
      </Typography>

      <Box
        sx={{
          p: { xs: 1.6, md: 2 },
          borderRadius: 4,
          border: '1px solid rgba(20,20,20,0.08)',
          backgroundColor: '#fff',
        }}
      >
        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: BRAND_INK, mb: 1.2 }}>
          Select one or more business types
        </Typography>

        <Grid container spacing={1.3}>
          {BUSINESS_OPTIONS.map((option) => {
            const values = option.values ?? [option.key]
            const active = values.every((value) => selectedCategories.includes(value))

            return (
              <Grid key={option.key} size={{ xs: 12, sm: 6, md: 3 }}>
                <ButtonBase
                  type="button"
                  onClick={() => toggleCategory(option.key, values)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      toggleCategory(option.key, values)
                    }
                  }}
                  sx={{
                    width: '100%',
                    display: 'block',
                    textAlign: 'left',
                    p: 1.5,
                    borderRadius: 2.5,
                    border: `1.5px solid ${active ? BRAND_ORANGE : 'rgba(20,20,20,0.12)'}`,
                    backgroundColor: active ? alpha(BRAND_ORANGE, 0.07) : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    minHeight: 108,
                    position: 'relative',
                    alignItems: 'stretch',
                    justifyContent: 'flex-start',
                    userSelect: 'none',
                    '&:hover': {
                      borderColor: active ? BRAND_ORANGE : alpha(BRAND_ORANGE, 0.34),
                      backgroundColor: active ? alpha(BRAND_ORANGE, 0.08) : '#FCFAF9',
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${alpha(BRAND_ORANGE, 0.35)}`,
                      outlineOffset: 1,
                    },
                  }}
                >
                  <Checkbox
                    checked={active}
                    tabIndex={-1}
                    disableRipple
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleCategory(option.key, values)
                    }}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      p: 0.4,
                      color: alpha(BRAND_INK, 0.36),
                      '&.Mui-checked': {
                        color: BRAND_ORANGE,
                      },
                    }}
                  />

                  <Stack spacing={0.7} pr={4}>
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: active ? BRAND_INK : '#2E2B2A',
                        mb: 0.1,
                        fontSize: '1rem',
                      }}
                    >
                      {option.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#716B68',
                        fontSize: '0.84rem',
                        lineHeight: 1.55,
                      }}
                    >
                      {option.subtitle}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: active ? BRAND_ORANGE : 'rgba(20,20,20,0.45)',
                        pt: 0.45,
                      }}
                    >
                      {active ? 'Selected' : 'Tap to select'}
                    </Typography>
                  </Stack>
                </ButtonBase>
              </Grid>
            )
          })}
        </Grid>

        {errors?.businessLegal?.businessCategory && (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {errors.businessLegal.businessCategory}
          </Typography>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(20,20,20,0.08)' }} />

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: { xs: 1.6, md: 2 },
              borderRadius: 4,
              border: '1px solid rgba(20,20,20,0.08)',
              backgroundColor: '#fff',
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={0.8} alignItems="center" mb={1}>
              <MdBusiness size={18} color={BRAND_ORANGE} />
              <Typography sx={{ fontWeight: 700, color: BRAND_INK }}>Brand Name</Typography>
            </Stack>

            <CustomInput
              label="Brand Name"
              name="brandName"
              required
              value={formData.businessLegal.brandName}
              onChange={(e) => onChange(e, 'businessLegal')}
              error={!!errors.businessLegal?.brandName}
              helperText={errors.businessLegal?.brandName}
              disabled={sameAsCompany}
            />

            <FormControlLabel
              sx={{ mt: 1 }}
              control={
                <Checkbox
                  checked={sameAsCompany}
                  onChange={(e) => setSameAsCompany(e.target.checked)}
                  sx={{
                    color: BRAND_ORANGE,
                    '&.Mui-checked': {
                      color: BRAND_ORANGE,
                    },
                  }}
                />
              }
              label={<Typography variant="body2" sx={{ color: '#6E6A66' }}>Same as company name</Typography>}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box
            sx={{
              p: { xs: 1.6, md: 2 },
              borderRadius: 4,
              border: `1px solid ${alpha(BRAND_ORANGE, 0.16)}`,
              backgroundColor: alpha(BRAND_ORANGE, 0.04),
              height: '100%',
            }}
          >
            <Stack direction="row" spacing={0.8} alignItems="center" mb={1}>
              <MdTrendingUp size={18} color={BRAND_ORANGE} />
              <Typography sx={{ fontWeight: 700, color: BRAND_INK }}>Monthly Shipment Volume</Typography>
            </Stack>

            <CustomSelect
              required
              width="100%"
              label="How many shipments do you process monthly?"
              items={[
                { key: '0-100', label: '0 - 100 shipments' },
                { key: '101-500', label: '101 - 500 shipments' },
                { key: '501-1000', label: '501 - 1000 shipments' },
                { key: '1000+', label: '1000+ shipments' },
              ]}
              value={formData?.businessLegal?.monthlyShipments}
              onSelect={(val) =>
                onChange(
                  {
                    target: {
                      name: 'monthlyShipments',
                      value: val,
                    },
                  } as React.ChangeEvent<HTMLInputElement>,
                  'businessLegal',
                )
              }
            />
          </Box>
        </Grid>
      </Grid>
    </Stack>
  )
}

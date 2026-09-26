import { Box, CardActionArea, CardContent, Grid, Typography } from '@mui/material'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { BusinessStructure, CompanyType } from '../../../../types/generic.types'
import CustomSelect from '../../../UI/inputs/CustomSelect'

export interface BusinessStructureForm {
  structure: BusinessStructure
  companyType?: CompanyType
}

const companyTypeOptions = [
  {
    key: 'private_limited',
    label: 'Private Limited (Pvt Ltd)',
    description: 'Common for startups, brands, and scale-ready businesses.',
  },
  {
    key: 'one_person_company',
    label: 'One Person Company (OPC)',
    description: 'Solo founder with a registered entity and limited liability.',
  },
  {
    key: 'llp',
    label: 'Limited Liability Partnership (LLP)',
    description: 'Used by agencies or B2B sellers with co-founders.',
  },
  {
    key: 'public_limited',
    label: 'Public Limited Company',
    description: 'For large-scale businesses or listed entities.',
  },
  {
    key: 'section_8_company',
    label: 'Section 8 Company / NGO',
    description: 'For non-profits or CSR logistics partners.',
  },
]

const businessOptions: {
  value: BusinessStructure
  title: string
  description: string
}[] = [
  {
    value: 'individual',
    title: 'Individual',
    description: 'Operate as a single person without a registered business.',
  },
  {
    value: 'company',
    title: 'Company',
    description: 'Registered entity like Pvt Ltd, LLP, or OPC.',
  },
  {
    value: 'partnership_firm',
    title: 'Partnership Firm',
    description: 'Two or more partners registered as a partnership.',
  },
  {
    value: 'sole_proprietor',
    title: 'Sole Proprietor',
    description: 'Single owner with a registered business name.',
  },
]

interface Props {
  defaultValue?: BusinessStructureForm
  onChange: (value: BusinessStructure | CompanyType, key: string) => void
  value?: BusinessStructureForm
}

export const BusinessStructureStep: React.FC<Props> = ({ defaultValue, onChange, value }) => {
  const { control, setValue, watch } = useForm<BusinessStructureForm>({
    defaultValues: {
      structure: defaultValue?.structure ?? 'individual',
      ...(defaultValue?.companyType && {
        companyType: defaultValue.companyType,
      }),
    },
    mode: 'onChange',
  })

  // sync watch with external value (for controlled component)
  React.useEffect(() => {
    if (value) {
      setValue('structure', value?.structure)
      setValue('companyType', value?.companyType)
    }
  }, [value])

  const selectedStructure = watch('structure')
  const selectedCompanyType = watch('companyType')

  React.useEffect(() => {
    if (selectedStructure) onChange(selectedStructure, 'structure')
  }, [selectedStructure])

  React.useEffect(() => {
    if (selectedCompanyType) onChange(selectedCompanyType, 'companyType')
  }, [selectedCompanyType])

  const companyTypeRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll if structure is 'company' but no companyType selected
  React.useEffect(() => {
    if (selectedStructure === 'company' && !selectedCompanyType) {
      const timeout = setTimeout(() => {
        companyTypeRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)

      return () => clearTimeout(timeout)
    }
  }, [selectedStructure, selectedCompanyType])

  return (
    <Box>
      <Typography variant="h6" mb={3} fontWeight={700} color="#0877C9">
        Select your business structure
      </Typography>

      <Controller
        control={control}
        name="structure"
        render={() => (
          <Grid container spacing={2}>
            {businessOptions.map((option) => (
              <Grid key={option.value} size={{ xs: 12, sm: 6, md: 6 }}>
                <CardActionArea
                  sx={{
                    border:
                      selectedStructure === option.value
                        ? '2px solid #0877C9'
                        : '1px solid #E0E6ED',
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    bgcolor:
                      selectedStructure === option.value ? 'rgba(51, 51, 105, 0.05)' : '#FFFFFF',
                    minHeight: 110,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(51, 51, 105, 0.12)',
                      borderColor: '#0877C9',
                    },
                  }}
                  onClick={() => setValue('structure', option.value)}
                >
                  <CardContent>
                    <Typography
                      minHeight={34}
                      variant="subtitle1"
                      fontWeight={700}
                      color={selectedStructure === option.value ? '#0877C9' : '#1A1A1A'}
                    >
                      {option.title}
                    </Typography>
                    <Typography fontSize={13} color="#4A5568" fontWeight={500}>
                      {option.description}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Grid>
            ))}
          </Grid>
        )}
      />

      {selectedStructure === 'company' && (
        <Box mt={3} ref={companyTypeRef}>
          <Controller
            control={control}
            rules={{
              required: 'Please select a company type',
            }}
            name="companyType"
            render={({ field }) => (
              <Box>
                <CustomSelect
                  placeholder="Select Company Type"
                  width={'70%'}
                  label="Type of Company"
                  items={companyTypeOptions}
                  value={field.value}
                  onSelect={field.onChange}
                  required
                />
              </Box>
            )}
          />
        </Box>
      )}
    </Box>
  )
}

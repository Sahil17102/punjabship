import { Box, Button, Container, Grid, Paper, Step, StepLabel, Stepper } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useRef, useState } from 'react'
import { IoChevronBack, IoChevronForward } from 'react-icons/io5'
import { useSubmitKyc } from '../../../../hooks/User/Kyc/UseKyc'
import type { BusinessStructure, CompanyType } from '../../../../types/generic.types'
import type { KycDetails } from '../../../../types/user.types'
import { toast } from '../../../UI/Toast'
import { isEmbeddedShopifyContext } from '../../../../utils/shopifyEmbedded'
import AdditionalDetailsStep, { type AdditionalKYCForm } from './AdditionalInfoStep'
import { BusinessStructureStep } from './BusinessStructureStep'

const steps = ['Business Structure', 'Additional Details']

const KYCVerificationStep: React.FC<{
  editing?: boolean
  onCancelEdit?: () => void
  onComplete?: () => void
  existingKyc?: KycDetails | null
}> = ({ editing = false, onCancelEdit, onComplete, existingKyc = null }) => {
  const queryClient = useQueryClient()
  const { mutateAsync, isPending } = useSubmitKyc()

  const [activeStep, setActiveStep] = useState(0)
  const [kycData, setKycData] = useState<Partial<KycDetails>>({})
  const kycDataRef = useRef<Partial<KycDetails>>({})
  const [isStepValid, setIsStepValid] = useState(false)

  const updateKycData = (newData: Partial<KycDetails>) => {
    setKycData((prev) => {
      const updated = { ...prev, ...newData }
      kycDataRef.current = updated
      return updated
    })
  }

  // Prefill when editing mode is on
  useEffect(() => {
    if (editing && existingKyc) {
      const initial = { ...existingKyc }
      setKycData(initial)
      kycDataRef.current = initial
      if (existingKyc.structure) setIsStepValid(true)
    }
  }, [editing, existingKyc])

  const handleBusinessStructureChange = (value: BusinessStructure | CompanyType, key: string) => {
    updateKycData({
      ...(key === 'structure' ? { structure: value as BusinessStructure } : {}),
      ...(key === 'companyType' ? { companyType: value as CompanyType } : {}),
    })
    setIsStepValid(true)
  }

  const handleAdditionalInfoChange = async (value: AdditionalKYCForm) => {
    return new Promise<void>((resolve) => {
      updateKycData(value)
      setIsStepValid(true)
      resolve()
    })
  }

  const submitKycDetails = async (data: Partial<KycDetails>) => {
    try {
      toast.open({ message: 'Submitting KYC details...', severity: 'info' })

      const result = await mutateAsync({
        details: data,
      })

      toast.open({
        message: result?.message ?? 'KYC details submitted successfully!',
        severity: 'success',
      })

      // Refresh both the dedicated KYC query and the overall user profile
      // so that status and details are up to date when the user revisits the KYC page.
      queryClient.invalidateQueries({ queryKey: ['userKyc'] })
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })

      if (onComplete) {
        // After a successful submission (new or edit), let the parent decide what to show next.
        onComplete()
      } else {
        setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.message ?? err?.message ?? 'Failed to submit KYC details',
        severity: 'error',
      })

      setIsStepValid(false)
    }
  }

  const handleFinalSubmit = async (data: AdditionalKYCForm) => {
    await handleAdditionalInfoChange(data)
    await submitKycDetails({ ...kycDataRef.current, ...data })
  }

  const handleNext = async () => {
    const data = kycDataRef.current

    if (
      activeStep === 0 &&
      (!data.structure || (data?.structure === 'company' && !data?.companyType))
    ) {
      return
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0))
    setIsStepValid(true)
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <BusinessStructureStep
            defaultValue={{
              structure: kycData.structure ?? 'individual',
              companyType: kycData.companyType ?? undefined,
            }}
            value={{
              structure: kycData.structure ?? 'individual',
              companyType: kycData.companyType ?? undefined,
            }}
            onChange={handleBusinessStructureChange}
          />
        )
      default:
        return (
          <AdditionalDetailsStep
            structure={kycData?.structure}
            companyType={kycData?.companyType}
            defaultValue={kycData}
            onComplete={(data) => handleFinalSubmit(data ?? {})}
            submitting={isPending && isEmbeddedShopifyContext()}
          />
        )
    }
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 0, px: { xs: 0, md: 0 } }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 9 }} order={{ md: 1, xs: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 0,
              bgcolor: '#FFFFFF',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              boxShadow: 'none',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: '#B8D719',
              },
            }}
          >
            <Box display="flex" mb={3} justifyContent="space-between" alignItems="center">
              <Button
                variant="outlined"
                onClick={handleBack}
                startIcon={<IoChevronBack />}
                disabled={activeStep === 0}
                sx={{
                  borderColor: 'rgba(15, 23, 42, 0.12)',
                  color: '#111827',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#F8FAFC',
                    borderColor: 'rgba(15, 23, 42, 0.18)',
                  },
                }}
              >
                Back
              </Button>

              <Box display="flex" gap={2}>
                {editing && (
                  <Button
                    variant="outlined"
                    onClick={onCancelEdit}
                    sx={{
                      borderColor: 'rgba(15, 23, 42, 0.12)',
                      color: '#E74C3C',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: 'rgba(231, 76, 60, 0.1)',
                        borderColor: '#E74C3C',
                      },
                    }}
                  >
                    Cancel Editing
                  </Button>
                )}

                {activeStep !== steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={!isStepValid || isPending}
                    endIcon={<IoChevronForward />}
                    sx={{
                      fontWeight: 600,
                      backgroundColor: '#16181D',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: '#111827',
                      },
                    }}
                  >
                    {'Next'}
                  </Button>
                ) : null}
              </Box>
            </Box>
            {renderStepContent()}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }} order={{ md: 2, xs: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, md: 3 },
              borderRadius: 0,
              bgcolor: '#FFFFFF',
              border: '1px solid rgba(15, 23, 42, 0.08)',
              boxShadow: 'none',
              position: 'sticky',
              top: 24,
            }}
          >
            <Stepper
              activeStep={activeStep}
              orientation="vertical"
              sx={{
                '& .MuiStepLabel-label': {
                  color: '#4A5568',
                  fontWeight: 500,
                  '&.Mui-active': {
                    color: '#111827',
                    fontWeight: 700,
                  },
                  '&.Mui-completed': {
                    color: '#111827',
                    fontWeight: 600,
                  },
                },
                '& .MuiStepIcon-root': {
                  color: '#E0E6ED',
                  '&.Mui-active': {
                    color: '#B8D719',
                  },
                  '&.Mui-completed': {
                    color: '#16181D',
                  },
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}

export default KYCVerificationStep

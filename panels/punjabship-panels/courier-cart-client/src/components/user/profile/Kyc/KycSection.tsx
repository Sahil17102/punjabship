import { alpha, Box, Skeleton, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useUserKyc } from '../../../../hooks/User/Kyc/UseKyc'
import { useUserProfile } from '../../../../hooks/User/useUserProfile'
import KycDetailsCard from './KycDetailsCard'
import KYCVerificationStep from './KycVerificationSection'
import { isEmbeddedShopifyContext } from '../../../../utils/shopifyEmbedded'

const KycSection = () => {
  // Always fetch the authenticated user's profile inside protected routes
  const { isLoading } = useUserProfile(true)
  const [editingKyc, setEditingKyc] = useState(false)
  const { data: kycData, isLoading: loadingKyc } = useUserKyc()

  const hasKycDetails = !!kycData?.kyc && Object.keys(kycData.kyc).length > 0

  // Once KYC is submitted, always show the details card (even if status is "pending"),
  // and only show the multi-step form when there are no details yet or when explicitly editing.
  const showDetailsCard = hasKycDetails && !editingKyc

  if (isLoading || (isEmbeddedShopifyContext() && loadingKyc)) {
    return (
      <Box display="flex" justifyContent="center" width="100%">
        <Skeleton
          width="100%"
          height={300}
          variant="rectangular"
          sx={{
            borderRadius: 3,
            bgcolor: '#F5F7FA',
            '&::after': {
              background:
                'linear-gradient(90deg, transparent, rgba(51, 51, 105, 0.08), transparent)',
            },
          }}
        />
      </Box>
    )
  }

  return (
    <Stack spacing={2.25} width="100%">
      <Box
        sx={{
          p: 2,
          border: `1px solid ${alpha('#0877C9', 0.12)}`,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,245,242,0.98) 100%)',
        }}
      >
        <Typography sx={{ fontSize: '0.72rem', letterSpacing: '0.16em', fontWeight: 800, color: '#B8D719', textTransform: 'uppercase' }}>
          Compliance review
        </Typography>
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
          KYC verification and document readiness
        </Typography>
        <Typography sx={{ fontSize: '0.92rem', color: '#4B5563', mt: 0.35 }}>
          Submit, review, and maintain verification documents required for payouts and account access.
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" width="100%">
        {showDetailsCard ? (
          <KycDetailsCard
            kyc={kycData?.kyc ?? {}}
            isLoading={loadingKyc}
            onEdit={() => setEditingKyc(true)}
          />
        ) : (
          <KYCVerificationStep
            existingKyc={kycData?.kyc ?? {}}
            editing={editingKyc}
            onCancelEdit={() => setEditingKyc(false)}
            onComplete={() => setEditingKyc(false)}
          />
        )}
      </Box>
    </Stack>
  )
}

export default KycSection

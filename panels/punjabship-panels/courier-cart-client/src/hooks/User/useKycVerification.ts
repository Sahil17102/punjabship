import { useAuth } from '../../context/auth/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from '../../components/UI/Toast'

/**
 * Hook to check KYC verification status and provide helper functions
 * @returns Object with KYC verification status and helper functions
 */
export const useKycVerification = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const kycStatus = user?.domesticKyc?.status
  const isKycVerified = kycStatus === 'verified'
  const isKycBlocked = !isKycVerified

  const getKycErrorMessage = (): string => {
    if (!user?.domesticKyc) {
      return 'KYC verification is required. Please complete your KYC verification before creating orders.'
    }

    switch (kycStatus) {
      case 'pending':
        return 'KYC verification is pending. Please complete your KYC verification before creating orders.'
      case 'verification_in_progress':
        return 'KYC verification is in progress. Please wait for approval before creating orders.'
      case 'rejected':
        return 'KYC verification was rejected. Please update your KYC documents and resubmit for verification.'
      default:
        return 'KYC verification is required to create orders.'
    }
  }

  const handleKycBlocked = (showToast = true) => {
    if (showToast) {
      toast.open({
        message: getKycErrorMessage(),
        severity: 'error',
      })
    }
    navigate('/profile/kyc_details')
  }

  const checkKycBeforeAction = (action: () => void, showToast = true): void => {
    if (isKycBlocked) {
      handleKycBlocked(showToast)
      return
    }
    action()
  }

  return {
    kycStatus,
    isKycVerified,
    isKycBlocked,
    getKycErrorMessage,
    handleKycBlocked,
    checkKycBeforeAction,
  }
}


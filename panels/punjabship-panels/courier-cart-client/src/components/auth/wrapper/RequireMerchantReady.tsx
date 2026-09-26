import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useMerchantReadiness } from '../../../hooks/useMerchantReadiness'
import { useAuth } from '../../../context/auth/AuthContext'
import { isSellerEmployeeAccount } from '../../../utils/sellerEmployee'
import FullScreenLoader from '../../UI/loader/FullScreenLoader'

export default function RequireMerchantReady({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { isReady, isLoading } = useMerchantReadiness()
  const location = useLocation()

  if (isLoading) return <FullScreenLoader />

  if (isReady || isSellerEmployeeAccount(user)) {
    return <>{children}</>
  }

  return <Navigate to="/account-readiness" replace state={{ from: location }} />
}

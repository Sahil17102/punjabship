import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMerchantReadiness } from '../api/merchantReadiness.api'
import { useAuth } from '../context/auth/AuthContext'
import { isSellerEmployeeAccount } from '../utils/sellerEmployee'

export const useMerchantReadiness = () => {
  const { user, loading: authLoading } = useAuth()
  const isEmployee = isSellerEmployeeAccount(user)
  const readinessQuery = useQuery({
    queryKey: ['merchantReadiness', user?.merchantUserId || user?.userId],
    queryFn: fetchMerchantReadiness,
    enabled: Boolean(user?.id) && !isEmployee,
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 2,
  })
  const readiness = readinessQuery.data
  const walletBalance = Number(readiness?.walletBalance || 0)
  const requiredWalletBalance = Number(readiness?.requiredWalletBalance || 1)
  const assignedPlanName = readiness?.assignedPlanName || null
  const assignedPlanId = readiness?.assignedPlanId || null
  const hasAssignedPlan = Boolean(readiness?.hasAssignedPlan)

  const checklist = useMemo(
    () =>
      isEmployee
        ? []
        : [
      {
        key: 'onboarding',
        title: 'Onboarding Complete',
        description: 'Finish onboarding questions and activate the merchant workspace.',
        done: Boolean(readiness?.onboardingComplete),
        path: '/onboarding-questions',
        actionLabel: 'Complete Onboarding',
      },
      {
        key: 'company',
        title: 'Company Info Added',
        description: 'Add business identity, address, and primary company contacts.',
        done: Boolean(readiness?.hasCompanyInfo),
        path: '/profile/company',
        actionLabel: 'Add Company Info',
      },
      {
        key: 'approval',
        title: 'Account Approved',
        description: 'Wait for internal review to approve your merchant account.',
        done: Boolean(readiness?.approved),
        path: '/support/tickets',
        actionLabel: 'Contact Support',
      },
      {
        key: 'kyc',
        title: 'KYC Verified',
        description: 'KYC must be verified before order creation is enabled.',
        done: Boolean(readiness?.kycVerified),
        path: '/profile/kyc_details',
        actionLabel: 'Complete KYC',
      },
      {
        key: 'plan',
        title: 'Shipping Plan Assigned',
        description: 'A rate plan must be assigned before shipment pricing and booking are enabled.',
        done: hasAssignedPlan,
        path: '/support/tickets',
        actionLabel: 'Contact Support',
      },
      {
        key: 'pickup',
        title: 'Pickup Address Added',
        description: 'Add at least one pickup location for shipment origin.',
        done: Boolean(readiness?.hasPickupAddress),
        path: '/settings/manage_pickups',
        actionLabel: 'Add Pickup Address',
      },
      {
        key: 'wallet',
        title: 'Wallet Ready',
        description: `Keep at least Rs ${requiredWalletBalance.toLocaleString('en-IN')} available for first-order charges.`,
        done: walletBalance >= requiredWalletBalance,
        path: '/billing/wallet_transactions',
        actionLabel: 'Add Wallet Balance',
      },
    ],
    [
      hasAssignedPlan,
      isEmployee,
      readiness,
      requiredWalletBalance,
      walletBalance,
    ],
  )

  const completedCount = checklist.filter((item) => item.done).length
  const totalCount = checklist.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isReady = isEmployee || Boolean(readiness?.isReady)
  const firstIncompleteStep = checklist.find((item) => !item.done) || null

  return {
    checklist,
    completedCount,
    totalCount,
    progress,
    isReady,
    firstIncompleteStep,
    walletBalance,
    requiredWalletBalance,
    assignedPlanName,
    assignedPlanId,
    hasAssignedPlan,
    isLoading: authLoading || (!isEmployee && readinessQuery.isLoading),
  }
}

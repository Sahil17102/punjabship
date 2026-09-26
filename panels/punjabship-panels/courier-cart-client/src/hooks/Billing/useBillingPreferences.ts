import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getBillingPreference, updateBillingPreference } from '../../api/billingPreferences.api'
import type { BillingPreference, UpdateBillingPreferencePayload } from '../../types/billing.types'

// Query key generator
const billingPreferenceKey = () => ['billing-preference']

/**
 * Fetch Billing Preference Hook
 */
export const useBillingPreference = () => {
  return useQuery<BillingPreference>({
    queryKey: billingPreferenceKey(),
    queryFn: () => getBillingPreference(),
    refetchOnWindowFocus: false,
  })
}

/**
 * Update Billing Preference Hook
 */
export const useUpdateBillingPreference = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateBillingPreferencePayload) => updateBillingPreference(payload),

    onSuccess: () => {
      // Invalidate and refetch updated data
      queryClient.invalidateQueries({
        queryKey: billingPreferenceKey(),
      })
    },
  })
}

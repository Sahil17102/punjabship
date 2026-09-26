// hooks/useLabelPreferences.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { labelPreferencesApi, type LabelPreferences } from '../api/labelPreference.api'
import { toast } from '../components/UI/Toast'

export function useLabelPreferences() {
  const queryClient = useQueryClient()

  // Fetch preferences
  const { data, isLoading, isError } = useQuery<LabelPreferences>({
    queryKey: ['labelPreferences'],
    queryFn: () => labelPreferencesApi.get(),
  })

  // Save/update preferences
  const mutation = useMutation({
    mutationFn: (prefs: Partial<LabelPreferences>) => labelPreferencesApi.save(prefs),
    onSuccess: () => {
      toast.open({ message: 'Label Preferences updated successfully!', severity: 'success' })
      // Invalidate & refetch
      queryClient.invalidateQueries({ queryKey: ['labelPreferences'] })
    },
  })

  return {
    preferences: data,
    isLoading,
    isError,
    savePreferences: mutation.mutate,
    saving: mutation.isPending,
  }
}

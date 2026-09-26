import { useQuery } from '@tanstack/react-query'
import { fetchUserProfile } from '../../api/userProfile.api'

/**
 * Centralised hook for loading the currently‑logged in user's profile.
 *
 * We make this **lazy and cache‑friendly** so that the profile is fetched once
 * per session and then reused from React Query cache, instead of refetching on
 * every mount/focus which can look like "continuous user API calls".
 *
 * - `enabled`: only run when we know the user is authenticated.
 * - `staleTime`: keep data fresh for 5 minutes.
 * - `refetchOnWindowFocus`/`refetchOnReconnect`/`refetchOnMount`: disabled to
 *    avoid surprise refetches; call `refetchUser()` from `AuthContext` when
 *    you explicitly need to refresh.
 */
export const useUserProfile = (authenticated?: boolean) =>
  useQuery({
    queryKey: ['userProfile'],
    queryFn: fetchUserProfile,
    enabled: !!authenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    // Avoid aggressive retries that can look like an "infinite" loop
    // when the profile endpoint is failing (e.g. 5xx).
    retry: false,
  })

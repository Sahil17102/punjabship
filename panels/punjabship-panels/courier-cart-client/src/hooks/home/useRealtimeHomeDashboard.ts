import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import {
  getIncomingPickups,
  getCourierDistribution,
  getTopDestinations,
  type Pickup,
  type TopDestination,
  type CourierDistribution,
} from '../../api/dashboard.api'

type DashboardKey = 'pickups' | 'distribution' | 'destinations'

interface DataState<T> {
  data: T
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

const pollingIntervals: Record<DashboardKey, number> = {
  pickups: 30_000,
  distribution: 60_000,
  destinations: 60_000,
}

const shouldShowLoading = (currentData: unknown) => {
  if (Array.isArray(currentData)) {
    return currentData.length === 0
  }
  return currentData === null || currentData === undefined
}

type PollConfig<T> = {
  setter: Dispatch<SetStateAction<DataState<T>>>
  fetcher: (signal: AbortSignal) => Promise<T>
}

export const useRealtimeHomeDashboard = () => {
  const [pickupsState, setPickupsState] = useState<DataState<Pickup[]>>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  })
  const [distributionState, setDistributionState] = useState<DataState<CourierDistribution[]>>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  })
  const [destinationsState, setDestinationsState] = useState<DataState<TopDestination[]>>({
    data: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  })

  const isMountedRef = useRef(true)
  const isTabActiveRef = useRef(true)
  const pollTimersRef = useRef<Record<DashboardKey, number | null>>({
    pickups: null,
    distribution: null,
    destinations: null,
  })
  const staggeredTimersRef = useRef<number[]>([])
  const controllersRef = useRef<Record<DashboardKey, AbortController | null>>({
    pickups: null,
    distribution: null,
    destinations: null,
  })
  const isFetchingRef = useRef<Record<DashboardKey, boolean>>({
    pickups: false,
    distribution: false,
    destinations: false,
  })

  const fetchMap = useMemo<Record<DashboardKey, PollConfig<any>>>(() => {
    return {
      pickups: {
        setter: setPickupsState,
        fetcher: (signal: AbortSignal) => getIncomingPickups({ signal }),
      },
      distribution: {
        setter: setDistributionState,
        fetcher: (signal: AbortSignal) => getCourierDistribution({ signal }),
      },
      destinations: {
        setter: setDestinationsState,
        fetcher: (signal: AbortSignal) => getTopDestinations(8, { signal }),
      },
    }
  }, [setPickupsState, setDistributionState, setDestinationsState])

  const runFetch = useCallback(
    async (key: DashboardKey) => {
      if (isFetchingRef.current[key]) return
      isFetchingRef.current[key] = true
      const controller = new AbortController()
      controllersRef.current[key]?.abort()
      controllersRef.current[key] = controller

      const { setter, fetcher } = fetchMap[key]
      setter((prev) => ({
        ...prev,
        isLoading: shouldShowLoading(prev.data),
      }))

      const timeoutId = setTimeout(() => {
        if (isFetchingRef.current[key]) {
          controller.abort()
        }
      }, 15000)

      try {
        const payload = await fetcher(controller.signal)
        if (!isMountedRef.current) return
        clearTimeout(timeoutId)
        setter({
          data: payload,
          isLoading: false,
          error: null,
          lastUpdated: Date.now(),
        })
      } catch (err) {
        if (!isMountedRef.current) return
        clearTimeout(timeoutId)
        const message =
          err instanceof Error
            ? err.message
            : `Unable to refresh ${key}`
        setter((prev) => ({
          ...prev,
          isLoading: false,
          error: message,
        }))
      } finally {
        isFetchingRef.current[key] = false
      }
    },
    [fetchMap],
  )

  const clearStaggeredTimers = useCallback(() => {
    staggeredTimersRef.current.forEach((timer) => clearTimeout(timer))
    staggeredTimersRef.current = []
  }, [])

  const scheduleInitialLoad = useCallback(() => {
    clearStaggeredTimers()
    const schedule = (key: DashboardKey, delay: number) => {
      if (typeof window !== 'undefined') {
        const timer = window.setTimeout(() => runFetch(key), delay)
        staggeredTimersRef.current.push(timer)
      } else {
        runFetch(key)
      }
    }

    schedule('pickups', 0)
    schedule('distribution', 180)
    schedule('destinations', 360)
  }, [clearStaggeredTimers, runFetch])

  const stopPolling = useCallback(() => {
    Object.keys(pollTimersRef.current).forEach((key) => {
      const typedKey = key as DashboardKey
      const timer = pollTimersRef.current[typedKey]
      if (timer) {
        clearInterval(timer)
        pollTimersRef.current[typedKey] = null
      }
    })
  }, [])

  const startPolling = useCallback(() => {
    if (!isTabActiveRef.current || typeof window === 'undefined') return
    stopPolling()
    Object.entries(pollingIntervals).forEach(([key, interval]) => {
      const typedKey = key as DashboardKey
      pollTimersRef.current[typedKey] = window.setInterval(() => {
        if (!isTabActiveRef.current) return
        runFetch(typedKey)
      }, interval)
    })
  }, [runFetch, stopPolling])

  const abortAll = useCallback(() => {
    Object.values(controllersRef.current).forEach((controller) => controller?.abort())
  }, [])

  const handleVisibilityChange = useCallback(() => {
    const visible = typeof document !== 'undefined'
      ? document.visibilityState === 'visible'
      : true
    isTabActiveRef.current = visible
    if (visible) {
      scheduleInitialLoad()
      startPolling()
    } else {
      stopPolling()
    }
  }, [scheduleInitialLoad, startPolling, stopPolling])

  useEffect(() => {
    scheduleInitialLoad()
    startPolling()
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }

    return () => {
      isMountedRef.current = false
      stopPolling()
      abortAll()
      clearStaggeredTimers()
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [
    scheduleInitialLoad,
    startPolling,
    handleVisibilityChange,
    stopPolling,
    abortAll,
    clearStaggeredTimers,
  ])

  return {
    incomingPickupsState: pickupsState,
    courierDistributionState: distributionState,
    topDestinationsState: destinationsState,
    refreshHomeData: () => {
      runFetch('pickups')
      runFetch('distribution')
      runFetch('destinations')
    },
  }
}

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import FullScreenLoader from './FullScreenLoader'

const MIN_DISPLAY_TIME = 700 // 2 seconds

/**
 * NavigationLoader - Shows the loader for at least 2 seconds on every route change
 */
export default function NavigationLoader() {
  const location = useLocation()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Show loader immediately on route change
    setIsLoading(true)

    // Hide loader after minimum display time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, MIN_DISPLAY_TIME)

    return () => {
      clearTimeout(timer)
    }
  }, [location.pathname]) // Trigger on route change

  if (!isLoading) return null

  return <FullScreenLoader />
}

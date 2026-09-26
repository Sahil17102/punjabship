import { type ComponentType, lazy } from 'react'

/**
 * Creates a lazy-loaded component with a minimum loading time.
 * This ensures the loading screen displays for at least the specified duration,
 * providing a better UX by preventing flashing loaders.
 *
 * @param importFunc - Dynamic import function returning the component
 * @param minLoadTimeMs - Minimum time in milliseconds to show the loader (default: 2000ms)
 * @returns Lazy component with minimum load time
 */
export function lazyWithMinLoadTime<T extends ComponentType<unknown>>(
  importFunc: () => Promise<{ default: T }>,
  minLoadTimeMs: number = 2000,
) {
  return lazy(() => {
    // Create a promise that resolves after the minimum time
    const delayPromise = new Promise<void>((resolve) => setTimeout(resolve, minLoadTimeMs))

    // Wait for both the component to load AND the minimum time to pass
    return Promise.all([importFunc(), delayPromise]).then(([moduleExports]) => moduleExports)
  })
}

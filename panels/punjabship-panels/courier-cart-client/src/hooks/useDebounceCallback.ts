import { useRef, useCallback } from "react";

/**
 * Returns a stable debounced version of `fn`.
 *
 * @param fn        The callback to debounce.
 * @param delayMs   Milliseconds to wait after the last call.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  fn: T,
  delayMs = 500
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null); // ✅ Provide initial value

  return useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ((...args: any[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delayMs);
    }) as T,
    [fn, delayMs]
  );
}

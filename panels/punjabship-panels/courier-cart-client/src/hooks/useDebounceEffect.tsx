import { useEffect } from "react";

export function useDebouncedEffect(
  effect: () => void,
  deps: unknown[],
  delay: number
) {
  useEffect(() => {
    const handler = setTimeout(() => effect(), delay);

    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, delay]);
}

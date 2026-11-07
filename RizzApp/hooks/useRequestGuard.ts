import { useCallback, useEffect, useRef } from 'react';

/** Ignore responses from a previous route, refresh, or unmounted screen. */
export function useRequestGuard() {
  const revision = useRef(0);
  const cancel = useCallback(() => { revision.current++; }, []);
  useEffect(() => cancel, [cancel]);
  const start = useCallback(() => {
    const request = ++revision.current;
    return () => request === revision.current;
  }, []);
  return { start, cancel };
}

'use client';
import { useEffect, useState } from 'react';

// ─── useOnline ────────────────────────────────────────────────────────────────
// Whether the browser thinks it has a connection. `navigator.onLine` is
// optimistic (it is true on a dead Wi-Fi), so callers treat a failed save as
// offline too; this hook covers the clear cases — airplane mode, a dropped
// mobile connection — which are the common ones in Sudan.
export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

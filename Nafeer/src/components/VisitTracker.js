'use client';
import { useEffect } from 'react';

// Fires a single visit ping on mount — silent, no UI
export default function VisitTracker() {
  useEffect(() => {
    fetch('/api/analytics/visit', { method: 'POST' }).catch(() => {});
  }, []);

  return null;
}

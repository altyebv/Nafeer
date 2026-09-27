'use client';
import { useEffect } from 'react';
import { useThemeStore } from '@/store/themeStore';

/**
 * Reconciles the theme store with the attribute the pre-paint script in
 * layout.jsx already wrote to <html>. Mounted once at the root; renders
 * nothing. Keeping this out of render means no component reads localStorage
 * during hydration, which is what used to cause the data-theme mismatch.
 */
export default function ThemeSync() {
  const syncTheme = useThemeStore((s) => s.syncTheme);
  useEffect(() => { syncTheme(); }, [syncTheme]);
  return null;
}

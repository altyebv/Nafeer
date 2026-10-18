'use client';
import { Check, Loader2, AlertTriangle, CircleDot, CloudOff } from 'lucide-react';
import { formatDate, changesLabel } from '@/lib/format';
import { cx } from './cx';

// ─── SaveStatus ───────────────────────────────────────────────────────────────
// A compact pill for the page header. Replaces the full-width green "محفوظ"
// bar that took a whole strip above every editor page.
//
// state   saved · saving · dirty · offline · error · idle (renders nothing)
//         offline: no connection — edits are kept on this device and go up
//         when it returns
// It is a polite live region, so a screen reader hears "جارٍ الحفظ…" and then
// "محفوظ" without the user moving focus.

const LOOK = {
  saved:  { icon: Check,         cls: 'bg-success-surface text-success' },
  saving: { icon: Loader2,       cls: 'bg-warn-surface text-warn', spin: true },
  dirty:  { icon: CircleDot,     cls: 'bg-accent-wash text-fg-accent' },
  error:  { icon: AlertTriangle, cls: 'bg-danger-surface text-danger' },
  offline:{ icon: CloudOff,      cls: 'bg-info-surface text-info' },
};

export function SaveStatus({ state = 'idle', savedAt, dirtyCount = 0, onRetry, detail, className }) {
  if (state === 'idle' || !LOOK[state]) return <span role="status" aria-live="polite" className="sr-only" />;
  const { icon: Icon, cls, spin } = LOOK[state];

  const text =
    state === 'saved'  ? (savedAt ? `محفوظ · ${formatDate(savedAt, 'time')}` : 'محفوظ') :
    state === 'saving' ? 'جارٍ الحفظ…' :
    state === 'dirty'  ? `${changesLabel(dirtyCount || 1)} غير محفوظة` :
    state === 'offline' ? (dirtyCount ? `غير متصل · ${changesLabel(dirtyCount)} على جهازك` : 'غير متصل') :
                         'تعذّر الحفظ';

  return (
    <span
      role="status"
      aria-live="polite"
      title={detail || undefined}
      className={cx('inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full t-caption font-medium whitespace-nowrap', cls, className)}
    >
      <Icon size={12} strokeWidth={2.25} className={cx('shrink-0', spin && 'animate-spin')} aria-hidden="true" />
      {text}
      {state === 'error' && onRetry && (
        <button type="button" onClick={onRetry} className="underline underline-offset-2 hover:no-underline ms-1">
          إعادة المحاولة
        </button>
      )}
    </span>
  );
}

'use client';
import { Check, TriangleAlert } from 'lucide-react';
import { useEditorStore } from '@/store/editorStore';

/**
 * SYNC STATUS
 * ─────────────────────────────────────────────────────────────────────────────
 * One implementation, three presentations. Sync state used to be rendered by
 * three separate pieces of code — SyncBar in EditorShell, SyncDot in
 * EditorSidebar, and an inline `syncDot` in the lesson editor header — each
 * with its own colours, thresholds and wording, all fed by prop drilling.
 *
 * State is read straight from editorStore, which useAtlasSync already writes
 * to via setSyncStatus, so nothing needs threading through the tree.
 */

function useSyncState() {
  const isSyncing  = useEditorStore((s) => s.isSyncing);
  const syncError  = useEditorStore((s) => s.syncError);
  const lastSynced = useEditorStore((s) => s.lastSynced);
  return { isSyncing, syncError, lastSynced };
}

/** Tone + copy for the current state, or null when there is nothing to say. */
function describe({ isSyncing, syncError, lastSynced }) {
  if (syncError) return { tone: 'danger',  label: 'خطأ في الحفظ', detail: typeof syncError === 'string' ? syncError : null };
  if (isSyncing) return { tone: 'warn',    label: 'جاري الحفظ…',  detail: null };
  if (lastSynced) {
    const time = new Date(lastSynced).toLocaleTimeString('ar-SD', { hour: '2-digit', minute: '2-digit' });
    return { tone: 'success', label: `محفوظ · ${time}`, detail: null };
  }
  return null;
}

const TONE_COLOR = {
  danger:  'var(--danger)',
  warn:    'var(--warn)',
  success: 'var(--success)',
};

const TONE_SURFACE = {
  danger:  'var(--danger-surface)',
  warn:    'var(--warn-surface)',
  success: 'var(--success-surface)',
};

const TONE_BORDER = {
  danger:  'var(--danger-border)',
  warn:    'var(--warn-border)',
  success: 'var(--success-border)',
};

/** Bare status dot — sidebar rail, lesson header, anywhere space is tight. */
export function SyncDot({ size = 8 }) {
  const state = useSyncState();
  const info  = describe(state);
  if (!info) return null;

  return (
    <span
      className={`shrink-0 rounded-full ${info.tone === 'warn' ? 'animate-pulse' : ''}`}
      style={{ width: size, height: size, background: TONE_COLOR[info.tone] }}
      role="status"
      aria-label={info.label}
      title={info.label}
    />
  );
}

/** Dot + label, for inline use in a toolbar. */
export function SyncPill({ className = '' }) {
  const state = useSyncState();
  const info  = describe(state);
  if (!info) return null;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} role="status">
      <SyncDot size={6} />
      <span className="font-arabic text-[11px] whitespace-nowrap" style={{ color: TONE_COLOR[info.tone] }}>
        {info.label}
      </span>
    </span>
  );
}

/** Full-width banner across the top of a page. */
export default function SyncBanner() {
  const state = useSyncState();
  const info  = describe(state);
  if (!info) return null;

  const color = TONE_COLOR[info.tone];

  return (
    <div
      role="status"
      className="flex shrink-0 items-center gap-2 px-4 py-1.5 sm:px-6"
      style={{ background: TONE_SURFACE[info.tone], borderBottom: `1px solid ${TONE_BORDER[info.tone]}` }}
    >
      {info.tone === 'danger' && <TriangleAlert size={13} strokeWidth={2} style={{ color }} />}
      {info.tone === 'warn' && (
        <span
          className="inline-block h-3 w-3 animate-spin rounded-full border-2"
          style={{ borderColor: color, borderTopColor: 'transparent' }}
        />
      )}
      {info.tone === 'success' && <Check size={13} strokeWidth={2.2} style={{ color }} />}

      <span className="font-arabic text-xs" style={{ color }}>{info.label}</span>

      {info.detail && (
        <span className="truncate font-arabic text-xs opacity-80" style={{ color }}>
          — {info.detail}
        </span>
      )}
      {info.tone === 'danger' && (
        <span className="mr-auto font-arabic text-xs opacity-80" style={{ color }}>محفوظ محلياً</span>
      )}
    </div>
  );
}

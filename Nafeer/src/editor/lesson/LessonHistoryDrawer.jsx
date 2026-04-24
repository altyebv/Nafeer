'use client';
import { useState, useEffect } from 'react';

// ─── LessonHistoryDrawer ──────────────────────────────────────────────────────
// Slide-in panel from the right showing the full lesson audit trail.
// One entry per version — action chip, author, timestamp, optional label,
// optional note, expandable diff block.
//
// Props:
//   lessonId  — contentId string
//   onClose   — callback

// ── Config ────────────────────────────────────────────────────────────────────

const ACTION_CONFIG = {
  created:  { label: 'إنشاء',    color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-800/40', dot: 'bg-emerald-500' },
  edited:   { label: 'تعديل',    color: 'text-sky-400',     bg: 'bg-sky-900/20',     border: 'border-sky-800/40',     dot: 'bg-sky-500'     },
  reviewed: { label: 'مراجعة',   color: 'text-amber-400',   bg: 'bg-amber-900/20',   border: 'border-amber-800/40',   dot: 'bg-amber-500'   },
  approved: { label: 'اعتماد',   color: 'text-emerald-400', bg: 'bg-emerald-900/25', border: 'border-emerald-700/50', dot: 'bg-emerald-400' },
  archived: { label: 'أرشفة',    color: 'text-ink-500',     bg: 'bg-ink-800/30',     border: 'border-ink-700/40',     dot: 'bg-ink-600'     },
};

// Human-readable Arabic labels for diff fields
const FIELD_LABELS = {
  'title':                 'العنوان',
  'summary':               'الملخص',
  'estimatedMinutes':      'الوقت المقدر',
  'status':                'الحالة',
  'metadata.hook':         'السؤال التحفيزي',
  'metadata.forwardPull':  'الجملة الشدّاءة',
  'metadata.orientation':  'نقاط التوجيه',
};

const STATUS_LABELS = {
  draft: 'مسودة', review: 'مراجعة', approved: 'معتمد', archived: 'مؤرشف',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)      return 'الآن';
  if (diff < 3600)    return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400)   return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 2592000) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return new Date(dateStr).toLocaleDateString('ar-SD', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatValue(field, val) {
  if (val === null || val === undefined || val === '') return <span className="text-ink-700 italic text-[11px]">فارغ</span>;
  if (field === 'estimatedMinutes') return <span>{val} دقيقة</span>;
  if (field === 'status') return <span>{STATUS_LABELS[val] ?? val}</span>;
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-ink-700 italic text-[11px]">فارغ</span>;
    return (
      <ul className="space-y-0.5 list-none">
        {val.map((v, i) => <li key={i} className="flex gap-1"><span className="text-ink-700">•</span>{v}</li>)}
      </ul>
    );
  }
  // Truncate long strings in the diff view
  const str = String(val);
  if (str.length > 120) return <span>{str.slice(0, 120)}<span className="text-ink-700">…</span></span>;
  return <span>{str}</span>;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function DiffBlock({ diff }) {
  if (!diff || Object.keys(diff).length === 0) return null;

  return (
    <div className="mt-2.5 rounded-xl border border-ink-800/50 overflow-hidden text-xs font-arabic">
      {Object.entries(diff).map(([field, { from, to }], i) => (
        <div
          key={field}
          className={`px-3 py-2.5 space-y-1.5 ${i > 0 ? 'border-t border-ink-800/40' : ''}`}
        >
          <p className="text-[10px] text-ink-600 font-medium tracking-wide">
            {FIELD_LABELS[field] ?? field}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {/* From */}
            <div className="bg-red-950/20 border border-red-900/20 rounded-lg px-2.5 py-1.5 text-red-300/80 leading-relaxed">
              <span className="text-[9px] text-red-700 block mb-0.5 font-mono">من</span>
              {formatValue(field, from)}
            </div>
            {/* To */}
            <div className="bg-emerald-950/20 border border-emerald-900/20 rounded-lg px-2.5 py-1.5 text-emerald-300/80 leading-relaxed">
              <span className="text-[9px] text-emerald-700 block mb-0.5 font-mono">إلى</span>
              {formatValue(field, to)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function HistoryEntry({ entry, isLast }) {
  const cfg          = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.edited;
  const hasDiff      = entry.diff && Object.keys(entry.diff).length > 0;
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-3">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 20 }}>
        <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1 ring-2 ring-ink-900 ${cfg.dot}`} />
        {!isLast && <div className="flex-1 w-px bg-ink-800/50 mt-1" />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-5 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}>
        {/* Header row */}
        <div className="flex items-center gap-2 px-3 py-2.5 flex-wrap">
          {/* Version badge */}
          <span className="text-[10px] font-mono text-ink-600 bg-ink-800/60 px-1.5 py-0.5 rounded shrink-0">
            v{entry.version}
          </span>

          {/* Action chip */}
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.border} ${cfg.bg} shrink-0`}>
            {cfg.label}
          </span>

          {/* Version label — the 2c feature */}
          {entry.versionLabel && (
            <span className="text-[11px] text-sand-500 bg-sand-900/20 border border-sand-800/30 px-2 py-0.5 rounded-full shrink-0">
              {entry.versionLabel}
            </span>
          )}

          <div className="flex-1" />

          <span className="text-[10px] text-ink-700 font-mono shrink-0">
            {relativeTime(entry.timestamp)}
          </span>
        </div>

        {/* Author row */}
        <div className="flex items-center gap-2 px-3 pb-2">
          {/* Avatar initial */}
          <span className="w-5 h-5 rounded-full bg-ink-700 text-ink-300 text-[10px] flex items-center justify-center shrink-0 font-arabic">
            {(entry.byName || '؟').charAt(0)}
          </span>
          <span className="text-[12px] text-ink-300 font-arabic">
            {entry.byName || 'مساهم'}
          </span>
        </div>

        {/* Note */}
        {entry.note && (
          <div className="px-3 pb-2.5">
            <p className="text-[12px] text-ink-400 font-arabic leading-relaxed bg-ink-800/30 rounded-lg px-2.5 py-2 border border-ink-700/30">
              {entry.note}
            </p>
          </div>
        )}

        {/* Diff toggle */}
        {hasDiff && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-1.5 text-[11px] text-ink-600 hover:text-ink-300 transition-colors font-arabic"
            >
              <span
                className="text-[9px] transition-transform duration-200"
                style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}
              >
                ▶
              </span>
              {open ? 'إخفاء التغييرات' : `عرض التغييرات (${Object.keys(entry.diff).length})`}
            </button>
            {open && <DiffBlock diff={entry.diff} />}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LessonHistoryDrawer({ lessonId, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    fetch(`/api/content/lessons/${lessonId}/history`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) setHistory(res.data.history || []);
        else setError('تعذّر تحميل السجل');
      })
      .catch(() => setError('تعذّر تحميل السجل'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const editCount    = history.filter((e) => e.action === 'edited').length;
  const approveCount = history.filter((e) => e.action === 'approved').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-full max-w-sm z-50 flex flex-col bg-ink-900 border-r border-ink-800 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-ink-800 shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-300 hover:bg-ink-800 transition-colors"
          >
            ✕
          </button>
          <h2 className="text-sm font-semibold text-sand-300 font-arabic">سجل الإصدارات</h2>
          {!loading && history.length > 0 && (
            <span className="text-[11px] font-mono text-ink-600 bg-ink-800/60 px-1.5 py-0.5 rounded">
              {history.length} إصدار
            </span>
          )}
        </div>

        {/* Stats strip */}
        {!loading && history.length > 0 && (
          <div className="flex items-center gap-4 px-4 py-2.5 border-b border-ink-800/50 shrink-0 bg-ink-900/60">
            <div className="text-center">
              <p className="text-base font-mono text-sand-400 leading-none">{history.length}</p>
              <p className="text-[10px] text-ink-600 font-arabic mt-0.5">إصدار</p>
            </div>
            <div className="w-px h-6 bg-ink-800" />
            <div className="text-center">
              <p className="text-base font-mono text-sky-400 leading-none">{editCount}</p>
              <p className="text-[10px] text-ink-600 font-arabic mt-0.5">تعديل</p>
            </div>
            <div className="w-px h-6 bg-ink-800" />
            <div className="text-center">
              <p className="text-base font-mono text-emerald-400 leading-none">{approveCount}</p>
              <p className="text-[10px] text-ink-600 font-arabic mt-0.5">اعتماد</p>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-4">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <span className="w-5 h-5 border-2 border-ink-700 border-t-sand-600 rounded-full animate-spin" />
            </div>
          )}

          {!loading && error && (
            <div className="py-12 text-center">
              <p className="text-sm text-red-400 font-arabic">{error}</p>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-3xl mb-3 opacity-30">📜</p>
              <p className="text-sm text-ink-600 font-arabic">لا يوجد سجل بعد</p>
              <p className="text-xs text-ink-700 font-arabic mt-1">يبدأ السجل عند أول تعديل</p>
            </div>
          )}

          {!loading && !error && history.map((entry, i) => (
            <HistoryEntry
              key={entry._id ?? i}
              entry={entry}
              isLast={i === history.length - 1}
            />
          ))}
        </div>
      </div>
    </>
  );
}
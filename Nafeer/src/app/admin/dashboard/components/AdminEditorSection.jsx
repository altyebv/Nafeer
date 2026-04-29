'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SectionHeader } from './ui/shared';
import { AdminEditorWorkspace } from './AdminEditorWorkspace';
import { CreateTestSubjectModal } from './modals/CreateTestSubjectModal';

// ─── Design tokens ────────────────────────────────────────────────────────────

const TRACK_META = {
  COMMON: { label: 'مشترك', cls: 'border-sky-800/50 text-sky-400/80', dot: 'bg-sky-500' },
  SCIENCE: { label: 'علمي', cls: 'border-emerald-800/50 text-emerald-400/80', dot: 'bg-emerald-500' },
  LITERARY: { label: 'أدبي', cls: 'border-purple-800/50 text-purple-400/80', dot: 'bg-purple-500' },
  REMOTE: { label: 'Remote', cls: 'border-amber-800/50 text-amber-400/80', dot: 'bg-amber-500' },
};

const TRACK_ORDER = ['COMMON', 'SCIENCE', 'LITERARY'];
const SELECTED_SUBJECT_KEY = 'nafeer-admin-editor-selected-subject';

function readStoredSelectedSubject() {
  try { return sessionStorage.getItem(SELECTED_SUBJECT_KEY) || null; }
  catch { return null; }
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function TrackBadge({ track }) {
  const m = TRACK_META[track] || { label: track, cls: 'border-ink-700 text-ink-500' };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${m.cls}`}>
      {m.label}
    </span>
  );
}

function VersionBadge({ version }) {
  if (!version) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-ink-700/60 text-ink-600">
      غير منشور
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-sand-800/60 text-sand-400">
      v{version}
    </span>
  );
}

function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 'w-3 h-3 border' : 'w-5 h-5 border-2';
  return (
    <span className={`inline-block ${s} border-current border-t-transparent rounded-full animate-spin`} />
  );
}

function PrimaryBtn({ onClick, loading, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-arabic transition-all
        border border-sand-700/60 text-sand-300 hover:border-sand-600 hover:text-sand-200
        ${loading || disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ background: 'rgba(212,137,30,0.07)' }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function SecondaryBtn({ onClick, loading, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all
        border border-ink-700/60 text-ink-400 hover:border-ink-600 hover:text-ink-200
        ${loading || disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
      style={{ background: 'rgba(255,255,255,0.02)' }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

// ─── Subject Picker ───────────────────────────────────────────────────────────

function SkeletonBlock({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.045), rgba(255,255,255,0.085), rgba(255,255,255,0.045))',
        ...style,
      }}
    />
  );
}

function SubjectPickerSkeleton() {
  return (
    <div
      className="w-52 shrink-0 rounded-xl border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="px-3 py-3 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <SkeletonBlock className="h-3 w-16" />
        <SkeletonBlock className="h-5 w-14 rounded-md" />
      </div>
      <div className="p-3 space-y-3">
        {[0, 1, 2].map((group) => (
          <div key={group} className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-1.5 w-1.5 rounded-full" />
              <SkeletonBlock className="h-2 w-14" />
            </div>
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="flex items-center gap-2 py-1">
                <SkeletonBlock className="h-1.5 w-1.5 rounded-full shrink-0" />
                <SkeletonBlock className="h-3 flex-1" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentPanelSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div
        className="rounded-xl border p-5"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-3 w-72 max-w-full" />
          </div>
          <SkeletonBlock className="h-9 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-xl border p-4 space-y-3"
            style={{ background: 'rgba(255,255,255,0.018)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-4 w-4 rounded-full" />
            </div>
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-1 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkspaceShellSkeleton() {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: 'rgba(9,9,11,0.50)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="px-5 py-4 border-b space-y-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3 flex-1">
            <SkeletonBlock className="h-2 w-40" />
            <SkeletonBlock className="h-6 w-64 max-w-full" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-8 w-20 rounded-lg" />)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[0, 1, 2, 3].map((item) => <SkeletonBlock key={item} className="h-10 w-24 rounded-t-xl" />)}
        </div>
      </div>
      <div className="p-5 space-y-4">
        <SkeletonBlock className="h-8 w-48" />
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}
          >
            <SkeletonBlock className="h-4 w-56 max-w-full" />
            <SkeletonBlock className="h-3 w-full" />
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminEditorSkeleton() {
  return (
    <div className="flex gap-5 items-start">
      <SubjectPickerSkeleton />
      <div className="flex-1 min-w-0 space-y-5">
        <ContentPanelSkeleton />
        <WorkspaceShellSkeleton />
      </div>
    </div>
  );
}

function RefreshStatus({ refreshing }) {
  if (!refreshing) return null;
  return (
    <div
      className="mb-4 rounded-xl border px-4 py-2.5 flex items-center gap-2"
      style={{ background: 'rgba(212,137,30,0.05)', borderColor: 'rgba(212,137,30,0.18)' }}
    >
      <Spinner />
      <span className="text-[11px] font-arabic text-sand-300">جار تحديث بيانات المحرر بدون إغلاق مساحة العمل...</span>
    </div>
  );
}

function InlineRefreshError({ message, onRetry }) {
  if (!message) return null;
  return (
    <div
      className="mb-4 rounded-xl border px-4 py-3 flex items-center justify-between gap-3"
      style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.18)' }}
    >
      <span className="text-[12px] font-arabic text-red-300">{message}</span>
      <button
        onClick={onRetry}
        className="text-[10px] font-mono text-red-300/80 hover:text-red-200 transition-colors"
      >
        retry
      </button>
    </div>
  );
}

function statusDot(s) {
  if (s.isPublished && !s.hasNewContent) return 'bg-sand-500/70';
  if (s.isPublished && s.hasNewContent) return 'bg-amber-400/80';
  if (s.isPublishable) return 'bg-green-500/70';
  return 'bg-ink-700/60';
}

function SubjectPicker({ subjects, selected, onSelect, onCreateTest }) {
  const extraTracks = [...new Set(subjects.map((s) => s.track).filter((track) => !TRACK_ORDER.includes(track)))];
  const grouped = [...TRACK_ORDER, ...extraTracks].map((track) => ({
    track,
    items: subjects.filter((s) => s.track === track),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="w-52 shrink-0 rounded-xl border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] font-mono text-ink-600 uppercase tracking-widest">المواد</p>
        {/* ── Create test subject button ── */}
        <button
          onClick={onCreateTest}
          title="إنشاء مادة تجريبية"
          className="text-[10px] font-mono text-ink-700 hover:text-sand-400 transition-colors px-1.5 py-0.5 rounded border border-ink-800/60 hover:border-sand-700/50"
        >
          + تجريبي
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {grouped.map(({ track, items }) => (
          <div key={track}>
            <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className={`w-1.5 h-1.5 rounded-full ${TRACK_META[track]?.dot || 'bg-ink-600'}`} />
              <span className="text-[9px] font-mono text-ink-700 uppercase tracking-widest">
                {TRACK_META[track]?.label || track}
              </span>
            </div>

            {items.map((s) => {
              const isSelected = selected === s.id;
              const isTest = s.id.startsWith('TEST_') || s.source === 'atlas';
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-right flex items-center gap-2 px-3 py-2 transition-all
                    ${isSelected ? 'text-sand-300' : 'text-ink-400 hover:text-ink-200'}`}
                  style={isSelected
                    ? { background: 'rgba(212,137,30,0.09)', borderRight: '2px solid rgba(212,137,30,0.5)' }
                    : { borderRight: '2px solid transparent' }
                  }
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusDot(s)}`} />
                  <span className="font-arabic text-xs truncate">{s.nameAr}</span>
                  {s.isMajor && (
                    <span className="mr-auto text-[8px] font-mono text-ink-700 shrink-0">★</span>
                  )}
                  {/* Mark test/scratch subjects */}
                  {isTest && !s.isMajor && (
                    <span className="mr-auto text-[7px] font-mono text-ink-800 shrink-0">DEV</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div
        className="px-3 py-2.5 border-t space-y-1"
        style={{ borderColor: 'rgba(255,255,255,0.05)' }}
      >
        {[
          { dot: 'bg-sand-500/70', label: 'منشور' },
          { dot: 'bg-amber-400/80', label: 'يحتاج تحديث' },
          { dot: 'bg-green-500/70', label: 'جاهز للنشر' },
          { dot: 'bg-ink-700/60', label: 'لا يوجد محتوى' },
        ].map(({ dot, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
            <span className="text-[9px] font-mono text-ink-700">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

// ─── Stat Card ────────────────────────────────────────────────────────────────

const STAT_ACCENT = {
  '◈': { fg: 'rgba(212,137,30,0.9)', glow: 'rgba(212,137,30,0.08)', border: 'rgba(212,137,30,0.18)' },
  '◎': { fg: 'rgba(99,102,241,0.9)', glow: 'rgba(99,102,241,0.07)', border: 'rgba(99,102,241,0.16)' },
  '▣': { fg: 'rgba(16,185,129,0.9)', glow: 'rgba(16,185,129,0.07)', border: 'rgba(16,185,129,0.16)' },
};

function StatCard({ label, total, approved, icon, diffSincePublish }) {
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const hasNew = diffSincePublish != null && diffSincePublish > 0;
  const accent = STAT_ACCENT[icon] || STAT_ACCENT['◈'];

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2.5 relative overflow-hidden"
      style={{ background: accent.glow, borderColor: accent.border }}
    >
      {/* Decorative top-right glow blob */}
      <div
        className="absolute top-0 right-0 w-16 h-16 rounded-full pointer-events-none"
        style={{ background: accent.glow, filter: 'blur(16px)', transform: 'translate(30%, -30%)' }}
      />

      <div className="flex items-center justify-between relative">
        <span className="text-[10px] font-arabic text-ink-400 tracking-wide">{label}</span>
        <span className="text-[13px] font-mono" style={{ color: accent.fg }}>{icon}</span>
      </div>

      <div className="flex items-end gap-2 relative">
        <span className="text-3xl font-bold font-mono leading-none" style={{ color: accent.fg }}>
          {approved}
        </span>
        <span className="text-sm font-mono text-ink-600 mb-0.5">/ {total}</span>
        {hasNew && (
          <span className="mr-auto text-[10px] font-mono text-amber-400/80 mb-0.5">
            +{diffSincePublish} جديد
          </span>
        )}
      </div>

      <div className="h-1 w-full rounded-full overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${approvalRate}%`, background: accent.fg }}
        />
      </div>

      <p className="text-[9px] font-mono text-ink-700 relative">{approvalRate}% معتمد</p>
    </div>
  );
}

// ─── Publish Result Banner ────────────────────────────────────────────────────

function PublishResult({ result, onDismiss }) {
  if (!result) return null;

  if (!result.ok) return (
    <div
      className="rounded-xl border p-4 flex items-start gap-3"
      style={{ background: 'rgba(239,68,68,0.05)', borderColor: 'rgba(239,68,68,0.25)' }}
    >
      <span className="text-red-400 text-base shrink-0">✕</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-arabic text-red-400">{result.error || 'فشل النشر'}</p>
      </div>
      <button onClick={onDismiss} className="text-ink-600 hover:text-ink-400 text-xs">✕</button>
    </div>
  );

  const { data } = result;

  // No-change publish — nothing was different from last publish
  if (data.noChange) return (
    <div
      className="rounded-xl border p-4 flex items-center justify-between gap-3"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-2">
        <span className="text-ink-500">◎</span>
        <p className="text-sm font-arabic text-ink-400">لا يوجد تغييرات منذ آخر نشر — لم يتم تحديث الإصدار</p>
      </div>
      <button onClick={onDismiss} className="text-ink-600 hover:text-ink-400 text-xs shrink-0">✕</button>
    </div>
  );
  const displayVersion = data.contentVersion || data.version || '—';
  const isDelta = data.mode === 'delta';

  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'rgba(212,137,30,0.05)', borderColor: 'rgba(212,137,30,0.25)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sand-400">✓</span>
          <span className="font-arabic text-sm text-sand-300">
            تم النشر بنجاح — نسخة {displayVersion}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
            style={{ borderColor: 'rgba(212,137,30,0.3)', color: 'var(--accent)' }}>
            {isDelta ? 'delta' : 'full'}
          </span>
        </div>
        <button onClick={onDismiss} className="text-ink-600 hover:text-ink-400 text-xs">✕</button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          ['دروس', data.stats?.lessons ?? 0],
          ['أسئلة', data.stats?.questions ?? 0],
          ['تغذية', data.stats?.feedItems ?? 0],
          ['مفاهيم', data.stats?.concepts ?? 0],
        ].map(([label, val]) => (
          <div key={label} className="text-center">
            <p className="text-base font-mono font-bold text-sand-400">{val}</p>
            <p className="text-[10px] font-arabic text-ink-600">{label}</p>
          </div>
        ))}
      </div>

      {isDelta && data.delta && (
        <div className="mt-3 flex items-center gap-4 text-[10px] font-mono text-ink-500">
          <span>↑ {data.delta.bundlesUploaded} bundle</span>
          <span>~ {data.delta.changedEntities} entity</span>
          {data.delta.deletedEntities > 0 && (
            <span className="text-red-400/70">− {data.delta.deletedEntities} محذوف</span>
          )}
        </div>
      )}

      {data.downloadUrl && (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-[10px] font-mono text-ink-600">رابط التحميل:</span>
          <a
            href={data.downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-mono text-sky-500/70 hover:text-sky-400 truncate"
          >
            {data.downloadUrl.split('/').pop()}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Content Panel ────────────────────────────────────────────────────────────

function relativeTime(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

function ContentPanel({ subject: s, onPublish, onMajorPublish, onFullPublish, onDeleteSubject, publishing, result, onDismissResult }) {
  const [showFullConfirm, setShowFullConfirm] = useState(false);
  const [showMajorConfirm, setShowMajorConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Only show the local-DB delete option for scratch/test subjects
  // (those that aren't in SUBJECTS_CATALOG — source === 'atlas' and id starts TEST_)
  const isTestSubject = s.source !== 'catalog' || s.id.startsWith('TEST_');

  const handleDeleteLocal = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/admin/subjects?subjectId=${encodeURIComponent(s.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'فشل الحذف');
      onDeleteSubject?.();
    } catch (e) {
      setDeleteError(e.message);
      setDeleting(false);
    }
  };

  const lessonDiff =
    s.isPublished && s.remoteLessons != null
      ? Math.max(0, s.lessons.approved - s.remoteLessons)
      : null;

  return (
    <div className="flex flex-col gap-5">

      {/* ── Subject header ──────────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-5 relative overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        {/* subtle ambient glow behind the title */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: s.isPublishable
              ? 'radial-gradient(ellipse at 80% 0%, rgba(212,137,30,0.06) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 80% 0%, rgba(255,255,255,0.02) 0%, transparent 60%)',
          }}
        />

        <div className="flex items-start justify-between gap-4 relative">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h2 className="font-arabic text-xl font-bold text-ink-100 truncate">{s.nameAr}</h2>
              <TrackBadge track={s.track} />
              {s.isMajor && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-sand-800/40 text-sand-600">رئيسي</span>
              )}
              {isTestSubject && !s.isMajor && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-purple-800/40 text-purple-500/70">TEST</span>
              )}
              <VersionBadge version={s.appVersion} />
              {s.contentVersion && s.patchCount != null && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-sky-800/40 text-sky-500/70">
                  {s.patchCount} patch
                </span>
              )}
            </div>

            {s.isPublished && s.publishedAt && (
              <p className="text-[11px] font-mono text-ink-600">
                آخر نشر: {relativeTime(s.publishedAt)} ·{' '}
                <span dir="ltr" className="text-ink-700">{new Date(s.publishedAt).toLocaleDateString('ar-SA')}</span>
              </p>
            )}

            <p className="text-[10px] font-mono text-ink-700 mt-1 tracking-widest">{s.id}</p>
          </div>

          {/* Status pill — right side */}
          <div className="shrink-0">
            {s.isPublishable ? (
              s.hasNewContent ? (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                  <span className="text-[11px] font-arabic text-amber-300">يوجد محتوى جديد</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-[11px] font-arabic text-green-300">محدّث</span>
                </div>
              )
            ) : (
              <div
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-ink-700 shrink-0" />
                <span className="text-[11px] font-arabic text-ink-600">لا يوجد محتوى معتمد</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish result */}
      <PublishResult result={result} onDismiss={onDismissResult} />

      {/* Content stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="الدروس" icon="◈" total={s.lessons.total} approved={s.lessons.approved} diffSincePublish={lessonDiff} />
        <StatCard label="الأسئلة" icon="◎" total={s.questions.total} approved={s.questions.approved} diffSincePublish={null} />
        <StatCard label="بطاقات التغذية" icon="▣" total={s.feedItems.total} approved={s.feedItems.approved} diffSincePublish={null} />
      </div>

      {/* Last publish snapshot */}
      {s.isPublished && (s.remoteLessons != null || s.remoteSections != null) && (
        <div
          className="rounded-xl border px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-[10px] font-mono text-ink-600 uppercase tracking-widest mb-2">آخر نسخة منشورة</p>
          <div className="flex items-center gap-6 text-[11px] font-mono">
            {s.remoteLessons != null && <span><span className="text-sand-500">{s.remoteLessons}</span>  <span className="text-ink-700">درس</span></span>}
            {s.remoteSections != null && <span><span className="text-sand-500">{s.remoteSections}</span> <span className="text-ink-700">قسم</span></span>}
            {s.remoteBlocks != null && <span><span className="text-sand-500">{s.remoteBlocks}</span>   <span className="text-ink-700">مقطع</span></span>}
          </div>
        </div>
      )}

      {/* ── Publish action ───────────────────────────────────────────────── */}
      <div
        className="rounded-xl border p-5 relative overflow-hidden"
        style={{ background: 'rgba(212,137,30,0.04)', borderColor: 'rgba(212,137,30,0.18)' }}
      >
        {/* Corner accent */}
        <div
          className="absolute top-0 left-0 w-24 h-24 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(212,137,30,0.09) 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }}
        />

        <div className="flex items-start justify-between gap-4 mb-4 relative">
          <div>
            <p className="font-arabic text-sm font-semibold text-ink-200 mb-1">
              {s.isPublished ? 'نشر تحديث للتطبيق' : 'نشر للمرة الأولى'}
            </p>
            <p className="text-[11px] font-arabic text-ink-500 leading-relaxed">
              {s.isPublishable
                ? `سيتم نشر ${s.lessons.approved} درس معتمد إلى تطبيق بشير مباشرة`
                : 'لا يوجد دروس معتمدة — أضف محتوى أولاً'}
            </p>
          </div>

          <PrimaryBtn onClick={onPublish} loading={publishing} disabled={!s.isPublishable}>
            {publishing ? 'جارٍ النشر…' : s.isPublished ? '⬆ نشر تحديث (delta)' : '⬆ نشر للتطبيق'}
          </PrimaryBtn>
        </div>

        {s.isPublished && (
          <div className="border-t pt-3.5 flex flex-col gap-2.5 relative" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

            {/* ── Major release ── */}
            {showMajorConfirm ? (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[11px] font-arabic text-sky-300/80 flex-1">
                  سيرفع رقم الإصدار الرئيسي (مثلاً 1.4 ← 2.0). استخدمه عند إطلاق وحدة جديدة أو تغيير جوهري في المنهج.
                </p>
                <div className="flex gap-2">
                  <SecondaryBtn onClick={() => { setShowMajorConfirm(false); onMajorPublish(); }} loading={publishing} disabled={!s.isPublishable}>
                    تأكيد إصدار رئيسي
                  </SecondaryBtn>
                  <SecondaryBtn onClick={() => setShowMajorConfirm(false)}>إلغاء</SecondaryBtn>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowMajorConfirm(true)}
                disabled={publishing || !s.isPublishable}
                className="text-[10px] font-mono text-sky-600/70 hover:text-sky-400/80 transition-colors text-right"
              >
                ★ نشر إصدار رئيسي (major bump)
              </button>
            )}

            {/* ── Emergency full publish ── */}
            {showFullConfirm ? (
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-[11px] font-arabic text-amber-300/80 flex-1">
                  سيُعاد رفع ملف JSON كامل وتحديث manifest — استخدم هذا فقط عند الإصلاح الاضطراري أو الترحيل الأول.
                </p>
                <div className="flex gap-2">
                  <SecondaryBtn onClick={() => { setShowFullConfirm(false); onFullPublish(); }} loading={publishing} disabled={!s.isPublishable}>
                    تأكيد full publish
                  </SecondaryBtn>
                  <SecondaryBtn onClick={() => setShowFullConfirm(false)}>إلغاء</SecondaryBtn>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowFullConfirm(true)}
                disabled={publishing || !s.isPublishable}
                className="text-[10px] font-mono text-ink-600 hover:text-amber-400/70 transition-colors text-right"
              >
                ↻ نشر كامل اضطراري (mode: full)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Test subject: delete from local DB ────────────────────────────── */}
      {isTestSubject && s.source !== 'remote' && (
        <div
          className="rounded-xl border px-4 py-3"
          style={{ background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.12)' }}
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-mono text-red-400/70">حذف المادة من قاعدة البيانات</p>
              <p className="text-[10px] font-arabic text-ink-600">
                يحذف المادة ووحداتها ودروسها من Atlas + Firestore + Supabase. لا يمكن التراجع.
              </p>
              {deleteError && <p className="text-[10px] text-red-400 mt-1">{deleteError}</p>}
            </div>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleDeleteLocal}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-lg border text-xs font-arabic transition-all"
                  style={{ background: 'rgba(239,68,68,0.10)', borderColor: 'rgba(239,68,68,0.30)', color: '#f87171', opacity: deleting ? 0.6 : 1 }}
                >
                  {deleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteError(null); }}
                  disabled={deleting}
                  className="px-3 py-1.5 rounded-lg border text-xs font-arabic text-ink-500 border-ink-800/60"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="shrink-0 text-[10px] font-mono text-red-400/50 hover:text-red-400/80 transition-colors"
              >
                ✕ حذف
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Remote-only subject: hint that delete is in the workspace below ── */}
      {isTestSubject && s.source === 'remote' && (
        <div
          className="rounded-xl border px-4 py-2.5 flex items-center gap-3"
          style={{ background: 'rgba(239,68,68,0.03)', borderColor: 'rgba(239,68,68,0.10)' }}
        >
          <span className="text-red-500/50 text-sm shrink-0">↓</span>
          <p className="text-[11px] font-arabic text-ink-600">
            هذه المادة موجودة في Firestore فقط. زر «حذف من Remote» متاح في منطقة العمل أدناه.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyPanel() {
  return (
    <div className="h-64 flex flex-col items-center justify-center gap-3 rounded-xl border"
      style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.06)' }}>
      <span className="text-3xl text-ink-800">◈</span>
      <p className="font-arabic text-sm text-ink-600">اختر مادة من القائمة</p>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export function AdminEditorSection() {
  const [subjects, setSubjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const selectSubject = useCallback((id) => {
    setSelected(id);
    try {
      if (id) sessionStorage.setItem(SELECTED_SUBJECT_KEY, id);
      else sessionStorage.removeItem(SELECTED_SUBJECT_KEY);
    } catch { /* ignore storage errors */ }
  }, []);

  const load = useCallback(async ({ silent = false } = {}) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const backgroundRefresh = silent || hasLoadedRef.current;
    if (backgroundRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/content/publish/status');
      const data = await res.json();
      if (requestId !== requestIdRef.current) return null;
      if (data.ok) {
        const list = data.subjects || [];
        setSubjects(list);
        setSelected((prevSelected) => {
          const preferred = prevSelected || readStoredSelectedSubject();
          if (preferred && list.some((subject) => subject.id === preferred)) {
            return preferred;
          }
          const first = list.find((subject) => subject.isPublishable) || list[0];
          return first?.id || null;
        });
        return list;
      } else {
        setError(data.error || 'فشل تحميل البيانات');
      }
    } catch {
      if (requestId === requestIdRef.current) {
        setError('تعذّر الاتصال بالخادم');
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
        setHasLoaded(true);
        hasLoadedRef.current = true;
      }
    }
    return null;
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    try {
      if (selected) sessionStorage.setItem(SELECTED_SUBJECT_KEY, selected);
      else sessionStorage.removeItem(SELECTED_SUBJECT_KEY);
    } catch { /* ignore storage errors */ }
  }, [selected]);

  // ── Publish helpers ───────────────────────────────────────────────────────

  const doPublish = async (mode = 'delta', bump = null) => {
    if (!selected) return;
    setPublishing(true);
    setResult(null);
    try {
      const res = await fetch('/api/content/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selected, mode, ...(bump ? { bump } : {}) }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, data });
        await load({ silent: true });
      } else {
        setResult({ ok: false, error: data.error });
      }
    } catch {
      setResult({ ok: false, error: 'تعذّر الاتصال بالخادم' });
    } finally {
      setPublishing(false);
    }
  };

  const publish = () => doPublish('delta');
  const majorPublish = () => doPublish('delta', 'major');
  const fullPublish = () => doPublish('full');

  // Called after a test subject is created — auto-select it
  const handleTestSubjectCreated = async (newSubjectId) => {
    setShowCreateModal(false);
    await load({ silent: true });
    selectSubject(newSubjectId);
    setResult(null);
  };

  const selectedSubject = subjects.find((s) => s.id === selected) || null;
  const initialLoading = loading && !hasLoaded;

  return (
    <div>
      <SectionHeader
        title="محرر المشرف"
        description="استيراد المادة المنشورة عن بُعد إلى Atlas عند الحاجة، ثم تعديلها بالمحرر الحالي وإعادة نشرها للتطبيق"
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-mono text-sand-500/70 hover:text-sand-400 transition-colors px-3 py-1.5 rounded-lg border border-sand-800/40 hover:border-sand-700/50"
          >
            + مادة تجريبية
          </button>
          <button
            onClick={() => load({ silent: true })}
            disabled={loading || refreshing}
            className="text-xs font-mono text-ink-500 hover:text-ink-300 transition-colors px-3 py-1.5 rounded-lg border border-ink-800/60 hover:border-ink-700/60 flex items-center gap-2"
          >
            {refreshing && <Spinner />}
            ↻ تحديث
          </button>
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        {initialLoading ? (
          <AdminEditorSkeleton />
        ) : error && !subjects.length ? (
          <div className="py-12 text-center">
            <p className="text-red-400 font-arabic text-sm mb-4">{error}</p>
            <button
              onClick={() => load()}
              className="text-xs font-mono text-ink-500 hover:text-ink-300 px-4 py-2 rounded-lg border border-ink-800"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            <RefreshStatus refreshing={refreshing} />
            <InlineRefreshError message={error} onRetry={() => load({ silent: true })} />
            <div className="flex gap-5 items-start">
              <SubjectPicker
                subjects={subjects}
                selected={selected}
                onSelect={(id) => { selectSubject(id); setResult(null); }}
                onCreateTest={() => setShowCreateModal(true)}
              />

              <div className="flex-1 min-w-0">
                {selectedSubject ? (
                  <div className="flex flex-col gap-5">
                    <ContentPanel
                      subject={selectedSubject}
                      onPublish={publish}
                      onMajorPublish={majorPublish}
                      onFullPublish={fullPublish}
                      publishing={publishing}
                      result={result}
                      onDismissResult={() => setResult(null)}
                      onDeleteSubject={() => { selectSubject(null); load({ silent: true }); }}
                    />
                    <AdminEditorWorkspace
                      subjectId={selectedSubject.id}
                      subjectMeta={selectedSubject}
                      onImported={() => { setResult(null); load({ silent: true }); }}
                      onRemoteDeleted={() => {
                        setResult(null);
                        // If the deleted subject was remote-only (source=remote), deselect it
                        const wasRemote = subjects.find((s) => s.id === selected)?.source === 'remote';
                        if (wasRemote) selectSubject(null);
                        load({ silent: true });
                      }}
                    />
                  </div>
                ) : (
                  <EmptyPanel />
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create test subject modal */}
      {showCreateModal && (
        <CreateTestSubjectModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleTestSubjectCreated}
        />
      )}
    </div>
  );
}

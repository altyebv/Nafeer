'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from './ui/shared';
import { AdminEditorWorkspace } from './AdminEditorWorkspace';

// ─── Design tokens ────────────────────────────────────────────────────────────

const TRACK_META = {
  COMMON:   { label: 'مشترك', cls: 'border-sky-800/50 text-sky-400/80',      dot: 'bg-sky-500'     },
  SCIENCE:  { label: 'علمي',   cls: 'border-emerald-800/50 text-emerald-400/80', dot: 'bg-emerald-500' },
  LITERARY: { label: 'أدبي',   cls: 'border-purple-800/50 text-purple-400/80',   dot: 'bg-purple-500'  },
  REMOTE:   { label: 'Remote', cls: 'border-amber-800/50 text-amber-400/80', dot: 'bg-amber-500' },
};

const TRACK_ORDER = ['COMMON', 'SCIENCE', 'LITERARY'];

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

// ─── Subject Picker ───────────────────────────────────────────────────────────

function statusDot(s) {
  if (s.isPublished && !s.hasNewContent) return 'bg-sand-500/70';   // published, in sync
  if (s.isPublished && s.hasNewContent)  return 'bg-amber-400/80';  // published but stale
  if (s.isPublishable)                   return 'bg-green-500/70';  // ready, not yet published
  return 'bg-ink-700/60';                                           // no approved content
}

function SubjectPicker({ subjects, selected, onSelect }) {
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
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] font-mono text-ink-600 uppercase tracking-widest">المواد</p>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {grouped.map(({ track, items }) => (
          <div key={track}>
            {/* Track group header */}
            <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className={`w-1.5 h-1.5 rounded-full ${TRACK_META[track]?.dot || 'bg-ink-600'}`} />
              <span className="text-[9px] font-mono text-ink-700 uppercase tracking-widest">
                {TRACK_META[track]?.label || track}
              </span>
            </div>

            {items.map((s) => {
              const isSelected = selected === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-right flex items-center gap-2 px-3 py-2 transition-all
                    ${isSelected
                      ? 'text-sand-300'
                      : 'text-ink-400 hover:text-ink-200'
                    }`}
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
          { dot: 'bg-sand-500/70',  label: 'منشور' },
          { dot: 'bg-amber-400/80', label: 'يحتاج تحديث' },
          { dot: 'bg-green-500/70', label: 'جاهز للنشر' },
          { dot: 'bg-ink-700/60',   label: 'لا يوجد محتوى' },
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

function StatCard({ label, total, approved, icon, diffSincePublish }) {
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const hasNew = diffSincePublish != null && diffSincePublish > 0;

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-2"
      style={{ background: 'rgba(255,255,255,0.025)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-arabic text-ink-500">{label}</span>
        <span className="text-[11px] font-mono text-ink-700">{icon}</span>
      </div>

      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold font-mono" style={{ color: 'var(--accent)' }}>
          {approved}
        </span>
        <span className="text-sm font-mono text-ink-600 mb-0.5">/ {total}</span>
        {hasNew && (
          <span className="mr-auto text-[10px] font-mono text-amber-400/80 mb-0.5">
            +{diffSincePublish} جديد
          </span>
        )}
      </div>

      {/* Approval bar */}
      <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${approvalRate}%`, background: 'var(--accent)' }}
        />
      </div>

      <p className="text-[9px] font-mono text-ink-700">{approvalRate}% معتمد</p>
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
  return (
    <div
      className="rounded-xl border p-4"
      style={{ background: 'rgba(212,137,30,0.05)', borderColor: 'rgba(212,137,30,0.25)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sand-400">✓</span>
          <span className="font-arabic text-sm text-sand-300">
            تم النشر بنجاح — نسخة {data.version}
          </span>
        </div>
        <button onClick={onDismiss} className="text-ink-600 hover:text-ink-400 text-xs">✕</button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {[
          ['دروس',    data.stats?.lessons   ?? 0],
          ['أسئلة',   data.stats?.questions ?? 0],
          ['تغذية',   data.stats?.feedItems ?? 0],
          ['مفاهيم',  data.stats?.concepts  ?? 0],
        ].map(([label, val]) => (
          <div key={label} className="text-center">
            <p className="text-base font-mono font-bold text-sand-400">{val}</p>
            <p className="text-[10px] font-arabic text-ink-600">{label}</p>
          </div>
        ))}
      </div>

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
  if (m < 1)   return 'الآن';
  if (m < 60)  return `منذ ${m} دقيقة`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `منذ ${h} ساعة`;
  const d = Math.floor(h / 24);
  return `منذ ${d} يوم`;
}

function ContentPanel({ subject: s, onPublish, publishing, result, onDismissResult }) {
  // Compute diff vs last published snapshot
  const lessonDiff =
    s.isPublished && s.remoteLessons != null
      ? Math.max(0, s.lessons.approved - s.remoteLessons)
      : null;

  return (
    <div className="flex flex-col gap-5">

      {/* Subject header */}
      <div
        className="rounded-xl border p-5"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h2 className="font-arabic text-xl font-bold text-ink-100">{s.nameAr}</h2>
              <TrackBadge track={s.track} />
              {s.isMajor && (
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-sand-800/40 text-sand-600">رئيسي</span>
              )}
              <VersionBadge version={s.appVersion} />
            </div>

            {s.isPublished && s.publishedAt && (
              <p className="text-[11px] font-mono text-ink-600">
                آخر نشر: {relativeTime(s.publishedAt)} ·{' '}
                <span dir="ltr" className="text-ink-700">{new Date(s.publishedAt).toLocaleDateString('ar-SA')}</span>
              </p>
            )}
          </div>

          {/* Readiness gate */}
          <div className="shrink-0 text-left">
            {s.isPublishable ? (
              s.hasNewContent ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span className="text-[11px] font-arabic text-amber-300">يوجد محتوى جديد</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-[11px] font-arabic text-green-300">محدّث</span>
                </div>
              )
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
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
        <StatCard
          label="الدروس"
          icon="◈"
          total={s.lessons.total}
          approved={s.lessons.approved}
          diffSincePublish={lessonDiff}
        />
        <StatCard
          label="الأسئلة"
          icon="◎"
          total={s.questions.total}
          approved={s.questions.approved}
          diffSincePublish={null}
        />
        <StatCard
          label="بطاقات التغذية"
          icon="▣"
          total={s.feedItems.total}
          approved={s.feedItems.approved}
          diffSincePublish={null}
        />
      </div>

      {/* Last publish snapshot */}
      {s.isPublished && (s.remoteLessons != null || s.remoteSections != null) && (
        <div
          className="rounded-xl border px-4 py-3"
          style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p className="text-[10px] font-mono text-ink-600 uppercase tracking-widest mb-2">آخر نسخة منشورة</p>
          <div className="flex items-center gap-6 text-[11px] font-mono">
            {s.remoteLessons  != null && <span><span className="text-sand-500">{s.remoteLessons}</span>  <span className="text-ink-700">درس</span></span>}
            {s.remoteSections != null && <span><span className="text-sand-500">{s.remoteSections}</span> <span className="text-ink-700">قسم</span></span>}
            {s.remoteBlocks   != null && <span><span className="text-sand-500">{s.remoteBlocks}</span>   <span className="text-ink-700">مقطع</span></span>}
          </div>
        </div>
      )}

      {/* Publish action */}
      <div
        className="rounded-xl border p-5 flex items-center justify-between gap-4"
        style={{ background: 'rgba(212,137,30,0.04)', borderColor: 'rgba(212,137,30,0.15)' }}
      >
        <div>
          <p className="font-arabic text-sm font-semibold text-ink-200 mb-0.5">
            {s.isPublished ? 'نشر تحديث للتطبيق' : 'نشر للمرة الأولى'}
          </p>
          <p className="text-[11px] font-arabic text-ink-500">
            {s.isPublishable
              ? `سيتم نشر ${s.lessons.approved} درس معتمد إلى تطبيق بشير مباشرة`
              : 'لا يوجد دروس معتمدة — أضف محتوى أولاً'}
          </p>
        </div>

        <PrimaryBtn
          onClick={onPublish}
          loading={publishing}
          disabled={!s.isPublishable}
        >
          {publishing ? 'جارٍ النشر…' : s.isPublished ? 'نشر تحديث ⬆' : 'نشر للتطبيق ⬆'}
        </PrimaryBtn>
      </div>

      {/* ── Editor placeholder — Step 2 will embed EditorShell here ─────────── */}
      <div
        className="hidden"
        style={{ background: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' }}
      >
        <span className="text-3xl text-ink-800">✎</span>
        <p className="font-arabic text-sm text-ink-600">محرر المحتوى</p>
        <p className="text-[11px] font-mono text-ink-800 max-w-xs">
          قريباً — تعديل الدروس والكتل والمفاهيم مباشرة من هنا قبل النشر
        </p>
      </div>
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
  const [subjects,   setSubjects]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/content/publish/status');
      const data = await res.json();
      if (data.ok) {
        const list = data.subjects || [];
        setSubjects(list);
        setSelected((prevSelected) => {
          if (prevSelected && list.some((subject) => subject.id === prevSelected)) {
            return prevSelected;
          }

          const first = list.find((subject) => subject.isPublishable) || list[0];
          return first?.id || null;
        });
      } else {
        setError(data.error || 'فشل تحميل البيانات');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const publish = async () => {
    if (!selected) return;
    setPublishing(true);
    setResult(null);
    try {
      const res  = await fetch('/api/content/publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subjectId: selected }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult({ ok: true, data });
        load(); // refresh counts
      } else {
        setResult({ ok: false, error: data.error });
      }
    } catch {
      setResult({ ok: false, error: 'تعذّر الاتصال بالخادم' });
    } finally {
      setPublishing(false);
    }
  };

  const selectedSubject = subjects.find((s) => s.id === selected) || null;

  return (
    <div>
      <SectionHeader
        title="محرر المشرف"
        description="استيراد المادة المنشورة عن بُعد إلى Atlas عند الحاجة، ثم تعديلها بالمحرر الحالي وإعادة نشرها للتطبيق"
      >
        <button
          onClick={load}
          disabled={loading}
          className="text-xs font-mono text-ink-500 hover:text-ink-300 transition-colors px-3 py-1.5 rounded-lg border border-ink-800/60 hover:border-ink-700/60"
        >
          ↻ تحديث
        </button>
      </SectionHeader>

      <div className="px-8 pb-8">
        {loading ? (
          <div className="flex items-center gap-3 text-ink-500 py-16">
            <Spinner size="md" />
            <span className="font-arabic text-sm">جارٍ التحميل…</span>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-red-400 font-arabic text-sm mb-4">{error}</p>
            <button
              onClick={load}
              className="text-xs font-mono text-ink-500 hover:text-ink-300 px-4 py-2 rounded-lg border border-ink-800"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="flex gap-5 items-start">
            <SubjectPicker
              subjects={subjects}
              selected={selected}
              onSelect={(id) => { setSelected(id); setResult(null); }}
            />

            <div className="flex-1 min-w-0">
              {selectedSubject ? (
                <div className="flex flex-col gap-5">
                  <ContentPanel
                    subject={selectedSubject}
                    onPublish={publish}
                    publishing={publishing}
                    result={result}
                    onDismissResult={() => setResult(null)}
                  />
                  <AdminEditorWorkspace
                    subjectId={selectedSubject.id}
                    subjectMeta={selectedSubject}
                    onImported={() => {
                      setResult(null);
                      load();
                    }}
                  />
                </div>
              ) : (
                <EmptyPanel />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from './ui/shared';

// ─── Design tokens (mirrors SeedSection exactly) ──────────────────────────────

function TrackBadge({ track }) {
  const styles = {
    COMMON:   'border-sky-800/50 text-sky-400/80',
    SCIENCE:  'border-emerald-800/50 text-emerald-400/80',
    LITERARY: 'border-purple-800/50 text-purple-400/80',
  };
  const labels = { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${styles[track] || 'border-ink-700 text-ink-500'}`}>
      {labels[track] || track}
    </span>
  );
}

function AppStatusBadge({ isPublished, appVersion }) {
  if (!isPublished) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-ink-700/60 bg-ink-900/40 text-ink-500">
      غير منشور
    </span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-sand-800/60 bg-sand-950/40 text-sand-400">
      v{appVersion}
    </span>
  );
}

function StatChip({ label, val, sub }) {
  return (
    <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <p className="text-[10px] text-ink-600 font-arabic mb-1">{label}</p>
      <p className="text-lg font-bold font-mono" style={{ color: 'var(--accent)' }}>{val}</p>
      {sub != null && <p className="text-[10px] font-mono text-ink-700">معتمد: {sub}</p>}
    </div>
  );
}

function ActionBtn({ onClick, loading, disabled, variant = 'default', children }) {
  const variants = {
    default: 'border-ink-700/60 text-ink-400 hover:border-sand-700/50 hover:text-sand-300',
    primary: 'border-sand-700/60 text-sand-300 hover:border-sand-600/60 hover:text-sand-200',
    red:     'border-red-800/60 text-red-400 hover:border-red-700/60',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono border transition-all
        ${variants[variant]} ${loading || disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {loading && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ─── Subject row ──────────────────────────────────────────────────────────────

function SubjectRow({ s, onPublish }) {
  const [expanded, setExpanded] = useState(false);
  const [busy,     setBusy]     = useState(false);

  const handlePublish = async () => {
    setBusy(true);
    await onPublish(s.id);
    setBusy(false);
  };

  const relativeTime = (iso) => {
    if (!iso) return null;
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)   return 'الآن';
    if (m < 60)  return `منذ ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24)  return `منذ ${h} ساعة`;
    const d = Math.floor(h / 24);
    return `منذ ${d} يوم`;
  };

  const borderColor = !s.isPublishable
    ? 'rgba(255,255,255,0.05)'
    : s.isPublished
      ? 'rgba(212,137,30,0.15)'
      : 'rgba(255,255,255,0.07)';

  return (
    <div
      className="rounded-xl border transition-all duration-200 overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor }}
    >
      {/* Row header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="text-ink-700 text-xs font-mono shrink-0">{expanded ? '▾' : '▸'}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-arabic text-sm font-semibold text-ink-200">{s.nameAr}</span>
            <TrackBadge track={s.track} />
            {s.isMajor && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-sand-800/40 text-sand-600">رئيسي</span>
            )}
            <AppStatusBadge isPublished={s.isPublished} appVersion={s.appVersion} />
          </div>
          {s.isPublished && s.publishedAt && (
            <p className="text-[10px] font-mono text-ink-600 mt-0.5">{relativeTime(s.publishedAt)}</p>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 shrink-0 text-[10px] font-mono text-ink-600" onClick={(e) => e.stopPropagation()}>
          <span title="دروس معتمدة">
            <span className="text-ink-400">{s.lessons.approved}</span> درس
          </span>
          <span title="أسئلة معتمدة">
            <span className="text-ink-400">{s.questions.approved}</span> سؤال
          </span>
        </div>

        {/* Publish button */}
        <div onClick={(e) => e.stopPropagation()}>
          {s.isPublishable ? (
            <ActionBtn variant="primary" loading={busy} onClick={handlePublish}>
              {busy ? 'جارٍ النشر…' : s.isPublished ? 'نشر تحديث' : 'نشر للتطبيق'}
            </ActionBtn>
          ) : (
            <span className="text-[10px] font-mono text-ink-700 px-2">لا يوجد محتوى معتمد</span>
          )}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatChip label="الدروس"    val={s.lessons.total}   sub={s.lessons.approved}   />
            <StatChip label="الأسئلة"   val={s.questions.total} sub={s.questions.approved} />
            <StatChip label="التغذية"   val={s.feedItems.total} sub={s.feedItems.approved} />
          </div>

          {s.isPublished && (
            <div
              className="p-3 rounded-lg text-[11px] font-mono space-y-1.5"
              style={{ background: 'rgba(212,137,30,0.04)', border: '1px solid rgba(212,137,30,0.12)' }}
            >
              <div className="flex justify-between text-ink-500">
                <span>نسخة التطبيق</span>
                <span className="text-sand-500">v{s.appVersion}</span>
              </div>
              {s.publishedAt && (
                <div className="flex justify-between text-ink-500">
                  <span>آخر نشر</span>
                  <span dir="ltr" className="text-ink-400">{new Date(s.publishedAt).toLocaleString('ar-SA')}</span>
                </div>
              )}
              {s.downloadUrl && (
                <div className="flex justify-between text-ink-500 items-center gap-2">
                  <span>رابط</span>
                  <a
                    href={s.downloadUrl} target="_blank" rel="noopener noreferrer"
                    className="text-sky-500/70 hover:text-sky-400 truncate text-[10px] max-w-[200px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {s.downloadUrl.split('/').pop()}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Feature Flags panel ──────────────────────────────────────────────────────

function FlagsPanel({ flags, onFlagChange }) {
  if (!flags) return null;

  const TOGGLES = [
    { key: 'feedEnabled',      label: 'بطاقات التغذية',    desc: 'شاشة المراجعة بالتكرار المتباعد' },
    { key: 'examModeEnabled',  label: 'وضع الاختبار',       desc: 'محاكاة الامتحانات الكاملة'       },
    { key: 'hotspotEnabled',   label: 'أسئلة HOTSPOT',       desc: 'نوع سؤال تجريبي — غير مكتمل القياس', warn: true },
  ];

  return (
    <div
      className="rounded-xl border mt-6"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <h3 className="text-xs font-mono text-ink-400 uppercase tracking-wider">Feature Flags</h3>
        <p className="text-[11px] text-ink-600 font-arabic mt-0.5">تُحدَّث فوراً — التطبيق يقرأها في كل إطلاق</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {TOGGLES.map(({ key, label, desc, warn }) => (
          <div key={key} className="flex items-center justify-between gap-4">
            <div>
              <p className={`text-sm font-arabic ${warn ? 'text-amber-400/80' : 'text-ink-200'}`}>{label}</p>
              <p className="text-[10px] text-ink-600 font-arabic">{desc}</p>
            </div>
            <button
              onClick={() => onFlagChange(key, !flags[key])}
              className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 transition-colors duration-200 ${
                flags[key]
                  ? 'border-sand-600 bg-sand-700/60'
                  : 'border-ink-700 bg-ink-800/60'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-current transition-transform duration-200 ${
                  flags[key] ? 'translate-x-4 text-sand-300' : 'translate-x-0 text-ink-600'
                }`}
              />
            </button>
          </div>
        ))}

        {/* Announcement banner */}
        <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-arabic text-ink-400 mb-2">إعلان في التطبيق</p>
          <div className="flex gap-2 items-start">
            <textarea
              dir="rtl"
              value={flags.announcementBanner || ''}
              onChange={(e) => onFlagChange('announcementBanner', e.target.value || null)}
              placeholder="نص الإعلان… (اتركه فارغاً لإخفائه)"
              rows={2}
              className="flex-1 bg-ink-900/60 border border-ink-800/80 rounded-lg px-3 py-2 text-sm font-arabic text-ink-200 placeholder:text-ink-700 focus:outline-none focus:border-sand-800/60 resize-none"
            />
          </div>
        </div>

        {/* Visible subject IDs */}
        <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          <p className="text-xs font-arabic text-ink-400 mb-1">مواد مرئية في التطبيق</p>
          <p className="text-[10px] text-ink-600 font-arabic mb-2">
            فارغ = جميع المواد مرئية. أدخل المعرّفات مفصولة بفواصل للإطلاق التدريجي.
          </p>
          <input
            dir="ltr"
            value={(flags.visibleSubjectIds || []).join(', ')}
            onChange={(e) => {
              const ids = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
              onFlagChange('visibleSubjectIds', ids);
            }}
            placeholder="PHYSICS, CHEMISTRY, ARABIC"
            className="w-full bg-ink-900/60 border border-ink-800/80 rounded-lg px-3 py-2 text-sm font-mono text-ink-300 placeholder:text-ink-700 focus:outline-none focus:border-sand-800/60"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export function PublishSection() {
  const [subjects,  setSubjects]  = useState([]);
  const [flags,     setFlags]     = useState(null);
  const [manifest,  setManifest]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [toast,     setToast]     = useState(null);
  const [flagsDirty, setFlagsDirty] = useState(false);
  const [savingFlags, setSavingFlags] = useState(false);
  const [filter,    setFilter]    = useState('all');

  const showToast = (msg, isErr = false) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/content/publish/status');
      const data = await res.json();
      if (data.ok) {
        setSubjects(data.subjects || []);
        setManifest(data.manifest || null);
        setFlags(data.manifest?.featureFlags || null);
      } else {
        setError(data.error || 'خطأ غير معروف');
      }
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePublish = async (subjectId) => {
    try {
      const res  = await fetch('/api/content/publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subjectId }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast(`✓ نُشر ${subjectId} — نسخة ${data.version} (${data.stats.lessons} درس، ${data.stats.questions} سؤال)`);
        await load();
      } else {
        showToast(data.error || 'فشل النشر', true);
      }
    } catch {
      showToast('تعذّر الاتصال', true);
    }
  };

  const handleFlagChange = (key, value) => {
    setFlags((prev) => ({ ...prev, [key]: value }));
    setFlagsDirty(true);
  };

  const saveFlags = async () => {
    setSavingFlags(true);
    try {
      const res  = await fetch('/api/content/flags', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(flags),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✓ تم حفظ الإعدادات');
        setFlagsDirty(false);
      } else {
        showToast(data.error || 'فشل الحفظ', true);
      }
    } catch {
      showToast('تعذّر الاتصال', true);
    } finally {
      setSavingFlags(false);
    }
  };

  // Filter helpers
  const publishedCount    = subjects.filter((s) => s.isPublished).length;
  const unpublishedCount  = subjects.filter((s) => s.isPublishable && !s.isPublished).length;
  const emptyCount        = subjects.filter((s) => !s.isPublishable).length;

  const FILTERS = [
    { key: 'all',         label: 'الكل',          count: subjects.length },
    { key: 'published',   label: 'منشور',         count: publishedCount  },
    { key: 'unpublished', label: 'جاهز للنشر',    count: unpublishedCount },
    { key: 'empty',       label: 'بدون محتوى',    count: emptyCount       },
  ];

  const displayed = subjects.filter((s) => {
    if (filter === 'published')   return s.isPublished;
    if (filter === 'unpublished') return s.isPublishable && !s.isPublished;
    if (filter === 'empty')       return !s.isPublishable;
    return true;
  });

  return (
    <div>
      <SectionHeader
        title="نشر للتطبيق"
        description="نشر المحتوى المعتمد مباشرة إلى تطبيق بشير بدون تحديث متجر"
      >
        <div className="flex items-center gap-2">
          {flagsDirty && (
            <ActionBtn variant="primary" loading={savingFlags} onClick={saveFlags}>
              {savingFlags ? 'جارٍ الحفظ…' : 'حفظ الإعدادات ●'}
            </ActionBtn>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="text-xs font-mono text-ink-500 hover:text-ink-300 transition-colors px-3 py-1.5 rounded-lg border border-ink-800/60 hover:border-ink-700/60"
          >
            ↻ تحديث
          </button>
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        {loading ? (
          <div className="flex items-center gap-3 text-ink-500 text-sm py-12">
            <span className="inline-block w-4 h-4 border-2 border-ink-700 border-t-sand-400 rounded-full animate-spin" />
            <span className="font-arabic">جارٍ التحميل…</span>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-400 font-arabic text-sm mb-3">{error}</p>
            <button
              onClick={load}
              className="text-xs font-mono text-ink-500 hover:text-ink-300 px-4 py-2 rounded-lg border border-ink-800"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {[
                { label: 'منشور',        val: publishedCount,   color: 'text-sand-400'  },
                { label: 'جاهز للنشر',  val: unpublishedCount, color: 'text-green-400' },
                { label: 'بدون محتوى',  val: emptyCount,       color: 'text-ink-600'   },
                { label: 'الإجمالي',    val: subjects.length,  color: 'text-ink-300'   },
              ].map(({ label, val, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-800/50 bg-ink-900/30"
                >
                  <span className={`text-base font-mono font-bold ${color}`}>{val}</span>
                  <span className="text-xs text-ink-600 font-arabic">{label}</span>
                </div>
              ))}

              {/* Manifest info */}
              {manifest?.updatedAt && (
                <div className="mr-auto flex items-center gap-1.5 text-[10px] font-mono text-ink-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-sand-600/60 inline-block" />
                  manifest {new Date(manifest.updatedAt).toLocaleDateString('ar-SA')}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 mb-5 flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${
                    filter === f.key
                      ? 'bg-sand-800/40 text-sand-300 border border-sand-700/50'
                      : 'text-ink-500 hover:text-ink-300 border border-ink-800/60'
                  }`}
                >
                  {f.label}
                  <span className="font-mono text-[10px] opacity-60">{f.count}</span>
                </button>
              ))}
            </div>

            {/* Subject rows */}
            <div className="space-y-2">
              {displayed.map((s) => (
                <SubjectRow key={s.id} s={s} onPublish={handlePublish} />
              ))}
              {displayed.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-ink-600 text-sm font-arabic">لا توجد مواد في هذه الفئة</p>
                </div>
              )}
            </div>

            {/* Feature flags */}
            <FlagsPanel flags={flags} onFlagChange={handleFlagChange} />
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-mono shadow-2xl z-50 max-w-sm text-center"
          style={{
            background:    'rgba(14,12,9,0.96)',
            border:        `1px solid ${toast.isErr ? 'rgba(239,68,68,0.4)' : 'rgba(212,137,30,0.3)'}`,
            color:          toast.isErr ? '#f87171' : 'var(--accent)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from './ui/shared';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusBadge({ seeded, missingUnits, missingLessons, staleUnits, staleLessons, catalogError }) {
  if (catalogError) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-red-800/60 bg-red-950/40 text-red-400">خطأ</span>
  );
  if (!seeded) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-ink-700/60 bg-ink-900/40 text-ink-500">فارغ</span>
  );
  const hasIssues = missingUnits > 0 || missingLessons > 0 || staleUnits > 0 || staleLessons > 0;
  if (hasIssues) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-amber-800/60 bg-amber-950/40 text-amber-400">ناقص</span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-green-800/60 bg-green-950/40 text-green-400">مكتمل</span>
  );
}

function TrackBadge({ track }) {
  const styles = { COMMON: 'border-sky-800/50 text-sky-400/80', SCIENCE: 'border-emerald-800/50 text-emerald-400/80', LITERARY: 'border-purple-800/50 text-purple-400/80' };
  const labels = { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${styles[track] || 'border-ink-700 text-ink-500'}`}>
      {labels[track] || track}
    </span>
  );
}
  {s.source === 'atlas' && (
    <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-purple-800/40 text-purple-500/70">
      TEST
    </span>
  )}

function Bar({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#d4891e' }} />
    </div>
  );
}

function ActionBtn({ onClick, loading, disabled, variant = 'default', children }) {
  const variants = {
    default: 'border-ink-700/60 text-ink-400 hover:border-sand-700/50 hover:text-sand-300',
    green:   'border-green-800/60 text-green-400 hover:border-green-700/60',
    amber:   'border-amber-800/60 text-amber-400 hover:border-amber-700/60',
    red:     'border-red-800/60 text-red-400 hover:border-red-700/60',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${variants[variant]} ${loading || disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {loading && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ─── Seed Subject Row ──────────────────────────────────────────────────────────

function SubjectRow({ s, onAction }) {
  const [busy, setBusy]           = useState(null);
  const [expanded, setExpanded]   = useState(false);
  const [confirmWipe, setConfirm] = useState(false);

  const run = async (action) => {
    setBusy(action);
    await onAction(s.id, action);
    setBusy(null);
    setConfirm(false);
  };

  const hasStale   = s.staleUnits > 0 || s.staleLessons > 0;
  const hasMissing = s.missingUnits > 0 || s.missingLessons > 0;

  return (
    <div
      className="rounded-xl border transition-all duration-200 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.015)',
        borderColor: s.catalogError ? 'rgba(239,68,68,0.25)' : s.seeded && !hasMissing && !hasStale ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setExpanded((v) => !v)}>
        <span className="text-ink-700 text-xs font-mono shrink-0">{expanded ? '▾' : '▸'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-arabic text-sm font-semibold text-ink-200">{s.nameAr}</span>
            <TrackBadge track={s.track} />
            {s.isMajor && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-sand-800/40 text-sand-600">رئيسي</span>}
            <StatusBadge {...s} />
          </div>
          <div className="flex items-center gap-3">
            <Bar value={s.dbLessons} max={s.expectedLessons} />
            <span className="text-[10px] font-mono text-ink-600 shrink-0 w-12 text-left" dir="ltr">{s.dbLessons}/{s.expectedLessons}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {s.source !== 'atlas' && !s.seeded && !s.catalogError && (
            <ActionBtn variant="green" loading={busy === 'bootstrap'} onClick={() => run('bootstrap')}>بذر</ActionBtn>
          )}
          {s.source !== 'atlas' && s.seeded && hasMissing && (
            <ActionBtn variant="amber" loading={busy === 'bootstrap'} onClick={() => run('bootstrap')}>إكمال</ActionBtn>
          )}
          {s.source !== 'atlas' && hasStale && (
            <ActionBtn variant="red" loading={busy === 'wipe_stale'} onClick={() => run('wipe_stale')}>حذف قديم</ActionBtn>
          )}
          {s.source === 'atlas' && (
            <span className="text-[9px] px-2 py-0.5 rounded font-mono border border-purple-800/40 text-purple-500/70">DEV</span>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {s.catalogError && (
            <p className="text-xs text-red-400 font-arabic mb-3 py-2 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {s.catalogError}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'الوحدات', db: s.dbUnits,         expected: s.expectedUnits   },
              { label: 'الدروس',  db: s.dbLessons,       expected: s.expectedLessons },
              { label: 'معتمد',   db: s.approvedLessons, expected: s.dbLessons       },
            ].map(({ label, db, expected }) => (
              <div key={label} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-ink-600 font-arabic mb-1">{label}</p>
                <p className="text-lg font-bold font-mono" style={{ color: 'var(--accent)' }}>{db}</p>
                {expected > 0 && <p className="text-[10px] font-mono text-ink-700">/ {expected}</p>}
              </div>
            ))}
          </div>

          {(hasMissing || hasStale) && (
            <div className="space-y-1.5 mb-4">
              {s.missingUnits   > 0 && <p className="text-[11px] font-arabic text-amber-400/80">◎ {s.missingUnits} وحدة ناقصة</p>}
              {s.missingLessons > 0 && <p className="text-[11px] font-arabic text-amber-400/80">◎ {s.missingLessons} درس ناقص</p>}
              {s.staleUnits     > 0 && <p className="text-[11px] font-arabic text-red-400/80">✕ {s.staleUnits} وحدة قديمة</p>}
              {s.staleLessons   > 0 && <p className="text-[11px] font-arabic text-red-400/80">✕ {s.staleLessons} درس قديم</p>}
              
            </div>
          )}
          {s.source === 'atlas' && (
            <div className="mb-4 rounded-lg px-3 py-2.5 text-[11px] font-arabic text-sky-400/80"
              style={{ background: 'rgba(56,189,248,0.04)', border: '1px solid rgba(56,189,248,0.12)' }}>
              مادة تجريبية — أضف وحدات ودروساً من قسم «إدارة المنهج» في لوحة التحكم.
            </div>
          )}

          <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <p className="text-[10px] font-mono text-red-500/60 mb-2 uppercase tracking-wider">منطقة الخطر</p>
            <div className="flex gap-2 flex-wrap">
              {s.seeded && (
                <ActionBtn variant="amber" loading={busy === 'reseed'} onClick={() => run('reseed')}>إعادة بذر</ActionBtn>
              )}
              {confirmWipe ? (
                <>
                  <ActionBtn variant="red" loading={busy === 'wipe'} onClick={() => run('wipe')}>تأكيد المسح الكامل</ActionBtn>
                  <ActionBtn onClick={() => setConfirm(false)}>إلغاء</ActionBtn>
                </>
              ) : (
                <ActionBtn variant="red" onClick={() => setConfirm(true)}>مسح كامل…</ActionBtn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── SeedSection (main export) ────────────────────────────────────────────────

export function SeedSection() {
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [busyAll,  setBusyAll]  = useState(false);
  const [filter,   setFilter]   = useState('all');

  const showToast = (msg, isErr = false) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/seed');
      const data = await res.json();
      if (data.ok) setSubjects(data.subjects || []);
      else setError(data.error || 'خطأ غير معروف');
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async (subjectId, action) => {
    try {
      const res  = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subjectId }),
      });
      const data = await res.json();
      if (data.ok) { showToast('تمّ ✓'); await load(); }
      else showToast(data.error || 'حدث خطأ', true);
    } catch {
      showToast('تعذّر الاتصال', true);
    }
  };

  const bootstrapAll = async () => {
    setBusyAll(true);
    try {
      const res  = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bootstrap_all' }),
      });
      const data = await res.json();
      const errs = data.results?.filter((r) => !r.ok).length ?? 0;
      showToast(errs > 0 ? `اكتمل مع ${errs} أخطاء` : 'تمّ بذر الكل ✓', errs > 0);
      await load();
    } catch {
      showToast('تعذّر الاتصال', true);
    } finally {
      setBusyAll(false);
    }
  };

  const seededCount = subjects.filter((s) => s.seeded).length;
  const emptyCount  = subjects.filter((s) => !s.seeded).length;
  const issueCount  = subjects.filter((s) => s.seeded && (s.missingUnits > 0 || s.missingLessons > 0 || s.staleUnits > 0 || s.staleLessons > 0 || s.catalogError)).length;

  const FILTERS = [
    { key: 'all',    label: 'الكل',  count: subjects.length },
    { key: 'empty',  label: 'فارغ',  count: emptyCount      },
    { key: 'issues', label: 'مشاكل', count: issueCount      },
    { key: 'ok',     label: 'سليم',  count: seededCount - issueCount },
  ];

  const displayed = subjects.filter((s) => {
    if (filter === 'empty')  return !s.seeded;
    if (filter === 'issues') return s.catalogError || (s.seeded && (s.missingUnits > 0 || s.missingLessons > 0 || s.staleUnits > 0 || s.staleLessons > 0));
    if (filter === 'ok')     return s.seeded && !s.catalogError && !s.missingUnits && !s.missingLessons && !s.staleUnits && !s.staleLessons;
    return true;
  });

  return (
    <div>
      <SectionHeader title="إدارة البذر" description="مراقبة حالة المنهج وبذر المواد الأساسية في قاعدة البيانات">
        <button onClick={load} disabled={loading}
          className="text-xs font-mono text-ink-500 hover:text-ink-300 transition-colors px-3 py-1.5 rounded-lg border border-ink-800/60 hover:border-ink-700/60">
          ↻ تحديث
        </button>
      </SectionHeader>

      <div className="px-8 pb-4">
        {loading ? (
          <div className="flex items-center gap-3 text-ink-500 text-sm py-12">
            <span className="inline-block w-4 h-4 border-2 border-ink-700 border-t-sand-400 rounded-full animate-spin" />
            <span className="font-arabic">جارٍ التحميل…</span>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-400 font-arabic text-sm mb-3">{error}</p>
            <button onClick={load} className="text-xs font-mono text-ink-500 hover:text-ink-300 px-4 py-2 rounded-lg border border-ink-800">
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {[
                { label: 'مبذور',    val: seededCount - issueCount, color: 'text-green-400' },
                { label: 'مشاكل',    val: issueCount,               color: 'text-amber-400' },
                { label: 'فارغ',     val: emptyCount,               color: 'text-ink-500'   },
                { label: 'الإجمالي', val: subjects.length,          color: 'text-ink-300'   },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-800/50 bg-ink-900/30">
                  <span className={`text-base font-mono font-bold ${color}`}>{val}</span>
                  <span className="text-xs text-ink-600 font-arabic">{label}</span>
                </div>
              ))}
              <div className="mr-auto">
                <button onClick={bootstrapAll} disabled={busyAll || emptyCount === 0}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-arabic border transition-all border-sand-800/50 text-sand-400 hover:border-sand-700/60 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed">
                  {busyAll && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
                  بذر الجميع
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 mb-5 flex-wrap">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${
                    filter === f.key ? 'bg-sand-800/40 text-sand-300 border border-sand-700/50' : 'text-ink-500 hover:text-ink-300 border border-ink-800/60'
                  }`}>
                  {f.label}
                  <span className="font-mono text-[10px] opacity-60">{f.count}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {displayed.map((s) => <SubjectRow key={s.id} s={s} onAction={runAction} />)}
              {displayed.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-ink-600 text-sm font-arabic">لا يوجد مواد في هذه الفئة</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>


      <div className="pb-8" />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-mono shadow-2xl z-50"
          style={{ background: 'rgba(14,12,9,0.96)', border: `1px solid ${toast.isErr ? 'rgba(239,68,68,0.4)' : 'rgba(212,137,30,0.3)'}`, color: toast.isErr ? '#f87171' : 'var(--accent)', backdropFilter: 'blur(16px)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
'use client';
import { useState, useEffect, useCallback } from 'react';
import { SUBJECTS_CATALOG, TRACK_CONFIG }   from '../constants';
import { SectionHeader }                     from './ui/shared';

// ─── helpers ──────────────────────────────────────────────────────────────────

const TRACK_ORDER = ['COMMON', 'SCIENCE', 'LITERARY'];

function healthStatus(s) {
  if (s.catalogError)                                              return 'error';
  if (!s.seeded)                                                   return 'empty';
  if (s.staleUnits > 0 || s.staleLessons > 0)                     return 'stale';
  if (s.missingUnits > 0 || s.missingLessons > 0)                 return 'partial';
  if (s.dbUnits === s.expectedUnits && s.dbLessons === s.expectedLessons) return 'ok';
  return 'partial';
}

const STATUS_CFG = {
  ok:      { label: 'مكتمل',   dot: 'bg-green-500',  pill: 'bg-green-900/20 text-green-400 border-green-800/30'  },
  partial: { label: 'ناقص',    dot: 'bg-amber-400',  pill: 'bg-amber-900/20 text-amber-400 border-amber-800/30'  },
  stale:   { label: 'قديم',    dot: 'bg-orange-500', pill: 'bg-orange-900/20 text-orange-400 border-orange-800/30'},
  empty:   { label: 'فارغ',    dot: 'bg-ink-700',    pill: 'bg-ink-800/60 text-ink-500 border-ink-700/30'        },
  error:   { label: 'خطأ',     dot: 'bg-red-500',    pill: 'bg-red-900/20 text-red-400 border-red-800/30'        },
};

// ─── Confirm overlay ──────────────────────────────────────────────────────────

function ConfirmDialog({ msg, onConfirm, onCancel, danger = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-ink-900 border border-ink-700/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <p className="text-sm text-sand-300 font-arabic leading-relaxed mb-6">{msg}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-lg text-xs font-mono font-semibold transition-all ${
              danger
                ? 'bg-red-900/50 hover:bg-red-800/60 border border-red-800/40 text-red-400'
                : 'bg-green-900/40 hover:bg-green-800/50 border border-green-700/40 text-green-400'
            }`}
          >
            تأكيد
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-xs font-mono border border-ink-700/50 text-ink-400 hover:text-ink-200 hover:border-ink-600 transition-all"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subject row ──────────────────────────────────────────────────────────────

function SubjectRow({ s, onAction, busy }) {
  const status  = healthStatus(s);
  const cfg     = STATUS_CFG[status];
  const trackCfg = TRACK_CONFIG[s.track] ?? {};

  const unitPct   = s.expectedUnits   ? Math.round((s.dbUnits   / s.expectedUnits)   * 100) : 0;
  const lessonPct = s.expectedLessons ? Math.round((s.dbLessons / s.expectedLessons) * 100) : 0;

  return (
    <div className={`group rounded-xl border transition-all ${
      status === 'ok'    ? 'border-ink-800/40 bg-ink-950/20' :
      status === 'stale' ? 'border-orange-900/30 bg-orange-950/10' :
      status === 'error' ? 'border-red-900/30 bg-red-950/10' :
      status === 'empty' ? 'border-ink-800/30 bg-ink-950/10' :
                           'border-amber-900/30 bg-amber-950/10'
    }`}>
      {/* ── Main row ── */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Status dot */}
        <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

        {/* Subject info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-arabic font-semibold text-sand-300">{s.nameAr}</span>
            <span className="text-[9px] font-mono text-ink-600">{s.id}</span>
            {s.isMajor && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-ink-800/60 border border-ink-700/30 text-ink-500">تخصص</span>
            )}
            <span className={`text-[9px] font-arabic px-1.5 py-0.5 rounded border ${trackCfg.badge}`}>
              {trackCfg.label}
            </span>
          </div>

          {/* Progress bars */}
          {s.seeded && (
            <div className="mt-1.5 flex items-center gap-4">
              {/* Units */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-ink-600 w-8">وحدات</span>
                <div className="w-20 h-1 rounded-full bg-ink-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${unitPct}%`, background: unitPct === 100 ? '#22c55e' : unitPct > 50 ? '#f59e0b' : '#f97316' }}
                  />
                </div>
                <span className="text-[9px] font-mono text-ink-500 tabular-nums">
                  {s.dbUnits}/{s.expectedUnits}
                </span>
                {s.staleUnits > 0 && (
                  <span className="text-[9px] font-mono text-orange-500">+{s.staleUnits} قديم</span>
                )}
              </div>
              {/* Lessons */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono text-ink-600 w-8">دروس</span>
                <div className="w-20 h-1 rounded-full bg-ink-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${lessonPct}%`, background: lessonPct === 100 ? '#22c55e' : lessonPct > 50 ? '#f59e0b' : '#f97316' }}
                  />
                </div>
                <span className="text-[9px] font-mono text-ink-500 tabular-nums">
                  {s.dbLessons}/{s.expectedLessons}
                </span>
                {s.staleLessons > 0 && (
                  <span className="text-[9px] font-mono text-orange-500">+{s.staleLessons} قديم</span>
                )}
              </div>
              {/* Approved lessons */}
              {s.approvedLessons > 0 && (
                <span className="text-[9px] font-mono text-green-500 tabular-nums">
                  ✓ {s.approvedLessons} معتمد
                </span>
              )}
            </div>
          )}

          {/* Catalog error */}
          {s.catalogError && (
            <p className="text-[10px] font-mono text-red-400 mt-1">{s.catalogError}</p>
          )}
        </div>

        {/* Status pill */}
        <span className={`hidden sm:inline-flex text-[10px] font-arabic px-2 py-0.5 rounded-full border shrink-0 ${cfg.pill}`}>
          {cfg.label}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Bootstrap — always show if there's something missing */}
          {(status === 'empty' || status === 'partial' || status === 'stale') && !s.catalogError && (
            <ActionBtn
              label={s.seeded ? '+ إضافة المفقود' : '⬇ تهيئة'}
              title="تهيئة الوحدات والدروس المفقودة فقط"
              busy={busy === s.id + ':bootstrap'}
              onClick={() => onAction('bootstrap', s)}
              variant="green"
            />
          )}

          {/* Wipe stale — only when there are stale IDs */}
          {(s.staleUnits > 0 || s.staleLessons > 0) && (
            <ActionBtn
              label="حذف القديمة"
              title={`حذف ${s.staleUnits} وحدة و ${s.staleLessons} درس قديم من قاعدة البيانات`}
              busy={busy === s.id + ':wipe_stale'}
              onClick={() => onAction('wipe_stale', s)}
              variant="orange"
            />
          )}

          {/* Reseed — wipe + fresh bootstrap */}
          {s.seeded && (
            <ActionBtn
              label="⟳ إعادة التهيئة"
              title="حذف الوحدات والدروس ثم إعادة التهيئة من المنهج"
              busy={busy === s.id + ':reseed'}
              onClick={() => onAction('reseed', s)}
              variant="amber"
              danger
            />
          )}

          {/* Wipe all */}
          {s.seeded && (
            <ActionBtn
              label="✕ حذف الكل"
              title="حذف جميع البيانات لهذه المادة بما فيها المحتوى"
              busy={busy === s.id + ':wipe'}
              onClick={() => onAction('wipe', s)}
              variant="red"
              danger
            />
          )}
        </div>
      </div>

      {/* Stale IDs detail — shown when stale records exist */}
      {(s.staleUnits > 0 || s.staleLessons > 0) && (
        <div className="px-4 pb-3 border-t border-ink-800/30 pt-2">
          <p className="text-[10px] font-mono text-orange-400 mb-1">معرّفات قديمة في قاعدة البيانات (ليست في المنهج الحالي):</p>
          <div className="flex flex-wrap gap-1">
            {[...s.staleUnitIds, ...s.staleLessonIds].slice(0, 12).map((id) => (
              <span key={id} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-orange-900/20 border border-orange-900/30 text-orange-500">
                {id}
              </span>
            ))}
            {(s.staleUnitIds.length + s.staleLessonIds.length) > 12 && (
              <span className="text-[9px] font-mono text-ink-600">
                +{s.staleUnitIds.length + s.staleLessonIds.length - 12} أخرى
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, title, busy, onClick, variant = 'ghost', danger = false }) {
  const V = {
    green:  'bg-green-900/30 hover:bg-green-900/50 border-green-800/40 text-green-400',
    amber:  'bg-amber-900/25 hover:bg-amber-900/40 border-amber-800/30 text-amber-400',
    orange: 'bg-orange-900/25 hover:bg-orange-900/40 border-orange-800/30 text-orange-400',
    red:    'bg-red-900/20 hover:bg-red-900/40 border-red-800/30 text-red-400',
    ghost:  'bg-ink-800/40 hover:bg-ink-700/40 border-ink-700/40 text-ink-400',
  };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={title}
      className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-arabic font-medium transition-all disabled:opacity-40 whitespace-nowrap ${V[variant]}`}
    >
      {busy ? <span className="font-mono animate-pulse">···</span> : label}
    </button>
  );
}

// ─── SeedSection ──────────────────────────────────────────────────────────────

export function SeedSection() {
  const [subjects,  setSubjects]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [busy,      setBusy]      = useState(null);    // '<subjectId>:<action>'
  const [busyAll,   setBusyAll]   = useState(false);
  const [confirm,   setConfirm]   = useState(null);    // { action, subject, msg, danger }
  const [toast,     setToast]     = useState(null);    // { msg, ok }
  const [filter,    setFilter]    = useState('all');   // 'all' | 'issues' | track

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/admin/seed');
      const json = await res.json();
      if (json.ok) setSubjects(json.subjects);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Flash a toast for 3s
  function flash(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // Execute a seed action
  async function execute(action, subjectId) {
    const key = `${subjectId}:${action}`;
    setBusy(key);
    try {
      const res  = await fetch('/api/admin/seed', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action, subjectId }),
      });
      const json = await res.json();
      if (json.ok) {
        const r = json.result;
        flash(
          action === 'wipe'
            ? `تم حذف بيانات المادة`
          : action === 'wipe_stale'
            ? `تم حذف ${r.deletedUnits} وحدة و ${r.deletedLessons} درس قديم`
          : action === 'reseed'
            ? `إعادة تهيئة — ${r.unitsCreated} وحدة، ${r.lessonsCreated} درس`
          : `تهيئة — ${r.unitsCreated} وحدة جديدة، ${r.lessonsCreated} درس جديد`
        );
        await load();
      } else {
        flash(json.error || 'حدث خطأ', false);
      }
    } catch {
      flash('تعذّر الاتصال بالخادم', false);
    } finally {
      setBusy(null);
    }
  }

  // Called from SubjectRow — may require confirmation
  function onAction(action, subject) {
    const dangerActions = { wipe: true, reseed: true, wipe_stale: true };
    const msgs = {
      wipe:       `سيتم حذف جميع بيانات "${subject.nameAr}" من قاعدة البيانات بما فيها الدروس والمحتوى. هذا الإجراء لا يمكن التراجع عنه.`,
      reseed:     `سيتم حذف الوحدات والدروس فقط لمادة "${subject.nameAr}" ثم إعادة تهيئتها من المنهج. لا يمكن المتابعة إن وُجدت دروس معتمدة.`,
      wipe_stale: `سيتم حذف ${subject.staleUnits} وحدة و ${subject.staleLessons} درس لا تنتمي للمنهج الحالي من مادة "${subject.nameAr}".`,
    };
    if (dangerActions[action]) {
      setConfirm({ action, subjectId: subject.id, msg: msgs[action], danger: action === 'wipe' });
    } else {
      execute(action, subject.id);
    }
  }

  // Seed all subjects
  async function seedAll() {
    setBusyAll(true);
    try {
      const res  = await fetch('/api/admin/seed', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'bootstrap_all' }),
      });
      const json = await res.json();
      if (json.ok) {
        const ok  = json.results.filter((r) => r.ok);
        const bad = json.results.filter((r) => !r.ok);
        flash(`تهيئة جميع المواد: ${ok.length} نجح${bad.length ? `، ${bad.length} فشل` : ''}`);
        await load();
      }
    } catch {
      flash('تعذّر الاتصال بالخادم', false);
    } finally {
      setBusyAll(false);
    }
  }

  // Filtered view
  const filterOptions = [
    { id: 'all',    label: 'الكل' },
    { id: 'issues', label: 'تحتاج انتباه' },
    { id: 'COMMON',   label: 'مشترك' },
    { id: 'SCIENCE',  label: 'علمي' },
    { id: 'LITERARY', label: 'أدبي' },
  ];

  const displayed = subjects.filter((s) => {
    if (filter === 'issues') return healthStatus(s) !== 'ok';
    if (filter === 'all')    return true;
    return s.track === filter;
  });

  // Summary stats
  const total    = subjects.length;
  const seeded   = subjects.filter((s) => healthStatus(s) === 'ok').length;
  const issues   = subjects.filter((s) => !['ok', 'empty'].includes(healthStatus(s))).length;
  const empty    = subjects.filter((s) => healthStatus(s) === 'empty').length;

  return (
    <div>
      {/* ── Header ── */}
      <SectionHeader title="إدارة البذر" description="مزامنة قاعدة البيانات مع منهج curriculum.js — تهيئة، إعادة تهيئة، تنظيف">
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          {/* Summary chips */}
          <div className="flex items-center gap-2">
            <Chip label={`${seeded}/${total} مكتمل`}  color="green" />
            {issues > 0 && <Chip label={`${issues} تحتاج انتباه`} color="amber" />}
            {empty  > 0 && <Chip label={`${empty} فارغ`}          color="ink"   />}
          </div>

          <div className="flex-1" />

          {/* Seed all */}
          <button
            onClick={seedAll}
            disabled={busyAll || loading}
            className="px-3 py-2 rounded-lg border border-green-800/40 bg-green-900/20 text-green-400 text-xs font-arabic font-medium hover:bg-green-900/30 transition-all disabled:opacity-40"
          >
            {busyAll ? <span className="font-mono animate-pulse">···</span> : '⬇ تهيئة جميع المواد'}
          </button>

          {/* Refresh */}
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-lg border border-ink-700/50 text-ink-500 hover:text-ink-300 text-xs font-mono transition-all disabled:opacity-40"
          >
            {loading ? '···' : '↺ تحديث'}
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mt-3 flex items-center gap-1">
          {filterOptions.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-[11px] font-arabic transition-all ${
                filter === f.id
                  ? 'bg-ink-800 text-sand-300 border border-ink-700/60'
                  : 'text-ink-600 hover:text-ink-400'
              }`}
            >
              {f.label}
              {f.id === 'issues' && issues > 0 && (
                <span className="ml-1 text-amber-500">{issues}</span>
              )}
            </button>
          ))}
        </div>
      </SectionHeader>

      {/* ── Body ── */}
      <div className="px-8 pb-12">
        {loading ? (
          <div className="text-center py-24 text-ink-700 font-mono text-xs tracking-widest animate-pulse">LOADING...</div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16 text-ink-600 font-arabic text-sm">لا توجد مواد تطابق الفلتر</div>
        ) : (
          <>
            {/* Group by track */}
            {TRACK_ORDER.map((track) => {
              const trackSubjects = displayed.filter((s) => s.track === track);
              if (!trackSubjects.length) return null;
              const trackCfg = TRACK_CONFIG[track];
              return (
                <div key={track} className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[11px] font-arabic font-semibold ${trackCfg.color}`}>
                      {trackCfg.label}
                    </span>
                    <div className="flex-1 h-px bg-ink-800/50" />
                    <span className="text-[10px] font-mono text-ink-700">{trackSubjects.length} مادة</span>
                  </div>
                  <div className="space-y-2">
                    {trackSubjects
                      .sort((a, b) => a.order - b.order)
                      .map((s) => (
                        <SubjectRow
                          key={s.id}
                          s={s}
                          onAction={onAction}
                          busy={busy}
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Confirm dialog ── */}
      {confirm && (
        <ConfirmDialog
          msg={confirm.msg}
          danger={confirm.danger}
          onConfirm={() => {
            execute(confirm.action, confirm.subjectId);
            setConfirm(null);
          }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl border shadow-2xl text-sm font-arabic transition-all ${
          toast.ok
            ? 'bg-green-900/80 border-green-700/60 text-green-300'
            : 'bg-red-900/70 border-red-700/50 text-red-300'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ─── tiny chip ────────────────────────────────────────────────────────────────
function Chip({ label, color }) {
  const C = {
    green: 'bg-green-900/20 border-green-800/30 text-green-400',
    amber: 'bg-amber-900/20 border-amber-800/30 text-amber-400',
    ink:   'bg-ink-800/40 border-ink-700/30 text-ink-500',
  };
  return (
    <span className={`text-[10px] font-arabic px-2 py-0.5 rounded-full border ${C[color]}`}>
      {label}
    </span>
  );
}
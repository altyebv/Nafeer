'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SUBJECTS_CATALOG_REF, TRACK_CONFIG }        from '../constants';
import { SectionHeader, StatusChip, EmptyState, Spinner } from './ui/shared';

// ─── Coverage level config ────────────────────────────────────────────────────

const LVL = {
  high:   { bar: '#22c55e', pill: 'bg-green-900/25 text-green-400 border-green-800/40',   dot: 'bg-green-500'  },
  medium: { bar: '#f59e0b', pill: 'bg-amber-900/25 text-amber-400 border-amber-800/40',   dot: 'bg-amber-400'  },
  low:    { bar: '#f97316', pill: 'bg-orange-900/25 text-orange-400 border-orange-800/40', dot: 'bg-orange-500' },
  none:   { bar: '#2d3748', pill: 'bg-ink-800/40 text-ink-600 border-ink-700/30',          dot: 'bg-ink-700'   },
};

const avgLevel = (avg) => avg >= 80 ? 'high' : avg >= 40 ? 'medium' : avg > 0 ? 'low' : 'none';

// ─── InlineEdit ───────────────────────────────────────────────────────────────

function InlineEdit({ value, placeholder = '', onSave, className = '', inputClassName = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value || '');
  const [saving,  setSaving]  = useState(false);
  const inputRef              = useRef(null);

  useEffect(() => { setDraft(value || ''); }, [value]);

  function startEdit(e) {
    e.stopPropagation();
    setDraft(value || '');
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
  }

  async function commit() {
    const trimmed = draft.trim();
    if (trimmed === (value || '').trim()) { setEditing(false); return; }
    setSaving(true);
    try   { await onSave(trimmed); }
    finally { setSaving(false); setEditing(false); }
  }

  function handleKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        disabled={saving}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKey}
        className={`${inputClassName} bg-ink-900 border border-sand-600/50 rounded-md px-2 py-0.5 text-sand-200 outline-none focus:border-sand-400 transition-colors disabled:opacity-50`}
        style={{ minWidth: '14ch' }}
      />
    );
  }

  return (
    <span
      onClick={startEdit}
      title="انقر للتعديل"
      className={`${className} cursor-text group relative`}
    >
      {value || <span className="italic text-ink-600">{placeholder}</span>}
      <span className="absolute -right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-70 transition-opacity text-ink-600 text-[10px] select-none">✎</span>
    </span>
  );
}

// ─── CoverageBar ──────────────────────────────────────────────────────────────

function CoverageBar({ score, level }) {
  const c = LVL[level] || LVL.none;
  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1 rounded-full bg-ink-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: c.bar }}
        />
      </div>
      <span className="text-[11px] font-mono w-6 text-right tabular-nums" style={{ color: c.bar }}>
        {score}
      </span>
    </div>
  );
}

// ─── AvgBadge ─────────────────────────────────────────────────────────────────

function AvgBadge({ avg }) {
  const l = avgLevel(avg);
  const c = LVL[l];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${c.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {avg}%
    </span>
  );
}

// ─── Group lessons within a unit ─────────────────────────────────────────────

function groupLessons(lessons) {
  const segments = [];
  let current    = null;
  for (const lesson of lessons) {
    const gid = lesson.groupId || null;
    if (!current || current.groupId !== gid) {
      current = { groupId: gid, groupTitle: lesson.groupTitle || null, lessons: [] };
      segments.push(current);
    }
    current.lessons.push(lesson);
  }
  return segments;
}

// ─── SubjectSummaryBar ────────────────────────────────────────────────────────

function SubjectSummaryBar({ data }) {
  if (!data) return null;
  const { totalLessons, approvedLessons, overallAvg, nameAr } = data;
  const pct = totalLessons ? Math.round((approvedLessons / totalLessons) * 100) : 0;
  return (
    <div className="mb-8 rounded-2xl border border-ink-800/60 bg-ink-900/40 p-5 flex flex-wrap items-center gap-6">
      {/* Subject name */}
      <div>
        <p className="text-[10px] font-mono text-ink-600 mb-0.5 uppercase tracking-widest">المادة</p>
        <p className="text-sm font-bold text-sand-300 font-arabic">{nameAr}</p>
      </div>
      <div className="w-px h-8 bg-ink-800/60 shrink-0" />
      {/* Overall coverage */}
      <div>
        <p className="text-[10px] font-mono text-ink-600 mb-0.5 uppercase tracking-widest">التغطية الكلية</p>
        <div className="flex items-center gap-2">
          <div className="w-28 h-1.5 rounded-full bg-ink-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${overallAvg}%`, background: LVL[avgLevel(overallAvg)].bar }}
            />
          </div>
          <AvgBadge avg={overallAvg} />
        </div>
      </div>
      <div className="w-px h-8 bg-ink-800/60 shrink-0" />
      {/* Approval rate */}
      <div>
        <p className="text-[10px] font-mono text-ink-600 mb-0.5 uppercase tracking-widest">الدروس المعتمدة</p>
        <p className="text-sm font-mono text-sand-400">
          <span className="text-green-400">{approvedLessons}</span>
          <span className="text-ink-600"> / {totalLessons}</span>
          <span className="text-ink-700 ml-2 text-xs">({pct}%)</span>
        </p>
      </div>
    </div>
  );
}

// ─── CoverageSection ─────────────────────────────────────────────────────────

export function CoverageSection() {
  const [subjectId, setSubjectId] = useState('');
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [editMode,  setEditMode]  = useState(false);

  // Local optimistic overrides — avoids full reload after a save
  const [unitTitleOverrides,  setUnitTitleOverrides]  = useState({});  // unitId  → string
  const [lessonTitleOverrides, setLessonTitleOverrides] = useState({}); // lessonId → string
  const [groupTitleOverrides,  setGroupTitleOverrides]  = useState({}); // `${unitId}:${groupId}` → string

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch(`/api/coverage/${subjectId}`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setUnitTitleOverrides({});
        setLessonTitleOverrides({});
        setGroupTitleOverrides({});
      } else {
        setData(null);
        setError(json.error || 'فشل تحميل البيانات');
      }
    } catch {
      setData(null);
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  // ── Save helpers ───────────────────────────────────────────────────────────

  async function saveUnitTitle(unitId, mongoId, newTitle) {
    const res  = await fetch(`/api/admin/curriculum/units/${mongoId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newTitle }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'فشل الحفظ');
    setUnitTitleOverrides((p) => ({ ...p, [unitId]: newTitle }));
  }

  async function saveLessonTitle(lessonId, mongoId, newTitle) {
    const res  = await fetch(`/api/admin/curriculum/lessons/${mongoId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newTitle }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'فشل الحفظ');
    setLessonTitleOverrides((p) => ({ ...p, [lessonId]: newTitle }));
  }

  async function saveGroupTitle(groupKey, lessons, newTitle) {
    await Promise.all(
      lessons.map((lesson) =>
        fetch(`/api/admin/curriculum/lessons/${lesson.mongoId}`, {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ groupTitle: newTitle }),
        }).then((r) => r.json()).then((j) => { if (!j.ok) throw new Error(j.error); })
      )
    );
    setGroupTitleOverrides((p) => ({ ...p, [groupKey]: newTitle }));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  // Group subjects by track for the select
  const subjectsByTrack = SUBJECTS_CATALOG_REF.reduce((acc, s) => {
    if (!acc[s.track]) acc[s.track] = [];
    acc[s.track].push(s);
    return acc;
  }, {});

  const TRACK_ORDER  = ['COMMON', 'SCIENCE', 'LITERARY'];
  const TRACK_LABELS = { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' };

  return (
    <div>
      {/* ── Header ── */}
      <SectionHeader title="خريطة التغطية" description="اكتمال المحتوى لكل درس — أقسام، مفاهيم، تغذية، أسئلة">
        <div className="mt-4 flex items-center gap-3 flex-wrap">

          {/* Subject picker */}
          <select
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value); setEditMode(false); setData(null); }}
            className="px-3 py-2 rounded-lg bg-ink-800 border border-ink-700/60 text-sand-200 text-sm font-arabic focus:outline-none focus:border-sand-600 transition-colors min-w-[200px]"
          >
            <option value="">اختر مادة...</option>
            {TRACK_ORDER.map((track) =>
              subjectsByTrack[track] ? (
                <optgroup key={track} label={TRACK_LABELS[track]}>
                  {subjectsByTrack[track].map((s) => (
                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                  ))}
                </optgroup>
              ) : null
            )}
          </select>

          {/* Refresh */}
          {subjectId && (
            <button
              onClick={load}
              disabled={loading}
              className="px-3 py-2 rounded-lg border border-ink-700/50 text-ink-500 hover:text-ink-300 hover:border-ink-600 text-xs font-mono transition-all disabled:opacity-40"
            >
              ↺ تحديث
            </button>
          )}

          {/* Edit toggle */}
          {data && (
            <button
              onClick={() => setEditMode((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                editMode
                  ? 'border-sand-600/60 text-sand-300 bg-sand-900/20'
                  : 'border-ink-700/50 text-ink-500 hover:text-ink-300 hover:border-ink-600'
              }`}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {editMode ? 'إيقاف التعديل' : 'تعديل العناوين'}
            </button>
          )}

          {editMode && (
            <span className="px-2.5 py-1 rounded-full bg-sand-900/25 border border-sand-700/30 text-sand-500 text-[11px] font-mono">
              ✎ انقر على أي عنوان — Enter للحفظ، Esc للإلغاء
            </span>
          )}
        </div>
      </SectionHeader>

      {/* ── Body ── */}
      <div className="px-8 pb-12">
        {!subjectId ? (
          <EmptyState text="اختر مادة لعرض خريطة التغطية" sub="سيتم عرض الوحدات والدروس مع نسب اكتمال المحتوى" />
        ) : loading ? (
          <Spinner />
        ) : error ? (
          <EmptyState text={error} sub="تأكد من أن المادة تم تهيئتها في قاعدة البيانات" />
        ) : !data ? (
          <EmptyState text="لا توجد بيانات لهذه المادة" sub="قد تكون المادة لم تُهيَّأ بعد" />
        ) : (data.units || []).length === 0 ? (
          <EmptyState text="لا توجد وحدات مسجلة لهذه المادة" sub="استخدم أمر scaffold لتهيئة الوحدات والدروس" />
        ) : (
          <>
            {/* Subject summary strip */}
            <SubjectSummaryBar data={data} />

            {/* Units */}
            <div className="space-y-8">
              {data.units.map((unit) => {
                const unitTitle = unitTitleOverrides[unit.unitId] ?? unit.title;
                const al        = avgLevel(unit.avgCoverage);
                const segments  = groupLessons(unit.lessons || []);

                return (
                  <div key={unit.unitId} className="group/unit">

                    {/* ── Unit header ── */}
                    <div className="flex items-center gap-3 mb-2.5">
                      {/* Collapse hint dot */}
                      <span className={`w-2 h-2 rounded-full shrink-0 ${LVL[al].dot}`} />

                      <h3 className="text-[13px] font-bold text-sand-300 font-arabic">
                        {editMode ? (
                          <InlineEdit
                            value={unitTitle}
                            onSave={(v) => saveUnitTitle(unit.unitId, unit.mongoId, v)}
                            className="text-[13px] font-bold text-sand-300 font-arabic"
                            inputClassName="text-[13px] font-bold font-arabic w-72"
                          />
                        ) : unitTitle}
                      </h3>

                      <AvgBadge avg={unit.avgCoverage} />

                      <div className="flex-1 h-px bg-ink-800/50" />

                      {/* Approved count */}
                      <span className="text-[10px] font-mono text-ink-700 shrink-0">
                        {unit.approvedLessons}/{unit.totalLessons} معتمد
                      </span>
                    </div>

                    {/* ── Lessons table ── */}
                    <div className="rounded-xl overflow-hidden border border-ink-800/50 bg-ink-950/30">
                      <table className="w-full text-xs font-mono">
                        <thead>
                          <tr className="bg-ink-900/70 border-b border-ink-800/40">
                            <th className="text-right py-2.5 px-4 text-ink-600 font-arabic font-normal text-[11px]">الدرس</th>
                            <th className="py-2.5 px-3 text-ink-600 text-center text-[11px]">الحالة</th>
                            <th className="py-2.5 px-3 text-ink-600 text-center text-[11px]" title="أقسام">§</th>
                            <th className="py-2.5 px-3 text-ink-600 text-center text-[11px]" title="مفاهيم">✦</th>
                            <th className="py-2.5 px-3 text-ink-600 text-center text-[11px]" title="تغذية">▣</th>
                            <th className="py-2.5 px-3 text-ink-600 text-center text-[11px]" title="أسئلة">◎</th>
                            <th className="py-2.5 px-3 text-ink-600 text-center text-[11px] min-w-[120px]">تغطية</th>
                          </tr>
                        </thead>
                        <tbody>
                          {segments.map((segment) => {
                            const groupKey      = `${unit.unitId}:${segment.groupId}`;
                            const resolvedGTitle = segment.groupId
                              ? (groupTitleOverrides[groupKey] ?? segment.groupTitle)
                              : null;

                            return (
                              <>
                                {/* Group sub-header */}
                                {segment.groupId && (
                                  <tr key={`grp-${groupKey}`} className="bg-ink-900/50 border-b border-t border-ink-800/30">
                                    <td colSpan={7} className="py-1.5 px-4">
                                      <div className="flex items-center gap-2">
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-600 shrink-0">
                                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                        </svg>
                                        {editMode ? (
                                          <InlineEdit
                                            value={resolvedGTitle || ''}
                                            placeholder="اسم المجموعة..."
                                            onSave={(v) => saveGroupTitle(groupKey, segment.lessons, v)}
                                            className="text-[11px] text-sand-500 font-arabic font-medium"
                                            inputClassName="text-[11px] font-arabic w-52"
                                          />
                                        ) : (
                                          <span className={`text-[11px] font-arabic font-medium ${resolvedGTitle ? 'text-sand-500' : 'italic text-ink-600'}`}>
                                            {resolvedGTitle || 'مجموعة بدون اسم'}
                                          </span>
                                        )}
                                        <span className="text-[10px] text-ink-700 mr-1">
                                          ({segment.lessons.length})
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                )}

                                {/* Lesson rows */}
                                {segment.lessons.map((lesson, i) => {
                                  const lvl          = lesson.coverageLevel || 'none';
                                  const lessonTitle  = lessonTitleOverrides[lesson.lessonId] ?? lesson.title;
                                  const isGrouped    = !!segment.groupId;
                                  const isEven       = i % 2 === 0;

                                  return (
                                    <tr
                                      key={lesson.lessonId}
                                      className={`border-b border-ink-900/60 hover:bg-ink-800/15 transition-colors ${isEven ? '' : 'bg-ink-950/20'}`}
                                    >
                                      {/* Title */}
                                      <td className={`py-2.5 px-4 font-arabic text-sand-400 text-[12px] max-w-[260px] ${isGrouped ? 'pl-8' : ''}`}>
                                        {editMode ? (
                                          <InlineEdit
                                            value={lessonTitle}
                                            onSave={(v) => saveLessonTitle(lesson.lessonId, lesson.mongoId, v)}
                                            className="font-arabic text-sand-400 text-[12px]"
                                            inputClassName="font-arabic text-[12px] w-60"
                                          />
                                        ) : (
                                          <span className="truncate block" title={lessonTitle}>
                                            {lessonTitle}
                                          </span>
                                        )}
                                      </td>

                                      {/* Status */}
                                      <td className="py-2.5 px-3 text-center">
                                        <StatusChip status={lesson.status} />
                                      </td>

                                      {/* Counts — colour-coded: 0 is muted, >0 is lit */}
                                      <td className={`py-2.5 px-3 text-center tabular-nums ${lesson.sections  > 0 ? 'text-sand-500' : 'text-ink-700'}`}>{lesson.sections  ?? 0}</td>
                                      <td className={`py-2.5 px-3 text-center tabular-nums ${lesson.concepts  > 0 ? 'text-sand-500' : 'text-ink-700'}`}>{lesson.concepts  ?? 0}</td>
                                      <td className={`py-2.5 px-3 text-center tabular-nums ${lesson.feedItems > 0 ? 'text-sand-500' : 'text-ink-700'}`}>{lesson.feedItems ?? 0}</td>
                                      <td className={`py-2.5 px-3 text-center tabular-nums ${lesson.questions > 0 ? 'text-sand-500' : 'text-ink-700'}`}>{lesson.questions ?? 0}</td>

                                      {/* Coverage bar */}
                                      <td className="py-2.5 px-3">
                                        <CoverageBar score={lesson.coverageScore} level={lvl} />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
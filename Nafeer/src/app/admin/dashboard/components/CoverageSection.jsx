'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SUBJECTS_CATALOG_REF } from '../constants';
import { SectionHeader, StatusChip, EmptyState, Spinner } from './ui/shared';

// ─── Coverage level helpers ───────────────────────────────────────────────────

const LVL = {
  high:   { bar: '#22c55e', text: 'text-green-400',  bg: 'bg-green-900/20'  },
  medium: { bar: '#f59e0b', text: 'text-amber-400',  bg: 'bg-amber-900/20'  },
  low:    { bar: '#f97316', text: 'text-orange-400', bg: 'bg-orange-900/20' },
  none:   { bar: '#374151', text: 'text-ink-600',    bg: 'bg-ink-800/30'   },
};

const avgLevel = (avg) => avg >= 80 ? 'high' : avg >= 40 ? 'medium' : avg > 0 ? 'low' : 'none';

// ─── InlineEdit ───────────────────────────────────────────────────────────────
// In edit mode: click to activate an <input>, Enter/blur to save, Escape to cancel.

function InlineEdit({ value, placeholder = '', onSave, className = '', inputClassName = '', italic = false }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value || '');
  const [saving,  setSaving]  = useState(false);
  const inputRef              = useRef(null);

  useEffect(() => { setDraft(value || ''); }, [value]);

  function startEdit() {
    setDraft(value || '');
    setEditing(true);
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select(); }, 0);
  }

  async function commit() {
    const trimmed = draft.trim();
    // Allow clearing optional fields (groupTitle can be empty)
    if (trimmed === (value || '').trim()) { setEditing(false); return; }
    setSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter')  { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
  }

  if (!editing) {
    return (
      <span
        onClick={startEdit}
        title="انقر للتعديل"
        className={`${className} cursor-text hover:underline decoration-dotted underline-offset-2 decoration-ink-600 ${italic && !value ? 'italic text-ink-600' : ''}`}
      >
        {value || placeholder}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      value={draft}
      disabled={saving}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKey}
      className={`${inputClassName} bg-ink-900 border border-sand-700/60 rounded px-2 py-0.5 text-sand-200 outline-none focus:border-sand-500 transition-colors disabled:opacity-50`}
      style={{ minWidth: '12ch' }}
    />
  );
}

// ─── Group lessons within a unit ─────────────────────────────────────────────
// Returns an ordered list of segments: either a { groupId, groupTitle, lessons[] }
// bucket or a { groupId: null, lessons[] } bucket for ungrouped lessons.
// Preserves lesson order throughout.

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

// ─── CoverageSection ─────────────────────────────────────────────────────────

export function CoverageSection() {
  const [subjectId, setSubjectId] = useState('');
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [editMode,  setEditMode]  = useState(false);

  // Local title overrides so the UI is snappy — no reload needed after saves
  const [unitTitles,        setUnitTitles]        = useState({});  // { unitId  → string }
  const [lessonTitles,      setLessonTitles]      = useState({});  // { lessonId → string }
  const [groupTitleOverrides, setGroupTitleOverrides] = useState({}); // { `${unitId}:${groupId}` → string }

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/coverage/${subjectId}`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setUnitTitles({});
        setLessonTitles({});
        setGroupTitleOverrides({});
      } else {
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  // ── Save helpers ──────────────────────────────────────────────────────────

  async function saveUnitTitle(unitId, mongoId, newTitle) {
    const res  = await fetch(`/api/admin/curriculum/units/${mongoId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newTitle }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'فشل الحفظ');
    setUnitTitles((p) => ({ ...p, [unitId]: newTitle }));
  }

  async function saveLessonTitle(lessonId, mongoId, newTitle) {
    const res  = await fetch(`/api/admin/curriculum/lessons/${mongoId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title: newTitle }),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'فشل الحفظ');
    setLessonTitles((p) => ({ ...p, [lessonId]: newTitle }));
  }

  // Saves groupTitle by PATCHing ALL lessons in the group simultaneously
  // (they all share the same groupTitle field — keep them in sync).
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      <SectionHeader title="خريطة التغطية" description="نسبة اكتمال المحتوى لكل درس لكل مادة">
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <select
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value); setEditMode(false); }}
            className="px-3 py-2 rounded-lg bg-ink-800 border border-ink-700/60 text-sand-200 text-sm font-arabic focus:outline-none focus:border-sand-700 transition-colors"
          >
            <option value="">اختر مادة...</option>
            {SUBJECTS_CATALOG_REF.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr} — {s.id}</option>
            ))}
          </select>

          {subjectId && (
            <button
              onClick={load}
              className="px-3 py-2 rounded-lg border border-ink-700/60 text-ink-500 hover:text-ink-300 hover:border-ink-600 text-xs font-mono transition-all"
            >
              ↺ تحديث
            </button>
          )}

          {data && (
            <button
              onClick={() => setEditMode((v) => !v)}
              title={editMode ? 'إيقاف وضع التعديل' : 'تعديل عناوين المنهج'}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono transition-all ${
                editMode
                  ? 'border-sand-600 text-sand-300 bg-sand-900/20'
                  : 'border-ink-700/60 text-ink-500 hover:text-ink-300 hover:border-ink-600'
              }`}
            >
              {/* pencil icon */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              {editMode ? 'إيقاف التعديل' : 'تعديل المنهج'}
            </button>
          )}

          {editMode && (
            <span className="px-2 py-0.5 rounded-full bg-sand-900/30 border border-sand-700/40 text-sand-400 text-[11px] font-mono">
              انقر على أي عنوان لتعديله — Enter للحفظ، Esc للإلغاء
            </span>
          )}
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        {!subjectId ? (
          <EmptyState text="اختر مادة لعرض خريطة التغطية" />
        ) : loading ? (
          <Spinner />
        ) : !data ? (
          <EmptyState text="لا توجد بيانات — المادة قد لا تكون مُهيَّأة بعد" />
        ) : (
          <div className="space-y-10">
            {(data.units || []).map((unit) => {
              const al        = avgLevel(unit.avgCoverage);
              const unitTitle = unitTitles[unit.unitId] ?? unit.title;
              const segments  = groupLessons(unit.lessons || []);

              return (
                <div key={unit.unitId}>

                  {/* ── Unit header ── */}
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-sand-300 font-arabic">
                      {editMode ? (
                        <InlineEdit
                          value={unitTitle}
                          onSave={(v) => saveUnitTitle(unit.unitId, unit.mongoId, v)}
                          className="text-sm font-bold text-sand-300 font-arabic"
                          inputClassName="text-sm font-bold font-arabic w-64"
                        />
                      ) : unitTitle}
                    </h3>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg ${LVL[al].bg} ${LVL[al].text}`}>
                      {unit.avgCoverage}%
                    </span>
                    <div className="flex-1 h-px bg-ink-800" />
                    <span className="text-[10px] font-mono text-ink-700">
                      {unit.approvedLessons}/{unit.totalLessons} معتمد
                    </span>
                  </div>

                  {/* ── Lessons table — may contain group sub-headers ── */}
                  <div className="rounded-xl overflow-hidden border border-ink-800/50">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-ink-900/80 border-b border-ink-800/60">
                          <th className="text-right py-2.5 px-4 text-ink-600 font-arabic font-normal">الدرس</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">الحالة</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">أقسام</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">مفاهيم</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">تغذية</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">أسئلة</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center min-w-[110px]">تغطية</th>
                        </tr>
                      </thead>
                      <tbody>
                        {segments.map((segment) => {
                          const groupKey     = `${unit.unitId}:${segment.groupId}`;
                          const resolvedGTitle = segment.groupId
                            ? (groupTitleOverrides[groupKey] ?? segment.groupTitle)
                            : null;

                          return (
                            <>
                              {/* ── Group sub-header (only when groupId is set) ── */}
                              {segment.groupId && (
                                <tr key={`grp-${groupKey}`} className="bg-ink-900/60 border-b border-ink-800/40">
                                  <td colSpan={7} className="py-2 px-4">
                                    <div className="flex items-center gap-2">
                                      {/* bracket/folder icon */}
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-600 shrink-0">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                      </svg>
                                      {editMode ? (
                                        <InlineEdit
                                          value={resolvedGTitle || ''}
                                          placeholder="اسم المجموعة..."
                                          onSave={(v) => saveGroupTitle(groupKey, segment.lessons, v)}
                                          className="text-[11px] text-sand-500 font-arabic font-medium tracking-wide"
                                          inputClassName="text-[11px] font-arabic w-48"
                                          italic
                                        />
                                      ) : (
                                        <span className={`text-[11px] font-arabic font-medium tracking-wide ${resolvedGTitle ? 'text-sand-500' : 'italic text-ink-600'}`}>
                                          {resolvedGTitle || 'مجموعة بدون اسم'}
                                        </span>
                                      )}
                                      <span className="text-[10px] font-mono text-ink-700 mr-1">
                                        ({segment.lessons.length} درس)
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {/* ── Lesson rows ── */}
                              {segment.lessons.map((lesson, i) => {
                                const lvl         = lesson.coverageLevel || 'none';
                                const c           = LVL[lvl];
                                const lessonTitle = lessonTitles[lesson.lessonId] ?? lesson.title;
                                const isGrouped   = !!segment.groupId;

                                return (
                                  <tr
                                    key={lesson.lessonId}
                                    className={`border-b border-ink-900/60 hover:bg-ink-800/20 transition-colors ${i % 2 === 0 ? '' : 'bg-ink-950/20'}`}
                                  >
                                    <td className={`py-3 px-4 font-arabic text-sand-400 text-[12px] max-w-[260px] ${isGrouped ? 'pl-8' : ''}`}>
                                      {editMode ? (
                                        <InlineEdit
                                          value={lessonTitle}
                                          onSave={(v) => saveLessonTitle(lesson.lessonId, lesson.mongoId, v)}
                                          className="font-arabic text-sand-400 text-[12px]"
                                          inputClassName="font-arabic text-[12px] w-56"
                                        />
                                      ) : (
                                        <span className="truncate block">{lessonTitle}</span>
                                      )}
                                    </td>
                                    <td className="py-3 px-3 text-center"><StatusChip status={lesson.status} /></td>
                                    <td className="py-3 px-3 text-center text-ink-500">{lesson.sections  ?? '—'}</td>
                                    <td className="py-3 px-3 text-center text-ink-500">{lesson.concepts  ?? '—'}</td>
                                    <td className="py-3 px-3 text-center text-ink-500">{lesson.feedItems ?? '—'}</td>
                                    <td className="py-3 px-3 text-center text-ink-500">{lesson.questions ?? '—'}</td>
                                    <td className="py-3 px-3">
                                      <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 rounded-full bg-ink-800">
                                          <div
                                            className="h-1.5 rounded-full transition-all"
                                            style={{ width: `${lesson.coverageScore}%`, background: c.bar }}
                                          />
                                        </div>
                                        <span className={`text-[11px] font-mono w-7 text-right ${c.text}`}>
                                          {lesson.coverageScore}
                                        </span>
                                      </div>
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
        )}
      </div>
    </div>
  );
}
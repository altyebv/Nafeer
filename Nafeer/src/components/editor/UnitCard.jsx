'use client';
import { useState, useRef, useEffect } from 'react';
import { useDataStore }    from '@/store/dataStore';
import { computeProgress } from '@/lib/LessonStatus';
import LessonItem          from '@/components/editor/LessonItem';
import { COVERAGE_LEVEL_CONFIG } from '@/hooks/useCoverageData';

const ARABIC_ORDINALS = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة',
                         'السادسة','السابعة','الثامنة','التاسعة','العاشرة'];

export default function UnitCard({ unit, index, onEditLesson, coverageMap, unitCoverage }) {
  const { lessons, sections, blocks, updateUnit, addLesson } = useDataStore();

  const [expanded,      setExpanded]      = useState(true);
  const [editingTitle,  setEditingTitle]  = useState(false);
  const [titleDraft,    setTitleDraft]    = useState(unit.title);
  const [addingLesson,  setAddingLesson]  = useState(false);
  const [newTitle,      setNewTitle]      = useState('');
  const addInputRef = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (addingLesson) addInputRef.current?.focus();
  }, [addingLesson]);

  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);

  const unitLessons = lessons
    .filter((l) => l.unitId === unit.id)
    .sort((a, b) => a.order - b.order);

  const lessonsMap = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const { done, total, pct } = computeProgress(
    unitLessons.map((l) => l.id), sections, blocks, lessonsMap,
  );

  const saveTitle = () => {
    if (titleDraft.trim()) updateUnit(unit.id, { title: titleDraft.trim() });
    else setTitleDraft(unit.title);
    setEditingTitle(false);
  };

  const confirmAddLesson = () => {
    if (!newTitle.trim()) { setAddingLesson(false); return; }
    addLesson({ unitId: unit.id, title: newTitle.trim() });
    setNewTitle('');
    setAddingLesson(false);
  };

  // Coverage avg for display
  const avgCov = unitCoverage?.avgCoverage ?? null;
  const covLevel = avgCov != null
    ? (avgCov >= 80 ? 'high' : avgCov >= 40 ? 'medium' : avgCov > 0 ? 'low' : 'none')
    : null;
  const covCfg = covLevel ? COVERAGE_LEVEL_CONFIG[covLevel] : null;

  const ordinal = ARABIC_ORDINALS[index] || `${index + 1}`;

  return (
    <section>
      {/* ── Unit header ──────────────────────────────────────────────────────── */}
      <div
        className="flex items-baseline gap-4 mb-3 cursor-pointer group select-none"
        onClick={() => !editingTitle && setExpanded((v) => !v)}
      >
        {/* Chapter number — large faint mono */}
        <span
          className="text-4xl font-mono font-bold leading-none shrink-0 transition-colors"
          style={{ color: 'rgba(255,255,255,0.04)' }}
          aria-hidden
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0 flex items-baseline gap-3">
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  { e.preventDefault(); saveTitle(); }
                if (e.key === 'Escape') { setTitleDraft(unit.title); setEditingTitle(false); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-lg font-semibold bg-transparent border-b border-sand-600 text-sand-200
                focus:outline-none font-arabic w-full pb-0.5"
            />
          ) : (
            <h2 className="text-lg font-semibold text-ink-100 font-arabic truncate group-hover:text-sand-200 transition-colors">
              {unit.title}
            </h2>
          )}

          {/* Inline ordinal label */}
          <span className="text-xs text-ink-700 font-arabic shrink-0">
            الوحدة {ordinal}
          </span>
        </div>

        {/* Meta cluster — stops propagation so clicking doesn't toggle */}
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Coverage badge */}
          {covCfg && avgCov != null && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
              style={{ background: covCfg.bg, borderColor: covCfg.border, color: covCfg.color }}
              title={`تغطية الوحدة: ${avgCov}%`}
            >
              {avgCov}%
            </span>
          )}

          {/* Progress fraction */}
          <span className={`text-xs font-mono px-2 py-0.5 rounded border
            ${pct === 100
              ? 'bg-emerald-900/30 text-emerald-500 border-emerald-800/40'
              : pct > 0
                ? 'bg-amber-900/20 text-amber-500 border-amber-800/30'
                : 'text-ink-700 border-ink-800'
            }`}
          >
            {done}/{total}
          </span>

          {/* Edit title */}
          <button
            onClick={() => { setTitleDraft(unit.title); setEditingTitle(true); }}
            className="p-1 text-ink-800 hover:text-ink-400 transition-colors rounded"
            title="تعديل العنوان"
          >
            <PencilIcon />
          </button>

          {/* Collapse chevron */}
          <span className={`text-ink-700 text-xs transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`}>
            ▾
          </span>
        </div>
      </div>

      {/* Thin rule */}
      <div className="h-px bg-ink-800/60 mb-4" />

      {/* ── Lesson list ──────────────────────────────────────────────────────── */}
      {expanded && (
        <div className="space-y-1 mb-4">
          {unitLessons.length === 0 && !addingLesson && (
            <p className="text-xs text-ink-700 font-arabic py-3 text-center">
              لا توجد دروس — ابدأ بإضافة درس
            </p>
          )}

          {unitLessons.map((lesson, li) => (
            <LessonItem
              key={lesson.id}
              lesson={lesson}
              index={li}
              onEdit={() => onEditLesson(lesson.id, unit.id)}
              coverageLevel={coverageMap?.[lesson.contentId]?.coverageLevel}
            />
          ))}

          {/* Inline add-lesson input */}
          {addingLesson ? (
            <div className="flex items-center gap-2 pl-4 pr-2 py-2 border border-sand-800/60 rounded-lg bg-ink-900/40 mt-2">
              <span className="text-xs text-ink-700 font-mono shrink-0">
                {String(unitLessons.length + 1).padStart(2, '0')}
              </span>
              <input
                ref={addInputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')  confirmAddLesson();
                  if (e.key === 'Escape') { setNewTitle(''); setAddingLesson(false); }
                }}
                placeholder="عنوان الدرس الجديد…"
                className="flex-1 bg-transparent text-sand-200 text-sm font-arabic
                  placeholder-ink-700 focus:outline-none"
              />
              <button
                onClick={confirmAddLesson}
                disabled={!newTitle.trim()}
                className="text-xs px-2.5 py-1 bg-sand-800 text-ink-950 rounded-md font-arabic
                  disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand-700 transition-colors"
              >
                إضافة
              </button>
              <button
                onClick={() => { setNewTitle(''); setAddingLesson(false); }}
                className="text-xs text-ink-600 hover:text-ink-400 font-arabic transition-colors"
              >
                إلغاء
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="w-full mt-1 py-2 text-xs text-ink-700 hover:text-sand-500
                border border-dashed border-ink-800 hover:border-sand-900
                rounded-lg font-arabic transition-colors hover:bg-sand-900/5"
            >
              + درس جديد
            </button>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Micro icons ──────────────────────────────────────────────────────────────
function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
'use client';
import { useState, useRef, useEffect } from 'react';
import { useDataStore }    from '@/store/dataStore';
import { computeProgress } from '@/lib/LessonStatus';
import LessonItem          from '@/components/editor/lesson/LessonItem';
import AddVariationModal   from '@/components/editor/lesson/AddVariationModal';
import { COVERAGE_LEVEL_CONFIG } from '@/hooks/useCoverageData';

const ARABIC_ORDINALS = ['الأولى','الثانية','الثالثة','الرابعة','الخامسة',
                         'السادسة','السابعة','الثامنة','التاسعة','العاشرة'];

export default function UnitCard({ unit, index, onEditLesson, coverageMap, unitCoverage }) {
  const { lessons, sections, blocks, updateUnit, addLesson } = useDataStore();

  const [expanded,      setExpanded]      = useState(true);
  const [editingTitle,  setEditingTitle]  = useState(false);
  const [titleDraft,    setTitleDraft]    = useState(unit.title);
  const [addingLesson,    setAddingLesson]    = useState(false);
  const [newTitle,        setNewTitle]        = useState('');
  // variationTarget: the parent lesson for which we're creating a variation
  const [variationTarget, setVariationTarget] = useState(null);
  const addInputRef   = useRef(null);
  const titleInputRef = useRef(null);

  useEffect(() => { if (addingLesson)  addInputRef.current?.focus();   }, [addingLesson]);
  useEffect(() => { if (editingTitle)  titleInputRef.current?.focus(); }, [editingTitle]);

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

  const avgCov  = unitCoverage?.avgCoverage ?? null;
  const covLevel = avgCov != null
    ? (avgCov >= 80 ? 'high' : avgCov >= 40 ? 'medium' : avgCov > 0 ? 'low' : 'none')
    : null;
  const covCfg  = covLevel ? COVERAGE_LEVEL_CONFIG[covLevel] : null;
  const ordinal = ARABIC_ORDINALS[index] || `${index + 1}`;

  // Split lessons: main + variation children
  const mainLessons = unitLessons.filter((l) => !l.parentLesson);
  const variationOf = (parentId) => unitLessons.filter((l) => l.parentLesson === parentId);

  return (
    <section
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background:   'var(--bg-card)',
        border:       '1px solid var(--border-subtle)',
      }}
    >
      {/* ── Unit header ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none group"
        style={{ borderBottom: expanded ? '1px solid var(--border-subtle)' : 'none' }}
        onClick={() => !editingTitle && setExpanded((v) => !v)}
      >
        {/* Unit number */}
        <span
          className="text-3xl font-mono font-bold leading-none shrink-0 transition-all duration-300"
          style={{ color: 'var(--border-mid)', letterSpacing: '-0.02em' }}
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
              className="text-base font-semibold bg-transparent focus:outline-none font-arabic w-full pb-0.5"
              style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--accent)' }}
            />
          ) : (
            <h2
              className="text-base font-semibold font-arabic truncate transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {unit.title}
            </h2>
          )}

          <span className="font-arabic shrink-0" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            الوحدة {ordinal}
          </span>
        </div>

        {/* Meta cluster */}
        <div
          className="flex items-center gap-2 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Coverage badge */}
          {covCfg && avgCov != null && (
            <span
              className="font-mono px-1.5 py-0.5 rounded border"
              style={{ fontSize: 10, background: covCfg.bg, borderColor: covCfg.border, color: covCfg.color }}
              title={`تغطية الوحدة: ${avgCov}%`}
            >
              {avgCov}%
            </span>
          )}

          {/* Progress */}
          <span
            className="font-mono"
            style={{ fontSize: 11, color: done === total && total > 0 ? '#10b981' : 'var(--text-secondary)' }}
          >
            {done}/{total}
          </span>

          {/* Edit title */}
          <button
            onClick={(e) => { e.stopPropagation(); setTitleDraft(unit.title); setEditingTitle(true); }}
            className="rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
            style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)';   e.currentTarget.style.background = 'transparent'; }}
            title="تعديل اسم الوحدة"
          >
            <PencilIcon />
          </button>

          {/* Collapse chevron */}
          <span
            className="transition-transform duration-300"
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          >
            ▾
          </span>
        </div>
      </div>

      {/* ── Lessons grid ─────────────────────────────────────────────────── */}
      {expanded && (
        <div className="p-3">
          {unitLessons.length === 0 ? (
            <div
              className="py-8 rounded-xl text-center cursor-pointer group"
              style={{ border: '1.5px dashed var(--border-subtle)' }}
              onClick={() => setAddingLesson(true)}
            >
              <p className="font-arabic" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                لا توجد دروس بعد
              </p>
              <p className="font-arabic mt-1 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: 11, color: 'var(--accent)', opacity: 0 }}>
                اضغط لإضافة درس
              </p>
            </div>
          ) : (
            /* Two-column grid for wider screens; single column on small */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
              {mainLessons.map((lesson, i) => {
                const globalIndex = unitLessons.findIndex((l) => l.id === lesson.id);
                const children = variationOf(lesson.id);
                const cvLevel  = coverageMap?.[lesson.id]?.level ?? null;
                return (
                  <div key={lesson.id}>
                    <LessonItem
                      lesson={lesson}
                      index={globalIndex}
                      onEdit={() => onEditLesson(lesson.id, unit.id)}
                      onAddVariation={() => setVariationTarget(lesson)}
                      coverageLevel={cvLevel}
                    />
                    {children.map((child) => (
                      <LessonItem
                        key={child.id}
                        lesson={child}
                        index={unitLessons.findIndex((l) => l.id === child.id)}
                        onEdit={() => onEditLesson(child.id, unit.id)}
                        coverageLevel={coverageMap?.[child.id]?.level ?? null}
                        isVariation
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {/* Add lesson row */}
          {addingLesson ? (
            <div
              className="flex gap-2 mt-2"
              style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8 }}
            >
              <input
                ref={addInputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter')  confirmAddLesson();
                  if (e.key === 'Escape') setAddingLesson(false);
                }}
                placeholder="عنوان الدرس… ثم Enter"
                className="flex-1 rounded-lg px-3 py-2 font-arabic focus:outline-none transition-colors"
                style={{
                  fontSize:    13,
                  background:  'var(--bg-primary)',
                  border:      '1px solid var(--border-mid)',
                  color:       'var(--text-primary)',
                }}
              />
              <button
                onClick={confirmAddLesson}
                className="px-3 py-2 rounded-lg font-arabic text-sm transition-colors"
                style={{ background: 'rgba(212,137,30,0.12)', border: '1px solid rgba(212,137,30,0.2)', color: '#d4891e' }}
              >
                إضافة
              </button>
              <button
                onClick={() => setAddingLesson(false)}
                className="px-3 py-2 rounded-lg text-sm transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAddingLesson(true)}
              className="w-full mt-2 py-2 rounded-xl font-arabic text-sm transition-all group"
              style={{
                color:      'var(--text-muted)',
                border:     '1px dashed var(--border-subtle)',
                background: 'transparent',
                fontSize:   12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color      = 'var(--accent)';
                e.currentTarget.style.borderColor = 'rgba(212,137,30,0.3)';
                e.currentTarget.style.background  = 'rgba(212,137,30,0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color      = 'var(--text-muted)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.background  = 'transparent';
              }}
            >
              + إضافة درس
            </button>
          )}
        </div>
      )}

      {/* ── Add Variation Modal ───────────────────────────────────────────── */}
      {variationTarget && (
        <AddVariationModal
          parentLesson={variationTarget}
          unitId={unit.id}
          onCreated={() => {/* lesson lands in store — list re-renders automatically */}}
          onClose={() => setVariationTarget(null)}
        />
      )}
    </section>
  );
}

function PencilIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
      <path d="M8.5 1.5L10.5 3.5L4 10H2V8L8.5 1.5Z"
        stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}
import { useState } from 'react';
import { useDataStore }    from '@/store/dataStore';
import { computeProgress } from '@/lib/LessonStatus';
import LessonItem          from '@/components/editor/LessonItem';
import { COVERAGE_LEVEL_CONFIG } from '@/hooks/useCoverageData';
import Modal               from '@/components/editor/Modal';

const inputClass =
  'w-full px-4 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600 text-sm';

export default function UnitCard({ unit, onEditLesson, coverageMap, unitCoverage }) {
  const { lessons, sections, blocks, updateUnit, addLesson } = useDataStore();

  const [isExpanded,     setIsExpanded]     = useState(true);
  const [isEditing,      setIsEditing]      = useState(false);
  const [editTitle,      setEditTitle]      = useState(unit.title);
  const [showAddLesson,  setShowAddLesson]  = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const unitLessons = lessons
    .filter((l) => l.unitId === unit.id)
    .sort((a, b) => a.order - b.order);

  const lessonsMap = Object.fromEntries(lessons.map((l) => [l.id, l]));
  const { done, total, pct } = computeProgress(
    unitLessons.map((l) => l.id),
    sections,
    blocks,
    lessonsMap,
  );

  const handleSaveTitle = () => {
    if (editTitle.trim()) updateUnit(unit.id, { title: editTitle });
    setIsEditing(false);
  };

  const handleAddLesson = () => {
    if (!newLessonTitle.trim()) return;
    addLesson({ unitId: unit.id, title: newLessonTitle });
    setNewLessonTitle('');
    setShowAddLesson(false);
  };

  return (
    <div className="bg-ink-900 rounded-xl border border-ink-800 overflow-hidden">

      {/* Unit Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-ink-800/40 cursor-pointer hover:bg-ink-800/70 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={`text-ink-600 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
          ▶
        </span>

        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-2 py-1 bg-ink-900 border border-sand-600 rounded text-sand-200 focus:outline-none focus:ring-1 focus:ring-sand-500 font-arabic text-sm"
            autoFocus
          />
        ) : (
          <h3 className="flex-1 font-semibold text-ink-100 font-arabic text-sm">{unit.title}</h3>
        )}

        {/* Progress pill */}
        <span className={`text-xs font-mono px-2 py-0.5 rounded border
          ${pct === 100
            ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40'
            : pct > 0
              ? 'bg-amber-900/30 text-amber-400 border-amber-700/30'
              : 'bg-ink-800 text-ink-500 border-ink-700'
          }`}
        >
          {done}/{total}
        </span>

        {/* Atlas coverage badge */}
        {unitCoverage != null && (() => {
          const avg = unitCoverage.avgCoverage ?? 0;
          const level = avg >= 80 ? 'high' : avg >= 40 ? 'medium' : avg > 0 ? 'low' : 'none';
          const cvCfg = COVERAGE_LEVEL_CONFIG[level];
          return (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border hidden sm:inline-flex items-center gap-1"
              style={{ background: cvCfg.bg, border: `1px solid ${cvCfg.border}`, color: cvCfg.color }}
              title={`متوسط تغطية الوحدة: ${avg}%`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cvCfg.dot}`} />
              {avg}%
            </span>
          );
        })()}

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => { setEditTitle(unit.title); setIsEditing(true); }}
            className="p-1.5 text-ink-600 hover:text-sand-400 hover:bg-ink-700 rounded transition-colors"
            title="تعديل عنوان الوحدة"
          >
            ✏
          </button>
        </div>
      </div>

      {/* Unit progress bar */}
      {pct > 0 && (
        <div className="h-0.5 bg-ink-800">
          <div
            className={`h-full transition-all duration-500 ${pct === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Lessons List */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {unitLessons.length === 0 ? (
            <p className="text-center text-ink-600 py-4 text-sm font-arabic">
              لا توجد دروس في هذه الوحدة
            </p>
          ) : (
            unitLessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                onEdit={() => onEditLesson(lesson.id, unit.id)}
                coverageLevel={coverageMap?.[lesson.contentId]?.coverageLevel}
              />
            ))
          )}

          <button
            onClick={() => setShowAddLesson(true)}
            className="w-full py-2.5 border border-dashed border-ink-700 rounded-lg text-ink-500 hover:border-sand-700 hover:text-sand-400 hover:bg-sand-900/10 transition-colors text-sm font-arabic mt-1"
          >
            + إضافة درس
          </button>
        </div>
      )}

      {/* Add Lesson Modal */}
      <Modal isOpen={showAddLesson} onClose={() => { setShowAddLesson(false); setNewLessonTitle(''); }} title="إضافة درس جديد">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-arabic">عنوان الدرس</label>
            <input
              type="text"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLesson()}
              className={inputClass}
              placeholder="مثال: الإحداثيات الجغرافية"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddLesson}
              disabled={!newLessonTitle.trim()}
              className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm font-arabic"
            >
              إضافة
            </button>
            <button
              onClick={() => { setShowAddLesson(false); setNewLessonTitle(''); }}
              className="px-4 py-2 text-ink-400 hover:bg-ink-800 rounded-lg transition-colors text-sm font-arabic"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import LessonItem from '@/components/editor/LessonItem';
import Modal      from '@/components/editor/Modal';

export default function UnitCard({ unit, onEditLesson }) {
  const { lessons, sections, updateUnit, deleteUnit, addLesson } = useDataStore();

  const [isExpanded,    setIsExpanded]    = useState(true);
  const [isEditing,     setIsEditing]     = useState(false);
  const [editTitle,     setEditTitle]     = useState(unit.title);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const unitLessons = lessons
    .filter((l) => l.unitId === unit.id)
    .sort((a, b) => a.order - b.order);

  const totalSections = unitLessons.reduce(
    (acc, lesson) => acc + sections.filter((s) => s.lessonId === lesson.id).length,
    0
  );

  const handleSaveTitle = () => {
    if (editTitle.trim()) updateUnit(unit.id, { title: editTitle });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من حذف هذه الوحدة وجميع دروسها؟')) deleteUnit(unit.id);
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
        <span className={`text-ink-600 text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
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
            className="flex-1 px-2 py-1 bg-ink-900 border border-sand-600 rounded text-sand-200 focus:outline-none focus:ring-1 focus:ring-sand-500 font-arabic"
            autoFocus
          />
        ) : (
          <h3 className="flex-1 font-semibold text-ink-100 font-arabic text-sm">{unit.title}</h3>
        )}

        <span className="text-xs text-ink-500 bg-ink-800 px-2 py-0.5 rounded font-arabic">
          {unitLessons.length} دروس
        </span>
        <span className="text-xs text-ink-500 bg-ink-800 px-2 py-0.5 rounded font-arabic">
          {totalSections} أقسام
        </span>

        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-ink-600 hover:text-sand-400 hover:bg-ink-700 rounded transition-colors"
          >
            ✏
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-ink-600 hover:text-red-500 hover:bg-red-900/20 rounded transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Lessons List */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {unitLessons.length === 0 ? (
            <p className="text-center text-ink-600 py-4 text-sm font-arabic">
              لا توجد دروس في هذه الوحدة
            </p>
          ) : (
            unitLessons.map((lesson) => (
              <LessonItem key={lesson.id} lesson={lesson} onEdit={() => onEditLesson(lesson.id)} />
            ))
          )}

          <button
            onClick={() => setShowAddLesson(true)}
            className="w-full py-2.5 border border-dashed border-ink-700 rounded-lg text-ink-500 hover:border-sand-700 hover:text-sand-500 hover:bg-sand-900/10 transition-colors text-sm font-arabic"
          >
            + إضافة درس
          </button>
        </div>
      )}

      {/* Add Lesson Modal */}
      <Modal isOpen={showAddLesson} onClose={() => setShowAddLesson(false)} title="إضافة درس جديد">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-ink-400 mb-1.5 font-arabic">عنوان الدرس</label>
            <input
              type="text"
              value={newLessonTitle}
              onChange={(e) => setNewLessonTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddLesson()}
              className="w-full px-4 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600"
              placeholder="مثال: الإحداثيات الجغرافية"
              autoFocus
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleAddLesson}
              disabled={!newLessonTitle.trim()}
              className="flex-1 py-2 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm font-arabic"
            >
              إضافة
            </button>
            <button
              onClick={() => setShowAddLesson(false)}
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

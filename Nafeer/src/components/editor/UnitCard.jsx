import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import LessonItem from '@/components/editor/LessonItem';
import Modal from '@/components/editor/Modal';

export default function UnitCard({ unit, onEditLesson }) {
  const { lessons, sections, updateUnit, deleteUnit, addLesson } = useDataStore();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(unit.title);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  const unitLessons = lessons
    .filter((l) => l.unitId === unit.id)
    .sort((a, b) => a.order - b.order);

  const totalSections = unitLessons.reduce((acc, lesson) => {
    return acc + sections.filter((s) => s.lessonId === lesson.id).length;
  }, 0);

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updateUnit(unit.id, { title: editTitle });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من حذف هذه الوحدة وجميع دروسها؟')) {
      deleteUnit(unit.id);
    }
  };

  const handleAddLesson = () => {
    if (!newLessonTitle.trim()) return;
    addLesson({ unitId: unit.id, title: newLessonTitle });
    setNewLessonTitle('');
    setShowAddLesson(false);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Unit Header */}
      <div
        className="flex items-center gap-3 p-4 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Expand Arrow */}
        <span
          className={`text-stone-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        >
          ◀
        </span>

        {/* Title */}
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-2 py-1 border border-amber-400 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
        ) : (
          <h3 className="flex-1 font-semibold text-stone-800">{unit.title}</h3>
        )}

        {/* Stats */}
        <span className="text-sm text-stone-500 bg-stone-200 px-2 py-0.5 rounded">
          {unitLessons.length} دروس
        </span>
        <span className="text-sm text-stone-500 bg-stone-200 px-2 py-0.5 rounded">
          {totalSections} أقسام
        </span>

        {/* Actions */}
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsEditing(true)}
            className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
            title="تعديل"
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="حذف"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Lessons List */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {unitLessons.length === 0 ? (
            <p className="text-center text-stone-400 py-4">لا توجد دروس في هذه الوحدة</p>
          ) : (
            unitLessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                onEdit={() => onEditLesson(lesson.id)}
              />
            ))
          )}

          {/* Add Lesson Button */}
          <button
            onClick={() => setShowAddLesson(true)}
            className="w-full py-3 border border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            + إضافة درس
          </button>
        </div>
      )}

      {/* Add Lesson Modal */}
      <Modal
        isOpen={showAddLesson}
        onClose={() => setShowAddLesson(false)}
        title="إضافة درس جديد"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            عنوان الدرس
          </label>
          <input
            type="text"
            value={newLessonTitle}
            onChange={(e) => setNewLessonTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddLesson()}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="مثال: الإحداثيات الجغرافية"
            autoFocus
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddLesson}
            disabled={!newLessonTitle.trim()}
            className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            إضافة
          </button>
          <button
            onClick={() => setShowAddLesson(false)}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}

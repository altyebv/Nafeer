import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';

export default function LessonItem({ lesson, onEdit }) {
  const { sections, blocks, updateLesson, deleteLesson } = useDataStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);

  const lessonSections = sections.filter((s) => s.lessonId === lesson.id);
  const lessonBlocks = blocks.filter((b) =>
    lessonSections.some((s) => s.id === b.sectionId)
  );

  const handleSaveTitle = () => {
    if (editTitle.trim()) {
      updateLesson(lesson.id, { title: editTitle });
    }
    setIsEditing(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) {
      deleteLesson(lesson.id);
    }
  };

  return (
    <div
      className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors group"
    >
      {/* Drag Handle */}
      <span className="text-stone-300 cursor-grab">⋮⋮</span>

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
        <span className="flex-1 text-stone-700">{lesson.title}</span>
      )}

      {/* Stats */}
      <span className="text-xs text-stone-400">
        {lessonSections.length} أقسام • {lessonBlocks.length} عناصر • {lesson.estimatedMinutes} د
      </span>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 transition-colors"
        >
          تحرير
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className="p-1 text-stone-400 hover:text-amber-600 transition-colors"
          title="تعديل العنوان"
        >
          ✏️
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-stone-400 hover:text-red-600 transition-colors"
          title="حذف"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

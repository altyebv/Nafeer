import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';

export default function LessonItem({ lesson, onEdit }) {
  const { sections, blocks, updateLesson, deleteLesson } = useDataStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(lesson.title);

  const lessonSections = sections.filter((s) => s.lessonId === lesson.id);
  const lessonBlocks   = blocks.filter((b) =>
    lessonSections.some((s) => s.id === b.sectionId)
  );

  const handleSaveTitle = () => {
    if (editTitle.trim()) updateLesson(lesson.id, { title: editTitle });
    setIsEditing(false);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirm('هل أنت متأكد من حذف هذا الدرس؟')) deleteLesson(lesson.id);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-ink-800/60 rounded-lg hover:bg-ink-800 transition-colors group border border-transparent hover:border-ink-700">
      <span className="text-ink-700 cursor-grab text-sm">⋮⋮</span>

      {isEditing ? (
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 px-2 py-1 bg-ink-900 border border-sand-600 rounded text-sand-200 text-sm focus:outline-none focus:ring-1 focus:ring-sand-500 font-arabic"
          autoFocus
        />
      ) : (
        <span className="flex-1 text-ink-200 text-sm font-arabic">{lesson.title}</span>
      )}

      <span className="text-xs text-ink-600 font-mono whitespace-nowrap">
        {lessonSections.length} أقسام · {lessonBlocks.length} عناصر · {lesson.estimatedMinutes}د
      </span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="px-3 py-1 text-xs bg-sand-900/60 text-sand-400 border border-sand-800/60 rounded hover:bg-sand-800/60 transition-colors font-arabic"
        >
          تحرير
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
          className="p-1 text-ink-600 hover:text-sand-400 transition-colors"
          title="تعديل العنوان"
        >
          ✏
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-ink-600 hover:text-red-500 transition-colors"
          title="حذف"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

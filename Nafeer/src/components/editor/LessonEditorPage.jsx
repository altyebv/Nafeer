import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import SectionEditor from '@/components/editor/editor/SectionEditor';
import AddBlockMenu from '@/components/editor/editor/AddBlockMenu';

export default function LessonEditorPage({ lessonId, onBack }) {
  const { lessons, sections, updateLesson, addSection } = useDataStore();

  const lesson = lessons.find((l) => l.id === lessonId);
  const lessonSections = sections
    .filter((s) => s.lessonId === lessonId)
    .sort((a, b) => a.order - b.order);

  if (!lesson) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">📝</div>
        <h2 className="text-xl font-medium text-stone-700 mb-2">الدرس غير موجود</h2>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          العودة للدروس
        </button>
      </div>
    );
  }

  const handleAddSection = () => {
    addSection({
      lessonId,
      title: `قسم ${lessonSections.length + 1}`,
      conceptIds: [],
    });
  };

  return (
    <div>
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-stone-500 hover:text-amber-600 mb-6 transition-colors"
      >
        <span>→</span>
        <span>العودة للدروس</span>
      </button>

      {/* Lesson Header */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
        <input
          type="text"
          value={lesson.title}
          onChange={(e) => updateLesson(lessonId, { title: e.target.value })}
          className="text-2xl font-semibold text-stone-800 bg-transparent border-none focus:outline-none w-full mb-4"
          placeholder="عنوان الدرس"
        />

        <div className="flex items-center gap-6 text-sm text-stone-500">
          <span>{lessonSections.length} أقسام</span>
          
          <div className="flex items-center gap-2">
            <label>الوقت المقدر:</label>
            <input
              type="number"
              value={lesson.estimatedMinutes || 15}
              onChange={(e) =>
                updateLesson(lessonId, { estimatedMinutes: parseInt(e.target.value) || 15 })
              }
              className="w-16 px-2 py-1 border border-stone-300 rounded text-center"
              min="1"
            />
            <span>دقيقة</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {lessonSections.map((section) => (
          <SectionEditor key={section.id} section={section} />
        ))}
      </div>

      {/* Add Section Button */}
      <button
        onClick={handleAddSection}
        className="w-full mt-4 py-4 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
      >
        + إضافة قسم جديد
      </button>
    </div>
  );
}

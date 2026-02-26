import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import SectionEditor from '@/components/editor/SectionEditor';
import AddBlockMenu  from '@/components/editor/AddBlockMenu';

const inputClass =
  'w-full px-4 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600 text-sm';

export default function LessonEditorPage({ lessonId, onBack }) {
  const { lessons, sections, updateLesson, addSection } = useDataStore();

  const lesson         = lessons.find((l) => l.id === lessonId);
  const lessonSections = sections
    .filter((s) => s.lessonId === lessonId)
    .sort((a, b) => a.order - b.order);

  if (!lesson) {
    return (
      <div className="text-center py-20">
        <div className="text-4xl mb-4">📝</div>
        <h2 className="text-lg font-medium text-ink-400 mb-4 font-arabic">الدرس غير موجود</h2>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-arabic"
        >
          العودة للدروس
        </button>
      </div>
    );
  }

  const handleAddSection = () => {
    addSection({
      lessonId,
      title:        `قسم ${lessonSections.length + 1}`,
      conceptIds:   [],
      learningType: 'UNDERSTANDING',
    });
  };

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-ink-500 hover:text-sand-400 mb-6 transition-colors text-sm font-arabic"
      >
        <span>→</span>
        <span>العودة للدروس</span>
      </button>

      {/* Lesson Meta */}
      <div className="bg-ink-900 rounded-xl border border-ink-800 p-5 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-arabic">عنوان الدرس</label>
            <input
              type="text"
              value={lesson.title}
              onChange={(e) => updateLesson(lesson.id, { title: e.target.value })}
              className={inputClass}
              placeholder="عنوان الدرس"
            />
          </div>

          <div>
            <label className="block text-xs text-ink-500 mb-1.5 font-arabic">ملخص الدرس (اختياري)</label>
            <textarea
              value={lesson.summary || ''}
              onChange={(e) => updateLesson(lesson.id, { summary: e.target.value })}
              className={`${inputClass} resize-y min-h-[70px]`}
              placeholder="ملخص قصير عن محتوى الدرس..."
            />
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs text-ink-500 mb-1.5 font-arabic">الوقت المقدر (دقيقة)</label>
              <input
                type="number"
                value={lesson.estimatedMinutes || 15}
                onChange={(e) =>
                  updateLesson(lesson.id, { estimatedMinutes: parseInt(e.target.value) || 15 })
                }
                className="w-24 px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none"
                min="1"
              />
            </div>
            <div className="flex-1" />
            <div className="text-xs text-ink-600 font-arabic">
              {lessonSections.length} أقسام
            </div>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {lessonSections.map((section) => (
          <SectionEditor key={section.id} section={section} />
        ))}
      </div>

      {/* Add Section */}
      <button
        onClick={handleAddSection}
        className="w-full mt-4 py-4 border-2 border-dashed border-ink-800 rounded-xl text-ink-600 hover:border-sand-800 hover:text-sand-500 hover:bg-sand-900/10 transition-colors font-arabic"
      >
        + إضافة قسم جديد
      </button>
    </div>
  );
}

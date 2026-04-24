'use client';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import {
  FEED_ITEM_TYPES, FEED_ITEM_TYPE_CONFIG,
  INTERACTION_TYPES, INTERACTION_TYPE_CONFIG,
} from '@/shared/constants';

const inputClass =
  'w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm ' +
  'focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

const isInteractive = (type) => type === 'MINI_QUIZ';
const isFlashCard   = (type) => type === 'FLASH_CARD';

const emptyForm = {
  type: 'DEFINITION', conceptId: '',
  contentAr: '', back: '',
  interactionType: '', correctAnswer: '',
};

export default function LessonFeedPanel({ lessonId, unitId, lessonConceptIds, onOpenGlobal, subjectId }) {
  const { feedItems, concepts, addFeedItem, deleteFeedItem } = useDataStore();
  const { deleteFeedItem: atlasDeleteFeedItem } = useAtlasSync();

  // Feed items that belong to this lesson
  const lessonFeedItems = feedItems.filter((f) => f.lessonId === lessonId);

  // Concepts linked to this lesson's sections — offered first in the picker
  const linkedConcepts  = concepts.filter((c) => lessonConceptIds?.includes(c.id));
  const otherConcepts   = concepts.filter((c) => !lessonConceptIds?.includes(c.id));
  const orderedConcepts = [...linkedConcepts, ...otherConcepts];

  const [isOpen,   setIsOpen]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(emptyForm);

  const resetForm = () => setForm({ ...emptyForm });

  const handleTypeChange = (type) => {
    setForm({ ...emptyForm, conceptId: form.conceptId, type });
  };

  const handleAdd = () => {
    if (!form.contentAr.trim()) return;
    addFeedItem({
      ...form,
      lessonId,
      unitId,
      conceptId:       form.conceptId       || null,
      back:            form.back            || null,
      interactionType: form.interactionType || null,
      correctAnswer:   form.correctAnswer   || null,
      priority:        1,
    });
    resetForm();
    setShowForm(false);
  };

  const handleDelete = (feedItemId) => {
    deleteFeedItem(feedItemId);
    if (subjectId) atlasDeleteFeedItem(feedItemId);
  };

  const canSubmit = form.contentAr.trim().length > 0;

  return (
    <div className="bg-ink-900 rounded-xl border border-ink-800 overflow-hidden">

      {/* ── Panel header ──────────────────────────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-ink-800/40 hover:bg-ink-800/70 transition-colors text-right"
      >
        <span className="text-base">📱</span>
        <span className="flex-1 text-sm font-semibold text-ink-200 font-arabic">بطاقات التغذية</span>
        {lessonFeedItems.length > 0 && (
          <span className="text-xs font-mono px-2 py-0.5 rounded border bg-sand-900/40 text-sand-400 border-sand-700/40">
            {lessonFeedItems.length}
          </span>
        )}
        <span className={`text-ink-600 text-xs transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`}>
          ▶
        </span>
      </button>

      {isOpen && (
        <div className="p-4 space-y-3">

          {/* ── Existing feed items ───────────────────────────────── */}
          {lessonFeedItems.length > 0 && (
            <div className="space-y-1.5">
              {lessonFeedItems.map((item) => {
                const cfg        = FEED_ITEM_TYPE_CONFIG[item.type];
                const conceptName = concepts.find((c) => c.id === item.conceptId)?.titleAr;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 bg-ink-800/60 rounded-lg group border border-transparent hover:border-ink-700 transition-colors"
                  >
                    <span className="text-sm shrink-0">{cfg?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-ink-300 line-clamp-1 font-arabic">{item.contentAr}</p>
                      {conceptName && (
                        <p className="text-[10px] text-ink-600 font-arabic">{conceptName}</p>
                      )}
                    </div>
                    {item.interactionType && (
                      <span className="text-[10px] text-sand-600 font-arabic shrink-0">
                        {INTERACTION_TYPE_CONFIG[item.interactionType]?.label}
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-500 transition-all p-0.5 shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Quick-add form ────────────────────────────────────── */}
          {showForm ? (
            <div className="bg-ink-950 border border-ink-800 rounded-xl p-4 space-y-3">

              {/* Type selector */}
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(FEED_ITEM_TYPES).map(([key, value]) => {
                  const cfg = FEED_ITEM_TYPE_CONFIG[key];
                  return (
                    <button
                      key={key}
                      onClick={() => handleTypeChange(value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border font-arabic transition-colors
                        ${form.type === value
                          ? 'bg-sand-900/50 text-sand-300 border-sand-700'
                          : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                        }`}
                    >
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Concept picker — linked concepts appear first */}
              <div>
                <label className="block text-xs text-ink-600 mb-1 font-arabic">
                  المفهوم المرتبط
                  {linkedConcepts.length > 0 && (
                    <span className="text-ink-700 mr-1">(مفاهيم هذا الدرس أولاً)</span>
                  )}
                </label>
                <select
                  value={form.conceptId}
                  onChange={(e) => setForm({ ...form, conceptId: e.target.value })}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">بدون مفهوم محدد</option>
                  {linkedConcepts.length > 0 && (
                    <optgroup label="── مفاهيم هذا الدرس">
                      {linkedConcepts.map((c) => (
                        <option key={c.id} value={c.id}>{c.titleAr}</option>
                      ))}
                    </optgroup>
                  )}
                  {otherConcepts.length > 0 && (
                    <optgroup label="── مفاهيم أخرى">
                      {otherConcepts.map((c) => (
                        <option key={c.id} value={c.id}>{c.titleAr}</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Main content */}
              <textarea
                value={form.contentAr}
                onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
                className={`${inputClass} resize-none min-h-[72px]`}
                placeholder={
                  isInteractive(form.type)   ? 'السؤال...' :
                  isFlashCard(form.type)      ? 'الوجه الأمامي...' :
                  'المحتوى الذي سيظهر للطالب...'
                }
                autoFocus
              />

              {/* Flash card back face */}
              {isFlashCard(form.type) && (
                <textarea
                  value={form.back}
                  onChange={(e) => setForm({ ...form, back: e.target.value })}
                  className={`${inputClass} resize-none min-h-[56px]`}
                  placeholder="الوجه الخلفي (الإجابة)..."
                />
              )}

              {/* Mini quiz answer */}
              {isInteractive(form.type) && (
                <div className="space-y-2">
                  {/* Interaction type */}
                  <div className="flex gap-1.5">
                    {[['SWIPE_TF', '↔ صح/خطأ'], ['MCQ', '◉ اختيار']].map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setForm({ ...form, interactionType: val, correctAnswer: '' })}
                        className={`flex-1 py-1.5 rounded-lg text-xs border font-arabic transition-colors
                          ${form.interactionType === val
                            ? 'bg-sand-900/50 text-sand-300 border-sand-700'
                            : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                          }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>

                  {form.interactionType === 'SWIPE_TF' && (
                    <div className="flex gap-2">
                      {[['true', '✓ صح'], ['false', '✕ خطأ']].map(([val, lbl]) => (
                        <button
                          key={val}
                          onClick={() => setForm({ ...form, correctAnswer: val })}
                          className={`flex-1 py-2 rounded-lg text-sm border font-arabic transition-colors
                            ${form.correctAnswer === val
                              ? (val === 'true'
                                  ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700'
                                  : 'bg-red-900/40 text-red-400 border-red-700')
                              : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                            }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  )}

                  {form.interactionType === 'MCQ' && (
                    <input
                      type="text"
                      value={form.correctAnswer}
                      onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                      className={inputClass}
                      placeholder="الإجابة الصحيحة..."
                    />
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={!canSubmit}
                  className="flex-1 py-2 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm font-arabic"
                >
                  إضافة
                </button>
                <button
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-3 py-2 text-ink-500 hover:bg-ink-800 rounded-lg transition-colors text-sm font-arabic"
                >
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="flex-1 py-2.5 border border-dashed border-ink-700 rounded-lg text-ink-500 hover:border-sand-700 hover:text-sand-400 hover:bg-sand-900/10 transition-colors text-sm font-arabic"
              >
                + إضافة بطاقة
              </button>
              {onOpenGlobal && (
                <button
                  onClick={() => onOpenGlobal('feeds')}
                  className="px-3 py-2.5 text-xs text-ink-600 hover:text-sand-400 border border-ink-800 hover:border-ink-700 rounded-lg transition-colors font-arabic"
                  title="فتح صفحة التغذية"
                >
                  عرض الكل ↗
                </button>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}

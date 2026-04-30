'use client';
import {
  COGNITIVE_LEVELS,
  COGNITIVE_LEVEL_CONFIG,
  QUESTION_SOURCES,
  QUESTION_SOURCE_CONFIG,
  QUESTION_TYPE_CONFIG,
} from '@/shared/constants';
import MatchPairs from './MatchPairs';
import MCQOptions from './McqOptions';
import OrderItems from './OrderItems';

const inputClass =
  'w-full px-3 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm ' +
  'focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

const labelClass = 'block text-xs text-ink-500 mb-1.5 font-arabic';

const asArray = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  }
  return fallback;
};

const mcqOptionsFrom = (form) => asArray(form.options, ['', '', '', '']);
const matchPairsFrom = (form) => asArray(form.options, [{ right: '', left: '' }, { right: '', left: '' }]);
const orderItemsFrom = (form) => asArray(form.options, ['', '', '']);

export default function QuestionForm({ form, setForm, concepts, units, lessons }) {
  const typeConfig = QUESTION_TYPE_CONFIG[form.type];
  const unitLessons = form.unitId
    ? lessons.filter((lesson) => lesson.unitId === form.unitId)
    : lessons;

  const setField = (key, value) => setForm({ ...form, [key]: value });

  const handleUnitChange = (unitId) => {
    const availableLessons = unitId ? lessons.filter((lesson) => lesson.unitId === unitId) : lessons;
    const lessonStillValid = availableLessons.some((lesson) => lesson.id === form.lessonId);
    setForm({
      ...form,
      unitId: unitId || null,
      lessonId: lessonStillValid ? form.lessonId : null,
      sectionId: null,
    });
  };

  const renderAnswerEditor = () => {
    if (form.type === 'TRUE_FALSE') {
      return (
        <div className="grid grid-cols-2 gap-2">
          {[
            ['true', 'صح', 'border-emerald-700 bg-emerald-900/30 text-emerald-300'],
            ['false', 'خطأ', 'border-red-700 bg-red-900/30 text-red-300'],
          ].map(([value, label, activeClass]) => (
            <button
              key={value}
              type="button"
              onClick={() => setField('correctAnswer', value)}
              className={`h-11 rounded-lg border text-sm font-semibold font-arabic transition-colors ${
                form.correctAnswer === value
                  ? activeClass
                  : 'border-ink-700 bg-ink-950 text-ink-400 hover:border-ink-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      );
    }

    if (form.type === 'MCQ') {
      const options = mcqOptionsFrom(form);
      const correctIndex = options.findIndex((option) => option === form.correctAnswer);
      return (
        <MCQOptions
          options={options}
          correctIndex={correctIndex}
          onChange={(next) => setForm({ ...form, options: next, correctAnswer: next[correctIndex] || '' })}
          onCorrectChange={(index) => setForm({ ...form, correctAnswer: options[index] || '' })}
        />
      );
    }

    if (form.type === 'MATCH') {
      return (
        <MatchPairs
          pairs={matchPairsFrom(form)}
          onChange={(pairs) => setForm({ ...form, options: pairs, correctAnswer: 'MATCH_PAIRS' })}
        />
      );
    }

    if (form.type === 'ORDER') {
      return (
        <OrderItems
          items={orderItemsFrom(form)}
          onChange={(items) => setForm({ ...form, options: items, correctAnswer: items.filter(Boolean).join(' | ') })}
        />
      );
    }

    if (form.type === 'LIST') {
      return (
        <textarea
          value={form.correctAnswer || ''}
          onChange={(e) => setField('correctAnswer', e.target.value)}
          className={`${inputClass} min-h-[108px] resize-y leading-7`}
          placeholder="اكتب العناصر المطلوبة، كل عنصر في سطر..."
        />
      );
    }

    if (form.type === 'TABLE') {
      return (
        <textarea
          value={form.correctAnswer || ''}
          onChange={(e) => setField('correctAnswer', e.target.value)}
          className={`${inputClass} min-h-[108px] resize-y leading-7`}
          placeholder="اكتب نموذج الإجابة أو بنية الجدول المتوقعة..."
        />
      );
    }

    return (
      <textarea
        value={form.correctAnswer || ''}
        onChange={(e) => setField('correctAnswer', e.target.value)}
        className={`${inputClass} min-h-[96px] resize-y leading-7`}
        placeholder={
          form.type === 'FILL_BLANK'
            ? 'الإجابة التي تملأ الفراغ...'
            : form.type === 'EXPLAIN'
              ? 'النقاط الأساسية التي يجب أن تظهر في الإجابة...'
              : 'الإجابة النموذجية...'
        }
      />
    );
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-sand-800/40 bg-sand-900/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-sand-500 font-arabic">نص السؤال</p>
            <p className="text-[11px] text-ink-600 font-arabic mt-0.5">اكتب السؤال كما سيظهر للطالب مباشرة.</p>
          </div>
          <span className="shrink-0 rounded-lg border border-ink-700 bg-ink-950 px-2.5 py-1 text-xs text-ink-400 font-arabic">
            {typeConfig?.label}
          </span>
        </div>
        <textarea
          value={form.textAr || ''}
          onChange={(e) => setField('textAr', e.target.value)}
          className={`${inputClass} min-h-[118px] resize-y text-base leading-8`}
          placeholder="مثال: ما العامل الرئيس الذي أدى إلى ...؟"
          autoFocus
        />
      </section>

      <section className="rounded-xl border border-ink-800 bg-ink-900/50 p-4">
        <label className={labelClass}>الإجابة الصحيحة أو نموذج التصحيح *</label>
        {renderAnswerEditor()}
      </section>

      {form.type === 'FIGURE' && (
        <section className="rounded-xl border border-ink-800 bg-ink-900/50 p-4">
          <label className={labelClass}>رابط الصورة</label>
          <input
            type="url"
            value={form.imageUrl || ''}
            onChange={(e) => setField('imageUrl', e.target.value || null)}
            className={inputClass}
            placeholder="https://..."
          />
        </section>
      )}

      <section className="rounded-xl border border-ink-800 bg-ink-900/50 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-ink-500 font-arabic">ربط السؤال بالمقرر</p>
            <p className="text-[11px] text-ink-600 font-arabic mt-0.5">اختيار الدرس يجعل السؤال قابلا للحفظ والمراجعة.</p>
          </div>
          {!form.lessonId && (
            <span className="rounded-full bg-amber-900/20 px-2 py-0.5 text-[10px] text-amber-500 font-arabic">
              مطلوب
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass}>الوحدة</label>
            <select
              value={form.unitId || ''}
              onChange={(e) => handleUnitChange(e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">كل الوحدات</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>{unit.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>الدرس *</label>
            <select
              value={form.lessonId || ''}
              onChange={(e) => {
                const lesson = lessons.find((item) => item.id === e.target.value);
                setForm({
                  ...form,
                  lessonId: e.target.value || null,
                  unitId: lesson?.unitId || form.unitId || null,
                });
              }}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">اختر الدرس</option>
              {unitLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-ink-800 bg-ink-900/50 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className={labelClass}>المستوى المعرفي</label>
            <select
              value={form.cognitiveLevel || 'RECALL'}
              onChange={(e) => setField('cognitiveLevel', e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              {Object.entries(COGNITIVE_LEVELS).map(([key]) => (
                <option key={key} value={key}>{COGNITIVE_LEVEL_CONFIG[key].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>الصعوبة</label>
            <select
              value={form.difficulty || 1}
              onChange={(e) => setField('difficulty', Number(e.target.value))}
              className={`${inputClass} cursor-pointer`}
            >
              {[1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>الزمن التقريبي</label>
            <input
              type="number"
              min="10"
              step="5"
              value={form.estimatedSeconds || 60}
              onChange={(e) => setField('estimatedSeconds', Number(e.target.value) || 60)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div>
            <label className={labelClass}>الدرجة</label>
            <input
              type="number"
              min="1"
              value={form.points || 1}
              onChange={(e) => setField('points', Number(e.target.value) || 1)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>المصدر</label>
            <select
              value={form.source || 'ORIGINAL'}
              onChange={(e) => setField('source', e.target.value)}
              className={`${inputClass} cursor-pointer`}
            >
              {Object.entries(QUESTION_SOURCES).map(([key]) => (
                <option key={key} value={key}>{QUESTION_SOURCE_CONFIG[key].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>سنة المصدر</label>
            <input
              type="number"
              value={form.sourceYear || ''}
              onChange={(e) => setField('sourceYear', Number(e.target.value) || null)}
              className={inputClass}
              placeholder="2024"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-ink-800 bg-ink-900/50 p-4">
        <label className={labelClass}>شرح مختصر بعد الإجابة</label>
        <textarea
          value={form.explanation || ''}
          onChange={(e) => setField('explanation', e.target.value || null)}
          className={`${inputClass} min-h-[82px] resize-y leading-7`}
          placeholder="لماذا هذه الإجابة صحيحة؟"
        />

        {concepts.length > 0 && (
          <div className="mt-4">
            <label className={labelClass}>المفاهيم المرتبطة</label>
            <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto rounded-lg border border-ink-800 bg-ink-950 p-2">
              {concepts.map((concept) => {
                const active = (form.conceptIds || []).includes(concept.id);
                return (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => {
                      const current = form.conceptIds || [];
                      setField(
                        'conceptIds',
                        active ? current.filter((id) => id !== concept.id) : [...current, concept.id],
                      );
                    }}
                    className={`rounded-md border px-2 py-1 text-xs font-arabic transition-colors ${
                      active
                        ? 'border-sand-700 bg-sand-900/40 text-sand-300'
                        : 'border-ink-700 bg-ink-900 text-ink-500 hover:border-ink-600'
                    }`}
                  >
                    {concept.titleAr}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-800 bg-ink-950 px-3 py-2 text-xs text-ink-400 font-arabic">
            <input
              type="checkbox"
              checked={!!form.feedEligible}
              onChange={(e) => setField('feedEligible', e.target.checked)}
              className="accent-sand-600"
            />
            يظهر في التغذية
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-800 bg-ink-950 px-3 py-2 text-xs text-ink-400 font-arabic">
            <input
              type="checkbox"
              checked={!!form.isCheckpoint}
              onChange={(e) => setField('isCheckpoint', e.target.checked)}
              className="accent-sand-600"
            />
            نقطة تحقق
          </label>
        </div>
      </section>
    </div>
  );
}

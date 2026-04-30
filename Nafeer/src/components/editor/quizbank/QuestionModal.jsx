'use client';
import Modal from '@/components/editor/shared/Modal';
import QuestionForm from './QuestionForm';
import { QUESTION_TYPES, QUESTION_TYPE_CONFIG } from '@/shared/constants';

const labelClass = 'block text-xs text-ink-500 mb-1.5 font-arabic';

export default function QuestionModal({
  isOpen,
  onClose,
  editingId,
  form,
  setForm,
  onSave,
  concepts,
  units,
  lessons,
  isTestSubject = false,
}) {
  const hasAnswer = (() => {
    if (form.type === 'MATCH') {
      return Array.isArray(form.options) && form.options.some((pair) => pair.right?.trim() && pair.left?.trim());
    }
    if (form.type === 'ORDER') {
      return Array.isArray(form.options) && form.options.filter((item) => item?.trim()).length > 1;
    }
    return form.correctAnswer?.trim().length > 0;
  })();

  const canSave = form.textAr?.trim().length > 0 && hasAnswer && (form.lessonId || isTestSubject);

  const resetPayloadForType = (key, cfg) => ({
    ...form,
    type: key,
    correctAnswer: '',
    options: key === 'MCQ'
      ? ['', '', '', '']
      : key === 'MATCH'
        ? [{ right: '', left: '' }, { right: '', left: '' }]
        : key === 'ORDER'
          ? ['', '', '']
          : null,
    feedEligible: cfg.feedEligible,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
      size="xl"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-ink-800 bg-ink-950/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className={labelClass}>نوع السؤال</label>
            <span className="text-[11px] text-ink-600 font-arabic">اختر القالب ثم اكتب السؤال مباشرة</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {Object.entries(QUESTION_TYPES).map(([key]) => {
              const cfg = QUESTION_TYPE_CONFIG[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(resetPayloadForType(key, cfg))}
                  className={`flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs transition-colors font-arabic ${
                    form.type === key
                      ? 'border-sand-700 bg-sand-900/50 text-sand-200 shadow-[inset_0_0_0_1px_rgba(212,137,30,0.18)]'
                      : 'border-ink-800 bg-ink-900 text-ink-500 hover:border-ink-600 hover:text-ink-300'
                  }`}
                >
                  <span className="font-mono text-base">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <QuestionForm
          form={form}
          setForm={setForm}
          concepts={concepts}
          units={units}
          lessons={lessons}
        />

        <div className="mt-5 flex gap-3 border-t border-ink-800 pt-3">
          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="flex-1 rounded-lg bg-sand-600 py-2.5 text-ink-950 transition-colors hover:bg-sand-500 disabled:cursor-not-allowed disabled:opacity-40 font-semibold font-arabic"
          >
            {editingId ? 'حفظ التعديلات' : 'إضافة السؤال'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-ink-400 transition-colors hover:bg-ink-800 font-arabic"
          >
            إلغاء
          </button>
        </div>
      </div>
    </Modal>
  );
}

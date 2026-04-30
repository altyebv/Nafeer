'use client';
import Modal              from '@/components/editor/shared/Modal';
import QuestionForm       from './QuestionForm';
import { QUESTION_TYPES, QUESTION_TYPE_CONFIG } from '@/shared/constants';

const labelClass = 'block text-xs text-ink-500 mb-1.5 font-arabic';

// ─── QuestionModal ────────────────────────────────────────────────────────────
// Modal shell wrapping QuestionForm.
// Owns the type-selector grid and the save/cancel action row.
// Props:
//   isOpen        — boolean
//   onClose       — () => void
//   editingId     — string | null  (null = create mode)
//   form          — question draft object
//   setForm       — setter for the draft
//   onSave        — () => void  (called when the user confirms)
//   concepts/units/lessons — passed through to QuestionForm
//   isTestSubject — boolean  (bypasses lessonId requirement)

export default function QuestionModal({
  isOpen, onClose,
  editingId, form, setForm, onSave,
  concepts, units, lessons,
  isTestSubject = false,
}) {
  const canSave = form.textAr?.trim().length > 0 && (form.lessonId || isTestSubject);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
      size="xl"
    >
      <div className="space-y-4">

        {/* ── Type selector ─────────────────────────────────────────────── */}
        <div>
          <label className={labelClass}>نوع السؤال</label>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(QUESTION_TYPES).map(([key]) => {
              const cfg = QUESTION_TYPE_CONFIG[key];
              return (
                <button
                  key={key}
                  onClick={() => setForm({ ...form, type: key, correctAnswer: '', options: null })}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs transition-colors border font-arabic
                    ${form.type === key
                      ? 'bg-sand-900/50 text-sand-300 border-sand-700'
                      : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
                >
                  <span className="font-mono text-base">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form fields ───────────────────────────────────────────────── */}
        <QuestionForm
          form={form}
          setForm={setForm}
          concepts={concepts}
          units={units}
          lessons={lessons}
        />

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2 border-t border-ink-800 mt-5">
          <button
            onClick={onSave}
            disabled={!canSave}
            className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 transition-colors font-semibold font-arabic"
          >
            {editingId ? 'حفظ التعديلات' : 'إضافة السؤال'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-ink-400 hover:bg-ink-800 rounded-lg transition-colors font-arabic"
          >
            إلغاء
          </button>
        </div>

      </div>
    </Modal>
  );
}
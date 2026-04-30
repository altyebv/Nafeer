'use client';
import Modal from '@/components/editor/shared/Modal';
import {
  EXAM_SOURCES, EXAM_SOURCE_CONFIG,
  EXAM_TYPES,   EXAM_TYPE_CONFIG,
} from '@/shared/constants';

const inputClass =
  'w-full px-3 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm ' +
  'focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

const labelClass = 'block text-xs text-ink-500 mb-1.5 font-arabic';

// ─── ExamModal ────────────────────────────────────────────────────────────────
// Modal for creating / editing an exam record.
// Props:
//   isOpen      — boolean
//   onClose     — () => void
//   editingId   — string | null
//   form        — exam draft object
//   setForm     — setter for the draft
//   onSave      — () => void

export default function ExamModal({ isOpen, onClose, editingId, form, setForm, onSave }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'تعديل الامتحان' : 'إضافة امتحان جديد'}
    >
      <div className="space-y-4">

        {/* Title */}
        <div>
          <label className={labelClass}>عنوان الامتحان *</label>
          <input
            type="text"
            value={form.titleAr}
            onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
            className={inputClass}
            placeholder="مثال: امتحان الجغرافيا النهائي 2023"
            autoFocus
          />
        </div>

        {/* Source / type */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>المصدر</label>
            <select
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className={`${inputClass} cursor-pointer`}
            >
              {Object.entries(EXAM_SOURCES).map(([key]) => (
                <option key={key} value={key}>{EXAM_SOURCE_CONFIG[key].icon} {EXAM_SOURCE_CONFIG[key].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>نوع الامتحان</label>
            <select
              value={form.examType || ''}
              onChange={(e) => setForm({ ...form, examType: e.target.value || null })}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">غير محدد</option>
              {Object.entries(EXAM_TYPES).map(([key]) => (
                <option key={key} value={key}>{EXAM_TYPE_CONFIG[key].label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Year / duration / total points */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>السنة</label>
            <input
              type="number"
              value={form.year || ''}
              onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) || null })}
              className={inputClass}
              placeholder="2023"
            />
          </div>
          <div>
            <label className={labelClass}>المدة (دقيقة)</label>
            <input
              type="number"
              value={form.duration || ''}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || null })}
              className={inputClass}
              placeholder="180"
            />
          </div>
          <div>
            <label className={labelClass}>الدرجة الكلية</label>
            <input
              type="number"
              value={form.totalPoints || ''}
              onChange={(e) => setForm({ ...form, totalPoints: parseInt(e.target.value) || null })}
              className={inputClass}
              placeholder="100"
            />
          </div>
        </div>

        {/* School name */}
        <div>
          <label className={labelClass}>اسم المدرسة (إن كان مدرسياً)</label>
          <input
            type="text"
            value={form.schoolName || ''}
            onChange={(e) => setForm({ ...form, schoolName: e.target.value || null })}
            className={inputClass}
            placeholder="اسم المدرسة..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onSave}
            disabled={!form.titleAr?.trim()}
            className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 transition-colors font-semibold font-arabic"
          >
            {editingId ? 'حفظ التعديلات' : 'إنشاء الامتحان'}
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
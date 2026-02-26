import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PATH_CONFIG, STUDENT_PATHS } from '@/shared/constants';
import UnitCard from '@/components/editor/UnitCard';
import Modal    from '@/components/editor/Modal';

const inputClass =
  'w-full px-4 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600 text-sm';

const labelClass = 'block text-sm text-ink-400 mb-1.5 font-arabic';

export default function LessonsPage({ onEditLesson }) {
  const { subject, setSubject, units, addUnit } = useDataStore();

  const [showSubjectModal, setShowSubjectModal] = useState(!subject);
  const [showUnitModal,    setShowUnitModal]    = useState(false);
  const [subjectForm,      setSubjectForm]      = useState({
    nameAr:   subject?.nameAr || '',
    nameEn:   subject?.nameEn || '',
    path:     subject?.path   || 'LITERARY',
    isMajor:  subject?.isMajor || false,
    colorHex: subject?.colorHex || '',
    order:    subject?.order || 0,
  });
  const [unitTitle, setUnitTitle] = useState('');

  const handleSaveSubject = () => {
    if (!subjectForm.nameAr.trim()) return;
    setSubject({
      ...subjectForm,
      id: subject?.id || subjectForm.nameAr.toLowerCase().replace(/\s+/g, '_'),
    });
    setShowSubjectModal(false);
  };

  const handleAddUnit = () => {
    if (!unitTitle.trim()) return;
    addUnit({ title: unitTitle });
    setUnitTitle('');
    setShowUnitModal(false);
  };

  const sortedUnits = [...units].sort((a, b) => a.order - b.order);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-sand-200 font-arabic">الدروس</h1>
          <p className="text-ink-500 mt-0.5 text-sm font-arabic">إدارة الوحدات والدروس والمحتوى</p>
        </div>

        {subject && (
          <button
            onClick={() => setShowSubjectModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-ink-800 rounded-lg text-ink-300 hover:bg-ink-700 hover:text-sand-300 transition-colors border border-ink-700"
          >
            <span className="text-base">📚</span>
            <span className="font-arabic text-sm">{subject.nameAr}</span>
            <span className={`text-xs px-1.5 py-0.5 bg-ink-700 rounded font-arabic ${PATH_CONFIG[subject.path]?.color || ''}`}>
              {PATH_CONFIG[subject.path]?.label}
            </span>
          </button>
        )}
      </div>

      {/* Empty — no subject */}
      {!subject && (
        <div className="text-center py-20 bg-ink-900 rounded-xl border border-ink-800">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-lg font-medium text-ink-200 mb-2 font-arabic">ابدأ بتحديد المادة</h2>
          <p className="text-ink-500 mb-6 text-sm font-arabic">حدد المادة الدراسية أولاً لبدء إضافة الوحدات والدروس</p>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="px-6 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 transition-colors font-semibold font-arabic"
          >
            تحديد المادة
          </button>
        </div>
      )}

      {/* Units */}
      {subject && (
        <>
          <div className="space-y-3">
            {sortedUnits.map((unit) => (
              <UnitCard key={unit.id} unit={unit} onEditLesson={onEditLesson} />
            ))}
          </div>

          <button
            onClick={() => setShowUnitModal(true)}
            className="w-full mt-4 py-4 border-2 border-dashed border-ink-800 rounded-xl text-ink-600 hover:border-sand-800 hover:text-sand-500 hover:bg-sand-900/10 transition-colors font-arabic"
          >
            + إضافة وحدة جديدة
          </button>
        </>
      )}

      {/* Subject Modal */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => { if (subject) setShowSubjectModal(false); }}
        title={subject ? 'تعديل المادة الدراسية' : 'تحديد المادة الدراسية'}
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>اسم المادة بالعربية *</label>
            <input
              type="text"
              value={subjectForm.nameAr}
              onChange={(e) => setSubjectForm({ ...subjectForm, nameAr: e.target.value })}
              className={inputClass}
              placeholder="مثال: الجغرافيا"
              autoFocus
            />
          </div>

          <div>
            <label className={labelClass}>اسم المادة بالإنجليزية (اختياري)</label>
            <input
              type="text"
              value={subjectForm.nameEn}
              onChange={(e) => setSubjectForm({ ...subjectForm, nameEn: e.target.value })}
              className={`${inputClass} direction-ltr`}
              placeholder="Geography"
              dir="ltr"
            />
          </div>

          <div>
            <label className={labelClass}>المسار الدراسي</label>
            <div className="flex gap-2">
              {Object.entries(STUDENT_PATHS).map(([key]) => (
                <button
                  key={key}
                  onClick={() => setSubjectForm({ ...subjectForm, path: key })}
                  className={`flex-1 py-2 rounded-lg text-sm font-arabic transition-colors border
                    ${subjectForm.path === key
                      ? 'bg-sand-900/60 text-sand-300 border-sand-700'
                      : 'bg-ink-800 text-ink-400 border-ink-700 hover:border-ink-600'
                    }`}
                >
                  {PATH_CONFIG[key].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>لون المادة (hex)</label>
              <input
                type="text"
                value={subjectForm.colorHex}
                onChange={(e) => setSubjectForm({ ...subjectForm, colorHex: e.target.value })}
                className={inputClass}
                placeholder="#4CAF50"
                dir="ltr"
              />
            </div>
            <div>
              <label className={labelClass}>ترتيب العرض</label>
              <input
                type="number"
                value={subjectForm.order}
                onChange={(e) => setSubjectForm({ ...subjectForm, order: parseInt(e.target.value) || 0 })}
                className={inputClass}
                min="0"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 py-1">
            <button
              onClick={() => setSubjectForm({ ...subjectForm, isMajor: !subjectForm.isMajor })}
              className={`w-10 h-6 rounded-full transition-colors ${subjectForm.isMajor ? 'bg-sand-600' : 'bg-ink-700'}`}
            >
              <span className={`block w-4 h-4 bg-white rounded-full mx-1 transition-transform ${subjectForm.isMajor ? 'translate-x-4' : ''}`} />
            </button>
            <span className="text-sm text-ink-400 font-arabic">مادة رئيسية (isMajor)</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveSubject}
              disabled={!subjectForm.nameAr.trim()}
              className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold font-arabic"
            >
              حفظ
            </button>
            {subject && (
              <button
                onClick={() => setShowSubjectModal(false)}
                className="px-4 py-2 text-ink-400 hover:bg-ink-800 rounded-lg transition-colors font-arabic"
              >
                إلغاء
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Add Unit Modal */}
      <Modal isOpen={showUnitModal} onClose={() => setShowUnitModal(false)} title="إضافة وحدة جديدة">
        <div className="space-y-4">
          <div>
            <label className={labelClass}>عنوان الوحدة</label>
            <input
              type="text"
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
              className={inputClass}
              placeholder="مثال: الوحدة الأولى: الجغرافيا الطبيعية"
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAddUnit}
              disabled={!unitTitle.trim()}
              className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold font-arabic"
            >
              إضافة
            </button>
            <button
              onClick={() => setShowUnitModal(false)}
              className="px-4 py-2 text-ink-400 hover:bg-ink-800 rounded-lg transition-colors font-arabic"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

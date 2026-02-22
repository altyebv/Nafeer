import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { PATH_CONFIG, STUDENT_PATHS } from '@/shared/constants';
import UnitCard from '@/components/editor/UnitCard';
import Modal from '@/components/editor/Modal';

export default function LessonsPage({ onEditLesson }) {
  const { subject, setSubject, units, addUnit } = useDataStore();
  
  const [showSubjectModal, setShowSubjectModal] = useState(!subject);
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [subjectForm, setSubjectForm] = useState({
    nameAr: subject?.nameAr || '',
    nameEn: subject?.nameEn || '',
    path: subject?.path || 'LITERARY',
  });
  const [unitTitle, setUnitTitle] = useState('');

  const handleSaveSubject = () => {
    if (!subjectForm.nameAr.trim()) return;
    setSubject({
      ...subjectForm,
      id: subjectForm.nameAr.toLowerCase().replace(/\s+/g, '_'),
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
          <h1 className="text-3xl font-semibold text-stone-800">الدروس</h1>
          <p className="text-stone-500 mt-1">إدارة الوحدات والدروس</p>
        </div>
        
        {subject && (
          <button
            onClick={() => setShowSubjectModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-lg text-stone-600 hover:bg-stone-200 transition-colors"
          >
            <span className="text-lg">📚</span>
            <span>{subject.nameAr}</span>
            <span className="text-xs bg-stone-200 px-2 py-0.5 rounded">
              {PATH_CONFIG[subject.path]?.label}
            </span>
          </button>
        )}
      </div>

      {/* Empty state if no subject */}
      {!subject && (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <div className="text-5xl mb-4">📚</div>
          <h2 className="text-xl font-medium text-stone-700 mb-2">ابدأ بتحديد المادة</h2>
          <p className="text-stone-500 mb-6">حدد المادة الدراسية أولاً لبدء إضافة الوحدات والدروس</p>
          <button
            onClick={() => setShowSubjectModal(true)}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
          >
            تحديد المادة
          </button>
        </div>
      )}

      {/* Units list */}
      {subject && (
        <>
          <div className="space-y-4">
            {sortedUnits.map((unit) => (
              <UnitCard 
                key={unit.id} 
                unit={unit} 
                onEditLesson={onEditLesson}
              />
            ))}
          </div>

          {/* Add unit button */}
          <button
            onClick={() => setShowUnitModal(true)}
            className="w-full mt-4 py-4 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            + إضافة وحدة جديدة
          </button>
        </>
      )}

      {/* Subject Modal */}
      <Modal
        isOpen={showSubjectModal}
        onClose={() => subject && setShowSubjectModal(false)}
        title="إعداد المادة"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              اسم المادة بالعربية *
            </label>
            <input
              type="text"
              value={subjectForm.nameAr}
              onChange={(e) => setSubjectForm({ ...subjectForm, nameAr: e.target.value })}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="مثال: الجغرافيا"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              اسم المادة بالإنجليزية
            </label>
            <input
              type="text"
              value={subjectForm.nameEn}
              onChange={(e) => setSubjectForm({ ...subjectForm, nameEn: e.target.value })}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Example: Geography"
              dir="ltr"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              المسار
            </label>
            <select
              value={subjectForm.path}
              onChange={(e) => setSubjectForm({ ...subjectForm, path: e.target.value })}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            >
              {Object.entries(STUDENT_PATHS).map(([key, value]) => (
                <option key={key} value={value}>
                  {PATH_CONFIG[key].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveSubject}
            disabled={!subjectForm.nameAr.trim()}
            className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            حفظ
          </button>
          {subject && (
            <button
              onClick={() => setShowSubjectModal(false)}
              className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
            >
              إلغاء
            </button>
          )}
        </div>
      </Modal>

      {/* Add Unit Modal */}
      <Modal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        title="إضافة وحدة جديدة"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            عنوان الوحدة
          </label>
          <input
            type="text"
            value={unitTitle}
            onChange={(e) => setUnitTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddUnit()}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="مثال: الوحدة الأولى: الجغرافيا الطبيعية"
            autoFocus
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleAddUnit}
            disabled={!unitTitle.trim()}
            className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            إضافة
          </button>
          <button
            onClick={() => setShowUnitModal(false)}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}

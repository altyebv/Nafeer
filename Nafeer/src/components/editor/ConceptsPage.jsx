import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { CONCEPT_TYPES, CONCEPT_TYPE_CONFIG } from '@/shared/constants';
import Modal from '@/components/editor/editor/Modal';

export default function ConceptsPage() {
  const { concepts, sections, tags, addConcept, updateConcept, deleteConcept, addTag } = useDataStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    titleAr: '',
    titleEn: '',
    type: 'DEFINITION',
    definition: '',
    shortDefinition: '',
    formula: '',
    tagIds: [],
    difficulty: 1,
  });

  const [newTagName, setNewTagName] = useState('');

  const resetForm = () => {
    setForm({
      titleAr: '',
      titleEn: '',
      type: 'DEFINITION',
      definition: '',
      shortDefinition: '',
      formula: '',
      tagIds: [],
      difficulty: 1,
    });
    setEditingId(null);
    setNewTagName('');
  };

  const handleSubmit = () => {
    if (!form.titleAr.trim()) return;

    if (editingId) {
      updateConcept(editingId, form);
    } else {
      addConcept(form);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (concept) => {
    setForm({
      titleAr: concept.titleAr || '',
      titleEn: concept.titleEn || '',
      type: concept.type || 'DEFINITION',
      definition: concept.definition || '',
      shortDefinition: concept.shortDefinition || '',
      formula: concept.formula || '',
      tagIds: concept.tagIds || [],
      difficulty: concept.difficulty || 1,
    });
    setEditingId(concept.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المفهوم؟')) {
      deleteConcept(id);
    }
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const newTag = { nameAr: newTagName.trim() };
    addTag(newTag);
    setNewTagName('');
  };

  const toggleTag = (tagId) => {
    const newTagIds = form.tagIds.includes(tagId)
      ? form.tagIds.filter(id => id !== tagId)
      : [...form.tagIds, tagId];
    setForm({ ...form, tagIds: newTagIds });
  };

  const getUsageCount = (conceptId) => {
    return sections.filter((s) => s.conceptIds?.includes(conceptId)).length;
  };

  const getTagNames = (tagIds) => {
    return tagIds
      ?.map(id => tags.find(t => t.id === id)?.nameAr)
      .filter(Boolean)
      .join('، ') || '';
  };

  const filteredConcepts = concepts.filter((c) => {
    const matchesType = !filterType || c.type === filterType;
    const matchesSearch =
      !search ||
      c.titleAr?.toLowerCase().includes(search.toLowerCase()) ||
      c.titleEn?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">المفاهيم</h1>
          <p className="text-stone-500 mt-1">{concepts.length} مفهوم</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          + إضافة مفهوم
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(CONCEPT_TYPES).slice(0, 5).map(([key, value]) => {
          const config = CONCEPT_TYPE_CONFIG[key];
          const count = concepts.filter((c) => c.type === value).length;
          return (
            <button
              key={key}
              onClick={() => setFilterType(filterType === value ? '' : value)}
              className={`p-4 rounded-xl border text-center transition-colors ${
                filterType === value
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-white border-stone-200 hover:border-amber-300'
              }`}
            >
              <div className="text-2xl mb-1">{config.icon}</div>
              <div className="text-2xl font-semibold text-stone-800">{count}</div>
              <div className="text-xs text-stone-500">{config.label}</div>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          placeholder="ابحث عن مفهوم..."
        />
      </div>

      {/* Concepts List */}
      {filteredConcepts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <div className="text-5xl mb-4">💡</div>
          <h2 className="text-xl font-medium text-stone-700 mb-2">
            {concepts.length === 0 ? 'لا توجد مفاهيم بعد' : 'لا توجد نتائج'}
          </h2>
          {concepts.length === 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              أضف أول مفهوم
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConcepts.map((concept) => {
            const config = CONCEPT_TYPE_CONFIG[concept.type];
            return (
              <div
                key={concept.id}
                className="flex items-center gap-4 p-4 bg-white border border-stone-200 rounded-xl hover:border-amber-300 transition-colors"
              >
                <span className="text-2xl">{config?.icon}</span>

                <div className="flex-1">
                  <div className="font-medium text-stone-800">
                    {concept.titleAr}
                    {concept.titleEn && (
                      <span className="text-stone-400 text-sm mr-2">
                        ({concept.titleEn})
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-stone-500 mt-1">
                    {concept.shortDefinition || concept.definition?.slice(0, 80)}
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-stone-100 rounded">
                      صعوبة: {concept.difficulty}/5
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded">
                      مستخدم في {getUsageCount(concept.id)} أقسام
                    </span>
                    {concept.tagIds?.length > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                        {getTagNames(concept.tagIds)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(concept)}
                    className="px-3 py-1 text-sm text-stone-600 hover:bg-stone-100 rounded transition-colors"
                  >
                    ✏️ تعديل
                  </button>
                  <button
                    onClick={() => handleDelete(concept.id)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'تعديل المفهوم' : 'إضافة مفهوم جديد'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                العنوان بالعربية *
              </label>
              <input
                type="text"
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="مثال: خطوط العرض"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                العنوان بالإنجليزية
              </label>
              <input
                type="text"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="Example: Latitude"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                النوع
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                {Object.entries(CONCEPT_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {CONCEPT_TYPE_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                الصعوبة (1-5)
              </label>
              <input
                type="number"
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                min="1"
                max="5"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              التعريف المختصر
            </label>
            <input
              type="text"
              value={form.shortDefinition}
              onChange={(e) => setForm({ ...form, shortDefinition: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="تعريف مختصر للبطاقات"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              التعريف الكامل
            </label>
            <textarea
              value={form.definition}
              onChange={(e) => setForm({ ...form, definition: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg resize-y min-h-[80px] focus:ring-2 focus:ring-amber-500"
              placeholder="الشرح التفصيلي..."
            />
          </div>

          {(form.type === 'FORMULA' || form.type === 'LAW') && (
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                المعادلة / الصيغة
              </label>
              <input
                type="text"
                value={form.formula}
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="مثال: E = mc²"
                dir="ltr"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              الوسوم (Tags)
            </label>
            
            {/* Existing tags */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      form.tagIds.includes(tag.id)
                        ? 'bg-amber-500 text-white'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {tag.nameAr}
                  </button>
                ))}
              </div>
            )}

            {/* Add new tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="أضف وسم جديد..."
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 disabled:opacity-50 transition-colors"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!form.titleAr.trim()}
            className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors"
          >
            {editingId ? 'حفظ التعديلات' : 'إضافة'}
          </button>
          <button
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
            className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
        </div>
      </Modal>
    </div>
  );
}

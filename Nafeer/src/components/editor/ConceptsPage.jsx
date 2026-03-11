import { useState } from 'react';
import { useDataStore }  from '@/store/dataStore';
import { useAtlasSync }  from '@/hooks/useAtlasSync';
import { CONCEPT_TYPES, CONCEPT_TYPE_CONFIG }  from '@/shared/constants';
import Modal from '@/components/editor/Modal';
import DeleteButton from '@/components/editor/DeleteButton';
import StatusBadge from '@/components/editor/StatusBadge';

const inputClass =
  'w-full px-4 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

const labelClass = 'block text-xs text-ink-500 mb-1.5 font-arabic';

export default function ConceptsPage({ subjectId }) {
  const { concepts, tags, addConcept, updateConcept, deleteConcept, addTag } = useDataStore();
  const { syncConcept, submitForReview } = useAtlasSync();

  const [showModal,   setShowModal]   = useState(false);
  const [editingId,   setEditingId]   = useState(null);
  const [filterType,  setFilterType]  = useState('');
  const [search,      setSearch]      = useState('');
  const [newTagName,  setNewTagName]  = useState('');

  const [form, setForm] = useState({
    titleAr: '', titleEn: '', type: 'DEFINITION',
    definition: '', shortDefinition: '', formula: '',
    tagIds: [], difficulty: 1,
  });

  const resetForm = () => {
    setForm({ titleAr: '', titleEn: '', type: 'DEFINITION',
      definition: '', shortDefinition: '', formula: '', tagIds: [], difficulty: 1 });
    setEditingId(null);
    setNewTagName('');
  };

  const handleSubmit = () => {
    if (!form.titleAr.trim()) return;
    if (editingId) {
      updateConcept(editingId, form);
      if (subjectId) syncConcept(editingId, subjectId).catch(() => {});
    } else {
      const newId = `concept_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      addConcept({ ...form, id: newId });
      if (subjectId) syncConcept(newId, subjectId).catch(() => {});
    }
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (concept) => {
    setForm({
      titleAr:         concept.titleAr         || '',
      titleEn:         concept.titleEn         || '',
      type:            concept.type            || 'DEFINITION',
      definition:      concept.definition      || '',
      shortDefinition: concept.shortDefinition || '',
      formula:         concept.formula         || '',
      tagIds:          concept.tagIds          || [],
      difficulty:      concept.difficulty      || 1,
    });
    setEditingId(concept.id);
    setShowModal(true);
  };

  const handleDelete = (id) => deleteConcept(id);

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    addTag({ nameAr: newTagName.trim() });
    setNewTagName('');
  };

  const toggleTagInForm = (tagId) => {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(tagId)
        ? f.tagIds.filter((id) => id !== tagId)
        : [...f.tagIds, tagId],
    }));
  };

  const filtered = concepts.filter((c) => {
    const matchType   = !filterType || c.type === filterType;
    const matchSearch = !search || c.titleAr?.includes(search) || c.titleEn?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-sand-200 font-arabic">المفاهيم</h1>
          <p className="text-ink-500 mt-0.5 text-sm font-arabic">
            الوحدة الذرية للمعرفة — تربط الدروس والتغذية والأسئلة
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-semibold font-arabic text-sm"
        >
          + مفهوم جديد
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFilterType('')}
          className={`px-3 py-1.5 rounded-lg text-xs font-arabic transition-colors border
            ${!filterType ? 'bg-sand-900/50 text-sand-400 border-sand-700' : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
        >
          الكل ({concepts.length})
        </button>
        {Object.entries(CONCEPT_TYPES).map(([key]) => {
          const cfg   = CONCEPT_TYPE_CONFIG[key];
          const count = concepts.filter((c) => c.type === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilterType(filterType === key ? '' : key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-arabic transition-colors border flex items-center gap-1
                ${filterType === key ? 'bg-sand-900/50 text-sand-400 border-sand-700' : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
            >
              <span>{cfg.icon}</span>
              <span>{cfg.label}</span>
              <span className="font-mono text-ink-600">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2.5 bg-ink-900 border border-ink-800 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-600 mb-6"
        placeholder="بحث في المفاهيم..."
      />

      {/* Tags Section */}
      {tags.length > 0 && (
        <div className="mb-6 p-4 bg-ink-900 border border-ink-800 rounded-xl">
          <h3 className="text-xs text-ink-500 mb-2 font-arabic">الوسوم</h3>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag.id} className="px-2 py-0.5 bg-ink-800 text-ink-400 text-xs rounded border border-ink-700 font-arabic">
                #{tag.nameAr}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Concepts Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-ink-900 rounded-xl border border-ink-800">
          <div className="text-4xl mb-4">💡</div>
          <p className="text-ink-400 font-arabic">
            {concepts.length === 0 ? 'لا توجد مفاهيم بعد' : 'لا توجد نتائج'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((concept) => {
            const cfg = CONCEPT_TYPE_CONFIG[concept.type];
            const conceptTags = tags.filter((t) => concept.tagIds?.includes(t.id));
            return (
              <div
                key={concept.id}
                className="flex items-start gap-4 p-4 bg-ink-900 rounded-xl border border-ink-800 hover:border-ink-700 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-ink-800 rounded-lg text-sm flex-shrink-0">
                  {cfg?.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-ink-100 text-sm font-arabic">{concept.titleAr}</span>
                    {concept.titleEn && (
                      <span className="text-xs text-ink-600" dir="ltr">{concept.titleEn}</span>
                    )}
                    <span className="text-xs px-1.5 py-0.5 bg-ink-800 text-ink-500 rounded font-arabic border border-ink-700">
                      {cfg?.label}
                    </span>
                    <span className="text-xs text-ink-700 font-mono">
                      {'★'.repeat(concept.difficulty || 1)}
                    </span>
                    {concept.atlasStatus && <StatusBadge status={concept.atlasStatus} />}
                  </div>
                  <p className="text-xs text-ink-500 line-clamp-2 font-arabic">{concept.definition}</p>
                  {conceptTags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {conceptTags.map((t) => (
                        <span key={t.id} className="text-xs px-1.5 py-0.5 bg-ink-800 text-ink-600 rounded font-arabic">
                          #{t.nameAr}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(!concept.atlasStatus || concept.atlasStatus === 'draft') && subjectId && (
                    <button
                      onClick={() => submitForReview(concept.id, 'concept').catch(() => {})}
                      className="px-2 py-1 text-[10px] bg-amber-900/30 text-amber-500 border border-amber-700/40 rounded transition-colors hover:bg-amber-800/40 font-arabic"
                      title="إرسال للمراجعة"
                    >
                      ⇪
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(concept)}
                    className="p-1.5 text-ink-600 hover:text-sand-400 hover:bg-ink-800 rounded transition-colors"
                  >
                    ✏
                  </button>
                  <DeleteButton onDelete={() => handleDelete(concept.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? 'تعديل مفهوم' : 'إضافة مفهوم جديد'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>العنوان بالعربية *</label>
              <input
                type="text"
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                className={inputClass}
                placeholder="مثال: قانون نيوتن الأول"
                autoFocus
              />
            </div>
            <div>
              <label className={labelClass}>العنوان بالإنجليزية</label>
              <input
                type="text"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className={`${inputClass}`}
                placeholder="Newton's First Law"
                dir="ltr"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>النوع</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                {Object.entries(CONCEPT_TYPES).map(([key]) => (
                  <option key={key} value={key}>
                    {CONCEPT_TYPE_CONFIG[key].icon} {CONCEPT_TYPE_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>الصعوبة (1–5)</label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, difficulty: n })}
                    className={`flex-1 py-2 rounded-lg text-xs font-mono transition-colors border
                      ${form.difficulty === n
                        ? 'bg-sand-900/60 text-sand-400 border-sand-700'
                        : 'bg-ink-800 text-ink-600 border-ink-700 hover:border-ink-600'
                      }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass}>التعريف الكامل *</label>
            <textarea
              value={form.definition}
              onChange={(e) => setForm({ ...form, definition: e.target.value })}
              className={`${inputClass} resize-y min-h-[80px]`}
              placeholder="التعريف أو الشرح الكامل..."
            />
          </div>

          <div>
            <label className={labelClass}>تعريف مختصر (يُستخدم في التغذية)</label>
            <input
              type="text"
              value={form.shortDefinition}
              onChange={(e) => setForm({ ...form, shortDefinition: e.target.value })}
              className={inputClass}
              placeholder="جملة واحدة تلخص المفهوم..."
            />
          </div>

          {(form.type === 'FORMULA' || form.type === 'LAW') && (
            <div>
              <label className={labelClass}>الصيغة / المعادلة</label>
              <input
                type="text"
                value={form.formula}
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
                className={`${inputClass} font-mono`}
                placeholder="F = ma"
                dir="ltr"
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className={labelClass}>الوسوم</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagInForm(tag.id)}
                  className={`px-2 py-0.5 text-xs rounded border font-arabic transition-colors
                    ${form.tagIds.includes(tag.id)
                      ? 'bg-sand-900/50 text-sand-400 border-sand-700'
                      : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                    }`}
                >
                  #{tag.nameAr}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                className={`${inputClass} flex-1`}
                placeholder="وسم جديد..."
              />
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="px-3 py-2 bg-ink-800 text-ink-300 rounded-lg hover:bg-ink-700 disabled:opacity-40 transition-colors text-sm"
              >
                + إضافة
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!form.titleAr.trim()}
              className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 transition-colors font-semibold font-arabic"
            >
              {editingId ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              onClick={() => { setShowModal(false); resetForm(); }}
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
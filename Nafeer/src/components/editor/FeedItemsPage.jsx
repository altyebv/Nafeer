import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import {
  FEED_ITEM_TYPES,
  FEED_ITEM_TYPE_CONFIG,
  INTERACTION_TYPES,
  INTERACTION_TYPE_CONFIG,
} from '@/shared/constants';
import Modal from '@/components/editor/Modal';

export default function FeedItemsPage() {
  const { feedItems, concepts, addFeedItem, updateFeedItem, deleteFeedItem } = useDataStore();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [filterConcept, setFilterConcept] = useState('');

  const [form, setForm] = useState({
    conceptId: '',
    type: 'DEFINITION',
    contentAr: '',
    contentEn: '',
    imageUrl: '',
    interactionType: '',
    correctAnswer: '',
    options: '',
    explanation: '',
    priority: 1,
  });

  const resetForm = () => {
    setForm({
      conceptId: '',
      type: 'DEFINITION',
      contentAr: '',
      contentEn: '',
      imageUrl: '',
      interactionType: '',
      correctAnswer: '',
      options: '',
      explanation: '',
      priority: 1,
    });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.conceptId || !form.contentAr.trim()) return;

    const data = {
      ...form,
      interactionType: form.interactionType || null,
      options: form.options || null,
      correctAnswer: form.correctAnswer || null,
      explanation: form.explanation || null,
    };

    if (editingId) {
      updateFeedItem(editingId, data);
    } else {
      addFeedItem(data);
    }

    resetForm();
    setShowModal(false);
  };

  const handleEdit = (feedItem) => {
    setForm({
      conceptId: feedItem.conceptId || '',
      type: feedItem.type || 'DEFINITION',
      contentAr: feedItem.contentAr || '',
      contentEn: feedItem.contentEn || '',
      imageUrl: feedItem.imageUrl || '',
      interactionType: feedItem.interactionType || '',
      correctAnswer: feedItem.correctAnswer || '',
      options: feedItem.options || '',
      explanation: feedItem.explanation || '',
      priority: feedItem.priority || 1,
    });
    setEditingId(feedItem.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      deleteFeedItem(id);
    }
  };

  const handleQuickCreate = (concept) => {
    // Pre-fill form with concept data for quick feed item creation
    setForm({
      conceptId: concept.id,
      type: concept.type === 'FORMULA' ? 'FORMULA' : 
            concept.type === 'DATE' ? 'DATE' :
            concept.type === 'FACT' ? 'FACT' :
            concept.type === 'LAW' ? 'RULE' : 'DEFINITION',
      contentAr: concept.shortDefinition || concept.definition || '',
      contentEn: '',
      imageUrl: concept.imageUrl || '',
      interactionType: '',
      correctAnswer: '',
      options: '',
      explanation: '',
      priority: concept.difficulty || 1,
    });
    setEditingId(null);
    setShowModal(true);
  };

  const getConceptTitle = (conceptId) => {
    const concept = concepts.find(c => c.id === conceptId);
    return concept?.titleAr || 'غير معروف';
  };

  const filteredFeedItems = feedItems.filter((f) => {
    const matchesType = !filterType || f.type === filterType;
    const matchesConcept = !filterConcept || f.conceptId === filterConcept;
    return matchesType && matchesConcept;
  });

  // Group feed items by concept for better organization
  const feedItemsByConcept = filteredFeedItems.reduce((acc, item) => {
    const conceptId = item.conceptId;
    if (!acc[conceptId]) acc[conceptId] = [];
    acc[conceptId].push(item);
    return acc;
  }, {});

  const conceptsWithoutFeed = concepts.filter(
    c => !feedItems.some(f => f.conceptId === c.id)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">عناصر التغذية</h1>
          <p className="text-stone-500 mt-1">
            {feedItems.length} عنصر • {concepts.length} مفهوم
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
        >
          + إضافة عنصر
        </button>
      </div>

      {/* Stats by type */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {Object.entries(FEED_ITEM_TYPES).map(([key, value]) => {
          const config = FEED_ITEM_TYPE_CONFIG[key];
          const count = feedItems.filter((f) => f.type === value).length;
          return (
            <button
              key={key}
              onClick={() => setFilterType(filterType === value ? '' : value)}
              className={`p-3 rounded-xl border text-center transition-colors ${
                filterType === value
                  ? 'bg-amber-50 border-amber-300'
                  : 'bg-white border-stone-200 hover:border-amber-300'
              }`}
            >
              <div className="text-xl mb-1">{config.icon}</div>
              <div className="text-lg font-semibold text-stone-800">{count}</div>
              <div className="text-xs text-stone-500">{config.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filter by concept */}
      <div className="flex gap-4 mb-6">
        <select
          value={filterConcept}
          onChange={(e) => setFilterConcept(e.target.value)}
          className="flex-1 px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
        >
          <option value="">جميع المفاهيم</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titleAr}
            </option>
          ))}
        </select>
        
        {(filterType || filterConcept) && (
          <button
            onClick={() => { setFilterType(''); setFilterConcept(''); }}
            className="px-4 py-2 text-stone-500 hover:text-stone-700"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Concepts without feed items */}
      {conceptsWithoutFeed.length > 0 && !filterConcept && !filterType && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            ⚠️ مفاهيم بدون عناصر تغذية ({conceptsWithoutFeed.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {conceptsWithoutFeed.slice(0, 10).map((concept) => (
              <button
                key={concept.id}
                onClick={() => handleQuickCreate(concept)}
                className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-lg hover:bg-yellow-200 transition-colors"
              >
                + {concept.titleAr}
              </button>
            ))}
            {conceptsWithoutFeed.length > 10 && (
              <span className="px-3 py-1 text-yellow-600 text-sm">
                و {conceptsWithoutFeed.length - 10} آخرين...
              </span>
            )}
          </div>
        </div>
      )}

      {/* Feed Items List */}
      {filteredFeedItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200">
          <div className="text-5xl mb-4">📱</div>
          <h2 className="text-xl font-medium text-stone-700 mb-2">
            {feedItems.length === 0 ? 'لا توجد عناصر تغذية بعد' : 'لا توجد نتائج'}
          </h2>
          <p className="text-stone-500 mb-4">
            عناصر التغذية تظهر للطالب في شاشة المراجعة السريعة
          </p>
          {feedItems.length === 0 && concepts.length > 0 && (
            <button
              onClick={() => handleQuickCreate(concepts[0])}
              className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              أنشئ أول عنصر
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(feedItemsByConcept).map(([conceptId, items]) => (
            <div key={conceptId} className="bg-white border border-stone-200 rounded-xl overflow-hidden">
              {/* Concept Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💡</span>
                  <span className="font-medium text-stone-800">
                    {getConceptTitle(conceptId)}
                  </span>
                  <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded">
                    {items.length} عناصر
                  </span>
                </div>
                <button
                  onClick={() => {
                    const concept = concepts.find(c => c.id === conceptId);
                    if (concept) handleQuickCreate(concept);
                  }}
                  className="text-sm text-amber-600 hover:text-amber-700"
                >
                  + إضافة
                </button>
              </div>

              {/* Feed Items */}
              <div className="divide-y divide-stone-100">
                {items.map((item) => {
                  const config = FEED_ITEM_TYPE_CONFIG[item.type];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 hover:bg-stone-50 transition-colors"
                    >
                      <span className="text-2xl">{config?.icon}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 bg-stone-100 rounded">
                            {config?.label}
                          </span>
                          {item.interactionType && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                              {INTERACTION_TYPE_CONFIG[item.interactionType]?.label}
                            </span>
                          )}
                          <span className="text-xs text-stone-400">
                            أولوية: {item.priority}/5
                          </span>
                        </div>
                        <p className="text-stone-800 line-clamp-2">{item.contentAr}</p>
                        {item.type === 'MINI_QUIZ' && item.correctAnswer && (
                          <p className="text-sm text-green-600 mt-1">
                            ✓ الإجابة: {item.correctAnswer}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingId ? 'تعديل عنصر التغذية' : 'إضافة عنصر تغذية جديد'}
      >
        <div className="space-y-4">
          {/* Concept Selection */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              المفهوم المرتبط *
            </label>
            <select
              value={form.conceptId}
              onChange={(e) => setForm({ ...form, conceptId: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
            >
              <option value="">اختر مفهوم...</option>
              {concepts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.titleAr}
                </option>
              ))}
            </select>
          </div>

          {/* Type & Priority */}
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
                {Object.entries(FEED_ITEM_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {FEED_ITEM_TYPE_CONFIG[key].icon} {FEED_ITEM_TYPE_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                الأولوية (1-5)
              </label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                min="1"
                max="5"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              المحتوى بالعربية *
            </label>
            <textarea
              value={form.contentAr}
              onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg resize-y min-h-[80px] focus:ring-2 focus:ring-amber-500"
              placeholder={form.type === 'MINI_QUIZ' ? 'اكتب السؤال هنا...' : 'المحتوى الذي سيظهر للطالب...'}
            />
          </div>

          {/* Mini Quiz specific fields */}
          {form.type === 'MINI_QUIZ' && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  نوع التفاعل
                </label>
                <select
                  value={form.interactionType}
                  onChange={(e) => setForm({ ...form, interactionType: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">اختر نوع التفاعل...</option>
                  {Object.entries(INTERACTION_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {INTERACTION_TYPE_CONFIG[key].icon} {INTERACTION_TYPE_CONFIG[key].label}
                    </option>
                  ))}
                </select>
              </div>

              {form.interactionType === 'SWIPE_TF' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    الإجابة الصحيحة
                  </label>
                  <select
                    value={form.correctAnswer}
                    onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">اختر...</option>
                    <option value="true">صح ←</option>
                    <option value="false">→ خطأ</option>
                  </select>
                </div>
              )}

              {form.interactionType === 'MCQ' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      الخيارات (JSON)
                    </label>
                    <textarea
                      value={form.options}
                      onChange={(e) => setForm({ ...form, options: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg resize-y min-h-[60px] focus:ring-2 focus:ring-amber-500 font-mono text-sm"
                      placeholder='["الخيار أ", "الخيار ب", "الخيار ج", "الخيار د"]'
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      الإجابة الصحيحة
                    </label>
                    <input
                      type="text"
                      value={form.correctAnswer}
                      onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      placeholder="الخيار الصحيح بالضبط"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  التفسير (يظهر بعد الإجابة)
                </label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg resize-y min-h-[60px] focus:ring-2 focus:ring-amber-500"
                  placeholder="لماذا هذه الإجابة صحيحة..."
                />
              </div>
            </>
          )}

          {/* Image URL */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              مسار الصورة (اختياري)
            </label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="images/diagram.png"
              dir="ltr"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!form.conceptId || !form.contentAr.trim()}
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

import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import {
  FEED_ITEM_TYPES, FEED_ITEM_TYPE_CONFIG,
  INTERACTION_TYPES, INTERACTION_TYPE_CONFIG,
} from '@/shared/constants';
import Modal from '@/components/editor/Modal';

const inputClass =
  'w-full px-3 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

const labelClass = 'block text-xs text-ink-500 mb-1.5 font-arabic';

export default function FeedItemsPage() {
  const { feedItems, concepts, questions, addFeedItem, updateFeedItem, deleteFeedItem } = useDataStore();

  const [showModal,       setShowModal]       = useState(false);
  const [editingId,       setEditingId]       = useState(null);
  const [filterType,      setFilterType]      = useState('');
  const [filterConcept,   setFilterConcept]   = useState('');

  const emptyForm = {
    conceptId: '', type: 'DEFINITION', contentAr: '', back: '',
    contentEn: '', imageUrl: '', interactionType: '',
    correctAnswer: '', options: '', explanation: '',
    questionId: '', priority: 1,
  };

  const [form, setForm] = useState(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditingId(null); };

  const handleSubmit = () => {
    if (!form.conceptId || !form.contentAr.trim()) return;
    const data = {
      ...form,
      back:            form.back            || null,
      interactionType: form.interactionType || null,
      options:         form.options         || null,
      correctAnswer:   form.correctAnswer   || null,
      explanation:     form.explanation     || null,
      questionId:      form.questionId      || null,
    };
    if (editingId) updateFeedItem(editingId, data);
    else           addFeedItem(data);
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (item) => {
    setForm({
      conceptId:       item.conceptId       || '',
      type:            item.type            || 'DEFINITION',
      contentAr:       item.contentAr       || '',
      back:            item.back            || '',
      contentEn:       item.contentEn       || '',
      imageUrl:        item.imageUrl        || '',
      interactionType: item.interactionType || '',
      correctAnswer:   item.correctAnswer   || '',
      options:         item.options         || '',
      explanation:     item.explanation     || '',
      questionId:      item.questionId      || '',
      priority:        item.priority        || 1,
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleQuickCreate = (concept) => {
    setForm({
      ...emptyForm,
      conceptId:  concept.id,
      type:       concept.type === 'FORMULA' ? 'FORMULA'
                : concept.type === 'DATE'    ? 'DATE'
                : concept.type === 'FACT'    ? 'FACT'
                : concept.type === 'LAW'     ? 'RULE'
                : 'DEFINITION',
      contentAr: concept.shortDefinition || concept.definition || '',
      imageUrl:  concept.imageUrl || '',
      priority:  concept.difficulty || 1,
    });
    setShowModal(true);
  };

  const getConceptTitle = (id) => concepts.find((c) => c.id === id)?.titleAr || 'غير معروف';

  const filtered = feedItems.filter((f) => {
    const matchType    = !filterType    || f.type       === filterType;
    const matchConcept = !filterConcept || f.conceptId  === filterConcept;
    return matchType && matchConcept;
  });

  const byConcept = filtered.reduce((acc, item) => {
    if (!acc[item.conceptId]) acc[item.conceptId] = [];
    acc[item.conceptId].push(item);
    return acc;
  }, {});

  const conceptsWithoutFeed = concepts.filter((c) => !feedItems.some((f) => f.conceptId === c.id));

  const isInteractive = (type) => type === 'MINI_QUIZ';
  const isFlashCard   = (type) => type === 'FLASH_CARD';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-sand-200 font-arabic">التغذية</h1>
          <p className="text-ink-500 mt-0.5 text-sm font-arabic">
            {feedItems.length} بطاقة · {concepts.length} مفهوم
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="px-4 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-semibold font-arabic text-sm"
        >
          + إضافة بطاقة
        </button>
      </div>

      {/* Type Stats */}
      <div className="grid grid-cols-4 gap-2 mb-5">
        {Object.entries(FEED_ITEM_TYPES).map(([key, value]) => {
          const cfg   = FEED_ITEM_TYPE_CONFIG[key];
          const count = feedItems.filter((f) => f.type === value).length;
          return (
            <button
              key={key}
              onClick={() => setFilterType(filterType === value ? '' : value)}
              className={`p-3 rounded-xl border text-center transition-colors
                ${filterType === value
                  ? 'bg-sand-900/50 border-sand-700'
                  : 'bg-ink-900 border-ink-800 hover:border-ink-700'
                }`}
            >
              <div className="text-lg mb-0.5">{cfg.icon}</div>
              <div className="text-base font-semibold text-ink-100 font-mono">{count}</div>
              <div className="text-xs text-ink-500 font-arabic">{cfg.label}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterConcept}
          onChange={(e) => setFilterConcept(e.target.value)}
          className="flex-1 px-3 py-2 bg-ink-900 border border-ink-800 rounded-lg text-ink-300 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic"
        >
          <option value="">جميع المفاهيم</option>
          {concepts.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
        </select>

        {(filterType || filterConcept) && (
          <button
            onClick={() => { setFilterType(''); setFilterConcept(''); }}
            className="px-3 py-2 text-ink-500 hover:text-ink-300 text-sm font-arabic"
          >
            مسح الفلاتر
          </button>
        )}
      </div>

      {/* Concepts without feed */}
      {conceptsWithoutFeed.length > 0 && !filterConcept && !filterType && (
        <div className="mb-5 p-4 bg-sand-900/10 border border-sand-800/30 rounded-xl">
          <h3 className="text-xs font-medium text-sand-600 mb-2 font-arabic">
            ⚠ مفاهيم بدون بطاقات ({conceptsWithoutFeed.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {conceptsWithoutFeed.slice(0, 12).map((concept) => (
              <button
                key={concept.id}
                onClick={() => handleQuickCreate(concept)}
                className="px-2 py-1 bg-sand-900/30 text-sand-500 text-xs rounded border border-sand-800/50 hover:bg-sand-800/40 transition-colors font-arabic"
              >
                + {concept.titleAr}
              </button>
            ))}
            {conceptsWithoutFeed.length > 12 && (
              <span className="text-xs text-ink-600 self-center font-arabic">
                و{conceptsWithoutFeed.length - 12} أخرى
              </span>
            )}
          </div>
        </div>
      )}

      {/* Feed Items */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-ink-900 rounded-xl border border-ink-800">
          <div className="text-4xl mb-4">📱</div>
          <p className="text-ink-400 font-arabic">
            {feedItems.length === 0 ? 'لا توجد بطاقات بعد' : 'لا توجد نتائج'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byConcept).map(([conceptId, items]) => (
            <div key={conceptId} className="bg-ink-900 border border-ink-800 rounded-xl overflow-hidden">
              {/* Concept Header */}
              <div className="flex items-center justify-between px-4 py-3 bg-ink-800/40 border-b border-ink-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💡</span>
                  <span className="font-medium text-ink-200 text-sm font-arabic">{getConceptTitle(conceptId)}</span>
                  <span className="text-xs bg-ink-800 text-ink-500 px-1.5 py-0.5 rounded font-mono border border-ink-700">
                    {items.length}
                  </span>
                </div>
                <button
                  onClick={() => { const c = concepts.find((c) => c.id === conceptId); if (c) handleQuickCreate(c); }}
                  className="text-xs text-ink-600 hover:text-sand-400 transition-colors font-arabic"
                >
                  + إضافة
                </button>
              </div>

              {/* Items */}
              <div className="divide-y divide-ink-800">
                {items.map((item) => {
                  const cfg = FEED_ITEM_TYPE_CONFIG[item.type];
                  return (
                    <div key={item.id} className="flex items-start gap-3 p-4 hover:bg-ink-800/30 transition-colors group">
                      <span className="text-xl">{cfg?.icon}</span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs px-1.5 py-0.5 bg-ink-800 text-ink-400 rounded border border-ink-700 font-arabic">
                            {cfg?.label}
                          </span>
                          {item.interactionType && (
                            <span className="text-xs px-1.5 py-0.5 bg-sand-900/40 text-sand-500 rounded border border-sand-800/50 font-arabic">
                              {INTERACTION_TYPE_CONFIG[item.interactionType]?.label}
                            </span>
                          )}
                          {item.questionId && (
                            <span className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-800/50 font-arabic">
                              من بنك الأسئلة
                            </span>
                          )}
                          <span className="text-xs text-ink-700 font-mono">p:{item.priority}</span>
                        </div>
                        <p className="text-sm text-ink-300 line-clamp-2 font-arabic">{item.contentAr}</p>
                        {item.back && (
                          <p className="text-xs text-ink-500 mt-0.5 font-arabic">الوجه الخلفي: {item.back}</p>
                        )}
                        {item.type === 'MINI_QUIZ' && item.correctAnswer && (
                          <p className="text-xs text-green-500 mt-0.5 font-arabic">✓ {item.correctAnswer}</p>
                        )}
                      </div>

                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-ink-600 hover:text-sand-400 rounded transition-colors"
                        >
                          ✏
                        </button>
                        <button
                          onClick={() => { if (confirm('حذف؟')) deleteFeedItem(item.id); }}
                          className="p-1.5 text-ink-600 hover:text-red-500 rounded transition-colors"
                        >
                          ✕
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

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? 'تعديل البطاقة' : 'إضافة بطاقة تغذية'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Concept */}
          <div>
            <label className={labelClass}>المفهوم المرتبط *</label>
            <select
              value={form.conceptId}
              onChange={(e) => setForm({ ...form, conceptId: e.target.value })}
              className={`${inputClass} cursor-pointer`}
            >
              <option value="">اختر مفهوم...</option>
              {concepts.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
            </select>
          </div>

          {/* Type & Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>نوع البطاقة</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, interactionType: '' })}
                className={`${inputClass} cursor-pointer`}
              >
                {Object.entries(FEED_ITEM_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {FEED_ITEM_TYPE_CONFIG[key].icon} {FEED_ITEM_TYPE_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>الأولوية (1–5)</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
                className={inputClass}
                min="1" max="5"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className={labelClass}>
              {isFlashCard(form.type) ? 'الوجه الأمامي *' : 'المحتوى الرئيسي *'}
            </label>
            <textarea
              value={form.contentAr}
              onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
              className={`${inputClass} resize-y min-h-[80px]`}
              placeholder={isInteractive(form.type) ? 'اكتب السؤال هنا...' : 'المحتوى الذي سيظهر للطالب...'}
            />
          </div>

          {/* Flash Card back */}
          {isFlashCard(form.type) && (
            <div>
              <label className={labelClass}>الوجه الخلفي *</label>
              <textarea
                value={form.back}
                onChange={(e) => setForm({ ...form, back: e.target.value })}
                className={`${inputClass} resize-y min-h-[70px]`}
                placeholder="الإجابة أو التعريف الذي يظهر عند قلب البطاقة..."
              />
            </div>
          )}

          {/* Mini Quiz specific */}
          {isInteractive(form.type) && (
            <>
              <div>
                <label className={labelClass}>نوع التفاعل</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(INTERACTION_TYPES).map(([key, value]) => {
                    const cfg = INTERACTION_TYPE_CONFIG[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, interactionType: value })}
                        className={`py-2 px-3 rounded-lg text-sm text-right transition-colors border flex items-center gap-2 font-arabic
                          ${form.interactionType === value
                            ? 'bg-sand-900/50 text-sand-300 border-sand-700'
                            : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                          }`}
                      >
                        <span className="font-mono">{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.interactionType === 'SWIPE_TF' && (
                <div>
                  <label className={labelClass}>الإجابة الصحيحة</label>
                  <div className="flex gap-2">
                    {[['true', '✓ صح'], ['false', '✕ خطأ']].map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setForm({ ...form, correctAnswer: val })}
                        className={`flex-1 py-2 rounded-lg text-sm transition-colors border font-arabic
                          ${form.correctAnswer === val
                            ? (val === 'true' ? 'bg-green-900/40 text-green-400 border-green-700' : 'bg-red-900/40 text-red-400 border-red-700')
                            : 'bg-ink-800 text-ink-500 border-ink-700'
                          }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.interactionType === 'MCQ' && (
                <>
                  <div>
                    <label className={labelClass}>
                      الخيارات — كل سطر خيار منفصل
                    </label>
                    <textarea
                      value={form.options}
                      onChange={(e) => setForm({ ...form, options: e.target.value })}
                      className={`${inputClass} resize-y min-h-[80px]`}
                      placeholder={'الخيار أ\nالخيار ب\nالخيار ج\nالخيار د'}
                    />
                    <p className="text-xs text-ink-700 mt-1 font-arabic">
                      سيتم تحويلها تلقائياً إلى مصفوفة JSON عند التصدير
                    </p>
                  </div>
                  <div>
                    <label className={labelClass}>الإجابة الصحيحة (انسخ الخيار بالضبط)</label>
                    <input
                      type="text"
                      value={form.correctAnswer}
                      onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                      className={inputClass}
                      placeholder="الخيار الصحيح..."
                    />
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>التفسير (يظهر بعد الإجابة)</label>
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  className={`${inputClass} resize-y min-h-[60px]`}
                  placeholder="لماذا هذه الإجابة صحيحة..."
                />
              </div>
            </>
          )}

          {/* Link to question bank */}
          {feedItems.length > 0 && questions.length > 0 && (
            <div>
              <label className={labelClass}>ربط بسؤال من بنك الأسئلة (اختياري)</label>
              <select
                value={form.questionId}
                onChange={(e) => setForm({ ...form, questionId: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">لا يوجد ربط</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.type}] {q.textAr.slice(0, 60)}...
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Image */}
          <div>
            <label className={labelClass}>مسار الصورة (اختياري)</label>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="images/diagram.png"
              dir="ltr"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!form.conceptId || !form.contentAr.trim()}
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

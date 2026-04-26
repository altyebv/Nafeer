import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import {
  FEED_ITEM_TYPES, FEED_ITEM_TYPE_CONFIG,
  INTERACTION_TYPES, INTERACTION_TYPE_CONFIG,
} from '@/shared/constants';
import Modal from '@/components/editor/shared/Modal';
import DeleteButton from '@/components/editor/shared/DeleteButton';
import StatusBadge from '@/components/editor/shared/StatusBadge';

// ─── Theme primitives ─────────────────────────────────────────────────────────
const FIELD = {
  padding: '10px 14px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-mid)',
  borderRadius: 10,
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

// Feed type accent colours
const TYPE_COLOR = {
  DEFINITION: '#6366f1',
  FLASHCARD:  '#3b82f6',
  FACT:       '#10b981',
  FORMULA:    '#f59e0b',
  DATE:       '#ec4899',
  RULE:       '#ef4444',
  MINI_QUIZ:  '#8b5cf6',
  FLASH_CARD: '#3b82f6',
};

function typeBg(type) {
  const c = TYPE_COLOR[type] || 'var(--accent)';
  return { bg: `${c}15`, fg: c, border: `${c}40` };
}

export default function FeedItemsPage({ subjectId }) {
  const { feedItems, concepts, questions, units, lessons, addFeedItem, updateFeedItem, deleteFeedItem } = useDataStore();
  const { syncFeedItem, submitForReview, deleteFeedItem: atlasDeleteFeedItem } = useAtlasSync();

  const [showModal,       setShowModal]       = useState(false);
  const [editingId,       setEditingId]       = useState(null);
  const [filterType,      setFilterType]      = useState('');
  const [filterConcept,   setFilterConcept]   = useState('');

  const emptyForm = {
    unitId: '', lessonId: '',
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
      unitId:          form.unitId          || null,
      lessonId:        form.lessonId        || null,
      back:            form.back            || null,
      interactionType: form.interactionType || null,
      options:         form.options         || null,
      correctAnswer:   form.correctAnswer   || null,
      explanation:     form.explanation     || null,
      questionId:      form.questionId      || null,
    };

    if (editingId) {
      updateFeedItem(editingId, data);
      if (subjectId) syncFeedItem(editingId, subjectId).catch(() => {});
    } else {
      const newId = `feed_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      addFeedItem({ ...data, id: newId });
      if (subjectId) syncFeedItem(newId, subjectId).catch(() => {});
    }
    resetForm();
    setShowModal(false);
  };

  const handleEdit = (item) => {
    setForm({
      unitId:          item.unitId           || '',
      lessonId:        item.lessonId         || '',
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

  const handleDeleteFeedItem = (feedItemId) => {
    deleteFeedItem(feedItemId);
    if (subjectId) atlasDeleteFeedItem(feedItemId);
  };

  const getConceptTitle = (id) => concepts.find((c) => c.id === id)?.titleAr || '—';

  const filtered = feedItems.filter((f) => {
    const matchType    = !filterType    || f.type       === filterType;
    const matchConcept = !filterConcept || f.conceptId  === filterConcept;
    return matchType && matchConcept;
  });

  const byConcept = filtered.reduce((acc, item) => {
    const key = item.conceptId || '__none__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const conceptsWithoutFeed = concepts.filter((c) => !feedItems.some((f) => f.conceptId === c.id));
  const isInteractive = (type) => type === 'MINI_QUIZ';
  const isFlashCard   = (type) => type === 'FLASH_CARD';

  // Type stat breakdown
  const typeStats = Object.entries(FEED_ITEM_TYPES).map(([key, value]) => ({
    key, value,
    cfg:   FEED_ITEM_TYPE_CONFIG[key],
    count: feedItems.filter((f) => f.type === value).length,
  }));

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-bold font-arabic" style={{ fontSize: 24, color: 'var(--text-primary)' }}>
            التغذية
          </h1>
          <p className="font-arabic mt-0.5" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {feedItems.length} بطاقة · {concepts.length} مفهوم
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="font-arabic font-semibold flex items-center gap-1.5"
          style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13,
            background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> إضافة بطاقة
        </button>
      </div>

      {/* ── Type stat grid ─────────────────────────────────────────────────── */}
      <div className="grid gap-2 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
        {typeStats.map(({ key, value, cfg, count }) => {
          const { bg, fg, border } = typeBg(key);
          const active = filterType === value;
          return (
            <button
              key={key}
              onClick={() => setFilterType(active ? '' : value)}
              className="text-center transition-all"
              style={{
                padding: '12px 8px', borderRadius: 12,
                background: active ? bg : 'var(--bg-card)',
                border: `1px solid ${active ? border : 'var(--border-subtle)'}`,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 20, marginBottom: 4 }}>{cfg.icon}</div>
              <div className="font-mono font-semibold" style={{ fontSize: 17, color: active ? fg : 'var(--text-secondary)' }}>
                {count}
              </div>
              <div className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                {cfg.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Filters row ────────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-6">
        <select
          value={filterConcept}
          onChange={(e) => setFilterConcept(e.target.value)}
          style={{ ...FIELD, flex: 1, cursor: 'pointer' }}
          className="font-arabic"
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
        >
          <option value="">جميع المفاهيم</option>
          {concepts.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
        </select>

        {(filterType || filterConcept) && (
          <button
            onClick={() => { setFilterType(''); setFilterConcept(''); }}
            className="font-arabic"
            style={{
              padding: '8px 14px', borderRadius: 10, fontSize: 13,
              background: 'var(--bg-secondary)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border-subtle)', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
          >
            ✕ مسح الفلاتر
          </button>
        )}
      </div>

      {/* ── Concepts without feed — quick-create strip ─────────────────────── */}
      {conceptsWithoutFeed.length > 0 && !filterConcept && !filterType && (
        <div
          className="mb-6 p-4"
          style={{
            background: 'rgba(212,137,30,0.06)',
            border: '1px solid rgba(212,137,30,0.2)',
            borderRadius: 12,
          }}
        >
          <p className="font-arabic mb-2.5" style={{ fontSize: 12, color: 'var(--accent)' }}>
            ⚠ مفاهيم بدون بطاقات ({conceptsWithoutFeed.length}) — انقر لإنشاء بطاقة سريعة
          </p>
          <div className="flex flex-wrap gap-1.5">
            {conceptsWithoutFeed.slice(0, 12).map((concept) => (
              <button
                key={concept.id}
                onClick={() => handleQuickCreate(concept)}
                className="font-arabic transition-colors"
                style={{
                  fontSize: 12, padding: '4px 10px', borderRadius: 20,
                  background: 'var(--accent-dim)',
                  color: 'var(--accent)',
                  border: '1px solid rgba(212,137,30,0.3)', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,137,30,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
              >
                + {concept.titleAr}
              </button>
            ))}
            {conceptsWithoutFeed.length > 12 && (
              <span className="font-arabic self-center" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                و{conceptsWithoutFeed.length - 12} أخرى
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Feed items ─────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="📱"
          title={feedItems.length === 0 ? 'لا توجد بطاقات بعد' : 'لا توجد نتائج'}
          action={feedItems.length === 0 ? (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="font-arabic"
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 10, fontSize: 13,
                background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
              }}
            >
              أضف أول بطاقة
            </button>
          ) : null}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(byConcept).map(([conceptId, items]) => {
            const concept = concepts.find((c) => c.id === conceptId);
            return (
              <ConceptGroup
                key={conceptId}
                conceptId={conceptId}
                conceptTitle={getConceptTitle(conceptId)}
                items={items}
                onEdit={handleEdit}
                onDelete={handleDeleteFeedItem}
                onReview={(id) => submitForReview(id, 'feedItem').catch(() => {})}
                onAddForConcept={() => concept && handleQuickCreate(concept)}
                subjectId={subjectId}
              />
            );
          })}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? 'تعديل البطاقة' : 'إضافة بطاقة تغذية'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Lesson assignment */}
          <div
            className="grid grid-cols-2 gap-3 p-3"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-mid)',
              borderRadius: 12,
            }}
          >
            <FormField label="الوحدة *">
              <select
                value={form.unitId}
                onChange={(e) => setForm({ ...form, unitId: e.target.value, lessonId: '' })}
                style={{ ...FIELD, cursor: 'pointer' }}
                className="font-arabic"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              >
                <option value="">اختر الوحدة...</option>
                {[...units].sort((a, b) => a.order - b.order).map((u) => (
                  <option key={u.id} value={u.id}>{u.title}</option>
                ))}
              </select>
            </FormField>
            <FormField label="الدرس *">
              <select
                value={form.lessonId}
                onChange={(e) => setForm({ ...form, lessonId: e.target.value })}
                style={{ ...FIELD, cursor: 'pointer', opacity: !form.unitId ? 0.5 : 1 }}
                disabled={!form.unitId}
                className="font-arabic"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              >
                <option value="">{form.unitId ? 'اختر الدرس...' : 'اختر الوحدة أولاً'}</option>
                {lessons
                  .filter((l) => l.unitId === form.unitId)
                  .sort((a, b) => a.order - b.order)
                  .map((l) => <option key={l.id} value={l.id}>{l.title}</option>)
                }
              </select>
            </FormField>
          </div>

          {/* Concept */}
          <FormField label="المفهوم المرتبط">
            <select
              value={form.conceptId}
              onChange={(e) => setForm({ ...form, conceptId: e.target.value })}
              style={{ ...FIELD, cursor: 'pointer' }}
              className="font-arabic"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
            >
              <option value="">بدون مفهوم محدد</option>
              {concepts.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
            </select>
          </FormField>

          {/* Type + Priority */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <FormField label="نوع البطاقة">
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value, interactionType: '' })}
                  style={{ ...FIELD, cursor: 'pointer' }}
                  className="font-arabic"
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                >
                  {Object.entries(FEED_ITEM_TYPES).map(([key, value]) => (
                    <option key={key} value={value}>
                      {FEED_ITEM_TYPE_CONFIG[key].icon} {FEED_ITEM_TYPE_CONFIG[key].label}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>
            <FormField label="الأولوية (1–5)">
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 1 })}
                style={FIELD}
                min="1" max="5"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              />
            </FormField>
          </div>

          {/* Content */}
          <FormField label={isFlashCard(form.type) ? 'الوجه الأمامي *' : 'المحتوى الرئيسي *'}>
            <textarea
              value={form.contentAr}
              onChange={(e) => setForm({ ...form, contentAr: e.target.value })}
              style={{ ...FIELD, resize: 'vertical', minHeight: 80, lineHeight: 1.8 }}
              placeholder={isInteractive(form.type) ? 'اكتب السؤال هنا...' : 'المحتوى الذي سيظهر للطالب...'}
              className="font-arabic"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
            />
          </FormField>

          {isFlashCard(form.type) && (
            <FormField label="الوجه الخلفي *">
              <textarea
                value={form.back}
                onChange={(e) => setForm({ ...form, back: e.target.value })}
                style={{ ...FIELD, resize: 'vertical', minHeight: 70, lineHeight: 1.8 }}
                placeholder="الإجابة أو التعريف الذي يظهر عند قلب البطاقة..."
                className="font-arabic"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              />
            </FormField>
          )}

          {isInteractive(form.type) && (
            <>
              <FormField label="نوع التفاعل">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(INTERACTION_TYPES).map(([key, value]) => {
                    const cfg = INTERACTION_TYPE_CONFIG[key];
                    const active = form.interactionType === value;
                    return (
                      <button
                        key={key}
                        onClick={() => setForm({ ...form, interactionType: value })}
                        className="flex items-center gap-2 font-arabic transition-all"
                        style={{
                          padding: '8px 12px', borderRadius: 10, fontSize: 13, textAlign: 'right',
                          background: active ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                          border: `1px solid ${active ? 'var(--accent)' : 'var(--border-mid)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ fontFamily: 'monospace' }}>{cfg.icon}</span>
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </FormField>

              {form.interactionType === 'SWIPE_TF' && (
                <FormField label="الإجابة الصحيحة">
                  <div className="flex gap-2">
                    {[['true', '✓ صح'], ['false', '✕ خطأ']].map(([val, lbl]) => (
                      <button
                        key={val}
                        onClick={() => setForm({ ...form, correctAnswer: val })}
                        className="flex-1 font-arabic transition-all"
                        style={{
                          padding: '9px', borderRadius: 10, fontSize: 13,
                          background: form.correctAnswer === val
                            ? (val === 'true' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)')
                            : 'var(--bg-secondary)',
                          color: form.correctAnswer === val
                            ? (val === 'true' ? '#10b981' : '#ef4444')
                            : 'var(--text-muted)',
                          border: `1px solid ${form.correctAnswer === val
                            ? (val === 'true' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)')
                            : 'var(--border-mid)'}`,
                          cursor: 'pointer',
                        }}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </FormField>
              )}

              {form.interactionType === 'MCQ' && (
                <>
                  <FormField label="الخيارات — كل سطر خيار منفصل">
                    <textarea
                      value={form.options}
                      onChange={(e) => setForm({ ...form, options: e.target.value })}
                      style={{ ...FIELD, resize: 'vertical', minHeight: 80, lineHeight: 1.8 }}
                      placeholder={'الخيار أ\nالخيار ب\nالخيار ج\nالخيار د'}
                      className="font-arabic"
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                    />
                  </FormField>
                  <FormField label="الإجابة الصحيحة (انسخ الخيار بالضبط)">
                    <input
                      type="text"
                      value={form.correctAnswer}
                      onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
                      style={FIELD}
                      placeholder="الخيار الصحيح..."
                      className="font-arabic"
                      onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                    />
                  </FormField>
                </>
              )}

              <FormField label="التفسير (يظهر بعد الإجابة)">
                <textarea
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                  style={{ ...FIELD, resize: 'vertical', minHeight: 60, lineHeight: 1.8 }}
                  placeholder="لماذا هذه الإجابة صحيحة..."
                  className="font-arabic"
                  onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
                />
              </FormField>
            </>
          )}

          {feedItems.length > 0 && questions.length > 0 && (
            <FormField label="ربط بسؤال من بنك الأسئلة (اختياري)">
              <select
                value={form.questionId}
                onChange={(e) => setForm({ ...form, questionId: e.target.value })}
                style={{ ...FIELD, cursor: 'pointer' }}
                className="font-arabic"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              >
                <option value="">لا يوجد ربط</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    [{q.type}] {q.textAr.slice(0, 60)}...
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <FormField label="مسار الصورة (اختياري)">
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              style={{ ...FIELD, fontFamily: 'monospace' }}
              placeholder="images/diagram.png"
              dir="ltr"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
            />
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!form.conceptId || !form.contentAr.trim()}
              className="flex-1 font-arabic font-semibold"
              style={{
                padding: 10, borderRadius: 10, fontSize: 14, border: 'none', cursor: 'pointer',
                background: (form.conceptId && form.contentAr.trim()) ? 'var(--accent)' : 'var(--border-mid)',
                color: (form.conceptId && form.contentAr.trim()) ? '#fff' : 'var(--text-muted)',
              }}
            >
              {editingId ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button
              onClick={() => { setShowModal(false); resetForm(); }}
              className="font-arabic"
              style={{
                padding: '10px 16px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
                background: 'transparent', color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Concept group card ───────────────────────────────────────────────────────
function ConceptGroup({ conceptId, conceptTitle, items, onEdit, onDelete, onReview, onAddForConcept, subjectId }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      {/* Group header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer"
        style={{ borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)' }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--accent)', fontSize: 14 }}>💡</span>
          <span className="font-arabic font-medium" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            {conceptTitle}
          </span>
          <span
            className="font-mono"
            style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10,
              background: 'var(--accent-dim)', color: 'var(--accent)',
            }}
          >
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddForConcept(); }}
            className="font-arabic"
            style={{
              fontSize: 12, padding: '3px 10px', borderRadius: 8,
              background: 'var(--bg-secondary)', color: 'var(--text-muted)',
              border: '1px solid var(--border-mid)', cursor: 'pointer',
            }}
          >
            + إضافة
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, transform: collapsed ? 'rotate(-90deg)' : 'none', transition: '0.2s' }}>
            ▾
          </span>
        </div>
      </div>

      {/* Items */}
      {!collapsed && (
        <div>
          {items.map((item, i) => {
            const cfg = FEED_ITEM_TYPE_CONFIG[item.type];
            const { bg, fg } = typeBg(item.type);
            return (
              <div
                key={item.id}
                className="group flex items-start gap-3 px-4 py-3"
                style={{
                  borderTop: i > 0 ? '1px solid var(--border-subtle)' : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Type indicator */}
                <div
                  style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 15,
                  }}
                >
                  {cfg?.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span
                      className="font-arabic"
                      style={{
                        fontSize: 11, padding: '2px 7px', borderRadius: 10,
                        background: bg, color: fg,
                        border: `1px solid ${fg}30`,
                      }}
                    >
                      {cfg?.label}
                    </span>
                    {item.interactionType && (
                      <span className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {INTERACTION_TYPE_CONFIG[item.interactionType]?.label}
                      </span>
                    )}
                    {item.questionId && (
                      <span className="font-arabic" style={{ fontSize: 11, color: '#3b82f6' }}>
                        من بنك الأسئلة
                      </span>
                    )}
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      p:{item.priority}
                    </span>
                    {item.atlasStatus && <StatusBadge status={item.atlasStatus} />}
                  </div>

                  <p className="font-arabic line-clamp-2" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {item.contentAr}
                  </p>

                  {item.back && (
                    <p className="font-arabic mt-0.5" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ↩ {item.back}
                    </p>
                  )}
                  {item.type === 'MINI_QUIZ' && item.correctAnswer && (
                    <p className="font-arabic mt-0.5" style={{ fontSize: 12, color: '#10b981' }}>
                      ✓ {item.correctAnswer}
                    </p>
                  )}
                </div>

                {/* Row actions */}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(!item.atlasStatus || item.atlasStatus === 'draft') && subjectId && (
                    <ActionBtn onClick={() => onReview(item.id)} title="إرسال للمراجعة" color="#f59e0b">⇪</ActionBtn>
                  )}
                  <ActionBtn onClick={() => onEdit(item)} title="تعديل">✏</ActionBtn>
                  <DeleteButton onDelete={() => onDelete(item.id)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Micro helpers ─────────────────────────────────────────────────────────────
function FormField({ label, children }) {
  return (
    <div>
      <label className="block font-arabic mb-1.5" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, title, color, children }) {
  return (
    <button
      onClick={onClick} title={title}
      style={{
        padding: '4px 6px', borderRadius: 6, fontSize: 13,
        background: 'transparent', color: color || 'var(--text-muted)',
        border: 'none', cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, action }) {
  return (
    <div
      className="text-center py-20"
      style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p className="font-arabic" style={{ fontSize: 14, color: 'var(--text-muted)' }}>{title}</p>
      {action}
    </div>
  );
}
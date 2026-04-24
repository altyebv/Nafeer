import { useState } from 'react';
import { useDataStore }  from '@/store/dataStore';
import { useAtlasSync }  from '@/hooks/useAtlasSync';
import { CONCEPT_TYPES, CONCEPT_TYPE_CONFIG }  from '@/shared/constants';
import Modal from '@/components/editor/shared/Modal';
import DeleteButton from '@/components/editor/shared/DeleteButton';
import StatusBadge from '@/components/editor/shared/StatusBadge';

// ─── Themed primitives ────────────────────────────────────────────────────────
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

// Soft colour accent per concept type — purely decorative strip
const TYPE_HUE = {
  DEFINITION:   '#6366f1',
  FORMULA:      '#f59e0b',
  DATE:         '#ec4899',
  PERSON:       '#10b981',
  LAW:          '#ef4444',
  FACT:         '#3b82f6',
  PROCESS:      '#8b5cf6',
  COMPARISON:   '#06b6d4',
  PLACE:        '#84cc16',
  CAUSE_EFFECT: '#f97316',
};

function TypePill({ type }) {
  const cfg   = CONCEPT_TYPE_CONFIG[type] || {};
  const color = TYPE_HUE[type] || 'var(--accent)';
  return (
    <span
      className="inline-flex items-center gap-1 font-arabic"
      style={{
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 20,
        background: `${color}18`,
        color,
        border: `1px solid ${color}40`,
        lineHeight: '18px',
      }}
    >
      <span style={{ fontSize: 10 }}>{cfg.icon}</span>
      {cfg.label}
    </span>
  );
}

function DifficultyDots({ n = 1, max = 5 }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            background: i < n ? 'var(--accent)' : 'var(--border-mid)',
          }}
        />
      ))}
    </span>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
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

  // Stat breakdown
  const typeCounts = Object.keys(CONCEPT_TYPES).reduce((acc, k) => {
    acc[k] = concepts.filter((c) => c.type === k).length;
    return acc;
  }, {});

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-bold font-arabic" style={{ fontSize: 24, color: 'var(--text-primary)' }}>
            المفاهيم
          </h1>
          <p className="font-arabic mt-0.5" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            الوحدة الذرية للمعرفة — تربط الدروس والتغذية والأسئلة
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="font-arabic font-semibold flex items-center gap-1.5 transition-colors"
          style={{
            padding: '8px 16px', borderRadius: 10, fontSize: 13,
            background: 'var(--accent)', color: '#fff',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent)'}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> مفهوم جديد
        </button>
      </div>

      {/* ── Stats strip ────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-5 mb-6 pb-5"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        <StatItem n={concepts.length} label="إجمالي" />
        {Object.entries(typeCounts).map(([k, n]) => n > 0 && (
          <StatItem key={k} n={n} label={CONCEPT_TYPE_CONFIG[k]?.label} color={TYPE_HUE[k]} />
        ))}
      </div>

      {/* ── Filter pills ───────────────────────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap mb-4">
        <FilterPill
          active={!filterType}
          onClick={() => setFilterType('')}
          label={`الكل (${concepts.length})`}
        />
        {Object.entries(CONCEPT_TYPES).map(([key]) => {
          const cfg   = CONCEPT_TYPE_CONFIG[key];
          const count = typeCounts[key];
          if (!count) return null;
          return (
            <FilterPill
              key={key}
              active={filterType === key}
              onClick={() => setFilterType(filterType === key ? '' : key)}
              label={`${cfg.icon} ${cfg.label}`}
              count={count}
              color={TYPE_HUE[key]}
            />
          );
        })}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="relative mb-6">
        <span
          className="absolute"
          style={{
            right: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 14, pointerEvents: 'none',
          }}
        >
          🔍
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...FIELD, paddingRight: 36 }}
          placeholder="بحث في المفاهيم..."
          className="font-arabic"
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
        />
      </div>

      {/* ── Tags cloud ─────────────────────────────────────────────────────── */}
      {tags.length > 0 && (
        <div
          className="mb-6 p-4"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
          }}
        >
          <p className="font-arabic mb-2.5" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            الوسوم
          </p>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="font-arabic"
                style={{
                  fontSize: 12, padding: '2px 8px', borderRadius: 20,
                  background: 'var(--accent-dim)', color: 'var(--accent)',
                  border: '1px solid var(--border-mid)',
                }}
              >
                #{tag.nameAr}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Concepts list ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="💡"
          title={concepts.length === 0 ? 'لا توجد مفاهيم بعد' : 'لا توجد نتائج'}
          action={concepts.length === 0 ? (
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="font-arabic"
              style={{
                marginTop: 12, padding: '8px 20px', borderRadius: 10, fontSize: 13,
                background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                border: 'none',
              }}
            >
              أضف أول مفهوم
            </button>
          ) : null}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((concept) => {
            const cfg         = CONCEPT_TYPE_CONFIG[concept.type];
            const conceptTags = tags.filter((t) => concept.tagIds?.includes(t.id));
            const accentColor = TYPE_HUE[concept.type] || 'var(--accent)';
            return (
              <div
                key={concept.id}
                className="group flex items-start gap-0"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--border-mid)';
                  e.currentTarget.style.background = 'var(--bg-secondary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-card)';
                }}
              >
                {/* Type accent stripe */}
                <div style={{ width: 3, background: accentColor, alignSelf: 'stretch', flexShrink: 0 }} />

                {/* Content */}
                <div className="flex items-start gap-3 flex-1 p-4 min-w-0">
                  {/* Icon */}
                  <div
                    style={{
                      width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                      background: `${accentColor}15`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    {cfg?.icon}
                  </div>

                  {/* Main text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-arabic font-semibold" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                        {concept.titleAr}
                      </span>
                      {concept.titleEn && (
                        <span className="font-mono" dir="ltr" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {concept.titleEn}
                        </span>
                      )}
                      <TypePill type={concept.type} />
                      <DifficultyDots n={concept.difficulty || 1} />
                      {concept.atlasStatus && <StatusBadge status={concept.atlasStatus} />}
                    </div>
                    <p className="font-arabic line-clamp-2" style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                      {concept.definition}
                    </p>
                    {conceptTags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {conceptTags.map((t) => (
                          <span
                            key={t.id}
                            className="font-arabic"
                            style={{
                              fontSize: 11, padding: '1px 6px', borderRadius: 10,
                              background: 'var(--accent-dim)', color: 'var(--text-muted)',
                            }}
                          >
                            #{t.nameAr}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ paddingTop: 2 }}
                  >
                    {(!concept.atlasStatus || concept.atlasStatus === 'draft') && subjectId && (
                      <ActionBtn
                        onClick={() => submitForReview(concept.id, 'concept').catch(() => {})}
                        title="إرسال للمراجعة"
                        color="#f59e0b"
                      >
                        ⇪
                      </ActionBtn>
                    )}
                    <ActionBtn onClick={() => handleEdit(concept)} title="تعديل">✏</ActionBtn>
                    <DeleteButton onDelete={() => deleteConcept(concept.id)} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? 'تعديل مفهوم' : 'إضافة مفهوم جديد'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="العنوان بالعربية *">
              <input
                type="text"
                value={form.titleAr}
                onChange={(e) => setForm({ ...form, titleAr: e.target.value })}
                style={FIELD}
                placeholder="مثال: قانون نيوتن الأول"
                className="font-arabic"
                autoFocus
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              />
            </FormField>
            <FormField label="العنوان بالإنجليزية">
              <input
                type="text"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                style={FIELD}
                placeholder="Newton's First Law"
                dir="ltr"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="النوع">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={{ ...FIELD, cursor: 'pointer' }}
                className="font-arabic"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              >
                {Object.entries(CONCEPT_TYPES).map(([key]) => (
                  <option key={key} value={key}>
                    {CONCEPT_TYPE_CONFIG[key].icon} {CONCEPT_TYPE_CONFIG[key].label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="الصعوبة (1–5)">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, difficulty: n })}
                    className="flex-1 font-mono transition-all"
                    style={{
                      padding: '8px 0', borderRadius: 8, fontSize: 13,
                      background: form.difficulty === n ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                      color: form.difficulty === n ? 'var(--accent)' : 'var(--text-muted)',
                      border: `1px solid ${form.difficulty === n ? 'var(--accent)' : 'var(--border-mid)'}`,
                      fontWeight: form.difficulty === n ? 600 : 400,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </FormField>
          </div>

          <FormField label="التعريف الكامل *">
            <textarea
              value={form.definition}
              onChange={(e) => setForm({ ...form, definition: e.target.value })}
              style={{ ...FIELD, resize: 'vertical', minHeight: 80, lineHeight: 1.8 }}
              placeholder="التعريف أو الشرح الكامل..."
              className="font-arabic"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
            />
          </FormField>

          <FormField label="تعريف مختصر (يُستخدم في التغذية)">
            <input
              type="text"
              value={form.shortDefinition}
              onChange={(e) => setForm({ ...form, shortDefinition: e.target.value })}
              style={FIELD}
              placeholder="جملة واحدة تلخص المفهوم..."
              className="font-arabic"
              onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
            />
          </FormField>

          {(form.type === 'FORMULA' || form.type === 'LAW') && (
            <FormField label="الصيغة / المعادلة">
              <input
                type="text"
                value={form.formula}
                onChange={(e) => setForm({ ...form, formula: e.target.value })}
                style={{ ...FIELD, fontFamily: 'monospace' }}
                placeholder="F = ma"
                dir="ltr"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              />
            </FormField>
          )}

          {/* Tags */}
          <FormField label="الوسوم">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTagInForm(tag.id)}
                  className="font-arabic transition-all"
                  style={{
                    fontSize: 12, padding: '3px 10px', borderRadius: 20,
                    background: form.tagIds.includes(tag.id) ? 'var(--accent-dim)' : 'var(--bg-secondary)',
                    color: form.tagIds.includes(tag.id) ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${form.tagIds.includes(tag.id) ? 'var(--accent)' : 'var(--border-mid)'}`,
                  }}
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
                style={{ ...FIELD }}
                placeholder="وسم جديد..."
                className="font-arabic flex-1"
                onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
              />
              <button
                onClick={handleAddTag}
                disabled={!newTagName.trim()}
                className="font-arabic transition-colors"
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: 13,
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-mid)',
                  opacity: newTagName.trim() ? 1 : 0.4,
                  cursor: newTagName.trim() ? 'pointer' : 'default',
                }}
              >
                + إضافة
              </button>
            </div>
          </FormField>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!form.titleAr.trim()}
              className="flex-1 font-arabic font-semibold transition-colors"
              style={{
                padding: '10px', borderRadius: 10, fontSize: 14,
                background: form.titleAr.trim() ? 'var(--accent)' : 'var(--border-mid)',
                color: form.titleAr.trim() ? '#fff' : 'var(--text-muted)',
                border: 'none', cursor: form.titleAr.trim() ? 'pointer' : 'default',
              }}
            >
              {editingId ? 'حفظ التعديلات' : 'إضافة المفهوم'}
            </button>
            <button
              onClick={() => { setShowModal(false); resetForm(); }}
              className="font-arabic transition-colors"
              style={{
                padding: '10px 16px', borderRadius: 10, fontSize: 14,
                background: 'transparent', color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)', cursor: 'pointer',
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

// ─── Local sub-components ─────────────────────────────────────────────────────
function StatItem({ n, label, color }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono font-semibold" style={{ fontSize: 15, color: color || 'var(--text-secondary)' }}>
        {n}
      </span>
      <span className="font-arabic" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
        {label}
      </span>
    </span>
  );
}

function FilterPill({ active, onClick, label, count, color }) {
  return (
    <button
      onClick={onClick}
      className="font-arabic transition-all"
      style={{
        padding: '5px 12px', borderRadius: 20, fontSize: 12,
        background: active
          ? (color ? `${color}18` : 'var(--accent-dim)')
          : 'var(--bg-card)',
        color: active
          ? (color || 'var(--accent)')
          : 'var(--text-muted)',
        border: `1px solid ${active ? (color ? `${color}50` : 'var(--accent)') : 'var(--border-subtle)'}`,
        display: 'inline-flex', alignItems: 'center', gap: 5,
      }}
    >
      {label}
      {count != null && (
        <span style={{ fontSize: 10, opacity: 0.7 }}>({count})</span>
      )}
    </button>
  );
}

function FormField({ label, children }) {
  return (
    <div>
      <label
        className="block font-arabic mb-1.5"
        style={{ fontSize: 12, color: 'var(--text-muted)' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ActionBtn({ onClick, title, color, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="transition-colors"
      style={{
        padding: '4px 6px', borderRadius: 6, fontSize: 12,
        background: 'transparent',
        color: color || 'var(--text-muted)',
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
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 16,
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <p className="font-arabic" style={{ fontSize: 14, color: 'var(--text-muted)' }}>{title}</p>
      {action}
    </div>
  );
}
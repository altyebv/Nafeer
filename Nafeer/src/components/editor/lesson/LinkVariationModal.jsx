'use client';
import { useState, useEffect, useRef } from 'react';
import { useDataStore } from '@/store/dataStore';

// ─── Variation type config ────────────────────────────────────────────────────
export const VARIATION_CONFIG = {
  alternative:  { label: 'بديل',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  icon: '↔' },
  prerequisite: { label: 'متطلب',   color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  icon: '←' },
  extension:    { label: 'توسع',    color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.3)',  icon: '↑' },
  simplified:   { label: 'مبسط',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '↓' },
};

const VARIATION_DESCRIPTIONS = {
  alternative:  'نهج مختلف أو مؤلف آخر لنفس المحتوى',
  prerequisite: 'محتوى أساسي يجب دراسته قبل هذا الدرس',
  extension:    'محتوى متقدم للطلاب الراغبين في التعمق',
  simplified:   'نسخة مبسطة للطلاب الذين يجدون صعوبة',
};

// ─── LinkVariationModal ───────────────────────────────────────────────────────
// Props:
//   currentLessonId  — contentId of the lesson being edited (cannot link to itself)
//   onLink(targetContentId, variationType, variationNote) — called on confirm
//   onClose()
export default function LinkVariationModal({ currentLessonId, onLink, onClose }) {
  const { lessons, units } = useDataStore();

  const [query,         setQuery]         = useState('');
  const [selectedId,    setSelectedId]    = useState(null);
  const [variationType, setVariationType] = useState('alternative');
  const [variationNote, setVariationNote] = useState('');
  const [saving,        setSaving]        = useState(false);

  const searchRef = useRef(null);

  useEffect(() => { searchRef.current?.focus(); }, []);

  // Build a unit title map for display
  const unitMap = Object.fromEntries(units.map((u) => [u.id, u.title]));

  // Filter lessons — exclude self, exclude already-variations of something
  // (a variation cannot itself have sub-variations — keep it flat)
  const candidates = lessons.filter((l) => {
    if (l.id === currentLessonId) return false;
    if (l.parentLesson)           return false; // already a variation
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return l.title.toLowerCase().includes(q);
  });

  const selectedLesson = lessons.find((l) => l.id === selectedId);

  const handleConfirm = async () => {
    if (!selectedId || saving) return;
    setSaving(true);
    try {
      await onLink(selectedId, variationType, variationNote.trim() || null);
      onClose();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,8,6,0.85)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg rounded-xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <h2 className="text-sm font-semibold text-sand-200 font-arabic">ربط درس متنوع</h2>
            <p className="text-xs text-ink-600 font-arabic mt-0.5">اختر الدرس ونوع العلاقة</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-600 hover:text-ink-300 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* ── Step 1: Search lesson ──────────────────────────────────────── */}
          <div>
            <label className="block text-xs text-ink-500 font-arabic mb-2">١. اختر الدرس المرتبط</label>
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedId(null); }}
              placeholder="ابحث عن درس بالعنوان…"
              className="w-full px-3 py-2 text-sm rounded-lg border font-arabic
                bg-ink-950 text-sand-200 placeholder-ink-700
                focus:outline-none focus:border-sand-700 transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            />

            {/* Results list */}
            <div className="mt-2 max-h-40 overflow-y-auto space-y-0.5">
              {candidates.length === 0 && (
                <p className="text-xs text-ink-700 font-arabic text-center py-3">
                  {query ? 'لا توجد نتائج' : 'ابدأ بالكتابة للبحث'}
                </p>
              )}
              {candidates.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => setSelectedId(lesson.id)}
                  className={`w-full text-right px-3 py-2 rounded-lg text-sm font-arabic
                    flex items-center gap-2 transition-all
                    ${selectedId === lesson.id
                      ? 'bg-sand-900/40 border border-sand-800/60 text-sand-200'
                      : 'text-ink-300 hover:bg-ink-900/60 border border-transparent'
                    }`}
                >
                  <span className="flex-1 truncate">{lesson.title}</span>
                  <span className="text-[10px] text-ink-600 shrink-0 font-mono">
                    {unitMap[lesson.unitId] || '—'}
                  </span>
                  {selectedId === lesson.id && (
                    <span className="text-sand-500 text-xs shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 2: Variation type ─────────────────────────────────────── */}
          <div>
            <label className="block text-xs text-ink-500 font-arabic mb-2">٢. نوع العلاقة</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(VARIATION_CONFIG).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => setVariationType(type)}
                  className={`px-3 py-2.5 rounded-lg border text-right transition-all`}
                  style={variationType === type
                    ? { background: cfg.bg, borderColor: cfg.border, color: cfg.color }
                    : { borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }
                  }
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <div>
                      <div className="text-xs font-semibold font-arabic">{cfg.label}</div>
                      <div className="text-[10px] opacity-70 font-arabic leading-tight mt-0.5">
                        {VARIATION_DESCRIPTIONS[type]}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Step 3: Optional note ─────────────────────────────────────── */}
          <div>
            <label className="block text-xs text-ink-500 font-arabic mb-2">
              ٣. ملاحظة (اختياري)
            </label>
            <input
              value={variationNote}
              onChange={(e) => setVariationNote(e.target.value.slice(0, 200))}
              placeholder="مثال: مكتوب بأسلوب مبسط للطلاب المبتدئين…"
              className="w-full px-3 py-2 text-sm rounded-lg border font-arabic
                bg-ink-950 text-sand-200 placeholder-ink-700
                focus:outline-none focus:border-sand-700 transition-colors"
              style={{ borderColor: 'var(--border-subtle)' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button
            onClick={onClose}
            className="text-sm text-ink-600 hover:text-ink-300 font-arabic transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedId || saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic
              bg-sand-800 text-ink-950 font-medium
              hover:bg-sand-700 transition-colors
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="w-4 h-4 rounded-full border-2 border-ink-700 border-t-ink-300 animate-spin" />
            ) : null}
            {selectedLesson ? `ربط: ${selectedLesson.title.slice(0, 24)}…` : 'اختر درساً أولاً'}
          </button>
        </div>
      </div>
    </div>
  );
}
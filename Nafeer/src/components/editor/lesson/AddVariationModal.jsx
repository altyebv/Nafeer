'use client';
import { useState, useEffect, useRef } from 'react';
import { useDataStore } from '@/store/dataStore';
import { VARIATION_CONFIG } from '@/components/editor/lesson/LinkVariationModal';
import { X } from 'lucide-react';

// ─── AddVariationModal ────────────────────────────────────────────────────────
// Creates a new variation lesson directly — no search, no two-step linking.
// Props:
//   parentLesson  — the full lesson object (parent)
//   unitId        — unitId to place the new lesson in
//   onCreated(newLessonId) — called after store update, so caller can open editor
//   onClose()
export default function AddVariationModal({ parentLesson, unitId, onCreated, onClose }) {
  const { addLesson } = useDataStore();

  const [variationType, setVariationType] = useState('alternative');
  const [title,         setTitle]         = useState('');
  const [variationNote, setVariationNote] = useState('');
  const [saving,        setSaving]        = useState(false);
  const titleRef = useRef(null);

  useEffect(() => { titleRef.current?.focus(); }, []);

  const cfg = VARIATION_CONFIG[variationType];

  const handleCreate = () => {
    const trimmed = title.trim();
    if (!trimmed || saving) return;
    setSaving(true);

    // addLesson is synchronous — contentStore generates the id immediately.
    // parentLesson.id is the contentId string (e.g. PHYSICS_U1_L2).
    addLesson({
      unitId,
      title:         trimmed,
      parentLesson:  parentLesson.id,
      variationType,
      variationNote: variationNote.trim() || null,
    });

    // We need the new lesson's id — addLesson doesn't return it directly,
    // so we derive it the same way subjectStore does: unitLessons.length + 1.
    // But since we can't read the updated state synchronously here, we'll let
    // the caller re-read from the store after a tick via onCreated().
    setTimeout(() => {
      onCreated?.();
      onClose();
    }, 0);
  };

  const DESCRIPTIONS = {
    alternative:  'نهج مختلف أو مؤلف آخر لنفس المحتوى',
    prerequisite: 'محتوى أساسي يجب دراسته قبل هذا الدرس',
    extension:    'محتوى متقدم للطلاب الراغبين في التعمق',
    simplified:   'نسخة مبسطة للطلاب الذين يجدون صعوبة',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,8,6,0.88)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}
      >

        {/* Accent strip — color matches selected type */}
        <div
          className="h-1 w-full transition-colors duration-200"
          style={{ background: cfg.color, opacity: 0.7 }}
        />

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-3">
          <div>
            <h2
              className="font-semibold font-arabic"
              style={{ fontSize: 14, color: 'var(--text-primary)' }}
            >
              إضافة تنويع
            </h2>
            <p
              className="font-arabic mt-0.5 truncate max-w-xs"
              style={{ fontSize: 11, color: 'var(--text-muted)' }}
            >
              لـ: {parentLesson.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="transition-colors mt-0.5"
            style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">

          {/* ── Type selector ─────────────────────────────────────────────── */}
          <div>
            <p
              className="font-arabic mb-2"
              style={{ fontSize: 11, color: 'var(--text-muted)' }}
            >
              نوع التنويع
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(VARIATION_CONFIG).map(([type, c]) => {
                const Icon = c.icon;
                return (
                <button
                  key={type}
                  onClick={() => setVariationType(type)}
                  className="px-3 py-2.5 rounded-xl border text-right transition-all duration-150"
                  style={variationType === type
                    ? { background: c.bg, borderColor: c.border, color: c.color }
                    : { borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', background: 'transparent' }
                  }
                >
                  <div className="flex items-center gap-2">
                    <Icon size={15} strokeWidth={1.9} />
                    <div>
                      <div className="font-semibold font-arabic" style={{ fontSize: 12 }}>{c.label}</div>
                      <div
                        className="font-arabic leading-tight mt-0.5"
                        style={{ fontSize: 10, opacity: 0.7 }}
                      >
                        {DESCRIPTIONS[type]}
                      </div>
                    </div>
                  </div>
                </button>
              );
              })}
            </div>
          </div>

          {/* ── Title ─────────────────────────────────────────────────────── */}
          <div>
            <p
              className="font-arabic mb-1.5"
              style={{ fontSize: 11, color: 'var(--text-muted)' }}
            >
              عنوان الدرس
            </p>
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter')  handleCreate();
                if (e.key === 'Escape') onClose();
              }}
              placeholder={`مثال: ${parentLesson.title} — نسخة ${cfg.label}`}
              className="w-full px-3 py-2.5 rounded-xl border font-arabic focus:outline-none transition-colors"
              style={{
                fontSize:    13,
                background:  'var(--bg-primary)',
                color:       'var(--text-primary)',
                borderColor: title.trim() ? cfg.border : 'var(--border-subtle)',
              }}
            />
          </div>

          {/* ── Note (optional) ───────────────────────────────────────────── */}
          <div>
            <p
              className="font-arabic mb-1.5"
              style={{ fontSize: 11, color: 'var(--text-muted)' }}
            >
              ملاحظة <span style={{ opacity: 0.5 }}>(اختياري)</span>
            </p>
            <input
              value={variationNote}
              onChange={(e) => setVariationNote(e.target.value.slice(0, 200))}
              placeholder="مثال: مكتوب بأسلوب مبسط للمبتدئين…"
              className="w-full px-3 py-2.5 rounded-xl border font-arabic focus:outline-none transition-colors"
              style={{
                fontSize:    13,
                background:  'var(--bg-primary)',
                color:       'var(--text-primary)',
                borderColor: 'var(--border-subtle)',
              }}
            />
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border font-arabic transition-all"
              style={{
                fontSize:    13,
                color:       'var(--text-muted)',
                borderColor: 'var(--border-subtle)',
                background:  'transparent',
              }}
            >
              إلغاء
            </button>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || saving}
              className="flex-1 py-2.5 rounded-xl font-arabic font-semibold transition-all"
              style={{
                fontSize:    13,
                background:  title.trim() ? cfg.color : 'var(--border-subtle)',
                color:       title.trim() ? '#0a0806' : 'var(--text-muted)',
                opacity:     saving ? 0.6 : 1,
                cursor:      !title.trim() || saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? '…' : `إنشاء ${cfg.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';

// ─── CreateTestSubjectModal ────────────────────────────────────────────────────
//
// Lets an admin create a scratch test subject directly from the AdminEditorSection
// without touching SUBJECTS_CATALOG or the curriculum scaffold.
//
// The created subject gets:
//   • One approved unit  (TEST_ID_U1)
//   • One approved lesson (TEST_ID_U1_L1, status: 'approved')
//
// This means you can publish it immediately to generate the first delta snapshot,
// then modify the lesson content and re-publish to test the delta diff.
//
// Props:
//   onClose()           — dismiss the modal (no action)
//   onCreated(subjectId) — called after successful creation; parent should select
//                          the new subject and refresh the list

const TRACKS = [
  { id: 'COMMON',   label: 'مشترك',  cls: 'border-sky-800/50 text-sky-400'      },
  { id: 'SCIENCE',  label: 'علمي',   cls: 'border-emerald-800/50 text-emerald-400' },
  { id: 'LITERARY', label: 'أدبي',   cls: 'border-purple-800/50 text-purple-400'  },
];

function Spinner() {
  return (
    <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
  );
}

export function CreateTestSubjectModal({ onClose, onCreated }) {
  const [subjectId,   setSubjectId]   = useState('TEST_');
  const [nameAr,      setNameAr]      = useState('');
  const [track,       setTrack]       = useState('COMMON');
  const [seedContent, setSeedContent] = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  // Keep subjectId in UPPER_SNAKE_CASE as user types
  const handleIdChange = (v) => {
    setSubjectId(v.toUpperCase().replace(/[^A-Z0-9_]/g, ''));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!subjectId || subjectId === 'TEST_') {
      setError('أدخل معرّفاً صحيحاً — مثال: TEST_DELTA_01');
      return;
    }
    if (!nameAr.trim()) {
      setError('الاسم العربي مطلوب');
      return;
    }

    setLoading(true);
    try {
      const res  = await fetch('/api/admin/subjects', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subjectId, nameAr: nameAr.trim(), track, seedContent }),
      });
      const data = await res.json();

      if (!data.ok) {
        setError(data.error || 'فشل إنشاء المادة');
        return;
      }

      onCreated(data.subjectId);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    // ── Backdrop ──────────────────────────────────────────────────────────────
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6"
        style={{ background: 'rgba(12,11,9,0.97)', borderColor: 'rgba(255,255,255,0.1)' }}
        dir="rtl"
      >
        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between">
            <h2 className="font-arabic text-base font-semibold text-ink-100">
              إنشاء مادة تجريبية
            </h2>
            <button
              onClick={onClose}
              className="text-ink-600 hover:text-ink-300 transition-colors text-sm font-mono"
            >
              ✕
            </button>
          </div>
          <p className="text-[11px] font-arabic text-ink-500 mt-1">
            تُنشئ مادة في قاعدة البيانات مع وحدة ودرس معتمد — جاهزة للنشر الفوري لاختبار Delta Sync
          </p>
        </div>

        {/* subjectId */}
        <div className="mb-4">
          <label className="block text-[10px] font-mono text-ink-600 mb-1">
            معرّف المادة (subjectId)
            <span className="text-ink-700 mr-1">— UPPER_SNAKE_CASE</span>
          </label>
          <input
            dir="ltr"
            value={subjectId}
            onChange={(e) => handleIdChange(e.target.value)}
            placeholder="TEST_DELTA_01"
            className="w-full bg-ink-900/60 border border-ink-800/80 rounded-lg px-3 py-2 text-sm font-mono text-ink-200 placeholder:text-ink-700 focus:outline-none focus:border-sand-700/60"
          />
          <p className="text-[10px] font-mono text-ink-700 mt-1">
            مثال: TEST_DELTA_01 · TEST_PHYSICS_DEV · STAGING_MATH
          </p>
        </div>

        {/* nameAr */}
        <div className="mb-4">
          <label className="block text-[10px] font-mono text-ink-600 mb-1">
            الاسم العربي
          </label>
          <input
            dir="rtl"
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="مادة تجريبية — Delta Sync"
            className="w-full bg-ink-900/60 border border-ink-800/80 rounded-lg px-3 py-2 text-sm font-arabic text-ink-200 placeholder:text-ink-700 focus:outline-none focus:border-sand-700/60"
          />
        </div>

        {/* Track picker */}
        <div className="mb-4">
          <label className="block text-[10px] font-mono text-ink-600 mb-2">المسار</label>
          <div className="flex gap-2">
            {TRACKS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTrack(t.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-arabic transition-all ${
                  track === t.id
                    ? t.cls + ' bg-ink-900/60'
                    : 'border-ink-800/60 text-ink-500 hover:text-ink-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Seed toggle */}
        <div className="mb-5">
          <label
            className="flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all"
            style={{
              background:  seedContent ? 'rgba(212,137,30,0.05)' : 'rgba(255,255,255,0.02)',
              borderColor: seedContent ? 'rgba(212,137,30,0.2)'  : 'rgba(255,255,255,0.07)',
            }}
          >
            <input
              type="checkbox"
              checked={seedContent}
              onChange={(e) => setSeedContent(e.target.checked)}
              className="mt-0.5"
            />
            <div>
              <p className="text-xs font-arabic text-ink-200">بذر وحدة ودرس معتمد</p>
              <p className="text-[10px] font-arabic text-ink-500 mt-0.5">
                يضيف درساً بحالة "معتمد" لتفعيل زر النشر فوراً.
                {!seedContent && ' بدونه ستحتاج إضافة درس يدوياً قبل النشر.'}
              </p>
            </div>
          </label>
        </div>

        {/* Error */}
        {error && (
          <div
            className="mb-4 rounded-lg border px-3 py-2 text-xs font-arabic text-red-400"
            style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)' }}
          >
            {error}
          </div>
        )}

        {/* Delta test guide */}
        <div
          className="mb-5 rounded-xl border px-3 py-2.5 text-[10px] font-mono text-ink-600 space-y-1"
          style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}
          dir="ltr"
        >
          <p className="text-ink-500 font-semibold mb-1">Delta Sync Test Flow</p>
          <p>1. Create subject  →  2. Publish (generates entityIndex)</p>
          <p>3. Edit lesson in editor  →  4. Publish again (delta diff)</p>
          <p>5. Check SyncStatus screen on Android  →  bundle applied ✓</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border text-xs font-arabic text-ink-400 border-ink-800/60 hover:text-ink-200 transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border text-sm font-arabic text-sand-300 border-sand-700/60 hover:border-sand-600 transition-all"
            style={{ background: 'rgba(212,137,30,0.08)', opacity: loading ? 0.6 : 1 }}
          >
            {loading && <Spinner />}
            {loading ? 'جارٍ الإنشاء…' : 'إنشاء المادة'}
          </button>
        </div>
      </div>
    </div>
  );
}
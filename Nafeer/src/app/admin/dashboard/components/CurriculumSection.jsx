'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SectionHeader } from './ui/shared';
import { SUBJECTS_CATALOG_REF } from '../constants';

// ─── Design tokens ─────────────────────────────────────────────────────────────

const TRACK_META = {
  COMMON: { label: 'مشترك', cls: 'border-sky-800/50 text-sky-400/80', dot: 'bg-sky-500' },
  SCIENCE: { label: 'علمي', cls: 'border-emerald-800/50 text-emerald-400/80', dot: 'bg-emerald-500' },
  LITERARY: { label: 'أدبي', cls: 'border-purple-800/50 text-purple-400/80', dot: 'bg-purple-500' },
};

const STATUS_META = {
  approved: { dot: 'bg-green-500/70', label: 'معتمد' },
  draft: { dot: 'bg-ink-600/60', label: 'مسودة' },
  review: { dot: 'bg-amber-400/70', label: 'مراجعة' },
};

const TRACK_ORDER = ['COMMON', 'SCIENCE', 'LITERARY'];

// ─── Primitives ────────────────────────────────────────────────────────────────

function Spinner({ size = 'sm' }) {
  const s = size === 'sm' ? 'w-3 h-3 border' : 'w-5 h-5 border-2';
  return <span className={`inline-block ${s} border-current border-t-transparent rounded-full animate-spin`} />;
}

function TrackBadge({ track }) {
  const m = TRACK_META[track] || { label: track, cls: 'border-ink-700 text-ink-500' };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${m.cls}`}>
      {m.label}
    </span>
  );
}

function StatusDot({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${m.dot}`} title={m.label} />;
}

// ─── Inline Edit Field ─────────────────────────────────────────────────────────
// Single-field editor: click to edit, Enter/blur saves, Escape cancels.

function InlineField({ value, onSave, placeholder, mono = false, dimmed = false, className = '' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const start = () => {
    setDraft(value || '');
    setError(null);
    setEditing(true);
    setTimeout(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    }, 0);
  };

  const cancel = () => { setEditing(false); setError(null); };

  const save = async () => {
    const trimmed = draft.trim();
    if (trimmed === (value || '').trim()) { cancel(); return; }
    setSaving(true);
    try {
      await onSave(trimmed || null);
      setEditing(false);
      setError(null);
    } catch (e) {
      setError(e.message || 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { cancel(); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={onKey}
          dir="rtl"
          className={`flex-1 min-w-0 px-2 py-0.5 rounded text-sm bg-ink-800/80 border focus:outline-none transition-colors
            ${error ? 'border-red-600/60' : 'border-sand-700/50 focus:border-sand-600/70'}
            ${mono ? 'font-mono' : 'font-arabic'}
            ${className}`}
        />
        {saving && <Spinner />}
        {error && <span className="text-[10px] text-red-400 shrink-0">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={start}
      title="انقر للتعديل"
      className={`text-right min-w-0 truncate transition-colors group
        ${dimmed ? 'text-ink-600 hover:text-ink-400' : 'text-ink-200 hover:text-sand-300'}
        ${mono ? 'font-mono text-xs' : 'font-arabic text-sm'}
        ${className}`}
    >
      {value || (
        <span className="text-ink-700 italic text-xs">{placeholder || '—'}</span>
      )}
      <span className="opacity-0 group-hover:opacity-40 mr-1.5 text-[10px] font-mono text-sand-500">✎</span>
    </button>
  );
}

// ─── Lesson Row ────────────────────────────────────────────────────────────────

function LessonRow({ lesson, onPatch, onDelete }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirm] = useState(false);

  const patch = async (fields) => {
    const res = await fetch(`/api/admin/curriculum/lessons/${lesson._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'فشل الحفظ');
    onPatch(lesson._id, json.lesson);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/curriculum/lessons/${lesson._id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل الحذف');
      onDelete(lesson._id);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
      setConfirm(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors group">
      {/* Order */}
      <span className="text-[10px] font-mono text-ink-700 w-5 shrink-0 text-center">{lesson.order}</span>

      <StatusDot status={lesson.status} />

      {/* Title */}
      <div className="flex-1 min-w-0">
        <InlineField
          value={lesson.title}
          placeholder="عنوان الدرس"
          onSave={(v) => patch({ title: v || lesson.title })}
        />
        {/* Group title sub-row */}
        <InlineField
          value={lesson.groupTitle}
          placeholder="عنوان المجموعة (اختياري)"
          dimmed
          className="text-xs mt-0.5"
          onSave={(v) => patch({ groupTitle: v })}
        />
      </div>

      {/* Estimated minutes */}
      <div className="shrink-0 w-14">
        <InlineField
          value={lesson.estimatedMinutes ? String(lesson.estimatedMinutes) : ''}
          placeholder="دقائق"
          mono
          dimmed
          onSave={async (v) => {
            const n = parseInt(v, 10);
            if (v && isNaN(n)) throw new Error('رقم فقط');
            await patch({ estimatedMinutes: n || 15 });
          }}
        />
      </div>

      {/* Content ID chip */}
      <span
        className="text-[9px] font-mono text-ink-800 group-hover:text-ink-600 transition-colors shrink-0 hidden lg:block"
        title={lesson.contentId}
      >
        {lesson.contentId}
      </span>

      {/* Delete — appears on hover */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        {confirmDel ? (
          <>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-red-700/60 text-red-400 hover:bg-red-950/40 transition-colors disabled:opacity-40"
            >
              {deleting ? '…' : 'تأكيد'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-ink-700/50 text-ink-500 hover:text-ink-300 transition-colors"
            >
              إلغاء
            </button>
          </>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-ink-800/40 text-ink-700 hover:border-red-800/50 hover:text-red-500 transition-colors"
            title="حذف الدرس"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Add Lesson Form ───────────────────────────────────────────────────────────

function AddLessonForm({ unit, subjectId, onAdded, onCancel }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const nextOrder = (unit.lessons.length > 0)
    ? Math.max(...unit.lessons.map((l) => l.order)) + 1
    : 1;

  // contentId convention: SUBJECTID_UNITCONTENTID_L{order}
  // Strip the subjectId prefix from unitContentId to avoid double-prefix
  const unitSuffix = unit.contentId.startsWith(subjectId + '_')
    ? unit.contentId.slice(subjectId.length + 1)
    : unit.contentId;
  const contentId = `${subjectId}_${unitSuffix}_L${nextOrder}`;

  const save = async () => {
    if (!title.trim()) { setError('العنوان مطلوب'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/curriculum/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          unitContentId: unit.contentId,
          contentId,
          title: title.trim(),
          order: nextOrder,
          estimatedMinutes: 15,
        }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل الإنشاء');
      onAdded(json.lesson);
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { onCancel(); }
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg"
      style={{ background: 'rgba(212,137,30,0.05)', border: '1px dashed rgba(212,137,30,0.2)' }}
    >
      <span className="text-[10px] font-mono text-ink-700 w-5 shrink-0 text-center">{nextOrder}</span>
      <span className="w-1.5 h-1.5 rounded-full bg-ink-700/60 shrink-0" />
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={onKey}
        dir="rtl"
        placeholder="عنوان الدرس الجديد"
        className="flex-1 min-w-0 px-2 py-0.5 rounded text-sm font-arabic bg-ink-800/80 border border-sand-700/50 focus:border-sand-600/70 focus:outline-none text-ink-200 placeholder-ink-700"
      />
      <span className="text-[9px] font-mono text-ink-800 shrink-0 hidden lg:block">{contentId}</span>
      {error && <span className="text-[10px] text-red-400 shrink-0">{error}</span>}
      <button
        onClick={save}
        disabled={saving || !title.trim()}
        className="text-[10px] font-mono px-2.5 py-1 rounded border border-sand-700/50 text-sand-300 hover:border-sand-600/60 transition-colors disabled:opacity-40"
      >
        {saving ? '…' : 'إضافة'}
      </button>
      <button
        onClick={onCancel}
        className="text-[10px] font-mono px-2 py-1 rounded border border-ink-700/50 text-ink-500 hover:text-ink-300 transition-colors"
      >
        إلغاء
      </button>
    </div>
  );
}

// ─── Unit Card ─────────────────────────────────────────────────────────────────

function UnitCard({ unit, subjectId, onPatchUnit, onPatchLesson, onAddLesson, onDeleteLesson }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);

  const patchUnit = async (fields) => {
    const res = await fetch(`/api/admin/curriculum/units/${unit._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'فشل الحفظ');
    onPatchUnit(unit._id, json.unit);
  };

  const approvedCount = unit.lessons.filter((l) => l.status === 'approved').length;
  const totalCount = unit.lessons.length;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-colors"
      style={{
        background: 'rgba(255,255,255,0.018)',
        borderColor: open ? 'rgba(212,137,30,0.2)' : 'rgba(255,255,255,0.07)',
      }}
    >
      {/* Unit header */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-ink-700 text-xs font-mono shrink-0 w-4">{open ? '▾' : '▸'}</span>

        {/* Order badge */}
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-ink-800/60 text-ink-600 shrink-0"
        >
          {unit.order}
        </span>

        {/* Title — inline-edit stops click propagation */}
        <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
          <InlineField
            value={unit.title}
            placeholder="عنوان الوحدة"
            onSave={(v) => patchUnit({ title: v || unit.title })}
          />
          {unit.bookTitle && (
            <InlineField
              value={unit.bookTitle}
              placeholder="عنوان الكتاب"
              dimmed
              className="text-xs mt-0.5"
              onSave={(v) => patchUnit({ title: unit.title, bookTitle: v })}
            />
          )}
        </div>

        {/* Lesson progress + add button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="h-1 w-16 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: totalCount > 0 ? `${Math.round((approvedCount / totalCount) * 100)}%` : '0%',
                background: 'var(--accent)',
              }}
            />
          </div>
          <span className="text-[10px] font-mono text-ink-600" dir="ltr">{approvedCount}/{totalCount}</span>
          {/* Add lesson — stops propagation so the header doesn't collapse */}
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); setAdding(true); }}
            className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-ink-800/50 text-ink-600 hover:border-sand-700/50 hover:text-sand-400 transition-colors"
            title="إضافة درس جديد"
          >
            + درس
          </button>
        </div>
      </div>

      {/* Lessons list */}
      {open && (
        <div className="border-t px-2 py-1" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {/* Unit description */}
          <div className="px-3 py-2 border-b mb-1" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <p className="text-[9px] font-mono text-ink-700 mb-1 uppercase tracking-widest">وصف الوحدة</p>
            <InlineField
              value={unit.description}
              placeholder="وصف الوحدة (اختياري)"
              dimmed
              onSave={(v) => patchUnit({ title: unit.title, description: v })}
            />
          </div>

          <div className="space-y-0.5">
            {unit.lessons.length > 0 && (
              <>
                {/* Column headers */}
                <div className="flex items-center gap-3 px-3 py-1">
                  <span className="w-5 text-[9px] font-mono text-ink-800">#</span>
                  <span className="w-2" />
                  <span className="flex-1 text-[9px] font-mono text-ink-700 uppercase tracking-widest">عنوان الدرس / المجموعة</span>
                  <span className="w-14 text-[9px] font-mono text-ink-700">دقائق</span>
                  <span className="hidden lg:block text-[9px] font-mono text-ink-800">contentId</span>
                  <span className="w-16" />
                </div>

                {unit.lessons.map((lesson) => (
                  <LessonRow
                    key={lesson._id}
                    lesson={lesson}
                    onPatch={(id, updated) => onPatchLesson(unit._id, id, updated)}
                    onDelete={(id) => onDeleteLesson(unit._id, id)}
                  />
                ))}
              </>
            )}

            {/* Add lesson form / empty state */}
            {adding ? (
              <div className="pt-1">
                <AddLessonForm
                  unit={unit}
                  subjectId={subjectId}
                  onAdded={(lesson) => { onAddLesson(unit._id, lesson); setAdding(false); }}
                  onCancel={() => setAdding(false)}
                />
              </div>
            ) : (
              <button
                onClick={() => setAdding(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-arabic text-ink-700 hover:text-sand-400 hover:bg-white/[0.015] transition-colors mt-0.5"
              >
                <span className="text-[9px]">＋</span>
                {unit.lessons.length === 0 ? 'إضافة أول درس' : 'إضافة درس'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subject Picker ────────────────────────────────────────────────────────────

function SubjectPicker({ selected, onSelect }) {
  const grouped = TRACK_ORDER.map((track) => ({
    track,
    items: SUBJECTS_CATALOG_REF.filter((s) => s.track === track),
  })).filter((g) => g.items.length > 0);

  return (
    <div
      className="w-52 shrink-0 rounded-xl border overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.015)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      <div className="px-3 py-2.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-[10px] font-mono text-ink-600 uppercase tracking-widest">المواد</p>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {grouped.map(({ track, items }) => (
          <div key={track}>
            <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <span className={`w-1.5 h-1.5 rounded-full ${TRACK_META[track]?.dot || 'bg-ink-600'}`} />
              <span className="text-[9px] font-mono text-ink-700 uppercase tracking-widest">
                {TRACK_META[track]?.label || track}
              </span>
            </div>
            {items.map((s) => {
              const isSelected = selected === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`w-full text-right flex items-center gap-2 px-3 py-2 transition-all
                    ${isSelected ? 'text-sand-300' : 'text-ink-400 hover:text-ink-200'}`}
                  style={isSelected
                    ? { background: 'rgba(212,137,30,0.09)', borderRight: '2px solid rgba(212,137,30,0.5)' }
                    : { borderRight: '2px solid transparent' }}
                >
                  <span className="font-arabic text-xs truncate">{s.nameAr}</span>
                  {s.isMajor && <span className="mr-auto text-[8px] font-mono text-ink-700 shrink-0">★</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Panel ────────────────────────────────────────────────────────────────

function CurriculumPanel({ subjectId }) {
  const [data, setData] = useState(null);   // { subject, units, counts }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingUnit, setAddingUnit] = useState(false);
  const [addUnitTitle, setAddUnitTitle] = useState('');
  const [addUnitSaving, setAddUnitSaving] = useState(false);
  const [addUnitError, setAddUnitError] = useState(null);

  const handleAddUnit = async () => {
    if (!addUnitTitle.trim()) { setAddUnitError('العنوان مطلوب'); return; }
    setAddUnitSaving(true);
    setAddUnitError(null);
    try {
      const res = await fetch('/api/admin/curriculum/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId, title: addUnitTitle.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل إنشاء الوحدة');
      setData((prev) => ({
        ...prev,
        units: [...prev.units, json.unit],
        counts: { ...prev.counts, units: prev.counts.units + 1 },
      }));
      setAddUnitTitle('');
      setAddingUnit(false);
    } catch (e) {
      setAddUnitError(e.message);
    } finally {
      setAddUnitSaving(false);
    }
  };

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/curriculum?subjectId=${encodeURIComponent(subjectId)}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل تحميل البيانات');
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  // Optimistic patch handlers — update local state immediately
  const handlePatchUnit = (unitId, updatedFields) => {
    setData((prev) => ({
      ...prev,
      units: prev.units.map((u) =>
        String(u._id) === String(unitId) ? { ...u, ...updatedFields } : u
      ),
    }));
  };

  const handlePatchLesson = (unitId, lessonId, updatedFields) => {
    setData((prev) => ({
      ...prev,
      units: prev.units.map((u) =>
        String(u._id) !== String(unitId)
          ? u
          : {
            ...u,
            lessons: u.lessons.map((l) =>
              String(l._id) === String(lessonId) ? { ...l, ...updatedFields } : l
            ),
          }
      ),
    }));
  };

  const handleAddLesson = (unitId, lesson) => {
    setData((prev) => ({
      ...prev,
      units: prev.units.map((u) =>
        String(u._id) !== String(unitId)
          ? u
          : { ...u, lessons: [...u.lessons, lesson] }
      ),
      counts: { ...prev.counts, lessons: prev.counts.lessons + 1 },
    }));
  };

  const handleDeleteLesson = (unitId, lessonId) => {
    setData((prev) => ({
      ...prev,
      units: prev.units.map((u) =>
        String(u._id) !== String(unitId)
          ? u
          : { ...u, lessons: u.lessons.filter((l) => String(l._id) !== String(lessonId)) }
      ),
      counts: { ...prev.counts, lessons: Math.max(0, prev.counts.lessons - 1) },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-ink-500 py-16">
        <Spinner size="md" />
        <span className="font-arabic text-sm">جارٍ تحميل المنهج…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center rounded-xl border" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.04)' }}>
        <p className="text-red-400 font-arabic text-sm mb-4">{error}</p>
        <button
          onClick={load}
          className="text-xs font-mono text-ink-400 hover:text-ink-200 px-4 py-2 rounded-lg border border-ink-800"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  if (!data) return null;

  const { subject, units, counts } = data;

  return (
    <div className="space-y-4">
      {/* Subject header */}
      <div
        className="rounded-xl border px-5 py-4 flex items-start justify-between gap-4"
        style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h2 className="font-arabic text-xl font-bold text-ink-100">{subject.nameAr}</h2>
            <TrackBadge track={subject.path} />
            {subject.isMajor && (
              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-sand-800/40 text-sand-600">رئيسي</span>
            )}
          </div>
          <p className="text-[11px] font-mono text-ink-700" dir="ltr">{subject.subjectId}</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {[
            { label: 'وحدة', val: counts.units },
            { label: 'درس', val: counts.lessons },
            { label: 'معتمد', val: counts.approved },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-lg font-mono font-bold" style={{ color: 'var(--accent)' }}>{val}</p>
              <p className="text-[10px] font-arabic text-ink-600">{label}</p>
            </div>
          ))}
          <button
            onClick={load}
            className="text-[11px] font-mono text-ink-600 hover:text-ink-300 px-2.5 py-1 rounded border border-ink-800/50 hover:border-ink-700/60 transition-colors"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Hint bar */}
      <div
        className="rounded-lg px-4 py-2.5 flex items-center gap-2"
        style={{ background: 'rgba(212,137,30,0.04)', border: '1px solid rgba(212,137,30,0.12)' }}
      >
        <span className="text-sand-600 text-sm">✎</span>
        <p className="text-[11px] font-arabic text-ink-500">
          انقر على أي عنوان لتعديله مباشرة — الحفظ فوري عند الضغط على Enter أو مغادرة الحقل.
          <span className="font-mono text-ink-700 mr-2">contentId</span> لا يمكن تعديله (يُستخدم كمرجع ثابت في التطبيق).
        </p>
      </div>

      {/* Units */}
      {/* Units */}
      <div className="space-y-2">
        {units.length === 0 && !addingUnit ? (
          <div className="py-10 text-center rounded-xl border" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <p className="font-arabic text-ink-600 text-sm mb-2">لا يوجد وحدات</p>
            <p className="text-[11px] font-mono text-ink-800 mb-4">
              استخدم «إضافة وحدة» أدناه أو اذهب إلى «إدارة البذر» للمواد الكاملة
            </p>
          </div>
        ) : (
          units.map((unit) => (
            <UnitCard
              key={unit._id}
              unit={unit}
              subjectId={subjectId}
              onPatchUnit={handlePatchUnit}
              onPatchLesson={handlePatchLesson}
              onAddLesson={handleAddLesson}
              onDeleteLesson={handleDeleteLesson}
            />
          ))
        )}

        {/* ── Add unit inline form ───────────────────────────────────────── */}
        {addingUnit ? (
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{ background: 'rgba(212,137,30,0.04)', border: '1px dashed rgba(212,137,30,0.25)' }}
          >
            <input
              autoFocus
              dir="rtl"
              value={addUnitTitle}
              onChange={(e) => setAddUnitTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAddUnit(); }
                if (e.key === 'Escape') { setAddingUnit(false); setAddUnitTitle(''); setAddUnitError(null); }
              }}
              placeholder="عنوان الوحدة الجديدة"
              className="flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm font-arabic bg-ink-800/80 border border-sand-700/50 focus:border-sand-600/70 focus:outline-none text-ink-200 placeholder-ink-700"
            />
            {addUnitError && <span className="text-[10px] text-red-400 shrink-0">{addUnitError}</span>}
            <button
              onClick={handleAddUnit}
              disabled={addUnitSaving || !addUnitTitle.trim()}
              className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-sand-700/50 text-sand-300 hover:border-sand-600/60 transition-colors disabled:opacity-40"
            >
              {addUnitSaving ? <Spinner /> : 'إضافة'}
            </button>
            <button
              onClick={() => { setAddingUnit(false); setAddUnitTitle(''); setAddUnitError(null); }}
              className="text-[11px] font-mono px-3 py-1.5 rounded-lg border border-ink-700/50 text-ink-500 hover:text-ink-300 transition-colors"
            >
              إلغاء
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingUnit(true)}
            className="w-full py-2.5 rounded-xl border text-[11px] font-arabic text-ink-700 hover:text-sand-400 hover:border-sand-800/50 transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.05)', borderStyle: 'dashed' }}
          >
            + إضافة وحدة
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Section Root ──────────────────────────────────────────────────────────────
export function CurriculumSection() {
  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/content/publish/status');
        const data = await res.json();
        if (data.ok) {
          // Include all: catalog + atlas (test) + remote-only subjects
          const list = (data.subjects || []).filter((s) => s.source !== 'remote');
          setSubjects(list.map((s) => ({ id: s.id, nameAr: s.nameAr, track: s.track, isMajor: s.isMajor, source: s.source })));
          // Pre-select first catalog subject
          const firstCatalog = list.find((s) => s.source === 'catalog') || list[0];
          setSelected(firstCatalog?.id || null);
        }
      } catch { /* non-fatal */ } finally {
        setSubjectsLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <SectionHeader
        title="إدارة المنهج"
        description="تعديل عناوين الوحدات والدروس وتفاصيلها مباشرة في Atlas — هذه البيانات يراها المساهمون عند انضمامهم"
      />

      <div className="px-8 pb-8">
        <div className="flex gap-5 items-start">
          <SubjectPicker
            subjects={subjects}
            loading={subjectsLoading}
            selected={selected}
            onSelect={(id) => setSelected(id)}
          />

          <div className="flex-1 min-w-0">
            {selected
              ? <CurriculumPanel key={selected} subjectId={selected} />
              : (
                <div className="py-16 text-center font-arabic text-ink-600 text-sm">
                  اختر مادة من القائمة
                </div>
              )
            }
          </div>
        </div>
      </div>
    </div>
  );
}

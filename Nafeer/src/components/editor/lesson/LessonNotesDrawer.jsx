'use client';
import { useState, useEffect, useRef } from 'react';

// ─── LessonNotesDrawer ────────────────────────────────────────────────────────
// Slide-in panel from the right. Loads notes from API, supports:
//   - Add comment or flag
//   - Resolve / unresolve
//   - Delete own note
//
// Props:
//   lessonId    — contentId string (e.g. 'PHYSICS_U1_L3')
//   currentUser — JWT payload: { id, name, role, avatarUrl }
//   onClose     — callback
//   onCountChange — (n) => void — keeps parent's note count badge in sync

const NOTE_TYPE_CONFIG = {
  comment:         { label: 'تعليق',     color: 'text-ink-400',    bg: 'bg-ink-800/40',    icon: '💬' },
  review_feedback: { label: 'ملاحظة مراجعة', color: 'text-amber-500', bg: 'bg-amber-900/15', icon: '📋' },
  flag:            { label: 'تنبيه',     color: 'text-red-400',    bg: 'bg-red-900/15',    icon: '⚑'  },
};

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const d    = new Date(dateStr);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)      return 'الآن';
  if (diff < 3600)    return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400)   return `منذ ${Math.floor(diff / 3600)} س`;
  if (diff < 2592000) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return d.toLocaleDateString('ar-SD', { day: 'numeric', month: 'short' });
}

function AvatarChip({ name, role }) {
  const initials = name
    ? name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('')
    : '؟';
  const isAdmin = role === 'admin';
  return (
    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] shrink-0 font-arabic ring-1
      ${isAdmin ? 'bg-amber-900/40 text-amber-400 ring-amber-800/50' : 'bg-ink-700 text-ink-300 ring-ink-600'}`}>
      {initials}
    </span>
  );
}

function NoteCard({ note, currentUser, onResolve, onDelete }) {
  const cfg      = NOTE_TYPE_CONFIG[note.noteType] ?? NOTE_TYPE_CONFIG.comment;
  const isOwn    = note.authorId && note.authorId === currentUser?.id;
  const isAdmin  = currentUser?.role === 'admin';
  const canDelete = isOwn || isAdmin;

  return (
    <div className={`rounded-xl border p-3 space-y-2 transition-opacity ${note.resolved ? 'opacity-40' : ''}
      ${cfg.bg} ${note.resolved ? 'border-ink-800/30' : 'border-ink-700/40'}`}>

      {/* Header row */}
      <div className="flex items-center gap-2">
        <AvatarChip name={note.authorName || '؟'} role={note.authorRole} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[12px] font-semibold text-ink-200 font-arabic leading-none">
              {note.authorName || 'مساهم'}
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-arabic leading-none ${cfg.color}
              ${note.noteType === 'review_feedback' ? 'border-amber-800/40' : note.noteType === 'flag' ? 'border-red-800/40' : 'border-ink-700/40'}`}>
              {cfg.icon} {cfg.label}
            </span>
          </div>
          <span className="text-[10px] text-ink-700 font-mono">{relativeTime(note.createdAt)}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onResolve(note._id, !note.resolved)}
            className={`text-[10px] px-2 py-1 rounded-lg border font-arabic transition-colors
              ${note.resolved
                ? 'border-ink-700/40 text-ink-600 hover:text-ink-400 hover:border-ink-600'
                : 'border-emerald-800/40 text-emerald-600 hover:bg-emerald-900/20'}`}
            title={note.resolved ? 'إعادة فتح' : 'وضع علامة محلول'}
          >
            {note.resolved ? '↺' : '✓'}
          </button>
          {canDelete && (
            <button
              onClick={() => onDelete(note._id)}
              className="text-[10px] px-1.5 py-1 rounded-lg border border-transparent text-ink-700 hover:text-red-400 hover:border-red-900/40 transition-colors"
              title="حذف الملاحظة"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <p className="text-sm text-ink-200 font-arabic leading-relaxed whitespace-pre-wrap pr-9">
        {note.text}
      </p>
    </div>
  );
}

export default function LessonNotesDrawer({ lessonId, currentUser, onClose, onCountChange }) {
  const [notes,       setNotes]      = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [submitting,  setSubmitting] = useState(false);
  const [draft,       setDraft]      = useState('');
  const [draftType,   setDraftType]  = useState('comment');
  const [filter,      setFilter]     = useState('all'); // 'all' | 'open' | 'flag'
  const [error,       setError]      = useState(null);
  const textRef = useRef(null);

  // ── Load notes ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    fetch(`/api/content/lessons/${lessonId}/notes`)
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          setNotes(res.data.notes || []);
          onCountChange?.(res.data.total ?? 0);
        }
      })
      .catch(() => setError('تعذّر تحميل الملاحظات'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const text = draft.trim();
    if (!text) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/content/lessons/${lessonId}/notes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text, noteType: draftType }),
      });
      const data = await res.json();
      if (data.ok) {
        const newNotes = [...notes, data.data];
        setNotes(newNotes);
        onCountChange?.(newNotes.length);
        setDraft('');
        textRef.current?.focus();
      } else {
        setError(data.error || 'فشل إضافة الملاحظة');
      }
    } catch {
      setError('فشل إضافة الملاحظة');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resolve ──────────────────────────────────────────────────────────────────
  const handleResolve = async (noteId, resolved) => {
    const prev = notes;
    setNotes((n) => n.map((x) => x._id === noteId ? { ...x, resolved } : x));
    try {
      const res = await fetch(`/api/content/lessons/${lessonId}/notes/${noteId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resolved }),
      });
      const data = await res.json();
      if (!data.ok) setNotes(prev);
    } catch {
      setNotes(prev);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (noteId) => {
    const prev = notes;
    const next = notes.filter((n) => n._id !== noteId);
    setNotes(next);
    onCountChange?.(next.length);
    try {
      const res = await fetch(`/api/content/lessons/${lessonId}/notes/${noteId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) { setNotes(prev); onCountChange?.(prev.length); }
    } catch {
      setNotes(prev);
      onCountChange?.(prev.length);
    }
  };

  // ── Filtered view ────────────────────────────────────────────────────────────
  const visible = notes.filter((n) => {
    if (filter === 'open') return !n.resolved;
    if (filter === 'flag') return n.noteType === 'flag';
    return true;
  });

  const openCount = notes.filter((n) => !n.resolved).length;
  const flagCount = notes.filter((n) => n.noteType === 'flag').length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 h-full w-full max-w-sm z-50 flex flex-col bg-ink-900 border-r border-ink-800 shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-ink-800 shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-600 hover:text-ink-300 hover:bg-ink-800 transition-colors"
          >
            ✕
          </button>
          <h2 className="text-sm font-semibold text-sand-300 font-arabic">ملاحظات الدرس</h2>
          {notes.length > 0 && (
            <span className="text-[11px] font-mono text-ink-600 bg-ink-800/60 px-1.5 py-0.5 rounded">
              {notes.length}
            </span>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ink-800/50 shrink-0">
          {[
            { id: 'all',  label: `الكل (${notes.length})` },
            { id: 'open', label: `مفتوحة (${openCount})` },
            { id: 'flag', label: `⚑ تنبيهات (${flagCount})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`text-[11px] px-2.5 py-1 rounded-full border font-arabic transition-colors
                ${filter === f.id
                  ? 'bg-sand-800/40 border-sand-700/50 text-sand-400'
                  : 'border-ink-700/40 text-ink-600 hover:text-ink-400 hover:border-ink-600'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <span className="w-5 h-5 border-2 border-ink-700 border-t-sand-600 rounded-full animate-spin" />
            </div>
          )}
          {!loading && visible.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-3xl mb-3 opacity-30">💬</p>
              <p className="text-sm text-ink-600 font-arabic">
                {filter === 'all' ? 'لا توجد ملاحظات بعد' : 'لا توجد ملاحظات في هذا التصنيف'}
              </p>
              {filter === 'all' && (
                <p className="text-xs text-ink-700 font-arabic mt-1">
                  أضف أول ملاحظة أدناه
                </p>
              )}
            </div>
          )}
          {!loading && visible.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              currentUser={currentUser}
              onResolve={handleResolve}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Compose area */}
        <div className="px-4 py-3 border-t border-ink-800 space-y-2.5 shrink-0 bg-ink-900">
          {error && (
            <p className="text-xs text-red-400 font-arabic">{error}</p>
          )}

          {/* Type selector */}
          <div className="flex items-center gap-2">
            {[
              { id: 'comment', label: '💬 تعليق' },
              { id: 'flag',    label: '⚑ تنبيه' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setDraftType(t.id)}
                className={`text-[11px] px-2.5 py-1 rounded-full border font-arabic transition-colors
                  ${draftType === t.id
                    ? t.id === 'flag'
                      ? 'bg-red-900/30 border-red-800/50 text-red-400'
                      : 'bg-sand-900/30 border-sand-800/50 text-sand-400'
                    : 'border-ink-700/40 text-ink-600 hover:text-ink-400'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <textarea
            ref={textRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
            placeholder="أضف ملاحظة… (Ctrl+Enter للإرسال)"
            rows={3}
            className="w-full px-3 py-2.5 bg-ink-950 border border-ink-700 rounded-xl text-sm text-ink-100 font-arabic placeholder-ink-700 focus:outline-none focus:border-sand-700 resize-none leading-relaxed transition-colors"
          />

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono ${draft.length > 900 ? 'text-amber-500' : 'text-ink-700'}`}>
              {draft.length}/1000
            </span>
            <div className="flex-1" />
            <button
              onClick={handleSubmit}
              disabled={submitting || !draft.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-sand-700 hover:bg-sand-600 disabled:opacity-40 text-ink-950 text-xs font-bold rounded-lg transition-colors font-arabic"
            >
              {submitting
                ? <><span className="w-3 h-3 border-2 border-ink-800 border-t-transparent rounded-full animate-spin" /> إرسال…</>
                : 'إرسال'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

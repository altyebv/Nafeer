'use client';
import { useState, useRef, useEffect } from 'react';
import {
  CONTRIBUTOR_STATUS, SUBJECT_MAP, TRACK_CONFIG,
  SUBJECTS_CATALOG_REF, getPipelineStage,
} from '../constants';
import { Btn } from './ui/Btn';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:           '#0d0b08',
  surface:      'rgba(255,255,255,0.025)',
  border:       'rgba(255,255,255,0.06)',
  borderHover:  'rgba(255,255,255,0.11)',
  accent:       '#d4891e',
  accentFaint:  'rgba(212,137,30,0.07)',
  accentBorder: 'rgba(212,137,30,0.22)',
  accentText:   '#e8a93a',
  text:         'rgba(255,255,255,0.88)',
  textSub:      'rgba(255,255,255,0.45)',
  textMuted:    'rgba(255,255,255,0.22)',
  green:        '#34d399',
  greenFaint:   'rgba(52,211,153,0.08)',
  greenBorder:  'rgba(52,211,153,0.22)',
  amber:        '#fbbf24',
  amberFaint:   'rgba(251,191,36,0.08)',
  amberBorder:  'rgba(251,191,36,0.22)',
  red:          '#f87171',
  redFaint:     'rgba(248,113,113,0.07)',
  redBorder:    'rgba(248,113,113,0.22)',
  blue:         '#60a5fa',
  blueFaint:    'rgba(96,165,250,0.07)',
  blueBorder:   'rgba(96,165,250,0.22)',
  purple:       '#a78bfa',
  purpleFaint:  'rgba(167,139,250,0.07)',
  purpleBorder: 'rgba(167,139,250,0.22)',
};

// ─── Announcement types ───────────────────────────────────────────────────────
const ANN_TYPES = [
  { id: 'info',    label: 'معلومة',   icon: 'ℹ', color: T.blue,   bg: T.blueFaint,   border: T.blueBorder   },
  { id: 'update',  label: 'تحديث',    icon: '◆', color: T.accent, bg: T.accentFaint, border: T.accentBorder },
  { id: 'warning', label: 'تنبيه',    icon: '⚠', color: T.amber,  bg: T.amberFaint,  border: T.amberBorder  },
  { id: 'urgent',  label: 'عاجل',     icon: '●', color: T.red,    bg: T.redFaint,    border: T.redBorder    },
];

// ─── Track order ──────────────────────────────────────────────────────────────
const TRACK_ORDER  = ['COMMON', 'SCIENCE', 'LITERARY'];
const TRACK_LABELS = { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' };

// ─── Shared helpers ───────────────────────────────────────────────────────────
const COMMITMENT_LABELS = {
  occasional: 'بشكل متقطع',
  '2-3h':     '٢–٣ ساعات / أسبوع',
  '5h+':      '٥ ساعات أو أكثر',
};
const AI_TOOL_LABELS = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', notebooklm: 'NotebookLM',
  claude: 'Claude', other: 'أدوات أخرى',
};
const AGE_LABELS = {
  'under-18': 'أقل من 18', '18-22': '18 – 22', '23-28': '23 – 28',
  '29-35': '29 – 35', '36+': '36+',
};

function relativeTime(d) {
  if (!d) return '—';
  const diff = Date.now() - new Date(d).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)   return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30)  return `منذ ${days} يوماً`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}
function shortDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Initials({ name, size = 38, colorClass = 'from-sand-700 to-sand-900' }) {
  const letters = (name || '؟').split(' ').slice(0, 2).map((w) => w[0]).join('');
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-bold font-arabic bg-gradient-to-br ${colorClass}`}
      style={{ width: size, height: size, fontSize: size * 0.38, color: '#e8d5a8', border: '1.5px solid rgba(212,137,30,0.2)' }}
    >
      {letters}
    </div>
  );
}

function InfoPill({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  const display = typeof value === 'boolean' ? (value ? 'نعم ✓' : 'لا ✗') : value;
  const isBool  = typeof value === 'boolean';
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-mono text-ink-700 uppercase tracking-wider">{label}</span>
      <span className="text-[11px] font-arabic" style={{ color: isBool ? (value ? T.green : T.red) : T.textSub }}>{display}</span>
    </div>
  );
}

function StatBadge({ icon, count, label }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
      style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
      <span className="text-[11px]">{icon}</span>
      <span className="text-sm font-bold font-mono tabular-nums" style={{ color: T.accent }}>{count}</span>
      <span className="text-[10px] text-ink-600 font-arabic">{label}</span>
    </div>
  );
}

function InlineLinkBox({ link, label, expiry }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div className="mt-3 p-3 rounded-xl" style={{ background: T.accentFaint, border: `1px solid ${T.accentBorder}` }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono" style={{ color: T.accent }}>{label}</span>
        {expiry && <span className="text-[9px] text-ink-700 font-arabic">{expiry}</span>}
      </div>
      <div className="flex items-center gap-2">
        <p dir="ltr" className="flex-1 text-[10px] font-mono text-ink-500 break-all truncate select-all">{link}</p>
        <button
          onClick={copy}
          className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-arabic font-semibold transition-all"
          style={{
            background: copied ? T.greenFaint : T.accentFaint,
            color:      copied ? T.green : T.accent,
            border:     copied ? `1px solid ${T.greenBorder}` : `1px solid ${T.accentBorder}`,
          }}
        >
          {copied ? '✓ تم' : 'نسخ'}
        </button>
      </div>
    </div>
  );
}

// ─── Team chip displayed on card ─────────────────────────────────────────────
function TeamChip({ teamName, teamRole }) {
  const isLeader = teamRole === 'leader';
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-arabic"
      style={{
        background: isLeader ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.04)',
        border:     isLeader ? '1px solid rgba(167,139,250,0.25)' : `1px solid ${T.border}`,
        color:      isLeader ? T.purple : T.textMuted,
      }}
    >
      {isLeader ? '⬡' : '◦'} {teamName}
      {isLeader && (
        <span className="text-[8px] font-mono" style={{ color: 'rgba(167,139,250,0.6)', marginRight: 2 }}>
          قائد
        </span>
      )}
    </span>
  );
}

// ─── Subject Picker ───────────────────────────────────────────────────────────
function SubjectPicker({ current, hint = [], onAssign, loading }) {
  const [open, setOpen] = useState(false);
  const grouped     = TRACK_ORDER.map((track) => ({
    track,
    subjects: SUBJECTS_CATALOG_REF.filter((s) => s.track === track),
  }));
  const currentSubj = SUBJECT_MAP[current];
  const isUnset     = !current;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-arabic transition-all"
        style={{
          background: isUnset ? 'rgba(239,68,68,0.08)' : T.accentFaint,
          border:     isUnset ? `1px solid ${T.redBorder}` : `1px solid ${T.accentBorder}`,
          color:      isUnset ? T.red : T.accent,
        }}
      >
        <span style={{ fontSize: 9 }}>📚</span>
        <span>{currentSubj ? currentSubj.nameAr : 'لم يُعيَّن مادة'}</span>
        <span style={{ fontSize: 8, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 right-0 mt-1.5 rounded-2xl overflow-hidden"
          style={{
            minWidth: 220,
            background: '#111009',
            border: `1px solid ${T.accentBorder}`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}
        >
          {hint.length > 0 && (
            <div className="px-3 pt-2.5 pb-1.5" style={{ borderBottom: `1px solid ${T.border}` }}>
              <p className="text-[9px] font-mono text-ink-700 uppercase tracking-wider mb-1.5">اهتمامات المساهم</p>
              <div className="flex flex-wrap gap-1">
                {hint.map((sid) => {
                  const s = SUBJECTS_CATALOG_REF.find((x) => x.id === sid);
                  if (!s) return null;
                  return (
                    <button
                      key={sid}
                      onClick={() => { onAssign(sid); setOpen(false); }}
                      className="text-[10px] px-2 py-0.5 rounded-full font-arabic transition-all"
                      style={{ background: T.accentFaint, color: T.accent, border: `1px solid ${T.accentBorder}` }}
                    >
                      ✦ {s.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <div className="py-1.5 max-h-64 overflow-y-auto">
            {grouped.map(({ track, subjects }) => (
              <div key={track}>
                <p className="text-[9px] font-mono text-ink-800 uppercase tracking-wider px-3 pt-2 pb-1">{TRACK_LABELS[track]}</p>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { onAssign(s.id); setOpen(false); }}
                    className="w-full text-right px-3 py-1.5 text-[11px] font-arabic flex items-center gap-2 transition-colors"
                    style={{
                      color:      s.id === current ? T.accent : T.textSub,
                      background: s.id === current ? T.accentFaint : 'transparent',
                    }}
                  >
                    {s.id === current && <span style={{ fontSize: 8, color: T.accent }}>✓</span>}
                    {s.nameAr}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {current && (
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              <button
                onClick={() => { onAssign(''); setOpen(false); }}
                className="w-full text-right px-3 py-2 text-[10px] font-arabic transition-colors"
                style={{ color: 'rgba(239,68,68,0.5)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(239,68,68,0.5)'; }}
              >
                إلغاء تعيين المادة
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Role Picker ──────────────────────────────────────────────────────────────
function RolePicker({ currentRoleId, roles = [], onAssign, loading }) {
  const [open, setOpen] = useState(false);
  const currentRole = roles.find((r) => r._id === currentRoleId);
  if (!roles.length) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-arabic transition-all"
        style={{
          background: T.surface,
          border:     `1px solid ${T.border}`,
          color:      currentRole ? 'rgba(200,180,140,0.8)' : T.textMuted,
        }}
      >
        <span style={{ fontSize: 9 }}>◆</span>
        <span>{currentRole ? currentRole.name : 'بدون دور'}</span>
        <span style={{ fontSize: 8, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          className="absolute z-50 right-0 mt-1.5 rounded-2xl overflow-hidden"
          style={{
            minWidth: 180,
            background: '#111009',
            border: `1px solid rgba(255,255,255,0.1)`,
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}
        >
          <div className="py-1.5">
            {roles.map((r) => (
              <button
                key={r._id}
                onClick={() => { onAssign(r._id); setOpen(false); }}
                className="w-full text-right px-3 py-2 text-[11px] font-arabic flex items-center gap-2 transition-colors"
                style={{
                  color:      r._id === currentRoleId ? 'rgba(200,180,140,1)' : T.textSub,
                  background: r._id === currentRoleId ? 'rgba(200,180,140,0.06)' : 'transparent',
                }}
              >
                {r._id === currentRoleId && <span style={{ fontSize: 8 }}>✓</span>}
                ◆ {r.name}
              </button>
            ))}
          </div>
          {currentRoleId && (
            <div style={{ borderTop: `1px solid ${T.border}` }}>
              <button
                onClick={() => { onAssign(null); setOpen(false); }}
                className="w-full text-right px-3 py-2 text-[10px] font-arabic"
                style={{ color: 'rgba(239,68,68,0.45)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.red; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(239,68,68,0.45)'; }}
              >
                إزالة الدور
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Username Editor ──────────────────────────────────────────────────────────
function UsernameEditor({ contributorId, currentUsername, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(currentUsername || '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState(null);

  const open   = () => { setValue(currentUsername || ''); setError(null); setEditing(true); };
  const cancel = () => { setEditing(false); setError(null); };
  const save   = async () => {
    const username = value.trim().toLowerCase().replace(/\s+/g, '_');
    if (!username) { setError('اسم المستخدم لا يمكن أن يكون فارغاً'); return; }
    if (username === currentUsername) { setEditing(false); return; }
    setSaving(true); setError(null);
    try {
      const res  = await fetch('/api/admin/contributors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ id: contributorId, action: 'set_username', username }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) setError(data.message || 'حدث خطأ');
      else { setEditing(false); onSaved?.(); }
    } catch { setError('تعذّر الاتصال بالخادم'); }
    finally { setSaving(false); }
  };
  const handleKey = (e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); };

  if (!editing) {
    return (
      <div className="flex items-center gap-1.5">
        {currentUsername
          ? <span dir="ltr" className="text-[11px] font-mono" style={{ color: 'rgba(212,137,30,0.6)' }}>@{currentUsername}</span>
          : <span className="text-[10px] font-mono" style={{ color: T.textMuted }}>بدون username</span>
        }
        <button
          onClick={open}
          title="تعديل اسم المستخدم"
          className="flex items-center justify-center transition-all"
          style={{
            width: 18, height: 18, borderRadius: 5,
            background: T.surface, border: `1px solid ${T.border}`,
            color: T.textMuted, fontSize: 9, cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = T.accentFaint; e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = T.accentBorder; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = T.surface; e.currentTarget.style.color = T.textMuted; e.currentTarget.style.borderColor = T.border; }}
        >✎</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-mono" style={{ color: 'rgba(212,137,30,0.5)' }}>@</span>
        <input
          autoFocus dir="ltr" value={value}
          onChange={(e) => { setValue(e.target.value); setError(null); }}
          onKeyDown={handleKey}
          placeholder="username"
          className="text-[11px] font-mono outline-none rounded-lg transition-all"
          style={{
            width: 110, padding: '3px 8px',
            background:  T.accentFaint,
            border:      error ? `1px solid ${T.redBorder}` : `1px solid ${T.accentBorder}`,
            color: '#e8d5a8', caretColor: T.accent,
          }}
        />
        <button onClick={save} disabled={saving}
          className="flex items-center justify-center"
          style={{ width: 22, height: 22, borderRadius: 6, background: T.greenFaint, border: `1px solid ${T.greenBorder}`, color: T.green, fontSize: 10, cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? '…' : '✓'}
        </button>
        <button onClick={cancel}
          className="flex items-center justify-center"
          style={{ width: 22, height: 22, borderRadius: 6, background: T.surface, border: `1px solid ${T.border}`, color: T.textMuted, fontSize: 10, cursor: 'pointer' }}>
          ✕
        </button>
      </div>
      {error && <p className="text-[9px] font-mono" style={{ color: T.red, paddingRight: 14 }}>{error}</p>}
    </div>
  );
}

// ─── Announce Compose Panel ───────────────────────────────────────────────────
// Shown when admin clicks "إرسال إعلان" on an active contributor card.
// Supports: broadcast, targeted (single contributor), or team-scoped.
function AnnouncePanel({ contributor, contributorTeams = [], onClose, onSent }) {
  const [audience,  setAudience]  = useState('contributor'); // 'broadcast' | 'contributor' | team._id
  const [annType,   setAnnType]   = useState('info');
  const [title,     setTitle]     = useState('');
  const [body,      setBody]      = useState('');
  const [pinned,    setPinned]    = useState(false);
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState(null);
  const titleRef = useRef(null);

  useEffect(() => { setTimeout(() => titleRef.current?.focus(), 50); }, []);

  const currentType = ANN_TYPES.find((t) => t.id === annType);

  const buildPayload = () => {
    const base = { title: title.trim(), body: body.trim(), type: annType, pinned };
    if (audience === 'broadcast')    return base;
    if (audience === 'contributor')  return { ...base, targetContributorIds: [contributor._id] };
    // team id
    return { ...base, targetTeamIds: [audience] };
  };

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { setError('العنوان والمحتوى مطلوبان'); return; }
    setSending(true); setError(null);
    try {
      const res  = await fetch('/api/admin/announcements', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(buildPayload()),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setError(data.error || 'حدث خطأ'); return; }
      setSent(true);
      setTimeout(() => { onSent?.(); onClose(); }, 1400);
    } catch { setError('تعذّر الاتصال بالخادم'); }
    finally { setSending(false); }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6"
        style={{ background: T.greenFaint, borderRadius: 12, border: `1px solid ${T.greenBorder}` }}>
        <span style={{ fontSize: 22, color: T.green }}>✓</span>
        <p className="text-xs font-arabic" style={{ color: T.green }}>تم إرسال الإعلان بنجاح</p>
      </div>
    );
  }

  const audienceOptions = [
    { id: 'broadcast',   label: 'جميع المساهمين', icon: '◎', color: T.accent },
    { id: 'contributor', label: contributor.name,  icon: '◉', color: T.blue   },
    ...contributorTeams.map((t) => ({
      id:    t._id.toString(),
      label: t.teamName,
      icon:  '⬡',
      color: T.purple,
      isTeam: true,
    })),
  ];

  return (
    <div className="p-4 space-y-3"
      style={{ background: 'rgba(0,0,0,0.25)', borderTop: `1px solid ${T.border}` }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: T.accent }}>✦ إعلان جديد</span>
        <button onClick={onClose}
          className="text-[10px] font-mono transition-colors"
          style={{ color: T.textMuted }}
          onMouseEnter={(e) => e.currentTarget.style.color = T.red}
          onMouseLeave={(e) => e.currentTarget.style.color = T.textMuted}>
          ✕ إلغاء
        </button>
      </div>

      {/* Audience picker */}
      <div>
        <p className="text-[9px] font-mono text-ink-700 uppercase tracking-wider mb-1.5">الجمهور المستهدف</p>
        <div className="flex flex-wrap gap-1.5">
          {audienceOptions.map((opt) => {
            const active = audience === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setAudience(opt.id)}
                className="inline-flex items-center gap-1.5 text-[10px] font-arabic px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: active ? `${opt.color}15` : T.surface,
                  border:     active ? `1px solid ${opt.color}55` : `1px solid ${T.border}`,
                  color:      active ? opt.color : T.textMuted,
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span style={{ fontSize: 9 }}>{opt.icon}</span>
                {opt.label}
                {opt.isTeam && (
                  <span className="text-[8px] font-mono" style={{ opacity: 0.6 }}>فريق</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Type picker */}
      <div>
        <p className="text-[9px] font-mono text-ink-700 uppercase tracking-wider mb-1.5">نوع الإعلان</p>
        <div className="flex gap-1.5">
          {ANN_TYPES.map((t) => {
            const active = annType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setAnnType(t.id)}
                className="inline-flex items-center gap-1 text-[10px] font-arabic px-2.5 py-1 rounded-full transition-all"
                style={{
                  background: active ? t.bg : T.surface,
                  border:     active ? `1px solid ${t.border}` : `1px solid ${T.border}`,
                  color:      active ? t.color : T.textMuted,
                }}
              >
                <span style={{ fontSize: 8 }}>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div>
        <input
          ref={titleRef}
          dir="rtl"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setError(null); }}
          placeholder="عنوان الإعلان…"
          className="w-full outline-none rounded-xl font-arabic text-xs"
          style={{
            padding: '8px 12px',
            background: T.surface,
            border:     error && !title ? `1px solid ${T.redBorder}` : `1px solid ${T.border}`,
            color: T.text,
            caretColor: T.accent,
          }}
        />
      </div>

      {/* Body */}
      <div>
        <textarea
          dir="rtl"
          value={body}
          onChange={(e) => { setBody(e.target.value); setError(null); }}
          placeholder="محتوى الإعلان…"
          rows={3}
          className="w-full outline-none rounded-xl font-arabic text-xs resize-none"
          style={{
            padding: '8px 12px',
            background: T.surface,
            border:     error && !body ? `1px solid ${T.redBorder}` : `1px solid ${T.border}`,
            color: T.text,
            caretColor: T.accent,
            lineHeight: 1.7,
          }}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)}
            className="rounded"
            style={{ accentColor: T.accent }} />
          <span className="text-[10px] font-arabic" style={{ color: T.textMuted }}>تثبيت الإعلان</span>
        </label>

        <div className="flex items-center gap-2">
          {error && <p className="text-[9px] font-mono" style={{ color: T.red }}>{error}</p>}
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-arabic font-semibold transition-all"
            style={{
              background: sending ? T.accentFaint : T.accent,
              color:      sending ? T.accent : '#1a0f00',
              border:     `1px solid ${T.accentBorder}`,
              cursor:     sending ? 'not-allowed' : 'pointer',
            }}
          >
            {sending ? '…' : '✦'} {sending ? 'جارٍ الإرسال' : 'إرسال'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── REQUEST CARD ─────────────────────────────────────────────────────────────
const INTERVIEW_FIELDS = [
  { label: 'لماذا تريد المساهمة؟',      key: 'motivation'        },
  { label: 'ما الذي يُعلَّم بشكل سيئ؟', key: 'educationCritique' },
  { label: 'كيف تشرح فكرة صعبة؟',       key: 'teachingMoment'    },
  { label: 'الالتزام الأسبوعي',          key: 'weeklyCommitment'  },
  { label: 'المهمة الصغيرة',             key: 'microTask'         },
];

export function RequestCard({ c, actionLoading, onAct, onDelete, onSetPassword }) {
  const [openSection,   setOpenSection]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeLink,    setActiveLink]    = useState(null);
  const [localLoading,  setLocalLoading]  = useState(null);

  const stage         = getPipelineStage(c);
  const hasAnswers    = !!c.interviewAnswers?.submittedAt;
  const hasDynAnswers = !!c.dynamicAnswersSubmittedAt;
  const hasAnyAnswers = hasAnswers || hasDynAnswers;
  const subj          = SUBJECT_MAP[c.subject];
  const st            = CONTRIBUTOR_STATUS[c.status] || CONTRIBUTOR_STATUS.pending;

  const toggleSection = (s) => setOpenSection((v) => v === s ? null : s);

  const avatarGradient = c.status === 'rejected'
    ? 'from-red-900 to-red-950'
    : hasAnyAnswers ? 'from-green-900 to-green-950'
    : c.interviewToken ? 'from-blue-900 to-blue-950'
    : 'from-sand-800 to-ink-900';

  const sendInterviewLink = async () => {
    setLocalLoading('send_interview');
    try {
      const res  = await fetch('/api/admin/contributors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ id: c._id, action: 'send_interview' }),
      });
      const data = await res.json();
      if (data.interviewLink) {
        setActiveLink({ link: data.interviewLink, label: 'رابط المقابلة', expiry: 'صالح 14 يوماً' });
      }
      onAct(c._id, '_noop');
    } finally { setLocalLoading(null); }
  };

  const BORDER = T.border;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: T.bg, border: `1px solid ${T.border}` }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.borderHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; }}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <Initials name={c.name} size={40} colorClass={avatarGradient} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-bold text-sand-200 font-arabic text-sm">{c.name}</span>
            {c.gender === 'female' && <span className="text-[9px] text-ink-700 font-arabic">أنثى</span>}
            {c.gender === 'male'   && <span className="text-[9px] text-ink-700 font-arabic">ذكر</span>}
          </div>
          <p dir="ltr" className="text-[11px] font-mono text-ink-500 mb-1.5">{c.email}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {stage && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-arabic ${stage.color}`}>{stage.label}</span>
            )}
            {c.status === 'rejected' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-arabic ${st.badge}`}>مرفوض</span>
            )}
            {c.roleId?.name && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-sand-800/40 bg-sand-900/20 text-sand-500 font-arabic">
                ◆ {c.roleId.name}
              </span>
            )}
            {subj && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-arabic ${TRACK_CONFIG[subj.track]?.badge || 'border-ink-700 text-ink-400'}`}>
                {subj.nameAr}
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-left">
          <p className="text-[10px] font-mono text-ink-700">{relativeTime(c.createdAt)}</p>
          <p className="text-[9px] font-mono text-ink-800">{shortDate(c.createdAt)}</p>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex" style={{ borderTop: `1px solid ${BORDER}` }}>
        {[
          { key: 'profile',   icon: '◉', label: 'بيانات الطلب' },
          { key: 'interview', icon: hasAnyAnswers ? '✦' : '◌',
            label: hasAnyAnswers ? 'إجابات المقابلة' : 'لم تُكمل المقابلة' },
        ].map(({ key, icon, label }, i) => (
          <button
            key={key}
            onClick={() => toggleSection(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors"
            style={{
              borderLeft:  i === 0 ? `1px solid ${BORDER}` : 'none',
              background:  openSection === key ? T.accentFaint : 'transparent',
              color:       openSection === key ? T.accent
                         : (key === 'interview' && hasAnyAnswers) ? 'rgba(52,211,153,0.65)'
                         : T.textMuted,
            }}
          >
            <span className="text-[10px]">{icon}</span>
            <span className="text-[10px] font-arabic">{label}</span>
          </button>
        ))}
      </div>

      {/* Profile panel */}
      {openSection === 'profile' && (
        <div className="px-4 py-4" style={{ background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${BORDER}` }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 mb-4">
            <InfoPill label="الخلفية"         value={c.background || c.fieldOfStudy} />
            <InfoPill label="الفئة العمرية"   value={AGE_LABELS[c.age] || c.age}    />
            <InfoPill label="المدينة"          value={c.town}                         />
            <InfoPill label="حاسب / لوحي"     value={c.hasPcOrTablet}               />
            <InfoPill label="إنترنت مستقر"    value={c.hasStableInternet}            />
            <InfoPill label="يستخدم أدوات AI" value={c.usesAiTools}                 />
          </div>
          {c.aiToolsList?.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-mono text-ink-700 uppercase tracking-wider mb-1.5">أدوات الذكاء الاصطناعي</p>
              <div className="flex flex-wrap gap-1">
                {c.aiToolsList.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: T.blueFaint, color: T.blue, border: `1px solid ${T.blueBorder}` }}>
                    {AI_TOOL_LABELS[t] || t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {c.portfolioUrl && (
            <div>
              <p className="text-[9px] font-mono text-ink-700 uppercase tracking-wider mb-1">Portfolio</p>
              <a href={c.portfolioUrl} target="_blank" rel="noreferrer" dir="ltr"
                className="text-[11px] font-mono hover:underline truncate block max-w-xs" style={{ color: T.accent }}>
                {c.portfolioUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Interview panel */}
      {openSection === 'interview' && (
        <div className="px-4 py-4" style={{ background: 'rgba(0,0,0,0.2)', borderTop: `1px solid ${BORDER}` }}>
          {!hasAnyAnswers ? (
            <p className="text-xs text-ink-700 font-arabic text-center py-4">لم يُكمل المتقدم المقابلة بعد.</p>
          ) : hasDynAnswers ? (
            <div className="space-y-4">
              {(c.dynamicAnswers || []).map((a, i) => (
                <div key={i} className="pr-3 border-r-2" style={{ borderColor: T.accentBorder }}>
                  <p className="text-[10px] font-mono text-ink-600 mb-1 leading-snug">{a.question}</p>
                  <p className="text-xs text-ink-400 leading-loose font-arabic whitespace-pre-wrap">{a.answer}</p>
                </div>
              ))}
              {c.dynamicMicroTask && (
                <div className="pr-3 border-r-2" style={{ borderColor: T.accentBorder }}>
                  <p className="text-[10px] font-mono text-ink-600 mb-1">المهمة التطبيقية</p>
                  <p className="text-xs text-ink-400 leading-loose font-arabic whitespace-pre-wrap">{c.dynamicMicroTask}</p>
                </div>
              )}
              <p className="text-[9px] font-mono text-ink-800">أُرسلت: {shortDate(c.dynamicAnswersSubmittedAt)}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {INTERVIEW_FIELDS.map(({ label, key }) => {
                const val = c.interviewAnswers[key];
                if (!val) return null;
                const display = key === 'weeklyCommitment' ? (COMMITMENT_LABELS[val] || val) : val;
                return (
                  <div key={key} className="pr-3 border-r-2" style={{ borderColor: T.accentBorder }}>
                    <p className="text-[10px] font-mono text-ink-600 mb-1">{label}</p>
                    <p className="text-xs text-ink-400 leading-loose font-arabic whitespace-pre-wrap">{display}</p>
                  </div>
                );
              })}
              <p className="text-[9px] font-mono text-ink-800">أُرسلت: {shortDate(c.interviewAnswers?.submittedAt)}</p>
            </div>
          )}
        </div>
      )}

      {/* Inline link */}
      {activeLink && (
        <div className="px-4 pb-3">
          <InlineLinkBox {...activeLink} />
        </div>
      )}

      {/* Actions footer */}
      <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap"
        style={{ background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${BORDER}` }}>
        {c.status === 'pending' && (
          <>
            {!hasAnyAnswers && (
              <Btn small variant="sand" loading={localLoading === 'send_interview'} onClick={sendInterviewLink}>
                {c.interviewToken ? 'تجديد رابط المقابلة' : 'إرسال رابط المقابلة'}
              </Btn>
            )}
            {hasAnyAnswers && (
              <>
                <Btn small variant="green" onClick={() => onSetPassword(c._id, c.name)}>اعتماد + كلمة مرور</Btn>
                <Btn small variant="ghost" loading={actionLoading === c._id + 'approve'}
                  onClick={() => onAct(c._id, 'approve')}>اعتماد فقط</Btn>
              </>
            )}
            <Btn small variant="red" loading={actionLoading === c._id + 'reject'}
              onClick={() => onAct(c._id, 'reject')}>رفض</Btn>
          </>
        )}
        {c.status === 'rejected' && (
          <Btn small variant="ghost" loading={actionLoading === c._id + 'reset_to_pending'}
            onClick={() => onAct(c._id, 'reset_to_pending')}>إعادة للانتظار</Btn>
        )}
        <div className="flex-1" />
        {deleteConfirm ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-red-400 font-arabic">تأكيد؟</span>
            <Btn small variant="red" loading={actionLoading === c._id + 'delete'} onClick={() => onDelete(c._id)}>حذف</Btn>
            <Btn small variant="ghost" onClick={() => setDeleteConfirm(false)}>لا</Btn>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)}
            className="text-[10px] font-mono text-ink-800 hover:text-red-500 transition-colors px-1">حذف</button>
        )}
      </div>
    </div>
  );
}

// ─── ACTIVE CARD ──────────────────────────────────────────────────────────────
// Props:
//   c             — contributor object
//   teams         — ALL teams array (to derive this contributor's memberships)
//   roles         — roles array for the role picker
//   actionLoading — keyed loading state
//   onAct / onDelete / onSetPassword — callbacks
export function ActiveCard({ c, actionLoading, onAct, onDelete, onSetPassword, roles = [], teams = [] }) {
  const [mode,             setMode]             = useState('view'); // 'view' | 'announce'
  const [activeLink,       setActiveLink]       = useState(null);
  const [deleteConfirm,    setDeleteConfirm]    = useState(false);
  const [localLoading,     setLocalLoading]     = useState(null);
  const [assigningSubject, setAssigningSubject] = useState(false);
  const [assigningRole,    setAssigningRole]    = useState(false);

  // Derive which teams this contributor belongs to
  const contributorTeams = teams
    .filter((t) => t.members?.some((m) => m.contributorId?.toString() === c._id?.toString()))
    .map((t) => {
      const membership = t.members.find((m) => m.contributorId?.toString() === c._id?.toString());
      return { _id: t._id, teamName: t.name, teamRole: membership?.teamRole || 'member' };
    });

  const subj           = SUBJECT_MAP[c.subject];
  const stats          = c.stats || {};
  const hasStats       = (stats.lessonsCreated || 0) + (stats.questionsAdded || 0)
                       + (stats.feedItemsCreated || 0) + (stats.blocksAdded || 0) > 0;
  const subjectMissing = c.onboarded && !c.subject;
  const BORDER         = T.border;

  const handleAssignSubject = async (subjectId) => {
    setAssigningSubject(true);
    try {
      await fetch('/api/admin/contributors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ id: c._id, action: 'assign_subject', subject: subjectId }),
      });
      onAct(c._id, '_noop');
    } finally { setAssigningSubject(false); }
  };

  const handleAssignRole = async (roleId) => {
    setAssigningRole(true);
    try {
      await fetch('/api/admin/contributors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ id: c._id, action: 'assign_role_id', roleId }),
      });
      onAct(c._id, '_noop');
    } finally { setAssigningRole(false); }
  };

  const handleOnboardLink = async () => {
    setLocalLoading('onboard');
    try {
      const res  = await fetch('/api/admin/contributors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify({ id: c._id, action: 'generate_onboard_link' }),
      });
      const data = await res.json();
      if (data.onboardingLink) {
        setActiveLink({ link: data.onboardingLink, label: 'رابط التأهيل', expiry: 'صالح 7 أيام' });
      }
      onAct(c._id, '_noop');
    } finally { setLocalLoading(null); }
  };

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: T.bg,
        border: subjectMissing ? `1px solid ${T.redBorder}` : `1px solid ${T.border}`,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = subjectMissing ? 'rgba(248,113,113,0.35)' : T.borderHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = subjectMissing ? T.redBorder : T.border; }}
    >
      {/* ── Header ── */}
      <div className="p-4 flex items-start gap-3">
        {c.avatarUrl ? (
          <img src={c.avatarUrl} alt={c.name} className="rounded-full object-cover shrink-0"
            style={{ width: 40, height: 40, border: '1.5px solid rgba(212,137,30,0.35)' }} />
        ) : (
          <Initials name={c.name} size={40} colorClass="from-sand-700 to-sand-900" />
        )}

        <div className="flex-1 min-w-0">
          {/* Name row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-bold text-sand-200 font-arabic text-sm">{c.name}</span>
            {c.onboarded
              ? <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-green-900/50 bg-green-950/30 text-green-500 font-arabic">مكتمل</span>
              : <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-amber-900/50 bg-amber-950/30 text-amber-500 font-arabic">ينتظر التأهيل</span>
            }
            {subj && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-arabic ${TRACK_CONFIG[subj.track]?.badge || 'border-ink-700 text-ink-400'}`}>
                {subj.nameAr}
              </span>
            )}
            {c.roleId?.name && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full border border-sand-800/40 bg-sand-900/20 text-sand-500 font-arabic">
                ◆ {c.roleId.name}
              </span>
            )}
          </div>

          {/* Email + username */}
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <p dir="ltr" className="text-[11px] font-mono text-ink-500">{c.email}</p>
            <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.08)' }} />
            <UsernameEditor contributorId={c._id} currentUsername={c.username} onSaved={() => onAct(c._id, '_noop')} />
          </div>

          {/* Team chips */}
          {contributorTeams.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {contributorTeams.map((t) => (
                <TeamChip key={t._id} teamName={t.teamName} teamRole={t.teamRole} />
              ))}
            </div>
          )}
        </div>

        {/* Right meta + mode toggle */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <div className="text-left">
            {stats.lastActiveAt ? (
              <>
                <p className="text-[9px] font-mono text-ink-800">آخر نشاط</p>
                <p className="text-[10px] font-mono text-ink-600">{relativeTime(stats.lastActiveAt)}</p>
              </>
            ) : (
              <p className="text-[10px] font-mono text-ink-800">لم ينشط</p>
            )}
            {c.username && (
              <a href={`/contributors/${c.username}`} target="_blank" rel="noreferrer"
                className="text-[9px] font-mono mt-0.5 transition-colors block"
                style={{ color: 'rgba(212,137,30,0.45)', textDecoration: 'none' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = T.accent; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(212,137,30,0.45)'; }}>
                ↗ ملفه
              </a>
            )}
          </div>

          {/* Mode toggle button */}
          <button
            onClick={() => setMode((v) => v === 'announce' ? 'view' : 'announce')}
            title="إرسال إعلان"
            className="flex items-center gap-1 px-2 py-1 rounded-lg transition-all text-[10px] font-arabic"
            style={{
              background: mode === 'announce' ? T.accentFaint : T.surface,
              border:     mode === 'announce' ? `1px solid ${T.accentBorder}` : `1px solid ${T.border}`,
              color:      mode === 'announce' ? T.accent : T.textMuted,
            }}
            onMouseEnter={(e) => {
              if (mode !== 'announce') {
                e.currentTarget.style.background = T.accentFaint;
                e.currentTarget.style.borderColor = T.accentBorder;
                e.currentTarget.style.color = T.accentText;
              }
            }}
            onMouseLeave={(e) => {
              if (mode !== 'announce') {
                e.currentTarget.style.background = T.surface;
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.color = T.textMuted;
              }
            }}
          >
            <span style={{ fontSize: 9 }}>✦</span>
            إعلان
          </button>
        </div>
      </div>

      {/* ── Stats row ── */}
      {hasStats && (
        <div className="px-4 pb-3 flex flex-wrap gap-2" style={{ paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
          <StatBadge icon="📖" count={stats.lessonsCreated}   label="درس"   />
          <StatBadge icon="❓" count={stats.questionsAdded}   label="سؤال"  />
          <StatBadge icon="📡" count={stats.feedItemsCreated} label="بطاقة" />
          <StatBadge icon="🌍" count={stats.publishedLessons} label="منشور" />
        </div>
      )}

      {/* ── Missing-subject warning ── */}
      {subjectMissing && (
        <div
          className="mx-4 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{
            background: T.redFaint, border: `1px solid ${T.redBorder}`,
            marginTop: hasStats ? 0 : 8, marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 11 }}>⚠</span>
          <p className="text-[10px] font-arabic flex-1" style={{ color: T.red }}>
            لم تُعيَّن مادة — لن يتمكن من الوصول للمحرر حتى يتم التعيين
          </p>
          {(c.subjectsOfInterest?.length || 0) > 0 && (
            <span className="text-[9px] font-mono text-ink-700 shrink-0">
              اختار {c.subjectsOfInterest.length} أثناء التسجيل
            </span>
          )}
        </div>
      )}

      {/* ── Subject + Role pickers ── */}
      <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap" style={{ borderTop: `1px solid ${BORDER}` }}>
        <SubjectPicker
          current={c.subject}
          hint={c.subjectsOfInterest || []}
          onAssign={handleAssignSubject}
          loading={assigningSubject}
        />
        <RolePicker
          currentRoleId={c.roleId?._id || c.roleId}
          roles={roles}
          onAssign={handleAssignRole}
          loading={assigningRole}
        />
        {(assigningSubject || assigningRole) && (
          <span className="text-[9px] font-mono text-ink-700">جارٍ الحفظ…</span>
        )}
      </div>

      {/* ── Announce compose panel (mode === 'announce') ── */}
      {mode === 'announce' && (
        <AnnouncePanel
          contributor={c}
          contributorTeams={contributorTeams}
          onClose={() => setMode('view')}
          onSent={() => onAct(c._id, '_noop')}
        />
      )}

      {/* ── Inline link ── */}
      {activeLink && (
        <div className="px-4 pb-3">
          <InlineLinkBox {...activeLink} />
        </div>
      )}

      {/* ── Actions footer ── */}
      <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap"
        style={{ background: 'rgba(0,0,0,0.15)', borderTop: `1px solid ${BORDER}` }}>
        <Btn small variant="sand" onClick={() => onSetPassword(c._id, c.name)}>
          {c.passwordHash ? 'تغيير المرور' : 'تعيين مرور'}
        </Btn>
        <Btn small variant="ghost" loading={localLoading === 'onboard'} onClick={handleOnboardLink}>
          {c.onboarded ? '↺ تجديد رابط التأهيل' : 'رابط التأهيل'}
        </Btn>
        <div className="flex-1" />
        {deleteConfirm ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-red-400 font-arabic">تأكيد؟</span>
            <Btn small variant="red" loading={actionLoading === c._id + 'delete'} onClick={() => onDelete(c._id)}>حذف</Btn>
            <Btn small variant="ghost" onClick={() => setDeleteConfirm(false)}>لا</Btn>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)}
            className="text-[10px] font-mono text-ink-800 hover:text-red-500 transition-colors px-1">حذف</button>
        )}
      </div>
    </div>
  );
}

// ─── Legacy default export ────────────────────────────────────────────────────
export function ContributorCard(props) {
  return props.c?.status === 'approved'
    ? <ActiveCard {...props} />
    : <RequestCard {...props} />;
}
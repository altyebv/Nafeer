'use client';
import { useState, useMemo, useEffect } from 'react';
import { SetPasswordModal } from './modals/SetPasswordModal';
import { SectionHeader, EmptyState } from './ui/shared';

// ─── Constants ────────────────────────────────────────────────────────────────

const TRACK_ORDER = ['COMMON', 'SCIENCE', 'LITERARY'];
const TRACK_LABELS = { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' };

const COMMITMENT_LABELS = {
  occasional: 'بشكل متقطع',
  '2-3h': '٢–٣ ساعات / أسبوع',
  '5h+': '٥ ساعات أو أكثر',
};

const AI_TOOL_LABELS = {
  chatgpt: 'ChatGPT', gemini: 'Gemini', notebooklm: 'NotebookLM',
  claude: 'Claude', other: 'أدوات أخرى',
};

const AGE_LABELS = {
  'under-18': 'أقل من 18', '18-22': '18–22', '23-28': '23–28',
  '29-35': '29–35', '36+': '36+',
};

const REQUEST_FILTERS = [
  { key: 'all',      label: 'الكل' },
  { key: 'new',      label: 'طلبات جديدة' },
  { key: 'sent',     label: 'ينتظر المقابلة' },
  { key: 'answered', label: 'أكمل المقابلة' },
  { key: 'rejected', label: 'مرفوضون' },
];

const INTERVIEW_FIELDS = [
  { label: 'لماذا تريد المساهمة؟',      key: 'motivation' },
  { label: 'ما الذي يُعلَّم بشكل سيئ؟', key: 'educationCritique' },
  { label: 'كيف تشرح فكرة صعبة؟',       key: 'teachingMoment' },
  { label: 'الالتزام الأسبوعي',          key: 'weeklyCommitment' },
  { label: 'المهمة الصغيرة',             key: 'microTask' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function matchRequestFilter(c, key) {
  if (key === 'all')      return c.status === 'pending' || c.status === 'rejected';
  if (key === 'rejected') return c.status === 'rejected';
  if (c.status !== 'pending') return false;
  const hasAnswers = c.interviewAnswers?.submittedAt || c.dynamicAnswersSubmittedAt;
  if (key === 'new')      return !c.interviewToken && !hasAnswers;
  if (key === 'sent')     return !!c.interviewToken && !hasAnswers;
  if (key === 'answered') return !!hasAnswers;
  return false;
}

function searchMatch(c, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    c.name?.toLowerCase().includes(lower) ||
    c.email?.toLowerCase().includes(lower) ||
    c.username?.toLowerCase().includes(lower)
  );
}

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

function getPipelineStage(c) {
  if (c.status !== 'pending') return null;
  const hasAnswers = c.interviewAnswers?.submittedAt || c.dynamicAnswersSubmittedAt;
  if (hasAnswers)       return { label: 'أكمل المقابلة', type: 'success' };
  if (c.interviewToken) return { label: 'ينتظر المقابلة', type: 'info' };
  return { label: 'طلب جديد', type: 'warning' };
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  // Backgrounds
  surface:      'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  sunken:       'rgba(0,0,0,0.25)',
  overlay:      '#0e0c09',

  // Accent (gold)
  accent:       '#d48a1e',
  accentFaint:  'rgba(212,138,30,0.08)',
  accentBorder: 'rgba(212,138,30,0.22)',
  accentText:   '#e8a93a',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  borderSub:    'rgba(255,255,255,0.04)',

  // Text
  textPrimary:   'rgba(255,255,255,0.88)',
  textSecondary: 'rgba(255,255,255,0.45)',
  textMuted:     'rgba(255,255,255,0.22)',

  // Status
  green:        '#34d399',
  greenBg:      'rgba(52,211,153,0.08)',
  greenBorder:  'rgba(52,211,153,0.2)',

  blue:         '#60a5fa',
  blueBg:       'rgba(96,165,250,0.08)',
  blueBorder:   'rgba(96,165,250,0.2)',

  amber:        '#fbbf24',
  amberBg:      'rgba(251,191,36,0.08)',
  amberBorder:  'rgba(251,191,36,0.2)',

  red:          '#f87171',
  redBg:        'rgba(248,113,113,0.08)',
  redBorder:    'rgba(248,113,113,0.2)',
};

// ─── Micro components ─────────────────────────────────────────────────────────

function Badge({ type = 'default', children }) {
  const styles = {
    success: { bg: T.greenBg,  border: T.greenBorder,  color: T.green  },
    info:    { bg: T.blueBg,   border: T.blueBorder,   color: T.blue   },
    warning: { bg: T.amberBg,  border: T.amberBorder,  color: T.amber  },
    danger:  { bg: T.redBg,    border: T.redBorder,    color: T.red    },
    accent:  { bg: T.accentFaint, border: T.accentBorder, color: T.accentText },
    default: { bg: T.surface,  border: T.border,       color: T.textSecondary },
  };
  const s = styles[type] || styles.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 20,
      background: s.bg, border: `1px solid ${s.border}`,
      color: s.color, fontSize: 10, fontFamily: 'monospace',
      whiteSpace: 'nowrap', lineHeight: 1.6,
    }}>
      {children}
    </span>
  );
}

function Avatar({ name, avatarUrl, size = 40, type = 'default' }) {
  const gradients = {
    default: 'linear-gradient(135deg, #2a2218 0%, #1a1510 100%)',
    success: 'linear-gradient(135deg, #0d2b1f 0%, #071a12 100%)',
    info:    'linear-gradient(135deg, #0d1e35 0%, #071322 100%)',
    warning: 'linear-gradient(135deg, #2a1f0d 0%, #1a1307 100%)',
    danger:  'linear-gradient(135deg, #2a0d0d 0%, #1a0707 100%)',
  };
  const borders = {
    default: 'rgba(212,138,30,0.25)',
    success: 'rgba(52,211,153,0.3)',
    info:    'rgba(96,165,250,0.3)',
    warning: 'rgba(251,191,36,0.3)',
    danger:  'rgba(248,113,113,0.3)',
  };
  const textColors = {
    default: T.accentText,
    success: T.green,
    info:    T.blue,
    warning: T.amber,
    danger:  T.red,
  };
  const letters = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('');

  if (avatarUrl) {
    return (
      <img src={avatarUrl} alt={name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${borders[type] || borders.default}` }} />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: gradients[type] || gradients.default,
      border: `1.5px solid ${borders[type] || borders.default}`,
      color: textColors[type] || textColors.default,
      fontSize: size * 0.36, fontWeight: 700, fontFamily: 'monospace',
      letterSpacing: '0.02em',
    }}>
      {letters}
    </div>
  );
}

function Pill({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  const isBool = typeof value === 'boolean';
  const display = isBool ? (value ? 'نعم' : 'لا') : value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 11, color: isBool ? (value ? T.green : T.red) : T.textSecondary, fontFamily: 'monospace' }}>
        {isBool ? (value ? '✓ نعم' : '✗ لا') : display}
      </span>
    </div>
  );
}

function StatBadge({ icon, count, label }) {
  if (!count) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '5px 10px', borderRadius: 8,
      background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
    }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: T.accentText }}>{count}</span>
      <span style={{ fontSize: 10, color: T.textSecondary }}>{label}</span>
    </div>
  );
}

function CopyBox({ link, label, expiry }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{
      margin: '12px 0 0', padding: '12px 14px', borderRadius: 12,
      background: T.accentFaint, border: `1px solid ${T.accentBorder}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: T.accentText, fontFamily: 'monospace' }}>{label}</span>
        {expiry && <span style={{ fontSize: 9, color: T.textMuted }}>{expiry}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <code dir="ltr" style={{ flex: 1, fontSize: 10, color: T.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {link}
        </code>
        <button
          onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{
            flexShrink: 0, padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
            background: copied ? T.greenBg : T.accentFaint,
            border: `1px solid ${copied ? T.greenBorder : T.accentBorder}`,
            color: copied ? T.green : T.accentText,
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ تم النسخ' : 'نسخ'}
        </button>
      </div>
    </div>
  );
}

// ─── Action Button ─────────────────────────────────────────────────────────────

function ActionBtn({ children, variant = 'ghost', onClick, loading, disabled }) {
  const variants = {
    accent:  { bg: T.accentFaint,  border: T.accentBorder,  color: T.accentText, hover: 'rgba(212,138,30,0.15)' },
    success: { bg: T.greenBg,      border: T.greenBorder,   color: T.green,      hover: 'rgba(52,211,153,0.14)' },
    danger:  { bg: T.redBg,        border: T.redBorder,     color: T.red,        hover: 'rgba(248,113,113,0.14)' },
    ghost:   { bg: T.surface,      border: T.border,        color: T.textSecondary, hover: T.surfaceHover },
  };
  const v = variants[variant] || variants.ghost;
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 8, fontSize: 11,
        background: hover ? v.hover : v.bg,
        border: `1px solid ${v.border}`,
        color: disabled || loading ? T.textMuted : v.color,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s', whiteSpace: 'nowrap', opacity: disabled ? 0.5 : 1,
      }}
    >
      {loading ? <span style={{ fontSize: 9 }}>◌</span> : null}
      {children}
    </button>
  );
}

// ─── Expandable section toggle ────────────────────────────────────────────────

function SectionToggle({ label, icon, active, hasContent, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '9px 0', fontSize: 10, cursor: 'pointer',
        background: active ? T.accentFaint : 'transparent',
        border: 'none',
        color: active ? T.accentText : hasContent ? 'rgba(52,211,153,0.6)' : T.textMuted,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 10 }}>{icon}</span>
      <span>{label}</span>
      <span style={{ fontSize: 8, opacity: 0.5 }}>{active ? '▲' : '▼'}</span>
    </button>
  );
}

// ─── SubjectPicker ────────────────────────────────────────────────────────────

const SUBJECTS_CATALOG_REF = [];
const SUBJECT_MAP = {};

function SubjectPicker({ current, hint = [], onAssign, loading }) {
  const [open, setOpen] = useState(false);
  const grouped = TRACK_ORDER.map(track => ({
    track, subjects: SUBJECTS_CATALOG_REF.filter(s => s.track === track),
  }));
  const currentSubj = SUBJECT_MAP[current];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 11px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
          background: !current ? T.redBg : T.accentFaint,
          border: `1px solid ${!current ? T.redBorder : T.accentBorder}`,
          color: !current ? T.red : T.accentText,
        }}
      >
        <span style={{ fontSize: 9 }}>📚</span>
        {currentSubj ? currentSubj.nameAr : 'لم تُعيَّن مادة'}
        <span style={{ fontSize: 8, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            minWidth: 220, borderRadius: 14, overflow: 'hidden',
            background: '#100e0a', border: `1px solid ${T.accentBorder}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
          }}>
            {hint.length > 0 && (
              <div style={{ padding: '10px 12px 8px', borderBottom: `1px solid ${T.borderSub}` }}>
                <p style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>اهتمامات المساهم</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {hint.map(sid => {
                    const s = SUBJECTS_CATALOG_REF.find(x => x.id === sid);
                    if (!s) return null;
                    return (
                      <button key={sid} onClick={() => { onAssign(sid); setOpen(false); }}
                        style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, cursor: 'pointer', background: T.accentFaint, color: T.accentText, border: `1px solid ${T.accentBorder}` }}>
                        ✦ {s.nameAr}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div style={{ padding: '6px 0', maxHeight: 260, overflowY: 'auto' }}>
              {grouped.map(({ track, subjects }) => (
                <div key={track}>
                  <p style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted, padding: '8px 12px 4px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{TRACK_LABELS[track]}</p>
                  {subjects.map(s => (
                    <button key={s.id} onClick={() => { onAssign(s.id); setOpen(false); }}
                      style={{
                        width: '100%', textAlign: 'right', padding: '7px 12px', fontSize: 11, cursor: 'pointer',
                        background: s.id === current ? T.accentFaint : 'transparent',
                        color: s.id === current ? T.accentText : T.textSecondary,
                        border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                      {s.id === current && <span style={{ fontSize: 8, color: T.accentText }}>✓</span>}
                      {s.nameAr}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            {current && (
              <div style={{ borderTop: `1px solid ${T.borderSub}` }}>
                <button onClick={() => { onAssign(''); setOpen(false); }}
                  style={{ width: '100%', textAlign: 'right', padding: '8px 12px', fontSize: 10, cursor: 'pointer', background: 'transparent', border: 'none', color: T.red }}>
                  إلغاء تعيين المادة
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── RolePicker ───────────────────────────────────────────────────────────────

function RolePicker({ currentRoleId, roles = [], onAssign }) {
  const [open, setOpen] = useState(false);
  const currentRole = roles.find(r => r._id === currentRoleId);
  if (!roles.length) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 11px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
          background: T.surface, border: `1px solid ${T.border}`,
          color: currentRole ? 'rgba(200,180,140,0.85)' : T.textSecondary,
        }}
      >
        <span style={{ fontSize: 9 }}>◆</span>
        {currentRole ? currentRole.name : 'بدون دور'}
        <span style={{ fontSize: 8, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{
            position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 50,
            minWidth: 180, borderRadius: 14, overflow: 'hidden',
            background: '#100e0a', border: `1px solid ${T.border}`,
            boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
          }}>
            <div style={{ padding: '6px 0' }}>
              {roles.map(r => (
                <button key={r._id} onClick={() => { onAssign(r._id); setOpen(false); }}
                  style={{
                    width: '100%', textAlign: 'right', padding: '8px 12px', fontSize: 11, cursor: 'pointer',
                    background: r._id === currentRoleId ? 'rgba(200,180,140,0.06)' : 'transparent',
                    color: r._id === currentRoleId ? 'rgba(200,180,140,1)' : T.textSecondary,
                    border: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                  {r._id === currentRoleId && <span style={{ fontSize: 8 }}>✓</span>}
                  ◆ {r.name}
                </button>
              ))}
            </div>
            {currentRoleId && (
              <div style={{ borderTop: `1px solid ${T.borderSub}` }}>
                <button onClick={() => { onAssign(null); setOpen(false); }}
                  style={{ width: '100%', textAlign: 'right', padding: '8px 12px', fontSize: 10, cursor: 'pointer', background: 'transparent', border: 'none', color: T.red }}>
                  إزالة الدور
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ─── REQUEST CARD ─────────────────────────────────────────────────────────────

export function RequestCard({ c, actionLoading, onAct, onDelete, onSetPassword }) {
  const [openSection,   setOpenSection]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeLink,    setActiveLink]    = useState(null);
  const [localLoading,  setLocalLoading]  = useState(null);

  const stage         = getPipelineStage(c);
  const hasAnswers    = !!c.interviewAnswers?.submittedAt;
  const hasDynAnswers = !!c.dynamicAnswersSubmittedAt;
  const hasAnyAnswers = hasAnswers || hasDynAnswers;

  const avatarType = c.status === 'rejected' ? 'danger'
    : hasAnyAnswers ? 'success'
    : c.interviewToken ? 'info'
    : 'warning';

  const toggle = s => setOpenSection(v => v === s ? null : s);

  const sendInterviewLink = async () => {
    setLocalLoading('send_interview');
    try {
      const res  = await fetch('/api/admin/contributors', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c._id, action: 'send_interview' }),
      });
      const data = await res.json();
      if (data.interviewLink) setActiveLink({ link: data.interviewLink, label: 'رابط المقابلة', expiry: 'صالح 14 يوماً' });
      onAct(c._id, '_noop');
    } finally { setLocalLoading(null); }
  };

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden',
      background: T.overlay,
      border: `1px solid ${T.border}`,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
    >
      {/* ── Header ── */}
      <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar name={c.name} size={44} type={avatarType} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.textPrimary }}>{c.name}</span>
            {stage && <Badge type={stage.type}>{stage.label}</Badge>}
            {c.status === 'rejected' && <Badge type="danger">مرفوض</Badge>}
            {c.roleId?.name && <Badge type="default">◆ {c.roleId.name}</Badge>}
          </div>
          <p dir="ltr" style={{ fontSize: 11, fontFamily: 'monospace', color: T.textMuted, marginBottom: 6 }}>{c.email}</p>

          {/* Subject interest pills */}
          {c.subjectsOfInterest?.length > 0 && !c.subject && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {c.subjectsOfInterest.map(sid => (
                <Badge key={sid} type="accent">
                  {SUBJECTS_CATALOG_REF.find(s => s.id === sid)?.nameAr || sid}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          <p style={{ fontSize: 11, fontFamily: 'monospace', color: T.textMuted }}>{relativeTime(c.createdAt)}</p>
          <p style={{ fontSize: 10, fontFamily: 'monospace', color: T.textMuted, opacity: 0.6 }}>{shortDate(c.createdAt)}</p>
        </div>
      </div>

      {/* ── Expandable section tabs ── */}
      <div style={{ display: 'flex', borderTop: `1px solid ${T.borderSub}` }}>
        <SectionToggle key="profile"   label="بيانات الطلب"     icon="◉" active={openSection === 'profile'}   hasContent={false}        onClick={() => toggle('profile')} />
        <div style={{ width: 1, background: T.borderSub }} />
        <SectionToggle key="interview" label={hasAnyAnswers ? 'إجابات المقابلة' : 'لم تُكمل المقابلة'} icon={hasAnyAnswers ? '✦' : '◌'} active={openSection === 'interview'} hasContent={hasAnyAnswers} onClick={() => toggle('interview')} />
      </div>

      {/* ── Profile panel ── */}
      {openSection === 'profile' && (
        <div style={{ padding: '16px', background: T.sunken, borderTop: `1px solid ${T.borderSub}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px', marginBottom: 14 }}>
            <Pill label="الخلفية"         value={c.background || c.fieldOfStudy} />
            <Pill label="الفئة العمرية"   value={AGE_LABELS[c.age] || c.age} />
            <Pill label="المدينة"          value={c.town} />
            <Pill label="حاسب / لوحي"     value={c.hasPcOrTablet} />
            <Pill label="إنترنت مستقر"    value={c.hasStableInternet} />
            <Pill label="يستخدم أدوات AI" value={c.usesAiTools} />
          </div>
          {c.aiToolsList?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted, letterSpacing: '0.08em', marginBottom: 6 }}>أدوات الذكاء الاصطناعي</p>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {c.aiToolsList.map(t => (
                  <span key={t} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, fontFamily: 'monospace', background: 'rgba(107,159,212,0.08)', color: '#6b9fd4', border: '1px solid rgba(107,159,212,0.2)' }}>
                    {AI_TOOL_LABELS[t] || t}
                  </span>
                ))}
              </div>
            </div>
          )}
          {c.portfolioUrl && (
            <div>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted, letterSpacing: '0.08em', marginBottom: 4 }}>Portfolio</p>
              <a href={c.portfolioUrl} target="_blank" rel="noreferrer" dir="ltr"
                style={{ fontSize: 11, fontFamily: 'monospace', color: T.accentText, textDecoration: 'none' }}>
                {c.portfolioUrl}
              </a>
            </div>
          )}
        </div>
      )}

      {/* ── Interview panel ── */}
      {openSection === 'interview' && (
        <div style={{ padding: '16px', background: T.sunken, borderTop: `1px solid ${T.borderSub}` }}>
          {!hasAnyAnswers ? (
            <p style={{ fontSize: 12, color: T.textMuted, textAlign: 'center', padding: '12px 0' }}>لم يُكمل المتقدم المقابلة بعد.</p>
          ) : hasDynAnswers ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(c.dynamicAnswers || []).map((a, i) => (
                <div key={i} style={{ paddingRight: 12, borderRight: `2px solid ${T.accentBorder}` }}>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', color: T.textMuted, marginBottom: 4 }}>{a.question}</p>
                  <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{a.answer}</p>
                </div>
              ))}
              {c.dynamicMicroTask && (
                <div style={{ paddingRight: 12, borderRight: `2px solid ${T.accentBorder}` }}>
                  <p style={{ fontSize: 10, fontFamily: 'monospace', color: T.textMuted, marginBottom: 4 }}>المهمة التطبيقية</p>
                  <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{c.dynamicMicroTask}</p>
                </div>
              )}
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted }}>أُرسلت: {shortDate(c.dynamicAnswersSubmittedAt)}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {INTERVIEW_FIELDS.map(({ label, key }) => {
                const val = c.interviewAnswers?.[key];
                if (!val) return null;
                const display = key === 'weeklyCommitment' ? (COMMITMENT_LABELS[val] || val) : val;
                return (
                  <div key={key} style={{ paddingRight: 12, borderRight: `2px solid ${T.accentBorder}` }}>
                    <p style={{ fontSize: 10, fontFamily: 'monospace', color: T.textMuted, marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{display}</p>
                  </div>
                );
              })}
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted }}>أُرسلت: {shortDate(c.interviewAnswers?.submittedAt)}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Inline copy link ── */}
      {activeLink && (
        <div style={{ padding: '0 16px 12px' }}>
          <CopyBox {...activeLink} />
        </div>
      )}

      {/* ── Actions footer ── */}
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        background: T.sunken, borderTop: `1px solid ${T.borderSub}`,
      }}>
        {c.status === 'pending' && (
          <>
            {!hasAnyAnswers && (
              <ActionBtn variant="accent" loading={localLoading === 'send_interview'} onClick={sendInterviewLink}>
                {c.interviewToken ? '↺ تجديد رابط المقابلة' : '↗ إرسال رابط المقابلة'}
              </ActionBtn>
            )}
            {hasAnyAnswers && (
              <>
                <ActionBtn variant="success" onClick={() => onSetPassword(c._id, c.name)}>✓ اعتماد + كلمة مرور</ActionBtn>
                <ActionBtn variant="ghost" loading={actionLoading === c._id + 'approve'} onClick={() => onAct(c._id, 'approve')}>اعتماد فقط</ActionBtn>
              </>
            )}
            <ActionBtn variant="danger" loading={actionLoading === c._id + 'reject'} onClick={() => onAct(c._id, 'reject')}>رفض</ActionBtn>
          </>
        )}
        {c.status === 'rejected' && (
          <ActionBtn variant="ghost" loading={actionLoading === c._id + 'reset_to_pending'} onClick={() => onAct(c._id, 'reset_to_pending')}>↩ إعادة للانتظار</ActionBtn>
        )}

        <div style={{ flex: 1 }} />

        {deleteConfirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: T.red }}>تأكيد الحذف؟</span>
            <ActionBtn variant="danger" loading={actionLoading === c._id + 'delete'} onClick={() => onDelete(c._id)}>حذف</ActionBtn>
            <ActionBtn variant="ghost" onClick={() => setDeleteConfirm(false)}>إلغاء</ActionBtn>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)}
            style={{ fontSize: 10, fontFamily: 'monospace', color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = T.red}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >حذف</button>
        )}
      </div>
    </div>
  );
}

// ─── ACTIVE CARD ──────────────────────────────────────────────────────────────

export function ActiveCard({ c, actionLoading, onAct, onDelete, onSetPassword, roles = [] }) {
  const [activeLink,       setActiveLink]       = useState(null);
  const [deleteConfirm,    setDeleteConfirm]    = useState(false);
  const [localLoading,     setLocalLoading]     = useState(null);
  const [assigningSubject, setAssigningSubject] = useState(false);
  const [assigningRole,    setAssigningRole]    = useState(false);

  const stats        = c.stats || {};
  const hasStats     = (stats.lessonsCreated || 0) + (stats.questionsAdded || 0) + (stats.feedItemsCreated || 0) + (stats.blocksAdded || 0) > 0;
  const subjectMissing = c.onboarded && !c.subject;

  const handleAssignSubject = async subjectId => {
    setAssigningSubject(true);
    try {
      await fetch('/api/admin/contributors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c._id, action: 'assign_subject', subject: subjectId }) });
      onAct(c._id, '_noop');
    } finally { setAssigningSubject(false); }
  };

  const handleAssignRole = async roleId => {
    setAssigningRole(true);
    try {
      await fetch('/api/admin/contributors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c._id, action: 'assign_role_id', roleId }) });
      onAct(c._id, '_noop');
    } finally { setAssigningRole(false); }
  };

  const handleOnboardLink = async () => {
    setLocalLoading('onboard');
    try {
      const res  = await fetch('/api/admin/contributors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c._id, action: 'generate_onboard_link' }) });
      const data = await res.json();
      if (data.onboardingLink) setActiveLink({ link: data.onboardingLink, label: 'رابط التأهيل', expiry: 'صالح 7 أيام' });
      onAct(c._id, '_noop');
    } finally { setLocalLoading(null); }
  };

  return (
    <div style={{
      borderRadius: 16, overflow: 'hidden', background: T.overlay,
      border: `1px solid ${subjectMissing ? T.redBorder : T.border}`,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = subjectMissing ? 'rgba(248,113,113,0.35)' : 'rgba(255,255,255,0.12)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = subjectMissing ? T.redBorder : T.border}
    >
      {/* ── Header ── */}
      <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <Avatar name={c.name} avatarUrl={c.avatarUrl} size={44} type={c.onboarded ? 'success' : 'warning'} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: T.textPrimary }}>{c.name}</span>
            {c.onboarded
              ? <Badge type="success">مكتمل</Badge>
              : <Badge type="warning">ينتظر التأهيل</Badge>
            }
            {c.roleId?.name && <Badge type="default">◆ {c.roleId.name}</Badge>}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <p dir="ltr" style={{ fontSize: 11, fontFamily: 'monospace', color: T.textMuted }}>{c.email}</p>
            {c.username && <p dir="ltr" style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(212,138,30,0.5)' }}>@{c.username}</p>}
          </div>
        </div>

        <div style={{ textAlign: 'left', flexShrink: 0 }}>
          {stats.lastActiveAt ? (
            <>
              <p style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted, marginBottom: 2 }}>آخر نشاط</p>
              <p style={{ fontSize: 11, fontFamily: 'monospace', color: T.textSecondary }}>{relativeTime(stats.lastActiveAt)}</p>
            </>
          ) : (
            <p style={{ fontSize: 10, fontFamily: 'monospace', color: T.textMuted }}>لم ينشط</p>
          )}
          {c.username && (
            <a href={`/contributors/${c.username}`} target="_blank" rel="noreferrer"
              style={{ fontSize: 9, fontFamily: 'monospace', color: T.accentBorder, display: 'block', marginTop: 4, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.color = T.accentText}
              onMouseLeave={e => e.currentTarget.style.color = T.accentBorder}
            >↗ ملفه</a>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      {hasStats && (
        <div style={{ padding: '10px 16px 12px', borderTop: `1px solid ${T.borderSub}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatBadge icon="📖" count={stats.lessonsCreated}   label="درس"   />
          <StatBadge icon="❓" count={stats.questionsAdded}   label="سؤال"  />
          <StatBadge icon="📡" count={stats.feedItemsCreated} label="بطاقة" />
          <StatBadge icon="🌍" count={stats.publishedLessons} label="منشور" />
        </div>
      )}

      {/* ── Missing subject warning ── */}
      {subjectMissing && (
        <div style={{
          margin: '0 16px 10px', padding: '10px 14px', borderRadius: 10,
          background: T.redBg, border: `1px solid ${T.redBorder}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{ fontSize: 12 }}>⚠</span>
          <p style={{ fontSize: 11, color: T.red, flex: 1 }}>
            لم تُعيَّن مادة — لن يتمكن من الوصول للمحرر حتى يتم التعيين
          </p>
          {(c.subjectsOfInterest?.length || 0) > 0 && (
            <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted, flexShrink: 0 }}>
              اختار {c.subjectsOfInterest.length} أثناء التسجيل
            </span>
          )}
        </div>
      )}

      {/* ── Subject + Role assignment ── */}
      <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.borderSub}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <SubjectPicker current={c.subject} hint={c.subjectsOfInterest || []} onAssign={handleAssignSubject} loading={assigningSubject} />
        <RolePicker currentRoleId={c.roleId?._id || c.roleId} roles={roles} onAssign={handleAssignRole} loading={assigningRole} />
        {(assigningSubject || assigningRole) && (
          <span style={{ fontSize: 9, fontFamily: 'monospace', color: T.textMuted }}>جارٍ الحفظ…</span>
        )}
      </div>

      {/* ── Inline copy link ── */}
      {activeLink && (
        <div style={{ padding: '0 16px 12px' }}>
          <CopyBox {...activeLink} />
        </div>
      )}

      {/* ── Actions footer ── */}
      <div style={{
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        background: T.sunken, borderTop: `1px solid ${T.borderSub}`,
      }}>
        <ActionBtn variant="ghost" onClick={() => onSetPassword(c._id, c.name)}>
          {c.passwordHash ? '🔑 تغيير المرور' : '🔑 تعيين مرور'}
        </ActionBtn>
        <ActionBtn variant="ghost" loading={localLoading === 'onboard'} onClick={handleOnboardLink}>
          {c.onboarded ? '↺ تجديد رابط التأهيل' : '↗ رابط التأهيل'}
        </ActionBtn>

        <div style={{ flex: 1 }} />

        {deleteConfirm ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: T.red }}>تأكيد الحذف؟</span>
            <ActionBtn variant="danger" loading={actionLoading === c._id + 'delete'} onClick={() => onDelete(c._id)}>حذف</ActionBtn>
            <ActionBtn variant="ghost" onClick={() => setDeleteConfirm(false)}>إلغاء</ActionBtn>
          </div>
        ) : (
          <button onClick={() => setDeleteConfirm(true)}
            style={{ fontSize: 10, fontFamily: 'monospace', color: T.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }}
            onMouseEnter={e => e.currentTarget.style.color = T.red}
            onMouseLeave={e => e.currentTarget.style.color = T.textMuted}
          >حذف</button>
        )}
      </div>
    </div>
  );
}

// ─── CONTRIBUTORS SECTION (main) ─────────────────────────────────────────────

export function ContributorsSection({ allContributors, onRefresh }) {
  const [tab,           setTab]        = useState('requests');
  const [reqFilter,     setReqFilter]  = useState('all');
  const [search,        setSearch]     = useState('');
  const [actionLoading, setActLoading] = useState(null);
  const [passwordModal, setPwModal]    = useState(null);
  const [roles,         setRoles]      = useState([]);

  useEffect(() => {
    fetch('/api/admin/roles').then(r => r.json()).then(d => { if (d.ok) setRoles(d.roles || []); }).catch(() => {});
  }, []);

  const requests = useMemo(() => allContributors.filter(c => c.status === 'pending' || c.status === 'rejected'), [allContributors]);
  const active   = useMemo(() => allContributors.filter(c => c.status === 'approved'), [allContributors]);

  const reqCounts = useMemo(() => {
    const counts = {};
    REQUEST_FILTERS.forEach(({ key }) => { counts[key] = requests.filter(c => matchRequestFilter(c, key)).length; });
    return counts;
  }, [requests]);

  const displayedRequests = useMemo(() => requests.filter(c => matchRequestFilter(c, reqFilter) && searchMatch(c, search)), [requests, reqFilter, search]);
  const displayedActive   = useMemo(() => active.filter(c => searchMatch(c, search)), [active, search]);

  const act = async (id, action, extra = {}) => {
    if (action === '_noop') { onRefresh(); return; }
    setActLoading(id + action);
    await fetch('/api/admin/contributors', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action, ...extra }) });
    setActLoading(null);
    onRefresh();
  };

  const del = async id => {
    setActLoading(id + 'delete');
    await fetch('/api/admin/contributors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setActLoading(null);
    onRefresh();
  };

  const unapprovedCount = active.filter(c => !c.onboarded).length;

  return (
    <div>
      <SectionHeader title="المساهمون" description="إدارة طلبات الانضمام والحسابات النشطة" />

      <div style={{ padding: '0 32px 40px' }}>

        {/* ── Main tab bar ── */}
        <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 14, marginBottom: 24, width: 'fit-content', background: 'rgba(255,255,255,0.025)', border: `1px solid ${T.border}` }}>
          {[
            { key: 'requests', label: 'طلبات الانضمام', count: requests.length },
            { key: 'active',   label: 'المساهمون النشطون', count: active.length },
          ].map(({ key, label, count }) => {
            const isActive = tab === key;
            return (
              <button key={key} onClick={() => { setTab(key); setSearch(''); setReqFilter('all'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
                  background: isActive ? T.accentFaint : 'transparent',
                  border: `1px solid ${isActive ? T.accentBorder : 'transparent'}`,
                  color: isActive ? T.accentText : T.textSecondary,
                  transition: 'all 0.15s',
                }}
              >
                {label}
                <span style={{
                  fontFamily: 'monospace', fontSize: 11, padding: '1px 6px', borderRadius: 6,
                  background: isActive ? 'rgba(212,138,30,0.18)' : 'rgba(255,255,255,0.05)',
                  color: isActive ? T.accentText : T.textMuted,
                }}>{count}</span>
              </button>
            );
          })}
        </div>

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <>
            {/* Pipeline filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {REQUEST_FILTERS.map(f => {
                const isActive = reqFilter === f.key;
                return (
                  <button key={f.key} onClick={() => setReqFilter(f.key)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                      background: isActive ? T.accentFaint : T.surface,
                      border: `1px solid ${isActive ? T.accentBorder : T.border}`,
                      color: isActive ? T.accentText : T.textSecondary,
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                    <span style={{
                      fontFamily: 'monospace', fontSize: 10, padding: '0 5px', borderRadius: 5,
                      background: isActive ? 'rgba(212,138,30,0.18)' : 'rgba(255,255,255,0.05)',
                      color: isActive ? T.accentText : T.textMuted,
                    }}>{reqCounts[f.key]}</span>
                  </button>
                );
              })}
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو البريد…" />

            {displayedRequests.length === 0
              ? <EmptyState text="لا يوجد طلبات في هذه الفئة" />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {displayedRequests.map(c => (
                    <RequestCard key={c._id} c={c} actionLoading={actionLoading}
                      onAct={act} onDelete={del} onSetPassword={(id, name) => setPwModal({ id, name })} />
                  ))}
                </div>
              )
            }
          </>
        )}

        {/* ── ACTIVE TAB ── */}
        {tab === 'active' && (
          <>
            {/* Onboarding callout */}
            {unapprovedCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12, marginBottom: 16,
                background: T.amberBg, border: `1px solid ${T.amberBorder}`,
              }}>
                <span style={{ fontSize: 14 }}>⚠</span>
                <span style={{ fontSize: 12, color: T.amber }}>
                  {unapprovedCount} مساهم لم يُكمل التأهيل بعد
                </span>
              </div>
            )}

            <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو اسم المستخدم…" />

            {displayedActive.length === 0
              ? <EmptyState text="لا يوجد مساهمون نشطون" />
              : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {displayedActive.map(c => (
                    <ActiveCard key={c._id} c={c} actionLoading={actionLoading}
                      onAct={act} onDelete={del} roles={roles}
                      onSetPassword={(id, name) => setPwModal({ id, name })} />
                  ))}
                </div>
              )
            }
          </>
        )}
      </div>

      {passwordModal && (
        <SetPasswordModal
          name={passwordModal.name}
          onClose={() => setPwModal(null)}
          onSave={async pw => { await act(passwordModal.id, 'set_password', { password: pw }); setPwModal(null); }}
        />
      )}
    </div>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

function SearchBar({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', maxWidth: 300, marginBottom: 16 }}>
      <span style={{
        position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
        fontSize: 13, color: T.textMuted, pointerEvents: 'none',
      }}>⌕</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || 'بحث…'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', paddingRight: 32, paddingLeft: 12, paddingTop: 8, paddingBottom: 8,
          borderRadius: 10, fontSize: 12, outline: 'none',
          background: T.surface,
          border: `1px solid ${focused ? T.accentBorder : T.border}`,
          color: T.textPrimary,
          transition: 'border-color 0.15s',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

// ─── Legacy default export ────────────────────────────────────────────────────

export function ContributorCard(props) {
  return props.c?.status === 'approved'
    ? <ActiveCard {...props} />
    : <RequestCard {...props} />;
}
'use client';
import { useState } from 'react';
import {
  CONTRIBUTOR_STATUS, SUBJECT_MAP, TRACK_CONFIG,
  SUBJECTS_CATALOG_REF, getPipelineStage,
} from '../constants';
import { Btn } from './ui/Btn';

// ─── Subject Picker ────────────────────────────────────────────────────────────
// Inline dropdown that lets an admin assign/clear the canonical subject.
// Grouped by track so it's easy to scan.

const TRACK_ORDER = ['COMMON', 'SCIENCE', 'LITERARY'];
const TRACK_LABELS = { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' };

function SubjectPicker({ current, hint = [], onAssign, loading }) {
  const [open, setOpen] = useState(false);

  const grouped = TRACK_ORDER.map((track) => ({
    track,
    subjects: SUBJECTS_CATALOG_REF.filter((s) => s.track === track),
  }));

  const currentSubj = SUBJECT_MAP[current];
  const isUnset = !current;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-arabic transition-all"
        style={{
          background: isUnset
            ? 'rgba(239,68,68,0.08)'
            : 'rgba(212,137,30,0.08)',
          border: isUnset
            ? '1px solid rgba(239,68,68,0.25)'
            : '1px solid rgba(212,137,30,0.22)',
          color: isUnset ? '#f87171' : 'var(--accent)',
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
            border: '1px solid rgba(212,137,30,0.18)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          }}
        >
          {/* Hint: subjects the contributor expressed interest in */}
          {hint.length > 0 && (
            <div className="px-3 pt-2.5 pb-1.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
                      style={{
                        background: 'rgba(212,137,30,0.1)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(212,137,30,0.3)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.2)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.1)'; }}
                    >
                      ✦ {s.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full catalog grouped by track */}
          <div className="py-1.5 max-h-64 overflow-y-auto">
            {grouped.map(({ track, subjects }) => (
              <div key={track}>
                <p className="text-[9px] font-mono text-ink-800 uppercase tracking-wider px-3 pt-2 pb-1">
                  {TRACK_LABELS[track]}
                </p>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { onAssign(s.id); setOpen(false); }}
                    className="w-full text-right px-3 py-1.5 text-[11px] font-arabic flex items-center gap-2 transition-colors"
                    style={{
                      color: s.id === current ? 'var(--accent)' : 'rgba(255,255,255,0.55)',
                      background: s.id === current ? 'rgba(212,137,30,0.07)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = s.id === current ? 'rgba(212,137,30,0.07)' : 'transparent'; }}
                  >
                    {s.id === current && <span style={{ fontSize: 8, color: 'var(--accent)' }}>✓</span>}
                    {s.nameAr}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Clear option */}
          {current && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => { onAssign(''); setOpen(false); }}
                className="w-full text-right px-3 py-2 text-[10px] font-arabic transition-colors"
                style={{ color: 'rgba(239,68,68,0.5)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
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

// ─── Role Picker ───────────────────────────────────────────────────────────────

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
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: currentRole ? 'rgba(200,180,140,0.8)' : 'rgba(255,255,255,0.3)',
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
            border: '1px solid rgba(255,255,255,0.1)',
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
                  color: r._id === currentRoleId ? 'rgba(200,180,140,1)' : 'rgba(255,255,255,0.5)',
                  background: r._id === currentRoleId ? 'rgba(200,180,140,0.06)' : 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = r._id === currentRoleId ? 'rgba(200,180,140,0.06)' : 'transparent'; }}
              >
                {r._id === currentRoleId && <span style={{ fontSize: 8 }}>✓</span>}
                ◆ {r.name}
              </button>
            ))}
          </div>
          {currentRoleId && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button
                onClick={() => { onAssign(null); setOpen(false); }}
                className="w-full text-right px-3 py-2 text-[10px] font-arabic transition-colors"
                style={{ color: 'rgba(239,68,68,0.45)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
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

// ─── Shared helpers ───────────────────────────────────────────────────────────

const COMMITMENT_LABELS = {
  occasional: 'بشكل متقطع',
  '2-3h':     '٢–٣ ساعات / أسبوع',
  '5h+':      '٥ ساعات أو أكثر',
};

const AI_TOOL_LABELS = {
  chatgpt:    'ChatGPT',
  gemini:     'Gemini',
  notebooklm: 'NotebookLM',
  claude:     'Claude',
  other:      'أدوات أخرى',
};

const AGE_LABELS = {
  'under-18': 'أقل من 18',
  '18-22':    '18 – 22',
  '23-28':    '23 – 28',
  '29-35':    '29 – 35',
  '36+':      '36+',
};

function relativeTime(d) {
  if (!d) return '—';
  const diff  = Date.now() - new Date(d).getTime();
  const days  = Math.floor(diff / 86400000);
  if (days < 1)   return 'اليوم';
  if (days === 1) return 'أمس';
  if (days < 30)  return `منذ ${days} يوماً`;
  const months = Math.floor(days / 30);
  return `منذ ${months} شهر`;
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
      <span
        className="text-[11px] font-arabic"
        style={{ color: isBool ? (value ? '#34d399' : '#f87171') : 'rgba(255,255,255,0.5)' }}
      >
        {display}
      </span>
    </div>
  );
}

function StatBadge({ icon, count, label }) {
  if (!count) return null;
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(212,137,30,0.05)', border: '1px solid rgba(212,137,30,0.1)' }}>
      <span className="text-[11px]">{icon}</span>
      <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--accent)' }}>{count}</span>
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
    <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(212,137,30,0.04)', border: '1px solid rgba(212,137,30,0.18)' }}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-mono" style={{ color: 'var(--accent)' }}>{label}</span>
        {expiry && <span className="text-[9px] text-ink-700 font-arabic">{expiry}</span>}
      </div>
      <div className="flex items-center gap-2">
        <p dir="ltr" className="flex-1 text-[10px] font-mono text-ink-500 break-all truncate select-all">
          {link}
        </p>
        <button
          onClick={copy}
          className="shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-arabic font-semibold transition-all"
          style={{
            background: copied ? 'rgba(52,211,153,0.15)' : 'rgba(212,137,30,0.12)',
            color:      copied ? '#34d399' : 'var(--accent)',
            border:     copied ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(212,137,30,0.25)',
          }}
        >
          {copied ? '✓ تم' : 'نسخ'}
        </button>
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
    : hasAnyAnswers
    ? 'from-green-900 to-green-950'
    : c.interviewToken
    ? 'from-blue-900 to-blue-950'
    : 'from-sand-800 to-ink-900';

  const sendInterviewLink = async () => {
    setLocalLoading('send_interview');
    try {
      const res  = await fetch('/api/admin/contributors', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: c._id, action: 'send_interview' }),
      });
      const data = await res.json();
      if (data.interviewLink) {
        setActiveLink({ link: data.interviewLink, label: 'رابط المقابلة', expiry: 'صالح 14 يوماً' });
      }
      onAct(c._id, '_noop');
    } finally {
      setLocalLoading(null);
    }
  };

  const BORDER = 'rgba(255,255,255,0.05)';

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: '#0d0b08', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}
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
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-arabic ${stage.color}`}>
                {stage.label}
              </span>
            )}
            {c.status === 'rejected' && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-arabic ${st.badge}`}>مرفوض</span>
            )}
            {c.roleId?.name && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-sand-800/40 bg-sand-900/20 text-sand-500 font-arabic">
                ◆ {c.roleId.name}
              </span>
            )}
            {c.subjectsOfInterest?.length > 0 && !c.subject && c.subjectsOfInterest.map((sid) => {
              const name = SUBJECTS_CATALOG_REF.find((s) => s.id === sid)?.nameAr || sid;
              return (
                <span key={sid} className="text-[10px] px-2 py-0.5 rounded-full font-arabic"
                  style={{ background: 'rgba(212,137,30,0.07)', color: 'var(--accent)', border: '1px solid rgba(212,137,30,0.18)' }}>
                  {name}
                </span>
              );
            })}
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
          { key: 'profile',   icon: '◉', label: 'بيانات الطلب',       always: true  },
          { key: 'interview', icon: hasAnyAnswers ? '✦' : '◌',
            label: hasAnyAnswers ? 'إجابات المقابلة' : 'لم تُكمل المقابلة', always: true },
        ].map(({ key, icon, label }, i) => (
          <button
            key={key}
            onClick={() => toggleSection(key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 transition-colors"
            style={{
              borderLeft:  i === 0 ? `1px solid ${BORDER}` : 'none',
              background:  openSection === key ? 'rgba(212,137,30,0.06)' : 'transparent',
              color:       openSection === key
                ? 'var(--accent)'
                : (key === 'interview' && hasAnyAnswers)
                ? 'rgba(52,211,153,0.65)'
                : 'rgba(255,255,255,0.25)',
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
            <InfoPill label="الخلفية"           value={c.background || c.fieldOfStudy} />
            <InfoPill label="الفئة العمرية"     value={AGE_LABELS[c.age] || c.age}    />
            <InfoPill label="المدينة"            value={c.town}                         />
            <InfoPill label="حاسب / لوحي"       value={c.hasPcOrTablet}               />
            <InfoPill label="إنترنت مستقر"      value={c.hasStableInternet}            />
            <InfoPill label="يستخدم أدوات AI"   value={c.usesAiTools}                 />
          </div>
          {c.aiToolsList?.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-mono text-ink-700 uppercase tracking-wider mb-1.5">أدوات الذكاء الاصطناعي</p>
              <div className="flex flex-wrap gap-1">
                {c.aiToolsList.map((t) => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                    style={{ background: 'rgba(107,159,212,0.08)', color: '#6b9fd4', border: '1px solid rgba(107,159,212,0.2)' }}>
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
                className="text-[11px] font-mono hover:underline truncate block max-w-xs" style={{ color: 'var(--accent)' }}>
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
                <div key={i} className="pr-3 border-r-2" style={{ borderColor: 'rgba(212,137,30,0.2)' }}>
                  <p className="text-[10px] font-mono text-ink-600 mb-1 leading-snug">{a.question}</p>
                  <p className="text-xs text-ink-400 leading-loose font-arabic whitespace-pre-wrap">{a.answer}</p>
                </div>
              ))}
              {c.dynamicMicroTask && (
                <div className="pr-3 border-r-2" style={{ borderColor: 'rgba(212,137,30,0.2)' }}>
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
                  <div key={key} className="pr-3 border-r-2" style={{ borderColor: 'rgba(212,137,30,0.2)' }}>
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

export function ActiveCard({ c, actionLoading, onAct, onDelete, onSetPassword, roles = [] }) {
  const [activeLink,       setActiveLink]       = useState(null);
  const [deleteConfirm,    setDeleteConfirm]    = useState(false);
  const [localLoading,     setLocalLoading]     = useState(null);
  const [assigningSubject, setAssigningSubject] = useState(false);
  const [assigningRole,    setAssigningRole]    = useState(false);

  const subj        = SUBJECT_MAP[c.subject];
  const stats       = c.stats || {};
  const hasStats    = (stats.lessonsCreated || 0) + (stats.questionsAdded || 0)
                    + (stats.feedItemsCreated || 0) + (stats.blocksAdded || 0) > 0;
  const BORDER = 'rgba(255,255,255,0.05)';

  const handleAssignSubject = async (subjectId) => {
    setAssigningSubject(true);
    try {
      await fetch('/api/admin/contributors', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: c._id, action: 'assign_subject', subject: subjectId }),
      });
      onAct(c._id, '_noop');
    } finally {
      setAssigningSubject(false);
    }
  };

  const handleAssignRole = async (roleId) => {
    setAssigningRole(true);
    try {
      await fetch('/api/admin/contributors', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: c._id, action: 'assign_role_id', roleId }),
      });
      onAct(c._id, '_noop');
    } finally {
      setAssigningRole(false);
    }
  };

  const handleOnboardLink = async () => {
    setLocalLoading('onboard');
    try {
      const res  = await fetch('/api/admin/contributors', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: c._id, action: 'generate_onboard_link' }),
      });
      const data = await res.json();
      if (data.onboardingLink) {
        setActiveLink({ link: data.onboardingLink, label: 'رابط التأهيل', expiry: 'صالح 7 أيام' });
      }
      onAct(c._id, '_noop');
    } finally {
      setLocalLoading(null);
    }
  };

  const subjectMissing = c.onboarded && !c.subject;

  return (
    <div
      className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{
        background: '#0d0b08',
        border: subjectMissing
          ? '1px solid rgba(239,68,68,0.2)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = subjectMissing
          ? 'rgba(239,68,68,0.35)'
          : 'rgba(255,255,255,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = subjectMissing
          ? 'rgba(239,68,68,0.2)'
          : 'rgba(255,255,255,0.06)';
      }}
    >
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        {c.avatarUrl ? (
          <img src={c.avatarUrl} alt={c.name} className="rounded-full object-cover shrink-0"
            style={{ width: 40, height: 40, border: '1.5px solid rgba(212,137,30,0.35)' }} />
        ) : (
          <Initials name={c.name} size={40} colorClass="from-sand-700 to-sand-900" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
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
          <div className="flex items-center gap-2 flex-wrap">
            <p dir="ltr" className="text-[11px] font-mono text-ink-500">{c.email}</p>
            {c.username && <p dir="ltr" className="text-[11px] font-mono text-sand-700">@{c.username}</p>}
          </div>
        </div>

        <div className="shrink-0 text-left">
          {stats.lastActiveAt ? (
            <>
              <p className="text-[9px] font-mono text-ink-800 mb-0.5">آخر نشاط</p>
              <p className="text-[10px] font-mono text-ink-600">{relativeTime(stats.lastActiveAt)}</p>
            </>
          ) : (
            <p className="text-[10px] font-mono text-ink-800">لم ينشط</p>
          )}
          {c.username && (
            <a href={`/contributors/${c.username}`} target="_blank" rel="noreferrer"
              className="text-[9px] font-mono mt-1 block transition-colors"
              style={{ color: 'rgba(212,137,30,0.45)' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(212,137,30,0.45)'; }}>
              ↗ ملفه
            </a>
          )}
        </div>
      </div>

      {/* Stats row */}
      {hasStats && (
        <div className="px-4 pb-3 flex flex-wrap gap-2" style={{ paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
          <StatBadge icon="📖" count={stats.lessonsCreated}   label="درس"   />
          <StatBadge icon="❓" count={stats.questionsAdded}   label="سؤال"  />
          <StatBadge icon="📡" count={stats.feedItemsCreated} label="بطاقة" />
          <StatBadge icon="🌍" count={stats.publishedLessons} label="منشور" />
        </div>
      )}

      {/* Missing-subject warning banner */}
      {subjectMissing && (
        <div
          className="mx-4 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            marginTop: hasStats ? 0 : 8,
            marginBottom: 4,
          }}
        >
          <span style={{ fontSize: 11 }}>⚠</span>
          <p className="text-[10px] font-arabic flex-1" style={{ color: '#f87171' }}>
            لم تُعيَّن مادة — لن يتمكن من الوصول للمحرر حتى يتم التعيين
          </p>
          {(c.subjectsOfInterest?.length || 0) > 0 && (
            <span className="text-[9px] font-mono text-ink-700 shrink-0">
              اختار {c.subjectsOfInterest.length} أثناء التسجيل
            </span>
          )}
        </div>
      )}

      {/* Subject + Role assignment row */}
      <div
        className="px-4 py-2.5 flex items-center gap-2 flex-wrap"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
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

      {/* Inline link */}
      {activeLink && (
        <div className="px-4 pb-3">
          <InlineLinkBox {...activeLink} />
        </div>
      )}

      {/* Actions footer */}
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
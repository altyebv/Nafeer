'use client';
import { useState, useMemo, useEffect } from 'react';
import { SetPasswordModal } from './modals/SetPasswordModal';
import { SectionHeader, EmptyState } from './ui/shared';
import { ActiveCard, RequestCard } from './ContributorCard';

// ─── Constants ────────────────────────────────────────────────────────────────
const REQUEST_FILTERS = [
  { key: 'all',      label: 'الكل',              icon: '◈' },
  { key: 'new',      label: 'طلبات جديدة',        icon: '◌' },
  { key: 'sent',     label: 'ينتظر المقابلة',     icon: '→' },
  { key: 'answered', label: 'أكمل المقابلة',      icon: '✦' },
  { key: 'rejected', label: 'مرفوضون',            icon: '✕' },
];

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  surface:      'rgba(255,255,255,0.025)',
  surfaceHover: 'rgba(255,255,255,0.04)',
  sunken:       'rgba(0,0,0,0.25)',
  overlay:      '#0e0c09',
  accent:       '#d48a1e',
  accentFaint:  'rgba(212,138,30,0.08)',
  accentBorder: 'rgba(212,138,30,0.22)',
  accentText:   '#e8a93a',
  border:       'rgba(255,255,255,0.07)',
  borderSub:    'rgba(255,255,255,0.04)',
  textPrimary:   'rgba(255,255,255,0.88)',
  textSecondary: 'rgba(255,255,255,0.45)',
  textMuted:     'rgba(255,255,255,0.22)',
  green:        '#34d399',
  greenBg:      'rgba(52,211,153,0.08)',
  greenBorder:  'rgba(52,211,153,0.2)',
  amber:        '#fbbf24',
  amberBg:      'rgba(251,191,36,0.08)',
  amberBorder:  'rgba(251,191,36,0.2)',
  red:          '#f87171',
  redBg:        'rgba(248,113,113,0.08)',
  redBorder:    'rgba(248,113,113,0.2)',
};

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

// ─── SearchBar ────────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', maxWidth: 280, marginBottom: 16 }}>
      <span style={{
        position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)',
        fontSize: 13, color: T.textMuted, pointerEvents: 'none',
      }}>⌕</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'بحث…'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%', paddingRight: 32, paddingLeft: 12, paddingTop: 7, paddingBottom: 7,
          borderRadius: 10, fontSize: 12, outline: 'none', boxSizing: 'border-box',
          background: focused ? 'rgba(212,138,30,0.04)' : T.surface,
          border: `1px solid ${focused ? T.accentBorder : T.border}`,
          color: T.textPrimary,
          transition: 'border-color 0.15s, background 0.15s',
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 10, color: T.textMuted, background: 'none', border: 'none',
            cursor: 'pointer', lineHeight: 1,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.red; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.textMuted; }}
        >✕</button>
      )}
    </div>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────
function TabBtn({ label, count, active, onClick, alert }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 18px', borderRadius: 10, fontSize: 13, cursor: 'pointer',
        background: active ? T.accentFaint : hover ? T.surfaceHover : 'transparent',
        border: `1px solid ${active ? T.accentBorder : 'transparent'}`,
        color: active ? T.accentText : hover ? T.textSecondary : T.textSecondary,
        transition: 'all 0.15s', position: 'relative',
      }}
    >
      {label}
      <span style={{
        fontFamily: 'monospace', fontSize: 11, padding: '1px 7px', borderRadius: 6,
        background: active ? 'rgba(212,138,30,0.18)' : 'rgba(255,255,255,0.06)',
        color: active ? T.accentText : T.textMuted,
        transition: 'all 0.15s',
      }}>{count}</span>
      {alert && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          width: 6, height: 6, borderRadius: '50%',
          background: T.amber,
          boxShadow: `0 0 6px ${T.amber}`,
        }} />
      )}
    </button>
  );
}

// ─── Filter chip ─────────────────────────────────────────────────────────────
function FilterChip({ label, icon, count, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '5px 12px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
        background: active ? T.accentFaint : hover ? T.surfaceHover : T.surface,
        border: `1px solid ${active ? T.accentBorder : T.border}`,
        color: active ? T.accentText : T.textSecondary,
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 9, opacity: active ? 1 : 0.5 }}>{icon}</span>
      {label}
      <span style={{
        fontFamily: 'monospace', fontSize: 10, padding: '0 5px', borderRadius: 5,
        background: active ? 'rgba(212,138,30,0.15)' : 'rgba(255,255,255,0.05)',
        color: active ? T.accentText : T.textMuted,
      }}>{count}</span>
    </button>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────
function Empty({ text }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '48px 0', color: T.textMuted,
    }}>
      <span style={{ fontSize: 28, opacity: 0.15 }}>◈</span>
      <p style={{ fontSize: 12, fontFamily: 'monospace' }}>{text}</p>
    </div>
  );
}

// ─── CONTRIBUTORS SECTION ────────────────────────────────────────────────────
export function ContributorsSection({ allContributors, onRefresh }) {
  const [tab,           setTab]        = useState('requests');
  const [reqFilter,     setReqFilter]  = useState('all');
  const [search,        setSearch]     = useState('');
  const [actionLoading, setActLoading] = useState(null);
  const [passwordModal, setPwModal]    = useState(null);
  const [roles,         setRoles]      = useState([]);

  useEffect(() => {
    fetch('/api/admin/roles')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setRoles(d.roles || []); })
      .catch(() => {});
  }, []);

  const requests = useMemo(() => allContributors.filter((c) => c.status === 'pending' || c.status === 'rejected'), [allContributors]);
  const active   = useMemo(() => allContributors.filter((c) => c.status === 'approved'), [allContributors]);

  const reqCounts = useMemo(() => {
    const counts = {};
    REQUEST_FILTERS.forEach(({ key }) => { counts[key] = requests.filter((c) => matchRequestFilter(c, key)).length; });
    return counts;
  }, [requests]);

  const displayedRequests = useMemo(
    () => requests.filter((c) => matchRequestFilter(c, reqFilter) && searchMatch(c, search)),
    [requests, reqFilter, search]
  );
  const displayedActive = useMemo(
    () => active.filter((c) => searchMatch(c, search)),
    [active, search]
  );

  const act = async (id, action, extra = {}) => {
    if (action === '_noop') { onRefresh(); return; }
    setActLoading(id + action);
    await fetch('/api/admin/contributors', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ id, action, ...extra }),
    });
    setActLoading(null);
    onRefresh();
  };

  const del = async (id) => {
    setActLoading(id + 'delete');
    await fetch('/api/admin/contributors', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body:   JSON.stringify({ id }),
    });
    setActLoading(null);
    onRefresh();
  };

  const unapprovedCount   = active.filter((c) => !c.onboarded).length;
  const noUsernames       = active.filter((c) => c.onboarded && !c.username).length;
  const answeredCount     = reqCounts['answered'] || 0;

  return (
    <div>
      <SectionHeader
        title="المساهمون"
        description="إدارة طلبات الانضمام والحسابات النشطة"
      />

      <div style={{ padding: '0 32px 40px' }}>

        {/* ── Main tab bar ── */}
        <div style={{
          display: 'flex', gap: 2, padding: '3px',
          borderRadius: 13, marginBottom: 24, width: 'fit-content',
          background: 'rgba(255,255,255,0.02)',
          border: `1px solid ${T.border}`,
        }}>
          <TabBtn
            label="طلبات الانضمام"
            count={requests.length}
            active={tab === 'requests'}
            alert={answeredCount > 0}
            onClick={() => { setTab('requests'); setSearch(''); setReqFilter('all'); }}
          />
          <TabBtn
            label="المساهمون النشطون"
            count={active.length}
            active={tab === 'active'}
            alert={unapprovedCount > 0 || noUsernames > 0}
            onClick={() => { setTab('active'); setSearch(''); }}
          />
        </div>

        {/* ─── REQUESTS TAB ─── */}
        {tab === 'requests' && (
          <>
            {/* Pipeline filter chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {REQUEST_FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  icon={f.icon}
                  label={f.label}
                  count={reqCounts[f.key]}
                  active={reqFilter === f.key}
                  onClick={() => setReqFilter(f.key)}
                />
              ))}
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو البريد…" />

            {displayedRequests.length === 0 ? (
              <Empty text="لا يوجد طلبات في هذه الفئة" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayedRequests.map((c) => (
                  <RequestCard
                    key={c._id} c={c} actionLoading={actionLoading}
                    onAct={act} onDelete={del}
                    onSetPassword={(id, name) => setPwModal({ id, name })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── ACTIVE TAB ─── */}
        {tab === 'active' && (
          <>
            {/* Alert banners */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {unapprovedCount > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 12,
                  background: T.amberBg, border: `1px solid ${T.amberBorder}`,
                }}>
                  <span style={{ fontSize: 14 }}>⚠</span>
                  <span style={{ fontSize: 12, color: T.amber }}>
                    {unapprovedCount} مساهم لم يُكمل التأهيل بعد
                  </span>
                </div>
              )}
              {noUsernames > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(212,138,30,0.06)', border: `1px solid ${T.accentBorder}`,
                }}>
                  <span style={{ fontSize: 14 }}>◎</span>
                  <span style={{ fontSize: 12, color: T.accentText }}>
                    {noUsernames} مساهم بدون username — لن تظهر صفحاتهم العامة
                  </span>
                </div>
              )}
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو اسم المستخدم…" />

            {displayedActive.length === 0 ? (
              <Empty text="لا يوجد مساهمون نشطون" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {displayedActive.map((c) => (
                  <ActiveCard
                    key={c._id} c={c} actionLoading={actionLoading}
                    onAct={act} onDelete={del} roles={roles}
                    onSetPassword={(id, name) => setPwModal({ id, name })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {passwordModal && (
        <SetPasswordModal
          name={passwordModal.name}
          onClose={() => setPwModal(null)}
          onSave={async (pw) => {
            await act(passwordModal.id, 'set_password', { password: pw });
            setPwModal(null);
          }}
        />
      )}
    </div>
  );
}
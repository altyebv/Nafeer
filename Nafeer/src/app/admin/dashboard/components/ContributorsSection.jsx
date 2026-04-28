'use client';
import { useState, useMemo } from 'react';
import { RequestCard, ActiveCard } from './ContributorCard';
import { SetPasswordModal }        from './modals/SetPasswordModal';
import { SectionHeader, EmptyState } from './ui/shared';

// ─── Pipeline sub-filters for the Requests tab ────────────────────────────────
const REQUEST_FILTERS = [
  { key: 'all',       label: 'الكل'              },
  { key: 'new',       label: 'طلبات جديدة'       },
  { key: 'sent',      label: 'ينتظر المقابلة'    },
  { key: 'answered',  label: 'أكمل المقابلة'     },
  { key: 'rejected',  label: 'مرفوضون'           },
];

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

// ─── Search filter ────────────────────────────────────────────────────────────
function searchMatch(c, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    c.name?.toLowerCase().includes(lower)  ||
    c.email?.toLowerCase().includes(lower) ||
    c.username?.toLowerCase().includes(lower)
  );
}

// ─── Filter chip ──────────────────────────────────────────────────────────────
function FilterChip({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic transition-all"
      style={{
        background: active ? 'rgba(212,137,30,0.12)' : 'rgba(255,255,255,0.03)',
        border:     active ? '1px solid rgba(212,137,30,0.3)' : '1px solid rgba(255,255,255,0.06)',
        color:      active ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
    >
      {label}
      {count != null && (
        <span
          className="font-mono text-[10px] px-1 rounded"
          style={{
            background: active ? 'rgba(212,137,30,0.2)' : 'rgba(255,255,255,0.06)',
            color:      active ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Main tab bar ─────────────────────────────────────────────────────────────
function TabBar({ tab, onTab, pendingCount, approvedCount }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-6"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
      {[
        { key: 'requests', label: 'طلبات الانضمام', count: pendingCount  },
        { key: 'active',   label: 'المساهمون',       count: approvedCount },
      ].map(({ key, label, count }) => (
        <button
          key={key}
          onClick={() => onTab(key)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-arabic transition-all"
          style={{
            background: tab === key ? 'rgba(212,137,30,0.1)' : 'transparent',
            color:      tab === key ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
            border:     tab === key ? '1px solid rgba(212,137,30,0.22)' : '1px solid transparent',
          }}
        >
          {label}
          <span
            className="font-mono text-[11px] px-1.5 py-0.5 rounded"
            style={{
              background: tab === key ? 'rgba(212,137,30,0.18)' : 'rgba(255,255,255,0.05)',
              color:      tab === key ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
            }}
          >
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Search bar ──────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="relative mb-4" style={{ maxWidth: 300 }}>
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px]"
        style={{ color: 'rgba(255,255,255,0.2)' }}>
        ⌕
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'بحث…'}
        className="w-full pr-8 pl-3 py-2 rounded-xl text-xs font-arabic transition-all"
        style={{
          background:  'rgba(255,255,255,0.03)',
          border:      '1px solid rgba(255,255,255,0.07)',
          color:       'rgba(255,255,255,0.7)',
          outline:     'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(212,137,30,0.3)'; }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ContributorsSection({ allContributors, onRefresh }) {
  const [tab,           setTab]           = useState('requests');
  const [reqFilter,     setReqFilter]     = useState('all');
  const [search,        setSearch]        = useState('');
  const [actionLoading, setActLoading]    = useState(null);
  const [passwordModal, setPwModal]       = useState(null);

  // Split contributors into requests vs active
  const requests = useMemo(() =>
    allContributors.filter((c) => c.status === 'pending' || c.status === 'rejected'),
    [allContributors]
  );
  const active = useMemo(() =>
    allContributors.filter((c) => c.status === 'approved'),
    [allContributors]
  );

  // Request sub-filter counts
  const reqCounts = useMemo(() => {
    const counts = {};
    REQUEST_FILTERS.forEach(({ key }) => {
      counts[key] = requests.filter((c) => matchRequestFilter(c, key)).length;
    });
    return counts;
  }, [requests]);

  // Displayed lists
  const displayedRequests = useMemo(() =>
    requests.filter((c) => matchRequestFilter(c, reqFilter) && searchMatch(c, search)),
    [requests, reqFilter, search]
  );
  const displayedActive = useMemo(() =>
    active.filter((c) => searchMatch(c, search)),
    [active, search]
  );

  const act = async (id, action, extra = {}) => {
    if (action === '_noop') { onRefresh(); return; }
    setActLoading(id + action);
    await fetch('/api/admin/contributors', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, action, ...extra }),
    });
    setActLoading(null);
    onRefresh();
  };

  const del = async (id) => {
    setActLoading(id + 'delete');
    await fetch('/api/admin/contributors', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    });
    setActLoading(null);
    onRefresh();
  };

  return (
    <div>
      <SectionHeader title="المساهمون" description="إدارة طلبات الانضمام والحسابات النشطة" />

      <div className="px-8 pb-10">
        {/* Main tabs */}
        <TabBar
          tab={tab}
          onTab={(t) => { setTab(t); setSearch(''); setReqFilter('all'); }}
          pendingCount={requests.length}
          approvedCount={active.length}
        />

        {/* ── REQUESTS TAB ── */}
        {tab === 'requests' && (
          <>
            {/* Pipeline sub-filters */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {REQUEST_FILTERS.map((f) => (
                <FilterChip
                  key={f.key}
                  label={f.label}
                  count={reqCounts[f.key]}
                  active={reqFilter === f.key}
                  onClick={() => setReqFilter(f.key)}
                />
              ))}
            </div>

            <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو البريد…" />

            {displayedRequests.length === 0 ? (
              <EmptyState text="لا يوجد طلبات في هذه الفئة" />
            ) : (
              <div className="space-y-3">
                {displayedRequests.map((c) => (
                  <RequestCard
                    key={c._id}
                    c={c}
                    actionLoading={actionLoading}
                    onAct={act}
                    onDelete={del}
                    onSetPassword={(id, name) => setPwModal({ id, name })}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── ACTIVE TAB ── */}
        {tab === 'active' && (
          <>
            <SearchBar value={search} onChange={setSearch} placeholder="بحث بالاسم أو اسم المستخدم…" />

            {/* Onboarding-pending callout */}
            {active.filter((c) => !c.onboarded).length > 0 && (
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-xs font-arabic"
                style={{
                  background: 'rgba(251,191,36,0.05)',
                  border:     '1px solid rgba(251,191,36,0.15)',
                  color:      '#fbbf24',
                }}
              >
                <span>⚠</span>
                <span>
                  {active.filter((c) => !c.onboarded).length} مساهم لم يُكمل التأهيل بعد
                </span>
              </div>
            )}

            {displayedActive.length === 0 ? (
              <EmptyState text="لا يوجد مساهمون نشطون" />
            ) : (
              <div className="space-y-3">
                {displayedActive.map((c) => (
                  <ActiveCard
                    key={c._id}
                    c={c}
                    actionLoading={actionLoading}
                    onAct={act}
                    onDelete={del}
                    onSetPassword={(id, name) => setPwModal({ id, name })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Password modal */}
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
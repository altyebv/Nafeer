'use client';
import { useState } from 'react';
import { ContributorCard } from './ContributorCard';
import { SetPasswordModal } from './modals/SetPasswordModal';
import { LinkModal } from './modals/LinkModal';
import { SectionHeader, EmptyState, StatChips } from './ui/shared';

const FILTERS = [
  { key: 'pending',  label: 'في الانتظار' },
  { key: 'approved', label: 'معتمدون'      },
  { key: 'rejected', label: 'مرفوضون'      },
  { key: 'all',      label: 'الكل'         },
];

export function ContributorsSection({ allContributors, onRefresh }) {
  const [filter, setFilter]           = useState('pending');
  const [actionLoading, setActLoading] = useState(null);
  const [passwordModal, setPwModal]   = useState(null); // { id, name }
  const [linkModal, setLinkModal]     = useState(null); // { name, link, label }

  const counts = {
    all:      allContributors.length,
    pending:  allContributors.filter((c) => c.status === 'pending').length,
    approved: allContributors.filter((c) => c.status === 'approved').length,
    rejected: allContributors.filter((c) => c.status === 'rejected').length,
  };

  const displayed = filter === 'all'
    ? allContributors
    : allContributors.filter((c) => c.status === filter);

  const act = async (id, action, extra = {}) => {
    setActLoading(id + action);
    const res  = await fetch('/api/admin/contributors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const data = await res.json();
    setActLoading(null);

    if (data.onboardingLink) {
      const c = allContributors.find((c) => c._id === id);
      setLinkModal({ name: c?.name || '', link: data.onboardingLink, label: 'رابط التأهيل' });
    }
    if (data.interviewLink) {
      const c = allContributors.find((c) => c._id === id);
      setLinkModal({ name: c?.name || '', link: data.interviewLink, label: 'رابط المقابلة' });
    }

    onRefresh();
  };

  const del = async (id) => {
    setActLoading(id + 'delete');
    await fetch('/api/admin/contributors', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setActLoading(null);
    onRefresh();
  };

  return (
    <div>
      <SectionHeader title="المساهمون" description="إدارة طلبات الانضمام والحسابات النشطة">
        <StatChips stats={[
          { label: 'في الانتظار', count: counts.pending,  color: 'text-amber-400' },
          { label: 'معتمدون',     count: counts.approved, color: 'text-green-400' },
          { label: 'مرفوضون',    count: counts.rejected, color: 'text-red-400'   },
          { label: 'الإجمالي',   count: counts.all,      color: 'text-ink-300'   },
        ]} />
      </SectionHeader>

      <div className="px-8 pb-8">
        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-arabic transition-all flex items-center gap-2 ${
                filter === f.key
                  ? 'bg-sand-800/40 text-sand-300 border border-sand-700/50'
                  : 'text-ink-500 hover:text-ink-300 border border-ink-800/60 hover:border-ink-700/60'
              }`}
            >
              {f.label}
              <span className="text-[11px] font-mono text-ink-600">{counts[f.key]}</span>
            </button>
          ))}
        </div>

        {displayed.length === 0 ? (
          <EmptyState text="لا يوجد مساهمون في هذه الفئة" />
        ) : (
          <div className="space-y-3">
            {displayed.map((c) => (
              <ContributorCard
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

      {linkModal && (
        <LinkModal
          name={linkModal.name}
          link={linkModal.link}
          label={linkModal.label}
          onClose={() => setLinkModal(null)}
        />
      )}
    </div>
  );
}
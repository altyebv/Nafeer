'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { SUBJECTS_CATALOG, TRACK_CONFIG } from '@/shared/curriculum';

// ─── Constants ───────────────────────────────────────────────────────────────

const CONTRIBUTOR_STATUS = {
  pending:  { label: 'في الانتظار', dot: 'bg-amber-400',  badge: 'bg-amber-900/30 border-amber-700/40 text-amber-400'  },
  approved: { label: 'معتمد',       dot: 'bg-green-400',  badge: 'bg-green-900/30 border-green-700/40 text-green-400'  },
  rejected: { label: 'مرفوض',       dot: 'bg-red-500',    badge: 'bg-red-900/30 border-red-700/40 text-red-400'       },
};

const REVIEW_TYPE = {
  lesson:   { label: 'درس',   color: 'bg-blue-900/30 border-blue-700/40 text-blue-400',       icon: '◈' },
  concept:  { label: 'مفهوم', color: 'bg-purple-900/30 border-purple-700/40 text-purple-400', icon: '✦' },
  feedItem: { label: 'تغذية', color: 'bg-teal-900/30 border-teal-700/40 text-teal-400',       icon: '▣' },
  question: { label: 'سؤال',  color: 'bg-amber-900/30 border-amber-700/40 text-amber-400',    icon: '◎' },
};

const SUBJECT_MAP = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s]));

const NAV = [
  { id: 'contributors', icon: '◉', label: 'المساهمون',     badgeKey: 'pending'     },
  { id: 'review',       icon: '◎', label: 'طابور المراجعة', badgeKey: 'reviewTotal' },
  { id: 'coverage',     icon: '▦', label: 'خريطة التغطية',  badgeKey: null          },
  { id: 'media',        icon: '⬜', label: 'الوسائط',        badgeKey: null          },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [section, setSection]         = useState('contributors');
  const [allContributors, setAll]     = useState([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [showCreate, setShowCreate]   = useState(false);

  const loadAll = useCallback(async () => {
    const res = await fetch('/api/admin/contributors?status=all');
    if (res.status === 401) { router.push('/admin/login'); return; }
    const data = await res.json();
    setAll(data.contributors || []);
  }, [router]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSignOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  const pendingCount = allContributors.filter((c) => c.status === 'pending').length;
  const badges = { pending: pendingCount, reviewTotal };

  return (
    <div className="min-h-screen bg-ink-950 text-ink-100 flex" dir="rtl">

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside className="fixed right-0 top-0 h-screen w-56 bg-ink-900 border-l border-ink-800/60 flex flex-col z-30">

        {/* Brand */}
        <div className="px-5 pt-6 pb-5 border-b border-ink-800/60">
          <div className="flex items-center gap-2.5">
            <span className="text-xl font-arabic font-bold text-sand-400">نافير</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-sand-900/50 border border-sand-800/60 text-sand-600 tracking-widest">
              ADMIN
            </span>
          </div>
          <p className="text-[11px] text-ink-600 font-mono mt-1">لوحة التحكم</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const count  = item.badgeKey ? badges[item.badgeKey] : null;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-right ${
                  active
                    ? 'bg-sand-900/50 text-sand-300 border border-sand-800/50'
                    : 'text-ink-500 hover:text-ink-200 hover:bg-ink-800/60 border border-transparent'
                }`}
              >
                <span className={`text-base shrink-0 ${active ? 'text-sand-400' : 'text-ink-600'}`}>
                  {item.icon}
                </span>
                <span className="flex-1 font-arabic">{item.label}</span>
                {count != null && count > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-900/50 border border-amber-700/40 text-amber-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Add contributor */}
        <div className="px-3 pb-3 border-t border-ink-800/60 pt-3">
          <button
            onClick={() => setShowCreate(true)}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm bg-sand-700/20 hover:bg-sand-700/40 border border-sand-800/50 text-sand-400 hover:text-sand-300 transition-all"
          >
            <span className="text-base shrink-0 leading-none">+</span>
            <span className="font-arabic">مساهم جديد</span>
          </button>
        </div>

        {/* Logout */}
        <div className="px-3 pb-5 pt-1">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-ink-700 hover:text-red-400 hover:bg-red-950/30 transition-all border border-transparent hover:border-red-900/40"
          >
            <span>↩</span>
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 mr-56 min-h-screen overflow-y-auto">
        {section === 'contributors' && (
          <ContributorsSection
            allContributors={allContributors}
            onRefresh={loadAll}
            onUnauthorized={() => router.push('/admin/login')}
          />
        )}
        {section === 'review' && (
          <ReviewQueueSection
            onTotalChange={setReviewTotal}
            onUnauthorized={() => router.push('/admin/login')}
          />
        )}
        {section === 'coverage' && <CoverageSection />}
        {section === 'media'    && <AdminMediaSection />}
      </main>

      {showCreate && (
        <CreateContributorModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadAll(); }}
        />
      )}
    </div>
  );
}

// ─── ContributorsSection ─────────────────────────────────────────────────────

function ContributorsSection({ allContributors, onRefresh }) {
  const [filter, setFilter]           = useState('pending');
  const [actionLoading, setActLoading] = useState(null);
  const [passwordModal, setPwModal]   = useState(null);
  const [deleteConfirm, setDelConfirm] = useState(null);

  const displayed = filter === 'all'
    ? allContributors
    : allContributors.filter((c) => c.status === filter);

  const counts = {
    all:      allContributors.length,
    pending:  allContributors.filter((c) => c.status === 'pending').length,
    approved: allContributors.filter((c) => c.status === 'approved').length,
    rejected: allContributors.filter((c) => c.status === 'rejected').length,
  };

  const act = async (id, action, extra = {}) => {
    setActLoading(id + action);
    await fetch('/api/admin/contributors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra }),
    });
    setActLoading(null);
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
    setDelConfirm(null);
    onRefresh();
  };

  const FILTERS = [
    { key: 'pending',  label: 'في الانتظار' },
    { key: 'approved', label: 'معتمدون'      },
    { key: 'rejected', label: 'مرفوضون'      },
    { key: 'all',      label: 'الكل'         },
  ];

  return (
    <div>
      <SectionHeader title="المساهمون" description="إدارة طلبات الانضمام والحسابات النشطة">
        {/* Stat chips */}
        <div className="flex items-center gap-2.5 mt-4 flex-wrap">
          {[
            { label: 'في الانتظار', count: counts.pending,  color: 'text-amber-400' },
            { label: 'معتمدون',     count: counts.approved, color: 'text-green-400' },
            { label: 'مرفوضون',    count: counts.rejected, color: 'text-red-400'   },
            { label: 'الإجمالي',   count: counts.all,      color: 'text-ink-300'   },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-800/60 border border-ink-700/40">
              <span className={`text-lg font-bold font-mono leading-none ${s.color}`}>{s.count}</span>
              <span className="text-[11px] text-ink-600 font-arabic">{s.label}</span>
            </div>
          ))}
        </div>
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
            {displayed.map((c) => {
              const st    = CONTRIBUTOR_STATUS[c.status] || CONTRIBUTOR_STATUS.pending;
              const subj  = SUBJECT_MAP[c.subject];
              const isDel = deleteConfirm === c._id;

              return (
                <div key={c._id} className="bg-ink-900/60 rounded-xl border border-ink-800/50 hover:border-ink-700/50 transition-all">
                  <div className="p-5 flex items-start gap-4">

                    {/* Avatar */}
                    <div className="shrink-0 w-10 h-10 rounded-full bg-sand-900/60 border border-sand-800/50 flex items-center justify-center text-sand-400 font-bold font-arabic text-base">
                      {(c.name || '؟').charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                        <h3 className="font-bold text-sand-200 font-arabic">{c.name}</h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-arabic flex items-center gap-1.5 ${st.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                          {st.label}
                        </span>
                        {c.passwordHash && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-green-900/50 bg-green-950/30 text-green-700">
                            مرور ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-ink-500 mb-2.5" dir="ltr">{c.email}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        {subj ? (
                          <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-arabic ${TRACK_CONFIG[subj.track]?.badge || 'border-ink-700 text-ink-400'}`}>
                            {subj.nameAr}
                          </span>
                        ) : c.subject ? (
                          <span className="text-[11px] px-2.5 py-1 rounded-lg border border-ink-700/40 text-ink-500 font-mono">
                            {c.subject}
                          </span>
                        ) : null}
                        {c.background && (
                          <span className="text-[11px] text-ink-600 font-arabic truncate max-w-xs">{c.background}</span>
                        )}
                      </div>
                      {c.motivation && c.status === 'pending' && (
                        <p className="text-[11px] text-ink-700 mt-2.5 italic leading-relaxed font-arabic border-r-2 border-ink-800 pr-2">
                          "{c.motivation}"
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-ink-800 mt-2">
                        {new Date(c.createdAt).toLocaleDateString('en-GB')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 flex flex-col gap-1.5 min-w-[130px]">
                      {c.status === 'pending' && (
                        <>
                          <Btn variant="green" onClick={() => setPwModal({ id: c._id, name: c.name })}>
                            اعتماد + مرور
                          </Btn>
                          <Btn variant="ghost" loading={actionLoading === c._id + 'approve'} onClick={() => act(c._id, 'approve')}>
                            اعتماد فقط
                          </Btn>
                          <Btn variant="red" loading={actionLoading === c._id + 'reject'} onClick={() => act(c._id, 'reject')}>
                            رفض
                          </Btn>
                        </>
                      )}
                      {c.status === 'approved' && (
                        <Btn variant="sand" onClick={() => setPwModal({ id: c._id, name: c.name })}>
                          {c.passwordHash ? 'تغيير المرور' : 'تعيين مرور'}
                        </Btn>
                      )}
                      {c.status === 'rejected' && (
                        <Btn variant="ghost" loading={actionLoading === c._id + 'reset_to_pending'} onClick={() => act(c._id, 'reset_to_pending')}>
                          إعادة للانتظار
                        </Btn>
                      )}

                      {/* Delete — inline confirm */}
                      {isDel ? (
                        <div className="flex flex-col gap-1 mt-1 pt-2 border-t border-ink-800">
                          <p className="text-[10px] text-red-400 font-arabic text-center">تأكيد الحذف؟</p>
                          <Btn variant="red" loading={actionLoading === c._id + 'delete'} onClick={() => del(c._id)}>
                            حذف نهائي
                          </Btn>
                          <Btn variant="ghost" onClick={() => setDelConfirm(null)}>إلغاء</Btn>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDelConfirm(c._id)}
                          className="text-[11px] font-mono text-ink-700 hover:text-red-500 transition-colors mt-1 text-center py-1"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
    </div>
  );
}

// ─── ReviewQueueSection ──────────────────────────────────────────────────────

function ReviewQueueSection({ onTotalChange, onUnauthorized }) {
  const [subjectId, setSubjectId]     = useState('');
  const [queue, setQueue]             = useState({ lessons: [], concepts: [], feedItems: [], questions: [], total: 0 });
  const [loading, setLoading]         = useState(false);
  const [actLoading, setActLoading]   = useState(null);
  const [rejectTarget, setRejectTgt]  = useState(null); // { contentId, type }
  const [rejectNote, setRejectNote]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = subjectId ? `/api/admin/review-queue?subjectId=${subjectId}` : '/api/admin/review-queue';
      const res  = await fetch(url);
      if (res.status === 401) { onUnauthorized(); return; }
      const data = await res.json();
      const q = data.data || { lessons: [], concepts: [], feedItems: [], questions: [], total: 0 };
      setQueue(q);
      onTotalChange(q.total);
    } finally {
      setLoading(false);
    }
  }, [subjectId, onUnauthorized, onTotalChange]);

  useEffect(() => { load(); }, [load]);

  const approve = async (contentId, type) => {
    setActLoading(contentId + 'approve');
    await fetch('/api/admin/review-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, type, status: 'approved' }),
    });
    setActLoading(null);
    load();
  };

  const doReject = async () => {
    if (!rejectTarget) return;
    const { contentId, type } = rejectTarget;
    setActLoading(contentId + 'reject');
    await fetch('/api/admin/review-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contentId, type, status: 'draft', note: rejectNote }),
    });
    setActLoading(null);
    setRejectTgt(null);
    setRejectNote('');
    load();
  };

  // Merge all items sorted by date, then group by type for display
  const byType = {};
  ['lesson', 'concept', 'feedItem', 'question'].forEach((t) => {
    const key = t === 'feedItem' ? 'feedItems' : t + 's';
    byType[t] = (queue[key] || []).map((i) => ({ ...i, type: t }));
  });

  return (
    <div>
      <SectionHeader title="طابور المراجعة" description="المحتوى المُرسل من المساهمين وينتظر الاعتماد">
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-ink-800 border border-ink-700/60 text-sand-200 text-sm font-arabic focus:outline-none focus:border-sand-700 transition-colors"
          >
            <option value="">كل المواد</option>
            {SUBJECTS_CATALOG.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr}</option>
            ))}
          </select>
          {queue.total > 0 && (
            <span className="text-sm font-mono text-amber-400">{queue.total} عنصر</span>
          )}
          <button onClick={load} className="px-3 py-2 rounded-lg border border-ink-700/60 text-ink-500 hover:text-ink-300 hover:border-ink-600 text-xs font-mono transition-all">
            ↺ تحديث
          </button>
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        {loading ? (
          <Spinner />
        ) : queue.total === 0 ? (
          <EmptyState text="لا يوجد محتوى في الطابور" sub="المساهمون يضغطون «إرسال للمراجعة» من محرر الدروس" />
        ) : (
          <div className="space-y-8">
            {['lesson', 'concept', 'feedItem', 'question'].map((type) => {
              const items = byType[type] || [];
              if (items.length === 0) return null;
              const t = REVIEW_TYPE[type];

              return (
                <section key={type}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-[11px] px-2.5 py-1 rounded-lg border font-arabic flex items-center gap-1.5 ${t.color}`}>
                      <span>{t.icon}</span>
                      {t.label}
                    </span>
                    <span className="text-xs font-mono text-ink-600">{items.length}</span>
                    <div className="flex-1 h-px bg-ink-800" />
                  </div>

                  <div className="space-y-2">
                    {items.map((item) => {
                      const subj         = SUBJECT_MAP[item.subjectId];
                      const isRejectOpen = rejectTarget?.contentId === item.contentId;

                      return (
                        <div key={item.contentId} className="bg-ink-900/60 rounded-xl border border-ink-800/50 overflow-hidden">
                          <div className="p-4 flex items-start gap-4">
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {subj && (
                                  <span className={`text-[10px] px-2 py-0.5 rounded border font-arabic ${TRACK_CONFIG[subj.track]?.badge || 'border-ink-700 text-ink-400'}`}>
                                    {subj.nameAr}
                                  </span>
                                )}
                                {item.itemType && (
                                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-ink-700/40 text-ink-600">
                                    {item.itemType}
                                  </span>
                                )}
                                {item.difficulty && (
                                  <span className="text-[10px] font-mono text-ink-700">
                                    {'★'.repeat(item.difficulty)}
                                  </span>
                                )}
                                <span className="text-[10px] font-mono text-ink-700">v{item.version}</span>
                              </div>
                              <p className="text-sm text-sand-300 font-arabic leading-relaxed">{item.label}</p>
                              <p className="text-[10px] font-mono text-ink-700 mt-1.5">
                                {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="shrink-0 flex flex-col gap-1.5 min-w-[100px]">
                              <Btn small variant="green" loading={actLoading === item.contentId + 'approve'} onClick={() => approve(item.contentId, item.type)}>
                                ✓ اعتماد
                              </Btn>
                              <Btn small variant="red" onClick={() => { setRejectTgt({ contentId: item.contentId, type: item.type }); setRejectNote(''); }}>
                                ✗ إرجاع
                              </Btn>
                            </div>
                          </div>

                          {/* Reject note panel */}
                          {isRejectOpen && (
                            <div className="px-4 pb-4 border-t border-ink-800/60 pt-3 bg-red-950/10">
                              <p className="text-xs text-red-400 font-arabic mb-2">ملاحظة الإرجاع (اختياري)</p>
                              <textarea
                                value={rejectNote}
                                onChange={(e) => setRejectNote(e.target.value)}
                                placeholder="سبب الإرجاع..."
                                rows={2}
                                autoFocus
                                className="w-full px-3 py-2 rounded-lg bg-ink-900 border border-red-900/40 text-ink-200 placeholder-ink-700 text-sm font-arabic resize-none focus:outline-none focus:border-red-700/60 transition-colors"
                              />
                              <div className="flex gap-2 mt-2">
                                <Btn small variant="red" loading={actLoading === item.contentId + 'reject'} onClick={doReject}>
                                  تأكيد الإرجاع
                                </Btn>
                                <Btn small variant="ghost" onClick={() => setRejectTgt(null)}>
                                  إلغاء
                                </Btn>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CoverageSection ─────────────────────────────────────────────────────────

function CoverageSection() {
  const [subjectId, setSubjectId] = useState('');
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(false);

  const load = useCallback(async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/coverage/${subjectId}`);
      const json = await res.json();
      setData(json.ok ? json.data : null);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => { load(); }, [load]);

  const LVL = {
    high:   { bar: '#22c55e', text: 'text-green-400',  bg: 'bg-green-900/20'  },
    medium: { bar: '#f59e0b', text: 'text-amber-400',  bg: 'bg-amber-900/20'  },
    low:    { bar: '#f97316', text: 'text-orange-400', bg: 'bg-orange-900/20' },
    none:   { bar: '#374151', text: 'text-ink-600',    bg: 'bg-ink-800/30'   },
  };

  const avgLevel = (avg) => avg >= 80 ? 'high' : avg >= 40 ? 'medium' : avg > 0 ? 'low' : 'none';

  return (
    <div>
      <SectionHeader title="خريطة التغطية" description="نسبة اكتمال المحتوى لكل درس لكل مادة">
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="px-3 py-2 rounded-lg bg-ink-800 border border-ink-700/60 text-sand-200 text-sm font-arabic focus:outline-none focus:border-sand-700 transition-colors"
          >
            <option value="">اختر مادة...</option>
            {SUBJECTS_CATALOG.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr} — {s.id}</option>
            ))}
          </select>
          {subjectId && (
            <button onClick={load} className="px-3 py-2 rounded-lg border border-ink-700/60 text-ink-500 hover:text-ink-300 hover:border-ink-600 text-xs font-mono transition-all">
              ↺ تحديث
            </button>
          )}
        </div>
      </SectionHeader>

      <div className="px-8 pb-8">
        {!subjectId ? (
          <EmptyState text="اختر مادة لعرض خريطة التغطية" />
        ) : loading ? (
          <Spinner />
        ) : !data ? (
          <EmptyState text="لا توجد بيانات — المادة قد لا تكون مُهيَّأة بعد" />
        ) : (
          <div className="space-y-10">
            {(data.units || []).map((unit) => {
              const al = avgLevel(unit.avgCoverage);
              return (
                <div key={unit.unitId}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-sm font-bold text-sand-300 font-arabic">{unit.title}</h3>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg ${LVL[al].bg} ${LVL[al].text}`}>
                      {unit.avgCoverage}%
                    </span>
                    <div className="flex-1 h-px bg-ink-800" />
                    <span className="text-[10px] font-mono text-ink-700">
                      {unit.approvedLessons}/{unit.totalLessons} معتمد
                    </span>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-ink-800/50">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="bg-ink-900/80 border-b border-ink-800/60">
                          <th className="text-right py-2.5 px-4 text-ink-600 font-arabic font-normal">الدرس</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">الحالة</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">أقسام</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">مفاهيم</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">تغذية</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center">أسئلة</th>
                          <th className="py-2.5 px-3 text-ink-600 text-center min-w-[110px]">تغطية</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(unit.lessons || []).map((lesson, i) => {
                          const lvl = lesson.coverageLevel || 'none';
                          const c   = LVL[lvl];
                          return (
                            <tr
                              key={lesson.lessonId}
                              className={`border-b border-ink-900/60 hover:bg-ink-800/20 transition-colors ${i % 2 === 0 ? '' : 'bg-ink-950/20'}`}
                            >
                              <td className="py-3 px-4 font-arabic text-sand-400 text-[12px] max-w-[220px] truncate">
                                {lesson.title}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <StatusChip status={lesson.status} />
                              </td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.sections ?? '—'}</td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.concepts ?? '—'}</td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.feedItems ?? '—'}</td>
                              <td className="py-3 px-3 text-center text-ink-500">{lesson.questions ?? '—'}</td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-1.5 rounded-full bg-ink-800">
                                    <div
                                      className="h-1.5 rounded-full transition-all"
                                      style={{ width: `${lesson.coverageScore}%`, background: c.bar }}
                                    />
                                  </div>
                                  <span className={`text-[11px] font-mono w-7 text-right ${c.text}`}>
                                    {lesson.coverageScore}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function CreateContributorModal({ onClose, onCreated }) {
  const [form, setForm]       = useState({ name: '', email: '', subject: '', background: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const res  = await fetch('/api/admin/contributors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.message || 'حدث خطأ'); return; }
    onCreated();
  };

  const FIELDS = [
    { key: 'name',       label: 'الاسم الكامل',      placeholder: 'أحمد محمد',        required: true  },
    { key: 'email',      label: 'البريد الإلكتروني', placeholder: 'user@example.com', required: true,  dir: 'ltr' },
    { key: 'background', label: 'الخلفية',            placeholder: 'طالب / أستاذ...',  required: false },
    { key: 'password',   label: 'كلمة المرور',        placeholder: '••••••••',         required: true,  type: 'password', dir: 'ltr' },
  ];

  return (
    <Modal title="إضافة مساهم جديد" onClose={onClose}>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/40 text-red-400 text-sm font-arabic">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        {FIELDS.map(({ key, label, placeholder, required, dir, type }) => (
          <div key={key}>
            <label className="block text-xs text-ink-500 mb-1.5 font-mono">{label}</label>
            <input
              type={type || 'text'}
              dir={dir}
              required={required}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700/60 text-sand-100 placeholder-ink-700 focus:outline-none focus:border-sand-700 text-sm transition-all font-arabic"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs text-ink-500 mb-1.5 font-mono">المادة</label>
          <select
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700/60 text-sand-100 focus:outline-none focus:border-sand-700 text-sm transition-all font-arabic"
          >
            <option value="" disabled>اختر المادة...</option>
            {['COMMON', 'SCIENCE', 'LITERARY'].map((track) => (
              <optgroup key={track} label={track === 'COMMON' ? 'مشترك' : track === 'SCIENCE' ? 'علمي' : 'أدبي'}>
                {SUBJECTS_CATALOG.filter((s) => s.track === track).map((s) => (
                  <option key={s.id} value={s.id}>{s.nameAr}{s.isMajor ? ' (تخصص)' : ''}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-sand-600 hover:bg-sand-500 disabled:bg-ink-700 text-ink-950 disabled:text-ink-600 font-bold rounded-xl text-sm transition-all font-arabic"
          >
            {loading ? 'جاري الإضافة...' : 'إضافة'}
          </button>
          <button type="button" onClick={onClose} className="px-5 py-2.5 text-ink-500 hover:text-ink-300 text-sm transition-colors">
            إلغاء
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SetPasswordModal({ name, onClose, onSave }) {
  const [pw, setPw]           = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!pw.trim()) return;
    setLoading(true);
    await onSave(pw);
    setLoading(false);
  };

  return (
    <Modal title="تعيين كلمة مرور" onClose={onClose}>
      <p className="text-xs text-ink-500 font-mono mb-5 -mt-1">{name}</p>
      <input
        type="password"
        dir="ltr"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder="••••••••"
        autoFocus
        className="w-full px-4 py-3 rounded-xl bg-ink-800 border border-ink-700/60 text-sand-100 placeholder-ink-700 focus:outline-none focus:border-sand-700 font-mono mb-4 transition-all"
      />
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={loading || !pw.trim()}
          className="flex-1 py-2.5 bg-green-800 hover:bg-green-700 disabled:bg-ink-700 text-green-200 disabled:text-ink-600 font-bold rounded-xl text-sm transition-all font-arabic"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ وتفعيل'}
        </button>
        <button onClick={onClose} className="px-5 py-2.5 text-ink-500 hover:text-ink-300 text-sm transition-colors">
          إلغاء
        </button>
      </div>
    </Modal>
  );
}

// ─── AdminMediaSection ───────────────────────────────────────────────────────

const ACCEPT     = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
const MAX_BYTES  = 10 * 1024 * 1024;

const MEDIA_TYPE_BADGE = {
  IMAGE: { label: 'صورة',   bg: 'bg-green-900/30',  text: 'text-green-400',  border: 'border-green-800/40'  },
  GIF:   { label: 'متحرك', bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-800/40' },
};

function fmtBytes(b) {
  if (b < 1024)        return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function AdminMediaSection() {
  const [media,         setMedia]         = useState([]);
  const [loadingMedia,  setLoadingMedia]  = useState(true);
  const [mediaError,    setMediaError]    = useState(null);
  const [uploadSubject, setUploadSubject] = useState('common');
  const [uploadAlt,     setUploadAlt]     = useState('');
  const [uploading,     setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [uploadError,   setUploadError]   = useState(null);
  const [dragOver,      setDragOver]      = useState(false);
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterType,    setFilterType]    = useState('all');
  const [search,        setSearch]        = useState('');
  const [copiedId,      setCopiedId]      = useState(null);
  const [delConfirm,    setDelConfirm]    = useState(null);
  const [deleting,      setDeleting]      = useState(null);
  const [lightbox,      setLightbox]      = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoadingMedia(true); setMediaError(null);
    try {
      const params = new URLSearchParams();
      if (filterSubject !== 'all') params.set('subjectId', filterSubject);
      const res  = await fetch(`/api/media?${params}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل التحميل');
      setMedia(json.data || []);
    } catch (e) { setMediaError(e.message); }
    finally { setLoadingMedia(false); }
  }, [filterSubject]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploadError(null); setUploading(true);
    const list = Array.from(files);
    setUploadProgress(list.map((f) => ({ name: f.name, status: 'pending' })));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (file.size > MAX_BYTES) {
        setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'error', msg: 'أكبر من 10 MB' } : x));
        continue;
      }
      setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'uploading' } : x));
      const fd = new FormData();
      fd.append('file', file); fd.append('subjectId', uploadSubject); fd.append('alt', uploadAlt);
      try {
        const res  = await fetch('/api/media', { method: 'POST', body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setMedia((prev) => [json.data, ...prev]);
        setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'done' } : x));
      } catch (e) {
        setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x));
        setUploadError(`فشل رفع "${file.name}": ${e.message}`);
      }
    }
    setUploading(false); setUploadAlt('');
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => setUploadProgress([]), 3000);
  };

  const handleDelete = async (contentId) => {
    setDeleting(contentId); setDelConfirm(null);
    try {
      const res  = await fetch(`/api/media/${contentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setMedia((prev) => prev.filter((m) => m.contentId !== contentId));
      if (lightbox?.contentId === contentId) setLightbox(null);
    } catch (e) { setUploadError(`فشل الحذف: ${e.message}`); }
    finally { setDeleting(null); }
  };

  const copyUrl = (url, contentId) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(contentId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = media.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.filename?.toLowerCase().includes(q) && !m.alt?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const subjectLabel = (id) => {
    if (id === 'common') return 'مشترك';
    return SUBJECTS_CATALOG.find((s) => s.id === id)?.nameAr || id;
  };

  const totalSize = media.reduce((acc, m) => acc + (m.size || 0), 0);

  return (
    <>
      <div>
        <SectionHeader title="مكتبة الوسائط" description="رفع وإدارة الصور والملفات المتحركة لجميع المواد">
          <div className="flex items-center gap-2.5 mt-4 flex-wrap">
            {[
              { label: 'إجمالي الملفات', count: media.length,                    color: 'text-ink-300'    },
              { label: 'صور',            count: media.filter(m=>m.type==='IMAGE').length, color: 'text-green-400'  },
              { label: 'متحركة',         count: media.filter(m=>m.type==='GIF').length,   color: 'text-purple-400' },
              { label: 'الحجم الكلي',    count: fmtBytes(totalSize),             color: 'text-sand-400', mono: true },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ink-800/60 border border-ink-700/40">
                <span className={`font-bold leading-none ${s.mono ? 'font-mono text-sm' : 'text-base font-mono'} ${s.color}`}>{s.count}</span>
                <span className="text-[11px] text-ink-600 font-arabic">{s.label}</span>
              </div>
            ))}
          </div>
        </SectionHeader>

        <div className="px-8 pb-8 space-y-6">

          {/* Upload panel */}
          <div className="rounded-xl border border-ink-800/60 overflow-hidden">
            <div className="px-4 py-3 bg-ink-900/70 border-b border-ink-800/60 flex items-center gap-2">
              <span className="text-sand-500 text-sm">↑</span>
              <span className="text-sm font-semibold text-sand-300 font-arabic">رفع ملفات جديدة</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-ink-500 mb-1.5 font-mono">المادة</label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-ink-900 border border-ink-800/60 rounded-lg text-sand-100 text-sm font-arabic focus:outline-none focus:border-sand-700 transition-colors"
                  >
                    <option value="common">مشترك — متاح لجميع المواد</option>
                    {['COMMON', 'SCIENCE', 'LITERARY'].map((track) => (
                      <optgroup key={track} label={track === 'COMMON' ? 'مشترك' : track === 'SCIENCE' ? 'علمي' : 'أدبي'}>
                        {SUBJECTS_CATALOG.filter((s) => s.track === track).map((s) => (
                          <option key={s.id} value={s.id}>{s.nameAr}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-ink-500 mb-1.5 font-mono">النص البديل (اختياري)</label>
                  <input
                    type="text" value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    placeholder="وصف الصورة للقارئات الصوتية…"
                    className="w-full px-3 py-2 bg-ink-900 border border-ink-800/60 rounded-lg text-sand-100 text-sm font-arabic placeholder-ink-700 focus:outline-none focus:border-sand-700 transition-colors"
                  />
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
                onClick={() => !uploading && fileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2.5 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver   ? 'border-sand-500 bg-sand-900/10' :
                  uploading  ? 'border-ink-700 opacity-60 cursor-not-allowed' :
                               'border-ink-700/60 hover:border-ink-600 hover:bg-ink-900/30'
                }`}
              >
                {uploading ? (
                  <><span className="w-5 h-5 border-2 border-sand-500 border-t-transparent rounded-full animate-spin" /><span className="text-ink-500 text-sm font-arabic">جاري الرفع…</span></>
                ) : (
                  <><span className="text-2xl text-ink-600 select-none">⬆</span><span className="text-sm text-ink-400 font-arabic">اسحب الملفات هنا أو اضغط للتصفح</span><span className="text-xs text-ink-700 font-mono">JPEG · PNG · GIF · WebP · SVG — حتى 10 MB</span></>
                )}
              </div>
              <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

              {uploadProgress.length > 0 && (
                <div className="space-y-1.5">
                  {uploadProgress.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-900/60 border border-ink-800/40">
                      <span className={`text-xs font-mono shrink-0 ${f.status==='done'?'text-green-400':f.status==='error'?'text-red-400':f.status==='uploading'?'text-sand-400 animate-pulse':'text-ink-600'}`}>
                        {f.status==='done'?'✓':f.status==='error'?'✗':f.status==='uploading'?'↑':'·'}
                      </span>
                      <span className="flex-1 text-xs text-ink-400 truncate font-mono">{f.name}</span>
                      {f.msg && <span className="text-[10px] text-red-400 shrink-0">{f.msg}</span>}
                    </div>
                  ))}
                </div>
              )}

              {uploadError && (
                <p className="text-red-400 text-xs bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2 font-arabic">⚠ {uploadError}</p>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-1.5 bg-ink-900 border border-ink-800/60 rounded-lg text-ink-300 text-xs font-arabic focus:outline-none focus:border-sand-700 transition-colors">
              <option value="all">كل المواد</option>
              <option value="common">مشترك</option>
              {SUBJECTS_CATALOG.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
            </select>
            {['all','IMAGE','GIF'].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all font-arabic ${filterType===t?'bg-sand-800/50 text-sand-300 border-sand-700/50':'bg-ink-900 text-ink-500 border-ink-800/60 hover:border-ink-600 hover:text-ink-300'}`}>
                {t==='all'?'الكل':t==='IMAGE'?'صور':'متحركة'}
              </button>
            ))}
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في أسماء الملفات…"
              className="flex-1 min-w-[160px] px-3 py-1.5 bg-ink-900 border border-ink-800/60 rounded-lg text-ink-300 text-xs placeholder-ink-700 focus:outline-none focus:border-sand-700 transition-colors font-arabic" />
            <span className="text-xs text-ink-600 font-mono shrink-0">{filtered.length} ملف</span>
            <button onClick={load} className="px-3 py-1.5 rounded-lg border border-ink-800/60 text-ink-600 hover:text-ink-300 text-xs font-mono transition-all hover:border-ink-600">↺</button>
          </div>

          {mediaError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-900/40 rounded-xl text-red-400 text-sm font-arabic">
              <span>⚠</span><span>{mediaError}</span>
              <button onClick={load} className="mr-auto text-xs underline hover:no-underline">إعادة المحاولة</button>
            </div>
          )}

          {loadingMedia && media.length === 0 && <Spinner />}

          {!loadingMedia && !mediaError && (
            filtered.length === 0 ? (
              <EmptyState text={media.length === 0 ? 'لا توجد ملفات بعد — ارفع أول صورة أعلاه' : 'لا توجد نتائج لهذا البحث'} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((item) => {
                  const badge      = MEDIA_TYPE_BADGE[item.type] || MEDIA_TYPE_BADGE.IMAGE;
                  const isCopied   = copiedId === item.contentId;
                  const isPendDel  = delConfirm === item.contentId;
                  const isDeleting = deleting === item.contentId;
                  return (
                    <div key={item.contentId} className="group relative rounded-xl border border-ink-800/50 overflow-hidden bg-ink-900/40 hover:border-ink-700/60 transition-all">
                      <div className="aspect-square bg-ink-950 overflow-hidden cursor-zoom-in" onClick={() => setLightbox(item)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.alt||item.filename} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                      <div className="px-2 py-2 space-y-1">
                        <p className="text-xs text-ink-300 truncate leading-tight" title={item.filename}>{item.filename}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${badge.bg} ${badge.text} ${badge.border}`}>{badge.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] border bg-ink-800/60 text-ink-500 border-ink-700/40 font-arabic">{subjectLabel(item.subjectId)}</span>
                          <span className="text-[10px] text-ink-700 font-mono mr-auto">{fmtBytes(item.size)}</span>
                        </div>
                        {item.alt && <p className="text-[10px] text-ink-600 truncate font-arabic">{item.alt}</p>}
                      </div>
                      <div className="flex items-center border-t border-ink-800/40">
                        <button onClick={() => copyUrl(item.url, item.contentId)} title="نسخ الرابط"
                          className={`flex-1 flex items-center justify-center py-1.5 text-xs transition-colors ${isCopied?'text-emerald-400':'text-ink-600 hover:text-ink-300'}`}>
                          {isCopied ? '✓' : '⎘'}
                        </button>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" title="فتح"
                          className="flex-1 flex items-center justify-center py-1.5 text-xs text-ink-600 hover:text-ink-300 transition-colors">↗</a>
                        {isPendDel ? (
                          <>
                            <button onClick={() => handleDelete(item.contentId)} disabled={isDeleting}
                              className="flex-1 py-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                              {isDeleting ? '…' : 'تأكيد'}
                            </button>
                            <button onClick={() => setDelConfirm(null)} className="flex-1 py-1.5 text-xs text-ink-600 hover:text-ink-400 transition-colors">إلغاء</button>
                          </>
                        ) : (
                          <button onClick={() => setDelConfirm(item.contentId)} title="حذف"
                            className="flex-1 flex items-center justify-center py-1.5 text-xs text-ink-700 hover:text-red-500 transition-colors">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {lightbox && (
        <MediaLightbox item={lightbox} onClose={() => setLightbox(null)}
          onDelete={handleDelete} onCopy={copyUrl} copiedId={copiedId} subjectLabel={subjectLabel} />
      )}
    </>
  );
}

// ── MediaLightbox ─────────────────────────────────────────────────────────────

function MediaLightbox({ item, onClose, onDelete, onCopy, copiedId, subjectLabel }) {
  const overlayRef = useRef(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const badge = MEDIA_TYPE_BADGE[item.type] || MEDIA_TYPE_BADGE.IMAGE;

  return (
    <div ref={overlayRef} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}>
      <div className="bg-ink-900 border border-ink-700/60 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`text-[11px] px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>{badge.label}</span>
            <span className="text-sm text-sand-300 font-mono truncate">{item.filename}</span>
          </div>
          <button onClick={onClose} className="shrink-0 text-ink-600 hover:text-ink-300 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ink-800 transition-colors">×</button>
        </div>

        <div className="flex-1 overflow-auto bg-ink-950/60 flex items-center justify-center p-4 min-h-[200px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.alt||item.filename} className="max-w-full max-h-[55vh] object-contain rounded-lg" />
        </div>

        <div className="px-5 py-4 border-t border-ink-800/60 space-y-3">
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono text-ink-500">
            <span className="font-arabic">{subjectLabel(item.subjectId)}</span>
            <span>·</span><span>{fmtBytes(item.size)}</span>
            <span>·</span><span dir="ltr">{new Date(item.createdAt).toLocaleDateString('en-GB')}</span>
            {item.alt && <><span>·</span><span className="text-ink-600 font-arabic">{item.alt}</span></>}
          </div>

          <div className="flex items-center gap-2 bg-ink-950/60 rounded-lg px-3 py-2 border border-ink-800/40">
            <span className="flex-1 text-[11px] font-mono text-ink-600 truncate" dir="ltr">{item.url}</span>
            <button onClick={() => onCopy(item.url, item.contentId)}
              className={`shrink-0 text-xs font-mono px-2.5 py-1 rounded-lg border transition-all ${copiedId===item.contentId?'bg-emerald-900/40 border-emerald-800/50 text-emerald-400':'bg-ink-800/60 border-ink-700/50 text-ink-400 hover:text-ink-200'}`}>
              {copiedId===item.contentId ? '✓ تم النسخ' : 'نسخ'}
            </button>
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-xs font-mono px-2.5 py-1 rounded-lg border bg-ink-800/60 border-ink-700/50 text-ink-400 hover:text-ink-200 transition-all">↗</a>
          </div>

          <div className="flex items-center justify-end gap-2">
            {confirmDel ? (
              <><span className="text-xs text-red-400 font-arabic ml-auto">هل أنت متأكد؟</span>
                <Btn small variant="ghost" onClick={() => setConfirmDel(false)}>إلغاء</Btn>
                <Btn small variant="red" onClick={() => onDelete(item.contentId)}>حذف نهائي</Btn>
              </>
            ) : (
              <Btn small variant="red" onClick={() => setConfirmDel(true)}>✕ حذف</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI Primitives ─────────────────────────────────────────────────────

function SectionHeader({ title, description, children }) {
  return (
    <div className="sticky top-0 z-10 bg-ink-950/95 backdrop-blur-sm border-b border-ink-800/60 px-8 pt-8 pb-5 mb-6">
      <h1 className="text-xl font-bold text-sand-300 font-arabic">{title}</h1>
      {description && <p className="text-sm text-ink-600 font-arabic mt-0.5">{description}</p>}
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      <div className="bg-ink-900 border border-ink-700/60 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-sand-300 font-arabic">{title}</h2>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-300 transition-colors text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ink-800">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Small action button — Btn (internal alias for ActionButton)
function Btn({ children, variant = 'ghost', small = false, loading = false, onClick, disabled }) {
  const sz = small ? 'px-3 py-1.5 text-[11px]' : 'px-3 py-2 text-xs';
  const V = {
    green: 'bg-green-900/50 hover:bg-green-800/60 border border-green-700/50 text-green-400',
    red:   'bg-red-900/30 hover:bg-red-900/50 border border-red-800/40 text-red-400',
    sand:  'bg-sand-900/40 hover:bg-sand-800/50 border border-sand-700/40 text-sand-400',
    ghost: 'bg-ink-800/60 hover:bg-ink-700/60 border border-ink-700/50 text-ink-300',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${sz} rounded-lg font-arabic font-semibold transition-all flex items-center justify-center gap-1 disabled:opacity-50 w-full ${V[variant]}`}
    >
      {loading ? <span className="animate-pulse font-mono text-[10px]">···</span> : children}
    </button>
  );
}

function StatusChip({ status }) {
  const CFG = {
    approved: 'bg-green-900/30 text-green-500 border-green-900/40',
    review:   'bg-amber-900/30 text-amber-400 border-amber-900/40',
    draft:    'bg-ink-800/60 text-ink-600 border-ink-700/30',
  };
  const LABELS = { approved: 'معتمد', review: 'للمراجعة', draft: 'مسودة' };
  const s = status || 'draft';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] border font-arabic ${CFG[s] || CFG.draft}`}>
      {LABELS[s] || s}
    </span>
  );
}

function EmptyState({ text, sub }) {
  return (
    <div className="text-center py-24">
      <div className="text-ink-800 text-4xl mb-4 select-none">◌</div>
      <p className="text-ink-600 font-arabic text-sm">{text}</p>
      {sub && <p className="text-ink-700 font-arabic text-xs mt-2">{sub}</p>}
    </div>
  );
}

function Spinner() {
  return (
    <div className="text-center py-24 text-ink-700 font-mono text-xs tracking-widest animate-pulse">
      LOADING...
    </div>
  );
}
'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { ActivityGraph, Badge, Card, EmptyState, Input, PageHeader, Tabs } from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { PIPELINE_STAGES } from '@/lib/adminPipeline';
import { ContributorCard } from '../components/ContributorCard';
import { RolesScreen, TeamsScreen } from '../components/PeoplesSection';
import { SetPasswordModal } from '../components/modals/SetPasswordModal';
import { ScreenBody } from './AdminFrame';

// ─── Contributors ─────────────────────────────────────────────────────────────
// DS5 step 3 (canvas board AdPeople2): the joining pipeline as six stages, the
// people in the chosen one, and a person page beside the list. Roles and
// teams are tabs here because they are attributes of a person.

const STAGE = {
  new:        { label: 'طلب جديد',            hint: 'لم تُرسل مقابلة' },
  invited:    { label: 'المقابلة أُرسلت',      hint: 'بانتظار إجابته' },
  answered:   { label: 'أجاب',                hint: 'بانتظار قرارك' },
  onboarding: { label: 'مقبول، لم يُكمل التهيئة', hint: '' },
  approved:   { label: 'مساهم معتمد',          hint: '' },
  rejected:   { label: 'مرفوض',               hint: '' },
};

const TABS = [
  { id: 'people', label: 'المساهمون' },
  { id: 'roles', label: 'الأدوار' },
  { id: 'teams', label: 'الفرق' },
];

const IDLE_DAYS = 14;
const isIdle = (c) => !c.stats?.lastActiveAt || Date.now() - new Date(c.stats.lastActiveAt) > IDLE_DAYS * 86_400_000;

export function ContributorsScreen({ allContributors, isLoading, onRefresh }) {
  const [tab, setTab] = useState('people');
  const [stage, setStage] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetch('/api/admin/roles').then((r) => r.json()).then((d) => { if (d.ok) setRoles(d.roles || []); }).catch(() => {});
  }, []);
  const roleName = useMemo(() => Object.fromEntries(roles.map((r) => [r._id, r.nameAr || r.name || r.title])), [roles]);

  const counts = useMemo(() => Object.fromEntries(PIPELINE_STAGES.map((s) => [s, allContributors.filter((c) => c.stage === s).length])), [allContributors]);
  // Open on the stage that needs the admin: answers first, then new requests.
  const current = stage || (counts.answered ? 'answered' : counts.new ? 'new' : 'approved');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allContributors
      .filter((c) => c.stage === current)
      .filter((c) => !q || [c.name, c.email, c.username].some((v) => v?.toLowerCase().includes(q)))
      .sort((a, b) => new Date(b.stats?.lastActiveAt || b.createdAt) - new Date(a.stats?.lastActiveAt || a.createdAt));
  }, [allContributors, current, search]);

  const selected = rows.find((c) => c._id === selectedId) || rows[0] || null;

  return (
    <ScreenBody>
      <PageHeader title="المساهمون" description="من الطلب إلى أول درس، في مسار واحد.">
        <Tabs items={TABS} value={tab} onChange={setTab} label="أقسام المساهمين" />
      </PageHeader>

      {tab === 'roles' && <div className="-mx-4 sm:-mx-6 lg:-mx-8"><RolesScreen /></div>}
      {tab === 'teams' && <div className="-mx-4 sm:-mx-6 lg:-mx-8"><TeamsScreen allContributors={allContributors} /></div>}

      {tab === 'people' && (
        <div className="flex flex-col gap-5 mt-5">
          <nav aria-label="مسار الانضمام" className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 rounded-card border border-line bg-raised overflow-hidden">
            {PIPELINE_STAGES.map((s, i) => {
              const active = s === current;
              return (
                <button key={s} type="button" aria-pressed={active} onClick={() => { setStage(s); setSelectedId(null); }}
                  className={`flex flex-col gap-0.5 p-3 text-start border-line border-b xl:border-b-0 [&:not(:last-child)]:border-e transition-colors ${active ? 'bg-selected' : 'hover:bg-hover'}`}>
                  <span className="t-caption text-fg-subtle">{i < 5 ? `المرحلة ${i + 1}` : 'خارج المسار'}</span>
                  <span className={`t-display tabular-nums ${counts[s] ? 'text-fg-strong' : 'text-fg-subtle'}`}>{counts[s]}</span>
                  <span className="t-label text-fg">{STAGE[s].label}</span>
                  {STAGE[s].hint && <span className="t-caption text-fg-subtle">{STAGE[s].hint}</span>}
                </button>
              );
            })}
          </nav>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_460px] items-start">
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-line">
                <h2 className="t-title text-fg-strong">{STAGE[current].label} · {rows.length}</h2>
                <label className="relative">
                  <span className="sr-only">ابحث</span>
                  <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-fg-subtle" aria-hidden="true" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بالاسم أو البريد…" className="h-9 ps-9 w-56" />
                </label>
              </div>
              {isLoading ? <p className="p-4 t-body text-fg-subtle">جارٍ التحميل…</p>
                : rows.length === 0 ? (
                  <EmptyState variant="plain" title="لا أحد في هذه المرحلة الآن"
                    description={current === 'answered' ? 'حين يجيب أحد على المقابلة يظهر هنا مع إجاباته وقرار القبول.' : 'صفحة «انضم» هي المدخل إلى المسار.'} />
                ) : (
                  <ul>
                    {rows.map((c) => (
                      <li key={c._id} className="border-b border-line last:border-b-0">
                        <button type="button" onClick={() => setSelectedId(c._id)} aria-pressed={selected?._id === c._id}
                          className={`w-full grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_110px_120px] gap-3 items-center px-4 py-3 text-start transition-colors ${selected?._id === c._id ? 'bg-selected' : 'hover:bg-hover'}`}>
                          <span className="flex items-center gap-3 min-w-0">
                            <Initial name={c.name} />
                            <span className="flex flex-col min-w-0">
                              <span className="t-ui text-fg-strong truncate">{c.name}</span>
                              <span className={`t-caption truncate ${c.subject ? 'text-fg-subtle' : 'text-warn'}`}>
                                {[SUBJECTS_BY_ID[c.subject]?.nameAr || 'بلا مادة', roleName[c.roleId] || (c.stage === 'approved' ? 'بلا دور' : null)].filter(Boolean).join(' · ')}
                              </span>
                            </span>
                          </span>
                          <span className="hidden sm:block t-caption text-fg-muted">انضم {formatDate(c.createdAt, 'short')}</span>
                          <span className={`t-caption ${c.stage === 'approved' && isIdle(c) ? 'text-warn' : 'text-fg-muted'}`}>
                            {c.stats?.lastActiveAt ? formatRelative(c.stats.lastActiveAt) : c.stage === 'approved' ? 'لم يبدأ' : formatRelative(c.createdAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
            </Card>

            {selected && <PersonPage key={selected._id} c={selected} roleName={roleName[selected.roleId]} roles={roles} onRefresh={onRefresh} />}
          </div>
        </div>
      )}
    </ScreenBody>
  );
}

function Initial({ name, size = 'md' }) {
  const box = size === 'lg' ? 'w-12 h-12 t-title' : 'w-8 h-8 t-label';
  return (
    <span aria-hidden="true" className={`${box} shrink-0 rounded-chip bg-accent-wash text-fg-accent font-bold inline-flex items-center justify-center`}>
      {(name || '؟').trim().charAt(0)}
    </span>
  );
}

// ─── Person page ──────────────────────────────────────────────────────────────
const AUTHORED_LABELS = [
  ['lessonsCreated', 'دروس'], ['blocksAdded', 'عناصر'], ['questionsAdded', 'أسئلة'],
  ['feedItemsCreated', 'بطاقات'], ['examsCreated', 'امتحانات'],
];

function PersonPage({ c, roleName, roles, onRefresh }) {
  const [activity, setActivity] = useState(null);
  const [busy, setBusy] = useState(null);
  const [passwordFor, setPasswordFor] = useState(null);
  const working = c.stage === 'approved' || c.stage === 'onboarding';

  useEffect(() => {
    if (!working) return;
    let live = true;
    fetch(`/api/admin/contributors/${c._id}/activity`).then((r) => r.json())
      .then((j) => { if (live && j.ok) setActivity(j.data); }).catch(() => {});
    return () => { live = false; };
  }, [c._id, working]);

  // The card's actions (approve, interview, links, subject, role, password…)
  // go through the same PATCH the old screen used.
  const act = async (id, action, extra = {}) => {
    if (action === '_noop') { onRefresh(); return; }
    setBusy(id + action);
    const res = await fetch('/api/admin/contributors', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, ...extra }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (data.email && !data.email.ok) {
      alert(`تم تنفيذ الإجراء، لكن تعذّر إرسال البريد إلى ${data.email.to}. أنشئ الرابط من البطاقة وأرسله يدوياً.`);
    }
    onRefresh();
  };
  const del = async (id) => {
    setBusy(id + 'delete');
    await fetch('/api/admin/contributors', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    setBusy(null);
    onRefresh();
  };

  const stats = c.stats || {};
  const hours = stats.totalTimeMs ? Math.round(stats.totalTimeMs / 3_600_000) : 0;
  const facts = [
    ['المادة', SUBJECTS_BY_ID[c.subject]?.nameAr || 'غير محدّدة', !c.subject],
    ['الدور', roleName || 'غير محدّد', !roleName],
    ['انضم', formatDate(c.createdAt, 'medium')],
    ['آخر نشاط', stats.lastActiveAt ? formatRelative(stats.lastActiveAt) : 'أبداً', working && !stats.lastActiveAt],
  ];

  return (
    <Card tone="accent" as="aside" aria-label={`صفحة ${c.name}`} className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Initial name={c.name} size="lg" />
        <div className="flex flex-col min-w-0">
          <strong className="t-title text-fg-strong truncate">{c.name}</strong>
          <span className="t-caption text-fg-muted truncate" dir="ltr">{c.email}</span>
          {c.username && c.stage === 'approved' && (
            <Link href={`/contributor/${c.username}`} target="_blank" className="t-caption text-fg-accent hover:underline">@{c.username}</Link>
          )}
        </div>
        <Badge tone={c.stage === 'approved' ? 'success' : c.stage === 'rejected' ? 'danger' : 'warn'} className="ms-auto">{STAGE[c.stage].label}</Badge>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        {facts.map(([k, v, warn]) => (
          <div key={k} className="flex flex-col gap-0.5 p-2.5 rounded-control bg-sunken">
            <dt className="t-caption text-fg-subtle">{k}</dt>
            <dd className={`t-label ${warn ? 'text-warn' : 'text-fg-strong'}`}>{v}</dd>
          </div>
        ))}
      </dl>

      {working && (
        <>
          <section aria-label="ما أنجزه" className="flex flex-col gap-2">
            <h3 className="t-caption font-semibold text-fg-subtle">ما أنجزه — محسوب من المحتوى الآن</h3>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {AUTHORED_LABELS.map(([k, label]) => (
                <div key={k} className="p-2 rounded-control bg-sunken">
                  <div className="t-title tabular-nums text-fg-strong">{activity ? activity.authored[k] : '·'}</div>
                  <div className="t-caption text-fg-muted">{label}</div>
                </div>
              ))}
            </div>
            <p className="t-caption text-fg-subtle">
              الجهد: {stats.editsMade || 0} تعديل · {stats.commentsPosted || 0} تعليق{hours ? ` · نحو ${hours} ساعة في المحرر` : ''}
            </p>
          </section>
          <ActivityGraph days={activity?.days} summary={activity?.summary} weeks={16} loading={!activity} />
        </>
      )}

      <details className="group rounded-control border border-line">
        <summary className="cursor-pointer px-3 py-2 t-label text-fg-muted hover:text-fg">الإجراءات والتفاصيل الكاملة</summary>
        <div className="p-2 border-t border-line">
          <ContributorCard c={c} actionLoading={busy} onAct={act} onDelete={del} roles={roles}
            onSetPassword={(id, name) => setPasswordFor({ id, name })} />
        </div>
      </details>

      {passwordFor && (
        <SetPasswordModal name={passwordFor.name} onClose={() => setPasswordFor(null)}
          onSave={async (pw) => { await act(passwordFor.id, 'set_password', { password: pw }); setPasswordFor(null); }} />
      )}
    </Card>
  );
}

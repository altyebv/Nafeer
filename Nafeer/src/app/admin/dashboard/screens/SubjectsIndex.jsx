'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Badge, Button, Card, EmptyState, PageHeader, Segmented } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { TRACK_CONFIG } from '@/shared/curriculum';
import { ScreenBody } from './AdminFrame';
import { useOverview, nextStep } from './useOverview';
import { CreateTestSubjectModal } from '../components/modals/CreateTestSubjectModal';

// ─── Subjects ─────────────────────────────────────────────────────────────────
// Every subject in the curriculum with where it stands; each row opens that
// subject's page.

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'nobody', label: 'بلا مساهم' },
  { id: 'active', label: 'لها مساهم' },
  { id: 'problems', label: 'غير مبذورة' },
];

export function SubjectsIndex() {
  const { data, error, reload } = useOverview();
  const [filter, setFilter] = useState('all');
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const subjects = data?.subjects || [];
  const keep = (s) => filter === 'all'
    || (filter === 'nobody' && s.seeded && !s.people)
    || (filter === 'active' && s.people > 0)
    || (filter === 'problems' && !s.seeded);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, subjects.filter((s) => {
    if (f.id === 'all') return true;
    if (f.id === 'nobody') return s.seeded && !s.people;
    if (f.id === 'active') return s.people > 0;
    return !s.seeded;
  }).length])), [subjects]);

  return (
    <ScreenBody>
      <PageHeader
        title="المواد"
        description={data && `${subjects.length} مادة في المنهج · ${data.totals.lessons} درساً مبذوراً · ${data.totals.withContent} فيه محتوى · ${data.totals.approved} معتمد`}
        actions={<Button size="sm" variant="ghost" icon={Plus} onClick={() => setCreating(true)}>مادة تجريبية</Button>}
      />
      {creating && (
        <CreateTestSubjectModal onClose={() => setCreating(false)}
          onCreated={(id) => router.push(`/admin/dashboard/subjects/${id}`)} />
      )}
      {error && !data && <EmptyState title="تعذّر التحميل" description={error} action={<Button onClick={reload}>أعد المحاولة</Button>} />}
      {data && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-4 py-3 border-b border-line">
            <Segmented label="تصفية المواد" size="sm" value={filter} onChange={setFilter}
              items={FILTERS.map((f) => ({ ...f, label: `${f.label} · ${counts[f.id]}` }))} />
          </div>
          <ul>
            {subjects.filter(keep).map((s) => {
              const step = nextStep(s);
              return (
                <li key={s.id} className="border-b border-line last:border-b-0">
                  <Link href={`/admin/dashboard/subjects/${s.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_120px_120px_170px] gap-x-4 gap-y-1 items-center px-4 py-3 hover:bg-hover transition-colors">
                    <span className="flex items-baseline gap-2 min-w-0">
                      <strong className="t-ui text-fg-strong">{s.nameAr}</strong>
                      <span className="t-caption text-fg-subtle">{TRACK_CONFIG[s.track]?.label}</span>
                    </span>
                    <span className="t-label text-fg-muted tabular-nums">
                      {s.seeded ? `${s.withContent} من ${s.lessons.total} درساً` : '—'}
                    </span>
                    <span className={`t-label ${s.people ? 'text-fg' : 'text-warn'}`}>
                      {s.people ? (s.people === 1 ? 'مساهم واحد' : `${s.people} مساهمين`) : 'لا أحد'}
                      {s.lastActiveAt && <span className="block t-caption text-fg-subtle">{formatRelative(s.lastActiveAt)}</span>}
                    </span>
                    <span><Badge tone={step.tone} size="sm">{step.label}</Badge></span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </ScreenBody>
  );
}

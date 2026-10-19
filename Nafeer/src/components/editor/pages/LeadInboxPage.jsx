'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import EditorPage from '@/components/editor/layout/EditorPage';
import { lessonHref } from '@/components/editor/layout/nav';
import { Badge, Button, Card, EmptyState, PageHeader, Tabs, TabPanel } from '@/components/ui';
import { LEAD_REVIEW_ENDPOINTS as API, LessonReview, OtherItems, reviewCall } from '@/components/review/LessonReview';
import { formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── The lead's inbox (docs/team-leads.md, L1) ────────────────────────────────
// What needs the lead in their subject, from one request (/api/lead/inbox):
// lessons waiting for review — reviewed here with the same component the
// owner's dashboard uses — then lessons returned and not yet fixed, and drafts
// nobody has touched for a while. Loaded when the page opens; nothing polls.

const IDB = 'lead-inbox';

export default function LeadInboxPage({ subjectId = null }) {
  const [inbox, setInbox] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('queue');
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
      const json = await reviewCall(`/api/lead/inbox${qs}`, undefined, API.loginHref);
      if (json) { setInbox(json.data); setError(null); }
    } catch (e) { setError(e.message); }
  }, [subjectId]);
  useEffect(() => { load(); }, [load]);

  const lessons = inbox?.queue.lessons || [];
  // Open the oldest lesson the lead can act on; their own stay listed, read-only.
  const current = useMemo(
    () => lessons.find((l) => l.contentId === selected) || lessons.find((l) => !l.mine) || lessons[0] || null,
    [lessons, selected],
  );

  if (error && !inbox) {
    return (
      <EditorPage width="wide" className="font-ui">
        <EmptyState title="تعذّر فتح صندوق المراجعة" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} />
      </EditorPage>
    );
  }
  if (!inbox) {
    return <EditorPage width="wide" className="font-ui"><p className="t-body text-fg-subtle">جارٍ التحميل…</p></EditorPage>;
  }

  const subject = SUBJECTS_BY_ID[inbox.subjectId]?.nameAr || inbox.subjectId;
  const waiting = inbox.queue.total;
  const tabs = [
    { id: 'queue',    label: 'بانتظار المراجعة', count: waiting },
    { id: 'returned', label: 'أُعيدت ولم تُرسل', count: inbox.returned.length },
    { id: 'stale',    label: 'مسودات راكدة',     count: inbox.stale.length },
  ];

  return (
    <EditorPage width="wide" className="flex flex-col gap-5 font-ui">
      <PageHeader
        title="المراجعة"
        description={`${subject} · ${waiting ? `${waiting} بانتظارك، الأقدم أولاً` : 'لا شيء بانتظار المراجعة'}`}
        actions={<Button variant="ghost" size="sm" onClick={load}>تحديث</Button>}
      />

      <Tabs items={tabs} value={tab} onChange={setTab} idBase={IDB} label="صندوق المراجعة" className="border-b border-line" />

      <TabPanel idBase={IDB} id="queue" active={tab === 'queue'}>
        {waiting === 0 && (
          <EmptyState title="لا شيء بانتظارك" description="حين يرسل أحد أعضاء الفريق درساً للمراجعة يظهر هنا، ويُقرأ كاملاً قبل القرار." />
        )}
        {lessons.length > 0 && (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
            <nav aria-label="دروس بانتظار المراجعة" className="flex flex-col gap-2">
              {lessons.map((l) => {
                const on = l.contentId === current?.contentId;
                return (
                  <button key={l.contentId} type="button" aria-pressed={on} onClick={() => setSelected(l.contentId)}
                    className={`flex flex-col gap-1 p-3 rounded-card border text-start transition-colors ${on ? 'bg-selected border-line-accent' : 'bg-raised border-line hover:border-line-strong'}`}>
                    <span className="flex justify-between gap-2 t-caption text-fg-subtle">
                      <span>{l.mine ? 'عملك — يراجعه غيرك' : `أُرسل ${formatRelative(l.submittedAt)}`}</span>
                      {l.round > 1 && <span className="text-warn">الجولة {l.round}</span>}
                    </span>
                    <strong className="t-ui text-fg-strong">{l.label}</strong>
                  </button>
                );
              })}
            </nav>
            {current && (
              <LessonReview key={current.contentId} item={current} endpoints={API}
                onDone={() => { setSelected(null); load(); }} />
            )}
          </div>
        )}
        {inbox.queue.others.length > 0 && <OtherItems items={inbox.queue.others} endpoints={API} onDone={load} />}
      </TabPanel>

      <TabPanel idBase={IDB} id="returned" active={tab === 'returned'}>
        <DraftList
          rows={inbox.returned}
          empty="لا دروس معادة تنتظر أصحابها."
          note={(r) => `الجولة ${r.round} · أُعيد ${formatRelative(r.returnedAt)}`}
        />
      </TabPanel>

      <TabPanel idBase={IDB} id="stale" active={tab === 'stale'}>
        <DraftList
          rows={inbox.stale}
          empty={`لا مسودات بلا تعديل منذ أكثر من ${inbox.staleDays} يوماً.`}
          note={(r) => `آخر تعديل ${formatRelative(r.updatedAt)}`}
        />
      </TabPanel>
    </EditorPage>
  );
}

function DraftList({ rows, empty, note }) {
  if (!rows.length) return <EmptyState title="لا شيء هنا" description={empty} />;
  return (
    <Card padding="none" className="overflow-hidden">
      <ul>
        {rows.map((r, i) => (
          <li key={r.contentId} className={`flex items-center gap-3 flex-wrap px-4 py-3 ${i ? 'border-t border-line' : ''}`}>
            <Link href={lessonHref(r.contentId)} className="read t-ui text-fg-strong hover:text-fg-accent flex-1 min-w-0 truncate">
              {r.title}
            </Link>
            {r.mine ? <Badge size="sm" tone="neutral">عملك</Badge> : r.owner && <span className="t-caption text-fg-muted">{r.owner}</span>}
            <span className="t-caption text-fg-subtle">{note(r)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

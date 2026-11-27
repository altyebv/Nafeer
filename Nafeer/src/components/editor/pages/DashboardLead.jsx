'use client';
import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { arCount, formatRelative } from '@/lib/format';
import { lessonHref, NAV_BY_ID } from '@/components/editor/layout/nav';
import { ContributorContext } from '@/components/editor/layout/ContributorContext';

// ─── Dashboard: the lead's team ───────────────────────────────────────────────
// What needs the lead, from the inbox they would open anyway
// (/api/lead/inbox) — one request, only for a lead who reviews.

const PER_GROUP = 4;
const lessons = (n) => arCount(n, { one: 'درس واحد', two: 'درسان', few: 'دروس', many: 'درساً' });

function Group({ label, tone, rows, href }) {
  if (!rows.length) return null;
  return (
    <li>
      <h3 className={`t-caption font-semibold ${tone}`}>{label} · {rows.length}</h3>
      <ul>
        {rows.slice(0, PER_GROUP).map((r) => (
          <li key={r.key}>
            <Link href={r.href || href} className="flex items-baseline justify-between gap-3 flex-wrap py-2 px-2 -mx-2 rounded-control hover:bg-hover transition-colors">
              <span className="t-ui text-fg-strong min-w-0 truncate">{r.title}</span>
              <span className="t-caption text-fg-muted">{r.detail}</span>
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

export default function LeadBoard() {
  const contributor = useContext(ContributorContext);
  const show = !!(contributor?.lead?.active && contributor.lead.canReview);
  const [inbox, setInbox] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!show) return;
    fetch('/api/lead/inbox')
      .then((r) => r.json())
      .then((j) => (j.ok ? setInbox(j.data) : setFailed(true)))
      .catch(() => setFailed(true));
  }, [show]);

  if (!show) return null;
  const review = NAV_BY_ID.lead.href;
  const waiting = (inbox?.queue.lessons || []).filter((l) => !l.mine).map((l) => ({
    key: l.contentId, title: l.label, detail: `أُرسل ${formatRelative(l.submittedAt)}`,
  }));
  const drafts = (list, detail) => (list || []).filter((d) => !d.mine).map((d) => ({
    key: d.contentId, title: d.title, href: lessonHref(d.contentId),
    detail: [d.owner, detail(d)].filter(Boolean).join(' · '),
  }));
  const stuck = drafts(inbox?.stale, (d) => `آخر كتابة ${formatRelative(d.updatedAt)}`);
  const returned = drafts(inbox?.returned, (d) => `أُعيد ${formatRelative(d.returnedAt)}`);
  const images = (inbox?.imageRequests || []).map((r) => ({
    key: r.blockId, title: r.title, href: lessonHref(r.lessonId), detail: r.note,
  }));
  const total = waiting.length + stuck.length + returned.length + images.length;

  return (
    <section aria-labelledby="lead-title" className="mb-8 p-5 rounded-card bg-raised border border-line">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 id="lead-title" className="t-h3 text-fg-strong">فريقك</h2>
        <Link href={review} className="inline-flex items-center gap-1 t-label text-fg-accent hover:underline">
          صندوق المراجعة <ArrowLeft size={14} aria-hidden="true" />
        </Link>
      </div>
      {failed ? (
        <p className="t-label text-fg-muted">تعذّر تحميل حال الفريق.</p>
      ) : !inbox ? (
        <p className="t-label text-fg-muted">جارٍ التحميل…</p>
      ) : !total ? (
        <p className="t-label text-fg-muted">لا شيء من الفريق ينتظرك.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          <Group label="بانتظار مراجعتك" tone="text-info" rows={waiting} href={review} />
          <Group label="طلبات صور" tone="text-fg-accent" rows={images} href={review} />
          <Group label={`بلا كتابة منذ ${arCount(inbox.staleDays, { one: 'يوم', two: 'يومين', few: 'أيام', many: 'يوماً' })}`} tone="text-warn" rows={stuck} href={review} />
          <Group label="أُعيدت ولم تُرسل" tone="text-fg-muted" rows={returned} href={review} />
        </ul>
      )}
      {inbox && total > 0 && waiting.length > PER_GROUP && (
        <p className="t-caption text-fg-subtle mt-2">و{lessons(waiting.length - PER_GROUP)} آخر في صندوق المراجعة.</p>
      )}
    </section>
  );
}

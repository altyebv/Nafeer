'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Card, ConfirmButton, EmptyState, PageHeader, Segmented, Stat } from '@/components/ui';
import { formatNumber, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { ScreenBody } from './AdminFrame';
import { useOverview } from './useOverview';

// ─── Overview ─────────────────────────────────────────────────────────────────
// DS5 step 2 (canvas board AdOverview): what waits on the admin first, then
// where the content stands per subject, then the week. One request.

const WEEKDAY = new Intl.DateTimeFormat('ar-SD-u-nu-latn', { weekday: 'short', timeZone: 'UTC' });
const dayLabel = (key) => WEEKDAY.format(new Date(`${key}T00:00:00Z`));
const names = (ids) => ids.map((id) => SUBJECTS_BY_ID[id]?.nameAr || id).join('، ');

export function OverviewScreen({ onOpen }) {
  const { data, error, reload } = useOverview();
  const [sort, setSort] = useState('progress');

  const subjects = useMemo(() => {
    const list = [...(data?.subjects || [])];
    if (sort === 'size') list.sort((a, b) => b.lessons.total - a.lessons.total);
    else list.sort((a, b) => (b.withContent - a.withContent) || (b.people - a.people) || (b.lessons.total - a.lessons.total));
    return list;
  }, [data, sort]);

  if (!data) {
    return (
      <ScreenBody>
        <PageHeader title="نظرة عامة" />
        {error ? <EmptyState title="تعذّر التحميل" description={error} action={<Button onClick={reload}>أعد المحاولة</Button>} />
          : <p className="t-body text-fg-subtle">جارٍ التحميل…</p>}
      </ScreenBody>
    );
  }

  const d = data.decisions;
  const waiting = d.review + d.answered + d.newRequests;
  const inbox = [
    { key: 'review', kicker: 'المراجعة', value: d.review, text: 'عناصر بانتظار مراجعتك', go: 'review', link: 'افتح الطابور' },
    { key: 'join', kicker: 'الانضمام', value: d.answered + d.newRequests, text: d.answered ? `${d.answered} أجابوا على المقابلة` : 'طلبات انضمام جديدة', go: 'contributors', link: 'افتح المسار' },
    { key: 'nobody', kicker: 'التغطية', value: d.nobody.length, text: 'مواد بلا أي مساهم', hint: names(d.nobody), tone: 'warn', go: 'contributors', link: 'ادعُ مساهمين' },
    { key: 'unseeded', kicker: 'المنهج', value: d.unseeded.length, text: 'في المنهج وليست في قاعدة البيانات', hint: names(d.unseeded), tone: 'danger', href: d.unseeded[0] && `/admin/dashboard/subjects/${d.unseeded[0]}`, link: 'ابذرها' },
  ];
  const maxDay = Math.max(1, ...data.week.days.map((x) => x.n));

  return (
    <ScreenBody>
      <PageHeader
        title="نظرة عامة"
        description={waiting ? `${waiting} أمر ينتظر قرارك.` : 'لا شيء ينتظر موافقتك الآن.'}
      />

      <section aria-label="ينتظر قرارك" className="grid gap-3 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {inbox.map((i) => {
          const live = i.value > 0;
          const border = live && i.tone === 'warn' ? 'border-warn-border' : live && i.tone === 'danger' ? 'border-danger-border' : 'border-line';
          const color = !live ? 'text-fg-strong' : i.tone === 'warn' ? 'text-warn' : i.tone === 'danger' ? 'text-danger' : 'text-fg-accent';
          const action = live && (i.href
            ? <Link href={i.href} className="t-label text-fg-accent hover:underline">{i.link} ←</Link>
            : <button type="button" onClick={() => onOpen(i.go)} className="self-start t-label text-fg-accent hover:underline">{i.link} ←</button>);
          return (
            <div key={i.key} className={`flex flex-col gap-1 p-4 rounded-card bg-raised border ${border}`}>
              <span className="t-caption text-fg-subtle">{i.kicker}</span>
              <span className={`t-display tabular-nums ${color}`}>{i.value}</span>
              <span className="t-label text-fg">{i.text}</span>
              {live && i.hint && <span className="t-caption text-fg-subtle line-clamp-2">{i.hint}</span>}
              {action || <span className="t-caption text-fg-subtle">لا شيء الآن</span>}
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-5 mt-5 xl:grid-cols-[minmax(0,1fr)_400px] items-start">
        <Card padding="none" className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 flex-wrap px-4 pt-4 pb-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="t-title text-fg-strong">المحتوى حسب المادة</h2>
              <span className="t-caption text-fg-subtle">
                {data.totals.lessons} درساً مبذوراً · {data.totals.withContent} فيه محتوى · {data.totals.review} مراجعة · {data.totals.approved} معتمد
              </span>
            </div>
            <Segmented label="ترتيب" size="sm" value={sort} onChange={setSort}
              items={[{ id: 'progress', label: 'حسب التقدّم' }, { id: 'size', label: 'حسب الحجم' }]} />
          </div>
          <div className="hidden sm:grid grid-cols-[150px_minmax(0,1fr)_100px_110px] gap-3 px-4 py-2 t-caption text-fg-subtle border-t border-line">
            <span>المادة</span><span>الدروس: فيها محتوى من المجموع</span><span>المساهمون</span><span>آخر نشاط</span>
          </div>
          <ul>
            {subjects.map((s) => {
              const pct = s.lessons.total ? Math.max((s.withContent / s.lessons.total) * 100, s.withContent ? 3 : 0) : 0;
              return (
                <li key={s.id} className="border-t border-line">
                  <Link href={`/admin/dashboard/subjects/${s.id}`}
                    className="grid grid-cols-[120px_minmax(0,1fr)] sm:grid-cols-[150px_minmax(0,1fr)_100px_110px] gap-x-3 gap-y-1 items-center px-4 py-2.5 hover:bg-hover transition-colors">
                    <span className="t-label text-fg-strong">{s.nameAr}</span>
                    <span className="flex items-center gap-3">
                      <span className="flex-1 h-2 rounded-chip bg-hover overflow-hidden" aria-hidden="true">
                        <span className="block h-full bg-success" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="w-20 t-caption text-fg-muted tabular-nums">{s.seeded ? `${s.withContent} من ${s.lessons.total}` : 'غير مبذورة'}</span>
                    </span>
                    <span className={`t-caption ${s.people ? 'text-fg' : 'text-warn'}`}>{s.people ? `${s.people} مساهم` : 'لا أحد'}</span>
                    <span className="t-caption text-fg-subtle">{s.lastActiveAt ? formatRelative(s.lastActiveAt) : '—'}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Card>

        <aside className="flex flex-col gap-4">
          <Card title="آخر 7 أيام" actions={<span className="t-caption text-fg-subtle">بتوقيت السودان</span>}>
            <div className="grid grid-cols-7 gap-1.5 items-end h-24" role="img"
              aria-label={data.week.days.map((x) => `${dayLabel(x.key)}: ${x.n}`).join('، ')}>
              {data.week.days.map((x) => (
                <span key={x.key} className="flex flex-col items-center justify-end gap-1 h-full">
                  <span className="t-caption text-fg-muted tabular-nums">{x.n || ''}</span>
                  <span className={`w-full rounded-[4px] ${x.n ? 'bg-accent' : 'bg-hover'}`}
                    style={{ height: x.n ? `${Math.max((x.n / maxDay) * 64, 6)}px` : '3px' }} />
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5 mt-1.5 text-center t-caption text-fg-subtle" aria-hidden="true">
              {data.week.days.map((x) => <span key={x.key}>{dayLabel(x.key)}</span>)}
            </div>
            <p className="mt-3 t-label text-fg-muted">
              {data.week.total
                ? `${data.week.total} عملية · ${data.week.activePeople} مساهم نشط هذا الأسبوع`
                : 'لا نشاط هذا الأسبوع.'}
            </p>
          </Card>

          <Card title="المساهمون" actions={<button type="button" onClick={() => onOpen('contributors')} className="t-label text-fg-accent hover:underline">المسار كاملاً ←</button>}>
            <div className="grid grid-cols-3 gap-2">
              <Stat value={data.people.approved} label="معتمدون" />
              <Stat value={data.week.activePeople} label="نشطون هذا الأسبوع" />
              <Stat value={data.people.pipeline.new + data.people.pipeline.invited + data.people.pipeline.answered} label="في الطريق" />
            </div>
          </Card>

          {data.quiet?.length > 0 && <QuietCard people={data.quiet} />}

          <Card title="الموقع والبريد">
            <dl className="flex flex-col gap-2 t-label">
              <Row k="زيارات الصفحة الرئيسية" v={formatNumber(data.site.visits)} />
              <Row k="نقرات «ادعم»" v={formatNumber(data.site.support)} />
              <Row k="رسائل بريد أُرسلت" v={`${formatNumber(data.mail.sent)}${data.mail.failed ? ` · ${data.mail.failed} فشلت` : ''}`} warn={data.mail.failed > 0} />
            </dl>
          </Card>
        </aside>
      </div>
    </ScreenBody>
  );
}

// ─── Gone quiet (UX queue 5) ──────────────────────────────────────────────────
// Working contributors with nothing in 14 days, oldest silence first, each
// with a one-click reminder: an email and an announcement on their dashboard
// (POST /api/admin/comms/send, scope "person"). The wording is fixed and kind.
const NUDGE_TITLE = 'نفتقدك في نفير';
const nudgeBody = (name, subject) =>
  `مرحباً ${name.split(' ')[0]}، لم نرك منذ مدة${subject ? ` في ${subject}` : ''}. إن كان وقتك ضيقاً فلا بأس — حتى درس واحد في الشهر يصنع فرقاً لطالب. وإن كان شيء يعيقك في المحرر، ردّ على هذه الرسالة وسنساعدك.`;

function QuietCard({ people }) {
  const [sent, setSent] = useState({});
  const nudge = async (p) => {
    setSent((s) => ({ ...s, [p.id]: 'sending' }));
    const subject = SUBJECTS_BY_ID[p.subject]?.nameAr;
    const res = await fetch('/api/admin/comms/send', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: NUDGE_TITLE, body: nudgeBody(p.name, subject), scope: { kind: 'person', value: p.id }, channels: { board: true, mail: true } }),
    }).catch(() => null);
    setSent((s) => ({ ...s, [p.id]: res?.ok ? 'sent' : 'failed' }));
  };
  return (
    <Card title="هدأوا مؤخراً" actions={<span className="t-caption text-fg-subtle">بلا نشاط منذ 14 يوماً</span>}>
      <ul className="flex flex-col gap-3">
        {people.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3">
            <span className="flex flex-col min-w-0">
              <span className="t-label text-fg-strong truncate">{p.name}</span>
              <span className="t-caption text-fg-subtle">
                {SUBJECTS_BY_ID[p.subject]?.nameAr || 'بلا مادة'} · {p.lastActiveAt ? `آخر نشاط ${formatRelative(p.lastActiveAt)}` : `لم يبدأ منذ انضمامه ${formatRelative(p.joinedAt)}`}
              </span>
            </span>
            {sent[p.id] === 'sent' ? <span className="t-caption text-success shrink-0">أُرسل التذكير</span>
              : sent[p.id] === 'failed' ? <span className="t-caption text-danger shrink-0">تعذّر الإرسال</span>
              : (
                <ConfirmButton variant="secondary" tone="accent" size="sm" align="end" confirmLabel="أرسل"
                  title={`تذكير ${p.name.split(' ')[0]}؟`} description={nudgeBody(p.name, SUBJECTS_BY_ID[p.subject]?.nameAr)}
                  disabled={sent[p.id] === 'sending'} onConfirm={() => nudge(p)}>
                  ذكّره
                </ConfirmButton>
              )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Row({ k, v, warn }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-fg-muted">{k}</dt>
      <dd className={`tabular-nums ${warn ? 'text-warn' : 'text-fg-strong'}`}>{v}</dd>
    </div>
  );
}

'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, EmptyState, PageHeader, Select } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID, SUBJECTS_CATALOG } from '@/shared/curriculum';
import { ADMIN_REVIEW_ENDPOINTS as API, LessonReview, OtherItems, reviewCall } from '@/components/review/LessonReview';
import { ScreenBody } from './AdminFrame';

// ─── Review ───────────────────────────────────────────────────────────────────
// DS2 step 3 (canvas board AdReview): the queue oldest first, every subject;
// the lesson itself is reviewed in components/review/LessonReview, which the
// lead's inbox (/editor/lead) shares.
//
// Concepts, feed cards and questions sent on their own keep the simple
// approve / return-with-a-note row below the lessons.

const call = (url, options) => reviewCall(url, options, API.loginHref);

export function ReviewScreen({ onTotalChange }) {
  const [subjectId, setSubjectId] = useState('');
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const json = await call(API.list(subjectId));
      if (!json) return;
      setQueue(json.data); setError(null);
      onTotalChange?.(json.data.total);
    } catch (e) { setError(e.message); }
  }, [subjectId, onTotalChange]);
  useEffect(() => { load(); }, [load]);

  const lessons = useMemo(() => [...(queue?.lessons || [])].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)), [queue]);
  const others = useMemo(() => queue ? [
    ...queue.concepts.map((i) => ({ ...i, type: 'concept' })),
    ...queue.feedItems.map((i) => ({ ...i, type: 'feedItem' })),
    ...queue.questions.map((i) => ({ ...i, type: 'question' })),
  ] : [], [queue]);
  const current = lessons.find((l) => l.contentId === selected) || lessons[0] || null;

  return (
    <ScreenBody>
      <PageHeader
        title="المراجعة"
        description={queue && (queue.total ? `${queue.total} عنصر بانتظارك · الأقدم أولاً` : 'لا شيء بانتظار المراجعة.')}
        actions={
          <Select aria-label="المادة" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-44">
            <option value="">كل المواد</option>
            {SUBJECTS_CATALOG.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
          </Select>
        }
      />

      {error && !queue && <EmptyState title="تعذّر تحميل الطابور" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} />}
      {queue && queue.total === 0 && (
        <EmptyState title="الطابور فارغ" description="حين يرسل مساهم درساً للمراجعة يظهر هنا، ويُقرأ كاملاً قبل القرار." />
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
                    <span>{SUBJECTS_BY_ID[l.subjectId]?.nameAr || l.subjectId}</span>
                    <span>{formatRelative(l.submittedAt)}</span>
                  </span>
                  <strong className="t-ui text-fg-strong">{l.label}</strong>
                  {l.round > 1 && <span className="t-caption text-warn">الجولة {l.round} — أُعيد من قبل</span>}
                </button>
              );
            })}
          </nav>
          {current && <LessonReview key={current.contentId} item={current} onDone={() => { setSelected(null); load(); }} />}
        </div>
      )}

      {others.length > 0 && <OtherItems items={others} onDone={load} />}
    </ScreenBody>
  );
}

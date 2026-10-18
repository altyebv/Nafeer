'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { SUBJECTS_BY_ID, TRACK_CONFIG } from '@/shared/curriculum';
import { lessonReadiness, isAutoTitle, recentLessons } from '@/lib/lessonReadiness';
import { formatRelative } from '@/lib/format';
import { lessonHref } from '@/components/editor/layout/nav';
import { EmptyState, Input, Segmented, cx } from '@/components/ui';
import UnitCard from '@/components/editor/units/UnitCard';
import LessonItem from '@/components/editor/lesson/LessonItem';
import EditorPage from '@/components/editor/layout/EditorPage';

// ─── Lessons ──────────────────────────────────────────────────────────────────
// DS2 step 6 (canvas board EdLessonsList). Where the subject stands in words,
// a «تابع من حيث توقفت» strip (lessons opened in this browser — no request),
// search and status filters, and full-width rows with readiness marks.
// Everything is computed from the stores the editor already loaded; the old
// per-page coverage request is gone.

const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'started', label: 'فيه عمل' },
  { id: 'returned', label: 'أُعيد' },
  { id: 'review', label: 'بانتظار المراجعة' },
  { id: 'approved', label: 'معتمد' },
  { id: 'untitled', label: 'عنوان تلقائي' },
];

export default function LessonsPage() {
  const { subject, units, lessons, sections, blocks, questions, feedItems } = useDataStore(
    useShallow((s) => ({ subject: s.subject, units: s.units, lessons: s.lessons, sections: s.sections, blocks: s.blocks, questions: s.questions, feedItems: s.feedItems })),
  );
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [recent, setRecent] = useState([]);
  useEffect(() => { setRecent(recentLessons()); }, []);

  const sortedUnits = useMemo(() => [...units].sort((a, b) => a.order - b.order), [units]);
  const unitPos = useMemo(() => Object.fromEntries(sortedUnits.map((u, i) => [u.id, i + 1])), [sortedUnits]);
  const ordered = useMemo(() => sortedUnits.flatMap((u) => lessons.filter((l) => l.unitId === u.id).sort((a, b) => a.order - b.order)), [sortedUnits, lessons]);

  const info = useMemo(() => {
    const stores = { sections, blocks, questions, feedItems };
    return Object.fromEntries(ordered.map((l) => [l.id, lessonReadiness(l, stores)]));
  }, [ordered, sections, blocks, questions, feedItems]);

  // One predicate per filter, used for both the list and the counts.
  const is = (id, l) => {
    const r = info[l.id];
    switch (id) {
      case 'started': return r.counts.sections > 0;
      case 'returned': return !!l.reviewState?.returned;
      case 'review': return l.atlasStatus === 'review';
      case 'approved': return l.atlasStatus === 'approved';
      case 'untitled': return isAutoTitle(l.title);
      default: return true;
    }
  };
  const q = query.trim();
  const unitTitle = (l) => sortedUnits.find((u) => u.id === l.unitId)?.title || '';
  const results = ordered.filter((l) => is(filter, l) && (!q || l.title?.includes(q) || unitTitle(l).includes(q)));
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, ordered.filter((l) => is(f.id, l)).length]));

  if (!subject) {
    return <div className="py-40 text-center t-body text-fg-subtle">جارٍ التحميل…</div>;
  }

  const catalog = SUBJECTS_BY_ID[subject.id];
  const track = catalog ? TRACK_CONFIG[catalog.track] : null;
  const ready = ordered.filter((l) => info[l.id].done === 6).length;
  const working = counts.started - ready;
  const pct = (n) => (ordered.length ? (n / ordered.length) * 100 : 0);

  // «تابع من حيث توقفت»: lessons of this subject opened here, newest first,
  // then the first lesson in order that nobody has started.
  const byId = Object.fromEntries(ordered.map((l) => [l.id, l]));
  const recentHere = recent.filter((r) => byId[r.id]).slice(0, 2);
  const nextEmpty = ordered.find((l) => info[l.id].counts.sections === 0 && !recentHere.some((r) => r.id === l.id));
  const where = (l) => `الوحدة ${unitPos[l.unitId]} · الدرس ${lessons.filter((x) => x.unitId === l.unitId).sort((a, b) => a.order - b.order).indexOf(l) + 1}`;

  return (
    <EditorPage width="wide">
      <header className="flex flex-col gap-4 mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="t-caption text-fg-subtle">{subject.nameAr}{track ? ` · ${track.label}` : ''}</span>
            <h1 className="t-h1 text-fg-strong">الدروس</h1>
            <span className="t-label text-fg-muted">
              {units.length} وحدات · {ordered.length} درساً · <strong className="text-fg-strong">{ready} جاهز</strong>
              {counts.review ? ` · ${counts.review} بانتظار المراجعة` : ''}{counts.returned ? ` · ${counts.returned} أُعيد إليك` : ''}
            </span>
          </div>
          <div className="w-full sm:w-72 flex flex-col gap-1.5">
            <span className="flex justify-between t-caption text-fg-muted"><span>جاهزية المادة</span><span dir="ltr">{Math.round(pct(ready))}%</span></span>
            <span className="flex h-2 rounded-chip bg-hover overflow-hidden" aria-hidden="true">
              <span className="bg-success" style={{ width: `${pct(ready)}%` }} />
              <span className="bg-accent" style={{ width: `${pct(working)}%` }} />
            </span>
            <span className="flex gap-3 t-caption text-fg-subtle">
              <span>● جاهز {ready}</span><span>● قيد العمل {working}</span><span>● لم يبدأ {ordered.length - counts.started}</span>
            </span>
          </div>
        </div>

        {(recentHere.length > 0 || nextEmpty) && (
          <section aria-label="تابع من حيث توقفت" className="flex flex-col gap-2">
            <h2 className="t-caption font-semibold text-fg-subtle">تابع من حيث توقفت</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {recentHere.map((r, i) => {
                const l = byId[r.id];
                const ri = info[l.id];
                return (
                  <Link key={r.id} href={lessonHref(l.id)}
                    className={cx('flex flex-col gap-1 p-3 rounded-card border bg-raised hover:border-line-strong transition-colors', i === 0 ? 'border-line-accent' : 'border-line')}>
                    <span className="t-caption text-fg-subtle">{where(l)} · فتحته {formatRelative(r.at)}</span>
                    <strong className="t-ui text-fg-strong truncate">{l.title}</strong>
                    <span className={cx('t-caption', l.reviewState?.returned ? 'text-warn' : 'text-fg-muted')}>
                      {l.reviewState?.returned ? 'أُعيد إليك بملاحظات من المراجِع' : ri.missing.length ? `ينقصه: ${ri.missing.join('، ')}` : 'جاهز للإرسال'}
                    </span>
                  </Link>
                );
              })}
              {nextEmpty && (
                <Link href={lessonHref(nextEmpty.id)} className="flex flex-col gap-1 p-3 rounded-card border border-dashed border-line-strong hover:border-line-accent transition-colors">
                  <span className="t-caption text-fg-subtle">التالي في الترتيب · {where(nextEmpty)}</span>
                  <strong className="t-ui text-fg-strong truncate">{nextEmpty.title}</strong>
                  <span className="t-caption text-fg-muted">لم يبدأ أحد بعد — ابدأه أنت</span>
                </Link>
              )}
            </div>
          </section>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <label className="relative flex-1 min-w-56 max-w-md">
            <span className="sr-only">ابحث في الدروس</span>
            <Search size={15} className="absolute top-1/2 -translate-y-1/2 start-3 text-fg-subtle" aria-hidden="true" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث بعنوان الدرس أو الوحدة…" className="ps-9" />
          </label>
          <Segmented label="تصفية حسب الحالة" size="sm" value={filter} onChange={setFilter}
            className="overflow-x-auto" items={FILTERS.map((f) => ({ ...f, label: `${f.label} · ${counts[f.id]}` }))} />
        </div>
      </header>

      {filter === 'all' && !q ? (
        <div className="space-y-6">
          {(() => {
            let lastBookId = '__none__';
            return sortedUnits.map((unit, index) => {
              const showBook = unit.bookId && unit.bookId !== lastBookId;
              if (unit.bookId) lastBookId = unit.bookId;
              return (
                <div key={unit.id}>
                  {showBook && <BookDivider title={unit.bookTitle || unit.bookId} />}
                  <UnitCard unit={unit} index={index} />
                </div>
              );
            });
          })()}
        </div>
      ) : results.length ? (
        <div className="flex flex-col gap-1 rounded-card border border-line bg-raised p-2">
          <span className="px-3 py-1 t-caption text-fg-subtle">{results.length} درساً</span>
          {results.map((l) => (
            <LessonItem key={l.id} lesson={l} index={ordered.indexOf(l)} unitLabel={`الوحدة ${unitPos[l.unitId]}`} />
          ))}
        </div>
      ) : (
        <EmptyState title="لا دروس هنا" description={q ? `لا شيء يطابق «${q}» في هذا التصنيف.` : 'لا درس في هذه الحالة الآن.'} />
      )}
    </EditorPage>
  );
}

function BookDivider({ title }) {
  return (
    <div className="flex items-center gap-3 mb-3 mt-2">
      <span className="t-label font-semibold text-fg-accent">{title}</span>
      <span className="flex-1 h-px bg-line" />
    </div>
  );
}

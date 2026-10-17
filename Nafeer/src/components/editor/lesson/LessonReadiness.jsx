'use client';
import { Check, Circle, CircleCheck, Clock3, MessageSquareWarning, ArrowLeft } from 'lucide-react';
import { Button, cx } from '@/components/ui';
import { formatNumber, formatRelative } from '@/lib/format';

// ─── LessonReadiness ──────────────────────────────────────────────────────────
// The lesson editor's readiness and review panel (DS2 step 2; canvas board
// «4 · الجاهزية والإرسال للمراجعة»). One component, two homes: a side panel
// that stays in view on every tab at xl and up, and a drawer below that.
//
// From top to bottom:
//   review     where the lesson is in the review round trip — sent and waiting,
//              returned with comments (each one jumps to where it applies and
//              can be marked handled), or approved
//   readiness  the six checks, each one a link to the tab that fixes it
//   about      author, version, position in the unit, previous / next lesson

// Where a comment's anchor lives in the editor (lib/review.js ANCHOR_KINDS).
export const ANCHOR_TAB = {
  lesson: 'meta', meta: 'meta', section: 'body', block: 'body', question: 'questions', feed: 'feed',
};
// Progress widths for the six checks as fixed classes, not an inline style.
export const SIXTHS = ['w-0', 'w-1/6', 'w-2/6', 'w-3/6', 'w-4/6', 'w-5/6', 'w-full'];

const ANCHOR_FALLBACK = {
  lesson: 'الدرس كله', meta: 'بيانات الدرس', section: 'قسم', block: 'عنصر', question: 'سؤال', feed: 'بطاقة تغذية',
};

function ReviewBlock({ lesson, reviewState, comments, onJump, onResolve, resolvingId }) {
  if (lesson.atlasStatus === 'review') {
    return (
      <section role="status" className="flex gap-3 p-4 rounded-card bg-info-surface border border-info-border text-info">
        <Clock3 size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-1">
          <p className="t-ui font-semibold">
            بانتظار المراجعة{reviewState?.submittedAt ? ` · أُرسل ${formatRelative(reviewState.submittedAt)}` : ''}
          </p>
          <p className="t-label font-normal text-fg-muted leading-relaxed">
            يمكنك متابعة التعديل — يرى المراجِع آخر نسخة محفوظة. سيظهر رده هنا.
          </p>
        </div>
      </section>
    );
  }

  if (lesson.atlasStatus === 'approved') {
    return (
      <section role="status" className="flex gap-3 p-4 rounded-card bg-success-surface border border-success-border text-success">
        <CircleCheck size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
        <p className="t-ui font-semibold">الدرس معتمد ومنشور في بشير</p>
      </section>
    );
  }

  if (!reviewState?.returned) return null;

  const open = comments.filter((c) => !c.resolved).length;
  return (
    <section aria-labelledby="review-returned" className="flex flex-col gap-3 p-4 rounded-card bg-warn-surface border border-warn-border">
      <div className="flex items-start gap-2.5 text-warn">
        <MessageSquareWarning size={18} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          <p id="review-returned" className="t-ui font-semibold">
            أعاده {reviewState.returnedByName || 'المراجِع'} {formatRelative(reviewState.returnedAt)}
          </p>
          <p className="t-label font-normal text-fg-muted">
            {comments.length === 0
              ? 'دون ملاحظات مكتوبة — راجع الدرس ثم أعد إرساله.'
              : open
                ? `عولجت ${formatNumber(comments.length - open)} من ${formatNumber(comments.length)} — عالج الباقي ثم أعد الإرسال.`
                : 'عولجت كل الملاحظات — يمكنك إعادة الإرسال.'}
          </p>
        </div>
      </div>

      {comments.length > 0 && (
        <ul className="flex flex-col gap-2">
          {comments.map((c) => {
            const where = c.anchor?.label || ANCHOR_FALLBACK[c.anchor?.kind || 'lesson'];
            return (
              <li key={c._id} className={cx('flex flex-col gap-2 p-3 rounded-control bg-sunken border border-line', c.resolved && 'opacity-70')}>
                <button
                  type="button"
                  onClick={() => onJump(ANCHOR_TAB[c.anchor?.kind || 'lesson'], c.anchor?.id)}
                  className="self-start inline-flex items-center gap-1 t-caption text-fg-accent hover:underline"
                >
                  {where} <ArrowLeft size={12} strokeWidth={2} aria-hidden="true" />
                </button>
                <p className={cx('t-body text-fg leading-relaxed', c.resolved && 'line-through decoration-fg-subtle')}>{c.text}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="t-caption text-fg-subtle">
                    {c.resolved ? `عالجها ${c.resolvedByName || ''} ${formatRelative(c.resolvedAt)}`.replace(/\s+/g, ' ') : ''}
                  </span>
                  <Button
                    size="sm"
                    variant={c.resolved ? 'ghost' : 'secondary'}
                    icon={c.resolved ? undefined : Check}
                    loading={resolvingId === c._id}
                    aria-pressed={!!c.resolved}
                    onClick={() => onResolve(c._id, !c.resolved)}
                  >
                    {c.resolved ? 'تراجع' : 'عولجت'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// What good looks like, one line per check — shown under the next one to do
// (UX queue 3). Keyed by the checklist ids in LessonEditorPage.
const HELP = {
  title:     'اسم الفكرة لا رقم الدرس — مثلاً «قراءة الصور الجوية».',
  summary:   'جملتان: ما الذي سيفهمه الطالب، وما الذي سيستطيع فعله بعد الدرس.',
  sections:  'ابدأ بقسم «الفكرة» يشرح المفهوم، ثم «مثال محلول» يطبّقه.',
  content:   'فقرة قصيرة أولاً، ثم صورة أو مثال. اكتب «/» في فقرة فارغة لتختار النوع.',
  questions: 'سؤال يختبر الفهم لا الحفظ — «لماذا» أفضل من «ما هو».',
  feed:      'بطاقة تعريف لأهم مصطلح في الدرس، يراجعه الطالب لاحقاً.',
};

// The seed account creates every scaffolded lesson; it is not an author.
const SEED_NAME = 'System Seed';

export default function LessonReadiness({
  lesson, reviewState, comments = [], onResolve, resolvingId,
  checks, onJump,
  attribution, lessonIndex, unitLessonCount, prevLesson, nextLesson, onNavigateLesson,
}) {
  const done = checks.filter((c) => c.done).length;
  const nextTodo = checks.find((c) => !c.done);

  return (
    <div className="flex flex-col gap-4">
      <ReviewBlock
        lesson={lesson} reviewState={reviewState} comments={comments}
        onJump={onJump} onResolve={onResolve} resolvingId={resolvingId}
      />

      <section aria-labelledby="readiness-title" className="flex flex-col gap-3 p-4 rounded-card bg-raised border border-line">
        <div className="flex items-baseline justify-between">
          <h2 id="readiness-title" className="t-title text-fg-strong">جاهزية الدرس</h2>
          {/* dir="ltr": the separate runs otherwise reorder to "6 / 0" */}
          <span dir="ltr" className="t-num t-ui text-fg-muted">{formatNumber(done)} / {formatNumber(checks.length)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-hover overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={checks.length} aria-valuenow={done} aria-label="جاهزية الدرس">
          <div className={cx('h-full rounded-full transition-[width] duration-slow', SIXTHS[done] ?? 'w-full', done === checks.length ? 'bg-success' : 'bg-accent-hover')} />
        </div>
        <ul className="flex flex-col">
          {checks.map((c) => {
            const isNext = c === nextTodo;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onJump(c.tab)}
                  className={cx(
                    'w-full flex items-center gap-2.5 h-10 px-2 -mx-2 rounded-control t-ui text-start transition-colors duration-fast',
                    isNext ? 'bg-selected text-fg' : c.done ? 'text-fg-muted hover:bg-hover' : 'text-fg hover:bg-hover',
                  )}
                >
                  {c.done
                    ? <Check size={16} strokeWidth={2.25} className="text-success shrink-0" aria-label="مكتمل" />
                    : <Circle size={16} strokeWidth={1.75} className={cx('shrink-0', isNext ? 'text-fg-accent' : 'text-fg-subtle')} aria-label="غير مكتمل" />}
                  <span className="flex-1">{c.label}</span>
                  {!c.done && <span className="t-caption text-fg-accent">اذهب ←</span>}
                </button>
                {isNext && HELP[c.id] && (
                  <p className="ps-7 pb-2 t-caption text-fg-muted leading-relaxed">{HELP[c.id]}</p>
                )}
              </li>
            );
          })}
        </ul>
        <p className="t-caption text-fg-subtle leading-relaxed">
          {done === checks.length
            ? 'كل الفحوص مكتملة. راجع الدرس في المعاينة مرة أخيرة ثم أرسله.'
            : 'يمكن الإرسال قبل الاكتمال، وسيراه المراجِع ناقصاً.'}
        </p>
      </section>

      <section className="flex flex-col gap-1.5 px-1 t-caption text-fg-subtle">
        {attribution?.createdBy?.name && attribution.createdBy.name !== SEED_NAME && <span>أنشأه {attribution.createdBy.name}</span>}
        <span>
          الإصدار {formatNumber(lesson._v ?? lesson.version ?? 1)}
          {attribution?.updatedBy?.name && attribution.updatedBy.name !== SEED_NAME ? ` · آخر تعديل بواسطة ${attribution.updatedBy.name}` : ''}
        </span>
        {lessonIndex >= 0 && <span>الدرس {formatNumber(lessonIndex + 1)} من {formatNumber(unitLessonCount)} في الوحدة</span>}
        {(prevLesson || nextLesson) && (
          <div className="flex items-center justify-between gap-2 pt-1.5">
            {prevLesson
              ? <button type="button" onClick={() => onNavigateLesson(prevLesson.id, prevLesson._unitId)} className="text-fg-accent hover:underline truncate">→ {prevLesson.title}</button>
              : <span />}
            {nextLesson && (
              <button type="button" onClick={() => onNavigateLesson(nextLesson.id, nextLesson._unitId)} className="text-fg-accent hover:underline truncate">{nextLesson.title} ←</button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

'use client';
import { ArrowRight, Check, Clock3, Eye, NotebookPen, Send, Upload } from 'lucide-react';
import { Badge, Button, ConfirmButton, IconButton, Menu, SaveStatus, Tabs } from '@/components/ui';
import { arCount, formatNumber } from '@/lib/format';

// ─── LessonHeader ─────────────────────────────────────────────────────────────
// The lesson editor's one header bar (docs/design-system.md, DS2 step 1).
//
// It replaces three stacked rows — eleven loose controls, an attribution
// strip and a tab row — plus four separate save indicators (a "محفوظ" button,
// a sync dot, a three-second flash and a red error strip). Now:
//
//   identity   back to the unit · title · Atlas status
//   status     one SaveStatus pill (saved / saving / N unsaved / failed + retry)
//   actions    معاينة · ⋯ (السجل، الملاحظات) · حفظ · one primary action
//   tabs       the shared Tabs, with counts, a done mark and an unsaved dot
//
// The primary action depends on role and status, exactly as before:
// contributors send a draft for review; admins approve a draft directly, or
// save-and-approve an already approved lesson.

const ATLAS_STATUS = {
  returned: { tone: 'warn',    label: 'أُعيد إليك' },
  draft:    { tone: 'neutral', label: 'مسودة' },
  review:   { tone: 'warn',    label: 'للمراجعة' },
  approved: { tone: 'success', label: 'معتمد' },
  archived: { tone: 'neutral', label: 'أرشيف' },
};

// The contributor's send button, gated as the readiness board draws it:
//   comments from a return still open → explain, offer to show them (the
//     server refuses the resend anyway, lib/review.js)
//   checks missing                     → list them; "complete first" jumps to
//     the first gap, "send anyway" sends
//   ready                              → send
function SubmitAction({ lesson, isSyncing, reviewSuccess, missing, openComments, onSubmitForReview, onJump, onShowComments }) {
  const label = reviewSuccess ? 'أُرسل للمراجعة' : lesson.reviewState?.returned ? 'أعد الإرسال' : 'إرسال للمراجعة';
  const icon = reviewSuccess ? Check : Send;

  if (openComments > 0) {
    return (
      <ConfirmButton
        variant="primary" size="sm" icon={icon} tone="primary"
        title={`بقي ${arCount(openComments, { one: 'ملاحظة واحدة', two: 'ملاحظتان', few: 'ملاحظات', many: 'ملاحظة' })} من المراجِع`}
        description="عالج كل ملاحظة وعلّمها «عولجت»، ثم أعد الإرسال."
        cancelLabel="اعرض الملاحظات"
        onCancel={onShowComments}
      >
        {label}
      </ConfirmButton>
    );
  }

  if (missing.length > 0) {
    return (
      <ConfirmButton
        variant="primary" size="sm" icon={icon} tone="primary"
        title={`الدرس غير مكتمل بعد (${formatNumber(6 - missing.length)} من 6)`}
        description="ينقصه ما يلي. يمكنك الإرسال الآن، وسيراه المراجِع ناقصاً."
        details={(
          <ul className="flex flex-col gap-1">
            {missing.map((c) => <li key={c.id} className="t-label text-warn">○ {c.label}</li>)}
          </ul>
        )}
        cancelLabel="أكمل أولاً"
        onCancel={() => onJump(missing[0].tab)}
        confirmLabel="أرسل على أي حال"
        onConfirm={onSubmitForReview}
      >
        {label}
      </ConfirmButton>
    );
  }

  return (
    <Button variant="primary" size="sm" icon={icon} onClick={onSubmitForReview} disabled={isSyncing}>
      {label}
    </Button>
  );
}

function PrimaryAction({ lesson, isAdmin, isSyncing, reviewSuccess, approveSuccess, onSubmitForReview, onApprove, ...gate }) {
  const status = lesson.atlasStatus;
  if (!status || status === 'draft') {
    return isAdmin ? (
      <Button variant="primary" size="sm" icon={Check} onClick={onApprove} disabled={isSyncing}>
        {approveSuccess ? 'تم الاعتماد' : 'اعتماد'}
      </Button>
    ) : (
      <SubmitAction
        lesson={lesson} isSyncing={isSyncing} reviewSuccess={reviewSuccess}
        onSubmitForReview={onSubmitForReview} {...gate}
      />
    );
  }
  if (status === 'approved' && isAdmin) {
    return (
      <Button variant="primary" size="sm" icon={approveSuccess ? Check : Upload} onClick={onApprove} disabled={isSyncing}>
        {approveSuccess ? 'تم الحفظ' : 'حفظ + اعتماد'}
      </Button>
    );
  }
  return null;
}

export default function LessonHeader({
  lesson, unit, lessonIndex, unitLessonCount, isAdmin,
  saveState, savedAt, unsavedCount, syncError, isSyncing,
  reviewSuccess, approveSuccess, notesCount,
  tabs, activeTab, onTabChange,
  onBack, onSave, onPreview, onHistory, onNotes, onSubmitForReview, onApprove,
  missing = [], openComments = 0, onJump, onShowComments,
}) {
  const returned = lesson.atlasStatus === 'draft' && lesson.reviewState?.returned;
  const status = ATLAS_STATUS[returned ? 'returned' : lesson.atlasStatus];
  const unitLabel = unit?.title ?? 'الدروس';

  return (
    <header className="sticky top-0 z-nav bg-page border-b border-line">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 sm:px-6 pt-3">

        {/* ── Identity ── */}
        <div className="flex items-center gap-2 min-w-0 flex-1 basis-72">
          <IconButton icon={ArrowRight} label={`العودة إلى ${unitLabel}`} size="sm" onClick={onBack} />
          <div className="flex flex-col min-w-0">
            <nav aria-label="مسار التنقل" className="t-caption text-fg-subtle truncate">
              <button type="button" onClick={onBack} className="hover:text-fg transition-colors">{unitLabel}</button>
              {lessonIndex >= 0 && <span> · الدرس {lessonIndex + 1} من {unitLessonCount}</span>}
            </nav>
            <div className="flex items-center gap-2 min-w-0">
              <h1 className="t-title text-fg-strong truncate">{lesson.title}</h1>
              {status && <Badge tone={status.tone} size="sm" dot={false}>{status.label}</Badge>}
            </div>
          </div>
        </div>

        {/* ── Status + actions — wraps on a phone rather than scrolling, so the
            primary action is never pushed out of view. ── */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          <SaveStatus
            state={saveState}
            savedAt={savedAt}
            dirtyCount={unsavedCount}
            onRetry={onSave}
            detail={typeof syncError === 'string' ? syncError : undefined}
          />
          <IconButton icon={Eye} label="معاينة" size="sm" onClick={onPreview} className="sm:hidden" />
          <Button variant="ghost" size="sm" icon={Eye} onClick={onPreview} className="hidden sm:inline-flex">معاينة</Button>
          <Menu
            size="sm"
            label="المزيد: السجل والملاحظات"
            items={[
              { id: 'history', label: 'سجل التغييرات', icon: Clock3, onSelect: onHistory },
              { id: 'notes', label: 'الملاحظات', icon: NotebookPen, count: notesCount, onSelect: onNotes },
            ]}
          />
          <Button size="sm" onClick={onSave} loading={isSyncing} className="shrink-0">حفظ</Button>
          <PrimaryAction
            lesson={lesson} isAdmin={isAdmin} isSyncing={isSyncing}
            reviewSuccess={reviewSuccess} approveSuccess={approveSuccess}
            onSubmitForReview={onSubmitForReview} onApprove={onApprove}
            missing={missing} openComments={openComments} onJump={onJump} onShowComments={onShowComments}
          />
        </div>
      </div>

      <div className="px-2 sm:px-4 mt-1">
        <Tabs idBase="lesson" label="أقسام الدرس" items={tabs} value={activeTab} onChange={onTabChange} />
      </div>
    </header>
  );
}

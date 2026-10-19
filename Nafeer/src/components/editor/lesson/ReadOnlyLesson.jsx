'use client';
import { useState } from 'react';
import { ArrowRight, Eye, History, MessageSquare } from 'lucide-react';
import EditorPage from '@/components/editor/layout/EditorPage';
import { LessonPhone } from '@/components/editor/lesson/LessonPreviewModal';
import LessonNotesDrawer   from '@/components/editor/lesson/LessonNotesDrawer';
import LessonHistoryDrawer from '@/components/editor/lesson/LessonHistoryDrawer';
import { Badge, Button, Card, Dialog, Field, Select, Textarea } from '@/components/ui';
import { formatDate } from '@/lib/format';

// ─── A lesson that is not yours (docs/team-leads.md L4) ───────────────────────
// Lessons belong to their owner. Anyone else in the subject reads them here —
// as the student will see them — and can still comment and read the history.
// A lead allowed to intervene gets «تدخّل»: a category and a written reason
// open the lesson for editing for 24 hours, and its owner is told why. For an
// owner who has gone quiet, «تولَّ الدرس» makes it the lead's.

const CATEGORIES = [
  { id: 'urgent',   label: 'إصلاح عاجل قبل النشر' },
  { id: 'factual',  label: 'خطأ علمي' },
  { id: 'inactive', label: 'صاحب الدرس غائب' },
  { id: 'other',    label: 'سبب آخر' },
];
const CATEGORY_LABEL = Object.fromEntries(CATEGORIES.map((c) => [c.id, c.label]));
const MIN_REASON = 20;

async function act(body) {
  const res = await fetch('/api/lead/lessons', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر الاتصال بالخادم');
  return json;
}

export default function ReadOnlyLesson({ lesson, unit, access, sections, blocks, questions, lessonId, currentUser, onBack }) {
  const [dialog, setDialog] = useState(null);   // 'intervene' | 'takeover'
  const [showNotes, setShowNotes] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const owner = access.owner?.name || 'زميل';
  const iv = access.intervention;

  return (
    <EditorPage width="content" className="flex flex-col gap-5 font-ui">
      <header className="flex items-start gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} aria-label="العودة إلى الدروس">
          <ArrowRight size={16} aria-hidden="true" /> الدروس
        </Button>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="t-caption text-fg-subtle">{unit?.title ? `${unit.title} · ` : ''}درس {owner}</span>
          <h1 className="t-h2 text-fg-strong">{lesson.title}</h1>
        </div>
        <Badge tone="neutral" icon={Eye}>للقراءة</Badge>
      </header>

      <Card tone="sunken">
        <div className="flex flex-col gap-3">
          <p className="t-label text-fg">
            هذا الدرس في عهدة <strong>{owner}</strong>، وهو وحده من يعدّله. يمكنك قراءته، والتعليق عليه، ومراجعة سجله.
          </p>
          {iv && (
            <p className="t-label text-warn">
              يتدخّل {iv.byName || 'قائد الفريق'} فيه الآن حتى {formatDate(iv.until, 'shortDateTime')} — {CATEGORY_LABEL[iv.category]}: {iv.reason}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowNotes(true)}><MessageSquare size={15} aria-hidden="true" /> التعليقات</Button>
            <Button size="sm" variant="secondary" onClick={() => setShowHistory(true)}><History size={15} aria-hidden="true" /> السجل</Button>
            {access.canIntervene && (
              <>
                <Button size="sm" variant="primary" onClick={() => setDialog('intervene')}>تدخّل…</Button>
                <Button size="sm" variant="ghost" onClick={() => setDialog('takeover')}>تولَّ الدرس…</Button>
              </>
            )}
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <LessonPhone lesson={lesson} sections={sections} blocks={blocks} questions={questions} height="min(780px, 80dvh)" />
      </div>

      {dialog && (
        <LeadActionDialog kind={dialog} lessonId={lessonId} owner={owner}
          onClose={() => setDialog(null)} onDone={() => window.location.reload()} />
      )}
      {showNotes && (
        <LessonNotesDrawer lessonId={lessonId} currentUser={currentUser}
          onClose={() => setShowNotes(false)} onCountChange={() => {}} />
      )}
      {showHistory && <LessonHistoryDrawer lessonId={lessonId} onClose={() => setShowHistory(false)} />}
    </EditorPage>
  );
}

function LeadActionDialog({ kind, lessonId, owner, onClose, onDone }) {
  const takeover = kind === 'takeover';
  const [category, setCategory] = useState('urgent');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ok = reason.trim().length >= MIN_REASON;

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await act(takeover
        ? { action: 'takeover', contentId: lessonId, reason: reason.trim() }
        : { action: 'intervene', contentId: lessonId, category, reason: reason.trim() });
      onDone();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Dialog open onClose={onClose}
      title={takeover ? 'تولّي الدرس' : 'التدخّل في الدرس'}
      description={takeover
        ? `يصير الدرس في عهدتك، ويبقى ${owner} مؤلفاً له. يصله إشعار بالسبب، ويُسجَّل القرار.`
        : `تعدّل الدرس 24 ساعة كأنه درسك. يصل ${owner} إشعار بالسبب، ويظهر كل تعديل باسمك في سجل الدرس.`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" onClick={submit} loading={busy} disabled={!ok}>{takeover ? 'تولَّه' : 'ابدأ التدخّل'}</Button>
      </>}>
      <div className="flex flex-col gap-4">
        {!takeover && (
          <Field label="السبب">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </Select>
          </Field>
        )}
        <Field label={takeover ? 'لماذا تتولّاه؟' : 'ما الذي ستغيّره، ولماذا؟'} required error={error}
          hint={`${MIN_REASON} حرفاً على الأقل. يراه صاحب الدرس.`}>
          <Textarea rows={3} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

// Shown in the editor while a lead edits someone else's lesson.
export function InterventionBanner({ lessonId, access }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const iv = access.intervention;
  if (!iv) return null;

  const end = async () => {
    setBusy(true); setError(null);
    try { await act({ action: 'end', contentId: lessonId }); window.location.reload(); }
    catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <div role="status" className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-card bg-warn-surface border border-warn-border t-label">
      <span className="flex-1 min-w-0 text-fg leading-relaxed">
        <strong className="text-warn">تتدخّل في درس {access.owner?.name || 'زميل'}</strong>
        {` حتى ${formatDate(iv.until, 'shortDateTime')} — ${CATEGORY_LABEL[iv.category]}: ${iv.reason}. كل حفظ يُسجَّل باسمك.`}
      </span>
      <Button size="sm" variant="secondary" onClick={end} loading={busy}>أنهِ التدخّل</Button>
      {error && <span role="alert" className="t-caption text-danger w-full">{error}</span>}
    </div>
  );
}

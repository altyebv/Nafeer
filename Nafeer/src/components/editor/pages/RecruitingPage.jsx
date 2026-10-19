'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EditorPage from '@/components/editor/layout/EditorPage';
import { Badge, Button, Card, Dialog, EmptyState, Field, Input, PageHeader, Select, Tabs, TabPanel, Textarea } from '@/components/ui';
import { reviewCall } from '@/components/review/LessonReview';
import { arCount, formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── The lead's applicants and interview questions (docs/team-leads.md L3) ────
// Applicants whose first subject is the lead's, read in full — background,
// availability, answers, micro-task — but without email, age or town. A
// decision waits out the undo window before anything happens; the card shows
// it with the time left and a way back. Applicants who picked this subject
// second or third are listed read-only. The interview tab edits only this
// subject's questions for each role.

const IDB = 'recruiting';
const call = (url, options) => reviewCall(url, options, '/signin');
const MIN_REASON = 10;

const RELATION = { uni: 'طالب جامعي', grad: 'خريج', teacher: 'معلّم', student: 'طالب ثانوي', other: 'أخرى' };
const STAGE = { new: 'طلب جديد', invited: 'لم يُجب بعد', answered: 'أجاب عن المقابلة' };
const yesNo = (v) => (v === true ? 'نعم' : v === false ? 'لا' : '—');

export default function RecruitingPage({ subjectId, canDecide, canEditInterview }) {
  const tabs = useMemo(() => [
    canDecide && { id: 'mine', label: 'طلبات المادة' },
    canDecide && { id: 'also', label: 'مهتمون أيضاً' },
    canEditInterview && { id: 'interview', label: 'أسئلة المقابلة' },
  ].filter(Boolean), [canDecide, canEditInterview]);
  const [tab, setTab] = useState(tabs[0]?.id || 'mine');
  const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';

  if (!tabs.length) {
    return (
      <EditorPage width="wide" className="font-ui">
        <EmptyState title="لا صلاحية هنا" description="قرارات المتقدمين وأسئلة المقابلة لقادة الفرق الذين منحهم المالك هذه الصلاحية." />
      </EditorPage>
    );
  }

  return (
    <EditorPage width="wide" className="flex flex-col gap-5 font-ui">
      <PageHeader title="المتقدمون" description={SUBJECTS_BY_ID[subjectId]?.nameAr || ''} />
      <Tabs items={tabs} value={tab} onChange={setTab} idBase={IDB} label="المتقدمون" className="border-b border-line" />
      {canDecide && (
        <>
          <TabPanel idBase={IDB} id="mine" active={tab === 'mine'}><Applicants qs={qs} subjectId={subjectId} which="mine" /></TabPanel>
          <TabPanel idBase={IDB} id="also" active={tab === 'also'}><Applicants qs={qs} subjectId={subjectId} which="alsoInterested" readOnly /></TabPanel>
        </>
      )}
      {canEditInterview && (
        <TabPanel idBase={IDB} id="interview" active={tab === 'interview'}><InterviewEditor qs={qs} subjectId={subjectId} /></TabPanel>
      )}
    </EditorPage>
  );
}

// ─── Applicants ───────────────────────────────────────────────────────────────

function Applicants({ qs, subjectId, which, readOnly = false }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const json = await call(`/api/lead/applicants${qs}`);
      if (json) { setData(json.data); setError(null); }
    } catch (e) { setError(e.message); }
  }, [qs]);
  useEffect(() => { load(); }, [load]);

  if (error && !data) return <EmptyState title="تعذّر تحميل الطلبات" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} />;
  if (!data) return <p className="t-body text-fg-subtle">جارٍ التحميل…</p>;

  const list = data[which];
  if (!list.length) {
    return (
      <EmptyState title="لا طلبات"
        description={readOnly ? 'لا متقدمين اختاروا هذه المادة ثانياً أو ثالثاً.' : 'حين يتقدم أحد لهذه المادة أولاً يظهر هنا.'} />
    );
  }
  const current = list.find((a) => a.id === selected) || list[0];

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
      <nav aria-label="المتقدمون" className="flex flex-col gap-2">
        {list.map((a) => {
          const on = a.id === current.id;
          return (
            <button key={a.id} type="button" aria-pressed={on} onClick={() => setSelected(a.id)}
              className={`flex flex-col gap-1 p-3 rounded-card border text-start transition-colors ${on ? 'bg-selected border-line-accent' : 'bg-raised border-line hover:border-line-strong'}`}>
              <span className="flex justify-between gap-2 t-caption text-fg-subtle">
                <span>{STAGE[a.stage] || a.stage}</span>
                <span>{formatRelative(a.appliedAt)}</span>
              </span>
              <strong className="t-ui text-fg-strong">{a.name}</strong>
              {a.pendingDecision && (
                <Badge size="sm" tone={a.pendingDecision.action === 'approve' ? 'success' : 'danger'}>
                  {a.pendingDecision.action === 'approve' ? 'قبول' : 'رفض'} بانتظار التنفيذ
                </Badge>
              )}
            </button>
          );
        })}
      </nav>
      <ApplicantDetail key={current.id} a={current} subjectId={subjectId} readOnly={readOnly} undoMinutes={data.undoMinutes} onChange={load} />
    </div>
  );
}

function ApplicantDetail({ a, subjectId, readOnly, undoMinutes, onChange }) {
  const [dialog, setDialog] = useState(null);   // 'approve' | 'reject'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const undo = async () => {
    setBusy(true); setError(null);
    try { await call('/api/lead/applicants', { method: 'POST', body: { action: 'undo', applicantId: a.id, subjectId } }); onChange(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const others = a.subjects.filter((_, i) => i > 0).map((s) => SUBJECTS_BY_ID[s]?.nameAr || s);

  return (
    <article aria-label={`طلب ${a.name}`} className="flex flex-col gap-4 min-w-0">
      <header className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="t-caption text-fg-subtle">
            {a.roleName || 'بلا دور'} · تقدّم {formatDate(a.appliedAt, 'medium')}
            {a.answeredAt ? ` · أجاب ${formatRelative(a.answeredAt)}` : ''}
          </span>
          <h2 className="t-h2 text-fg-strong">{a.name}</h2>
        </div>
        {readOnly && <Badge tone="neutral">يقرّر فيه قائد مادته الأولى</Badge>}
      </header>

      {a.pendingDecision && (
        <Card tone="accent">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="t-label text-fg flex-1 min-w-0">
              <strong>{a.pendingDecision.action === 'approve' ? 'قبول' : 'رفض'}</strong>
              {` بقرار ${a.pendingDecision.byName} — يُنفّذ ${formatDate(a.pendingDecision.decideAt, 'time')}`}
              {a.pendingDecision.reason ? ` · ${a.pendingDecision.reason}` : ''}
            </span>
            {!readOnly && <Button size="sm" variant="secondary" onClick={undo} loading={busy}>تراجع</Button>}
          </div>
          {error && <p role="alert" className="t-label text-danger mt-2">{error}</p>}
        </Card>
      )}

      <Card title="عن المتقدم">
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2 t-label">
          <Row k="الخلفية" v={a.background} />
          <Row k="مجال الدراسة" v={a.fieldOfStudy} />
          <Row k="علاقته بالمادة" v={RELATION[a.subjectRelation] || a.subjectRelation} />
          <Row k="الساعات الأسبوعية" v={a.weeklyHours} />
          <Row k="حاسوب أو جهاز لوحي" v={yesNo(a.hasDevice)} />
          <Row k="إنترنت مستقر" v={yesNo(a.stableInternet)} />
          <Row k="أدوات الذكاء الاصطناعي" v={a.aiTools.length ? a.aiTools.join('، ') : 'لا'} />
          <Row k="مواد أخرى" v={others.join('، ')} />
          {a.portfolioUrl && <Row k="أعماله" v={<a href={a.portfolioUrl} target="_blank" rel="noreferrer noopener" className="text-fg-accent underline">{a.portfolioUrl}</a>} />}
        </dl>
      </Card>

      <Card title="إجابات المقابلة">
        {a.answers.length ? (
          <ol className="flex flex-col gap-4">
            {a.answers.map((x, i) => (
              <li key={i} className="flex flex-col gap-1">
                <span className="t-label font-semibold text-fg-strong">{x.question || `السؤال ${i + 1}`}</span>
                <p className="read t-body text-fg whitespace-pre-wrap" dir="auto">{x.answer}</p>
              </li>
            ))}
          </ol>
        ) : <p className="t-label text-fg-subtle">لم يُجب عن المقابلة بعد.</p>}
      </Card>

      {a.microTask && (
        <Card title="المهمة التطبيقية">
          <p className="read t-body text-fg whitespace-pre-wrap" dir="auto">{a.microTask}</p>
        </Card>
      )}

      {!readOnly && !a.pendingDecision && (
        <div className="flex flex-col gap-2">
          {a.stage !== 'answered' && <p className="t-caption text-fg-subtle">يُقرَّر في الطلب بعد أن يجيب عن المقابلة.</p>}
          <div className="flex gap-2">
            <Button variant="primary" disabled={a.stage !== 'answered'} onClick={() => setDialog('approve')}>قبول…</Button>
            <Button variant="secondary" disabled={a.stage !== 'answered'} onClick={() => setDialog('reject')}>رفض…</Button>
          </div>
        </div>
      )}

      {dialog && (
        <DecideDialog a={a} subjectId={subjectId} decision={dialog} undoMinutes={undoMinutes}
          onClose={() => setDialog(null)} onDone={() => { setDialog(null); onChange(); }} />
      )}
    </article>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-2 min-w-0">
      <dt className="text-fg-subtle shrink-0 w-36">{k}</dt>
      <dd className={v ? 'read text-fg min-w-0 break-words' : 'text-fg-subtle'}>{v || '—'}</dd>
    </div>
  );
}

function DecideDialog({ a, subjectId, decision, undoMinutes, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const reject = decision === 'reject';
  const ok = !reject || reason.trim().length >= MIN_REASON;
  const windowText = arCount(undoMinutes, { one: 'دقيقة', two: 'دقيقتين', few: 'دقائق', many: 'دقيقة' });

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await call('/api/lead/applicants', {
        method: 'POST', body: { action: 'decide', applicantId: a.id, decision, reason: reason.trim(), subjectId },
      });
      onDone();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Dialog open onClose={onClose} title={reject ? `رفض طلب ${a.name}؟` : `قبول ${a.name}؟`}
      description={reject
        ? `يُنفّذ الرفض بعد ${windowText}، ويمكنك التراجع قبلها. لا تُرسل رسالة رفض تلقائياً.`
        : `بعد ${windowText} يصبح عضواً في فريق المادة ويصله رابط إكمال التسجيل. يمكنك التراجع قبلها.`}
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" onClick={submit} loading={busy} disabled={!ok}>{reject ? 'ارفض' : 'اقبل'}</Button>
      </>}>
      <Field label={reject ? 'سبب الرفض' : 'ملاحظة (اختيارية)'} required={reject} error={error}
        hint={reject ? `${MIN_REASON} أحرف على الأقل. يراه المالك، لا المتقدم.` : 'تظهر في سجل القرارات.'}>
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
      </Field>
    </Dialog>
  );
}

// ─── Interview questions ──────────────────────────────────────────────────────

function InterviewEditor({ qs, subjectId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [roleId, setRoleId] = useState('');

  const load = useCallback(async () => {
    try {
      const json = await call(`/api/lead/interview${qs}`);
      if (json) { setData(json.data); setError(null); setRoleId((r) => r || json.data.roles[0]?.id || ''); }
    } catch (e) { setError(e.message); }
  }, [qs]);
  useEffect(() => { load(); }, [load]);

  if (error && !data) return <EmptyState title="تعذّر تحميل الأسئلة" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} />;
  if (!data) return <p className="t-body text-fg-subtle">جارٍ التحميل…</p>;
  if (!data.roles.length) return <EmptyState title="لا أدوار مفتوحة" description="لا أدوار نشطة يُتقدَّم لها الآن." />;

  const role = data.roles.find((r) => r.id === roleId) || data.roles[0];

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <p className="t-label text-fg-muted">
        هذه أسئلة مادتك وحدها. من تقدّم لها أولاً يجيب عنها؛ ومن دُعي قبل تعديلك يبقى على الأسئلة التي وصلته.
      </p>
      <Field label="الدور">
        <Select value={role.id} onChange={(e) => setRoleId(e.target.value)}>
          {data.roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </Select>
      </Field>
      <RoleQuestions key={role.id} role={role} subjectId={subjectId} max={data.maxQuestions} onSaved={load} />
    </div>
  );
}

function RoleQuestions({ role, subjectId, max, onSaved }) {
  const start = role.subject || { questions: [], microTask: null };
  const [questions, setQuestions] = useState(start.questions.length ? start.questions : []);
  const [prompt, setPrompt] = useState(start.microTask?.prompt || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (i, patch) => setQuestions((qsList) => qsList.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  const copyGeneric = () => {
    setQuestions(role.generic.questions.map(({ text, placeholder, minChars }) => ({ text, placeholder, minChars })));
    setPrompt(role.generic.microTask?.prompt || '');
  };

  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      await call('/api/lead/interview', {
        method: 'PUT',
        body: { roleId: role.id, questions, microTask: { prompt }, subjectId },
      });
      setMsg({ ok: true, text: 'حُفظت أسئلة المادة.' });
      onSaved();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <Card title={role.subject ? 'أسئلة المادة' : 'لا أسئلة خاصة بالمادة بعد'}>
      <div className="flex flex-col gap-4">
        {!role.subject && (
          <div className="flex items-center gap-3 flex-wrap">
            <p className="t-label text-fg-muted flex-1 min-w-0">
              يجيب المتقدمون الآن عن الأسئلة العامة للدور ({role.generic.questions.length}). اكتب أسئلة لمادتك، أو ابدأ من العامة.
            </p>
            <Button size="sm" variant="secondary" onClick={copyGeneric} disabled={!role.generic.questions.length}>ابدأ من الأسئلة العامة</Button>
          </div>
        )}

        {questions.map((q, i) => (
          <div key={q.id || i} className="flex flex-col gap-2 p-3 rounded-control border border-line">
            <div className="flex items-center justify-between gap-2">
              <span className="t-caption font-semibold text-fg-subtle">السؤال {i + 1}</span>
              <Button size="sm" variant="ghost" aria-label={`احذف السؤال ${i + 1}`}
                onClick={() => setQuestions((xs) => xs.filter((_, j) => j !== i))}>×</Button>
            </div>
            <Textarea aria-label={`نص السؤال ${i + 1}`} rows={2} value={q.text} maxLength={300} onChange={(e) => set(i, { text: e.target.value })} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
              <Input aria-label={`تلميح السؤال ${i + 1}`} placeholder="تلميح داخل خانة الإجابة (اختياري)" value={q.placeholder || ''} maxLength={200}
                onChange={(e) => set(i, { placeholder: e.target.value })} />
              <Input aria-label={`أقل طول للإجابة ${i + 1}`} type="number" min={20} max={1000} value={q.minChars ?? 80}
                onChange={(e) => set(i, { minChars: Number(e.target.value) })} />
            </div>
          </div>
        ))}
        <Button size="sm" variant="secondary" className="self-start" disabled={questions.length >= max}
          onClick={() => setQuestions((xs) => [...xs, { text: '', placeholder: '', minChars: 80 }])}>+ سؤال</Button>

        <Field label="المهمة التطبيقية" hint="مهمة قصيرة يؤديها المتقدم كتابةً. اتركها فارغة للاستغناء عنها.">
          <Textarea rows={3} value={prompt} maxLength={1000} onChange={(e) => setPrompt(e.target.value)} />
        </Field>

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={save} loading={busy}>احفظ أسئلة المادة</Button>
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={`t-label ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
        </div>
      </div>
    </Card>
  );
}

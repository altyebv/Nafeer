'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import EditorPage from '@/components/editor/layout/EditorPage';
import { Badge, Button, Card, ConfirmButton, Dialog, EmptyState, Field, Input, Menu, PageHeader, Select, Stat, Textarea } from '@/components/ui';
import { reviewCall } from '@/components/review/LessonReview';
import { useDataStore } from '@/store/dataStore';
import { arCount, formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';

// ─── The lead's team page (docs/team-leads.md L2) ─────────────────────────────
// Who is on the subject and how they are doing, from one request
// (/api/lead/team): last activity, events in the last 30 days, the lessons
// each owns by status, and who is paused. From here the lead assigns a lesson,
// pauses or restores a member's edit access, posts to the team, and sets their
// own away mode. Lessons for the assign picker come from the editor's store,
// already loaded — no extra request.

const PAUSE_DAYS = [1, 3, 7, 14, 30];
const AWAY_DAYS = [3, 7, 14, 30, 60];
const MIN_REASON = 10;

const daysLabel = (n) => arCount(n, { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يوماً' });
const membersLabel = (n) => (n ? arCount(n, { one: 'عضو واحد', two: 'عضوان', few: 'أعضاء', many: 'عضواً' }) : 'لا أعضاء بعد');
const eventsLabel = (n) => (n ? arCount(n, { one: 'نشاط واحد', two: 'نشاطان', few: 'أنشطة', many: 'نشاطاً' }) : 'لا نشاط');

// The owner, who has no subject of their own, names it on every action; a
// lead's subjectId is ignored by the route.
const makePost = (subjectId) => (body) =>
  reviewCall('/api/lead/team', { method: 'POST', body: { ...body, subjectId } }, '/signin');

export default function LeadTeamPage({ subjectId, viewerId }) {
  const [team, setTeam] = useState(null);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null);   // { kind: 'pause'|'assign'|'away', member? }
  const post = useMemo(() => makePost(subjectId), [subjectId]);

  const qs = subjectId ? `?subjectId=${encodeURIComponent(subjectId)}` : '';
  const load = useCallback(async () => {
    try {
      const json = await reviewCall(`/api/lead/team${qs}`, undefined, '/signin');
      if (json) { setTeam(json.data); setError(null); }
    } catch (e) { setError(e.message); }
  }, [qs]);
  useEffect(() => { load(); }, [load]);

  if (error && !team) {
    return (
      <EditorPage width="wide" className="font-ui">
        <EmptyState title="تعذّر فتح صفحة الفريق" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} />
      </EditorPage>
    );
  }
  if (!team) return <EditorPage width="wide" className="font-ui"><p className="t-body text-fg-subtle">جارٍ التحميل…</p></EditorPage>;

  const subject = SUBJECTS_BY_ID[team.subjectId]?.nameAr || team.subjectId;
  const me = team.leads.find((l) => l.id === viewerId) || null;
  const away = me?.awayUntil && new Date(me.awayUntil) > new Date();
  const done = () => { setDialog(null); load(); };

  return (
    <EditorPage width="wide" className="flex flex-col gap-6 font-ui">
      <PageHeader
        title="الفريق"
        description={`${subject} · ${membersLabel(team.members.length)}`}
        actions={me && (away
          ? <Button variant="secondary" onClick={() => post({ action: 'away', days: null }).then(load)}>عدتُ — أنهِ الغياب</Button>
          : <Button variant="ghost" onClick={() => setDialog({ kind: 'away' })}>سأغيب…</Button>)}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="الأعضاء" value={team.members.length} />
        <Stat label={`قرارات المراجعة · ${team.windowDays} يوماً`} value={team.turnaround.decisions} />
        <Stat label="وسيط الانتظار" value={team.turnaround.medianHours == null ? '—' : `${team.turnaround.medianHours} س`}
          hint="من الإرسال إلى قرار القائد" />
        <Stat label="القادة المتاحون" value={`${team.leads.filter((l) => l.available).length}/${team.leads.length}`}
          hint={team.leads.map((l) => `${l.name}${l.available ? '' : ' (غائب)'}`).join('، ') || '—'} />
      </div>

      <Card padding="none" className="overflow-hidden" title={<span className="block px-4 pt-4">الأعضاء</span>}>
        {team.members.length === 0
          ? <p className="px-4 pb-4 t-label text-fg-subtle">لا أعضاء معتمدون في هذه المادة بعد.</p>
          : (
            <ul>
              {team.members.map((m) => (
                <MemberRow key={m.id} m={m} isMe={m.id === viewerId}
                  onPause={() => setDialog({ kind: 'pause', member: m })}
                  onUnpause={() => post({ action: 'unpause', contributorId: m.id }).then(load)}
                  onAssign={() => setDialog({ kind: 'assign', member: m })} />
              ))}
            </ul>
          )}
      </Card>

      <Announcements items={team.announcements} viewerId={viewerId} post={post} onChange={load} />

      {dialog?.kind === 'pause'  && <PauseDialog post={post} member={dialog.member} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === 'assign' && <AssignDialog post={post} member={dialog.member} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.kind === 'away'   && <AwayDialog post={post} onClose={() => setDialog(null)} onDone={done} />}
    </EditorPage>
  );
}

function MemberRow({ m, isMe, onPause, onUnpause, onAssign }) {
  const items = [
    { id: 'assign', label: 'أسند إليه درساً', onSelect: onAssign },
    m.paused
      ? { id: 'unpause', label: 'ارفع الإيقاف', onSelect: onUnpause }
      : { id: 'pause', label: 'أوقف التعديل…', onSelect: onPause, disabled: m.isLead || isMe },
  ];
  return (
    <li className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-line">
      <div className="flex flex-col gap-0.5 flex-1 min-w-[12rem]">
        <span className="flex items-center gap-2">
          <strong className="t-ui text-fg-strong">{m.name}</strong>
          {m.isLead && <Badge size="sm" tone="accent">قائد</Badge>}
          {m.paused && <Badge size="sm" tone="warn">موقوف{m.paused.until ? ` حتى ${formatDate(m.paused.until, 'short')}` : ''}</Badge>}
        </span>
        <span className="t-caption text-fg-subtle">
          {m.lastActiveAt ? `آخر نشاط ${formatRelative(m.lastActiveAt)}` : 'لا نشاط مسجّل'} · {eventsLabel(m.events30d)} في 30 يوماً
        </span>
        {m.paused?.reason && <span className="t-caption text-fg-muted">السبب: {m.paused.reason}</span>}
      </div>
      <span className="flex gap-1.5 t-caption text-fg-muted">
        <Badge size="sm">مسودة {m.lessons.draft}</Badge>
        <Badge size="sm">مراجعة {m.lessons.review}</Badge>
        <Badge size="sm" tone="success">معتمد {m.lessons.approved}</Badge>
      </span>
      <Menu items={items} label={`إجراءات ${m.name}`} size="sm" variant="ghost" />
    </li>
  );
}

function PauseDialog({ post, member, onClose, onDone }) {
  const [days, setDays] = useState('7');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ok = reason.trim().length >= MIN_REASON;

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await post({ action: 'pause', contributorId: member.id, days: days === 'none' ? null : Number(days), reason: reason.trim() });
      onDone();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Dialog open onClose={onClose} title={`إيقاف التعديل: ${member.name}`}
      description="يبقى قادراً على القراءة، ولا يستطيع الحفظ حتى ينتهي الإيقاف أو ترفعه. يرى السبب في أعلى محرره، ويُسجَّل القرار."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" onClick={submit} loading={busy} disabled={!ok}>أوقف</Button>
      </>}>
      <div className="flex flex-col gap-4">
        <Field label="المدة">
          <Select value={days} onChange={(e) => setDays(e.target.value)}>
            {PAUSE_DAYS.map((d) => <option key={d} value={d}>{daysLabel(d)}</option>)}
            <option value="none">حتى أرفعه</option>
          </Select>
        </Field>
        <Field label="السبب" required hint={`${MIN_REASON} أحرف على الأقل. يراه العضو.`} error={error}>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
        </Field>
      </div>
    </Dialog>
  );
}

function AssignDialog({ post, member, onClose, onDone }) {
  const lessons = useDataStore(useShallow((s) => s.lessons.map((l) => ({ id: l.id, title: l.title }))));
  const [contentId, setContentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await post({ action: 'assign', contentId, contributorId: member.id });
      onDone();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Dialog open onClose={onClose} title={`إسناد درس إلى ${member.name}`}
      description="يصبح مسؤولاً عن الدرس، ويصله إشعار في لوحته. يبقى المؤلف الأصلي مؤلفاً."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" onClick={submit} loading={busy} disabled={!contentId}>أسند</Button>
      </>}>
      <Field label="الدرس" error={error} hint={lessons.length ? null : 'لم تُحمَّل دروس المادة بعد — افتح صفحة الدروس ثم عد.'}>
        <Select value={contentId} onChange={(e) => setContentId(e.target.value)}>
          <option value="">اختر درساً…</option>
          {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
        </Select>
      </Field>
    </Dialog>
  );
}

function AwayDialog({ post, onClose, onDone }) {
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const submit = async () => {
    setBusy(true); setError(null);
    try { await post({ action: 'away', days: Number(days) }); onDone(); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <Dialog open onClose={onClose} title="وضع الغياب"
      description="أثناء غيابك تذهب المراجعة إلى القائد الآخر للمادة إن وُجد، وإلا فإلى المالك. يمكنك إنهاؤه متى عدت."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" onClick={submit} loading={busy}>ابدأ الغياب</Button>
      </>}>
      <Field label="المدة" error={error}>
        <Select value={days} onChange={(e) => setDays(e.target.value)}>
          {AWAY_DAYS.map((d) => <option key={d} value={d}>{daysLabel(d)}</option>)}
        </Select>
      </Field>
    </Dialog>
  );
}

function Announcements({ items, viewerId, post, onChange }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const canSend = useMemo(() => title.trim() && body.trim(), [title, body]);

  const send = async () => {
    setBusy(true); setError(null);
    try {
      await post({ action: 'announce', title: title.trim(), body: body.trim(), pinned });
      setTitle(''); setBody(''); setPinned(false);
      onChange();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Card title="إعلانات الفريق">
      <div className="flex flex-col gap-3">
        <p className="t-caption text-fg-subtle">يظهر الإعلان لكل أعضاء المادة في لوحتهم الرئيسية.</p>
        <Field label="العنوان"><Input value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="النص" error={error}><Textarea rows={3} value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} /></Field>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 t-label text-fg">
            <input type="checkbox" className="accent-accent" checked={pinned} onChange={(e) => setPinned(e.target.checked)} />
            ثبّته في الأعلى
          </label>
          <Button variant="primary" size="sm" onClick={send} loading={busy} disabled={!canSend}>انشر للفريق</Button>
        </div>

        {items.length > 0 && (
          <ul className="flex flex-col gap-2 mt-2">
            {items.map((a) => (
              <li key={a.id} className="flex items-start gap-3 p-3 rounded-control border border-line">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <strong className="t-ui text-fg-strong">{a.title}</strong>
                    {a.pinned && <Badge size="sm" tone="accent">مثبّت</Badge>}
                  </span>
                  <span className="read t-label text-fg-muted whitespace-pre-wrap">{a.body}</span>
                  <span className="t-caption text-fg-subtle">{a.authorName} · {formatRelative(a.createdAt)}</span>
                </div>
                {a.leadAuthorId === viewerId && (
                  <ConfirmButton variant="ghost" size="sm" tone="danger" confirmLabel="احذف" align="start"
                    title="حذف الإعلان؟" description="يختفي من لوحات أعضاء الفريق."
                    onConfirm={() => post({ action: 'unannounce', id: a.id }).then(onChange)}>
                    حذف
                  </ConfirmButton>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

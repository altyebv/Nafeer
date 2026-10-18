'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ConfirmButton, EmptyState, Field, Input, PageHeader, Segmented, Select, Textarea } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { CreateSurveyModal } from '../components/modals/CreateSurveyModal';
import { ScreenBody } from './AdminFrame';
import { Switch } from './SubjectPage';

// ─── Comms ────────────────────────────────────────────────────────────────────
// DS5 step 4 (canvas board AdComms): one composer — who it goes to, how — and
// one history across every channel. The app's switches sit beside it, in one
// panel instead of split between "publish" and "comms".
//
// Contributors: board announcement and/or email → POST /api/admin/comms/send
// Students:     in-app announcement → POST /api/admin/comms/announcements
//               top banner          → POST /api/content/flags { announcementBanner }

const CHANNELS = {
  contributors: [
    { id: 'board', label: 'لوحة المساهم', hint: 'إعلان عند الدخول' },
    { id: 'mail', label: 'بريد إلكتروني', hint: 'رسالة لكل شخص' },
  ],
  students: [
    { id: 'inapp', label: 'مركز التواصل في التطبيق', hint: 'يحتاج تفعيل المفتاح' },
    { id: 'banner', label: 'شريط أعلى التطبيق', hint: 'يحلّ محل الشريط الحالي' },
  ],
};

const FLAG_GROUPS = [
  { title: 'المحتوى في التطبيق', flags: [
    { key: 'feedEnabled', label: 'بطاقات التغذية', desc: 'المراجعة بالتكرار المتباعد' },
    { key: 'examModeEnabled', label: 'وضع الاختبار', desc: 'محاكاة الامتحان كاملاً' },
    { key: 'hotspotEnabled', label: 'أسئلة النقاط على الصورة', desc: 'تجريبي — غير مكتمل', warn: true },
  ] },
  { title: 'التواصل مع الطلاب', flags: [
    { key: 'commCenterEnabled', label: 'مركز التواصل', desc: 'الإعلانات والاستطلاعات في التطبيق' },
    { key: 'feedbackEnabled', label: 'نموذج الملاحظات', desc: 'يرسل الطالب رأيه' },
    { key: 'toursEnabled', label: 'الجولات التعريفية', desc: 'للمستخدم الجديد' },
  ] },
];

async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false || json.error) throw new Error(json.error || json.message || 'تعذّر الإرسال');
  return json;
}

export function CommsScreen({ allContributors }) {
  const [history, setHistory] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/comms/history');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setHistory(json.data); setError(null);
    } catch (e) { setError(e.message || 'تعذّر التحميل'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <ScreenBody>
      <PageHeader title="التواصل" description="رسالة واحدة، تختار لمن تذهب وكيف." />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_400px] items-start">
        <div className="flex flex-col gap-5 min-w-0">
          <Composer allContributors={allContributors} appReady={!!history?.app} onSent={load} />
          <History history={history} error={error} onRetry={load} />
        </div>
        <AppSettings app={history?.app} loaded={!!history} onSaved={load} />
      </div>
    </ScreenBody>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────
function Composer({ allContributors, appReady, onSent }) {
  const [audience, setAudience] = useState('contributors');
  const [scope, setScope] = useState({ kind: 'all' });
  const [channels, setChannels] = useState({ board: true, mail: false, inapp: true, banner: false });
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [reach, setReach] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [survey, setSurvey] = useState(false);

  const working = useMemo(() => allContributors.filter((c) => c.stage === 'approved'), [allContributors]);
  const subjects = useMemo(() => [...new Set(working.map((c) => c.subject).filter(Boolean))], [working]);
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    fetch('/api/admin/roles').then((r) => r.json()).then((d) => { if (d.ok) setRoles((d.roles || []).filter((r) => working.some((c) => c.roleId === r._id))); }).catch(() => {});
  }, [working]);

  // How many people the current contributor scope reaches (one small count).
  useEffect(() => {
    if (audience !== 'contributors') return;
    if ((scope.kind === 'subject' || scope.kind === 'role') && !scope.value) { setReach(null); return; }
    let live = true;
    const qs = new URLSearchParams({ kind: scope.kind, ...(scope.value ? { value: scope.value } : {}) });
    fetch(`/api/admin/comms/send?${qs}`).then((r) => r.json()).then((j) => { if (live && j.ok) setReach(j.reach); }).catch(() => {});
    return () => { live = false; };
  }, [audience, scope]);

  const chosen = CHANNELS[audience].filter((c) => channels[c.id]);
  const studentsBlocked = audience === 'students' && !appReady;
  const missing = !title.trim() ? 'اكتب عنواناً' : !body.trim() ? 'اكتب نص الرسالة' : !chosen.length ? 'اختر قناة واحدة على الأقل'
    : studentsBlocked ? 'Firebase غير مهيّأ في هذه البيئة' : audience === 'contributors' && !reach ? 'لا أحد في هذا الجمهور' : null;

  const reachLine = audience === 'contributors'
    ? (reach == null ? '…' : `يصل إلى ${reach} ${reach === 1 ? 'مساهم' : 'مساهمين'}${chosen.length ? ` عبر ${chosen.map((c) => c.label).join(' و')}` : ''}`)
    : chosen.length ? `يصل إلى طلاب بشير عبر ${chosen.map((c) => c.label).join(' و')}` : 'اختر قناة';

  const send = async () => {
    setBusy(true); setResult(null);
    try {
      const done = [];
      if (audience === 'contributors') {
        const j = await post('/api/admin/comms/send', { title, body, scope, channels: { board: channels.board, mail: channels.mail } });
        if (j.data.board) done.push('نُشر في لوحة المساهمين');
        if (j.data.mail) done.push(`أُرسل ${j.data.mail.sent} بريداً${j.data.mail.failed.length ? `، وفشل ${j.data.mail.failed.length} (${j.data.mail.failed.join('، ')})` : ''}`);
      } else {
        if (channels.inapp) {
          await post('/api/admin/comms/announcements', { title, body, segmentStudentPaths: scope.kind === 'all' ? [] : [scope.kind] });
          done.push('نُشر في مركز التواصل');
        }
        if (channels.banner) {
          await post('/api/content/flags', { announcementBanner: body.trim() });
          done.push('وُضع الشريط أعلى التطبيق');
        }
      }
      setResult({ ok: true, text: `${done.join(' · ')}.` });
      setTitle(''); setBody('');
      onSent();
    } catch (e) { setResult({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  const contributorScopes = [
    { id: 'all', label: `كل المساهمين · ${working.length}` },
    { id: 'subject', label: 'مادة' },
    { id: 'role', label: 'دور' },
    { id: 'idle', label: 'غير النشطين' },
  ];
  const studentScopes = [
    { id: 'all', label: 'كل الطلاب' },
    { id: 'SCIENCE', label: 'العلمي' },
    { id: 'LITERARY', label: 'الأدبي' },
  ];

  return (
    <Card tone="accent" title="رسالة جديدة"
      actions={audience === 'students' && <Button size="sm" variant="ghost" onClick={() => setSurvey(true)} disabled={!appReady}>استطلاع بدل رسالة…</Button>}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-x-4 gap-y-3 items-center">
          <span className="t-label text-fg-muted">إلى</span>
          <Segmented label="الجمهور" value={audience}
            onChange={(v) => { setAudience(v); setScope({ kind: 'all' }); setResult(null); }}
            items={[{ id: 'contributors', label: 'المساهمون' }, { id: 'students', label: 'طلاب بشير' }]} />

          <span className="t-label text-fg-muted">تحديداً</span>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="نطاق الجمهور" size="sm" value={scope.kind}
              onChange={(k) => setScope({ kind: k })}
              items={audience === 'contributors' ? contributorScopes : studentScopes} />
            {audience === 'contributors' && scope.kind === 'subject' && (
              <Select aria-label="المادة" value={scope.value || ''} onChange={(e) => setScope({ kind: 'subject', value: e.target.value })} className="h-8 w-40">
                <option value="" disabled>اختر مادة</option>
                {subjects.map((id) => <option key={id} value={id}>{SUBJECTS_BY_ID[id]?.nameAr || id}</option>)}
              </Select>
            )}
            {audience === 'contributors' && scope.kind === 'role' && (
              <Select aria-label="الدور" value={scope.value || ''} onChange={(e) => setScope({ kind: 'role', value: e.target.value })} className="h-8 w-44">
                <option value="" disabled>اختر دوراً</option>
                {roles.map((r) => <option key={r._id} value={r._id}>{r.nameAr || r.name || r.title}</option>)}
              </Select>
            )}
          </div>

          <span className="t-label text-fg-muted">عبر</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {CHANNELS[audience].map((c) => (
              <label key={c.id} className="inline-flex items-center gap-2 t-label text-fg cursor-pointer">
                <input type="checkbox" checked={!!channels[c.id]} onChange={(e) => setChannels((s) => ({ ...s, [c.id]: e.target.checked }))} className="w-4 h-4" />
                {c.label}
                <span className="t-caption text-fg-subtle">{c.hint}</span>
              </label>
            ))}
          </div>
        </div>

        <Field label="العنوان"><Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} /></Field>
        <Field label="الرسالة" hint={audience === 'students' && channels.banner ? 'الشريط يعرض هذا النص وحده، فاجعله قصيراً.' : undefined}>
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} />
        </Field>

        <div className="flex items-center justify-between gap-3 flex-wrap pt-3 border-t border-line">
          <span className="flex flex-col">
            <span className="t-label text-fg-muted">{reachLine}</span>
            {missing && <span className="t-caption text-fg-subtle">{missing}</span>}
          </span>
          <ConfirmButton variant="primary" size="md" tone="accent" confirmLabel="أرسل" label="أرسل"
            title="إرسال الرسالة؟" description={`${reachLine}. لا يمكن سحب البريد بعد إرساله.`}
            onConfirm={send} disabled={!!missing || busy} align="end">
            {busy ? 'جارٍ الإرسال…' : 'أرسل'}
          </ConfirmButton>
        </div>
        {result && <p role="status" className={`t-label ${result.ok ? 'text-success' : 'text-danger'}`}>{result.text}</p>}
      </div>
      {survey && <CreateSurveyModal onClose={() => setSurvey(false)} onCreated={onSent} />}
    </Card>
  );
}

// ─── History ──────────────────────────────────────────────────────────────────
const VIA = { board: 'لوحة المساهم', mail: 'بريد إلكتروني', app: 'التطبيق' };

function audienceLabel(item) {
  if (item.channel === 'app') return 'طلاب بشير';
  if (item.channel === 'mail') return `${item.sent + item.failed} شخص`;
  const a = item.audience;
  if (a.kind === 'all') return 'كل المساهمين';
  if (a.kind === 'subjects') return a.ids.map((id) => SUBJECTS_BY_ID[id]?.nameAr || id).join('، ');
  if (a.kind === 'people') return a.n === 1 ? 'شخص واحد' : `${a.n} أشخاص`;
  return `${a.n} فرق`;
}

function History({ history, error, onRetry }) {
  const remove = async (h) => {
    const url = h.channel === 'board' ? `/api/admin/announcement?id=${h.id}` : `/api/admin/comms/announcements/${h.id}`;
    await fetch(url, { method: 'DELETE' }).catch(() => {});
    onRetry();
  };
  if (!history) {
    return error
      ? <EmptyState title="تعذّر تحميل السجل" description={error} action={<Button onClick={onRetry}>أعد المحاولة</Button>} />
      : <Card><p className="t-body text-fg-subtle">جارٍ التحميل…</p></Card>;
  }
  return (
    <Card padding="none" className="overflow-hidden" title={<span className="px-4 pt-4 block">ما أُرسل</span>}>
      {!history.app && (
        <p className="mx-4 mb-3 p-3 rounded-control bg-info-surface t-caption text-fg">
          إعلانات التطبيق واستطلاعاته تُقرأ من Firebase، وهو غير مهيّأ في هذه البيئة — لا تظهر هنا.
        </p>
      )}
      {history.items.length === 0 ? <EmptyState variant="plain" title="لم يُرسل شيء بعد" /> : (
        <ul>
          {history.items.map((h) => (
            <li key={h.id} className="grid grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_130px_120px_120px] gap-x-3 gap-y-1 items-center px-4 py-3 border-t border-line">
              <span className="flex flex-col min-w-0">
                <span dir="auto" className="t-ui text-fg-strong truncate">{h.title}</span>
                <span className="t-caption text-fg-subtle">{formatDate(h.at, 'shortDateTime')}</span>
              </span>
              <span className="t-caption text-fg-muted">{audienceLabel(h)}</span>
              <span className="t-caption text-fg-muted">{VIA[h.channel]}{h.banner ? ' · شريط' : ''}</span>
              <span className="flex items-center gap-1">{h.channel === 'mail' && h.failed
                ? <Badge tone="warn" size="sm">{h.failed} فشل</Badge>
                : <Badge tone="success" size="sm">{h.channel === 'mail' ? 'أُرسل' : 'منشور'}</Badge>}
                {h.channel !== 'mail' && (
                  <ConfirmButton variant="ghost" size="sm" align="end" label={`احذف «${h.title}»`} title={`حذف «${h.title}»؟`}
                    description="يختفي من حيث نُشر. لا يمكن التراجع." onConfirm={() => remove(h)}>×</ConfirmButton>
                )}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// ─── App settings ─────────────────────────────────────────────────────────────
function AppSettings({ app, loaded, onSaved }) {
  const [draft, setDraft] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const flags = { ...(app?.flags || {}), ...draft };
  const dirty = Object.keys(draft).length > 0;
  const banner = app?.flags?.announcementBanner;

  const save = async (updates = draft) => {
    setBusy(true); setError(null);
    try { await post('/api/content/flags', updates); setDraft({}); onSaved(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Card title="إعدادات تطبيق بشير" as="aside">
      <div className="flex flex-col gap-4">
        <p className="t-caption text-fg-subtle">مكان واحد لكل المفاتيح. تصل التغييرات للطلاب عند فتح التطبيق.</p>
        {loaded && !app && (
          <p className="p-3 rounded-control bg-info-surface t-caption text-fg">
            القيم الحالية لا تُقرأ: Firebase غير مهيّأ في هذه البيئة، فالمفاتيح معطّلة هنا.
          </p>
        )}
        {FLAG_GROUPS.map((g) => (
          <div key={g.title} className="flex flex-col gap-3 pt-3 border-t border-line">
            <h3 className="t-caption font-semibold text-fg-subtle">{g.title}</h3>
            {g.flags.map((f) => (
              <div key={f.key} className="flex items-center justify-between gap-3">
                <span className="flex flex-col">
                  <span id={`flag-${f.key}`} className={`t-ui ${f.warn ? 'text-warn' : 'text-fg'}`}>{f.label}</span>
                  <span className="t-caption text-fg-subtle">{f.desc}</span>
                </span>
                <Switch labelledBy={`flag-${f.key}`} on={!!flags[f.key]} disabled={!app || busy}
                  onChange={(v) => setDraft((d) => (v === !!app.flags[f.key] ? (({ [f.key]: _, ...rest }) => rest)(d) : { ...d, [f.key]: v }))} />
              </div>
            ))}
          </div>
        ))}
        {banner && (
          <div className="flex flex-col gap-2 pt-3 border-t border-line">
            <h3 className="t-caption font-semibold text-fg-subtle">الشريط الظاهر الآن</h3>
            <p dir="auto" className="t-label text-fg">{banner}</p>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => save({ announcementBanner: null })} className="self-start">أزل الشريط</Button>
          </div>
        )}
        <p className="t-caption text-fg-muted pt-3 border-t border-line">«المواد الظاهرة» في صفحة كل مادة، و«الشريط» قناة في الرسالة الجديدة.</p>
        {error && <p role="alert" className="t-caption text-danger">{error}</p>}
        <Button variant={dirty ? 'primary' : 'secondary'} block disabled={!dirty || busy} loading={busy} onClick={() => save()}>
          {dirty ? `احفظ ${Object.keys(draft).length} تغيير` : 'لا تغييرات'}
        </Button>
      </div>
    </Card>
  );
}

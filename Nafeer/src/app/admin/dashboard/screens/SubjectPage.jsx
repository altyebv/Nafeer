'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, Plus, Pencil, ArrowUpRight } from 'lucide-react';
import {
  Badge, Button, Card, ConfirmButton, EmptyState, Input, PageHeader, Segmented, Select, Stat,
} from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_CATALOG, TRACK_CONFIG } from '@/shared/curriculum';
import { ScreenBody } from './AdminFrame';

// ─── Subject page ─────────────────────────────────────────────────────────────
// One page per subject (DS5 step 1, canvas board AdSubject): the unit/lesson
// tree with live coverage, one publish action, and the subject's settings.
// Loads with one request (GET /api/admin/subjects/[id]).

const STATUS = {
  draft:    { label: 'مسودة',  tone: 'neutral' },
  review:   { label: 'مراجعة', tone: 'info' },
  approved: { label: 'معتمد',  tone: 'success' },
  archived: { label: 'مؤرشف',  tone: 'neutral' },
};

// Seeded unit names are placeholders until someone types the book's own.
const PLACEHOLDER_UNIT = /^الوحدة\s/;
const PLACEHOLDER_LESSON = /^الدرس\s*\d+$/;

const PUBLISH_MODES = [
  { id: 'delta', label: 'ما تغيّر فقط', hint: 'الافتراضي. يرسل الدروس المعتمدة الجديدة أو المعدّلة منذ آخر نشر، فيحمّل الطلاب الفرق فقط.' },
  { id: 'major', label: 'إصدار جديد للمادة', hint: 'حين تتغيّر الوحدات أو ترتيبها. يحمّل الطلاب المادة كاملة مرة واحدة.' },
  { id: 'full',  label: 'إعادة بناء من الصفر', hint: 'للإصلاح فقط: يتجاهل ما نُشر سابقاً ويعيد بناء الحزمة كلها.' },
];

async function api(url, options) {
  const res = await fetch(url, options && {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body && JSON.stringify(options.body),
  });
  if (res.status === 401) { window.location.href = '/admin/login'; return null; }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.ok === false) throw new Error(json.error || json.message || 'تعذّر الاتصال بالخادم');
  return json;
}

export function SubjectPage({ subjectId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const json = await api(`/api/admin/subjects/${encodeURIComponent(subjectId)}`);
      if (json) { setData(json.data); setError(null); }
    } catch (e) { setError(e.message); }
  }, [subjectId]);

  useEffect(() => { setData(null); load(); }, [load]);

  const track = data?.track ? TRACK_CONFIG[data.track]?.label || data.track : null;

  return (
    <ScreenBody>
      <PageHeader
        breadcrumb={[{ label: 'المواد', href: '/admin/dashboard#subjects' }, ...(track ? [{ label: track }] : []), { label: data?.nameAr || subjectId }]}
        title={data?.nameAr || '…'}
        description={data && summaryLine(data)}
        actions={
          <Select
            aria-label="بدّل المادة"
            value={subjectId}
            onChange={(e) => router.push(`/admin/dashboard/subjects/${e.target.value}`)}
            className="w-44"
          >
            {SUBJECTS_CATALOG.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
          </Select>
        }
      />

      {error && !data && (
        <EmptyState title="تعذّر تحميل المادة" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} className="mt-6" />
      )}
      {!data && !error && <p className="mt-6 t-body text-fg-subtle">جارٍ التحميل…</p>}

      {data && !data.seeded && <Unseeded subject={data} onDone={load} />}
      {data?.seeded && (
        <div className="flex flex-col gap-5 mt-2">
          <Headline data={data} />
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px] items-start">
            <Tree data={data} setData={setData} />
            <aside className="flex flex-col gap-4">
              <PublishCard data={data} onPublished={load} />
              <SettingsCard data={data} setData={setData} />
              <Maintenance data={data} onDone={load} />
            </aside>
          </div>
        </div>
      )}
    </ScreenBody>
  );
}

function summaryLine(d) {
  const people = d.people.length
    ? `${d.people.length === 1 ? 'المساهم' : 'المساهمون'}: ${d.people.map((p) => p.name).join('، ')}`
    : 'لا مساهم معيّن';
  return `${d.counts.units} وحدات · ${d.counts.lessons} درساً · ${d.counts.concepts} مفهوم · ${d.counts.media} وسائط · ${people}`;
}

// ─── Headline numbers ─────────────────────────────────────────────────────────
function Headline({ data }) {
  const lessons = data.units.flatMap((u) => u.lessons);
  const withContent = lessons.filter((l) => l.sections > 0).length;
  const unnamed = data.units.filter((u) => PLACEHOLDER_UNIT.test(u.title)).length;
  const publish = data.publish;
  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <Stat tone="raised" value={`${withContent} من ${lessons.length}`} label="درس فيه محتوى" />
      <Stat tone="raised" value={`${unnamed} من ${data.units.length}`} label="وحدات بلا اسم من الكتاب"
        hint={unnamed ? 'انقر اسم الوحدة لتسميتها' : undefined} hintTone={unnamed ? 'warn' : 'subtle'} />
      <Stat tone="raised" value={data.counts.status.review || 0} label="بانتظار المراجعة" />
      <Stat tone="raised"
        value={publish == null ? 'غير معروف' : publish.version ? `إصدار ${publish.version}` : 'لم تُنشر'}
        label={publish == null ? 'Firebase غير مهيّأ محلياً' : publish.publishedAt ? `آخر نشر ${formatDate(publish.publishedAt, 'short')}` : 'لا نسخة في بشير بعد'} />
    </div>
  );
}

// ─── Unit / lesson tree ───────────────────────────────────────────────────────
const FILTERS = [
  { id: 'all', label: 'الكل' },
  { id: 'content', label: 'فيها محتوى' },
  { id: 'empty', label: 'فارغة' },
  { id: 'review', label: 'بانتظار المراجعة' },
];

function Tree({ data, setData }) {
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(() => new Set([data.units[0]?.id]));
  const [addingUnit, setAddingUnit] = useState(false);

  const keep = (l) => filter === 'all'
    || (filter === 'content' && l.sections > 0)
    || (filter === 'empty' && l.sections === 0)
    || (filter === 'review' && l.status === 'review');

  const counts = useMemo(() => {
    const all = data.units.flatMap((u) => u.lessons);
    return { all: all.length, content: all.filter((l) => l.sections > 0).length, empty: all.filter((l) => !l.sections).length, review: all.filter((l) => l.status === 'review').length };
  }, [data]);

  const toggle = (id) => setOpen((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const renameUnit = async (unit, title) => {
    await api(`/api/admin/curriculum/units/${unit.mongoId}`, { method: 'PATCH', body: { title } });
    setData((d) => ({ ...d, units: d.units.map((u) => (u.id === unit.id ? { ...u, title } : u)) }));
  };

  const addLesson = async (unit, title) => {
    const order = Math.max(0, ...data.units.flatMap((u) => u.lessons.map((l) => Number(l.id.match(/_L(\d+)$/)?.[1]) || 0))) + 1;
    const suffix = unit.id.split('_').pop();
    const json = await api('/api/admin/curriculum/lessons', {
      method: 'POST',
      body: { subjectId: data.id, unitContentId: unit.id, contentId: `${data.id}_${suffix}_L${order}`, title, order, estimatedMinutes: 15 },
    });
    const l = json.lesson;
    const row = { id: l.contentId, mongoId: String(l._id), title: l.title, status: l.status || 'draft', returned: false, hasSummary: false, sections: 0, blocks: 0, questions: 0, feed: 0 };
    setData((d) => ({ ...d, units: d.units.map((u) => (u.id === unit.id ? { ...u, lessons: [...u.lessons, row] } : u)) }));
  };

  const addUnit = async (title) => {
    const json = await api('/api/admin/curriculum/units', { method: 'POST', body: { subjectId: data.id, title } });
    const u = json.unit;
    setData((d) => ({ ...d, units: [...d.units, { id: u.contentId, mongoId: String(u._id), title: u.title, lessons: [] }] }));
    setAddingUnit(false);
  };

  const filtering = filter !== 'all';
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 flex-wrap px-4 py-3 border-b border-line">
        <Segmented label="تصفية الدروس" size="sm" value={filter} onChange={setFilter}
          items={FILTERS.map((f) => ({ ...f, label: `${f.label} · ${counts[f.id]}` }))} />
        <Button size="sm" icon={Plus} onClick={() => setAddingUnit(true)}>وحدة</Button>
      </div>

      <div role="table" aria-label="المنهج والتغطية">
        <div role="row" className={`${ROW} gap-2 px-4 py-2 t-caption text-fg-subtle border-b border-line`}>
          <span role="columnheader">الوحدة / الدرس</span>
          <span role="columnheader" className="hidden md:block">أقسام</span><span role="columnheader" className="hidden md:block">عناصر</span>
          <span role="columnheader" className="hidden md:block">أسئلة</span><span role="columnheader" className="hidden md:block">بطاقات</span>
          <span role="columnheader">الحالة</span><span role="columnheader"><span className="sr-only">فتح</span></span>
        </div>

        {data.units.map((unit) => {
          const lessons = unit.lessons.filter(keep);
          if (filtering && !lessons.length) return null;
          const isOpen = filtering || open.has(unit.id);
          return (
            <UnitRows key={unit.id} subjectId={data.id} unit={unit} lessons={lessons} open={isOpen} canAdd={!filtering}
              onToggle={() => toggle(unit.id)} onRename={(t) => renameUnit(unit, t)} onAddLesson={(t) => addLesson(unit, t)} />
          );
        })}

        {addingUnit && (
          <div className="px-4 py-3 border-t border-line">
            <InlineText placeholder="اسم الوحدة كما في الكتاب" onSave={addUnit} onCancel={() => setAddingUnit(false)} />
          </div>
        )}
      </div>

      <p className="px-4 py-3 t-caption text-fg-subtle border-t border-line">
        الأرقام تُحسب من المحتوى المحفوظ الآن. «افتح» ينقل الدرس إلى المحرر على رابطه الخاص.
      </p>
    </Card>
  );
}

const sum = (lessons, k) => lessons.reduce((n, l) => n + l[k], 0);

// Below md the four count columns fold into one line under the title.
const ROW = 'grid grid-cols-[minmax(0,1fr)_84px_52px] md:grid-cols-[minmax(0,1fr)_repeat(4,56px)_96px_64px]';
const counts = (x) => `${x.sections} أقسام · ${x.blocks} عناصر · ${x.questions} أسئلة · ${x.feed} بطاقات`;

function UnitRows({ subjectId, unit, lessons, open, canAdd, onToggle, onRename, onAddLesson }) {
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const placeholder = PLACEHOLDER_UNIT.test(unit.title);
  const started = unit.lessons.filter((l) => l.sections > 0).length;
  const Chevron = open ? ChevronDown : ChevronLeft;

  return (
    <div role="rowgroup" className="border-b border-line last:border-b-0">
      <div role="row" className={`${ROW} gap-2 items-center px-4 py-2.5 bg-sunken`}>
        <span role="cell" className="flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
          <button type="button" onClick={onToggle} aria-expanded={open} aria-label={open ? 'طيّ الوحدة' : 'افتح الوحدة'}
            className="w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-control text-fg-muted hover:bg-hover touch-target">
            <Chevron size={16} />
          </button>
          {editing ? (
            <InlineText initial={placeholder ? '' : unit.title} placeholder="اسم الوحدة كما في الكتاب"
              onSave={async (t) => { await onRename(t); setEditing(false); }} onCancel={() => setEditing(false)} />
          ) : (
            <>
              <button type="button" onClick={() => setEditing(true)} title="انقر لتسمية الوحدة"
                className="group inline-flex items-center gap-1.5 text-start t-ui font-semibold text-fg-strong hover:text-fg-accent">
                <span>{unit.title}</span>
                <Pencil size={13} className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 text-fg-subtle" />
              </button>
              {placeholder && <Badge tone="warn" size="sm">بلا اسم من الكتاب</Badge>}
              <span className="t-caption text-fg-subtle whitespace-nowrap">{unit.lessons.length} دروس</span>
            </>
          )}
        </span>
        <Num n={sum(unit.lessons, 'sections')} muted /><Num n={sum(unit.lessons, 'blocks')} muted />
        <Num n={sum(unit.lessons, 'questions')} muted /><Num n={sum(unit.lessons, 'feed')} muted />
        <span role="cell" className="t-caption text-fg-subtle">{started ? `${started} من ${unit.lessons.length} بدأ` : 'فارغة'}</span>
        <span role="cell" />
      </div>

      {open && lessons.map((l) => (
        <div role="row" key={l.id} className={`${ROW} gap-2 items-center px-4 py-2 border-t border-line`}>
          <span role="cell" className="flex items-center gap-x-2 flex-wrap ps-9 min-w-0">
            <span className="t-body text-fg truncate">{l.title}</span>
            {l.returned && <Badge tone="warn" size="sm">أُعيد بتعليقات</Badge>}
            {!l.sections && PLACEHOLDER_LESSON.test(l.title) && <span className="t-caption text-fg-subtle">بلا عنوان</span>}
            {l.sections > 0 && !l.hasSummary && <span className="t-caption text-fg-subtle">لا ملخّص بعد</span>}
            {l.sections > 0 && <span className="md:hidden basis-full t-caption text-fg-muted">{counts(l)}</span>}
          </span>
          <Num n={l.sections} /><Num n={l.blocks} /><Num n={l.questions} /><Num n={l.feed} />
          <span role="cell"><Badge tone={STATUS[l.status]?.tone || 'neutral'} size="sm">{STATUS[l.status]?.label || l.status}</Badge></span>
          <span role="cell">
            <Link href={`/admin/dashboard/subjects/${subjectId}/lessons/${l.id}`}
              className="inline-flex items-center gap-1 t-label text-fg-accent hover:underline">
              افتح <ArrowUpRight size={13} />
            </Link>
          </span>
        </div>
      ))}

      {open && canAdd && (
        <div className="px-4 py-2 border-t border-line ps-[3.25rem]">
          {adding
            ? <InlineText placeholder="عنوان الدرس" onSave={async (t) => { await onAddLesson(t); setAdding(false); }} onCancel={() => setAdding(false)} />
            : <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 t-label text-fg-muted hover:text-fg">
                <Plus size={13} /> درس في هذه الوحدة
              </button>}
        </div>
      )}
    </div>
  );
}

function Num({ n, muted }) {
  return (
    <span role="cell" className={`hidden md:block t-label tabular-nums ${n ? (muted ? 'text-fg-muted' : 'text-fg-strong') : 'text-fg-subtle'}`}>
      {n || '—'}
    </span>
  );
}

// A one-line editor: Enter saves, Escape cancels.
function InlineText({ initial = '', placeholder, onSave, onCancel }) {
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const save = async () => {
    const t = value.trim();
    if (!t) { setError('لا يمكن أن يكون فارغاً'); return; }
    setBusy(true); setError(null);
    try { await onSave(t); } catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <span className="flex items-center gap-2 flex-wrap min-w-0">
      <Input autoFocus value={value} placeholder={placeholder} disabled={busy} aria-label={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') onCancel(); }}
        className="h-8 w-64 max-w-full" />
      <Button size="sm" variant="primary" loading={busy} onClick={save}>حفظ</Button>
      <Button size="sm" variant="ghost" onClick={onCancel} disabled={busy}>إلغاء</Button>
      {error && <span className="t-caption text-danger">{error}</span>}
    </span>
  );
}

// ─── Publish ──────────────────────────────────────────────────────────────────
function PublishCard({ data, onPublished }) {
  const [advanced, setAdvanced] = useState(false);
  const [mode, setMode] = useState('delta');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const approved = data.counts.status.approved || 0;
  const unknown = data.publish == null;

  const publish = async () => {
    setBusy(true); setResult(null);
    try {
      await api('/api/content/publish', {
        method: 'POST',
        body: { subjectId: data.id, mode: mode === 'full' ? 'full' : 'delta', ...(mode === 'major' ? { bump: 'major' } : {}) },
      });
      setResult({ ok: true, text: 'نُشرت. يصل التحديث للطلاب عند فتح التطبيق.' });
      onPublished();
    } catch (e) { setResult({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  const reason = unknown ? 'Firebase غير مهيّأ في هذه البيئة' : !approved ? 'لا دروس معتمدة' : null;
  return (
    <Card tone="accent" title="النشر إلى بشير"
      actions={<span className="t-caption text-fg-subtle">{data.publish?.publishedAt ? `آخر نشر ${formatRelative(data.publish.publishedAt)}` : unknown ? '' : 'آخر نشر: أبداً'}</span>}>
      <div className="flex flex-col gap-3">
        <p className="t-body text-fg-muted">
          يُرسل الدروس المعتمدة فقط. {approved} من {data.counts.lessons} معتمد الآن{reason ? '، فالزر معطّل ويقول لماذا.' : '.'}
        </p>
        <Button variant="primary" block loading={busy} disabled={!!reason} onClick={publish}>
          {reason ? `انشر ${data.nameAr} · ${reason}` : `انشر ${data.nameAr}`}
        </Button>
        {result && <p role="status" className={`t-label ${result.ok ? 'text-success' : 'text-danger'}`}>{result.text}</p>}
        <button type="button" aria-expanded={advanced} onClick={() => setAdvanced((v) => !v)}
          className="self-start t-label text-fg-accent hover:underline">
          {advanced ? 'إخفاء الخيارات المتقدمة' : 'خيارات متقدمة'}
        </button>
        {advanced && (
          <div role="radiogroup" aria-label="طريقة النشر" className="flex flex-col gap-2">
            {PUBLISH_MODES.map((m) => (
              <label key={m.id} className={`flex gap-3 p-3 rounded-control border cursor-pointer ${mode === m.id ? 'border-line-accent bg-selected' : 'border-line hover:bg-hover'}`}>
                <input type="radio" name="publish-mode" value={m.id} checked={mode === m.id} onChange={() => setMode(m.id)} className="mt-1" />
                <span className="flex flex-col gap-0.5">
                  <span className="t-label font-semibold text-fg-strong">{m.label}</span>
                  <span className="t-caption text-fg-muted">{m.hint}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function SettingsCard({ data, setData }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const s = data.settings;

  const patch = async (key, value) => {
    setBusy(key); setError(null);
    try {
      await api(`/api/admin/subjects/${data.id}`, { method: 'PATCH', body: { [key]: value } });
      setData((d) => ({ ...d, settings: { ...d.settings, [key]: value } }));
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  };

  return (
    <Card title="إعدادات المادة">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span id="vis-label" className="t-ui text-fg">ظاهرة للطلاب</span>
            <span className="t-caption text-fg-subtle">
              {s.visible == null ? 'غير معروف — Firebase غير مهيّأ محلياً' : s.visible ? 'تظهر في بشير' : 'مخفية عن الطلاب'}
            </span>
          </span>
          <Switch labelledBy="vis-label" on={!!s.visible} disabled={s.visible == null || busy === 'visible'} onChange={(v) => patch('visible', v)} />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="flex flex-col">
            <span className="t-ui text-fg">ترميز المعادلات</span>
            <span className="t-caption text-fg-subtle">كيف تُكتب الرموز في هذه المادة</span>
          </span>
          <Segmented label="ترميز المعادلات" size="sm" value={s.mathNotation}
            onChange={(v) => v !== s.mathNotation && patch('mathNotation', v)}
            items={[{ id: 'ARABIC', label: 'عربية' }, { id: 'LATIN', label: 'لاتينية' }]} />
        </div>
        {error && <p role="alert" className="t-caption text-danger">{error}</p>}
      </div>
    </Card>
  );
}

export function Switch({ on, onChange, disabled, labelledBy }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-labelledby={labelledBy} disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative w-10 h-6 shrink-0 rounded-chip transition-colors touch-target disabled:opacity-50 disabled:cursor-not-allowed ${on ? 'bg-accent' : 'bg-hover border border-line-strong'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-chip transition-all ${on ? 'start-5 bg-fg-on-accent' : 'start-1 bg-fg-subtle'}`} />
    </button>
  );
}

// ─── Maintenance ──────────────────────────────────────────────────────────────
function Maintenance({ data, onDone }) {
  const [msg, setMsg] = useState(null);

  const complete = async () => {
    setMsg(null);
    try {
      await api('/api/admin/seed', { method: 'POST', body: { action: 'bootstrap', subjectId: data.id } });
      setMsg({ ok: true, text: 'اكتمل. أُضيف ما كان ناقصاً من المنهج.' });
      onDone();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
  };
  const restore = async () => {
    setMsg(null);
    try {
      await api('/api/admin/remote-subjects/import', { method: 'POST', body: { subjectId: data.id, force: true } });
      setMsg({ ok: true, text: 'استُرجع المحتوى من آخر نسخة منشورة.' });
      onDone();
    } catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  const canRestore = !!data.publish?.version;
  return (
    <section aria-label="صيانة" className="flex flex-col gap-3 p-4 rounded-card border border-dashed border-line-strong">
      <span className="t-caption font-semibold text-fg-subtle">صيانة · نادراً ما تحتاجها</span>
      <div className="flex items-center justify-between gap-3">
        <span className="t-label text-fg-muted">أكمل الوحدات والدروس الناقصة من المنهج، دون لمس ما كُتب</span>
        <ConfirmButton variant="secondary" tone="accent" confirmLabel="أكمل" title="أكمل المادة من المنهج؟"
          description="يضيف الوحدات والدروس الناقصة فقط. لا يُحذف ولا يُعدَّل شيء موجود." onConfirm={complete}>
          أكمل
        </ConfirmButton>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="t-label text-fg-muted">استبدل محتوى المادة بآخر نسخة منشورة في بشير</span>
        {canRestore ? (
          <ConfirmButton variant="secondary" confirmLabel="استرجع" title="استرجاع من النسخة المنشورة؟"
            description="يحذف محتوى المادة هنا ويستبدله بما في آخر نسخة منشورة. ما لم يُنشر سيضيع." onConfirm={restore}>
            استرجع
          </ConfirmButton>
        ) : <span className="t-caption text-fg-subtle whitespace-nowrap">لا نسخة منشورة</span>}
      </div>
      {msg && <p role="status" className={`t-caption ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
    </section>
  );
}

// ─── Not in the database yet ──────────────────────────────────────────────────
function Unseeded({ subject, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const seed = async () => {
    setBusy(true); setError(null);
    try { await api('/api/admin/seed', { method: 'POST', body: { action: 'bootstrap', subjectId: subject.id } }); onDone(); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <EmptyState className="mt-6" title={`${subject.nameAr} في المنهج وليست في قاعدة البيانات`}
      description={error || 'ابذرها لتُنشأ وحداتها ودروسها من المنهج، ثم يمكن إسنادها لمساهم.'}
      action={<Button variant="primary" loading={busy} onClick={seed}>ابذرها من المنهج</Button>} />
  );
}

'use client';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronLeft, Plus, Pencil, ArrowUpRight, BookOpen } from 'lucide-react';
import {
  Badge, Button, Card, Dialog, EmptyState, Input, PageHeader, Segmented, Select, Stat,
} from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_CATALOG, TRACK_CONFIG } from '@/shared/curriculum';
import { parseTarget, MAX_TARGET } from '@/lib/unitTarget';
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

      {data && !data.seeded && <Unopened subject={data} onDone={load} />}
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

  const setTarget = async (unit, text) => {
    const targetLessons = parseTarget(text);
    if (targetLessons == null) throw new Error(`اكتب عدداً صحيحاً من 0 إلى ${MAX_TARGET}`);
    await api(`/api/admin/curriculum/units/${unit.mongoId}`, { method: 'PATCH', body: { targetLessons } });
    setData((d) => ({ ...d, units: d.units.map((u) => (u.id === unit.id ? { ...u, targetLessons } : u)) }));
  };

  // A unit joins a book ({ id }), starts one ({ title }) or leaves it (null).
  // The server renumbers the book; the same numbering is redone here.
  const setBook = async (unit, book) => {
    const json = await api(`/api/admin/curriculum/units/${unit.mongoId}`, { method: 'PATCH', body: { book } });
    const { bookId, bookTitle } = json.unit;
    setData((d) => ({ ...d, units: withBookOrder(d.units.map((u) => (u.id === unit.id ? { ...u, bookId, bookTitle } : u))) }));
  };

  const renameBook = async (bookId, title) => {
    await api('/api/admin/curriculum/books', { method: 'PATCH', body: { subjectId: data.id, bookId, title } });
    setData((d) => ({ ...d, units: d.units.map((u) => (u.bookId === bookId ? { ...u, bookTitle: title } : u)) }));
  };

  const books = useMemo(() => {
    const seen = new Map();
    for (const u of data.units) if (u.bookId && !seen.has(u.bookId)) seen.set(u.bookId, u.bookTitle || u.bookId);
    return [...seen].map(([id, title]) => ({ id, title }));
  }, [data.units]);

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
    setData((d) => ({ ...d, units: [...d.units, { id: u.contentId, mongoId: String(u._id), title: u.title, targetLessons: null, bookId: null, bookTitle: null, bookOrder: null, lessons: [] }] }));
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

        {data.units.map((unit, i) => {
          const lessons = unit.lessons.filter(keep);
          if (filtering && !lessons.length) return null;
          const isOpen = filtering || open.has(unit.id);
          const startsBook = unit.bookId && unit.bookId !== data.units[i - 1]?.bookId;
          return (
            <Fragment key={unit.id}>
              {startsBook && <BookDivider title={unit.bookTitle || unit.bookId} onRename={(t) => renameBook(unit.bookId, t)} />}
              <UnitRows subjectId={data.id} unit={unit} lessons={lessons} open={isOpen} canAdd={!filtering} books={books}
                onToggle={() => toggle(unit.id)} onRename={(t) => renameUnit(unit, t)} onSetTarget={(t) => setTarget(unit, t)}
                onSetBook={(b) => setBook(unit, b)} onAddLesson={(t) => addLesson(unit, t)} />
            </Fragment>
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

// Each unit's position in its book, by unit order — as lib/api/subject.js
// renumberBooks stores it.
function withBookOrder(units) {
  const next = {};
  return units.map((u) => ({ ...u, bookOrder: u.bookId ? (next[u.bookId] = (next[u.bookId] || 0) + 1) : null }));
}

// A divider where a new textbook starts, as the app and the editor draw it.
function BookDivider({ title, onRename }) {
  const [editing, setEditing] = useState(false);
  return (
    <div role="row" className="flex items-center gap-2 px-4 py-2 border-b border-line bg-raised">
      <span role="cell" className="flex items-center gap-2 min-w-0">
        <BookOpen size={15} className="shrink-0 text-fg-accent" aria-hidden="true" />
        {editing ? (
          <InlineText initial={title} placeholder="اسم الكتاب"
            onSave={async (t) => { await onRename(t); setEditing(false); }} onCancel={() => setEditing(false)} />
        ) : (
          <button type="button" onClick={() => setEditing(true)} title="انقر لتغيير اسم الكتاب"
            className="group inline-flex items-center gap-1.5 t-label font-semibold text-fg-accent">
            <span>كتاب: {title}</span>
            <Pencil size={12} className="shrink-0 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" />
          </button>
        )}
      </span>
    </div>
  );
}

// Which book a unit belongs to: none, an existing one, or a new one by name.
function BookPicker({ unit, books, onSetBook }) {
  const [naming, setNaming] = useState(false);
  const [error, setError] = useState(null);
  if (naming) {
    return (
      <InlineText placeholder="اسم الكتاب الجديد"
        onSave={async (t) => { await onSetBook({ title: t }); setNaming(false); }} onCancel={() => setNaming(false)} />
    );
  }
  const choose = async (value) => {
    setError(null);
    if (value === '__new') { setNaming(true); return; }
    try { await onSetBook(value ? { id: value } : null); } catch (e) { setError(e.message); }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <Select aria-label={`كتاب ${unit.title}`} value={unit.bookId || ''} onChange={(e) => choose(e.target.value)}
        className="h-8 w-40 t-caption">
        <option value="">بلا كتاب</option>
        {books.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
        <option value="__new">كتاب جديد…</option>
      </Select>
      {error && <span className="t-caption text-danger">{error}</span>}
    </span>
  );
}

// Below md the four count columns fold into one line under the title.
const ROW = 'grid grid-cols-[minmax(0,1fr)_84px_52px] md:grid-cols-[minmax(0,1fr)_repeat(4,56px)_96px_64px]';
const counts = (x) => `${x.sections} أقسام · ${x.blocks} عناصر · ${x.questions} أسئلة · ${x.feed} بطاقات`;

function UnitRows({ subjectId, unit, lessons, open, canAdd, books, onToggle, onRename, onSetTarget, onSetBook, onAddLesson }) {
  const [editing, setEditing] = useState(false);
  const [editingTarget, setEditingTarget] = useState(false);
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
              {!editingTarget && (
                <button type="button" onClick={() => setEditingTarget(true)} title="انقر لتحديد عدد دروس الوحدة في الكتاب"
                  className="t-caption text-fg-subtle hover:text-fg-accent whitespace-nowrap">
                  {unit.targetLessons == null
                    ? `${unit.lessons.length} دروس · حدّد عدد دروس الكتاب`
                    : `${unit.lessons.length} من ${unit.targetLessons} دروس`}
                </button>
              )}
            </>
          )}
          {editingTarget && (
            <InlineText initial={unit.targetLessons == null ? '' : String(unit.targetLessons)} placeholder="عدد دروس الوحدة في الكتاب"
              onSave={async (t) => { await onSetTarget(t); setEditingTarget(false); }} onCancel={() => setEditingTarget(false)} />
          )}
          {!editing && !editingTarget && <BookPicker unit={unit} books={books} onSetBook={onSetBook} />}
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
  const [restoring, setRestoring] = useState(false);

  const canRestore = !!data.publish?.version;
  return (
    <section aria-label="صيانة" className="flex flex-col gap-3 p-4 rounded-card border border-dashed border-line-strong">
      <span className="t-caption font-semibold text-fg-subtle">صيانة · نادراً ما تحتاجها</span>
      <div className="flex items-center justify-between gap-3">
        <span className="t-label text-fg-muted">استبدل محتوى المادة بآخر نسخة منشورة في بشير</span>
        {canRestore
          ? <Button size="sm" variant="secondary" onClick={() => { setMsg(null); setRestoring(true); }}>استرجع</Button>
          : <span className="t-caption text-fg-subtle whitespace-nowrap">لا نسخة منشورة</span>}
      </div>
      {msg && <p role="status" className={`t-caption ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</p>}
      {restoring && (
        <RestoreDialog subjectId={data.id} onClose={() => setRestoring(false)}
          onRestored={() => { setRestoring(false); setMsg({ ok: true, text: 'استُرجع المحتوى من آخر نسخة منشورة.' }); onDone(); }} />
      )}
    </section>
  );
}

// Shows what a restore would throw away before it runs (lib/restoreSubject.js
// unpublishedWork). With anything to lose, the owner ticks a box first.
const OTHER_LABELS = { Unit: 'وحدة', Concept: 'مفهوم', Tag: 'وسم', FeedItem: 'بطاقة', Question: 'سؤال', Exam: 'امتحان' };

function RestoreDialog({ subjectId, onClose, onRestored }) {
  const [loss, setLoss] = useState(null);
  const [error, setError] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/admin/remote-subjects/import?subjectId=${encodeURIComponent(subjectId)}`)
      .then((json) => json && setLoss(json.data))
      .catch((e) => setError(e.message));
  }, [subjectId]);

  const restore = async () => {
    setBusy(true); setError(null);
    try {
      await api('/api/admin/remote-subjects/import', { method: 'POST', body: { subjectId, acceptLoss: accepted } });
      onRestored();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  const others = loss ? Object.entries(loss.other) : [];
  return (
    <Dialog open onClose={busy ? () => {} : onClose} title="استرجاع من النسخة المنشورة؟"
      description="يستبدل محتوى المادة هنا بآخر نسخة منشورة في بشير، دفعة واحدة: إن فشل شيء لا يتغيّر شيء. يبقى لكل درس كاتبه ومالكه."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="danger" loading={busy} onClick={restore}
          disabled={!loss || (loss.total > 0 && !accepted)}>استرجع</Button>
      </>}>
      {!loss && !error && <p className="t-body text-fg-subtle">جارٍ مقارنة المادة بالنسخة المنشورة…</p>}
      {loss && (
        <div className="flex flex-col gap-3">
          <p className="t-caption text-fg-subtle">
            {loss.publishedAt ? `آخر نشر ${formatDate(loss.publishedAt, 'short')}.` : 'وقت آخر نشر غير معروف — تُقارن الدروس بوجودها في الملف فقط.'}
            {loss.emptyLessons ? ` ستُحذف ${loss.emptyLessons} دروس فارغة غير منشورة.` : ''}
          </p>
          {loss.total === 0 ? (
            <p className="t-body text-fg">لا شيء غير منشور سيضيع.</p>
          ) : (
            <>
              <p className="t-body text-fg-strong">سيضيع ما لم يُنشر:</p>
              {loss.lessons.length > 0 && (
                <ul className="flex flex-col gap-1 max-h-56 overflow-y-auto">
                  {loss.lessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 t-label">
                      <span className="text-fg truncate">{l.title}</span>
                      <Badge tone="warn" size="sm">{l.why === 'edited' ? 'عُدّل بعد النشر' : 'لم يُنشر'}</Badge>
                    </li>
                  ))}
                </ul>
              )}
              {others.length > 0 && (
                <p className="t-label text-fg-muted">{others.map(([k, n]) => `${n} ${OTHER_LABELS[k] || k}`).join(' · ')}</p>
              )}
              <label className="flex items-center gap-2 t-label text-fg">
                <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                أعلم أن هذه التعديلات ستضيع
              </label>
            </>
          )}
        </div>
      )}
      {error && <p role="alert" className="mt-3 t-caption text-danger">{error}</p>}
    </Dialog>
  );
}

// ─── Not opened yet ───────────────────────────────────────────────────────────
// Opening creates the subject with no units; the owner adds them from the
// textbook. Units used to be built from a template in the code catalog.
function Unopened({ subject, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const openIt = async () => {
    setBusy(true); setError(null);
    try { await api(`/api/admin/subjects/${encodeURIComponent(subject.id)}`, { method: 'POST' }); onDone(); }
    catch (e) { setError(e.message); setBusy(false); }
  };
  return (
    <EmptyState className="mt-6" title={`${subject.nameAr} لم تُفتح بعد`}
      description={error || 'افتحها لتبدأ فارغة، ثم أضف وحداتها ودروسها من الكتاب هنا. حتى ذلك يرى أعضاؤها رسالة بأنها لم تُفتح.'}
      action={<Button variant="primary" loading={busy} onClick={openIt}>افتح المادة</Button>} />
  );
}

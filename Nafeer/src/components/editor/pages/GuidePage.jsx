'use client';
import { useCallback, useEffect, useState } from 'react';
import EditorPage from '@/components/editor/layout/EditorPage';
import { Button, Card, EmptyState, Field, Input, PageHeader, SaveStatus, Textarea } from '@/components/ui';
import { formatRelative } from '@/lib/format';
import { reviewCall } from '@/components/review/LessonReview';

// ─── «دليل المادة» (docs/team-leads.md L2) ────────────────────────────────────
// The subject's handbook — its standards, style and conventions — and the
// checklist a reviewer confirms before approving. Members read; the lead edits
// both here. One GET on open, one PUT on save.

const MAX_ITEMS = 15;

export default function GuidePage({ subjectId, canEdit }) {
  const [guide, setGuide] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [handbook, setHandbook] = useState('');
  const [items, setItems] = useState([]);
  const [saveState, setSaveState] = useState('idle');
  const [saveError, setSaveError] = useState(null);

  const url = `/api/content/guide?subjectId=${encodeURIComponent(subjectId || '')}`;

  const load = useCallback(async () => {
    try {
      const json = await reviewCall(url, undefined, '/signin');
      if (json) { setGuide(json.data); setError(null); }
    } catch (e) { setError(e.message); }
  }, [url]);
  useEffect(() => { if (subjectId) load(); }, [load, subjectId]);

  const startEdit = () => {
    setHandbook(guide.handbook);
    setItems(guide.checklist.length ? guide.checklist : ['']);
    setSaveState('idle'); setSaveError(null);
    setEditing(true);
  };

  const save = async () => {
    setSaveState('saving'); setSaveError(null);
    try {
      const json = await reviewCall(url, { method: 'PUT', body: { handbook, checklist: items } }, '/signin');
      if (json) { setGuide(json.data); setEditing(false); setSaveState('saved'); }
    } catch (e) { setSaveError(e.message); setSaveState('error'); }
  };

  if (!subjectId) {
    return <EditorPage width="prose" className="font-ui"><EmptyState title="لا مادة بعد" description="حين تُسند إليك مادة يظهر دليلها هنا." /></EditorPage>;
  }
  if (error && !guide) {
    return <EditorPage width="prose" className="font-ui"><EmptyState title="تعذّر فتح الدليل" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} /></EditorPage>;
  }
  if (!guide) {
    return <EditorPage width="prose" className="font-ui"><p className="t-body text-fg-subtle">جارٍ التحميل…</p></EditorPage>;
  }

  const updated = guide.updatedAt ? `آخر تحديث ${formatRelative(guide.updatedAt)}${guide.updatedByName ? ` · ${guide.updatedByName}` : ''}` : null;

  return (
    <EditorPage width="prose" className="flex flex-col gap-6 font-ui">
      <PageHeader
        title="دليل المادة"
        description={updated || 'معايير المادة وأسلوبها، وما يتحقق منه المراجع قبل الاعتماد.'}
        actions={canEdit && !editing && <Button variant="secondary" onClick={startEdit}>تحرير الدليل</Button>}
      />

      {!editing && (
        <>
          <Card title="الدليل">
            {guide.handbook
              ? <div className="read t-body text-fg whitespace-pre-wrap" dir="auto">{guide.handbook}</div>
              : <p className="t-label text-fg-subtle">لم يكتب قائد الفريق دليلاً بعد.</p>}
          </Card>
          <Card title="قائمة المراجعة">
            <p className="t-caption text-fg-subtle mb-3">يؤكد المراجع كل بند قبل اعتماد أي درس.</p>
            {guide.checklist.length
              ? <ol className="flex flex-col gap-2 list-decimal ps-5">{guide.checklist.map((t, i) => <li key={i} className="read t-label text-fg">{t}</li>)}</ol>
              : <p className="t-label text-fg-subtle">لا بنود بعد.</p>}
          </Card>
        </>
      )}

      {editing && (
        <>
          <Card title="الدليل">
            <Field label="نص الدليل" hint="اكتب بالعربية الفصحى؛ يُعرض كما هو، بأسطره وفقراته.">
              <Textarea rows={14} value={handbook} onChange={(e) => setHandbook(e.target.value)} maxLength={20000} />
            </Field>
          </Card>
          <Card title="قائمة المراجعة">
            <p className="t-caption text-fg-subtle mb-3">حتى {MAX_ITEMS} بنداً. البند الفارغ يُحذف عند الحفظ.</p>
            <div className="flex flex-col gap-2">
              {items.map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="t-caption text-fg-subtle w-5 shrink-0">{i + 1}</span>
                  <Input aria-label={`البند ${i + 1}`} value={t} maxLength={200} className="flex-1"
                    onChange={(e) => setItems((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} />
                  <Button size="sm" variant="ghost" aria-label={`احذف البند ${i + 1}`}
                    onClick={() => setItems((xs) => xs.filter((_, j) => j !== i))}>×</Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" className="self-start" disabled={items.length >= MAX_ITEMS}
                onClick={() => setItems((xs) => [...xs, ''])}>+ بند</Button>
            </div>
          </Card>
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={save} loading={saveState === 'saving'}>احفظ</Button>
            <Button variant="ghost" onClick={() => setEditing(false)} disabled={saveState === 'saving'}>إلغاء</Button>
            <SaveStatus state={saveState} />
            {saveError && <p role="alert" className="t-label text-danger">{saveError}</p>}
          </div>
        </>
      )}
    </EditorPage>
  );
}

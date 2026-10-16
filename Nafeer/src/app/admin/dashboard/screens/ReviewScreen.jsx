'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card, ConfirmButton, EmptyState, PageHeader, Select, Textarea } from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID, SUBJECTS_CATALOG } from '@/shared/curriculum';
import { MAX_RETURN_COMMENTS } from '@/lib/review';
import { ScreenBody } from './AdminFrame';

// ─── Review ───────────────────────────────────────────────────────────────────
// DS2 step 3 (canvas board AdReview): the queue oldest first; the lesson read
// whole; click any part to write a comment anchored there; then approve, or
// return with the comments. The contributor sees each comment in place in
// their editor (LessonReadiness) and must resolve all before resending.
//
// Concepts, feed cards and questions sent on their own keep the simple
// approve / return-with-a-note row below the lessons.

const KIND = { lesson: 'الدرس كله', meta: 'التفاصيل', section: 'قسم', block: 'عنصر', question: 'سؤال', feed: 'بطاقة' };
const SECTION_KIND = { CONCEPT: 'فهم', MODEL: 'نموذج', EXAMPLE: 'مثال', GENERAL: null };
const OTHER_TYPE = { concept: 'مفهوم', feedItem: 'بطاقة تغذية', question: 'سؤال' };

async function call(url, options) {
  const res = await fetch(url, options && { ...options, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) });
  if (res.status === 401) { window.location.href = '/admin/login'; return null; }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر الاتصال بالخادم');
  return json;
}

export function ReviewScreen({ onTotalChange }) {
  const [subjectId, setSubjectId] = useState('');
  const [queue, setQueue] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    try {
      const json = await call(`/api/admin/review-queue${subjectId ? `?subjectId=${subjectId}` : ''}`);
      if (!json) return;
      setQueue(json.data); setError(null);
      onTotalChange?.(json.data.total);
    } catch (e) { setError(e.message); }
  }, [subjectId, onTotalChange]);
  useEffect(() => { load(); }, [load]);

  const lessons = useMemo(() => [...(queue?.lessons || [])].sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)), [queue]);
  const others = useMemo(() => queue ? [
    ...queue.concepts.map((i) => ({ ...i, type: 'concept' })),
    ...queue.feedItems.map((i) => ({ ...i, type: 'feedItem' })),
    ...queue.questions.map((i) => ({ ...i, type: 'question' })),
  ] : [], [queue]);
  const current = lessons.find((l) => l.contentId === selected) || lessons[0] || null;

  return (
    <ScreenBody>
      <PageHeader
        title="المراجعة"
        description={queue && (queue.total ? `${queue.total} عنصر بانتظارك · الأقدم أولاً` : 'لا شيء بانتظار المراجعة.')}
        actions={
          <Select aria-label="المادة" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-44">
            <option value="">كل المواد</option>
            {SUBJECTS_CATALOG.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
          </Select>
        }
      />

      {error && !queue && <EmptyState title="تعذّر تحميل الطابور" description={error} action={<Button onClick={load}>أعد المحاولة</Button>} />}
      {queue && queue.total === 0 && (
        <EmptyState title="الطابور فارغ" description="حين يرسل مساهم درساً للمراجعة يظهر هنا، ويُقرأ كاملاً قبل القرار." />
      )}

      {lessons.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
          <nav aria-label="دروس بانتظار المراجعة" className="flex flex-col gap-2">
            {lessons.map((l) => {
              const on = l.contentId === current?.contentId;
              return (
                <button key={l.contentId} type="button" aria-pressed={on} onClick={() => setSelected(l.contentId)}
                  className={`flex flex-col gap-1 p-3 rounded-card border text-start transition-colors ${on ? 'bg-selected border-line-accent' : 'bg-raised border-line hover:border-line-strong'}`}>
                  <span className="flex justify-between gap-2 t-caption text-fg-subtle">
                    <span>{SUBJECTS_BY_ID[l.subjectId]?.nameAr || l.subjectId}</span>
                    <span>{formatRelative(l.submittedAt)}</span>
                  </span>
                  <strong className="t-ui text-fg-strong">{l.label}</strong>
                  {l.round > 1 && <span className="t-caption text-warn">الجولة {l.round} — أُعيد من قبل</span>}
                </button>
              );
            })}
          </nav>
          {current && <LessonReview key={current.contentId} item={current} onDone={() => { setSelected(null); load(); }} />}
        </div>
      )}

      {others.length > 0 && <OtherItems items={others} onDone={load} />}
    </ScreenBody>
  );
}

// ─── One lesson ───────────────────────────────────────────────────────────────
function LessonReview({ item, onDone }) {
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [anchor, setAnchor] = useState({ kind: 'lesson', id: null, label: KIND.lesson });
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState([]);
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let live = true;
    call(`/api/admin/review-queue/${item.contentId}`)
      .then((j) => { if (live && j) setLesson(j.data); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [item.contentId]);

  const pick = (kind, id, label) => setAnchor({ kind, id, label });
  const countOn = (kind, id) => comments.filter((c) => c.anchor.kind === kind && c.anchor.id === id).length;

  const add = () => {
    const text = draft.trim();
    if (!text) return;
    setComments((cs) => [...cs, { key: Date.now(), text, anchor }]);
    setDraft('');
  };

  const decide = async (status) => {
    setBusy(status); setResult(null);
    try {
      await call('/api/admin/review-queue', {
        method: 'PATCH',
        body: {
          contentId: item.contentId, type: 'lesson', status,
          ...(status === 'draft' ? { comments: comments.map(({ text, anchor: a }) => ({ text, anchor: { kind: a.kind, id: a.id, label: a.label } })) } : {}),
        },
      });
      onDone();
    } catch (e) { setResult(e.message); setBusy(null); }
  };

  if (error) return <EmptyState title="تعذّر فتح الدرس" description={error} />;
  if (!lesson) return <Card><p className="t-body text-fg-subtle">جارٍ تحميل الدرس…</p></Card>;

  const rounds = [...new Set(lesson.review.map((r) => r.round))].sort((a, b) => b - a);
  const round = (lesson.reviewState?.round || 0) + 1;

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
      <article aria-label={`الدرس: ${lesson.title}`} className="flex flex-col gap-3 min-w-0">
        <header className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1">
            <span className="t-caption text-fg-subtle">
              {SUBJECTS_BY_ID[lesson.subjectId]?.nameAr} · {lesson.author?.name || '—'} · أُرسل {formatDate(lesson.reviewState?.submittedAt || item.submittedAt, 'shortDateTime')}
            </span>
            <h2 className="t-h2 text-fg-strong">{lesson.title}</h2>
          </div>
          <span className="flex gap-2">
            <Badge tone={round > 1 ? 'warn' : 'neutral'}>الجولة {round}</Badge>
          </span>
        </header>
        <p className="t-caption text-fg-subtle">انقر أي جزء لتكتب تعليقاً في مكانه. التعليق على «الدرس كله» إن لم تختر جزءاً.</p>

        <Part on={anchor.kind === 'lesson'} kind="lesson" count={countOn('lesson', null)} onPick={() => pick('lesson', null, KIND.lesson)}>
          <span className="t-label text-fg-muted">تعليق عام على الدرس</span>
        </Part>
        <Part on={anchor.kind === 'meta'} kind="meta" count={countOn('meta', null)} onPick={() => pick('meta', null, KIND.meta)}>
          <dl className="flex flex-col gap-1.5 t-label">
            <Detail k="الملخص" v={lesson.summary} />
            <Detail k="السؤال التحفيزي" v={lesson.hook} />
            <Detail k="جوابه" v={lesson.hookAnswer} />
            <Detail k="الوقت المقدّر" v={lesson.estimatedMinutes ? `${lesson.estimatedMinutes} دقيقة` : null} />
          </dl>
        </Part>

        {lesson.sections.map((s, si) => (
          <section key={s.id} className="flex flex-col gap-2">
            <Part on={anchor.kind === 'section' && anchor.id === s.id} kind="section" count={countOn('section', s.id)}
              onPick={() => pick('section', s.id, `القسم ${si + 1}: ${s.title}`)}>
              <span className="flex items-center gap-2">
                {SECTION_KIND[s.kind] && <Badge size="sm" tone="accent">{SECTION_KIND[s.kind]}</Badge>}
                <strong className="t-title text-fg-strong">{s.title}</strong>
              </span>
            </Part>
            <div className="flex flex-col gap-2 ps-4 border-s-2 border-line">
              {s.blocks.map((b, bi) => (
                <Part key={b.id} on={anchor.kind === 'block' && anchor.id === b.id} kind="block" sub={b.type} count={countOn('block', b.id)}
                  onPick={() => pick('block', b.id, `القسم ${si + 1} · العنصر ${bi + 1}`)}>
                  <BlockText block={b} />
                </Part>
              ))}
              {!s.blocks.length && <span className="t-caption text-warn">قسم بلا عناصر</span>}
            </div>
          </section>
        ))}
        {!lesson.sections.length && <p className="t-label text-warn">لا أقسام في هذا الدرس.</p>}

        {lesson.questions.length > 0 && <h3 className="t-caption font-semibold text-fg-subtle mt-2">الأسئلة · {lesson.questions.length}</h3>}
        {lesson.questions.map((q, i) => (
          <Part key={q.id} on={anchor.kind === 'question' && anchor.id === q.id} kind="question" sub={q.type} count={countOn('question', q.id)}
            onPick={() => pick('question', q.id, `السؤال ${i + 1}`)}>
            <p className="read t-body text-fg">{q.text}</p>
            {q.answer && <p className="t-caption text-fg-subtle mt-1">الإجابة: {String(q.answer)}</p>}
          </Part>
        ))}

        {lesson.feed.length > 0 && <h3 className="t-caption font-semibold text-fg-subtle mt-2">بطاقات التغذية · {lesson.feed.length}</h3>}
        {lesson.feed.map((f, i) => (
          <Part key={f.id} on={anchor.kind === 'feed' && anchor.id === f.id} kind="feed" sub={f.type} count={countOn('feed', f.id)}
            onPick={() => pick('feed', f.id, `البطاقة ${i + 1}`)}>
            <p className="read t-body text-fg">{f.text}</p>
            {f.back && <p className="t-caption text-fg-subtle mt-1">الوجه الخلفي: {f.back}</p>}
          </Part>
        ))}
      </article>

      <aside aria-label="تعليقاتك" className="flex flex-col gap-4 xl:sticky xl:top-4">
        <Card tone="accent" title="تعليق جديد">
          <div className="flex flex-col gap-3">
            <span className="t-label text-fg-muted">على: <strong className="text-fg-strong">{anchor.label}</strong></span>
            <Textarea aria-label="نص التعليق" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add(); }}
              placeholder="ما الذي يحتاج تغييراً، ولماذا؟" maxLength={1000} />
            <Button size="sm" onClick={add} disabled={!draft.trim() || comments.length >= MAX_RETURN_COMMENTS} className="self-start">+ أضف التعليق</Button>
          </div>
        </Card>

        <Card title={`في هذه الجولة · ${comments.length}`}>
          {comments.length === 0 ? <p className="t-label text-fg-subtle">لا تعليقات بعد. الاعتماد بلا تعليقات ممكن.</p> : (
            <ul className="flex flex-col gap-2">
              {comments.map((c) => (
                <li key={c.key} className="flex gap-2 p-2.5 rounded-control bg-sunken">
                  <span className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="t-caption text-fg-accent">{c.anchor.label}</span>
                    <span className="read t-label text-fg">{c.text}</span>
                  </span>
                  <button type="button" aria-label="احذف التعليق" onClick={() => setComments((cs) => cs.filter((x) => x.key !== c.key))}
                    className="t-caption text-fg-subtle hover:text-danger self-start">×</button>
                </li>
              ))}
            </ul>
          )}

          {rounds.map((r) => (
            <div key={r} className="mt-4 flex flex-col gap-2">
              <span className="t-caption font-semibold text-fg-subtle">من الجولة {r}</span>
              {lesson.review.filter((c) => c.round === r).map((c) => (
                <div key={c.id} className="flex flex-col gap-0.5 p-2.5 rounded-control border border-line">
                  <span className={`t-caption ${c.resolved ? 'text-success' : 'text-warn'}`}>
                    {c.resolved ? `✓ عولجت${c.resolvedByName ? ` · ${c.resolvedByName}` : ''}${c.resolvedAt ? ` · ${formatRelative(c.resolvedAt)}` : ''}` : 'لم تُعالج'}
                    {c.anchor?.label ? ` · ${c.anchor.label}` : ''}
                  </span>
                  <span className="read t-label text-fg-muted">{c.text}</span>
                </div>
              ))}
            </div>
          ))}
        </Card>

        <div className="flex flex-col gap-2">
          {result && <p role="alert" className="t-label text-danger">{result}</p>}
          <div className="flex gap-2">
            <ConfirmButton variant="primary" size="md" tone="accent" confirmLabel="اعتمد" align="start" disabled={!!busy}
              title="اعتماد الدرس؟" onConfirm={() => decide('approved')}
              description={comments.length ? `لديك ${comments.length} تعليق لم يُرسل — الاعتماد يتجاهلها.` : 'يصبح جاهزاً للنشر في صفحة المادة.'}>
              {busy === 'approved' ? 'جارٍ…' : 'اعتماد'}
            </ConfirmButton>
            <ConfirmButton variant="secondary" size="md" tone="accent" confirmLabel="أعِده" align="start" disabled={!!busy || !comments.length}
              title={`إعادة الدرس مع ${comments.length} تعليق؟`} onConfirm={() => decide('draft')}
              description="يعود الدرس مسودة إلى صاحبه، ويظهر كل تعليق في مكانه داخل محرره. لا يستطيع إعادة الإرسال قبل معالجتها كلها.">
              {busy === 'draft' ? 'جارٍ…' : comments.length ? `أعِد مع ${comments.length} تعليق` : 'أعِد (أضف تعليقاً أولاً)'}
            </ConfirmButton>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Part({ on, kind, sub, count, onPick, children }) {
  return (
    // A div, not a <button>: parts hold paragraphs and lists, which a button may not.
    <div role="button" tabIndex={0} aria-pressed={on} onClick={onPick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } }}
      className={`w-full text-start flex flex-col gap-1.5 p-3 rounded-card border cursor-pointer transition-colors ${on ? 'border-line-accent bg-selected' : 'border-line bg-raised hover:border-line-strong'}`}>
      <span className="flex items-center gap-2 t-caption text-fg-subtle">
        <span>{KIND[kind]}{sub ? ` · ${sub}` : ''}</span>
        {count > 0 && <Badge size="sm" tone="accent">{count} تعليق</Badge>}
      </span>
      {children}
    </div>
  );
}

function Detail({ k, v }) {
  return (
    <div className="flex gap-2">
      <dt className="text-fg-subtle shrink-0 w-28">{k}</dt>
      <dd className={v ? 'read text-fg' : 'text-warn'}>{v || 'فارغ'}</dd>
    </div>
  );
}

// Blocks are read, not rendered: the text a student will see, or what the
// block is when it has no text (an image, a divider).
function BlockText({ block }) {
  const text = (block.content || '').trim();
  if (block.type === 'DIVIDER') return <span className="t-caption text-fg-subtle">فاصل</span>;
  if (['IMAGE', 'GIF', 'INTERACTIVE_IMAGE'].includes(block.type)) {
    return <span className="t-label text-fg-muted">صورة{block.caption ? ` — ${block.caption}` : ''}</span>;
  }
  if (!text) return <span className="t-caption text-warn">عنصر فارغ</span>;
  const shown = text.startsWith('{') || text.startsWith('[') ? `${text.slice(0, 160)}…` : text;
  return <p className={`read ${block.type === 'HEADING' ? 't-title text-fg-strong' : 't-body text-fg'} whitespace-pre-wrap`} dir="auto">{shown}</p>;
}

// ─── Concepts, feed cards and questions sent on their own ─────────────────────
function OtherItems({ items, onDone }) {
  const [busy, setBusy] = useState(null);
  const act = async (item, status) => {
    setBusy(item.contentId);
    try { await call('/api/admin/review-queue', { method: 'PATCH', body: { contentId: item.contentId, type: item.type, status } }); }
    finally { setBusy(null); onDone(); }
  };
  return (
    <Card padding="none" className="mt-6 overflow-hidden" title={<span className="block px-4 pt-4">عناصر أخرى · {items.length}</span>}>
      <ul>
        {items.map((i) => (
          <li key={i.contentId} className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-line">
            <Badge size="sm">{OTHER_TYPE[i.type]}</Badge>
            <span className="t-caption text-fg-subtle">{SUBJECTS_BY_ID[i.subjectId]?.nameAr}</span>
            <span className="read t-label text-fg flex-1 min-w-0 truncate">{i.label}</span>
            <Button size="sm" variant="primary" loading={busy === i.contentId} onClick={() => act(i, 'approved')}>اعتماد</Button>
            <Button size="sm" variant="ghost" disabled={busy === i.contentId} onClick={() => act(i, 'draft')}>أعِد مسودة</Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

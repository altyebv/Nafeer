'use client';
import { useEffect, useState } from 'react';
import { Badge, Button, Card, ConfirmButton, EmptyState, Textarea } from '@/components/ui';
import { formatDate, formatRelative } from '@/lib/format';
import { SUBJECTS_BY_ID } from '@/shared/curriculum';
import { MAX_RETURN_COMMENTS } from '@/lib/review';

// ─── Reviewing one lesson ─────────────────────────────────────────────────────
// DS2 step 3 (canvas board AdReview): the lesson read whole; click any part to
// write a comment anchored there; then approve, or return with the comments.
// The contributor sees each comment in place in their editor (LessonReadiness)
// and must resolve all before resending.
//
// Shared by the owner's dashboard (ReviewScreen) and the lead's inbox
// (docs/team-leads.md L1). Each passes its own `endpoints`:
//   { detail: (contentId) => url, decide: url, loginHref }
// The decide endpoint takes { contentId, type, status, comments? } (PATCH).

const KIND = { lesson: 'الدرس كله', meta: 'التفاصيل', section: 'قسم', block: 'عنصر', question: 'سؤال', feed: 'بطاقة' };
const SECTION_KIND = { CONCEPT: 'فهم', MODEL: 'نموذج', EXAMPLE: 'مثال', GENERAL: null };
const OTHER_TYPE = { concept: 'مفهوم', feedItem: 'بطاقة تغذية', question: 'سؤال' };

// Owner's review endpoints — the default, so the dashboard passes nothing.
export const ADMIN_REVIEW_ENDPOINTS = {
  list:      (subjectId) => `/api/admin/review-queue${subjectId ? `?subjectId=${subjectId}` : ''}`,
  detail:    (contentId) => `/api/admin/review-queue/${contentId}`,
  decide:    '/api/admin/review-queue',
  loginHref: '/admin/login',
};

export const LEAD_REVIEW_ENDPOINTS = {
  detail:    (contentId) => `/api/lead/review/${encodeURIComponent(contentId)}`,
  decide:    '/api/lead/review',
  loginHref: '/signin',
};

export async function reviewCall(url, options, loginHref) {
  const res = await fetch(url, options && { ...options, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) });
  if (res.status === 401) { window.location.href = loginHref; return null; }
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر الاتصال بالخادم');
  return json;
}

export function LessonReview({ item, onDone, endpoints = ADMIN_REVIEW_ENDPOINTS }) {
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState(null);
  const [anchor, setAnchor] = useState({ kind: 'lesson', id: null, label: KIND.lesson });
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState([]);
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  // The subject's review checklist (docs/team-leads.md L2): approving waits
  // until every item is ticked. Returning does not.
  const [ticked, setTicked] = useState(() => new Set());

  useEffect(() => {
    let live = true;
    reviewCall(endpoints.detail(item.contentId), undefined, endpoints.loginHref)
      .then((j) => { if (live && j) setLesson(j.data); })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [item.contentId, endpoints]);

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
      await reviewCall(endpoints.decide, {
        method: 'PATCH',
        body: {
          contentId: item.contentId, type: 'lesson', status,
          ...(status === 'draft' ? { comments: comments.map(({ text, anchor: a }) => ({ text, anchor: { kind: a.kind, id: a.id, label: a.label } })) } : {}),
        },
      }, endpoints.loginHref);
      onDone();
    } catch (e) { setResult(e.message); setBusy(null); }
  };

  if (error) return <EmptyState title="تعذّر فتح الدرس" description={error} />;
  if (!lesson) return <Card><p className="t-body text-fg-subtle">جارٍ تحميل الدرس…</p></Card>;

  // Four-eyes (docs/team-leads.md): the reviewer's own lesson is read-only.
  const mine = !!(lesson.mine || item.mine);
  const rounds = [...new Set(lesson.review.map((r) => r.round))].sort((a, b) => b - a);
  const round = (lesson.reviewState?.round || 0) + 1;
  const checklist = lesson.checklist || [];
  const checklistDone = ticked.size === checklist.length;
  const toggleTick = (i) => setTicked((s) => {
    const next = new Set(s);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

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
            {mine && <Badge tone="neutral">عملك</Badge>}
            <Badge tone={round > 1 ? 'warn' : 'neutral'}>الجولة {round}</Badge>
          </span>
        </header>
        {!mine && <p className="t-caption text-fg-subtle">انقر أي جزء لتكتب تعليقاً في مكانه. التعليق على «الدرس كله» إن لم تختر جزءاً.</p>}

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
        {mine ? (
          <Card tone="accent" title="هذا من عملك">
            <p className="t-label text-fg-muted">
              لا يراجع أحدٌ عمله بنفسه. يراجع هذا الدرسَ القائدُ الآخر للمادة إن وُجد، وإلا فمالك المنصة.
            </p>
          </Card>
        ) : (
          <Card tone="accent" title="تعليق جديد">
            <div className="flex flex-col gap-3">
              <span className="t-label text-fg-muted">على: <strong className="text-fg-strong">{anchor.label}</strong></span>
              <Textarea aria-label="نص التعليق" rows={3} value={draft} onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) add(); }}
                placeholder="ما الذي يحتاج تغييراً، ولماذا؟" maxLength={1000} />
              <Button size="sm" onClick={add} disabled={!draft.trim() || comments.length >= MAX_RETURN_COMMENTS} className="self-start">+ أضف التعليق</Button>
            </div>
          </Card>
        )}

        <Card title={mine ? 'تعليقات الجولات السابقة' : `في هذه الجولة · ${comments.length}`}>
          {!mine && (comments.length === 0 ? <p className="t-label text-fg-subtle">لا تعليقات بعد. الاعتماد بلا تعليقات ممكن.</p> : (
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
          ))}
          {mine && !rounds.length && <p className="t-label text-fg-subtle">لا تعليقات سابقة.</p>}

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

        {!mine && checklist.length > 0 && (
          <Card title={`قائمة المراجعة · ${ticked.size}/${checklist.length}`}>
            <ul className="flex flex-col gap-2">
              {checklist.map((text, i) => (
                <li key={i}>
                  <label className="flex items-start gap-2 t-label text-fg cursor-pointer">
                    <input type="checkbox" className="mt-1 accent-accent" checked={ticked.has(i)} onChange={() => toggleTick(i)} />
                    <span className="read">{text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {!mine && (
          <div className="flex flex-col gap-2">
            {result && <p role="alert" className="t-label text-danger">{result}</p>}
            {!checklistDone && <p className="t-caption text-fg-subtle">أكمل قائمة المراجعة قبل الاعتماد.</p>}
            <div className="flex gap-2">
              <ConfirmButton variant="primary" size="md" tone="accent" confirmLabel="اعتمد" align="start" disabled={!!busy || !checklistDone}
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
        )}
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
export function OtherItems({ items, onDone, endpoints = ADMIN_REVIEW_ENDPOINTS }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const act = async (item, status) => {
    setBusy(item.contentId); setError(null);
    try {
      await reviewCall(endpoints.decide, { method: 'PATCH', body: { contentId: item.contentId, type: item.type, status } }, endpoints.loginHref);
    } catch (e) { setError(e.message); }
    finally { setBusy(null); onDone(); }
  };
  return (
    <Card padding="none" className="mt-6 overflow-hidden" title={<span className="block px-4 pt-4">عناصر أخرى · {items.length}</span>}>
      {error && <p role="alert" className="px-4 pt-2 t-label text-danger">{error}</p>}
      <ul>
        {items.map((i) => (
          <li key={i.contentId} className="flex items-center gap-3 flex-wrap px-4 py-3 border-t border-line">
            <Badge size="sm">{OTHER_TYPE[i.type]}</Badge>
            <span className="t-caption text-fg-subtle">{SUBJECTS_BY_ID[i.subjectId]?.nameAr}</span>
            <span className="read t-label text-fg flex-1 min-w-0 truncate">{i.label}</span>
            {i.mine ? <Badge size="sm" tone="neutral">عملك — يراجعه غيرك</Badge> : (
              <>
                <Button size="sm" variant="primary" loading={busy === i.contentId} onClick={() => act(i, 'approved')}>اعتماد</Button>
                <Button size="sm" variant="ghost" disabled={busy === i.contentId} onClick={() => act(i, 'draft')}>أعِد مسودة</Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

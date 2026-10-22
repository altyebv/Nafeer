'use client';
import { useMemo, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, cx } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { gradeLabels, gradeLocate, markerBank, LOCATE_RADIUS } from '@/lib/markerQuestion';
import { MarkerPin } from './MarkerPin';

// ─── MarkerQuestion ───────────────────────────────────────────────────────────
// A marker question as the student answers it (docs/question-markers.md):
//   label   tap a pin, then its name in the word bank; check; partial credit
//   locate  tap where the thing is; check; the right area is then shown
//
// Grading is lib/markerQuestion.js — the same functions the app ports.
// onResult({ score, ... }) runs once, when the student checks.

export function MarkerQuestion({ question, onResult, seed }) {
  return question.markerMode === 'locate'
    ? <LocateQuestion q={question} onResult={onResult} />
    : <LabelQuestion q={question} onResult={onResult} seed={seed} />;
}

function Picture({ q, onClick, onSize, children, interactive }) {
  return (
    <div className={cx('relative select-none rounded-card overflow-hidden bg-sunken', interactive && 'cursor-crosshair')}
      onClick={onClick}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={q.imageUrl} alt="" draggable={false} className="w-full h-auto block"
        onLoad={(e) => onSize?.({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} />
      {children}
    </div>
  );
}

// ─── label ────────────────────────────────────────────────────────────────────

function LabelQuestion({ q, onResult, seed }) {
  const markers = q.markers || [];
  const bank = useMemo(() => markerBank(q, seed ?? q.id ?? 'preview'), [q, seed]);
  const [picks, setPicks]   = useState({});              // markerId → word
  const [active, setActive] = useState(markers[0]?.id ?? null);
  const [result, setResult] = useState(null);

  const used = new Set(Object.values(picks));
  const done = markers.every((m) => picks[m.id]);

  const choose = (word) => {
    if (!active || result) return;
    // A word is used once: taking it for this pin frees it from another.
    const next = Object.fromEntries(Object.entries(picks).filter(([, w]) => w !== word));
    next[active] = word;
    setPicks(next);
    const following = markers.find((m) => !next[m.id]);
    setActive(following?.id ?? active);
  };

  const check = () => {
    const r = gradeLabels(q, picks);
    setResult(r);
    onResult?.(r);
  };

  const reset = () => { setPicks({}); setResult(null); setActive(markers[0]?.id ?? null); };

  return (
    <div className="flex flex-col gap-4">
      <Picture q={q}>
        {markers.map((m, i) => (
          <MarkerPin key={m.id} marker={{ ...m, label: '' }} index={i} active={!result && m.id === active}
            tone={result ? (result.perPin[m.id] ? 'success' : 'danger') : undefined}
            onClick={() => !result && setActive(m.id)} />
        ))}
      </Picture>

      <ol className="flex flex-col gap-1.5">
        {markers.map((m, i) => {
          const ok = result?.perPin[m.id];
          return (
            <li key={m.id}>
              <button type="button" onClick={() => !result && setActive(m.id)} aria-pressed={!result && m.id === active}
                className={cx(
                  'w-full flex items-center gap-3 rounded-control border px-3 py-2 text-start transition-colors',
                  result ? (ok ? 'border-success-border bg-success-surface' : 'border-danger-border bg-danger-surface')
                    : m.id === active ? 'border-line-accent bg-accent-wash' : 'border-line bg-sunken hover:border-line-strong',
                )}>
                <span className="t-num t-caption w-6 h-6 shrink-0 inline-flex items-center justify-center rounded-full bg-accent text-fg-on-accent">
                  {i + 1}
                </span>
                <span className={cx('t-ui flex-1 min-w-0', picks[m.id] ? 'text-fg-strong' : 'text-fg-subtle')}>
                  {picks[m.id] || '— اختر من الكلمات —'}
                </span>
                {result && !ok && <span className="t-caption text-success">الصحيح: {m.answer}</span>}
              </button>
              {result && m.description && <p className="t-caption text-fg-muted px-3 pt-1">{m.description}</p>}
            </li>
          );
        })}
      </ol>

      {!result && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="بنك الكلمات">
          {bank.map((w) => (
            <button key={w} type="button" onClick={() => choose(w)} disabled={!active}
              className={cx(
                'rounded-chip border px-3 py-1.5 t-ui transition-colors',
                used.has(w) ? 'border-line bg-hover text-fg-subtle' : 'border-line-strong bg-raised text-fg hover:border-line-accent',
              )}>
              {w}
            </button>
          ))}
        </div>
      )}

      <Footer result={result && `${formatNumber(result.right)} من ${formatNumber(result.total)} صحيحة`}
        tone={result && (result.score === 1 ? 'success' : result.score > 0 ? 'warn' : 'danger')}
        canCheck={done} onCheck={check} onReset={reset} />
    </div>
  );
}

// ─── locate ───────────────────────────────────────────────────────────────────

function LocateQuestion({ q, onResult }) {
  const target = q.markers?.[0];
  const [tap, setTap]       = useState(null);
  const [result, setResult] = useState(null);
  const [size, setSize]     = useState(null);

  const place = (e) => {
    if (result) return;
    const r = e.currentTarget.getBoundingClientRect();
    setTap({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };

  const check = () => {
    const r = gradeLocate(q, tap, q.image?.width ? q.image : size);
    setResult(r);
    onResult?.({ ...r, score: r.correct ? 1 : 0 });
  };

  const reset = () => { setTap(null); setResult(null); };

  return (
    <div className="flex flex-col gap-4">
      {target?.label && (
        <p className="t-body text-fg">حدّد على الصورة: <strong className="text-fg-strong">{target.label}</strong></p>
      )}
      <Picture q={q} onClick={place} onSize={setSize} interactive={!result}>
        {result && target && (
          <span aria-hidden="true"
            className="absolute rounded-full aspect-square border-2 border-dashed border-success-border bg-success-surface pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${target.x * 100}%`, top: `${target.y * 100}%`, width: `${(target.radius ?? LOCATE_RADIUS.default) * 200}%` }} />
        )}
        {result && target && <MarkerPin marker={{ ...target, label: '' }} index={0} tone="success" showLabel={false} />}
        {tap && (
          <MarkerPin marker={{ id: 'tap', x: tap.x, y: tap.y, label: 'لمستك' }} index={0}
            tone={result ? (result.correct ? 'success' : 'danger') : undefined} />
        )}
</Picture>
      {!tap && !result && <p className="t-caption text-fg-subtle">المس الصورة في المكان الذي تراه صحيحاً. يمكنك تغيير لمستك قبل التحقق.</p>}
      <Footer result={result && (result.correct ? 'إجابة صحيحة' : 'ليس هنا — المنطقة الصحيحة معلّمة على الصورة')}
        tone={result && (result.correct ? 'success' : 'danger')}
        canCheck={!!tap} onCheck={check} onReset={reset} />
    </div>
  );
}

function Footer({ result, tone, canCheck, onCheck, onReset }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {result
        ? <p role="status" className={cx('t-label', { success: 'text-success', warn: 'text-warn', danger: 'text-danger' }[tone])}>{result}</p>
        : <span />}
      {result
        ? <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onReset}>أعد المحاولة</Button>
        : <Button size="sm" variant="primary" onClick={onCheck} disabled={!canCheck}>تحقق</Button>}
    </div>
  );
}

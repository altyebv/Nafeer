'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ConfirmButton, EmptyState, Field, IconButton, Input, PageHeader, Textarea, cx } from '@/components/ui';
import { formatDate } from '@/lib/format';
import {
  POOL_GROUPS, POOL_NAMES, POOL_TAGS, POOLS,
  emptyEntry, serializePools, validatePools,
} from '@/shared/stringPools';
import { ScreenBody } from './AdminFrame';

// ─── String pools ─────────────────────────────────────────────────────────────
// The Basheer app's remote copy: greetings, encouragement, practice insights.
// Loads the live Firestore doc (app_config/string_pools), edits it here, and
// publishes it whole. The app picks it up on its next launch — no content
// publish needed.
//
// Each entry: `text` (shown when the student's gender is unknown, or the entry
// has no form for it — so it should read for both), optional male / female
// forms, a weight (higher = drawn more often) and tags that limit when it is
// eligible. Pool names and tags are fixed by the app (src/shared/stringPools).

let seq = 0;
const withKeys = (pools) => Object.fromEntries(
  Object.entries(pools).map(([name, list]) => [name, list.map((e) => ({ ...e, key: ++seq }))]),
);
const fingerprint = (pools) => JSON.stringify(serializePools(pools));
const NO_PROBLEMS = { errors: [], warnings: [] };

export function StringPoolsScreen() {
  const [live, setLive] = useState(null);       // the doc as loaded: { configured, pools, unknown, updatedAt, … }
  const [pools, setPools] = useState(null);     // the working copy
  const [active, setActive] = useState(POOL_NAMES[0]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    setError(null); setResult(null);
    try {
      const res = await fetch('/api/admin/string-pools');
      if (res.status === 401) { window.location.href = '/admin/login'; return; }
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setLive(json.data);
      setPools(json.data.configured ? withKeys(json.data.pools) : null);
    } catch (e) { setError(e.message || 'تعذّر التحميل'); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const dirty = useMemo(
    () => !!pools && !!live?.pools && fingerprint(pools) !== fingerprint(live.pools),
    [pools, live],
  );
  const check = useMemo(() => (pools ? validatePools(pools) : null), [pools]);

  // Unsaved edits survive nothing — warn before the tab closes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const setPool = (name, fn) => setPools((p) => ({ ...p, [name]: fn(p[name]) }));

  const publish = async () => {
    setBusy(true); setResult(null);
    try {
      const res = await fetch('/api/admin/string-pools', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pools, unknown: live.unknown, baseUpdatedAt: live.updatedAt }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر النشر');
      await load();
      setResult({ ok: true, text: 'نُشرت النصوص. تصل للطلاب عند فتح التطبيق.' });
    } catch (e) { setResult({ ok: false, text: e.message }); }
    finally { setBusy(false); }
  };

  const status = live?.configured && (
    dirty
      ? <Badge tone="warn">تغييرات لم تُنشر</Badge>
      : live.updatedAt
        ? <span className="t-caption text-fg-subtle">نُشرت {formatDate(live.updatedAt, 'shortDateTime')}{live.updatedBy ? ` · ${live.updatedBy}` : ''}</span>
        : <Badge tone="neutral">لم تُنشر بعد</Badge>
  );

  const actions = pools && (
    <>
      <ConfirmButton
        variant="ghost" size="md" icon={RotateCcw} align="end" disabled={!dirty || busy}
        title="تجاهل التغييرات؟" description="يعود كل شيء إلى النسخة المنشورة."
        confirmLabel="تجاهل" onConfirm={() => setPools(withKeys(live.pools))}
      >
        تراجع
      </ConfirmButton>
      <ConfirmButton
        variant="primary" size="md" tone="confirm" align="end"
        disabled={!dirty || busy || check.errors > 0}
        title="نشر النصوص لطلاب بشير؟"
        description="تحلّ محل النصوص الحالية كلها، ويقرؤها التطبيق عند فتحه التالي."
        confirmLabel="انشر" onConfirm={publish}
      >
        {busy ? 'جارٍ النشر…' : 'انشر'}
      </ConfirmButton>
    </>
  );

  return (
    <ScreenBody>
      <PageHeader
        title="نصوص التطبيق"
        description="التحيات والتشجيع وقراءات التدريب التي يعرضها بشير. يُختار نص من كل مجموعة عشوائياً بحسب وزنه."
        status={status}
        actions={actions}
      />

      {error && (
        <Card><p role="alert" className="t-body text-danger">{error}</p><Button size="sm" className="mt-3" onClick={load}>أعد المحاولة</Button></Card>
      )}
      {!error && !live && <Card><p className="t-body text-fg-subtle">جارٍ التحميل…</p></Card>}
      {live && !live.configured && (
        <EmptyState title="Firebase غير مهيّأ في هذه البيئة" description="النصوص تُقرأ وتُنشر من Firebase، فلا يمكن تحريرها هنا." />
      )}

      {pools && (
        <div className="flex flex-col gap-4">
          {result && (
            <p role="status" className={cx('p-3 rounded-control t-caption', result.ok ? 'bg-success-surface text-success' : 'bg-danger-surface text-danger')}>
              {result.text}
            </p>
          )}
          {Object.keys(live.unknown || {}).length > 0 && (
            <p className="p-3 rounded-control bg-info-surface t-caption text-fg">
              في المستند مجموعات لا يعرفها التطبيق، تبقى كما هي عند النشر:{' '}
              <span dir="ltr" className="font-mono">{Object.keys(live.unknown).join(', ')}</span>
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)] items-start">
            <PoolList pools={pools} check={check} active={active} onSelect={setActive} />
            <PoolEditor
              key={active}
              pool={POOLS.find((p) => p.name === active)}
              entries={pools[active]}
              check={check}
              onChange={(fn) => setPool(active, fn)}
            />
          </div>
        </div>
      )}
    </ScreenBody>
  );
}

// ─── Pool list ────────────────────────────────────────────────────────────────
function PoolList({ pools, check, active, onSelect }) {
  const issues = (name, kind) => (pools[name] || []).reduce((n, _, i) => n + (check.byEntry[`${name}:${i}`]?.[kind].length || 0), 0);
  return (
    <Card padding="sm" as="nav" aria-label="المجموعات" className="lg:sticky lg:top-4">
      <div className="flex flex-col gap-4">
        {POOL_GROUPS.map((g) => (
          <div key={g.label} className="flex flex-col gap-0.5">
            <h3 className="px-2 mb-1 t-caption font-semibold text-fg-subtle">{g.label}</h3>
            {g.pools.map((p) => {
              const count = pools[p.name].length;
              const errs = issues(p.name, 'errors');
              const warns = issues(p.name, 'warnings');
              return (
                <button key={p.name} type="button" onClick={() => onSelect(p.name)} aria-current={active === p.name ? 'true' : undefined}
                  className={cx('flex items-center gap-2 px-2 py-1.5 rounded-control text-start transition-colors',
                    active === p.name ? 'bg-accent-wash text-fg-accent' : 'text-fg hover:bg-hover')}>
                  <span className="flex-1 t-ui truncate">{p.label}</span>
                  {errs > 0 && <Badge tone="danger" size="sm">{errs}</Badge>}
                  {!errs && warns > 0 && <Badge tone="warn" size="sm">{warns}</Badge>}
                  <span className={cx('t-caption tabular-nums', count ? 'text-fg-muted' : 'text-fg-subtle')}>{count || 'افتراضي'}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Pool editor ──────────────────────────────────────────────────────────────
function PoolEditor({ pool, entries, check, onChange }) {
  const update = (i, patch) => onChange((list) => list.map((e, j) => (j === i ? { ...e, ...patch } : e)));
  const remove = (i) => onChange((list) => list.filter((_, j) => j !== i));
  const move = (i, d) => onChange((list) => {
    const next = [...list];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  });
  const add = () => onChange((list) => [...list, { ...emptyEntry(), key: ++seq }]);

  const total = entries.reduce((s, e) => s + (Number(e.weight) > 0 ? Number(e.weight) : 0), 0);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <Card
        title={<span className="flex items-baseline gap-2 flex-wrap">{pool.label}<span dir="ltr" className="t-caption font-mono text-fg-subtle">{pool.name}</span></span>}
        actions={<Button size="sm" icon={Plus} onClick={add}>نص جديد</Button>}
      >
        <div className="flex flex-col gap-2">
          <p className="t-caption text-fg-subtle">
            {entries.length ? 'ما يظهر إن لم يناسب أيٌّ من هذه النصوص سياق الطالب:' : 'المجموعة فارغة، فيعرض التطبيق نصه الافتراضي:'}
          </p>
          {pool.fallback.map((f, i) => (
            <div key={i} className="p-3 rounded-control bg-sunken flex flex-col gap-1">
              {f.when && <span className="t-caption text-fg-subtle">{f.when}</span>}
              <span className="t-body text-fg">{f.text}</span>
              {f.text_female && <span className="t-caption text-fg-muted">للطالبة: {f.text_female}</span>}
            </div>
          ))}
        </div>
      </Card>

      {entries.map((entry, i) => (
        <EntryCard
          key={entry.key}
          index={i}
          entry={entry}
          last={i === entries.length - 1}
          share={total > 0 && Number(entry.weight) > 0 ? Number(entry.weight) / total : 0}
          problems={check.byEntry[`${pool.name}:${i}`] || NO_PROBLEMS}
          onChange={(patch) => update(i, patch)}
          onMove={(d) => move(i, d)}
          onRemove={() => remove(i)}
        />
      ))}

      {entries.length > 0 && (
        <Button icon={Plus} onClick={add} className="self-start">نص جديد</Button>
      )}
    </div>
  );
}

// ─── Entry ────────────────────────────────────────────────────────────────────
function EntryCard({ index, entry, last, share, problems, onChange, onMove, onRemove }) {
  const [gendered, setGendered] = useState(!!(entry.text_male || entry.text_female));
  const toggleTag = (id) => onChange({ tags: entry.tags.includes(id) ? entry.tags.filter((t) => t !== id) : [...entry.tags, id] });
  const unknownTags = entry.tags.filter((t) => !POOL_TAGS.some((p) => p.id === t));

  return (
    <Card padding="sm" className={cx(problems.errors.length > 0 && 'border-danger-border')}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="t-label text-fg-muted tabular-nums">#{index + 1}</span>
          <span className="t-caption text-fg-subtle tabular-nums">
            {share > 0 ? `يُختار نحو ${Math.round(share * 100)}% من المرات حين تتساوى الشروط` : ''}
          </span>
          <span className="flex-1" />
          <IconButton size="sm" icon={ArrowUp} label="انقل لأعلى" disabled={index === 0} onClick={() => onMove(-1)} />
          <IconButton size="sm" icon={ArrowDown} label="انقل لأسفل" disabled={last} onClick={() => onMove(1)} />
          <ConfirmButton variant="ghost" size="sm" icon={Trash2} align="end" label={`احذف النص ${index + 1}`}
            title="حذف هذا النص؟" description="يُحذف من التطبيق عند النشر." onConfirm={onRemove} />
        </div>

        <Field label="النص العام" hint="يظهر حين لا يُعرف جنس الطالب، أو لا توجد صيغة له — فاكتبه بصيغة تصلح للجميع ما أمكن." required>
          <Textarea dir="rtl" rows={2} value={entry.text} onChange={(e) => onChange({ text: e.target.value })} />
        </Field>

        {gendered ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="للطالب" hint="اختياري — يُستعمل النص العام إن تُرك فارغاً.">
              <Textarea dir="rtl" rows={2} value={entry.text_male} onChange={(e) => onChange({ text_male: e.target.value })} />
            </Field>
            <Field label="للطالبة" hint="مثل: ابدئي، عايزة.">
              <Textarea dir="rtl" rows={2} value={entry.text_female} onChange={(e) => onChange({ text_female: e.target.value })} />
            </Field>
          </div>
        ) : (
          <Button variant="ghost" size="sm" className="self-start" onClick={() => setGendered(true)}>أضف صيغة للطالب والطالبة</Button>
        )}

        <div className="flex flex-wrap items-end gap-4">
          <Field label="الوزن" hint="1 عادي، 2 ضعف الاحتمال" className="w-32">
            <Input type="number" dir="ltr" min="0.1" step="0.1" value={entry.weight}
              onChange={(e) => onChange({ weight: e.target.value === '' ? '' : Number(e.target.value) })} />
          </Field>
          <fieldset className="flex flex-col gap-1.5 min-w-0">
            <legend className="t-label text-fg mb-1.5">متى يظهر</legend>
            <div className="flex flex-wrap gap-1.5">
              {POOL_TAGS.map((t) => {
                const on = entry.tags.includes(t.id);
                return (
                  <button key={t.id} type="button" aria-pressed={on} title={t.hint} onClick={() => toggleTag(t.id)}
                    className={cx('h-8 px-3 rounded-chip border t-label transition-colors touch-target',
                      on ? 'bg-accent-wash text-fg-accent border-line-accent' : 'text-fg-muted border-line-strong hover:bg-hover')}>
                    {t.label}
                  </button>
                );
              })}
              {unknownTags.map((t) => (
                <button key={t} type="button" onClick={() => toggleTag(t)} title="لا يعرفه التطبيق — اضغط لإزالته"
                  className="h-8 px-3 rounded-chip border t-label bg-danger-surface text-danger border-danger-border">
                  <span dir="ltr" className="font-mono">{t}</span> ×
                </button>
              ))}
            </div>
            <p className="t-caption text-fg-subtle">{entry.tags.length ? 'يظهر حين ينطبق أيٌّ من المختار.' : 'بلا وسوم: يظهر في كل وقت.'}</p>
          </fieldset>
        </div>

        {(problems.errors.length > 0 || problems.warnings.length > 0) && (
          <ul className="flex flex-col gap-1">
            {problems.errors.map((m) => <li key={m} role="alert" className="t-caption text-danger">{m}</li>)}
            {problems.warnings.map((m) => <li key={m} className="t-caption text-warn">{m}</li>)}
          </ul>
        )}
      </div>
    </Card>
  );
}

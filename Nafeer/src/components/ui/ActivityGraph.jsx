'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, arCount } from '@/lib/format';
import { ACTIVITY_LABELS, dayKey, heatLevel, shiftKey, weekdayRow } from '@/lib/activity';
import { Stat } from './Stat';
import { cx } from './cx';

// ─── ActivityGraph ────────────────────────────────────────────────────────────
// The contribution graph on the editor dashboard and the public profile —
// one component where there were two copies (docs/design-system.md, DS2).
//
// What changed from the old heatmaps, and why:
// • Days are Sudan-time calendar dates (lib/activity.js). The old ones mixed
//   UTC server keys with local-midnight browser keys and slid work done after
//   midnight onto the previous day.
// • The grid starts on a Saturday, so each row really is the weekday its
//   label says. The old grid started 111 days ago on whatever weekday that
//   was, under fixed أح…سب labels.
// • Fixed intensity steps (1 · 2–4 · 5–9 · 10+) instead of "relative to the
//   busiest day", so one heavy day no longer washes out the rest, and the
//   legend now uses the same colours as the cells.
// • Every day is a real button: arrow keys move between days (mirrored under
//   RTL, so the left arrow is "newer" in Arabic), and the selected day's
//   breakdown by type is announced in a live region.
// • 12px labels at full contrast instead of 8px at half opacity; the weekday
//   column stays put while the weeks scroll on a phone (it sits on bg-raised,
//   the surface the graph is always placed on).

const CELL = 'w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px]';
const HEAT = ['bg-heat-0', 'bg-heat-1', 'bg-heat-2', 'bg-heat-3', 'bg-heat-4'];
const WEEKDAYS = ['سبت', 'أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة'];
const ACTIONS = { one: 'إجراء واحد', two: 'إجراءان', few: 'إجراءات', many: 'إجراءً' };

const dateOf = (key) => `${key}T00:00:00Z`;

export function ActivityGraph({ days = {}, summary, weeks = 16, showSummary = true, loading = false, className }) {
  // "Today" is decided in the browser after mount: the server's clock and the
  // viewer's can straddle midnight, and a mismatched grid would not hydrate.
  const [today, setToday] = useState(null);
  const [picked, setPicked] = useState(null);
  const scrollRef = useRef(null);
  const cellRefs = useRef({});

  useEffect(() => { setToday(dayKey(new Date())); }, []);

  const grid = useMemo(() => {
    if (!today) return null;
    let start = shiftKey(today, -(weeks * 7 - 1));
    start = shiftKey(start, -weekdayRow(start));          // back to Saturday
    const end = shiftKey(today, 6 - weekdayRow(today));     // to Friday
    const keys = [];
    for (let k = start; k <= end; k = shiftKey(k, 1)) keys.push(k);
    const months = [];
    for (let c = 0; c < keys.length / 7; c++) {
      const first = keys[c * 7];
      const prev = c ? keys[(c - 1) * 7] : null;
      months.push(!prev || first.slice(5, 7) !== prev.slice(5, 7) ? formatDate(dateOf(first), 'monthShort', { timeZone: 'UTC' }) : '');
    }
    const lastActive = [...keys].reverse().find((k) => k <= today && days[k]?.n);
    return { keys, months, start, lastActive };
  }, [today, weeks, days]);

  // Open on the most recent weeks when the graph is wider than its box.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollWidth > el.clientWidth) {
      el.scrollLeft = getComputedStyle(el).direction === 'rtl' ? -el.scrollWidth : el.scrollWidth;
    }
  }, [grid]);

  const selected = picked ?? grid?.lastActive ?? today;

  const move = (e, key) => {
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const step = {
      ArrowUp: -1, ArrowDown: 1,
      ArrowLeft: rtl ? 7 : -7, ArrowRight: rtl ? -7 : 7,
    }[e.key];
    let next = null;
    if (step) next = shiftKey(key, step);
    else if (e.key === 'Home') next = grid.start;
    else if (e.key === 'End') next = today;
    if (!next) return;
    e.preventDefault();
    if (next < grid.start) next = grid.start;
    if (next > today) next = today;
    setPicked(next);
    cellRefs.current[next]?.focus();
  };

  const day = selected ? days[selected] : null;
  const parts = Object.entries(day?.by || {})
    .sort((a, b) => b[1] - a[1])
    .map(([type, n]) => ({ type, n, label: ACTIVITY_LABELS[type] || type }));
  const empty = !loading && summary && summary.activeDays === 0;

  return (
    <div className={cx('flex flex-col gap-5', className)}>
      {showSummary && summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat value={summary.activeDays} label={`يوماً نشطاً من ${summary.windowDays}`} />
          <Stat value={summary.streak} label="أيام متتالية حتى اليوم" />
          <Stat value={summary.longest} label="أطول سلسلة في المدة" />
          <Stat value={summary.total} label="إجراءً في المدة" />
        </div>
      )}

      <div className="flex flex-wrap items-start gap-x-8 gap-y-5">
        <div ref={scrollRef} className="max-w-full overflow-x-auto pb-1">
          <div className="flex flex-col gap-1.5 w-max">
            {/* Month names, one slot per week column */}
            <div className="flex gap-2">
              <div className="w-11 shrink-0 sticky start-0 z-[1] bg-raised" />
              <div className="grid grid-flow-col auto-cols-[0.875rem] sm:auto-cols-[1rem] gap-1 h-5" aria-hidden="true">
                {grid?.months.map((m, i) => (
                  <span key={i} className="t-caption text-fg-muted whitespace-nowrap leading-5">{m}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <div className="w-11 shrink-0 sticky start-0 z-[1] bg-raised grid grid-rows-[repeat(7,0.875rem)] sm:grid-rows-[repeat(7,1rem)] gap-1" aria-hidden="true">
                {WEEKDAYS.map((d) => <span key={d} className="t-caption text-fg-subtle leading-none self-center">{d}</span>)}
              </div>

              <div
                role="group"
                aria-label="النشاط اليومي — استخدم الأسهم للتنقل بين الأيام"
                className="grid grid-flow-col grid-rows-[repeat(7,0.875rem)] sm:grid-rows-[repeat(7,1rem)] auto-cols-[0.875rem] sm:auto-cols-[1rem] gap-1"
              >
                {grid
                  ? grid.keys.map((key) => {
                      const future = key > today;
                      const n = days[key]?.n || 0;
                      const isSel = key === selected;
                      return (
                        <button
                          key={key}
                          ref={(el) => { cellRefs.current[key] = el; }}
                          type="button"
                          tabIndex={isSel ? 0 : -1}
                          disabled={future}
                          aria-pressed={isSel}
                          aria-label={`${formatDate(dateOf(key), 'long', { timeZone: 'UTC' })}: ${n ? arCount(n, ACTIONS) : 'لا نشاط'}`}
                          onClick={() => setPicked(key)}
                          onKeyDown={(e) => move(e, key)}
                          className={cx(
                            CELL, HEAT[heatLevel(n)],
                            'transition-shadow duration-fast disabled:invisible',
                            isSel ? 'ring-2 ring-fg-strong' : key === today && 'ring-1 ring-inset ring-fg-accent',
                          )}
                        />
                      );
                    })
                  : Array.from({ length: weeks * 7 }, (_, i) => <span key={i} className={cx(CELL, HEAT[0])} />)}
              </div>
            </div>

            <div className="flex items-center gap-1.5 ps-[3.25rem] pt-2 t-caption text-fg-subtle">
              <span>أقل</span>
              {HEAT.map((h) => <span key={h} className={cx('w-3.5 h-3.5 rounded-[4px]', h)} aria-hidden="true" />)}
              <span>أكثر</span>
              <span className="ms-2">1 · 2–4 · 5–9 · 10+</span>
            </div>
          </div>
        </div>

        <div aria-live="polite" className="flex-1 basis-64 flex flex-col gap-2.5 p-4 rounded-card bg-sunken border border-line">
          {empty ? (
            <>
              <span className="t-title text-fg-strong">لا نشاط بعد</span>
              <span className="t-ui font-normal text-fg-muted leading-relaxed">
                أول تعديل تحفظه يظهر هنا — كل قسم أو سؤال أو بطاقة تضيفها يُحسب في يومه.
              </span>
            </>
          ) : selected ? (
            <>
              <span className="t-caption text-fg-subtle">اليوم المحدد</span>
              <span className="t-title text-fg-strong">
                {formatDate(dateOf(selected), 'long', { timeZone: 'UTC' })}
                {selected === today && <span className="text-fg-accent"> · اليوم</span>}
              </span>
              <span className="t-ui font-normal text-fg-muted">{day?.n ? arCount(day.n, ACTIONS) : 'لا نشاط في هذا اليوم'}</span>
              {parts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {parts.map((p) => (
                    <span key={p.type} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-chip t-label text-fg bg-hover border border-line-strong">
                      <span className="t-num font-semibold text-fg-accent">{p.n}</span>{p.label}
                    </span>
                  ))}
                </div>
              )}
              <span className="t-caption text-fg-subtle">اختر أي يوم لترى ما أنجزته فيه.</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

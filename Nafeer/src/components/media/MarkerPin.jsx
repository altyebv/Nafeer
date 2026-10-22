'use client';
import { forwardRef, useState } from 'react';
import { X } from 'lucide-react';
import { cx } from '@/components/ui';

// ─── MarkerPin / MarkedImage ──────────────────────────────────────────────────
// The one way a marker is drawn — the lesson editor, its previews and the
// review screen all use it, so a marker lands on the same spot everywhere.
//
// Anchor: the dot's centre sits exactly on (x, y), fractions of the image's
// width and height from its top-left (lib/markerUtils.js). The label bubble
// hangs off the dot and never moves it; near an edge it turns inward so it
// isn't cut off. x and y are physical, so this ignores the page's direction.
//
// The image must fill its box exactly (w-full h-auto, no object-fit, no
// max-height): the pins are placed in % of that box.

const EDGE = 0.15;

function bubblePlacement(x, y) {
  const vertical = y < EDGE ? 'top-3' : 'bottom-3';
  if (x < EDGE)     return cx(vertical, 'left-0 -translate-x-2');
  if (x > 1 - EDGE) return cx(vertical, 'right-0 translate-x-2');
  return cx(vertical, 'left-0 -translate-x-1/2');
}

/**
 * One pin. Renders a <button> when it has onClick/onPointerDown, a <span>
 * otherwise. Extra props go to that element (drag handlers, aria).
 */
export const MarkerPin = forwardRef(function MarkerPin(
  { marker, index, active = false, dragging = false, showLabel = true, className, ...rest },
  ref,
) {
  const label = marker.label?.trim() || String(index + 1);
  const interactive = Boolean(rest.onClick || rest.onPointerDown);
  const Comp = interactive ? 'button' : 'span';

  return (
    <span
      className="absolute w-0 h-0"
      style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%`, zIndex: active || dragging ? 20 : 10 }}
    >
      <Comp
        ref={ref}
        type={interactive ? 'button' : undefined}
        aria-label={interactive ? `علامة ${index + 1}${marker.label ? `: ${marker.label}` : ''}` : undefined}
        aria-pressed={interactive ? active : undefined}
        className={cx(
          'group absolute left-0 top-0 block',
          interactive && 'touch-none focus-visible:outline-none',
          interactive && (dragging ? 'cursor-grabbing' : 'cursor-grab'),
          className,
        )}
        {...rest}
      >
        {/* Hit area: a 32px circle centred on the point. */}
        <span className="absolute w-8 h-8 -left-4 -top-4 rounded-full" aria-hidden="true" />
        {/* The dot — its centre is the marked point. */}
        <span
          aria-hidden="true"
          className={cx(
            'absolute w-3.5 h-3.5 -left-[7px] -top-[7px] rounded-full border-2 shadow-lift transition-colors',
            active ? 'bg-accent-hover border-fg-strong' : 'bg-accent border-page',
            interactive && 'group-focus-visible:ring-2 group-focus-visible:ring-accent-hover',
          )}
        />
        {showLabel && (
          <span
            className={cx(
              'absolute max-w-[11rem] truncate px-2 py-0.5 rounded-chip border t-caption font-semibold whitespace-nowrap shadow-lift pointer-events-none',
              bubblePlacement(marker.x, marker.y),
              active ? 'bg-accent text-fg-on-accent border-line-accent' : 'bg-overlay text-fg-accent border-line-accent',
            )}
          >
            {label}
          </span>
        )}
      </Comp>
    </span>
  );
});

/**
 * An image with its markers, for reading. Tapping a pin with a description
 * opens it under the image — a card, not a tooltip, so it works on a phone.
 */
export function MarkedImage({ src, alt = '', markers = [], caption, className }) {
  const [activeId, setActiveId] = useState(null);
  const active = markers.find((m) => m.id === activeId);
  const activeIndex = markers.findIndex((m) => m.id === activeId);

  return (
    <figure className={cx('flex flex-col gap-2', className)}>
      <div className="relative select-none rounded-card overflow-hidden bg-sunken">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full h-auto block" draggable={false} />
        {markers.map((m, i) => (
          <MarkerPin key={m.id} marker={m} index={i} active={m.id === activeId}
            onClick={() => setActiveId((id) => (id === m.id ? null : m.id))} />
        ))}
      </div>
      {active && (
        <div className="flex items-start gap-3 rounded-card border border-line-accent bg-accent-wash px-3 py-2.5" role="status">
          <span className="t-num t-caption w-5 h-5 shrink-0 inline-flex items-center justify-center rounded-full bg-accent text-fg-on-accent">
            {activeIndex + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="t-label text-fg-strong">{active.label || `علامة ${activeIndex + 1}`}</p>
            {active.description && <p className="t-body text-fg mt-0.5 whitespace-pre-wrap">{active.description}</p>}
          </div>
          <button type="button" onClick={() => setActiveId(null)} aria-label="إغلاق"
            className="shrink-0 text-fg-subtle hover:text-fg touch-target">
            <X size={14} />
          </button>
        </div>
      )}
      {caption && <figcaption className="t-caption text-fg-subtle text-center">{caption}</figcaption>}
    </figure>
  );
}

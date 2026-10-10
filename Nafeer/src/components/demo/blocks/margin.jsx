'use client';

// ─────────────────────────────────────────────────────────────────────────────
// THE READER'S PAGE — mirrors ReaderMargin.kt in the Basheer app.
//
// A lesson is read on a notebook page: one line in the subject's colour runs
// down the margin (the right edge, in RTL) and whatever is not plain text
// announces itself there. A block puts a small sign on the line and thickens
// the line beside itself in its family's colour.
//
// The line's colour comes from the CSS variable --reader-line, set by the
// reader; outside it the line falls back to the accent.
// ─────────────────────────────────────────────────────────────────────────────

export const GUTTER = 40;      // space kept clear on the leading (right) side
export const END = 20;
export const LINE_CENTER = 20;
export const LINE_WIDTH = 2;
export const BAR_WIDTH = 4;
export const SIGN = 24;

const FAMILY = {
  know: { strong: 'var(--f-know)', tint: 'var(--f-know-tint)', label: 'var(--f-know-label)' },
  do:   { strong: 'var(--f-do)',   tint: 'var(--f-do-tint)',   label: 'var(--f-do-label)' },
  look: { strong: 'var(--f-look)', tint: 'var(--f-look-tint)', label: 'var(--f-look-label)' },
  warn: { strong: 'var(--f-warn)', tint: 'var(--f-warn-tint)', label: 'var(--f-warn-label)' },
};

const lineColor = 'var(--reader-line, var(--b-accent))';

/**
 * One item of the page. It draws its own length of the margin line, so items
 * stacked in a column join into one unbroken line. `top` and `bottom` are the
 * space around the content and are given here, not as outer padding, or the
 * line would break between items.
 */
export function MarginItem({ top = 0, bottom = 0, bar, sign, signOffset = 0, children }) {
  return (
    <div dir="rtl" style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', paddingTop: top, paddingBottom: bottom }}>
        {children}
        {/* the line, drawn over the content so it runs across a band's fill */}
        <span aria-hidden style={{
          position: 'absolute', top: 0, bottom: 0, right: LINE_CENTER - LINE_WIDTH / 2,
          width: LINE_WIDTH, background: lineColor, pointerEvents: 'none',
        }} />
        {bar && (
          <span aria-hidden style={{
            position: 'absolute', top, bottom, right: LINE_CENTER - BAR_WIDTH / 2,
            width: BAR_WIDTH, background: bar, pointerEvents: 'none',
          }} />
        )}
      </div>
      {sign && (
        <div style={{ position: 'absolute', top: top + signOffset, right: LINE_CENTER - SIGN / 2 }}>{sign}</div>
      )}
    </div>
  );
}

/** The small tab a block puts on the margin line. */
export function MarginSign({ icon, fill, tint = 'var(--b-ink)', border }) {
  return (
    <span style={{
      width: SIGN, height: SIGN, borderRadius: 4, background: fill, color: tint,
      border: border ? `1px solid ${border}` : 0, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {icon}
    </span>
  );
}

/** The text column of the page: clear of the margin on the leading side. */
export function ReaderColumn({ children, style }) {
  return <div style={{ paddingRight: GUTTER, paddingLeft: END, ...style }}>{children}</div>;
}

/** Plain content on the page: nothing in the margin but the line itself. */
export function PlainItem({ top = 6, bottom = 6, children }) {
  return (
    <MarginItem top={top} bottom={bottom}>
      <ReaderColumn>{children}</ReaderColumn>
    </MarginItem>
  );
}

/**
 * A block that belongs to a family: its sign on the line, the line thickened
 * beside it, and its label in the family's colour. `banded` sets the block on a
 * sunken band ruled above and below, edge to edge.
 */
export function FamilyBlock({ family, icon, label, banded = false, top = 10, bottom = 10, children }) {
  const c = FAMILY[family];
  return (
    <MarginItem
      top={top}
      bottom={bottom}
      bar={c.strong}
      signOffset={banded ? 12 : 0}
      sign={<MarginSign icon={icon} fill={c.tint} tint={family === 'warn' ? c.strong : 'var(--b-ink)'} border={c.strong} />}
    >
      <div style={banded ? {
        background: 'var(--b-sunken)', borderTop: '1px solid var(--b-rule-strong)',
        borderBottom: '1px solid var(--b-rule-strong)', padding: '12px 0',
      } : undefined}>
        <ReaderColumn>
          {label && (
            <div style={{
              minHeight: SIGN, display: 'flex', alignItems: 'center',
              font: '800 12px/18px var(--font-arabic)', color: c.label,
            }}>{label}</div>
          )}
          {children}
        </ReaderColumn>
      </div>
    </MarginItem>
  );
}

// ── Icons (24 viewBox, stroke) ───────────────────────────────────────────────
const svg = (d, extra) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" {...extra}>{d}</svg>
);
export const Icons = {
  bookmark: svg(<path d="M6 3h12v18l-6-4-6 4z" />),
  note:     svg(<><path d="M5 3h14v12l-6 6H5z" /><path d="M13 21v-6h6" /></>),
  warning:  svg(<><path d="m12 3 10 18H2z" /><path d="M12 10v5M12 18h.01" /></>),
  bulb:     svg(<><path d="M9 21h6M10 17h4" /><path d="M12 3a6 6 0 0 0-4 10.500c.7.7 1 1.500 1 2.500h6c0-1 .3-1.800 1-2.500A6 6 0 0 0 12 3z" /></>),
  functions: svg(<path d="M18 5H7l6 7-6 7h11" />),
  edit:     svg(<><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></>),
  table:    svg(<><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 10h18M9 4v16" /></>),
  image:    svg(<><rect x="3" y="4" width="18" height="16" rx="1" /><circle cx="9" cy="10" r="1.500" /><path d="m21 17-5-5-8 8" /></>),
  play:     svg(<><rect x="3" y="4" width="18" height="16" rx="1" /><path d="m10 9 5 3-5 3z" /></>),
  check:    svg(<path d="m5 12 5 5 9-10" />),
  recall:   svg(<><circle cx="12" cy="12" r="9" /><path d="M9.500 9.500a2.500 2.500 0 1 1 3.500 2.300c-.700.400-1 1-1 1.700M12 17h.01" /></>),
};

'use client';

// ─── Variation icons ──────────────────────────────────────────────────────────
// The same four signs the app draws for a lesson's other readings
// (Basheer: feature/lesson/presentation/components/VariationIcon.kt).
// Ink draws the shape in the current text colour; amber is the one part that
// says what kind of reading it is. Same props as a lucide icon: size, className, style.

const AMBER = '#F59E0B';

function Frame({ size = 16, className, style, label, children }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {children}
    </svg>
  );
}

/** A staircase, its first step in amber: where to start. */
export function PrerequisiteIcon(props) {
  return (
    <Frame {...props}>
      <path d="M15 15h-5v-5H4" strokeWidth={2} />
      <path d="M20 20h-5v-5" stroke={AMBER} strokeWidth={2.5} />
    </Frame>
  );
}

/** Four lines, only the middle two kept: less to read. */
export function SimplifiedIcon(props) {
  return (
    <Frame {...props}>
      <path d="M5 6h14" strokeWidth={2} strokeOpacity={0.28} />
      <path d="M5 10h14" stroke={AMBER} strokeWidth={2.5} />
      <path d="M5 14h14" stroke={AMBER} strokeWidth={2.5} />
      <path d="M5 18h14" strokeWidth={2} strokeOpacity={0.28} />
    </Frame>
  );
}

/** Two routes between the same two points. */
export function AlternativeIcon(props) {
  return (
    <Frame {...props}>
      <path d="M5 12c3.5-6.5 10.5-6.5 14 0" strokeWidth={1.75} />
      <path d="M5 12c3.5 6.5 10.5 6.5 14 0" stroke={AMBER} strokeWidth={2.5} />
      <circle cx="4.5" cy="12" r="2.25" fill="currentColor" stroke="none" />
      <circle cx="19.5" cy="12" r="2.25" fill="currentColor" stroke="none" />
    </Frame>
  );
}

/** Layers, the deepest in amber. */
export function ExtensionIcon(props) {
  return (
    <Frame {...props}>
      <path d="M12 4l8 4-8 4-8-4z" strokeWidth={1.75} />
      <path d="M4 12l8 4 8-4" strokeWidth={1.75} />
      <path d="M4 16l8 4 8-4" stroke={AMBER} strokeWidth={2.5} />
    </Frame>
  );
}

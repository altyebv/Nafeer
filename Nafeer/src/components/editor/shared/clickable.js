/**
 * clickableProps
 * ─────────────────────────────────────────────────────────────────────────────
 * Makes a non-button element behave like one for keyboard and assistive tech.
 *
 * The editor has ~51 `<div onClick={…} className="cursor-pointer">` controls —
 * unit headers, cards, tabs, selectable rows. They work with a mouse and are
 * invisible to everything else: you cannot tab to them, Enter and Space do
 * nothing, and a screen reader announces them as plain text.
 *
 * The obvious fix — make them `<button>` — is not available for most of them,
 * because they contain their own buttons (a unit header holds rename and add
 * controls) and nested interactive elements are invalid HTML. So they get the
 * button *semantics* instead: role, tab stop, and the Enter/Space activation
 * the browser would otherwise provide.
 *
 *   <div {...clickableProps(() => setExpanded(v => !v), { expanded })}>
 *
 * Pass `stopPropagation` on inner controls as before — this does not change
 * how clicks bubble.
 */
export function clickableProps(onActivate, { expanded, label, disabled = false } = {}) {
  if (disabled) return { 'aria-disabled': true };

  return {
    role: 'button',
    tabIndex: 0,
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
    ...(label && { 'aria-label': label }),
    onClick: onActivate,
    onKeyDown: (e) => {
      // Only when the element itself is focused — otherwise typing in a nested
      // input would activate the container.
      if (e.target !== e.currentTarget) return;
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        onActivate(e);
      }
    },
  };
}

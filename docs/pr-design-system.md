# Design system sprint: foundation, editor, admin, join flow

Everything from the October 2026 design sprint (spec: `docs/design-system.md`,
open items: `docs/todo.md`).

## What's in it

- **DS0/DS1 — foundation and components.** Role tokens, type scale, Western
  digits, `lint:design` ratchet; the shared `src/components/ui/` set and the
  `/dev/design` gallery.
- **DS2 — lesson editor.** One header bar; readiness and review panel; the
  reviewer's anchored comments (return/approve) and the resubmit gate; content
  tab with labelled sections, one grouped add menu (or `/`), block toolbar,
  outline and live phone preview; the البيانات tab on shared fields with the
  version label actually sent; lessons list with search, filters and a
  continue strip; phone pass; dashboard next step and unit progress.
- **DS5 — admin.** Subject page (curriculum, coverage, publishing, settings),
  overview, contributors pipeline and person page, comms composer with one
  history and one app-settings panel, the review screen.
- **Join flow.** Subjects first; one «عنك» step with every guideline field;
  interview link at submit; a lasting status page; one-screen onboarding that
  ends in the first lesson.
- **Fixes found on the way.** Contributor stats counted from the content;
  seed and dev accounts out of people lists; announcements that never reached
  contributors (missing schema fields, broadcast query); subject bootstrap
  only when missing.

## Check on the preview deploy (Firebase is not configured locally)

- [ ] Subject page: publish, visibility switch.
- [ ] Comms: app announcements, the app-settings switches.
- [ ] One real application end to end: /join → interview → approve →
  onboarding → first lesson.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

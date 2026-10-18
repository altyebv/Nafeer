# Design system sprint: one visual language across the site

Everything from the October 2026 design sprint. Spec: `docs/design-system.md`.
Open items: `docs/todo.md`. 29 commits, each one step with its own review.

## What's addressed

- **DS0/DS1 — foundation.**
  - Role tokens for surfaces, text, lines, accent and status, in dark and light.
  - Type roles that keep Arabic letters joined (no more mono + tracking).
  - Western digits through `format.js`.
  - The `lint:design` ratchet, so violations can only go down.
  - One shared `src/components/ui/` library, with a `/dev/design` gallery.
- **DS2 — lesson editor.**
  - One header bar.
  - A readiness and review panel.
  - The review round trip: anchored reviewer comments, return/approve, and a
    gate that blocks resubmission until comments are answered.
  - Content tab: labelled sections, one grouped add menu (also opened with
    `/`), a block toolbar, an outline and a live phone preview.
  - البيانات tab on the shared fields; the version label is now actually sent.
  - Lessons list with search, filters and a "continue where you left off" strip.
  - A phone pass for the whole editor.
  - Dashboard: next-step card, unit progress and one activity graph in Sudan
    days.
- **DS3 — contributor pages.**
  - Signin, prejoin, interview and the public profile moved onto the system.
  - The profile now follows the site theme instead of being dark-only.
  - The profile 404 page was restyled too.
- **DS4 — landing.**
  - Content is visible without JS.
  - Reduced motion turns every animation off, through one shared GSAP helper.
  - One section rhythm and one set of widths.
  - Subject counts come from a single source, so they no longer disagree.
  - The phone features area is the same cards stacked, instead of a
    ~5-screen sticky scroll.
  - Accessibility pass: skip link, landmarks, ARIA states and labelled icon
    buttons.
- **DS5 — admin.**
  - Subject page: curriculum, coverage, publishing and settings.
  - Overview.
  - Contributors pipeline and person page.
  - Comms composer, with one history and one app-settings panel.
  - Review screen.
  - Old sections removed.
- **Join flow.**
  - Subjects come first.
  - One «عنك» step that keeps every field the guidelines need.
  - The interview link arrives at submit.
  - A lasting status page, with a resend option.
  - Onboarding is one screen and ends in the contributor's first lesson.
- **UX queue.**
  - A plain notice when the connection drops; autosave pauses until it's back.
  - Undo after deleting a block or section.
  - One line of writing help under the next readiness check.
  - The author gets an email when a lesson is approved or returned.
  - Admins can nudge contributors who have gone quiet.
- **Fixes found on the way.**
  - Contributor stats are recounted from the content itself, with a one-off
    `stats:reconcile`.
  - Seed and dev accounts are left out of every people list.
  - Announcements now reach contributors. Schema fields were missing and the
    broadcast query was wrong.
  - A subject is bootstrapped only when it is missing.

## Numbers

- **`lint:design`:**
  - Flow, profile and landing are at zero, except the join step bar's width and
    the landing progress bar's width.
  - Editor and admin dropped a lot but still have migrated leftovers.
- **Tests:** 133 vitest tests pass.

## Check on the preview deploy

Firebase is not configured locally, so these weren't exercised:

- [ ] Subject page: publish, and the visibility switch.
- [ ] Comms: app announcements and the app-settings switches.
- [ ] One real application end to end: /join → interview → approve →
  onboarding → first lesson.
- [ ] Landing with reduced motion on (OS setting): nothing animates, nothing
  is missing.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

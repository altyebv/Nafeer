# To do

Open items that need a decision or a check before they are done. Remove an
item when it is finished; put the commit next to it in the commit message.

## Before production

- [ ] **Freeze the unit lesson targets on production.** The catalog's
  `lessonCount` moved onto `Unit.targetLessons` (2026-10-22). Run
  `npm run units:targets:prod`, check the numbers, then again with
  `-- --apply`. Until then each unit's target follows its lesson count.

## Join flow (built 2026-10-18)

- [ ] **Write the reasons in «لماذا نسأل هذا كله».** The panel beside the
  join form gives one general paragraph; the exact guideline wording for
  gender, age, city, device and AI tools is the team's to write.
- [ ] **Interview at submit is now automatic.** Every valid application gets
  its interview link at once. If the team wants to screen before the
  interview, gate `issueInterview` in `api/contributors/request` on a flag.
- [ ] **Rejection is still silent.** The status page shows it, but no email
  is sent; decide whether to send `application_rejected`.
- [ ] **Sign in by email link.** The welcome board offers it; the
  `magic_link` template exists but no route uses it. No "forgot password" yet.
- [ ] **The three-step tour** promised on the onboarding page (`?welcome=1`
  on the first lesson) is not built.
- [ ] **Fix the role name «صانِع مٌتحتوى تعليمي»** and «نافير» in the role
  texts — data in `contributorroles`, editable in the admin roles tab.

## UX queue (agreed 2026-10-18, in this order)

- [x] **Editor offline state.** When the connection drops, say so plainly and
  that work is kept on this device and goes up when it returns.
- [x] **Undo after delete.** A short "تراجع" after deleting a block or a
  section, instead of a final confirm-only delete.
- [x] **Writing help under the readiness checks.** One line per missing check
  saying what good looks like (a summary, a hook question).
- [x] **Tell contributors when a lesson is returned or approved** — one email
  per event.
- [x] **Stale-contributor nudge.** On the admin overview: who has gone quiet,
  with a one-click message.
- [ ] **A finished sample lesson** to show applicants — content work: finish
  Chemistry unit 1 lesson 1 and link it from the join flow.
- [x] Then DS3 (contributor pages) and DS4 (landing, including the
  accessibility pass: contrast, reduced motion).

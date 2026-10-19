# Team leads — spec

A team lead («قائد الفريق», working name — see *Open decisions*) runs one
subject: reviews and approves its lessons, watches its members, recruits for it,
steps into a lesson when it has to, and ships the subject's releases.

A lead is a **contributor with extra authority over their own subject**, not a
reduced admin. They keep one account, one login, the same `/editor`, and their
profile credit. The admin dashboard stays the owner's tool.

Started 2026-10-19. Delivered in phases L0–L5 with a review gate after each,
like the editor overhaul and the design-system sprint.

---

## Principles

1. **Permissions, not a ladder.** Nothing checks "is this person at least a
   lead". Every route asks for one capability on one subject:
   `requireLead(subjectId, 'review')`. A lead of Physics is a plain member
   everywhere else.
2. **Read from the database on every call.** Like `requireContributor` today:
   removing a lead or a permission takes effect on their next request, never
   after the 7-day JWT expires.
3. **Zero extra requests for the check.** Lead status lives on the Contributor
   document the guard already loads (free-tier budget).
4. **Nobody approves their own work.** A lead's own lesson is reviewed by the
   co-lead, or by the owner if there is none.
5. **Every lead action is on the record.** One append-only audit log, with a
   reason wherever the action affects someone else.
6. **Power comes with an appeal.** A member can escalate a return, an
   intervention or a pause to the owner.
7. **Credit is never lost.** Whoever wrote, edited or reviewed a lesson keeps
   that credit through takeovers, removals and deletes of their lead status.

---

## Data model

### `Contributor.lead` (L0)

```js
lead: {
  active:              Boolean,
  subject:             String,   // the subject appointed to; honoured only while it equals contributor.subject
  canReview:           Boolean,  // default true
  canManageTeam:       Boolean,  // default true — activity, assign, pause, announce
  canDecideApplicants: Boolean,  // default false — approve / reject applicants
  canEditInterview:    Boolean,  // default false — the subject's interview questions
  canIntervene:        Boolean,  // default false — edit a member's lesson
  canPublish:          Boolean,  // default false — ship the subject's release
  since:               Date,
  appointedBy:         String,   // admin username
}
```

- A contributor has one subject, so a lead leads exactly one. If the owner moves
  a lead to another subject, `lead.subject` no longer matches and the guard
  treats them as a plain member. They are not silently made a lead of the new
  subject.
- **At most 2 active leads per subject** (`MAX_LEADS_PER_SUBJECT`), checked at
  appointment. The UI shows one by default, and nothing in the code assumes one.
- The risky permissions start **off**. The owner turns them on per lead as trust
  builds.
- Only the owner appoints or removes a lead. Removing sets `active: false`. The
  audit history and every credit stay.

*Why not `Team.members[].teamRole = 'leader'`?* Teams are optional, may span
subjects, and already have display-only "leaders". Making that grant power would
promote people silently, and it would cost a second query per request. The Team
page can show a lead badge read from `Contributor.lead`.

### `AuditEvent` (L0)

One collection for every lead action, plus the owner's actions on leads.

```js
{
  actorId, actorName, actorKind: 'lead' | 'admin',
  action,          // see ACTIONS below
  subjectId,
  target: { kind: 'lesson' | 'contributor' | 'applicant' | 'interview' | 'release' | 'lead', id, label },
  reason,          // required for actions in REASON_REQUIRED
  meta,            // small, action-specific
  at,
}
```

Indexes: `{ subjectId, at: -1 }`, `{ actorId, at: -1 }`. Append-only, never
updated. It feeds the owner's leads overview (L5) and the daily digest.

Actions: `lesson.approve`, `lesson.return`, `lesson.intervene`,
`lesson.takeover`, `lesson.assign`, `member.pause`, `member.unpause`,
`applicant.approve`, `applicant.reject`, `applicant.undo`, `interview.edit`,
`release.publish`, `release.rollback`, `lead.appoint`, `lead.update`,
`lead.remove`, `appeal.open`, `appeal.resolve`.

A reason is required for: `lesson.intervene`, `lesson.takeover`, `member.pause`,
`applicant.reject`, `release.rollback`, `lead.remove`.

### Lesson ownership and credits (L0)

`createdBy` (already present) stays **the author, forever**. Two fields are
added:

```js
ownerId: ObjectId | null,   // who is responsible now; null means createdBy
credits: [{ contributorId, name, kind: 'author' | 'editor' | 'reviewer', at }],
```

- `ownerId` only changes on a takeover (L4) or an assignment (L2).
- `credits` has one entry per (contributor, kind). Adding the same pair again
  updates `at` instead of adding a row.
- Public profiles (L4) show «ألّف» from `createdBy` and «شارك في» from `credits`.

---

## Permission matrix

All lead rows apply **only to the lead's own subject**. Elsewhere a lead is a
plain member.

| Action | Member | Lead | Owner |
|---|---|---|---|
| Edit own / assigned lesson | ✓ | ✓ | ✓ |
| Edit another member's lesson | — | `canIntervene`, with reason (L4) | ✓ |
| Approve / return a lesson | — | `canReview`, never their own | ✓ |
| Reorder lessons, add/rename units | — | `canManageTeam` | ✓ |
| Create / delete subjects, import | — | — | ✓ |
| See member activity, stale drafts | own | `canManageTeam` | ✓ |
| Assign a lesson to a member | — | `canManageTeam` | ✓ |
| Pause a member's edit access | — | `canManageTeam`, with reason | ✓ |
| Team announcement in the editor | — | `canManageTeam` | ✓ |
| See applicants (primary subject = theirs) | — | `canDecideApplicants` | ✓ |
| Approve / reject applicants | — | `canDecideApplicants`, with undo window | ✓ |
| Edit the subject's interview questions | — | `canEditInterview` | ✓ |
| Edit roles, generic questions | — | — | ✓ |
| Publish the subject's release | — | `canPublish` | ✓ |
| Roll back a release | — | — | ✓ |
| Student feedback on the subject | — | ✓ | ✓ |
| Email, app comms, strings, flags, settings | — | — | ✓ |
| Appoint / remove leads | — | — | ✓ |
| Appeal a lead's decision | ✓ | ✓ | resolves |

---

## Phases

### L0 — Foundation (no UI)
- `Contributor.lead` + `MAX_LEADS_PER_SUBJECT`.
- `lib/leads.js`: `LEAD_PERMISSIONS`, `leadCan(user, perm, subjectId)`,
  `normaliseLead()`.
- `guard.js`: `requireContributor` also loads `lead`; new
  `requireLead(subjectId, perm)` and `requireLeadOfContent(Model, id, perm)`.
  The admin passes every check.
- `AuditEvent` model + `lib/audit.js` (`recordAudit`, which never throws into
  the caller, plus reason validation).
- `Lesson.ownerId`, `Lesson.credits` + `lib/credits.js` (`lessonOwnerId`,
  `creditPush`).
- Admin API to appoint, update and remove a lead (`/api/admin/leads`), with the
  2-per-subject cap and audit entries.
- Tests: the permission matrix — every capability × {member, lead here, lead
  elsewhere, lead without the permission, admin}.
- Owner screen (added after L3): «قادة الفرق» in the admin dashboard
  (`#leads`). Each subject shows its seats (n/2) and its leads, with a toggle
  per permission that saves on its own. Remove asks for a reason. Appoint
  picks from the subject's approved members, taken from the contributor list
  the dashboard already loads. Intervening and publishing are marked «لاحقاً»
  until L4 and L5.

### L1 — Review in the editor
- Move the review components out of `ReviewScreen` into
  `components/review/`, used by both the admin dashboard and `/editor`.
- A «الإشراف» group in the editor sidebar, visible to leads only (from `/me`).
- `/editor/lead` inbox: waiting for review (oldest first, with how long),
  returned and not fixed, drafts untouched for 14+ days.
- Contributor-side review routes guarded by `requireLeadOfContent(..., 'review')`.
  They reuse `returnLesson` / `approveOrReject`, now with a real reviewer id:
  `reviewer` credit, `reviewsSubmitted` stat, audit entry.
- Four-eyes rule: refuse when the reviewer is `createdBy` or `ownerId`. The
  lead's own lessons route to the co-lead, otherwise the owner.
- Approving an approved lesson after an edit: an edit to an approved lesson
  already redrafts it (`applyVersionBump`). Keep it so, and show it in the inbox.

**As built (2026-10-19):**
- Routes: `GET /api/lead/inbox`, `GET /api/lead/review/[contentId]`,
  `PATCH /api/lead/review`. Approvals from these routes use
  `approveOrReject(..., { onlyFromReview: true })`, a write conditional on
  status and version. The owner's dashboard behaves as before.
- Review comments from a lead carry `authorRole: 'lead'` and their Contributor
  id (`Lesson.notes`).
- `components/review/LessonReview.jsx` is shared; `ReviewScreen` and
  `/editor/lead` pass their own endpoints. A reviewer's own lesson opens
  read-only.
- The editor layout reads `lead` from the database once per load to decide
  whether to show «الإشراف». The sidebar shows no count badge, to avoid a
  request on every page.
- The owner can open `/editor/lead` too. It shows the inbox of the editor's
  subject (`?subjectId=`).

### L2 — Team
- Member activity per subject (existing `ContributorActivity`), stale drafts,
  review turnaround.
- Assigning: `ownerId` set to a member, the member notified in their inbox.
- Pause: `Contributor.pausedUntil` / `pausedReason`. The guard refuses writes
  while paused, reads still work.
- Team announcement: the existing announcement mechanism, scoped to a subject.
- Subject handbook + review checklist: a lead-owned page; the checklist shows
  when approving.
- Away mode: `lead.awayUntil`. While a lead is away, or after 14 days with no
  activity, their reviews fall to the co-lead, then the owner.

**As built (2026-10-19):**
- `/editor/lead/team` («الفريق») — one request (`GET /api/lead/team`, five
  reads). It shows members with last activity, events in 30 days, lessons
  owned by status and pause state; the subject's leads and whether each is
  available; the median wait for a lead's decision; and the team's
  announcements. `POST /api/lead/team` takes `pause`, `unpause`, `assign`,
  `announce`, `unannounce` and `away`.
- Pause: `Contributor.paused`. Every content write handler passes
  `{ write: true }` to the guard, and `tests/writeGuard.test.js` fails on any
  that doesn't. A paused member sees a banner with the reason. A lead can't
  pause a co-lead or themself; pauses run 1–30 days or until lifted.
- Assign: sets `Lesson.ownerId`. The new owner is told through a targeted
  announcement on their dashboard, which their dashboard already loads.
- `/editor/guide` («دليل المادة», for everyone): `SubjectGuide` stores a
  handbook and a checklist of up to 15 items. The checklist appears in the
  review panel, and approving waits until every item is ticked.
- Away mode: a lead sets it on the team page. The owner's review queue marks
  each lesson whose subject has no lead available ("القائد غائب — بانتظارك").
- Turnaround counts only leads' decisions, measured from
  `reviewState.submittedAt`. The owner's own decisions aren't recorded in it.

### L3 — Recruiting
- Applicants whose **first** `subjectsOfInterest` is the lead's subject. Leads of
  the other subjects they picked see them read-only, as "also interested".
- Privacy: before approval, a lead sees answers, background, availability and
  the micro-task, but not email, age or town.
- **Snapshot the interview questions at invite time** onto the applicant. Today
  `resolveQuestions` runs again on submit (`api/interview/route.js`), so an edit
  mid-interview would mismatch the answers.
- Interview editing: only the subject's `subjectQuestionMap` entry, written with
  a positional update so two leads never overwrite each other.
- Approve / reject: a reason is required for a reject. Nothing is sent for
  **30 minutes** (`pendingDecision` + `decideAt`), so it can be undone. A cron
  route sends what is due. Approval puts the applicant in the lead's subject only.
- The owner gets a daily digest of decisions.

**As built (2026-10-19):**
- `/editor/lead/recruiting` («المتقدمون») has three tabs: the subject's
  applicants, those also interested, and the interview questions. Each tab is
  shown only with its permission, and the nav item hides when the lead has
  neither.
- What a lead sees is shaped by `lib/applicants.js` `shapeForLead`. Email,
  age, town and tokens are never read for a lead, and a test checks this.
- Decisions: `Contributor.pendingDecision` with `decideAt` 30 minutes ahead.
  A lead can decide only on someone who has answered the interview and whose
  first subject is theirs. Vercel's free plan runs cron at most once a day, so
  due decisions are applied by requests that happen anyway: the lead's
  applicant list, the owner's contributors list, and the applicant's own
  status page. `/api/cron/daily` is the backstop. Each decision is claimed with
  a conditional write before anything is sent, so it is applied and emailed
  exactly once. Approval sends the onboarding link; rejection sends nothing,
  the same as the owner's. Any decision the owner takes clears a lead's
  pending one.
- Snapshot: `issueInterview(contributor, role)` and the owner's
  `send_interview` store `interviewSnapshot`, and `/api/interview` reads it.
  Invites sent earlier still resolve from the role.
- Interview editing (`/api/lead/interview`) writes only the subject's
  `subjectQuestionMap` entry, using a positional `$set`, or a conditional
  `$push` when the entry is new. Existing question ids are kept. At most
  8 questions.
- Digest: `/api/cron/daily` at 05:00 UTC (`vercel.json`) emails every active
  admin a summary of the last 24 hours of lead actions, using
  `custom_message`. It only sends when leads did something. **Requires the
  `CRON_SECRET` environment variable on Vercel**; without it the route
  refuses to run.
- Not done here: a lead can't send or re-send an interview invite. Joining
  issues one automatically, and re-sending stays with the owner.

### L4 — Intervention
- Members edit lessons they own (`lessonOwnerId`) or are assigned to. Other
  lessons in the subject open read-only. *(Behaviour change — see Open
  decisions.)*
- A lead opens a member's lesson read-only with «تدخّل». They pick a category
  (urgent fix before release / factual error / author inactive / other) and
  write a reason of at least 20 characters.
- Each edit during an intervention: a `LessonHistory` action `'intervened'`
  with the reason as the note, an `editor` credit and `editsMade` for the lead.
  The author is notified with the reason and a link to the diff.
- Takeover (author inactive): `ownerId` changes with a reason; the author keeps
  `author` credit.
- Profiles show «ألّف» and «شارك في».
- The owner sees the intervention count per lead.

**As built (2026-10-19). Decision: owner-only, chosen by the user.**
- The rule is `lib/lessonAccess.js` `lessonAccess`. A lesson can be changed
  by its owner (`ownerId`, else `createdBy`), by the platform owner (admin),
  or by a lead while their own intervention on it is open.
  `assertCanEditLessons` enforces it on every lesson-content write: the
  lesson's own routes, sections, blocks, and questions and feed cards tied to
  a lesson. `tests/writeGuard.test.js` fails if a handler skips it. Comments
  and creating a new lesson stay open to every member, as do concepts, tags
  and exams.
- **Unclaimed scaffold:** a lesson whose owner is not a real person (the seed
  actor) is open to every member of its subject. The first member to save it
  claims it: `ownerId` is set with a conditional write, and they get an
  `author` credit. The editor says so before they save.
- The lesson GET returns `access`
  (`canEdit · via · canIntervene · owner · intervention`). Without edit
  rights, the editor shows `ReadOnlyLesson`: the student preview, comments
  and history, plus «تدخّل» and «تولَّ الدرس» for a lead who has
  canIntervene. Autosave is off in that view.
- Intervention (`lib/intervention.js`, `POST /api/lead/lessons`): a category
  and a reason (`Lesson.intervention`) open it for 24 h; one per lesson at a
  time. Opening writes a `LessonHistory` `'intervened'` entry and notifies the
  owner. Closing happens when the lead ends it, or on the first open after it
  expires. If the version moved in between, the lead gets an `editor` credit,
  and the history notes how many versions they made.
- Takeover: `ownerId` moves to the lead with a reason, and the author keeps
  `createdBy`.
- Profiles: «ألّف» (created, or claimed) and «شارك في» (edited or reviewed),
  published lessons only.
- Also fixed: `feed-items/[id]` PUT, PATCH and DELETE never checked the
  caller's subject.
- Known edge: linking a variation writes the *target* lesson. That is now
  refused when the target isn't yours.

### L5 — Publishing and oversight
- Release preview: the per-subject delta (lessons added, changed, removed).
- Cooldown: one release per subject per 24 h.
- The owner is notified of every release and can roll back with one click.
- Leads overview in the admin dashboard, built on `AuditEvent`: turnaround,
  approvals, interventions, applicant decisions, releases, open appeals.
- Appeals («اعتراض»): a member escalates a return, an intervention or a pause;
  the owner resolves it.
- Notifications: an in-app inbox, plus at most one digest email a day per lead.

---

## Free-tier cost

- Permission checks: 0 extra queries (the Contributor read already happens).
- Audit writes: 1 insert per lead action, after the response (`after()`).
- The inbox reuses the lesson queries the editor dashboard already makes, with
  a status filter. There is no polling anywhere.
- The digest is one cron run a day.

---

## Open decisions

1. **Name.** «المشرفون» already names admins in the dashboard. The working name
   is «قائد الفريق». Alternatively, rename the admin section to «الإدارة».
2. ~~Members editing each other's lessons~~: decided 2026-10-19, owner only
   (see L4).
3. **Undo window** for applicant decisions: 30 minutes is the proposal.

<div align="center">

<img src="Nafeer/public/logo.png" alt="Nafeer logo: two figures pulling each other up" width="112" />

# Nafeer · نفير

### Contributing to education should be easy.

Nafeer is the contribution platform behind **Basheer**, a free, offline-first study app<br/>
for Sudanese high-school students. People who know a subject write the lessons.<br/>
Nafeer takes care of everything between their keyboard and a student's phone.

[**Visit the site**](https://nafeer4sudan.site) · [**Try the Basheer preview**](https://nafeer4sudan.site/demo) · [**Become a contributor**](https://nafeer4sudan.site/prejoin)

</div>

<br/>

![The Nafeer landing page, introducing Basheer](docs/screenshots/landing-hero.jpg)

---

## First, Basheer

**Basheer** (بشير) is a study companion for the Sudanese high-school certificate (الشهادة السودانية), the exam that decides what a student can go on to study. It takes its inspiration from Duolingo: short sessions, daily habits, practice that adapts to you. Everything else about it is shaped around the Sudanese student. It is in active development.

<table>
<tr>
<td width="50%" valign="top">

### 📴 Offline first

A student in Sudan cannot count on a connection, so Basheer does not ask for one. The curriculum ships inside the app. Lessons, practice and progress all work with no internet at all.

</td>
<td width="50%" valign="top">

### 🧠 Intelligent by design

Basheer is built to notice what a student has studied and where they stumble, bring a concept back just before it would be forgotten, and assemble practice around the gaps. All of it runs on the phone.

</td>
</tr>
<tr>
<td valign="top">

### 📚 The curriculum, made visible

Basheer does not replace the Sudanese curriculum. It takes the same units and lessons students already study and gives them structure, illustration, worked examples and connections between ideas.

</td>
<td valign="top">

### 🎯 Built around the exam that matters

Past ministry exams, organised by subject, unit and difficulty, sit at the centre of the question bank, alongside a swipeable feed of bite-sized cards for the minutes between everything else.

</td>
</tr>
</table>

> A student who memorises to answer becomes a student who understands to build.

## Then, Nafeer

An app like that is only as good as what is inside it: thousands of lessons, questions and revision cards across fourteen subjects. No one person can write all of that.

In Sudan, a *nafeer* (نفير) is what happens when a community gathers to build something none of them could build alone: a house, a harvest. This project borrows the word on purpose.

**Nafeer is how that community gets its knowledge into Basheer.**

### Who it is for

Not only teachers. The people best placed to explain a subject are often the ones who went on to use it:

- **Teachers and educators**, who know where students get lost.
- **Graduates and university students**, who sat this exam recently and remember what they wish someone had told them.
- **Specialists in their field**: the engineer who can show what a physics law is actually for, the doctor who can make a biology chapter mean something, the programmer, the accountant, the historian.

You do not need to be a teacher. You need to know your subject and be able to explain it to someone hearing it for the first time.

The point of all of it is simple: somewhere there is a student whose plans depend on this exam, and a clear explanation from someone who has been where they want to go can change how far they get.

### What it takes off your hands

Someone who wants to help should be able to sit down and write a lesson. They should not have to learn what a database is, how an app stores a lesson, or how an update reaches a phone. **Nafeer exists so they never have to.**

## Nafeer at a glance

<table>
<tr>
<td width="50%" valign="top">

### ✍️ Write, don't configure

Lessons are assembled from simple blocks: a paragraph, a worked example, a formula, an image, a highlighted definition. Questions come as eleven ready-made formats. No code, no file formats, nothing to install.

</td>
<td width="50%" valign="top">

### 🧭 Never a blank page

Each subject arrives already laid out from the official curriculum, with every unit and lesson waiting to be filled. Contributors always know what exists and what is missing.

</td>
</tr>
<tr>
<td valign="top">

### 🏅 Your work, under your name

Every lesson records who wrote it, who edited it and who reviewed it. Contributors get a public profile, live statistics, an activity calendar, and badges for real milestones.

</td>
<td valign="top">

### ✅ Reviewed before it ships

Nothing reaches a student without approval. Edit an approved lesson, even by one word, and it goes back through review. Every change is versioned, with a full history.

</td>
</tr>
<tr>
<td valign="top">

### 📶 Built for weak connections

The core curriculum ships inside the app. When content is added or improved later, phones fetch only what changed, not the whole subject again.

</td>
<td valign="top">

### 🤝 One system, two halves

Nafeer and Basheer were designed together. The editor can only produce what the app can display, and feedback from students flows back to the people writing for them.

</td>
</tr>
</table>

## From a contributor to a student

```mermaid
flowchart LR
    C["<b>Contributor</b><br/>writes a lesson"]
    N["<b>Nafeer</b><br/>structures it,<br/>versions it,<br/>credits it"]
    R["<b>Review</b><br/>approved, or<br/>sent back with notes"]
    P["<b>Publish</b><br/>bundled in the app,<br/>updated over the air"]
    B["<b>Basheer</b><br/>on the student's<br/>phone, offline"]

    C --> N --> R --> P --> B
    B -.->|student feedback| N
```

1. **Write.** A contributor fills in a lesson, adds questions and study cards, and saves.
2. **Submit.** One button sends it for review.
3. **Review.** The subject's team lead, or the project owner, approves it or returns it with notes pinned to the exact place that needs work. Nobody approves their own lesson.
4. **Publish.** Approved content becomes part of Basheer. The base curriculum is bundled into the app itself; later additions and corrections are packaged as small updates containing only what changed.
5. **Learn.** A student opens the lesson, with or without a connection.

## A look inside

<table>
<tr>
<td width="50%" valign="top">

![The lesson editor](docs/screenshots/editor-lesson.png)

**The lesson editor.** Four steps: details, content, questions, study cards. Review, history, notes, preview and save sit along the top, with the author's name and version number just beneath.

</td>
<td width="50%" valign="top">

![The form for adding a question](docs/screenshots/editor-question-form.png)

**Adding a question.** Pick a format (true/false, multiple choice, matching, compare, put in order and more) and the form reshapes itself to fit. This is what "no technical knowledge required" looks like.

</td>
</tr>
</table>

![The public progress board](docs/screenshots/landing-progress.jpg)

<sub><b>"This is what has been built so far."</b> A live board on the landing page shows every subject and how complete it is. Its subtitle reads: "Every progress bar was built by a real person. Empty bars are open seats."</sub>

The whole product is in Arabic and reads right to left, including properly typeset Arabic mathematics.

## Credit is part of the design

The joining page makes contributors a promise: *real impact, under your name.* The system is built to keep it.

- **Attribution on everything.** Created by, last edited by, reviewed by.
- **Statistics that count themselves.** Lessons, questions, study cards, edits, reviews and time spent, tallied as people work.
- **A public profile** with a shareable link, an activity calendar and streaks.
- **Badges** in bronze, silver, gold and special tiers: first published lesson, ten quality reviews, founding member, and more.
- **Finished work counts most.** When a lesson is approved, the credit goes to its author, and the ranking weights approved lessons and helping to review others above simply creating drafts.
- **Credit survives everything.** A lesson belongs to the person who wrote or took it on. If a team lead later corrects it, both names stay: the profile lists what someone *wrote* and what they *contributed to*.

## How the work is organised

A project like this needs more than one reviewer, but handing out full control is not the answer either. Nafeer has three roles, and each can do only what it needs to:

| | Who | What they can do |
|---|---|---|
| **Contributor** | Anyone accepted to write for a subject | Write and improve *their own* lessons, take on unclaimed ones, comment on everyone's |
| **Team lead** | An experienced contributor, appointed per subject (one, or two to review each other) | Review the subject's lessons, guide the team, recruit, and request releases, each permission switched on individually by the owner |
| **Owner** | The project's maintainer | Everything, including appointing leads and the final say |

The rules that keep this fair are built into the system, not left to good intentions:

- **Nobody approves their own work.** A lead's lesson is reviewed by the other lead, or by the owner.
- **Decisions that affect a person carry a written reason**, and the person can **appeal** directly to the owner.
- **Some decisions wait before they take effect.** Accepting or rejecting an applicant can be undone for 30 minutes. A lead's release to the app is held for 3 hours, and the owner is told at once and can stop it.
- **A lead can step into a member's lesson only openly:** for 24 hours, with a stated reason that the author sees, and every change recorded under the lead's name.
- **Everything a lead does is on the record,** in one log the owner reviews, with a daily summary.

The full design is in [docs/team-leads.md](docs/team-leads.md).

## Where it stands

Nafeer is a working system, built and maintained by one person, and it is recruiting its first contributors. Most subjects are still empty, which is exactly what the progress board is for.

| | |
|---|---|
| **Working today** | Joining flow with a written interview · the full editor, with autosave · versioning, history and notes · review with comments pinned in place · per-subject team leads, with reviewing, recruiting and releases · lesson ownership, with an open, recorded way for a lead to step in · appeals · contributor profiles, statistics and badges · coverage tracking · change-only publishing to the app · admin dashboard · email, with daily summaries · self-service password reset for contributors · automated CI checks on pull requests and pushes to `main` · announcements, surveys and student feedback · an interactive preview of Basheer · conflict-safe editing: two people saving at once never overwrite each other · rate limits on sign-in and public forms, and security headers · an automated test suite · a separate development database with test accounts |
| **Partly there** | History compares a lesson's details, not its individual blocks · lesson variations exist but are not counted in coverage · a published release cannot be rolled back to an earlier version; a subject can be switched off in the app and fixed forward · rejection emails are sent by hand |
| **On the roadmap** | The first two years of secondary school · student challenges and leaderboards · explanations that adapt to the learner · an interactive science and maths lab |

---

## Under the hood

The technology is deliberately ordinary. What is worth a look is how it is arranged to keep complexity away from contributors and downloads small for students.

| Layer | Choice |
|---|---|
| Web app | Next.js 15, React 19, Tailwind CSS, plain JavaScript |
| Working database | MongoDB Atlas (Mongoose) |
| Files and published content | Supabase Storage |
| What the app reads | Firebase Firestore |
| Email | Resend |
| Scheduled work | Vercel Cron, once a day |
| Tests | Vitest |
| Also | Zustand (editor state), KaTeX (math), sharp (images), dnd-kit (drag and drop), GSAP (animation) |
| Hosting | Vercel. The whole project runs on free tiers, and is designed to: no paid services, no polling, no background workers. |

<details>
<summary><b>Architecture</b></summary>

<br/>

```mermaid
flowchart LR
    subgraph Web["Nafeer (Next.js on Vercel)"]
        UI["Landing, join flow,<br/>editor, admin dashboard"]
        API["API routes"]
    end

    Mongo[("MongoDB Atlas<br/>content, contributors,<br/>history, email logs")]
    Supa[("Supabase Storage<br/>media, avatars,<br/>published bundles")]
    Fire[("Firestore<br/>content manifest, feature flags,<br/>app feedback and surveys")]
    Mail["Resend"]
    Cron["Vercel Cron<br/>daily"]
    App["Basheer<br/>Android app"]

    Cron --> API
    UI --> API
    API --> Mongo
    API --> Supa
    API --> Fire
    API --> Mail
    Supa -->|content updates and media| App
    Fire -->|what is current| App
    App -->|student feedback| Fire
```

**MongoDB is the working copy.** Everything contributors write lives there with its history. Students' phones never talk to it.

**Firestore and Supabase are the published copy.** A publish writes content bundles to storage and updates one index of what is current.

The split means the editing side can be slow, experimental or briefly broken with no effect on students.

**Who may do what is decided on the server, on every request.** A contributor's session says who they are; what they may touch is read fresh each time: their subject, whether they lead it, which permissions they hold, whether they own the lesson, whether they are paused. A permission taken away takes effect on the very next click, not when a session expires.

Content has a fixed shape:

```
Subject → Units → Lessons → Sections → Blocks      what a student reads
Concepts → Study cards                              what a student revises
Questions → Exams                                   what a student practises
```

Concepts tie the three together: one concept can be linked to the section that teaches it, the cards that drill it and the questions that test it.

</details>

<details>
<summary><b>How publishing works</b></summary>

<br/>

Basheer gets its content two ways. The base curriculum is exported from Nafeer and bundled into the app, so a fresh install is useful with no connection. After that, additions and corrections travel over the air.

The over-the-air path is handled by a small **delta engine**. On each publish it:

- gathers everything approved for the subject,
- gives every item a fingerprint based on its identity and when it last changed,
- compares those fingerprints with the previous release to find what is new, changed or removed,
- packages only those differences, in files named after their own contents so nothing is ever uploaded twice.

Content versions read `MAJOR.patch`. The patch number rises automatically when a publish contains real changes; the major number is raised by hand for a significant release. If nothing changed, nothing is written.

A full export of a whole subject is also available, for the bundled baseline and for recovery.

Every publish can first be run as a **dry run**: the same pipeline, stopped before anything is uploaded, reporting exactly what would change. A team lead sees that preview before asking for a release; the release is then held for three hours, so the owner can cancel it, and goes out through the same code the owner uses. Once a release is live, the owner can switch a subject off in the app at any time.

The logic lives in [`deltaEngine.js`](Nafeer/src/lib/deltaEngine.js), [`publishSubject.js`](Nafeer/src/lib/publishSubject.js) and [`releases.js`](Nafeer/src/lib/releases.js).

</details>

<details>
<summary><b>Design decisions</b></summary>

<br/>

- **Publish, don't serve.** The app never reads the editing database. It costs an explicit publish step and buys an app that works whatever state the CMS is in.
- **One catalogue, permanent IDs.** [`curriculum.js`](Nafeer/src/shared/curriculum.js) defines every subject, unit and lesson slot. IDs like `GEOGRAPHY_U1_L1` never change, so retitling a lesson cannot break a student's progress.
- **Content types are a contract.** [`constants.js`](Nafeer/src/shared/constants.js) mirrors the app's own type definitions and the editor's menus are generated from it.
- **One versioning rule for everything.** A single function bumps versions for every content type. It is also where "editing approved content returns it to draft" is enforced, so a new feature cannot forget it.
- **Credit never slows down writing.** Contribution counters update in the background and are allowed to fail quietly.
- **Badges are calculated, not stored,** so they cannot drift out of date when a rule changes.
- **Local-first editing.** The editor updates instantly, with IDs generated in the browser, and saves only what changed: after a pause in typing, and when you leave a lesson.
- **Edits are checked, not overwritten.** Every saved item carries a version, and a save only lands on the version the editor started from. When two people change the same block, nobody's work disappears: the second person sees both versions, with the differences highlighted, and decides which one stays.
- **Separate sessions for contributors and admins.** Contributors can reach only their assigned subject, checked on the server for every request.
- **Permissions, not ranks.** There is no "level" a user climbs. Every protected action names one permission on one subject, so a lead of physics is an ordinary contributor in geography, and a lead can be trusted with reviewing before they are trusted with publishing.
- **A lesson has one owner.** Only its owner changes it; the curriculum scaffold is taken on with one deliberate click, never by accident. Everyone else reads, comments, and keeps their credit.
- **One audit log.** Every decision a lead takes is written to the same append-only record, with its reason, so oversight is a query rather than an investigation.
- **Waiting without servers.** Undo windows and release holds need something to act when time runs out. Rather than a paid scheduler, due work is picked up by requests that happen anyway, with a daily job as the backstop, and every such step claims its work first so it can never run twice.

</details>

<details>
<summary><b>Testing, and a safe place to develop</b></summary>

<br/>

**The test suite** (Vitest) runs in seconds and needs no database: 449 tests across 33 files. It covers what would hurt most if it broke:

- **Access control.** Every permission against every kind of caller: a member, a lead of the subject, a lead of another subject, a lead without that permission, the owner. Paused members, ownership of lessons, and the "nobody approves their own work" rule.
- **The workflows.** Review and resubmission, interventions, recruiting decisions and their undo window, releases and their hold, appeals, the daily summaries.
- **Data safety.** Edit conflicts between two people, versioning, the editor's local-first sync, rate limits, image processing.
- **Tests that read the code itself.** Two checks scan every route that writes content and fail if one forgets to verify that its caller may write, or forgets to check who owns the lesson. A new feature cannot quietly skip a rule.

**A separate development database.** Local development never touches live data. It runs against its own database, `nafeer_dev`, on the same cluster, and a guard refuses the dev tools anywhere else. On that database, emails are printed instead of sent, and publishing to the app is refused (a dry-run preview still works).

**Test accounts for every situation.** One command fills the dev database with a subject's curriculum and a cast of people: a lead with every permission, a second lead, members with lessons in review, returned and forgotten, a paused member, a lead of another subject, and two applicants. A dev-only page signs you in as any of them with one click, so any flow can be tried from every side in a minute.

Details: [docs/dev-database.md](docs/dev-database.md).

</details>

<details>
<summary><b>Running it locally</b></summary>

<br/>

You need Node.js 20 or later, plus your own MongoDB database, Supabase project and Firebase project.

```bash
cd Nafeer
```

```bash
npm install
```

Create `Nafeer/.env.local`:

```bash
MONGODB_URI=
JWT_SECRET=                   # long random string: openssl rand -base64 32
NEXT_PUBLIC_APP_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_MEDIA_BUCKET=basheer-media
SUPABASE_USERS_BUCKET=nafeer-users
SUPABASE_EXPORTS_BUCKET=content-exports

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

RESEND_API_KEY=               # optional
RESEND_WEBHOOK_SECRET=
EMAIL_FROM=
EMAIL_REPLY_TO=

ADMIN_USERNAME=               # used once, by the seed script
ADMIN_PASSWORD=
ADMIN_EMAIL=

CRON_SECRET=                  # production: guards the daily job (openssl rand -hex 32)
```

Point development at its own database by creating `Nafeer/.env.development.local`. Next.js reads it only for `npm run dev`, never for builds or in production:

```bash
MONGODB_DB=nafeer_dev
```

Fill it with roles, the first admin, a curriculum and test accounts, then start the server:

```bash
npm run seed:dev
```

```bash
npm run dev
```

The site runs at `http://localhost:3000`. Open `http://localhost:3000/dev/login` to sign in as any test account, or as the admin.

For a production database, `npm run seed` creates only the default roles and the first admin.

Run the tests (Vitest; no database needed):

```bash
npm test
```

Set `JWT_SECRET` everywhere but your own laptop. Without it, development falls back to a placeholder key, and production refuses to sign or accept sessions at all.

In production, set `CRON_SECRET` in Vercel. Vercel sends it with each scheduled call, and the daily job refuses to run without it.

</details>

<details>
<summary><b>Finding your way around</b></summary>

<br/>

| Where | What |
|---|---|
| [`Nafeer/src/app`](Nafeer/src/app) | Pages and API routes: `editor/` for contributors and leads, `admin/` for the owner, `api/` for everything the browser calls |
| [`Nafeer/src/lib`](Nafeer/src/lib) | The rules: [`api/guard.js`](Nafeer/src/lib/api/guard.js) (who may do what), [`leads.js`](Nafeer/src/lib/leads.js), [`lessonAccess.js`](Nafeer/src/lib/lessonAccess.js), [`review.js`](Nafeer/src/lib/review.js), [`audit.js`](Nafeer/src/lib/audit.js), and the publishing pipeline |
| [`Nafeer/src/lib/models`](Nafeer/src/lib/models) | The database schemas |
| [`Nafeer/src/shared`](Nafeer/src/shared) | The curriculum catalogue and content types shared with the app |
| [`Nafeer/src/components`](Nafeer/src/components) | The interface: `ui/` is the design system, `editor/` the editor |
| [`Nafeer/tests`](Nafeer/tests) | The test suite |
| [`Nafeer/scripts`](Nafeer/scripts) | Seeding and one-off maintenance |
| [`docs/team-leads.md`](docs/team-leads.md) | Roles, permissions and safeguards: the full design, with what was built in each phase |
| [`docs/dev-database.md`](docs/dev-database.md) | The development database and test accounts |
| [`docs/design-system.md`](docs/design-system.md) | The visual design system |

</details>

---

## Try Basheer

Basheer's own repository is private while the app is in development. You can walk through an interactive preview of it in the browser at [nafeer4sudan.site/demo](https://nafeer4sudan.site/demo).

## The story

Nafeer and Basheer were designed and built by **Altayeb Abdeljalil**.

In 2024 he was relearning mathematics and statistics in order to move into AI, and kept running into things he had already been taught. The physics from school explained how modern engines work. The mathematics he had memorised turned out to be the language of today's algorithms. Nobody had told him so at the time.

He came away convinced that the Sudanese curriculum is fundamentally sound, but taught in isolation: no context, no connection to the wider world. Basheer is an attempt to add what was missing, not to change the curriculum. Nafeer is the recognition that one person cannot write it alone.

[Portfolio](https://altyeb.my) · [GitHub @altyebv](https://github.com/altyebv) · [LinkedIn](https://www.linkedin.com/in/altyebv)

If you teach, have graduated, or simply know a subject well, the [contributor brief](https://nafeer4sudan.site/prejoin) is the place to start.

## License

Nafeer's code is released under the [GNU Affero General Public License v3.0](LICENSE). You are free to read it, run it, change it and share it. If you distribute a modified version, or run one as a service for others, you must share your changes under the same license.

The Nafeer and Basheer names and logos are not covered by that license. Educational content written by contributors lives in the platform, not in this repository.

Copyright © 2024–2026 Altayeb Abdeljalil.

<div align="center">
<br/>

*ما لا يبنيه شخص واحد، يبنيه النفير*<br/>
<sub>What one person cannot build, the nafeer builds.</sub>

</div>

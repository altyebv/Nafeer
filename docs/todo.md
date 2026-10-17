# To do

Open items that need a decision or a check before they are done. Remove an
item when it is finished; put the commit next to it in the commit message.

## Before production

- [ ] **Review the bootstrapping before production.**
  Subjects, units and lessons are created ("bootstrapped") from the catalog
  in `src/shared/curriculum.js` by `bootstrapSubject` (`src/lib/api/subject.js`).
  It is reachable from several places, and each should be checked for what it
  does to existing data and who may call it:
  - the editor, on load, when the contributor's subject is not in Atlas yet
    (`useAtlasSync` → `POST /api/content/subject`; since 2026-10-17 only when
    the GET finds no subject — before that, on every editor load);
  - the admin subject page's «أكمل» and «ابذرها» (`POST /api/admin/seed`,
    actions `bootstrap`, `bootstrap_all`, `reseed`, `wipe`, `wipe_stale`);
  - the remote import (`POST /api/admin/remote-subjects/import`, which wipes
    the subject first);
  - `npm run seed`.

  Questions to settle: should a contributor's first editor load ever write
  (or should seeding be admin-only)? Is `reseed`/`wipe` safe once real
  content exists — they delete lessons with their sections and blocks? Does
  the seed actor own anything a person should? Local development writes to
  the live database, so a separate development database belongs in the
  same review.

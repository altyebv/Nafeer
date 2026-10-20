# Local development database

Local development uses its own database, `nafeer_dev`, on the same Atlas
cluster as production. Nothing you do on `localhost` reaches the live data,
and it costs nothing extra on the free tier.

## How it works

- `Nafeer/.env.development.local` sets `MONGODB_DB=nafeer_dev`. Next.js reads
  that file **only for `next dev`**, never for `next build`, `next start` or
  on Vercel, so production keeps using the database in `MONGODB_URI`.
- `src/lib/db.js` passes `MONGODB_DB` to Mongoose as `dbName`. If `next dev`
  runs without it, the server prints a warning that it is using the live
  database.
- The file is git-ignored (`.env*.local`). Each clone creates its own.

## Guard rails on the dev database

| What | On `nafeer_dev` |
|---|---|
| Email (`lib/email/emailService.js`) | rendered and printed to the server log, **not sent** |
| Publishing (`lib/publishSubject.js`) | refused — would upload to the live storage bucket and the app manifest. Previews (dry runs) work. |
| Dev sign-in (`/api/dev/autologin`) | works; refused on any other database |
| `npm run seed:dev` | works; refused on any database not ending in `_dev` |

## Setting it up

```bash
cd Nafeer
npm run seed:dev
npm run dev
```

Then open <http://localhost:3000/dev/login>.

`npm run seed:dev` runs `scripts/seed.js` (contributor roles and the admin
from `ADMIN_USERNAME`/`ADMIN_PASSWORD`). It then builds the Geography and
Physics scaffolds and the test personas of `src/lib/devPersonas.js`. Run it
again at any time to put everything back into its starting state.

## The personas

`/dev/login` signs you in as any of them with one click. Signing in as a
contributor also drops the admin cookie, because the API treats a request
carrying it as the owner's.

| Persona | Situation |
|---|---|
| سارة `dev_lead` | Geography lead, every permission |
| خالد `dev_colead` | Second Geography lead, default permissions; reviews Sara's lesson |
| منى `dev_member` | A lesson waiting for review, one approved |
| عمر `dev_member2` | A lesson returned with a comment, a stale draft |
| هالة `dev_paused` | Paused by Sara for 7 days |
| ياسر `dev_physics_lead` | Physics lead, no say over Geography |
| ريم / طارق | Geography applicants: one answered, one not yet |

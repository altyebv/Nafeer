import { connectDB }        from '@/lib/db';
import { Contributor }      from '@/lib/models/Contributor';
import { SYSTEM_SEED_USERNAME } from '@/lib/SeedActor';

// ── Public contributor reads ──────────────────────────────────────────────────
//
// Shared by the profile page (server-rendered), the sitemap and
// GET /api/contributors/public, so the projection and the visibility filter
// can't drift between them. A contributor is public only once approved AND
// onboarded — anything else is an application in progress.

export const PUBLIC_FIELDS = {
  name: 1, username: 1, avatarUrl: 1, bio: 1,
  subject: 1, role: 1, stats: 1, createdAt: 1, updatedAt: 1,
};

export const PUBLIC_FILTER = { status: 'approved', onboarded: true };

// ── Indexability ──────────────────────────────────────────────────────────────
//
// Public and indexable are two different questions, and conflating them is what
// put `/contributor/zee` in Google with the meta description
// "hilyug7ukitgmk7tgkitr7kr7kr7k". PUBLIC_FILTER answers "may this page be
// served" — approved and onboarded. This answers "is there enough here to be
// worth a search result", and it is deliberately stricter.
//
// A profile that fails is not hidden: it still renders, still returns 200 and
// still works as a link someone shares. It just carries `noindex`, stays out of
// the sitemap, and emits no Person structured data — because a thin or junk
// profile in a six-page index drags the whole site's quality signal down.
//
// The two thresholds catch the two failure modes actually seen in production:
//
//   • No bio at all — the page falls back to a generated sentence, which is the
//     same sentence on every such profile. `dev_contributor` is this case.
//   • A bio that is keyboard mash — short and, tellingly, a single unbroken
//     token. `zee` is this case at 29 characters and zero spaces, so a length
//     check alone would not have caught it.
//
// Not a spam filter and not trying to be one. It is the floor below which a
// page has nothing a searcher could want.
const MIN_BIO_CHARS = 40;
const MIN_BIO_WORDS = 5;

export function isIndexableContributor(c) {
  if (!c || !c.username) return false;

  // Synthetic authorship account — a real row, never a real person.
  if (c.username === SYSTEM_SEED_USERNAME) return false;

  const bio = (c.bio || '').trim();
  if (bio.length < MIN_BIO_CHARS) return false;

  return bio.split(/\s+/).filter(Boolean).length >= MIN_BIO_WORDS;
}

// Mongo documents cross into React Server Components, so ObjectId and Date have
// to become plain strings before they do.
function serialize(doc) {
  if (!doc) return null;
  return {
    ...doc,
    _id:       doc._id?.toString() ?? null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };
}

export async function getPublicContributor(username) {
  if (!username) return null;
  await connectDB();

  const doc = await Contributor
    .findOne({ ...PUBLIC_FILTER, username }, PUBLIC_FIELDS)
    .lean();

  return serialize(doc);
}

export async function listPublicContributors() {
  await connectDB();

  const docs = await Contributor
    .find(PUBLIC_FILTER, PUBLIC_FIELDS)
    .lean();

  return docs.map(serialize);
}

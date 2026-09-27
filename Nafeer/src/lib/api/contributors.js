import { connectDB }   from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

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

import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';

// Synthetic account that seeded content is attributed to. Not a person, so it
// is kept out of the sitemap and its profile page is noindex.
export const SYSTEM_SEED_USERNAME = 'system_seed';

// Accounts that are not people: the seed actor above and the development
// autologin account (dev@nafeer.local). Both use the reserved .local domain,
// which no real signup can have. Spread into any query that lists, counts or
// messages people — local development writes to the live database, so the
// dev account would otherwise show on the public site.
export const REAL_PEOPLE = { email: { $not: /@nafeer.local$/i } };

const SYSTEM_CONTRIBUTOR = {
  email: 'system.seed@nafeer.local',
  username: SYSTEM_SEED_USERNAME,
  name: 'System Seed',
};

export async function ensureSystemSeedContributor() {
  // Must connect before any Mongoose query — callers may run before connectDB()
  // (cold-start serverless: this fires in the route before the lib function
  // that owns the connectDB call, causing a "no connection" crash → 500).
  await connectDB();

  let contributor = await Contributor.findOne({ email: SYSTEM_CONTRIBUTOR.email }).select('_id');
  if (contributor) return contributor._id.toString();

  contributor = await Contributor.create({
    ...SYSTEM_CONTRIBUTOR,
    subject: '',
    background: 'System-generated actor for curriculum bootstrap operations.',
    status: 'approved',
    onboarded: true,
  });

  return contributor._id.toString();
}
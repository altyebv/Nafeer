import { Contributor } from '@/lib/models/Contributor';

const SYSTEM_CONTRIBUTOR = {
  email: 'system.seed@nafeer.local',
  username: 'system_seed',
  name: 'System Seed',
};

export async function ensureSystemSeedContributor() {
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

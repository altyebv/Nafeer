// One-off: set every contributor's "created" counters to what they actually
// authored, counted from the content by `createdBy` (see src/lib/authoredStats.js).
//
//   npm run stats:reconcile            show what would change, write nothing
//   npm run stats:reconcile -- --apply write it
//
// Effort counters (editsMade, commentsPosted, totalTimeMs, …) are left alone.

import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes('--apply');

const { connectDB } = await import('@/lib/db');
const { reconcileAuthoredStats } = await import('@/lib/authoredStats');
const { default: mongoose } = await import('mongoose');

await connectDB();
const changes = await reconcileAuthoredStats({ dryRun: !apply });

if (!changes.length) {
  console.log('Every counter already matches the content.');
} else {
  for (const { username, diff } of changes) {
    const parts = Object.entries(diff).map(([f, { from, to }]) => `${f} ${from} → ${to}`);
    console.log(`${username || '(no username)'}: ${parts.join(', ')}`);
  }
  console.log(apply
    ? `\nUpdated ${changes.length} contributor(s).`
    : `\n${changes.length} contributor(s) would change. Run with --apply to write.`);
}

await mongoose.disconnect();
process.exit(0);

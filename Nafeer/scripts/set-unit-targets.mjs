// One-off: give every unit without a lesson target the number of lessons it
// has now. Targets used to be `lessonCount` in the code catalog, and every
// subject was seeded with exactly that many lessons, so today's count is the
// catalog's number. Without this, a unit's target would grow with each lesson
// a contributor adds (lib/api/subject.js unitTarget).
//
//   npm run units:targets                  dev database, show what would change
//   npm run units:targets -- --apply       dev database, write it
//   npm run units:targets:prod             live database, show what would change
//   npm run units:targets:prod -- --apply  live database, write it

import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const apply = process.argv.includes('--apply');

const { connectDB } = await import('@/lib/db');
const { Unit } = await import('@/lib/models/Unit');
const { Lesson } = await import('@/lib/models/Lesson');
const { default: mongoose } = await import('mongoose');

await connectDB();
console.log(`Database: ${mongoose.connection.name}\n`);

const [units, counts] = await Promise.all([
  Unit.find({ targetLessons: null }).select('subjectId contentId').sort({ subjectId: 1, order: 1 }).lean(),
  Lesson.aggregate([{ $group: { _id: '$unitContentId', n: { $sum: 1 } } }]),
]);
const lessonsIn = new Map(counts.map((c) => [c._id, c.n]));

const bySubject = {};
for (const u of units) {
  (bySubject[u.subjectId] ??= []).push({ id: u._id, contentId: u.contentId, target: lessonsIn.get(u.contentId) || 0 });
}

for (const [subjectId, rows] of Object.entries(bySubject)) {
  const total = rows.reduce((n, r) => n + r.target, 0);
  console.log(`${subjectId}: ${rows.length} unit(s) → ${total} lessons (${rows.map((r) => r.target).join(', ')})`);
}

if (!units.length) {
  console.log('Every unit already has a target.');
} else if (apply) {
  await Unit.bulkWrite(Object.values(bySubject).flat().map((r) => ({
    updateOne: { filter: { _id: r.id, targetLessons: null }, update: { $set: { targetLessons: r.target } } },
  })));
  console.log(`\nSet the target of ${units.length} unit(s).`);
} else {
  console.log(`\n${units.length} unit(s) would get a target. Run with --apply to write.`);
}

await mongoose.disconnect();
process.exit(0);

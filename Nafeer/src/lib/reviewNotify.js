// ─── reviewNotify.js ──────────────────────────────────────────────────────────
// Tell a lesson's author when the reviewer approves or returns it (UX queue 4).
// One email per decision. The author is the first real person among the
// lesson's creator and last editor — scaffolded lessons are "created" by the
// seed account, which never gets mail.

import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { Contributor } from '@/lib/models/Contributor';
import { REAL_PEOPLE } from '@/lib/SeedActor';
import { sendEmail } from '@/lib/email/emailService';
import { appUrl } from '@/lib/appUrl';

/** @param outcome 'approved' | 'returned' */
export async function notifyLessonReviewed(contentId, outcome, { comments = 0 } = {}) {
  try {
    await connectDB();
    const lesson = await Lesson.findOne({ contentId }, 'title createdBy updatedBy').lean();
    if (!lesson) return;
    const ids = [lesson.updatedBy, lesson.createdBy].filter(Boolean);
    const people = await Contributor.find({ _id: { $in: ids }, ...REAL_PEOPLE }, 'name email').lean();
    // Prefer the last editor: on a returned-then-resent lesson, that is who wrote it.
    const author = ids.map((id) => people.find((p) => String(p._id) === String(id))).find(Boolean);
    if (!author?.email) return;
    await sendEmail({
      to: author.email,
      template: 'lesson_reviewed',
      data: {
        name: author.name?.split(' ')[0],
        title: lesson.title,
        outcome,
        comments,
        link: appUrl(`/editor/lessons/${encodeURIComponent(contentId)}`),
      },
    });
  } catch (e) {
    console.warn('[notifyLessonReviewed]', e.message);
  }
}

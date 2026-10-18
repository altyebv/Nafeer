import { verifyAdminToken } from '@/lib/adminAuth';
import { getLessonWithContent } from '@/lib/api/lessons';
import { Question } from '@/lib/models/Question';
import { FeedItem } from '@/lib/models/FeedItem';
import { Contributor } from '@/lib/models/Contributor';
import { REAL_PEOPLE } from '@/lib/SeedActor';

const ok  = (data) => Response.json({ ok: true, data });
const err = (msg, status = 400) => Response.json({ ok: false, error: msg }, { status });

// ─── GET /api/admin/review-queue/[contentId] ──────────────────────────────────
// Everything the reviewer reads in one request (DS2 step 3): the lesson and
// its details, sections with their blocks, its questions and feed cards — the
// parts a review comment can be anchored to (lib/review.js ANCHOR_KINDS) —
// plus every review comment from earlier rounds and who wrote the lesson.
export async function GET(_request, { params }) {
  try {
    const admin = await verifyAdminToken();
    if (!admin) return err('غير مصرح', 401);
    const { contentId } = await params;

    const lesson = await getLessonWithContent(contentId);
    if (!lesson) return err('الدرس غير موجود', 404);

    const [questions, feedItems, author] = await Promise.all([
      Question.find({ lessonContentId: contentId, isCheckpoint: { $ne: true } }, 'contentId textAr type difficulty correctAnswer options').sort({ createdAt: 1 }).lean(),
      FeedItem.find({ lessonContentId: contentId }, 'contentId type contentAr back correctAnswer').sort({ order: 1 }).lean(),
      // Seeded lessons are created by the seed actor; the author is whoever
      // wrote in it, so take the first real person of creator and last editor.
      Contributor.findOne({ _id: { $in: [lesson.createdBy, lesson.updatedBy].filter(Boolean) }, ...REAL_PEOPLE }, 'name username').lean(),
    ]);

    const review = (lesson.notes || [])
      .filter((n) => n.noteType === 'review_feedback')
      .map((n) => ({
        id: String(n._id), text: n.text, anchor: n.anchor || { kind: 'lesson' }, round: n.round ?? 0,
        resolved: !!n.resolved, resolvedAt: n.resolvedAt || null, resolvedByName: n.resolvedByName || null,
        createdAt: n.createdAt, authorName: n.authorName,
      }));

    return ok({
      id: lesson.contentId,
      subjectId: lesson.subjectId,
      unitContentId: lesson.unitContentId,
      title: lesson.title,
      summary: lesson.summary,
      status: lesson.status,
      version: lesson.version,
      estimatedMinutes: lesson.estimatedMinutes,
      hook: lesson.metadata?.hook || null,
      hookAnswer: lesson.metadata?.hookAnswer || null,
      reviewState: lesson.reviewState || null,
      author: author ? { name: author.name, username: author.username } : null,
      sections: lesson.sections.map((s) => ({
        id: s.contentId, title: s.title, kind: s.kind || 'GENERAL',
        blocks: s.blocks.map((b) => ({ id: b.contentId, type: b.type, content: b.content, caption: b.caption })),
      })),
      questions: questions.map((q) => ({ id: q.contentId, text: q.textAr, type: q.type, difficulty: q.difficulty, answer: q.correctAnswer })),
      feed: feedItems.map((f) => ({ id: f.contentId, type: f.type, text: f.contentAr, back: f.back })),
      review,
    });
  } catch (e) {
    console.error('[GET /api/admin/review-queue/[contentId]]', e);
    return err('خطأ في الخادم', 500);
  }
}

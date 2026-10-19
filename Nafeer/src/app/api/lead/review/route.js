import { after } from 'next/server';
import { requireLeadOfContent, ok, err } from '@/lib/api/guard';
import { Lesson }   from '@/lib/models/Lesson';
import { Concept }  from '@/lib/models/Concept';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';
import { approveOrReject, returnLesson } from '@/lib/api/reviewQueue';
import { ReviewError } from '@/lib/review';
import { notifyLessonReviewed } from '@/lib/reviewNotify';
import { creditLesson, isOwnWork } from '@/lib/credits';
import { recordAudit } from '@/lib/audit';
import { trackStat } from '@/lib/trackStat';

// ─── PATCH /api/lead/review ───────────────────────────────────────────────────
// A team lead approves or returns an item of their subject (docs/team-leads.md
// L1). Same body as the owner's /api/admin/review-queue:
//   { contentId, type, status: 'approved'|'draft', note?, comments? }
//
// What the owner's route does not need:
//   - the item must be in review now, and the write is conditional on that;
//   - four-eyes: nobody reviews what they wrote or own (lib/credits.js);
//   - the lead is credited — `reviewer` on the lesson, `reviewsSubmitted` on
//     their stats — and the decision goes to the audit log.

const MODELS = { lesson: Lesson, concept: Concept, feedItem: FeedItem, question: Question };
const REVIEW_ERROR_STATUS = { NOT_FOUND: 404, NOT_IN_REVIEW: 409, CONFLICT: 409 };

export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { contentId, type, status, note, comments } = body;

    const Model = MODELS[type];
    if (!Model) return err('نوع محتوى غير صالح');
    if (!['approved', 'draft'].includes(status)) return err('حالة غير صالحة. استخدم approved أو draft');

    const { user, doc } = await requireLeadOfContent(Model, contentId, 'canReview');
    const isAdmin = user.role === 'admin';

    if (!isAdmin && isOwnWork(doc, user.id)) {
      return err('لا تراجع عملك بنفسك — يراجعه القائد الآخر أو المالك', 403);
    }
    if (doc.status !== 'review') return err('العنصر ليس بانتظار المراجعة', 409);

    const reviewer = isAdmin
      ? { id: user.id, name: 'المالك', role: 'admin' }
      : { id: user.id, name: user.name || 'قائد الفريق', role: 'lead' };

    let result;
    if (type === 'lesson' && status === 'draft') {
      result = await returnLesson(contentId, { comments: comments ?? [], summary: note || '' }, reviewer);
    } else {
      result = await approveOrReject(contentId, type, status, user.id, note || '', { onlyFromReview: true });
    }

    // After the response, side by side: none of these depends on another, and
    // each swallows its own failure.
    after(() => Promise.all([
      type === 'lesson' && notifyLessonReviewed(contentId, status === 'approved' ? 'approved' : 'returned',
        status === 'draft' ? { comments: result.comments } : undefined),
      !isAdmin && type === 'lesson' && creditLesson(contentId, { contributorId: user.id, name: reviewer.name, kind: 'reviewer' }),
      !isAdmin && trackStat(user.id, 'reviewsSubmitted'),
      !isAdmin && recordAudit({ id: user.id, name: reviewer.name, kind: 'lead' }, {
        action:    status === 'approved' ? 'lesson.approve' : 'lesson.return',
        subjectId: doc.subjectId,
        target:    { kind: type, id: contentId, label: contentId },
        meta: {
          // How long it waited for this decision — the team page's turnaround.
          waitedMs: doc.reviewState?.submittedAt ? Date.now() - new Date(doc.reviewState.submittedAt).getTime() : null,
          ...(status === 'draft' && type === 'lesson' ? { comments: result.comments, round: result.round } : {}),
        },
      }),
    ]));

    return ok(result);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof ReviewError) return err(e.message, REVIEW_ERROR_STATUS[e.code] || 400);
    console.error('[PATCH /api/lead/review]', e);
    return err('خطأ في الخادم', 500);
  }
}

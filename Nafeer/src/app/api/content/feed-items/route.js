import { requireSubjectAccess, requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import {
  getFeedItemsForSubject, createFeedItem, updateFeedItem,
  updateFeedItemStatus, deleteFeedItem,
} from '@/lib/api/feedItems';
import { trackStat } from '@/lib/trackStat';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── Collection ───────────────────────────────────────────────────────────────

// GET /api/content/feed-items?subjectId=PHYSICS[&conceptContentId=...][&lessonContentId=...]
export async function GET(request) {
  try {
    const params    = new URL(request.url).searchParams;
    const subjectId = params.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

    await requireSubjectAccess(subjectId);

    const items = await getFeedItemsForSubject(subjectId, {
      conceptContentId: params.get('conceptContentId') || undefined,
      lessonContentId:  params.get('lessonContentId')  || undefined,
      status:           params.get('status')           || undefined,
    });

    return ok(items, { total: items.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/feed-items]', e);
    return err('خطأ في الخادم', 500);
  }
}

// POST /api/content/feed-items
export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, conceptContentId, type } = body;
    if (!subjectId || !conceptContentId || !type) {
      return err('الحقول المطلوبة: subjectId, conceptContentId, type');
    }

    const user = await requireSubjectAccess(subjectId);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const item = await createFeedItem(
      { ...body,
        contentId: body.contentId || generateId('feed'),
        status: user.role === 'admin' ? 'approved' : undefined,
      },
      actorId
    );

    // Track stat — fire-and-forget
    trackStat(actorId, 'feedItemsCreated');

    return ok(item);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف عنصر التغذية موجود مسبقاً');
    console.error('[POST /api/content/feed-items]', e);
    return err('خطأ في الخادم', 500);
  }
}



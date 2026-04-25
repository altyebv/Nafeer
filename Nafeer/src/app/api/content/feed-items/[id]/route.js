import { requireSubjectAccess, requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import {
  getFeedItemsForSubject, createFeedItem, updateFeedItem,
  updateFeedItemStatus, deleteFeedItem,
} from '@/lib/api/feedItems';

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
    const item = await createFeedItem(
      { ...body, contentId: body.contentId || generateId('feed') },
      user.id
    );

    return ok(item);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف عنصر التغذية موجود مسبقاً');
    console.error('[POST /api/content/feed-items]', e);
    return err('خطأ في الخادم', 500);
  }
}

// ─── Single item ──────────────────────────────────────────────────────────────

// PUT /api/content/feed-items/[id]
export async function PUT(request, { params }) {
  try {
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const body = await request.json();
    const { note, ...updates } = body;

    const allowed = [
      'type', 'contentAr', 'contentEn', 'back', 'imageUrl',
      'interactionType', 'correctAnswer', 'options', 'explanation',
      'questionContentId', 'priority', 'order',
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );

    const item = await updateFeedItem((await params).id, safeUpdates, actorId, note || '');
    if (!item) return err('عنصر التغذية غير موجود', 404);

    return ok(item);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/feed-items/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PATCH /api/content/feed-items/[id]
export async function PATCH(request, { params }) {
  try {
    const user = await requireContributor();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const { status, note } = await request.json();

    if (!['draft', 'review', 'approved', 'archived'].includes(status)) return err('حالة غير صالحة');
    if (status === 'approved' && user.role !== 'admin') return err('الاعتماد متاح للمشرفين فقط', 403);

    const item = await updateFeedItemStatus((await params).id, status, actorId, note || '');
    if (!item) return err('عنصر التغذية غير موجود', 404);

    return ok(item);
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PATCH /api/content/feed-items/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/feed-items/[id]
export async function DELETE(request, { params }) {
  try {
    await requireContributor();
    await deleteFeedItem((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/feed-items/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}
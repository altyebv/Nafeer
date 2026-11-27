import { requireSubjectAccess, requireContentAccess, assertInSubject, ok, err } from '@/lib/api/guard';
import { FeedItem } from '@/lib/models/FeedItem';
import { Lesson } from '@/lib/models/Lesson';
import { assertCanEditLessons, lessonsForLinked } from '@/lib/lessonAccess';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { getFeedItemsForSubject, createFeedItem, updateFeedItem,
  updateFeedItemStatus, deleteFeedItem, getFeedItemById } from '@/lib/api/feedItems';
import { Concept } from '@/lib/models/Concept';
import { connectDB } from '@/lib/db'
import { readBody, assertInput, invalidData } from '@/lib/limits';
import { reopenForItem, reopenForNewItem } from '@/lib/publishedCopy';


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
    const body = await readBody(request);
    assertInput(body);
    const { subjectId, conceptContentId, type } = body;
    if (!subjectId || !conceptContentId || !type) {
      return err('الحقول المطلوبة: subjectId, conceptContentId, type');
    }

    const user = await requireSubjectAccess(subjectId, { write: true });
    const linkedLessons = await assertCanEditLessons(user, await lessonsForLinked(FeedItem, [body.contentId], [body.lessonContentId]));
    await reopenForNewItem(linkedLessons);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const item = await createFeedItem(
      { ...body,
        contentId: body.contentId || generateId('feed'),
        status: user.role === 'admin' ? 'approved' : undefined,
      },
      actorId
    );

    return ok(item);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف عنصر التغذية موجود مسبقاً');
    const bad = invalidData(e);
    if (bad) return bad;
    console.error('[POST /api/content/feed-items]', e);
    return err('خطأ في الخادم', 500);
  }
}

// ─── Single item ──────────────────────────────────────────────────────────────

// PUT /api/content/feed-items/[id]
// PUT /api/content/feed-items/[id]
export async function PUT(request, { params }) {
  try {
    await connectDB();
    // The card must be in the caller's subject — this used to check only that
    // they were signed in, so any contributor could change any subject's cards.
    const { user } = await requireContentAccess(FeedItem, (await params).id, { write: true });
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const body = await readBody(request);
    assertInput(body);
    const { note, ...updates } = body;

    const allowed = [
      'type', 'contentAr', 'contentEn', 'back', 'imageUrl',
      'interactionType', 'correctAnswer', 'options', 'explanation',
      'questionContentId', 'priority', 'order',
      'lessonContentId', 'unitContentId', 'subjectId', 'conceptContentId',
    ];
    const safeUpdates = Object.fromEntries(
      Object.entries(updates).filter(([k]) => allowed.includes(k))
    );
    // It stays in its subject, and only the lessons' owners move it.
    if (user.role !== 'admin') delete safeUpdates.subjectId;
    await assertInSubject(user, Lesson, [safeUpdates.lessonContentId]);
    const lessons = await assertCanEditLessons(user, await lessonsForLinked(FeedItem, [(await params).id], [safeUpdates.lessonContentId]));
    const reopened = await reopenForItem(lessons, FeedItem, (await params).id);

    const item = await updateFeedItem(      // ← was createFeedItem
      (await params).id,
      safeUpdates,
      actorId,
      note || '',
      user.role === 'admin'               // skipRedraft
    );
    if (!item) return err('عنصر التغذية غير موجود', 404);

    return ok(item, { reopened });
  } catch (e) {
    if (e instanceof Response) return e;
    const bad = invalidData(e);
    if (bad) return bad;
    console.error('[PUT /api/content/feed-items/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// PATCH /api/content/feed-items/[id]
export async function PATCH(request, { params }) {
  try {
    const { user } = await requireContentAccess(FeedItem, (await params).id, { write: true });
    const linked = await assertCanEditLessons(user, await lessonsForLinked(FeedItem, [(await params).id]));
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const { status, note } = await readBody(request);

    if (!['draft', 'review', 'approved', 'archived'].includes(status)) return err('حالة غير صالحة');
    if (status === 'approved' && user.role !== 'admin') return err('الاعتماد متاح للمشرفين فقط', 403);

    // Withdrawing an approved card changes what students have.
    if (status !== 'approved') {
      await reopenForItem(linked.filter((l) => l.status === 'approved'), FeedItem, (await params).id);
    }

    // ── Validate concept linkage BEFORE writing anything ──────────────────────
    if (status === 'approved') {
      const feedItem = await getFeedItemById((await params).id); // or FeedItem.findOne(...)
      const concept  = feedItem && await Concept.findOne({ contentId: feedItem.conceptContentId }).lean();
      if (!concept || concept.status !== 'approved') {
        return err('يجب اعتماد المفهوم المرتبط أولاً قبل اعتماد عنصر التغذية', 422);
      }
    }

    const item = await updateFeedItemStatus((await params).id, status, actorId, note || '',user.role === 'admin');
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
    const { user } = await requireContentAccess(FeedItem, (await params).id, { write: true });
    const owned = await assertCanEditLessons(user, await lessonsForLinked(FeedItem, [(await params).id]));
    const reopened = await reopenForItem(owned, FeedItem, (await params).id);
    await deleteFeedItem((await params).id);
    return ok({ deleted: (await params).id, reopened });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/feed-items/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}
import { requireSubjectAccess, requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import {
  getTagsForSubject, createTag,
} from '@/lib/api/concepts';
import { connectDB } from '@/lib/db';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── Collection ───────────────────────────────────────────────────────────────

// GET /api/content/tags?subjectId=PHYSICS
export async function GET(request) {
  try {
    const params    = new URL(request.url).searchParams;
    const subjectId = params.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

    await requireSubjectAccess(subjectId);

    const tags = await getTagsForSubject(subjectId);

    return ok(tags, { total: tags.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/tags]', e);
    return err('خطأ في الخادم', 500);
  }
}

// POST /api/content/tags
export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, nameAr } = body;
    if (!subjectId || !nameAr) return err('الحقول المطلوبة: subjectId, nameAr');

    const user = await requireSubjectAccess(subjectId);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;

    const tag = await createTag(
      { ...body, contentId: body.contentId || generateId('tag') },
      actorId
    );

    return ok(tag);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف الوسم موجود مسبقاً');
    console.error('[POST /api/content/tags]', e);
    return err('خطأ في الخادم', 500);
  }
}
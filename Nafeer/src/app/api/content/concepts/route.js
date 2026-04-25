import { requireSubjectAccess, requireContributor, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import {
  getConceptsForSubject, createConcept, updateConcept,
  updateConceptStatus, deleteConcept,
} from '@/lib/api/concepts';
import { connectDB } from '@/lib/db';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── Collection ───────────────────────────────────────────────────────────────

// GET /api/content/concepts?subjectId=PHYSICS[&status=approved][&type=FORMULA]
export async function GET(request) {
  try {
    const params    = new URL(request.url).searchParams;
    const subjectId = params.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

    await requireSubjectAccess(subjectId);

    const concepts = await getConceptsForSubject(subjectId, {
      status: params.get('status') || undefined,
      type:   params.get('type')   || undefined,
    });

    return ok(concepts, { total: concepts.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/concepts]', e);
    return err('خطأ في الخادم', 500);
  }
}

// POST /api/content/concepts
export async function POST(request) {
  try {
    const body = await request.json();
    const { subjectId, type, titleAr } = body;
    if (!subjectId || !type || !titleAr) return err('الحقول المطلوبة: subjectId, type, titleAr');

    const user = await requireSubjectAccess(subjectId);
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;

    const concept = await createConcept(
      { ...body, contentId: body.contentId || generateId('concept') },
      actorId
    );

    return ok(concept);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف المفهوم موجود مسبقاً');
    console.error('[POST /api/content/concepts]', e);
    return err('خطأ في الخادم', 500);
  }
}
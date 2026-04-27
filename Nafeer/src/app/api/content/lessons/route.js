import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { getLessonsForSubject } from '@/lib/api/lessons';
import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { initialChangelog } from '@/lib/models/versioning';
import { trackStat } from '@/lib/trackStat';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';

export async function GET(request) {
  try {
    const params    = new URL(request.url).searchParams;
    const subjectId = params.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');

    await requireSubjectAccess(subjectId);

    const lessons = await getLessonsForSubject(subjectId, {
      unitContentId: params.get('unitContentId') || undefined,
      status:        params.get('status')        || undefined,
    });

    return ok(lessons, { total: lessons.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/lessons]', e);
    return err('خطأ في الخادم', 500);
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { contentId, subjectId, unitContentId, title, order } = body;

    if (!contentId || !subjectId || !unitContentId || !title || order == null) {
      return err('الحقول المطلوبة: contentId, subjectId, unitContentId, title, order');
    }

    const user = await requireSubjectAccess(subjectId);
    // Admins don't have a Contributor _id — substitute the system seed actor
    // so that createdBy / changelog ObjectId fields pass Mongoose validation.
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;

    await connectDB();

    // Test subjects should behave like seeded test content: new lessons
    // are created approved so the delta/publish flow stays consistent.
    const isTestSubject = subjectId.startsWith('TEST_');
    const shouldAutoApprove = user.role === 'admin' || isTestSubject;

    const lesson = await Lesson.create({
      contentId,
      subjectId,
      unitContentId,
      title,
      order,
      estimatedMinutes: body.estimatedMinutes || 15,
      summary:          body.summary          || null,
      createdBy:        actorId,
      changelog:        initialChangelog(actorId, shouldAutoApprove ? 'Lesson created and auto-approved for test subject' : ''),
      status: shouldAutoApprove ? 'approved' : undefined,
    });

    // Track stat — fire-and-forget
    trackStat(actorId, 'lessonsCreated');

    return ok(lesson, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.code === 11000) return err('معرّف الدرس موجود مسبقاً');
    console.error('[POST /api/content/lessons]', e);
    return err('خطأ في الخادم', 500);
  }
}
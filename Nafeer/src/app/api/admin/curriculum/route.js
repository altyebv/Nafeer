import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Unit }            from '@/lib/models/Unit';
import { Lesson }          from '@/lib/models/Lesson';
import { Subject }         from '@/lib/models/Subject';

// ─── GET /api/admin/curriculum?subjectId=PHYSICS ──────────────────────────────
// Returns the full unit + lesson tree for a subject as stored in Atlas.
// Used by the admin Curriculum Manager to display and inline-edit the scaffold.

export async function GET(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const { searchParams } = new URL(request.url);
  const subjectId = searchParams.get('subjectId');

  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
  }

  try {
    await connectDB();

    const [subject, units, lessons] = await Promise.all([
      Subject.findOne({ subjectId }).select('subjectId nameAr nameEn path isMajor').lean(),
      Unit.find({ subjectId }).sort({ order: 1 }).lean(),
      Lesson.find({ subjectId }).sort({ order: 1 })
        .select('contentId unitContentId title groupTitle groupId estimatedMinutes order status summary')
        .lean(),
    ]);

    if (!subject) {
      return NextResponse.json({ ok: false, error: 'المادة غير موجودة في قاعدة البيانات — تأكد من البذر أولاً' }, { status: 404 });
    }

    const lessonsByUnit = lessons.reduce((acc, l) => {
      if (!acc[l.unitContentId]) acc[l.unitContentId] = [];
      acc[l.unitContentId].push({
        _id:              l._id,
        contentId:        l.contentId,
        title:            l.title,
        groupTitle:       l.groupTitle || null,
        groupId:          l.groupId    || null,
        estimatedMinutes: l.estimatedMinutes || 15,
        order:            l.order,
        status:           l.status || 'draft',
        summary:          l.summary || null,
      });
      return acc;
    }, {});

    const tree = units.map((u) => ({
      _id:         u._id,
      contentId:   u.contentId,
      title:       u.title,
      order:       u.order,
      description: u.description || null,
      bookId:      u.bookId      || null,
      bookTitle:   u.bookTitle   || null,
      bookOrder:   u.bookOrder   || null,
      lessons:     lessonsByUnit[u.contentId] || [],
    }));

    return NextResponse.json({
      ok: true,
      subject: {
        subjectId: subject.subjectId,
        nameAr:    subject.nameAr,
        nameEn:    subject.nameEn || null,
        path:      subject.path,
        isMajor:   subject.isMajor,
      },
      units: tree,
      counts: {
        units:    units.length,
        lessons:  lessons.length,
        approved: lessons.filter((l) => l.status === 'approved').length,
        draft:    lessons.filter((l) => l.status === 'draft').length,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/curriculum]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
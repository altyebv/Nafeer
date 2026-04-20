import { NextResponse }    from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { Unit }            from '@/lib/models/Unit';
import { Lesson }          from '@/lib/models/Lesson';
import { SUBJECTS_BY_ID }  from '@/shared/curriculum';

// ─── GET /api/admin/coverage/[subjectId] ──────────────────────────────────────
// Returns a structured coverage snapshot for the given subject:
//   { ok: true, data: { subjectId, units: [ { unitId, mongoId, title, ... lessons[] } ] } }
//
// Each lesson row contains denormalized counts (sections, concepts, feedItems,
// questions) pulled from the lesson document's own counters, plus a computed
// coverageScore (0-100) and coverageLevel label.
//
// NOTE: The counts use the lesson's stored denormalized fields. If you later
// add real aggregation (querying Section / Concept / FeedItem / Question
// collections), replace the extraction block marked ── COUNT EXTRACTION ──.

export async function GET(_request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const { subjectId } = await params;

  const subject = SUBJECTS_BY_ID[subjectId];
  if (!subject) {
    return NextResponse.json({ ok: false, error: 'مادة غير معروفة' }, { status: 404 });
  }

  try {
    await connectDB();

    // ── Fetch all units and lessons for the subject ─────────────────────────
    const [units, lessons] = await Promise.all([
      Unit.find({ subjectId }).sort({ order: 1 }).lean(),
      Lesson.find({ subjectId }).sort({ order: 1 }).lean(),
    ]);

    // Index lessons by unitContentId for fast lookup
    const lessonsByUnit = {};
    for (const lesson of lessons) {
      const uid = lesson.unitContentId;
      if (!lessonsByUnit[uid]) lessonsByUnit[uid] = [];
      lessonsByUnit[uid].push(lesson);
    }

    // ── Build coverage payload ───────────────────────────────────────────────
    const unitRows = units.map((unit) => {
      const unitLessons = lessonsByUnit[unit.contentId] || [];
      let totalScore    = 0;
      let approvedCount = 0;

      const lessonRows = unitLessons.map((lesson) => {
        // ── COUNT EXTRACTION ─────────────────────────────────────────────────
        // Lessons currently store denormalized counters added by the editor.
        // Fall back to 0 if the field doesn't exist yet.
        const sections  = lesson.sectionsCount  ?? lesson.sections  ?? 0;
        const concepts  = lesson.conceptsCount  ?? lesson.concepts  ?? 0;
        const feedItems = lesson.feedItemsCount ?? lesson.feedItems ?? 0;
        const questions = lesson.questionsCount ?? lesson.questions ?? 0;

        // Coverage score:
        //   30 pts — has ≥1 section
        //   20 pts — has ≥1 concept
        //   30 pts — has ≥1 feed item
        //   20 pts — has ≥1 question
        // Plus a bonus 10% for approved status (capped at 100).
        let score = 0;
        if (sections  > 0) score += 30;
        if (concepts  > 0) score += 20;
        if (feedItems > 0) score += 30;
        if (questions > 0) score += 20;
        if (lesson.status === 'approved') score = Math.min(100, score + 10);

        const level =
          score >= 80 ? 'high'   :
          score >= 40 ? 'medium' :
          score >  0  ? 'low'    : 'none';

        totalScore += score;
        if (lesson.status === 'approved') approvedCount++;

        return {
          lessonId:      lesson.contentId,
          mongoId:       lesson._id.toString(),
          title:         lesson.title,
          order:         lesson.order,
          status:        lesson.status || 'draft',
          groupId:       lesson.groupId    || null,
          groupTitle:    lesson.groupTitle || null,
          sections,
          concepts,
          feedItems,
          questions,
          coverageScore: score,
          coverageLevel: level,
        };
      });

      const avgCoverage = unitLessons.length
        ? Math.round(totalScore / unitLessons.length)
        : 0;

      return {
        unitId:          unit.contentId,
        mongoId:         unit._id.toString(),
        title:           unit.title,
        order:           unit.order,
        totalLessons:    unitLessons.length,
        approvedLessons: approvedCount,
        avgCoverage,
        lessons:         lessonRows,
      };
    });

    // ── Subject-level summary ────────────────────────────────────────────────
    const totalLessons    = lessons.length;
    const approvedLessons = lessons.filter((l) => l.status === 'approved').length;
    const overallAvg      = unitRows.length
      ? Math.round(unitRows.reduce((s, u) => s + u.avgCoverage, 0) / unitRows.length)
      : 0;

    return NextResponse.json({
      ok: true,
      data: {
        subjectId,
        nameAr:          subject.nameAr,
        totalLessons,
        approvedLessons,
        overallAvg,
        units: unitRows,
      },
    });
  } catch (err) {
    console.error('[GET /api/admin/coverage/[subjectId]]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
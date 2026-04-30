import { NextResponse }         from 'next/server';
import { connectDB }            from '@/lib/db';
import { requireSubjectAccess } from '@/lib/api/guard';
import { Unit }                 from '@/lib/models/Unit';
import { Lesson }               from '@/lib/models/Lesson';
import { Section }              from '@/lib/models/Section';
import { Block }                from '@/lib/models/Block';
import { SUBJECTS_BY_ID }       from '@/shared/curriculum';

// ─── GET /api/coverage/[subjectId] ───────────────────────────────────────────
// Auth: contributor assigned to this subject, or any admin.
// Returns a structured coverage snapshot for the given subject:
//   { ok: true, data: { subjectId, units: [ { unitId, mongoId, title, ... lessons[] } ] } }
//
// Each lesson row contains live counts (sections, blocks, concepts, feedItems,
// questions) fetched from their respective collections, plus a computed
// coverageScore (0-100) and coverageLevel label.
//
// Scoring formula (aligned with CoveragePanel.jsx dimension weights):
//   Content  — max 40 pts: sections>0 AND blocks>0 → 40; sections>0 only → 20
//   Feed     — max 30 pts: min(30, round(feedItems / concepts × 30))   [0 if no concepts]
//   Questions — max 30 pts: min(30, round(questions / (concepts×2) × 30)) [0 if no concepts]
//   Bonus    — +10 pts for approved status (capped at 100)

export async function GET(_request, { params }) {
  const { subjectId } = await params;

  // Contributor auth — admins and assigned contributors both pass
  try {
    await requireSubjectAccess(subjectId);
  } catch (authErr) {
    return authErr;
  }

  const subject = SUBJECTS_BY_ID[subjectId];
  if (!subject) {
    return NextResponse.json({ ok: false, error: 'مادة غير معروفة' }, { status: 404 });
  }

  try {
    await connectDB();

    // ── Fetch in parallel ────────────────────────────────────────────────────
    const [units, lessons, allSections, blockAgg] = await Promise.all([
      Unit.find({ subjectId }).sort({ order: 1 }).lean(),
      Lesson.find({ subjectId }).sort({ order: 1 }).lean(),
      // Only need contentId + lessonContentId for the join index
      Section.find({ subjectId }).select('contentId lessonContentId').lean(),
      // Count blocks per section in one aggregate round-trip
      Block.aggregate([
        { $match: { subjectId } },
        { $group: { _id: '$sectionContentId', count: { $sum: 1 } } },
      ]),
    ]);

    // ── Build lookup indexes ─────────────────────────────────────────────────

    // blocksBySectionId — { sectionContentId → block count }
    const blocksBySectionId = Object.fromEntries(
      blockAgg.map((b) => [b._id, b.count])
    );

    // sectionsByLessonId — { lessonContentId → [ sectionContentId, … ] }
    const sectionsByLessonId = {};
    for (const s of allSections) {
      if (!sectionsByLessonId[s.lessonContentId]) sectionsByLessonId[s.lessonContentId] = [];
      sectionsByLessonId[s.lessonContentId].push(s.contentId);
    }

    // lessonsByUnitId — { unitContentId → [ lesson, … ] }
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
        // Prefer denormalized lesson counters (cheap); fall back to 0.
        const sections  = lesson.sectionsCount  ?? lesson.sections  ?? 0;
        const concepts  = lesson.conceptsCount  ?? lesson.concepts  ?? 0;
        const feedItems = lesson.feedItemsCount ?? lesson.feedItems ?? 0;
        const questions = lesson.questionsCount ?? lesson.questions ?? 0;

        // Blocks: always live-counted (no denormalized counter on Lesson yet)
        const lessonSectionIds = sectionsByLessonId[lesson.contentId] || [];
        const blocks = lessonSectionIds.reduce(
          (sum, sid) => sum + (blocksBySectionId[sid] || 0), 0
        );

        // ── Coverage score (matches CoveragePanel.jsx dimension weights) ──────
        let score = 0;

        // Content dimension — 40 pts
        if (sections > 0 && blocks > 0) score += 40;
        else if (sections > 0)          score += 20;

        // Feed dimension — 30 pts, pro-rated by feedItems/concepts
        if (concepts > 0) score += Math.min(30, Math.round((feedItems / concepts) * 30));

        // Questions dimension — 30 pts, target = 2 questions per concept
        if (concepts > 0) score += Math.min(30, Math.round((questions / (concepts * 2)) * 30));

        // Bonus for approved (capped at 100)
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
          blocks,
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
  } catch (e) {
    console.error('[GET /api/coverage/[subjectId]]', e);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
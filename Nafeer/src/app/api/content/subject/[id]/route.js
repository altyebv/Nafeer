import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { connectDB } from '@/lib/db';
import { Unit } from '@/lib/models/Unit';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { Concept } from '@/lib/models/Concept';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';

// GET /api/coverage/[subjectId]
//
// Returns a coverage map for every lesson in the subject:
// - How many sections, blocks, concepts, feed items, questions it has
// - A coverage score (0–100)
//
// Used by: SubjectOverview badges, LessonEditorPage sidebar, Admin dashboard,
//          ProgressBoard on the landing page.
//
export async function GET(request, { params }) {
  try {
    const { subjectId } = await params;

    // Coverage data is public for the landing page ProgressBoard,
    // but detailed per-lesson data requires auth.
    // We allow unauthenticated access to aggregate totals only.
    let isAuthenticated = false;
    try {
      await requireSubjectAccess(subjectId);
      isAuthenticated = true;
    } catch {
      // unauthenticated — will return summary only
    }

    await connectDB();

    // ── Aggregate counts using Atlas $group pipelines ─────────────────────

    const [
      units,
      lessons,
      sectionCounts,
      blockCounts,
      conceptCountsPerLesson,  // via section.conceptIds
      feedItemCounts,
      questionCounts,
    ] = await Promise.all([
      Unit.find({ subjectId }).sort({ order: 1 }).select('contentId title order').lean(),

      Lesson.find({ subjectId }).sort({ order: 1 }).lean(),

      // Sections per lesson
      Section.aggregate([
        { $match: { subjectId } },
        { $group: { _id: '$lessonContentId', count: { $sum: 1 } } },
      ]),

      // Blocks per lesson (via section → lesson mapping is expensive; use subjectId filter)
      Block.aggregate([
        { $match: { subjectId } },
        {
          $lookup: {
            from:         'sections',
            localField:   'sectionContentId',
            foreignField: 'contentId',
            as:           'section',
          },
        },
        { $unwind: '$section' },
        { $group: { _id: '$section.lessonContentId', count: { $sum: 1 } } },
      ]),

      // Concepts per lesson — via sections.conceptIds
      Section.aggregate([
        { $match: { subjectId } },
        { $unwind: '$conceptIds' },
        { $group: { _id: '$lessonContentId', uniqueConcepts: { $addToSet: '$conceptIds' } } },
        { $project: { count: { $size: '$uniqueConcepts' } } },
      ]),

      // Feed items per lesson
      FeedItem.aggregate([
        { $match: { subjectId } },
        { $group: { _id: '$lessonContentId', count: { $sum: 1 } } },
      ]),

      // Questions per lesson
      Question.aggregate([
        { $match: { subjectId } },
        { $group: { _id: '$lessonContentId', count: { $sum: 1 } } },
      ]),
    ]);

    // Build lookup maps
    const toMap = (arr) => Object.fromEntries(arr.map((x) => [x._id, x.count]));

    const sectionMap    = toMap(sectionCounts);
    const blockMap      = toMap(blockCounts);
    const conceptMap    = toMap(conceptCountsPerLesson);
    const feedMap       = toMap(feedItemCounts);
    const questionMap   = toMap(questionCounts);

    // ── Compute coverage per lesson ───────────────────────────────────────

    const lessonsWithCoverage = lessons.map((lesson) => {
      const id        = lesson.contentId;
      const sections  = sectionMap[id]  || 0;
      const blocks    = blockMap[id]    || 0;
      const concepts  = conceptMap[id]  || 0;
      const feedItems = feedMap[id]     || 0;
      const questions = questionMap[id] || 0;

      // Coverage score: weighted formula
      // 40%: has sections + blocks (basic content written)
      // 30%: feed items >= concepts (at least 1 card per concept)
      // 30%: questions >= concepts * 2 (at least 2 questions per concept)
      const contentScore  = sections > 0 && blocks > 0 ? 40 : sections > 0 ? 20 : 0;
      const feedScore     = concepts === 0 ? 0 : Math.min(30, Math.round((feedItems / concepts) * 30));
      const questionScore = concepts === 0 ? 0 : Math.min(30, Math.round((questions / (concepts * 2)) * 30));
      const coverageScore = contentScore + feedScore + questionScore;

      return {
        lessonId:      id,
        unitContentId: lesson.unitContentId,
        title:         lesson.title,
        order:         lesson.order,
        status:        lesson.status,
        sections,
        blocks,
        concepts,
        feedItems,
        questions,
        coverageScore,
        // Traffic light for UI
        coverageLevel: coverageScore >= 80 ? 'high'
                     : coverageScore >= 40 ? 'medium'
                     : coverageScore > 0   ? 'low'
                     : 'none',
      };
    });

    // ── Nest under units ──────────────────────────────────────────────────

    const lessonsByUnit = lessonsWithCoverage.reduce((acc, l) => {
      if (!acc[l.unitContentId]) acc[l.unitContentId] = [];
      acc[l.unitContentId].push(l);
      return acc;
    }, {});

    const result = units.map((unit) => {
      const unitLessons = lessonsByUnit[unit.contentId] || [];
      const avgCoverage = unitLessons.length
        ? Math.round(unitLessons.reduce((s, l) => s + l.coverageScore, 0) / unitLessons.length)
        : 0;

      return {
        unitId:      unit.contentId,
        title:       unit.title,
        order:       unit.order,
        avgCoverage,
        lessons:     isAuthenticated ? unitLessons : undefined,
        // For unauthenticated landing page: just totals
        totalLessons:    unitLessons.length,
        approvedLessons: unitLessons.filter((l) => l.status === 'approved').length,
      };
    });

    // Subject-level summary (always returned, even unauthenticated)
    const allLessons = lessonsWithCoverage;
    const summary = {
      subjectId,
      totalLessons:    allLessons.length,
      approvedLessons: allLessons.filter((l) => l.status === 'approved').length,
      avgCoverage:     allLessons.length
        ? Math.round(allLessons.reduce((s, l) => s + l.coverageScore, 0) / allLessons.length)
        : 0,
    };

    return ok({ summary, units: result });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/coverage/[subjectId]]', e);
    return err('خطأ في الخادم', 500);
  }
}
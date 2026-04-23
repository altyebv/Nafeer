import { NextResponse }     from 'next/server';
import { verifyAdminAuth }  from '@/lib/adminAuth';
import { connectDB }        from '@/lib/db';
import { Lesson }           from '@/lib/models/Lesson';
import { Question }         from '@/lib/models/Question';
import { FeedItem }         from '@/lib/models/FeedItem';
import { getManifest }      from '@/lib/FirebaseAdmin';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

// GET /api/content/publish/status
// Returns per-subject publish state: manifest version, content stats, readiness.
// Admin only.

export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    await connectDB();

    // ── Fetch in parallel: Firestore manifest + MongoDB aggregates ────────────
    const [manifest, lessonAgg, questionAgg, feedAgg] = await Promise.all([
      getManifest().catch(() => null),

      Lesson.aggregate([
        { $group: {
          _id:      '$subjectId',
          total:    { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          draft:    { $sum: { $cond: [{ $eq: ['$status', 'draft']    }, 1, 0] } },
        }},
      ]),

      Question.aggregate([
        { $group: {
          _id:      '$subjectId',
          total:    { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        }},
      ]),

      FeedItem.aggregate([
        { $group: {
          _id:      '$subjectId',
          total:    { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        }},
      ]),
    ]);

    // Index aggregates by subjectId for O(1) lookup
    const lessonMap   = Object.fromEntries(lessonAgg.map((r)   => [r._id, r]));
    const questionMap = Object.fromEntries(questionAgg.map((r) => [r._id, r]));
    const feedMap     = Object.fromEntries(feedAgg.map((r)     => [r._id, r]));

    // Index manifest subjects by subjectId
    const manifestMap = Object.fromEntries(
      (manifest?.subjects || []).map((s) => [s.id, s])
    );

    const subjects = SUBJECTS_CATALOG.map((cat) => {
      const lessons   = lessonMap[cat.id]   || { total: 0, approved: 0, draft: 0 };
      const questions = questionMap[cat.id] || { total: 0, approved: 0 };
      const feed      = feedMap[cat.id]     || { total: 0, approved: 0 };
      const entry     = manifestMap[cat.id] || null;

      // A subject is "publishable" if it has at least 1 approved lesson
      const isPublishable = lessons.approved > 0;

      const isPublished = !!entry?.version;

      // hasNewContent: compare current approved count against the snapshot stored
      // in the manifest on last publish (entry.approvedLessonsCount).
      // Falls back gracefully for manifest entries written before this field existed.
      const lastPublishedCount = entry?.approvedLessonsCount ?? null;
      const hasNewContent =
        isPublishable &&
        (!isPublished || lastPublishedCount === null || lessons.approved > lastPublishedCount);

      return {
        id:          cat.id,
        nameAr:      cat.nameAr,
        track:       cat.track,
        isMajor:     cat.isMajor,
        order:       cat.order,
        // Content stats
        lessons:     { total: lessons.total, approved: lessons.approved, draft: lessons.draft },
        questions:   { total: questions.total, approved: questions.approved },
        feedItems:   { total: feed.total, approved: feed.approved },
        // App delivery state
        appVersion:     entry?.version      || null,
        publishedAt:    entry?.updatedAt    || null,
        downloadUrl:    entry?.downloadUrl  || null,
        enabled:        entry?.enabled      ?? true,
        minAppVersion:  entry?.minAppVersion || '1.0',
        remoteLessons:  entry?.approvedLessonsCount ?? null,
        remoteSections: entry?.approvedSectionsCount ?? null,
        remoteBlocks:   entry?.approvedBlocksCount ?? null,
        // Derived signals
        isPublishable,
        isPublished,
        hasNewContent,
      };
    });

    return NextResponse.json({
      ok: true,
      manifest: {
        schemaVersion: manifest?.schemaVersion || null,
        updatedAt:     manifest?.updatedAt     || null,
        featureFlags:  manifest?.featureFlags  || null,
        subjects:      manifest?.subjects      || [],
      },
      subjects,
    });
  } catch (e) {
    console.error('[GET /api/content/publish/status]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

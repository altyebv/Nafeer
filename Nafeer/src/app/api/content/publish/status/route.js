import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { connectDB } from '@/lib/db';
import { Subject } from '@/lib/models/Subject';
import { Lesson } from '@/lib/models/Lesson';
import { Question } from '@/lib/models/Question';
import { FeedItem } from '@/lib/models/FeedItem';
import { getManifest } from '@/lib/FirebaseAdmin';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

// GET /api/content/publish/status
// Returns per-subject publish state: manifest version, content stats, readiness.
// Admin only.
//
// Important:
// - catalog subjects are included
// - Atlas subjects are included
// - remote manifest-only subjects are included too, so admins can inspect
//   subjects that were published remotely before they were added locally

export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    await connectDB();

    const [manifest, dbSubjects, lessonAgg, questionAgg, feedAgg] = await Promise.all([
      getManifest().catch(() => null),
      Subject.find({})
        .select('subjectId nameAr nameEn path isMajor order')
        .lean(),
      Lesson.aggregate([
        {
          $group: {
            _id: '$subjectId',
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          },
        },
      ]),
      Question.aggregate([
        {
          $group: {
            _id: '$subjectId',
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          },
        },
      ]),
      FeedItem.aggregate([
        {
          $group: {
            _id: '$subjectId',
            total: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const lessonMap = Object.fromEntries(lessonAgg.map((row) => [row._id, row]));
    const questionMap = Object.fromEntries(questionAgg.map((row) => [row._id, row]));
    const feedMap = Object.fromEntries(feedAgg.map((row) => [row._id, row]));
    const manifestMap = Object.fromEntries((manifest?.subjects || []).map((subject) => [subject.id, subject]));
    const catalogMap = Object.fromEntries(SUBJECTS_CATALOG.map((subject) => [subject.id, subject]));
    const dbSubjectMap = Object.fromEntries(dbSubjects.map((subject) => [subject.subjectId, subject]));

    const allSubjectIds = [
      ...new Set([
        ...SUBJECTS_CATALOG.map((subject) => subject.id),
        ...dbSubjects.map((subject) => subject.subjectId),
        ...(manifest?.subjects || []).map((subject) => subject.id),
      ]),
    ];

    const subjects = allSubjectIds.map((subjectId, index) => {
      const catalogSubject = catalogMap[subjectId] || null;
      const dbSubject = dbSubjectMap[subjectId] || null;
      const manifestEntry = manifestMap[subjectId] || null;
      const lessons = lessonMap[subjectId] || { total: 0, approved: 0, draft: 0 };
      const questions = questionMap[subjectId] || { total: 0, approved: 0 };
      const feed = feedMap[subjectId] || { total: 0, approved: 0 };

      const isPublishable = lessons.approved > 0;
      // Support both v2 (`version`) and v3 delta (`contentVersion`) manifest entries.
      const isPublished = !!(manifestEntry?.version || manifestEntry?.contentVersion);
      const lastPublishedCount = manifestEntry?.approvedLessonsCount ?? null;
      const hasNewContent =
        isPublishable &&
        (!isPublished || lastPublishedCount === null || lessons.approved > lastPublishedCount);

      return {
        id: subjectId,
        nameAr: catalogSubject?.nameAr || dbSubject?.nameAr || subjectId,
        nameEn: catalogSubject?.nameEn || dbSubject?.nameEn || null,
        track: catalogSubject?.track || dbSubject?.path || 'REMOTE',
        isMajor: catalogSubject?.isMajor ?? dbSubject?.isMajor ?? false,
        order: catalogSubject?.order ?? dbSubject?.order ?? 1000 + index,
        source: catalogSubject ? 'catalog' : dbSubject ? 'atlas' : 'remote',
        lessons: { total: lessons.total, approved: lessons.approved, draft: lessons.draft },
        questions: { total: questions.total, approved: questions.approved },
        feedItems: { total: feed.total, approved: feed.approved },
        appVersion: manifestEntry?.contentVersion || manifestEntry?.version || null,
        publishedAt: manifestEntry?.updatedAt || null,
        downloadUrl: manifestEntry?.downloadUrl || null,
        enabled: manifestEntry?.enabled ?? true,
        minAppVersion: manifestEntry?.minAppVersion || '1.0',
        remoteLessons: manifestEntry?.approvedLessonsCount ?? null,
        remoteSections: manifestEntry?.approvedSectionsCount ?? null,
        remoteBlocks: manifestEntry?.approvedBlocksCount ?? null,
        isPublishable,
        isPublished,
        hasNewContent,
      };
    }).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.nameAr.localeCompare(b.nameAr, 'ar');
    });

    return NextResponse.json({
      ok: true,
      manifest: {
        schemaVersion: manifest?.schemaVersion || null,
        updatedAt: manifest?.updatedAt || null,
        featureFlags: manifest?.featureFlags || null,
        subjects: manifest?.subjects || [],
      },
      subjects,
    });
  } catch (e) {
    console.error('[GET /api/content/publish/status]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
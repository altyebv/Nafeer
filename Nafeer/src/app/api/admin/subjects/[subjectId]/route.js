import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { connectDB }       from '@/lib/db';
import { Subject }         from '@/lib/models/Subject';
import { Unit }            from '@/lib/models/Unit';
import { Lesson }          from '@/lib/models/Lesson';
import { Section }         from '@/lib/models/Section';
import { Block }           from '@/lib/models/Block';
import { Question }        from '@/lib/models/Question';
import { FeedItem }        from '@/lib/models/FeedItem';
import { Concept }         from '@/lib/models/Concept';
import { Media }           from '@/lib/models/Media';
import { Contributor }     from '@/lib/models/Contributor';
import { getManifest, updateFeatureFlags } from '@/lib/FirebaseAdmin';
import { SUBJECTS_BY_ID, getMathNotation, MATH_NOTATION } from '@/shared/curriculum';
import { REAL_PEOPLE } from '@/lib/SeedActor';

const countBy = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.n]));

// The app reads the manifest from Firestore. When Firebase is not configured
// (local dev) the page still works; it just says the app side is unknown.
async function readManifest() {
  try { return { manifest: await getManifest(), appData: true }; }
  catch { return { manifest: null, appData: false }; }
}

// ─── GET /api/admin/subjects/[subjectId] ──────────────────────────────────────
// The subject page in one request: the unit/lesson tree with live coverage
// counts per lesson, the people on it, its publish state and its settings.
// Replaces the separate admin editor, curriculum and coverage reads.
export async function GET(_request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;
  const { subjectId } = await params;

  try {
    await connectDB();
    const match = { $match: { subjectId } };
    const [
      subject, units, lessons, sections, blockAgg, questionAgg, feedAgg,
      concepts, media, people, { manifest, appData },
    ] = await Promise.all([
      Subject.findOne({ subjectId }, 'subjectId nameAr path mathNotation').lean(),
      Unit.find({ subjectId }, 'contentId title order').sort({ order: 1 }).lean(),
      Lesson.find({ subjectId }, 'contentId unitContentId title status order summary reviewState.returned').sort({ order: 1 }).lean(),
      Section.find({ subjectId }, 'contentId lessonContentId').lean(),
      Block.aggregate([match, { $group: { _id: '$sectionContentId', n: { $sum: 1 } } }]),
      Question.aggregate([{ $match: { subjectId, isCheckpoint: { $ne: true } } }, { $group: { _id: '$lessonContentId', n: { $sum: 1 } } }]),
      FeedItem.aggregate([match, { $group: { _id: '$lessonContentId', n: { $sum: 1 } } }]),
      Concept.countDocuments({ subjectId }),
      Media.countDocuments({ subjectId }).catch(() => 0),
      Contributor.find(
        { subject: subjectId, status: 'approved', ...REAL_PEOPLE },
        'name username stats.lastActiveAt',
      ).lean(),
      readManifest(),
    ]);

    const catalog = SUBJECTS_BY_ID[subjectId] || null;
    if (!subject && !catalog) {
      return NextResponse.json({ ok: false, error: 'مادة غير معروفة' }, { status: 404 });
    }

    const blocksBySection = countBy(blockAgg);
    const sectionsByLesson = {};
    const blocksByLesson = {};
    for (const s of sections) {
      sectionsByLesson[s.lessonContentId] = (sectionsByLesson[s.lessonContentId] || 0) + 1;
      blocksByLesson[s.lessonContentId] = (blocksByLesson[s.lessonContentId] || 0) + (blocksBySection[s.contentId] || 0);
    }
    const questionsByLesson = countBy(questionAgg);
    const feedByLesson = countBy(feedAgg);

    const lessonRow = (l) => ({
      id: l.contentId,
      mongoId: String(l._id),
      title: l.title,
      status: l.status || 'draft',
      returned: !!l.reviewState?.returned,
      hasSummary: !!l.summary,
      sections: sectionsByLesson[l.contentId] || 0,
      blocks: blocksByLesson[l.contentId] || 0,
      questions: questionsByLesson[l.contentId] || 0,
      feed: feedByLesson[l.contentId] || 0,
    });
    const byUnit = {};
    for (const l of lessons) (byUnit[l.unitContentId] ??= []).push(lessonRow(l));

    const entry = (manifest?.subjects || []).find((s) => s.id === subjectId) || null;
    const visibleIds = manifest?.featureFlags?.visibleSubjectIds || [];
    const status = { draft: 0, review: 0, approved: 0, archived: 0 };
    for (const l of lessons) status[l.status || 'draft'] = (status[l.status || 'draft'] || 0) + 1;

    return NextResponse.json({
      ok: true,
      data: {
        id: subjectId,
        nameAr: catalog?.nameAr || subject?.nameAr || subjectId,
        track: catalog?.track || subject?.path || null,
        seeded: !!subject,
        units: units.map((u) => ({ id: u.contentId, mongoId: String(u._id), title: u.title, lessons: byUnit[u.contentId] || [] })),
        counts: { units: units.length, lessons: lessons.length, concepts, media, status },
        people: people.map((p) => ({ id: String(p._id), name: p.name, username: p.username, lastActiveAt: p.stats?.lastActiveAt || null })),
        publish: appData ? {
          version: entry?.contentVersion || entry?.version || null,
          publishedAt: entry?.updatedAt || null,
          publishedLessons: entry?.approvedLessonsCount ?? null,
        } : null,
        settings: {
          // null = unknown (Firebase not configured); [] means every subject shows.
          visible: appData ? (visibleIds.length === 0 || visibleIds.includes(subjectId)) : null,
          mathNotation: getMathNotation(subject || subjectId),
        },
        appData,
      },
    });
  } catch (e) {
    console.error('[GET /api/admin/subjects/[subjectId]]', e);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}

// ─── PATCH /api/admin/subjects/[subjectId] ────────────────────────────────────
// Body: { visible?: boolean, mathNotation?: 'ARABIC' | 'LATIN' }
//
// `visible` edits featureFlags.visibleSubjectIds, where [] means "all shown".
// Hiding one subject from an empty list therefore lists every other one.
export async function PATCH(request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;
  const { subjectId } = await params;

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }); }

  try {
    const result = {};

    if ('mathNotation' in body) {
      if (!Object.values(MATH_NOTATION).includes(body.mathNotation)) {
        return NextResponse.json({ ok: false, error: 'ترميز غير معروف' }, { status: 400 });
      }
      await connectDB();
      const updated = await Subject.findOneAndUpdate({ subjectId }, { $set: { mathNotation: body.mathNotation } }, { new: true }).lean();
      if (!updated) return NextResponse.json({ ok: false, error: 'المادة غير مبذورة بعد' }, { status: 404 });
      result.mathNotation = updated.mathNotation;
    }

    if ('visible' in body) {
      if (typeof body.visible !== 'boolean') {
        return NextResponse.json({ ok: false, error: 'visible must be a boolean' }, { status: 400 });
      }
      const { manifest, appData } = await readManifest();
      if (!appData) return NextResponse.json({ ok: false, error: 'Firebase غير مهيّأ' }, { status: 503 });

      const flags = manifest?.featureFlags || {};
      const current = flags.visibleSubjectIds || [];
      const all = (manifest?.subjects || []).map((s) => s.id);
      let next;
      if (body.visible) {
        next = current.length === 0 ? [] : [...new Set([...current, subjectId])];
        // Every published subject listed again → back to the "all" shorthand.
        if (next.length && all.length && all.every((id) => next.includes(id))) next = [];
      } else {
        next = (current.length === 0 ? all : current).filter((id) => id !== subjectId);
      }
      await updateFeatureFlags({ ...flags, visibleSubjectIds: next });
      result.visible = body.visible;
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    console.error('[PATCH /api/admin/subjects/[subjectId]]', e);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}

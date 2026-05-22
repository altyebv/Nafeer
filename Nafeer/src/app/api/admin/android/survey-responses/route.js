import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/FirebaseAdmin';

/**
 * GET /api/admin/android/survey-responses?surveyId=xxx&limit=200
 *
 * Returns individual survey response documents from the
 * `survey_responses` collection group.
 *
 * Each Android device writes to:
 *   survey_responses/{installId}/{surveyId}
 *
 * Fields per doc:
 *   surveyId, answers (map), completedAt (ISO), durationSeconds, skippedCount, installId
 *
 * When surveyId is provided: filtered to that survey only.
 * When omitted: returns all responses (paginated by limit, default 200).
 */
export async function GET(req) {
  const auth = await verifyAdminAuth();
  if (auth) return auth;

  const { searchParams } = new URL(req.url);
  const surveyId = searchParams.get('surveyId');
  const limit    = Math.min(parseInt(searchParams.get('limit') ?? '200', 10), 500);

  try {
    const db = getAdminFirestore();

    let query = db.collectionGroup('survey_responses').limit(limit);
    if (surveyId) {
      query = query.where('surveyId', '==', surveyId);
    }

    const snap = await query.get();

    const responses = snap.docs.map((d) => ({
      id: d.id,
      path: d.ref.path,
      ...d.data(),
    }));

    // Derive per-question answer distribution (useful for the UI breakdown)
    const distribution = {}; // questionId → { answer → count }

    responses.forEach(({ answers }) => {
      if (!answers || typeof answers !== 'object') return;
      Object.entries(answers).forEach(([qId, answer]) => {
        if (!distribution[qId]) distribution[qId] = {};
        const key = Array.isArray(answer)
          ? answer.join(',')
          : String(answer ?? '');
        distribution[qId][key] = (distribution[qId][key] ?? 0) + 1;
      });
    });

    return NextResponse.json({
      surveyId: surveyId ?? null,
      total: responses.length,
      responses,
      distribution,
    });
  } catch (e) {
    console.error('[android/survey-responses GET]', e);
    // Gracefully return empty when the collection doesn't exist yet
    if (e.code === 5 || e.message?.includes('NOT_FOUND')) {
      return NextResponse.json({
        surveyId: surveyId ?? null,
        total: 0,
        responses: [],
        distribution: {},
      });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
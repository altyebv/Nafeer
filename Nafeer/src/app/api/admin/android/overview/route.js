import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { getAdminFirestore, getManifest } from '@/lib/FirebaseAdmin';

/**
 * GET /api/admin/android/overview
 *
 * Aggregated stats for the Android Insights dashboard.
 * Pulls from:
 *   • comm_items            — surveys & announcements authored in CMS
 *   • survey_responses      — collection-group across all installIds
 *   • feedback              — collection-group across all installIds
 *   • content_config/manifest → featureFlags
 *
 * All counts are server-side — nothing paginated, suitable for a stats bar.
 */
export async function GET() {
  const auth = await verifyAdminAuth();
  if (auth) return auth;

  try {
    const db = getAdminFirestore();
    const now = new Date();

    // ── 1. Comm items ───────────────────────────────────────────────────────
    const commSnap = await db.collection('comm_items').get();
    const commDocs = commSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const surveys       = commDocs.filter((d) => d.type === 'SURVEY');
    const announcements = commDocs.filter((d) => d.type === 'ANNOUNCEMENT');

    const activeSurveys = surveys.filter(
      (s) => !s.expiresAt || new Date(s.expiresAt) > now,
    );
    const activeAnnouncements = announcements.filter(
      (a) => !a.expiresAt || new Date(a.expiresAt) > now,
    );
    const bannerAnnouncements = activeAnnouncements.filter((a) => a.showBanner);

    // ── 2. Survey responses (collection group) ──────────────────────────────
    // Path pattern: survey_responses/{installId}/{surveyId}
    // Each doc has a `surveyId` field for grouping.
    let totalResponses     = 0;
    let responsesPerSurvey = {}; // surveyId → count
    let avgDuration        = 0;
    let totalSkipped       = 0;

    try {
      const respSnap = await db.collectionGroup('survey_responses').get();
      totalResponses = respSnap.size;

      let durationSum = 0;
      let durationCount = 0;

      respSnap.docs.forEach((d) => {
        const data = d.data();
        const sid  = data.surveyId;
        if (sid) {
          responsesPerSurvey[sid] = (responsesPerSurvey[sid] ?? 0) + 1;
        }
        if (typeof data.durationSeconds === 'number') {
          durationSum += data.durationSeconds;
          durationCount++;
        }
        if (typeof data.skippedCount === 'number') {
          totalSkipped += data.skippedCount;
        }
      });

      avgDuration = durationCount > 0
        ? Math.round(durationSum / durationCount)
        : 0;
    } catch (e) {
      // Collection may not exist yet (pre-beta); treat as empty.
      console.warn('[android/overview] survey_responses not queryable:', e.message);
    }

    // ── 3. Feedback (collection group) ──────────────────────────────────────
    // Path pattern: feedback/{installId}/{submissionId}
    let totalFeedback  = 0;
    let bugCount       = 0;
    let suggestionCount = 0;
    let feedbackTags   = {}; // tag → count

    try {
      const fbSnap = await db.collectionGroup('feedback').get();
      totalFeedback = fbSnap.size;

      fbSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.type === 'BUG_REPORT')  bugCount++;
        if (data.type === 'SUGGESTION')  suggestionCount++;
        if (Array.isArray(data.tags)) {
          data.tags.forEach((t) => {
            feedbackTags[t] = (feedbackTags[t] ?? 0) + 1;
          });
        }
      });
    } catch (e) {
      console.warn('[android/overview] feedback not queryable:', e.message);
    }

    // ── 4. Feature flags ────────────────────────────────────────────────────
    let flags = { commCenterEnabled: false, feedbackEnabled: false, toursEnabled: false };
    try {
      const manifest = await getManifest();
      const f = manifest?.featureFlags ?? {};
      flags = {
        commCenterEnabled: f.commCenterEnabled ?? false,
        feedbackEnabled:   f.feedbackEnabled   ?? false,
        toursEnabled:      f.toursEnabled       ?? false,
      };
    } catch (e) {
      console.warn('[android/overview] manifest not readable:', e.message);
    }

    // ── Response ─────────────────────────────────────────────────────────────
    return NextResponse.json({
      surveys: {
        total:   surveys.length,
        active:  activeSurveys.length,
        expired: surveys.length - activeSurveys.length,
      },
      announcements: {
        total:      announcements.length,
        active:     activeAnnouncements.length,
        withBanner: bannerAnnouncements.length,
      },
      responses: {
        total:            totalResponses,
        perSurvey:        responsesPerSurvey,
        avgDurationSecs:  avgDuration,
        totalSkipped,
      },
      feedback: {
        total:       totalFeedback,
        bugs:        bugCount,
        suggestions: suggestionCount,
        topTags:     Object.entries(feedbackTags)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 8)
          .map(([tag, count]) => ({ tag, count })),
      },
      flags,
      generatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error('[android/overview GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
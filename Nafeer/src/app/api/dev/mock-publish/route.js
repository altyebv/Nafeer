import { NextResponse }                    from 'next/server';
import { verifyAdminAuth }                 from '@/lib/adminAuth';
import { uploadFile, getPublicUrl }        from '@/lib/supabase';
import { getManifest, upsertSubjectEntry } from '@/lib/FirebaseAdmin';
import crypto                              from 'crypto';

// ─── POST /api/dev/mock-publish ───────────────────────────────────────────────
//
// DEV TOOL — publishes a hand-crafted BasheerExportData JSON to Supabase and
// updates the Firestore manifest, bypassing MongoDB entirely.
//
// Use this to:
//   • Test the full App ↔ CMS pipeline without real approved content
//   • Reproduce field mismatches by tweaking any field in the payload
//   • Smoke-test ContentSyncManager on device (download → validate → seed)
//
// Body:
//   {
//     manifestSubjectId: "PHYSICS",          // Firestore manifest entry key
//     payload: { ...BasheerExportData }      // full JSON to upload verbatim
//   }
//
// Response:
//   { ok, manifestSubjectId, version, downloadUrl, sha256, size, publishedAt }
//
// Admin only. Remove this route (or gate it behind an env flag) before public launch.
// ─────────────────────────────────────────────────────────────────────────────

const EXPORTS_BUCKET = process.env.SUPABASE_EXPORTS_BUCKET || 'content-exports';

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  // ── 1. Parse + validate request body ──────────────────────────────────────
  let manifestSubjectId, payload;
  try {
    ({ manifestSubjectId, payload } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!manifestSubjectId || typeof manifestSubjectId !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'manifestSubjectId (string) مطلوب — هذا هو مفتاح الـ manifest في Firestore' },
      { status: 400 }
    );
  }

  if (!payload || typeof payload !== 'object') {
    return NextResponse.json({ ok: false, error: 'payload (BasheerExportData object) مطلوب' }, { status: 400 });
  }

  // ── 2. Basic structural validation — mirrors ContentSyncManager.validatePayload ──
  const errors = [];
  if (payload.version !== '2.0')         errors.push(`version يجب أن يكون "2.0"، القيمة الحالية: "${payload.version}"`);
  if (!payload.subject?.id?.trim())       errors.push('subject.id فارغ أو مفقود');
  if (!payload.subject?.path?.trim())     errors.push('subject.path فارغ أو مفقود (COMMON | SCIENCE | LITERARY)');
  if (!Array.isArray(payload.units))      errors.push('units يجب أن يكون مصفوفة');
  if (!Array.isArray(payload.questions))  errors.push('questions يجب أن يكون مصفوفة');
  if (!Array.isArray(payload.feedItems))  errors.push('feedItems يجب أن يكون مصفوفة');

  const VALID_PATHS = ['COMMON', 'SCIENCE', 'LITERARY'];
  if (payload.subject?.path && !VALID_PATHS.includes(payload.subject.path)) {
    errors.push(`subject.path غير صالح: "${payload.subject.path}". القيم المسموحة: ${VALID_PATHS.join(', ')}`);
  }

  if (errors.length > 0) {
    return NextResponse.json({ ok: false, error: 'فشل التحقق من الـ payload', details: errors }, { status: 422 });
  }

  try {
    // ── 3. Inject exportedAt + mark as mock ────────────────────────────────
    const enrichedPayload = {
      ...payload,
      exportedAt: new Date().toISOString(),
      _isMockPublish: true,   // sentinel — makes mock exports easy to spot in Supabase
    };

    // ── 4. Determine next version ──────────────────────────────────────────
    const manifest      = await getManifest().catch(() => null);
    const existingEntry = (manifest?.subjects || []).find((s) => s.id === manifestSubjectId);
    const nextVersion   = String((parseInt(existingEntry?.version || '0', 10) + 1));

    // ── 5. Upload to Supabase Storage ──────────────────────────────────────
    const fileName   = `mock_${manifestSubjectId.toLowerCase()}_v${nextVersion}.json`;
    const jsonBuffer = Buffer.from(JSON.stringify(enrichedPayload, null, 2), 'utf-8');

    // Compute sha256 + size for Upgrade 6 compliance
    const sha256 = crypto.createHash('sha256').update(jsonBuffer).digest('hex');
    const size   = jsonBuffer.length;

    await uploadFile(EXPORTS_BUCKET, fileName, jsonBuffer, 'application/json');
    const downloadUrl = getPublicUrl(EXPORTS_BUCKET, fileName);

    if (!downloadUrl) {
      return NextResponse.json(
        { ok: false, error: 'فشل الحصول على رابط التحميل من Supabase' },
        { status: 500 }
      );
    }

    // ── 6. Update Firestore manifest ───────────────────────────────────────
    const publishedAt = new Date().toISOString();
    await upsertSubjectEntry({
      id:           manifestSubjectId,
      version:      nextVersion,
      downloadUrl,
      enabled:      true,
      minAppVersion: '1.0',
      updatedAt:    publishedAt,
      // Upgrade 6: include checksum so the app verifies the download
      sha256,
      size,
      // Mock marker — optional, ignored by the Android app (IgnoreExtraProperties)
      _isMock:      true,
    });

    // ── 7. Return summary ──────────────────────────────────────────────────
    return NextResponse.json({
      ok: true,
      manifestSubjectId,
      version:     nextVersion,
      downloadUrl,
      sha256,
      size,
      publishedAt,
      fileName,
      stats: {
        units:     payload.units?.length     ?? 0,
        lessons:   payload.units?.flatMap((u) => u.lessons ?? []).length ?? 0,
        questions: payload.questions?.length  ?? 0,
        feedItems: payload.feedItems?.length  ?? 0,
        concepts:  payload.concepts?.length   ?? 0,
        exams:     payload.exams?.length      ?? 0,
      },
    });

  } catch (e) {
    console.error('[POST /api/dev/mock-publish]', e);
    return NextResponse.json({ ok: false, error: e.message || 'خطأ في الخادم' }, { status: 500 });
  }
}
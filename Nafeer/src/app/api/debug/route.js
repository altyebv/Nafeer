import { verifyAdminToken } from '@/lib/adminAuth';
import { supabaseAdmin, MEDIA_BUCKET } from '@/lib/supabase';

// GET /api/debug-media
// TEMPORARY — delete after diagnosing the Supabase upload error.
// Admin-only. Returns Supabase connectivity + bucket diagnostics.

export async function GET() {
  const admin = await verifyAdminToken();
  if (!admin) return Response.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const result = {
    env: {
      supabaseUrl:    process.env.NEXT_PUBLIC_SUPABASE_URL    ? '✅ set' : '❌ missing',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY   ? '✅ set' : '❌ missing',
      bucketEnvVar:   process.env.SUPABASE_MEDIA_BUCKET       || '(not set — using default)',
      bucketResolved: MEDIA_BUCKET,
    },
    client: {
      initialised: !!supabaseAdmin,
    },
    bucket:   null,
    policies: null,
    probe:    null,
  };

  if (!supabaseAdmin) {
    result.client.note = 'supabaseAdmin is null — env vars missing at module init time';
    return Response.json(result);
  }

  // 1. List all buckets — confirms service role key works at all
  const { data: buckets, error: bucketsError } = await supabaseAdmin
    .storage
    .listBuckets();

  if (bucketsError) {
    result.bucket = { error: bucketsError.message };
    return Response.json(result);
  }

  const bucketNames = buckets.map((b) => b.name);
  const targetBucket = buckets.find((b) => b.name === MEDIA_BUCKET);

  result.bucket = {
    allBuckets:  bucketNames,
    targetFound: !!targetBucket,
    targetName:  MEDIA_BUCKET,
    isPublic:    targetBucket?.public ?? null,
  };

  if (!targetBucket) {
    result.bucket.note = `Bucket "${MEDIA_BUCKET}" does not exist — create it in the Supabase dashboard`;
    return Response.json(result);
  }

  // 2. Probe upload — write a tiny test file then immediately delete it
  const testPath = `_debug/probe_${Date.now()}.txt`;
  const testBuffer = Buffer.from('nafeer-debug-probe');

  const { error: uploadError } = await supabaseAdmin
    .storage
    .from(MEDIA_BUCKET)
    .upload(testPath, testBuffer, { contentType: 'text/plain', upsert: true });

  if (uploadError) {
    result.probe = { success: false, error: uploadError.message };
    return Response.json(result);
  }

  // Clean up the test file
  await supabaseAdmin.storage.from(MEDIA_BUCKET).remove([testPath]);

  result.probe = { success: true, note: 'Test upload + delete succeeded — storage is fully operational' };

  return Response.json(result);
}
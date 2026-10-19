import { NextResponse }                     from 'next/server';
import { getAdminSession, verifyAdminAuth } from '@/lib/adminAuth';
import { getAdminFirestore, getStringPools, setStringPools } from '@/lib/FirebaseAdmin';
import { parsePoolsDoc, serializePools, validatePools } from '@/shared/stringPools';

// ─── /api/admin/string-pools ──────────────────────────────────────────────────
// The Basheer app's remote copy — Firestore app_config/string_pools.
//
// No Mongo draft: the doc is small, one screen edits it, and the app reads it
// as-is on every launch, so Firestore stays the one copy. The editor's unsaved
// state lives in the browser until it publishes.

// ── GET — the live doc, shaped for the editor ─────────────────────────────────
// `configured: false` when Firebase has no credentials in this environment.
export async function GET() {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    getAdminFirestore();
  } catch {
    return NextResponse.json({ ok: true, data: { configured: false } });
  }

  try {
    const doc = await getStringPools();
    const { pools, unknown } = parsePoolsDoc(doc);
    return NextResponse.json({
      ok: true,
      data: {
        configured: true,
        exists:     !!doc,
        pools,
        unknown,
        updatedAt:  doc?.updatedAt ?? null,
        updatedBy:  doc?.updatedBy ?? null,
      },
    });
  } catch (e) {
    console.error('[GET /api/admin/string-pools]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

// ── PUT — publish the whole doc ───────────────────────────────────────────────
// Body: { pools, unknown, baseUpdatedAt }. Rejects entries the app would drop
// (blank text, weight ≤ 0, unknown tag); 409 when the doc changed since load.
export async function PUT(req) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  try {
    const body = await req.json();
    if (!body?.pools || typeof body.pools !== 'object') {
      return NextResponse.json({ ok: false, error: 'pools مطلوب' }, { status: 400 });
    }

    // Re-parse so only known fields of known pools reach Firestore.
    const { pools } = parsePoolsDoc({ pools: body.pools });
    const unknown = body.unknown && typeof body.unknown === 'object' ? body.unknown : {};

    const { errors } = validatePools(pools);
    if (errors) {
      return NextResponse.json({ ok: false, error: `في النصوص ${errors} خطأ يمنع النشر` }, { status: 400 });
    }

    const admin  = await getAdminSession();
    const result = await setStringPools({
      pools:         serializePools(pools, unknown),
      baseUpdatedAt: body.baseUpdatedAt ?? null,
      updatedBy:     admin?.name || null,
    });

    if ('conflict' in result) {
      return NextResponse.json(
        { ok: false, conflict: true, error: 'غيّر أحدهم النصوص بعد أن فتحتها. أعد التحميل ثم انشر.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, data: { updatedAt: result.updatedAt } });
  } catch (e) {
    console.error('[PUT /api/admin/string-pools]', e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

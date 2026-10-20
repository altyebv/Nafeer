import { NextResponse }    from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { publishSubject }  from '@/lib/publishSubject';

// ── POST /api/content/publish ─────────────────────────────────────────────────
// Body: { subjectId: "PHYSICS", mode?: "delta" | "full", bump?: "major", dryRun?: true }
//
// Owner only. The pipeline itself — modes, versioning, the delta and the
// full export — lives in lib/publishSubject.js, where team leads' releases
// (lib/releases.js) run it too.

export async function POST(request) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  let subjectId, mode, bump, dryRun;
  try {
    ({ subjectId, mode = 'delta', bump = null, dryRun = false } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  return publishSubject({ subjectId, mode, bump, dryRun: dryRun === true });
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { adminDb } from '@/lib/FirebaseAdmin';

const COLL = 'comm_items';

export async function GET(req) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const snap = await adminDb
      .collection(COLL)
      .where('type', '==', 'ANNOUNCEMENT')
      .orderBy('publishedAt', 'desc')
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error('[comms/announcements GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const {
      title,
      body: text,
      ctaLabel,
      ctaDeepLink,
      imageUrl,
      showBanner,
      expiresAt,
      segmentUserIds,
      segmentStudentPaths,
      segmentMinVersionCode,
    } = body;

    if (!title?.trim() || !text?.trim()) {
      return NextResponse.json(
        { error: 'title and body are required' },
        { status: 400 },
      );
    }

    const doc = {
      type: 'ANNOUNCEMENT',
      title: title.trim(),
      body: text.trim(),
      ctaLabel: ctaLabel?.trim() || null,
      ctaDeepLink: ctaDeepLink?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      showBanner: Boolean(showBanner),
      priority: 0,
      expiresAt: expiresAt ?? null,
      publishedAt: new Date().toISOString(),
      segmentUserIds: segmentUserIds ?? [],
      segmentStudentPaths: segmentStudentPaths ?? [],
      segmentMinVersionCode: segmentMinVersionCode ?? null,
    };

    const ref = await adminDb.collection(COLL).add(doc);
    return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (e) {
    console.error('[comms/announcements POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
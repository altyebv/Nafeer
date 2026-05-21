import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { getAdminFirestore } from '@/lib/FirebaseAdmin';

const COLL = 'comm_items';

export async function GET() {
  const auth = await verifyAdminAuth();
  if (auth) return auth;

  try {
    const snap = await getAdminFirestore()
      .collection(COLL)
      .where('type', '==', 'SURVEY')
      .orderBy('publishedAt', 'desc')
      .get();

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ items });
  } catch (e) {
    console.error('[comms/surveys GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST() {
  const auth = await verifyAdminAuth();
  if (auth) return auth;

  try {
    const body = await req.json();
    const {
      title, description, questions,
      allowSkip, autoPresent, expiresAt,
      segmentUserIds, segmentStudentPaths, segmentMinVersionCode,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'at least one question is required' }, { status: 400 });
    }
    for (const q of questions) {
      if (!q.id || !q.type || !q.text?.trim()) {
        return NextResponse.json({ error: 'question missing id, type, or text' }, { status: 400 });
      }
    }

    const doc = {
      type:        'SURVEY',
      title:       title.trim(),
      description: description?.trim() || null,
      questions,
      allowSkip:   allowSkip ?? true,
      autoPresent: autoPresent ?? true,
      priority:    5,
      expiresAt:   expiresAt ?? null,
      publishedAt: new Date().toISOString(),
      segmentUserIds:        segmentUserIds ?? [],
      segmentStudentPaths:   segmentStudentPaths ?? [],
      segmentMinVersionCode: segmentMinVersionCode ?? null,
    };

    const ref = await getAdminFirestore().collection(COLL).add(doc);
    return NextResponse.json({ id: ref.id, ...doc }, { status: 201 });
  } catch (e) {
    console.error('[comms/surveys POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
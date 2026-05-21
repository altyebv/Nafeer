import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { adminDb } from '@/lib/FirebaseAdmin';

const COLL = 'comm_items';

const ALLOWED_FIELDS = [
  'title', 'description', 'questions',
  'allowSkip', 'autoPresent', 'priority', 'expiresAt',
  'segmentUserIds', 'segmentStudentPaths', 'segmentMinVersionCode',
];

export async function GET(req, { params }) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const doc = await adminDb.collection(COLL).doc(params.id).get();
    if (!doc.exists || doc.data()?.type !== 'SURVEY') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const update = Object.fromEntries(
      Object.entries(body).filter(([k]) => ALLOWED_FIELDS.includes(k)),
    );

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Re-validate questions if they're being updated
    if (update.questions) {
      for (const q of update.questions) {
        if (!q.id || !q.type || !q.text?.trim()) {
          return NextResponse.json(
            { error: 'question missing id, type, or text' },
            { status: 400 },
          );
        }
      }
    }

    await adminDb.collection(COLL).doc(params.id).update(update);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const auth = await requireAdmin(req);
  if (auth) return auth;

  try {
    await adminDb.collection(COLL).doc(params.id).delete();
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
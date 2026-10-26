import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
import { fetchPublishedSubject, unpublishedWork, restoreSubject } from '@/lib/restoreSubject';

// ─── /api/admin/remote-subjects/import ────────────────────────────────────────
// Restores a subject from the last file published to the app
// (lib/restoreSubject.js). Admin only.
//
// GET  ?subjectId=  what a restore would throw away — call it first and show it.
// POST { subjectId, acceptLoss? }
//      Restores in one transaction. Refused with 409 and the same list while
//      there is unpublished work, unless acceptLoss is true. `force`, which the
//      old route took to overwrite anything, no longer accepts a loss.

async function load(subjectId) {
  const published = await fetchPublishedSubject(subjectId);
  if (published.error) return { response: NextResponse.json({ ok: false, error: published.error }, { status: published.status }) };
  return published;
}

export async function GET(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const subjectId = new URL(request.url).searchParams.get('subjectId');
  if (!subjectId) return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });

  try {
    const { response, data, publishedAt } = await load(subjectId);
    if (response) return response;
    return NextResponse.json({ ok: true, data: await unpublishedWork(subjectId, data, publishedAt) });
  } catch (e) {
    console.error('[GET /api/admin/remote-subjects/import]', e);
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }); }

  const { subjectId, acceptLoss = false } = body;
  if (!subjectId) return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });

  try {
    const { response, data, publishedAt } = await load(subjectId);
    if (response) return response;

    const loss = await unpublishedWork(subjectId, data, publishedAt);
    if (loss.total && acceptLoss !== true) {
      return NextResponse.json({
        ok: false,
        error: `في المادة ${loss.total} تعديلاً لم يُنشر وسيضيع بالاسترجاع — استرجعها من صفحة المادة لترى القائمة وتؤكد.`,
        loss,
      }, { status: 409 });
    }

    const stats = await restoreSubject(data, { actorId: admin.id });
    return NextResponse.json({ ok: true, result: { subjectId, stats } });
  } catch (e) {
    console.error('[POST /api/admin/remote-subjects/import]', e);
    return NextResponse.json({ ok: false, error: 'تعذّر الاسترجاع — لم يتغيّر شيء في المادة.' }, { status: 500 });
  }
}

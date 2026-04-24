import { NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { getManifest, removeSubjectEntry } from '@/lib/FirebaseAdmin';
import { deleteFile } from '@/lib/supabase';

const EXPORTS_BUCKET = process.env.SUPABASE_EXPORTS_BUCKET || 'content-exports';

export async function DELETE(request, { params }) {
  const authErr = await verifyAdminAuth();
  if (authErr) return authErr;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
  }

  try {
    const manifest = await getManifest().catch(() => null);
    const entry = (manifest?.subjects || []).find((subject) => subject.id === id) || null;

    if (!entry) {
      return NextResponse.json({ ok: false, error: 'النسخة البعيدة غير موجودة' }, { status: 404 });
    }

    const remotePath = extractSupabasePublicPath(entry.downloadUrl, EXPORTS_BUCKET);
    if (remotePath) {
      await deleteFile(EXPORTS_BUCKET, remotePath);
    }

    await removeSubjectEntry(id);

    return NextResponse.json({
      ok: true,
      data: {
        subjectId: id,
        removedManifestEntry: true,
        removedStorageObject: !!remotePath,
        storagePath: remotePath,
      },
    });
  } catch (e) {
    console.error('[DELETE /api/admin/remote-subjects/[id]]', e);
    return NextResponse.json({ ok: false, error: e.message || 'فشل حذف المحتوى البعيد' }, { status: 500 });
  }
}

function extractSupabasePublicPath(downloadUrl, bucket) {
  if (!downloadUrl) return null;

  try {
    const url = new URL(downloadUrl);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    const index = url.pathname.indexOf(prefix);
    if (index === -1) return null;

    return decodeURIComponent(url.pathname.slice(index + prefix.length));
  } catch {
    return null;
  }
}

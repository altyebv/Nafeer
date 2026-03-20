import { NextResponse } from 'next/server';
import { getCurrentUser, signToken, setAuthCookie, buildTokenPayload } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { optimizeImage } from '@/lib/imageOptimizer';
import { uploadUserFile, deleteFile, USERS_BUCKET } from '@/lib/supabase';

// POST /api/contributors/me/avatar
// Accepts multipart/form-data with a single 'file' field.
// Optimizes to WebP 400×400, uploads to nafeer-users/{contributorId}.webp.
// Deletes the previous avatar from storage if one exists.

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'بيانات الطلب غير صالحة' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, error: 'الملف مطلوب' }, { status: 400 });
  }

  const mimeType = file.type;
  const allowed  = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowed.includes(mimeType)) {
    return NextResponse.json(
      { ok: false, error: 'نوع الملف غير مدعوم. المقبول: JPEG، PNG، WebP' },
      { status: 400 }
    );
  }

  const MAX_BYTES = 5 * 1024 * 1024; // 5 MB cap
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: 'حجم الصورة يتجاوز 5 ميغابايت' }, { status: 400 });
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  // Optimize: 400×400 cover crop, WebP quality 90
  const { buffer, mimeType: optimizedMime } = await optimizeImage(rawBuffer, mimeType, 'avatar');

  const path = `avatars/${user.id}.webp`;

  await connectDB();

  // Delete old avatar if stored path differs (it won't here, but good practice)
  const existing = await Contributor.findById(user.id).select('+avatarPath');
  if (existing?.avatarPath && existing.avatarPath !== path) {
    deleteFile(USERS_BUCKET, existing.avatarPath).catch(() => {});
  }

  let avatarUrl;
  try {
    avatarUrl = await uploadUserFile(path, buffer, optimizedMime);
  } catch (e) {
    console.error('[POST /api/contributors/me/avatar] upload error:', e);
    return NextResponse.json({ ok: false, error: 'فشل رفع الصورة' }, { status: 500 });
  }

  // Add cache-busting param so browser fetches fresh image even if path is same
  const avatarUrlWithBust = `${avatarUrl}?v=${Date.now()}`;

  const contributor = await Contributor.findByIdAndUpdate(
    user.id,
    { $set: { avatarUrl: avatarUrlWithBust, avatarPath: path } },
    { new: true }
  );

  // Re-issue JWT with new avatarUrl
  const token = await signToken(buildTokenPayload(contributor));
  await setAuthCookie(token);

  return NextResponse.json({ ok: true, data: { avatarUrl: avatarUrlWithBust } });
}

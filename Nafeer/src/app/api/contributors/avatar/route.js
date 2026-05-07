import { NextResponse }       from 'next/server';
import { connectDB }          from '@/lib/db';
import { Contributor }        from '@/lib/models/Contributor';
import { requireContributor } from '@/lib/api/guard';
import { uploadUserFile, USERS_BUCKET, deleteFile } from '@/lib/supabase';
import { optimizeImage, getOptimizedExtension }     from '@/lib/imageOptimizer';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const MAX_BYTES     = 5 * 1024 * 1024; // 5 MB

// ─── POST /api/contributor/avatar ─────────────────────────────────────────────
// Accepts multipart/form-data with field `avatar` (image file).
// Optimizes to WebP 400×400, uploads to Supabase USERS_BUCKET,
// then updates contributor.avatarUrl and contributor.avatarPath.

export async function POST(request) {
  try {
    const user = await requireContributor();

    const formData = await request.formData();
    const file     = formData.get('avatar');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ ok: false, error: 'لم يتم إرسال ملف' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { ok: false, error: 'نوع الملف غير مدعوم. استخدم JPEG أو PNG أو WebP' },
        { status: 415 }
      );
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    if (rawBuffer.byteLength > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: 'حجم الصورة يجب أن لا يتجاوز 5 ميغابايت' },
        { status: 413 }
      );
    }

    // ── Optimize ──────────────────────────────────────────────────────────────
    const { buffer: optimized, mimeType: optimizedMime } =
      await optimizeImage(rawBuffer, file.type, 'avatar');

    const ext  = getOptimizedExtension(file.type, optimizedMime);
    const path = `avatars/${user.id}.${ext}`;

    // ── Upload ────────────────────────────────────────────────────────────────
    // uploadUserFile uses upsert:true — replaces any existing avatar at same path.
    const publicUrl = await uploadUserFile(path, optimized, optimizedMime);

    // ── Persist ───────────────────────────────────────────────────────────────
    await connectDB();

    const contributor = await Contributor.findById(user.id).select('+avatarPath');
    if (!contributor) {
      return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });
    }

    // Delete the old file if it's at a different path (different extension)
    if (contributor.avatarPath && contributor.avatarPath !== path) {
      deleteFile(USERS_BUCKET, contributor.avatarPath).catch(() => {});
    }

    contributor.avatarUrl  = publicUrl;
    contributor.avatarPath = path;
    await contributor.save();

    return NextResponse.json({ ok: true, avatarUrl: publicUrl });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error('[POST /api/contributor/avatar]', res);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في رفع الصورة' }, { status: 500 });
  }
}

// ─── DELETE /api/contributor/avatar ───────────────────────────────────────────
// Removes the contributor's avatar.

export async function DELETE() {
  try {
    const user = await requireContributor();

    await connectDB();

    const contributor = await Contributor.findById(user.id).select('+avatarPath');
    if (!contributor) {
      return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });
    }

    if (contributor.avatarPath) {
      deleteFile(USERS_BUCKET, contributor.avatarPath).catch(() => {});
    }

    contributor.avatarUrl  = null;
    contributor.avatarPath = null;
    await contributor.save();

    return NextResponse.json({ ok: true });
  } catch (res) {
    if (res instanceof Response) return res;
    console.error('[DELETE /api/contributor/avatar]', res);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { connectDB }       from '@/lib/db';
import { Media }           from '@/lib/models/Media';
import { getCurrentUser }  from '@/lib/auth';
import { getAdminAsUser }  from '@/lib/adminAuth';

async function getUser() {
  return (await getCurrentUser()) ?? (await getAdminAsUser());
}
import { uploadMedia }     from '@/lib/supabase';
import { randomUUID }      from 'crypto';
import { SUBJECT_IDS }     from '@/shared/curriculum';

// ─── helpers ─────────────────────────────────────────────────────────────────

function inferMediaType(mimeType) {
  if (mimeType === 'image/gif') return 'GIF';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  return null;
}

function sanitiseFilename(name) {
  return name.replace(/[^a-zA-Z0-9.\-_\u0600-\u06FF ]/g, '_').trim().slice(0, 120);
}

function ext(mimeType) {
  const map = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg',
    'image/png':  'png',
    'image/gif':  'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
  };
  return map[mimeType] || 'bin';
}

// ─── GET /api/media ───────────────────────────────────────────────────────────
// Contributors see media for their own subject + 'common'.
// Admins (role === 'admin') can see all, optionally filtered by ?subjectId=X.
export async function GET(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isAdmin = user.role === 'admin';

  await connectDB();

  let filter = {};

  if (isAdmin) {
    // Admin: optional subject filter from query param
    const subjectParam = searchParams.get('subjectId');
    if (subjectParam && (SUBJECT_IDS.includes(subjectParam) || subjectParam === 'common')) {
      filter.subjectId = subjectParam;
    }
    // else: no filter → return all media
  } else {
    // Contributor: only their subject + shared 'common' pool
    filter.subjectId = { $in: [user.subject, 'common'] };
  }

  const media = await Media.find(filter).sort({ createdAt: -1 }).lean();

  // Normalise _id → id
  const data = media.map(({ _id, ...m }) => ({ id: _id.toString(), ...m }));

  return NextResponse.json({ ok: true, data });
}

// ─── POST /api/media ──────────────────────────────────────────────────────────
// Admin-only. Accepts multipart/form-data.
// Fields: file (required), subjectId (required), alt (optional)
export async function POST(request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'رفع الوسائط متاح للمشرفين فقط' },
      { status: 403 }
    );
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: 'بيانات الطلب غير صالحة' }, { status: 400 });
  }

  const file      = formData.get('file');
  const subjectId = formData.get('subjectId');
  const alt       = formData.get('alt') || '';

  if (!file || typeof file === 'string') {
    return NextResponse.json({ ok: false, error: 'الملف مطلوب' }, { status: 400 });
  }
  if (!subjectId || (!SUBJECT_IDS.includes(subjectId) && subjectId !== 'common')) {
    return NextResponse.json({ ok: false, error: 'معرّف المادة غير صالح' }, { status: 400 });
  }

  const mimeType  = file.type;
  const mediaType = inferMediaType(mimeType);

  if (!mediaType) {
    return NextResponse.json(
      { ok: false, error: 'نوع الملف غير مدعوم. المقبول: JPEG، PNG، GIF، WebP، SVG' },
      { status: 400 }
    );
  }

  // 10 MB cap
  const MAX_BYTES = 10 * 1024 * 1024;
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'حجم الملف يتجاوز 10 ميغابايت' },
      { status: 400 }
    );
  }

  const contentId = randomUUID();
  const extension = ext(mimeType);
  const path      = `${subjectId}/${contentId}.${extension}`;
  const filename  = sanitiseFilename(file.name || `media.${extension}`);

  let url;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    url = await uploadMedia(path, buffer, mimeType);
  } catch (e) {
    console.error('[POST /api/media] Supabase upload error:', e);
    return NextResponse.json(
      { ok: false, error: 'فشل رفع الملف إلى التخزين السحابي' },
      { status: 500 }
    );
  }

  await connectDB();

  const media = await Media.create({
    contentId,
    subjectId,
    filename,
    path,
    url,
    mimeType,
    size: file.size,
    type: mediaType,
    alt,
    uploadedBy: user.id,
  });

  const { _id, ...rest } = media.toObject();
  return NextResponse.json({ ok: true, data: { id: _id.toString(), ...rest } }, { status: 201 });
}
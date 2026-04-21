import { NextResponse } from 'next/server';
import { connectDB }    from '@/lib/db';
import { Contributor }  from '@/lib/models/Contributor';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

const SUBJECT_MAP = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s]));

// ─── GET /api/contributors/profile?username=xyz ───────────────────────────────
// Public — returns a single approved+onboarded contributor's safe profile.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username')?.trim();

  if (!username) {
    return NextResponse.json({ ok: false, error: 'username مطلوب' }, { status: 400 });
  }

  try {
    await connectDB();

    const contributor = await Contributor.findOne(
      { username, status: 'approved', onboarded: true },
      {
        name: 1, username: 1, avatarUrl: 1, bio: 1,
        subject: 1, background: 1, fieldOfStudy: 1,
        stats: 1, createdAt: 1,
      }
    ).lean();

    if (!contributor) {
      return NextResponse.json({ ok: false, error: 'المساهم غير موجود' }, { status: 404 });
    }

    const subjectInfo = contributor.subject ? SUBJECT_MAP[contributor.subject] : null;

    return NextResponse.json({
      ok: true,
      contributor: {
        ...contributor,
        _id: contributor._id.toString(),
        subjectInfo: subjectInfo ? { id: subjectInfo.id, nameAr: subjectInfo.nameAr, track: subjectInfo.track } : null,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'خطأ في الخادم' }, { status: 500 });
  }
}
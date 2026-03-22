import { NextResponse } from 'next/server';
import { connectDB }       from '@/lib/db';
import { verifyAdminAuth } from '@/lib/adminAuth';
import { ContributorRole } from '@/lib/models/ContributorRole';

// ─── GET /api/admin/roles ─────────────────────────────────────────────────────
// Returns all roles sorted by category + order. No auth needed for active-only
// variant (used by /join); full list requires admin auth.

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active') === 'true';

  // Public endpoint for join page — only active roles
  if (!activeOnly) {
    const authErr = await verifyAdminAuth(request);
    if (authErr) return authErr;
  }

  await connectDB();

  const filter = activeOnly ? { isActive: true } : {};
  const roles  = await ContributorRole
    .find(filter)
    .sort({ category: 1, order: 1, createdAt: 1 });

  return NextResponse.json({ ok: true, roles });
}

// ─── POST /api/admin/roles ────────────────────────────────────────────────────
// Creates a new contributor role.

export async function POST(request) {
  const authErr = await verifyAdminAuth(request);
  if (authErr) return authErr;

  try {
    const body = await request.json();
    const { name, category, subcategory, description, interviewQuestions, microTask, isActive, order } = body;

    if (!name?.trim() || !category) {
      return NextResponse.json(
        { ok: false, error: 'الاسم والفئة مطلوبان' },
        { status: 400 }
      );
    }

    await connectDB();

    // Deduplicate slug if needed
    let slug = name.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u0600-\u06FF-]/g, '')
      .slice(0, 60);

    const existing = await ContributorRole.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const role = await ContributorRole.create({
      name: name.trim(),
      slug,
      category,
      subcategory:        subcategory?.trim() || '',
      description:        description?.trim() || '',
      interviewQuestions: interviewQuestions || [],
      microTask:          microTask || { prompt: '', minChars: 80 },
      isActive:           isActive !== false,
      order:              order ?? 0,
    });

    return NextResponse.json({ ok: true, role }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ ok: false, error: 'يوجد دور بهذا الاسم بالفعل' }, { status: 409 });
    }
    console.error('[POST /api/admin/roles]', err);
    return NextResponse.json({ ok: false, error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}

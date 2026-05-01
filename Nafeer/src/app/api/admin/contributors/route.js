import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { verifyAdminToken } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// ─── helpers ──────────────────────────────────────────────────────────────────

function generateOnboardingToken() {
  return randomBytes(32).toString('hex');
}

function getOnboardingLink(token) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://nafeer-edu.vercel.app';
  return `${base}/onboard?token=${token}`;
}

function getInterviewLink(token) {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://nafeer-edu.vercel.app';
  return `${base}/interview?token=${token}`;
}

// ─── GET /api/admin/contributors ─────────────────────────────────────────────

export async function GET(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const filter = status && status !== 'all' ? { status } : {};

  const contributors = await Contributor.find(filter).sort({ createdAt: -1 });
  return NextResponse.json({ contributors });
}

// ─── POST /api/admin/contributors — create manually ───────────────────────────

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { name, gender, email, username, subject, password } = await request.json();

  if (!name || !gender || !email || !username || !subject || !password) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();

  const existing = await Contributor.findOne({
    $or: [{ email: email.toLowerCase() }, { username }],
  });
  if (existing) return NextResponse.json({ message: 'Email or username already exists' }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);

  const contributor = await Contributor.create({
    name,
    gender,
    email:     email.toLowerCase(),
    username,
    subject,
    background: 'Created by admin',
    passwordHash,
    status:    'approved',
    onboarded: true,
  });

  return NextResponse.json({ success: true, contributor }, { status: 201 });
}

// ─── PATCH /api/admin/contributors ───────────────────────────────────────────
// Actions: approve | reject | set_password | reset_to_pending | generate_onboard_link

export async function PATCH(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id, action, password, subject, role, roleId, username } = await request.json();
  if (!id || !action) return NextResponse.json({ message: 'Missing id or action' }, { status: 400 });

  // Client-side refresh trigger — no server action needed
  if (action === '_noop') return NextResponse.json({ success: true });

  await connectDB();

  const contributor = await Contributor.findById(id);
  if (!contributor) return NextResponse.json({ message: 'Contributor not found' }, { status: 404 });

  let onboardingLink  = null;
  let interviewLink   = null;

  if (action === 'send_interview') {
    // Generate a fresh interview token for pending applicants
    if (contributor.status !== 'pending') {
      return NextResponse.json(
        { message: 'يمكن إرسال رابط المقابلة فقط للطلبات في الانتظار' },
        { status: 400 }
      );
    }
    const token = generateOnboardingToken();
    contributor.interviewToken     = token;
    contributor.interviewExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days
    interviewLink = getInterviewLink(token);
  } else if (action === 'approve') {
    contributor.status = 'approved';
    // Auto-generate an onboarding token if not yet onboarded
    if (!contributor.onboarded) {
      const token = generateOnboardingToken();
      contributor.onboardingToken     = token;
      contributor.onboardingExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      onboardingLink = getOnboardingLink(token);
    }
  } else if (action === 'reject') {
    contributor.status = 'rejected';
  } else if (action === 'set_password') {
    if (!password) return NextResponse.json({ message: 'Password required' }, { status: 400 });
    contributor.passwordHash = await bcrypt.hash(password, 12);
    contributor.status       = 'approved';
    contributor.onboarded    = true; // admin-set password skips onboarding
  } else if (action === 'reset_to_pending') {
    contributor.status = 'pending';
  } else if (action === 'set_username') {
    const newUsername = (username || '').trim().toLowerCase();
    if (!newUsername) return NextResponse.json({ message: 'Username cannot be empty' }, { status: 400 });
    const taken = await Contributor.findOne({ username: newUsername, _id: { $ne: id } });
    if (taken) return NextResponse.json({ message: 'اسم المستخدم مأخوذ بالفعل' }, { status: 409 });
    contributor.username = newUsername;
  } else if (action === 'assign_subject') {
    // Admin assigns (or clears) the subject for an approved contributor
    contributor.subject = subject || '';
  } else if (action === 'assign_role_id') {
    // Admin assigns (or clears) the ContributorRole reference
    contributor.roleId = roleId || null;
  } else if (action === 'generate_onboard_link') {
    // Re-generate a fresh link for an already-approved contributor
    if (contributor.status !== 'approved') {
      return NextResponse.json({ message: 'Contributor must be approved first' }, { status: 400 });
    }
    const token = generateOnboardingToken();
    contributor.onboardingToken     = token;
    contributor.onboardingExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    contributor.onboarded           = false;
    onboardingLink = getOnboardingLink(token);
  }

  await contributor.save();
  return NextResponse.json({ success: true, contributor, onboardingLink, interviewLink });
}

// ─── DELETE /api/admin/contributors ──────────────────────────────────────────

export async function DELETE(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  await connectDB();
  await Contributor.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
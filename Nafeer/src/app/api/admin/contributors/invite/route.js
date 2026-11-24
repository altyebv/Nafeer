import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { verifyAdminToken } from '@/lib/adminAuth';
import { newToken, onboardingLink, ONBOARDING_DAYS } from '@/lib/applicationLinks';
import { sendEmail } from '@/lib/email/emailService';
import { SUBJECT_IDS } from '@/shared/curriculum';

const DAY_MS = 24 * 60 * 60 * 1000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ message: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase().slice(0, 120) : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const emailSubject = body.emailSubject === undefined ? '' : body.emailSubject;
  const emailBody = body.emailBody === undefined ? '' : body.emailBody;

  if (!name || !email) {
    return NextResponse.json({ message: 'Name and email are required' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
  }
  if (body.subject !== undefined && typeof body.subject !== 'string') {
    return NextResponse.json({ message: 'Invalid subject' }, { status: 400 });
  }
  if (subject && !SUBJECT_IDS.includes(subject)) {
    return NextResponse.json({ message: 'Invalid subject' }, { status: 400 });
  }
  if (typeof emailSubject !== 'string' || typeof emailBody !== 'string') {
    return NextResponse.json({ message: 'Invalid email customization' }, { status: 400 });
  }
  if (emailSubject.trim().length > 160 || emailBody.trim().length > 5000) {
    return NextResponse.json({ message: 'Email subject or body is too long' }, { status: 400 });
  }

  await connectDB();
  if (await Contributor.exists({ email })) {
    return NextResponse.json({ message: 'Email is already registered' }, { status: 409 });
  }

  const token = newToken();
  let contributor;
  try {
    contributor = await Contributor.create({
      name,
      email,
      subject,
      status: 'approved',
      onboarded: false,
      onboardingToken: token,
      onboardingExpiresAt: new Date(Date.now() + ONBOARDING_DAYS * DAY_MS),
    });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Email is already registered' }, { status: 409 });
    }
    throw error;
  }

  const link = onboardingLink(token);
  let emailResult;
  try {
    const result = await sendEmail({
      to: email,
      template: 'onboarding_invite',
      data: { name, link, expiresIn: '7 أيام', isDirectInvite: true, body: emailBody.trim() || undefined },
      subject: emailSubject.trim() || undefined,
    });
    emailResult = { ok: result.ok, to: email, error: result.error || null };
  } catch (error) {
    console.error('[POST /api/admin/contributors/invite] Email delivery failed', error);
    emailResult = { ok: false, to: email, error: 'Email delivery failed' };
  }

  return NextResponse.json({
    success: true,
    contributor: { id: String(contributor._id), name, email },
    onboardingLink: link,
    email: emailResult,
  }, { status: 201 });
}

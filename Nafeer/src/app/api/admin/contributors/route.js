import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Contributor } from '@/lib/models/Contributor';
import { verifyAdminToken } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';

// GET /api/admin/contributors — list all
export async function GET(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // pending | approved | rejected | all

  const filter = status && status !== 'all' ? { status } : {};
  const contributors = await Contributor.find(filter).sort({ createdAt: -1 });

  return NextResponse.json({ contributors });
}

// POST /api/admin/contributors — create contributor manually
export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { name, email, subject, background, password } = await request.json();

  if (!name || !email || !subject || !password) {
    return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
  }

  await connectDB();

  const existing = await Contributor.findOne({ email: email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ message: 'Email already exists' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const contributor = await Contributor.create({
    name,
    email: email.toLowerCase(),
    subject,
    background: background || 'Created by admin',
    passwordHash,
    status: 'approved',
  });

  return NextResponse.json({ success: true, contributor }, { status: 201 });
}

// PATCH /api/admin/contributors — update status or set password
export async function PATCH(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id, action, password } = await request.json();

  if (!id || !action) {
    return NextResponse.json({ message: 'Missing id or action' }, { status: 400 });
  }

  await connectDB();

  const contributor = await Contributor.findById(id);
  if (!contributor) {
    return NextResponse.json({ message: 'Contributor not found' }, { status: 404 });
  }

  if (action === 'approve') {
    contributor.status = 'approved';
  } else if (action === 'reject') {
    contributor.status = 'rejected';
  } else if (action === 'set_password') {
    if (!password) return NextResponse.json({ message: 'Password required' }, { status: 400 });
    contributor.passwordHash = await bcrypt.hash(password, 12);
    contributor.status = 'approved';
  } else if (action === 'reset_to_pending') {
    contributor.status = 'pending';
  }

  await contributor.save();
  return NextResponse.json({ success: true, contributor });
}

// DELETE /api/admin/contributors
export async function DELETE(request) {
  const admin = await verifyAdminToken();
  if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await request.json();
  await connectDB();
  await Contributor.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}

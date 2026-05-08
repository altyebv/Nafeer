import { NextResponse } from 'next/server';
import Team from '@/lib/models/Team';
import { getContributorSession } from '@/lib/auth';
import Contributor from '@/lib/models/Contributor';
import { connectDB } from '@/lib/db';
import Announcement from '@/lib/models/announcement';


// ─── GET /api/contributors/announcements ──────────────────────────────────────
//
// Returns announcements relevant to the authenticated contributor:
//   • Broadcast (no targets set on any targeting field)
//   • Targeted at contributor's subject
//   • Targeted at a team the contributor belongs to
//   • Targeted directly at the contributor by _id
//
// Response shape:
//   { ok: true, data: Announcement[] }
//
// Each item:
//   { id, title, body, type, pinned, authorName, createdAt }


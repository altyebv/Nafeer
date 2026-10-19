import { after } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireLead, requireSubjectAccess, ok, err } from '@/lib/api/guard';
import {
  SubjectGuide, MAX_CHECKLIST_ITEM_LENGTH, MAX_CHECKLIST_ITEMS, MAX_HANDBOOK_LENGTH,
} from '@/lib/models/SubjectGuide';
import { recordAudit } from '@/lib/audit';

// ─── /api/content/guide?subjectId= (docs/team-leads.md L2) ────────────────────
//   GET → { handbook, checklist, updatedByName, updatedAt } — any member
//   PUT { handbook?, checklist? } → the lead (canManageTeam) or the owner

const shape = (g) => ({
  handbook:      g?.handbook || '',
  checklist:     g?.checklist || [],
  updatedByName: g?.updatedByName || null,
  updatedAt:     g?.updatedAt || null,
});

export async function GET(request) {
  try {
    const subjectId = new URL(request.url).searchParams.get('subjectId');
    await requireSubjectAccess(subjectId);
    await connectDB();
    return ok(shape(await SubjectGuide.findOne({ subjectId }).lean()));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/guide]', e);
    return err('خطأ في الخادم', 500);
  }
}

export async function PUT(request) {
  try {
    const subjectId = new URL(request.url).searchParams.get('subjectId');
    const user = await requireLead(subjectId, 'canManageTeam', { write: true });
    const body = await request.json().catch(() => ({}));

    const $set = {};
    if (body.handbook !== undefined) {
      if (typeof body.handbook !== 'string') return err('نص الدليل غير صالح');
      const handbook = body.handbook.trim();
      if (handbook.length > MAX_HANDBOOK_LENGTH) return err(`الدليل طويل جداً (الحد ${MAX_HANDBOOK_LENGTH} حرف)`);
      $set.handbook = handbook;
    }
    if (body.checklist !== undefined) {
      if (!Array.isArray(body.checklist)) return err('قائمة المراجعة غير صالحة');
      const items = body.checklist
        .filter((t) => typeof t === 'string')
        .map((t) => t.trim())
        .filter(Boolean);
      if (items.length > MAX_CHECKLIST_ITEMS) return err(`الحد ${MAX_CHECKLIST_ITEMS} بنداً`);
      if (items.some((t) => t.length > MAX_CHECKLIST_ITEM_LENGTH)) return err(`البند الواحد ${MAX_CHECKLIST_ITEM_LENGTH} حرفاً على الأكثر`);
      $set.checklist = items;
    }
    if (!Object.keys($set).length) return err('لا شيء لحفظه');

    const isAdmin = user.role === 'admin';
    const name = isAdmin ? 'المالك' : (user.name || 'قائد الفريق');
    $set.updatedById = String(user.id);
    $set.updatedByName = name;

    await connectDB();
    const g = await SubjectGuide.findOneAndUpdate(
      { subjectId }, { $set, $setOnInsert: { subjectId } }, { upsert: true, new: true },
    ).lean();

    after(() => recordAudit({ id: user.id, name, kind: isAdmin ? 'admin' : 'lead' }, {
      action: 'guide.edit', subjectId,
      target: { kind: 'guide', id: subjectId, label: Object.keys($set).filter((k) => !k.startsWith('updated')).join(',') },
    }));
    return ok(shape(g));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/guide]', e);
    return err('خطأ في الخادم', 500);
  }
}

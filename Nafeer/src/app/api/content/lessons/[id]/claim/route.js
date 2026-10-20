import { requireContentAccess, ok, err } from '@/lib/api/guard';
import { Lesson } from '@/lib/models/Lesson';
import { ClaimError, claimLesson } from '@/lib/lessonAccess';

// ─── POST /api/content/lessons/[id]/claim (docs/team-leads.md L4) ─────────────
// A member takes an unclaimed scaffold lesson of their subject: it becomes
// theirs to write, and they its author. The deliberate step that replaced
// claiming on first save. A paused member cannot claim (write: true).
export async function POST(request, { params }) {
  try {
    const { user } = await requireContentAccess(Lesson, (await params).id, { write: true });
    if (user.role === 'admin') return err('المالك يعدّل أي درس دون أن يتولّاه');
    return ok(await claimLesson(user, (await params).id));
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof ClaimError) return err(e.message, e.status);
    console.error('[POST /api/content/lessons/[id]/claim]', e);
    return err('خطأ في الخادم', 500);
  }
}

import { requireContributor, ok, err } from '@/lib/api/guard';
import { connectDB } from '@/lib/db';
import { Lesson } from '@/lib/models/Lesson';
import { addLessonNote } from '@/lib/api/lessons';

// GET /api/content/lessons/[id]/notes
// Returns notes for a lesson. Auth-gated to any contributor.
export async function GET(request, { params }) {
  try {
    await requireContributor();
    await connectDB();

    const contentId = (await params).id;
    const lesson = await Lesson.findOne({ contentId }).select('notes notesCount').lean();
    if (!lesson) return err('الدرس غير موجود', 404);

    return ok({ notes: lesson.notes || [], total: lesson.notesCount || 0 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/lessons/[id]/notes]', e);
    return err('خطأ في الخادم', 500);
  }
}

// POST /api/content/lessons/[id]/notes
// Body: { text, noteType? }   noteType: 'comment' | 'flag'
export async function POST(request, { params }) {
  try {
    const user = await requireContributor();
    const { text, noteType } = await request.json();

    if (!text?.trim()) return err('نص الملاحظة مطلوب');
    if (text.trim().length > 1000) return err('الملاحظة طويلة جداً (الحد 1000 حرف)');
    if (noteType && !['comment', 'flag'].includes(noteType)) return err('نوع ملاحظة غير صالح');

    const contentId = (await params).id;
    const note = await addLessonNote(contentId, {
      text:       text.trim(),
      authorId:   user.id,
      authorName: user.name,
      authorRole: user.role,
      noteType:   noteType || 'comment',
    });

    if (!note) return err('الدرس غير موجود', 404);
    return ok(note, { status: 201 });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/lessons/[id]/notes]', e);
    return err('خطأ في الخادم', 500);
  }
}

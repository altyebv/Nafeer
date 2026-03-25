import { requireContributor, ok, err } from '@/lib/api/guard';
import { updateLessonNote, deleteLessonNote } from '@/lib/api/lessons';

// PATCH /api/content/lessons/[id]/notes/[noteId]
// Body: { resolved?: Boolean, text?: String }
// Any contributor can toggle resolved. Only the author can edit text.
export async function PATCH(request, { params }) {
  try {
    const user = await requireContributor();
    const { resolved, text } = await request.json();
    const { id: contentId, noteId } = await params;

    if (resolved === undefined && text === undefined) {
      return err('يجب توفير resolved أو text');
    }

    const updates = {};
    if (resolved !== undefined) updates.resolved = Boolean(resolved);
    if (text !== undefined) {
      if (!text.trim()) return err('نص الملاحظة لا يمكن أن يكون فارغاً');
      updates.text = text.trim();
    }

    const note = await updateLessonNote(contentId, noteId, updates, user.id);
    if (!note) return err('الملاحظة غير موجودة', 404);

    return ok(note);
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.message === 'FORBIDDEN') return err('لا يمكنك تعديل ملاحظة شخص آخر', 403);
    console.error('[PATCH /api/content/lessons/[id]/notes/[noteId]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/lessons/[id]/notes/[noteId]
// Only the note author or a contributor with role='admin' can delete.
export async function DELETE(request, { params }) {
  try {
    const user = await requireContributor();
    const { id: contentId, noteId } = await params;

    await deleteLessonNote(contentId, noteId, user.id, user.role);
    return ok({ deleted: noteId });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e.message === 'FORBIDDEN') return err('لا يمكنك حذف ملاحظة شخص آخر', 403);
    console.error('[DELETE /api/content/lessons/[id]/notes/[noteId]]', e);
    return err('خطأ في الخادم', 500);
  }
}

import { requireContentAccess, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { Piece } from '@/lib/models/Piece';
import { Block } from '@/lib/models/Block';
import { applyVersionBump } from '@/lib/models/versioning';
import { normalizePiece, readVerseMeta, pieceToClient } from '@/lib/verse';

// PUT /api/content/pieces/[id]  — the whole piece, as POST takes it.
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { user } = await requireContentAccess(Piece, id, { write: true });
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const { value, error } = normalizePiece(await request.json());
    if (error) return err(error);

    const existing = await Piece.findOne({ contentId: id });
    const { updates } = applyVersionBump(value, existing, actorId, 'edited');
    const piece = await Piece.findOneAndUpdate({ contentId: id }, { $set: updates }, { new: true, runValidators: true }).lean();
    return ok(pieceToClient(piece));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/content/pieces/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// DELETE /api/content/pieces/[id]
// Refused while a verse still shows it. Once deleted, the next publish retires
// it on every device, and the students' recitals on it with it.
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await requireContentAccess(Piece, id, { write: true });
    const piece = await Piece.findOne({ contentId: id }).select('subjectId').lean();
    const verses = await Block.find({ subjectId: piece.subjectId, type: 'VERSE', status: { $ne: 'archived' } })
      .select('metadata').lean();
    const used = verses.filter((b) => readVerseMeta(b.metadata).pieceId === id).length;
    if (used) return err(`القطعة معروضة في ${used} من الآيات أو الأبيات؛ فك ربطها أول.`, 409);

    await Piece.deleteOne({ contentId: id });
    return ok({ deleted: id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/pieces/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

import { requireSubjectAccess, ok, err } from '@/lib/api/guard';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { connectDB } from '@/lib/db';
import { Piece } from '@/lib/models/Piece';
import { initialChangelog } from '@/lib/models/versioning';
import { normalizePiece, pieceToClient as toClient } from '@/lib/verse';

// ─── Memorization pieces of a subject ─────────────────────────────────────────
// docs/contract.md §3. A piece is shown by VERSE blocks that name it.

const generateId = () => `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

// GET /api/content/pieces?subjectId=ARABIC
export async function GET(request) {
  try {
    const subjectId = new URL(request.url).searchParams.get('subjectId');
    if (!subjectId) return err('subjectId مطلوب');
    await requireSubjectAccess(subjectId);
    await connectDB();
    const pieces = await Piece.find({ subjectId, status: { $ne: 'archived' } }).sort({ order: 1, createdAt: 1 }).lean();
    return ok(pieces.map(toClient), { total: pieces.length });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/content/pieces]', e);
    return err('خطأ في الخادم', 500);
  }
}

// POST /api/content/pieces  { subjectId, kind, title, lines, poet?, surah?, ayahFrom?, ayahTo?, order? }
export async function POST(request) {
  try {
    const body = await request.json();
    if (!body?.subjectId) return err('subjectId مطلوب');
    const user = await requireSubjectAccess(body.subjectId, { write: true });
    const { value, error } = normalizePiece(body);
    if (error) return err(error);

    await connectDB();
    const actorId = user.role === 'admin' ? await ensureSystemSeedContributor() : user.id;
    const order = value.order ?? await Piece.countDocuments({ subjectId: body.subjectId });
    const piece = await Piece.create({
      ...value,
      order,
      contentId: generateId(),
      subjectId: body.subjectId,
      createdBy: actorId,
      changelog: initialChangelog(actorId),
    });
    return ok(toClient(piece.toObject()));
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[POST /api/content/pieces]', e);
    return err('خطأ في الخادم', 500);
  }
}

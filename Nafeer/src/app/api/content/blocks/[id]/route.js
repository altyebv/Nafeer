import { requireContributor, ok, err } from '@/lib/api/guard';
import { deleteBlock, upsertBlock } from '@/lib/api/content';
import { connectDB } from '@/lib/db';
import { Block } from '@/lib/models/Block';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';

// Returns null if the URL doesn't match the Supabase media bucket.
function deriveMediaPath(url) {
  if (!url || typeof url !== 'string') return null;
  const base   = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const bucket = process.env.SUPABASE_MEDIA_BUCKET || 'basheer-media';
  if (!base) return null;
  const prefix = `${base}/storage/v1/object/public/${bucket}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}

const IMAGE_BLOCK_TYPES = new Set(['IMAGE', 'GIF']);

// ── PATCH /api/content/blocks/[id] ───────────────────────────────────────────
export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const user = await requireContributor();
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;

    const { id } = await params;
    const update  = await request.json();

    const block = await Block.findOne({ contentId: id });
    if (!block) return err('البلوك غير موجود', 404);

    const resolvedType = update.type ?? block.type;

    // Derive mediaPath whenever content is written on an IMAGE/GIF block
    if (IMAGE_BLOCK_TYPES.has(resolvedType) && update.content !== undefined) {
      update.mediaPath = deriveMediaPath(update.content);
    }

    const saved = await upsertBlock(
      {
        ...block.toObject(),
        ...update,
        contentId: block.contentId,
        subjectId: update.subjectId || block.subjectId,
        sectionContentId: update.sectionContentId || update.sectionId || block.sectionContentId,
        order: update.order ?? block.order,
        type: resolvedType,
      },
      actorId
    );

    return ok({ id: saved.contentId, mediaPath: saved.mediaPath ?? null });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PATCH /api/content/blocks/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// ── DELETE /api/content/blocks/[id] ──────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    await requireContributor();
    await deleteBlock((await params).id);
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/blocks/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

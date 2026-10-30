import { requireContentAccess, assertInSubject, ok, err } from '@/lib/api/guard';
import { deleteBlock, upsertBlock } from '@/lib/api/content';
import { VersionConflict } from '@/lib/api/versionCheck';
import { connectDB } from '@/lib/db';
import { Block } from '@/lib/models/Block';
import { Section } from '@/lib/models/Section';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { assertCanEditLessons, lessonsForBlocks } from '@/lib/lessonAccess';

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
    const { user } = await requireContentAccess(Block, (await params).id, { write: true });
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;

    const { id } = await params;
    const update  = await request.json();
    // The lesson it is in now, and the one it may be moving to.
    await assertCanEditLessons(user, await lessonsForBlocks([id], [update?.sectionContentId, update?.sectionId]));

    const block = await Block.findOne({ contentId: id });
    if (!block) return err('البلوك غير موجود', 404);

    // A block stays in its subject, and may only move to a section of it.
    if (user.role !== 'admin') {
      delete update.subjectId;
      await assertInSubject(user, Section, [update.sectionContentId, update.sectionId]);
    }

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
      actorId,
      user.name || ''
    );

    return ok({ id: saved.contentId, mediaPath: saved.mediaPath ?? null });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof VersionConflict) return Response.json({ ok: false, conflict: e.toJSON() }, { status: 409 });
    console.error('[PATCH /api/content/blocks/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

// ── DELETE /api/content/blocks/[id] ──────────────────────────────────────────
export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { user } = await requireContentAccess(Block, (await params).id, { write: true });
    const actorId = user.role === 'admin'
      ? await ensureSystemSeedContributor()
      : user.id;
    await assertCanEditLessons(user, await lessonsForBlocks([(await params).id]));
    await deleteBlock((await params).id, { byId: actorId, byName: user.name || '' });
    return ok({ deleted: (await params).id });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[DELETE /api/content/blocks/[id]]', e);
    return err('خطأ في الخادم', 500);
  }
}

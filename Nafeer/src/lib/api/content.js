import { connectDB } from '@/lib/db';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function upsertSection(data, contributorId) {
  await connectDB();

  const existing = await Section.findOne({ contentId: data.contentId });

  if (existing) {
    const updates = applyVersionBump(
      {
        title:        data.title,
        order:        data.order,
        learningType: data.learningType,
        conceptIds:   data.conceptIds || [],
      },
      existing,
      contributorId,
      'edited'
    );
    return Section.findOneAndUpdate(
      { contentId: data.contentId },
      { $set: updates },
      { new: true }
    ).lean();
  }

  return Section.create({
    contentId:       data.contentId,
    subjectId:       data.subjectId,
    lessonContentId: data.lessonContentId,
    title:           data.title,
    order:           data.order,
    learningType:    data.learningType || 'UNDERSTANDING',
    conceptIds:      data.conceptIds  || [],
    createdBy:       contributorId,
    changelog:       initialChangelog(contributorId),
  });
}

// Batch upsert — called when contributor saves a lesson
export async function batchUpsertSections(sections, contributorId) {
  await connectDB();
  return Promise.all(sections.map((s) => upsertSection(s, contributorId)));
}

export async function deleteSection(contentId) {
  await connectDB();
  return Section.deleteOne({ contentId });
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

export async function upsertBlock(data, contributorId) {
  await connectDB();

  const existing = await Block.findOne({ contentId: data.contentId });

  if (existing) {
    const updates = applyVersionBump(
      {
        type:       data.type,
        content:    data.content,
        order:      data.order,
        conceptRef: data.conceptRef || null,
        caption:    data.caption    || null,
        metadata:   data.metadata   || null,
      },
      existing,
      contributorId,
      'edited'
    );
    return Block.findOneAndUpdate(
      { contentId: data.contentId },
      { $set: updates },
      { new: true }
    ).lean();
  }

  return Block.create({
    contentId:        data.contentId,
    subjectId:        data.subjectId,
    sectionContentId: data.sectionContentId,
    type:             data.type,
    content:          data.content    || '',
    order:            data.order,
    conceptRef:       data.conceptRef || null,
    caption:          data.caption    || null,
    metadata:         data.metadata   || null,
    createdBy:        contributorId,
    changelog:        initialChangelog(contributorId),
  });
}

// Batch upsert — all blocks for a lesson in one call
export async function batchUpsertBlocks(blocks, contributorId) {
  await connectDB();
  return Promise.all(blocks.map((b) => upsertBlock(b, contributorId)));
}

export async function deleteBlock(contentId) {
  await connectDB();
  return Block.deleteOne({ contentId });
}

// Delete all sections + blocks for a lesson (cascade on lesson delete)
export async function deleteLessonContent(lessonContentId) {
  await connectDB();
  const sections = await Section.find({ lessonContentId }).select('contentId').lean();
  const sectionIds = sections.map((s) => s.contentId);

  await Promise.all([
    Section.deleteMany({ lessonContentId }),
    sectionIds.length ? Block.deleteMany({ sectionContentId: { $in: sectionIds } }) : null,
  ]);
}

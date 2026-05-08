import { connectDB } from '@/lib/db';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { Question } from '@/lib/models/Question';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';

// ─── Sections ─────────────────────────────────────────────────────────────────

export async function upsertSection(data, contributorId) {
  await connectDB();

  const existing = await Section.findOne({ contentId: data.contentId });

  if (existing) {
    const { updates } = applyVersionBump(
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

  const normalized = normalizeBlockInput(data);
  const existing = await Block.findOne({ contentId: normalized.contentId });

  if (existing) {
    const existingWasCheckpoint = existing.type === 'QUESTION';
    const nextType = normalized.type ?? existing.type;
    const { updates } = applyVersionBump(
      {
        subjectId:        normalized.subjectId        || existing.subjectId,
        sectionContentId: normalized.sectionContentId || existing.sectionContentId,
        type:             nextType,
        content:          normalized.content,
        order:            normalized.order,
        conceptRef:       normalized.conceptRef || null,
        caption:          normalized.caption    || null,
        mediaPath:        normalized.mediaPath  || null,
        metadata:         normalized.metadata   || null,
      },
      existing,
      contributorId,
      'edited'
    );
    const block = await Block.findOneAndUpdate(
      { contentId: normalized.contentId },
      { $set: updates },
      { new: true }
    ).lean();
    if (existingWasCheckpoint && nextType !== 'QUESTION') {
      await deleteCheckpointQuestionForBlock(existing);
    }
    await syncCheckpointQuestionForBlock(block, contributorId);
    return block;
  }

  const block = await Block.create({
    contentId:        normalized.contentId,
    subjectId:        normalized.subjectId,
    sectionContentId: normalized.sectionContentId,
    type:             normalized.type,
    content:          normalized.content    || '',
    order:            normalized.order,
    conceptRef:       normalized.conceptRef || null,
    caption:          normalized.caption    || null,
    mediaPath:        normalized.mediaPath  || null,
    metadata:         normalized.metadata   || null,
    createdBy:        contributorId,
    changelog:        initialChangelog(contributorId),
  });
  await syncCheckpointQuestionForBlock(block.toObject(), contributorId);
  return block;
}

// Batch upsert — all blocks for a lesson in one call
export async function batchUpsertBlocks(blocks, contributorId) {
  await connectDB();
  return Promise.all(blocks.map((b) => upsertBlock(b, contributorId)));
}

export async function deleteBlock(contentId) {
  await connectDB();
  const block = await Block.findOne({ contentId }).lean();
  if (block?.type === 'QUESTION') {
    await deleteCheckpointQuestionForBlock(block);
  }
  return Block.deleteOne({ contentId });
}

export async function deleteCheckpointQuestionsForSections(sectionIds) {
  await connectDB();
  if (!Array.isArray(sectionIds) || sectionIds.length === 0) return { deletedCount: 0 };
  return Question.deleteMany({ sectionContentId: { $in: sectionIds }, isCheckpoint: true });
}

// Delete all sections + blocks for a lesson (cascade on lesson delete)
export async function deleteLessonContent(lessonContentId) {
  await connectDB();
  const sections = await Section.find({ lessonContentId }).select('contentId').lean();
  const sectionIds = sections.map((s) => s.contentId);

  await Promise.all([
    Section.deleteMany({ lessonContentId }),
    deleteCheckpointQuestionsForSections(sectionIds),
    sectionIds.length ? Block.deleteMany({ sectionContentId: { $in: sectionIds } }) : null,
  ]);
}

async function syncCheckpointQuestionForBlock(block, contributorId) {
  if (block.type !== 'QUESTION') return null;

  const payload = getCheckpointPayload(block);
  const textAr = payload.textAr || payload.questionText || payload.text || block.content;
  const correctAnswer = payload.correctAnswer ?? payload.answer;

  if (!block.subjectId || !block.sectionContentId || isBlank(textAr) || isBlank(correctAnswer)) {
    return null;
  }

  const section = await Section.findOne({ contentId: block.sectionContentId })
    .select('lessonContentId conceptIds')
    .lean();

  const contentId = payload.questionId || payload.contentId || payload.id || checkpointQuestionId(block.contentId);
  const updates = {
    contentId,
    subjectId: block.subjectId,
    type: payload.type || 'MCQ',
    textAr,
    textEn: payload.textEn || null,
    correctAnswer,
    options: payload.options || null,
    explanation: payload.explanation || null,
    imageUrl: payload.imageUrl || null,
    tableData: payload.tableData || null,
    difficulty: payload.difficulty || 1,
    points: payload.points || 1,
    estimatedSeconds: payload.estimatedSeconds || 60,
    cognitiveLevel: payload.cognitiveLevel || 'RECALL',
    source: payload.source || 'ORIGINAL',
    sourceExamContentId: payload.sourceExamContentId || payload.sourceExamId || null,
    sourceDetails: payload.sourceDetails || null,
    sourceYear: payload.sourceYear || null,
    feedEligible: false,
    unitContentId: payload.unitContentId || payload.unitId || null,
    lessonContentId: payload.lessonContentId || payload.lessonId || section?.lessonContentId || null,
    sectionContentId: block.sectionContentId,
    isCheckpoint: true,
    conceptIds: payload.conceptIds || section?.conceptIds || [],
    markers: payload.markers || [],
  };

  const existing = await Question.findOne({ contentId });
  if (existing) {
    const { updates: bumpedUpdates } = applyVersionBump(
      updates,
      existing,
      contributorId,
      'edited',
      'Synced from checkpoint block',
      '',
      false
    );
    return Question.findOneAndUpdate(
      { contentId },
      { $set: bumpedUpdates },
      { new: true, runValidators: true }
    ).lean();
  }

  return Question.create({
    ...updates,
    status: block.status || 'draft',
    createdBy: contributorId,
    changelog: initialChangelog(contributorId),
  });
}

async function deleteCheckpointQuestionForBlock(block) {
  const payload = getCheckpointPayload(block);
  const questionId = payload.questionId || payload.contentId || payload.id || checkpointQuestionId(block.contentId);
  return Question.deleteOne({ contentId: questionId, isCheckpoint: true });
}

function getCheckpointPayload(block) {
  const metadata = block.metadata && typeof block.metadata === 'object' ? block.metadata : {};
  const parsedContent = parseMaybeJson(block.content);
  const contentObject = parsedContent && typeof parsedContent === 'object' ? parsedContent : {};
  return {
    ...contentObject,
    ...metadata,
    ...(contentObject.question || {}),
    ...(metadata.question || {}),
    ...(metadata.checkpoint || {}),
  };
}

function parseMaybeJson(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function checkpointQuestionId(blockId) {
  return `q_${blockId}`;
}

function normalizeBlockInput(data) {
  return {
    ...data,
    sectionContentId: data.sectionContentId || data.sectionId,
  };
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

import { connectDB } from '@/lib/db';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { Question } from '@/lib/models/Question';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';
import { recountAuthoredLater } from '@/lib/authoredStats';
import { VersionConflict, hasBaseVersion, updateAtVersion, settleBatch } from '@/lib/api/versionCheck';
import { writeItemHistory } from '@/lib/api/contentHistory';

const SECTION_HISTORY_FIELDS = [
  'title', 'order', 'learningType', 'kind', 'conceptIds', 'partIndex',
];
const BLOCK_HISTORY_FIELDS = [
  'sectionContentId', 'type', 'content', 'order', 'conceptRef', 'caption', 'mediaPath', 'metadata',
];

const plain = (doc) => (doc?.toObject ? doc.toObject() : doc);

// ─── Sections ─────────────────────────────────────────────────────────────────
// `data.baseVersion` — the version the editor loaded. When present, the write
// is refused with a VersionConflict if the section changed or was deleted
// since. See lib/api/versionCheck.js.

export async function upsertSection(data, contributorId, byName = '') {
  await connectDB();

  const existing = await Section.findOne({ contentId: data.contentId });

  if (existing || hasBaseVersion(data.baseVersion)) {
    if (!existing) throw new VersionConflict(data.contentId, null);
    const before = plain(existing);
    const { updates } = applyVersionBump(
      {
        title:        data.title,
        order:        data.order,
        learningType: data.learningType,
        kind:         data.kind || 'GENERAL',
        conceptIds:   data.conceptIds || [],
        partIndex:    data.partIndex ?? 0,
      },
      existing,
      contributorId,
      'edited'
    );
    const saved = await updateAtVersion(Section, data.contentId, data.baseVersion, existing, { $set: updates });
    await writeItemHistory({
      lessonContentId: existing.lessonContentId,
      entityType: 'section',
      entityContentId: data.contentId,
      entityLabel: saved.title,
      version: saved.version,
      action: 'edited',
      byId: contributorId,
      byName,
      before,
      after: plain(saved),
      fields: SECTION_HISTORY_FIELDS,
    });
    return saved;
  }

  const created = await Section.create({
    contentId:       data.contentId,
    subjectId:       data.subjectId,
    lessonContentId: data.lessonContentId,
    title:           data.title,
    order:           data.order,
    learningType:    data.learningType || 'UNDERSTANDING', kind: data.kind || 'GENERAL',
    conceptIds:      data.conceptIds  || [],
    partIndex:       data.partIndex   ?? 0,
    createdBy:       contributorId,
    changelog:       initialChangelog(contributorId),
  });
  await writeItemHistory({
    lessonContentId: data.lessonContentId,
    entityType: 'section',
    entityContentId: data.contentId,
    entityLabel: data.title,
    version: created.version || 1,
    action: 'created',
    byId: contributorId,
    byName,
    after: plain(created),
    fields: SECTION_HISTORY_FIELDS,
  });
  return created;
}

// Batch upsert — called when contributor saves a lesson.
// Returns { saved, conflicts }; one stale section never blocks the rest.
export async function batchUpsertSections(sections, contributorId, byName = '') {
  await connectDB();
  return settleBatch(sections, (s) => upsertSection(s, contributorId, byName));
}

export async function deleteSection(contentId, { byId = null, byName = '' } = {}) {
  await connectDB();
  const section = await Section.findOne({ contentId }).lean();
  if (!section) return Section.deleteOne({ contentId });

  const blocks = await Block.find({ sectionContentId: contentId }).lean();
  const deletedBlocks = await Block.deleteMany({ sectionContentId: contentId });
  const deletedSection = await Section.deleteOne({ contentId });
  if (deletedSection.deletedCount) {
    if (deletedBlocks.deletedCount === blocks.length) {
      for (const block of blocks) {
        await writeItemHistory({
          lessonContentId: section.lessonContentId,
          entityType: 'block',
          entityContentId: block.contentId,
          entityLabel: block.type,
          version: (block.version || 1) + 1,
          action: 'deleted',
          byId,
          byName,
          before: plain(block),
          fields: BLOCK_HISTORY_FIELDS,
        });
      }
    } else {
      console.warn(
        `[LessonHistory] skipped section block snapshots for ${contentId}: ` +
        `expected ${blocks.length}, deleted ${deletedBlocks.deletedCount}`
      );
    }
    await writeItemHistory({
      lessonContentId: section.lessonContentId,
      entityType: 'section',
      entityContentId: section.contentId,
      entityLabel: section.title,
      version: (section.version || 1) + 1,
      action: 'deleted',
      byId,
      byName,
      before: plain(section),
      fields: SECTION_HISTORY_FIELDS,
    });
  }
  return deletedSection;
}

// ─── Blocks ───────────────────────────────────────────────────────────────────

export async function upsertBlock(data, contributorId, byName = '', context = {}) {
  await connectDB();

  const normalized = normalizeBlockInput(data);
  const existing = Object.hasOwn(context, 'existing')
    ? context.existing
    : await Block.findOne({ contentId: normalized.contentId });
  const resolveHistoryContext = async (sectionContentId) => {
    const section = context.sections?.get(sectionContentId)
      || await Section.findOne({ contentId: sectionContentId }).select('lessonContentId title').lean();
    return {
      lessonContentId: section?.lessonContentId || context.lessonContentId,
    };
  };

  if (existing || hasBaseVersion(normalized.baseVersion)) {
    // A block the editor had loaded is gone: someone deleted it. Recreating
    // it here is how deleted blocks used to come back.
    if (!existing) throw new VersionConflict(normalized.contentId, null);
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
    const block = await updateAtVersion(
      Block, normalized.contentId, normalized.baseVersion, existing, { $set: updates }
    );
    if (existingWasCheckpoint && nextType !== 'QUESTION') {
      await deleteCheckpointQuestionForBlock(existing);
    }
    await syncCheckpointQuestionForBlock(block, contributorId);
    const historyContext = await resolveHistoryContext(block.sectionContentId);
    await writeItemHistory({
      lessonContentId: historyContext.lessonContentId,
      entityType: 'block',
      entityContentId: block.contentId,
      entityLabel: block.type,
      version: block.version,
      action: 'edited',
      byId: contributorId,
      byName,
      before: plain(existing),
      after: plain(block),
      fields: BLOCK_HISTORY_FIELDS,
    });
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
  const historyContext = await resolveHistoryContext(block.sectionContentId);
  await writeItemHistory({
    lessonContentId: historyContext.lessonContentId,
    entityType: 'block',
    entityContentId: block.contentId,
    entityLabel: block.type,
    version: block.version || 1,
    action: 'created',
    byId: contributorId,
    byName,
    after: plain(block),
    fields: BLOCK_HISTORY_FIELDS,
  });
  return block;
}

// Batch upsert — all changed blocks for a lesson in one call.
// Returns { saved, conflicts }.
export async function batchUpsertBlocks(blocks, contributorId, byName = '') {
  await connectDB();
  const ids = [...new Set(blocks.map((b) => b?.contentId).filter(Boolean))];
  const sectionIds = [...new Set(blocks.map((b) => b?.sectionContentId || b?.sectionId).filter(Boolean))];
  const [existingBlocks, sections] = await Promise.all([
    ids.length ? Block.find({ contentId: { $in: ids } }).lean() : [],
    sectionIds.length
      ? Section.find({ contentId: { $in: sectionIds } }).select('contentId lessonContentId title').lean()
      : [],
  ]);
  const existingById = new Map(existingBlocks.map((b) => [b.contentId, b]));
  const sectionsById = new Map(sections.map((s) => [s.contentId, s]));
  return settleBatch(blocks, (b) => upsertBlock(b, contributorId, byName, {
    existing: existingById.get(b.contentId),
    sections: sectionsById,
  }));
}

export async function deleteBlock(contentId, { byId = null, byName = '' } = {}) {
  await connectDB();
  const block = await Block.findOne({ contentId }).lean();
  let lessonContentId = null;
  if (block) {
    const section = await Section.findOne({ contentId: block.sectionContentId })
      .select('lessonContentId')
      .lean();
    lessonContentId = section?.lessonContentId;
  }
  if (block?.type === 'QUESTION') {
    await deleteCheckpointQuestionForBlock(block);
  }
  const result = await Block.deleteOne({ contentId });
  if (result.deletedCount && block) {
    await writeItemHistory({
      lessonContentId,
      entityType: 'block',
      entityContentId: block.contentId,
      entityLabel: block.type,
      version: (block.version || 1) + 1,
      action: 'deleted',
      byId,
      byName,
      before: plain(block),
      fields: BLOCK_HISTORY_FIELDS,
    });
    recountAuthoredLater([block.createdBy]);
  }
  return result;
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
    mistakeNote: payload.mistakeNote || null,
    optionNotes: payload.optionNotes || [],
    acceptedAnswers: payload.acceptedAnswers || [],
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

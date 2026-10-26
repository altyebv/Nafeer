import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { getManifest } from '@/lib/FirebaseAdmin';
import { Subject } from '@/lib/models/Subject';
import { Unit } from '@/lib/models/Unit';
import { Lesson } from '@/lib/models/Lesson';
import { Section } from '@/lib/models/Section';
import { Block } from '@/lib/models/Block';
import { Concept } from '@/lib/models/Concept';
import { Tag } from '@/lib/models/Tag';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';
import { Exam } from '@/lib/models/Exam';
import { initialChangelog } from '@/lib/models/versioning';
import { ensureSystemSeedContributor } from '@/lib/SeedActor';
import { deleteSubjectContent, writtenContent } from '@/lib/subjectContent';

// ─── Restore a subject from its published file ────────────────────────────────
// Replaces a subject's content with the last version published to the app
// (docs/subject-lifecycle.md S4). Three rules:
//
//  1. All or nothing. The delete and the inserts run in one transaction; if
//     anything fails, the subject is left as it was. It used to delete first
//     and import second, so a failed download or insert left it empty.
//  2. Authorship survives. A document that exists before and after keeps its
//     createdBy — and a lesson its ownerId and credits, a unit its lesson
//     target. It used to make the admin the author of everything.
//  3. Nothing is lost silently. unpublishedWork lists what the restore would
//     throw away, and the route refuses until the owner has seen it.

const MODELS = { Subject, Unit, Lesson, Section, Block, Concept, Tag, FeedItem, Question, Exam };

// Insert order inside the transaction: parents before children.
const INSERT_ORDER = ['Subject', 'Unit', 'Lesson', 'Section', 'Block', 'Concept', 'Tag', 'FeedItem', 'Question', 'Exam'];

// What a document keeps from its database copy, per model.
const CARRIED = {
  Lesson: ['createdBy', 'ownerId', 'credits'],
  Unit:   ['createdBy', 'targetLessons'],
};
const carriedFields = (name) => CARRIED[name] || ['createdBy'];

/** Reads the manifest and downloads the subject's published file. */
export async function fetchPublishedSubject(subjectId) {
  const manifest = await getManifest().catch(() => null);
  const entry = (manifest?.subjects || []).find((s) => s.id === subjectId) || null;
  const url = entry?.legacyDownloadUrl || entry?.downloadUrl;
  if (!url) return { error: 'لا يوجد ملف منشور لهذه المادة', status: 404 };

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { error: 'تعذر تنزيل ملف المادة المنشورة', status: 502 };
  const data = await res.json().catch(() => null);
  if (!data?.subject?.id) return { error: 'فشل تحميل بيانات المادة المنشورة', status: 422 };

  return { data, publishedAt: toDate(entry.updatedAt) };
}

function toDate(value) {
  const d = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

/** The contentIds in a published file, per model. */
export function publishedIds(data) {
  const ids = Object.fromEntries(INSERT_ORDER.map((n) => [n, new Set()]));
  for (const unit of data.units || []) {
    ids.Unit.add(unit.id);
    for (const lesson of unit.lessons || []) {
      ids.Lesson.add(lesson.id);
      for (const section of lesson.sections || []) {
        ids.Section.add(section.id);
        for (const block of section.blocks || []) ids.Block.add(block.id);
      }
    }
  }
  for (const [name, key] of [['Concept', 'concepts'], ['Tag', 'tags'], ['FeedItem', 'feedItems'], ['Question', 'questions'], ['Exam', 'exams']]) {
    for (const item of data[key] || []) ids[name].add(item.id);
  }
  return ids;
}

/**
 * What a restore would throw away: lessons people wrote in that the file does
 * not have (drafts, lessons in review — only approved lessons are published),
 * and lessons whose content changed after the publish. Changes to sections and
 * blocks count against their lesson. Other content is counted per model.
 * Empty scaffold lessons missing from the file are only counted.
 */
export async function unpublishedWork(subjectId, data, publishedAt) {
  await connectDB();
  const inFile = publishedIds(data);
  const after = (d) => publishedAt && d.updatedAt && d.updatedAt > publishedAt;

  const [lessons, sections, blocks, written, ...others] = await Promise.all([
    Lesson.find({ subjectId }).select('contentId title updatedAt').lean(),
    Section.find({ subjectId }).select('contentId lessonContentId updatedAt').lean(),
    Block.find({ subjectId }).select('contentId sectionContentId updatedAt').lean(),
    writtenContent(subjectId),
    ...['Unit', 'Concept', 'Tag', 'FeedItem', 'Question', 'Exam'].map((n) =>
      MODELS[n].find({ subjectId }).select('contentId updatedAt').lean()),
  ]);

  const lessonOfSection = new Map(sections.map((s) => [s.contentId, s.lessonContentId]));
  const touched = new Set();
  for (const s of sections) if (!inFile.Section.has(s.contentId) || after(s)) touched.add(s.lessonContentId);
  for (const b of blocks) if (!inFile.Block.has(b.contentId) || after(b)) touched.add(lessonOfSection.get(b.sectionContentId));

  const lost = [];
  let emptyLessons = 0;
  for (const l of lessons) {
    const published = inFile.Lesson.has(l.contentId);
    if (!published && !written.lessons.has(l.contentId)) { emptyLessons += 1; continue; }
    if (!published) lost.push({ id: l.contentId, title: l.title, why: 'unpublished' });
    else if (after(l) || touched.has(l.contentId)) lost.push({ id: l.contentId, title: l.title, why: 'edited' });
  }

  const other = {};
  ['Unit', 'Concept', 'Tag', 'FeedItem', 'Question', 'Exam'].forEach((n, i) => {
    const count = others[i].filter((d) => !inFile[n].has(d.contentId) || after(d)).length;
    if (count) other[n] = count;
  });

  return {
    publishedAt: publishedAt?.toISOString() || null,
    lessons: lost,
    emptyLessons,
    other,
    total: lost.length + Object.values(other).reduce((a, b) => a + b, 0),
  };
}

/**
 * The documents of a published file, per model. New documents belong to the
 * system_seed account; `actorId` (the admin) is recorded as the reviewer and
 * in the changelog.
 */
export function buildRestoreDocs(data, { seedActor, actorId, now = new Date() }) {
  const subjectId = data.subject.id;
  const meta = (status) => ({
    subjectId,
    createdBy: seedActor,
    updatedBy: actorId,
    status: status || 'approved',
    reviewedBy: actorId,
    reviewedAt: now,
    changelog: initialChangelog(actorId, 'restored from the published file'),
  });
  const docs = Object.fromEntries(INSERT_ORDER.map((n) => [n, []]));

  docs.Subject.push({
    ...meta('approved'),
    nameAr: data.subject.nameAr || subjectId,
    nameEn: data.subject.nameEn || null,
    path: data.subject.path || 'REMOTE',
    isMajor: data.subject.isMajor || false,
    order: data.subject.order || 0,
    colorHex: data.subject.colorHex || null,
    mathNotation: ['ARABIC', 'LATIN'].includes(data.subject.mathNotation) ? data.subject.mathNotation : null,
    contributor: seedActor,
  });

  for (const unit of data.units || []) {
    docs.Unit.push({
      ...meta('approved'),
      contentId: unit.id,
      title: unit.title,
      order: unit.order,
      description: unit.description || null,
      bookId: unit.bookId || null,
      bookTitle: unit.bookTitle || null,
      bookOrder: unit.bookOrder || null,
    });

    for (const lesson of unit.lessons || []) {
      docs.Lesson.push({
        ...meta(lesson.status),
        contentId: lesson.id,
        unitContentId: unit.id,
        title: lesson.title,
        order: lesson.order,
        estimatedMinutes: lesson.estimatedMinutes || 15,
        summary: lesson.summary || null,
        metadata: lesson.metadata || null,
        parentLesson: lesson.parentLesson || null,
        variationType: lesson.variationType || null,
        variationNote: lesson.variationNote || null,
        groupId: lesson.groupId || null,
        groupTitle: lesson.groupTitle || null,
        groupMetadata: lesson.groupMetadata || null,
      });

      for (const section of lesson.sections || []) {
        docs.Section.push({
          ...meta(section.status),
          contentId: section.id,
          lessonContentId: lesson.id,
          title: section.title,
          order: section.order,
          learningType: section.learningType || 'UNDERSTANDING', kind: section.kind || 'GENERAL',
          partIndex: section.partIndex ?? 0,
          conceptIds: section.conceptIds || [],
        });

        for (const block of section.blocks || []) {
          docs.Block.push({
            ...meta(block.status),
            contentId: block.id,
            sectionContentId: section.id,
            type: block.type,
            content: block.content || '',
            order: block.order,
            conceptRef: block.conceptRef || null,
            caption: block.caption || null,
            metadata: block.metadata || null,
          });
        }
      }
    }
  }

  for (const concept of data.concepts || []) {
    docs.Concept.push({
      ...meta(concept.status),
      contentId: concept.id,
      type: concept.type,
      titleAr: concept.titleAr,
      titleEn: concept.titleEn || null,
      definition: concept.definition || '',
      shortDefinition: concept.shortDefinition || null,
      formula: concept.formula || null,
      imageUrl: concept.imageUrl || null,
      difficulty: concept.difficulty || 1,
      extraData: concept.extraData || null,
      tagIds: concept.tagIds || [],
    });
  }

  for (const tag of data.tags || []) {
    docs.Tag.push({ ...meta(tag.status), contentId: tag.id, nameAr: tag.nameAr, nameEn: tag.nameEn || null });
  }

  for (const item of data.feedItems || []) {
    docs.FeedItem.push({
      ...meta(item.status),
      contentId: item.id,
      conceptContentId: item.conceptId,
      lessonContentId: item.lessonId || null,
      type: item.type,
      contentAr: item.contentAr || '',
      contentEn: item.contentEn || null,
      back: item.back || null,
      imageUrl: item.imageUrl || null,
      interactionType: item.interactionType || null,
      correctAnswer: item.correctAnswer || null,
      options: item.options || null,
      explanation: item.explanation || null,
      questionContentId: item.questionId || null,
      priority: item.priority || 1,
      order: item.order || 0,
    });
  }

  for (const question of data.questions || []) {
    docs.Question.push({
      ...meta(question.status),
      contentId: question.id,
      type: question.type,
      textAr: question.textAr,
      textEn: question.textEn || null,
      correctAnswer: question.correctAnswer,
      options: question.options || null,
      explanation: question.explanation || null,
      mistakeNote: question.mistakeNote || null,
      optionNotes: question.optionNotes || [],
      acceptedAnswers: question.acceptedAnswers || [],
      imageUrl: question.imageUrl || null,
      tableData: question.tableData || null,
      difficulty: question.difficulty || 1,
      points: question.points || 1,
      estimatedSeconds: question.estimatedSeconds || 60,
      cognitiveLevel: question.cognitiveLevel || 'RECALL',
      source: question.source || 'ORIGINAL',
      sourceExamContentId: question.sourceExamId || null,
      sourceDetails: question.sourceDetails || null,
      sourceYear: question.sourceYear || null,
      feedEligible: question.feedEligible || false,
      unitContentId: question.unitId || null,
      lessonContentId: question.lessonId || null,
      sectionContentId: question.sectionId || null,
      isCheckpoint: question.isCheckpoint || false,
      conceptIds: question.conceptIds || [],
      markers: question.markers || [],
    });
  }

  for (const exam of data.exams || []) {
    docs.Exam.push({
      ...meta(exam.status),
      contentId: exam.id,
      titleAr: exam.titleAr,
      titleEn: exam.titleEn || null,
      source: exam.source || 'MINISTRY',
      year: exam.year || null,
      schoolName: exam.schoolName || null,
      duration: exam.duration || null,
      totalPoints: exam.totalPoints || null,
      description: exam.description || null,
      examType: exam.examType || null,
      questionContentIds: exam.questionIds || [],
      sectionsJson: exam.sectionsJson || null,
    });
  }

  return docs;
}

/**
 * Copies each document's carried fields from its database copy, matched by
 * contentId (the Subject by subjectId). `snapshot` is { Model: Map(id → doc) }.
 * Fields the database copy doesn't have are left as built.
 */
export function carryAuthorship(docs, snapshot) {
  for (const [name, list] of Object.entries(docs)) {
    const before = snapshot[name];
    if (!before?.size) continue;
    for (const doc of list) {
      const prev = before.get(name === 'Subject' ? doc.subjectId : doc.contentId);
      if (!prev) continue;
      for (const field of carriedFields(name)) {
        if (prev[field] !== undefined && prev[field] !== null) doc[field] = prev[field];
      }
    }
  }
  return docs;
}

async function readSnapshot(subjectId, session) {
  const snapshot = {};
  for (const name of INSERT_ORDER) {
    const key = name === 'Subject' ? 'subjectId' : 'contentId';
    const rows = await MODELS[name].find({ subjectId })
      .select([key, ...carriedFields(name)].join(' ')).session(session).lean();
    snapshot[name] = new Map(rows.map((r) => [r[key], r]));
  }
  return snapshot;
}

/**
 * Replaces the subject's content with the published file, in one transaction.
 * Returns the number of documents written per model.
 */
export async function restoreSubject(data, { actorId }) {
  await connectDB();
  const subjectId = data.subject.id;
  const seedActor = await ensureSystemSeedContributor();
  const actor = mongoose.isValidObjectId(actorId) ? actorId : seedActor;
  const docs = buildRestoreDocs(data, { seedActor, actorId: actor });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      carryAuthorship(docs, await readSnapshot(subjectId, session));
      await deleteSubjectContent(subjectId, { keepHistory: true, session });
      for (const name of INSERT_ORDER) {
        if (docs[name].length) await MODELS[name].insertMany(docs[name], { session, ordered: true });
      }
    });
  } finally {
    await session.endSession();
  }

  return Object.fromEntries(INSERT_ORDER.map((n) => [n, docs[n].length]));
}

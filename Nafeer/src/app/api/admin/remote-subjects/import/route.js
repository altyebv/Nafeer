import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';
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

export async function POST(request) {
  const admin = await verifyAdminToken();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  let subjectId;
  let force = false;
  try {
    ({ subjectId, force = false } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!subjectId) {
    return NextResponse.json({ ok: false, error: 'subjectId مطلوب' }, { status: 400 });
  }

  try {
    await connectDB();

    const manifest = await getManifest().catch(() => null);
    const manifestEntry = (manifest?.subjects || []).find((entry) => entry.id === subjectId) || null;
    const downloadUrl = manifestEntry?.legacyDownloadUrl || manifestEntry?.downloadUrl;
    if (!downloadUrl) {
     return NextResponse.json({ ok: false, error: 'لا يوجد ملف منشور لهذه المادة' }, { status: 404 });
    }
    const remoteData = await loadRemoteSubjectExport(downloadUrl);
    if (!remoteData?.subject?.id) {
      return NextResponse.json({ ok: false, error: 'فشل تحميل بيانات المادة المنشورة' }, { status: 422 });
    }

    const existingCounts = await getExistingCounts(subjectId);
    const hasExistingContent = Object.values(existingCounts).some((count) => count > 0);
    if (hasExistingContent && !force) {
      return NextResponse.json({
        ok: false,
        error: 'المادة موجودة محلياً بالفعل. استخدم force للاستبدال.',
        existing: existingCounts,
      }, { status: 409 });
    }

    const actorId = mongoose.isValidObjectId(admin.id)
      ? new mongoose.Types.ObjectId(admin.id)
      : new mongoose.Types.ObjectId('000000000000000000000002');

    await wipeSubject(subjectId);
    const result = await importRemoteSubject(remoteData, actorId);

    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error('[POST /api/admin/remote-subjects/import]', e);
    return NextResponse.json({ ok: false, error: e.message || 'خطأ في الخادم' }, { status: 500 });
  }
}

async function loadRemoteSubjectExport(downloadUrl) {
  const res = await fetch(downloadUrl, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('تعذر تنزيل ملف المادة المنشورة');
  }
  return res.json();
}

async function getExistingCounts(subjectId) {
  const [subjects, units, lessons, sections, blocks, concepts, tags, feedItems, questions, exams] = await Promise.all([
    Subject.countDocuments({ subjectId }),
    Unit.countDocuments({ subjectId }),
    Lesson.countDocuments({ subjectId }),
    Section.countDocuments({ subjectId }),
    Block.countDocuments({ subjectId }),
    Concept.countDocuments({ subjectId }),
    Tag.countDocuments({ subjectId }),
    FeedItem.countDocuments({ subjectId }),
    Question.countDocuments({ subjectId }),
    Exam.countDocuments({ subjectId }),
  ]);

  return { subjects, units, lessons, sections, blocks, concepts, tags, feedItems, questions, exams };
}

async function wipeSubject(subjectId) {
  await Promise.all([
    Block.deleteMany({ subjectId }),
    Section.deleteMany({ subjectId }),
    Lesson.deleteMany({ subjectId }),
    Unit.deleteMany({ subjectId }),
    Concept.deleteMany({ subjectId }),
    Tag.deleteMany({ subjectId }),
    FeedItem.deleteMany({ subjectId }),
    Question.deleteMany({ subjectId }),
    Exam.deleteMany({ subjectId }),
    Subject.deleteMany({ subjectId }),
  ]);
}

async function importRemoteSubject(data, actorId) {
  const subjectId = data.subject.id;
  const importedAt = new Date();
  const changelog = initialChangelog(actorId, 'imported from remote manifest');

  await Subject.create({
    subjectId,
    nameAr: data.subject.nameAr || subjectId,
    nameEn: data.subject.nameEn || null,
    path: data.subject.path || 'REMOTE',
    isMajor: data.subject.isMajor || false,
    order: data.subject.order || 0,
    colorHex: data.subject.colorHex || null,
    contributor: actorId,
    createdBy: actorId,
    updatedBy: actorId,
    status: 'approved',
    reviewedBy: actorId,
    reviewedAt: importedAt,
    changelog,
  });

  const unitDocs = [];
  const lessonDocs = [];
  const sectionDocs = [];
  const blockDocs = [];

  for (const unit of data.units || []) {
    unitDocs.push({
      contentId: unit.id,
      subjectId,
      title: unit.title,
      order: unit.order,
      description: unit.description || null,
      bookId: unit.bookId || null,
      bookTitle: unit.bookTitle || null,
      bookOrder: unit.bookOrder || null,
      createdBy: actorId,
      updatedBy: actorId,
      status: 'approved',
      reviewedBy: actorId,
      reviewedAt: importedAt,
      changelog,
    });

    for (const lesson of unit.lessons || []) {
      lessonDocs.push({
        contentId: lesson.id,
        subjectId,
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
        createdBy: actorId,
        updatedBy: actorId,
        status: lesson.status || 'approved',
        reviewedBy: actorId,
        reviewedAt: importedAt,
        changelog,
      });

      for (const section of lesson.sections || []) {
        sectionDocs.push({
          contentId: section.id,
          subjectId,
          lessonContentId: lesson.id,
          title: section.title,
          order: section.order,
          learningType: section.learningType || 'UNDERSTANDING',
          partIndex: section.partIndex ?? 0,
          conceptIds: section.conceptIds || [],
          createdBy: actorId,
          updatedBy: actorId,
          status: section.status || 'approved',
          reviewedBy: actorId,
          reviewedAt: importedAt,
          changelog,
        });

        for (const block of section.blocks || []) {
          blockDocs.push({
            contentId: block.id,
            subjectId,
            sectionContentId: section.id,
            type: block.type,
            content: block.content || '',
            order: block.order,
            conceptRef: block.conceptRef || null,
            caption: block.caption || null,
            metadata: block.metadata || null,
            createdBy: actorId,
            updatedBy: actorId,
            status: block.status || 'approved',
            reviewedBy: actorId,
            reviewedAt: importedAt,
            changelog,
          });
        }
      }
    }
  }

  const conceptDocs = (data.concepts || []).map((concept) => ({
    contentId: concept.id,
    subjectId,
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
    createdBy: actorId,
    updatedBy: actorId,
    status: concept.status || 'approved',
    reviewedBy: actorId,
    reviewedAt: importedAt,
    changelog,
  }));

  const tagDocs = (data.tags || []).map((tag) => ({
    contentId: tag.id,
    subjectId,
    nameAr: tag.nameAr,
    nameEn: tag.nameEn || null,
    createdBy: actorId,
    updatedBy: actorId,
    status: tag.status || 'approved',
    reviewedBy: actorId,
    reviewedAt: importedAt,
    changelog,
  }));

  const feedDocs = (data.feedItems || []).map((item) => ({
    contentId: item.id,
    subjectId,
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
    createdBy: actorId,
    updatedBy: actorId,
    status: item.status || 'approved',
    reviewedBy: actorId,
    reviewedAt: importedAt,
    changelog,
  }));

  const questionDocs = (data.questions || []).map((question) => ({
    contentId: question.id,
    subjectId,
    type: question.type,
    textAr: question.textAr,
    textEn: question.textEn || null,
    correctAnswer: question.correctAnswer,
    options: question.options || null,
    explanation: question.explanation || null,
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
    createdBy: actorId,
    updatedBy: actorId,
    status: question.status || 'approved',
    reviewedBy: actorId,
    reviewedAt: importedAt,
    changelog,
  }));

  const examDocs = (data.exams || []).map((exam) => ({
    contentId: exam.id,
    subjectId,
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
    createdBy: actorId,
    updatedBy: actorId,
    status: exam.status || 'approved',
    reviewedBy: actorId,
    reviewedAt: importedAt,
    changelog,
  }));

  await Promise.all([
    unitDocs.length ? Unit.insertMany(unitDocs, { ordered: true }) : Promise.resolve(),
    lessonDocs.length ? Lesson.insertMany(lessonDocs, { ordered: true }) : Promise.resolve(),
    sectionDocs.length ? Section.insertMany(sectionDocs, { ordered: true }) : Promise.resolve(),
    blockDocs.length ? Block.insertMany(blockDocs, { ordered: true }) : Promise.resolve(),
    conceptDocs.length ? Concept.insertMany(conceptDocs, { ordered: true }) : Promise.resolve(),
    tagDocs.length ? Tag.insertMany(tagDocs, { ordered: true }) : Promise.resolve(),
    feedDocs.length ? FeedItem.insertMany(feedDocs, { ordered: true }) : Promise.resolve(),
    questionDocs.length ? Question.insertMany(questionDocs, { ordered: true }) : Promise.resolve(),
    examDocs.length ? Exam.insertMany(examDocs, { ordered: true }) : Promise.resolve(),
  ]);

  return {
    subjectId,
    importedAt: importedAt.toISOString(),
    stats: {
      units: unitDocs.length,
      lessons: lessonDocs.length,
      sections: sectionDocs.length,
      blocks: blockDocs.length,
      concepts: conceptDocs.length,
      tags: tagDocs.length,
      feedItems: feedDocs.length,
      questions: questionDocs.length,
      exams: examDocs.length,
    },
  };
}

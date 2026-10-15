import { connectDB } from '@/lib/db';
import { Lesson }   from '@/lib/models/Lesson';
import { Concept }  from '@/lib/models/Concept';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';
import { Section }  from '@/lib/models/Section';
import { Block }    from '@/lib/models/Block';
import { trackStat } from '@/lib/trackStat';
import { ReviewError, validateReturnComments } from '@/lib/review';

// ─── getReviewQueue ───────────────────────────────────────────────────────────
// Returns all content items with status='review', optionally filtered by subjectId.
// Used by the admin dashboard review tab.
//
export async function getReviewQueue(subjectId = null) {
  await connectDB();

  const filter = { status: 'review' };
  if (subjectId) filter.subjectId = subjectId;

  const [lessons, concepts, feedItems, questions] = await Promise.all([
    Lesson.find(filter)
      .select('contentId subjectId title unitContentId status version createdAt reviewState')
      .sort({ createdAt: -1 }).lean(),
    Concept.find(filter)
      .select('contentId subjectId titleAr type status version createdAt')
      .sort({ createdAt: -1 }).lean(),
    FeedItem.find(filter)
      .select('contentId subjectId type contentAr status version createdAt')
      .sort({ createdAt: -1 }).lean(),
    Question.find(filter)
      .select('contentId subjectId textAr type difficulty status version createdAt')
      .sort({ createdAt: -1 }).lean(),
  ]);

  return {
    lessons:   lessons.map((d)   => mapItem(d, 'lesson')),
    concepts:  concepts.map((d)  => mapItem(d, 'concept')),
    feedItems: feedItems.map((d) => mapItem(d, 'feedItem')),
    questions: questions.map((d) => mapItem(d, 'question')),
    total: lessons.length + concepts.length + feedItems.length + questions.length,
  };
}

function mapItem(doc, type) {
  return {
    _id:       doc._id,
    contentId: doc.contentId,
    subjectId: doc.subjectId,
    type,
    status:    doc.status,
    version:   doc.version,
    createdAt: doc.createdAt,
    label:     doc.title || doc.titleAr || doc.textAr || doc.contentAr || '—',
    itemType:  doc.type || null,       // content sub-type (MCQ, FLASH_CARD, etc.)
    difficulty: doc.difficulty || null,
    unitId:    doc.unitContentId || null,
    // Lessons only: which round this is — a resubmission after a return is
    // round 2+, so the reviewer knows to check the earlier comments.
    round:     doc.reviewState ? (doc.reviewState.round || 0) + 1 : null,
  };
}

// ─── returnLesson ─────────────────────────────────────────────────────────────
// Reviewer sends a lesson in review back to its author with comments, each
// anchored to where it applies (lib/review.js). One write:
//   status review → draft, version +1, reviewState { returned, round+1, … },
//   the comments pushed as review_feedback notes of that round.
// The update is conditional on the lesson still being in review at the version
// read, so two reviewers cannot both return it.
//
// @param reviewer { id, name } — the admin session
//
export async function returnLesson(contentId, { comments = [], summary = '' } = {}, reviewer) {
  await connectDB();

  const lesson = await Lesson.findOne({ contentId }).lean();
  if (!lesson) throw new ReviewError('الدرس غير موجود', 'NOT_FOUND');
  if (lesson.status !== 'review') throw new ReviewError('الدرس ليس بانتظار المراجعة', 'NOT_IN_REVIEW');

  // What the lesson owns — anchors may only point here.
  const sections = await Section.find({ lessonContentId: contentId }).select('contentId').lean();
  const sectionIds = sections.map((s) => s.contentId);
  const [blocks, questions, feedItems] = await Promise.all([
    sectionIds.length ? Block.find({ sectionContentId: { $in: sectionIds } }).select('contentId').lean() : [],
    Question.find({ lessonContentId: contentId }).select('contentId').lean(),
    FeedItem.find({ lessonContentId: contentId }).select('contentId').lean(),
  ]);
  const owned = {
    section:  new Set(sectionIds),
    block:    new Set(blocks.map((b) => b.contentId)),
    question: new Set(questions.map((q) => q.contentId)),
    feed:     new Set(feedItems.map((f) => f.contentId)),
  };

  const all = summary?.trim()
    ? [{ text: summary, anchor: { kind: 'lesson' } }, ...comments]
    : comments;
  const clean = validateReturnComments(all, owned);

  const now = new Date();
  const round = (lesson.reviewState?.round || 0) + 1;
  const reviewerName = reviewer?.name || 'المراجِع';
  const notes = clean.map((c) => ({
    text:       c.text,
    authorId:   null,              // admins have no Contributor _id
    authorName: reviewerName,
    authorRole: 'admin',
    noteType:   'review_feedback',
    resolved:   false,
    createdAt:  now,
    anchor:     c.anchor,
    round,
  }));

  const version = (lesson.version || 1) + 1;
  const entry = {
    version,
    action:    'edited',
    by:        reviewer?.id,
    note:      notes.length ? `أُعيد للمؤلف مع ${notes.length} ملاحظة` : 'أُعيد للمؤلف',
    timestamp: now,
  };

  const updated = await Lesson.findOneAndUpdate(
    { contentId, status: 'review', version: lesson.version },
    {
      $set: {
        status:      'draft',
        version,
        reviewedBy:  reviewer?.id,
        reviewedAt:  now,
        changelog:   [...(lesson.changelog || []).slice(-9), entry],
        reviewState: {
          returned:       true,
          round,
          returnedAt:     now,
          returnedByName: reviewerName,
          submittedAt:    lesson.reviewState?.submittedAt || null,
        },
      },
      $push: { notes: { $each: notes } },
      $inc:  { notesCount: notes.length },
    },
    { new: true },
  ).lean();

  if (!updated) throw new ReviewError('تغيّر الدرس أثناء المراجعة — حدّث الصفحة وحاول مجدداً', 'CONFLICT');
  return { contentId, status: 'draft', round, comments: notes.length };
}

// ─── approveOrReject ──────────────────────────────────────────────────────────
// Admin-only status transition: 'review' → 'approved' or 'review' → 'draft'
//
// @param contentId  - stable string content ID
// @param type       - 'lesson' | 'concept' | 'feedItem' | 'question'
// @param newStatus  - 'approved' | 'draft'
// @param adminObjId - MongoDB ObjectId string for the admin (for changelog)
// @param note       - optional note
//
export async function approveOrReject(contentId, type, newStatus, adminObjId, note = '') {
  await connectDB();

  const MODEL_MAP = { lesson: Lesson, concept: Concept, feedItem: FeedItem, question: Question };
  const Model = MODEL_MAP[type];
  if (!Model) throw new Error('نوع محتوى غير صالح');

  const doc = await Model.findOne({ contentId });
  if (!doc) throw new Error('المحتوى غير موجود');

  const newVersion = (doc.version || 1) + 1;
  const action = newStatus === 'approved' ? 'approved' : 'edited';
  const entry = {
    version:   newVersion,
    action,
    by:        adminObjId,
    note:      note || (newStatus === 'approved' ? 'اعتماد من لوحة التحكم' : 'إرجاع للمسودة'),
    timestamp: new Date(),
  };

  const existing = doc.changelog || [];
  await Model.updateOne({ contentId }, {
    $set: {
      status:     newStatus,
      version:    newVersion,
      reviewedBy: adminObjId,
      changelog:  [...existing.slice(-9), entry],
      // An approved lesson is no longer "returned", whatever happened before.
      ...(type === 'lesson' && newStatus === 'approved' && { 'reviewState.returned': false }),
    },
  });

  // Credit the original author, not the reviewing admin — a lesson shipping is
  // the author's effort paying off, and the only stat contributors see on their
  // own profile for "did this actually make it out the door".
  if (newStatus === 'approved' && type === 'lesson') {
    trackStat(doc.createdBy, 'publishedLessons');
  }

  return { contentId, status: newStatus };
}
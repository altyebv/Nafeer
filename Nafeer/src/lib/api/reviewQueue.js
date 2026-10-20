import { connectDB } from '@/lib/db';
import { Lesson }   from '@/lib/models/Lesson';
import { Concept }  from '@/lib/models/Concept';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';
import { Section }  from '@/lib/models/Section';
import { Block }    from '@/lib/models/Block';
import { Contributor } from '@/lib/models/Contributor';
import { trackStat } from '@/lib/trackStat';
import { ReviewError, validateReturnComments } from '@/lib/review';
import { getLessonWithContent } from '@/lib/api/lessons';
import { REAL_PEOPLE } from '@/lib/SeedActor';
import { SubjectGuide } from '@/lib/models/SubjectGuide';

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
      .select('contentId subjectId title unitContentId status version createdAt reviewState createdBy ownerId')
      .sort({ createdAt: -1 }).lean(),
    Concept.find(filter)
      .select('contentId subjectId titleAr type status version createdAt createdBy')
      .sort({ createdAt: -1 }).lean(),
    FeedItem.find(filter)
      .select('contentId subjectId type contentAr status version createdAt createdBy')
      .sort({ createdAt: -1 }).lean(),
    Question.find(filter)
      .select('contentId subjectId textAr type difficulty status version createdAt createdBy')
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
    // When it entered review — the queue reads oldest first.
    submittedAt: doc.reviewState?.submittedAt || doc.createdAt,
    // Authorship, for the four-eyes rule on the lead's queue (lib/credits.js).
    createdBy: doc.createdBy ? String(doc.createdBy) : null,
    ownerId:   doc.ownerId ? String(doc.ownerId) : null,
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
// @param reviewer { id, name, role? } — the admin session, or a team lead with
//                 role 'lead' and id their Contributor _id (docs/team-leads.md)
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
    // Admins have no Contributor _id; a lead does.
    authorId:   reviewer?.role === 'lead' ? reviewer.id : null,
    authorName: reviewerName,
    authorRole: reviewer?.role === 'lead' ? 'lead' : 'admin',
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
// @param opts.onlyFromReview - refuse unless the item is in review right now.
//                    The lead routes pass it; the owner's dashboard may move
//                    anything, as before.
//
export async function approveOrReject(contentId, type, newStatus, adminObjId, note = '', { onlyFromReview = false } = {}) {
  await connectDB();

  const MODEL_MAP = { lesson: Lesson, concept: Concept, feedItem: FeedItem, question: Question };
  const Model = MODEL_MAP[type];
  if (!Model) throw new Error('نوع محتوى غير صالح');

  const doc = await Model.findOne({ contentId });
  if (!doc) throw new Error('المحتوى غير موجود');
  if (onlyFromReview && doc.status !== 'review') {
    throw new ReviewError('العنصر ليس بانتظار المراجعة', 'NOT_IN_REVIEW');
  }

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
  // Conditional on the version read, so two reviewers cannot both act.
  const filter = onlyFromReview ? { contentId, status: 'review', version: doc.version } : { contentId };
  const res = await Model.updateOne(filter, {
    $set: {
      status:     newStatus,
      version:    newVersion,
      reviewedBy: adminObjId,
      changelog:  [...existing.slice(-9), entry],
      // An approved lesson is no longer "returned", whatever happened before.
      ...(type === 'lesson' && newStatus === 'approved' && { 'reviewState.returned': false }),
    },
  });
  if (onlyFromReview && !res.matchedCount) {
    throw new ReviewError('تغيّر العنصر أثناء المراجعة — حدّث الصفحة وحاول مجدداً', 'CONFLICT');
  }

  // Credit the original author, not the reviewing admin — a lesson shipping is
  // the author's effort paying off, and the only stat contributors see on their
  // own profile for "did this actually make it out the door".
  if (newStatus === 'approved' && type === 'lesson') {
    trackStat(doc.createdBy, 'publishedLessons');
  }

  return { contentId, status: newStatus };
}
// ─── getLessonForReview ───────────────────────────────────────────────────────
// Everything the reviewer reads in one request (DS2 step 3): the lesson and
// its details, sections with their blocks, its questions and feed cards — the
// parts a review comment can be anchored to (lib/review.js ANCHOR_KINDS) —
// plus every review comment from earlier rounds, who wrote the lesson, and
// the subject's review checklist (models/SubjectGuide.js).
// Shared by the owner's dashboard and the lead's inbox. Returns null when the
// lesson does not exist.
//
export async function getLessonForReview(contentId) {
  await connectDB();
  const lesson = await getLessonWithContent(contentId);
  if (!lesson) return null;

  const [questions, feedItems, author, guide] = await Promise.all([
    Question.find({ lessonContentId: contentId, isCheckpoint: { $ne: true } }, 'contentId textAr type difficulty correctAnswer options').sort({ createdAt: 1 }).lean(),
    FeedItem.find({ lessonContentId: contentId }, 'contentId type contentAr back correctAnswer').sort({ order: 1 }).lean(),
    // Seeded lessons are created by the seed actor; the author is whoever
    // wrote in it, so take the first real person of creator and last editor.
    // Used only when the lesson has no owner (assigned or claimed) to name.
    lesson.ownerId ? null : Contributor.findOne({ _id: { $in: [lesson.createdBy, lesson.updatedBy].filter(Boolean) }, ...REAL_PEOPLE }, 'name username').lean(),
    SubjectGuide.findOne({ subjectId: lesson.subjectId }, 'checklist').lean(),
  ]);

  const review = (lesson.notes || [])
    .filter((n) => n.noteType === 'review_feedback')
    .map((n) => ({
      id: String(n._id), text: n.text, anchor: n.anchor || { kind: 'lesson' }, round: n.round ?? 0,
      resolved: !!n.resolved, resolvedAt: n.resolvedAt || null, resolvedByName: n.resolvedByName || null,
      createdAt: n.createdAt, authorName: n.authorName,
    }));

  return {
    id: lesson.contentId,
    subjectId: lesson.subjectId,
    unitContentId: lesson.unitContentId,
    title: lesson.title,
    summary: lesson.summary,
    status: lesson.status,
    version: lesson.version,
    estimatedMinutes: lesson.estimatedMinutes,
    hook: lesson.metadata?.hook || null,
    hookAnswer: lesson.metadata?.hookAnswer || null,
    reviewState: lesson.reviewState || null,
    // Whose lesson it is: its owner (docs/team-leads.md L4), else the author.
    author: lesson.ownerId && lesson.attribution?.owner
      ? { name: lesson.attribution.owner.name, username: null }
      : author ? { name: author.name, username: author.username } : null,
    sections: lesson.sections.map((s) => ({
      id: s.contentId, title: s.title, kind: s.kind || 'GENERAL',
      blocks: s.blocks.map((b) => ({ id: b.contentId, type: b.type, content: b.content, caption: b.caption })),
    })),
    questions: questions.map((q) => ({ id: q.contentId, text: q.textAr, type: q.type, difficulty: q.difficulty, answer: q.correctAnswer })),
    feed: feedItems.map((f) => ({ id: f.contentId, type: f.type, text: f.contentAr, back: f.back })),
    review,
    checklist: guide?.checklist || [],
  };
}

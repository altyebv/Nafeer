import { connectDB } from '@/lib/db';
import { Lesson }   from '@/lib/models/Lesson';
import { Concept }  from '@/lib/models/Concept';
import { FeedItem } from '@/lib/models/FeedItem';
import { Question } from '@/lib/models/Question';

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
      .select('contentId subjectId title unitContentId status version createdAt')
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
  };
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
    },
  });

  return { contentId, status: newStatus };
}
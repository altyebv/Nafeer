import { connectDB } from '@/lib/db';
import { Question } from '@/lib/models/Question';
import { Exam } from '@/lib/models/Exam';
import { applyVersionBump, initialChangelog } from '@/lib/models/versioning';

// ─── Questions ────────────────────────────────────────────────────────────────

export async function getQuestionsForSubject(subjectId, options = {}) {
  await connectDB();
  const query = { subjectId };
  if (options.lessonContentId)  query.lessonContentId  = options.lessonContentId;
  if (options.unitContentId)    query.unitContentId    = options.unitContentId;
  if (options.status)           query.status           = options.status;
  if (options.type)             query.type             = options.type;
  if (options.feedEligible !== undefined) query.feedEligible = options.feedEligible;
  return Question.find(query).sort({ createdAt: 1 }).lean();
}

export async function createQuestion(data, contributorId) {
  await connectDB();
  return Question.create({
    ...data,
    createdBy: contributorId,
    changelog: initialChangelog(contributorId),
  });
}

export async function updateQuestion(contentId, updates, contributorId, note = '', skipRedraft = false) {
  await connectDB();

  const current = await Question.findOne({ contentId });
  if (!current) return null;

  const bumpedUpdates = applyVersionBump({ ...updates }, current, contributorId, 'edited', note, skipRedraft);

  return Question.findOneAndUpdate(
    { contentId },
    { $set: bumpedUpdates },
    { new: true, runValidators: true }
  ).lean();
}

export async function updateQuestionStatus(contentId, newStatus, contributorId, note = '',) {
  await connectDB();

  const current = await Question.findOne({ contentId });
  if (!current) return null;

  const newVersion = (current.version || 1) + 1;
  const entry = {
    version:   newVersion,
    action:    newStatus === 'approved' ? 'approved' : newStatus === 'review' ? 'reviewed' : 'edited',
    by:        contributorId,
    note,
    timestamp: new Date(),
  };

  return Question.findOneAndUpdate(
    { contentId },
    {
      $set: {
        status:     newStatus,
        version:    newVersion,
        updatedBy:  contributorId,
        reviewedBy: newStatus === 'approved' ? contributorId : current.reviewedBy,
      },
      $push: { changelog: { $each: [entry], $slice: -10 } },
    },
    { new: true }
  ).lean();
}

export async function deleteQuestion(contentId) {
  await connectDB();
  return Question.deleteOne({ contentId });
}

// ─── Exams ────────────────────────────────────────────────────────────────────

export async function getExamsForSubject(subjectId) {
  await connectDB();
  return Exam.find({ subjectId }).sort({ year: -1, createdAt: -1 }).lean();
}

export async function createExam(data, contributorId) {
  await connectDB();
  return Exam.create({
    ...data,
    createdBy: contributorId,
    changelog: initialChangelog(contributorId),
  });
}

export async function updateExam(contentId, updates, contributorId) {
  await connectDB();
  const current = await Exam.findOne({ contentId });
  if (!current) return null;
  const bumpedUpdates = applyVersionBump({ ...updates }, current, contributorId, 'edited');
  return Exam.findOneAndUpdate({ contentId }, { $set: bumpedUpdates }, { new: true }).lean();
}

export async function deleteExam(contentId) {
  await connectDB();
  return Exam.deleteOne({ contentId });
}
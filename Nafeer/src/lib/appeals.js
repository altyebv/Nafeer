import { connectDB }    from '@/lib/db';
import { Appeal }       from '@/lib/models/Appeal';
import { Lesson }       from '@/lib/models/Lesson';
import { Contributor }  from '@/lib/models/Contributor';
import { Announcement } from '@/lib/models/announcement';
import { emailOwners }  from '@/lib/email/notify';
import { appUrl }       from '@/lib/appUrl';
import { lessonOwnerId } from '@/lib/credits';
import { interventionOpen } from '@/lib/lessonAccess';
import { isPaused }     from '@/lib/leads';

// ─── Appeals (docs/team-leads.md L5) ──────────────────────────────────────────
// Power comes with an appeal: a member who thinks a lead's decision about them
// was wrong writes to the owner, who decides. Three kinds, each checked
// against what actually happened, so nobody appeals on someone else's behalf:
//   return       — their own lesson, sent back with comments
//   intervention — their own lesson, with a lead's intervention open
//   pause        — their own edit access, paused
// One open appeal per thing. Upholding a pause lifts it; the others are the
// owner's to act on (the owner can edit any lesson, reassign, or remove a lead).

export const MIN_APPEAL = 20;
export const MAX_APPEAL = 1000;

export class AppealError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppealError';
    this.status = status;
  }
}

/** What the appeal is about, checked. Returns { subjectId, targetId, targetLabel, againstName }. */
async function targetOf(user, kind, lessonId, now) {
  if (kind === 'pause') {
    const me = await Contributor.findById(user.id).select('subject paused').lean();
    if (!isPaused(me?.paused, now)) throw new AppealError('لست موقوفاً الآن');
    return { subjectId: me.subject, targetId: String(user.id), targetLabel: 'إيقاف التعديل', againstName: me.paused.byName || '' };
  }

  if (typeof lessonId !== 'string' || !lessonId) throw new AppealError('حدّد الدرس');
  const lesson = await Lesson.findOne({ contentId: lessonId })
    .select('contentId subjectId title createdBy ownerId reviewState intervention').lean();
  if (!lesson) throw new AppealError('الدرس غير موجود', 404);
  if (lessonOwnerId(lesson) !== String(user.id)) throw new AppealError('تعترض على قرار يخصّ دروسك فقط', 403);

  if (kind === 'return') {
    if (!lesson.reviewState?.returned) throw new AppealError('هذا الدرس لم يُعَد إليك');
    return { subjectId: lesson.subjectId, targetId: lesson.contentId, targetLabel: lesson.title, againstName: lesson.reviewState.returnedByName || '' };
  }
  if (!interventionOpen(lesson.intervention, now)) throw new AppealError('لا تدخّل مفتوح في هذا الدرس');
  return { subjectId: lesson.subjectId, targetId: lesson.contentId, targetLabel: lesson.title, againstName: lesson.intervention.byName || '' };
}

/** A member files an appeal. `user` is from requireContributor. */
export async function fileAppeal(user, { kind, lessonId = null, text }, now = new Date()) {
  if (!['return', 'intervention', 'pause'].includes(kind)) throw new AppealError('نوع الاعتراض غير معروف');
  const body = typeof text === 'string' ? text.trim() : '';
  if (body.length < MIN_APPEAL) throw new AppealError(`اشرح اعتراضك (${MIN_APPEAL} حرفاً على الأقل)`);
  if (body.length > MAX_APPEAL) throw new AppealError(`الحد ${MAX_APPEAL} حرف`);

  await connectDB();
  const target = await targetOf(user, kind, lessonId, now);
  if (await Appeal.exists({ byId: String(user.id), kind, targetId: target.targetId, status: 'open' })) {
    throw new AppealError('لديك اعتراض مفتوح على هذا بالفعل', 409);
  }

  const appeal = await Appeal.create({
    ...target, kind, text: body, byId: String(user.id), byName: user.name || '',
  });

  // The owner hears at once — appeals are rare and time matters to the member.
  await emailOwners(
    `اعتراض من ${appeal.byName || 'عضو'}`,
    `${appeal.byName} يعترض على ${LABEL[kind]}${target.againstName ? ` (${target.againstName})` : ''} — «${target.targetLabel}»:\n${body}\n\nللرد: ${appUrl('/admin/dashboard#leads')}`,
  );
  return appeal.toObject ? appeal.toObject() : appeal;
}

const LABEL = { return: 'إعادة درس', intervention: 'تدخّل في درس', pause: 'إيقاف التعديل' };

/** The owner decides. `outcome` is 'upheld' or 'dismissed'. */
export async function resolveAppeal(id, { outcome, resolution = '', by }, now = new Date()) {
  if (!['upheld', 'dismissed'].includes(outcome)) throw new AppealError('القرار غير معروف');
  await connectDB();
  const appeal = await Appeal.findOneAndUpdate(
    { _id: id, status: 'open' },
    { $set: { status: outcome, resolution: (resolution || '').trim().slice(0, MAX_APPEAL), resolvedByName: by?.name || '', resolvedAt: now } },
    { new: true },
  ).lean();
  if (!appeal) throw new AppealError('لا اعتراض مفتوح بهذا المعرّف', 409);

  // An upheld pause appeal lifts the pause.
  if (outcome === 'upheld' && appeal.kind === 'pause') {
    await Contributor.updateOne({ _id: appeal.byId }, { $set: { 'paused.active': false } });
  }

  await Announcement.create({
    title: outcome === 'upheld' ? 'قُبل اعتراضك' : 'رُدّ اعتراضك',
    body: `${LABEL[appeal.kind]} — «${appeal.targetLabel}»${appeal.resolution ? `: ${appeal.resolution}` : '.'}`,
    type: outcome === 'upheld' ? 'milestone' : 'info',
    authorName: by?.name || 'المالك',
    targetContributorIds: [appeal.byId],
  }).catch((e) => console.warn('[appeal notice failed]', e.message));

  return appeal;
}

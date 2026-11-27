// ─── What a reviewer read ─────────────────────────────────────────────────────
// An approval is only for the text the reviewer was shown. `version` moves with
// the lesson's own saves and status changes; `contentRev` moves when its
// sections, blocks or checkpoints change while it waits for review
// (lib/publishedCopy.js). The reviewer sends the stamp back with the approval.

export const reviewStamp = (lesson) => `${lesson?.version || 1}.${lesson?.contentRev || 0}`;

/** Filter matching the lesson only while it still carries `lesson`'s stamp. */
export const atStamp = (lesson) => ({
  version:    lesson.version ?? null,
  contentRev: lesson.contentRev ? lesson.contentRev : { $in: [0, null] },
});

export const STALE_APPROVAL = 'تغيّر الدرس بعد أن فتحته — أعد قراءته ثم اعتمده';

import mongoose from 'mongoose';
import { after } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireLeadOfOwnSubject, ok, err } from '@/lib/api/guard';
import { ContributorRole } from '@/lib/models/ContributorRole';
import { MIN_ANSWER_LENGTH } from '@/lib/interview';
import { recordAudit } from '@/lib/audit';

// ─── /api/lead/interview (docs/team-leads.md L3) ──────────────────────────────
// The lead's own subject's interview questions, per role. A lead edits only
// their subject's entry in a role's `subjectQuestionMap` — never the role's
// generic questions, its micro-task default, or another subject's entry. The
// write touches that one entry (positional update), so two leads saving at
// once never overwrite each other. Applicants already invited keep the
// questions they were sent (interviewSnapshot, lib/interview.js).
//
//   GET ?subjectId=  → roles, each with this subject's entry and the generic
//                      set it falls back to
//   PUT { roleId, questions: [{ id?, text, placeholder?, minChars? }],
//         microTask: { prompt, minChars? } }
//
// Needs canEditInterview.

const MAX_QUESTIONS = 8;
const MAX_TEXT = 300;
const MAX_PROMPT = 1000;
const OBJECT_ID = /^[a-f\d]{24}$/i;

const clampMin = (n) => (Number.isInteger(n) ? Math.min(1000, Math.max(20, n)) : MIN_ANSWER_LENGTH);

const shapeQuestions = (qs = []) => [...qs]
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map((q) => ({ id: String(q._id), text: q.text, placeholder: q.placeholder || '', minChars: q.minChars ?? MIN_ANSWER_LENGTH }));

export async function GET(request) {
  try {
    const subjectParam = new URL(request.url).searchParams.get('subjectId');
    const { subjectId } = await requireLeadOfOwnSubject('canEditInterview', subjectParam);
    await connectDB();
    const roles = await ContributorRole.find({ isActive: true })
      .select('name category interviewQuestions microTask subjectQuestionMap').sort({ order: 1 }).lean();

    return ok({
      subjectId,
      maxQuestions: MAX_QUESTIONS,
      roles: roles.map((r) => {
        const entry = (r.subjectQuestionMap || []).find((e) => e.subjectId === subjectId);
        return {
          id: String(r._id),
          name: r.name,
          category: r.category,
          subject: entry
            ? { questions: shapeQuestions(entry.questions), microTask: entry.microTask?.prompt ? entry.microTask : null }
            : null,
          generic: { questions: shapeQuestions(r.interviewQuestions), microTask: r.microTask?.prompt ? r.microTask : null },
        };
      }),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[GET /api/lead/interview]', e);
    return err('خطأ في الخادم', 500);
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { user, subjectId } = await requireLeadOfOwnSubject('canEditInterview', body.subjectId);

    if (typeof body.roleId !== 'string' || !OBJECT_ID.test(body.roleId)) return err('الدور غير صالح');
    if (!Array.isArray(body.questions)) return err('الأسئلة غير صالحة');
    if (body.questions.length > MAX_QUESTIONS) return err(`الحد ${MAX_QUESTIONS} أسئلة`);

    const questions = [];
    for (const [i, q] of body.questions.entries()) {
      const text = typeof q?.text === 'string' ? q.text.trim() : '';
      if (!text) continue;
      if (text.length > MAX_TEXT) return err(`السؤال ${i + 1} طويل جداً (الحد ${MAX_TEXT} حرف)`);
      questions.push({
        // Keep an existing question's id, so answers already given still match.
        _id: typeof q.id === 'string' && OBJECT_ID.test(q.id) ? new mongoose.Types.ObjectId(q.id) : new mongoose.Types.ObjectId(),
        text,
        placeholder: typeof q.placeholder === 'string' ? q.placeholder.trim().slice(0, 200) : '',
        minChars: clampMin(q.minChars),
        order: questions.length,
      });
    }
    const prompt = typeof body.microTask?.prompt === 'string' ? body.microTask.prompt.trim() : '';
    if (prompt.length > MAX_PROMPT) return err(`المهمة طويلة جداً (الحد ${MAX_PROMPT} حرف)`);
    const microTask = { prompt, minChars: clampMin(body.microTask?.minChars) };

    await connectDB();
    const role = await ContributorRole.exists({ _id: body.roleId, isActive: true });
    if (!role) return err('الدور غير موجود', 404);

    // Only this subject's entry: update it in place, or add it if missing.
    const updated = await ContributorRole.updateOne(
      { _id: body.roleId, 'subjectQuestionMap.subjectId': subjectId },
      { $set: { 'subjectQuestionMap.$.questions': questions, 'subjectQuestionMap.$.microTask': microTask } },
    );
    if (!updated.matchedCount) {
      await ContributorRole.updateOne(
        { _id: body.roleId, 'subjectQuestionMap.subjectId': { $ne: subjectId } },
        { $push: { subjectQuestionMap: { subjectId, questions, microTask } } },
      );
    }

    const actor = {
      id: user.id,
      name: user.role === 'admin' ? 'المالك' : (user.name || 'قائد الفريق'),
      kind: user.role === 'admin' ? 'admin' : 'lead',
    };
    after(() => recordAudit(actor, {
      action: 'interview.edit', subjectId,
      target: { kind: 'interview', id: body.roleId, label: `${questions.length} أسئلة` },
    }));
    return ok({ roleId: body.roleId, questions: shapeQuestions(questions), microTask: prompt ? microTask : null });
  } catch (e) {
    if (e instanceof Response) return e;
    console.error('[PUT /api/lead/interview]', e);
    return err('خطأ في الخادم', 500);
  }
}

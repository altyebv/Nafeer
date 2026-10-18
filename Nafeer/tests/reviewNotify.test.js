import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderTemplate } from '@/lib/email/templates/index';

// The author hears about each review decision; the seed account never does.

const state = vi.hoisted(() => ({ lesson: null, people: [], mails: [] }));
vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/email/emailService', () => ({ sendEmail: vi.fn(async (m) => { state.mails.push(m); return { ok: true }; }) }));
vi.mock('@/lib/models/Lesson', () => ({ Lesson: { findOne: () => ({ lean: async () => state.lesson }) } }));
vi.mock('@/lib/models/Contributor', () => ({ Contributor: { find: () => ({ lean: async () => state.people }) } }));

const { notifyLessonReviewed } = await import('@/lib/reviewNotify');

beforeEach(() => {
  state.mails = [];
  state.lesson = { title: 'الدرس 1', createdBy: 'seed', updatedBy: 'zee' };
  state.people = [{ _id: 'zee', name: 'زينب أحمد', email: 'z@example.com' }]; // the seed is filtered out by REAL_PEOPLE
});

describe('notifyLessonReviewed', () => {
  it('mails the real author with the number of comments', async () => {
    await notifyLessonReviewed('CHEMISTRY_U1_L1', 'returned', { comments: 3 });
    expect(state.mails).toHaveLength(1);
    expect(state.mails[0]).toMatchObject({ to: 'z@example.com', template: 'lesson_reviewed' });
    expect(state.mails[0].data).toMatchObject({ name: 'زينب', outcome: 'returned', comments: 3 });
    expect(state.mails[0].data.link).toContain('/editor/lessons/CHEMISTRY_U1_L1');
  });

  it('sends nothing when only the seed account touched the lesson', async () => {
    state.people = [];
    await notifyLessonReviewed('X', 'approved');
    expect(state.mails).toHaveLength(0);
  });
});

describe('lesson_reviewed template', () => {
  it('names the lesson and the outcome', () => {
    const approved = renderTemplate('lesson_reviewed', { name: 'زينب', title: 'قراءة الصور الجوية', outcome: 'approved', link: 'https://x/l' });
    expect(approved.subject).toBe('اعتُمد درسك «قراءة الصور الجوية»');
    const returned = renderTemplate('lesson_reviewed', { title: 'قراءة الصور الجوية', outcome: 'returned', comments: 2, link: 'https://x/l' });
    expect(returned.subject).toContain('بملاحظات');
    expect(returned.text).toContain('2 ملاحظة');
  });
});

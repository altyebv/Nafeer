import { describe, it, expect, vi } from 'vitest';
import { closeReferences } from '@/lib/releaseLinks';
import { previewDelta } from '@/lib/deltaEngine';

// ─── A release holds nothing Basheer would refuse (lib/releaseLinks.js) ───────

vi.mock('@/lib/supabase', () => ({ uploadFile: vi.fn(), getPublicUrl: vi.fn() }));

const at = new Date('2026-11-01T00:00:00Z');
const doc = (contentId, extra = {}) => ({ contentId, updatedAt: at, ...extra });

const content = () => ({
  units: [doc('U')],
  tags: [doc('T')],
  concepts: [doc('C', { tagIds: ['T', 'T_draft'] })],
  lessons: [doc('L', { unitContentId: 'U' }), doc('L_lost', { unitContentId: 'U_gone' })],
  sections: [doc('S', { lessonContentId: 'L', conceptIds: ['C', 'C_draft'] }), doc('S_lost', { lessonContentId: 'L_lost' })],
  blocks: [doc('B', { sectionContentId: 'S', conceptRef: 'C_draft' }), doc('B_lost', { sectionContentId: 'S_lost' })],
  questions: [
    doc('Q', { status: 'approved', type: 'MCQ', lessonContentId: 'L_draft', sectionContentId: 'S_draft', unitContentId: 'U', conceptIds: ['C_draft', 'C'] }),
    doc('Q_check', { status: 'draft', isCheckpoint: true, sectionContentId: 'S_draft' }),
  ],
  exams: [doc('E', { questionContentIds: ['Q', 'Q_draft', 'Q_check'] })],
  feedItems: [doc('F', { conceptContentId: 'C' }), doc('F_wait', { conceptContentId: 'C_draft' })],
});

const ids = (docs) => docs.map((d) => d.contentId);

describe('closeReferences', () => {
  const out = closeReferences(content());

  it('takes out links to what is not in the release', () => {
    expect(out.sections[0].conceptIds).toEqual(['C']);
    expect(out.blocks[0].conceptRef).toBeNull();
    expect(out.concepts[0].tagIds).toEqual(['T']);
    expect(out.questions[0]).toMatchObject({ lessonContentId: null, sectionContentId: null, unitContentId: 'U', conceptIds: ['C'] });
    expect(out.exams[0].questionContentIds).toEqual(['Q']);
  });

  it('holds back what cannot do without its target', () => {
    expect(ids(out.lessons)).toEqual(['L']);
    expect(ids(out.sections)).toEqual(['S']);
    expect(ids(out.blocks)).toEqual(['B']);
    expect(ids(out.questions)).toEqual(['Q']);
    expect(ids(out.feedItems)).toEqual(['F']);
  });

  it('reports what it left out, and why', () => {
    const report = out.omitted.map((o) => [o.kind, o.id, !!o.held]);
    expect(report).toContainEqual(['feedItem', 'F_wait', true]);
    expect(report).toContainEqual(['lesson', 'L_lost', true]);
    expect(report).toContainEqual(['section', 'S', false]);
    expect(out.omitted.find((o) => o.id === 'S').missing).toEqual(['C_draft']);
  });

  it('marks a trimmed document so it is sent again once the target arrives', () => {
    expect(out.sections[0].updatedAt).not.toBe(at);
    expect(out.units[0].updatedAt).toBe(at);
    const complete = content();
    complete.concepts.push(doc('C_draft', { tagIds: [] }));
    expect(closeReferences(complete).sections[0].updatedAt).toBe(at);
  });
});

describe('the index of a release', () => {
  it('lists an empty kind, so the app removes the last item of it', () => {
    const delta = previewDelta({
      subjectId: 'X',
      snapshot: { subject: doc('X'), feedItems: [] },
      prevEntry: { entityIndex: { FEED_ITEM: { F: 'token' } } },
    });
    expect(delta.deletedByType.FEED_ITEM).toEqual(['F']);
  });
});

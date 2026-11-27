import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ─── Editing an approved lesson (lib/publishedCopy.js) ────────────────────────
// What a release ships while a lesson is being revised, and that every content
// write reopens an approved lesson first.

vi.mock('@/lib/models/Lesson',        () => ({ Lesson: {} }));
// Mutable: tests give it the methods they expect to be called.
vi.mock('@/lib/models/Section',       () => ({ Section: {} }));
vi.mock('@/lib/models/Block',         () => ({ Block: {} }));
vi.mock('@/lib/models/Question',      () => ({ Question: {} }));
vi.mock('@/lib/models/PublishedCopy', () => ({ PublishedCopy: {} }));

const { mergePublished, reopenForRevision } = await import('@/lib/publishedCopy');
const { reviewStamp } = await import('@/lib/reviewStamp');

const lesson  = (contentId, order, title = contentId) => ({ contentId, order, title });
const section = (contentId, lessonContentId) => ({ contentId, lessonContentId, order: 1 });
const block   = (contentId, sectionContentId, content) => ({ contentId, sectionContentId, content, order: 1 });
const ids = (docs) => docs.map((d) => d.contentId).sort();

describe('mergePublished', () => {
  // L1 is approved and untouched; L2 is being revised: S2 was reworded, a
  // section was added, and its checkpoint changed.
  const live = {
    lessons:  [lesson('L1', 1)],
    sections: [section('S1', 'L1'), section('S2', 'L2'), section('S_new', 'L2')],
    blocks:   [block('B1', 'S1', 'one'), block('B2', 'S2', 'unreviewed'), block('B_new', 'S_new', 'unreviewed')],
    questions: [
      { contentId: 'Q2', sectionContentId: 'S2', isCheckpoint: true, textAr: 'unreviewed' },
      { contentId: 'Q_bank', sectionContentId: null, isCheckpoint: false },
    ],
  };
  const copy = {
    lessonContentId: 'L2', approvedVersion: 4,
    lesson:    lesson('L2', 2, 'as approved'),
    sections:  [section('S2', 'L2'), section('S_gone', 'L2')],
    blocks:    [block('B2', 'S2', 'approved'), block('B_gone', 'S_gone', 'approved')],
    questions: [{ contentId: 'Q2', sectionContentId: 'S2', isCheckpoint: true, textAr: 'approved' }],
  };

  it('ships a revising lesson exactly as it was approved', () => {
    const out = mergePublished(live, [copy]);
    expect(out.lessons.map((l) => l.title)).toEqual(['L1', 'as approved']);
    expect(ids(out.sections)).toEqual(['S1', 'S2', 'S_gone']);
    expect(ids(out.blocks)).toEqual(['B1', 'B2', 'B_gone']);
    expect(out.blocks.some((b) => b.content === 'unreviewed')).toBe(false);
    expect(ids(out.questions)).toEqual(['Q2', 'Q_bank']);
    expect(out.questions.find((q) => q.contentId === 'Q2').textAr).toBe('approved');
  });

  it('uses the newest copy of a lesson', () => {
    const older = { ...copy, approvedVersion: 2, lesson: lesson('L2', 2, 'older') };
    expect(mergePublished(live, [copy, older]).lessons.map((l) => l.title)).toContain('as approved');
  });

  it('changes nothing when no lesson is being revised', () => {
    expect(mergePublished(live, [])).toEqual(live);
  });
});

describe('reopenForRevision', () => {
  it('does nothing, and reads nothing, for drafts', async () => {
    // The mocked models have no methods: any query would throw.
    await expect(reopenForRevision([{ contentId: 'L1', status: 'draft' }]))
      .resolves.toEqual([]);
  });
});

describe('a lesson waiting for review', () => {
  it('is marked as changed by a content write, and stays in review', async () => {
    const { Lesson } = await import('@/lib/models/Lesson');
    Lesson.updateOne = vi.fn(async () => ({ matchedCount: 1 }));
    await expect(reopenForRevision([{ contentId: 'L1', status: 'review' }])).resolves.toEqual([]);
    expect(Lesson.updateOne).toHaveBeenCalledWith(
      { contentId: 'L1', status: 'review' }, { $inc: { contentRev: 1 } }, { timestamps: false },
    );
    delete Lesson.updateOne;
  });

  it('changes its stamp with either counter', () => {
    expect(reviewStamp({ version: 3 })).toBe('3.0');
    expect(reviewStamp({ version: 3, contentRev: 1 })).not.toBe(reviewStamp({ version: 3 }));
  });
});

describe('content write handlers', () => {
  const root = path.resolve(__dirname, '../src/app/api/content');
  const files = ['sections/route.js', 'sections/[id]/route.js', 'blocks/route.js', 'blocks/[id]/route.js',
    'questions/route.js', 'questions/[id]/route.js'];
  for (const file of files) {
    const handlers = fs.readFileSync(path.join(root, file), 'utf8')
      .split(/(?=export async function )/)
      // A question's own status change is not a change to the lesson.
      .filter((h) => /^export async function (POST|PUT|PATCH|DELETE)\b/.test(h))
      .filter((h) => !(file === 'questions/[id]/route.js' && h.startsWith('export async function PATCH')));
    for (const h of handlers) {
      const name = h.match(/function (\w+)/)[1];
      it(`${file} ${name} reopens an approved lesson before writing`, () => {
        expect(h).toMatch(/reopenFor(Revision|Checkpoint)\(/);
      });
    }
  }
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signOut, authMock } from './helpers/session.js';

// ─── Regression tests for the route-level security fixes ──────────────────────
// Each block below pins one finding from the security audit (October 2026):
// token injection on onboarding/interview, cross-subject content access, and
// re-issuing a session to a contributor who is no longer approved.

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));

const { model } = vi.hoisted(() => ({
  model: (name) => async () => ({ [name]: (await import('./helpers/fakeModel.js')).fakeModel() }),
}));
vi.mock('@/lib/models/Contributor',     model('Contributor'));
vi.mock('@/lib/models/ContributorRole', model('ContributorRole'));
vi.mock('@/lib/models/Lesson',          model('Lesson'));
vi.mock('@/lib/models/Section',         model('Section'));
vi.mock('@/lib/models/Block',           model('Block'));

vi.mock('@/lib/SeedActor',  () => ({ ensureSystemSeedContributor: vi.fn(async () => 'seed') }));
vi.mock('@/lib/trackStat',  () => ({ trackStat: vi.fn() }));
vi.mock('@/lib/api/lessons', () => ({
  getLessonWithContent: vi.fn(async (id) => ({ contentId: id })),
  updateLesson:         vi.fn(async (id) => ({ contentId: id })),
  updateLessonStatus:   vi.fn(async (id) => ({ contentId: id })),
}));
vi.mock('@/lib/api/content', () => ({
  upsertBlock:                         vi.fn(async (data) => ({ contentId: data.contentId })),
  batchUpsertBlocks:                   vi.fn(async (blocks) => blocks),
  deleteBlock:                         vi.fn(async () => {}),
  deleteCheckpointQuestionsForSections: vi.fn(async () => {}),
}));

const { Contributor } = await import('@/lib/models/Contributor');
const { Lesson }      = await import('@/lib/models/Lesson');
const { Section }     = await import('@/lib/models/Section');
const { Block }       = await import('@/lib/models/Block');
const content         = await import('@/lib/api/content');

const onboard     = await import('@/app/api/auth/onboard/route.js');
const interview   = await import('@/app/api/interview/route.js');
const me          = await import('@/app/api/contributors/me/route.js');
const lessonById  = await import('@/app/api/content/lessons/[id]/route.js');
const blockById   = await import('@/app/api/content/blocks/[id]/route.js');
const blocks      = await import('@/app/api/content/blocks/route.js');

const post  = (body) => new Request('http://test/api', { method: 'POST',  body: JSON.stringify(body) });
const patch = (body) => new Request('http://test/api', { method: 'PATCH', body: JSON.stringify(body) });
const del   = ()     => new Request('http://test/api', { method: 'DELETE' });
const params = (id) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.clearAllMocks();
  signOut();
  Contributor.seed([
    { _id: 'c_geo',      status: 'approved', subject: 'GEOGRAPHY' },
    { _id: 'c_rejected', status: 'rejected', subject: 'GEOGRAPHY' },
  ]);
  Lesson.seed([
    { contentId: 'les_geo',  subjectId: 'GEOGRAPHY', status: 'draft' },
    { contentId: 'les_phys', subjectId: 'PHYSICS',   status: 'draft' },
  ]);
  Section.seed([
    { contentId: 'sec_geo',  subjectId: 'GEOGRAPHY' },
    { contentId: 'sec_phys', subjectId: 'PHYSICS' },
  ]);
  Block.seed([
    { contentId: 'blk_geo',  subjectId: 'GEOGRAPHY', sectionContentId: 'sec_geo',  type: 'TEXT',
      toObject() { return { contentId: 'blk_geo', subjectId: 'GEOGRAPHY', sectionContentId: 'sec_geo', type: 'TEXT' }; } },
    { contentId: 'blk_phys', subjectId: 'PHYSICS',   sectionContentId: 'sec_phys', type: 'TEXT' },
  ]);
});

describe('onboarding and interview tokens', () => {
  const injected = { $ne: null };

  it('onboard POST rejects an operator object as the token, before querying', async () => {
    const res = await onboard.POST(post({ token: injected, password: 'attacker-password' }));
    expect(res.status).toBe(400);
    expect(Contributor.findOne).not.toHaveBeenCalled();
  });

  it('onboard POST rejects a non-string password', async () => {
    const res = await onboard.POST(post({ token: 'abc', password: ['x', 'y', 'z', 'w', 'v', 'u', 't', 's'] }));
    expect(res.status).toBe(400);
  });

  it('onboard POST still looks up a well-formed token', async () => {
    const res = await onboard.POST(post({ token: 'unknown-token', password: 'long-enough' }));
    expect(res.status).toBe(404);
    expect(Contributor.findOne).toHaveBeenCalledWith({ onboardingToken: 'unknown-token' });
  });

  it('interview POST rejects an operator object as the token, before querying', async () => {
    const res = await interview.POST(post({ token: injected, answers: [{ questionId: 'q', answer: 'a' }] }));
    expect(res.status).toBe(400);
    expect(Contributor.findOne).not.toHaveBeenCalled();
  });
});

describe('session refresh', () => {
  it('does not re-issue a token to a contributor who is no longer approved', async () => {
    signInAs({ id: 'c_rejected', role: 'contributor' });
    const res = await me.PATCH(patch({ action: 'refresh_token' }));
    expect(res.status).toBe(401);
    expect(authMock.signToken).not.toHaveBeenCalled();
  });

  it('re-issues a token to an approved contributor', async () => {
    signInAs({ id: 'c_geo', role: 'contributor' });
    const res = await me.PATCH(patch({ action: 'refresh_token' }));
    expect(res.status).toBe(200);
    expect(authMock.signToken).toHaveBeenCalled();
  });
});

describe('content routes stay inside the contributor\'s subject', () => {
  beforeEach(() => signInAs({ id: 'c_geo', role: 'contributor', subject: 'GEOGRAPHY' }));

  it('refuses to read another subject\'s lesson', async () => {
    const res = await lessonById.GET(new Request('http://test/api'), params('les_phys'));
    expect(res.status).toBe(403);
  });

  it('refuses to delete another subject\'s lesson', async () => {
    const res = await lessonById.DELETE(del(), params('les_phys'));
    expect(res.status).toBe(403);
    expect(Lesson.deleteOne).not.toHaveBeenCalled();
  });

  it('still deletes a draft lesson in the contributor\'s own subject', async () => {
    const res = await lessonById.DELETE(del(), params('les_geo'));
    expect(res.status).toBe(200);
    expect(Lesson.deleteOne).toHaveBeenCalledWith({ contentId: 'les_geo' });
  });

  it('refuses to re-parent a lesson under another subject\'s lesson', async () => {
    const res = await lessonById.PUT(
      new Request('http://test/api', { method: 'PUT', body: JSON.stringify({ parentLesson: 'les_phys' }) }),
      params('les_geo')
    );
    expect(res.status).toBe(403);
  });

  it('refuses to edit another subject\'s block', async () => {
    const res = await blockById.PATCH(patch({ content: 'x' }), params('blk_phys'));
    expect(res.status).toBe(403);
    expect(content.upsertBlock).not.toHaveBeenCalled();
  });

  it('ignores an attempt to move a block into another subject', async () => {
    const res = await blockById.PATCH(patch({ content: 'x', subjectId: 'PHYSICS' }), params('blk_geo'));
    expect(res.status).toBe(200);
    expect(content.upsertBlock.mock.calls[0][0].subjectId).toBe('GEOGRAPHY');
  });

  it('refuses to move a block into another subject\'s section', async () => {
    const res = await blockById.PATCH(patch({ sectionContentId: 'sec_phys' }), params('blk_geo'));
    expect(res.status).toBe(403);
  });

  it('refuses a batch that writes into another subject\'s section', async () => {
    const res = await blocks.POST(post({ blocks: [{ contentId: 'blk_new', sectionContentId: 'sec_phys' }] }));
    expect(res.status).toBe(403);
    expect(content.batchUpsertBlocks).not.toHaveBeenCalled();
  });

  it('refuses a batch that overwrites another subject\'s block', async () => {
    const res = await blocks.POST(post({ blocks: [{ contentId: 'blk_phys', sectionContentId: 'sec_geo' }] }));
    expect(res.status).toBe(403);
  });

  it('accepts a batch inside the contributor\'s subject', async () => {
    const res = await blocks.POST(post({
      blocks: [{ contentId: 'blk_new', subjectId: 'GEOGRAPHY', sectionContentId: 'sec_geo' }],
    }));
    expect(res.status).toBe(200);
    expect(content.batchUpsertBlocks).toHaveBeenCalled();
  });
});

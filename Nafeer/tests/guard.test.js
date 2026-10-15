import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signInAs, signInAsAdmin, signOut } from './helpers/session.js';

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db',        () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/models/Contributor', async () => ({
  Contributor: (await import('./helpers/fakeModel.js')).fakeModel(),
}));

const { Contributor } = await import('@/lib/models/Contributor');
const { fakeModel }   = await import('./helpers/fakeModel.js');
const { requireContributor, requireSubjectAccess, requireContentAccess, assertInSubject } =
  await import('@/lib/api/guard');

// Runs fn and returns the Response it throws (the guard's way of refusing).
async function refusal(fn) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }
  throw new Error('expected the guard to refuse');
}

const Lesson = fakeModel([
  { contentId: 'les_phys', subjectId: 'PHYSICS' },
  { contentId: 'les_geo',  subjectId: 'GEOGRAPHY' },
]);

beforeEach(() => {
  Contributor.seed([
    { _id: 'c_geo',      status: 'approved', subject: 'GEOGRAPHY' },
    { _id: 'c_rejected', status: 'rejected', subject: 'GEOGRAPHY' },
    { _id: 'c_moved',    status: 'approved', subject: 'PHYSICS' },
  ]);
  signOut();
});

describe('requireContributor', () => {
  it('refuses a caller with no session', async () => {
    expect((await refusal(requireContributor)).status).toBe(401);
  });

  it('refuses a contributor whose valid JWT outlived their approval', async () => {
    signInAs({ id: 'c_rejected', role: 'contributor', subject: 'GEOGRAPHY' });
    expect((await refusal(requireContributor)).status).toBe(401);
  });

  it('refuses a token for a contributor that no longer exists', async () => {
    signInAs({ id: 'c_deleted', role: 'contributor', subject: 'GEOGRAPHY' });
    expect((await refusal(requireContributor)).status).toBe(401);
  });

  it('uses the subject on file, not the one baked into the JWT', async () => {
    signInAs({ id: 'c_moved', role: 'contributor', subject: 'GEOGRAPHY' });
    expect((await requireContributor()).subject).toBe('PHYSICS');
  });

  it('lets an admin through without a contributor record', async () => {
    signInAsAdmin();
    expect((await requireContributor()).role).toBe('admin');
  });
});

describe('requireSubjectAccess', () => {
  it('allows the contributor\'s own subject and refuses another', async () => {
    signInAs({ id: 'c_geo', role: 'contributor' });
    await expect(requireSubjectAccess('GEOGRAPHY')).resolves.toMatchObject({ id: 'c_geo' });
    expect((await refusal(() => requireSubjectAccess('PHYSICS'))).status).toBe(403);
  });
});

describe('requireContentAccess', () => {
  it('allows a document in the contributor\'s subject', async () => {
    signInAs({ id: 'c_geo', role: 'contributor' });
    const { doc } = await requireContentAccess(Lesson, 'les_geo');
    expect(doc.subjectId).toBe('GEOGRAPHY');
  });

  it('refuses a document in another subject', async () => {
    signInAs({ id: 'c_geo', role: 'contributor' });
    expect((await refusal(() => requireContentAccess(Lesson, 'les_phys'))).status).toBe(403);
  });

  it('returns 404 for a missing document', async () => {
    signInAs({ id: 'c_geo', role: 'contributor' });
    expect((await refusal(() => requireContentAccess(Lesson, 'nope'))).status).toBe(404);
  });

  it('never puts a non-string id into the query', async () => {
    signInAs({ id: 'c_geo', role: 'contributor' });
    Lesson.findOne.mockClear();
    const res = await refusal(() => requireContentAccess(Lesson, { $ne: null }));
    expect(res.status).toBe(404);
    expect(Lesson.findOne).not.toHaveBeenCalled();
  });

  it('lets an admin reach any subject', async () => {
    signInAsAdmin();
    await expect(requireContentAccess(Lesson, 'les_phys')).resolves.toBeTruthy();
  });
});

describe('assertInSubject', () => {
  const geo = { id: 'c_geo', role: 'contributor', subject: 'GEOGRAPHY' };

  it('passes ids in the subject, and ids with no document yet', async () => {
    await expect(assertInSubject(geo, Lesson, ['les_geo', 'brand_new', null])).resolves.toBeUndefined();
  });

  it('refuses when any id belongs to another subject', async () => {
    expect((await refusal(() => assertInSubject(geo, Lesson, ['les_geo', 'les_phys']))).status).toBe(403);
  });

  it('rejects operator objects in place of ids', async () => {
    expect((await refusal(() => assertInSubject(geo, Lesson, [{ $ne: null }]))).status).toBe(400);
  });

  it('refuses a contributor with no subject assigned', async () => {
    const none = { ...geo, subject: null };
    expect((await refusal(() => assertInSubject(none, Lesson, ['les_geo']))).status).toBe(403);
  });

  it('lets an admin reference any subject', async () => {
    await expect(assertInSubject({ role: 'admin' }, Lesson, ['les_phys'])).resolves.toBeUndefined();
  });
});

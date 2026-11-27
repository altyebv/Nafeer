import { describe, it, expect, vi, beforeEach } from 'vitest';
import sharp from 'sharp';
import { signInAs, signInAsAdmin, signOut } from './helpers/session.js';
import { MAX_UPLOAD_BYTES } from '@/lib/uploadLimits';

// ─── POST /api/media ──────────────────────────────────────────────────────────
// The real route and the real image optimiser; only storage and the database
// are stand-ins. Whether Supabase accepts the file is checked by hand.

const store = vi.hoisted(() => ({ files: [], docs: [] }));

vi.mock('@/lib/auth',      async () => (await import('./helpers/session.js')).authMock);
vi.mock('@/lib/adminAuth', async () => (await import('./helpers/session.js')).adminAuthMock);
vi.mock('@/lib/db', () => ({ connectDB: vi.fn(async () => {}) }));
vi.mock('@/lib/supabase', () => ({
  uploadMedia: vi.fn(async (path, buffer, type) => { store.files.push({ path, buffer, type }); return `https://cdn.test/${path}`; }),
}));
vi.mock('@/lib/models/Media', () => ({
  Media: { create: vi.fn(async (d) => { store.docs.push(d); return { toObject: () => ({ _id: 'm1', ...d }) }; }) },
}));

const { POST } = await import('@/app/api/media/route');

const upload = (bytes, type = 'image/png', subjectId = 'GEOGRAPHY') => {
  const form = new FormData();
  form.append('file', new File([bytes], 'خريطة.png', { type }));
  form.append('subjectId', subjectId);
  return POST(new Request('http://test/api/media', { method: 'POST', body: form }));
};
const png = () => sharp({ create: { width: 40, height: 20, channels: 3, background: '#884422' } }).png().toBuffer();

beforeEach(() => {
  signOut();
  store.files = [];
  store.docs = [];
});

describe('uploading an image', () => {
  it('stores the optimised file under its subject and records it', async () => {
    signInAsAdmin();
    const res = await upload(await png());
    expect(res.status).toBe(201);
    const { data } = await res.json();
    expect(store.files[0].path).toMatch(/^GEOGRAPHY\//);
    expect(data.url).toBe(`https://cdn.test/${store.files[0].path}`);
    expect((await sharp(store.files[0].buffer).metadata()).width).toBe(40);
  });

  it('refuses members, oversize files and non-images before storing', async () => {
    signInAs({ id: 'mona', role: 'contributor' });
    expect((await upload(await png())).status).toBe(403);
    signInAsAdmin();
    expect((await upload(new Uint8Array(MAX_UPLOAD_BYTES + 1))).status).toBe(400);
    expect((await upload('نص', 'text/plain')).status).toBe(400);
    expect(store.files).toEqual([]);
  });
});

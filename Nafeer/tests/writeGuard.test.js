import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// ─── Every content write says it is a write ───────────────────────────────────
// A member a lead has paused can read but not write (docs/team-leads.md L2).
// The guard only knows a request writes when the handler passes
// `{ write: true }`, so a new POST / PUT / PATCH / DELETE under /api/content
// that forgets it would quietly let a paused member through. This reads the
// route files and fails on any such handler.
//
// Owner-only handlers (verifyAdminAuth / verifyAdminToken) are exempt: the
// owner is never paused.

const ROOT = path.resolve(__dirname, '../src/app/api/content');
const WRITE = ['POST', 'PUT', 'PATCH', 'DELETE'];

function routeFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return routeFiles(p);
    return e.name === 'route.js' ? [p] : [];
  });
}

// Splits a route file into its exported handlers: { name, body }.
function handlers(source) {
  const parts = source.split(/(?=export async function )/);
  return parts
    .map((p) => ({ name: p.match(/^export async function (\w+)/)?.[1], body: p }))
    .filter((h) => h.name);
}

const writeHandlers = routeFiles(ROOT).flatMap((file) =>
  handlers(fs.readFileSync(file, 'utf8'))
    .filter((h) => WRITE.includes(h.name))
    .map((h) => ({ ...h, file: path.relative(ROOT, file).replaceAll('\\', '/') })),
);

describe('content write handlers', () => {
  it('finds the write handlers (the scan itself works)', () => {
    expect(writeHandlers.length).toBeGreaterThan(25);
  });

  for (const h of writeHandlers) {
    it(`${h.file} ${h.name} passes { write: true } or is owner-only`, () => {
      const ownerOnly = /verifyAdmin(Auth|Token)\(/.test(h.body);
      expect(ownerOnly || /\{\s*write:\s*true\s*\}/.test(h.body)).toBe(true);
    });
  }
});

// ─── Lesson-content writes check ownership (docs/team-leads.md L4) ────────────
// A lesson belongs to its owner; only they (or a lead with an open
// intervention, or the platform owner) change it. Every write to a lesson or
// to what lives inside it must go through assertCanEditLessons. Creating a
// lesson is exempt (the creator is its author); so are comments (notes).
const LESSON_CONTENT = [
  'lessons/[id]/route.js', 'sections/route.js', 'sections/[id]/route.js',
  'blocks/route.js', 'blocks/[id]/route.js',
  'questions/route.js', 'questions/[id]/route.js',
  'feed-items/route.js', 'feed-items/[id]/route.js',
];

describe('lesson-content write handlers', () => {
  const inScope = writeHandlers.filter((h) => LESSON_CONTENT.includes(h.file));

  it('finds them', () => {
    expect(new Set(inScope.map((h) => h.file)).size).toBe(LESSON_CONTENT.length);
  });

  for (const h of inScope) {
    it(`${h.file} ${h.name} checks the lesson's owner`, () => {
      expect(h.body).toMatch(/assertCanEditLessons\(/);
    });
  }
});

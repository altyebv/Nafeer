import { describe, it, expect } from 'vitest';
import { inputProblem, assertBatch, readBody, invalidData, MAX_BATCH, MAX_TEXT } from '@/lib/limits';

const body = (text) => new Request('http://test', { method: 'POST', body: text });
const status = async (fn) => {
  try { await fn(); return 200; } catch (e) { return e.status; }
};

describe('inputProblem', () => {
  it('passes what the editor sends', () => {
    expect(inputProblem({ title: 'درس', summary: null, caption: '', order: 2, content: 'نص', metadata: { a: ['b'] } })).toBeNull();
  });

  it('refuses long text, wherever it hides', () => {
    expect(inputProblem({ content: 'a'.repeat(MAX_TEXT + 1) })).toBeTruthy();
    expect(inputProblem({ metadata: { rows: [['a'.repeat(MAX_TEXT + 1)]] } })).toBeTruthy();
    expect(inputProblem({ title: 'a'.repeat(201) })).toBeTruthy();
    expect(inputProblem({ metadata: Array.from({ length: 10 }, () => 'a'.repeat(MAX_TEXT)) })).toBeTruthy();
  });

  it('refuses the wrong shapes', () => {
    for (const bad of ['text', null, ['a'], { title: ['a'] }, { content: { a: 1 } }, { order: 'first' }]) {
      expect(inputProblem(bad)).toBeTruthy();
    }
  });

  it('refuses an emptied field only where it is required', () => {
    expect(inputProblem({ title: '' })).toBeNull();
    expect(inputProblem({ title: ' ' }, ['title'])).toBeTruthy();
  });
});

describe('request bodies', () => {
  it('answers bad JSON and non-objects with 400, oversize with 413', async () => {
    expect(await status(() => readBody(body('{oops')))).toBe(400);
    expect(await status(() => readBody(body('[1]')))).toBe(400);
    expect(await status(() => readBody(body(JSON.stringify({ a: 'x'.repeat(100) })), 50))).toBe(413);
    await expect(readBody(body('{"a":1}'))).resolves.toEqual({ a: 1 });
  });

  it('bounds a batch', async () => {
    expect(await status(() => assertBatch(['a']))).toBe(400);
    expect(await status(() => assertBatch(Array.from({ length: MAX_BATCH + 1 }, () => ({}))))).toBe(413);
  });

  it('treats a refusal by the database as a bad request', () => {
    expect(invalidData({ name: 'ValidationError' }).status).toBe(400);
    expect(invalidData(new Error('down'))).toBeNull();
  });
});

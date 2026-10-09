// Quick check of the math pipeline's pure parts:  node scripts/math-smoke.mjs
import assert from 'node:assert/strict'
import katex from 'katex'
import { splitInlineMath, hasInlineMath, getKatexConfig } from '../src/lib/math/ArabicMath.js'

assert.deepEqual(
  splitInlineMath('مشتقة $f(x) = x^2$ هي $2x$ وسعرها 5\\$ فقط'),
  [
    { type: 'text', value: 'مشتقة ' },
    { type: 'math', value: 'f(x) = x^2' },
    { type: 'text', value: ' هي ' },
    { type: 'math', value: '2x' },
    { type: 'text', value: ' وسعرها 5$ فقط' },
  ],
)
assert.deepEqual(splitInlineMath('بلا معادلات'), [{ type: 'text', value: 'بلا معادلات' }])
assert.deepEqual(splitInlineMath(''), [])
assert.equal(hasInlineMath('بلا معادلات'), false)
assert.equal(hasInlineMath('قيمة $x$'), true)
assert.equal(hasInlineMath('سطر $x\nجديد$'), false)

// Every curriculum macro parses under both notations.
const source = '\\perm{n}{r} + \\comb{n}{r} + \\lim_{x \\to 0} \\fact{3} + \\Pr(A) + \\R + \\latin{cm} + \\ltr{x}'
for (const arabic of [true, false]) {
  const html = katex.renderToString(source, { ...getKatexConfig(arabic), throwOnError: true })
  assert.ok(html.includes('katex-html'))
  assert.equal(html.includes('نهـــا'), arabic)
}

console.log('math pipeline ok')

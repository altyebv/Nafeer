'use client';
import { PlainItem, FamilyBlock, Icons } from './margin';
import { readVerseMeta, isQuran, verseLines } from '@/lib/verse';

// ─────────────────────────────────────────────────────────────────────────────
// VerseBlock — a preview of Basheer's VerseBlock.kt, close enough to check the
// text: the Quran as one passage in ﴿ ﴾ with ۝ and a number after each آية,
// poetry as صدر and عجز side by side. Glossed words are dotted and listed under
// it; line meanings show under their line. Nothing opens on tap here.
// ─────────────────────────────────────────────────────────────────────────────

const read = { margin: 0, font: '400 19px/36px var(--font-read)', color: 'var(--b-ink)' };
const small = { margin: 0, font: '500 12px/20px var(--font-arabic)', color: 'var(--b-ink2)' };
const dotted = { textDecoration: 'underline dotted var(--b-accent-text)', textUnderlineOffset: 6 };

/** A line with its glossed words dotted (first match, as the app finds them). */
function Glossed({ text, words }) {
  const marks = words
    .map((w) => ({ w, at: text.indexOf(w.word) }))
    .filter((m) => m.at >= 0)
    .sort((a, b) => a.at - b.at);
  const parts = [];
  let i = 0;
  for (const { w, at } of marks) {
    if (at < i) continue;
    if (at > i) parts.push(text.slice(i, at));
    parts.push(<span key={at} style={dotted}>{w.word}</span>);
    i = at + w.word.length;
  }
  parts.push(text.slice(i));
  return <>{parts}</>;
}

export function VerseBlock({ block }) {
  const meta = readVerseMeta(block.metadata);
  const lines = verseLines(block.content);
  if (!lines.length) return null;

  const words = (Array.isArray(meta.words) ? meta.words : [])
    .filter((w) => Number.isInteger(w?.line) && String(w.word ?? '').trim() && String(w.meaning ?? '').trim())
    .map((w) => ({ ...w, word: String(w.word).trim(), meaning: String(w.meaning).trim() }));
  const meaningOf = (n) => (Array.isArray(meta.meanings) ? meta.meanings : [])
    .filter((m) => m?.line === n && String(m.text ?? '').trim()).pop()?.text;
  const wordsOn = (n) => words.filter((w) => w.line === n);

  const quran = isQuran(meta);
  const first = Number.parseInt(String(meta.ayah ?? '').match(/\d+/)?.[0] ?? '', 10);
  const reference = [
    meta.surah && `سورة ${meta.surah}`,
    meta.ayah != null && meta.ayah !== '' && (/[–-]/.test(String(meta.ayah)) ? `الآيات ${meta.ayah}` : `الآية ${meta.ayah}`),
  ].filter(Boolean).join('، ');
  const under = block.caption?.trim() || (quran ? reference : '');
  const piece = meta.pieceId ? `للحفظ: ${meta.pieceId}${Array.isArray(meta.pieceLines) ? ` (${meta.pieceLines.join('–')})` : ''}` : null;

  const body = quran ? (
    <>
      <p dir="rtl" style={{ ...read, textAlign: 'justify' }}>
        ﴿{lines.map((line, k) => (
          <span key={k}>
            <Glossed text={line} words={wordsOn(k + 1)} />
            {' ۝'}{Number.isInteger(first) ? first + k : k + 1}{k < lines.length - 1 ? ' ' : ''}
          </span>
        ))}﴾
      </p>
      {lines.map((_, k) => meaningOf(k + 1) && (
        <p key={k} style={{ ...small, marginTop: 4 }}>{Number.isInteger(first) ? first + k : k + 1}: {meaningOf(k + 1)}</p>
      ))}
    </>
  ) : (
    lines.map((line, k) => {
      const [right, left] = line.split('|', 2).map((h) => h.trim());
      return (
        <div key={k} style={{ padding: '4px 0' }}>
          <div dir="rtl" style={{ display: 'flex', gap: 24, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <p style={read}><Glossed text={right} words={wordsOn(k + 1)} /></p>
            {left != null && <p style={read}><Glossed text={left} words={wordsOn(k + 1)} /></p>}
          </div>
          {meaningOf(k + 1) && <p style={small}>{meaningOf(k + 1)}</p>}
        </div>
      );
    })
  );

  return (
    <FamilyBlock family="know" icon={Icons.bookmark} label={piece || (quran ? 'آية' : 'شعر')}>
      {body}
      {under && <p style={{ ...small, marginTop: 6 }}>{under}</p>}
      {words.length > 0 && (
        <div style={{ marginTop: 8, borderTop: '1px solid var(--b-rule)' }}>
          <p style={{ ...small, fontWeight: 700, padding: '6px 0' }}>معاني المفردات</p>
          {words.map((w, k) => (
            <div key={k} style={{ display: 'flex', gap: 12, padding: '4px 0', borderTop: '1px solid var(--b-rule)' }}>
              <span style={{ ...small, color: 'var(--b-ink)', fontWeight: 700, minWidth: 90 }}>{w.word}</span>
              <span style={small}>{w.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </FamilyBlock>
  );
}

/** A widget block, read-only: Nafeer cannot edit widgets yet (docs/contract.md §4). */
export function WidgetBlock({ block }) {
  let meta = block.metadata;
  if (typeof meta === 'string') { try { meta = JSON.parse(meta); } catch { meta = null; } }
  return (
    <PlainItem>
      <div dir="rtl" style={{ border: '1px dashed var(--b-rule-strong)', borderRadius: 8, padding: 12 }}>
        <p style={{ ...small, color: 'var(--b-ink)', fontWeight: 700 }}>تجربة: {meta?.title || meta?.widget || 'بدون اسم'}</p>
        {block.content && <p style={small}>{block.content}</p>}
        <p style={{ ...small, marginTop: 4 }}>{meta?.widget ? `${meta.widget} · ` : ''}التجارب ما بتتعدّل في نفير لسه.</p>
      </div>
    </PlainItem>
  );
}

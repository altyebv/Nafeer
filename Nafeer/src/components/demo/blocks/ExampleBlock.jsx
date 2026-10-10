'use client';
import { useState } from 'react';
import MathText from '@/components/editor/shared/MathText';
import { FamilyBlock, Icons } from './margin';

function toAr(n) {
  return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
}

// A worked example. Stepped examples reveal one step at a time and keep them on
// the page, so the whole chain of reasoning builds up.

export function ExampleBlock({ block }) {
  const { steps = [], caption, interactive = false, content } = block;
  return (
    <FamilyBlock family="do" icon={Icons.edit} label={caption || 'مثال محلول'}>
      {interactive && steps.length
        ? <Stepped steps={steps} />
        : <p className="b-read" style={{ margin: 0, font: '400 16px/29px var(--font-read)', color: 'var(--b-ink)' }}><MathText text={content} /></p>}
    </FamilyBlock>
  );
}

function StepNumber({ n, pending }) {
  return (
    <span style={{
      width: 26, height: 26, flexShrink: 0, borderRadius: 4, boxSizing: 'border-box',
      border: `1.5px solid ${pending ? 'var(--b-rule-strong)' : 'var(--b-ink)'}`,
      color: pending ? 'var(--b-ink2)' : 'var(--b-ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      font: '800 12px/18px var(--font-arabic)',
    }}>{toAr(n)}</span>
  );
}

function Stepped({ steps }) {
  const [revealed, setRevealed] = useState(1);
  const total = steps.length;
  return (
    <div>
      {steps.slice(0, revealed).map((text, i) => (
        <div key={i} style={{
          display: 'flex', gap: 12, padding: '10px 0', borderTop: '1px solid var(--b-rule)',
          animation: i === revealed - 1 && i > 0 ? 'bshStep .25s ease' : 'none',
        }}>
          <StepNumber n={i + 1} />
          <p className="b-read" style={{ margin: 0, flex: 1, font: '400 15px/27px var(--font-read)', color: 'var(--b-ink)' }}>
            <MathText text={text} />
          </p>
        </div>
      ))}
      <div style={{ borderTop: '1px solid var(--b-rule)' }} />
      {revealed < total && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 10 }}>
          <StepNumber n={revealed + 1} pending />
          <button
            onClick={() => setRevealed(r => r + 1)}
            style={{
              flex: 1, minHeight: 48, borderRadius: 10, background: 'transparent', cursor: 'pointer',
              border: '1.5px solid var(--b-ink)', color: 'var(--b-ink)', font: '700 14px/22px var(--font-arabic)',
            }}
          >
            الخطوة الجاية، {toAr(revealed + 1)} من {toAr(total)}
          </button>
        </div>
      )}
      <style>{`@keyframes bshStep { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}

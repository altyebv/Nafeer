'use client';
import { useState } from 'react';
import MathText from '@/components/editor/shared/MathText';
import { PlainItem, FamilyBlock, Icons } from './margin';
import { StudyTip } from './HighlightBox';

// ─────────────────────────────────────────────────────────────────────────────
// PrimitiveBlocks — leaf-level block renderers, set on the reader's margin page
// (see margin.jsx). Plain text keeps to the line; everything else belongs to a
// family and announces itself in the margin.
// ─────────────────────────────────────────────────────────────────────────────

export function HeadingBlock({ block }) {
  const { level = 2, content } = block;
  return (
    <PlainItem top={level <= 2 ? 16 : 10} bottom={2}>
      <h3 style={{
        margin: 0, color: 'var(--b-ink)',
        font: level <= 2 ? '700 16px/24px var(--font-arabic)' : '600 14px/22px var(--font-arabic)',
      }}>{content}</h3>
    </PlainItem>
  );
}

export function TextBlock({ block }) {
  return (
    <PlainItem>
      <p className="b-read" style={{ margin: 0, font: '400 16px/29px var(--font-read)', color: 'var(--b-ink)' }}>
        <MathText text={block.content} />
      </p>
    </PlainItem>
  );
}

export function TipBlock({ block }) {
  return <StudyTip><MathText text={block.content} /></StudyTip>;
}

// Arabic-symbol equations (ق = ك × ت). Distinct from FormulaBlock, which uses KaTeX.
export function ArabicFormulaBlock({ block }) {
  const { lhs, rhs, caption, legend = [] } = block;
  return (
    <FamilyBlock family="know" icon={Icons.functions} label={caption || 'قانون'}>
      <div dir="rtl" style={{ textAlign: 'center', padding: '10px 0', font: '700 32px/44px var(--font-read)', color: 'var(--b-ink)' }}>
        {lhs} = {rhs}
      </div>
      {legend.length > 0 && (
        <div style={{ borderTop: '1px solid var(--b-rule)' }}>
          {legend.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--b-rule)', alignItems: 'baseline' }}>
              <span style={{ minWidth: 24, textAlign: 'center', font: '700 15px/24px var(--font-read)', color: 'var(--b-ink)' }}>{item.sym}</span>
              <span style={{ font: '500 12px/18px var(--font-arabic)', color: 'var(--b-ink2)' }}>{item.meaning}</span>
            </div>
          ))}
        </div>
      )}
    </FamilyBlock>
  );
}

function Caption({ caption, description }) {
  if (!caption && !description) return null;
  return (
    <div style={{ paddingTop: 6 }}>
      {caption && <p style={{ margin: 0, font: '700 12px/18px var(--font-arabic)', color: 'var(--b-ink)' }}>{caption}</p>}
      {description && <p style={{ margin: 0, font: '500 12px/20px var(--font-arabic)', color: 'var(--b-ink2)' }}>{description}</p>}
    </div>
  );
}

const frame = {
  border: '1px solid var(--b-rule-strong)', borderRadius: 4, background: 'var(--b-surface)',
  overflow: 'hidden', position: 'relative',
};

// icon: 'diagram' (physics free-body) | 'portrait' (historical figure / place)
export function ImagePlaceholderBlock({ block }) {
  const { caption, description, color = '#4A90D9', icon = 'diagram' } = block;
  return (
    <FamilyBlock family="look" icon={Icons.image} label="شكل">
      <div style={{ ...frame, height: 116, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon === 'diagram' ? <DiagramIllustration color={color} /> : <PortraitIllustration color={color} />}
      </div>
      <Caption caption={caption} description={description} />
    </FamilyBlock>
  );
}

// Free-body diagram SVG
function DiagramIllustration({ color }) {
  return (
    <svg width="230" height="84" viewBox="0 0 230 84" fill="none">
      <rect x="88" y="24" width="54" height="36" rx="4" fill={`${color}18`} stroke={color} strokeWidth="1.5" />
      <text x="115" y="47" textAnchor="middle" fontSize="13" fill={color} fontWeight="700" fontFamily="var(--font-arabic)">م</text>
      <line x1="142" y1="42" x2="186" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <polygon points="186,38 196,42 186,46" fill={color} />
      <text x="162" y="34" textAnchor="middle" fontSize="10" fill={color} fontFamily="var(--font-arabic)">ق</text>
      <line x1="115" y1="60" x2="115" y2="76" stroke="var(--b-ink3)" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="111,76 115,83 119,76" fill="var(--b-ink3)" />
      <line x1="115" y1="24" x2="115" y2="8" stroke="var(--b-ink3)" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="111,8 115,1 119,8" fill="var(--b-ink3)" />
      <text x="200" y="57" fontSize="9" fill="var(--b-ink3)" fontFamily="var(--font-arabic)">← ت</text>
    </svg>
  );
}

// Portrait / location placeholder SVG
function PortraitIllustration({ color }) {
  return (
    <svg width="84" height="90" viewBox="0 0 84 90" fill="none">
      <rect x="4" y="4" width="76" height="82" rx="4" fill={`${color}12`} stroke={color} strokeWidth="1.5" />
      <rect x="10" y="10" width="64" height="70" rx="2" fill="none" stroke={`${color}35`} strokeWidth="0.75" strokeDasharray="4 3" />
      <circle cx="42" cy="36" r="15" fill={`${color}22`} />
      <path d="M20 78 Q20 60 42 57 Q64 60 64 78" fill={`${color}18`} />
    </svg>
  );
}

// A looped clip, drawn as a small physics scene: a ball under a steady force.
// Tapping pauses it.
export function GifPlaceholderBlock({ block }) {
  const { caption, description, color = '#4A90D9' } = block;
  const [playing, setPlaying] = useState(true);
  const state = playing ? 'running' : 'paused';
  return (
    <FamilyBlock family="look" icon={Icons.play} label="شكل متحرك">
      <div
        style={{ ...frame, height: 110, cursor: 'pointer' }}
        onClick={() => setPlaying(p => !p)}
        role="button"
        aria-label={playing ? 'أوقف الشكل المتحرك' : 'شغّل الشكل المتحرك'}
      >
        <div style={{ position: 'absolute', bottom: 28, left: 18, right: 18, height: 1, background: 'var(--b-rule-strong)' }} />
        <div style={{ position: 'absolute', bottom: 44, animation: 'gifArrowFollow 2.1s cubic-bezier(0.2,0,0.8,1) infinite', animationPlayState: state }}>
          <svg width="38" height="12" viewBox="0 0 38 12">
            <line x1="2" y1="6" x2="28" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
            <polygon points="28,2 37,6 28,10" fill={color} />
          </svg>
        </div>
        <div style={{
          position: 'absolute', bottom: 29, width: 18, height: 18, borderRadius: '50%', background: color,
          animation: 'gifBallAccel 2.1s cubic-bezier(0.2,0,0.8,1) infinite', animationPlayState: state,
        }} />
        <span style={{
          position: 'absolute', top: 7, right: 9, borderRadius: 4, padding: '1px 6px',
          background: 'var(--b-sunken)', color: 'var(--b-ink2)', border: '1px solid var(--b-rule)',
          font: '800 10px/16px var(--font-arabic)',
        }}>
          {playing ? 'GIF' : 'متوقّف'}
        </span>
      </div>
      <Caption caption={caption} description={description} />
      <style>{`
        @keyframes gifBallAccel {
          0%   { left: 18px; }
          85%  { left: calc(100% - 36px); }
          100% { left: calc(100% - 36px); opacity: 0; }
        }
        @keyframes gifArrowFollow {
          0%   { left: 22px; opacity: 1; }
          60%  { opacity: 0.6; }
          80%  { opacity: 0; left: calc(100% - 70px); }
          100% { opacity: 0; left: calc(100% - 70px); }
        }
      `}</style>
    </FamilyBlock>
  );
}

// A table drawn as it would be ruled in a notebook: an ink rule under the
// headings and a hairline under each row, with no cell borders or fills.
export function TableBlock({ block }) {
  const { caption, headers = [], rows = [] } = block;
  const cols = headers.length || rows[0]?.length || 1;
  const scrolls = cols > 4;
  const cell = { padding: '7px 0 7px 8px', textAlign: 'right', verticalAlign: 'top', minWidth: scrolls ? 104 : undefined };
  return (
    <FamilyBlock family="look" icon={Icons.table} label={caption || 'جدول'}>
      <div style={{ overflowX: scrolls ? 'auto' : 'visible' }}>
        <table style={{ width: scrolls ? 'auto' : '100%', borderCollapse: 'collapse' }}>
          {headers.length > 0 && (
            <thead>
              <tr style={{ borderBottom: '2px solid var(--b-ink)' }}>
                {headers.map((h, i) => (
                  <th key={i} style={{ ...cell, font: '800 12px/20px var(--font-arabic)', color: 'var(--b-ink)' }}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} style={{ borderBottom: '1px solid var(--b-rule)' }}>
                {row.map((c, ci) => (
                  <td key={ci} className="b-read" style={{ ...cell, font: '400 14px/24px var(--font-read)', color: 'var(--b-ink)' }}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FamilyBlock>
  );
}

'use client';
import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// PrimitiveBlocks — leaf-level block renderers
// All blocks are RTL-aware and use CSS variables for theming.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// HeadingBlock
// ─────────────────────────────────────────────────────────────────────────────
export function HeadingBlock({ block }) {
  const { level = 2, content } = block;

  const sizeClass = {
    1: 'text-2xl sm:text-3xl',
    2: 'text-xl sm:text-2xl',
    3: 'text-lg sm:text-xl',
    4: 'text-base sm:text-lg',
  }[level] || 'text-xl';

  const topPadding = level === 1 ? 'pt-6' : level === 2 ? 'pt-5' : 'pt-4';

  return (
    <div className={`px-4 pb-2 ${topPadding}`} dir="rtl">
      <p
        className={`font-arabic font-bold leading-snug ${sizeClass}`}
        style={{ color: 'var(--text-primary)' }}
      >
        {content}
      </p>
      {level === 1 && (
        <div
          className="mt-2 h-0.5 w-10 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TextBlock
// ─────────────────────────────────────────────────────────────────────────────
export function TextBlock({ block }) {
  return (
    <div className="px-4 py-2" dir="rtl">
      <p
        className="font-arabic text-sm sm:text-base leading-loose"
        style={{ color: 'var(--text-secondary)' }}
      >
        {block.content}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TipBlock — lightbulb callout
// ─────────────────────────────────────────────────────────────────────────────
export function TipBlock({ block }) {
  return (
    <div
      className="mx-4 my-2 rounded-xl p-4 flex gap-3"
      dir="rtl"
      style={{
        background: 'rgba(154,120,72,0.12)',
        border:     '1px solid rgba(154,120,72,0.25)',
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a7848" strokeWidth="1.8">
          <path d="M9 21h6M12 3a6 6 0 0 1 6 6c0 2.5-1.5 4.5-3 6H9c-1.5-1.5-3-3.5-3-6a6 6 0 0 1 6-6z"/>
          <path d="M9 17v-1a3 3 0 0 1 6 0v1"/>
        </svg>
      </div>
      <div>
        <p className="font-arabic text-xs font-bold mb-1" style={{ color: '#9a7848' }}>نصيحة</p>
        <p className="font-arabic text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
          {block.content}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ArabicFormulaBlock — Arabic-symbol equations (ق = ك × ت)
// Distinct from FormulaBlock which uses KaTeX for LaTeX.
// ─────────────────────────────────────────────────────────────────────────────
export function ArabicFormulaBlock({ block }) {
  const { lhs, rhs, caption, legend = [] } = block;

  return (
    <div className="mx-4 my-3" dir="rtl">
      {caption && (
        <p
          className="font-arabic text-xs text-center mb-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {caption}
        </p>
      )}

      <div
        className="rounded-xl p-4"
        style={{
          background: 'rgba(212,137,30,0.08)',
          border:     '1px solid rgba(212,137,30,0.22)',
        }}
      >
        {/* Formula */}
        <div className="text-center mb-3">
          <span
            style={{
              fontSize:      32,
              fontWeight:    700,
              letterSpacing: '0.06em',
              color:         'var(--accent)',
              fontFamily:    'var(--font-mono, monospace)',
              direction:     'rtl',
              display:       'inline-block',
            }}
          >
            {lhs} = {rhs}
          </span>
        </div>

        {/* Legend */}
        {legend.length > 0 && (
          <div
            className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center pt-2.5"
            style={{ borderTop: '1px solid rgba(212,137,30,0.18)' }}
          >
            {legend.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span
                  style={{
                    fontSize:   14,
                    fontWeight: 700,
                    color:      'var(--accent)',
                    fontFamily: 'var(--font-mono, monospace)',
                    minWidth:   '1.2em',
                    textAlign:  'center',
                  }}
                >
                  {item.sym}
                </span>
                <span
                  style={{
                    fontSize:   11,
                    color:      'var(--text-muted)',
                    fontFamily: 'var(--font-arabic, inherit)',
                  }}
                >
                  = {item.meaning}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ImagePlaceholderBlock — styled placeholder in place of a real image.
// icon: 'diagram' (physics free-body) | 'portrait' (historical figure / place)
// ─────────────────────────────────────────────────────────────────────────────
export function ImagePlaceholderBlock({ block }) {
  const { caption, description, color = '#4A90D9', icon = 'diagram' } = block;

  return (
    <div className="mx-4 my-2" dir="rtl">
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}22` }}>
        {/* Visual area */}
        <div
          className="flex items-center justify-center relative"
          style={{ height: 116, background: `${color}07` }}
        >
          {icon === 'diagram'
            ? <DiagramIllustration color={color} />
            : <PortraitIllustration color={color} />}

          {/* «صورة» badge */}
          <span style={{
            position:   'absolute', top: 7, right: 9,
            background: `${color}22`, color, borderRadius: 6, padding: '2px 8px',
            fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-arabic, inherit)',
          }}>
            صورة
          </span>
        </div>

        {/* Caption area */}
        {(caption || description) && (
          <div className="px-3 py-2.5" style={{ background: `${color}06` }}>
            {caption && (
              <p className="font-arabic text-xs font-bold mb-0.5" style={{ color }}>{caption}</p>
            )}
            {description && (
              <p className="font-arabic text-xs leading-loose" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Free-body diagram SVG
function DiagramIllustration({ color }) {
  return (
    <svg width="230" height="84" viewBox="0 0 230 84" fill="none">
      {/* Object box */}
      <rect x="88" y="24" width="54" height="36" rx="5"
        fill={`${color}18`} stroke={color} strokeWidth="1.5" />
      <text x="115" y="47" textAnchor="middle" fontSize="13" fill={color} fontWeight="700"
        fontFamily="monospace">م</text>

      {/* Applied force → right */}
      <line x1="142" y1="42" x2="186" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <polygon points="186,38 196,42 186,46" fill={color}/>
      <text x="162" y="34" textAnchor="middle" fontSize="10" fill={color}
        fontFamily="var(--font-arabic, inherit)">ق</text>

      {/* Weight ↓ */}
      <line x1="115" y1="60" x2="115" y2="76" stroke="rgba(150,150,150,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <polygon points="111,76 115,83 119,76" fill="rgba(150,150,150,0.55)"/>

      {/* Normal force ↑ */}
      <line x1="115" y1="24" x2="115" y2="8" stroke="rgba(150,150,150,0.55)" strokeWidth="1.5" strokeLinecap="round"/>
      <polygon points="111,8 115,1 119,8" fill="rgba(150,150,150,0.55)"/>

      {/* Acceleration label */}
      <text x="200" y="57" fontSize="9" fill="rgba(150,150,150,0.65)"
        fontFamily="var(--font-arabic, inherit)">← ت</text>
    </svg>
  );
}

// Portrait / location placeholder SVG
function PortraitIllustration({ color }) {
  return (
    <svg width="84" height="90" viewBox="0 0 84 90" fill="none">
      <rect x="4" y="4" width="76" height="82" rx="7"
        fill={`${color}12`} stroke={color} strokeWidth="1.5"/>
      <rect x="10" y="10" width="64" height="70" rx="4"
        fill="none" stroke={`${color}35`} strokeWidth="0.75" strokeDasharray="4 3"/>
      {/* Person silhouette */}
      <circle cx="42" cy="36" r="15" fill={`${color}22`}/>
      <path d="M20 78 Q20 60 42 57 Q64 60 64 78" fill={`${color}18`}/>
      {/* Corner ornaments */}
      <rect x="4"  y="4"  width="12" height="3" fill={color} rx="1"/>
      <rect x="4"  y="4"  width="3"  height="12" fill={color} rx="1"/>
      <rect x="68" y="4"  width="12" height="3" fill={color} rx="1"/>
      <rect x="77" y="4"  width="3"  height="12" fill={color} rx="1"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GifPlaceholderBlock — animated placeholder suggesting a real GIF/video clip
//
// Shows a multi-layer animation:
//   1. Looping scan line shimmer (top to bottom) to suggest video buffering
//   2. Physics-relevant animated element (ball accelerating under force)
//   3. Playback indicator with pulsing dot
// ─────────────────────────────────────────────────────────────────────────────
export function GifPlaceholderBlock({ block }) {
  const { caption, description, color = '#4A90D9' } = block;
  const [playing, setPlaying] = useState(true);

  return (
    <div className="mx-4 my-2" dir="rtl">
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${color}28` }}>
        {/* Animation area */}
        <div
          className="relative"
          style={{ height: 110, background: 'rgba(0,0,0,0.22)', overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => setPlaying(p => !p)}
        >
          {/* Scan-line shimmer overlay */}
          <div style={{
            position:   'absolute',
            inset:      0,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 3px,
              rgba(255,255,255,0.015) 3px,
              rgba(255,255,255,0.015) 4px
            )`,
            pointerEvents: 'none',
            zIndex: 2,
          }} />

          {/* Moving scan highlight */}
          {playing && (
            <div style={{
              position:   'absolute',
              left:       0,
              right:      0,
              height:     24,
              background: `linear-gradient(transparent, rgba(255,255,255,0.04), transparent)`,
              animation:  'gifScan 2.2s linear infinite',
              zIndex:     3,
              pointerEvents: 'none',
            }} />
          )}

          {/* Ground line */}
          <div style={{
            position:  'absolute',
            bottom:    28,
            left:      18,
            right:     18,
            height:    1,
            background: `${color}30`,
            borderRadius: 1,
          }} />

          {/* Animated physics ball */}
          {playing && (
            <>
              {/* Force arrow */}
              <div style={{
                position:  'absolute',
                bottom:    44,
                animation: 'gifArrowFollow 2.1s cubic-bezier(0.2,0,0.8,1) infinite',
                zIndex:    4,
              }}>
                <svg width="38" height="12" viewBox="0 0 38 12">
                  <line x1="2" y1="6" x2="28" y2="6" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
                  <polygon points="28,2 37,6 28,10" fill={color}/>
                </svg>
              </div>
              {/* Ball */}
              <div style={{
                position:     'absolute',
                bottom:       29,
                width:        18,
                height:       18,
                borderRadius: '50%',
                background:   `radial-gradient(circle at 35% 35%, ${color}ee, ${color}88)`,
                boxShadow:    `0 0 12px ${color}55, 0 2px 4px rgba(0,0,0,0.4)`,
                animation:    playing ? 'gifBallAccel 2.1s cubic-bezier(0.2,0,0.8,1) infinite' : 'none',
                zIndex:       4,
              }} />
              {/* Motion blur trail */}
              {[0.18, 0.10, 0.05].map((op, i) => (
                <div key={i} style={{
                  position:     'absolute',
                  bottom:       33,
                  width:        14 - i*3,
                  height:       10 - i*2,
                  borderRadius: '50%',
                  background:   color,
                  opacity:      op,
                  animation:    `gifTrail${i} 2.1s cubic-bezier(0.2,0,0.8,1) infinite`,
                  zIndex:       3,
                }} />
              ))}
            </>
          )}

          {/* GIF badge + play state */}
          <div style={{
            position:   'absolute', top: 7, right: 9,
            display:    'flex', alignItems: 'center', gap: 5,
            zIndex: 5,
          }}>
            {/* Pulsing play indicator */}
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: playing ? '#4CAF50' : 'rgba(255,255,255,0.3)',
              boxShadow:  playing ? '0 0 6px #4CAF5088' : 'none',
              animation:  playing ? 'gifDotPulse 1.4s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }} />
            <span style={{
              background: 'rgba(0,0,0,0.60)', backdropFilter: 'blur(4px)',
              borderRadius: 5, padding: '2px 7px',
              fontSize: 10, fontWeight: 800, color: '#fff', letterSpacing: '0.06em',
            }}>
              GIF
            </span>
          </div>

          {/* Paused overlay */}
          {!playing && (
            <div style={{
              position:       'absolute', inset: 0, zIndex: 5,
              display:        'flex', alignItems: 'center', justifyContent: 'center',
              background:     'rgba(0,0,0,0.35)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                border:     '1.5px solid rgba(255,255,255,0.25)',
                display:    'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                  <polygon points="0,0 10,6 0,12"/>
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Caption */}
        {(caption || description) && (
          <div className="px-3 py-2.5" style={{ background: `${color}06` }}>
            {caption && (
              <p className="font-arabic text-xs font-bold mb-0.5" style={{ color }}>{caption}</p>
            )}
            {description && (
              <p className="font-arabic text-xs leading-loose" style={{ color: 'var(--text-muted)' }}>
                {description}
              </p>
            )}
          </div>
        )}
      </div>

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
        @keyframes gifTrail0 {
          0%   { left: 14px;  opacity: 0.18; }
          80%  { left: calc(100% - 42px); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes gifTrail1 {
          0%   { left: 10px;  opacity: 0.10; }
          75%  { left: calc(100% - 46px); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes gifTrail2 {
          0%   { left: 6px;   opacity: 0.05; }
          70%  { left: calc(100% - 50px); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes gifScan {
          0%   { top: -24px; }
          100% { top: 110px; }
        }
        @keyframes gifDotPulse {
          0%, 100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TableBlock — structured data table, RTL-aware
// ─────────────────────────────────────────────────────────────────────────────
export function TableBlock({ block }) {
  const { caption, headers = [], rows = [] } = block;

  return (
    <div className="mx-4 my-2" dir="rtl">
      {caption && (
        <p
          className="font-arabic text-xs font-semibold mb-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {caption}
        </p>
      )}

      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          {headers.length > 0 && (
            <thead>
              <tr style={{ background: 'var(--bg-secondary)' }}>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      fontFamily: 'var(--font-arabic, inherit)',
                      fontSize:   11,
                      fontWeight: 700,
                      color:      'var(--text-primary)',
                      padding:    '9px 10px',
                      textAlign:  'center',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, ri) => (
              <tr
                key={ri}
                style={{
                  background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.025)',
                }}
              >
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    style={{
                      fontFamily:   'var(--font-arabic, inherit)',
                      fontSize:     12,
                      color:        'var(--text-secondary)',
                      padding:      '8px 10px',
                      textAlign:    'center',
                      borderBottom: ri < rows.length - 1
                        ? '1px solid var(--border-subtle)'
                        : 'none',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
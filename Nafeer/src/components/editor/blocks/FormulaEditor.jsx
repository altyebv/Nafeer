'use client';
import { useState, useRef, useCallback } from 'react';
import FormulaPreview from '@/components/editor/shared/FormulaPreview';

// ─── Palette ───────────────────────────────────────────────────────────────────
// Organised by subject area matching the Sudanese high-school curriculum.
// Each entry: { latex, label }  —  label shown in Arabic above the snippet.
const PALETTE = {
  'متغيرات عربية': [
    { latex: '{}^{2}س',                             label: 'س²'            },
    { latex: '{}^{3}ص',                             label: 'ص³'            },
    { latex: '{}^{n}س',                             label: 'سⁿ'            },
    { latex: '{}^{2}س + {}^{2}ص',                   label: 'س²+ص²'         },
    { latex: '{}^{2}(س + ص)',                        label: '(س+ص)²'        },
    { latex: '\\frac{س}{ص}',                        label: 'س÷ص'           },
    { latex: '\\sqrt{س}',                           label: '√س'            },
    { latex: '\\sqrt{{}^{2}س + {}^{2}ص}',           label: '√(س²+ص²)'      },
    { latex: 'س_{1} + س_{2}',                       label: 'س₁+س₂'         },
    { latex: '\\frac{{}^{2}س - {}^{2}ص}{س - ص}',   label: 'فرق المربعات'   },
  ],
  'كسور وجذور': [
    { latex: '\\frac{a}{b}',                       label: 'كسر'          },
    { latex: '\\sqrt{x}',                          label: 'جذر'          },
    { latex: '\\sqrt[n]{x}',                       label: 'جذر n'        },
    { latex: 'x^{n}',                              label: 'قوة'          },
    { latex: 'x_{n}',                              label: 'أسفل'         },
    { latex: 'x^{2}',                              label: 'مربع'         },
    { latex: 'x^{3}',                              label: 'مكعب'         },
    { latex: '\\dfrac{a}{b}',                      label: 'كسر كبير'     },
    { latex: '\\binom{n}{k}',                      label: 'تربيعات'      },
  ],
  'يونانية': [
    { latex: '\\alpha',    label: 'α'  },
    { latex: '\\beta',     label: 'β'  },
    { latex: '\\gamma',    label: 'γ'  },
    { latex: '\\delta',    label: 'δ'  },
    { latex: '\\theta',    label: 'θ'  },
    { latex: '\\lambda',   label: 'λ'  },
    { latex: '\\mu',       label: 'μ'  },
    { latex: '\\pi',       label: 'π'  },
    { latex: '\\sigma',    label: 'σ'  },
    { latex: '\\phi',      label: 'φ'  },
    { latex: '\\omega',    label: 'ω'  },
    { latex: '\\rho',      label: 'ρ'  },
    { latex: '\\epsilon',  label: 'ε'  },
    { latex: '\\Delta',    label: 'Δ'  },
    { latex: '\\Sigma',    label: 'Σ'  },
    { latex: '\\Omega',    label: 'Ω'  },
    { latex: '\\Gamma',    label: 'Γ'  },
    { latex: '\\Lambda',   label: 'Λ'  },
  ],
  'عوامل': [
    { latex: '\\pm',        label: '±'  },
    { latex: '\\times',     label: '×'  },
    { latex: '\\div',       label: '÷'  },
    { latex: '\\cdot',      label: '·'  },
    { latex: '\\leq',       label: '≤'  },
    { latex: '\\geq',       label: '≥'  },
    { latex: '\\neq',       label: '≠'  },
    { latex: '\\approx',    label: '≈'  },
    { latex: '\\infty',     label: '∞'  },
    { latex: '\\propto',    label: '∝'  },
    { latex: '\\equiv',     label: '≡'  },
    { latex: '\\to',        label: '→'  },
    { latex: '\\Rightarrow',label: '⇒'  },
    { latex: '\\in',        label: '∈'  },
    { latex: '\\notin',     label: '∉'  },
    { latex: '\\subset',    label: '⊂'  },
  ],
  'مثلثات': [
    { latex: '\\sin\\theta',                              label: 'sin'           },
    { latex: '\\cos\\theta',                              label: 'cos'           },
    { latex: '\\tan\\theta',                              label: 'tan'           },
    { latex: '\\cot\\theta',                              label: 'cot'           },
    { latex: '\\sin^{-1}x',                               label: 'arcsin'        },
    { latex: '\\sin^2\\theta + \\cos^2\\theta = 1',       label: 'هوية أساسية'   },
    { latex: '\\sin(A \\pm B)',                           label: 'sin(A±B)'      },
    { latex: '\\cos(A \\pm B)',                           label: 'cos(A±B)'      },
    { latex: '\\tan(A+B) = \\frac{\\tan A+\\tan B}{1-\\tan A\\tan B}', label: 'tan(A+B)' },
    { latex: '\\log_{a}{b}',                              label: 'log'           },
    { latex: '\\ln x',                                    label: 'ln'            },
    { latex: '\\log_{10} x',                              label: 'log₁₀'        },
  ],
  'تفاضل وتكامل': [
    { latex: '\\frac{dy}{dx}',                            label: 'مشتقة'         },
    { latex: '\\frac{d^2y}{dx^2}',                        label: 'مشتقة ثانية'   },
    { latex: '\\frac{\\partial f}{\\partial x}',          label: 'جزئية'         },
    { latex: '\\int f(x)\\,dx',                           label: 'تكامل'         },
    { latex: '\\int_{a}^{b} f(x)\\,dx',                   label: 'تكامل محدد'    },
    { latex: '\\lim_{x \\to 0}',                          label: 'حد عند 0'      },
    { latex: '\\lim_{x \\to \\infty}',                    label: 'حد عند ∞'      },
    { latex: '\\sum_{i=1}^{n} x_i',                       label: 'مجموع'         },
    { latex: '\\prod_{i=1}^{n} x_i',                      label: 'جداء'          },
    { latex: "f'(x)",                                     label: "f\u2032(x)"    },
  ],
  'فيزياء': [
    { latex: 'E = mc^2',                                  label: 'نسبية'          },
    { latex: 'F = ma',                                    label: 'نيوتن ٢'        },
    { latex: 'v = \\frac{d}{t}',                          label: 'سرعة'           },
    { latex: 'E_k = \\frac{1}{2}mv^2',                    label: 'طاقة حركية'     },
    { latex: 'E_p = mgh',                                 label: 'طاقة وضع'       },
    { latex: 'P = \\frac{W}{t}',                          label: 'قدرة'           },
    { latex: 'v^2 = u^2 + 2as',                           label: 'حركة منتظمة'    },
    { latex: 's = ut + \\frac{1}{2}at^2',                 label: 'إزاحة'          },
    { latex: 'F = \\frac{kq_1 q_2}{r^2}',                 label: 'كولوم'          },
    { latex: 'PV = nRT',                                  label: 'غاز مثالي'      },
    { latex: '\\vec{F}',                                  label: 'متجه'           },
    { latex: 'p = mv',                                    label: 'زخم'            },
    { latex: '\\rho = \\frac{m}{V}',                      label: 'كثافة'          },
    { latex: 'Q = mc\\Delta T',                           label: 'حرارة نوعية'    },
  ],
  'كيمياء': [
    { latex: '\\text{H}_2\\text{O}',                      label: 'H₂O'            },
    { latex: '\\text{CO}_2',                              label: 'CO₂'            },
    { latex: '\\text{H}_2\\text{SO}_4',                   label: 'H₂SO₄'         },
    { latex: '\\text{NaCl}',                              label: 'NaCl'           },
    { latex: '\\text{NH}_3',                              label: 'NH₃'            },
    { latex: '\\rightleftharpoons',                       label: 'توازن'          },
    { latex: '\\text{A} + \\text{B} \\to \\text{C}',     label: 'تفاعل'          },
    { latex: '^{12}_{6}\\text{C}',                        label: 'رمز نووي'       },
    { latex: '\\text{Ca}^{2+}',                           label: 'أيون موجب'      },
    { latex: '\\text{Cl}^{-}',                            label: 'أيون سالب'      },
    { latex: '[\\text{H}^+]',                             label: 'تركيز'          },
    { latex: 'K_a = \\frac{[\\text{H}^+][\\text{A}^-]}{[\\text{HA}]}', label: 'ثابت حمضي' },
  ],
};

const CATEGORIES = Object.keys(PALETTE);

// ─── FormulaEditor ─────────────────────────────────────────────────────────────
// Full authoring widget for FORMULA blocks.
//
// Props:
//   value             {string}   — block.content (the LaTeX string)
//   displayMode       {boolean}  — block.metadata.displayMode (true = inline, false = block)
//   onContentChange     {fn}     — called with the new LaTeX string when content changes
//   onDisplayModeChange {fn}     — called with boolean (true = inline) when mode toggles

export default function FormulaEditor({
  value               = '',
  displayMode         = false,
  onContentChange,
  onDisplayModeChange,
}) {
  const [activeTab,  setActiveTab]  = useState(CATEGORIES[0]);
  const [previewRtl, setPreviewRtl] = useState(true);   // RTL/LTR preview toggle
  const textareaRef  = useRef(null);
  // Tracks the last snippet inserted via palette so smart-delete can remove it whole.
  // Shape: { text: string, endPos: number } | null
  const lastSnippet  = useRef(null);

  const emitContent     = useCallback((latex) => onContentChange?.(latex),      [onContentChange]);
  const emitDisplayMode = useCallback((inline) => onDisplayModeChange?.(inline), [onDisplayModeChange]);

  // Insert snippet at cursor position (or replace selection)
  const insertSnippet = useCallback((snippet) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const next  = value.slice(0, start) + snippet + value.slice(end);
    // Record for smart-delete: cursor will land at start + snippet.length
    lastSnippet.current = { text: snippet, endPos: start + snippet.length };
    emitContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  }, [value, emitContent]);

  // Smart delete: if cursor sits right after a palette snippet and the text
  // still matches, delete the whole snippet.

  const handleKeyDown = useCallback((e) => {
    // Navigation / modifier keys — don't touch snippet tracking
    if (
      e.key.startsWith('Arrow') ||
      e.key === 'Home' || e.key === 'End' ||
      e.key === 'PageUp' || e.key === 'PageDown' ||
      e.key === 'Shift' || e.key === 'Control' ||
      e.key === 'Alt' || e.key === 'Meta' ||
      e.key === 'CapsLock' || e.key === 'Tab' ||
      e.ctrlKey || e.metaKey
    ) return;

    if (e.key !== 'Backspace') {
      // Printable or editing key — user is typing freely, stop tracking
      lastSnippet.current = null;
      return;
    }

    const el     = e.currentTarget;
    const cursor = el.selectionStart;
    const selEnd = el.selectionEnd;

    // If there's an active text selection, let default handle it
    if (cursor !== selEnd || !lastSnippet.current) {
      lastSnippet.current = null;
      return;
    }

    const { text, endPos } = lastSnippet.current;

    // Cursor must still sit right at the end of the snippet AND text must match
    if (cursor === endPos && value.slice(cursor - text.length, cursor) === text) {
      e.preventDefault();
      const deleteFrom = cursor - text.length;
      const next = value.slice(0, deleteFrom) + value.slice(cursor);
      lastSnippet.current = null;
      emitContent(next);
      requestAnimationFrame(() => {
        el.setSelectionRange(deleteFrom, deleteFrom);
      });
    } else {
      lastSnippet.current = null;
    }
  }, [value, emitContent]);

  // Paste always invalidates snippet tracking — new content is at unknown position
  const handlePaste = useCallback(() => {
    lastSnippet.current = null;
  }, []);

  const handleModeToggle = (inline) => emitDisplayMode(inline);
  const isInline = displayMode === true;

  return (
    <div className="rounded-xl border border-ink-800 bg-ink-950 overflow-hidden text-sm" dir="rtl">

      {/* ── Palette tabs ────────────────────────────────────────────────────── */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-ink-800 bg-ink-900">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={[
              'shrink-0 px-3 py-2 text-[11px] font-arabic transition-colors whitespace-nowrap',
              'border-b-2',
              activeTab === cat
                ? 'border-sand-600 text-sand-400'
                : 'border-transparent text-ink-600 hover:text-ink-400',
            ].join(' ')}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Palette chips ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1 px-2.5 py-2 border-b border-ink-800 bg-ink-900 min-h-[44px]">
        {PALETTE[activeTab].map((item, i) => (
          <button
            key={i}
            title={item.latex}
            onClick={() => insertSnippet(item.latex)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-ink-800 bg-ink-950 text-ink-500 hover:bg-amber-950/40 hover:border-amber-800/60 hover:text-amber-400 transition-all"
          >
            <span className="text-[10px] font-arabic text-ink-700">{item.label}</span>
            <span className="font-mono text-[11px] direction-ltr" dir="ltr">
              {item.latex.length > 18 ? item.latex.slice(0, 16) + '…' : item.latex}
            </span>
          </button>
        ))}
      </div>

      {/* ── Input + Preview ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2">
        {/* LaTeX textarea — DOM first = visual RIGHT in RTL */}
        <div className="p-3 border-l border-ink-800">
          <p className="text-[10px] text-ink-700 uppercase tracking-wide mb-1.5 font-arabic">LaTeX</p>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => emitContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            dir="ltr"
            rows={4}
            placeholder={`\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}`}
            className="w-full px-3 py-2 bg-ink-900 border border-ink-800 rounded-lg text-sand-100 font-mono text-[13px] leading-relaxed resize-none focus:ring-1 focus:ring-sand-700 focus:border-sand-700 focus:outline-none placeholder-ink-800 hover:border-ink-700 transition-colors"
            style={{ unicodeBidi: 'plaintext' }}
          />
        </div>

        {/* Live preview */}
        <div className="p-3 flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] text-ink-700 uppercase tracking-wide font-arabic">معاينة</p>
            <button
              onClick={() => setPreviewRtl(r => !r)}
              title={previewRtl ? 'عرض من اليسار لليمين' : 'عرض من اليمين لليسار'}
              className={[
                'flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono transition-all',
                previewRtl
                  ? 'bg-amber-950/30 border-amber-800/50 text-amber-500'
                  : 'bg-ink-900 border-ink-700 text-ink-500 hover:border-ink-600 hover:text-ink-400',
              ].join(' ')}
              dir="ltr"
            >
              {previewRtl ? 'RTL ←' : '→ LTR'}
            </button>
          </div>
          <div className={[
            'flex-1 rounded-lg border flex items-center justify-center min-h-[80px] px-4 py-3',
            value.trim()
              ? 'bg-ink-900 border-ink-800'
              : 'bg-ink-950 border-ink-900',
          ].join(' ')}>
            {value.trim() ? (
              <FormulaPreview
                latex={value}
                displayMode={!isInline}
                rtlMath={previewRtl}
                className="katex-preview"
              />
            ) : (
              <span className="text-ink-800 text-xs font-arabic">ستظهر المعادلة هنا</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Arabic superscript hint ──────────────────────────────────────────── */}
      <div className="px-3 py-2 border-t border-ink-800/60 bg-ink-900/40 flex items-start gap-2">
        <span className="text-amber-600/70 text-[11px] mt-px shrink-0">ℹ</span>
        <p className="text-[11px] text-ink-700 font-arabic leading-relaxed">
          للأس على يسار الحرف العربي استخدم{' '}
          <code className="font-mono text-ink-500 bg-ink-900 px-1 rounded" dir="ltr">{'{}^{2}س'}</code>
          {' '}بدلاً من{' '}
          <code className="font-mono text-ink-500 bg-ink-900 px-1 rounded" dir="ltr">{'س^{2}'}</code>
          {' '}— انظر تبويب «متغيرات عربية» للأنماط الجاهزة.
        </p>
      </div>

      {/* ── Footer — display mode toggle ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-ink-800 bg-ink-900">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink-600 font-arabic mr-1">نوع العرض:</span>
          <button
            onClick={() => handleModeToggle(false)}
            className={[
              'px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all',
              !isInline
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                : 'bg-transparent border-ink-800 text-ink-600 hover:border-ink-700 hover:text-ink-500',
            ].join(' ')}
            dir="ltr"
          >
            block $$...$$
          </button>
          <button
            onClick={() => handleModeToggle(true)}
            className={[
              'px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all',
              isInline
                ? 'bg-amber-950/40 border-amber-800/60 text-amber-400'
                : 'bg-transparent border-ink-800 text-ink-600 hover:border-ink-700 hover:text-ink-500',
            ].join(' ')}
            dir="ltr"
          >
            inline $...$
          </button>
        </div>
        <span className="text-[11px] text-ink-800 font-mono" dir="ltr">
          {value.length} chars
        </span>
      </div>

    </div>
  );
}
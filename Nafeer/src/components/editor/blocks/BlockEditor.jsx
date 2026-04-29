'use client';
import { useState } from 'react';
import { useDataStore }     from '@/store/dataStore';
import { useAtlasSync }     from '@/hooks/useAtlasSync';
import { useQuizStore }     from '@/store/quizStore';
import { BLOCK_TYPE_CONFIG, HIGHLIGHT_STYLES, HEADING_LEVELS, QUESTION_TYPE_CONFIG } from '@/shared/constants';
import { LessonTableEditor } from '@/components/editor/blocks/TableEditor';
import DeleteButton          from '@/components/editor/shared/DeleteButton';
import MediaPicker           from '@/components/editor/media/MediaPicker';
import ImageMarkerEditor     from '@/components/editor/media/ImageMarkerEditor';
import { sanitiseMarkers }   from '@/lib/markerUtils';
import FormulaEditor        from '@/components/editor/blocks/FormulaEditor';

// Demo block renderers — used for the preview (rendered) state
import { HeadingBlock, TextBlock, TipBlock, ArabicFormulaBlock, ImagePlaceholderBlock, GifPlaceholderBlock, TableBlock } from '@/components/demo/blocks/PrimitiveBlocks';
import { HighlightBox }  from '@/components/demo/blocks/HighlightBox';
import { FormulaBlock }  from '@/components/demo/blocks/FormulaBlock';
import { ExampleBlock }  from '@/components/demo/blocks/ExampleBlock';

// ─── Shared input style ───────────────────────────────────────────────────────
const ta =
  'w-full px-3 py-2.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm ' +
  'focus:ring-1 focus:ring-sand-600 focus:border-sand-700 focus:outline-none ' +
  'font-arabic placeholder-ink-800 resize-y transition-colors hover:border-ink-700';

// Highlight style colors
const HL_COLORS = {
  DEFINITION: { border: 'border-blue-700',  bg: 'bg-blue-950/60',   label: 'text-blue-400',  ring: 'bg-blue-900/50 text-blue-400 border-blue-800'  },
  WARNING:    { border: 'border-red-700',   bg: 'bg-red-950/60',    label: 'text-red-400',   ring: 'bg-red-900/50 text-red-400 border-red-800'     },
  NOTE:       { border: 'border-amber-700', bg: 'bg-amber-950/50',  label: 'text-amber-400', ring: 'bg-amber-900/50 text-amber-400 border-amber-800'},
  TIP:        { border: 'border-green-700', bg: 'bg-green-950/50',  label: 'text-green-400', ring: 'bg-green-900/50 text-green-400 border-green-800'},
};

// ─── BlockPreview ─────────────────────────────────────────────────────────────
// Renders the demo-style preview for a block. Returns null when block is empty.
function BlockPreview({ block }) {
  const b = { ...block, ...(block.metadata || {}) };

  switch (block.type) {
    case 'HEADING':
      if (!block.content?.trim()) return null;
      return <HeadingBlock block={{ ...b, level: block.metadata?.level ?? 2, content: block.content }} />;

    case 'TEXT':
      if (!block.content?.trim()) return null;
      return <TextBlock block={b} />;

    case 'TIP':
      if (!block.content?.trim()) return null;
      return <TipBlock block={b} />;

    case 'HIGHLIGHT_BOX': {
      if (!block.content?.trim()) return null;
      const style = block.metadata?.style ?? 'NOTE';
      return <HighlightBox block={{ ...b, style, title: block.metadata?.title }} />;
    }

    case 'FORMULA':
      return <FormulaBlock block={b} />;

    case 'ARABIC_FORMULA':
      return <ArabicFormulaBlock block={b} />;

    case 'EXAMPLE': {
      const interactive = block.metadata?.interactive ?? false;
      const steps       = block.metadata?.steps ?? [];
      if (!interactive && !block.content?.trim()) return null;
      if (interactive && steps.length === 0) return null;
      return (
        <ExampleBlock block={{
          ...b,
          interactive,
          steps,
          caption: block.metadata?.caption || 'مثال',
        }} />
      );
    }

    case 'IMAGE':
    case 'INTERACTIVE_IMAGE': {
      if (!block.content?.trim()) {
        return (
          <ImagePlaceholderBlock block={{
            caption:     block.caption || '',
            description: block.metadata?.alt || '',
            color:       '#4A90D9',
            icon:        'diagram',
          }} />
        );
      }
      return (
        <div className="mx-4 my-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={block.content}
            alt={block.metadata?.alt || block.caption || ''}
            className="w-full rounded-xl object-contain max-h-64"
          />
          {block.caption && (
            <p className="text-xs text-center font-arabic mt-1.5" style={{ color: 'var(--text-muted, #6b7280)' }}>
              {block.caption}
            </p>
          )}
        </div>
      );
    }

    case 'GIF': {
      if (!block.content?.trim()) {
        return (
          <GifPlaceholderBlock block={{
            caption:     block.caption || '',
            description: block.metadata?.alt || '',
            color:       '#9B59B6',
          }} />
        );
      }
      return (
        <div className="mx-4 my-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.content} alt={block.caption || ''} className="w-full rounded-xl" />
        </div>
      );
    }

    case 'TABLE': {
      let parsed = { headers: [], rows: [] };
      try { parsed = typeof block.content === 'string' ? JSON.parse(block.content) : block.content; } catch {}
      if (!parsed?.headers?.length && !parsed?.rows?.length) return null;
      return <TableBlock block={{ ...b, ...parsed }} />;
    }

    case 'LIST': {
      if (!block.content?.trim()) return null;
      const lines = block.content.split('\n').filter(Boolean);
      const isNum = (block.metadata?.style ?? 'BULLET') === 'NUMBERED';
      return (
        <div className="mx-4 my-2 space-y-1" dir="rtl">
          {lines.map((line, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: 'var(--accent, #d4891e)' }}>
                {isNum ? `${i + 1}.` : '•'}
              </span>
              <p className="font-arabic text-sm leading-loose" style={{ color: 'var(--text-secondary, #a1a1aa)' }}>
                {line}
              </p>
            </div>
          ))}
        </div>
      );
    }

    case 'QUOTE': {
      if (!block.content?.trim()) return null;
      return (
        <div className="mx-4 my-2 border-r-4 border-ink-600 pr-4" dir="rtl">
          <p className="font-arabic text-sm italic leading-loose text-ink-300">{block.content}</p>
        </div>
      );
    }

    case 'DIVIDER':
      return (
        <div className="mx-4 my-3 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink-800" />
          <span className="text-ink-700 text-xs font-mono select-none">— —</span>
          <div className="flex-1 h-px bg-ink-800" />
        </div>
      );

    default:
      return null;
  }
}

// ─── BlockEditor ─────────────────────────────────────────────────────────────
export default function BlockEditor({ block, subjectId }) {
  const { concepts, updateBlock, deleteBlock } = useDataStore();
  const { deleteBlock: atlasDeleteBlock }      = useAtlasSync();

  const config        = BLOCK_TYPE_CONFIG[block.type] || BLOCK_TYPE_CONFIG.TEXT;
  const linkedConcept = concepts.find((c) => c.id === block.conceptRef);

  // New blocks with no content start in edit mode; filled blocks start in preview
  const [isEditing, setIsEditing] = useState(() => {
    if (block.type === 'DIVIDER') return false;
    if (block.type === 'QUESTION') return !block.content;
    return !block.content?.trim();
  });

  const update    = (patch) => updateBlock(block.id, patch);
  const patchMeta = (patch) => update({ metadata: { ...(block.metadata || {}), ...patch } });

  const handleDelete = () => {
    deleteBlock(block.id);
    atlasDeleteBlock(block.id);
  };

  // Whether the block type renders a QUESTION editor inline (always shown)
  const isQuestion = block.type === 'QUESTION';
  const isDivider  = block.type === 'DIVIDER';

  const preview = (!isEditing && !isQuestion) ? <BlockPreview block={block} /> : null;

  return (
    <div className={`rounded-xl overflow-hidden group/block transition-all duration-200 ${
      isEditing
        ? 'border border-sand-700/50 shadow-lg shadow-black/20'
        : 'border border-ink-800/60 hover:border-ink-700/70'
    }`}>

      {/* ── Block header ──────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 px-3 py-2 border-b transition-colors ${
        isEditing
          ? 'bg-ink-900/80 border-sand-800/40'
          : 'bg-ink-900/40 border-ink-800/60'
      }`}>
        <span className="text-ink-700 cursor-grab text-sm select-none">⋮⋮</span>

        {/* Type badge */}
        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-ink-800/80 border border-ink-700 rounded-md text-xs text-ink-400">
          <span className="font-mono">{config.icon}</span>
          <span className="font-arabic">{config.label}</span>
        </span>

        {/* Concept ref — only visible in edit mode */}
        {isEditing && (
          <select
            value={block.conceptRef || ''}
            onChange={(e) => update({ conceptRef: e.target.value || null })}
            className="text-xs px-2 py-1 bg-ink-900 border border-ink-800 rounded-md text-ink-500 focus:ring-1 focus:ring-sand-700 focus:outline-none font-arabic max-w-[140px] hover:border-ink-700 transition-colors"
          >
            <option value="">ربط بمفهوم…</option>
            {concepts.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
          </select>
        )}

        {linkedConcept && (
          <span className="px-2 py-0.5 bg-sand-900/30 text-sand-600 text-xs rounded-full border border-sand-800/40 font-arabic">
            💡 {linkedConcept.titleAr}
          </span>
        )}

        <div className="flex-1" />

        {/* Edit / Done toggle — hidden for dividers; always visible when editing */}
        {!isDivider && !isQuestion && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs transition-all font-arabic ${
              isEditing
                ? 'bg-sand-900/40 text-sand-400 border border-sand-800/50 hover:bg-sand-800/30'
                : 'text-ink-600 hover:text-sand-400 hover:bg-ink-800/60 opacity-0 group-hover/block:opacity-100'
            }`}
          >
            {isEditing ? (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                تم
              </>
            ) : (
              <>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                تعديل
              </>
            )}
          </button>
        )}

        <DeleteButton onDelete={handleDelete} />
      </div>

      {/* ── Block body ────────────────────────────────────────────────────── */}
      {isEditing || isQuestion ? (
        /* EDIT MODE */
        <div className="p-3 bg-ink-950/20">
          <BlockBodyEditor block={block} update={update} patchMeta={patchMeta} ta={ta} concepts={concepts} subjectId={subjectId} />
        </div>
      ) : (
        /* PREVIEW MODE */
        <div
          className={`relative ${isDivider ? '' : 'cursor-pointer group/preview'}`}
          onClick={() => !isDivider && setIsEditing(true)}
        >
          {preview ? (
            <div className="py-1 select-none">
              {preview}
            </div>
          ) : (
            <div className="px-4 py-5 text-center">
              <p className="text-xs text-ink-700 font-arabic">
                {config.icon} فارغ — انقر للتعديل
              </p>
            </div>
          )}

          {/* Hover overlay — edit affordance */}
          {!isDivider && (
            <div className="absolute inset-0 opacity-0 group-hover/preview:opacity-100 pointer-events-none transition-opacity flex items-center justify-center rounded-b-xl"
              style={{ background: 'rgba(0,0,0,0.04)' }}
            >
              <span className="bg-ink-900/90 text-sand-400 text-xs font-arabic px-3 py-1.5 rounded-full border border-sand-800/40 flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                انقر للتعديل
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BlockBodyEditor ──────────────────────────────────────────────────────────
function BlockBodyEditor({ block, update, patchMeta, ta, subjectId }) {
  switch (block.type) {

    case 'TEXT':
      return (
        <textarea
          autoFocus
          value={block.content}
          onChange={(e) => update({ content: e.target.value })}
          className={`${ta} min-h-[100px]`}
          placeholder="اكتب النص هنا…"
        />
      );

    case 'HEADING': {
      const level = block.metadata?.level ?? 2;
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {Object.entries(HEADING_LEVELS).map(([l, cfg]) => (
              <button
                key={l}
                onClick={() => patchMeta({ level: Number(l) })}
                className={`px-3 py-1 text-xs rounded-md border font-mono transition-all
                  ${level === Number(l)
                    ? 'bg-sand-900/50 text-sand-400 border-sand-800/60'
                    : 'bg-ink-800 text-ink-600 border-ink-700 hover:text-ink-400'}`}
              >
                H{l}
              </button>
            ))}
            <span className="text-xs text-ink-700 font-arabic self-center mr-2">
              {HEADING_LEVELS[level]?.label}
            </span>
          </div>
          <input
            autoFocus
            type="text"
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            className={`w-full px-3 py-2.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 
              focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-800
              hover:border-ink-700 transition-colors
              ${level === 2 ? 'text-xl font-bold' : 'text-lg font-semibold'}`}
            placeholder={level === 2 ? 'عنوان رئيسي…' : 'عنوان فرعي…'}
          />
        </div>
      );
    }

    case 'IMAGE':
    case 'INTERACTIVE_IMAGE':
    case 'GIF':
      return <MediaBlockEditor block={block} update={update} subjectId={subjectId} ta={ta} />;

    case 'FORMULA':
      return (
        <FormulaEditor
          value={block.content}
          onChange={(v) => update({ content: v })}
        />
      );

    case 'HIGHLIGHT_BOX': {
      const style  = block.metadata?.style ?? 'NOTE';
      const colors = HL_COLORS[style] || HL_COLORS.NOTE;
      return (
        <div className="space-y-2.5">
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(HIGHLIGHT_STYLES).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => patchMeta({ style: key })}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all font-arabic
                  ${style === key
                    ? HL_COLORS[key].ring
                    : 'bg-ink-800 text-ink-600 border-ink-700 hover:border-ink-600 hover:text-ink-400'}`}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
              </button>
            ))}
          </div>
          <div className={`border-r-4 ${colors.border} ${colors.bg} rounded-lg p-3`}>
            <p className={`text-xs mb-2 font-arabic ${colors.label}`}>
              {HIGHLIGHT_STYLES[style]?.icon} {HIGHLIGHT_STYLES[style]?.label}
            </p>
            <textarea
              value={block.content}
              onChange={(e) => update({ content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-sand-200 text-sm font-arabic placeholder-ink-800"
              placeholder="النص المهم الذي تريد إبرازه…"
              autoFocus
            />
          </div>
        </div>
      );
    }

    case 'EXAMPLE': {
      const interactive = block.metadata?.interactive ?? false;
      const steps       = block.metadata?.steps ?? [];

      const setInteractive = (val) => {
        const newSteps = val && steps.length === 0 && block.content ? [block.content] : steps;
        patchMeta({ interactive: val, steps: newSteps });
      };
      const updateStep = (i, val) => { const next = [...steps]; next[i] = val; patchMeta({ steps: next }); };
      const addStep    = () => patchMeta({ steps: [...steps, ''] });
      const removeStep = (i) => patchMeta({ steps: steps.filter((_, j) => j !== i) });

      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-600 font-arabic">النوع:</span>
            <div className="flex rounded-lg border border-ink-800 overflow-hidden">
              <button onClick={() => setInteractive(false)}
                className={`px-3 py-1 text-xs font-arabic transition-colors ${!interactive ? 'bg-teal-900/50 text-teal-400' : 'bg-ink-900 text-ink-600 hover:text-ink-400'}`}>
                عادي
              </button>
              <button onClick={() => setInteractive(true)}
                className={`px-3 py-1 text-xs font-arabic transition-colors border-r border-ink-800 ${interactive ? 'bg-teal-900/50 text-teal-400' : 'bg-ink-900 text-ink-600 hover:text-ink-400'}`}>
                ⚡ تفاعلي
              </button>
            </div>
            {interactive && <span className="text-[11px] text-ink-700 font-arabic">كل خطوة تُكشف بنقرة</span>}
          </div>

          {!interactive ? (
            <div className="bg-teal-950/40 border-r-4 border-teal-700 rounded-lg p-3">
              <p className="text-xs text-teal-600 mb-2 font-arabic">✎ مثال</p>
              <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
                className="w-full bg-transparent border-none resize-y min-h-[88px] focus:outline-none text-teal-100 text-sm font-arabic placeholder-teal-900"
                placeholder="اكتب المثال كاملاً هنا…" autoFocus />
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-teal-900/50 border border-teal-800/50 text-teal-500 text-[10px] font-mono flex items-center justify-center shrink-0 mt-1.5">{i + 1}</div>
                  <textarea value={step} onChange={(e) => updateStep(i, e.target.value)}
                    className={`${ta} flex-1 min-h-[60px]`} placeholder={`الخطوة ${i + 1}…`} autoFocus />
                  <button onClick={() => removeStep(i)} className="text-ink-700 hover:text-red-500 transition-colors mt-2 text-sm">✕</button>
                </div>
              ))}
              <button onClick={addStep}
                className="w-full py-2 border border-dashed border-teal-900 rounded-lg text-teal-800 hover:text-teal-600 hover:border-teal-800 transition-colors text-xs font-arabic">
                + إضافة خطوة
              </button>
              {steps.length === 0 && <p className="text-xs text-ink-800 font-arabic text-center py-1">أضف خطوة للبدء</p>}
            </div>
          )}
        </div>
      );
    }

    case 'TIP':
      return (
        <div className="bg-ember-900/20 border-r-4 border-ember-500/70 rounded-lg p-3">
          <p className="text-xs text-ember-400 mb-2 font-arabic">◈ نصيحة</p>
          <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
            className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-200 text-sm font-arabic placeholder-ink-800"
            placeholder="اكتب النصيحة هنا…" />
        </div>
      );

    case 'LIST': {
      const style = block.metadata?.style ?? 'BULLET';
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[['BULLET','● نقطي'],['NUMBERED','١ مرقّم']].map(([key, lbl]) => (
              <button key={key} onClick={() => patchMeta({ style: key })}
                className={`px-3 py-1 text-xs rounded-md border font-arabic transition-all
                  ${style === key ? 'bg-sand-900/50 text-sand-400 border-sand-800/60' : 'bg-ink-800 text-ink-600 border-ink-700 hover:text-ink-400'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
            className={`${ta} min-h-[100px]`} placeholder="كل سطر = عنصر في القائمة…" autoFocus />
          <p className="text-[11px] text-ink-700 font-arabic">كل سطر سيظهر كعنصر منفصل</p>
        </div>
      );
    }

    case 'TABLE':
      return <LessonTableEditor value={block.content} onChange={(v) => update({ content: v })} />;

    case 'QUOTE':
      return (
        <div className="border-r-4 border-ink-700 pr-4">
          <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
            className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-300 text-sm italic font-arabic placeholder-ink-800"
            placeholder="الاقتباس…" autoFocus />
        </div>
      );

    case 'DIVIDER':
      return (
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 h-px bg-ink-800" />
          <span className="text-ink-700 text-xs font-mono select-none">— فاصل —</span>
          <div className="flex-1 h-px bg-ink-800" />
        </div>
      );

    case 'QUESTION':
      return <CheckpointBlockEditor block={block} update={update} />;

    default:
      return (
        <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
          className={`${ta} min-h-[100px]`} placeholder="المحتوى…" />
      );
  }
}

// ─── MediaBlockEditor ─────────────────────────────────────────────────────────
function MediaBlockEditor({ block, update, subjectId, ta }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const hasUrl        = Boolean(block.content?.trim());
  const isGif         = block.type === 'GIF';
  const isInteractive = block.type === 'INTERACTIVE_IMAGE';
  const markers       = sanitiseMarkers(block.metadata?.markers);

  const handleInteractiveToggle = (on) => {
    update({
      type: on ? 'INTERACTIVE_IMAGE' : 'IMAGE',
      metadata: { ...(block.metadata || {}), markers: on ? (block.metadata?.markers || []) : [] },
    });
  };

  const handleSelect = (item) => {
    update({ content: item.url, metadata: { ...(block.metadata || {}), mediaId: item.contentId, alt: item.alt || '' } });
    setPickerOpen(false);
  };

  const handleClear = () => {
    update({ type: isInteractive ? 'IMAGE' : block.type, content: '', metadata: { ...(block.metadata || {}), mediaId: null, alt: '', markers: [] } });
  };

  return (
    <>
      <div className="space-y-2">
        {hasUrl && (
          <div className={`relative group/thumb rounded-lg overflow-hidden border bg-ink-950 ${isInteractive ? 'border-sand-700/50' : 'border-ink-800'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.content} alt={block.metadata?.alt || ''} className="max-h-48 w-auto mx-auto object-contain py-2"
              onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <button onClick={handleClear} title="إزالة الصورة"
              className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover/thumb:opacity-100 text-xs">
              ✕
            </button>
            {isGif && <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-900/80 text-purple-300 text-[10px] font-bold rounded">GIF</span>}
            {isInteractive && markers.length > 0 && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-sand-900/80 text-sand-300 text-[10px] font-bold rounded border border-sand-700/60">✦ {markers.length}</span>
            )}
          </div>
        )}

        <button onClick={() => setPickerOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-ink-700 hover:border-sand-600 text-ink-500 hover:text-sand-400 text-sm font-arabic transition-all">
          <span className="font-mono text-base">⬜</span>
          <span>{hasUrl ? 'تغيير الصورة من المكتبة' : 'اختر صورة من المكتبة'}</span>
        </button>

        <input type="text" value={block.caption || ''} onChange={(e) => update({ caption: e.target.value })}
          className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-800 hover:border-ink-700 transition-colors"
          placeholder="وصف الصورة (اختياري)…" />

        {!isGif && (
          <div className={`rounded-lg border overflow-hidden transition-colors ${isInteractive ? 'border-sand-700/50' : 'border-ink-800'}`}>
            <div className={`flex items-center gap-3 px-3 py-2.5 ${isInteractive ? 'bg-sand-900/20 border-b border-sand-800/40' : 'bg-ink-900/40 hover:bg-ink-900/60 transition-colors'}`}>
              <span className={`font-mono text-sm ${isInteractive ? 'text-sand-500' : 'text-ink-600'}`}>✦</span>
              <span className={`text-xs font-arabic font-semibold flex-1 ${isInteractive ? 'text-sand-400' : 'text-ink-500'}`}>صورة تفاعلية</span>
              {isInteractive && <span className="text-[10px] text-sand-600 font-arabic">{markers.length > 0 ? `${markers.length} علامة` : 'لا علامات بعد'}</span>}
              <button onClick={() => handleInteractiveToggle(!isInteractive)}
                className={`relative w-10 h-5 rounded-full border transition-all shrink-0 ${isInteractive ? 'bg-sand-800/60 border-sand-600/60' : 'bg-ink-800 border-ink-700 hover:border-ink-600'}`}
                title={isInteractive ? 'تحويل إلى صورة عادية' : 'تفعيل العلامات التفاعلية'}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${isInteractive ? 'right-0.5 bg-sand-400' : 'left-0.5 bg-ink-600'}`} />
              </button>
            </div>
            {isInteractive && (
              <div className="p-3 bg-ink-950/30">
                {!hasUrl ? (
                  <p className="text-xs text-ink-700 font-arabic text-center py-3">اختر صورة أولاً لإضافة العلامات</p>
                ) : (
                  <ImageMarkerEditor imageUrl={block.content} markers={markers}
                    onChange={(next) => update({ metadata: { ...(block.metadata || {}), markers: next } })} />
                )}
              </div>
            )}
          </div>
        )}

        <details className="group/det">
          <summary className="text-[11px] text-ink-700 hover:text-ink-500 cursor-pointer select-none font-arabic transition-colors list-none flex items-center gap-1">
            <span className="font-mono text-[10px] transition-transform group-open/det:rotate-90">▶</span>
            أو أدخل رابطاً / مساراً يدوياً
          </summary>
          <div className="mt-1.5">
            <input type="text" value={block.content} onChange={(e) => update({ content: e.target.value })}
              className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-mono placeholder-ink-800 hover:border-ink-700 transition-colors"
              placeholder="https://… أو images/diagram.png" dir="ltr" />
            <p className="text-[10px] text-ink-800 mt-1 font-arabic">رابط Supabase أو مسار نسبي من مجلد assets في التطبيق</p>
          </div>
        </details>
      </div>

      {pickerOpen && (
        <MediaPicker type="IMAGE" subjectId={subjectId} onSelect={handleSelect} onClose={() => setPickerOpen(false)} />
      )}
    </>
  );
}

// ─── CheckpointBlockEditor ────────────────────────────────────────────────────
const CHECKPOINT_TYPES = ['MCQ', 'TRUE_FALSE'];

function CheckpointBlockEditor({ block, update }) {
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useDataStore();

  const linked = questions.find((q) => q.id === block.content && q.isCheckpoint);

  const [editing,      setEditing]      = useState(!block.content);
  const [type,         setType]         = useState('MCQ');
  const [textAr,       setTextAr]       = useState(linked?.textAr || '');
  const [explanation,  setExplanation]  = useState(linked?.explanation || '');
  const [mcqOptions,   setMcqOptions]   = useState(() => {
    if (linked?.options) { try { return JSON.parse(linked.options); } catch { /**/ } }
    return ['', '', '', ''];
  });
  const [correctIndex, setCorrectIndex] = useState(() => {
    if (linked?.type === 'MCQ' && linked?.correctAnswer && linked?.options) {
      try { const opts = JSON.parse(linked.options); const idx = opts.indexOf(linked.correctAnswer); return idx >= 0 ? idx : -1; } catch { return -1; }
    }
    return -1;
  });
  const [tfAnswer, setTfAnswer] = useState(linked?.correctAnswer || '');

  const resetForm = () => {
    setTextAr(linked?.textAr || '');
    setExplanation(linked?.explanation || '');
    setMcqOptions(linked?.options ? (() => { try { return JSON.parse(linked.options); } catch { return ['','','','']; } })() : ['','','','']);
    setCorrectIndex(-1);
    setTfAnswer(linked?.correctAnswer || '');
    setType(linked?.type || 'MCQ');
  };

  const canSubmit = textAr.trim().length > 0 &&
    (type !== 'MCQ' || correctIndex >= 0) &&
    (type !== 'TRUE_FALSE' || tfAnswer !== '');

  const handleSave = () => {
    let finalAnswer = tfAnswer;
    let finalOptions = null;
    if (type === 'MCQ') {
      const filtered = mcqOptions.filter((o) => o.trim());
      finalOptions   = JSON.stringify(filtered);
      finalAnswer    = correctIndex >= 0 ? mcqOptions[correctIndex] : '';
    }
    if (linked) {
      updateQuestion(linked.id, { type, textAr, explanation: explanation || null, correctAnswer: finalAnswer, options: finalOptions });
    } else {
      const newId = `q_cp_${block.id}`;
      addQuestion({ id: newId, type, textAr, correctAnswer: finalAnswer, options: finalOptions, explanation: explanation || null,
        lessonId: block._lessonId || null, unitId: block._unitId || null, sectionId: block.sectionId || null,
        isCheckpoint: true, difficulty: 1, points: 1, estimatedSeconds: 45, cognitiveLevel: 'RECALL', source: 'ORIGINAL', feedEligible: false, conceptIds: [] });
      update({ content: newId });
    }
    setEditing(false);
  };

  const handleUnlink = () => {
    if (linked) deleteQuestion(linked.id);
    update({ content: '' });
    setEditing(true);
    setTextAr(''); setExplanation(''); setMcqOptions(['','','','']); setCorrectIndex(-1); setTfAnswer('');
  };

  const inputCls = 'w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

  if (linked && !editing) {
    const cfg = QUESTION_TYPE_CONFIG[linked.type];
    return (
      <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-600">◎</span>
          <span className="text-xs font-arabic text-emerald-500 font-semibold">نقطة تحقق</span>
          {cfg && <span className="text-xs font-arabic text-ink-500 px-1.5 py-0.5 bg-ink-800/60 rounded border border-ink-700">{cfg.icon} {cfg.label}</span>}
          <div className="flex-1" />
          <button onClick={() => { resetForm(); setEditing(true); }} className="text-xs text-ink-500 hover:text-sand-400 px-2 py-1 rounded hover:bg-ink-800 transition-colors font-arabic">تعديل</button>
          <button onClick={handleUnlink} className="text-xs text-ink-600 hover:text-red-500 px-2 py-1 rounded hover:bg-red-950/30 transition-colors font-arabic">✕ حذف</button>
        </div>
        <p className="text-sm font-arabic text-ink-100 leading-relaxed">{linked.textAr}</p>
        {linked.type === 'MCQ' && linked.options && (() => {
          let opts = []; try { opts = JSON.parse(linked.options); } catch { return null; }
          return (
            <div className="space-y-1">
              {opts.map((opt, i) => (
                <div key={i} className={`flex items-center gap-2 text-sm font-arabic px-2 py-1 rounded-lg ${opt === linked.correctAnswer ? 'text-emerald-400 bg-emerald-900/20' : 'text-ink-400'}`}>
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${opt === linked.correctAnswer ? 'border-emerald-500 bg-emerald-500/30' : 'border-ink-600'}`} />
                  {opt}
                </div>
              ))}
            </div>
          );
        })()}
        {linked.type === 'TRUE_FALSE' && (
          <div className="flex gap-2">
            {[['true','✓ صح'],['false','✕ خطأ']].map(([v,l]) => (
              <span key={v} className={`px-3 py-1 rounded-lg border text-xs ${linked.correctAnswer === v ? (v === 'true' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-700' : 'bg-red-900/30 text-red-400 border-red-700') : 'bg-ink-800/30 text-ink-500 border-ink-700'}`}>{l}</span>
            ))}
          </div>
        )}
        {linked.explanation && <p className="text-xs text-ink-500 font-arabic border-t border-ink-800/50 pt-2">💡 {linked.explanation}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-900/30 bg-amber-950/10 p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-mono text-amber-600">◎</span>
        <span className="text-xs font-arabic text-amber-500 font-semibold">{linked ? 'تعديل نقطة التحقق' : 'إنشاء نقطة تحقق'}</span>
        <div className="flex-1" />
        {linked && <button onClick={() => { resetForm(); setEditing(false); }} className="text-xs text-ink-500 hover:text-ink-300 px-2 py-1 rounded hover:bg-ink-800 transition-colors font-arabic">إلغاء</button>}
      </div>

      <div className="flex gap-1.5">
        {CHECKPOINT_TYPES.map((t) => {
          const cfg = QUESTION_TYPE_CONFIG[t];
          return (
            <button key={t} onClick={() => setType(t)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border font-arabic transition-colors ${type === t ? 'bg-sand-900/50 text-sand-300 border-sand-700' : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}>
              <span className="font-mono">{cfg.icon}</span><span>{cfg.label}</span>
            </button>
          );
        })}
      </div>

      <textarea value={textAr} onChange={(e) => setTextAr(e.target.value)}
        className={`${inputCls} resize-none min-h-[68px]`} placeholder="اكتب السؤال هنا…" autoFocus />

      {type === 'MCQ' && (
        <div className="space-y-1.5">
          {mcqOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button onClick={() => setCorrectIndex(i)}
                className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${correctIndex === i ? 'border-emerald-500 bg-emerald-500/20' : 'border-ink-600 hover:border-ink-400'}`} />
              <input type="text" value={opt} onChange={(e) => { const n = [...mcqOptions]; n[i] = e.target.value; setMcqOptions(n); }}
                className="flex-1 px-2.5 py-1.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
                placeholder={`الخيار ${i + 1}`} />
            </div>
          ))}
        </div>
      )}

      {type === 'TRUE_FALSE' && (
        <div className="flex gap-2">
          {[['true','✓ صح'],['false','✕ خطأ']].map(([val,lbl]) => (
            <button key={val} onClick={() => setTfAnswer(val)}
              className={`flex-1 py-2 rounded-lg text-sm border font-arabic transition-colors ${tfAnswer === val ? (val === 'true' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-700' : 'bg-red-900/40 text-red-400 border-red-700') : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}>
              {lbl}
            </button>
          ))}
        </div>
      )}

      <input type="text" value={explanation} onChange={(e) => setExplanation(e.target.value)}
        className={inputCls} placeholder="تلميح يظهر عند الإجابة الخاطئة (اختياري)…" />

      <button onClick={handleSave} disabled={!canSubmit}
        className="w-full py-2 bg-amber-700/80 text-ink-950 rounded-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-semibold text-sm font-arabic">
        {linked ? 'حفظ التعديل' : 'إنشاء نقطة التحقق'}
      </button>
    </div>
  );
}
'use client';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { BLOCK_TYPE_CONFIG, HIGHLIGHT_STYLES, HEADING_LEVELS } from '@/shared/constants';
import CheckpointEditor from '@/components/editor/blocks/CheckpointEditor';
import { blockQuestionId } from '@/lib/checkpoints';
import { predictionIssue, stepPredict, stepText } from '@/lib/exampleSteps';
import { listRows } from '@/lib/listItems';
import ListItemsEditor from '@/components/editor/blocks/ListItemsEditor';
import { LessonTableEditor } from '@/components/editor/blocks/TableEditor';
import { useUndoStore } from '@/store/undoStore';
import MediaPicker from '@/components/editor/media/MediaPicker';
import { Textarea } from '@/components/ui';
import ImageMarkerEditor from '@/components/editor/media/ImageMarkerEditor';
import { sanitiseMarkers } from '@/lib/markerUtils';

// An interactive image's pins: Nafeer writes them as `markers`, Basheer's own
// content (restored from the app's files) as `pins`; the app reads either.
const blockMarkers = (meta) => sanitiseMarkers(meta?.markers?.length ? meta.markers : meta?.pins);
import { styleKey } from '@/lib/appExport';
import { MarkedImage } from '@/components/media/MarkerPin';
import FormulaEditor from '@/components/editor/blocks/FormulaEditor';
import MathTextarea from '@/components/editor/shared/MathTextarea';
import VerseEditor from '@/components/editor/blocks/VerseEditor';

// Demo renderers — the actual lesson appearance
import { HeadingBlock, TextBlock, TipBlock, ArabicFormulaBlock, ImagePlaceholderBlock, GifPlaceholderBlock, TableBlock } from '@/components/demo/blocks/PrimitiveBlocks';
import { HighlightBox } from '@/components/demo/blocks/HighlightBox';
import { FormulaBlock } from '@/components/demo/blocks/FormulaBlock';
import { ExampleBlock } from '@/components/demo/blocks/ExampleBlock';
import { VerseBlock, WidgetBlock } from '@/components/demo/blocks/VerseBlock';
import '@/components/demo/demo.css';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Trash2,
  Image as ImageIcon,
  Lightbulb,
  Pencil,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';

// ─── Shared textarea style ────────────────────────────────────────────────────
const ta =
  'w-full px-3 py-2.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm ' +
  'focus:ring-1 focus:ring-sand-600 focus:border-sand-700 focus:outline-none ' +
  'font-arabic placeholder-ink-600 resize-y transition-colors hover:border-ink-700';

const HL_COLORS = {
  DEFINITION: { border: 'border-blue-700', bg: 'bg-blue-950/60', label: 'text-blue-400', ring: 'bg-blue-900/50 text-blue-400 border-blue-800' },
  WARNING: { border: 'border-red-700', bg: 'bg-red-950/60', label: 'text-red-400', ring: 'bg-red-900/50 text-red-400 border-red-800' },
  NOTE: { border: 'border-amber-700', bg: 'bg-amber-950/50', label: 'text-amber-400', ring: 'bg-amber-900/50 text-amber-400 border-amber-800' },
  TIP: { border: 'border-green-700', bg: 'bg-green-950/50', label: 'text-green-400', ring: 'bg-green-900/50 text-green-400 border-green-800' },
};

// ─── DragHandle ───────────────────────────────────────────────────────────────
function DragHandle({ dragHandleProps, className = '' }) {
  return (
    <span
      className={`flex items-center justify-center w-6 h-6 rounded cursor-grab active:cursor-grabbing text-ink-500 hover:text-ink-400 hover:bg-ink-800/60 transition-colors select-none ${className}`}
      title="سحب لإعادة الترتيب"
      {...(dragHandleProps || {})}
    >
      <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
        <circle cx="2.5" cy="2.5" r="1.5" /><circle cx="7.5" cy="2.5" r="1.5" />
        <circle cx="2.5" cy="7" r="1.5" /><circle cx="7.5" cy="7" r="1.5" />
        <circle cx="2.5" cy="11.5" r="1.5" /><circle cx="7.5" cy="11.5" r="1.5" />
      </svg>
    </span>
  );
}

// ─── BlockPreview ─────────────────────────────────────────────────────────────
// Pure render — no wrappers, no borders. Looks exactly like the lesson.
function BlockPreview({ block }) {
  const b = { ...block, ...(block.metadata || {}) };

  switch (block.type) {
    case 'HEADING':
      if (!block.content?.trim()) return null;
      return <HeadingBlock block={{ ...b, level: block.metadata?.level ?? 2 }} />;

    case 'TEXT':
      if (!block.content?.trim()) return null;
      return <TextBlock block={b} />;

    case 'TIP':
      if (!block.content?.trim()) return null;
      return <TipBlock block={b} />;

    case 'HIGHLIGHT_BOX': {
      if (!block.content?.trim()) return null;
      return <HighlightBox block={{ ...b, style: styleKey(block.metadata?.style, 'NOTE'), title: block.metadata?.title }} />;
    }

    case 'FORMULA':
      return <FormulaBlock block={b} />;

    case 'ARABIC_FORMULA':
      return <ArabicFormulaBlock block={b} />;

    case 'EXAMPLE': {
      const interactive = block.metadata?.interactive ?? false;
      // A step is a string, or { text, predict } when the student predicts it first.
      const steps = (block.metadata?.steps ?? []).map((s) => (typeof s === 'string' ? s : s?.text ?? ''));
      if (!interactive && !block.content?.trim()) return null;
      if (interactive && steps.length === 0) return null;
      // The title is the block's caption, as Basheer reads it; empty shows «مثال محلول».
      return <ExampleBlock block={{ ...b, interactive, steps, caption: block.caption || '' }} />;
    }

    case 'INTERACTIVE_IMAGE':
      if (block.content?.trim()) {
        // Full width, no max-height: the pins are placed on the image's own box.
        return (
          <div className="mx-4 my-2">
            <MarkedImage src={block.content} alt={block.metadata?.alt || block.caption || ''}
              markers={blockMarkers(block.metadata)} caption={block.caption} />
          </div>
        );
      }
    // falls through — no image yet: same placeholder as a plain image
    case 'IMAGE':
      if (!block.content?.trim()) {
        return <ImagePlaceholderBlock block={{ caption: block.caption || '', description: block.metadata?.alt || '', color: '#4A90D9', icon: 'diagram' }} />;
      }
      return (
        <div className="mx-4 my-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.content} alt={block.metadata?.alt || block.caption || ''} className="w-full rounded-xl object-contain max-h-64" />
          {block.caption && <p className="text-xs text-center font-arabic mt-1.5" style={{ color: 'var(--text-muted, #6b7280)' }}>{block.caption}</p>}
        </div>
      );

    case 'GIF':
      if (!block.content?.trim()) {
        return <GifPlaceholderBlock block={{ caption: block.caption || '', description: block.metadata?.alt || '', color: '#9B59B6' }} />;
      }
      return (
        <div className="mx-4 my-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.content} alt={block.caption || ''} className="w-full rounded-xl" />
        </div>
      );

    case 'TABLE': {
      let parsed = { headers: [], rows: [] };
      try { parsed = typeof block.content === 'string' ? JSON.parse(block.content) : block.content; } catch { }
      if (!parsed?.headers?.length && !parsed?.rows?.length) return null;
      return <TableBlock block={{ ...b, ...parsed }} />;
    }

    case 'LIST': {
      // Items and sub-items as the app reads them (lib/listItems.js); a linked item is underlined.
      const rows = listRows(block.content, block.metadata);
      if (!rows.length) return null;
      const isNum = styleKey(block.metadata?.style, 'BULLET') === 'NUMBERED';
      let n = 0;
      let sub = 0;
      return (
        <div className="mx-4 my-2 space-y-1" dir="rtl">
          {rows.map((row, i) => {
            if (row.level === 0) { n += 1; sub = 0; } else sub += 1;
            const mark = isNum ? `${row.level === 0 ? n : sub}.` : row.level === 0 ? '•' : '◦';
            return (
              <div key={i} className={`flex items-start gap-2 ${row.level === 1 ? 'ps-5' : ''}`}>
                <span className="text-xs font-mono shrink-0 mt-0.5" style={{ color: 'var(--accent, #d4891e)' }}>{mark}</span>
                <p className={`font-arabic text-sm leading-loose ${row.conceptRef ? 'underline decoration-dotted underline-offset-4' : ''}`}
                  style={{ color: 'var(--text-secondary, #a1a1aa)' }}>{row.text}</p>
              </div>
            );
          })}
        </div>
      );
    }

    case 'QUOTE':
      if (!block.content?.trim()) return null;
      return (
        <div className="mx-4 my-2 border-r-4 border-ink-600 pr-4" dir="rtl">
          <p className="font-arabic text-sm italic leading-loose text-ink-300">{block.content}</p>
          {block.caption && <p className="font-arabic text-xs mt-1 text-ink-500">— {block.caption}</p>}
        </div>
      );

    case 'VERSE':
      return <VerseBlock block={block} />;

    case 'WIDGET':
      return <WidgetBlock block={block} />;

    case 'DIVIDER':
      return (
        <div className="mx-4 my-3 flex items-center gap-3">
          <div className="flex-1 h-px bg-ink-800" />
          <span className="text-ink-500 text-xs font-mono select-none">— —</span>
          <div className="flex-1 h-px bg-ink-800" />
        </div>
      );

    default:
      return null;
  }
}

// ─── BlockEditor ─────────────────────────────────────────────────────────────
// ─── BlockToolbar ─────────────────────────────────────────────────────────────
// Appears on hover or keyboard focus; stays on touch screens, which have no
// hover (DS2 step 4, EdBlockMenu board). Move, copy and delete in words-backed
// icons, with the block's type named first.
function BlockToolbar({ config, dragHandleProps, onEdit, canMoveUp, canMoveDown, onMove, onDuplicate, onDelete, concept }) {
  const btn = 'w-7 h-7 inline-flex items-center justify-center rounded-control text-fg-muted hover:text-fg hover:bg-hover disabled:opacity-30 disabled:cursor-not-allowed touch-target';
  return (
    <div className="absolute top-1 left-1 z-10 flex items-center gap-0.5 p-0.5 rounded-control bg-overlay border border-line shadow-overlay opacity-0 group-hover/block:opacity-100 group-focus-within/block:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity">
      <DragHandle dragHandleProps={dragHandleProps} />
      <span className="px-1.5 t-caption text-fg-subtle whitespace-nowrap">{config.label}</span>
      {concept && <span className="px-1.5 t-caption text-fg-accent whitespace-nowrap inline-flex items-center gap-1"><Lightbulb size={11} strokeWidth={1.8} />{concept.titleAr}</span>}
      {onEdit && <button type="button" onClick={onEdit} className={btn} aria-label="تعديل" title="تعديل"><Pencil size={13} /></button>}
      {onMove && <button type="button" onClick={() => onMove(-1)} disabled={!canMoveUp} className={btn} aria-label="انقل لأعلى" title="انقل لأعلى"><ArrowUp size={13} /></button>}
      {onMove && <button type="button" onClick={() => onMove(1)} disabled={!canMoveDown} className={btn} aria-label="انقل لأسفل" title="انقل لأسفل"><ArrowDown size={13} /></button>}
      {onDuplicate && <button type="button" onClick={onDuplicate} className={btn} aria-label="تكرار" title="تكرار"><Copy size={13} /></button>}
      <button type="button" onClick={onDelete} className={`${btn} hover:text-danger`} aria-label="حذف" title="حذف (يمكن التراجع)"><Trash2 size={13} /></button>
    </div>
  );
}

export default function BlockEditor({ block, subjectId, dragHandleProps, lessonId, unitId, sectionId, canMoveUp, canMoveDown, onMove, onDuplicate }) {
  const { concepts, updateBlock } = useDataStore(
    useShallow((s) => ({ concepts: s.concepts, updateBlock: s.updateBlock })),
  );

  const config = BLOCK_TYPE_CONFIG[block.type] || BLOCK_TYPE_CONFIG.TEXT;
  const linkedConcept = concepts.find((c) => c.id === block.conceptRef);
  const isQuestion = block.type === 'QUESTION';
  const isDivider = block.type === 'DIVIDER';

  // Empty blocks open in edit mode; filled blocks open in preview
  const [isEditing, setIsEditing] = useState(() => {
    if (isDivider) return false;
    if (isQuestion) return !block.content;
    return !block.content?.trim();
  });

  const update = (patch) => updateBlock(block.id, patch);
  const patchMeta = (patch) => update({ metadata: { ...(block.metadata || {}), ...patch } });

  // Gone at once, back with «تراجع» for a few seconds (store/undoStore.js).
  const handleDelete = () => {
    useUndoStore.getState().deleteBlock(block, `«${config.label}»`);
  };

  // ── QUESTION — a checkpoint: where the lesson asks its question ─────────────
  // No copy: two blocks naming one question would ask it once, at the first.
  if (isQuestion) {
    return (
      <div className="relative group/block">
        <BlockToolbar config={config} dragHandleProps={dragHandleProps} canMoveUp={canMoveUp} canMoveDown={canMoveDown}
          onMove={onMove} onDelete={handleDelete} />
        <CheckpointBlock block={block} update={update} subjectId={subjectId} lessonId={lessonId} unitId={unitId} sectionId={sectionId} />
      </div>
    );
  }

  // ── PREVIEW MODE ─────────────────────────────────────────────────────────────
  if (!isEditing) {
    const preview = <div className="bsh" style={{ background: 'var(--b-paper)', borderRadius: 10, overflow: 'hidden' }}><BlockPreview block={block} /></div>;

    return (
      <div className="relative group/block">

        <BlockToolbar config={config} dragHandleProps={dragHandleProps} concept={linkedConcept}
          onEdit={isDivider ? null : () => setIsEditing(true)} canMoveUp={canMoveUp} canMoveDown={canMoveDown}
          onMove={onMove} onDuplicate={onDuplicate} onDelete={handleDelete} />

        {/* Block content — click to edit (except dividers) */}
        <div
          className={isDivider ? undefined : 'cursor-pointer'}
          onClick={() => !isDivider && setIsEditing(true)}
        >
          {preview ?? (
            <div className="px-4 py-4 text-center">
              <span className="text-xs text-ink-500 font-arabic opacity-50">{config.icon} فارغ</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── EDIT MODE ─────────────────────────────────────────────────────────────────
  return (
    <div className="rounded-xl border border-sand-700/40 bg-ink-900/40 overflow-hidden shadow-md shadow-black/20">

      {/* Edit header — minimal */}
      <div className="flex items-center gap-2 px-3 py-2 bg-ink-800/40 border-b border-ink-800/60">
        <DragHandle dragHandleProps={dragHandleProps} />

        {/* Type label */}
        <span className="flex items-center gap-1.5 text-xs text-ink-500 font-arabic">
          <span className="font-mono">{config.icon}</span>
          {config.label}
        </span>

        {/* Concept ref selector */}
        <select
          value={block.conceptRef || ''}
          onChange={(e) => update({ conceptRef: e.target.value || null })}
          className="text-xs px-2 py-1 bg-ink-900 border border-ink-800 rounded-md text-ink-500 focus:ring-1 focus:ring-sand-700 focus:outline-none font-arabic max-w-[140px] hover:border-ink-700 transition-colors"
        >
          <option value="">ربط بمفهوم…</option>
          {concepts.map((c) => <option key={c.id} value={c.id}>{c.titleAr}</option>)}
        </select>

        {linkedConcept && (
          <span className="px-2 py-0.5 bg-sand-900/30 text-sand-600 text-xs rounded-full border border-sand-800/40 font-arabic">
            <Lightbulb size={12} strokeWidth={1.8} /> {linkedConcept.titleAr}
          </span>
        )}

        <div className="flex-1" />

        {/* Done — collapse back to preview (not shown for dividers) */}
        {!isDivider && (
          <button
            onClick={() => setIsEditing(false)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-sand-900/30 text-sand-400 border border-sand-800/40 hover:bg-sand-800/30 text-xs font-arabic transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            تم
          </button>
        )}

        <button type="button" onClick={handleDelete} aria-label="حذف" title="حذف (يمكن التراجع)"
          className="w-8 h-8 inline-flex items-center justify-center rounded-control text-fg-muted hover:text-danger hover:bg-hover touch-target"><Trash2 size={15} /></button>
      </div>

      {/* Editor body */}
      <div className="p-3">
        <BlockBodyEditor block={block} update={update} patchMeta={patchMeta} subjectId={subjectId} concepts={concepts} />
      </div>
    </div>
  );
}

// ─── CaptionField ─────────────────────────────────────────────────────────────
// A block's caption: the title of an example, table or formula, or who said a
// quotation. Basheer draws it as plain text, so it takes no $…$.
function CaptionField({ block, update, label, placeholder, hint }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="t-caption text-fg-muted">{label}</span>
      <input type="text" value={block.caption || ''} maxLength={120} placeholder={placeholder}
        onChange={(e) => update({ caption: e.target.value })}
        className="w-full h-9 px-3 rounded-control bg-sunken border border-line-strong text-fg text-sm font-arabic hover:border-line-accent focus:border-accent-hover focus:outline-none" />
      {hint && <span className="t-caption text-fg-subtle">{hint}</span>}
    </label>
  );
}

// ─── BlockBodyEditor ──────────────────────────────────────────────────────────
function BlockBodyEditor({ block, update, patchMeta, subjectId, concepts = [] }) {
  switch (block.type) {

    case 'TEXT':
      return (
        <MathTextarea autoFocus value={block.content} onChange={(v) => update({ content: v })}
          className={`${ta} min-h-[100px]`} placeholder="اكتب النص هنا…" />
      );

    case 'HEADING': {
      const level = block.metadata?.level ?? 2;
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {Object.entries(HEADING_LEVELS).map(([l, cfg]) => (
              <button key={l} onClick={() => patchMeta({ level: Number(l) })}
                className={`px-3 py-1 text-xs rounded-md border font-mono transition-all
                  ${level === Number(l) ? 'bg-sand-900/50 text-sand-400 border-sand-800/60' : 'bg-ink-800 text-ink-600 border-ink-700 hover:text-ink-400'}`}>
                H{l}
              </button>
            ))}
            <span className="text-xs text-ink-500 font-arabic self-center mr-2">{HEADING_LEVELS[level]?.label}</span>
          </div>
          <input autoFocus type="text" value={block.content} onChange={(e) => update({ content: e.target.value })}
            className={`w-full px-3 py-2.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-600 hover:border-ink-700 transition-colors ${level === 2 ? 'text-xl font-bold' : 'text-lg font-semibold'}`}
            placeholder={level === 2 ? 'عنوان رئيسي…' : 'عنوان فرعي…'} />
        </div>
      );
    }

    case 'IMAGE':
    case 'INTERACTIVE_IMAGE':
    case 'GIF':
      return <MediaBlockEditor block={block} update={update} subjectId={subjectId} />;

    case 'FORMULA':
      return (
        <div className="space-y-2.5">
          <CaptionField block={block} update={update} label="اسم القانون" placeholder="قانون نيوتن الثاني"
            hint="يظهر فوق المعادلة في التطبيق. إن تُرك فارغاً يظهر «قانون»." />
          <FormulaEditor value={block.content} onChange={(v) => update({ content: v })} autoFocus />
        </div>
      );

    case 'HIGHLIGHT_BOX': {
      const style = styleKey(block.metadata?.style, 'NOTE');
      const colors = HL_COLORS[style] || HL_COLORS.NOTE;
      return (
        <div className="space-y-2.5">
          <div className="flex gap-1.5 flex-wrap">
            {Object.entries(HIGHLIGHT_STYLES).map(([key, cfg]) => (
              <button key={key} onClick={() => patchMeta({ style: key })}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-all font-arabic
                  ${style === key ? HL_COLORS[key].ring : 'bg-ink-800 text-ink-600 border-ink-700 hover:border-ink-600 hover:text-ink-400'}`}>
                <span>{cfg.label}</span>
              </button>
            ))}
          </div>
          <div className={`border-r-4 ${colors.border} ${colors.bg} rounded-lg p-3`}>
            <p className={`text-xs mb-2 font-arabic ${colors.label}`}>{HIGHLIGHT_STYLES[style]?.icon} {HIGHLIGHT_STYLES[style]?.label}</p>
            <MathTextarea value={block.content} onChange={(v) => update({ content: v })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-sand-200 text-sm font-arabic placeholder-ink-600"
              placeholder="النص المهم الذي تريد إبرازه…" autoFocus />
          </div>
        </div>
      );
    }

    case 'EXAMPLE': {
      const interactive = block.metadata?.interactive ?? false;
      const steps = block.metadata?.steps ?? [];
      const setInteractive = (val) => {
        patchMeta({ interactive: val, steps: val && steps.length === 0 && block.content ? [block.content] : steps });
      };
      // A step is a plain string, or { text, predict: { choices, answer } } when Basheer
      // asks the student what comes next before showing it. choices[answer] is the
      // right one; the app shuffles them, so the right choice is always stored first.
      const setStep = (i, text, predict) => {
        const next = [...steps];
        next[i] = predict ? { text, predict } : text;
        patchMeta({ steps: next });
      };
      const updateStep = (i, val) => setStep(i, val, stepPredict(steps[i]));
      const togglePredict = (i) => setStep(
        i, stepText(steps[i]),
        stepPredict(steps[i]) ? null : { choices: ['', ''], answer: 0 },
      );
      const updateChoice = (i, c, val) => {
        const predict = stepPredict(steps[i]);
        const choices = [...predict.choices]; choices[c] = val;
        setStep(i, stepText(steps[i]), { ...predict, choices });
      };
      const addChoice = (i) => {
        const predict = stepPredict(steps[i]);
        setStep(i, stepText(steps[i]), { ...predict, choices: [...predict.choices, ''] });
      };
      const removeChoice = (i, c) => {
        const predict = stepPredict(steps[i]);
        setStep(i, stepText(steps[i]), { ...predict, choices: predict.choices.filter((_, j) => j !== c) });
      };
      const addStep = () => patchMeta({ steps: [...steps, ''] });
      const removeStep = (i) => patchMeta({ steps: steps.filter((_, j) => j !== i) });

      return (
        <div className="space-y-3">
          <CaptionField block={block} update={update} label="عنوان المثال" placeholder="مثال: حساب التسارع من القوة والكتلة"
            hint="يظهر فوق المثال في التطبيق. إن تُرك فارغاً يظهر «مثال محلول»." />
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-600 font-arabic">النوع:</span>
            <div className="flex rounded-lg border border-ink-800 overflow-hidden">
              <button onClick={() => setInteractive(false)} className={`px-3 py-1 text-xs font-arabic transition-colors ${!interactive ? 'bg-teal-900/50 text-teal-400' : 'bg-ink-900 text-ink-600 hover:text-ink-400'}`}>عادي</button>
              <button onClick={() => setInteractive(true)} className={`px-3 py-1 text-xs font-arabic transition-colors border-r border-ink-800 inline-flex items-center gap-1 ${interactive ? 'bg-teal-900/50 text-teal-400' : 'bg-ink-900 text-ink-600 hover:text-ink-400'}`}><Zap size={12} strokeWidth={1.9} /> تفاعلي</button>
            </div>
            {interactive && <span className="text-[11px] text-ink-500 font-arabic">كل خطوة تُكشف بنقرة</span>}
          </div>
          {!interactive ? (
            <div className="bg-teal-950/40 border-r-4 border-teal-700 rounded-lg p-3">
              <p className="text-xs text-teal-600 mb-2 font-arabic inline-flex items-center gap-1"><Pencil size={12} strokeWidth={1.9} /> مثال</p>
              <MathTextarea value={block.content} onChange={(v) => update({ content: v })}
                className="w-full bg-transparent border-none resize-y min-h-[88px] focus:outline-none text-teal-100 text-sm font-arabic placeholder-teal-900"
                placeholder="اكتب المثال كاملاً هنا…" autoFocus />
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-teal-900/50 border border-teal-800/50 text-teal-500 text-[10px] font-mono flex items-center justify-center shrink-0 mt-1.5">{i + 1}</div>
                  <div className="flex-1 space-y-1.5">
                    <MathTextarea value={stepText(step)} onChange={(v) => updateStep(i, v)} className={`${ta} min-h-[60px]`} placeholder={`الخطوة ${i + 1}…`} autoFocus />
                    {/* The first step is always shown, so there is nothing to predict before it. */}
                    {i === 0 && stepPredict(step) && (
                      <p className="flex items-center gap-2 t-caption text-warn">
                        <span className="flex-1">{predictionIssue(0, stepPredict(step))}</span>
                        <button type="button" onClick={() => togglePredict(0)} className="underline touch-target">احذف السؤال</button>
                      </p>
                    )}
                    {i > 0 && (
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-ink-500 font-arabic cursor-pointer">
                        <input type="checkbox" checked={!!stepPredict(step)} onChange={() => togglePredict(i)} />
                        اسأل الطالب «الخطوة الجاية شنو؟» قبل كشفها
                      </label>
                    )}
                    {i > 0 && stepPredict(step) && (
                      <div className="space-y-1.5 border-r-2 border-teal-900 pr-2">
                        {stepPredict(step).choices.map((choice, c) => (
                          <div key={c} className="flex gap-1.5 items-center">
                            <span className={`text-[10px] font-arabic shrink-0 w-10 ${c === 0 ? 'text-teal-500' : 'text-ink-500'}`}>{c === 0 ? 'الصحيح' : 'خاطئ'}</span>
                            <input type="text" value={choice} onChange={(e) => updateChoice(i, c, e.target.value)}
                              className={`${ta} flex-1`} placeholder={c === 0 ? 'وصف قصير للخطوة الصحيحة…' : 'خطوة تبدو معقولة لكنها خاطئة…'} />
                            {c > 1 && (
                              <button onClick={() => removeChoice(i, c)} aria-label="حذف الاختيار" className="text-ink-500 hover:text-red-500 transition-colors"><X size={12} strokeWidth={1.9} /></button>
                            )}
                          </div>
                        ))}
                        {stepPredict(step).choices.length < 4 && (
                          <button onClick={() => addChoice(i)} className="text-[11px] text-teal-700 hover:text-teal-500 font-arabic">+ اختيار خاطئ آخر</button>
                        )}
                        {predictionIssue(i, stepPredict(step)) && (
                          <p className="t-caption text-warn" role="status">{predictionIssue(i, stepPredict(step))}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeStep(i)} aria-label="حذف الخطوة" className="text-ink-500 hover:text-red-500 transition-colors mt-2 text-sm"><X size={14} strokeWidth={1.9} /></button>
                </div>
              ))}
              <button onClick={addStep} className="w-full py-2 border border-dashed border-teal-900 rounded-lg text-teal-800 hover:text-teal-600 hover:border-teal-800 transition-colors text-xs font-arabic">+ إضافة خطوة</button>
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
          <MathTextarea value={block.content} onChange={(v) => update({ content: v })}
            className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-200 text-sm font-arabic placeholder-ink-600"
            placeholder="اكتب النصيحة هنا…" />
        </div>
      );

    case 'LIST': {
      const style = styleKey(block.metadata?.style, 'BULLET');
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[['BULLET', 'نقطي'], ['NUMBERED', '1 مرقّم']].map(([key, lbl]) => (
              <button key={key} onClick={() => patchMeta({ style: key })}
                className={`px-3 py-1 text-xs rounded-md border font-arabic transition-all ${style === key ? 'bg-sand-900/50 text-sand-400 border-sand-800/60' : 'bg-ink-800 text-ink-600 border-ink-700 hover:text-ink-400'}`}>
                {lbl}
              </button>
            ))}
          </div>
          <ListItemsEditor block={block} update={update} concepts={concepts} />
        </div>
      );
    }

    case 'VERSE':
      return <VerseEditor block={block} update={update} subjectId={subjectId} />;

    // Not editable in Nafeer yet (docs/contract.md §4): only its line; the metadata is kept as it is.
    case 'WIDGET':
      return (
        <div className="space-y-2">
          <WidgetBlock block={block} />
          <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
            className={`${ta} min-h-[60px]`} placeholder="السطر اللي بيدعو الطالب يجرّب…" />
        </div>
      );

    case 'TABLE':
      return (
        <div className="space-y-2.5">
          <CaptionField block={block} update={update} label="عنوان الجدول" placeholder="مقارنة بين الكتلة والوزن"
            hint="يظهر فوق الجدول في التطبيق. إن تُرك فارغاً يظهر «جدول»." />
          <LessonTableEditor value={block.content} onChange={(v) => update({ content: v })} />
        </div>
      );

    case 'QUOTE':
      return (
        <div className="border-r-4 border-ink-700 pr-4">
          <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
            className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-300 text-sm italic font-arabic placeholder-ink-600"
            placeholder="الاقتباس…" autoFocus />
          <CaptionField block={block} update={update} label="القائل أو المصدر (اختياري)" placeholder="ابن خلدون، المقدمة"
            hint="يظهر تحت الاقتباس في التطبيق." />
        </div>
      );

    case 'DIVIDER':
      return (
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 h-px bg-ink-800" />
          <span className="text-ink-500 text-xs font-mono select-none">— فاصل —</span>
          <div className="flex-1 h-px bg-ink-800" />
        </div>
      );

    default:
      return (
        <textarea value={block.content} onChange={(e) => update({ content: e.target.value })}
          className={`${ta} min-h-[100px]`} placeholder="المحتوى…" />
      );
  }
}

// ─── MediaBlockEditor ─────────────────────────────────────────────────────────
function MediaBlockEditor({ block, update, subjectId }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasUrl = Boolean(block.content?.trim());
  const isGif = block.type === 'GIF';
  const isInteractive = block.type === 'INTERACTIVE_IMAGE';
  const markers = blockMarkers(block.metadata);
  // Written as `markers`; a restored `pins` list is taken over, not kept beside it.
  const setMarkers = (next, extra = {}) => update({ ...extra, metadata: { ...(block.metadata || {}), markers: next, pins: undefined } });

  const handleInteractiveToggle = (on) => setMarkers(on ? markers : [], { type: on ? 'INTERACTIVE_IMAGE' : 'IMAGE' });
  // The picture's width over its height, so the app sizes the block before the
  // picture arrives and caps a tall one (ImageBlock.kt). Read when it loads here.
  const onImageLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!w || !h) return;
    const aspectRatio = Math.round((w / h) * 10000) / 10000;
    if (block.metadata?.aspectRatio !== aspectRatio) update({ metadata: { ...(block.metadata || {}), aspectRatio } });
  };
  // Markers are positions on one picture; on another they point at nothing.
  // A new image therefore starts without them — after asking, when there are some.
  const replaceImage = (url, meta) => {
    if (url === block.content) return true;
    if (markers.length && !window.confirm(`تغيير الصورة يحذف علاماتها (${markers.length}). متابعة؟`)) return false;
    // A picture answers whatever was asked for (lib/imageRequests.js).
    update({ content: url, metadata: { ...(block.metadata || {}), ...meta, markers: [], pins: undefined, aspectRatio: undefined, imageRequest: undefined } });
    return true;
  };
  const handleSelect = (item) => {
    if (replaceImage(item.url, { mediaId: item.contentId, alt: item.alt || '' })) setPickerOpen(false);
  };
  const handleClear = () => update({
    type: isInteractive ? 'IMAGE' : block.type, content: '',
    metadata: { ...(block.metadata || {}), mediaId: null, alt: '', markers: [], pins: undefined, aspectRatio: undefined },
  });

  return (
    <>
      <div className="space-y-2">
        {hasUrl && (
          <div className={`relative group/thumb rounded-lg overflow-hidden border bg-ink-950 ${isInteractive ? 'border-sand-700/50' : 'border-ink-800'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.content} alt={block.metadata?.alt || ''} className="max-h-48 w-auto mx-auto object-contain py-2"
              onLoad={onImageLoad} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            <button onClick={handleClear} aria-label="إزالة الصورة" className="touch-target absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover/thumb:opacity-100 text-xs"><X size={14} strokeWidth={1.9} /></button>
            {isGif && <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-900/80 text-purple-300 text-[10px] font-bold rounded">GIF</span>}
            {isInteractive && markers.length > 0 && <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-sand-900/80 text-sand-300 text-[10px] font-bold rounded border border-sand-700/60 inline-flex items-center gap-1"><Sparkles size={10} strokeWidth={1.8} /> {markers.length}</span>}
          </div>
        )}
        <button onClick={() => setPickerOpen(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-ink-700 hover:border-sand-600 text-ink-500 hover:text-sand-400 text-sm font-arabic transition-all">
          <ImageIcon size={16} strokeWidth={1.8} />
          <span>{hasUrl ? 'تغيير الصورة من المكتبة' : 'اختر صورة من المكتبة'}</span>
        </button>
        {!hasUrl && (
          <label className="flex flex-col gap-1">
            <span className="t-caption text-fg-muted">لا تجد الصورة في المكتبة؟ صفها ليرفعها المشرف</span>
            <Textarea rows={2} maxLength={500} value={block.metadata?.imageRequest?.note || ''}
              onChange={(e) => update({ metadata: { ...(block.metadata || {}), imageRequest: e.target.value ? { note: e.target.value } : undefined } })}
              placeholder="مثال: خريطة روافد النيل وعليها أسماؤها، من الكتاب المدرسي ص 42" />
            {block.metadata?.imageRequest?.note && (
              <span className="t-caption text-fg-subtle">يصل الطلب للمشرف بعد الحفظ. يمكنك إرسال الدرس للمراجعة، ولا يُعتمد قبل رفع الصورة.</span>
            )}
          </label>
        )}
        <input type="text" value={block.caption || ''} onChange={(e) => update({ caption: e.target.value })}
          className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-600 hover:border-ink-700 transition-colors"
          placeholder="وصف الصورة (اختياري)…" />
        {!isGif && (
          <div className={`rounded-lg border overflow-hidden ${isInteractive ? 'border-sand-700/50' : 'border-ink-800'}`}>
            <div className={`flex items-center gap-3 px-3 py-2.5 ${isInteractive ? 'bg-sand-900/20 border-b border-sand-800/40' : 'bg-ink-900/40 hover:bg-ink-900/60 transition-colors'}`}>
              <Sparkles size={14} strokeWidth={1.8} className={isInteractive ? 'text-sand-500' : 'text-ink-600'} />
              <span className={`text-xs font-arabic font-semibold flex-1 ${isInteractive ? 'text-sand-400' : 'text-ink-500'}`}>صورة تفاعلية</span>
              {isInteractive && <span className="text-[10px] text-sand-600 font-arabic">{markers.length > 0 ? `${markers.length} علامة` : 'لا علامات بعد'}</span>}
              <button onClick={() => handleInteractiveToggle(!isInteractive)}
                className={`relative w-10 h-5 rounded-full border transition-all shrink-0 ${isInteractive ? 'bg-sand-800/60 border-sand-600/60' : 'bg-ink-800 border-ink-700 hover:border-ink-600'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${isInteractive ? 'right-0.5 bg-sand-400' : 'left-0.5 bg-ink-600'}`} />
              </button>
            </div>
            {isInteractive && (
              <div className="p-3 bg-ink-950/30">
                {!hasUrl
                  ? <p className="text-xs text-ink-500 font-arabic text-center py-3">اختر صورة أولاً لإضافة العلامات</p>
                  : <ImageMarkerEditor imageUrl={block.content} markers={markers}
                    onChange={(next) => setMarkers(next)} />}
              </div>
            )}
          </div>
        )}
        <details className="group/det">
          <summary className="text-[11px] text-ink-500 hover:text-ink-500 cursor-pointer select-none font-arabic transition-colors list-none flex items-center gap-1">
            <span className="font-mono text-[10px] transition-transform group-open/det:rotate-90">▶</span>
            أو أدخل رابطاً / مساراً يدوياً
          </summary>
          <div className="mt-1.5">
            {/* Applied on blur / Enter, not per keystroke: a new address is a new image. */}
            <input key={block.content} type="text" defaultValue={block.content}
              onBlur={(e) => { if (!replaceImage(e.target.value.trim(), { mediaId: null })) e.target.value = block.content; }}
              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
              className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-mono placeholder-ink-600 hover:border-ink-700 transition-colors"
              placeholder="https://… أو images/diagram.png" dir="ltr" />
            <p className="text-[10px] text-ink-800 mt-1 font-arabic">رابط Supabase أو مسار نسبي من مجلد assets في التطبيق</p>
          </div>
        </details>
      </div>
      {pickerOpen && <MediaPicker type="IMAGE" subjectId={subjectId} onSelect={handleSelect} onClose={() => setPickerOpen(false)} />}
    </>
  );
}

// ─── CheckpointBlock ──────────────────────────────────────────────────────────
// Its content is the question's id (lib/checkpoints.js). Kept apart so that
// only checkpoint blocks follow the question list.
function CheckpointBlock({ block, update, subjectId, lessonId, unitId, sectionId }) {
  const questionId = blockQuestionId(block);
  const question = useDataStore((s) => s.questions.find((q) => q.id === questionId && q.isCheckpoint)) || null;

  // Named a question that is gone (deleted from the quiz bank): start again.
  if (questionId && !question) {
    return (
      <div className="rounded-card border border-warn-border bg-warn-surface p-4 flex items-center gap-3" dir="rtl">
        <span className="flex-1 t-label text-warn">سؤال نقطة التحقق هذه حُذف من بنك الأسئلة.</span>
        <button type="button" onClick={() => update({ content: '' })}
          className="h-8 px-3 rounded-control border border-line-strong t-label text-fg hover:bg-hover touch-target">اكتب سؤالاً جديداً</button>
      </div>
    );
  }

  return (
    <CheckpointEditor key={question?.id || 'new'} question={question} sectionId={sectionId}
      lessonId={lessonId} unitId={unitId} subjectId={subjectId}
      onCreated={(id) => update({ content: id })} />
  );
}

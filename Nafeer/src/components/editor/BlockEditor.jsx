'use client';
import { useState } from 'react';
import { useDataStore }     from '@/store/dataStore';
import { useAtlasSync }     from '@/hooks/useAtlasSync';
import { BLOCK_TYPE_CONFIG, HIGHLIGHT_STYLES, HEADING_LEVELS } from '@/shared/constants';
import { LessonTableEditor } from '@/components/editor/TableEditor';
import DeleteButton          from '@/components/editor/DeleteButton';
import MediaPicker           from '@/components/editor/MediaPicker';

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

// ─── BlockEditor ─────────────────────────────────────────────────────────────
export default function BlockEditor({ block, subjectId }) {
  const { concepts, updateBlock, deleteBlock } = useDataStore();
  const { deleteBlock: atlasDeleteBlock }      = useAtlasSync();

  const config        = BLOCK_TYPE_CONFIG[block.type] || BLOCK_TYPE_CONFIG.TEXT;
  const linkedConcept = concepts.find((c) => c.id === block.conceptRef);

  const update     = (patch) => updateBlock(block.id, patch);
  const patchMeta  = (patch) => update({ metadata: { ...(block.metadata || {}), ...patch } });

  const handleDelete = () => {
    deleteBlock(block.id);
    atlasDeleteBlock(block.id);
  };

  return (
    <div className="border border-ink-800 rounded-xl overflow-hidden group">

      {/* ── Block header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-ink-900/60 border-b border-ink-800">
        <span className="text-ink-700 cursor-grab text-sm select-none">⋮⋮</span>

        {/* Type badge */}
        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-ink-800/80 border border-ink-700 rounded-md text-xs text-ink-400">
          <span className="font-mono">{config.icon}</span>
          <span className="font-arabic">{config.label}</span>
        </span>

        {/* Concept ref */}
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
            💡 {linkedConcept.titleAr}
          </span>
        )}

        <div className="flex-1" />
        <DeleteButton onDelete={handleDelete} />
      </div>

      {/* ── Block content ─────────────────────────────────────────────────── */}
      <div className="p-3 bg-ink-950/20">
        <BlockBodyEditor block={block} update={update} patchMeta={patchMeta} ta={ta} concepts={concepts} subjectId={subjectId} />
      </div>
    </div>
  );
}

// ─── BlockBodyEditor — renders the right editor per type ─────────────────────
function BlockBodyEditor({ block, update, patchMeta, ta, subjectId }) {
  switch (block.type) {

    // ── TEXT ────────────────────────────────────────────────────────────────
    case 'TEXT':
      return (
        <textarea
          value={block.content}
          onChange={(e) => update({ content: e.target.value })}
          className={`${ta} min-h-[100px]`}
          placeholder="اكتب النص هنا…"
        />
      );

    // ── HEADING ─────────────────────────────────────────────────────────────
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

    // ── IMAGE / GIF ─────────────────────────────────────────────────────────
    case 'IMAGE':
    case 'GIF':
      return (
        <MediaBlockEditor
          block={block}
          update={update}
          subjectId={subjectId}
          ta={ta}
        />
      );

    // ── FORMULA ─────────────────────────────────────────────────────────────
    case 'FORMULA':
      return (
        <div className="space-y-2">
          <textarea
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            className="w-full px-3 py-2.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm font-mono focus:ring-1 focus:ring-sand-600 focus:outline-none resize-y min-h-[64px] placeholder-ink-800 hover:border-ink-700 transition-colors"
            placeholder="E = mc^2  أو  \frac{d}{dx}f(x)"
            dir="ltr"
          />
          <p className="text-[11px] text-ink-700 font-arabic">يدعم LaTeX والنص العادي</p>
        </div>
      );

    // ── HIGHLIGHT_BOX ────────────────────────────────────────────────────────
    case 'HIGHLIGHT_BOX': {
      const style  = block.metadata?.style ?? 'NOTE';
      const colors = HL_COLORS[style] || HL_COLORS.NOTE;
      return (
        <div className="space-y-2.5">
          {/* Style chips */}
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
          {/* Content with dynamic border color */}
          <div className={`border-r-4 ${colors.border} ${colors.bg} rounded-lg p-3`}>
            <p className={`text-xs mb-2 font-arabic ${colors.label}`}>
              {HIGHLIGHT_STYLES[style]?.icon} {HIGHLIGHT_STYLES[style]?.label}
            </p>
            <textarea
              value={block.content}
              onChange={(e) => update({ content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-sand-200 text-sm font-arabic placeholder-ink-800"
              placeholder="النص المهم الذي تريد إبرازه…"
            />
          </div>
        </div>
      );
    }

    // ── EXAMPLE ─────────────────────────────────────────────────────────────
    case 'EXAMPLE': {
      const interactive = block.metadata?.interactive ?? false;
      const steps       = block.metadata?.steps ?? [];

      const setInteractive = (val) => {
        const newSteps = val && steps.length === 0 && block.content
          ? [block.content]
          : steps;
        patchMeta({ interactive: val, steps: newSteps });
      };

      const updateStep = (i, val) => {
        const next = [...steps];
        next[i] = val;
        patchMeta({ steps: next });
      };

      const addStep    = () => patchMeta({ steps: [...steps, ''] });
      const removeStep = (i) => patchMeta({ steps: steps.filter((_, j) => j !== i) });

      return (
        <div className="space-y-3">
          {/* Mode toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-600 font-arabic">النوع:</span>
            <div className="flex rounded-lg border border-ink-800 overflow-hidden">
              <button
                onClick={() => setInteractive(false)}
                className={`px-3 py-1 text-xs font-arabic transition-colors
                  ${!interactive ? 'bg-teal-900/50 text-teal-400 border-teal-800/50' : 'bg-ink-900 text-ink-600 hover:text-ink-400'}`}
              >
                عادي
              </button>
              <button
                onClick={() => setInteractive(true)}
                className={`px-3 py-1 text-xs font-arabic transition-colors border-r border-ink-800
                  ${interactive ? 'bg-teal-900/50 text-teal-400' : 'bg-ink-900 text-ink-600 hover:text-ink-400'}`}
              >
                ⚡ تفاعلي
              </button>
            </div>
            {interactive && (
              <span className="text-[11px] text-ink-700 font-arabic">كل خطوة تُكشف بنقرة</span>
            )}
          </div>

          {!interactive ? (
            <div className="bg-teal-950/40 border-r-4 border-teal-700 rounded-lg p-3">
              <p className="text-xs text-teal-600 mb-2 font-arabic">✎ مثال</p>
              <textarea
                value={block.content}
                onChange={(e) => update({ content: e.target.value })}
                className="w-full bg-transparent border-none resize-y min-h-[88px] focus:outline-none text-teal-100 text-sm font-arabic placeholder-teal-900"
                placeholder="اكتب المثال كاملاً هنا…"
              />
            </div>
          ) : (
            <div className="space-y-2">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-6 h-6 rounded-full bg-teal-900/50 border border-teal-800/50 text-teal-500 text-[10px] font-mono flex items-center justify-center shrink-0 mt-1.5">
                    {i + 1}
                  </div>
                  <textarea
                    value={step}
                    onChange={(e) => updateStep(i, e.target.value)}
                    className={`${ta} flex-1 min-h-[60px]`}
                    placeholder={`الخطوة ${i + 1}…`}
                  />
                  <button
                    onClick={() => removeStep(i)}
                    className="text-ink-700 hover:text-red-500 transition-colors mt-2 text-sm"
                  >✕</button>
                </div>
              ))}
              <button
                onClick={addStep}
                className="w-full py-2 border border-dashed border-teal-900 rounded-lg text-teal-800 hover:text-teal-600 hover:border-teal-800 transition-colors text-xs font-arabic"
              >
                + إضافة خطوة
              </button>
              {steps.length === 0 && (
                <p className="text-xs text-ink-800 font-arabic text-center py-1">أضف خطوة للبدء</p>
              )}
            </div>
          )}
        </div>
      );
    }

    // ── TIP ─────────────────────────────────────────────────────────────────
    case 'TIP':
      return (
        <div className="bg-ember-900/20 border-r-4 border-ember-500/70 rounded-lg p-3">
          <p className="text-xs text-ember-400 mb-2 font-arabic">◈ نصيحة</p>
          <textarea
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-200 text-sm font-arabic placeholder-ink-800"
            placeholder="اكتب النصيحة هنا…"
          />
        </div>
      );

    // ── LIST ─────────────────────────────────────────────────────────────────
    case 'LIST': {
      const style = block.metadata?.style ?? 'BULLET';
      return (
        <div className="space-y-2">
          <div className="flex gap-1">
            {[['BULLET','● نقطي'],['NUMBERED','١ مرقّم']].map(([key, lbl]) => (
              <button
                key={key}
                onClick={() => patchMeta({ style: key })}
                className={`px-3 py-1 text-xs rounded-md border font-arabic transition-all
                  ${style === key
                    ? 'bg-sand-900/50 text-sand-400 border-sand-800/60'
                    : 'bg-ink-800 text-ink-600 border-ink-700 hover:text-ink-400'}`}
              >
                {lbl}
              </button>
            ))}
          </div>
          <textarea
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            className={`${ta} min-h-[100px]`}
            placeholder="كل سطر = عنصر في القائمة…"
          />
          <p className="text-[11px] text-ink-700 font-arabic">كل سطر سيظهر كعنصر منفصل</p>
        </div>
      );
    }

    // ── TABLE ────────────────────────────────────────────────────────────────
    case 'TABLE':
      return (
        <LessonTableEditor
          value={block.content}
          onChange={(v) => update({ content: v })}
        />
      );

    // ── QUOTE ────────────────────────────────────────────────────────────────
    case 'QUOTE':
      return (
        <div className="border-r-4 border-ink-700 pr-4">
          <textarea
            value={block.content}
            onChange={(e) => update({ content: e.target.value })}
            className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-300 text-sm italic font-arabic placeholder-ink-800"
            placeholder="الاقتباس…"
          />
        </div>
      );

    // ── DIVIDER ──────────────────────────────────────────────────────────────
    case 'DIVIDER':
      return (
        <div className="flex items-center gap-3 py-3">
          <div className="flex-1 h-px bg-ink-800" />
          <span className="text-ink-700 text-xs font-mono select-none">— فاصل —</span>
          <div className="flex-1 h-px bg-ink-800" />
        </div>
      );

    default:
      return (
        <textarea
          value={block.content}
          onChange={(e) => update({ content: e.target.value })}
          className={`${ta} min-h-[100px]`}
          placeholder="المحتوى…"
        />
      );
  }
}

// ─── MediaBlockEditor ─────────────────────────────────────────────────────────
// Handles IMAGE and GIF blocks. Shows:
//   • A thumbnail preview if a URL is already set
//   • A "اختر صورة" button that opens the MediaPicker modal
//   • A manual URL/path fallback input (for Android local assets)
//   • A caption field
function MediaBlockEditor({ block, update, subjectId, ta }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasUrl = Boolean(block.content?.trim());
  const isGif  = block.type === 'GIF';

  const handleSelect = (item) => {
    update({
      content:  item.url,
      metadata: { ...(block.metadata || {}), mediaId: item.contentId, alt: item.alt || '' },
    });
    setPickerOpen(false);
  };

  const handleClear = () => {
    update({
      content:  '',
      metadata: { ...(block.metadata || {}), mediaId: null, alt: '' },
    });
  };

  return (
    <>
      <div className="space-y-2">

        {/* ── Thumbnail preview ────────────────────────────────────────────── */}
        {hasUrl && (
          <div className="relative group/thumb rounded-lg overflow-hidden border border-ink-800 bg-ink-950">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={block.content}
              alt={block.metadata?.alt || block.caption || ''}
              className="max-h-48 w-auto mx-auto object-contain py-2"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            {/* Clear button overlay */}
            <button
              onClick={handleClear}
              title="إزالة الصورة"
              className="absolute top-2 left-2 w-6 h-6 flex items-center justify-center rounded-full bg-black/60 text-white/70 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover/thumb:opacity-100 text-xs"
            >
              ✕
            </button>
            {/* GIF badge */}
            {isGif && (
              <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-purple-900/80 text-purple-300 text-[10px] font-bold rounded">
                GIF
              </span>
            )}
          </div>
        )}

        {/* ── Picker button ────────────────────────────────────────────────── */}
        <button
          onClick={() => setPickerOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-ink-700 hover:border-sand-600 text-ink-500 hover:text-sand-400 text-sm font-arabic transition-all"
        >
          <span className="font-mono text-base">⬜</span>
          <span>{hasUrl ? 'تغيير الصورة من المكتبة' : 'اختر صورة من المكتبة'}</span>
        </button>

        {/* ── Caption ──────────────────────────────────────────────────────── */}
        <input
          type="text"
          value={block.caption || ''}
          onChange={(e) => update({ caption: e.target.value })}
          className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-800 hover:border-ink-700 transition-colors"
          placeholder="وصف الصورة (اختياري)…"
        />

        {/* ── Manual URL fallback ───────────────────────────────────────────── */}
        <details className="group/det">
          <summary className="text-[11px] text-ink-700 hover:text-ink-500 cursor-pointer select-none font-arabic transition-colors list-none flex items-center gap-1">
            <span className="font-mono text-[10px] transition-transform group-open/det:rotate-90">▶</span>
            أو أدخل رابطاً / مساراً يدوياً
          </summary>
          <div className="mt-1.5">
            <input
              type="text"
              value={block.content}
              onChange={(e) => update({ content: e.target.value })}
              className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-mono placeholder-ink-800 hover:border-ink-700 transition-colors"
              placeholder="https://… أو images/diagram.png"
              dir="ltr"
            />
            <p className="text-[10px] text-ink-800 mt-1 font-arabic">
              رابط Supabase أو مسار نسبي من مجلد assets في التطبيق
            </p>
          </div>
        </details>
      </div>

      {/* ── Picker modal ─────────────────────────────────────────────────────── */}
      {pickerOpen && (
        <MediaPicker
          type={block.type}
          subjectId={subjectId}
          onSelect={handleSelect}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
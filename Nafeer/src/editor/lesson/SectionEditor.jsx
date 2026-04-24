'use client';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import { LEARNING_TYPES, LEARNING_TYPE_CONFIG } from '@/shared/constants';
import BlockEditor    from '@/components/editor/blocks/BlockEditor';
import AddBlockMenu   from '@/components/editor/blocks/AddBlockMenu';
import ConceptLinker  from '@/components/editor/shared/ConceptLinker';
import DeleteButton   from '@/components/editor/shared/DeleteButton';

// Learning-type colour system — right-border accent (RTL leading edge)
const LT_STYLE = {
  UNDERSTANDING: {
    border:  'border-r-blue-600/70',
    dot:     'bg-blue-500',
    label:   'text-blue-400',
    pill:    'bg-blue-900/20 border-blue-800/40 text-blue-400',
  },
  MEMORIZATION: {
    border:  'border-r-amber-600/70',
    dot:     'bg-amber-500',
    label:   'text-amber-400',
    pill:    'bg-amber-900/20 border-amber-800/40 text-amber-400',
  },
  HYBRID: {
    border:  'border-r-violet-600/70',
    dot:     'bg-violet-500',
    label:   'text-violet-400',
    pill:    'bg-violet-900/20 border-violet-800/40 text-violet-400',
  },
};

export default function SectionEditor({ section, maxPart = 0, subjectId }) {
  const { blocks, concepts, updateSection, deleteSection, addBlock } = useDataStore();
  const { deleteSection: atlasDeleteSection } = useAtlasSync();

  const [isEditingTitle,    setIsEditingTitle]    = useState(false);
  const [showAddBlock,      setShowAddBlock]       = useState(false);
  const [showConceptLinker, setShowConceptLinker]  = useState(false);
  const [collapsed,         setCollapsed]          = useState(false);

  const sectionBlocks  = blocks.filter((b) => b.sectionId === section.id).sort((a, b) => a.order - b.order);
  const linkedConcepts = concepts.filter((c) => section.conceptIds?.includes(c.id));
  const ltCfg          = LEARNING_TYPE_CONFIG[section.learningType] || LEARNING_TYPE_CONFIG.UNDERSTANDING;
  const ltStyle        = LT_STYLE[section.learningType] || LT_STYLE.UNDERSTANDING;
  const partIndex      = section.partIndex ?? 0;

  const handleDelete = () => {
    deleteSection(section.id);
    atlasDeleteSection(section.id);
  };

  const handleAddBlock = (type) => {
    addBlock({ sectionId: section.id, type, content: '', conceptRef: null });
    setShowAddBlock(false);
  };

  const setPartIndex = (delta) => {
    const next = Math.max(0, Math.min(maxPart + 1, partIndex + delta));
    updateSection(section.id, { partIndex: next });
  };

  return (
    <div className={`bg-ink-900/60 rounded-xl border border-ink-800/80 border-r-4 ${ltStyle.border} overflow-hidden transition-all`}>

      {/* ── Section header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-3 bg-ink-800/20">

        {/* Drag handle */}
        <span className="text-ink-700 cursor-grab text-xs select-none leading-none">⋮⋮</span>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-ink-600 hover:text-ink-300 transition-colors text-xs w-4 shrink-0"
        >
          {collapsed ? '▸' : '▾'}
        </button>

        {/* Title */}
        {isEditingTitle ? (
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection(section.id, { title: e.target.value })}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            className="flex-1 px-2 py-1 bg-ink-950 border border-sand-700/60 rounded-lg text-sand-200 text-sm focus:outline-none font-arabic"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-right font-medium text-ink-200 hover:text-sand-300 text-sm font-arabic truncate min-w-0 transition-colors"
          >
            {section.title}
          </button>
        )}

        {/* Block count */}
        {!collapsed && sectionBlocks.length > 0 && (
          <span className="text-[10px] font-mono text-ink-700 shrink-0">{sectionBlocks.length}</span>
        )}

        {/* Learning type selector — compact icon pills */}
        <div className="flex items-center gap-0.5 shrink-0 border border-ink-700/60 rounded-lg p-0.5 bg-ink-900/40">
          {Object.entries(LEARNING_TYPES).map(([key]) => {
            const cfg    = LEARNING_TYPE_CONFIG[key];
            const sty    = LT_STYLE[key];
            const active = section.learningType === key;
            return (
              <button
                key={key}
                onClick={() => updateSection(section.id, { learningType: key })}
                title={`${cfg.label} — ${cfg.hint}`}
                className={`px-2 py-1 rounded-md text-xs transition-all
                  ${active ? `${sty.pill} border` : 'text-ink-700 hover:text-ink-400'}`}
              >
                {cfg.icon}
              </button>
            );
          })}
        </div>

        {/* Part index control */}
        {maxPart > 0 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              onClick={() => setPartIndex(-1)}
              disabled={partIndex === 0}
              className="w-5 h-5 flex items-center justify-center text-ink-700 hover:text-sand-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs rounded"
              title="نقل للجزء السابق"
            >‹</button>
            <span className="text-[10px] font-mono text-ink-600 w-4 text-center">{partIndex + 1}</span>
            <button
              onClick={() => setPartIndex(1)}
              className="w-5 h-5 flex items-center justify-center text-ink-700 hover:text-sand-400 transition-colors text-xs rounded"
              title="نقل للجزء التالي"
            >›</button>
          </div>
        )}

        <DeleteButton onDelete={handleDelete} />
      </div>

      {/* ── Section body ─────────────────────────────────────────────────────── */}
      {!collapsed && (
        <div className="p-4 space-y-3">

          {/* Concept linker row */}
          <div className="flex items-center gap-2 flex-wrap min-h-[22px]">
            {linkedConcepts.length === 0 ? (
              <span className="text-xs text-ink-800 font-arabic">لا مفاهيم مرتبطة</span>
            ) : linkedConcepts.map((c) => (
              <span key={c.id} className="px-2 py-0.5 bg-sand-900/20 text-sand-600 text-xs rounded-full border border-sand-800/30 font-arabic">
                💡 {c.titleAr}
              </span>
            ))}
            <button
              onClick={() => setShowConceptLinker(!showConceptLinker)}
              className="text-xs text-ink-700 hover:text-sand-400 transition-colors font-arabic mr-auto"
            >
              {showConceptLinker ? '← إغلاق' : '+ ربط مفهوم'}
            </button>
          </div>

          {showConceptLinker && (
            <ConceptLinker sectionId={section.id} linkedConceptIds={section.conceptIds || []} />
          )}

          {/* Blocks */}
          {sectionBlocks.length === 0 && !showAddBlock && (
            <div className="py-5 text-center text-xs text-ink-800 font-arabic border border-dashed border-ink-800/40 rounded-lg">
              لا يوجد محتوى — أضف عنصراً
            </div>
          )}

          {sectionBlocks.map((block) => (
            <BlockEditor key={block.id} block={block} subjectId={subjectId} />
          ))}

          {/* Add block */}
          {showAddBlock ? (
            <AddBlockMenu onSelect={handleAddBlock} onClose={() => setShowAddBlock(false)} />
          ) : (
            <button
              onClick={() => setShowAddBlock(true)}
              className="w-full py-2.5 border border-dashed border-ink-800/50 rounded-lg text-ink-700 hover:border-sand-800/40 hover:text-sand-600 hover:bg-sand-900/5 transition-colors text-xs font-arabic"
            >
              + إضافة عنصر
            </button>
          )}
        </div>
      )}
    </div>
  );
}
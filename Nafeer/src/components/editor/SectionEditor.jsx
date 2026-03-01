import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { LEARNING_TYPES, LEARNING_TYPE_CONFIG } from '@/shared/constants';
import BlockEditor    from '@/components/editor/BlockEditor';
import AddBlockMenu   from '@/components/editor/AddBlockMenu';
import ConceptLinker  from '@/components/editor/ConceptLinker';
import DeleteButton   from '@/components/editor/DeleteButton';

export default function SectionEditor({ section }) {
  const { blocks, concepts, updateSection, deleteSection, addBlock } = useDataStore();

  const [isEditingTitle,   setIsEditingTitle]   = useState(false);
  const [showAddBlock,     setShowAddBlock]      = useState(false);
  const [showConceptLinker, setShowConceptLinker] = useState(false);

  const sectionBlocks = blocks
    .filter((b) => b.sectionId === section.id)
    .sort((a, b) => a.order - b.order);

  const linkedConcepts = concepts.filter((c) => section.conceptIds?.includes(c.id));

  const learningTypeConfig = LEARNING_TYPE_CONFIG[section.learningType] || LEARNING_TYPE_CONFIG.UNDERSTANDING;

  const handleDelete = () => deleteSection(section.id);

  const handleAddBlock = (type) => {
    addBlock({ sectionId: section.id, type, content: '', conceptRef: null });
    setShowAddBlock(false);
  };

  return (
    <div className="bg-ink-900 rounded-xl border border-ink-800 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-ink-800/40 border-b border-ink-800">
        <span className="text-ink-700 cursor-grab text-sm">⋮⋮</span>

        {isEditingTitle ? (
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection(section.id, { title: e.target.value })}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            className="flex-1 px-2 py-1 bg-ink-950 border border-sand-600 rounded text-sand-200 text-sm focus:outline-none font-arabic"
            autoFocus
          />
        ) : (
          <button
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-right font-medium text-ink-200 hover:text-sand-300 text-sm font-arabic"
          >
            {section.title}
          </button>
        )}

        {/* Learning type selector */}
        <div className="flex gap-1">
          {Object.entries(LEARNING_TYPES).map(([key]) => {
            const cfg    = LEARNING_TYPE_CONFIG[key];
            const active = section.learningType === key;
            return (
              <button
                key={key}
                onClick={() => updateSection(section.id, { learningType: key })}
                title={`${cfg.label} — ${cfg.hint}`}
                className={`px-2 py-1 rounded text-xs transition-colors border font-arabic
                  ${active
                    ? 'bg-sand-900/50 text-sand-400 border-sand-700'
                    : 'bg-ink-800 text-ink-600 border-ink-700 hover:text-ink-300'
                  }`}
              >
                {cfg.icon} {cfg.label}
              </button>
            );
          })}
        </div>

        <DeleteButton onDelete={handleDelete} />
      </div>

      {/* Section Body */}
      <div className="p-4 space-y-3">
        {/* Linked Concepts */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink-600 font-arabic">مفاهيم مرتبطة:</span>
          {linkedConcepts.length === 0 && (
            <span className="text-xs text-ink-700 font-arabic">لا يوجد</span>
          )}
          {linkedConcepts.map((c) => (
            <span
              key={c.id}
              className="px-2 py-0.5 bg-sand-900/30 text-sand-500 text-xs rounded border border-sand-800/50 font-arabic"
            >
              💡 {c.titleAr}
            </span>
          ))}
          <button
            onClick={() => setShowConceptLinker(!showConceptLinker)}
            className="text-xs text-ink-600 hover:text-sand-400 transition-colors font-arabic"
          >
            {showConceptLinker ? '← إغلاق' : '+ ربط مفهوم'}
          </button>
        </div>

        {/* Concept Linker */}
        {showConceptLinker && (
          <ConceptLinker
            sectionId={section.id}
            linkedConceptIds={section.conceptIds || []}
          />
        )}

        {/* Blocks */}
        {sectionBlocks.map((block) => (
          <BlockEditor key={block.id} block={block} />
        ))}

        {/* Add Block */}
        {showAddBlock ? (
          <AddBlockMenu onSelect={handleAddBlock} onClose={() => setShowAddBlock(false)} />
        ) : (
          <button
            onClick={() => setShowAddBlock(true)}
            className="w-full py-2.5 border border-dashed border-ink-700 rounded-lg text-ink-600 hover:border-sand-700 hover:text-sand-600 hover:bg-sand-900/10 transition-colors text-sm font-arabic"
          >
            + إضافة عنصر
          </button>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import BlockEditor from '@/components/editor/BlockEditor';
import AddBlockMenu from '@/components/editor/AddBlockMenu';
import ConceptLinker from '@/components/editor/ConceptLinker';

export default function SectionEditor({ section }) {
  const { blocks, concepts, updateSection, deleteSection, addBlock } = useDataStore();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [showConceptLinker, setShowConceptLinker] = useState(false);

  const sectionBlocks = blocks
    .filter((b) => b.sectionId === section.id)
    .sort((a, b) => a.order - b.order);

  const linkedConcepts = concepts.filter((c) =>
    section.conceptIds?.includes(c.id)
  );

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من حذف هذا القسم وجميع محتوياته؟')) {
      deleteSection(section.id);
    }
  };

  const handleAddBlock = (type) => {
    addBlock({
      sectionId: section.id,
      type,
      content: '',
      conceptRef: null,
    });
    setShowAddBlock(false);
  };

  return (
    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center gap-3 p-4 bg-stone-50 border-b border-stone-200">
        <span className="text-stone-300 cursor-grab">⋮⋮</span>

        {isEditingTitle ? (
          <input
            type="text"
            value={section.title}
            onChange={(e) => updateSection(section.id, { title: e.target.value })}
            onBlur={() => setIsEditingTitle(false)}
            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
            className="flex-1 px-2 py-1 text-lg font-medium border border-amber-400 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            autoFocus
          />
        ) : (
          <h3
            onClick={() => setIsEditingTitle(true)}
            className="flex-1 text-lg font-medium text-stone-800 cursor-pointer hover:text-amber-600"
          >
            {section.title}
          </h3>
        )}

        {/* Concept Link Button */}
        <button
          onClick={() => setShowConceptLinker(!showConceptLinker)}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
            showConceptLinker
              ? 'bg-amber-100 text-amber-700'
              : 'bg-stone-100 text-stone-600 hover:bg-amber-50 hover:text-amber-600'
          }`}
        >
          <span>💡</span>
          <span>المفاهيم ({linkedConcepts.length})</span>
        </button>

        <button
          onClick={handleDelete}
          className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="حذف القسم"
        >
          🗑️
        </button>
      </div>

      {/* Concept Linker */}
      {showConceptLinker && (
        <ConceptLinker sectionId={section.id} />
      )}

      {/* Blocks */}
      <div className="p-4 space-y-3">
        {sectionBlocks.length === 0 ? (
          <p className="text-center text-stone-400 py-4">لا توجد عناصر في هذا القسم</p>
        ) : (
          sectionBlocks.map((block) => (
            <BlockEditor key={block.id} block={block} />
          ))
        )}

        {/* Add Block */}
        {showAddBlock ? (
          <AddBlockMenu
            onSelect={handleAddBlock}
            onClose={() => setShowAddBlock(false)}
          />
        ) : (
          <button
            onClick={() => setShowAddBlock(true)}
            className="w-full py-3 border border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            + إضافة عنصر محتوى
          </button>
        )}
      </div>

      {/* Linked Concepts Footer */}
      {linkedConcepts.length > 0 && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
          <p className="text-xs text-amber-700 mb-2">المفاهيم المرتبطة:</p>
          <div className="flex flex-wrap gap-2">
            {linkedConcepts.map((concept) => (
              <span
                key={concept.id}
                className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded"
              >
                {concept.titleAr}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

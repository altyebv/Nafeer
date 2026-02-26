import { useState } from 'react';
import { useDataStore }      from '@/store/dataStore';
import { CONCEPT_TYPE_CONFIG } from '@/shared/constants';

export default function ConceptLinker({ sectionId }) {
  const { concepts, sections, linkConceptToSection, unlinkConceptFromSection } = useDataStore();
  const [search, setSearch] = useState('');

  const section    = sections.find((s) => s.id === sectionId);
  const linkedIds  = section?.conceptIds || [];

  const linkedConcepts    = concepts.filter((c) => linkedIds.includes(c.id));
  const availableConcepts = concepts.filter(
    (c) =>
      !linkedIds.includes(c.id) &&
      (c.titleAr?.includes(search) || c.titleEn?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-3 bg-sand-900/10 border border-sand-800/30 rounded-lg space-y-3">
      {/* Linked */}
      {linkedConcepts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedConcepts.map((concept) => (
            <span key={concept.id} className="flex items-center gap-1 px-2 py-0.5 bg-sand-900/40 text-sand-400 text-xs rounded border border-sand-800/50 font-arabic">
              {concept.titleAr}
              <button
                onClick={() => unlinkConceptFromSection(sectionId, concept.id)}
                className="text-sand-600 hover:text-red-400 transition-colors mr-0.5"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
        placeholder="ابحث عن مفهوم لربطه..."
      />

      {/* Available */}
      {availableConcepts.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
          {availableConcepts.slice(0, 20).map((concept) => {
            const typeConfig = CONCEPT_TYPE_CONFIG[concept.type];
            return (
              <button
                key={concept.id}
                onClick={() => linkConceptToSection(sectionId, concept.id)}
                className="flex items-center gap-1 px-2 py-0.5 bg-ink-800 border border-ink-700 text-xs rounded hover:border-sand-700 hover:text-sand-400 transition-colors font-arabic text-ink-400"
              >
                <span className="text-ink-600">{typeConfig?.icon}</span>
                {concept.titleAr}
              </button>
            );
          })}
          {availableConcepts.length > 20 && (
            <span className="text-xs text-ink-600 self-center font-arabic">
              +{availableConcepts.length - 20} أخرى
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-ink-600 font-arabic">
          {concepts.length === 0
            ? 'لا توجد مفاهيم. أضف مفاهيم من صفحة "المفاهيم" أولاً.'
            : 'لا توجد نتائج.'}
        </p>
      )}
    </div>
  );
}

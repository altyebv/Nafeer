import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import { CONCEPT_TYPE_CONFIG } from '@/shared/constants';

export default function ConceptLinker({ sectionId }) {
  const { concepts, sections, linkConceptToSection, unlinkConceptFromSection } = useDataStore();

  const [search, setSearch] = useState('');

  const section = sections.find((s) => s.id === sectionId);
  const linkedIds = section?.conceptIds || [];

  const linkedConcepts = concepts.filter((c) => linkedIds.includes(c.id));
  const availableConcepts = concepts.filter(
    (c) =>
      !linkedIds.includes(c.id) &&
      (c.titleAr?.toLowerCase().includes(search.toLowerCase()) ||
        c.titleEn?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 bg-amber-50 border-b border-amber-100">
      {/* Linked Concepts */}
      {linkedConcepts.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-amber-700 mb-2">المفاهيم المرتبطة:</p>
          <div className="flex flex-wrap gap-2">
            {linkedConcepts.map((concept) => (
              <span
                key={concept.id}
                className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-800 text-sm rounded"
              >
                {concept.titleAr}
                <button
                  onClick={() => unlinkConceptFromSection(sectionId, concept.id)}
                  className="text-amber-600 hover:text-red-600"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 border border-amber-200 rounded-lg mb-3 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        placeholder="ابحث عن مفهوم لربطه..."
      />

      {/* Available Concepts */}
      {availableConcepts.length > 0 ? (
        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
          {availableConcepts.slice(0, 20).map((concept) => {
            const typeConfig = CONCEPT_TYPE_CONFIG[concept.type];
            return (
              <button
                key={concept.id}
                onClick={() => linkConceptToSection(sectionId, concept.id)}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-stone-200 text-sm rounded hover:border-amber-400 hover:bg-amber-50 transition-colors"
              >
                <span className="text-xs text-stone-400">{typeConfig?.icon}</span>
                {concept.titleAr}
              </button>
            );
          })}
          {availableConcepts.length > 20 && (
            <span className="text-xs text-stone-400 self-center">
              +{availableConcepts.length - 20} مفاهيم أخرى
            </span>
          )}
        </div>
      ) : (
        <p className="text-sm text-stone-400">
          {concepts.length === 0
            ? 'لا توجد مفاهيم. أضف مفاهيم من صفحة "المفاهيم" أولاً.'
            : 'لا توجد نتائج للبحث.'}
        </p>
      )}
    </div>
  );
}

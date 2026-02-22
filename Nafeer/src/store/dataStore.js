import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const generateId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

export const useDataStore = create(
  persist(
    (set, get) => ({
      // Data
      subject: null,
      units: [],
      lessons: [],
      sections: [],
      blocks: [],
      concepts: [],
      tags: [],
      feedItems: [],

      // Subject
      setSubject: (subject) => set({ 
        subject: { ...subject, id: subject.id || generateId('subj') } 
      }),

      // Units
      addUnit: (unit) => set((state) => ({
        units: [...state.units, {
          ...unit,
          id: unit.id || generateId('unit'),
          order: state.units.length + 1
        }]
      })),

      updateUnit: (id, updates) => set((state) => ({
        units: state.units.map(u => u.id === id ? { ...u, ...updates } : u)
      })),

      deleteUnit: (id) => set((state) => {
        const lessonIds = state.lessons.filter(l => l.unitId === id).map(l => l.id);
        const sectionIds = state.sections.filter(s => lessonIds.includes(s.lessonId)).map(s => s.id);
        return {
          units: state.units.filter(u => u.id !== id),
          lessons: state.lessons.filter(l => l.unitId !== id),
          sections: state.sections.filter(s => !lessonIds.includes(s.lessonId)),
          blocks: state.blocks.filter(b => !sectionIds.includes(b.sectionId)),
        };
      }),

      // Lessons
      addLesson: (lesson) => set((state) => {
        const unitLessons = state.lessons.filter(l => l.unitId === lesson.unitId);
        return {
          lessons: [...state.lessons, {
            ...lesson,
            id: lesson.id || generateId('lesson'),
            order: unitLessons.length + 1,
            estimatedMinutes: lesson.estimatedMinutes || 15
          }]
        };
      }),

      updateLesson: (id, updates) => set((state) => ({
        lessons: state.lessons.map(l => l.id === id ? { ...l, ...updates } : l)
      })),

      deleteLesson: (id) => set((state) => {
        const sectionIds = state.sections.filter(s => s.lessonId === id).map(s => s.id);
        return {
          lessons: state.lessons.filter(l => l.id !== id),
          sections: state.sections.filter(s => s.lessonId !== id),
          blocks: state.blocks.filter(b => !sectionIds.includes(b.sectionId)),
        };
      }),

      // Sections
      addSection: (section) => set((state) => {
        const lessonSections = state.sections.filter(s => s.lessonId === section.lessonId);
        return {
          sections: [...state.sections, {
            ...section,
            id: section.id || generateId('sec'),
            order: lessonSections.length + 1,
            conceptIds: section.conceptIds || []
          }]
        };
      }),

      updateSection: (id, updates) => set((state) => ({
        sections: state.sections.map(s => s.id === id ? { ...s, ...updates } : s)
      })),

      deleteSection: (id) => set((state) => ({
        sections: state.sections.filter(s => s.id !== id),
        blocks: state.blocks.filter(b => b.sectionId !== id),
      })),

      // Blocks
      addBlock: (block) => set((state) => {
        const sectionBlocks = state.blocks.filter(b => b.sectionId === block.sectionId);
        return {
          blocks: [...state.blocks, {
            ...block,
            id: block.id || generateId('block'),
            order: sectionBlocks.length + 1
          }]
        };
      }),

      updateBlock: (id, updates) => set((state) => ({
        blocks: state.blocks.map(b => b.id === id ? { ...b, ...updates } : b)
      })),

      deleteBlock: (id) => set((state) => ({
        blocks: state.blocks.filter(b => b.id !== id)
      })),

      // Tags
      addTag: (tag) => set((state) => ({
        tags: [...state.tags, {
          ...tag,
          id: tag.id || generateId('tag'),
        }]
      })),

      updateTag: (id, updates) => set((state) => ({
        tags: state.tags.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      deleteTag: (id) => set((state) => ({
        tags: state.tags.filter(t => t.id !== id),
        // Remove tag from all concepts
        concepts: state.concepts.map(c => ({
          ...c,
          tagIds: (c.tagIds || []).filter(tId => tId !== id)
        }))
      })),

      // Concepts
      addConcept: (concept) => set((state) => ({
        concepts: [...state.concepts, {
          ...concept,
          id: concept.id || generateId('concept'),
          tagIds: concept.tagIds || [],
          difficulty: concept.difficulty || 1
        }]
      })),

      updateConcept: (id, updates) => set((state) => ({
        concepts: state.concepts.map(c => c.id === id ? { ...c, ...updates } : c)
      })),

      deleteConcept: (id) => set((state) => ({
        concepts: state.concepts.filter(c => c.id !== id),
        sections: state.sections.map(s => ({
          ...s,
          conceptIds: s.conceptIds?.filter(cId => cId !== id) || []
        })),
        blocks: state.blocks.map(b => ({
          ...b,
          conceptRef: b.conceptRef === id ? null : b.conceptRef
        })),
        // Remove feed items linked to this concept
        feedItems: state.feedItems.filter(f => f.conceptId !== id)
      })),

      // Link/unlink tags to concepts
      linkTagToConcept: (conceptId, tagId) => set((state) => ({
        concepts: state.concepts.map(c => {
          if (c.id !== conceptId) return c;
          const tagIds = c.tagIds || [];
          if (tagIds.includes(tagId)) return c;
          return { ...c, tagIds: [...tagIds, tagId] };
        })
      })),

      unlinkTagFromConcept: (conceptId, tagId) => set((state) => ({
        concepts: state.concepts.map(c => {
          if (c.id !== conceptId) return c;
          return { ...c, tagIds: (c.tagIds || []).filter(id => id !== tagId) };
        })
      })),

      // Link concepts to sections
      linkConceptToSection: (sectionId, conceptId) => set((state) => ({
        sections: state.sections.map(s => {
          if (s.id !== sectionId) return s;
          const conceptIds = s.conceptIds || [];
          if (conceptIds.includes(conceptId)) return s;
          return { ...s, conceptIds: [...conceptIds, conceptId] };
        })
      })),

      unlinkConceptFromSection: (sectionId, conceptId) => set((state) => ({
        sections: state.sections.map(s => {
          if (s.id !== sectionId) return s;
          return { ...s, conceptIds: (s.conceptIds || []).filter(id => id !== conceptId) };
        })
      })),

      // Feed Items
      addFeedItem: (feedItem) => set((state) => {
        const conceptFeedItems = state.feedItems.filter(f => f.conceptId === feedItem.conceptId);
        return {
          feedItems: [...state.feedItems, {
            ...feedItem,
            id: feedItem.id || generateId('feed'),
            order: conceptFeedItems.length,
            priority: feedItem.priority || 1
          }]
        };
      }),

      updateFeedItem: (id, updates) => set((state) => ({
        feedItems: state.feedItems.map(f => f.id === id ? { ...f, ...updates } : f)
      })),

      deleteFeedItem: (id) => set((state) => ({
        feedItems: state.feedItems.filter(f => f.id !== id)
      })),

      // Export data in BasheerExportData format (matches Android)
      exportData: () => {
        const state = get();
        
        return {
          version: "1.0",
          subject: state.subject ? {
            id: state.subject.id,
            nameAr: state.subject.nameAr,
            nameEn: state.subject.nameEn || null,
            path: state.subject.path,
            isMajor: state.subject.isMajor || false,
            order: state.subject.order || 0,
            colorHex: state.subject.colorHex || null,
          } : null,
          tags: state.tags.map(tag => ({
            id: tag.id,
            nameAr: tag.nameAr,
            nameEn: tag.nameEn || null,
          })),
          concepts: state.concepts.map(concept => ({
            id: concept.id,
            type: concept.type,
            titleAr: concept.titleAr,
            titleEn: concept.titleEn || null,
            definition: concept.definition || '',
            shortDefinition: concept.shortDefinition || null,
            formula: concept.formula || null,
            imageUrl: concept.imageUrl || null,
            difficulty: concept.difficulty || 1,
            extraData: concept.extraData || null,
            tagIds: concept.tagIds || [],
          })),
          units: state.units.sort((a, b) => a.order - b.order).map(unit => ({
            id: unit.id,
            title: unit.title,
            order: unit.order,
            description: unit.description || null,
            lessons: state.lessons
              .filter(l => l.unitId === unit.id)
              .sort((a, b) => a.order - b.order)
              .map(lesson => ({
                id: lesson.id,
                title: lesson.title,
                order: lesson.order,
                estimatedMinutes: lesson.estimatedMinutes || 15,
                summary: lesson.summary || null,
                sections: state.sections
                  .filter(s => s.lessonId === lesson.id)
                  .sort((a, b) => a.order - b.order)
                  .map(section => ({
                    id: section.id,
                    title: section.title,
                    order: section.order,
                    conceptIds: section.conceptIds || [],
                    blocks: state.blocks
                      .filter(b => b.sectionId === section.id)
                      .sort((a, b) => a.order - b.order)
                      .map(block => ({
                        id: block.id,
                        type: block.type,
                        content: block.content || '',
                        order: block.order,
                        conceptRef: block.conceptRef || null,
                        caption: block.caption || null,
                        metadata: block.metadata || null,
                      }))
                  }))
              }))
          })),
          questions: [], // Placeholder for future
          exams: [],     // Placeholder for future
          feedItems: state.feedItems.map(item => ({
            id: item.id,
            conceptId: item.conceptId,
            type: item.type,
            contentAr: item.contentAr || '',
            contentEn: item.contentEn || null,
            imageUrl: item.imageUrl || null,
            interactionType: item.interactionType || null,
            correctAnswer: item.correctAnswer || null,
            options: item.options || null,
            explanation: item.explanation || null,
            priority: item.priority || 1,
            order: item.order || 0,
          })),
        };
      },

      // Import from BasheerExportData format
      importData: (data) => {
        const units = [];
        const lessons = [];
        const sections = [];
        const blocks = [];

        if (data.units) {
          data.units.forEach(unit => {
            const { lessons: unitLessons, ...unitData } = unit;
            units.push(unitData);

            if (unitLessons) {
              unitLessons.forEach(lesson => {
                const { sections: lessonSections, ...lessonData } = lesson;
                lessons.push({ ...lessonData, unitId: unit.id });

                if (lessonSections) {
                  lessonSections.forEach(section => {
                    const { blocks: sectionBlocks, ...sectionData } = section;
                    sections.push({ ...sectionData, lessonId: lesson.id });

                    if (sectionBlocks) {
                      sectionBlocks.forEach(block => {
                        blocks.push({ ...block, sectionId: section.id });
                      });
                    }
                  });
                }
              });
            }
          });
        }

        set({
          subject: data.subject || null,
          units,
          lessons,
          sections,
          blocks,
          tags: data.tags || [],
          concepts: data.concepts || [],
          feedItems: data.feedItems || [],
        });
      },

      resetAll: () => set({
        subject: null,
        units: [],
        lessons: [],
        sections: [],
        blocks: [],
        concepts: [],
        tags: [],
        feedItems: [],
      }),
    }),
    { name: 'basheer-data' }
  )
);

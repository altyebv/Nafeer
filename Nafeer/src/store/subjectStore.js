import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildSubjectScaffold } from '@/shared/curriculum';

const generateId = (prefix) =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

// ─── subjectStore ─────────────────────────────────────────────────────────────
// Owns: subject, units, lessons
//
// Phase 1: persists to localStorage (same as old dataStore.js).
// Phase 2: will add Atlas sync. Each mutating action will also call the API
//          in the background (optimistic updates — store changes immediately).

export const useSubjectStore = create(
  persist(
    (set, get) => ({
      // ── Data ──────────────────────────────────────────────────────────────
      subject: null,
      units:   [],
      lessons: [],

      // ── Sync state (used in Phase 2) ──────────────────────────────────────
      isSyncing:   false,
      lastSyncedAt: null,
      syncError:    null,

      // ── Subject ───────────────────────────────────────────────────────────
      setSubject: (subject) =>
        set({ subject: { ...subject, id: subject.id || generateId('subj') } }),

      // ── Units ─────────────────────────────────────────────────────────────
      addUnit: (unit) =>
        set((state) => {
          const nextOrder = state.units.reduce((m, u) => Math.max(m, u.order), 0) + 1;
          // Deterministic ID: matches Android convention SUBJECT_U<n>
          // Falls back to this pattern even for manually added units so IDs
          // never diverge from what the seeder expects.
          const subjectId = state.subject?.id ?? 'UNKNOWN';
          const id = unit.id || `${subjectId}_U${nextOrder}`;
          return {
            units: [
              ...state.units,
              {
                ...unit,
                id,
                order:     unit.order ?? nextOrder,
                bookId:    unit.bookId    || null,
                bookTitle: unit.bookTitle || null,
              },
            ],
          };
        }),

      updateUnit: (id, updates) =>
        set((state) => ({
          units: state.units.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        })),

      deleteUnit: (id) =>
        set((state) => {
          const lessonIds = state.lessons.filter((l) => l.unitId === id).map((l) => l.id);
          return {
            units:   state.units.filter((u) => u.id !== id),
            lessons: state.lessons.filter((l) => l.unitId !== id),
            // NOTE: sections/blocks are owned by contentStore — caller must clean those up
          };
        }),

      // ── Lessons ───────────────────────────────────────────────────────────
      addLesson: (lesson) =>
        set((state) => {
          const unitLessons = state.lessons.filter((l) => l.unitId === lesson.unitId);
          const nextOrder   = unitLessons.reduce((m, l) => Math.max(m, l.order), 0) + 1;
          return {
            lessons: [
              ...state.lessons,
              {
                ...lesson,
                id:               lesson.id || `${lesson.unitId}_L${nextOrder}`,
                order:            nextOrder,
                estimatedMinutes: lesson.estimatedMinutes || 15,
                parentLesson:     lesson.parentLesson  || null,
                variationType:    lesson.variationType || null,
                variationNote:    lesson.variationNote || null,
                groupId:          lesson.groupId       || null,
                groupTitle:       lesson.groupTitle    || null,
                groupMetadata:    lesson.groupMetadata || null,
              },
            ],
          };
        }),

      updateLesson: (id, updates) =>
        set((state) => ({
          lessons: state.lessons.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),

      deleteLesson: (id) =>
        set((state) => ({
          lessons: state.lessons.filter((l) => l.id !== id),
        })),

      // ── Bootstrap ─────────────────────────────────────────────────────────
      // Phase 1: works from localStorage cache only.
      // Phase 2: will call /api/content/subject to sync from Atlas.
      bootstrapFromSubject: (subjectId) => {
        const scaffold = buildSubjectScaffold(subjectId);
        if (!scaffold) return false;

        const state = get();
        if (state.subject?.id === subjectId && state.units.length > 0) return false;

        if (state.units.length > 0 && state.subject?.id !== subjectId) {
          get().resetSubject();
        }

        set({
          subject: scaffold.subject,
          units:   scaffold.units,
          lessons: scaffold.lessons,
        });
        return true;
      },

      // ── Load from Atlas data (Phase 2 will call this after API fetch) ─────
      loadFromAtlas: ({ subject, units, lessons }) => {
        set({ subject, units, lessons, lastSyncedAt: new Date().toISOString() });
      },

      // ── Reset ─────────────────────────────────────────────────────────────
      resetSubject: () => set({ subject: null, units: [], lessons: [] }),
    }),
    { name: 'basheer-subject' }
  )
);
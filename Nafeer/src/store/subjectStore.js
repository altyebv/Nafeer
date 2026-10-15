import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistConfig } from './persistConfig';
import { buildSubjectScaffold } from '@/shared/curriculum';
import { LESSON_FIELDS, mergeLesson, fromServerLesson } from '@/lib/editorSync';

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

      // Edits to saved fields mark the lesson `_dirty` (see lib/editorSync.js);
      // bookkeeping such as atlasStatus does not.
      updateLesson: (id, updates) =>
        set((state) => {
          const edits = Object.keys(updates).some((k) => LESSON_FIELDS.includes(k));
          return {
            lessons: state.lessons.map((l) =>
              l.id === id ? { ...l, ...updates, ...(edits && { _dirty: true }) } : l
            ),
          };
        }),

      // ── Server sync ───────────────────────────────────────────────────────
      // `doc` is a raw Lesson document (lesson GET or a save response).
      mergeServerLessonMeta: (doc) =>
        set((state) => ({
          lessons: state.lessons.map((l) => (l.id === doc.contentId ? mergeLesson(l, fromServerLesson(doc)) : l)),
        })),

      // After a save: clean at the new version unless edited mid-request.
      markLessonSaved: (sent, doc) =>
        set((state) => ({
          lessons: state.lessons.map((l) => {
            if (l.id !== sent.id) return l;
            const atlasStatus = doc.status || l.atlasStatus;
            return l === sent
              ? { ...l, atlasStatus, _v: doc.version ?? 1, _dirty: false }
              : { ...l, atlasStatus, _v: doc.version ?? 1 };
          }),
        })),

      // A save made outside syncAll (variation links) moved the version on;
      // follow it so the next save isn't refused against our own write.
      followLessonVersion: (doc, dirty) =>
        set((state) => ({
          lessons: state.lessons.map((l) =>
            l.id === doc.contentId ? { ...l, _v: doc.version ?? 1, _dirty: !!dirty } : l
          ),
        })),

      // Conflict resolution; `current` is the server's lesson document.
      keepMineLesson: (id, current) =>
        set((state) => ({
          lessons: state.lessons.map((l) =>
            l.id === id ? { ...l, _v: current?.version ?? 1, _dirty: true } : l
          ),
        })),

      takeTheirsLesson: (id, current) =>
        set((state) => ({
          lessons: state.lessons.map((l) =>
            l.id === id && current ? { ...l, ...fromServerLesson(current), _dirty: false } : l
          ),
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
      // Lessons with unsaved local edits survive the reload.
      loadFromAtlas: ({ subject, units, lessons }) => {
        const local = new Map(get().lessons.map((l) => [l.id, l]));
        set({
          subject,
          units,
          lessons: lessons.map((l) => mergeLesson(local.get(l.id), l)),
          lastSyncedAt: new Date().toISOString(),
        });
      },

      // ── Reset ─────────────────────────────────────────────────────────────
      resetSubject: () => set({ subject: null, units: [], lessons: [] }),
    }),
    persistConfig('basheer-subject', { subject: null, units: [], lessons: [] })
  )
);
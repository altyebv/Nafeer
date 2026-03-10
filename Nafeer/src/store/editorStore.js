import { create } from 'zustand';

// ─── editorStore ──────────────────────────────────────────────────────────────
// UI-only state for the editor shell. No localStorage persistence — resets
// on page load intentionally (navigation state shouldn't be remembered).

export const useEditorStore = create((set) => ({
  // Current view
  activePage:        'lessons',   // 'lessons' | 'feed' | 'quiz' | 'concepts' | 'export' | 'overview'
  selectedLessonId:  null,        // contentId of the lesson being edited
  selectedUnitId:    null,        // contentId of the active unit filter
  selectedConceptId: null,        // contentId of the concept being edited

  // Panel visibility
  isSidebarCollapsed: false,
  activeModal:        null,       // modal identifier string or null

  // Sync indicators (set by domain stores)
  isSyncing:  false,
  syncError:  null,
  lastSynced: null,

  // ── Actions ─────────────────────────────────────────────────────────────
  setActivePage: (page) => set({ activePage: page, selectedLessonId: null }),

  setSelectedLesson: (lessonId) => set({ selectedLessonId: lessonId, activePage: 'lessons' }),

  setSelectedUnit: (unitId) => set({ selectedUnitId: unitId }),

  setSelectedConcept: (conceptId) => set({ selectedConceptId: conceptId }),

  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: ()       => set({ activeModal: null }),

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSyncStatus: ({ isSyncing, syncError, lastSynced }) =>
    set({ isSyncing, syncError, lastSynced: lastSynced || null }),
}));

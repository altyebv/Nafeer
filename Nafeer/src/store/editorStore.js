import { create } from 'zustand';

// ─── editorStore ──────────────────────────────────────────────────────────────
// UI-only state for the editor shell. No localStorage persistence — resets
// on page load intentionally (navigation state shouldn't be remembered).

export const useEditorStore = create((set) => ({
  // Current view
  activePage:        'lessons',   // 'lessons' | 'editor' | 'feeds' | 'quizbank' | 'concepts' | 'export' | 'overview'
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
  setActivePage: (page) => set({ activePage: page, selectedLessonId: null, selectedUnitId: null }),

  setEditorRoute: (page, params = {}) => set((state) => {
    const hasLesson = Object.prototype.hasOwnProperty.call(params, 'lessonId');
    const hasUnit   = Object.prototype.hasOwnProperty.call(params, 'unitId');

    return {
      activePage: page,
      selectedLessonId: page === 'editor'
        ? (hasLesson ? params.lessonId : state.selectedLessonId)
        : null,
      selectedUnitId: page === 'editor'
        ? (hasUnit ? params.unitId : state.selectedUnitId)
        : null,
    };
  }),

  resetNavigation: () => set({
    activePage:        'lessons',
    selectedLessonId:  null,
    selectedUnitId:    null,
    selectedConceptId: null,
    activeModal:       null,
  }),

  setSelectedLesson: (lessonId) => set({ selectedLessonId: lessonId, activePage: 'editor' }),

  setSelectedUnit: (unitId) => set({ selectedUnitId: unitId }),

  setSelectedConcept: (conceptId) => set({ selectedConceptId: conceptId }),

  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: ()       => set({ activeModal: null }),

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  setSyncStatus: ({ isSyncing, syncError, lastSynced }) =>
    set({ isSyncing, syncError, lastSynced: lastSynced || null }),
}));

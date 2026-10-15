'use client';
import { useEffect } from 'react';
import { useSubjectStore } from '@/store/subjectStore';
import { useContentStore } from '@/store/contentStore';

// ─── useAutosave ──────────────────────────────────────────────────────────────
// Saves a lesson's unsaved changes once the contributor pauses, and when they
// leave the lesson. One save per burst of work, never per keystroke — the
// editor runs on free tiers, so the delay is deliberately long. A save sends
// only what changed (see useAtlasSync.syncAll), so a quiet lesson costs nothing.
//
// Closing or reloading the tab can't run a multi-request save reliably, so
// that case gets the browser's "leave site?" prompt instead. The edits would
// survive in local storage anyway, but nobody else would see them.

export const AUTOSAVE_DELAY_MS = 30_000;

export function lessonHasUnsaved(lessonId) {
  const lesson = useSubjectStore.getState().lessons.find((l) => l.id === lessonId);
  if (lesson?._dirty) return true;
  const { sections, blocks } = useContentStore.getState();
  const ids = new Set(sections.filter((s) => s.lessonId === lessonId).map((s) => s.id));
  return sections.some((s) => ids.has(s.id) && s._dirty) || blocks.some((b) => ids.has(b.sectionId) && b._dirty);
}

export function useAutosave(lessonId, subjectId, syncAll) {
  useEffect(() => {
    if (!lessonId || !subjectId) return;
    let timer = null;

    const save = () => {
      timer = null;
      if (!lessonHasUnsaved(lessonId)) return;
      // Errors and conflicts are already shown by the sync status and the
      // conflict panel; an autosave has nothing to add.
      syncAll(lessonId, subjectId, { auto: true }).catch(() => {});
    };

    // Any change to the cached content restarts the countdown. Saves change
    // the cache too, but leave nothing unsaved, so they schedule nothing.
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = lessonHasUnsaved(lessonId) ? setTimeout(save, AUTOSAVE_DELAY_MS) : null;
    };
    const unsubContent = useContentStore.subscribe(schedule);
    const unsubSubject = useSubjectStore.subscribe(schedule);

    const warn = (e) => {
      if (!lessonHasUnsaved(lessonId)) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);

    schedule();
    return () => {
      unsubContent();
      unsubSubject();
      window.removeEventListener('beforeunload', warn);
      if (timer) clearTimeout(timer);
      // Leaving the lesson (another lesson, another page): save now.
      if (lessonHasUnsaved(lessonId)) save();
    };
  }, [lessonId, subjectId, syncAll]);
}

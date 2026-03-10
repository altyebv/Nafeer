'use client';
import { useCallback } from 'react';
import { useEditorStore }  from '@/store/editorStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useContentStore } from '@/store/contentStore';
import { useConceptStore } from '@/store/conceptStore';
import { useFeedStore }    from '@/store/feedStore';
import { useQuizStore }    from '@/store/quizStore';

// ─── useAtlasSync ─────────────────────────────────────────────────────────────
// Exposes explicit save functions for each content type.
// Pattern: optimistic (store is already updated) → API call → on success, do nothing
//          → on error, surface error in editorStore without reverting local state
//          (local state is still valid, can retry)
//
// Usage:
//   const { syncLesson, syncLessonContent, isSyncing, syncError } = useAtlasSync();
//   await syncLesson(lessonId);                    // save lesson meta only
//   await syncLessonContent(lessonId, subjectId);  // save sections + blocks
//   await syncAll(lessonId, subjectId);            // both in sequence
//
export function useAtlasSync() {
  const { setSyncStatus } = useEditorStore();
  const { lessons }                          = useSubjectStore();
  const { sections, blocks }                 = useContentStore();
  const { concepts }                         = useConceptStore();
  const { feedItems }                        = useFeedStore();
  const { questions }                        = useQuizStore();

  const { isSyncing, syncError, lastSynced } = useEditorStore();

  // ── Internal helpers ────────────────────────────────────────────────────────

  const setLoading = useCallback(() =>
    setSyncStatus({ isSyncing: true, syncError: null, lastSynced: null }),
  [setSyncStatus]);

  const setDone = useCallback(() =>
    setSyncStatus({ isSyncing: false, syncError: null, lastSynced: new Date().toISOString() }),
  [setSyncStatus]);

  const setError = useCallback((msg) =>
    setSyncStatus({ isSyncing: false, syncError: msg, lastSynced: null }),
  [setSyncStatus]);

  const apiFetch = useCallback(async (url, options = {}) => {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'خطأ غير معروف');
    return json.data;
  }, []);

  // ── Bootstrap subject from Atlas ─────────────────────────────────────────────
  // Called on editor mount. Creates Subject + Units + Lessons in Atlas if new.
  const bootstrapSubject = useCallback(async (subjectId) => {
    try {
      setLoading();
      await apiFetch('/api/content/subject', {
        method: 'POST',
        body: JSON.stringify({ subjectId }),
      });
      setDone();
      return true;
    } catch (e) {
      // Non-fatal — editor works offline if bootstrap fails
      console.warn('[bootstrapSubject] Atlas unreachable, working locally:', e.message);
      setSyncStatus({ isSyncing: false, syncError: null, lastSynced: null });
      return false;
    }
  }, [apiFetch, setLoading, setDone, setSyncStatus]);

  // ── Sync lesson meta (title, summary, estimatedMinutes) ───────────────────────
  const syncLesson = useCallback(async (lessonId) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    try {
      setLoading();
      await apiFetch(`/api/content/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify({
          title:            lesson.title,
          summary:          lesson.summary,
          estimatedMinutes: lesson.estimatedMinutes,
          note:             '',
        }),
      });
      setDone();
    } catch (e) {
      setError(`فشل حفظ الدرس: ${e.message}`);
      throw e;
    }
  }, [lessons, apiFetch, setLoading, setDone, setError]);

  // ── Sync all sections + blocks for a lesson ────────────────────────────────
  const syncLessonContent = useCallback(async (lessonId, subjectId) => {
    const lessonSections = sections.filter((s) => s.lessonId === lessonId);
    const sectionIds     = lessonSections.map((s) => s.id);
    const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));

    try {
      // Sections batch
      if (lessonSections.length > 0) {
        await apiFetch('/api/content/sections', {
          method: 'POST',
          body: JSON.stringify({
            sections: lessonSections.map((s) => ({
              contentId:       s.id,
              subjectId,
              lessonContentId: lessonId,
              title:           s.title,
              order:           s.order,
              learningType:    s.learningType || 'UNDERSTANDING',
              conceptIds:      s.conceptIds  || [],
            })),
          }),
        });
      }

      // Blocks batch
      if (lessonBlocks.length > 0) {
        await apiFetch('/api/content/blocks', {
          method: 'POST',
          body: JSON.stringify({
            blocks: lessonBlocks.map((b) => ({
              contentId:        b.id,
              subjectId,
              sectionContentId: b.sectionId,
              type:             b.type,
              content:          b.content    || '',
              order:            b.order,
              conceptRef:       b.conceptRef || null,
              caption:          b.caption    || null,
              metadata:         b.metadata   || null,
            })),
          }),
        });
      }
    } catch (e) {
      setError(`فشل حفظ المحتوى: ${e.message}`);
      throw e;
    }
  }, [sections, blocks, apiFetch, setError]);

  // ── Save lesson + all its sections + blocks ────────────────────────────────
  // Single call from the "Save" button in LessonEditorPage.
  const syncAll = useCallback(async (lessonId, subjectId) => {
    setLoading();
    try {
      await syncLesson(lessonId);
      await syncLessonContent(lessonId, subjectId);
      setDone();
    } catch {
      // setError already called by individual functions
    }
  }, [syncLesson, syncLessonContent, setLoading, setDone]);

  // ── Sync a single concept ─────────────────────────────────────────────────
  const syncConcept = useCallback(async (conceptId, subjectId) => {
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return;

    try {
      setLoading();
      // Try PUT first; if 404, POST (new concept)
      const res = await fetch(`/api/content/concepts/${conceptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:            concept.type,
          titleAr:         concept.titleAr,
          titleEn:         concept.titleEn         || null,
          definition:      concept.definition      || '',
          shortDefinition: concept.shortDefinition || null,
          formula:         concept.formula         || null,
          imageUrl:        concept.imageUrl        || null,
          difficulty:      concept.difficulty      || 1,
          extraData:       concept.extraData       || null,
          tagIds:          concept.tagIds          || [],
        }),
      });

      const json = await res.json();
      if (!json.ok && res.status === 404) {
        // Doesn't exist in Atlas yet — create it
        await apiFetch('/api/content/concepts', {
          method: 'POST',
          body: JSON.stringify({ ...concept, contentId: conceptId, subjectId }),
        });
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      }
      setDone();
    } catch (e) {
      setError(`فشل حفظ المفهوم: ${e.message}`);
      throw e;
    }
  }, [concepts, apiFetch, setLoading, setDone, setError]);

  // ── Sync a single feed item ───────────────────────────────────────────────
  const syncFeedItem = useCallback(async (feedItemId, subjectId) => {
    const item = feedItems.find((f) => f.id === feedItemId);
    if (!item) return;

    try {
      setLoading();
      const res = await fetch(`/api/content/feed-items/${feedItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:            item.type,
          contentAr:       item.contentAr       || '',
          contentEn:       item.contentEn       || null,
          back:            item.back            || null,
          imageUrl:        item.imageUrl        || null,
          interactionType: item.interactionType || null,
          correctAnswer:   item.correctAnswer   || null,
          options:         item.options         || null,
          explanation:     item.explanation     || null,
          questionContentId: item.questionId   || null,
          priority:        item.priority        || 1,
          order:           item.order           || 0,
        }),
      });

      const json = await res.json();
      if (!json.ok && res.status === 404) {
        await apiFetch('/api/content/feed-items', {
          method: 'POST',
          body: JSON.stringify({
            contentId:        feedItemId,
            subjectId,
            conceptContentId: item.conceptId,
            lessonContentId:  item.lessonId || null,
            type:             item.type,
            contentAr:        item.contentAr    || '',
            contentEn:        item.contentEn    || null,
            back:             item.back         || null,
            imageUrl:         item.imageUrl     || null,
            interactionType:  item.interactionType || null,
            correctAnswer:    item.correctAnswer || null,
            options:          item.options      || null,
            explanation:      item.explanation  || null,
            priority:         item.priority     || 1,
            order:            item.order        || 0,
          }),
        });
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      }
      setDone();
    } catch (e) {
      setError(`فشل حفظ عنصر التغذية: ${e.message}`);
      throw e;
    }
  }, [feedItems, apiFetch, setLoading, setDone, setError]);

  // ── Sync a single question ────────────────────────────────────────────────
  const syncQuestion = useCallback(async (questionId, subjectId) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    try {
      setLoading();
      const payload = {
        type:             question.type,
        textAr:           question.textAr,
        textEn:           question.textEn           || null,
        correctAnswer:    question.correctAnswer,
        options:          question.options           || null,
        explanation:      question.explanation       || null,
        imageUrl:         question.imageUrl          || null,
        tableData:        question.tableData         || null,
        difficulty:       question.difficulty        || 1,
        points:           question.points            || 1,
        estimatedSeconds: question.estimatedSeconds  || 60,
        cognitiveLevel:   question.cognitiveLevel    || 'RECALL',
        source:           question.source            || 'ORIGINAL',
        sourceExamContentId: question.sourceExamId  || null,
        sourceDetails:    question.sourceDetails     || null,
        sourceYear:       question.sourceYear        || null,
        feedEligible:     question.feedEligible      || false,
        unitContentId:    question.unitId            || null,
        lessonContentId:  question.lessonId          || null,
        conceptIds:       question.conceptIds        || [],
      };

      const res = await fetch(`/api/content/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!json.ok && res.status === 404) {
        await apiFetch('/api/content/questions', {
          method: 'POST',
          body: JSON.stringify({ ...payload, contentId: questionId, subjectId }),
        });
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      }
      setDone();
    } catch (e) {
      setError(`فشل حفظ السؤال: ${e.message}`);
      throw e;
    }
  }, [questions, apiFetch, setLoading, setDone, setError]);

  // ── Delete helpers ─────────────────────────────────────────────────────────
  // Fire-and-forget deletes. Store is already updated optimistically.
  const deleteRemote = useCallback(async (url) => {
    try {
      await apiFetch(url, { method: 'DELETE' });
    } catch (e) {
      console.warn(`[deleteRemote] ${url} failed:`, e.message);
    }
  }, [apiFetch]);

  return {
    // State
    isSyncing,
    syncError,
    lastSynced,

    // Sync functions
    bootstrapSubject,
    syncLesson,
    syncLessonContent,
    syncAll,
    syncConcept,
    syncFeedItem,
    syncQuestion,

    // Delete helpers
    deleteSection:  (id) => deleteRemote(`/api/content/sections/${id}`),
    deleteBlock:    (id) => deleteRemote(`/api/content/blocks/${id}`),
    deleteConcept:  (id) => deleteRemote(`/api/content/concepts/${id}`),
    deleteFeedItem: (id) => deleteRemote(`/api/content/feed-items/${id}`),
    deleteQuestion: (id) => deleteRemote(`/api/content/questions/${id}`),
  };
}

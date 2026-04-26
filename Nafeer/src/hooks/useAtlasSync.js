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
// Pattern: optimistic (store already updated) → API call → surface error if it fails
//
// Phase 3 additions:
//   - bootstrapSubject now loads existing Atlas data back into stores
//     (fixes the "returning contributor on new device starts empty" gap)
//   - Each sync function updates atlasStatus in the store from the server response
//   - submitForReview(contentId, type) — transitions status to 'review'
//
export function useAtlasSync() {
  const { setSyncStatus }                             = useEditorStore();
  const { lessons, updateLesson, loadFromAtlas }      = useSubjectStore();
  const { sections, blocks }                          = useContentStore();
  const { concepts, updateConcept }                   = useConceptStore();
  const { feedItems, updateFeedItem }                 = useFeedStore();
  const { questions, exams, updateQuestion }              = useQuizStore();
  const { isSyncing, syncError, lastSynced }          = useEditorStore();

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

  // ── Bootstrap + load from Atlas ─────────────────────────────────────────────
  // Called on editor mount:
  //   1) Ensures Subject + Units + Lessons scaffold exists in Atlas (safe to repeat)
  //   2) Loads actual Atlas data (incl. atlasStatus) back into stores
  //      — fixes "returning contributor on new device starts empty" gap
  //
  const bootstrapSubject = useCallback(async (subjectId) => {
    try {
      setLoading();

      // Step 1 — ensure scaffold
      await apiFetch('/api/content/subject', {
        method: 'POST',
        body:   JSON.stringify({ subjectId }),
      });

      // Step 2 — load existing Atlas data into stores
      try {
        const atlasData = await apiFetch(`/api/content/subject?subjectId=${subjectId}`);
        if (atlasData?.units) {
          const units = atlasData.units.map((u) => ({
            id:    u.contentId,
            title: u.title,
            order: u.order,
          }));

          const loadedLessons = atlasData.units.flatMap((u) =>
            (u.lessons || []).map((l) => ({
              id:               l.contentId,
              unitId:           u.contentId,
              title:            l.title,
              order:            l.order,
              estimatedMinutes: l.estimatedMinutes || 15,
              summary:          l.summary          || null,
              atlasStatus:      l.status           || 'draft',
            }))
          );

          const subject = atlasData.subject
            ? {
                id:     atlasData.subject.subjectId,
                nameAr: atlasData.subject.nameAr,
                nameEn: atlasData.subject.nameEn || null,
              }
            : null;

          if (subject) loadFromAtlas({ subject, units, lessons: loadedLessons });
        }
      } catch (loadErr) {
        // Non-fatal — editor can work with local cache
        console.warn('[bootstrapSubject] Could not load Atlas data:', loadErr.message);
      }

      setDone();
      return true;
    } catch (e) {
      // Non-fatal — editor works offline if Atlas is unreachable
      console.warn('[bootstrapSubject] Atlas unreachable, working locally:', e.message);
      setSyncStatus({ isSyncing: false, syncError: null, lastSynced: null });
      return false;
    }
  }, [apiFetch, setLoading, setDone, setSyncStatus, loadFromAtlas]);

  // ── Sync lesson meta + content (Save button) ────────────────────────────────
  // Syncs: title, estimatedMinutes, summary → THEN sections → THEN blocks.
  // Updates atlasStatus in store from server response.
  //
  const syncAll = useCallback(async (lessonId, subjectId) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;

    const lessonSections = sections.filter((s) => s.lessonId === lessonId);
    const sectionIds     = lessonSections.map((s) => s.id);
    const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));

    try {
      setLoading();

      // ── lesson meta — upsert: PUT first, POST on 404 ──
      let lessonData;
      {
        const res  = await fetch(`/api/content/lessons/${lessonId}`, {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            title:            lesson.title,
            estimatedMinutes: lesson.estimatedMinutes,
            summary:          lesson.summary || null,
          }),
        });
        const json = await res.json();

        if (!json.ok && res.status === 404) {
          // Lesson was created locally (e.g. via UnitCard) but never synced to Atlas.
          // Create it now.
          lessonData = await apiFetch('/api/content/lessons', {
            method: 'POST',
            body:   JSON.stringify({
              contentId:        lessonId,
              subjectId,
              unitContentId:    lesson.unitId,
              title:            lesson.title,
              order:            lesson.order ?? 0,
              estimatedMinutes: lesson.estimatedMinutes || 15,
              summary:          lesson.summary          || null,
            }),
          });
        } else if (!json.ok) {
          throw new Error(json.error || 'فشل حفظ الدرس');
        } else {
          lessonData = json.data;
        }
      }
      if (lessonData?.status) {
        updateLesson(lessonId, { atlasStatus: lessonData.status });
      }

      // ── sections ──
      if (lessonSections.length > 0) {
        await apiFetch('/api/content/sections', {
          method: 'POST',
          body:   JSON.stringify({
            lessonContentId: lessonId,
            subjectId,
            sections: lessonSections.map((s) => ({
              contentId:       s.id,
              subjectId,
              lessonContentId: lessonId,         
              title:           s.title,
              order:           s.order,
              learningType:    s.learningType || 'UNDERSTANDING',
              conceptIds:      s.conceptIds   || [],
              partIndex:       s.partIndex    ?? 0,
            }))
          }),
        });
      }

      // ── blocks ──
      if (lessonBlocks.length > 0) {
        await apiFetch('/api/content/blocks', {
          method: 'POST',
          body:   JSON.stringify({
            blocks: lessonBlocks.map((b) => ({
              contentId:        b.id,
              subjectId,                         // ← ADDED
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

      setDone();
    } catch (e) {
      setError(`فشل الحفظ: ${e.message}`);
      throw e;
    }
  }, [lessons, sections, blocks, apiFetch, setLoading, setDone, setError, updateLesson]);

  // ── Sync lesson meta only ──────────────────────────────────────────────────
  const syncLesson = useCallback(async (lessonId) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    try {
      setLoading();
      const data = await apiFetch(`/api/content/lessons/${lessonId}`, {
        method: 'PUT',
        body:   JSON.stringify({
          title:            lesson.title,
          estimatedMinutes: lesson.estimatedMinutes,
          summary:          lesson.summary       || null,
          metadata:         lesson.metadata      || null,
          parentLesson:     lesson.parentLesson  || null,
          variationType:    lesson.variationType || null,
          variationNote:    lesson.variationNote || null,
        }),
      });
      if (data?.status) updateLesson(lessonId, { atlasStatus: data.status });
      setDone();
    } catch (e) {
      setError(`فشل حفظ الدرس: ${e.message}`);
      throw e;
    }
  }, [lessons, apiFetch, setLoading, setDone, setError, updateLesson]);

  // ── Sync sections + blocks only ────────────────────────────────────────────
  const syncLessonContent = useCallback(async (lessonId, subjectId) => {
    const lessonSections = sections.filter((s) => s.lessonId === lessonId);
    const sectionIds     = lessonSections.map((s) => s.id);
    const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));
    try {
      setLoading();
      if (lessonSections.length > 0) {
        await apiFetch('/api/content/sections', {
          method: 'POST',
          body:   JSON.stringify({
            lessonContentId: lessonId,
            subjectId,
            sections: lessonSections.map((s) => ({
              contentId:    s.id,
              title:        s.title,
              order:        s.order,
              learningType: s.learningType || 'UNDERSTANDING',
              conceptIds:   s.conceptIds  || [],
              partIndex:    s.partIndex   ?? 0,
            })),
          }),
        });
      }
      if (lessonBlocks.length > 0) {
        await apiFetch('/api/content/blocks', {
          method: 'POST',
          body:   JSON.stringify({
            blocks: lessonBlocks.map((b) => ({
              contentId:        b.id,
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
      setDone();
    } catch (e) {
      setError(`فشل حفظ المحتوى: ${e.message}`);
      throw e;
    }
  }, [sections, blocks, apiFetch, setLoading, setDone, setError]);

  // ── Sync concept ──────────────────────────────────────────────────────────
  const syncConcept = useCallback(async (conceptId, subjectId) => {
    const concept = concepts.find((c) => c.id === conceptId);
    if (!concept) return;
    try {
      setLoading();
      const payload = {
        type:            concept.type,
        titleAr:         concept.titleAr,
        titleEn:         concept.titleEn         || null,
        definition:      concept.definition      || '',
        shortDefinition: concept.shortDefinition || null,
        formula:         concept.formula         || null,
        imageUrl:        concept.imageUrl         || null,
        difficulty:      concept.difficulty       || 1,
        extraData:       concept.extraData        || null,
        tagIds:          concept.tagIds           || [],
      };

      const res  = await fetch(`/api/content/concepts/${conceptId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      let atlasStatus = 'draft';
      if (!json.ok && res.status === 404) {
        const created = await apiFetch('/api/content/concepts', {
          method: 'POST',
          body:   JSON.stringify({ ...payload, contentId: conceptId, subjectId }),
        });
        atlasStatus = created?.status || 'draft';
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      } else {
        atlasStatus = json.data?.status || 'draft';
      }
      updateConcept(conceptId, { atlasStatus });
      setDone();
    } catch (e) {
      setError(`فشل حفظ المفهوم: ${e.message}`);
      throw e;
    }
  }, [concepts, apiFetch, setLoading, setDone, setError, updateConcept]);

  // ── Sync feed item ────────────────────────────────────────────────────────
  const syncFeedItem = useCallback(async (feedItemId, subjectId) => {
    const item = useFeedStore.getState().feedItems.find((f) => f.id === feedItemId);
  if (!item) return;
    try {
      setLoading();
      const payload = {
        type:              item.type,
        contentAr:         item.contentAr         || '',
        contentEn:         item.contentEn         || null,
        back:              item.back              || null,
        imageUrl:          item.imageUrl          || null,
        interactionType:   item.interactionType   || null,
        correctAnswer:     item.correctAnswer     || null,
        options:           item.options           || null,
        explanation:       item.explanation       || null,
        questionContentId: item.questionId        || null,
        priority:          item.priority          || 1,
        order:             item.order             || 0,
      };

      const res  = await fetch(`/api/content/feed-items/${feedItemId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      let atlasStatus = 'draft';
      if (!json.ok && res.status === 404) {
        const created = await apiFetch('/api/content/feed-items', {
          method: 'POST',
          body:   JSON.stringify({
            ...payload,
            contentId:        feedItemId,
            subjectId,
            conceptContentId: item.conceptId,
            lessonContentId:  item.lessonId || null,
          }),
        });
        atlasStatus = created?.status || 'draft';
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      } else {
        atlasStatus = json.data?.status || 'draft';
      }
      updateFeedItem(feedItemId, { atlasStatus });
      setDone();
    } catch (e) {
      setError(`فشل حفظ عنصر التغذية: ${e.message}`);
      throw e;
    }
  }, [apiFetch, setLoading, setDone, setError, updateFeedItem]);

  // ── Sync question ─────────────────────────────────────────────────────────
  const syncQuestion = useCallback(async (questionId, subjectId) => {
    const question = useQuizStore.getState().questions.find((q) => q.id === questionId);
  if (!question) return
    try {
      setLoading();
      const payload = {
        type:                question.type,
        textAr:              question.textAr,
        textEn:              question.textEn              || null,
        correctAnswer:       question.correctAnswer,
        options:             question.options             || null,
        explanation:         question.explanation         || null,
        imageUrl:            question.imageUrl            || null,
        tableData:           question.tableData           || null,
        difficulty:          question.difficulty          || 1,
        points:              question.points              || 1,
        estimatedSeconds:    question.estimatedSeconds    || 60,
        cognitiveLevel:      question.cognitiveLevel      || 'RECALL',
        source:              question.source              || 'ORIGINAL',
        sourceExamContentId: question.sourceExamId       || null,
        sourceDetails:       question.sourceDetails      || null,
        sourceYear:          question.sourceYear          || null,
        feedEligible:        question.feedEligible        || false,
        unitContentId:       question.unitId              || null,
        lessonContentId:     question.lessonId            || null,
        sectionContentId:    question.sectionId           || null,
        isCheckpoint:        question.isCheckpoint        || false,
        conceptIds:          question.conceptIds          || [],
      };

      const res  = await fetch(`/api/content/questions/${questionId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      let atlasStatus = 'draft';
      if (!json.ok && res.status === 404) {
        const created = await apiFetch('/api/content/questions', {
          method: 'POST',
          body:   JSON.stringify({ ...payload, contentId: questionId, subjectId }),
        });
        atlasStatus = created?.status || 'draft';
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      } else {
        atlasStatus = json.data?.status || 'draft';
      }
      updateQuestion(questionId, { atlasStatus });
      setDone();
    } catch (e) {
      setError(`فشل حفظ السؤال: ${e.message}`);
      throw e;
    }
  }, [questions, apiFetch, setLoading, setDone, setError, updateQuestion]);

  // ── Sync exam ────────────────────────────────────────────────────────────
  // Upsert pattern: PUT first, create on 404.
  // Note: exams are lightweight (no big status flow), so no atlasStatus tracking.
  //
  const syncExam = useCallback(async (examId, subjectId) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    try {
      const payload = {
        titleAr:            exam.titleAr,
        titleEn:            exam.titleEn           || null,
        source:             exam.source            || 'MINISTRY',
        year:               exam.year              || null,
        schoolName:         exam.schoolName        || null,
        duration:           exam.duration          || null,
        totalPoints:        exam.totalPoints       || null,
        description:        exam.description       || null,
        examType:           exam.examType          || null,
        questionContentIds: exam.questionIds       || [],
        sectionsJson:       exam.sectionsJson      || null,
      };

      const res  = await fetch(`/api/content/exams/${examId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const json = await res.json();

      if (!json.ok && res.status === 404) {
        await apiFetch('/api/content/exams', {
          method: 'POST',
          body:   JSON.stringify({ ...payload, contentId: examId, subjectId }),
        });
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      }
      // Exams don't surface sync errors to SyncBar — fire-and-forget from callers
    } catch (e) {
      console.warn(`[syncExam] ${examId} failed:`, e.message);
    }
  }, [exams, apiFetch]);

  // sync Tag 
  // In useAtlasSync.js, add this function:
const syncTag = useCallback(async (tagId, subjectId) => {
  const tag = useConceptStore.getState().tags.find((t) => t.id === tagId);
  if (!tag) return;
  try {
    setLoading();
    const res = await fetch(`/api/content/tags/${tagId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nameAr: tag.nameAr, nameEn: tag.nameEn || null }),
    });
    const json = await res.json();
    if (!json.ok && res.status === 404) {
      await apiFetch('/api/content/tags', {
        method: 'POST',
        body: JSON.stringify({ contentId: tagId, subjectId, nameAr: tag.nameAr, nameEn: tag.nameEn || null }),
      });
    } else if (!json.ok) {
      throw new Error(json.error);
    }
    setDone();
  } catch (e) {
    setError(`فشل حفظ الوسم: ${e.message}`);
  }
}, [apiFetch, setLoading, setDone, setError]);

  // ── Submit for review ─────────────────────────────────────────────────────
  // Moves a content item from 'draft' → 'review'.
  // Updates local atlasStatus optimistically so the UI reflects instantly.
  //
  // @param contentId  — stable string ID (lesson/concept/feedItem/question)
  // @param type       — 'lesson' | 'concept' | 'feedItem' | 'question'
  //
  const submitForReview = useCallback(async (contentId, type) => {
    const TYPE_TO_PATH = {
      lesson:   'lessons',
      concept:  'concepts',
      feedItem: 'feed-items',
      question: 'questions',
    };
    const path = TYPE_TO_PATH[type];
    if (!path) return;

    try {
      setLoading();
      await apiFetch(`/api/content/${path}/${contentId}`, {
        method: 'PATCH',
        body:   JSON.stringify({ status: 'review', note: 'إرسال للمراجعة من المحرر' }),
      });

      // Optimistic local update
      if (type === 'lesson')   updateLesson(contentId,   { atlasStatus: 'review' });
      if (type === 'concept')  updateConcept(contentId,  { atlasStatus: 'review' });
      if (type === 'feedItem') updateFeedItem(contentId, { atlasStatus: 'review' });
      if (type === 'question') updateQuestion(contentId, { atlasStatus: 'review' });

      setDone();
    } catch (e) {
      setError(`فشل إرسال للمراجعة: ${e.message}`);
    }
  }, [apiFetch, setLoading, setDone, setError, updateLesson, updateConcept, updateFeedItem, updateQuestion]);

  // ── Admin: approve directly (bypasses review queue) ──────────────────────
  // Saves all lesson content first, then PATCHes status → 'approved'.
  // Only used in the admin editor variant — contributors still go through review.
  //
  const approveAndSync = useCallback(async (lessonId, subjectId) => {
    try {
      // 1. Persist all content to Atlas first
      await syncAll(lessonId, subjectId);

      // 2. Directly approve — no review queue needed for admin
      setLoading();
      await apiFetch(`/api/content/lessons/${lessonId}`, {
        method: 'PATCH',
        body:   JSON.stringify({ status: 'approved', note: 'اعتماد مباشر من لوحة المشرف' }),
      });

      // 3. Update store so UI reflects immediately
      updateLesson(lessonId, { atlasStatus: 'approved' });
      setDone();
    } catch (e) {
      setError(`فشل الاعتماد: ${e.message}`);
      throw e;
    }
  }, [syncAll, apiFetch, setLoading, setDone, setError, updateLesson]);

  // ── Delete helpers ─────────────────────────────────────────────────────────
  // Fire-and-forget. Store is already updated optimistically.
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
    syncExam,
    syncTag,
    submitForReview,
    approveAndSync,

    // Delete helpers
    deleteSection:  (id) => deleteRemote(`/api/content/sections/${id}`),
    deleteBlock:    (id) => deleteRemote(`/api/content/blocks/${id}`),
    deleteConcept:  (id) => deleteRemote(`/api/content/concepts/${id}`),
    deleteFeedItem: (id) => deleteRemote(`/api/content/feed-items/${id}`),
    deleteQuestion: (id) => deleteRemote(`/api/content/questions/${id}`),
    deleteExam:     (id) => deleteRemote(`/api/content/exams/${id}`),
  };
}
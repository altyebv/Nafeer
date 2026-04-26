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
//
// FIX: Defined approveAtlasResource which was referenced by syncConcept /
// syncFeedItem / syncQuestion but never implemented — caused a runtime
// ReferenceError that silently killed every create/update for those three types.
//
export function useAtlasSync() {
  const { setSyncStatus }                             = useEditorStore();
  const { lessons, updateLesson, loadFromAtlas }      = useSubjectStore();
  const { sections, blocks }                          = useContentStore();
  const { updateConcept }                             = useConceptStore();
  const { updateFeedItem }                            = useFeedStore();
  const { exams, updateQuestion }                     = useQuizStore();
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

  // ── FIX: approveAtlasResource ─────────────────────────────────────────────
  // Was referenced but never defined — ReferenceError killed sync for concepts,
  // feed items, and questions whenever approve=true was passed.
  const approveAtlasResource = useCallback(async (resourcePath, contentId) => {
    await apiFetch(`/api/content/${resourcePath}/${contentId}`, {
      method: 'PATCH',
      body:   JSON.stringify({ status: 'approved', note: 'اعتماد مباشر من لوحة المشرف' }),
    });
  }, [apiFetch]);

  // ── Bootstrap + load from Atlas ─────────────────────────────────────────────
  const bootstrapSubject = useCallback(async (subjectId) => {
    try {
      setLoading();
      await apiFetch('/api/content/subject', {
        method: 'POST',
        body:   JSON.stringify({ subjectId }),
      });
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
            ? { id: atlasData.subject.subjectId, nameAr: atlasData.subject.nameAr, nameEn: atlasData.subject.nameEn || null }
            : null;
          if (subject) loadFromAtlas({ subject, units, lessons: loadedLessons });
        }
      } catch (loadErr) {
        console.warn('[bootstrapSubject] Could not load Atlas data:', loadErr.message);
      }
      setDone();
      return true;
    } catch (e) {
      console.warn('[bootstrapSubject] Atlas unreachable, working locally:', e.message);
      setSyncStatus({ isSyncing: false, syncError: null, lastSynced: null });
      return false;
    }
  }, [apiFetch, setLoading, setDone, setSyncStatus, loadFromAtlas]);

  // ── Sync lesson meta + content ───────────────────────────────────────────────
  const syncAll = useCallback(async (lessonId, subjectId) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    const lessonSections = sections.filter((s) => s.lessonId === lessonId);
    const sectionIds     = lessonSections.map((s) => s.id);
    const lessonBlocks   = blocks.filter((b) => sectionIds.includes(b.sectionId));
    try {
      setLoading();
      const lessonData = await apiFetch(`/api/content/lessons/${lessonId}`, {
        method: 'PUT',
        body:   JSON.stringify({ title: lesson.title, estimatedMinutes: lesson.estimatedMinutes, summary: lesson.summary || null }),
      });
      if (lessonData?.status) updateLesson(lessonId, { atlasStatus: lessonData.status });
      if (lessonSections.length > 0) {
        await apiFetch('/api/content/sections', {
          method: 'POST',
          body:   JSON.stringify({
            lessonContentId: lessonId,
            subjectId,
            sections: lessonSections.map((s) => ({
              contentId: s.id, subjectId, lessonContentId: lessonId,
              title: s.title, order: s.order, learningType: s.learningType || 'UNDERSTANDING',
              conceptIds: s.conceptIds || [], partIndex: s.partIndex ?? 0,
            })),
          }),
        });
      }
      if (lessonBlocks.length > 0) {
        await apiFetch('/api/content/blocks', {
          method: 'POST',
          body:   JSON.stringify({
            blocks: lessonBlocks.map((b) => ({
              contentId: b.id, sectionContentId: b.sectionId, type: b.type, subjectId,
              content: b.content || '', order: b.order, conceptRef: b.conceptRef || null,
              caption: b.caption || null, metadata: b.metadata || null,
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
          title: lesson.title, estimatedMinutes: lesson.estimatedMinutes,
          summary: lesson.summary || null, metadata: lesson.metadata || null,
          parentLesson: lesson.parentLesson || null, variationType: lesson.variationType || null,
          variationNote: lesson.variationNote || null,
        }),
      });
      if (data?.status) updateLesson(lessonId, { atlasStatus: data.status });
      setDone();
    } catch (e) {
      setError(`فشل حفظ الدرس: ${e.message}`);
      throw e;
    }
  }, [lessons, apiFetch, setLoading, setDone, setError, updateLesson]);

  // ── Sync sections + blocks ────────────────────────────────────────────────
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
            lessonContentId: lessonId, subjectId,
            sections: lessonSections.map((s) => ({
              contentId: s.id, title: s.title, order: s.order,
              learningType: s.learningType || 'UNDERSTANDING',
              conceptIds: s.conceptIds || [], partIndex: s.partIndex ?? 0,
            })),
          }),
        });
      }
      if (lessonBlocks.length > 0) {
        await apiFetch('/api/content/blocks', {
          method: 'POST',
          body:   JSON.stringify({
            blocks: lessonBlocks.map((b) => ({
              contentId: b.id, sectionContentId: b.sectionId, type: b.type,
              content: b.content || '', order: b.order,
              conceptRef: b.conceptRef || null, caption: b.caption || null, metadata: b.metadata || null,
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

  // ── Sync concept ─────────────────────────────────────────────────────────────
  const syncConcept = useCallback(async (conceptId, subjectId, approve = false) => {
    const concept = useConceptStore.getState().concepts.find((c) => c.id === conceptId);
    if (!concept) return;
    try {
      setLoading();
      const payload = {
        type: concept.type, titleAr: concept.titleAr, titleEn: concept.titleEn || null,
        definition: concept.definition || '', shortDefinition: concept.shortDefinition || null,
        formula: concept.formula || null, imageUrl: concept.imageUrl || null,
        difficulty: concept.difficulty || 1, extraData: concept.extraData || null,
        tagIds: concept.tagIds || [],
      };
      const res  = await fetch(`/api/content/concepts/${conceptId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      let atlasStatus = 'draft';
      if (!json.ok && res.status === 404) {
        const created = await apiFetch('/api/content/concepts', {
          method: 'POST', body: JSON.stringify({ ...payload, contentId: conceptId, subjectId }),
        });
        atlasStatus = created?.status || 'draft';
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      } else {
        atlasStatus = json.data?.status || 'draft';
      }
      if (approve) { await approveAtlasResource('concepts', conceptId); atlasStatus = 'approved'; }
      updateConcept(conceptId, { atlasStatus });
      setDone();
    } catch (e) {
      setError(`فشل حفظ المفهوم: ${e.message}`);
      throw e;
    }
  }, [apiFetch, approveAtlasResource, setLoading, setDone, setError, updateConcept]);

  // ── Sync tag ──────────────────────────────────────────────────────────────
  const syncTag = useCallback(async (tagId, subjectId) => {
    const tag = useConceptStore.getState().tags.find((t) => t.id === tagId);
    if (!tag) return;
    try {
      setLoading();
      const res = await fetch(`/api/content/tags/${tagId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameAr: tag.nameAr, nameEn: tag.nameEn || null }),
      });
      const json = await res.json();
      if (!json.ok && res.status === 404) {
        await apiFetch('/api/content/tags', {
          method: 'POST',
          body: JSON.stringify({ contentId: tagId, subjectId, nameAr: tag.nameAr, nameEn: tag.nameEn || null }),
        });
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      }
      setDone();
    } catch (e) {
      setError(`فشل حفظ الوسم: ${e.message}`);
      // Non-fatal — don't re-throw
    }
  }, [apiFetch, setLoading, setDone, setError]);

  // ── Sync feed item ────────────────────────────────────────────────────────
  const syncFeedItem = useCallback(async (feedItemId, subjectId, approve = false) => {
    const item = useFeedStore.getState().feedItems.find((f) => f.id === feedItemId);
    if (!item) return;
    try {
      setLoading();
      const payload = {
        type: item.type, contentAr: item.contentAr || '', contentEn: item.contentEn || null,
        back: item.back || null, imageUrl: item.imageUrl || null,
        interactionType: item.interactionType || null, correctAnswer: item.correctAnswer || null,
        options: item.options || null, explanation: item.explanation || null,
        questionContentId: item.questionId || null, priority: item.priority || 1, order: item.order || 0,
      };
      const res  = await fetch(`/api/content/feed-items/${feedItemId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      let atlasStatus = 'draft';
      if (!json.ok && res.status === 404) {
        const created = await apiFetch('/api/content/feed-items', {
          method: 'POST',
          body: JSON.stringify({
            ...payload, contentId: feedItemId, subjectId,
            conceptContentId: item.conceptId  || null,
            lessonContentId:  item.lessonId   || null,
            unitContentId:    item.unitId     || null,  // ← ADD
          }),
        });
        atlasStatus = created?.status || 'draft';
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      } else {
        atlasStatus = json.data?.status || 'draft';
      }
      if (approve) { await approveAtlasResource('feed-items', feedItemId); atlasStatus = 'approved'; }
      updateFeedItem(feedItemId, { atlasStatus });
      setDone();
    } catch (e) {
      setError(`فشل حفظ عنصر التغذية: ${e.message}`);
      throw e;
    }
  }, [apiFetch, approveAtlasResource, setLoading, setDone, setError, updateFeedItem]);

  // ── Sync question ─────────────────────────────────────────────────────────
  const syncQuestion = useCallback(async (questionId, subjectId, approve = false) => {
    const question = useQuizStore.getState().questions.find((q) => q.id === questionId);
    if (!question) return;
    try {
      setLoading();
      const payload = {
        type: question.type, textAr: question.textAr, textEn: question.textEn || null,
        correctAnswer: question.correctAnswer, options: question.options || null,
        explanation: question.explanation || null, imageUrl: question.imageUrl || null,
        tableData: question.tableData || null, difficulty: question.difficulty || 1,
        points: question.points || 1, estimatedSeconds: question.estimatedSeconds || 60,
        cognitiveLevel: question.cognitiveLevel || 'RECALL', source: question.source || 'ORIGINAL',
        sourceExamContentId: question.sourceExamId || null, sourceDetails: question.sourceDetails || null,
        sourceYear: question.sourceYear || null, feedEligible: question.feedEligible || false,
        unitContentId: question.unitId || null, lessonContentId: question.lessonId || null,
        sectionContentId: question.sectionId || null, isCheckpoint: question.isCheckpoint || false,
        conceptIds: question.conceptIds || [],
      };
      const res  = await fetch(`/api/content/questions/${questionId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      let atlasStatus = 'draft';
      if (!json.ok && res.status === 404) {
        const created = await apiFetch('/api/content/questions', {
          method: 'POST', body: JSON.stringify({ ...payload, contentId: questionId, subjectId }),
        });
        atlasStatus = created?.status || 'draft';
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      } else {
        atlasStatus = json.data?.status || 'draft';
      }
      if (approve) { await approveAtlasResource('questions', questionId); atlasStatus = 'approved'; }
      updateQuestion(questionId, { atlasStatus });
      setDone();
    } catch (e) {
      setError(`فشل حفظ السؤال: ${e.message}`);
      throw e;
    }
  }, [apiFetch, approveAtlasResource, setLoading, setDone, setError, updateQuestion]);

  // ── Sync exam ────────────────────────────────────────────────────────────
  const syncExam = useCallback(async (examId, subjectId) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    try {
      const payload = {
        titleAr: exam.titleAr, titleEn: exam.titleEn || null,
        source: exam.source || 'MINISTRY', year: exam.year || null,
        schoolName: exam.schoolName || null, duration: exam.duration || null,
        totalPoints: exam.totalPoints || null, description: exam.description || null,
        examType: exam.examType || null, questionContentIds: exam.questionIds || [],
        sectionsJson: exam.sectionsJson || null,
      };
      const res  = await fetch(`/api/content/exams/${examId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok && res.status === 404) {
        await apiFetch('/api/content/exams', {
          method: 'POST', body: JSON.stringify({ ...payload, contentId: examId, subjectId }),
        });
      } else if (!json.ok) {
        throw new Error(json.error || 'خطأ غير معروف');
      }
    } catch (e) {
      console.warn(`[syncExam] ${examId} failed:`, e.message);
    }
  }, [exams, apiFetch]);

  // ── Submit for review ─────────────────────────────────────────────────────
  const submitForReview = useCallback(async (contentId, type) => {
    const TYPE_TO_PATH = { lesson: 'lessons', concept: 'concepts', feedItem: 'feed-items', question: 'questions' };
    const path = TYPE_TO_PATH[type];
    if (!path) return;
    try {
      setLoading();
      await apiFetch(`/api/content/${path}/${contentId}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'review', note: 'إرسال للمراجعة من المحرر' }),
      });
      if (type === 'lesson')   updateLesson(contentId,   { atlasStatus: 'review' });
      if (type === 'concept')  updateConcept(contentId,  { atlasStatus: 'review' });
      if (type === 'feedItem') updateFeedItem(contentId, { atlasStatus: 'review' });
      if (type === 'question') updateQuestion(contentId, { atlasStatus: 'review' });
      setDone();
    } catch (e) {
      setError(`فشل إرسال للمراجعة: ${e.message}`);
    }
  }, [apiFetch, setLoading, setDone, setError, updateLesson, updateConcept, updateFeedItem, updateQuestion]);

  // ── Admin: approve directly ───────────────────────────────────────────────
  const approveAndSync = useCallback(async (lessonId, subjectId) => {
    try {
      await syncAll(lessonId, subjectId);
      setLoading();
      await apiFetch(`/api/content/lessons/${lessonId}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'approved', note: 'اعتماد مباشر من لوحة المشرف' }),
      });
      updateLesson(lessonId, { atlasStatus: 'approved' });
      setDone();
    } catch (e) {
      setError(`فشل الاعتماد: ${e.message}`);
      throw e;
    }
  }, [syncAll, apiFetch, setLoading, setDone, setError, updateLesson]);

  // ── Delete helpers ─────────────────────────────────────────────────────────
  const deleteRemote = useCallback(async (url) => {
    try { await apiFetch(url, { method: 'DELETE' }); }
    catch (e) { console.warn(`[deleteRemote] ${url} failed:`, e.message); }
  }, [apiFetch]);

  return {
    isSyncing, syncError, lastSynced,
    bootstrapSubject, syncLesson, syncLessonContent, syncAll,
    syncConcept,
    syncConceptAndApprove: (conceptId, subjectId) => syncConcept(conceptId, subjectId, true),
    syncTag,
    syncFeedItem,
    syncFeedItemAndApprove: (feedItemId, subjectId) => syncFeedItem(feedItemId, subjectId, true),
    syncQuestion,
    syncQuestionAndApprove: (questionId, subjectId) => syncQuestion(questionId, subjectId, true),
    syncExam, submitForReview, approveAndSync,
    deleteSection:  (id) => deleteRemote(`/api/content/sections/${id}`),
    deleteBlock:    (id) => deleteRemote(`/api/content/blocks/${id}`),
    deleteConcept:  (id) => deleteRemote(`/api/content/concepts/${id}`),
    deleteTag:      (id) => deleteRemote(`/api/content/tags/${id}`),
    deleteFeedItem: (id) => deleteRemote(`/api/content/feed-items/${id}`),
    deleteQuestion: (id) => deleteRemote(`/api/content/questions/${id}`),
    deleteExam:     (id) => deleteRemote(`/api/content/exams/${id}`),
  };
}
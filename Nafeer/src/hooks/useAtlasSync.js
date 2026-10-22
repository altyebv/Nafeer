'use client';
import { useCallback } from 'react';
import { useEditorStore } from '@/store/editorStore';
import { useSubjectStore } from '@/store/subjectStore';
import { useContentStore } from '@/store/contentStore';
import { useConceptStore } from '@/store/conceptStore';
import { useFeedStore } from '@/store/feedStore';
import { useQuizStore } from '@/store/quizStore';
import { lessonPayload, sectionPayload, blockPayload } from '@/lib/editorSync';

// ─── useAtlasSync ─────────────────────────────────────────────────────────────
// Exposes explicit save functions for each content type.
//
// FIX: Defined approveAtlasResource which was referenced by syncConcept /
// syncFeedItem / syncQuestion but never implemented — caused a runtime
// ReferenceError that silently killed every create/update for those three types.
//
export function useAtlasSync() {
  // ── Non-reactive by design ──────────────────────────────────────────────────
  // This used to call useEditorStore(), useSubjectStore(), useContentStore(),
  // useConceptStore(), useFeedStore() and useQuizStore() with no selectors —
  // six whole-store subscriptions. The hook is used by eleven components,
  // including BlockEditor, which renders once per block, so a keystroke in any
  // block re-rendered every block editor, every panel and the shell.
  //
  // Nothing here needs to be reactive: the actions are stable for the life of
  // the store, and the data is only read when a sync callback actually fires.
  // Reading via getState() gives the callbacks stable identities too, which
  // stops their dependency arrays from invalidating on every data change.
  //
  // Components that need to *display* sync state read it from editorStore
  // directly — see SyncBanner.
  const { setSyncStatus }              = useEditorStore.getState();
  const { updateLesson, loadFromAtlas } = useSubjectStore.getState();
  const { updateConcept }              = useConceptStore.getState();
  const { updateFeedItem }             = useFeedStore.getState();
  const { updateQuestion }             = useQuizStore.getState();

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

  // Batch save — returns the written docs and the conflicts beside them.
  const postBatch = useCallback(async (url, body) => {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'خطأ غير معروف');
    return { data: json.data || [], conflicts: json.conflicts || [] };
  }, []);

  // ── FIX: approveAtlasResource ─────────────────────────────────────────────
  // Was referenced but never defined — ReferenceError killed sync for concepts,
  // feed items, and questions whenever approve=true was passed.
  const approveAtlasResource = useCallback(async (resourcePath, contentId) => {
    await apiFetch(`/api/content/${resourcePath}/${contentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'approved', note: 'اعتماد مباشر من لوحة المشرف' }),
    });
  }, [apiFetch]);

  // ── Bootstrap + load from Atlas ─────────────────────────────────────────────
  const bootstrapSubject = useCallback(async (subjectId) => {
    try {
      setLoading();
      try {
        // Read first; create only when the subject is not in Atlas yet. The
        // create (POST) used to run on every editor load — idempotent, but a
        // request and a dozen queries per visit on the free tier. Completing
        // a partly seeded subject is now the admin subject page's «أكمل».
        let atlasData = await apiFetch(`/api/content/subject?subjectId=${subjectId}`).catch(() => null);
        if (!atlasData?.subject) {
          await apiFetch('/api/content/subject', { method: 'POST', body: JSON.stringify({ subjectId }) });
          atlasData = await apiFetch(`/api/content/subject?subjectId=${subjectId}`);
        }
        if (atlasData?.units) {
          const units = atlasData.units.map((u) => ({
            id: u.contentId,
            title: u.title,
            order: u.order,
          }));
          const loadedLessons = atlasData.units.flatMap((u) =>
            (u.lessons || []).map((l) => ({
              id:               l.contentId,
              unitId:           u.contentId,
              title:            l.title,
              order:            l.order,
              estimatedMinutes: l.estimatedMinutes  || 15,
              summary:          l.summary           || null,
              metadata:         l.metadata          || null,
              parentLesson:     l.parentLesson       || null,
              variationType:    l.variationType      || null,
              variationNote:    l.variationNote      || null,
              groupId:          l.groupId            || null,
              groupTitle:       l.groupTitle         || null,
              groupMetadata:    l.groupMetadata      || null,
              atlasStatus:      l.status             || 'draft',
              reviewState:      l.reviewState        ?? null,
              // Whose it is, and whether it is unclaimed scaffold (lib/api/subject.js).
              owner:            l.owner              ?? null,
              unclaimed:        !!l.unclaimed,
              _v:               l.version            ?? 1,
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

      // ── Load concepts for this subject ────────────────────────────────────
      try {
        const rawConcepts = await apiFetch(`/api/content/concepts?subjectId=${subjectId}`);
        if (Array.isArray(rawConcepts)) {
          useConceptStore.getState().loadConcepts(
            rawConcepts.map((c) => ({
              id:              c.contentId,
              subjectId:       c.subjectId,
              type:            c.type,
              titleAr:         c.titleAr,
              titleEn:         c.titleEn         || null,
              definition:      c.definition      || '',
              shortDefinition: c.shortDefinition || null,
              formula:         c.formula         || null,
              imageUrl:        c.imageUrl         || null,
              difficulty:      c.difficulty      || 1,
              tagIds:          c.tagIds          || [],
              extraData:       c.extraData       || null,
              atlasStatus:     c.status          || 'draft',
            }))
          );
        }
      } catch (conceptsErr) {
        console.warn('[bootstrapSubject] Could not load concepts:', conceptsErr.message);
      }

      // ── Load questions for this subject ───────────────────────────────────
      try {
        const rawQuestions = await apiFetch(`/api/content/questions?subjectId=${subjectId}`);
        if (Array.isArray(rawQuestions)) {
          useQuizStore.getState().loadQuestions(
            rawQuestions.map((q) => ({
              id:               q.contentId,
              subjectId:        q.subjectId,
              type:             q.type,
              textAr:           q.textAr,
              textEn:           q.textEn           || null,
              correctAnswer:    q.correctAnswer,
              options:          q.options          || null,
              explanation:      q.explanation      || null,
              mistakeNote:      q.mistakeNote      || null,
              optionNotes:      q.optionNotes      || [],
              acceptedAnswers:  q.acceptedAnswers  || [],
              imageUrl:         q.imageUrl         || null,
              tableData:        q.tableData        || null,
              difficulty:       q.difficulty       || 1,
              points:           q.points           || 1,
              estimatedSeconds: q.estimatedSeconds || 60,
              cognitiveLevel:   q.cognitiveLevel   || 'RECALL',
              source:           q.source           || 'ORIGINAL',
              sourceExamId:     q.sourceExamContentId  || null,
              sourceDetails:    q.sourceDetails    || null,
              sourceYear:       q.sourceYear       || null,
              feedEligible:     q.feedEligible     || false,
              unitId:           q.unitContentId    || null,
              lessonId:         q.lessonContentId  || null,
              sectionId:        q.sectionContentId || null,
              isCheckpoint:     q.isCheckpoint     || false,
              conceptIds:       q.conceptIds       || [],
              markers:          q.markers          || [],
              markerMode:       q.markerMode       || null,
              image:            q.image            || null,
              atlasStatus:      q.status           || 'draft',
            }))
          );
        }
      } catch (questionsErr) {
        console.warn('[bootstrapSubject] Could not load questions:', questionsErr.message);
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
  // Sends only what changed since the last save (`_dirty`), each item with the
  // server version it was based on. Nothing changed → no request at all; the
  // usual save is one request. Items someone else changed or deleted first are
  // not written — they come back as conflicts for LessonConflicts to resolve,
  // and the call rejects so submit/approve stop. See lib/editorSync.js.
  //
  // { auto: true } is the autosave: items already waiting on a conflict are
  // left out (resending them would only conflict again) and stay listed.
  // Resolves to { saved } — how many items were written.
  // `versionLabel` (manual saves only) tags this save in the lesson's history;
  // with a label the lesson is written even if only its content changed.
  const syncAll = useCallback(async (lessonId, subjectId, { auto = false, versionLabel = '' } = {}) => {
    // Read at call time, not render time — see the note at the top of the hook.
    const { lessons, markLessonSaved } = useSubjectStore.getState();
    const { sections, blocks, markSaved } = useContentStore.getState();
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return { saved: 0 };
    const { conflicts: pending, setConflicts } = useEditorStore.getState();
    const held = auto && pending.lessonId === lessonId ? pending.items : [];
    const heldIds = new Set(held.map((c) => c.contentId));
    const send = (item) => item._dirty && !heldIds.has(item.id);

    const lessonSections = sections.filter((s) => s.lessonId === lessonId);
    const sectionIds     = new Set(lessonSections.map((s) => s.id));
    const dirtySections  = lessonSections.filter(send);
    const dirtyBlocks    = blocks.filter((b) => sectionIds.has(b.sectionId) && send(b));
    const conflicts      = [...held];
    let saved = 0;
    const collect = (kind, sent, found = []) => {
      const mine = new Map(sent.map((i) => [i.id, i]));
      for (const c of found) conflicts.push({ kind, ...c, mine: mine.get(c.contentId) ?? null });
    };

    try {
      setLoading();

      const label = auto ? '' : versionLabel.trim();
      if (send(lesson) || (label && !heldIds.has(lesson.id))) {
        const lessonRes = await fetch(`/api/content/lessons/${lessonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...lessonPayload(lesson), ...(label ? { versionLabel: label } : {}) }),
        });
        const lessonJson = await lessonRes.json();

        if (lessonRes.status === 409) {
          collect('lessons', [lesson], [lessonJson.conflict]);
        } else if (!lessonJson.ok && lessonRes.status === 404) {
          // Never reached Atlas (scaffolded locally) — create it.
          const { baseVersion, ...fields } = lessonPayload(lesson);
          const created = await apiFetch('/api/content/lessons', {
            method: 'POST',
            body: JSON.stringify({
              ...fields,
              contentId:        lessonId,
              subjectId,
              unitContentId:    lesson.unitId,
              order:            lesson.order,
              estimatedMinutes: lesson.estimatedMinutes || 15,
            }),
          });
          if (created) { markLessonSaved(lesson, created); saved += 1; }
        } else if (!lessonJson.ok) {
          throw new Error(lessonJson.error || 'خطأ غير معروف');
        } else {
          markLessonSaved(lesson, lessonJson.data);
          saved += 1;
        }
      }

      // Sections before blocks: a new block's section must exist first.
      if (dirtySections.length > 0) {
        const { data, conflicts: found } = await postBatch('/api/content/sections', {
          lessonContentId: lessonId,
          subjectId,
          sections: dirtySections.map((s) => sectionPayload(s, subjectId)),
        });
        markSaved('sections', dirtySections, data);
        saved += data.length;
        collect('sections', dirtySections, found);
      }

      if (dirtyBlocks.length > 0) {
        const { data, conflicts: found } = await postBatch('/api/content/blocks', {
          blocks: dirtyBlocks.map((b) => blockPayload(b, subjectId)),
        });
        markSaved('blocks', dirtyBlocks, data);
        saved += data.length;
        collect('blocks', dirtyBlocks, found);
      }
    } catch (e) {
      setError(`فشل الحفظ: ${e.message}`);
      throw e;
    }

    setConflicts(lessonId, conflicts);
    if (conflicts.length > 0) {
      setSyncStatus({ isSyncing: false, syncError: null, lastSynced: null });
      throw Object.assign(new Error('version conflict'), { conflicts, saved });
    }
    setDone();
    return { saved };
  }, [apiFetch, postBatch, setLoading, setDone, setError, setSyncStatus]);

 // ── syncLesson ───────────────────────────────────────────────────────────────
const syncLesson = useCallback(async (lessonId, subjectId) => {
  const { lessons } = useSubjectStore.getState();
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) return;
  try {
    setLoading();
    const res  = await fetch(`/api/content/lessons/${lessonId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:            lesson.title,
        estimatedMinutes: lesson.estimatedMinutes,
        summary:          lesson.summary       || null,
        metadata:         lesson.metadata      || null,
        parentLesson:     lesson.parentLesson   || null,
        variationType:    lesson.variationType  || null,
        variationNote:    lesson.variationNote  || null,
        groupId:          lesson.groupId        || null,
        groupTitle:       lesson.groupTitle     || null,
        groupMetadata:    lesson.groupMetadata  || null,
      }),
    });
    const json = await res.json();

    if (!json.ok && res.status === 404) {
      const created = await apiFetch('/api/content/lessons', {
        method: 'POST',
        body: JSON.stringify({
          contentId:        lessonId,
          subjectId,
          unitContentId:    lesson.unitId,
          title:            lesson.title,
          order:            lesson.order,
          estimatedMinutes: lesson.estimatedMinutes || 15,
          summary:          lesson.summary       || null,
          metadata:         lesson.metadata      || null,
          parentLesson:     lesson.parentLesson   || null,
          variationType:    lesson.variationType  || null,
          variationNote:    lesson.variationNote  || null,
          groupId:          lesson.groupId        || null,
          groupTitle:       lesson.groupTitle     || null,
          groupMetadata:    lesson.groupMetadata  || null,
        }),
      });
      if (created?.status) updateLesson(lessonId, { atlasStatus: created.status });
    } else if (!json.ok) {
      throw new Error(json.error || 'خطأ غير معروف');
    } else {
      if (json.data?.status) updateLesson(lessonId, { atlasStatus: json.data.status });
    }
    setDone();
  } catch (e) {
    setError(`فشل حفظ الدرس: ${e.message}`);
    throw e;
  }
}, [apiFetch, setLoading, setDone, setError, updateLesson]);

  // ── Sync sections + blocks ────────────────────────────────────────────────
  const syncLessonContent = useCallback(async (lessonId, subjectId) => {
    const { sections, blocks } = useContentStore.getState();
    const lessonSections = sections.filter((s) => s.lessonId === lessonId);
    const sectionIds = lessonSections.map((s) => s.id);
    const lessonBlocks = blocks.filter((b) => sectionIds.includes(b.sectionId));
    try {
      setLoading();
      if (lessonSections.length > 0) {
        await apiFetch('/api/content/sections', {
          method: 'POST',
          body: JSON.stringify({
            lessonContentId: lessonId, subjectId,
            sections: lessonSections.map((s) => ({
              contentId: s.id, title: s.title, order: s.order,
              learningType: s.learningType || 'UNDERSTANDING', kind: s.kind || 'GENERAL',
              conceptIds: s.conceptIds || [], partIndex: s.partIndex ?? 0,
            })),
          }),
        });
      }
      if (lessonBlocks.length > 0) {
        await apiFetch('/api/content/blocks', {
          method: 'POST',
          body: JSON.stringify({
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
  }, [apiFetch, setLoading, setDone, setError]);

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
      const res = await fetch(`/api/content/concepts/${conceptId}`, {
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
      const res = await fetch(`/api/content/feed-items/${feedItemId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      let atlasStatus = 'draft';
      if (!json.ok && res.status === 404) {
        const created = await apiFetch('/api/content/feed-items', {
          method: 'POST',
          body: JSON.stringify({
            ...payload, contentId: feedItemId, subjectId,
            conceptContentId: item.conceptId || null,
            lessonContentId: item.lessonId || null,
            unitContentId: item.unitId || null,  // ← ADD
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
        mistakeNote: question.mistakeNote || null, optionNotes: question.optionNotes || [],
        acceptedAnswers: question.acceptedAnswers || [],
        tableData: question.tableData || null, difficulty: question.difficulty || 1,
        points: question.points || 1, estimatedSeconds: question.estimatedSeconds || 60,
        cognitiveLevel: question.cognitiveLevel || 'RECALL', source: question.source || 'ORIGINAL',
        sourceExamContentId: question.sourceExamId || null, sourceDetails: question.sourceDetails || null,
        sourceYear: question.sourceYear || null, feedEligible: question.feedEligible || false,
        unitContentId: question.unitId || null, lessonContentId: question.lessonId || null,
        sectionContentId: question.sectionId || null, isCheckpoint: question.isCheckpoint || false,
        conceptIds: question.conceptIds || [],
        markers: question.markers || [], markerMode: question.markerMode || null, image: question.image || null,
      };
      const res = await fetch(`/api/content/questions/${questionId}`, {
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
    const { exams } = useQuizStore.getState();
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
      const res = await fetch(`/api/content/exams/${examId}`, {
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
  }, [apiFetch]);

  // ── Submit for review ─────────────────────────────────────────────────────
  // Returns true when the item is now in review. It used to return nothing
  // either way, so the lesson header announced "أُرسل" even when the request
  // failed — and with the resubmit gate (lib/review.js) a refusal is normal.
  const submitForReview = useCallback(async (contentId, type) => {
    const TYPE_TO_PATH = { lesson: 'lessons', concept: 'concepts', feedItem: 'feed-items', question: 'questions' };
    const path = TYPE_TO_PATH[type];
    if (!path) return false;
    try {
      setLoading();
      await apiFetch(`/api/content/${path}/${contentId}`, {
        method: 'PATCH', body: JSON.stringify({ status: 'review', note: 'إرسال للمراجعة من المحرر' }),
      });
      if (type === 'lesson') {
        const prev = useSubjectStore.getState().lessons.find((l) => l.id === contentId)?.reviewState;
        updateLesson(contentId, {
          atlasStatus: 'review',
          reviewState: { ...(prev || {}), returned: false, submittedAt: new Date().toISOString() },
        });
      }
      if (type === 'concept') updateConcept(contentId, { atlasStatus: 'review' });
      if (type === 'feedItem') updateFeedItem(contentId, { atlasStatus: 'review' });
      if (type === 'question') updateQuestion(contentId, { atlasStatus: 'review' });
      setDone();
      return true;
    } catch (e) {
      setError(`فشل إرسال للمراجعة: ${e.message}`);
      return false;
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

  // No isSyncing/syncError/lastSynced here — returning them would make this
  // hook reactive again and re-render all eleven consumers on every sync tick.
  // Read them from editorStore with a selector instead (see SyncBanner).
  return {
    bootstrapSubject, syncLesson, syncLessonContent, syncAll,
    syncConcept,
    syncConceptAndApprove: (conceptId, subjectId) => syncConcept(conceptId, subjectId, true),
    syncTag,
    syncFeedItem,
    syncFeedItemAndApprove: (feedItemId, subjectId) => syncFeedItem(feedItemId, subjectId, true),
    syncQuestion,
    syncQuestionAndApprove: (questionId, subjectId) => syncQuestion(questionId, subjectId, true),
    syncExam, submitForReview, approveAndSync,
    deleteSection: (id) => deleteRemote(`/api/content/sections/${id}`),
    deleteBlock: (id) => deleteRemote(`/api/content/blocks/${id}`),
    deleteConcept: (id) => deleteRemote(`/api/content/concepts/${id}`),
    deleteTag: (id) => deleteRemote(`/api/content/tags/${id}`),
    deleteFeedItem: (id) => deleteRemote(`/api/content/feed-items/${id}`),
    deleteQuestion: (id) => deleteRemote(`/api/content/questions/${id}`),
    deleteExam: (id) => deleteRemote(`/api/content/exams/${id}`),
  };
}
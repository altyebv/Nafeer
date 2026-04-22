'use client';
import { useState, useEffect, useCallback } from 'react';
import { SectionHeader } from './ui/shared';

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatusBadge({ seeded, missingUnits, missingLessons, staleUnits, staleLessons, catalogError }) {
  if (catalogError) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-red-800/60 bg-red-950/40 text-red-400">خطأ</span>
  );
  if (!seeded) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-ink-700/60 bg-ink-900/40 text-ink-500">فارغ</span>
  );
  const hasIssues = missingUnits > 0 || missingLessons > 0 || staleUnits > 0 || staleLessons > 0;
  if (hasIssues) return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-amber-800/60 bg-amber-950/40 text-amber-400">ناقص</span>
  );
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono border border-green-800/60 bg-green-950/40 text-green-400">مكتمل</span>
  );
}

function TrackBadge({ track }) {
  const styles = { COMMON: 'border-sky-800/50 text-sky-400/80', SCIENCE: 'border-emerald-800/50 text-emerald-400/80', LITERARY: 'border-purple-800/50 text-purple-400/80' };
  const labels = { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${styles[track] || 'border-ink-700 text-ink-500'}`}>
      {labels[track] || track}
    </span>
  );
}

function Bar({ value, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: '#d4891e' }} />
    </div>
  );
}

function ActionBtn({ onClick, loading, disabled, variant = 'default', children }) {
  const variants = {
    default: 'border-ink-700/60 text-ink-400 hover:border-sand-700/50 hover:text-sand-300',
    green:   'border-green-800/60 text-green-400 hover:border-green-700/60',
    amber:   'border-amber-800/60 text-amber-400 hover:border-amber-700/60',
    red:     'border-red-800/60 text-red-400 hover:border-red-700/60',
  };
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-all ${variants[variant]} ${loading || disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {loading && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

// ─── Seed Subject Row ──────────────────────────────────────────────────────────

function SubjectRow({ s, onAction }) {
  const [busy, setBusy]           = useState(null);
  const [expanded, setExpanded]   = useState(false);
  const [confirmWipe, setConfirm] = useState(false);

  const run = async (action) => {
    setBusy(action);
    await onAction(s.id, action);
    setBusy(null);
    setConfirm(false);
  };

  const hasStale   = s.staleUnits > 0 || s.staleLessons > 0;
  const hasMissing = s.missingUnits > 0 || s.missingLessons > 0;

  return (
    <div
      className="rounded-xl border transition-all duration-200 overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.015)',
        borderColor: s.catalogError ? 'rgba(239,68,68,0.25)' : s.seeded && !hasMissing && !hasStale ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)',
      }}
    >
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setExpanded((v) => !v)}>
        <span className="text-ink-700 text-xs font-mono shrink-0">{expanded ? '▾' : '▸'}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-arabic text-sm font-semibold text-ink-200">{s.nameAr}</span>
            <TrackBadge track={s.track} />
            {s.isMajor && <span className="text-[9px] px-1.5 py-0.5 rounded font-mono border border-sand-800/40 text-sand-600">رئيسي</span>}
            <StatusBadge {...s} />
          </div>
          <div className="flex items-center gap-3">
            <Bar value={s.dbLessons} max={s.expectedLessons} />
            <span className="text-[10px] font-mono text-ink-600 shrink-0 w-12 text-left" dir="ltr">{s.dbLessons}/{s.expectedLessons}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {!s.seeded && !s.catalogError && (
            <ActionBtn variant="green" loading={busy === 'bootstrap'} onClick={() => run('bootstrap')}>بذر</ActionBtn>
          )}
          {s.seeded && hasMissing && (
            <ActionBtn variant="amber" loading={busy === 'bootstrap'} onClick={() => run('bootstrap')}>إكمال</ActionBtn>
          )}
          {hasStale && (
            <ActionBtn variant="red" loading={busy === 'wipe_stale'} onClick={() => run('wipe_stale')}>حذف قديم</ActionBtn>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {s.catalogError && (
            <p className="text-xs text-red-400 font-arabic mb-3 py-2 px-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {s.catalogError}
            </p>
          )}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'الوحدات', db: s.dbUnits,         expected: s.expectedUnits   },
              { label: 'الدروس',  db: s.dbLessons,       expected: s.expectedLessons },
              { label: 'معتمد',   db: s.approvedLessons, expected: s.dbLessons       },
            ].map(({ label, db, expected }) => (
              <div key={label} className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-[10px] text-ink-600 font-arabic mb-1">{label}</p>
                <p className="text-lg font-bold font-mono" style={{ color: 'var(--accent)' }}>{db}</p>
                {expected > 0 && <p className="text-[10px] font-mono text-ink-700">/ {expected}</p>}
              </div>
            ))}
          </div>

          {(hasMissing || hasStale) && (
            <div className="space-y-1.5 mb-4">
              {s.missingUnits   > 0 && <p className="text-[11px] font-arabic text-amber-400/80">◎ {s.missingUnits} وحدة ناقصة</p>}
              {s.missingLessons > 0 && <p className="text-[11px] font-arabic text-amber-400/80">◎ {s.missingLessons} درس ناقص</p>}
              {s.staleUnits     > 0 && <p className="text-[11px] font-arabic text-red-400/80">✕ {s.staleUnits} وحدة قديمة</p>}
              {s.staleLessons   > 0 && <p className="text-[11px] font-arabic text-red-400/80">✕ {s.staleLessons} درس قديم</p>}
            </div>
          )}

          <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)' }}>
            <p className="text-[10px] font-mono text-red-500/60 mb-2 uppercase tracking-wider">منطقة الخطر</p>
            <div className="flex gap-2 flex-wrap">
              {s.seeded && (
                <ActionBtn variant="amber" loading={busy === 'reseed'} onClick={() => run('reseed')}>إعادة بذر</ActionBtn>
              )}
              {confirmWipe ? (
                <>
                  <ActionBtn variant="red" loading={busy === 'wipe'} onClick={() => run('wipe')}>تأكيد المسح الكامل</ActionBtn>
                  <ActionBtn onClick={() => setConfirm(false)}>إلغاء</ActionBtn>
                </>
              ) : (
                <ActionBtn variant="red" onClick={() => setConfirm(true)}>مسح كامل…</ActionBtn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mock Publisher ───────────────────────────────────────────────────────────
// DEV TOOL — builds a synthetic BasheerExportData JSON, uploads to Supabase,
// and updates the Firestore manifest so the app downloads it on next launch.
// Bypass small CMS↔App field mismatches by editing the JSON directly.

const MOCK_TEMPLATE = {
  version: '2.0',
  subject: {
    id:       'TEST_SUBJECT',
    nameAr:   'مادة تجريبية',
    nameEn:   'Test Subject',
    path:     'SCIENCE',
    isMajor:  false,
    order:    99,
    colorHex: '#6366f1',
  },
  tags: [
    { id: 'tag_test_001', nameAr: 'وسم تجريبي', nameEn: 'Test Tag' },
  ],
  concepts: [
    {
      id:              'concept_test_001',
      type:            'DEFINITION',
      titleAr:         'مفهوم تجريبي',
      titleEn:         'Test Concept',
      definition:      'تعريف تجريبي لاختبار pipeline النشر البعيد',
      shortDefinition: 'تعريف مختصر',
      formula:         null,
      imageUrl:        null,
      difficulty:      1,
      extraData:       null,
      tagIds:          ['tag_test_001'],
    },
  ],
  units: [
    {
      id:          'unit_test_001',
      title:       'وحدة تجريبية',
      order:       1,
      description: 'وحدة لاختبار pipeline النشر البعيد',
      bookId:      null,
      bookTitle:   null,
      lessons: [
        {
          id:               'lesson_test_001',
          title:            'درس تجريبي',
          order:            1,
          estimatedMinutes: 5,
          summary:          'درس تجريبي للتحقق من pipeline النشر الكامل',
          metadata:         null,
          parentLesson:     null,
          variationType:    null,
          variationNote:    null,
          groupId:          null,
          groupTitle:       null,
          groupMetadata:    null,
          sections: [
            {
              id:           'sec_test_001',
              title:        'قسم تجريبي',
              order:        1,
              partIndex:    0,
              learningType: 'UNDERSTANDING',
              conceptIds:   ['concept_test_001'],
              blocks: [
                {
                  id:         'blk_test_001',
                  type:       'TEXT',
                  content:    'هذا نص تجريبي للتحقق من أن pipeline النشر البعيد يعمل بشكل صحيح. إذا ظهر هذا الدرس في التطبيق فالنظام يعمل ✓',
                  order:      1,
                  conceptRef: null,
                  caption:    null,
                  metadata:   null,
                },
                {
                  id:         'blk_test_002',
                  type:       'HEADING',
                  content:    'اختبار العناوين',
                  order:      2,
                  conceptRef: null,
                  caption:    null,
                  metadata:   '{"level": 2}',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  questions: [
    {
      id:               'q_test_001',
      type:             'MCQ',
      textAr:           'أي من التالي يدل على نجاح pipeline النشر البعيد؟',
      textEn:           null,
      correctAnswer:    'ظهور هذا السؤال في التطبيق',
      options:          JSON.stringify(['ظهور هذا السؤال في التطبيق', 'عدم ظهور السؤال', 'خطأ في التحميل', 'لا شيء مما سبق']),
      explanation:      'إذا ظهر هذا السؤال، فالنظام يعمل بشكل صحيح من Nafeer إلى Basheer.',
      imageUrl:         null,
      tableData:        null,
      difficulty:       1,
      points:           1,
      estimatedSeconds: 20,
      cognitiveLevel:   'RECALL',
      source:           'ORIGINAL',
      sourceExamId:     null,
      sourceDetails:    null,
      sourceYear:       null,
      feedEligible:     true,
      unitId:           'unit_test_001',
      lessonId:         'lesson_test_001',
      sectionId:        null,
      isCheckpoint:     false,
      conceptIds:       ['concept_test_001'],
      markers:          null,
    },
    {
      id:               'q_test_002',
      type:             'TRUE_FALSE',
      textAr:           'النشر البعيد يتطلب تحديث التطبيق في المتجر',
      textEn:           null,
      correctAnswer:    'false',
      options:          null,
      explanation:      'النشر البعيد يسمح بتحديث المحتوى دون تحديث التطبيق.',
      imageUrl:         null,
      tableData:        null,
      difficulty:       1,
      points:           1,
      estimatedSeconds: 15,
      cognitiveLevel:   'RECALL',
      source:           'ORIGINAL',
      sourceExamId:     null,
      sourceDetails:    null,
      sourceYear:       null,
      feedEligible:     true,
      unitId:           'unit_test_001',
      lessonId:         'lesson_test_001',
      sectionId:        null,
      isCheckpoint:     false,
      conceptIds:       [],
      markers:          null,
    },
  ],
  exams: [],
  feedItems: [
    {
      id:              'feed_test_001',
      conceptId:       'concept_test_001',
      type:            'DEFINITION',
      contentAr:       'مفهوم تجريبي: تعريف لاختبار pipeline النشر البعيد',
      contentEn:       null,
      back:            null,
      imageUrl:        null,
      interactionType: null,
      correctAnswer:   null,
      options:         null,
      explanation:     null,
      questionId:      null,
      priority:        1,
      order:           1,
    },
  ],
};

function MockPublisher() {
  const [open,              setOpen]             = useState(false);
  const [manifestSubjectId, setManifestId]       = useState('TEST_SUBJECT');
  const [jsonText,          setJsonText]          = useState(JSON.stringify(MOCK_TEMPLATE, null, 2));
  const [parseError,        setParseError]        = useState(null);
  const [publishing,        setPublishing]        = useState(false);
  const [result,            setResult]            = useState(null);
  const [error,             setError]             = useState(null);

  // Validate JSON in real-time as user types
  const handleJsonChange = (val) => {
    setJsonText(val);
    setParseError(null);
    setResult(null);
    setError(null);
    try { JSON.parse(val); }
    catch (e) { setParseError(e.message); }
  };

  const resetTemplate = () => {
    setJsonText(JSON.stringify(MOCK_TEMPLATE, null, 2));
    setParseError(null);
    setResult(null);
    setError(null);
  };

  const publish = async () => {
    if (parseError) return;
    if (!manifestSubjectId.trim()) { setError('manifestSubjectId مطلوب'); return; }

    let payload;
    try { payload = JSON.parse(jsonText); }
    catch (e) { setParseError(e.message); return; }

    setPublishing(true);
    setResult(null);
    setError(null);

    try {
      const res  = await fetch('/api/dev/mock-publish', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ manifestSubjectId: manifestSubjectId.trim(), payload }),
      });
      const data = await res.json();

      if (data.ok) {
        setResult(data);
      } else {
        setError(data.error + (data.details ? '\n• ' + data.details.join('\n• ') : ''));
      }
    } catch (e) {
      setError('تعذّر الاتصال بالخادم: ' + e.message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mt-10">
      {/* ── Divider ── */}
      <div className="flex items-center gap-4 mb-6 px-8">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <span className="text-[10px] font-mono uppercase tracking-widest text-ink-700">أدوات التطوير</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      </div>

      {/* ── Panel header ── */}
      <div className="px-8">
        <div
          className="rounded-xl border overflow-hidden"
          style={{ borderColor: open ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)', background: 'rgba(99,102,241,0.03)' }}
        >
          {/* Header row */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3 text-right"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="text-indigo-500/60 text-xs font-mono shrink-0">{open ? '▾' : '▸'}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-indigo-400">DEV</span>
                <span className="font-arabic text-sm font-semibold text-ink-300">نشر وهمي — Mock Publish</span>
              </div>
              <p className="text-[11px] font-arabic text-ink-600 mt-0.5">
                بناء وتحرير BasheerExportData يدوياً ورفعه لـ Supabase وتحديث Firestore
              </p>
            </div>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{ borderColor: 'rgba(99,102,241,0.3)', color: 'rgba(129,140,248,0.7)' }}
            >
              pipeline test
            </span>
          </button>

          {open && (
            <div className="border-t px-4 pb-4 pt-4 space-y-4" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>

              {/* ── Manifest subject ID ── */}
              <div>
                <label className="block text-[10px] font-mono text-ink-600 uppercase tracking-wider mb-1.5">
                  Manifest Subject ID
                  <span className="text-ink-700 normal-case ml-2">(مفتاح Firestore — مستقل عن subject.id في الـ JSON)</span>
                </label>
                <input
                  type="text"
                  value={manifestSubjectId}
                  onChange={(e) => setManifestId(e.target.value.toUpperCase().replace(/\s/g, '_'))}
                  placeholder="TEST_SUBJECT"
                  className="w-full px-3 py-2 rounded-lg text-sm font-mono bg-transparent border outline-none text-ink-200"
                  style={{ borderColor: 'rgba(99,102,241,0.3)', caretColor: 'var(--accent)' }}
                  dir="ltr"
                />
                <p className="text-[10px] font-mono text-ink-700 mt-1">
                  هذا هو الـ id في manifest Firestore — لا يجب أن يطابق subject.id في الـ JSON بالضرورة
                </p>
              </div>

              {/* ── JSON editor ── */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono text-ink-600 uppercase tracking-wider">
                    BasheerExportData Payload
                  </label>
                  <button
                    onClick={resetTemplate}
                    className="text-[10px] font-mono text-ink-600 hover:text-ink-400 px-2 py-1 rounded border border-ink-800/60 hover:border-ink-700"
                  >
                    ↺ استعادة القالب
                  </button>
                </div>
                <textarea
                  value={jsonText}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  rows={24}
                  className="w-full px-3 py-3 rounded-lg text-xs font-mono bg-transparent border outline-none resize-y text-ink-300"
                  style={{
                    borderColor: parseError ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.25)',
                    caretColor:  'var(--accent)',
                    lineHeight:  '1.6',
                    minHeight:   '320px',
                  }}
                  dir="ltr"
                  spellCheck={false}
                />
                {parseError && (
                  <p className="text-[11px] font-mono text-red-400 mt-1.5">
                    ✕ JSON غير صالح: {parseError}
                  </p>
                )}
              </div>

              {/* ── Field reference cheat-sheet ── */}
              <details className="group">
                <summary className="text-[10px] font-mono text-ink-700 hover:text-ink-500 cursor-pointer list-none select-none flex items-center gap-1">
                  <span className="group-open:hidden">▸</span>
                  <span className="hidden group-open:inline">▾</span>
                  مرجع الحقول — القيم المسموحة
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-3 text-[10px] font-mono">
                  {[
                    { label: 'subject.path',         vals: ['COMMON', 'SCIENCE', 'LITERARY'] },
                    { label: 'section.learningType', vals: ['UNDERSTANDING', 'MEMORIZATION', 'APPLICATION'] },
                    { label: 'block.type',           vals: ['TEXT', 'HEADING', 'IMAGE', 'FORMULA', 'TABLE', 'CALLOUT', 'HOTSPOT'] },
                    { label: 'question.type',        vals: ['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY', 'MATCHING', 'ORDERING', 'HOTSPOT'] },
                    { label: 'question.cognitiveLevel', vals: ['RECALL', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'] },
                    { label: 'question.source',      vals: ['ORIGINAL', 'MINISTRY', 'TEXTBOOK', 'EXAM'] },
                    { label: 'feedItem.type',        vals: ['DEFINITION', 'FORMULA', 'FLASH_CARD', 'QUICK_QUIZ', 'FACT'] },
                    { label: 'concept.type',         vals: ['DEFINITION', 'FORMULA', 'THEOREM', 'RULE', 'FACT'] },
                  ].map(({ label, vals }) => (
                    <div key={label} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <p className="text-indigo-400/70 mb-1">{label}</p>
                      <p className="text-ink-600 leading-relaxed">{vals.join(' | ')}</p>
                    </div>
                  ))}
                </div>
              </details>

              {/* ── Result ── */}
              {result && (
                <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 text-sm">✓</span>
                    <p className="text-sm font-arabic text-green-400 font-semibold">تم النشر بنجاح</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px] font-mono">
                    {[
                      { label: 'Version',   val: `v${result.version}` },
                      { label: 'Size',      val: `${(result.size / 1024).toFixed(1)} KB` },
                      { label: 'Lessons',   val: result.stats?.lessons   ?? '–' },
                      { label: 'Questions', val: result.stats?.questions ?? '–' },
                      { label: 'FeedItems', val: result.stats?.feedItems ?? '–' },
                      { label: 'Concepts',  val: result.stats?.concepts  ?? '–' },
                    ].map(({ label, val }) => (
                      <div key={label} className="p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-ink-700">{label}</p>
                        <p className="text-green-400 font-bold">{val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-[10px] font-mono">
                    <div className="flex items-start gap-2">
                      <span className="text-ink-700 shrink-0 mt-0.5">URL</span>
                      <a
                        href={result.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 break-all underline"
                      >
                        {result.downloadUrl}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-700 shrink-0">SHA-256</span>
                      <span className="text-ink-500 break-all">{result.sha256?.slice(0, 32)}…</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-ink-700 shrink-0">File</span>
                      <span className="text-ink-500" dir="ltr">{result.fileName}</span>
                    </div>
                  </div>

                  <p className="text-[11px] font-arabic text-green-400/60">
                    ✓ Firestore manifest محدّث — شغّل التطبيق على الجهاز لاختبار التزامن
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-[11px] font-mono text-red-400 whitespace-pre-wrap">{error}</p>
                </div>
              )}

              {/* ── Publish button ── */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={publish}
                  disabled={publishing || !!parseError}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-arabic border transition-all"
                  style={{
                    borderColor: parseError ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.5)',
                    color:       parseError ? 'rgba(239,68,68,0.6)' : '#a5b4fc',
                    opacity:     (publishing || parseError) ? 0.5 : 1,
                    cursor:      (publishing || parseError) ? 'not-allowed' : 'pointer',
                  }}
                >
                  {publishing && <span className="inline-block w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin" />}
                  {publishing ? 'جارٍ النشر…' : '⬆ نشر وهمي'}
                </button>
                <p className="text-[10px] font-arabic text-ink-700">
                  يرفع الـ JSON إلى Supabase ويحدّث Firestore — التطبيق يلتقطه في الإطلاق التالي
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SeedSection (main export) ────────────────────────────────────────────────

export function SeedSection() {
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [toast,    setToast]    = useState(null);
  const [busyAll,  setBusyAll]  = useState(false);
  const [filter,   setFilter]   = useState('all');

  const showToast = (msg, isErr = false) => {
    setToast({ msg, isErr });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res  = await fetch('/api/admin/seed');
      const data = await res.json();
      if (data.ok) setSubjects(data.subjects || []);
      else setError(data.error || 'خطأ غير معروف');
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async (subjectId, action) => {
    try {
      const res  = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, subjectId }),
      });
      const data = await res.json();
      if (data.ok) { showToast('تمّ ✓'); await load(); }
      else showToast(data.error || 'حدث خطأ', true);
    } catch {
      showToast('تعذّر الاتصال', true);
    }
  };

  const bootstrapAll = async () => {
    setBusyAll(true);
    try {
      const res  = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'bootstrap_all' }),
      });
      const data = await res.json();
      const errs = data.results?.filter((r) => !r.ok).length ?? 0;
      showToast(errs > 0 ? `اكتمل مع ${errs} أخطاء` : 'تمّ بذر الكل ✓', errs > 0);
      await load();
    } catch {
      showToast('تعذّر الاتصال', true);
    } finally {
      setBusyAll(false);
    }
  };

  const seededCount = subjects.filter((s) => s.seeded).length;
  const emptyCount  = subjects.filter((s) => !s.seeded).length;
  const issueCount  = subjects.filter((s) => s.seeded && (s.missingUnits > 0 || s.missingLessons > 0 || s.staleUnits > 0 || s.staleLessons > 0 || s.catalogError)).length;

  const FILTERS = [
    { key: 'all',    label: 'الكل',  count: subjects.length },
    { key: 'empty',  label: 'فارغ',  count: emptyCount      },
    { key: 'issues', label: 'مشاكل', count: issueCount      },
    { key: 'ok',     label: 'سليم',  count: seededCount - issueCount },
  ];

  const displayed = subjects.filter((s) => {
    if (filter === 'empty')  return !s.seeded;
    if (filter === 'issues') return s.catalogError || (s.seeded && (s.missingUnits > 0 || s.missingLessons > 0 || s.staleUnits > 0 || s.staleLessons > 0));
    if (filter === 'ok')     return s.seeded && !s.catalogError && !s.missingUnits && !s.missingLessons && !s.staleUnits && !s.staleLessons;
    return true;
  });

  return (
    <div>
      <SectionHeader title="إدارة البذر" description="مراقبة حالة المنهج وبذر المواد الأساسية في قاعدة البيانات">
        <button onClick={load} disabled={loading}
          className="text-xs font-mono text-ink-500 hover:text-ink-300 transition-colors px-3 py-1.5 rounded-lg border border-ink-800/60 hover:border-ink-700/60">
          ↻ تحديث
        </button>
      </SectionHeader>

      <div className="px-8 pb-4">
        {loading ? (
          <div className="flex items-center gap-3 text-ink-500 text-sm py-12">
            <span className="inline-block w-4 h-4 border-2 border-ink-700 border-t-sand-400 rounded-full animate-spin" />
            <span className="font-arabic">جارٍ التحميل…</span>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p className="text-red-400 font-arabic text-sm mb-3">{error}</p>
            <button onClick={load} className="text-xs font-mono text-ink-500 hover:text-ink-300 px-4 py-2 rounded-lg border border-ink-800">
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {[
                { label: 'مبذور',    val: seededCount - issueCount, color: 'text-green-400' },
                { label: 'مشاكل',    val: issueCount,               color: 'text-amber-400' },
                { label: 'فارغ',     val: emptyCount,               color: 'text-ink-500'   },
                { label: 'الإجمالي', val: subjects.length,          color: 'text-ink-300'   },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-800/50 bg-ink-900/30">
                  <span className={`text-base font-mono font-bold ${color}`}>{val}</span>
                  <span className="text-xs text-ink-600 font-arabic">{label}</span>
                </div>
              ))}
              <div className="mr-auto">
                <button onClick={bootstrapAll} disabled={busyAll || emptyCount === 0}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-arabic border transition-all border-sand-800/50 text-sand-400 hover:border-sand-700/60 hover:text-sand-300 disabled:opacity-40 disabled:cursor-not-allowed">
                  {busyAll && <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />}
                  بذر الجميع
                </button>
              </div>
            </div>

            <div className="flex gap-1.5 mb-5 flex-wrap">
              {FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-arabic transition-all flex items-center gap-1.5 ${
                    filter === f.key ? 'bg-sand-800/40 text-sand-300 border border-sand-700/50' : 'text-ink-500 hover:text-ink-300 border border-ink-800/60'
                  }`}>
                  {f.label}
                  <span className="font-mono text-[10px] opacity-60">{f.count}</span>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              {displayed.map((s) => <SubjectRow key={s.id} s={s} onAction={runAction} />)}
              {displayed.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-ink-600 text-sm font-arabic">لا يوجد مواد في هذه الفئة</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── DEV: Mock Publisher ─────────────────────────────────────────────── */}
      <MockPublisher />

      <div className="pb-8" />

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl text-sm font-mono shadow-2xl z-50"
          style={{ background: 'rgba(14,12,9,0.96)', border: `1px solid ${toast.isErr ? 'rgba(239,68,68,0.4)' : 'rgba(212,137,30,0.3)'}`, color: toast.isErr ? '#f87171' : 'var(--accent)', backdropFilter: 'blur(16px)' }}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
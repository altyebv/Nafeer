'use client';
import { useState } from 'react';
import { useDataStore } from '@/store/dataStore';
import {
  QUESTION_TYPES, QUESTION_TYPE_CONFIG,
  QUESTION_SOURCES, QUESTION_SOURCE_CONFIG,
  COGNITIVE_LEVELS, COGNITIVE_LEVEL_CONFIG,
  EXAM_SOURCES, EXAM_SOURCE_CONFIG,
  EXAM_TYPES, EXAM_TYPE_CONFIG,
} from '@/shared/constants';
import Modal            from '@/components/editor/Modal';
import { QuizTableEditor } from '@/components/editor/TableEditor';

const inputClass =
  'w-full px-3 py-2.5 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600';

const labelClass = 'block text-xs text-ink-500 mb-1.5 font-arabic';

// ─── MCQ Option Builder ──────────────────────────────────────────────────────
function MCQOptions({ options, correctAnswer, onChange, onCorrectChange }) {
  const opts = options.length ? options : ['', '', '', ''];

  const updateOption = (i, val) => {
    const next = [...opts];
    next[i] = val;
    onChange(next);
  };

  const addOption = () => onChange([...opts, '']);
  const removeOption = (i) => {
    const next = opts.filter((_, idx) => idx !== i);
    onChange(next);
    if (correctAnswer === String(i)) onCorrectChange('');
  };

  return (
    <div className="space-y-2">
      {opts.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <button
            onClick={() => onCorrectChange(opt)}
            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 transition-colors
              ${correctAnswer === opt && opt
                ? 'border-green-500 bg-green-500/20'
                : 'border-ink-600 hover:border-ink-400'
              }`}
            title="اضغط لتحديد كإجابة صحيحة"
          />
          <input
            type="text"
            value={opt}
            onChange={(e) => updateOption(i, e.target.value)}
            className="flex-1 px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`الخيار ${String.fromCharCode(0x0623 + i)}`}
          />
          <button
            onClick={() => removeOption(i)}
            className="text-ink-600 hover:text-red-500 transition-colors p-1"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        onClick={addOption}
        className="text-xs text-ink-600 hover:text-sand-500 transition-colors font-arabic"
      >
        + إضافة خيار
      </button>
    </div>
  );
}

// ─── Match Pair Builder ──────────────────────────────────────────────────────
function MatchPairs({ pairs, onChange }) {
  const updatePair = (i, side, val) => {
    const next = [...pairs];
    next[i] = { ...next[i], [side]: val };
    onChange(next);
  };

  const addPair = () => onChange([...pairs, { right: '', left: '' }]);
  const removePair = (i) => onChange(pairs.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 text-xs text-ink-600 font-arabic px-1">
        <span>العمود الأيمن</span>
        <span>العمود الأيسر</span>
      </div>
      {pairs.map((pair, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            type="text"
            value={pair.right}
            onChange={(e) => updatePair(i, 'right', e.target.value)}
            className="flex-1 px-2 py-2 bg-ink-950 border border-ink-700 rounded text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`أ${i + 1}`}
          />
          <span className="text-ink-700">↔</span>
          <input
            type="text"
            value={pair.left}
            onChange={(e) => updatePair(i, 'left', e.target.value)}
            className="flex-1 px-2 py-2 bg-ink-950 border border-ink-700 rounded text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`ب${i + 1}`}
          />
          <button onClick={() => removePair(i)} className="text-ink-600 hover:text-red-500 p-1">✕</button>
        </div>
      ))}
      <button onClick={addPair} className="text-xs text-ink-600 hover:text-sand-500 font-arabic">
        + إضافة زوج
      </button>
    </div>
  );
}

// ─── Order Items Builder ─────────────────────────────────────────────────────
function OrderItems({ items, onChange }) {
  const updateItem = (i, val) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };

  const addItem   = () => onChange([...items, '']);
  const removeItem = (i) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <p className="text-xs text-ink-600 font-arabic">أدخل العناصر بالترتيب الصحيح:</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-ink-600 font-mono w-5 text-center">{i + 1}</span>
          <input
            type="text"
            value={item}
            onChange={(e) => updateItem(i, e.target.value)}
            className="flex-1 px-2 py-2 bg-ink-950 border border-ink-700 rounded text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
            placeholder={`العنصر ${i + 1}`}
          />
          <button onClick={() => removeItem(i)} className="text-ink-600 hover:text-red-500 p-1">✕</button>
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-ink-600 hover:text-sand-500 font-arabic">
        + إضافة عنصر
      </button>
    </div>
  );
}

// ─── Question Form ────────────────────────────────────────────────────────────
function QuestionForm({ form, setForm, concepts, units, lessons }) {
  // Local state for structured inputs
  const [mcqOptions,   setMcqOptions]   = useState(() => {
    try { return form.options ? JSON.parse(form.options) : ['', '', '', '']; } catch { return ['', '', '', '']; }
  });
  const [matchPairs,   setMatchPairs]   = useState(() => {
    try {
      const raw = form.options ? JSON.parse(form.options) : [];
      return Array.isArray(raw) && raw[0]?.right !== undefined ? raw : [{ right: '', left: '' }];
    } catch { return [{ right: '', left: '' }]; }
  });
  const [orderItems,   setOrderItems]   = useState(() => {
    try { return form.correctAnswer ? JSON.parse(form.correctAnswer) : ['']; } catch { return ['']; }
  });

  const handleMcqChange = (opts) => {
    setMcqOptions(opts);
    setForm({ ...form, options: JSON.stringify(opts) });
  };
  const handleMatchChange = (pairs) => {
    setMatchPairs(pairs);
    setForm({ ...form, options: JSON.stringify(pairs), correctAnswer: JSON.stringify(pairs) });
  };
  const handleOrderChange = (items) => {
    setOrderItems(items);
    setForm({ ...form, correctAnswer: JSON.stringify(items) });
  };

  const toggleConceptId = (id) => {
    const ids = form.conceptIds || [];
    setForm({ ...form, conceptIds: ids.includes(id) ? ids.filter((c) => c !== id) : [...ids, id] });
  };

  return (
    <div className="space-y-5">
      {/* Question Text */}
      <div>
        <label className={labelClass}>نص السؤال بالعربية *</label>
        <textarea
          value={form.textAr}
          onChange={(e) => setForm({ ...form, textAr: e.target.value })}
          className={`${inputClass} resize-y min-h-[90px]`}
          placeholder="اكتب السؤال هنا..."
          autoFocus
        />
      </div>

      {/* Type-specific answer inputs */}
      {form.type === 'TRUE_FALSE' && (
        <div>
          <label className={labelClass}>الإجابة الصحيحة</label>
          <div className="flex gap-3">
            {[['true', '✓ صح'], ['false', '✕ خطأ']].map(([val, lbl]) => (
              <button
                key={val}
                onClick={() => setForm({ ...form, correctAnswer: val })}
                className={`flex-1 py-2.5 rounded-lg font-arabic text-sm transition-colors border
                  ${form.correctAnswer === val
                    ? (val === 'true' ? 'bg-green-900/40 text-green-400 border-green-700' : 'bg-red-900/40 text-red-400 border-red-700')
                    : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'
                  }`}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.type === 'MCQ' && (
        <div>
          <label className={labelClass}>الخيارات (انقر على الدائرة لتحديد الإجابة الصحيحة)</label>
          <MCQOptions
            options={mcqOptions}
            correctAnswer={form.correctAnswer}
            onChange={handleMcqChange}
            onCorrectChange={(val) => setForm({ ...form, correctAnswer: val })}
          />
        </div>
      )}

      {form.type === 'MATCH' && (
        <div>
          <label className={labelClass}>أزواج الوصل</label>
          <MatchPairs pairs={matchPairs} onChange={handleMatchChange} />
        </div>
      )}

      {form.type === 'ORDER' && (
        <div>
          <label className={labelClass}>العناصر المطلوب ترتيبها (بالترتيب الصحيح)</label>
          <OrderItems items={orderItems} onChange={handleOrderChange} />
        </div>
      )}

      {['FILL_BLANK', 'SHORT_ANSWER', 'EXPLAIN', 'LIST', 'COMPARE'].includes(form.type) && (
        <div>
          <label className={labelClass}>
            {form.type === 'FILL_BLANK' ? 'الكلمة/الجملة الصحيحة لملء الفراغ' :
             form.type === 'LIST'       ? 'العناصر المطلوبة (كل عنصر في سطر)' :
             'الإجابة النموذجية'}
          </label>
          <textarea
            value={form.correctAnswer}
            onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
            className={`${inputClass} resize-y min-h-[70px]`}
            placeholder={form.type === 'LIST' ? 'العنصر الأول\nالعنصر الثاني\n...' : 'الإجابة النموذجية...'}
          />
        </div>
      )}

      {form.type === 'TABLE' && (
        <div>
          <label className={labelClass}>
            بيانات الجدول — انقر على الأيقونة الصغيرة لتحديد الخلايا التي يملأها الطالب
          </label>
          <QuizTableEditor
            value={form.tableData || ''}
            onChange={(v) => setForm({ ...form, tableData: v })}
          />
        </div>
      )}
        <div className="space-y-3">
          <div>
            <label className={labelClass}>مسار الصورة *</label>
            <input
              type="text"
              value={form.imageUrl || ''}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className={`${inputClass} font-mono`}
              placeholder="images/figure_1.png"
              dir="ltr"
            />
          </div>
          <div>
            <label className={labelClass}>الإجابة المطلوبة</label>
            <textarea
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              className={`${inputClass} resize-y min-h-[60px]`}
              placeholder="ما يجب أن يستنتجه الطالب من الشكل..."
            />
          </div>
        </div>
      

      {/* Explanation */}
      <div>
        <label className={labelClass}>الشرح / التفسير (يظهر بعد الإجابة)</label>
        <textarea
          value={form.explanation || ''}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          className={`${inputClass} resize-y min-h-[60px]`}
          placeholder="لماذا هذه الإجابة صحيحة..."
        />
      </div>

      {/* Source & Metadata */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>المصدر</label>
          <select
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            className={`${inputClass} cursor-pointer`}
          >
            {Object.entries(QUESTION_SOURCES).map(([key]) => (
              <option key={key} value={key}>
                {QUESTION_SOURCE_CONFIG[key].icon} {QUESTION_SOURCE_CONFIG[key].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>سنة المصدر</label>
          <input
            type="number"
            value={form.sourceYear || ''}
            onChange={(e) => setForm({ ...form, sourceYear: parseInt(e.target.value) || null })}
            className={inputClass}
            placeholder="2023"
            min="1990"
            max="2030"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelClass}>المستوى المعرفي</label>
          <select
            value={form.cognitiveLevel}
            onChange={(e) => setForm({ ...form, cognitiveLevel: e.target.value })}
            className={`${inputClass} cursor-pointer`}
          >
            {Object.entries(COGNITIVE_LEVELS).map(([key]) => (
              <option key={key} value={key}>{COGNITIVE_LEVEL_CONFIG[key].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>الصعوبة (1–5)</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setForm({ ...form, difficulty: n })}
                className={`flex-1 py-2 rounded text-xs font-mono transition-colors border
                  ${form.difficulty === n ? 'bg-sand-900/60 text-sand-400 border-sand-700' : 'bg-ink-800 text-ink-600 border-ink-700 hover:border-ink-600'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelClass}>الدرجة (نقاط)</label>
          <input
            type="number"
            value={form.points || 1}
            onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 1 })}
            className={inputClass}
            min="1"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>الوحدة (اختياري)</label>
          <select
            value={form.unitId || ''}
            onChange={(e) => setForm({ ...form, unitId: e.target.value || null })}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">غير محدد</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>الدرس (اختياري)</label>
          <select
            value={form.lessonId || ''}
            onChange={(e) => setForm({ ...form, lessonId: e.target.value || null })}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">غير محدد</option>
            {lessons
              .filter((l) => !form.unitId || l.unitId === form.unitId)
              .map((l) => <option key={l.id} value={l.id}>{l.title}</option>)
            }
          </select>
        </div>
      </div>

      {/* Linked Concepts */}
      <div>
        <label className={labelClass}>المفاهيم المرتبطة</label>
        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-ink-950 border border-ink-800 rounded-lg">
          {concepts.length === 0 && (
            <span className="text-xs text-ink-600 font-arabic">لا توجد مفاهيم — أضف من صفحة المفاهيم</span>
          )}
          {concepts.map((c) => {
            const linked = (form.conceptIds || []).includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => toggleConceptId(c.id)}
                className={`px-2 py-0.5 text-xs rounded border font-arabic transition-colors
                  ${linked ? 'bg-sand-900/50 text-sand-400 border-sand-700' : 'bg-ink-800 text-ink-600 border-ink-700 hover:border-ink-600'}`}
              >
                {linked ? '✓ ' : ''}{c.titleAr}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed eligible */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setForm({ ...form, feedEligible: !form.feedEligible })}
          className={`w-9 h-5 rounded-full transition-colors relative ${form.feedEligible ? 'bg-sand-600' : 'bg-ink-700'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow
            ${form.feedEligible ? 'translate-x-4 right-0.5' : 'right-0.5'}`}
          />
        </button>
        <span className="text-xs text-ink-500 font-arabic">
          مؤهل للتغذية (feedEligible) — {QUESTION_TYPE_CONFIG[form.type]?.feedEligible ? 'متاح لهذا النوع' : 'غير متاح لهذا النوع'}
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function QuizBankPage() {
  const {
    questions, exams, concepts, units, lessons,
    addQuestion, updateQuestion, deleteQuestion,
    addExam, updateExam, deleteExam,
    addQuestionToExam, removeQuestionFromExam,
  } = useDataStore();

  const [tab,            setTab]            = useState('questions'); // 'questions' | 'exams'
  const [showQModal,     setShowQModal]     = useState(false);
  const [showExamModal,  setShowExamModal]  = useState(false);
  const [editingQId,     setEditingQId]     = useState(null);
  const [editingExamId,  setEditingExamId]  = useState(null);
  const [filterType,     setFilterType]     = useState('');
  const [filterSource,   setFilterSource]   = useState('');
  const [search,         setSearch]         = useState('');
  const [selectedExamId, setSelectedExamId] = useState(null);

  const emptyQuestion = {
    type: 'MCQ', textAr: '', textEn: null, correctAnswer: '', options: null,
    explanation: null, imageUrl: null, tableData: null,
    difficulty: 1, points: 1, estimatedSeconds: 60,
    cognitiveLevel: 'RECALL', source: 'ORIGINAL',
    sourceExamId: null, sourceDetails: null, sourceYear: null,
    feedEligible: false, unitId: null, lessonId: null, conceptIds: [],
  };

  const emptyExam = {
    titleAr: '', titleEn: null, source: 'MINISTRY', year: null,
    schoolName: null, duration: null, totalPoints: null,
    description: null, examType: null, questionIds: [],
  };

  const [qForm,    setQForm]    = useState(emptyQuestion);
  const [examForm, setExamForm] = useState(emptyExam);

  const openAddQuestion = () => { setQForm(emptyQuestion); setEditingQId(null); setShowQModal(true); };
  const openEditQuestion = (q) => {
    setQForm({
      type:             q.type,
      textAr:           q.textAr,
      textEn:           q.textEn           || '',
      correctAnswer:    q.correctAnswer,
      options:          q.options          || null,
      explanation:      q.explanation      || '',
      imageUrl:         q.imageUrl         || '',
      tableData:        q.tableData        || null,
      difficulty:       q.difficulty       || 1,
      points:           q.points           || 1,
      estimatedSeconds: q.estimatedSeconds || 60,
      cognitiveLevel:   q.cognitiveLevel   || 'RECALL',
      source:           q.source           || 'ORIGINAL',
      sourceExamId:     q.sourceExamId     || null,
      sourceDetails:    q.sourceDetails    || null,
      sourceYear:       q.sourceYear       || null,
      feedEligible:     q.feedEligible     || false,
      unitId:           q.unitId           || null,
      lessonId:         q.lessonId         || null,
      conceptIds:       q.conceptIds       || [],
    });
    setEditingQId(q.id);
    setShowQModal(true);
  };

  const handleSaveQuestion = () => {
    if (!qForm.textAr.trim()) return;
    if (editingQId) updateQuestion(editingQId, qForm);
    else             addQuestion(qForm);
    setShowQModal(false);
  };

  const handleSaveExam = () => {
    if (!examForm.titleAr.trim()) return;
    if (editingExamId) updateExam(editingExamId, examForm);
    else                addExam(examForm);
    setShowExamModal(false);
  };

  const filteredQuestions = questions.filter((q) => {
    const matchType   = !filterType   || q.type   === filterType;
    const matchSource = !filterSource || q.source === filterSource;
    const matchSearch = !search       || q.textAr.includes(search);
    return matchType && matchSource && matchSearch;
  });

  const selectedExam = selectedExamId ? exams.find((e) => e.id === selectedExamId) : null;
  const examQuestions = selectedExam
    ? (selectedExam.questionIds || []).map((id) => questions.find((q) => q.id === id)).filter(Boolean)
    : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-sand-200 font-arabic">بنك الأسئلة</h1>
          <p className="text-ink-500 mt-0.5 text-sm font-arabic">
            {questions.length} سؤال · {exams.length} امتحان
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'questions' && (
            <button
              onClick={openAddQuestion}
              className="px-4 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-semibold font-arabic text-sm"
            >
              + سؤال جديد
            </button>
          )}
          {tab === 'exams' && (
            <button
              onClick={() => { setExamForm(emptyExam); setEditingExamId(null); setShowExamModal(true); }}
              className="px-4 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-semibold font-arabic text-sm"
            >
              + امتحان جديد
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-ink-900 border border-ink-800 p-1 rounded-xl w-fit">
        {[['questions', '📋 الأسئلة'], ['exams', '📄 الامتحانات']].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-lg text-sm font-arabic transition-colors
              ${tab === id ? 'bg-ink-700 text-sand-300' : 'text-ink-500 hover:text-ink-300'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── QUESTIONS TAB ─── */}
      {tab === 'questions' && (
        <>
          {/* Type filter */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            <button
              onClick={() => setFilterType('')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-arabic transition-colors border
                ${!filterType ? 'bg-sand-900/50 text-sand-400 border-sand-700' : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
            >
              الكل ({questions.length})
            </button>
            {Object.entries(QUESTION_TYPES).map(([key]) => {
              const cfg   = QUESTION_TYPE_CONFIG[key];
              const count = questions.filter((q) => q.type === key).length;
              if (count === 0) return null;
              return (
                <button
                  key={key}
                  onClick={() => setFilterType(filterType === key ? '' : key)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-arabic transition-colors border flex items-center gap-1
                    ${filterType === key ? 'bg-sand-900/50 text-sand-400 border-sand-700' : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
                >
                  <span className="font-mono">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                  <span className="font-mono text-ink-600">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Source filter + Search */}
          <div className="flex gap-3 mb-5">
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 bg-ink-900 border border-ink-800 rounded-lg text-ink-400 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic"
            >
              <option value="">كل المصادر</option>
              {Object.entries(QUESTION_SOURCES).map(([key]) => (
                <option key={key} value={key}>{QUESTION_SOURCE_CONFIG[key].label}</option>
              ))}
            </select>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 bg-ink-900 border border-ink-800 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-600"
              placeholder="بحث في نص السؤال..."
            />
          </div>

          {/* Questions List */}
          {filteredQuestions.length === 0 ? (
            <div className="text-center py-20 bg-ink-900 rounded-xl border border-ink-800">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-ink-400 font-arabic mb-4">
                {questions.length === 0 ? 'لا توجد أسئلة بعد' : 'لا توجد نتائج'}
              </p>
              {questions.length === 0 && (
                <button
                  onClick={openAddQuestion}
                  className="px-5 py-2 bg-sand-700 text-ink-950 rounded-lg hover:bg-sand-600 transition-colors font-arabic"
                >
                  أضف أول سؤال
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredQuestions.map((q) => {
                const cfg    = QUESTION_TYPE_CONFIG[q.type];
                const cogCfg = COGNITIVE_LEVEL_CONFIG[q.cognitiveLevel];
                const srcCfg = QUESTION_SOURCE_CONFIG[q.source];
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-4 p-4 bg-ink-900 rounded-xl border border-ink-800 hover:border-ink-700 transition-colors group"
                  >
                    {/* Type icon */}
                    <div className="w-9 h-9 flex items-center justify-center bg-ink-800 rounded-lg text-sm flex-shrink-0 font-mono text-ink-400">
                      {cfg?.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 bg-ink-800 text-ink-400 rounded border border-ink-700 font-arabic">
                          {cfg?.label}
                        </span>
                        {srcCfg && (
                          <span className="text-xs text-ink-600 font-arabic">
                            {srcCfg.icon} {srcCfg.label}
                            {q.sourceYear && ` (${q.sourceYear})`}
                          </span>
                        )}
                        {cogCfg && (
                          <span className={`text-xs font-arabic ${cogCfg.color}`}>
                            {cogCfg.label}
                          </span>
                        )}
                        <span className="text-xs text-ink-700 font-mono">
                          ★{q.difficulty} · {q.points}pt
                        </span>
                        {q.feedEligible && (
                          <span className="text-xs px-1.5 py-0.5 bg-blue-900/30 text-blue-500 rounded border border-blue-800/50 font-arabic">
                            تغذية
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-ink-200 line-clamp-2 font-arabic">{q.textAr}</p>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditQuestion(q)}
                        className="p-1.5 text-ink-600 hover:text-sand-400 rounded transition-colors"
                      >
                        ✏
                      </button>
                      <button
                        onClick={() => { if (confirm('حذف السؤال؟')) deleteQuestion(q.id); }}
                        className="p-1.5 text-ink-600 hover:text-red-500 rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── EXAMS TAB ─── */}
      {tab === 'exams' && (
        <div className="flex gap-6">
          {/* Exam List */}
          <div className="w-72 flex-shrink-0 space-y-2">
            {exams.length === 0 ? (
              <div className="text-center py-12 bg-ink-900 rounded-xl border border-ink-800">
                <div className="text-3xl mb-3">📄</div>
                <p className="text-ink-500 text-sm font-arabic">لا توجد امتحانات</p>
              </div>
            ) : (
              exams.map((exam) => {
                const srcCfg  = EXAM_SOURCE_CONFIG[exam.source];
                const typeCfg = exam.examType ? EXAM_TYPE_CONFIG[exam.examType] : null;
                return (
                  <div
                    key={exam.id}
                    onClick={() => setSelectedExamId(exam.id === selectedExamId ? null : exam.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-colors
                      ${selectedExamId === exam.id
                        ? 'bg-sand-900/30 border-sand-700'
                        : 'bg-ink-900 border-ink-800 hover:border-ink-700'
                      }`}
                  >
                    <p className="font-medium text-ink-100 text-sm font-arabic mb-1">{exam.titleAr}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-ink-600 font-arabic">
                        {srcCfg?.icon} {srcCfg?.label}
                      </span>
                      {exam.year && <span className="text-xs text-ink-700 font-mono">{exam.year}</span>}
                      {typeCfg && <span className={`text-xs font-arabic ${typeCfg.color}`}>{typeCfg.label}</span>}
                      <span className="text-xs text-ink-600 font-arabic">
                        {(exam.questionIds || []).length} سؤال
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExamForm({ ...exam, questionIds: exam.questionIds || [] });
                          setEditingExamId(exam.id);
                          setShowExamModal(true);
                        }}
                        className="text-xs text-ink-600 hover:text-sand-400 transition-colors font-arabic"
                      >
                        ✏ تعديل
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('حذف الامتحان؟')) {
                            deleteExam(exam.id);
                            if (selectedExamId === exam.id) setSelectedExamId(null);
                          }
                        }}
                        className="text-xs text-ink-600 hover:text-red-500 transition-colors font-arabic"
                      >
                        ✕ حذف
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Exam Detail */}
          <div className="flex-1">
            {!selectedExam ? (
              <div className="text-center py-16 bg-ink-900 rounded-xl border border-ink-800">
                <p className="text-ink-600 font-arabic text-sm">اختر امتحاناً لإدارة أسئلته</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sand-200 font-arabic">{selectedExam.titleAr}</h2>
                  <span className="text-xs text-ink-500 font-arabic">
                    {examQuestions.length} / {(selectedExam.questionIds || []).length} سؤال
                  </span>
                </div>

                {/* Available questions to add */}
                <div className="mb-4">
                  <p className="text-xs text-ink-600 mb-2 font-arabic">إضافة أسئلة من البنك:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-ink-950 border border-ink-800 rounded-lg">
                    {questions.filter((q) => !(selectedExam.questionIds || []).includes(q.id)).length === 0 ? (
                      <p className="text-xs text-ink-700 text-center py-2 font-arabic">كل الأسئلة مضافة</p>
                    ) : (
                      questions
                        .filter((q) => !(selectedExam.questionIds || []).includes(q.id))
                        .map((q) => {
                          const cfg = QUESTION_TYPE_CONFIG[q.type];
                          return (
                            <button
                              key={q.id}
                              onClick={() => addQuestionToExam(selectedExam.id, q.id)}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-900 hover:bg-ink-800 text-right transition-colors group border border-transparent hover:border-ink-700"
                            >
                              <span className="font-mono text-xs text-ink-600">{cfg?.icon}</span>
                              <span className="flex-1 text-xs text-ink-400 line-clamp-1 font-arabic">{q.textAr}</span>
                              <span className="text-xs text-sand-700 group-hover:text-sand-500 font-arabic">+ إضافة</span>
                            </button>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* Questions in exam */}
                <p className="text-xs text-ink-600 mb-2 font-arabic">الأسئلة في هذا الامتحان:</p>
                <div className="space-y-1.5">
                  {examQuestions.map((q, i) => {
                    const cfg = QUESTION_TYPE_CONFIG[q.type];
                    return (
                      <div
                        key={q.id}
                        className="flex items-center gap-3 px-3 py-2.5 bg-ink-900 rounded-lg border border-ink-800 group"
                      >
                        <span className="text-xs text-ink-700 font-mono w-5">{i + 1}</span>
                        <span className="font-mono text-xs text-ink-600">{cfg?.icon}</span>
                        <span className="flex-1 text-sm text-ink-300 line-clamp-1 font-arabic">{q.textAr}</span>
                        <span className="text-xs text-ink-700 font-arabic">{q.points}نقطة</span>
                        <button
                          onClick={() => removeQuestionFromExam(selectedExam.id, q.id)}
                          className="opacity-0 group-hover:opacity-100 text-ink-600 hover:text-red-500 transition-all p-1 font-arabic"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                  {examQuestions.length === 0 && (
                    <p className="text-xs text-ink-700 text-center py-4 font-arabic">
                      لا توجد أسئلة في هذا الامتحان — أضف من الأعلى
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Question Modal ─── */}
      <Modal
        isOpen={showQModal}
        onClose={() => setShowQModal(false)}
        title={editingQId ? 'تعديل السؤال' : 'إضافة سؤال جديد'}
        size="xl"
      >
        <div className="space-y-4">
          {/* Type Selector */}
          <div>
            <label className={labelClass}>نوع السؤال</label>
            <div className="grid grid-cols-4 gap-1.5">
              {Object.entries(QUESTION_TYPES).map(([key]) => {
                const cfg = QUESTION_TYPE_CONFIG[key];
                return (
                  <button
                    key={key}
                    onClick={() => setQForm({ ...qForm, type: key, correctAnswer: '', options: null })}
                    className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs transition-colors border font-arabic
                      ${qForm.type === key ? 'bg-sand-900/50 text-sand-300 border-sand-700' : 'bg-ink-800 text-ink-500 border-ink-700 hover:border-ink-600'}`}
                  >
                    <span className="font-mono text-base">{cfg.icon}</span>
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <QuestionForm
            form={qForm}
            setForm={setQForm}
            concepts={concepts}
            units={units}
            lessons={lessons}
          />

          <div className="flex gap-3 pt-2 border-t border-ink-800 mt-5">
            <button
              onClick={handleSaveQuestion}
              disabled={!qForm.textAr.trim()}
              className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 transition-colors font-semibold font-arabic"
            >
              {editingQId ? 'حفظ التعديلات' : 'إضافة السؤال'}
            </button>
            <button
              onClick={() => setShowQModal(false)}
              className="px-4 py-2 text-ink-400 hover:bg-ink-800 rounded-lg transition-colors font-arabic"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Exam Modal ─── */}
      <Modal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        title={editingExamId ? 'تعديل الامتحان' : 'إضافة امتحان جديد'}
      >
        <div className="space-y-4">
          <div>
            <label className={labelClass}>عنوان الامتحان *</label>
            <input
              type="text"
              value={examForm.titleAr}
              onChange={(e) => setExamForm({ ...examForm, titleAr: e.target.value })}
              className={inputClass}
              placeholder="مثال: امتحان الجغرافيا النهائي 2023"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>المصدر</label>
              <select
                value={examForm.source}
                onChange={(e) => setExamForm({ ...examForm, source: e.target.value })}
                className={`${inputClass} cursor-pointer`}
              >
                {Object.entries(EXAM_SOURCES).map(([key]) => (
                  <option key={key} value={key}>{EXAM_SOURCE_CONFIG[key].icon} {EXAM_SOURCE_CONFIG[key].label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>نوع الامتحان</label>
              <select
                value={examForm.examType || ''}
                onChange={(e) => setExamForm({ ...examForm, examType: e.target.value || null })}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="">غير محدد</option>
                {Object.entries(EXAM_TYPES).map(([key]) => (
                  <option key={key} value={key}>{EXAM_TYPE_CONFIG[key].label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>السنة</label>
              <input
                type="number"
                value={examForm.year || ''}
                onChange={(e) => setExamForm({ ...examForm, year: parseInt(e.target.value) || null })}
                className={inputClass}
                placeholder="2023"
              />
            </div>
            <div>
              <label className={labelClass}>المدة (دقيقة)</label>
              <input
                type="number"
                value={examForm.duration || ''}
                onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) || null })}
                className={inputClass}
                placeholder="180"
              />
            </div>
            <div>
              <label className={labelClass}>الدرجة الكلية</label>
              <input
                type="number"
                value={examForm.totalPoints || ''}
                onChange={(e) => setExamForm({ ...examForm, totalPoints: parseInt(e.target.value) || null })}
                className={inputClass}
                placeholder="100"
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>اسم المدرسة (إن كان مدرسياً)</label>
            <input
              type="text"
              value={examForm.schoolName || ''}
              onChange={(e) => setExamForm({ ...examForm, schoolName: e.target.value || null })}
              className={inputClass}
              placeholder="اسم المدرسة..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSaveExam}
              disabled={!examForm.titleAr.trim()}
              className="flex-1 py-2.5 bg-sand-600 text-ink-950 rounded-lg hover:bg-sand-500 disabled:opacity-40 transition-colors font-semibold font-arabic"
            >
              {editingExamId ? 'حفظ التعديلات' : 'إنشاء الامتحان'}
            </button>
            <button
              onClick={() => setShowExamModal(false)}
              className="px-4 py-2 text-ink-400 hover:bg-ink-800 rounded-lg transition-colors font-arabic"
            >
              إلغاء
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
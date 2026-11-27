'use client';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { Check, CircleDot, Lightbulb, MapPin, Pencil, X } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useAtlasSync } from '@/hooks/useAtlasSync';
import { COGNITIVE_LEVEL_CONFIG, QUESTION_TYPE_CONFIG } from '@/shared/constants';
import { Badge, Button, ConfirmButton, Field, Segmented, Select, cx } from '@/components/ui';
import MathTextarea from '@/components/editor/shared/MathTextarea';
import MathText from '@/components/editor/shared/MathText';
import MCQOptions from '@/components/editor/quizbank/McqOptions';
import OrderItems from '@/components/editor/quizbank/OrderItems';
import { INLINE_TYPES, checkpointForSave, checkpointIssues, optionList } from '@/lib/checkpoints';

// ─── CheckpointEditor ─────────────────────────────────────────────────────────
// A recall question asked inside the lesson (lib/checkpoints.js). It stands
// where its checkpoint block stands; one no block places is asked after the
// section's last block (`placed` false), and can be given a place.
//
// What the app shows (ReaderQuestion.kt): the explanation after every answer;
// the note for the picked choice, or else the usual mistake, after a wrong one.
// Saving is one request (syncQuestion), as before.

const TYPE_ITEMS = INLINE_TYPES.map((t) => ({ id: t, label: QUESTION_TYPE_CONFIG[t].label }));
const BLANK_OPTIONS = { MCQ: ['', '', '', ''], ORDER: ['', '', ''], TRUE_FALSE: null };

const FIELD =
  'w-full rounded-control bg-sunken text-fg text-sm border border-line-strong px-3 py-2.5 leading-relaxed resize-y ' +
  'hover:border-line-accent focus:border-accent-hover focus:outline-none font-arabic';

const newId = () => `q_cp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function draftFrom(question, sectionConceptIds) {
  if (!question) {
    return {
      type: 'MCQ', textAr: '', options: BLANK_OPTIONS.MCQ, correctAnswer: '', optionNotes: [],
      explanation: '', mistakeNote: '', conceptIds: sectionConceptIds, difficulty: 1, cognitiveLevel: 'RECALL',
    };
  }
  const type = INLINE_TYPES.includes(question.type) ? question.type : 'MCQ';
  const options = optionList(question.options);
  return {
    type,
    textAr: question.textAr || '',
    options: options.length ? options : BLANK_OPTIONS[type],
    correctAnswer: question.correctAnswer || '',
    optionNotes: question.optionNotes || [],
    explanation: question.explanation || '',
    mistakeNote: question.mistakeNote || '',
    conceptIds: question.conceptIds?.length ? question.conceptIds : sectionConceptIds,
    difficulty: question.difficulty || 1,
    cognitiveLevel: question.cognitiveLevel || 'RECALL',
  };
}

export default function CheckpointEditor({
  question,          // the checkpoint, or null before one is written
  sectionId, lessonId, unitId, subjectId,
  placed = true,     // false: no block places it, the app asks it after the last block
  onCreated,         // (questionId) — the block now names it
  onPlace,           // unplaced only: give it a block, so it can be moved
  onRemove,          // unplaced only: delete the question
}) {
  const { sections, concepts, addQuestion, updateQuestion } = useDataStore(useShallow((s) => ({
    sections: s.sections, concepts: s.concepts, addQuestion: s.addQuestion, updateQuestion: s.updateQuestion,
  })));
  const { syncQuestion } = useAtlasSync();
  const section = sections.find((s) => s.id === sectionId);
  const sectionConceptIds = section?.conceptIds || [];

  const [editing, setEditing] = useState(!question);
  const [form, setForm] = useState(() => draftFrom(question, sectionConceptIds));
  const [tried, setTried] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const saved = checkpointForSave(form);
  const issues = checkpointIssues({ ...saved, sectionId });

  const startEdit = () => { setForm(draftFrom(question, sectionConceptIds)); setTried(false); setEditing(true); };

  const save = () => {
    setTried(true);
    if (issues.length) return;
    if (question) {
      updateQuestion(question.id, { ...saved, sectionId, lessonId: question.lessonId || lessonId, unitId: question.unitId || unitId });
      if (subjectId) syncQuestion(question.id, subjectId).catch(() => {});
    } else {
      const id = newId();
      addQuestion({
        id, ...saved, sectionId, lessonId: lessonId || null, unitId: unitId || null,
        points: 1, estimatedSeconds: 45, source: 'ORIGINAL',
      });
      onCreated?.(id);
      if (subjectId) syncQuestion(id, subjectId).catch(() => {});
    }
    setEditing(false);
  };

  // A checkpoint of a type the app cannot ask here (from the quiz bank or a restore).
  const makePractice = () => {
    updateQuestion(question.id, { isCheckpoint: false, sectionId: null });
    if (subjectId) syncQuestion(question.id, subjectId).catch(() => {});
  };

  if (!editing && question) {
    return (
      <CheckpointCard question={question} placed={placed} concepts={concepts}
        onEdit={INLINE_TYPES.includes(question.type) ? startEdit : null}
        onMakePractice={makePractice} onPlace={onPlace} onRemove={onRemove} />
    );
  }

  const changeType = (type) => {
    if (type === form.type) return;
    set({ type, options: BLANK_OPTIONS[type], correctAnswer: '', optionNotes: [] });
  };
  const options = optionList(form.options);
  const correctIndex = options.findIndex((o) => o === form.correctAnswer && o !== '');

  return (
    <div className="rounded-card border border-line-accent bg-raised p-4 space-y-4" dir="rtl">
      <div className="flex items-center gap-2">
        <CircleDot size={14} className="text-fg-accent" aria-hidden="true" />
        <span className="t-label font-semibold text-fg">{question ? 'تعديل نقطة التحقق' : 'نقطة تحقق جديدة'}</span>
        <span className="t-caption text-fg-subtle">يسألها التطبيق للطالب في هذا المكان من القسم</span>
      </div>

      <Segmented label="نوع السؤال" size="sm" value={form.type} onChange={changeType} items={TYPE_ITEMS} />

      <Field label="السؤال" required>
        <MathTextarea value={form.textAr} onChange={(v) => set({ textAr: v })} autoFocus
          className={cx(FIELD, 'min-h-[72px]')} placeholder="اكتب السؤال كما يراه الطالب…" />
      </Field>

      <div className="space-y-1.5">
        <span className="t-label text-fg">{form.type === 'ORDER' ? 'العناصر بالترتيب الصحيح' : 'الإجابة'}</span>
        {form.type === 'MCQ' && (
          <MCQOptions options={options} correctIndex={correctIndex} notes={form.optionNotes}
            onNotesChange={(next) => set({ optionNotes: next })}
            onChange={(next, nextNotes) => set({
              options: next, optionNotes: nextNotes ?? form.optionNotes,
              correctAnswer: correctIndex >= 0 ? next[correctIndex] ?? '' : form.correctAnswer,
            })}
            onCorrectChange={(i) => set({ correctAnswer: options[i] ?? '' })} />
        )}
        {form.type === 'MCQ' && (
          <p className="t-caption text-fg-subtle">اضغط حرف الخيار لتحديده صحيحاً. تحت كل خيار خاطئ: لماذا هو خطأ، يراه الطالب إن اختاره.</p>
        )}
        {form.type === 'TRUE_FALSE' && (
          <div className="flex gap-2">
            {[['true', 'صح', Check], ['false', 'خطأ', X]].map(([v, label, Icon]) => (
              <button key={v} type="button" onClick={() => set({ correctAnswer: v })} aria-pressed={form.correctAnswer === v}
                className={cx('flex-1 h-10 rounded-control border t-label inline-flex items-center justify-center gap-1.5 touch-target',
                  form.correctAnswer === v
                    ? (v === 'true' ? 'bg-success-surface text-success border-success-border' : 'bg-danger-surface text-danger border-danger-border')
                    : 'border-line-strong text-fg-muted hover:bg-hover')}>
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>
        )}
        {form.type === 'ORDER' && (
          <OrderItems items={options} onChange={(items) => set({ options: items })} />
        )}
      </div>

      <Field label="الشرح" hint="يظهر للطالب بعد كل إجابة، صحيحة أو خاطئة.">
        <MathTextarea value={form.explanation} onChange={(v) => set({ explanation: v })}
          className={cx(FIELD, 'min-h-[60px]')} placeholder="لماذا هذه هي الإجابة؟" />
      </Field>

      <Field label="الخطأ الشائع (اختياري)"
        hint={form.type === 'MCQ' ? 'يظهر بعد الإجابة الخاطئة حين لا يكون للخيار المختار ملاحظة.' : 'يظهر بعد الإجابة الخاطئة.'}>
        <MathTextarea value={form.mistakeNote} onChange={(v) => set({ mistakeNote: v })}
          className={cx(FIELD, 'min-h-[48px]')} placeholder="أين يخطئ الطلاب عادةً هنا؟" />
      </Field>

      {concepts.length > 0 && (
        <div className="space-y-1.5">
          <span className="t-label text-fg">المفاهيم التي يختبرها</span>
          <div className="flex flex-wrap gap-1.5">
            {concepts.map((c) => {
              const on = form.conceptIds.includes(c.id);
              return (
                <button key={c.id} type="button" aria-pressed={on}
                  onClick={() => set({ conceptIds: on ? form.conceptIds.filter((x) => x !== c.id) : [...form.conceptIds, c.id] })}
                  className={cx('h-7 px-2.5 rounded-chip border t-caption touch-target',
                    on ? 'bg-selected text-fg-accent border-line-accent' : 'border-line text-fg-muted hover:bg-hover')}>
                  {c.titleAr}
                </button>
              );
            })}
          </div>
          {form.conceptIds.length === 0 && (
            <p className="t-caption text-warn">بلا مفهوم لا يعرف التطبيق ما تدرّب عليه الطالب.</p>
          )}
        </div>
      )}

      <details className="group">
        <summary className="t-caption text-fg-muted cursor-pointer select-none">المزيد: الصعوبة والمستوى</summary>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <Field label="الصعوبة">
            <Select value={form.difficulty} onChange={(e) => set({ difficulty: Number(e.target.value) })}>
              {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
            </Select>
          </Field>
          <Field label="المستوى المعرفي">
            <Select value={form.cognitiveLevel} onChange={(e) => set({ cognitiveLevel: e.target.value })}>
              {Object.entries(COGNITIVE_LEVEL_CONFIG).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </Select>
          </Field>
        </div>
      </details>

      {tried && issues.length > 0 && (
        <ul className="space-y-0.5 rounded-control bg-warn-surface border border-warn-border px-3 py-2" role="alert">
          {issues.map((m) => <li key={m} className="t-caption text-warn">{m}</li>)}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Button variant="primary" size="sm" onClick={save}>{question ? 'حفظ التعديل' : 'إنشاء نقطة التحقق'}</Button>
        {question && <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>إلغاء</Button>}
      </div>
    </div>
  );
}

// ─── CheckpointCard — the checkpoint as written ───────────────────────────────
function CheckpointCard({ question, placed, concepts, onEdit, onMakePractice, onPlace, onRemove }) {
  const issues = checkpointIssues(question);
  const askable = INLINE_TYPES.includes(question.type);
  const options = optionList(question.options);
  const notes = question.optionNotes || [];
  const tested = concepts.filter((c) => question.conceptIds?.includes(c.id));

  return (
    <div className={cx('rounded-card border bg-raised p-4 space-y-3', issues.length ? 'border-warn-border' : 'border-line')} dir="rtl">
      <div className="flex items-center gap-2 flex-wrap">
        <CircleDot size={14} className="text-fg-accent" aria-hidden="true" />
        <span className="t-label font-semibold text-fg">نقطة تحقق</span>
        <Badge size="sm">{QUESTION_TYPE_CONFIG[question.type]?.label || question.type}</Badge>
        {!placed && <Badge size="sm" tone="info" icon={MapPin}>تُسأل في نهاية القسم</Badge>}
        <span className="flex-1" />
        {onEdit && <Button variant="ghost" size="sm" icon={Pencil} onClick={onEdit}>تعديل</Button>}
      </div>

      {issues.length > 0 && (
        <ul className="space-y-0.5 rounded-control bg-warn-surface border border-warn-border px-3 py-2">
          {issues.map((m) => <li key={m} className="t-caption text-warn">{m}</li>)}
        </ul>
      )}

      <p className="t-body text-fg leading-relaxed"><MathText text={question.textAr} /></p>

      {question.type === 'MCQ' && (
        <ul className="space-y-1">
          {options.map((o, i) => {
            const right = o === question.correctAnswer;
            return (
              <li key={i} className={cx('px-2.5 py-1.5 rounded-control t-label', right ? 'bg-success-surface text-success' : 'text-fg-muted')}>
                <span className="inline-flex items-center gap-1.5">{right ? <Check size={13} /> : <span className="w-[13px]" />}{o}</span>
                {!right && notes[i] && <span className="block ps-5 t-caption text-fg-subtle">{notes[i]}</span>}
              </li>
            );
          })}
        </ul>
      )}
      {question.type === 'TRUE_FALSE' && (
        <p className="t-label text-success inline-flex items-center gap-1.5">
          <Check size={13} /> {question.correctAnswer === 'true' ? 'صح' : question.correctAnswer === 'false' ? 'خطأ' : '—'}
        </p>
      )}
      {question.type === 'ORDER' && (
        <ol className="space-y-1 list-decimal ps-6 t-label text-fg-muted">
          {options.map((o, i) => <li key={i}>{o}</li>)}
        </ol>
      )}

      {question.explanation && (
        <p className="t-caption text-fg-muted border-t border-line pt-2 inline-flex items-start gap-1.5">
          <Lightbulb size={13} className="shrink-0 mt-0.5" /> <span><MathText text={question.explanation} /></span>
        </p>
      )}
      {question.mistakeNote && (
        <p className="t-caption text-fg-subtle"><span className="font-semibold">الخطأ الشائع: </span><MathText text={question.mistakeNote} /></p>
      )}
      {tested.length > 0 && (
        <div className="flex flex-wrap gap-1">{tested.map((c) => <Badge key={c.id} size="sm" tone="accent" icon={Lightbulb}>{c.titleAr}</Badge>)}</div>
      )}

      {(!askable || !placed) && (
        <div className="flex items-center gap-2 flex-wrap border-t border-line pt-3">
          {!askable && <Button variant="secondary" size="sm" onClick={onMakePractice}>اجعله سؤال تدريب</Button>}
          {!placed && askable && onPlace && (
            <Button variant="secondary" size="sm" icon={MapPin} onClick={onPlace}>ضعها في مكان داخل القسم</Button>
          )}
          {!placed && onRemove && (
            <ConfirmButton title="حذف نقطة التحقق؟" description="يُحذف السؤال من الدرس ومن بنك الأسئلة." onConfirm={onRemove}>
              حذف
            </ConfirmButton>
          )}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';

// ─── Category definitions (matches expanded model enum) ──────────────────────
const CATEGORIES = [
  { id: 'learning',    label: 'تجربة تعليمية', icon: '◈', color: 'text-amber-400  border-amber-800/50  bg-amber-900/20',  subs: ['متخصص مادة', 'كاتب دروس', 'مراجعة مناهج'] },
  { id: 'core',        label: 'بناء المنصة',   icon: '⬡', color: 'text-blue-400   border-blue-800/50   bg-blue-900/20',   subs: ['فرونت إند', 'باك إند', 'موبايل', 'فول ستاك'] },
  { id: 'growth',      label: 'نشر الفكرة',    icon: '◉', color: 'text-purple-400 border-purple-800/50 bg-purple-900/20', subs: ['محتوى', 'مجتمع', 'تسويق'] },
  { id: 'operations',  label: 'تنظيم نفير',    icon: '▦', color: 'text-teal-400   border-teal-800/50   bg-teal-900/20',   subs: ['تنسيق', 'متابعة', 'إدارة'] },
  // Legacy values kept for backward compat
  { id: 'content',     label: 'محتوى',         icon: '◈', color: 'text-amber-400  border-amber-800/50  bg-amber-900/20',  subs: ['متخصص مادة', 'كاتب دروس'] },
  { id: 'development', label: 'تطوير',          icon: '⬡', color: 'text-blue-400   border-blue-800/50   bg-blue-900/20',   subs: ['فرونت إند', 'باك إند'] },
  { id: 'design',      label: 'تصميم',          icon: '◇', color: 'text-purple-400 border-purple-800/50 bg-purple-900/20', subs: ['واجهات', 'رسوم توضيحية'] },
];

const TABS = [
  { id: 'basics',    label: 'الأساسيات' },
  { id: 'questions', label: 'أسئلة المقابلة' },
  { id: 'microtask', label: 'المهمة التطبيقية' },
];

const DEFAULT_Q = { text: '', placeholder: '', minChars: 80, subjectFilter: [] };

const inp = (extra = '') =>
  `w-full px-3 py-2.5 rounded-lg text-sm font-arabic transition-colors bg-ink-800/50 border border-ink-700/40 text-ink-200 placeholder-ink-700 focus:outline-none focus:border-sand-600/60 focus:bg-ink-800/80 ${extra}`;

function Label({ children, hint }) {
  return (
    <label className="block mb-1.5">
      <span className="text-xs font-arabic text-ink-400">{children}</span>
      {hint && <span className="mr-2 text-2xs text-ink-700 font-arabic">{hint}</span>}
    </label>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-2xs font-mono text-ink-700 tracking-widest uppercase shrink-0">{label}</span>
      <div className="flex-1 h-px bg-ink-800/60" />
    </div>
  );
}

function QuestionRow({ q, idx, total, onChange, onRemove, onMove }) {
  const [open, setOpen] = useState(idx === 0 && !q.text);
  return (
    <div className="rounded-xl border border-ink-800/60 overflow-hidden transition-all" style={{ background: 'rgba(255,255,255,0.02)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-ink-800/30 transition-colors"
      >
        <span className="w-5 h-5 rounded-md flex items-center justify-center text-2xs font-mono shrink-0"
          style={{ background: 'rgba(212,137,30,0.12)', color: 'rgba(212,137,30,0.9)', border: '1px solid rgba(212,137,30,0.25)' }}>
          {idx + 1}
        </span>
        <span className="flex-1 text-xs font-arabic text-ink-300 text-right truncate">
          {q.text || <span className="text-ink-700 italic">سؤال جديد...</span>}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove(idx, -1); }} disabled={idx === 0}
            className="p-1 rounded text-ink-700 hover:text-ink-400 disabled:opacity-20 transition-colors">↑</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onMove(idx, 1); }} disabled={idx === total - 1}
            className="p-1 rounded text-ink-700 hover:text-ink-400 disabled:opacity-20 transition-colors">↓</button>
          <button type="button" onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
            className="p-1 rounded text-red-800 hover:text-red-400 transition-colors">✕</button>
          <span className="text-ink-700 text-xs ml-1">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-ink-800/40">
          <div className="pt-3">
            <Label>نص السؤال *</Label>
            <textarea rows={2} value={q.text} onChange={(e) => onChange(idx, 'text', e.target.value)}
              placeholder="اكتب سؤالاً واضحاً يكشف عن قدرة المتقدم..."
              className={inp('resize-none leading-relaxed')} />
          </div>
          <div>
            <Label hint="(اختياري)">نص التلميح</Label>
            <input type="text" value={q.placeholder} onChange={(e) => onChange(idx, 'placeholder', e.target.value)}
              placeholder="مثلاً: فكّر في تجربة محددة..." className={inp()} />
          </div>
          <div className="flex items-start gap-4">
            <div className="w-32 shrink-0">
              <Label>الحد الأدنى للحروف</Label>
              <input type="number" min={20} max={600} value={q.minChars}
                onChange={(e) => onChange(idx, 'minChars', Number(e.target.value))} className={inp()} />
            </div>
            <div className="flex-1">
              <Label hint="(اختياري — فارغ = لجميع المتقدمين)">تصفية حسب المادة</Label>
              <input type="text"
                value={(q.subjectFilter || []).join(', ')}
                onChange={(e) => onChange(idx, 'subjectFilter', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="math, physics, chemistry"
                className={inp('font-mono text-xs')} dir="ltr" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function RoleModal({ role = null, onClose, onSaved }) {
  const isEdit   = !!role;
  const panelRef = useRef(null);

  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [tab,     setTab]     = useState('basics');

  const [name,            setName]            = useState(role?.name            || '');
  const [category,        setCategory]        = useState(role?.category        || '');
  const [subcategory,     setSubcategory]     = useState(role?.subcategory     || '');
  const [description,     setDescription]     = useState(role?.description     || '');
  const [portfolioPrompt, setPortfolioPrompt] = useState(role?.portfolioPrompt || '');
  const [isActive,        setIsActive]        = useState(role?.isActive        !== false);

  const [questions, setQuestions] = useState(
    role?.interviewQuestions?.length > 0
      ? role.interviewQuestions.map((q) => ({
          text: q.text, placeholder: q.placeholder || '', minChars: q.minChars ?? 80, subjectFilter: q.subjectFilter || [],
        }))
      : [{ ...DEFAULT_Q }]
  );
  const [microTask,     setMicroTask]     = useState(role?.microTask?.prompt   || '');
  const [microMinChars, setMicroMinChars] = useState(role?.microTask?.minChars ?? 120);

  useEffect(() => {
    requestAnimationFrame(() => {
      if (panelRef.current) {
        panelRef.current.style.transform = 'translateX(0)';
        panelRef.current.style.opacity   = '1';
      }
    });
  }, []);

  const addQuestion    = () => setQuestions((qs) => [...qs, { ...DEFAULT_Q }]);
  const removeQuestion = (idx) => setQuestions((qs) => qs.filter((_, i) => i !== idx));
  const updateQuestion = (idx, field, val) =>
    setQuestions((qs) => qs.map((q, i) => (i === idx ? { ...q, [field]: val } : q)));
  const moveQuestion   = (idx, dir) => {
    const next = idx + dir;
    if (next < 0 || next >= questions.length) return;
    setQuestions((qs) => { const arr = [...qs]; [arr[idx], arr[next]] = [arr[next], arr[idx]]; return arr; });
  };

  const activeCat    = CATEGORIES.find((c) => c.id === category);
  const filledQs     = questions.filter((q) => q.text.trim()).length;
  const hasMicroTask = microTask.trim().length > 0;
  const tabErrors    = { basics: !name.trim() || !category, questions: false, microtask: false };
  const hasErrors    = Object.values(tabErrors).some(Boolean);

  const save = async () => {
    if (!name.trim()) { setError('اسم الدور مطلوب'); setTab('basics'); return; }
    if (!category)    { setError('الفئة مطلوبة');    setTab('basics'); return; }
    setSaving(true); setError('');
    const payload = {
      name: name.trim(), category, subcategory: subcategory.trim(),
      description: description.trim(), portfolioPrompt: portfolioPrompt.trim(), isActive,
      interviewQuestions: questions.filter((q) => q.text.trim()).map((q, i) => ({ ...q, order: i })),
      microTask: { prompt: microTask.trim(), minChars: microMinChars },
    };
    try {
      const url    = isEdit ? `/api/admin/roles/${role._id}` : '/api/admin/roles';
      const method = isEdit ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data   = await res.json();
      if (!data.ok) { setError(data.error || 'حدث خطأ'); setSaving(false); return; }
      onSaved(data.role);
    } catch {
      setError('تعذّر الاتصال بالخادم'); setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={panelRef} dir="rtl" className="relative flex flex-col w-full max-w-xl h-full shadow-2xl"
        style={{ background: '#0c0b09', borderLeft: '1px solid rgba(255,255,255,0.07)', transform: 'translateX(40px)', opacity: 0, transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1), opacity 0.25s ease' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3">
            {activeCat && (
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs border ${activeCat.color}`}>{activeCat.icon}</span>
            )}
            <div>
              <h2 className="text-sm font-bold text-sand-200 font-arabic leading-tight">{isEdit ? role.name : 'دور جديد'}</h2>
              {isEdit && <p className="text-2xs font-mono text-ink-600 mt-0.5">{role.slug}</p>}
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-600 hover:text-ink-300 hover:bg-ink-800/60 transition-all text-lg leading-none">×</button>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-1 px-6 pt-4 pb-0 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {TABS.map((t) => {
            const isActiveTab = tab === t.id;
            const badge = t.id === 'questions' ? filledQs || null : (t.id === 'microtask' && hasMicroTask) ? '✓' : null;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="relative px-4 pb-3 pt-1 text-xs font-arabic transition-colors"
                style={{ color: isActiveTab ? 'rgba(212,137,30,0.9)' : '#6b6559', borderBottom: isActiveTab ? '2px solid rgba(212,137,30,0.8)' : '2px solid transparent', marginBottom: '-1px' }}>
                {t.label}
                {badge !== null && (
                  <span className="mr-1.5 text-2xs font-mono px-1.5 py-0.5 rounded-full"
                    style={{ background: isActiveTab ? 'rgba(212,137,30,0.2)' : 'rgba(255,255,255,0.05)', color: isActiveTab ? 'rgba(212,137,30,0.9)' : '#6b6559' }}>
                    {badge}
                  </span>
                )}
                {tabErrors[t.id] && <span className="absolute top-0.5 left-1 w-1.5 h-1.5 rounded-full bg-red-500" />}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {tab === 'basics' && (
            <>
              <div>
                <Label>اسم الدور *</Label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: متخصص فيزياء، مطوّر واجهة أمامية" className={inp()} autoFocus />
              </div>

              <div>
                <Label>الفئة *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {CATEGORIES.filter((c) => !['content', 'development', 'design'].includes(c.id)).map((cat) => (
                    <button key={cat.id} type="button" onClick={() => { setCategory(cat.id); setSubcategory(''); }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-arabic border transition-all text-right ${
                        category === cat.id ? `${cat.color}` : 'border-ink-800/40 bg-ink-800/20 text-ink-600 hover:border-ink-700/50 hover:text-ink-400'
                      }`}>
                      <span className="text-base shrink-0">{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
                {category && ['content', 'development', 'design'].includes(category) && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-2xs font-mono text-ink-700">قيمة موروثة:</span>
                    {CATEGORIES.filter((c) => ['content', 'development', 'design'].includes(c.id)).map((cat) => (
                      <button key={cat.id} type="button" onClick={() => setCategory(cat.id)}
                        className={`px-2 py-1 rounded-lg text-2xs font-arabic border transition-all ${category === cat.id ? cat.color : 'border-ink-800/40 text-ink-700'}`}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {activeCat && (
                <div>
                  <Label hint="(اختياري)">التخصص الفرعي</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {activeCat.subs.map((sub) => (
                      <button key={sub} type="button" onClick={() => setSubcategory(subcategory === sub ? '' : sub)}
                        className={`px-3 py-1 rounded-lg text-xs font-arabic border transition-all ${
                          subcategory === sub ? 'border-sand-700/50 bg-sand-900/30 text-sand-400' : 'border-ink-800/40 bg-ink-800/20 text-ink-600 hover:text-ink-400'
                        }`}>{sub}</button>
                    ))}
                  </div>
                  <input type="text"
                    value={activeCat.subs.includes(subcategory) ? '' : subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    onFocus={() => { if (activeCat.subs.includes(subcategory)) setSubcategory(''); }}
                    placeholder="أو اكتب تخصصاً مخصصاً..." className={inp()} />
                </div>
              )}

              <div>
                <Label hint="(يظهر في بطاقة الدور عند الانضمام)">الوصف</Label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  placeholder="ما الذي يفعله هذا المساهم؟ اجعل الوصف جذاباً ومحفزاً."
                  className={inp('resize-none leading-relaxed')} />
              </div>

              <Divider label="خيارات الطلب" />

              <div>
                <Label hint="(اتركه فارغاً لإخفاء حقل الرابط تماماً)">رسالة طلب المحفظة / رابط الأعمال</Label>
                <input type="text" value={portfolioPrompt} onChange={(e) => setPortfolioPrompt(e.target.value)}
                  placeholder="مثلاً: شارك رابط GitHub أو مشروع سابق" className={inp()} />
                {portfolioPrompt.trim() && (
                  <p className="text-2xs font-arabic text-ink-600 mt-1.5">
                    سيظهر حقل URL للمتقدمين في هذا الدور مع هذا النص كعنوان.
                  </p>
                )}
              </div>

              <Divider label="الحالة" />

              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-xs font-arabic text-ink-300">الدور مفعّل</p>
                  <p className="text-2xs font-arabic text-ink-700 mt-0.5">
                    {isActive ? 'يظهر في صفحة الانضمام ويقبل الطلبات' : 'مخفي ومعطّل حالياً'}
                  </p>
                </div>
                <button type="button" onClick={() => setIsActive((v) => !v)}
                  className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                  style={{ background: isActive ? 'rgba(212,137,30,0.5)' : 'rgba(255,255,255,0.08)' }}>
                  <span className="absolute top-1 w-4 h-4 rounded-full transition-all shadow-sm"
                    style={{ right: isActive ? '4px' : 'auto', left: isActive ? 'auto' : '4px', background: isActive ? '#d4891e' : '#4a4540' }} />
                </button>
              </div>
            </>
          )}

          {tab === 'questions' && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs font-arabic text-ink-500">
                  {filledQs === 0 ? 'لا أسئلة — ستُستخدم الافتراضية' : `${filledQs} ${filledQs === 1 ? 'سؤال' : 'أسئلة'} مضافة`}
                </p>
                <button type="button" onClick={addQuestion}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-arabic border transition-all"
                  style={{ background: 'rgba(212,137,30,0.08)', border: '1px solid rgba(212,137,30,0.2)', color: 'rgba(212,137,30,0.9)' }}>
                  <span className="text-base leading-none">+</span> سؤال جديد
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-2xl mb-2 text-ink-800">◎</p>
                  <p className="text-xs font-arabic text-ink-700">لا توجد أسئلة مخصصة</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <QuestionRow key={i} q={q} idx={i} total={questions.length}
                      onChange={updateQuestion} onRemove={removeQuestion} onMove={moveQuestion} />
                  ))}
                </div>
              )}

              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-2xs font-mono text-ink-700 mb-2">نصائح لأسئلة فاعلة</p>
                {['اسأل عن تجربة محددة، لا عن نية عامة', 'سؤال عميق واحد أفضل من ثلاثة سطحية', 'استخدم تصفية المادة لمتخصصي المحتوى'].map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1">
                    <span className="text-2xs font-mono text-ink-800 mt-0.5 shrink-0">{i + 1}.</span>
                    <p className="text-2xs font-arabic text-ink-700">{tip}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {tab === 'microtask' && (
            <>
              <div className="rounded-xl p-4" style={{ background: 'rgba(212,137,30,0.05)', border: '1px solid rgba(212,137,30,0.12)' }}>
                <p className="text-xs font-arabic text-ink-400 leading-relaxed">
                  المهمة تأتي في نهاية المقابلة. استخدمها لطلب شيء حقيقي صغير — فقرة، كود، فكرة — يكشف الأسلوب لا مجرد النوايا.
                </p>
              </div>
              <div>
                <Label>تعليمات المهمة</Label>
                <textarea rows={5} value={microTask} onChange={(e) => setMicroTask(e.target.value)}
                  placeholder="مثلاً: اكتب مقدمة درس قصيرة لمادة الكيمياء تشرح مفهوم التكافؤ لطالب ثانوي. لديك ١٠ دقائق."
                  className={inp('resize-none leading-relaxed')} />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <Label>الحد الأدنى للحروف</Label>
                  <input type="number" min={30} max={2000} value={microMinChars}
                    onChange={(e) => setMicroMinChars(Number(e.target.value))} className={inp()} />
                </div>
                <p className="flex-1 text-xs font-arabic text-ink-700 leading-relaxed pt-5">
                  ١٢٠–٣٠٠ حرف للمهام القصيرة، أكثر للكتابة التفصيلية.
                </p>
              </div>
              {!microTask.trim() && (
                <p className="text-2xs font-arabic text-ink-700 text-center py-2 border border-dashed border-ink-800/40 rounded-xl">
                  إذا تُركت فارغة، لن تظهر مهمة لهذا الدور
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {error ? (
            <p className="flex-1 text-xs text-red-400 font-arabic bg-red-950/30 border border-red-900/40 px-3 py-2 rounded-lg">{error}</p>
          ) : (
            <div className="flex-1 flex items-center gap-2">
              {TABS.map((t) => (
                <div key={t.id} onClick={() => setTab(t.id)}
                  className="h-1 flex-1 rounded-full cursor-pointer transition-all"
                  style={{ background: tab === t.id ? 'rgba(212,137,30,0.8)' : tabErrors[t.id] ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }} />
              ))}
            </div>
          )}
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-arabic text-ink-500 hover:text-ink-300 border border-transparent hover:border-ink-700/50 transition-all">
            إلغاء
          </button>
          <button type="button" onClick={save} disabled={saving || hasErrors}
            className="px-5 py-2 rounded-xl text-xs font-arabic font-bold transition-all flex items-center gap-2"
            style={{ background: saving || hasErrors ? 'rgba(255,255,255,0.05)' : 'rgba(212,137,30,0.9)', color: saving || hasErrors ? '#6b6559' : '#0c0b09', cursor: saving ? 'wait' : 'pointer' }}>
            {saving
              ? <><span className="animate-pulse font-mono text-2xs">···</span><span>جاري الحفظ</span></>
              : <span>{isEdit ? 'حفظ التعديلات' : 'إنشاء الدور'}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
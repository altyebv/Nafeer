'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Field, Input, Textarea, cx } from '@/components/ui';
import { SUBJECTS_CATALOG, TRACK_CONFIG } from '@/shared/curriculum';

// ─── /join ────────────────────────────────────────────────────────────────────
// The application (canvas page «مسار الانضمام», boards 1–2):
//   1  أين تساعد   — subjects first, with what each needs now; then the role
//   2  عنك         — one step in two halves; finishing the first half moves the
//                    bar halfway. Every field the admission guidelines use.
// Sending opens the interview at once (or the status page for "later"); both
// links also arrive by email. The draft is kept in this browser, so a dropped
// connection or a reload loses nothing.

const DRAFT_KEY = 'nafeer-join-draft';

const GENDERS   = [['male', 'ذكر'], ['female', 'أنثى']];
const AGES      = [['under-18', 'أقل من 18'], ['18-22', '18 – 22'], ['23-27', '23 – 27'], ['28-35', '28 – 35'], ['over-35', 'فوق 35']];
const RELATIONS = [['uni', 'أدرسها في الجامعة'], ['grad', 'تخرّجت فيها'], ['teacher', 'أدرّسها'], ['student', 'جلستُ لها حديثاً'], ['other', 'غير ذلك']];
const HOURS     = [['1-2', 'ساعة أو ساعتان'], ['2-4', '2 – 4 ساعات'], ['5+', '5 ساعات أو أكثر'], ['?', 'لا أعرف بعد']];
const INTERNET  = [['yes', 'مستقر'], ['mostly', 'غالباً'], ['no', 'متقطع']];
const AI_TOOLS  = [['chatgpt', 'ChatGPT'], ['gemini', 'Gemini'], ['notebooklm', 'NotebookLM'], ['claude', 'Claude'], ['copilot', 'Copilot'], ['perplexity', 'Perplexity']];

const EMPTY = {
  subject: '', roleId: '', name: '', email: '', gender: '', age: '', town: '', relation: '', background: '',
  device: '', internet: '', hours: '', usesAi: '', aiTools: [], portfolioUrl: '',
};

const CATEGORY_LABEL = { development: 'بناء المنصة', design: 'التصميم', operations: 'تنظيم نفير', community: 'المجتمع', core: 'بناء المنصة', growth: 'نشر الفكرة', content: 'المحتوى' };

export default function JoinPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [step, setStep] = useState('where');       // where · about-a · about-b
  const [roles, setRoles] = useState([]);
  const [people, setPeople] = useState({});          // subject → working contributors
  const [tab, setTab] = useState('subjects');
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const restored = useRef(false);
  const top = useRef(null);

  // Restore the draft once, then keep it in sync.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (saved?.form) { setForm({ ...EMPTY, ...saved.form }); setStep(saved.step || 'where'); setTab(saved.tab || 'subjects'); }
    } catch { /* storage blocked — start fresh */ }
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, step, tab })); } catch { /* ignore */ }
  }, [form, step, tab]);

  useEffect(() => {
    fetch('/api/admin/roles?active=true').then((r) => r.json()).then((d) => setRoles(d.roles || [])).catch(() => {});
    fetch('/api/contributors/public').then((r) => r.json()).then((d) => {
      const n = {};
      for (const c of d.contributors || []) if (c.subject) n[c.subject] = (n[c.subject] || 0) + 1;
      setPeople(n);
    }).catch(() => {});
  }, []);

  const learningRoles = useMemo(() => roles.filter((r) => r.category === 'learning'), [roles]);
  const otherRoles = useMemo(() => roles.filter((r) => r.category !== 'learning'), [roles]);
  const role = roles.find((r) => r._id === form.roleId) || null;
  const learning = role?.category === 'learning';
  const subject = SUBJECTS_CATALOG.find((s) => s.id === form.subject) || null;

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setErrors({}); };
  const go = (next) => { setStep(next); setErrors({}); top.current?.scrollIntoView({ behavior: 'smooth' }); };

  // ── Validation per part ────────────────────────────────────────────────────
  const check = (part) => {
    const e = {};
    if (part === 'where') {
      if (!role) e.role = 'اختر ما ستفعله';
      if (learning && !form.subject) e.subject = 'اختر المادة';
    }
    if (part === 'about-a') {
      if (!form.name.trim()) e.name = 'اكتب اسمك';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = 'بريد غير صحيح';
      if (!form.gender) e.gender = 'اختر';
      if (!form.age) e.age = 'اختر';
      if (!form.town.trim()) e.town = 'اكتب مدينتك أو ولايتك';
      if (learning && !form.relation) e.relation = 'اختر';
      if (!form.background.trim()) e.background = 'اكتب خلفيتك باختصار';
    }
    if (part === 'about-b') {
      if (!form.device) e.device = 'اختر';
      if (!form.internet) e.internet = 'اختر';
      if (!form.hours) e.hours = 'اختر';
      if (!form.usesAi) e.usesAi = 'اختر';
      if (role?.portfolioPrompt && !form.portfolioUrl.trim()) e.portfolioUrl = 'أضف الرابط';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async (startNow) => {
    if (!check('about-b')) return;
    setSending(true); setSendError(null);
    try {
      const res = await fetch('/api/contributors/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name, email: form.email, gender: form.gender, age: form.age, town: form.town,
          background: form.background, subjectsOfInterest: form.subject ? [form.subject] : [],
          subjectRelation: form.relation, weeklyHours: form.hours, hasPcOrTablet: form.device === 'yes',
          internet: form.internet, usesAiTools: form.usesAi === 'yes', aiToolsList: form.aiTools,
          portfolioUrl: form.portfolioUrl, roleId: form.roleId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setSendError(data.message || 'تعذّر الإرسال، حاول مرة أخرى'); setSending(false); return; }
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      router.push(startNow ? `/interview?token=${data.interviewToken}` : `/join/status?token=${data.statusToken}&sent=1`);
    } catch {
      setSendError('تعذّر الاتصال. إجاباتك محفوظة على جهازك — أعد المحاولة حين يعود الاتصال.');
      setSending(false);
    }
  };

  // The step bar: «عنك» is one step; its first half fills it halfway.
  const fill = { where: [10, 0, 0], 'about-a': [100, 10, 0], 'about-b': [100, 50, 0] }[step];
  const STEPS = ['أين تساعد', 'عنك', 'المقابلة'];

  return (
    <div className="min-h-screen bg-page text-fg font-ui" dir="rtl">
      <div ref={top} className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="t-title font-bold text-fg-accent">نفير</Link>
          <span className="t-label text-fg-muted">لديك حساب؟ <Link href="/signin" className="text-fg-accent hover:underline">ادخل</Link></span>
        </header>

        <ol aria-label="خطوات الطلب" className="flex gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1 flex flex-col gap-1.5">
              <span className="h-1 rounded-chip bg-hover overflow-hidden flex" aria-hidden="true">
                <span className={cx('transition-all duration-300', fill[i] === 100 ? 'bg-success' : 'bg-accent')} style={{ width: `${fill[i]}%` }} />
              </span>
              <span className={cx('t-caption', fill[i] > 0 ? 'text-fg-strong' : 'text-fg-subtle')}>
                {i + 1} · {label}{i === 1 && step === 'about-b' ? ' — ظروف العمل' : ''}
              </span>
            </li>
          ))}
        </ol>

        {step === 'where' && (
          <section className="flex flex-col gap-5" aria-labelledby="where-title">
            <div className="flex flex-col gap-1.5">
              <h1 id="where-title" className="t-h1 text-fg-strong">أين تريد أن تساعد؟</h1>
              <p className="t-body text-fg-muted max-w-2xl">
                بشير تطبيق مجاني لطلاب الشهادة السودانية. أكثر ما ينقصه الآن: من يكتب دروس المواد. اختر مادة تعرفها جيداً — أو ساعد في بناء المنصة نفسها.
                {' '}<Link href="/prejoin" className="text-fg-accent hover:underline">لماذا نفير؟</Link>
              </p>
            </div>

            <div role="tablist" aria-label="نوع المساهمة" className="flex gap-1 border-b border-line">
              {[['subjects', 'مادة دراسية'], ['build', 'بناء المنصة وتنظيمها']].map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={tab === id}
                  onClick={() => { setTab(id); set({ roleId: '', subject: id === 'subjects' ? form.subject : '' }); }}
                  className={cx('h-11 px-4 t-ui border-b-2 -mb-px touch-target', tab === id ? 'border-accent text-fg-strong font-semibold' : 'border-transparent text-fg-muted hover:text-fg')}>
                  {label}
                </button>
              ))}
            </div>

            {tab === 'subjects' ? (
              <>
                <fieldset className="flex flex-col gap-2">
                  <legend className="t-label text-fg mb-2">المادة {errors.subject && <span className="text-danger ms-2">{errors.subject}</span>}</legend>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {SUBJECTS_CATALOG.map((s) => {
                      const n = people[s.id] || 0;
                      const on = form.subject === s.id;
                      return (
                        <button key={s.id} type="button" aria-pressed={on} onClick={() => set({ subject: s.id })}
                          className={cx('flex flex-col gap-1 p-3 rounded-card border text-start transition-colors', on ? 'border-line-accent bg-selected' : 'border-line bg-raised hover:border-line-strong')}>
                          <span className="flex justify-between gap-2 items-baseline">
                            <strong className="t-ui text-fg-strong">{s.nameAr}</strong>
                            <span className="t-caption text-fg-subtle">{TRACK_CONFIG[s.track]?.label}</span>
                          </span>
                          <span className={cx('t-caption', n ? 'text-fg-muted' : 'text-warn')}>
                            {n === 0 ? 'لا أحد بعد — نحتاجك' : n === 1 ? 'مساهم واحد — مرحّب بالثاني' : `${n} مساهمين`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                {subject && (
                  <fieldset className="flex flex-col gap-2">
                    <legend className="t-label text-fg mb-2">ماذا ستفعل في {subject.nameAr}؟ {errors.role && <span className="text-danger ms-2">{errors.role}</span>}</legend>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {learningRoles.map((r) => <RoleCard key={r._id} role={r} on={form.roleId === r._id} onPick={() => set({ roleId: r._id })} />)}
                    </div>
                  </fieldset>
                )}
              </>
            ) : (
              <fieldset className="flex flex-col gap-2">
                <legend className="t-label text-fg mb-2">الدور {errors.role && <span className="text-danger ms-2">{errors.role}</span>}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {otherRoles.map((r) => <RoleCard key={r._id} role={r} on={form.roleId === r._id} onPick={() => set({ roleId: r._id })} />)}
                </div>
              </fieldset>
            )}

            <Footer
              summary={role ? `${role.name}${learning && subject ? ` · ${subject.nameAr}` : ''}` : 'اختر مساراً لتكمل'}
              next={<Button variant="primary" size="lg" onClick={() => check('where') && go('about-a')}>التالي: عنك ←</Button>} />
          </section>
        )}

        {step !== 'where' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start">
            <section className="flex flex-col gap-5" aria-labelledby="about-title">
              <div className="flex flex-col gap-1">
                <span className="t-caption text-fg-accent">الخطوة 2 من 3 · {step === 'about-a' ? 'نصفها الأول' : 'نصفها الثاني'}</span>
                <h1 id="about-title" className="t-h1 text-fg-strong">{step === 'about-a' ? 'عنك' : 'عنك — ظروف العمل'}</h1>
                <p className="t-body text-fg-muted">{step === 'about-a' ? 'من أنت، وما علاقتك بالمادة. نحو دقيقتين.' : 'كيف ومتى ستعمل. نحو دقيقة.'}</p>
              </div>

              {step === 'about-a' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="الاسم الكامل" required error={errors.name}><Input value={form.name} autoComplete="name" onChange={(e) => set({ name: e.target.value })} /></Field>
                    <Field label="البريد الإلكتروني" required error={errors.email} hint="عليه يصلك رابط المقابلة ورابط طلبك.">
                      <Input type="email" dir="ltr" autoComplete="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@example.com" />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Choice label="الجنس" options={GENDERS} value={form.gender} onChange={(v) => set({ gender: v })} error={errors.gender} wide />
                    <Choice label="الفئة العمرية" options={AGES} value={form.age} onChange={(v) => set({ age: v })} error={errors.age} />
                  </div>
                  <Field label="المدينة أو الولاية" required error={errors.town}><Input value={form.town} onChange={(e) => set({ town: e.target.value })} placeholder="مثلاً: بورتسودان، البحر الأحمر" /></Field>
                  {learning && subject && (
                    <Choice label={`علاقتك بال${subject.nameAr.replace(/^ال/, '')}`} options={RELATIONS} value={form.relation} onChange={(v) => set({ relation: v })} error={errors.relation} />
                  )}
                  <Field label="الخلفية التعليمية أو المهنية" required error={errors.background} hint="الجامعة والتخصص والسنة، وأي تدريس سابق.">
                    <Textarea rows={3} value={form.background} onChange={(e) => set({ background: e.target.value })} />
                  </Field>
                  <Footer
                    back={<Button variant="secondary" size="lg" onClick={() => go('where')}>→ أين تساعد</Button>}
                    next={<Button variant="primary" size="lg" onClick={() => check('about-a') && go('about-b')}>متابعة ←</Button>}
                    note="محفوظ على جهازك — لن يضيع إن انقطع الاتصال" />
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Choice label="هل لديك حاسوب أو جهاز لوحي؟" options={[['yes', 'نعم'], ['no', 'هاتف فقط']]} value={form.device} onChange={(v) => set({ device: v })} error={errors.device} wide hint="الكتابة ممكنة من الهاتف، لكنها أبطأ." />
                    <Choice label="هل اتصالك بالإنترنت مستقر؟" options={INTERNET} value={form.internet} onChange={(v) => set({ internet: v })} error={errors.internet} wide />
                  </div>
                  <Choice label="كم ساعة في الأسبوع تستطيع أن تخصص؟" options={HOURS} value={form.hours} onChange={(v) => set({ hours: v })} error={errors.hours} />
                  <Choice label="هل تستخدم أدوات ذكاء اصطناعي؟" options={[['yes', 'نعم'], ['no', 'لا']]} value={form.usesAi} onChange={(v) => set({ usesAi: v, aiTools: v === 'yes' ? form.aiTools : [] })} error={errors.usesAi} wide />
                  {form.usesAi === 'yes' && (
                    <fieldset className="flex flex-col gap-2 ps-4 border-s-2 border-line-accent">
                      <legend className="t-label text-fg mb-1">أيّها؟ <span className="t-caption text-fg-subtle">اختر كل ما ينطبق</span></legend>
                      <div className="flex flex-wrap gap-2">
                        {AI_TOOLS.map(([id, label]) => {
                          const on = form.aiTools.includes(id);
                          return (
                            <button key={id} type="button" dir="ltr" aria-pressed={on}
                              onClick={() => set({ aiTools: on ? form.aiTools.filter((t) => t !== id) : [...form.aiTools, id] })}
                              className={cx('h-9 px-3 rounded-chip border t-label touch-target', on ? 'border-line-accent bg-selected text-fg-accent' : 'border-line-strong text-fg hover:bg-hover')}>
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <span className="t-caption text-fg-subtle">لا يُحتسب ضدك. نريد أن نعرف كيف تعمل، ولدينا إرشادات لاستخدامها في كتابة الدروس.</span>
                    </fieldset>
                  )}
                  {role?.portfolioPrompt && (
                    <Field label={role.portfolioPrompt} required error={errors.portfolioUrl}>
                      <Input dir="ltr" type="url" value={form.portfolioUrl} onChange={(e) => set({ portfolioUrl: e.target.value })} placeholder="https://" />
                    </Field>
                  )}
                  {sendError && <p role="alert" className="t-label text-danger">{sendError}</p>}
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-line">
                    <Button variant="secondary" size="lg" onClick={() => go('about-a')} disabled={sending}>→ عنك</Button>
                    <Button variant="primary" size="lg" loading={sending} onClick={() => submit(true)}>أرسل وابدأ المقابلة ←</Button>
                    <Button variant="ghost" size="lg" disabled={sending} onClick={() => submit(false)}>أرسل، وأكملها لاحقاً</Button>
                  </div>
                </>
              )}
            </section>

            <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
              <div className="flex flex-col gap-3 p-5 rounded-card bg-raised border border-line-accent">
                <h2 className="t-title text-fg-strong">لماذا نسأل هذا كله</h2>
                <p className="t-label font-normal leading-relaxed text-fg-muted">
                  نفير يكتب لطلاب الشهادة السودانية، ونقبل المساهمين وفق إرشادات واضحة: الخلفية في المادة، والقدرة على الالتزام، وظروف العمل الفعلية. كل حقل هنا يدخل في تقييم طلبك.
                </p>
              </div>
              <p className="p-4 rounded-card bg-sunken border border-line t-caption leading-relaxed text-fg-muted">
                <strong className="text-fg">بياناتك:</strong> يراها فريق الإدارة فقط لتقييم الطلب. لا يظهر شيء منها في ملفك العام إلا ما تختار نشره لاحقاً، ولا تُشارك مع أي جهة.
              </p>
              <div className="flex flex-col gap-2 p-4 rounded-card border border-line t-caption leading-relaxed text-fg-muted">
                <strong className="t-label text-fg">بعد هذه الخطوة</strong>
                <span>3 · المقابلة: أسئلة قصيرة ومهمة صغيرة (نحو 15 دقيقة) — الآن أو لاحقاً من رابط طلبك.</span>
                <span>ثم يقرأ فريق الإدارة طلبك كاملاً ويقرر، وتتابع ذلك من الرابط نفسه.</span>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleCard({ role, on, onPick }) {
  return (
    <button type="button" aria-pressed={on} onClick={onPick}
      className={cx('flex flex-col gap-1.5 p-4 rounded-card border text-start transition-colors', on ? 'border-line-accent bg-selected' : 'border-line bg-raised hover:border-line-strong')}>
      <span className="flex justify-between gap-2 items-baseline">
        <strong className="t-ui text-fg-strong">{role.name}</strong>
        {role.category !== 'learning' && <span className="t-caption text-fg-subtle">{CATEGORY_LABEL[role.category] || ''}</span>}
      </span>
      {role.description && <span className="t-label font-normal leading-relaxed text-fg-muted">{role.description}</span>}
    </button>
  );
}

// A labelled set of single-choice chips. `wide` makes them share the row.
function Choice({ label, options, value, onChange, error, hint, wide }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="t-label text-fg mb-1">
        {label} <span className="text-danger" aria-hidden="true">*</span>
        {error && <span className="text-danger ms-2">{error}</span>}
      </legend>
      <div role="radiogroup" aria-label={label} className={cx('flex gap-2', wide ? '' : 'flex-wrap')}>
        {options.map(([id, text]) => {
          const on = value === id;
          return (
            <button key={id} type="button" role="radio" aria-checked={on} onClick={() => onChange(id)}
              className={cx('h-11 px-4 border t-label touch-target transition-colors', wide ? 'flex-1 rounded-control' : 'rounded-chip',
                on ? 'border-line-accent bg-selected text-fg-accent' : 'border-line-strong text-fg hover:bg-hover')}>
              {text}
            </button>
          );
        })}
      </div>
      {hint && <span className="t-caption text-fg-subtle">{hint}</span>}
    </fieldset>
  );
}

function Footer({ back, next, summary, note }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line">
      <span className="t-label text-fg-muted">{summary || note}</span>
      <span className="flex gap-2">{back}{next}</span>
    </div>
  );
}

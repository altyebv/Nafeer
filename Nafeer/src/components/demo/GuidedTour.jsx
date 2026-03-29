'use client';

// ─────────────────────────────────────────────────────────────────────────────
// TOUR STEPS — one per tab, in order.
// Each step drives the active tab and shows a description card below the phone.
// ─────────────────────────────────────────────────────────────────────────────
export const TOUR_STEPS = [
  {
    tab:    'home',
    number: '٠١',
    title:  'الشاشة الرئيسية',
    desc:   'سلسلة المذاكرة، هدفك اليومي، نقاط XP، وتركيز اليوم — كل ما تحتاج تعرفه في لحظة واحدة.',
  },
  {
    tab:    'lesson',
    number: '٠٢',
    title:  'دروس مُهيكلة',
    desc:   'المنهج نفسه، مُقدَّم بشكل مختلف تماماً — معادلات عربية، أمثلة تفاعلية خطوة بخطوة، وصناديق تعريف وتنبيه.',
  },
  {
    tab:    'feed',
    number: '٠٣',
    title:  'لقطات المعرفة',
    desc:   'محتوى يومي قصير — حقائق، تعريفات، بطاقات قابلة للقلب، وأسئلة صح/خطأ. ثلاث دقائق تبني ما لا يبنيه يوم.',
  },
  {
    tab:    'quiz',
    number: '٠٤',
    title:  'بنك الأسئلة',
    desc:   'آلاف الأسئلة مرتّبة حسب المادة والمستوى — من الموضوعي إلى التحليلي. قريباً في النسخة الأولى.',
  },
  {
    tab:    'profile',
    number: '٠٥',
    title:  'ملفك الشخصي',
    desc:   'تتبّع تقدمك، نشاطك الأسبوعي، وإنجازاتك. الانضباط لا يُجبر — يُبنى بالعادة.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// GuidedTour component
// ─────────────────────────────────────────────────────────────────────────────
export default function GuidedTour({ stepIndex, onNext, onPrev, onSkip }) {
  const step    = TOUR_STEPS[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast  = stepIndex === TOUR_STEPS.length - 1;

  return (
    <div
      className="w-full rounded-2xl p-5"
      dir="rtl"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(212,137,30,0.20)',
      }}
    >
      {/* Step number + progress dots */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent)' }}>
          {step.number}
        </span>
        <div className="flex gap-1.5">
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width:  i === stepIndex ? '18px' : '6px',
                height: '6px',
                background: i <= stepIndex ? 'var(--accent)' : 'var(--border-mid)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Title + description */}
      <h3 className="font-arabic text-base font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>
        {step.title}
      </h3>
      <p className="font-arabic text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
        {step.desc}
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4 gap-3">
        {/* Prev / skip */}
        <div className="flex gap-2">
          {!isFirst && (
            <button
              onClick={onPrev}
              className="px-3 py-1.5 rounded-lg text-xs font-arabic transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border-subtle)' }}
            >
              ← السابق
            </button>
          )}
          {isFirst && (
            <button
              onClick={onSkip}
              className="text-xs font-arabic transition-opacity hover:opacity-70"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none' }}
            >
              تخطّ الجولة
            </button>
          )}
        </div>

        {/* Next / finish */}
        {!isLast ? (
          <button
            onClick={onNext}
            className="px-4 py-1.5 rounded-lg text-xs font-arabic font-medium transition-all hover:opacity-90 active:scale-98"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
          >
            التالي →
          </button>
        ) : (
          <button
            onClick={onSkip}
            className="px-4 py-1.5 rounded-lg text-xs font-arabic font-medium transition-all hover:opacity-90 active:scale-98"
            style={{ background: 'var(--accent)', color: '#fff', border: 'none' }}
          >
            جرّب بنفسك ✓
          </button>
        )}
      </div>
    </div>
  );
}

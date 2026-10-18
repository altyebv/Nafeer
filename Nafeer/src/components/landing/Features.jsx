'use client';
import { useRef } from 'react';
import { gsap, useMotion, reveal } from '@/lib/gsap';
import { Eyebrow, cx } from '@/components/ui';
import { LandingSection } from './Section';

// ─── /#features ───────────────────────────────────────────────────────────────
// DS4: one responsive layout. The phone version used to be a 7-screen sticky
// scroll showing one card at a time (≈5.5 screen heights, blank without JS);
// it is now the same cards stacked, which is shorter and readable without JS.

// Each content card's tint, on status tokens rather than per-card rgba.
const TINTS = {
  accent:  { card: 'border-line-accent',     icon: 'bg-accent-wash border-line-accent text-fg-strong',          tag: 'text-fg-accent border-line-accent',  strip: 'bg-accent' },
  warn:    { card: 'border-warn-border',     icon: 'bg-warn-surface border-warn-border text-fg-strong',         tag: 'text-warn border-warn-border',       strip: 'bg-warn' },
  special: { card: 'border-special-border',  icon: 'bg-special-surface border-special-border text-fg-strong',   tag: 'text-special border-special-border', strip: 'bg-special' },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const CONTENT_FEATURES = [
  {
    id: 'lessons',
    num: '01',
    tint: 'accent',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" aria-hidden="true">
        <rect x="3" y="4" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M7 9h8M7 13h8M7 17h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="21" cy="21" r="5" fill="var(--accent)" opacity="0.2" stroke="var(--accent)" strokeWidth="1.2"/>
        <path d="M19 21l1.5 1.5L23 19" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: 'دروس محسّنة',
    subtitle: 'Enhanced Lessons',
    tagline: 'المنهج نفسه — بوضوح مختلف تماماً',
    desc: 'كل درس يُعاد تشكيله بيد مساهم متخصص في مادته — نصوص مهيكلة و مرتبة، صور توضيحية، ومفاهيم تتراكم فوق بعضها. ليس إعادة كتابة، بل إعادة بناء.',
  },
  {
    id: 'feed',
    num: '02',
    tint: 'warn',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" aria-hidden="true">
        <rect x="8" y="2" width="12" height="24" rx="3" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="10" y="8" width="8" height="5" rx="1.5" fill="var(--accent)" opacity="0.25"/>
        <rect x="10" y="15" width="8" height="2" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="10" y="19" width="5" height="2" rx="1" fill="currentColor" opacity="0.2"/>
        <path d="M22 10l3-2M22 14l3 1" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
    title: 'دُروس مُصغرة',
    subtitle: 'Knowledge Feed',
    tagline: 'تعلّم يومي لا يحتاج وقتاً إضافياً',
    desc: 'أحصل على المعلومات في شكلِ تصفحٍ عمودي من مفاهيم صغيرة وبطاقات تذكيرية وأسئلة خاطفة — كل بطاقة تُعزز فهمك لما سبق . ثلاث دقائق من التصفح تساوي فكرة جديدة راسخة.',
  },
  {
    id: 'quizbank',
    num: '03',
    tint: 'special',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" aria-hidden="true">
        <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
        <rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
        <rect x="15" y="15" width="10" height="10" rx="2" fill="var(--accent)" opacity="0.15" stroke="var(--accent)" strokeWidth="1.5"/>
        <path d="M18 20h4M18 22.5h2.5" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
    title: 'بنك الأسئلة',
    subtitle: 'Question Bank',
    tagline: 'آلاف الأسئلة — من الموضوعي للتحليلي',
    desc: 'كل الامتحانات السابقة في مكان واحد، مُصنّفة حسب المادة والوحدة والصعوبة. بنك الأسئلة هو القاعدة التي يقوم عليها كل شيء آخر في بشير.',
  },
];

const INTELLIGENCE_FEATURES = [
  {
    id: 'spaced',
    num: '04',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" aria-hidden="true">
        <path d="M4 20C4 20 6 8 14 8C22 8 24 20 24 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="14" r="2" fill="var(--accent)" opacity="0.7"/>
        <circle cx="14" cy="10" r="2" fill="var(--accent)" opacity="0.5"/>
        <circle cx="19" cy="14" r="2" fill="var(--accent)" opacity="0.3"/>
        <path d="M9 14v4M14 10v8M19 14v4" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      </svg>
    ),
    title: 'التكرار المتباعد',
    subtitle: 'Spaced Repetition',
    desc: 'خوارزمية SM-2 الذكية مُقتبسة مِن Duolingo  محرّك الدُروس المُصغرة — تُظهر المفهوم في اللحظة التي يكاد عقلك أن ينساه. ليس عشوائياً. يعلم متى تحتاج أن ترى الفكرة مجدداً.',
  },
  {
    id: 'weakareas',
    num: '05',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" aria-hidden="true">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2"/>
        <circle cx="14" cy="14" r="5" stroke="var(--accent)" strokeWidth="1.5"/>
        <circle cx="14" cy="14" r="2" fill="var(--accent)" opacity="0.6"/>
        <path d="M14 4v3M14 21v3M4 14h3M21 14h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.3"/>
      </svg>
    ),
    title: 'مُحرك ذكي',
    subtitle: 'Smart Recommendation Engine',
    desc: 'يرصد بشير تقدمك ، ماذا درست ، أين تتعثر — أي مفاهيم تراجعت، أي وحدات تحتاج تعزيزاً — ويُحرّك محتوى يستهدف هذه الفجوات تحديداً قبل أن تتسع.',
  },
  {
    id: 'practice',
    num: '06',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" aria-hidden="true">
        <path d="M5 14C5 9 9 5 14 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M23 14C23 19 19 23 14 23" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 5l3-3M14 5l-3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        <path d="M14 23l3 3M14 23l-3 3" stroke="var(--accent)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"/>
        <circle cx="14" cy="14" r="3" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
    title: 'التدريب المُخصَّص',
    subtitle: 'Adaptive Practice',
    desc: 'جلسات تدريب تُبنى من بنك الأسئلة وقابلة للتخصيص — يمكنك إختيار الدرس أو المفهوم ، نوع الأسئلة و المزبد . أو الجلسات الذكية التي يُنشئها بشير.',
  },
  {
    id: 'streaks',
    num: '07',
    icon: (
      <svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" aria-hidden="true">
        <path d="M14 3C14 3 8 8 8 14C8 17.3 10.7 20 14 20C17.3 20 20 17.3 20 14C20 12 19 10.5 18 9.5C18 9.5 17 13 14 13C14 13 11 11 13 7C13 7 10 9 10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M14 20v5" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
        <circle cx="14" cy="14" r="2" fill="var(--accent)" opacity="0.5"/>
      </svg>
    ),
    title: 'السلاسل والشارات',
    subtitle: 'Streaks & Badges',
    desc: 'حوّل التعلّم إلى عادة لا تنكسر ، سلاسل يومية تحفّزك على الاستمرار، وشارات تُجسّد إنجازك ، نافس نفسك، وادفع حدودك كل يوم — التقدّم هنا يُبنى بالتراكم.',
  },
];

// ─── Pieces ───────────────────────────────────────────────────────────────────

function LayerChip({ intel, className }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5 px-4 py-2 rounded-full border t-label text-fg-muted',
      intel ? 'bg-raised border-line' : 'bg-accent-wash border-line-accent', className)}>
      <span aria-hidden="true" className="relative flex h-2 w-2">
        {intel && <span className="absolute inline-flex h-full w-full rounded-full bg-accent opacity-40 motion-safe:animate-ping" />}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
      </span>
      <span>{intel ? 'طبقة الذكاء' : 'طبقة المحتوى'}</span>
      <span aria-hidden="true" className="opacity-40">·</span>
      <span dir="ltr" className="t-caption text-fg-subtle">{intel ? 'Intelligence Layer' : 'Content Layer'}</span>
    </span>
  );
}

function ContentCard({ f }) {
  const t = TINTS[f.tint];
  return (
    <li className={cx('content-card relative rounded-panel overflow-hidden flex flex-col bg-raised border',
      'transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-lift motion-reduce:transform-none', t.card)}>
      <div aria-hidden="true" className={cx('h-0.5 w-2/3', t.strip)} />
      <div className="p-6 sm:p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-6">
          <div className={cx('p-2.5 rounded-control border', t.icon)}>{f.icon}</div>
          <span aria-hidden="true" className="t-caption t-num text-fg-subtle mt-1">{f.num}</span>
        </div>
        <h3 className="t-h2 text-fg-strong">{f.title}</h3>
        <p dir="ltr" className="t-caption text-fg-subtle mb-3 text-right">{f.subtitle}</p>
        <p className={cx('t-label mb-4 pb-4 border-b', t.tag)}>{f.tagline}</p>
        <p className="read t-body leading-loose flex-1 text-fg-muted">{f.desc}</p>
      </div>
    </li>
  );
}

function IntelligenceRow({ f }) {
  return (
    <li className="intel-card relative flex items-start gap-5 p-5 sm:p-6 rounded-card bg-raised border border-line">
      <div aria-hidden="true" className="absolute top-0 right-0 h-full w-0.5 rounded-full bg-gradient-to-b from-accent to-transparent" />
      <div className="shrink-0 p-2.5 rounded-control mt-0.5 bg-accent-wash border border-line-accent text-fg-accent">{f.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3 mb-1.5 flex-wrap">
          <h3 className="t-title text-fg-strong">{f.title}</h3>
          <span dir="ltr" className="t-caption text-fg-subtle">{f.subtitle}</span>
        </div>
        <p className="read t-body leading-loose text-fg-muted">{f.desc}</p>
      </div>
      <span aria-hidden="true" className="shrink-0 t-caption t-num text-fg-subtle mt-1">{f.num}</span>
    </li>
  );
}

function LayerDivider() {
  return (
    <div className="features-divider relative flex items-center gap-4 my-14 sm:my-20">
      <div aria-hidden="true" className="flex-1 h-px bg-gradient-to-l from-line to-transparent" />
      <LayerChip intel />
      <div aria-hidden="true" className="flex-1 h-px bg-gradient-to-r from-line to-transparent" />
    </div>
  );
}

// ─── Root export ───────────────────────────────────────────────────────────────

export default function Features() {
  const sectionRef = useRef(null);

  useMotion(sectionRef, () => {
    const head = gsap.timeline({ scrollTrigger: { trigger: '.feat-head', start: 'top 88%', once: true } });
    head.from('.feat-eyebrow',  { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' })
      .from('.feat-headline',   { opacity: 0, y: 30, duration: 0.8, ease: 'power3.out' }, '-=0.3')
      .from('.feat-line',       { scaleX: 0, transformOrigin: 'right center', duration: 0.7, ease: 'expo.out' }, '-=0.4')
      .from('.feat-sub',        { opacity: 0, y: 20, duration: 0.7, ease: 'power3.out' }, '-=0.35')
      .from('.feat-layer-label', { opacity: 0, y: 12, duration: 0.5, stagger: 0.15, ease: 'power3.out' }, '-=0.2');
    reveal('.content-card', { trigger: '.content-cards-grid', y: 50, scale: 0.95, stagger: 0.12, duration: 0.8 });
    reveal('.features-divider', { y: 20 });
    reveal('.intel-card', { trigger: '.intel-grid', y: 0, x: 30, stagger: 0.1, duration: 0.65 });
  });

  return (
    <LandingSection ref={sectionRef} id="features" width="wide"
      decoration={<div aria-hidden="true" className="ember-line absolute top-0 inset-x-0 max-w-7xl mx-auto opacity-40" />}>

      <div className="feat-head mb-14 sm:mb-20">
        <Eyebrow as="p" className="feat-eyebrow mb-5">داخل التطبيق</Eyebrow>
        <h2 className="feat-headline text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4 leading-snug text-fg-strong">
          محتوى يُبنى بعناية.
          <br />
          <span className="text-fg-accent">ذكاء يُحرّكه بهدف.</span>
        </h2>
        <div aria-hidden="true" className="feat-line ember-line w-20 sm:w-28 mb-5" />
        <p className="feat-sub read t-body sm:text-lg leading-loose max-w-2xl mb-8 text-fg-muted">
          بشير ليس مجرد مكتبة دروس — هو نظام تعلّم متكامل . طبقة المحتوى تُقدّم المعرفة،
          وطبقة الذكاء تضمن أنها تبقى وتُبنى عليها.
        </p>
        <div className="flex flex-wrap gap-3">
          <LayerChip className="feat-layer-label" />
          <LayerChip intel className="feat-layer-label" />
        </div>
      </div>

      <ul className="content-cards-grid grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {CONTENT_FEATURES.map((f) => <ContentCard key={f.id} f={f} />)}
      </ul>

      <LayerDivider />

      <ul className="intel-grid grid sm:grid-cols-2 gap-4">
        {INTELLIGENCE_FEATURES.map((f) => <IntelligenceRow key={f.id} f={f} />)}
      </ul>
    </LandingSection>
  );
}

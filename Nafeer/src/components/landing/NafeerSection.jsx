'use client';
import { useRef } from 'react';
import { ArrowLeft, Globe2, GraduationCap, Infinity as InfinityIcon, LaptopMinimal, Medal, Wrench } from 'lucide-react';
import { useMotion, reveal } from '@/lib/gsap';
import { Button, Eyebrow } from '@/components/ui';
import { LandingSection } from './Section';
import { useCoverage } from './useCoverage';

const steps = [
  { num: '1', title: 'تقدم بطلبك', desc: 'أخبرنا من أنت وأي مادة تريد بناءها. نقرأ كل طلب شخصياً ونرد خلال 48 ساعة.' },
  { num: '2', title: 'احصل على صلاحياتك', desc: 'بعد الموافقة، حساب كامل في منصة نفير — والمادة التي اخترتها محجوزة لك.' },
  { num: '3', title: 'ابدأ البناء', desc: 'أداة تحرير مبنية لهذا الغرض تحديداً — وحدات، دروس، مفاهيم، وأسئلة. لا تقنية معقدة.' },
  { num: '4', title: 'شاهد أثرك', desc: 'محتواك يُصدَّر تلقائياً لتطبيق بشير. اسمك يظهر على كل درس بنيته — أمام كل من يفتحه.' },
];

const WHO = [
  { icon: GraduationCap, who: 'معلمين', desc: 'يريدون نقل مادتهم بطريقة تفاعلية' },
  { icon: LaptopMinimal, who: 'طلاب جامعة', desc: 'يريدون تسهيل ما صعب عليهم' },
  { icon: Globe2, who: 'متحمسين', desc: 'يرون التعليم قضية تستحق وقتهم' },
];

const PERKS = [
  { icon: Medal, title: 'اسمك في لحظة التعلم', desc: 'كل طالب يفتح درساً أنشأته يرى اسمك — ليس في الإهداء ، بل في لحظة التعلم نفسها.' },
  { icon: GraduationCap, title: 'أثر يتضاعف', desc: 'طالب يفهم اليوم بسببك قد يُعلّم غيره غداً. بعض الأفعال لا حدود لامتدادها.' },
  { icon: Wrench, title: 'أدوات مبنية لغرض واحد', desc: 'نفير بُني خصيصاً لمحتوى الشهادة السودانية. كل أداة فيه لها غرض واحد فقط.' },
];

const CARD_HOVER = 'transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-accent motion-reduce:transform-none';

export default function NafeerSection() {
  const sectionRef = useRef(null);
  const { open } = useCoverage();

  useMotion(sectionRef, () => {
    reveal('.nafeer-label', { y: 12 });
    reveal('.nafeer-headline', { y: 32, duration: 1 });
    reveal('.nafeer-body-line', { trigger: '.nafeer-body', y: 18, stagger: 0.12, duration: 0.75 });
    reveal('.nafeer-who', { trigger: '.nafeer-who-list', y: 0, x: 20, stagger: 0.11, duration: 0.65 });
    reveal('.nafeer-pull', { y: 20, scaleX: 0.96, duration: 0.85 });
    reveal('.nafeer-steps-label', { y: 10 });
    reveal('.nafeer-step', { trigger: '.nafeer-steps', y: 28, stagger: 0.12, ease: 'back.out(1.2)' });
    reveal('.nafeer-perk', { trigger: '.nafeer-perks', y: 20, stagger: 0.1 });
    reveal('.nafeer-cta-block', { y: 24, duration: 0.9 });
  });

  return (
    <LandingSection ref={sectionRef} id="nafeer-story" width="content"
      decoration={(
        <div aria-hidden="true" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none">
          <span className="l-watermark opacity-[0.016] l-mark-32 font-arabic font-bold leading-none">نفير</span>
        </div>
      )}>

      {/* ── BEAT 1: The Story ── */}
      <div className="mb-16 sm:mb-24">
        <Eyebrow as="p" className="nafeer-label mb-6">النفير — مفهوم سوداني أصيل</Eyebrow>

        <h2 className="nafeer-headline text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-10 leading-snug text-fg-strong">
          ما لا يبنيه شخص واحد
          <br />
          <span className="text-fg-accent">يبنيه النفير</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-start">
          <div className="nafeer-body read space-y-5 t-body sm:text-lg leading-loose text-fg-muted">
            <p className="nafeer-body-line text-fg">
              النفير في الثقافة السودانية يعني أن يجتمع الناس لبناء ما لا يستطيع أحدهم بناءه وحده.
              ليس عملاً مؤقتاً — بل شعور بأن هذا الشيء يخصنا جميعاً وأننا مسؤولون عنه.
            </p>
            <p className="nafeer-body-line">
              السودان يمر اليوم بلحظة تحوّل رقمي حقيقية. والسؤال ليس هل نكون جزءاً منه — بل كيف؟
              النفير هو جوابنا: نبني المعرفة كما نبني البيوت — معاً، بإحساس المسؤولية، وبطريقتنا.
            </p>
            <p className="nafeer-body-line">
              خبير يرسم مادته. طالب يفهمها. وأثر يمتد لسنوات.
            </p>
          </div>

          <div className="nafeer-who-list md:w-64 shrink-0">
            <h3 className="t-label mb-4 text-fg-muted">النفير يبحث عن</h3>
            <ul className="space-y-2">
              {WHO.map((item) => (
                <li key={item.who} className="nafeer-who flex items-center gap-3 py-2.5 px-3.5 rounded-card border border-line transition-colors duration-200 hover:bg-raised hover:border-line-accent">
                  <item.icon size={19} strokeWidth={1.8} className="shrink-0 text-fg-accent" aria-hidden="true" />
                  <div>
                    <span className="t-label font-bold block text-fg-strong">{item.who}</span>
                    <span className="t-caption leading-snug text-fg-muted">{item.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pull quote — impact statement */}
        <div className="nafeer-pull mt-12 sm:mt-14 py-7 px-7 sm:px-10 rounded-panel bg-accent-wash border border-line-accent border-r-[3px] border-r-accent">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p className="text-xl sm:text-2xl font-arabic font-bold leading-relaxed text-fg-strong">
              مادة واحدة منك تُبنى مرة واحدة
              <span className="text-fg-accent"> وتُستخدم آلاف المرات</span>
            </p>
            <dl className="flex gap-8 shrink-0">
              <div className="flex flex-col-reverse items-center">
                <dt className="t-caption mt-1 text-fg-muted">مادة مفتوحة</dt>
                <dd className="flex h-9 items-center t-num font-ui text-3xl font-bold text-fg-accent">{open}</dd>
              </div>
              <div className="flex flex-col-reverse items-center">
                <dt className="t-caption mt-1 text-fg-muted">طالب يستفيد</dt>
                <dd className="flex h-9 items-center text-fg-accent"><InfinityIcon size={28} strokeWidth={1.9} aria-label="بلا حد" /></dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* ── BEAT 2: How to Join ── */}
      <div className="mb-14 sm:mb-20">
        <h3 className="nafeer-steps-label t-label mb-8 text-fg-muted">الطريق أقصر مما تتخيل — 4 خطوات</h3>
        <ol className="nafeer-steps grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {steps.map((step) => (
            <li key={step.num} className={`nafeer-step relative p-5 rounded-card bg-raised border border-line ${CARD_HOVER}`}>
              <div aria-hidden="true" className="t-num font-ui text-3xl font-bold mb-4 leading-none text-fg-accent opacity-80">{step.num}</div>
              <h4 className="t-title mb-2 text-fg-strong">{step.title}</h4>
              <p className="read t-body leading-loose text-fg-muted">{step.desc}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ── BEAT 3: What You Get ── */}
      <div className="nafeer-perks mb-14 sm:mb-20">
        <h3 className="t-label mb-8 text-fg-muted">ماذا يعني وجودك</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line rounded-panel overflow-hidden border border-line">
          {PERKS.map((item) => (
            <li key={item.title} className="nafeer-perk p-6 sm:p-7 bg-sunken transition-colors duration-300 hover:bg-raised">
              <item.icon size={28} strokeWidth={1.7} className="mb-4 block text-fg-accent" aria-hidden="true" />
              <h4 className="t-title mb-2 text-fg-strong">{item.title}</h4>
              <p className="read t-body leading-loose text-fg-muted">{item.desc}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── BEAT 4: CTA ── */}
      <div className="nafeer-cta-block relative overflow-hidden text-center py-14 sm:py-16 px-6 sm:px-10 rounded-panel bg-raised border border-line">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none l-orb-1" />
        <div className="relative">
          <p className="t-label mb-4 text-fg-muted">كل يوم بدون مادة يعني يوماً أقل لطالب ينتظر</p>
          <p className="text-2xl sm:text-3xl font-arabic font-bold mb-2 text-fg-strong">مقعدك في النفير شاغر</p>
          <p className="t-body mb-8 text-fg-muted">كن جزءاً من التحول الرقمي — بطريقتنا، بقصصنا، بمعرفتنا</p>
          <Button as="a" href="/join" variant="primary" size="lg" iconEnd={ArrowLeft}>انضم للنفير الآن</Button>
        </div>
      </div>
    </LandingSection>
  );
}

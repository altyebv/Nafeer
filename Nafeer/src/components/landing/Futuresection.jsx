'use client';
import { useRef } from 'react';
import { useMotion, reveal } from '@/lib/gsap';
import { Badge, Eyebrow, cx } from '@/components/ui';
import { LandingSection } from './Section';

const horizons = [
  {
    phase: 'المرحلة التالية',
    title: 'تغطية كاملة للمرحلة الثانوية',
    desc: 'بشير اليوم يخدم طلاب الشهادة. الخطوة القادمة: الصف الأول والثاني الثانوي — حتى لا يصل الطالب للشهادة وعنده فجوات من سنتين.',
    accent: true,
  },
  {
    phase: 'قريباً',
    title: 'منافسة ولوحات شرف',
    desc: 'تحديات أسبوعية بين الطلاب، ومسابقات بين المدارس. التعلم لا يحتاج أن يكون صامتاً — المنافسة الصحية تُشعل الشغف.',
  },
  {
    phase: 'قريباً',
    title: 'نماذج أذكى، تجربة أعمق',
    desc: 'شرح يتكيف مع طريقة تفكير كل طالب. عندما لا يفهم طريقة واحدة، يجرب بشير طريقة ثانية وثالثة — آلياً.',
  },
  {
    phase: 'قريباً',
    title: 'المعمل',
    desc: 'بيئة تفاعلية لتجريب المفاهيم العلمية والرياضية. لا تكتفي بفهم النظرية — جربها بنفسك وشاهدها تعمل.',
  },
  {
    phase: 'دائماً',
    title: 'تحسين مستمر بلا توقف',
    desc: 'كل إصدار أفضل من السابق. المحتوى يُراجع، الأداء يُقاس، والملاحظات من الطلاب والمساهمين تشكّل كل قرار.',
  },
];

export default function FutureSection() {
  const sectionRef = useRef(null);

  useMotion(sectionRef, () => {
    reveal('.future-eyebrow', { y: 14 });
    reveal('.future-headline', { y: 36, duration: 1.05 });
    reveal('.future-sub', { y: 18, duration: 0.8, delay: 0.1 });
    reveal('.future-horizon', { trigger: '.future-horizons', y: 28, stagger: 0.13 });
    reveal('.future-open-source', { y: 16, start: 'top 92%' });
    reveal('.future-closing', { y: 24, duration: 0.9, start: 'top 92%' });
  });

  return (
    <LandingSection ref={sectionRef} id="future" width="content"
      decoration={(
        <>
          <div aria-hidden="true" className="absolute left-1/2 bottom-0 -translate-x-1/2 pointer-events-none select-none">
            <span className="l-watermark opacity-[0.014] l-mark-40 font-arabic font-bold leading-none">غداً</span>
          </div>
          <div aria-hidden="true" className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 pointer-events-none l-wash-top" />
        </>
      )}>

      <div className="mb-16 sm:mb-24">
        <Eyebrow as="p" className="future-eyebrow mb-6">إلى أين نذهب</Eyebrow>
        <h2 className="future-headline text-3xl sm:text-4xl md:text-5xl font-arabic font-bold leading-snug mb-7 text-fg-strong">
          بشير اليوم بداية.
          <br />
          <span className="text-fg-accent">والطريق أمامنا طويل.</span>
        </h2>
        <p className="future-sub read t-body sm:text-lg leading-loose max-w-2xl text-fg-muted">
          بَدأَ بيد واحدة، ويُطور الآن بمساهمة عشرات. الهدف لم يتغير:
          أن لا يعتمد أي طالب سوداني على الحظ ليفهم مادته.
          هذا ما يبدو عليه الطريق من هنا.
        </p>
      </div>

      <ol className="future-horizons space-y-4 mb-16 sm:mb-20">
        {horizons.map((item) => (
          <li key={item.title}
            className={cx('future-horizon flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-8 py-6 sm:py-7 px-6 sm:px-8 rounded-panel border',
              'transition-[transform,border-color] duration-300 hover:-translate-y-0.5 motion-reduce:transform-none',
              item.accent ? 'bg-accent-wash border-line-accent' : 'bg-raised border-line hover:border-line-accent')}>
            <div className="shrink-0 sm:w-28">
              <Badge tone={item.phase === 'دائماً' ? 'neutral' : 'accent'} size="sm">{item.phase}</Badge>
            </div>
            <div className="flex-1">
              <h3 className="t-title sm:text-lg mb-2 text-fg-strong">{item.title}</h3>
              <p className="read t-body leading-loose text-fg-muted">{item.desc}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="future-open-source flex items-start gap-4 mb-16 sm:mb-20 py-5 px-6 rounded-card bg-raised border border-line">
        <span aria-hidden="true" className="mt-2 shrink-0 w-2 h-2 rounded-full bg-success" />
        <p className="t-body leading-relaxed text-fg-muted">
          <span className="font-semibold text-fg">بشير مفتوح المصدر ومجاني الآن و دائماً.</span>{' '}
          هذا ليس تكتيكاً تسويقياً — هو مبدأ. التعليم الجيد لا يجب أن يكون خلف جدار.
        </p>
      </div>

      <div className="future-closing text-center">
        <div aria-hidden="true" className="ember-line w-12 mx-auto mb-8" />
        <p className="text-xl sm:text-2xl md:text-3xl font-arabic font-bold leading-relaxed mb-3 text-fg-strong">كل هذا يبدأ بمساهم واحد.</p>
        <p className="t-body text-fg-muted">ربما أنت.</p>
      </div>
    </LandingSection>
  );
}

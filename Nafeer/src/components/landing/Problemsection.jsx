'use client';
import { useRef } from 'react';
import { gsap, useMotion, reveal } from '@/lib/gsap';
import { SectionTitle } from '@/components/ui';
import { LandingSection } from './Section';

const scenes = [
  {
    num: '1',
    label: 'كنز في انتظار مفتاحه',
    labelEn: 'A Goldmine Awaiting Its Key',
    text: 'المنهج السوداني غني بالفعل — علم حقيقي، مفاهيم راسخة، معرفة تستحق الفهم. المشكلة ليست فيما يُدرَّس، بل في الجسر بين الكتاب وعقل الطالب. بشير هو ذلك الجسر.',
  },
  {
    num: '2',
    label: 'صُنع لهذا العالم تحديداً',
    labelEn: 'Built for This World Specifically',
    text: 'معظم التطبيقات التعليمية صُنعت لبيئات مختلفة. بشير صُنع للواقع السوداني — يعمل بلا إنترنت، بلا انقطاع، بلا استثناء. لأن التعليم الجيد حق لكل طالب، بغض النظر عن ظروف اتصاله.',
  },
  {
    num: '3',
    label: 'المعرفة التي تبقى وتبني',
    labelEn: 'Knowledge That Stays and Builds',
    text: 'كثير من المفاهيم التي تُدرَّس في المرحلة الثانوية هي أساس لما يأتي بعدها. بشير يُساعد الطالب على رؤية هذه الروابط — فلا تُعاد دراسة ما سبق تعلّمه، بل يُبنى عليه.',
  },
];

export default function ProblemSection() {
  const sectionRef = useRef(null);

  useMotion(sectionRef, () => {
    reveal('.problem-eyebrow', { y: 24 });
    reveal('.problem-scene', { trigger: '.problem-scenes', y: 44, stagger: 0.22, duration: 0.85 });
    gsap.from('.problem-separator', {
      scaleX: 0, transformOrigin: 'right center', duration: 0.7, stagger: 0.22, ease: 'expo.out',
      scrollTrigger: { trigger: '.problem-scenes', start: 'top 88%', once: true },
    });
    reveal('.problem-pivot', { y: 32, scale: 0.96, duration: 1 });
    gsap.from('.problem-pivot-bar', {
      scaleY: 0, transformOrigin: 'top center', duration: 0.9, ease: 'expo.out',
      scrollTrigger: { trigger: '.problem-pivot', start: 'top 92%', once: true },
    });
  });

  return (
    <LandingSection
      ref={sectionRef}
      id="problem"
      width="content"
      decoration={(
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none l-wash flex items-center justify-center select-none">
          <span className="l-watermark opacity-[0.018] l-mark-30 font-arabic font-bold leading-none">الإمكانية</span>
        </div>
      )}
    >
      <SectionTitle
        className="problem-eyebrow mb-14 sm:mb-20"
        eyebrow="لماذا بشير"
        title={(
          <>
            <span className="block text-3xl sm:text-4xl md:text-5xl leading-tight">الإمكانية موجودة دائماً</span>
            <span className="block mt-2 text-2xl sm:text-3xl md:text-4xl font-normal text-fg-muted">نحتاج فقط الأداة المناسبة لإطلاقها</span>
          </>
        )}
      />

      <ol className="problem-scenes">
        {scenes.map((scene) => (
          <li key={scene.num} className="problem-scene">
            <div aria-hidden="true" className="problem-separator border-t border-line" />
            <div className="py-8 sm:py-10 flex flex-col sm:flex-row sm:items-start gap-5 sm:gap-12">
              <div className="sm:w-48 shrink-0 flex sm:flex-col items-center sm:items-start gap-4 sm:gap-2">
                <span aria-hidden="true" className="t-num text-3xl sm:text-4xl font-ui font-bold leading-none text-fg-accent opacity-40">{scene.num}</span>
                <div>
                  <h3 className="t-title text-fg-strong">{scene.label}</h3>
                  <p dir="ltr" className="t-caption text-fg-subtle mt-0.5 text-right">{scene.labelEn}</p>
                </div>
              </div>
              <p className="read t-body sm:text-lg leading-loose flex-1 text-fg-muted">{scene.text}</p>
            </div>
          </li>
        ))}
        <li aria-hidden="true" className="problem-separator border-t border-line" />
      </ol>

      <div className="problem-pivot mt-14 sm:mt-20">
        <div className="relative overflow-hidden p-8 sm:p-10 rounded-panel bg-raised border border-line-accent">
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none l-wash" />
          <div className="relative flex items-start gap-5">
            <div aria-hidden="true" className="problem-pivot-bar w-1 self-stretch rounded-full shrink-0 hidden sm:block bg-accent opacity-50" />
            <div>
              <p className="t-eyebrow mb-3">الفرق الذي يصنعه بشير</p>
              <p className="text-xl sm:text-2xl md:text-3xl font-arabic font-bold leading-relaxed text-fg-strong">
                بشير لا يُبدّل المنهج —
                <span className="text-fg-accent"> يُبدّل طريقة عيشِه.</span>
              </p>
              <p className="read t-body leading-loose mt-3 text-fg-muted">
                نفس المقررات، نفس المواد، نفس الدُروس — لكن بتجربة تعلّم مرئية، تفاعليه و ممتعة . مصممة للطالب السوداني تحديداً.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LandingSection>
  );
}

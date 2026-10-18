'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Construction, Smartphone } from 'lucide-react';
import { useMotion, reveal } from '@/lib/gsap';
import { Badge, Button, Eyebrow, cx } from '@/components/ui';
import SupportButton from '@/components/landing/SupportButton';
import { LandingSection } from './Section';

const PANEL = 'finalcta-panel relative p-8 sm:p-10 rounded-panel overflow-hidden flex flex-col bg-raised border transition-[border-color,box-shadow] duration-300 hover:shadow-lift';

export default function FinalCTA() {
  const sectionRef = useRef(null);

  useMotion(sectionRef, () => {
    reveal('.finalcta-eyebrow', { y: 16, start: 'top 92%' });
    reveal('.finalcta-panel', { trigger: '.finalcta-grid', y: 40, scale: 0.97, stagger: 0.15, duration: 0.75, start: 'top 90%' });
    reveal('.finalcta-footer', { y: 0, duration: 0.8, start: 'top 95%' });
  });

  return (
    <LandingSection ref={sectionRef} id="join" width="wide"
      decoration={<div aria-hidden="true" className="ember-line absolute top-0 inset-x-0 max-w-7xl mx-auto opacity-40" />}>

      <Eyebrow as="p" className="finalcta-eyebrow block text-center mb-10 sm:mb-14">خطوتان. مستقبل واحد.</Eyebrow>

      <div className="finalcta-grid grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-10">

        {/* ── Panel A: Students → /demo ── */}
        <article className={cx(PANEL, 'border-line hover:border-info-border')}>
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 pointer-events-none bg-gradient-to-b from-info-surface to-transparent" />
          <Badge tone="info" size="sm" className="relative self-start mb-7">للطلاب</Badge>
          <div aria-hidden="true" className="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-card border border-info-border bg-info-surface text-info">
            <Smartphone size={30} strokeWidth={1.7} />
          </div>
          <div className="relative flex-1">
            <h2 className="text-2xl sm:text-3xl font-arabic font-bold mb-3 leading-snug text-fg-strong">
              أنت الطالب الذي
              <br />
              <span className="text-fg-accent">يستحق أكثر</span>
            </h2>
            <p className="read t-body leading-loose mb-8 text-fg-muted">
              جرّب بشير الآن — معاينة تفاعلية قصيرة قبل الإطلاق الفعلي على Play Store.
            </p>
          </div>
          <div className="relative mb-5"><SupportButton /></div>
          <Button as={Link} href="/demo" variant="primary" size="lg" block iconEnd={ArrowLeft} className="relative">جرّب بشير الآن</Button>
        </article>

        {/* ── Panel B: Contributors ── */}
        <article className={cx(PANEL, 'border-line-accent hover:border-accent')}>
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none l-wash-top" />
          <Badge tone="accent" size="sm" className="relative self-start mb-7">للمساهمين</Badge>
          <div aria-hidden="true" className="relative mb-6 inline-flex h-14 w-14 items-center justify-center rounded-card border border-line-accent bg-accent-wash text-fg-accent">
            <Construction size={31} strokeWidth={1.7} />
          </div>
          <div className="relative flex-1">
            <h2 className="text-2xl sm:text-3xl font-arabic font-bold mb-3 leading-snug text-fg-strong">
              أنت الشخص الذي
              <br />
              <span className="text-fg-accent">يغيّر هذا</span>
            </h2>
            <p className="read t-body leading-loose mb-8 text-fg-muted">
              مادة واحدة منك تصل لآلاف الطلاب — درس بعد درس.
              النفير في انتظارك.
            </p>
          </div>
          <Button as={Link} href="/join" variant="secondary" size="lg" block iconEnd={ArrowLeft} className="relative">انضم للنفير</Button>
        </article>
      </div>

      <p className="finalcta-footer text-center py-6 border-t border-line t-label text-fg-muted">
        مشروع مفتوح من السودان، للسودان — مجاني الآن وللأبد
      </p>
    </LandingSection>
  );
}

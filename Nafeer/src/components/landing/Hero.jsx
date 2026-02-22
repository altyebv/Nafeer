'use client';
import { useEffect, useRef } from 'react';

export default function Hero() {
  const heroRef = useRef(null);

  useEffect(() => {
    const els = heroRef.current?.querySelectorAll('.opacity-0-init');
    els?.forEach((el, i) => {
      setTimeout(() => {
        el.classList.remove('opacity-0-init');
        el.classList.add('animate-fade-up');
      }, i * 120);
    });
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-bg" />

      {/* Decorative arabic calligraphy watermark */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 opacity-[0.03] select-none pointer-events-none">
        <span className="text-[22vw] font-arabic font-bold leading-none text-sand-100">
          بشير
        </span>
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-sand-600/5 blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-ember-500/5 blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-32">
        {/* Badge */}
        <div className="opacity-0-init mb-8 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sand-700/40 bg-sand-900/30 text-sand-400 text-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-sand-400 animate-pulse" />
          قيد الإنشاء — نبحث عن مساهمين
        </div>

        {/* Main headline */}
        <div className="opacity-0-init mb-6">
          <h1 className="text-6xl md:text-8xl font-arabic font-bold leading-tight text-sand-50">
            بشير
          </h1>
          <div className="ember-line w-32 my-4" />
          <h2 className="text-2xl md:text-3xl font-arabic text-ink-300 leading-relaxed max-w-2xl">
            تجربة تعليمية جديدة للطالب السوداني —{' '}
            <span className="text-sand-400">قبل القبول الجامعي</span>
          </h2>
        </div>

        {/* Description */}
        <p className="opacity-0-init text-lg text-ink-400 max-w-xl leading-loose mb-12">
          تطبيق يحوّل المنهج الدراسي إلى تجربة تفاعلية، بدروس محسّنة، ومحتوى يومي قصير،
          ومحاكاة مرئية، وبنك ضخم من الأسئلة.
        </p>

        {/* CTAs */}
        <div className="opacity-0-init flex flex-wrap gap-4">
          <a
            href="/join"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-sand-500 hover:bg-sand-400 text-ink-950 font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,137,30,0.3)] hover:-translate-y-0.5"
          >
            <span>انضم للنفير</span>
            <span className="text-xl group-hover:translate-x-1 transition-transform duration-300" style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>
              ←
            </span>
          </a>
          <a
            href="#vision"
            className="inline-flex items-center gap-3 px-8 py-4 border border-ink-700 hover:border-sand-700 text-ink-300 hover:text-sand-400 rounded-xl transition-all duration-300"
          >
            اعرف أكثر
          </a>
        </div>

        {/* Scroll hint */}
        <div className="opacity-0-init absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-ink-600">
          <span className="text-xs tracking-widest uppercase" style={{ writingMode: 'horizontal-tb' }}>scroll</span>
          <div className="w-px h-16 bg-gradient-to-b from-ink-600 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  );
}

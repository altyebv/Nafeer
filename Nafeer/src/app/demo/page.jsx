import DemoApp from '@/components/demo/DemoApp';
import Link from 'next/link';

export const metadata = {
  title: 'جرّب بشير — معاينة تفاعلية',
  description: 'معاينة تفاعلية لتطبيق بشير قبل إطلاقه على متجر Google Play',
};

export default function DemoPage() {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg-primary)' }}
      dir="rtl"
    >
      {/* ── Top bar ── */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3"
        style={{
          background: 'rgba(14,12,9,0.90)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <span className="font-arabic text-sm">العودة</span>
        </Link>

        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: '#27AE60', boxShadow: '0 0 6px #27AE6088' }}
          />
          <span className="font-arabic text-xs" style={{ color: 'var(--text-muted)' }}>
            معاينة تفاعلية
          </span>
        </div>
      </div>

      {/* ── Page heading ── */}
      <div className="text-center pt-8 sm:pt-12 pb-6 sm:pb-8 px-4">
        <span
          className="inline-block font-mono text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--accent)' }}
        >
          جرّب قبل الإطلاق
        </span>
        <h1
          className="font-arabic text-2xl sm:text-3xl md:text-4xl font-bold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          هذا ما سيبدو عليه بشير
        </h1>
        <p
          className="font-arabic text-sm sm:text-base max-w-md mx-auto leading-loose"
          style={{ color: 'var(--text-secondary)' }}
        >
          معاينة حقيقية للتجربة — اتبع الجولة أو تصفّح بنفسك.
        </p>
      </div>

      {/* ── Demo app — centered ── */}
      <div className="flex-1 flex flex-col items-center px-4 pb-12">
        {/* Ambient glow behind phone */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: '500px',
            height: '500px',
            background: 'radial-gradient(ellipse at center, rgba(212,137,30,0.06) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -30%)',
          }}
        />
        <DemoApp />
      </div>

      {/* ── Footer nudge ── */}
      <div
        className="text-center px-4 py-6"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <p className="font-arabic text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
          أعجبك ما رأيت؟
        </p>
        <Link
          href="/prejoin"
          className="inline-block font-arabic text-sm font-medium px-6 py-2.5 rounded-xl transition-all hover:opacity-90"
          style={{ background: 'var(--accent)', color: '#fff', textDecoration: 'none' }}
        >
          سجّل اهتمامك بالتطبيق
        </Link>
      </div>
    </div>
  );
}

import DemoApp from '@/components/demo/DemoApp';
import Link from 'next/link';

export const metadata = {
  title: 'جرّب بشير — معاينة تفاعلية',
  description: 'معاينة تفاعلية لتطبيق بشير قبل إطلاقه على متجر Google Play',
};

// ─────────────────────────────────────────────────────────────────────────────
// DemoPage
//
// Mobile:  true fullscreen — the app occupies 100dvh with no scroll.
//          The top bar is a thin overlay that doesn't push content.
//          Heading and footer are hidden — they'd only create scroll.
//
// Desktop: page layout — top bar, heading, centered phone shell, footer.
//          The shell is 375×680 with rounded corners and a visible glow.
//
// The key constraint: `height: 100dvh; overflow: hidden` on the root div
// kills mobile scroll completely. The flex column fills exactly one screen.
// ─────────────────────────────────────────────────────────────────────────────
export default function DemoPage() {
  return (
    <div
      dir="rtl"
      style={{
        height:          '100dvh',
        overflow:        'hidden',
        display:         'flex',
        flexDirection:   'column',
        background:      'var(--bg-primary)',
        /* prevent rubber-band overscroll on iOS */
        position:        'fixed',
        inset:           0,
      }}
    >

      {/* ── Top bar ──────────────────────────────────────────────────────────
          Always visible. On mobile it's the only chrome — kept minimal.
          On desktop it spans the full width above the content area.
      ── */}
      <div
        style={{
          flexShrink:     0,
          zIndex:         50,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 16px',
          height:         '48px',
          background:     'rgba(14,12,9,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom:   '1px solid var(--border-subtle)',
        }}
      >
        <Link
          href="/"
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '6px',
            color:      'var(--text-muted)',
            textDecoration: 'none',
            opacity: 1,
            transition: 'opacity 0.15s',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="1.8">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <span className="font-arabic" style={{ fontSize: '13px' }}>العودة</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width:     '7px', height: '7px',
            borderRadius: '50%',
            background:  '#27AE60',
            boxShadow:   '0 0 5px #27AE6088',
          }} />
          <span className="font-arabic" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            معاينة تفاعلية
          </span>
        </div>
      </div>

      {/* ── Desktop-only heading ──────────────────────────────────────────────
          Hidden on mobile (< 640 px) via CSS. On desktop it sits between
          the top bar and the phone shell, giving context to the experience.
      ── */}
      <div
        className="hidden sm:block"
        style={{ textAlign: 'center', padding: '28px 16px 20px', flexShrink: 0 }}
      >
        <span
          className="font-mono"
          style={{
            display:        'inline-block',
            fontSize:       '11px',
            letterSpacing:  '0.12em',
            textTransform:  'uppercase',
            color:          'var(--accent)',
            marginBottom:   '10px',
          }}
        >
          جرّب قبل الإطلاق
        </span>
        <h1
          className="font-arabic"
          style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}
        >
          هذا ما سيبدو عليه بشير
        </h1>
        <p
          className="font-arabic"
          style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.7 }}
        >
          معاينة حقيقية للتجربة — اتبع الجولة أو تصفّح بنفسك.
        </p>
      </div>

      {/* ── App area ─────────────────────────────────────────────────────────
          flex-1 so it fills all remaining height after the top bar.
          overflow: hidden prevents any internal scroll from leaking out.

          Mobile:  items-stretch → DemoApp fills full width and height.
          Desktop: items-center  → DemoApp sits as a centered pill.
      ── */}
      <div
        style={{
          flex:           1,
          overflow:       'hidden',
          display:        'flex',
          justifyContent: 'center',
          position:       'relative',
        }}
        /* On mobile: stretch children to fill. On desktop: center them. */
        className="items-stretch sm:items-center sm:pb-4"
      >
        {/* Ambient glow — desktop only, doesn't affect layout */}
        <div
          className="hidden sm:block"
          style={{
            position:     'absolute',
            width:        '480px',
            height:       '480px',
            background:   'radial-gradient(ellipse, rgba(212,137,30,0.07) 0%, transparent 68%)',
            top:          '50%',
            left:         '50%',
            transform:    'translate(-50%, -50%)',
            pointerEvents:'none',
            zIndex:       0,
          }}
        />

        <DemoApp />
      </div>

      {/* ── Desktop-only footer ───────────────────────────────────────────────
          Hidden on mobile. On desktop it anchors the CTA below the shell.
      ── */}
      <div
        className="hidden sm:block"
        style={{
          flexShrink: 0,
          textAlign:  'center',
          padding:    '14px 16px',
          borderTop:  '1px solid var(--border-subtle)',
        }}
      >
        <p className="font-arabic" style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '10px' }}>
          أعجبك ما رأيت؟
        </p>
        <Link
          href="/prejoin"
          className="font-arabic"
          style={{
            display:       'inline-block',
            fontSize:      '13px',
            fontWeight:    600,
            padding:       '9px 22px',
            borderRadius:  '12px',
            background:    'var(--accent)',
            color:         '#fff',
            textDecoration:'none',
            transition:    'opacity 0.15s',
          }}
        >
          سجّل اهتمامك بالتطبيق
        </Link>
      </div>

    </div>
  );
}
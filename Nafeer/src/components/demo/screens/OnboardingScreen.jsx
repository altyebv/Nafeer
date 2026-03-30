'use client';
import { useState, useRef, useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingScreen
// 3-step micro-onboarding: name → path → grade
// Renders inside the phone shell (no external chrome).
// ─────────────────────────────────────────────────────────────────────────────

export default function OnboardingScreen({ onComplete }) {
  const [step,  setStep]  = useState(0);  // 0 | 1 | 2
  const [name,  setName]  = useState('');
  const [path,  setPath]  = useState(null); // 'SCIENCE' | 'LITERARY'
  const [grade, setGrade] = useState(null); // '2' | '3'
  const inputRef = useRef(null);

  // Auto-focus input on step 0
  useEffect(() => {
    if (step === 0 && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [step]);

  function handleNameNext() {
    setStep(1);
  }

  function handlePathSelect(p) {
    setPath(p);
    setTimeout(() => setStep(2), 180);
  }

  function handleGradeSelect(g) {
    setGrade(g);
    setTimeout(() => {
      onComplete({
        name:  name.trim() || 'طالب',
        path:  path,
        grade: g,
      });
    }, 320);
  }

  return (
    <div
      dir="rtl"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 20px 32px',
        background: 'var(--bg-primary)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: '-60px', left: '50%',
        transform: 'translateX(-50%)',
        width: '260px', height: '260px',
        background: 'radial-gradient(ellipse, rgba(212,137,30,0.10) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '32px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === step ? '20px' : '6px',
            height: '6px',
            borderRadius: '3px',
            background: i <= step ? 'var(--accent)' : 'var(--border-mid)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Step content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

        {/* ── Step 0: Name ── */}
        {step === 0 && (
          <StepWrapper>
            <StepEmoji>👋</StepEmoji>
            <StepTitle>أهلاً بك في بشير!</StepTitle>
            <StepSub>خبّرنا باسمك لنجعل التجربة أقرب إليك</StepSub>

            <input
              ref={inputRef}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameNext()}
              placeholder="اكتب اسمك هنا..."
              dir="rtl"
              style={{
                width: '100%',
                background: 'var(--bg-card)',
                border: '1.5px solid var(--border-mid)',
                borderRadius: '14px',
                padding: '14px 16px',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-arabic, inherit)',
                fontSize: '15px',
                outline: 'none',
                marginTop: '28px',
                textAlign: 'right',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(212,137,30,0.6)'; }}
              onBlur={e  => { e.target.style.borderColor = 'var(--border-mid)'; }}
            />

            <PrimaryButton onClick={handleNameNext} style={{ marginTop: '16px' }}>
              متابعة →
            </PrimaryButton>
          </StepWrapper>
        )}

        {/* ── Step 1: Path ── */}
        {step === 1 && (
          <StepWrapper>
            <StepEmoji>📚</StepEmoji>
            <StepTitle>ما مسارك الدراسي؟</StepTitle>
            <StepSub>سنُخصّص المحتوى بناءً على مسارك</StepSub>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '28px' }}>
              <PathCard
                selected={path === 'SCIENCE'}
                icon="⚗️"
                title="المسار العلمي"
                subtitle="فيزياء · كيمياء · أحياء · رياضيات"
                onClick={() => handlePathSelect('SCIENCE')}
              />
              <PathCard
                selected={path === 'LITERARY'}
                icon="🏛️"
                title="المسار الأدبي"
                subtitle="تاريخ · جغرافيا · عربي · اقتصاد"
                onClick={() => handlePathSelect('LITERARY')}
              />
            </div>
          </StepWrapper>
        )}

        {/* ── Step 2: Grade ── */}
        {step === 2 && (
          <StepWrapper>
            <StepEmoji>🎓</StepEmoji>
            <StepTitle>أي صف أنت؟</StepTitle>
            <StepSub>حتى نُظهر لك المحتوى المناسب</StepSub>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '28px' }}>
              <PathCard
                selected={grade === '2'}
                icon="📖"
                title="الثاني ثانوي"
                subtitle="الصف الحادي عشر"
                onClick={() => handleGradeSelect('2')}
              />
              <PathCard
                selected={grade === '3'}
                icon="🏁"
                title="الثالث ثانوي"
                subtitle="الصف الثاني عشر · السنة الأخيرة"
                onClick={() => handleGradeSelect('3')}
              />
            </div>
          </StepWrapper>
        )}
      </div>

      {/* Bsheer branding */}
      <p style={{
        textAlign: 'center',
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        opacity: 0.6,
        marginTop: '8px',
      }}>
        بشير — معاينة تفاعلية
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function StepWrapper({ children }) {
  return (
    <div style={{
      animation: 'onboardFadeIn 0.35s ease both',
    }}>
      <style>{`
        @keyframes onboardFadeIn {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {children}
    </div>
  );
}

function StepEmoji({ children }) {
  return (
    <div style={{ fontSize: '36px', textAlign: 'center', marginBottom: '12px', lineHeight: 1 }}>
      {children}
    </div>
  );
}

function StepTitle({ children }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-arabic, inherit)',
      fontSize: '20px',
      fontWeight: 700,
      color: 'var(--text-primary)',
      textAlign: 'center',
      margin: 0,
    }}>
      {children}
    </h2>
  );
}

function StepSub({ children }) {
  return (
    <p style={{
      fontFamily: 'var(--font-arabic, inherit)',
      fontSize: '13px',
      color: 'var(--text-muted)',
      textAlign: 'center',
      marginTop: '6px',
      lineHeight: 1.6,
    }}>
      {children}
    </p>
  );
}

function PrimaryButton({ onClick, children, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '13px',
        background: 'var(--accent)',
        color: '#fff',
        border: 'none',
        borderRadius: '14px',
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        ...style,
      }}
      onMouseEnter={e => { e.target.style.opacity = '0.88'; }}
      onMouseLeave={e => { e.target.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}

function PathCard({ selected, icon, title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '16px',
        background: selected ? 'rgba(212,137,30,0.10)' : 'var(--bg-card)',
        border: `1.5px solid ${selected ? 'rgba(212,137,30,0.55)' : 'var(--border-subtle)'}`,
        borderRadius: '16px',
        cursor: 'pointer',
        textAlign: 'right',
        transition: 'all 0.18s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: '44px', height: '44px',
        borderRadius: '12px',
        background: selected ? 'rgba(212,137,30,0.18)' : 'var(--bg-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '14px', fontWeight: 700,
          color: selected ? 'var(--accent)' : 'var(--text-primary)',
          margin: 0,
        }}>
          {title}
        </p>
        <p style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '11px',
          color: 'var(--text-muted)',
          margin: '3px 0 0',
        }}>
          {subtitle}
        </p>
      </div>
      {selected && (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--accent)" strokeWidth="2.2" style={{ flexShrink: 0 }}>
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </button>
  );
}
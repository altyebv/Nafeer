'use client';
import { useState, useRef, useEffect } from 'react';

const FONT = 'var(--font-arabic)';

// ─────────────────────────────────────────────────────────────────────────────
// OnboardingScreen — three questions on a notebook page: name, path, grade.
// The name is written on a dotted line, like the label on a cover; the two
// choices are ruled rows. Renders inside the phone shell (no external chrome).
// ─────────────────────────────────────────────────────────────────────────────

const SPINE = 10;

export default function OnboardingScreen({ onComplete }) {
  const [step,  setStep]  = useState(0);  // 0 | 1 | 2
  const [name,  setName]  = useState('');
  const [path,  setPath]  = useState(null); // 'SCIENCE' | 'LITERARY'
  const [grade, setGrade] = useState(null); // '2' | '3'
  const inputRef = useRef(null);

  useEffect(() => {
    if (step === 0 && inputRef.current) {
      const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  function handlePathSelect(p) {
    setPath(p);
    setTimeout(() => setStep(2), 180);
  }

  function handleGradeSelect(g) {
    setGrade(g);
    setTimeout(() => onComplete({ name: name.trim() || 'طالب', path, grade: g }), 320);
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100%', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
        padding: '28px 24px 24px', paddingRight: SPINE + 24, background: 'var(--b-paper)', color: 'var(--b-ink)', boxSizing: 'border-box',
      }}
    >
      {/* the spine of the notebook */}
      <span aria-hidden style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: SPINE, background: 'var(--b-accent)' }} />

      {/* where we are: three marks, not dots */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 32 }} aria-label={`الخطوة ${step + 1} من ٣`}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: i === step ? 28 : 12, height: 4, borderRadius: 4, transition: 'width .25s ease',
            background: i <= step ? 'var(--b-ink)' : 'var(--b-rule-strong)',
          }} />
        ))}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {step === 0 && (
          <Step kicker="أهلاً بيك في بشير" title="اسمك منو؟" sub="نكتبه في كرّاسك، وبه نناديك.">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, borderBottom: '1.5px dotted var(--b-ink3)', paddingBottom: 4, marginTop: 28 }}>
              <label htmlFor="bsh-name" style={{ font: `600 12px/18px ${FONT}`, color: 'var(--b-ink2)', paddingBottom: 4 }}>الاسم</label>
              <input
                id="bsh-name"
                ref={inputRef}
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && setStep(1)}
                placeholder="اكتب اسمك هنا"
                dir="rtl"
                style={{
                  flex: 1, minWidth: 0, background: 'transparent', border: 0, outline: 'none', color: 'var(--b-ink)',
                  font: `800 20px/32px ${FONT}`, textAlign: 'right', padding: 0,
                }}
              />
            </div>
            <button className="b-btn" onClick={() => setStep(1)} style={{ marginTop: 28 }}>كمّل</button>
          </Step>
        )}

        {step === 1 && (
          <Step kicker="السؤال التاني" title="مسارك شنو؟" sub="بنرتّب ليك المواد على حسب مسارك.">
            <div style={{ marginTop: 24, borderTop: '2px solid var(--b-ink)' }}>
              <Row selected={path === 'SCIENCE'} title="المسار العلمي" sub="فيزياء، كيمياء، أحياء، رياضيات" onClick={() => handlePathSelect('SCIENCE')} />
              <Row selected={path === 'LITERARY'} title="المسار الأدبي" sub="تاريخ، جغرافيا، عربي، اقتصاد" onClick={() => handlePathSelect('LITERARY')} />
            </div>
          </Step>
        )}

        {step === 2 && (
          <Step kicker="آخر سؤال" title="في أي صف؟" sub="عشان نوريك الدروس المناسبة.">
            <div style={{ marginTop: 24, borderTop: '2px solid var(--b-ink)' }}>
              <Row selected={grade === '2'} title="الثاني ثانوي" sub="الصف الحادي عشر" onClick={() => handleGradeSelect('2')} />
              <Row selected={grade === '3'} title="الثالث ثانوي" sub="الصف الثاني عشر، سنة الشهادة" onClick={() => handleGradeSelect('3')} />
            </div>
          </Step>
        )}
      </div>

      <p style={{ textAlign: 'center', font: `500 12px/18px ${FONT}`, color: 'var(--b-ink3)', margin: '8px 0 0' }}>
        بشير، معاينة تفاعلية
      </p>
    </div>
  );
}

function Step({ kicker, title, sub, children }) {
  return (
    <div style={{ animation: 'bshStep .3s ease both' }}>
      <div style={{ font: `800 12px/18px ${FONT}`, color: 'var(--b-accent-text)' }}>{kicker}</div>
      <h2 style={{ margin: 0, font: `800 26px/38px ${FONT}` }}>{title}</h2>
      <p style={{ margin: '4px 0 0', font: `500 14px/24px ${FONT}`, color: 'var(--b-ink2)' }}>{sub}</p>
      {children}
    </div>
  );
}

/** A ruled row. The chosen one takes the selected fill and an ink border. */
function Row({ selected, title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, width: '100%', minHeight: 72, padding: '10px 12px', margin: 0, textAlign: 'right',
        cursor: 'pointer', color: 'var(--b-ink)', boxSizing: 'border-box',
        background: selected ? 'var(--b-selected)' : 'transparent',
        border: 0, borderBottom: '1px solid var(--b-rule-strong)',
        outline: selected ? '2px solid var(--b-ink)' : 'none', outlineOffset: -2, borderRadius: selected ? 10 : 0,
      }}
    >
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', font: `800 16px/26px ${FONT}` }}>{title}</span>
        <span style={{ display: 'block', font: `500 12px/18px ${FONT}`, color: 'var(--b-ink2)' }}>{sub}</span>
      </span>
      {selected && (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--b-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
      )}
    </button>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen       from './screens/HomeScreen';
import LessonScreen     from './screens/LessonScreen';
import FeedScreen       from './screens/FeedScreen';
import QuizBankScreen   from './screens/QuizBankScreen';
import ProfileScreen    from './screens/ProfileScreen';
import GuidedTour, { TOUR_STEPS } from './GuidedTour';
import { LESSON_BY_PATH, DEMO_USER } from './demoData';

// ─────────────────────────────────────────────────────────────────────────────
// TABS — 5 screens matching Basheer's bottom nav
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'home',    labelAr: 'الرئيسية', locked: false },
  { id: 'lesson',  labelAr: 'الدروس',   locked: false },
  { id: 'feed',    labelAr: 'اللقطات',  locked: false },
  { id: 'quiz',    labelAr: 'البنك',    locked: true  },
  { id: 'profile', labelAr: 'الملف',    locked: false },
];

// Level thresholds — xpToNext is the cap for level 1; crossing it → level 2
const BASE_LEVEL      = 1;
const BASE_LEVEL_LABEL = 'طالب مبتدئ';
const NEXT_LEVEL_LABEL = 'طالب نشيط';

// ─────────────────────────────────────────────────────────────────────────────
// DemoApp
// ─────────────────────────────────────────────────────────────────────────────
export default function DemoApp() {
  const [phase,       setPhase]       = useState('onboarding');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab,   setActiveTab]   = useState('home');
  const [tourStep,    setTourStep]    = useState(0);
  const [tourActive,  setTourActive]  = useState(true);
  const [lessonFullScreen, setLessonFullScreen] = useState(false);
  const [feedFullScreen,   setFeedFullScreen]   = useState(false);

  // XP & level-up state
  const [bonusXp,      setBonusXp]      = useState(0);
  const [leveledUp,    setLeveledUp]    = useState(false);
  const [xpFlash,      setXpFlash]      = useState(false); // triggers HomeScreen glow
  const prevXpRef = useRef(DEMO_USER.xp);

  // Detect level-up whenever bonusXp changes
  useEffect(() => {
    const currentXp = DEMO_USER.xp + bonusXp;
    const wasBelow  = prevXpRef.current < DEMO_USER.xpToNext;
    const nowAbove  = currentXp >= DEMO_USER.xpToNext;
    if (wasBelow && nowAbove) {
      // Slight delay — let the return-to-home nav animation settle first
      const t = setTimeout(() => setLeveledUp(true), 420);
      return () => clearTimeout(t);
    }
    prevXpRef.current = currentXp;
  }, [bonusXp]);

  // XP flash (non-level-up): signal HomeScreen to pulse the XP card
  function addXp(amount) {
    setBonusXp(prev => prev + amount);
    setXpFlash(true);
    setTimeout(() => setXpFlash(false), 1800);
  }

  // ── Onboarding completion ──
  function handleOnboardingComplete(profile) {
    setUserProfile(profile);
    setPhase('app');
    setActiveTab('home');
    setTourStep(0);
    setTourActive(true);
  }

  // ── Tab navigation ──
  function navigateTo(tabId) {
    setActiveTab(tabId);
    setLessonFullScreen(false);
    setFeedFullScreen(false);
    if (tourActive) {
      const idx = TOUR_STEPS.findIndex(s => s.tab === tabId);
      if (idx !== -1) setTourStep(idx);
    }
  }

  // ── Tour controls ──
  function handleTourNext() {
    const next = tourStep + 1;
    if (next < TOUR_STEPS.length) {
      setTourStep(next);
      setActiveTab(TOUR_STEPS[next].tab);
    }
  }
  function handleTourPrev() {
    const prev = tourStep - 1;
    if (prev >= 0) {
      setTourStep(prev);
      setActiveTab(TOUR_STEPS[prev].tab);
    }
  }
  function handleTourSkip() { setTourActive(false); }

  // ── Focus mode ──
  const currentTourStep = tourActive ? TOUR_STEPS[tourStep] : null;
  const focusMode       = Boolean(currentTourStep?.focusMode);
  const lessonPreviewMode =
    tourActive &&
    currentTourStep?.tab === 'lesson' &&
    !focusMode;

  return (
    <div
      className={[
        'w-full h-full',
        'sm:w-[375px] sm:h-[680px]',
        'rounded-none',
        'sm:rounded-[32px]',
        'sm:border sm:border-white/10',
        'sm:shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_40px_100px_rgba(0,0,0,0.6)]',
      ].join(' ')}
      style={{
        overflow:      'hidden',
        display:       'flex',
        flexDirection: 'column',
        background:    'var(--bg-primary)',
        position:      'relative',
        flexShrink:    0,
        zIndex:        1,
      }}
    >
      {/* ── Fake status bar ── */}
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && <StatusBar />}

      {/* ── App top bar ── */}
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && <AppTopBar activeTab={activeTab} />}

      {/* ── Content area ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>

        {phase === 'onboarding' && (
          <div style={{ position:'absolute', inset:0, overflowY:'auto', scrollbarWidth:'none' }}>
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          </div>
        )}

        {phase === 'app' && (
          <>
            {activeTab === 'home' && (
              <ScrollPane>
                <HomeScreen
                  onNavigate={navigateTo}
                  userProfile={userProfile}
                  bonusXp={bonusXp}
                  xpFlash={xpFlash}
                  leveledUp={leveledUp}
                  currentLevelLabel={leveledUp ? NEXT_LEVEL_LABEL : BASE_LEVEL_LABEL}
                  level={leveledUp ? BASE_LEVEL + 1 : BASE_LEVEL}
                />
              </ScrollPane>
            )}

            {activeTab === 'lesson' && (
              <ScrollPane>
                <LessonScreen
                  userPath={userProfile?.path}
                  previewMode={lessonPreviewMode}
                  onGoHome={() => {
                    addXp(LESSON_BY_PATH[userProfile?.path]?.complete?.xpGained || 45);
                    navigateTo('home');
                  }}
                  setFullScreen={setLessonFullScreen}
                />
              </ScrollPane>
            )}

            {activeTab === 'feed' && (
              <FeedScreen
                userPath={userProfile?.path}
                setFullScreen={setFeedFullScreen}
                onGoHome={() => navigateTo('home')}
                onXpEarned={(xp) => addXp(xp)}
              />
            )}

            {activeTab === 'quiz' && (
              <ScrollPane><QuizBankScreen /></ScrollPane>
            )}

            {activeTab === 'profile' && (
              <ScrollPane><ProfileScreen userProfile={userProfile} /></ScrollPane>
            )}

            {/* ── Guided tour overlay ── */}
            {tourActive && (
              <GuidedTour
                stepIndex={tourStep}
                onNext={handleTourNext}
                onPrev={handleTourPrev}
                onSkip={handleTourSkip}
              />
            )}

            {/* ── Level-Up overlay (inside phone shell) ── */}
            {leveledUp && (
              <LevelUpOverlay
                newLevel={BASE_LEVEL + 1}
                levelLabel={NEXT_LEVEL_LABEL}
                onDismiss={() => setLeveledUp(false)}
              />
            )}
          </>
        )}
      </div>

      {/* ── Bottom tab bar ── */}
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && (
        <BottomBar tabs={TABS} activeTab={activeTab} onTabChange={navigateTo} />
      )}

      {/* ── Restart tour button ── */}
      {phase === 'app' && !tourActive && !leveledUp && (
        <button
          onClick={() => { setTourActive(true); setTourStep(0); setActiveTab('home'); }}
          style={{
            position:   'absolute',
            bottom:     '70px',
            left:       '50%',
            transform:  'translateX(-50%)',
            background: 'rgba(0,0,0,0.55)',
            border:     '1px solid var(--border-subtle)',
            borderRadius:'20px',
            padding:    '5px 14px',
            fontSize:   '11px',
            fontFamily: 'var(--font-arabic, inherit)',
            color:      'var(--text-muted)',
            cursor:     'pointer',
            zIndex:     99,
            backdropFilter: 'blur(4px)',
            whiteSpace: 'nowrap',
          }}
        >
          🔄 إعادة الجولة
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LevelUpOverlay — full-screen celebration inside the phone shell
// ─────────────────────────────────────────────────────────────────────────────
function LevelUpOverlay({ newLevel, levelLabel, onDismiss }) {
  const [show, setShow] = useState(false);
  const [ring, setRing] = useState(false);
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const t1 = setTimeout(() => setShow(true),  50);
    const t2 = setTimeout(() => setRing(true),  350);

    // Generate floating star particles
    const s = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x:  30 + Math.random() * 40,
      y:  20 + Math.random() * 60,
      size: 8 + Math.random() * 10,
      delay: Math.random() * 0.6,
      duration: 1.2 + Math.random() * 0.8,
      rotate: Math.random() * 360,
    }));
    setStars(s);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function toAr(n) {
    return n.toString().replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  const CIRCUMFERENCE = 2 * Math.PI * 52; // r=52

  return (
    <div
      style={{
        position: 'absolute', inset: 0,
        zIndex: 200,
        background: 'rgba(7,5,2,0.92)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: show ? 1 : 0,
        transition: 'opacity 0.35s ease',
        padding: '24px',
      }}
      dir="rtl"
    >
      {/* Floating star particles */}
      {stars.map(s => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top:  `${s.y}%`,
            fontSize: `${s.size}px`,
            opacity: 0,
            animation: `lvlStar ${s.duration}s ${s.delay}s ease-out forwards`,
            pointerEvents: 'none',
          }}
        >
          ✦
        </div>
      ))}

      {/* Glow halo behind ring */}
      <div style={{
        position: 'absolute',
        width: 180, height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,137,30,0.22) 0%, transparent 70%)',
        animation: ring ? 'lvlHaloPulse 2s ease-in-out infinite' : 'none',
      }} />

      {/* SVG ring with level number */}
      <div style={{ position: 'relative', width: 140, height: 140, marginBottom: 28 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
          {/* Track */}
          <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(212,137,30,0.12)" strokeWidth="5" />
          {/* Animated fill */}
          <circle
            cx="70" cy="70" r="52"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={ring ? 0 : CIRCUMFERENCE}
            style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(0.22,1,0.36,1)' }}
          />
          {/* Outer glow ring */}
          <circle
            cx="70" cy="70" r="62"
            fill="none"
            stroke="rgba(212,137,30,0.08)"
            strokeWidth="20"
          />
        </svg>

        {/* Level number in center */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '11px', fontWeight: 600,
            color: 'rgba(212,137,30,0.70)',
            letterSpacing: '0.05em',
            marginBottom: '2px',
          }}>
            المستوى
          </span>
          <span style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '42px', fontWeight: 900, lineHeight: 1,
            color: 'var(--accent)',
            opacity: ring ? 1 : 0,
            transform: ring ? 'scale(1)' : 'scale(0.5)',
            transition: 'opacity 0.4s 0.5s ease, transform 0.4s 0.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}>
            {toAr(newLevel)}
          </span>
        </div>
      </div>

      {/* "ارتقيت مستوى!" */}
      <div style={{
        textAlign: 'center',
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s 0.2s ease, transform 0.5s 0.2s ease',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '26px', fontWeight: 900,
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}>
          ارتقيت مستوى! 🎉
        </h2>

        {/* New level badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 18px',
          borderRadius: '24px',
          background: 'rgba(212,137,30,0.14)',
          border: '1px solid rgba(212,137,30,0.40)',
          marginBottom: '24px',
          opacity: ring ? 1 : 0,
          transform: ring ? 'scale(1)' : 'scale(0.85)',
          transition: 'opacity 0.4s 0.7s ease, transform 0.4s 0.7s ease',
        }}>
          <span style={{ fontSize: '14px' }}>⭐</span>
          <span style={{
            fontFamily: 'var(--font-arabic, inherit)',
            fontSize: '14px', fontWeight: 700,
            color: 'var(--accent)',
          }}>
            {levelLabel}
          </span>
        </div>
      </div>

      {/* Motivational line */}
      <p style={{
        fontFamily: 'var(--font-arabic, inherit)',
        fontSize: '13px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        lineHeight: 1.7,
        maxWidth: '260px',
        marginBottom: '32px',
        opacity: ring ? 1 : 0,
        transition: 'opacity 0.5s 0.9s ease',
      }}>
        استمر هكذا — كل درس يقربك من قمة الترتيب!
      </p>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        style={{
          padding: '14px 40px',
          borderRadius: '22px',
          background: 'var(--accent)',
          border: 'none',
          cursor: 'pointer',
          color: '#fff',
          fontFamily: 'var(--font-arabic, inherit)',
          fontSize: '15px', fontWeight: 700,
          boxShadow: '0 6px 28px rgba(212,137,30,0.40)',
          opacity: ring ? 1 : 0,
          transform: ring ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.4s 1.0s ease, transform 0.4s 1.0s ease, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 36px rgba(212,137,30,0.55)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(212,137,30,0.40)'; }}
      >
        رائع، استمر! 🚀
      </button>

      <style>{`
        @keyframes lvlStar {
          0%   { opacity: 0; transform: scale(0.3) rotate(0deg) translateY(0); }
          30%  { opacity: 0.9; }
          100% { opacity: 0; transform: scale(1.2) rotate(180deg) translateY(-40px); }
        }
        @keyframes lvlHaloPulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%       { transform: scale(1.15); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ScrollPane
// ─────────────────────────────────────────────────────────────────────────────
function ScrollPane({ children }) {
  return (
    <div
      style={{
        position:   'absolute',
        inset:      0,
        overflowY:  'auto',
        overflowX:  'hidden',
        scrollbarWidth: 'none',
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// StatusBar
// ─────────────────────────────────────────────────────────────────────────────
function StatusBar() {
  return (
    <div
      className="flex items-center justify-between px-5 pt-2.5 pb-1 flex-shrink-0"
      style={{ background: 'var(--bg-primary)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
        9:41
      </span>
      <div className="flex items-center gap-1.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--text-muted)">
          <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
        </svg>
        <svg width="16" height="11" viewBox="0 0 24 14" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
          <rect x="1" y="1" width="18" height="12" rx="2"/>
          <path d="M21 5v4"/>
          <rect x="3" y="3" width="11" height="8" rx="1" fill="var(--text-muted)" stroke="none"/>
        </svg>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppTopBar
// ─────────────────────────────────────────────────────────────────────────────
const SCREEN_TITLES = {
  home:    'بشير',
  lesson:  'الدروس',
  feed:    'اللقطات',
  quiz:    'بنك الأسئلة',
  profile: 'ملفي',
};

function AppTopBar({ activeTab }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
      style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-primary)' }}
      dir="rtl"
    >
      <h1 className="font-arabic text-base font-bold" style={{ color: 'var(--text-primary)' }}>
        {SCREEN_TITLES[activeTab] || 'بشير'}
      </h1>
      <button style={{ background: 'none', border: 'none', cursor: 'default' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BottomBar
// ─────────────────────────────────────────────────────────────────────────────
function BottomBar({ tabs, activeTab, onTabChange }) {
  return (
    <div
      className="flex-shrink-0 flex"
      style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-subtle)' }}
    >
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all"
            style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
          >
            <TabIcon id={tab.id} active={active} locked={tab.locked} />
            <span
              className="font-arabic transition-colors"
              style={{
                fontSize: '10px',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                opacity: tab.locked ? 0.5 : 1,
              }}
            >
              {tab.labelAr}
            </span>
            {active && (
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full"
                style={{ background: 'var(--accent)' }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function TabIcon({ id, active, locked }) {
  const color = locked ? 'var(--text-muted)' : active ? 'var(--accent)' : 'var(--text-muted)';
  const op    = locked ? 0.45 : 1;
  const sw    = active ? 2 : 1.6;

  const icons = {
    home: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} opacity={op}>
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    lesson: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} opacity={op}>
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <line x1="7" y1="8"  x2="17" y2="8"/>
        <line x1="7" y1="12" x2="14" y2="12"/>
        <line x1="7" y1="16" x2="11" y2="16"/>
      </svg>
    ),
    feed: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} opacity={op}>
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <line x1="12" y1="3" x2="12" y2="21"/>
        <line x1="3" y1="12" x2="12" y2="12"/>
      </svg>
    ),
    quiz: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} opacity={op}>
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    profile: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} opacity={op}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  };
  return icons[id] || null;
}
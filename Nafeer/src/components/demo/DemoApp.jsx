'use client';
import { useState } from 'react';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen       from './screens/HomeScreen';
import LessonScreen     from './screens/LessonScreen';
import FeedScreen       from './screens/FeedScreen';
import QuizBankScreen   from './screens/QuizBankScreen';
import ProfileScreen    from './screens/ProfileScreen';
import GuidedTour, { TOUR_STEPS } from './GuidedTour';

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

// ─────────────────────────────────────────────────────────────────────────────
// DemoApp
//
// Phases:
//   'onboarding' → user enters name, path, grade
//   'app'        → full app with guided tour overlay
//
// Tour chrome hiding:
//   TOUR_STEPS[n].focusMode = true → hide StatusBar + AppTopBar + BottomBar
//   so the demo shows what "focus mode" really looks like in Basheer.
//
// previewMode:
//   When the tour is on a lesson step AND focusMode is false, we pass
//   previewMode=true to LessonScreen so it skips hook/orientation and
//   shows actual content blocks (what the tour spotlight targets).
// ─────────────────────────────────────────────────────────────────────────────
export default function DemoApp() {
  const [phase,       setPhase]       = useState('onboarding');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab,   setActiveTab]   = useState('home');
  const [tourStep,    setTourStep]    = useState(0);
  const [tourActive,  setTourActive]  = useState(true);
  const [lessonFullScreen, setLessonFullScreen] = useState(false);
  const [feedFullScreen, setFeedFullScreen] = useState(false);

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
      // Prefer to land on the first step for this tab
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
  function handleTourSkip() {
    setTourActive(false);
  }

  // ── Focus mode: hide chrome when the current tour step requests it ──
  const currentTourStep = tourActive ? TOUR_STEPS[tourStep] : null;
  const focusMode       = Boolean(currentTourStep?.focusMode);

  // ── Lesson preview mode: show content blocks when on a lesson tour step that is NOT focus-mode ──
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
      {/* ── Fake status bar — hidden in focus mode ── */}
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && <StatusBar />}

      {/* ── App top bar — hidden in focus mode ── */}
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && <AppTopBar activeTab={activeTab} />}

      {/* ── Content area ── */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>

        {/* ONBOARDING phase */}
        {phase === 'onboarding' && (
          <div style={{ position:'absolute', inset:0, overflowY:'auto', scrollbarWidth:'none' }}>
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          </div>
        )}

        {/* APP phase */}
        {phase === 'app' && (
          <>
            {activeTab === 'home' && (
              <ScrollPane>
                <HomeScreen onNavigate={navigateTo} userProfile={userProfile} />
              </ScrollPane>
            )}

            {activeTab === 'lesson' && (
              <ScrollPane>
                <LessonScreen
                  userPath={userProfile?.path}
                  previewMode={lessonPreviewMode}
                  onGoHome={() => navigateTo('home')}
                  setFullScreen={setLessonFullScreen}
                />
              </ScrollPane>
            )}

            {activeTab === 'feed' && (
              <FeedScreen userPath={userProfile?.path} setFullScreen={setFeedFullScreen} />
            )}

            {activeTab === 'quiz' && (
              <ScrollPane>
                <QuizBankScreen />
              </ScrollPane>
            )}

            {activeTab === 'profile' && (
              <ScrollPane>
                <ProfileScreen userProfile={userProfile} />
              </ScrollPane>
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
          </>
        )}
      </div>

      {/* ── Bottom tab bar — hidden in focus mode ── */}
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && (
        <BottomBar tabs={TABS} activeTab={activeTab} onTabChange={navigateTo} />
      )}

      {/* ── Restart tour button ── */}
      {phase === 'app' && !tourActive && (
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
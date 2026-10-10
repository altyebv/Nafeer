'use client';
import { useState } from 'react';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen, { LevelUpOverlay, getLevel } from './screens/HomeScreen';
import LessonScreen     from './screens/LessonScreen';
import FeedScreen       from './screens/FeedScreen';
import QuizBankScreen   from './screens/QuizBankScreen';
import ProfileScreen    from './screens/ProfileScreen';
import GuidedTour, { TOUR_STEPS } from './GuidedTour';
import { LESSON_BY_PATH, DEMO_USER } from './demoData';
import './demo.css';

const TABS = [
  { id: 'home',    labelAr: 'الرئيسية',    locked: false },
  { id: 'lesson',  labelAr: 'الدروس',      locked: false },
  { id: 'feed',    labelAr: 'مراجعة',      locked: false },
  { id: 'quiz',    labelAr: 'الامتحانات',  locked: false },
  { id: 'profile', labelAr: 'حسابي',       locked: false },
];


function getCurrentLevel(xp) {
  return getLevel(xp).level;
}

export default function DemoApp() {
  const [phase,       setPhase]       = useState('onboarding');
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab,   setActiveTab]   = useState('home');
  const [tourStep,    setTourStep]    = useState(0);
  const [tourActive,  setTourActive]  = useState(true);
  const [lessonFullScreen, setLessonFullScreen] = useState(false);
  const [feedFullScreen,   setFeedFullScreen]   = useState(false);
  const [bonusXp,     setBonusXp]     = useState(0);
  const [justLeveledUp, setJustLeveledUp] = useState(false);

  function handleOnboardingComplete(profile) {
    setUserProfile(profile);
    setPhase('app');
    setActiveTab('home');
    setTourStep(0);
    setTourActive(true);
  }

  // Central XP award — detects level-up, triggers overlay on home
  function awardXp(xpAmount) {
    setBonusXp(prev => {
      const oldXp  = DEMO_USER.xp + prev;
      const newXp  = DEMO_USER.xp + prev + xpAmount;
      const oldLvl = getCurrentLevel(oldXp);
      const newLvl = getCurrentLevel(newXp);
      if (newLvl > oldLvl) setJustLeveledUp(true);
      return prev + xpAmount;
    });
  }

  function navigateTo(tabId) {
    setActiveTab(tabId);
    setLessonFullScreen(false);
    setFeedFullScreen(false);
    if (tourActive) {
      const idx = TOUR_STEPS.findIndex(s => s.tab === tabId);
      if (idx !== -1) setTourStep(idx);
    }
  }

  // Return to home with XP from lesson
  function handleLessonGoHome() {
    const xpGained = LESSON_BY_PATH[userProfile?.path]?.complete?.xpGained || 45;
    awardXp(xpGained);
    navigateTo('home');
  }

  // Return to home with XP from feed
  function handleFeedGoHome() {
    navigateTo('home');
  }

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

  const currentTourStep   = tourActive ? TOUR_STEPS[tourStep] : null;
  const focusMode         = Boolean(currentTourStep?.focusMode);
  const lessonPreviewMode = tourActive && currentTourStep?.tab === 'lesson' && !focusMode;

  return (
    <div
      className={[
        'bsh w-full h-full',
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
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && activeTab !== 'home' && activeTab !== 'lesson' && activeTab !== 'quiz' && <StatusBar />}
      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && activeTab !== 'home' && activeTab !== 'lesson' && activeTab !== 'quiz' && <AppTopBar activeTab={activeTab} />}

      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        {phase === 'onboarding' && (
          <div style={{ position:'absolute', inset:0, overflowY:'auto', scrollbarWidth:'none' }}>
            <OnboardingScreen onComplete={handleOnboardingComplete} />
          </div>
        )}

        {phase === 'app' && (
          <>
            {activeTab === 'home' && (
              <HomeScreen
                  onNavigate={navigateTo}
                  userProfile={userProfile}
                  bonusXp={bonusXp}
                  justLeveledUp={justLeveledUp}
                  onLevelUpSeen={() => setJustLeveledUp(false)}
                />
            )}

            {activeTab === 'lesson' && (
              <LessonScreen
                  userPath={userProfile?.path}
                  previewMode={lessonPreviewMode}
                  onGoHome={handleLessonGoHome}
                  setFullScreen={setLessonFullScreen}
                />
            )}

            {activeTab === 'feed' && (
              <FeedScreen
                userPath={userProfile?.path}
                setFullScreen={setFeedFullScreen}
                onGoHome={handleFeedGoHome}
                onXpEarned={(xp) => awardXp(xp)}
              />
            )}
            {activeTab === 'quiz' && (
              <QuizBankScreen onXpEarned={(xp) => awardXp(xp)} onNavigate={navigateTo} setFullScreen={setLessonFullScreen} />
            )}
            {activeTab === 'profile' && (
              <ScrollPane><ProfileScreen userProfile={userProfile} /></ScrollPane>
            )}

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

      {phase === 'app' && !focusMode && !lessonFullScreen && !feedFullScreen && (
        <BottomBar tabs={TABS} activeTab={activeTab} onTabChange={navigateTo} />
      )}

      {/* ── Level-Up Overlay — rendered here to escape ScrollPane clipping ── */}
      {phase === 'app' && justLeveledUp && (
        <LevelUpOverlay
          levelInfo={getLevel(DEMO_USER.xp + bonusXp)}
          onDone={() => setJustLeveledUp(false)}
        />
      )}

      {phase === 'app' && !tourActive && !lessonFullScreen && !feedFullScreen && (
        <button
          onClick={() => { setTourActive(true); setTourStep(0); setActiveTab('home'); }}
          style={{
            position:'absolute', top:'6px', left:'8px',
            background:'var(--b-surface)', border:'1px solid var(--b-rule-strong)',
            borderRadius:'10px', padding:'2px 10px', fontSize:'11px', opacity:0.85,
            fontFamily:'var(--font-arabic, inherit)', color:'var(--b-ink2)',
            cursor:'pointer', zIndex:99, whiteSpace:'nowrap',
          }}
        >
          إعادة الجولة
        </button>
      )}
    </div>
  );
}

function ScrollPane({ children }) {
  return (
    <div style={{ position:'absolute', inset:0, overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none' }}>
      {children}
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex items-center justify-between px-5 pt-2.5 pb-1 flex-shrink-0"
      style={{ background: 'var(--bg-primary)' }}>
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

const SCREEN_TITLES = {
  home:'بشير', lesson:'الدروس', feed:'مراجعة', quiz:'الامتحانات', profile:'حسابي',
};

function AppTopBar({ activeTab }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
      style={{ borderBottom:'1px solid var(--border-subtle)', background:'var(--bg-primary)' }}
      dir="rtl">
      <h1 className="font-arabic text-base font-bold" style={{ color:'var(--text-primary)' }}>
        {SCREEN_TITLES[activeTab] || 'بشير'}
      </h1>
      <button style={{ background:'none', border:'none', cursor:'default' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.8">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      </button>
    </div>
  );
}

function BottomBar({ tabs, activeTab, onTabChange }) {
  // Hairline, not a shadow. The current tab is marked by an amber rule on its
  // top edge, the filled icon and a bold label, so it never rests on colour alone.
  return (
    <div className="flex-shrink-0 flex" role="tablist"
      style={{ background:'var(--b-surface)', borderTop:'1px solid var(--b-rule)', height:64 }}>
      {tabs.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button key={tab.id} role="tab" aria-selected={active} onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5"
            style={{ background:'none', border:'none', cursor:'pointer', position:'relative' }}>
            {active && <span style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'var(--b-accent)' }} />}
            <TabIcon id={tab.id} active={active} />
            <span style={{
              fontFamily:'var(--font-arabic)', fontSize:11,
              fontWeight: active ? 800 : 500,
              color: active ? 'var(--b-ink)' : 'var(--b-ink2)',
            }}>
              {tab.labelAr}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TabIcon({ id, active }) {
  const color = active ? 'var(--b-ink)' : 'var(--b-ink2)';
  const f = active ? color : 'none';
  const cut = active ? 'var(--b-surface)' : color;
  const p = { width:22, height:22, viewBox:'0 0 24 24', fill:'none', stroke:color, strokeWidth:1.8, strokeLinejoin:'round', strokeLinecap:'round' };
  const icons = {
    home:    <svg {...p}><path fill={f} d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>,
    lesson:  <svg {...p}><path fill={f} d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13C17 4 14 4.5 12 6z"/><path stroke={cut} d="M12 6v13"/></svg>,
    feed:    <svg {...p}><rect fill={f} x="4" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a1 1 0 0 1 1 1v11"/></svg>,
    quiz:    <svg {...p}><rect fill={f} x="4" y="3" width="16" height="18" rx="2"/><path stroke={cut} d="M8 9h8M8 13h8M8 17h4"/></svg>,
    profile: <svg {...p}><circle fill={f} cx="12" cy="8" r="4"/><path fill={f} d="M4 21c0-4 3.5-6 8-6s8 2 8 6z"/></svg>,
  };
  return icons[id] || null;
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { gsap } from '@/lib/gsap';

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

const navLinks = [
  { href: '#problem',  label: 'المشكلة', step: '٠١' },
  { href: '#features', label: 'التطبيق', step: '٠٢' },
  { href: '#progress', label: 'المواد',  step: '٠٣' },
  { href: '#nafeer',   label: 'ساهم',    step: '٠٤' },
];

export default function Navbar() {
  const [scrolled, setScrolled]    = useState(false);
  const [theme, setTheme]          = useState('dark');
  const [menuOpen, setMenuOpen]    = useState(false);
  const [activeSection, setActive] = useState('');

  // ── Entrance animation ──────────────────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo('nav',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.05 }
    );
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('nafeer-theme') || 'dark';
    setTheme(saved);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sectionIds = navLinks.map(l => l.href.slice(1));
    const observers  = [];
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(id); },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nafeer-theme', next);
  }, [theme]);

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled ? 'py-2.5 border-b' : 'bg-transparent py-5 md:py-6'
        }`}
        style={{
          opacity: 0, // pre-hidden — GSAP entrance handles reveal
          ...(scrolled ? {
            background:     'var(--navbar-bg)',
            backdropFilter: 'blur(20px)',
            borderColor:    'var(--navbar-border)',
          } : {}),
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">

          {/* Logo */}
          <a href="#" className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl font-arabic font-bold" style={{ color: 'var(--accent)' }}>نفير</span>
            <div className="hidden sm:block w-px h-4" style={{ background: 'var(--border-mid)' }} />
            <span className="hidden sm:block text-xs font-mono tracking-wider" style={{ color: 'var(--text-muted)' }}>بوابة المساهمين</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(l => {
              const isActive = activeSection === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className="relative px-3.5 py-2 rounded-lg text-sm font-arabic transition-all duration-200"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--accent-dim)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: 'var(--accent)' }} />
                  )}
                  {l.label}
                </a>
              );
            })}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              aria-label="تبديل المظهر"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            <a
              href="/signin"
              className="hidden sm:block text-sm px-3 py-1.5 rounded-lg transition-all duration-200"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-card)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
            >
              دخول
            </a>

            <a
              href="/prejoin"
              className="text-sm px-3.5 sm:px-5 py-2 font-bold rounded-lg transition-all duration-200"
              style={{ background: 'var(--accent)', color: '#0e0c09' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-hover)'; e.currentTarget.style.boxShadow = '0 0 24px var(--glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              انضم
            </a>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)', background: menuOpen ? 'var(--bg-card)' : 'transparent' }}
              aria-label="القائمة"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className="fixed inset-x-0 top-0 z-40 pt-16 pb-5 px-4 md:hidden mobile-menu-open"
          style={{ background: 'var(--navbar-bg)', backdropFilter: 'blur(24px)', borderBottom: '1px solid var(--navbar-border)' }}
        >
          <p className="text-xs font-mono tracking-widest uppercase mb-3 px-2" style={{ color: 'var(--text-muted)' }}>اقرأ القصة ↓</p>
          <div className="flex flex-col gap-0.5 mb-4">
            {navLinks.map(l => {
              const isActive = activeSection === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center justify-between py-3 px-3 rounded-xl transition-all duration-200"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-secondary)', background: isActive ? 'var(--accent-dim)' : 'transparent' }}
                >
                  <span className="text-base font-arabic">{l.label}</span>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{l.step}</span>
                </a>
              );
            })}
          </div>
          <div className="flex items-center gap-2.5" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            <a href="/signin" onClick={() => setMenuOpen(false)} className="flex-1 py-2.5 text-center text-sm rounded-xl transition-colors" style={{ color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>تسجيل الدخول</a>
            <a href="/prejoin" onClick={() => setMenuOpen(false)} className="flex-1 py-2.5 text-center text-sm font-bold rounded-xl" style={{ background: 'var(--accent)', color: '#0e0c09' }}>انضم للنفير</a>
          </div>
        </div>
      )}
    </>
  );
}
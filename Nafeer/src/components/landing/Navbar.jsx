'use client';
import { useState, useEffect, useCallback } from 'react';

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('nafeer-theme') || 'dark';
    setTheme(saved);

    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('nafeer-theme', next);
  }, [theme]);

  const navLinks = [
    { href: '#vision', label: 'الرؤية' },
    { href: '#progress', label: 'المواد' },
    { href: '#nafeer', label: 'كيف تساهم' },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'py-3 border-b'
            : 'bg-transparent py-5 md:py-6'
        }`}
        style={scrolled ? {
          background: 'var(--navbar-bg)',
          backdropFilter: 'blur(16px)',
          borderColor: 'var(--navbar-border)',
        } : {}}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl font-arabic font-bold" style={{ color: 'var(--accent)' }}>نفير</span>
            <div className="hidden sm:block w-px h-5" style={{ background: 'var(--border-mid)' }} />
            <span className="hidden sm:block text-sm" style={{ color: 'var(--text-muted)' }}>بوابة المساهمين</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {navLinks.map(l => (
              <a
                key={l.href}
                href={l.href}
                className="link-underline transition-colors duration-200"
                style={{ '--hover-color': 'var(--accent)' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
              aria-label="تبديل المظهر"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Auth — desktop */}
            <a
              href="/signin"
              className="hidden sm:block text-sm px-3 py-2 transition-colors duration-200"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.target.style.color = 'var(--accent)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              تسجيل الدخول
            </a>
            <a
              href="/join"
              className="text-sm px-3 sm:px-4 py-2 font-bold rounded-lg transition-all duration-200"
              style={{
                background: 'var(--accent)',
                color: '#0e0c09',
              }}
              onMouseEnter={e => {
                e.target.style.background = 'var(--accent-hover)';
                e.target.style.boxShadow = '0 0 20px var(--glow)';
              }}
              onMouseLeave={e => {
                e.target.style.background = 'var(--accent)';
                e.target.style.boxShadow = 'none';
              }}
            >
              انضم
            </a>

            {/* Hamburger — mobile */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              aria-label="القائمة"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="fixed top-0 inset-x-0 z-40 pt-20 pb-6 px-4 md:hidden mobile-menu-open"
          style={{
            background: 'var(--navbar-bg)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--navbar-border)',
          }}
        >
          <div className="flex flex-col gap-1">
            {navLinks.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 rounded-xl text-lg font-arabic transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                onMouseLeave={e => e.target.style.color = 'var(--text-secondary)'}
              >
                {l.label}
              </a>
            ))}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <a
                href="/signin"
                className="block py-3 px-4 rounded-xl text-center transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                تسجيل الدخول
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

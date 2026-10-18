'use client';
import { useState, useEffect, useRef } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useThemeStore } from '@/store/themeStore';
import { gsap, useMotion } from '@/lib/gsap';
import { Button, IconButton, cx } from '@/components/ui';

const navLinks = [
  { href: '#problem',  label: 'المشكلة', step: '01' },
  { href: '#features', label: 'التطبيق', step: '02' },
  { href: '#progress', label: 'المواد',  step: '03' },
  { href: '#nafeer',   label: 'ساهم',    step: '04' },
];

export default function Navbar() {
  const navRef = useRef(null);
  const [scrolled, setScrolled]    = useState(false);
  const theme       = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const [menuOpen, setMenuOpen]    = useState(false);
  const [activeSection, setActive] = useState('');

  // Entrance: animates FROM hidden, so the bar is there without JS.
  useMotion(navRef, (nav) => {
    gsap.from(nav, { y: -20, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.05 });
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const observers = [];
    navLinks.forEach(({ href }) => {
      const el = document.getElementById(href.slice(1));
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(href.slice(1)); },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Escape closes the phone menu.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:right-3 focus:z-toast focus:px-4 focus:py-2 focus:rounded-control focus:bg-accent focus:text-fg-on-accent t-ui">
        تخطَّ إلى المحتوى
      </a>

      <nav
        ref={navRef}
        aria-label="الرئيسية"
        className={cx('fixed top-0 inset-x-0 z-nav transition-[padding,background-color,border-color] duration-500',
          scrolled ? 'py-2.5 border-b border-line l-navbar' : 'bg-transparent py-5 md:py-6 border-b border-transparent')}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          <a href="#" className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl font-arabic font-bold text-fg-accent">نفير</span>
            <span aria-hidden="true" className="hidden sm:block w-px h-4 bg-line-strong" />
            <span className="hidden sm:block t-caption text-fg-muted">بوابة المساهمين</span>
          </a>

          <ul className="hidden md:flex items-center gap-0.5">
            {navLinks.map((l) => {
              const isActive = activeSection === l.href.slice(1);
              return (
                <li key={l.href}>
                  <a href={l.href} aria-current={isActive ? 'location' : undefined}
                    className={cx('relative block px-3.5 py-2 rounded-control t-ui font-normal transition-colors duration-200 hover:bg-accent-wash',
                      isActive ? 'text-fg-accent' : 'text-fg-muted hover:text-fg-strong')}>
                    {isActive && <span aria-hidden="true" className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
                    {l.label}
                  </a>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <IconButton icon={theme === 'dark' ? Sun : Moon} label="تبديل المظهر" onClick={toggleTheme} />
            <Button as="a" href="/signin" variant="ghost" size="sm" className="hidden sm:inline-flex">دخول</Button>
            <Button as="a" href="/join" variant="primary" size="sm">انضم</Button>
            <IconButton icon={menuOpen ? X : Menu} label="القائمة" className="md:hidden"
              aria-expanded={menuOpen} aria-controls="landing-menu" onClick={() => setMenuOpen(!menuOpen)} />
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div id="landing-menu" className="fixed inset-x-0 top-0 z-sticky pt-16 pb-5 px-4 md:hidden mobile-menu-open l-navbar border-b border-line">
          <p className="t-caption mb-3 px-2 text-fg-muted">اقرأ القصة ↓</p>
          <ul className="flex flex-col gap-0.5 mb-4">
            {navLinks.map((l) => {
              const isActive = activeSection === l.href.slice(1);
              return (
                <li key={l.href}>
                  <a href={l.href} onClick={() => setMenuOpen(false)} aria-current={isActive ? 'location' : undefined}
                    className={cx('flex items-center justify-between py-3 px-3 rounded-card transition-colors duration-200',
                      isActive ? 'text-fg-accent bg-accent-wash' : 'text-fg-muted hover:bg-hover')}>
                    <span className="t-body">{l.label}</span>
                    <span aria-hidden="true" className="t-caption t-num text-fg-subtle">{l.step}</span>
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center gap-2.5 border-t border-line pt-4">
            <Button as="a" href="/signin" variant="secondary" block onClick={() => setMenuOpen(false)}>تسجيل الدخول</Button>
            <Button as="a" href="/join" variant="primary" block onClick={() => setMenuOpen(false)}>انضم للنفير</Button>
          </div>
        </div>
      )}
    </>
  );
}

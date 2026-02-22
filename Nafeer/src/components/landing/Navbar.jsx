'use client';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500
        ${scrolled
          ? 'bg-ink-950/90 backdrop-blur-lg border-b border-ink-800/60 py-3'
          : 'bg-transparent py-6'
        }`}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-arabic font-bold text-sand-400">نفير</span>
          <div className="w-px h-5 bg-ink-700" />
          <span className="text-sm text-ink-500">بوابة المساهمين</span>
        </div>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8 text-sm text-ink-400">
          <a href="#vision" className="link-underline hover:text-sand-400 transition-colors">الرؤية</a>
          <a href="#progress" className="link-underline hover:text-sand-400 transition-colors">المواد</a>
          <a href="#nafeer" className="link-underline hover:text-sand-400 transition-colors">كيف تساهم</a>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <a
            href="/signin"
            className="text-sm text-ink-400 hover:text-sand-400 transition-colors px-3 py-2"
          >
            تسجيل الدخول
          </a>
          <a
            href="/join"
            className="text-sm px-4 py-2 bg-sand-500 hover:bg-sand-400 text-ink-950 font-bold rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(212,137,30,0.3)]"
          >
            انضم
          </a>
        </div>
      </div>
    </nav>
  );
}

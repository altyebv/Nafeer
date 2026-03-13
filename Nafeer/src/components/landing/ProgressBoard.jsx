'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SUBJECTS_CATALOG, TRACK_CONFIG, getTotalLessons } from '@/shared/curriculum';

gsap.registerPlugin(ScrollTrigger);

const colorMap = {
  sand:    { bar: '#d4891e', text: '#e4a83a', badge: { bg: 'rgba(212,137,30,0.15)',  border: 'rgba(212,137,30,0.3)',  color: '#e4a83a' } },
  blue:    { bar: '#3b82f6', text: '#60a5fa', badge: { bg: 'rgba(59,130,246,0.15)',  border: 'rgba(59,130,246,0.3)',  color: '#60a5fa' } },
  purple:  { bar: '#a855f7', text: '#c084fc', badge: { bg: 'rgba(168,85,247,0.15)',  border: 'rgba(168,85,247,0.3)',  color: '#c084fc' } },
  green:   { bar: '#22c55e', text: '#4ade80', badge: { bg: 'rgba(34,197,94,0.15)',   border: 'rgba(34,197,94,0.3)',   color: '#4ade80' } },
  orange:  { bar: '#f97316', text: '#fb923c', badge: { bg: 'rgba(249,115,22,0.15)',  border: 'rgba(249,115,22,0.3)',  color: '#fb923c' } },
  teal:    { bar: '#14b8a6', text: '#2dd4bf', badge: { bg: 'rgba(20,184,166,0.15)',  border: 'rgba(20,184,166,0.3)',  color: '#2dd4bf' } },
  ember:   { bar: '#ea6c0a', text: '#fb923c', badge: { bg: 'rgba(234,108,10,0.15)',  border: 'rgba(234,108,10,0.3)',  color: '#fb923c' } },
  yellow:  { bar: '#eab308', text: '#facc15', badge: { bg: 'rgba(234,179,8,0.15)',   border: 'rgba(234,179,8,0.3)',   color: '#facc15' } },
  cyan:    { bar: '#06b6d4', text: '#22d3ee', badge: { bg: 'rgba(6,182,212,0.15)',   border: 'rgba(6,182,212,0.3)',   color: '#22d3ee' } },
  emerald: { bar: '#10b981', text: '#34d399', badge: { bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  color: '#34d399' } },
  indigo:  { bar: '#6366f1', text: '#818cf8', badge: { bg: 'rgba(99,102,241,0.15)',  border: 'rgba(99,102,241,0.3)',  color: '#818cf8' } },
  amber:   { bar: '#f59e0b', text: '#fbbf24', badge: { bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  color: '#fbbf24' } },
  slate:   { bar: '#64748b', text: '#94a3b8', badge: { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', color: '#94a3b8' } },
};

export default function ProgressBoard() {
  const sectionRef = useRef(null);
  const [liveData, setLiveData] = useState({});

  // ── Fetch live progress from Atlas ────────────────────────────────────────
  useEffect(() => {
    fetch('/api/coverage')
      .then(r => r.json())
      .then(json => {
        if (!json.ok) return;
        const map = {};
        (json.data || []).forEach(s => {
          map[s.subjectId] = {
            approvedLessons: s.approvedLessons,
            totalLessons:    s.totalLessons,
          };
        });
        setLiveData(map);
      })
      .catch(() => {}); // fail silently
  }, []);

  const subjects = SUBJECTS_CATALOG.map(s => {
    const live          = liveData[s.id];
    const targetLessons = getTotalLessons(s.id);
    const approved      = live?.approvedLessons || 0;
    const progress      = targetLessons > 0 ? Math.round((approved / targetLessons) * 100) : 0;
    return { ...s, progress, totalLessons: targetLessons, contributor: null };
  });

  const totalSubjects     = subjects.length;
  const mappedSubjects    = subjects.filter(s => s.progress > 0).length;
  const totalContributors = subjects.filter(s => s.contributor).length;

  // ── Scroll animations ─────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.progress-header',
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: '.progress-header', start: 'top 90%', once: true },
        }
      );
      gsap.fromTo('.progress-stat',
        { opacity: 0, y: 20, scale: 0.9 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.1, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '.progress-stats', start: 'top 90%', once: true },
        }
      );
      gsap.fromTo('.subject-card',
        { opacity: 0, y: 24, scale: 0.95 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.045, ease: 'power3.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 px-4 sm:px-6 relative">
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-24 opacity-40" />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="progress-header mb-12 sm:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
          <div>
            <span
              className="inline-block text-xs sm:text-sm tracking-widest uppercase mb-4 font-mono"
              style={{ color: 'var(--accent)' }}
            >
              حالة المشروع — مباشر
            </span>
            <h2
              className="text-3xl sm:text-4xl font-arabic font-bold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >خريطة المواد</h2>
            <p
              className="max-w-md leading-loose text-sm sm:text-base"
              style={{ color: 'var(--text-secondary)' }}
            >
              كل مادة تحتاج مساهماً متخصصاً. هذه خريطة ما اكتمل وما ينتظرك.
            </p>
          </div>

          {/* Stats */}
          <div className="progress-stats flex gap-5 sm:gap-8">
            {[
              { value: totalSubjects,     label: 'مادة' },
              { value: mappedSubjects,    label: 'مكتملة' },
              { value: totalContributors, label: 'مساهم' },
            ].map((stat, i) => (
              <div key={i} className="progress-stat text-center">
                <div
                  className="text-3xl sm:text-4xl font-bold stat-number"
                  style={{ color: 'var(--accent)' }}
                >{stat.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Track groups */}
        {[
          { trackKey: 'COMMON',   label: 'المواد المشتركة', desc: 'يأخذها جميع الطلاب' },
          { trackKey: 'SCIENCE',  label: 'المسار العلمي',   desc: 'مسار + تخصص (اختر واحداً من الثلاثة)' },
          { trackKey: 'LITERARY', label: 'المسار الأدبي',   desc: 'مسار + تخصص (اختر واحداً من الاثنين)' },
        ].map(({ trackKey, label, desc }) => {
          const trackSubjects = subjects.filter(s => s.track === trackKey);
          const required      = trackSubjects.filter(s => !s.isMajor);
          const majors        = trackSubjects.filter(s => s.isMajor);
          return (
            <div key={trackKey} className="mb-10 sm:mb-14">
              <div className="flex items-baseline gap-2 sm:gap-3 mb-4 sm:mb-5 flex-wrap">
                <h3
                  className="text-base sm:text-lg font-bold"
                  style={{ color: TRACK_CONFIG[trackKey].color }}
                >{label}</h3>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
                {required.map(s => <SubjectCard key={s.id} subject={s} />)}
              </div>
              {majors.length > 0 && (
                <div className="pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <p
                    className="text-xs font-mono mb-3"
                    style={{ color: 'var(--text-muted)' }}
                  >— تخصص، اختر واحداً</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {majors.map(s => <SubjectCard key={s.id} subject={s} isMajor />)}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom CTA */}
        <div className="mt-8 sm:mt-10 text-center">
          <p className="mb-5 sm:mb-6 text-sm sm:text-base" style={{ color: 'var(--text-secondary)' }}>
            كل المواد مفتوحة للمساهمة — لديك خلفية في أي مادة؟
          </p>
          <a
            href="/join"
            className="inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 font-bold rounded-xl transition-all duration-300 text-sm sm:text-base"
            style={{ background: 'var(--accent)', color: '#0e0c09' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.boxShadow = '0 0 40px var(--glow)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            طلب انضمام للنفير
          </a>
        </div>
      </div>
    </section>
  );
}

function SubjectCard({ subject, isMajor = false }) {
  const c           = colorMap[subject.color] ?? colorMap.sand;
  const isAvailable = !subject.contributor;
  const trackCfg    = TRACK_CONFIG[subject.track];

  return (
    <div
      className="subject-card relative p-3 sm:p-5 rounded-xl overflow-hidden transition-all duration-300"
      style={{
        background:    'var(--bg-card)',
        backdropFilter:'blur(12px)',
        border:        `1px solid ${isAvailable ? 'var(--border-subtle)' : c.badge.border + '80'}`,
        borderStyle:   isMajor ? 'dashed' : 'solid',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform   = 'translateY(-3px)';
        e.currentTarget.style.borderColor = c.bar + '60';
        e.currentTarget.style.boxShadow   = '0 8px 30px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.borderColor = isAvailable ? 'var(--border-subtle)' : c.badge.border + '80';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-3 flex-wrap">
          <span
            className="inline-block text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-mono"
            style={{ background: c.badge.bg, border: `1px solid ${c.badge.border}`, color: c.badge.color }}
          >
            {trackCfg.label}
          </span>
          {isMajor && (
            <span
              className="inline-block text-xs px-1.5 py-0.5 rounded-full font-mono"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}
            >
              تخصص
            </span>
          )}
        </div>

        <h3
          className="text-sm sm:text-base font-bold mb-0.5 sm:mb-1"
          style={{ color: 'var(--text-primary)' }}
        >{subject.nameAr}</h3>

        <p className="text-xs mb-3 sm:mb-4" style={{ color: 'var(--text-muted)' }}>
          {subject.units.length} وحدات · {subject.totalLessons} درس
        </p>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full mb-2 sm:mb-3" style={{ background: 'var(--border-mid)' }}>
          <div
            className="h-1 rounded-full"
            style={{
              width: `${subject.progress}%`,
              background: c.bar,
              transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-mono" style={{ color: c.text }}>{subject.progress}%</span>
          {isAvailable ? (
            <a
              href="/join"
              className="text-xs px-2 py-0.5 rounded-full font-mono transition-all duration-200"
              style={{
                color: 'var(--accent)',
                background: 'var(--accent-dim)',
                border: '1px solid rgba(212,137,30,0.2)',
              }}
              onClick={e => e.stopPropagation()}
            >
              + انضم
            </a>
          ) : (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{subject.contributor}</span>
          )}
        </div>
      </div>
    </div>
  );
}
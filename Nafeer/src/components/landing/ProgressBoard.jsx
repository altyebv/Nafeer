'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SUBJECTS_CATALOG, TRACK_CONFIG, getTotalLessons } from '@/shared/curriculum';

gsap.registerPlugin(ScrollTrigger);

const colorMap = {
  sand:    { bar: '#d4891e', text: '#e4a83a' },
  blue:    { bar: '#3b82f6', text: '#60a5fa' },
  purple:  { bar: '#a855f7', text: '#c084fc' },
  green:   { bar: '#22c55e', text: '#4ade80' },
  orange:  { bar: '#f97316', text: '#fb923c' },
  teal:    { bar: '#14b8a6', text: '#2dd4bf' },
  ember:   { bar: '#ea6c0a', text: '#fb923c' },
  yellow:  { bar: '#eab308', text: '#facc15' },
  cyan:    { bar: '#06b6d4', text: '#22d3ee' },
  emerald: { bar: '#10b981', text: '#34d399' },
  indigo:  { bar: '#6366f1', text: '#818cf8' },
  amber:   { bar: '#f59e0b', text: '#fbbf24' },
  slate:   { bar: '#64748b', text: '#94a3b8' },
};

const TRACKS = [
  { key: 'COMMON',   label: 'المواد المشتركة', desc: 'لجميع الطلاب' },
  { key: 'SCIENCE',  label: 'المسار العلمي',   desc: 'علمي' },
  { key: 'LITERARY', label: 'المسار الأدبي',   desc: 'أدبي' },
];

export default function ProgressBoard() {
  const sectionRef = useRef(null);
  const [liveData, setLiveData] = useState({});

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
      .catch(() => {});
  }, []);

  const subjects = SUBJECTS_CATALOG.map(s => {
    const live          = liveData[s.id];
    const targetLessons = getTotalLessons(s.id);
    const approved      = live?.approvedLessons || 0;
    const progress      = targetLessons > 0 ? Math.round((approved / targetLessons) * 100) : 0;
    return { ...s, progress, totalLessons: targetLessons };
  });

  const totalSubjects  = subjects.length;
  const mappedSubjects = subjects.filter(s => s.progress > 0).length;
  const openSeats      = subjects.filter(s => s.progress === 0).length;

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.progress-header',
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.progress-header', start: 'top 90%', once: true },
        }
      );
      gsap.fromTo('.progress-stat',
        { opacity: 0, y: 16, scale: 0.92 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.4)',
          scrollTrigger: { trigger: '.progress-stats', start: 'top 92%', once: true },
        }
      );
      gsap.fromTo('.subject-row',
        { opacity: 0, x: 12 },
        {
          opacity: 1, x: 0, duration: 0.35, stagger: 0.03, ease: 'power2.out',
          scrollTrigger: { trigger: sectionRef.current, start: 'top 82%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 sm:py-28 px-4 sm:px-6 relative">
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-20 opacity-40" />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="progress-header mb-10 sm:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <span
              className="inline-block text-xs sm:text-sm tracking-widest uppercase mb-4 font-mono"
              style={{ color: 'var(--accent)' }}
            >
              مباشر — يتحدث عن نفسه
            </span>
            <h2
              className="text-3xl sm:text-4xl font-arabic font-bold mb-3"
              style={{ color: 'var(--text-primary)' }}
            >
              هذا ما بُني حتى الآن
            </h2>
            <p
              className="max-w-md leading-loose text-sm sm:text-base font-arabic"
              style={{ color: 'var(--text-secondary)' }}
            >
              كل شريط تقدم بناه إنسان حقيقي.{' '}
              <span style={{ color: 'var(--accent)' }}>الأشرطة الفارغة مقاعد شاغرة.</span>
            </p>
          </div>

          {/* Stats */}
          <div className="progress-stats flex gap-6 sm:gap-10 shrink-0">
            {[
              { value: totalSubjects,  label: 'مادة'      },
              { value: mappedSubjects, label: 'بُدئت'     },
              { value: openSeats,      label: 'مقعد شاغر' },
            ].map((stat, i) => (
              <div key={i} className="progress-stat text-center">
                <div
                  className="text-3xl sm:text-4xl font-bold stat-number"
                  style={{ color: 'var(--accent)' }}
                >{stat.value}</div>
                <div className="text-xs mt-1 font-arabic" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Track groups */}
        <div className="space-y-8 sm:space-y-10">
          {TRACKS.map(({ key, label, desc }) => {
            const trackSubjects = subjects.filter(s => s.track === key);
            const required      = trackSubjects.filter(s => !s.isMajor);
            const majors        = trackSubjects.filter(s => s.isMajor);

            return (
              <div key={key}>
                {/* Track header */}
                <div className="flex items-center gap-3 mb-3">
                  <h3
                    className="text-sm sm:text-base font-bold font-arabic"
                    style={{ color: TRACK_CONFIG[key].color }}
                  >{label}</h3>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{desc}</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                </div>

                {/* Subject rows — 1 col mobile, 2 col md+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {required.map(s => <SubjectRow key={s.id} subject={s} />)}
                </div>

                {majors.length > 0 && (
                  <div className="mt-3 pt-3" style={{ borderTop: '1px dashed var(--border-subtle)' }}>
                    <p className="text-xs font-mono mb-2" style={{ color: 'var(--text-muted)' }}>
                      تخصص — اختر واحداً
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {majors.map(s => <SubjectRow key={s.id} subject={s} isMajor />)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-between gap-5 pt-8 sm:pt-10"
             style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="font-arabic text-center sm:text-right" style={{ color: 'var(--text-secondary)' }}>
            مادتك في انتظارك — لديك معرفة فيها؟
            <span className="block text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>احجز مقعدك في النفير</span>
          </p>
          <a
            href="/prejoin"
            className="shrink-0 inline-flex items-center gap-2 px-7 py-3 font-bold rounded-xl transition-all duration-300 text-sm sm:text-base"
            style={{ background: 'var(--accent)', color: '#0e0c09' }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--accent-hover)';
              e.currentTarget.style.boxShadow  = '0 0 36px var(--glow)';
              e.currentTarget.style.transform  = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--accent)';
              e.currentTarget.style.boxShadow  = 'none';
              e.currentTarget.style.transform  = 'translateY(0)';
            }}
          >
            طلب انضمام للنفير
          </a>
        </div>
      </div>
    </section>
  );
}

function SubjectRow({ subject, isMajor = false }) {
  const c           = colorMap[subject.color] ?? colorMap.sand;
  const isAvailable = subject.progress === 0 && !subject.contributor;
  const pct         = subject.progress;

  return (
    <div
      className="subject-row flex items-center gap-3 py-2.5 px-3.5 rounded-xl transition-all duration-200"
      style={{
        background: 'var(--bg-card)',
        border:     `1px solid var(--border-subtle)`,
        borderStyle: isMajor ? 'dashed' : 'solid',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = c.bar + '55';
        e.currentTarget.style.background  = 'var(--bg-secondary)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.background  = 'var(--bg-card)';
      }}
    >
      {/* Color accent */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{ background: c.bar, opacity: pct > 0 ? 0.8 : 0.25, minHeight: '20px' }}
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-arabic font-semibold block leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {subject.nameAr}
        </span>
        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
          {subject.units.length} وحدات · {subject.totalLessons} درس
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-16 sm:w-24 h-1 rounded-full overflow-hidden"
          style={{ background: 'var(--border-mid)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: c.bar }}
          />
        </div>
        <span
          className="text-xs font-mono w-7 text-center tabular-nums"
          style={{ color: pct > 0 ? c.text : 'var(--text-muted)' }}
        >
          {pct}٪
        </span>
      </div>

      {/* CTA or contributor name */}
      {isAvailable ? (
        <a
          href="/prejoin"
          className="text-xs px-2 py-1 rounded-lg font-mono shrink-0 transition-all duration-200"
          style={{
            color:      'var(--accent)',
            background: 'var(--accent-dim)',
            border:     '1px solid rgba(212,137,30,0.2)',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,137,30,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-dim)'}
          onClick={e => e.stopPropagation()}
        >
          احجز
        </a>
      ) : subject.contributor ? (
        <span className="text-xs shrink-0 font-arabic" style={{ color: 'var(--text-muted)' }}>
          {subject.contributor}
        </span>
      ) : null}
    </div>
  );
}
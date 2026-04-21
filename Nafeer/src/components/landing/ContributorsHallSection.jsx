'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

gsap.registerPlugin(ScrollTrigger);

const SUBJECT_LABEL = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, s.nameAr])
);

// ── Detect reduced-motion preference ─────────────────────────────────────────
function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ avatarUrl, name, size = 'md' }) {
  const dims = { sm: 'w-11 h-11 text-sm', md: 'w-16 h-16 text-xl', lg: 'w-24 h-24 text-3xl' };

  const initials = (name || '؟')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${dims[size]} rounded-full object-cover shrink-0`}
        style={{ border: '2px solid var(--accent)' }}
      />
    );
  }

  return (
    <div
      className={`${dims[size]} rounded-full flex items-center justify-center font-bold shrink-0 select-none`}
      style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, rgba(146,79,18,0.55) 100%)',
        color: '#0e0c09',
      }}
    >
      {initials}
    </div>
  );
}

// ── Subject badge ─────────────────────────────────────────────────────────────
function SubjectBadge({ subject }) {
  if (!subject) return null;
  return (
    <span
      className="text-xs font-mono px-2.5 py-1 rounded-full shrink-0"
      style={{
        background: 'var(--accent-dim)',
        border: '1px solid rgba(212,137,30,0.28)',
        color: 'var(--accent)',
      }}
    >
      {SUBJECT_LABEL[subject] || subject}
    </span>
  );
}

// ── Education badge ───────────────────────────────────────────────────────────
function EduBadge({ background, fieldOfStudy }) {
  const text = background || fieldOfStudy;
  if (!text) return null;
  return (
    <span
      className="text-xs font-arabic px-2.5 py-1 rounded-full shrink-0 max-w-[180px] truncate"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: 'var(--text-secondary)',
      }}
      title={text}
    >
      {text}
    </span>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">{icon}</span>
      <span className="font-mono text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

// ── Featured card (rank #1) ───────────────────────────────────────────────────
function FeaturedCard({ contributor }) {
  const s = contributor.stats || {};

  return (
    <div
      className="hall-card relative p-7 sm:p-10 rounded-3xl overflow-hidden transition-[border-color,box-shadow] duration-300"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(212,137,30,0.25)',
        backdropFilter: 'blur(20px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.48)';
        e.currentTarget.style.boxShadow   = '0 0 64px rgba(212,137,30,0.08), 0 24px 56px rgba(0,0,0,0.32)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.25)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 65% 55% at 50% 0%, rgba(212,137,30,0.07) 0%, transparent 70%)' }}
      />

      {/* Top row */}
      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-7">
        <span className="font-mono text-5xl sm:text-6xl font-bold select-none" style={{ color: 'var(--text-primary)', opacity: 0.06 }}>
          #001
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-mono px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(212,137,30,0.1)', border: '1px solid rgba(212,137,30,0.38)', color: 'var(--accent)' }}
          >
            ✦ المساهم الأول
          </span>
          <SubjectBadge subject={contributor.subject} />
        </div>
      </div>

      {/* Identity */}
      <div className="relative flex flex-col sm:flex-row items-start gap-5 sm:gap-7 mb-7">
        <Avatar avatarUrl={contributor.avatarUrl} name={contributor.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h3
            className="text-2xl sm:text-3xl font-arabic font-bold leading-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {contributor.username ? (
              <a
                href={`/contributors/${contributor.username}`}
                className="hover:underline transition-opacity duration-200 hover:opacity-80"
                style={{ color: 'inherit', textDecoration: 'none' }}
              >
                {contributor.name}
              </a>
            ) : contributor.name}
          </h3>
          {contributor.username && (
            <p className="text-sm font-mono mb-2.5" style={{ color: 'var(--text-muted)' }}>
              <a href={`/contributors/${contributor.username}`} className="hover:opacity-80 transition-opacity" style={{ color: 'inherit' }}>
                @{contributor.username}
              </a>
            </p>
          )}

          {/* Education row */}
          <div className="flex flex-wrap gap-2 mb-3">
            <EduBadge background={contributor.background} fieldOfStudy={contributor.fieldOfStudy} />
          </div>

          {contributor.bio && (
            <p
              className="text-base leading-loose font-arabic line-clamp-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              {contributor.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div
        className="relative flex flex-wrap gap-6 pt-5"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <StatPill icon="📖" value={s.lessonsCreated}   label="درس"    />
        <StatPill icon="❓" value={s.questionsAdded}   label="سؤال"   />
        <StatPill icon="📡" value={s.feedItemsCreated} label="تغذية"  />
        <StatPill icon="🧱" value={s.blocksAdded}      label="وحدة"   />
      </div>
    </div>
  );
}

// ── Regular contributor card ──────────────────────────────────────────────────
function ContributorCard({ contributor, rank }) {
  const num = String(rank).padStart(3, '0');
  const s   = contributor.stats || {};

  return (
    <div
      className="hall-card relative flex flex-col p-6 rounded-2xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
        transition: 'border-color 0.25s, transform 0.25s, box-shadow 0.25s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.22)';
        e.currentTarget.style.transform   = 'translateY(-4px)';
        e.currentTarget.style.boxShadow   = '0 16px 48px rgba(0,0,0,0.28)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Rank */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-xs font-bold select-none" style={{ color: 'var(--text-primary)', opacity: 0.13 }}>
          #{num}
        </span>
        <SubjectBadge subject={contributor.subject} />
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-3">
        <Avatar avatarUrl={contributor.avatarUrl} name={contributor.name} size="sm" />
        <div className="min-w-0">
          <h3 className="font-arabic font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
            {contributor.username
              ? <a href={`/contributors/${contributor.username}`} className="hover:opacity-75 transition-opacity" style={{ color: 'inherit' }}>{contributor.name}</a>
              : contributor.name
            }
          </h3>
          {contributor.username && (
            <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>
              <a href={`/contributors/${contributor.username}`} className="hover:opacity-75 transition-opacity" style={{ color: 'inherit' }}>
                @{contributor.username}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="mb-3">
        <EduBadge background={contributor.background} fieldOfStudy={contributor.fieldOfStudy} />
      </div>

      {/* Bio */}
      {contributor.bio && (
        <p
          className="text-sm leading-loose flex-1 mb-4 line-clamp-2 font-arabic"
          style={{ color: 'var(--text-secondary)' }}
        >
          {contributor.bio}
        </p>
      )}

      {/* Stats */}
      <div
        className="flex gap-4 pt-3 mt-auto flex-wrap"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <StatPill icon="📖" value={s.lessonsCreated}   label="درس"   />
        <StatPill icon="❓" value={s.questionsAdded}   label="سؤال"  />
        <StatPill icon="📡" value={s.feedItemsCreated} label="تغذية" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyHall() {
  return (
    <div
      className="hall-grid text-center py-20 px-6 rounded-3xl"
      style={{ background: 'var(--bg-card)', border: '1px dashed var(--border-mid)' }}
    >
      <div className="flex justify-center gap-3 mb-6 text-3xl opacity-20"><span>🏛️</span></div>
      <h3 className="text-xl font-arabic font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        القاعة في انتظار أعمدتها
      </h3>
      <p className="text-sm leading-loose mb-8 max-w-sm mx-auto font-arabic" style={{ color: 'var(--text-muted)' }}>
        كن من أوائل المساهمين — اسمك الأول في قاعة شرف تصنع أثراً حقيقياً لآلاف الطلاب.
      </p>
      <a
        href="/prejoin"
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300"
        style={{ background: 'var(--accent)', color: '#0e0c09' }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 40px var(--glow)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        انضم للنفير
      </a>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function ContributorsHallSection() {
  const sectionRef              = useRef(null);
  const [contributors, setContributors] = useState(null);
  const [visible, setVisible]           = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/site-setting').then((r) => r.json()).catch(() => ({ showContributorsOnLanding: true })),
      fetch('/api/contributors/public').then((r) => r.json()).catch(() => ({ contributors: [] })),
    ]).then(([settings, data]) => {
      setVisible(settings.showContributorsOnLanding !== false);
      setContributors(data.contributors || []);
    });
  }, []);

  useEffect(() => {
    if (contributors === null || !visible) return;
    if (prefersReducedMotion()) return; // respect a11y

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hall-header',
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-header', start: 'top 88%', once: true } }
      );
      gsap.fromTo(
        '.hall-ticker',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-ticker', start: 'top 92%', once: true } }
      );
      gsap.fromTo(
        '.hall-card',
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.68,
          stagger: { each: 0.1, from: 'start' },
          ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-grid', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo(
        '.hall-cta',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-cta', start: 'top 94%', once: true } }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [contributors, visible]);

  if (!visible || contributors === null) return null;

  const [featured, ...rest] = contributors;

  const totalContributors = contributors.length;
  const totalLessons      = contributors.reduce((a, c) => a + (c.stats?.lessonsCreated   || 0), 0);
  const totalQuestions    = contributors.reduce((a, c) => a + (c.stats?.questionsAdded   || 0), 0);
  const totalFeed         = contributors.reduce((a, c) => a + (c.stats?.feedItemsCreated || 0), 0);

  return (
    <section
      id="contributors"
      ref={sectionRef}
      className="py-20 sm:py-32 px-4 sm:px-6 relative overflow-hidden"
    >
      <div className="ember-line max-w-6xl mx-auto mb-16 sm:mb-24 opacity-40" />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70rem] h-[40rem] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(212,137,30,0.04) 0%, transparent 65%)' }}
      />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="hall-header mb-5">
          <p className="text-xs sm:text-sm font-mono tracking-widest uppercase mb-3" style={{ color: 'var(--accent)' }}>
            قاعة الشرف
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            وجوه خلف المحتوى
          </h2>
          <div className="ember-line w-20 sm:w-28 mb-5" />
          <p className="text-base sm:text-lg leading-loose max-w-xl font-arabic" style={{ color: 'var(--text-secondary)' }}>
            كل درس في بشير كتبه شخص اختار أن يمنح وقته وخبرته.
            هؤلاء ليسوا موظفين —{' '}
            <span style={{ color: 'var(--accent)' }}>
              هم معلمون وطلاب ومتحمسون قرروا أن تحسين التعليم يستحق جهدهم.
            </span>
          </p>
        </div>

        {/* Stats ticker */}
        {totalContributors > 0 && (
          <div
            className="hall-ticker flex flex-wrap gap-8 sm:gap-12 mb-12 py-4 px-6 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            {[
              { value: totalContributors, label: 'مساهم نشط'    },
              { value: totalLessons,      label: 'درس مُنجز'     },
              { value: totalQuestions,    label: 'سؤال في البنك' },
              { value: totalFeed,         label: 'عنصر تغذية'   },
            ].map(({ value, label }) => value > 0 ? (
              <div key={label}>
                <span className="font-mono text-xl font-bold" style={{ color: 'var(--accent)' }}>{value}</span>
                <span className="text-xs mr-2 font-arabic" style={{ color: 'var(--text-muted)' }}>{label}</span>
              </div>
            ) : null)}
          </div>
        )}

        {/* Content */}
        {contributors.length === 0 ? (
          <EmptyHall />
        ) : (
          <div className="hall-grid space-y-6">
            {featured && <FeaturedCard contributor={featured} />}

            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {rest.map((c, i) => (
                  <ContributorCard key={c._id || i} contributor={c} rank={i + 2} />
                ))}
              </div>
            )}

            <div
              className="hall-cta text-center py-10 rounded-2xl"
              style={{ border: '1px dashed var(--border-mid)' }}
            >
              <p className="text-sm mb-4 font-arabic" style={{ color: 'var(--text-muted)' }}>
                مقعدك في القاعة ينتظرك
              </p>
              <a
                href="/prejoin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
                style={{ border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 24px var(--glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                انضم للمساهمين
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
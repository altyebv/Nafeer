'use client';
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

gsap.registerPlugin(ScrollTrigger);

// Build a subject label map from SUBJECTS_CATALOG
const SUBJECT_LABEL = Object.fromEntries(
  SUBJECTS_CATALOG.map((s) => [s.id, s.nameAr])
);

// ── Avatar ─────────────────────────────────────────────────────────────────────
function Avatar({ avatarUrl, name, size = 'md' }) {
  const dims = {
    sm: 'w-11 h-11 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-3xl',
  };

  // Build initials from first two words
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
        className={`${dims[size]} rounded-full object-cover ring-2`}
        style={{ ringColor: 'var(--accent)', border: '2px solid var(--accent)' }}
      />
    );
  }

  return (
    <div
      className={`${dims[size]} rounded-full flex items-center justify-center font-bold shrink-0`}
      style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, rgba(146,79,18,0.6) 100%)',
        color: '#0e0c09',
      }}
    >
      {initials}
    </div>
  );
}

// ── Subject badge ──────────────────────────────────────────────────────────────
function SubjectBadge({ subject }) {
  if (!subject) return null;
  return (
    <span
      className="text-xs font-mono px-2.5 py-1 rounded-full shrink-0"
      style={{
        background: 'var(--accent-dim)',
        border: '1px solid rgba(212,137,30,0.3)',
        color: 'var(--accent)',
      }}
    >
      {SUBJECT_LABEL[subject] || subject}
    </span>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, value, label }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">{icon}</span>
      <span
        className="font-mono text-sm font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
      </span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  );
}

// ── Featured card (rank #1) ───────────────────────────────────────────────────
function FeaturedCard({ contributor }) {
  const s = contributor.stats || {};

  return (
    <div
      className="hall-card relative p-8 md:p-10 rounded-3xl overflow-hidden"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(212,137,30,0.28)',
        backdropFilter: 'blur(20px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.5)';
        e.currentTarget.style.boxShadow = '0 0 60px rgba(212,137,30,0.08), 0 24px 64px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.28)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(212,137,30,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Top row: number + badges */}
      <div className="relative flex items-center justify-between mb-7">
        <span
          className="font-mono text-5xl font-bold select-none"
          style={{ color: 'var(--text-primary)', opacity: 0.07 }}
        >
          #001
        </span>
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono px-2.5 py-1 rounded-full"
            style={{
              background: 'rgba(212,137,30,0.12)',
              border: '1px solid rgba(212,137,30,0.4)',
              color: 'var(--accent)',
            }}
          >
            ✦ المساهم الأول
          </span>
          <SubjectBadge subject={contributor.subject} />
        </div>
      </div>

      {/* Profile */}
      <div className="relative flex items-start gap-6 mb-8">
        <Avatar avatarUrl={contributor.avatarUrl} name={contributor.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h3
            className="text-2xl md:text-3xl font-arabic font-bold leading-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            {contributor.name}
          </h3>
          {contributor.username && (
            <p
              className="text-sm font-mono mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              @{contributor.username}
            </p>
          )}
          {contributor.bio && (
            <p
              className="text-base leading-relaxed"
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
        <StatPill icon="📖" value={s.lessonsCreated}    label="درس" />
        <StatPill icon="❓" value={s.questionsAdded}    label="سؤال" />
        <StatPill icon="📡" value={s.feedItemsCreated}  label="تغذية" />
        <StatPill icon="🧱" value={s.blocksAdded}       label="وحدة" />
      </div>
    </div>
  );
}

// ── Regular contributor card ───────────────────────────────────────────────────
function ContributorCard({ contributor, rank }) {
  const num = String(rank).padStart(3, '0');
  const s   = contributor.stats || {};

  return (
    <div
      className="hall-card relative flex flex-col p-6 rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(12px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.22)';
        e.currentTarget.style.transform   = 'translateY(-5px)';
        e.currentTarget.style.boxShadow   = 'var(--card-hover-shadow)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      {/* Number + subject */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="font-mono text-xs font-bold select-none"
          style={{ color: 'var(--text-primary)', opacity: 0.15 }}
        >
          #{num}
        </span>
        <SubjectBadge subject={contributor.subject} />
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-3 mb-4">
        <Avatar avatarUrl={contributor.avatarUrl} name={contributor.name} size="sm" />
        <div className="min-w-0">
          <h3
            className="font-arabic font-bold text-base truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {contributor.name}
          </h3>
          {contributor.username && (
            <p
              className="text-xs font-mono truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              @{contributor.username}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {contributor.bio && (
        <p
          className="text-sm leading-loose flex-1 mb-4 line-clamp-2"
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
        <StatPill icon="📖" value={s.lessonsCreated}   label="درس" />
        <StatPill icon="❓" value={s.questionsAdded}   label="سؤال" />
        <StatPill icon="📡" value={s.feedItemsCreated} label="تغذية" />
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyHall() {
  return (
    <div
      className="hall-grid text-center py-20 px-6 rounded-3xl"
      style={{
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-mid)',
      }}
    >
      {/* Decorative pillar icons */}
      <div className="flex justify-center gap-3 mb-6 text-3xl opacity-20">
        <span>🏛️</span>
      </div>
      <h3
        className="text-xl font-arabic font-bold mb-3"
        style={{ color: 'var(--text-primary)' }}
      >
        القاعة في انتظار أعمدتها
      </h3>
      <p
        className="text-sm leading-loose mb-8 max-w-sm mx-auto"
        style={{ color: 'var(--text-muted)' }}
      >
        كن من أوائل المساهمين — اسمك الأول في قاعة شرف تصنع أثراً
        حقيقياً لآلاف الطلاب.
      </p>
      <a
        href="/prejoin"
        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all duration-300"
        style={{ background: 'var(--accent)', color: '#0e0c09' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 0 40px var(--glow)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        انضم للنفير
      </a>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function ContributorsHallSection() {
  const sectionRef = useRef(null);
  const [contributors, setContributors] = useState(null); // null = loading
  const [visible, setVisible]           = useState(true);

  useEffect(() => {
    // Fetch setting + contributors in parallel
    Promise.all([
      fetch('/api/site-settings').then((r) => r.json()).catch(() => ({ showContributorsOnLanding: true })),
      fetch('/api/contributors/public').then((r) => r.json()).catch(() => ({ contributors: [] })),
    ]).then(([settings, data]) => {
      setVisible(settings.showContributorsOnLanding !== false);
      setContributors(data.contributors || []);
    });
  }, []);

  // GSAP animations — run only after data loads
  useEffect(() => {
    if (contributors === null || !visible) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hall-header',
        { opacity: 0, y: 36 },
        {
          opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-header', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo(
        '.hall-ticker',
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-ticker', start: 'top 92%', once: true },
        }
      );
      gsap.fromTo(
        '.hall-card',
        { opacity: 0, y: 44, scale: 0.96 },
        {
          opacity: 1, y: 0, scale: 1, duration: 0.72,
          stagger: { each: 0.11, from: 'start' },
          ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-grid', start: 'top 88%', once: true },
        }
      );
      gsap.fromTo(
        '.hall-cta',
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.hall-cta', start: 'top 94%', once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [contributors, visible]);

  // Still loading or toggled off — render nothing
  if (!visible || contributors === null) return null;

  const [featured, ...rest] = contributors;

  // Aggregate stats for ticker
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

      {/* Background ambient orb */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70rem] h-[40rem] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse, rgba(212,137,30,0.04) 0%, transparent 65%)',
        }}
      />

      <div className="max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="hall-header mb-5">
          <p
            className="text-xs sm:text-sm font-mono tracking-widest uppercase mb-3"
            style={{ color: 'var(--accent)' }}
          >
            قاعة الشرف
          </p>
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            أعمدة المشروع
          </h2>
          <div className="ember-line w-20 sm:w-28 mb-5" />
          <p
            className="text-base sm:text-lg leading-loose max-w-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            هؤلاء هم من بنوا ما تراه في بشير —{' '}
            <span style={{ color: 'var(--accent)' }}>درساً بعد درس، سؤالاً بعد سؤال.</span>
            {' '}كل مساهم يترك أثراً حقيقياً يصل لآلاف الطلاب.
          </p>
        </div>

        {/* ── Stats ticker ── */}
        {totalContributors > 0 && (
          <div
            className="hall-ticker flex flex-wrap gap-8 sm:gap-12 mb-14 py-4 px-6 rounded-2xl mb-12"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {[
              { value: totalContributors, label: 'مساهم نشط' },
              { value: totalLessons,      label: 'درس مُنجز'  },
              { value: totalQuestions,    label: 'سؤال في البنك' },
              { value: totalFeed,         label: 'عنصر تغذية' },
            ].map(({ value, label }) => value > 0 ? (
              <div key={label}>
                <span
                  className="font-mono text-xl font-bold"
                  style={{ color: 'var(--accent)' }}
                >
                  {value}
                </span>
                <span
                  className="text-xs mr-2"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {label}
                </span>
              </div>
            ) : null)}
          </div>
        )}

        {/* ── Content ── */}
        {contributors.length === 0 ? (
          <EmptyHall />
        ) : (
          <div className="hall-grid space-y-6">
            {/* Featured contributor */}
            {featured && <FeaturedCard contributor={featured} />}

            {/* Grid of rest */}
            {rest.length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {rest.map((c, i) => (
                  <ContributorCard
                    key={c._id || i}
                    contributor={c}
                    rank={i + 2}
                  />
                ))}
              </div>
            )}

            {/* Bottom join nudge */}
            <div
              className="hall-cta text-center py-10 rounded-2xl"
              style={{ border: '1px dashed var(--border-mid)' }}
            >
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--text-muted)' }}
              >
                مقعدك في القاعة ينتظرك
              </p>
              <a
                href="/prejoin"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-300"
                style={{ border: '1px solid var(--border-mid)', color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color       = 'var(--accent)';
                  e.currentTarget.style.boxShadow   = '0 0 24px var(--glow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-mid)';
                  e.currentTarget.style.color       = 'var(--text-secondary)';
                  e.currentTarget.style.boxShadow   = 'none';
                }}
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
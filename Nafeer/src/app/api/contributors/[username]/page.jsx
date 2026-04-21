'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter }         from 'next/navigation';
import { gsap }                         from 'gsap';
import { SUBJECTS_CATALOG }             from '@/shared/curriculum';

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUBJECT_LABEL = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s.nameAr]));

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function joinedAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return 'هذا الشهر';
  if (months < 12) return `منذ ${months} شهر`;
  const years = Math.floor(months / 12);
  return `منذ ${years} سنة`;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ avatarUrl, name }) {
  const initials = (name || '؟').split(' ').slice(0, 2).map((w) => w[0]).join('');

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className="w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover shrink-0"
        style={{ border: '3px solid var(--accent)' }}
      />
    );
  }

  return (
    <div
      className="w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center text-4xl sm:text-5xl font-bold shrink-0 select-none"
      style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, rgba(146,79,18,0.55) 100%)',
        color: '#0e0c09',
      }}
    >
      {initials}
    </div>
  );
}

// ── Stat block ────────────────────────────────────────────────────────────────

function StatBlock({ icon, value, label }) {
  if (!value && value !== 0) return null;
  return (
    <div
      className="flex flex-col items-center gap-1 px-5 py-4 rounded-2xl"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
    >
      <span className="text-2xl mb-0.5">{icon}</span>
      <span
        className="text-2xl font-bold font-mono tabular-nums"
        style={{ color: 'var(--accent)' }}
      >
        {value}
      </span>
      <span
        className="text-xs font-arabic text-center leading-snug"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

function Badge({ children, accent = false }) {
  return (
    <span
      className="inline-flex items-center text-xs font-arabic px-3 py-1 rounded-full"
      style={{
        background: accent ? 'var(--accent-dim)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${accent ? 'rgba(212,137,30,0.3)' : 'var(--border-subtle)'}`,
        color: accent ? 'var(--accent)' : 'var(--text-secondary)',
      }}
    >
      {children}
    </span>
  );
}

// ── Track label ───────────────────────────────────────────────────────────────

function trackLabel(track) {
  return { COMMON: 'مشترك', SCIENCE: 'علمي', LITERARY: 'أدبي' }[track] || track;
}

// ── Back button ───────────────────────────────────────────────────────────────

function BackBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-sm transition-all duration-200 group"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
    >
      <span className="text-base transition-transform duration-200 group-hover:-translate-x-1">→</span>
      <span className="font-arabic">العودة</span>
    </button>
  );
}

// ── Not found ────────────────────────────────────────────────────────────────

function NotFound({ onBack }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: 'var(--bg-primary, #0e0c09)' }}>
      <p className="text-6xl mb-6 opacity-20">🏛️</p>
      <h1 className="text-2xl font-arabic font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
        المساهم غير موجود
      </h1>
      <p className="text-sm font-arabic mb-8" style={{ color: 'var(--text-muted)' }}>
        قد يكون الملف الشخصي خاصاً أو لم يكتمل التأهيل بعد.
      </p>
      <button
        onClick={onBack}
        className="px-6 py-3 rounded-xl text-sm font-arabic font-bold transition-all duration-200"
        style={{ background: 'var(--accent)', color: '#0e0c09' }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 0 32px var(--glow)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        العودة للرئيسية
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContributorProfilePage() {
  const { username }                  = useParams();
  const router                        = useRouter();
  const pageRef                       = useRef(null);
  const [contributor, setContributor] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);

  useEffect(() => {
    if (!username) return;
    fetch(`/api/contributors/profile?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setContributor(data.contributor);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [username]);

  useEffect(() => {
    if (!contributor || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.profile-avatar',
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.4)', delay: 0.1 }
      );
      gsap.fromTo(
        '.profile-identity',
        { x: 24, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.65, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo(
        '.profile-stat',
        { y: 24, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.55,
          stagger: 0.07, ease: 'power3.out', delay: 0.35,
        }
      );
      gsap.fromTo(
        '.profile-section',
        { y: 20, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.55,
          stagger: 0.09, ease: 'power3.out', delay: 0.5,
        }
      );
    }, pageRef);

    return () => ctx.revert();
  }, [contributor]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary, #0e0c09)' }}>
        <div className="flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
          <span
            className="inline-block w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent) var(--accent) var(--accent) transparent' }}
          />
          <span className="font-arabic text-sm">جارٍ التحميل…</span>
        </div>
      </div>
    );
  }

  if (notFound) return <NotFound onBack={() => router.push('/#contributors')} />;

  const s = contributor.stats || {};
  const totalContributions =
    (s.lessonsCreated || 0) +
    (s.questionsAdded || 0) +
    (s.feedItemsCreated || 0) +
    (s.blocksAdded || 0);

  const hasStats =
    s.lessonsCreated   > 0 ||
    s.questionsAdded   > 0 ||
    s.feedItemsCreated > 0 ||
    s.blocksAdded      > 0;

  return (
    <div
      ref={pageRef}
      className="min-h-screen"
      style={{ background: 'var(--bg-primary, #0e0c09)', color: 'var(--text-primary)' }}
      dir="rtl"
    >
      {/* ── Ambient glow ── */}
      <div
        className="fixed top-0 left-0 right-0 h-[50vh] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% -10%, rgba(212,137,30,0.06) 0%, transparent 70%)' }}
      />

      {/* ── Top bar ── */}
      <header
        className="sticky top-0 z-20 px-4 sm:px-8 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(14,12,9,0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <BackBtn onClick={() => router.back()} />
        <a
          href="/"
          className="text-lg font-arabic font-bold"
          style={{ color: 'var(--accent)' }}
        >
          نفير
        </a>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        {/* ── Hero card ── */}
        <div
          className="relative p-7 sm:p-10 rounded-3xl mb-8 overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid rgba(212,137,30,0.2)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Glow overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 0%, rgba(212,137,30,0.05) 0%, transparent 70%)' }}
          />

          <div className="relative flex flex-col sm:flex-row items-start gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="profile-avatar shrink-0">
              <Avatar avatarUrl={contributor.avatarUrl} name={contributor.name} />
            </div>

            {/* Identity */}
            <div className="profile-identity flex-1 min-w-0">
              <h1
                className="text-2xl sm:text-3xl font-arabic font-bold leading-tight mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {contributor.name}
              </h1>

              {contributor.username && (
                <p className="text-sm font-mono mb-4" style={{ color: 'var(--text-muted)' }}>
                  @{contributor.username}
                </p>
              )}

              {/* Badges row */}
              <div className="flex flex-wrap gap-2 mb-5">
                {contributor.subjectInfo && (
                  <Badge accent>
                    {contributor.subjectInfo.nameAr}
                    {contributor.subjectInfo.track && (
                      <span className="mr-1.5 opacity-60">· {trackLabel(contributor.subjectInfo.track)}</span>
                    )}
                  </Badge>
                )}
                {(contributor.background || contributor.fieldOfStudy) && (
                  <Badge>{contributor.background || contributor.fieldOfStudy}</Badge>
                )}
                {contributor.createdAt && (
                  <Badge>{joinedAgo(contributor.createdAt)}</Badge>
                )}
              </div>

              {/* Bio */}
              {contributor.bio ? (
                <p
                  className="text-base leading-loose font-arabic"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {contributor.bio}
                </p>
              ) : (
                <p className="text-sm font-arabic italic" style={{ color: 'var(--text-muted)' }}>
                  لم يكتب {contributor.name.split(' ')[0]} نبذة شخصية بعد.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Stats grid ── */}
        {hasStats && (
          <div className="profile-section mb-8">
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-4"
              style={{ color: 'var(--text-muted)' }}
            >
              مساهمات المحتوى
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="profile-stat"><StatBlock icon="📖" value={s.lessonsCreated}   label="درس مكتوب"   /></div>
              <div className="profile-stat"><StatBlock icon="❓" value={s.questionsAdded}   label="سؤال أضافه"  /></div>
              <div className="profile-stat"><StatBlock icon="📡" value={s.feedItemsCreated} label="عنصر تغذية"  /></div>
              <div className="profile-stat"><StatBlock icon="🧱" value={s.blocksAdded}      label="وحدة محتوى"  /></div>
            </div>
          </div>
        )}

        {/* ── Total impact ── */}
        {totalContributions > 0 && (
          <div
            className="profile-section mb-8 p-5 sm:p-6 rounded-2xl"
            style={{
              background: 'rgba(212,137,30,0.05)',
              border: '1px solid rgba(212,137,30,0.15)',
            }}
          >
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p
                  className="text-sm font-arabic font-medium mb-0.5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  إجمالي المساهمات في بشير
                </p>
                <p className="text-xs font-arabic" style={{ color: 'var(--text-muted)' }}>
                  دروس · أسئلة · تغذية · وحدات
                </p>
              </div>
              <p
                className="text-4xl font-bold font-mono tabular-nums"
                style={{ color: 'var(--accent)' }}
              >
                {totalContributions}
              </p>
            </div>
          </div>
        )}

        {/* ── Activity timeline (last active) ── */}
        {s.lastActiveAt && (
          <div
            className="profile-section mb-8 p-5 rounded-2xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
          >
            <p
              className="text-[10px] font-mono uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              آخر نشاط
            </p>
            <p className="text-sm font-arabic" style={{ color: 'var(--text-secondary)' }}>
              {new Date(s.lastActiveAt).toLocaleDateString('ar-EG', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="profile-section text-center py-10 rounded-2xl"
          style={{ border: '1px dashed var(--border-mid)' }}
        >
          <p className="text-sm font-arabic mb-2" style={{ color: 'var(--text-muted)' }}>
            تريد أن ينضم اسمك هنا؟
          </p>
          <p className="text-xs font-arabic mb-6" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
            ساهم في بناء بشير وأنت تترك أثراً حقيقياً لطلاب السودان
          </p>
          <a
            href="/prejoin"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-arabic font-bold transition-all duration-300"
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
      </main>

      {/* ── Footer ── */}
      <footer
        className="text-center py-8 px-4"
        style={{ borderTop: '1px solid var(--border-subtle)' }}
      >
        <a
          href="/"
          className="text-sm font-arabic transition-colors duration-200"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          ← العودة لنفير
        </a>
      </footer>
    </div>
  );
}
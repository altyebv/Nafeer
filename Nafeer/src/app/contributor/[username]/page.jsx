'use client';
import { useState, useEffect } from 'react';
import { useParams }           from 'next/navigation';
import { SUBJECTS_CATALOG }    from '@/shared/curriculum';

const SUBJECT_MAP = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s]));

// ── Stat definitions ──────────────────────────────────────────────────────────
const STAT_META = [
  { key: 'lessons',   labelAr: 'درس',    labelEn: 'Lessons',   icon: '◈' },
  { key: 'concepts',  labelAr: 'مفهوم',  labelEn: 'Concepts',  icon: '✦' },
  { key: 'feedItems', labelAr: 'بطاقة',  labelEn: 'Feed',      icon: '▣' },
  { key: 'questions', labelAr: 'سؤال',   labelEn: 'Questions', icon: '◎' },
];

const ROLE_LABELS = {
  contributor: { ar: 'مساهم',       en: 'Contributor'        },
  reviewer:    { ar: 'مراجع',       en: 'Reviewer'           },
  lead:        { ar: 'قائد مجتمع',  en: 'Community Lead'     },
  editor:      { ar: 'محرر',        en: 'Editor'             },
};

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ profile, size }) {
  const initials = (profile?.name || 'م')
    .split(' ').slice(0, 2).map((w) => w[0]).join('');

  if (profile?.avatarUrl) {
    return (
      <img
        src={profile.avatarUrl}
        alt={profile.name}
        style={{
          width: size, height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '3px solid rgba(212,137,30,0.4)',
          boxShadow: '0 0 0 6px rgba(212,137,30,0.07), 0 16px 40px rgba(0,0,0,0.5)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size,
      borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, rgba(212,137,30,0.85) 0%, rgba(120,60,10,0.7) 100%)',
      border: '3px solid rgba(212,137,30,0.4)',
      boxShadow: '0 0 0 6px rgba(212,137,30,0.07), 0 16px 40px rgba(0,0,0,0.5)',
      fontSize: size * 0.35,
      fontWeight: 800,
      color: '#1a0f00',
      fontFamily: 'var(--font-arabic, serif)',
      flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, value, labelAr, labelEn, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      padding: '20px 16px',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(12px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      flex: 1,
      minWidth: 0,
    }}>
      <span style={{ fontSize: 16, fontFamily: 'monospace', color: 'rgba(212,137,30,0.7)' }}>{icon}</span>
      <span style={{
        fontSize: 36, fontWeight: 800, fontFamily: 'monospace',
        color: '#e8d5a8', lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {value ?? '—'}
      </span>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 13, fontFamily: 'var(--font-arabic, serif)', color: 'rgba(255,255,255,0.55)', lineHeight: 1.3 }}>{labelAr}</p>
        <p style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.2)', marginTop: 2, letterSpacing: '0.08em' }}>{labelEn}</p>
      </div>
    </div>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────
function ShareBtn({ username }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  };
  return (
    <button
      onClick={copy}
      style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 16px', borderRadius: 10,
        background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)'}`,
        color: copied ? '#34d399' : 'rgba(255,255,255,0.45)',
        fontSize: 12, fontFamily: 'monospace',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {copied ? (
        <><span>✓</span><span>تم النسخ</span></>
      ) : (
        <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg><span>مشاركة الملف</span></>
      )}
    </button>
  );
}

// ── Not found state ───────────────────────────────────────────────────────────
function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: '#080704', color: 'rgba(255,255,255,0.3)',
      fontFamily: 'monospace',
    }}>
      <span style={{ fontSize: 40, opacity: 0.2 }}>◈</span>
      <p style={{ fontSize: 14 }}>لم يُعثر على هذا المساهم</p>
      <p style={{ fontSize: 11, opacity: 0.5 }}>contributor not found</p>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Loading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#080704',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        border: '2px solid rgba(212,137,30,0.3)',
        borderTopColor: '#d4891e',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ContributorProfilePage() {
  const params  = useParams();
  const username = params?.username;

  const [profile,  setProfile]  = useState(null);
  const [activity, setActivity] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    if (!username) return;
    (async () => {
      try {
        const res = await fetch(`/api/contributors/profile?username=${encodeURIComponent(username)}`);
        if (res.status === 404) { setNotFound(true); setLoading(false); return; }
        const data = await res.json();
        if (!data.ok || !data.contributor) { setNotFound(true); setLoading(false); return; }
        setProfile(data.contributor);

        // Load activity stats — non-blocking
        fetch(`/api/contributors/activity?username=${encodeURIComponent(username)}`)
          .then((r) => r.json())
          .then((d) => { if (d.ok) setActivity(d.activity); })
          .catch(() => {});
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
        setTimeout(() => setHeroVisible(true), 60);
      }
    })();
  }, [username]);

  if (loading)  return <Loading />;
  if (notFound) return <NotFound />;

  const subject     = profile.subject ? SUBJECT_MAP[profile.subject] : null;
  const roleKey     = profile.role || 'contributor';
  const roleLabel   = ROLE_LABELS[roleKey] || ROLE_LABELS.contributor;
  const joinYear    = profile.createdAt ? new Date(profile.createdAt).getFullYear() : null;

  const stats = STAT_META.map((m) => ({
    ...m,
    value: activity?.[m.key] ?? profile?.stats?.[m.key] ?? null,
  }));

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: '#080704',
      fontFamily: 'var(--font-arabic, serif)',
      overflowX: 'hidden',
    }}>

      {/* ── Ambient background ──────────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 60% -10%, rgba(212,137,30,0.09) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '40vh',
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 100% 80% at 50% 120%, rgba(212,137,30,0.05) 0%, transparent 70%)',
      }} />

      {/* ── Grain texture ───────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />

      {/* ── Main content ────────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 640, margin: '0 auto',
        padding: '64px 24px 80px',
      }}>

        {/* ── Hero card ─────────────────────────────────────────────── */}
        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>

          {/* Top decoration line */}
          <div style={{
            width: 40, height: 3, borderRadius: 2,
            background: 'linear-gradient(90deg, #d4891e, rgba(212,137,30,0.2))',
            marginBottom: 40,
          }} />

          {/* Avatar + identity */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 40 }}>
            <Avatar profile={profile} size={88} />

            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              {/* Name */}
              <h1 style={{
                fontSize: 'clamp(22px, 5vw, 30px)',
                fontWeight: 800,
                color: '#f0e6d0',
                lineHeight: 1.2,
                margin: '0 0 6px',
                fontFamily: 'var(--font-arabic, serif)',
              }}>
                {profile.name}
              </h1>

              {/* Username */}
              {profile.username && (
                <p style={{
                  fontSize: 13, fontFamily: 'monospace',
                  color: 'rgba(212,137,30,0.6)',
                  margin: '0 0 12px',
                  letterSpacing: '0.04em',
                }}>
                  @{profile.username}
                </p>
              )}

              {/* Role + subject chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {/* Role */}
                <span style={{
                  fontSize: 11, fontFamily: 'monospace',
                  padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(212,137,30,0.1)',
                  border: '1px solid rgba(212,137,30,0.25)',
                  color: '#d4891e',
                  letterSpacing: '0.06em',
                }}>
                  {roleLabel.ar} · {roleLabel.en}
                </span>

                {/* Subject */}
                {subject && (
                  <span style={{
                    fontSize: 11, fontFamily: 'var(--font-arabic, serif)',
                    padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.5)',
                  }}>
                    {subject.nameAr}
                    {subject.nameEn && (
                      <span style={{ fontFamily: 'monospace', fontSize: 9, marginRight: 5, opacity: 0.6 }}>
                        {subject.nameEn}
                      </span>
                    )}
                  </span>
                )}

                {/* Join year */}
                {joinYear && (
                  <span style={{
                    fontSize: 11, fontFamily: 'monospace',
                    padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'rgba(255,255,255,0.25)',
                    letterSpacing: '0.04em',
                  }}>
                    منذ {joinYear}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{
              fontSize: 15, lineHeight: 1.8,
              color: 'rgba(255,255,255,0.5)',
              marginBottom: 40,
              fontFamily: 'var(--font-arabic, serif)',
              borderRight: '2px solid rgba(212,137,30,0.25)',
              paddingRight: 16,
            }}>
              {profile.bio}
            </p>
          )}

          {/* ── Divider ───────────────────────────────────────────── */}
          <div style={{
            height: 1, marginBottom: 32,
            background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)',
          }} />

          {/* ── Stats ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 40 }}>
            <p style={{
              fontSize: 10, fontFamily: 'monospace',
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              marginBottom: 16,
            }}>
              المساهمات · Contributions
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {stats.map((s, i) => (
                <StatCard
                  key={s.key}
                  icon={s.icon}
                  value={s.value}
                  labelAr={s.labelAr}
                  labelEn={s.labelEn}
                  delay={200 + i * 80}
                />
              ))}
            </div>
          </div>

          {/* ── Footer row ────────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            {/* Nafeer credit */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-arabic, serif)',
                color: 'rgba(212,137,30,0.5)',
              }}>نفير</span>
              <span style={{
                fontSize: 9, fontFamily: 'monospace',
                color: 'rgba(255,255,255,0.15)',
                letterSpacing: '0.14em',
              }}>CONTRIBUTOR</span>
            </div>

            <ShareBtn username={username} />
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
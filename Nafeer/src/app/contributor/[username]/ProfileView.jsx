'use client';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, BookOpen, Layers, Trophy, Rocket, GraduationCap, Landmark,
  MessageCircle, Eye, ShieldCheck, Clock, Hourglass, Flame, Crown, Star,
  Users, Award, CircleHelp, Globe2, Blocks, Pencil, FileText,
} from 'lucide-react';
import { SUBJECTS_CATALOG }              from '@/shared/curriculum';
import { getEarnedBadges, TIERS }        from '@/lib/contributorBadges';

const SUBJECT_MAP = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s]));

const ICONS = {
  Sparkles, BookOpen, Layers, Trophy, Rocket, GraduationCap, Landmark,
  MessageCircle, Eye, ShieldCheck, Clock, Hourglass, Flame, Crown, Star,
  Users, Award, CircleHelp, Globe2, Blocks, Pencil, FileText,
};

const ROLE_LABELS = {
  contributor: { ar: 'مساهم', en: 'Contributor' },
  admin:       { ar: 'مساهم', en: 'Contributor' }, // an admin-flagged Contributor still shows as a peer here
};

// ── Content stat definitions ──────────────────────────────────────────────────
const CONTENT_STATS = [
  { key: 'lessonsCreated',   labelAr: 'درس',       labelEn: 'Lessons',    icon: BookOpen },
  { key: 'questionsAdded',   labelAr: 'سؤال',      labelEn: 'Questions',  icon: CircleHelp },
  { key: 'feedItemsCreated', labelAr: 'بطاقة',     labelEn: 'Feed',       icon: Globe2 },
  { key: 'blocksAdded',      labelAr: 'وحدة محتوى', labelEn: 'Blocks',     icon: Blocks },
  { key: 'examsCreated',     labelAr: 'امتحان',    labelEn: 'Exams',      icon: FileText },
];

const IMPACT_STATS = [
  { key: 'publishedLessons', labelAr: 'منشور',    labelEn: 'Published',  icon: Rocket },
  { key: 'editsMade',        labelAr: 'تعديل',    labelEn: 'Edits',      icon: Pencil },
  { key: 'commentsPosted',   labelAr: 'تعليق',    labelEn: 'Comments',   icon: MessageCircle },
  { key: 'reviewsSubmitted', labelAr: 'مراجعة',   labelEn: 'Reviews',    icon: ShieldCheck },
];

const DAYS_AR = ['أحد', 'اثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

// ── Time formatting ───────────────────────────────────────────────────────────
function hoursValue(ms) {
  if (!ms) return 0;
  return ms / 3_600_000;
}
function formatHours(hours) {
  if (hours < 1) return { value: Math.round(hours * 60), suffix: 'د' };
  if (hours < 100) return { value: Math.round(hours * 10) / 10, suffix: 'س' };
  return { value: Math.round(hours), suffix: 'س' };
}

// ── Reveal-on-mount wrapper ───────────────────────────────────────────────────
// Numbers render with their real value on every pass — only opacity/position
// animate in. A requestAnimationFrame count-up looks nicer, but browsers throttle
// or fully pause rAF in background/inactive tabs, which would leave a real stat
// stuck showing 0 on a page people screenshot to show off their work. Not worth it.
function Reveal({ delay = 0, children, style = {} }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(10px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ profile, size }) {
  const initials = (profile?.name || 'م')
    .split(' ').slice(0, 2).map((w) => w[0]).join('');

  if (profile?.avatarUrl) {
    return (
      <Image
        src={profile.avatarUrl}
        alt={profile.name}
        width={size}
        height={size}
        priority
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

// ── Chip (generic hero-row pill) ──────────────────────────────────────────────
function Chip({ children, tone = 'neutral', mono = false }) {
  const tones = {
    neutral: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)' },
    subtle:  { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.1)',  color: 'rgba(255,255,255,0.5)' },
    accent:  { bg: 'rgba(212,137,30,0.1)',   border: 'rgba(212,137,30,0.25)',  color: '#d4891e' },
    violet:  { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.2)',  color: '#a78bfa' },
    gold:    { bg: 'rgba(231,189,74,0.1)',   border: 'rgba(231,189,74,0.28)',  color: '#e7bd4a' },
    ember:   { bg: 'rgba(224,102,62,0.1)',   border: 'rgba(224,102,62,0.28)',  color: '#e0663e' },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontFamily: mono ? 'monospace' : 'var(--font-arabic, serif)',
      padding: '4px 10px', borderRadius: 6,
      background: t.bg, border: `1px solid ${t.border}`, color: t.color,
      letterSpacing: mono ? '0.04em' : 0,
    }}>
      {children}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, value, labelAr, labelEn, delay }) {
  return (
    <Reveal delay={delay} style={{ flex: 1, minWidth: 96 }}>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '18px 12px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        height: '100%',
      }}>
        <Icon size={15} strokeWidth={1.8} color="rgba(212,137,30,0.75)" />
        <span style={{
          fontSize: 30, fontWeight: 800, fontFamily: 'monospace',
          color: '#e8d5a8', lineHeight: 1,
          letterSpacing: '-0.03em',
        }}>
          {(value || 0).toLocaleString('en-US')}
        </span>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontFamily: 'var(--font-arabic, serif)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>{labelAr}</p>
          <p style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)', marginTop: 2, letterSpacing: '0.06em' }}>{labelEn}</p>
        </div>
      </div>
    </Reveal>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children, count }) {
  return (
    <p style={{
      fontSize: 10, fontFamily: 'monospace',
      color: 'rgba(255,255,255,0.2)',
      letterSpacing: '0.14em', textTransform: 'uppercase',
      marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span>{children}</span>
      {count != null && (
        <span style={{
          fontSize: 9, padding: '1px 6px', borderRadius: 4,
          background: 'rgba(212,137,30,0.1)',
          border: '1px solid rgba(212,137,30,0.2)',
          color: '#d4891e',
          textTransform: 'none', letterSpacing: 0,
        }}>
          {count}
        </span>
      )}
    </p>
  );
}

// ── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, delay }) {
  const Icon = ICONS[badge.icon] || Award;
  const tier = TIERS[badge.tier] || TIERS.bronze;

  return (
    <Reveal delay={delay}>
      <div
        title={badge.descAr}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          padding: '16px 10px', borderRadius: 16, width: 108,
          background: `${tier.color}14`,
          border: `1px solid ${tier.color}40`,
          cursor: 'default',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${tier.color}22`,
          border: `1px solid ${tier.color}55`,
        }}>
          <Icon size={18} strokeWidth={1.8} color={tier.color} />
        </div>
        <p style={{
          margin: 0, fontSize: 11.5, fontWeight: 600, textAlign: 'center',
          color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-arabic, serif)',
          lineHeight: 1.3,
        }}>
          {badge.nameAr}
        </p>
        <span style={{
          fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.06em',
          color: tier.color, textTransform: 'uppercase', opacity: 0.85,
        }}>
          {tier.labelAr}
        </span>
      </div>
    </Reveal>
  );
}

// ── Activity heatmap (public, read-only) ──────────────────────────────────────
function ActivityHeatmap({ heatmap }) {
  const weeks = 20;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  const cells = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    cells.push({ date: d, key, count: heatmap[key] || 0 });
  }
  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  function cellColor(count) {
    if (!count) return 'rgba(255,255,255,0.04)';
    const t = Math.sqrt(count / maxCount);
    if (t < 0.25) return 'rgba(212,137,30,0.22)';
    if (t < 0.5)  return 'rgba(212,137,30,0.42)';
    if (t < 0.75) return 'rgba(212,137,30,0.68)';
    return '#d4891e';
  }

  const cols = [];
  for (let w = 0; w < weeks; w++) cols.push(cells.slice(w * 7, w * 7 + 7));

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, width: 'max-content' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0, paddingTop: 16 }}>
          {DAYS_AR.map((d) => (
            <div key={d} style={{ height: 9, fontSize: 7, color: 'rgba(255,255,255,0.25)', lineHeight: '9px', fontFamily: 'var(--font-arabic, serif)' }}>
              {d}
            </div>
          ))}
        </div>
        {cols.map((week, wi) => {
          const firstDay = week[0]?.date;
          const showMonth = firstDay && (firstDay.getDate() <= 7 || wi === 0);
          return (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
              <div style={{ height: 12, fontSize: 7, color: 'rgba(255,255,255,0.25)', whiteSpace: 'nowrap', fontFamily: 'var(--font-arabic, serif)' }}>
                {showMonth ? firstDay.toLocaleDateString('ar-EG', { month: 'short' }) : ''}
              </div>
              {week.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.key} · ${cell.count} نشاط`}
                  style={{ width: 9, height: 9, borderRadius: 2, background: cellColor(cell.count) }}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Team badge ─────────────────────────────────────────────────────────────────
function TeamBadge({ team, teamRole, delay }) {
  const isLeader = teamRole === 'leader';
  return (
    <Reveal delay={delay}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', borderRadius: 14,
        background: isLeader ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.03)',
        border: isLeader ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: isLeader ? '0 2px 16px rgba(167,139,250,0.08)' : 'none',
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isLeader ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.05)',
          border: isLeader ? '1px solid rgba(167,139,250,0.25)' : '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}>
          <Users size={14} strokeWidth={1.8} color={isLeader ? '#a78bfa' : 'rgba(255,255,255,0.3)'} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-arabic, serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {team.name}
          </p>
          {team.description && (
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-arabic, serif)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {team.description}
            </p>
          )}
        </div>
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-arabic, serif)', padding: '3px 10px', borderRadius: 20,
          background: isLeader ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)',
          border: isLeader ? '1px solid rgba(167,139,250,0.3)' : '1px solid rgba(255,255,255,0.08)',
          color: isLeader ? '#a78bfa' : 'rgba(255,255,255,0.3)', flexShrink: 0,
          fontWeight: isLeader ? 600 : 400,
        }}>
          {isLeader ? 'قائد الفريق' : 'عضو'}
        </span>
      </div>
    </Reveal>
  );
}

// ── Share button ──────────────────────────────────────────────────────────────
function ShareBtn() {
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

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileView({ profile }) {
  const [activity,    setActivity]    = useState(null); // rich payload from /activity?username=
  const [teams,       setTeams]       = useState([]);
  const [heroVisible, setHeroVisible] = useState(false);

  const username = profile.username;

  useEffect(() => {
    if (!username) return;
    const q = encodeURIComponent(username);

    fetch(`/api/contributors/activity?username=${q}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setActivity(d.activity); })
      .catch(() => {});

    fetch(`/api/contributors/teams?username=${q}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok && d.teams) setTeams(d.teams); })
      .catch(() => {});

    const t = setTimeout(() => setHeroVisible(true), 60);
    return () => clearTimeout(t);
  }, [username]);

  // Stats: prefer the fresh /activity read, fall back to the SSR snapshot so
  // the page never shows blank cards while the client fetch is in flight.
  const stats = activity?.stats || profile.stats || {};

  const isTeamLeader = teams.some((m) => m.teamRole === 'leader');
  const badges = useMemo(() => getEarnedBadges(stats, {
    streakDays:   activity?.streakDays,
    tenureDays:   activity?.tenureDays ?? (profile.createdAt ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / 86400000) : 0),
    joinRank:     activity?.joinRank,
    isTeamLeader,
  }), [stats, activity, isTeamLeader, profile.createdAt]);

  const subject   = SUBJECT_MAP[profile.subject];
  const roleLabel = ROLE_LABELS[profile.role] || ROLE_LABELS.contributor;
  const joinYear  = profile.createdAt ? new Date(profile.createdAt).getFullYear() : null;

  const totalContent = CONTENT_STATS.reduce((sum, s) => sum + (stats[s.key] || 0), 0);
  const hasAnyStats  = totalContent > 0 || Object.values(IMPACT_STATS).some((s) => stats[s.key] > 0) || (stats.totalTimeMs || 0) > 0;

  const timeVal = formatHours(hoursValue(stats.totalTimeMs));

  const showRank = activity?.rank && activity.totalContributors >= 5;
  const percentile = showRank ? Math.max(1, Math.round((activity.rank / activity.totalContributors) * 100)) : null;

  return (
    <div dir="rtl" style={{
      minHeight: '100vh',
      background: '#080704',
      fontFamily: 'var(--font-arabic, serif)',
      overflowX: 'hidden',
    }}>

      {/* ── Ambient background ── */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 60% -10%, rgba(212,137,30,0.09) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '40vh',
        pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 100% 80% at 50% 120%, rgba(212,137,30,0.05) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.025,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '128px 128px',
      }} />

      {/* ── Main content ── */}
      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 680, margin: '0 auto',
        padding: '64px 24px 80px',
      }}>

        <div style={{
          opacity: heroVisible ? 1 : 0,
          transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease, transform 0.6s ease',
        }}>

          <div style={{
            width: 40, height: 3, borderRadius: 2,
            background: 'linear-gradient(90deg, #d4891e, rgba(212,137,30,0.2))',
            marginBottom: 40,
          }} />

          {/* ── Identity ── */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 28 }}>
            <Avatar profile={profile} size={88} />

            <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{
                  fontSize: 'clamp(22px, 5vw, 30px)', fontWeight: 800, color: '#f0e6d0',
                  lineHeight: 1.2, margin: '0 0 6px', fontFamily: 'var(--font-arabic, serif)',
                }}>
                  {profile.name}
                </h1>
                {badges.some((b) => b.id === 'founding') && (
                  <Crown size={18} strokeWidth={2} color="#a78bfa" style={{ marginBottom: 8 }} />
                )}
              </div>

              {profile.username && (
                <p style={{ fontSize: 13, fontFamily: 'monospace', color: 'rgba(212,137,30,0.6)', margin: '0 0 12px', letterSpacing: '0.04em' }}>
                  @{profile.username}
                </p>
              )}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Chip tone="accent" mono>{roleLabel.ar} · {roleLabel.en}</Chip>

                {subject && (
                  <Chip tone="subtle">
                    {subject.nameAr}
                    {subject.nameEn && <span style={{ fontFamily: 'monospace', fontSize: 9, marginRight: 5, opacity: 0.6 }}>{subject.nameEn}</span>}
                  </Chip>
                )}

                {joinYear && <Chip mono>منذ {joinYear}</Chip>}

                {isTeamLeader && <Chip tone="violet">⬡ قائد فريق</Chip>}

                {activity?.streakDays > 0 && (
                  <Chip tone="ember">🔥 {activity.streakDays} يوم متواصل</Chip>
                )}

                {showRank && (
                  <Chip tone="gold" mono>
                    #{activity.rank} من {activity.totalContributors}
                    {percentile <= 20 ? ` · أفضل ${percentile}%` : ''}
                  </Chip>
                )}

                {teams.length > 0 && (
                  <Chip tone="violet">
                    <span style={{ fontFamily: 'monospace', fontSize: 9 }}>⬡</span>
                    {teams.length === 1 ? teams[0].team.name : `${teams.length} فرق`}
                  </Chip>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p style={{
              fontSize: 15, lineHeight: 1.8, color: 'rgba(255,255,255,0.5)', marginBottom: 36,
              fontFamily: 'var(--font-arabic, serif)',
              borderRight: '2px solid rgba(212,137,30,0.25)', paddingRight: 16,
            }}>
              {profile.bio}
            </p>
          )}

          <div style={{ height: 1, marginBottom: 32, background: 'linear-gradient(90deg, rgba(255,255,255,0.07), transparent)' }} />

          {hasAnyStats ? (
            <>
              {/* ── Badge shelf ── */}
              {badges.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <SectionLabel count={badges.length}>الأوسمة · Badges</SectionLabel>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {badges.map((b, i) => (
                      <BadgeCard key={b.id} badge={b} delay={80 + i * 40} />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Content stats ── */}
              <div style={{ marginBottom: 28 }}>
                <SectionLabel>المحتوى · Content</SectionLabel>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {CONTENT_STATS.map((s, i) => (
                    <StatCard key={s.key} icon={s.icon} value={stats[s.key]} labelAr={s.labelAr} labelEn={s.labelEn} delay={200 + i * 60} />
                  ))}
                </div>
              </div>

              {/* ── Impact / community stats ── */}
              <div style={{ marginBottom: 40 }}>
                <SectionLabel>الأثر والمجتمع · Impact</SectionLabel>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {IMPACT_STATS.map((s, i) => (
                    <StatCard key={s.key} icon={s.icon} value={stats[s.key]} labelAr={s.labelAr} labelEn={s.labelEn} delay={260 + i * 60} />
                  ))}
                  <Reveal delay={500} style={{ flex: 1, minWidth: 96 }}>
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '18px 12px', borderRadius: 16,
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                      height: '100%',
                    }}>
                      <Clock size={15} strokeWidth={1.8} color="rgba(212,137,30,0.75)" />
                      <span style={{ fontSize: 30, fontWeight: 800, fontFamily: 'monospace', color: '#e8d5a8', lineHeight: 1, letterSpacing: '-0.03em' }}>
                        {timeVal.value}<span style={{ fontSize: 14 }}>{timeVal.suffix}</span>
                      </span>
                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 12, fontFamily: 'var(--font-arabic, serif)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.3 }}>وقت مستثمر</p>
                        <p style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.18)', marginTop: 2, letterSpacing: '0.06em' }}>Time invested</p>
                      </div>
                    </div>
                  </Reveal>
                </div>
              </div>

              {/* ── Activity heatmap ── */}
              {activity?.heatmap && Object.keys(activity.heatmap).length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <SectionLabel>النشاط · Activity</SectionLabel>
                  <div style={{ padding: '18px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <ActivityHeatmap heatmap={activity.heatmap} />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{
              padding: '32px 20px', borderRadius: 16, textAlign: 'center', marginBottom: 40,
              border: '1px dashed rgba(255,255,255,0.1)',
            }}>
              <Sparkles size={22} strokeWidth={1.6} color="rgba(212,137,30,0.5)" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-arabic, serif)' }}>
                رحلة المساهمة على وشك أن تبدأ — أول مساهمة ستظهر هنا.
              </p>
            </div>
          )}

          {/* ── Teams ── */}
          {teams.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <SectionLabel count={teams.length}>الفرق · Teams</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {teams.map((membership, i) => (
                  <TeamBadge key={membership.team._id || i} team={membership.team} teamRole={membership.teamRole} delay={350 + i * 80} />
                ))}
              </div>
            </div>
          )}

          {/* Footer row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-arabic, serif)', color: 'rgba(212,137,30,0.5)' }}>نفير</span>
              <span style={{ fontSize: 9, fontFamily: 'monospace', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.14em' }}>CONTRIBUTOR</span>
            </div>
            <ShareBtn />
          </div>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}

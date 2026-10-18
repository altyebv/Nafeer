'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import {
  Sparkles, BookOpen, Layers, Trophy, Rocket, GraduationCap, Landmark,
  MessageCircle, Eye, ShieldCheck, Clock, Hourglass, Flame, Crown, Star,
  Users, Award, CircleHelp, Globe2, Blocks, Pencil, FileText, Share2, Check,
} from 'lucide-react';
import { SUBJECTS_CATALOG }              from '@/shared/curriculum';
import { getEarnedBadges, TIERS }        from '@/lib/contributorBadges';
import { ActivityGraph, Badge, Button, Card, EmptyState, Stat, cx } from '@/components/ui';

// ─── /contributor/[username] ─────────────────────────────────────────────────
// DS3: the public profile on role tokens and the shared Card/Stat/Badge. It
// follows the site theme now (it used to be drawn dark-only), so the activity
// graph no longer needs its own dark island.

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

// Badge tiers onto status tones — each tier still says its name in words.
const TIER_TONE = {
  bronze:  { card: 'bg-accent-wash border-line-accent',          icon: 'text-fg-accent' },
  silver:  { card: 'bg-sunken border-line-strong',               icon: 'text-fg-muted' },
  gold:    { card: 'bg-warn-surface border-warn-border',         icon: 'text-warn' },
  special: { card: 'bg-special-surface border-special-border',   icon: 'text-special' },
};

// ── Content stat definitions ──────────────────────────────────────────────────
const CONTENT_STATS = [
  { key: 'lessonsCreated',   labelAr: 'درس',       icon: BookOpen },
  { key: 'questionsAdded',   labelAr: 'سؤال',      icon: CircleHelp },
  { key: 'feedItemsCreated', labelAr: 'بطاقة',     icon: Globe2 },
  { key: 'blocksAdded',      labelAr: 'وحدة محتوى', icon: Blocks },
  { key: 'examsCreated',     labelAr: 'امتحان',    icon: FileText },
];

const IMPACT_STATS = [
  { key: 'publishedLessons', labelAr: 'منشور',    icon: Rocket },
  { key: 'editsMade',        labelAr: 'تعديل',    icon: Pencil },
  { key: 'commentsPosted',   labelAr: 'تعليق',    icon: MessageCircle },
  { key: 'reviewsSubmitted', labelAr: 'مراجعة',   icon: ShieldCheck },
];

// ── Time formatting ───────────────────────────────────────────────────────────
function formatHours(ms) {
  const hours = (ms || 0) / 3_600_000;
  if (hours < 1) return `${Math.round(hours * 60)} د`;
  if (hours < 100) return `${Math.round(hours * 10) / 10} س`;
  return `${Math.round(hours)} س`;
}

// ── Reveal-on-mount wrapper ───────────────────────────────────────────────────
// Numbers render with their real value on every pass — only opacity/position
// animate in. A requestAnimationFrame count-up looks nicer, but browsers throttle
// or fully pause rAF in background/inactive tabs, which would leave a real stat
// stuck showing 0 on a page people screenshot to show off their work. Not worth it.
const DELAY = ['', 'delay-75', 'delay-100', 'delay-150', 'delay-200', 'delay-300', 'delay-500', 'delay-700'];

function Reveal({ step = 0, as: Comp = 'div', className, children }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);
  return (
    <Comp className={cx(
      'transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none',
      DELAY[Math.min(step, DELAY.length - 1)],
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2.5',
      className,
    )}>
      {children}
    </Comp>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ profile }) {
  const initials = (profile?.name || 'م')
    .split(' ').slice(0, 2).map((w) => w[0]).join('');
  const ring = 'w-20 h-20 shrink-0 rounded-full border-2 border-line-accent ring-4 ring-accent-wash';

  if (profile?.avatarUrl) {
    return <Image src={profile.avatarUrl} alt={profile.name} width={88} height={88} priority className={cx(ring, 'object-cover')} />;
  }
  return (
    <div aria-hidden="true" className={cx(ring, 'bg-accent text-fg-on-accent flex items-center justify-center t-h2')}>
      {initials}
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, count, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 t-label text-fg-muted">
        <span>{title}</span>
        {count != null && <Badge tone="accent" size="sm">{count}</Badge>}
      </h2>
      {children}
    </section>
  );
}

// ── Badge card ────────────────────────────────────────────────────────────────
function BadgeCard({ badge, step }) {
  const Icon = ICONS[badge.icon] || Award;
  const tier = TIERS[badge.tier] || TIERS.bronze;
  const tone = TIER_TONE[badge.tier] || TIER_TONE.bronze;
  return (
    <Reveal as="li" step={step}>
      <div title={badge.descAr}
        className={cx('w-28 h-full flex flex-col items-center gap-2 px-2.5 py-4 rounded-card border text-center transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none', tone.card)}>
        <span className="w-10 h-10 rounded-full bg-raised border border-line flex items-center justify-center">
          <Icon size={18} strokeWidth={1.8} className={tone.icon} aria-hidden="true" />
        </span>
        <p className="t-label text-fg-strong leading-snug">{badge.nameAr}</p>
        <span className={cx('t-caption', tone.icon)}>{tier.labelAr}</span>
      </div>
    </Reveal>
  );
}

// ── Team row ──────────────────────────────────────────────────────────────────
function TeamRow({ team, teamRole, step }) {
  const isLeader = teamRole === 'leader';
  return (
    <Reveal as="li" step={step}>
      <Card padding="sm" tone={isLeader ? 'accent' : 'raised'} className="flex items-center gap-3 px-4">
        <span className={cx('w-9 h-9 rounded-full flex items-center justify-center shrink-0 border',
          isLeader ? 'bg-special-surface border-special-border text-special' : 'bg-sunken border-line text-fg-subtle')}>
          <Users size={14} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="t-label text-fg-strong truncate">{team.name}</p>
          {team.description && <p className="t-caption text-fg-subtle truncate">{team.description}</p>}
        </div>
        <Badge tone={isLeader ? 'special' : 'neutral'} size="sm">{isLeader ? 'قائد الفريق' : 'عضو'}</Badge>
      </Card>
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
    <Button variant="secondary" size="sm" icon={copied ? Check : Share2} onClick={copy}
      className={copied ? 'text-success border-success-border' : undefined}>
      <span role="status">{copied ? 'تم النسخ' : 'مشاركة الملف'}</span>
    </Button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ProfileView({ profile }) {
  const [activity, setActivity] = useState(null); // rich payload from /activity?username=
  const [teams,    setTeams]    = useState([]);

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
  const hasAnyStats  = totalContent > 0 || IMPACT_STATS.some((s) => stats[s.key] > 0) || (stats.totalTimeMs || 0) > 0;

  const showRank = activity?.rank && activity.totalContributors >= 5;
  const percentile = showRank ? Math.max(1, Math.round((activity.rank / activity.totalContributors) * 100)) : null;

  return (
    <div dir="rtl" className="min-h-screen bg-page text-fg font-ui overflow-x-hidden">
      <main className="max-w-2xl mx-auto px-6 pt-16 pb-20">
        <Reveal className="flex flex-col gap-10">

          <div className="flex flex-col gap-7">
            <div aria-hidden="true" className="w-10 h-0.5 rounded-chip bg-accent" />

            {/* ── Identity ── */}
            <div className="flex items-start gap-5 sm:gap-7">
              <Avatar profile={profile} />

              <div className="flex-1 min-w-0 pt-1 flex flex-col gap-3">
                <div>
                  <h1 className="t-h1 text-fg-strong flex items-center gap-2 flex-wrap">
                    {profile.name}
                    {badges.some((b) => b.id === 'founding') && (
                      <Crown size={18} strokeWidth={2} className="text-special" aria-label="مساهم مؤسس" />
                    )}
                  </h1>
                  {profile.username && (
                    <p dir="ltr" className="t-label font-normal text-fg-accent text-right">@{profile.username}</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge tone="accent">{roleLabel.ar}</Badge>
                  {subject && <Badge>{subject.nameAr}</Badge>}
                  {joinYear && <Badge>منذ {joinYear}</Badge>}
                  {isTeamLeader && <Badge tone="special">قائد فريق</Badge>}
                  {activity?.streakDays > 0 && (
                    <Badge tone="warn" icon={Flame}>{activity.streakDays} يوم متواصل</Badge>
                  )}
                  {showRank && (
                    <Badge tone="warn" icon={Trophy}>
                      #{activity.rank} من {activity.totalContributors}
                      {percentile <= 20 ? ` · أفضل ${percentile}%` : ''}
                    </Badge>
                  )}
                  {teams.length > 0 && (
                    <Badge tone="special" icon={Users}>
                      {teams.length === 1 ? teams[0].team.name : `${teams.length} فرق`}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {profile.bio && (
              <p className="read t-body leading-loose text-fg-muted border-r-2 border-line-accent pr-4">
                {profile.bio}
              </p>
            )}
          </div>

          <div aria-hidden="true" className="h-px bg-line" />

          {hasAnyStats ? (
            <>
              {/* ── Badge shelf ── */}
              {badges.length > 0 && (
                <Section title="الأوسمة" count={badges.length}>
                  <ul className="flex flex-wrap gap-2.5">
                    {badges.map((b, i) => <BadgeCard key={b.id} badge={b} step={1 + i} />)}
                  </ul>
                </Section>
              )}

              {/* ── Content stats ── */}
              <Section title="المحتوى">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {CONTENT_STATS.map((s, i) => (
                    <Reveal key={s.key} step={2 + i}>
                      <Stat icon={s.icon} value={stats[s.key] || 0} label={s.labelAr} tone="raised" className="h-full items-center text-center" />
                    </Reveal>
                  ))}
                </div>
              </Section>

              {/* ── Impact / community stats ── */}
              <Section title="الأثر والمجتمع">
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {IMPACT_STATS.map((s, i) => (
                    <Reveal key={s.key} step={3 + i}>
                      <Stat icon={s.icon} value={stats[s.key] || 0} label={s.labelAr} tone="raised" className="h-full items-center text-center" />
                    </Reveal>
                  ))}
                  <Reveal step={7}>
                    <Stat icon={Clock} value={formatHours(stats.totalTimeMs)} label="وقت مستثمر" tone="raised" className="h-full items-center text-center" />
                  </Reveal>
                </div>
              </Section>

              {/* ── Activity ── */}
              {activity?.summary?.activeDays > 0 && (
                <Section title="النشاط">
                  <Card>
                    <ActivityGraph days={activity.days} summary={activity.summary} weeks={20} showSummary={false} />
                  </Card>
                </Section>
              )}
            </>
          ) : (
            <EmptyState icon={Sparkles} title="رحلة المساهمة على وشك أن تبدأ — أول مساهمة ستظهر هنا." />
          )}

          {/* ── Teams ── */}
          {teams.length > 0 && (
            <Section title="الفرق" count={teams.length}>
              <ul className="flex flex-col gap-2.5">
                {teams.map((membership, i) => (
                  <TeamRow key={membership.team._id || i} team={membership.team} teamRole={membership.teamRole} step={4 + i} />
                ))}
              </ul>
            </Section>
          )}

          {/* Footer row */}
          <footer className="flex items-center justify-between flex-wrap gap-3 pt-6 border-t border-line">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="t-title text-fg-accent">نفير</span>
              <span className="t-caption text-fg-subtle">مساهم</span>
            </Link>
            <ShareBtn />
          </footer>
        </Reveal>
      </main>
    </div>
  );
}

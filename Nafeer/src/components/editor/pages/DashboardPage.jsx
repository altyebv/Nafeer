'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Blocks, BookOpen, Circle, CircleHelp, ExternalLink, Globe2, Search, Sparkles, TriangleAlert } from 'lucide-react';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

const SUBJECT_MAP = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s]));

// ─── Announcement type config ─────────────────────────────────────────────────
const ANNOUNCEMENT_STYLES = {
  info:      { icon: Circle, color: '#6b9fd4', bg: 'rgba(107,159,212,0.07)', border: 'rgba(107,159,212,0.2)'  },
  update:    { icon: Sparkles, color: '#d4891e', bg: 'rgba(212,137,30,0.07)',  border: 'rgba(212,137,30,0.2)'   },
  warning:   { icon: TriangleAlert, color: '#d4726b', bg: 'rgba(212,114,107,0.07)', border: 'rgba(212,114,107,0.2)'  },
  urgent:    { icon: TriangleAlert, color: '#d4726b', bg: 'rgba(212,114,107,0.07)', border: 'rgba(212,114,107,0.2)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(dateStr) {
  if (!dateStr) return '';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 2)  return 'الآن';
  if (mins  < 60) return `منذ ${mins} دقيقة`;
  if (hours < 24) return `منذ ${hours} ساعة`;
  if (days  < 30) return `منذ ${days} يوم`;
  return new Date(dateStr).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
}

function joinedLabel(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('ar-EG', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  const raf               = useRef(null);

  useEffect(() => {
    if (!target) { setValue(0); return; }
    const start  = performance.now();
    const step   = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out-expo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setValue(Math.round(ease * target));
      if (progress < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);

  return value;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p
      className="text-[10px] font-mono uppercase tracking-widest mb-4 select-none"
      style={{ color: 'var(--text-muted)', opacity: 0.6 }}
    >
      {children}
    </p>
  );
}

function StatCard({ icon, value, label, delay = 0 }) {
  const animated = useCountUp(value, 900);
  const Icon = icon;
  return (
    <div
      className="flex flex-col gap-2 p-4 rounded-2xl transition-all duration-300"
      style={{
        background:  'var(--bg-card)',
        border:      '1px solid var(--border-subtle)',
        animationDelay: `${delay}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border      = '1px solid rgba(212,137,30,0.25)';
        e.currentTarget.style.background  = 'rgba(212,137,30,0.04)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border     = '1px solid var(--border-subtle)';
        e.currentTarget.style.background = 'var(--bg-card)';
      }}
    >
      <Icon size={22} strokeWidth={1.8} style={{ color: 'var(--accent)' }} />
      <span
        className="text-3xl font-bold font-mono tabular-nums leading-none"
        style={{ color: 'var(--accent)' }}
      >
        {animated.toLocaleString('ar-EG')}
      </span>
      <span
        className="text-xs font-arabic leading-snug"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Contribution heatmap ─────────────────────────────────────────────────────
// Renders 16 weeks × 7 days. Accepts activityMap: { 'YYYY-MM-DD': count }.
// Zero-filled when data is loading or not yet available.

const DAYS_AR = ['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'];

function ContributionHeatmap({ activityMap = {} }) {
  const weeks = 16;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build grid: newest day is bottom-right
  const cells = [];
  // Start from (weeks * 7) days ago, aligned to Sunday
  const totalDays = weeks * 7;
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (totalDays - 1));

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const key   = d.toISOString().slice(0, 10);
    const count = activityMap[key] || 0;
    cells.push({ date: d, key, count, dayOfWeek: d.getDay() });
  }

  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  function cellColor(count) {
    if (!count) return 'rgba(255,255,255,0.04)';
    const t = Math.sqrt(count / maxCount); // sqrt for visual balance
    if (t < 0.25) return 'rgba(212,137,30,0.2)';
    if (t < 0.5)  return 'rgba(212,137,30,0.4)';
    if (t < 0.75) return 'rgba(212,137,30,0.65)';
    return '#d4891e';
  }

  // Group into columns (weeks)
  const cols = [];
  for (let w = 0; w < weeks; w++) {
    cols.push(cells.slice(w * 7, w * 7 + 7));
  }

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {/* Day labels column */}
        <div className="flex flex-col gap-1 shrink-0 pt-5">
          {DAYS_AR.map((d) => (
            <div
              key={d}
              style={{ height: 10, fontSize: 8, color: 'var(--text-muted)', opacity: 0.5, lineHeight: '10px', fontFamily: 'var(--font-arabic, serif)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {cols.map((week, wi) => {
          // Month label on first week of month
          const firstDay    = week[0]?.date;
          const showMonth   = firstDay && (firstDay.getDate() <= 7 || wi === 0);
          const monthLabel  = firstDay?.toLocaleDateString('ar-EG', { month: 'short' });

          return (
            <div key={wi} className="flex flex-col gap-1 shrink-0">
              {/* Month label */}
              <div
                style={{
                  height: 14, fontSize: 8,
                  color: showMonth ? 'var(--text-muted)' : 'transparent',
                  opacity: 0.5,
                  fontFamily: 'var(--font-arabic, serif)',
                  whiteSpace: 'nowrap',
                  lineHeight: '14px',
                }}
              >
                {showMonth ? monthLabel : ''}
              </div>

              {week.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.key}: ${cell.count} إجراء`}
                  style={{
                    width:         10,
                    height:        10,
                    borderRadius:  2,
                    background:    cellColor(cell.count),
                    transition:    'transform 0.15s, background 0.2s',
                    cursor:        cell.count ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3">
        <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.5, fontFamily: 'var(--font-arabic, serif)' }}>أقل</span>
        {[0, 0.2, 0.45, 0.7, 1].map((t) => (
          <div
            key={t}
            style={{
              width: 10, height: 10, borderRadius: 2,
              background: t === 0
                ? 'rgba(255,255,255,0.04)'
                : `rgba(212,137,30,${t})`,
            }}
          />
        ))}
        <span style={{ fontSize: 9, color: 'var(--text-muted)', opacity: 0.5, fontFamily: 'var(--font-arabic, serif)' }}>أكثر</span>
      </div>
    </div>
  );
}

// ─── Announcement card ────────────────────────────────────────────────────────
function AnnouncementCard({ announcement }) {
  const [expanded, setExpanded] = useState(false);
  const style = ANNOUNCEMENT_STYLES[announcement.type] || ANNOUNCEMENT_STYLES.info;
  const Icon = style.icon;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background:  style.bg,
        border:      `1px solid ${style.border}`,
      }}
    >
      <button
        className="w-full text-right flex items-start gap-3 p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <Icon size={15} strokeWidth={1.8} style={{ color: style.color, marginTop: 1, flexShrink: 0 }} />

        {/* Content */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {announcement.pinned && (
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{ background: 'rgba(212,137,30,0.15)', color: 'var(--accent)' }}
              >
                مثبّت
              </span>
            )}
            <span
              className="font-arabic font-semibold text-sm leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {announcement.title}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {announcement.authorName}
            </span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.5 }}>·</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
              {relativeTime(announcement.createdAt)}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <span
          className="shrink-0 transition-transform duration-200"
          style={{
            color:     'var(--text-muted)',
            opacity:   0.4,
            fontSize:  10,
            marginTop: 4,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ‹
        </span>
      </button>

      {/* Expanded body */}
      {expanded && (
        <div
          className="px-4 pb-4 font-arabic text-sm leading-loose"
          style={{
            color:      'var(--text-secondary)',
            borderTop:  `1px solid ${style.border}`,
            paddingTop: 12,
          }}
        >
          {announcement.body}
        </div>
      )}
    </div>
  );
}

// ─── Empty announcements ──────────────────────────────────────────────────────
function EmptyAnnouncements() {
  return (
    <div
      className="rounded-xl p-8 text-center"
      style={{ border: '1px dashed var(--border-subtle)' }}
    >
      <Circle size={26} strokeWidth={1.5} className="mx-auto mb-2 opacity-20" />
      <p className="text-xs font-arabic" style={{ color: 'var(--text-muted)' }}>
        لا توجد إعلانات حالياً
      </p>
    </div>
  );
}

// ─── Welcome hero ─────────────────────────────────────────────────────────────
function WelcomeHero({ contributor, isFirstVisit }) {
  const subject     = contributor.subject ? SUBJECT_MAP[contributor.subject] : null;
  const initials    = (contributor.name || 'م').split(' ').slice(0, 2).map((w) => w[0]).join('');
  const greeting    = getGreeting();

  function getGreeting() {
    const h = new Date().getHours();
    if (h < 5)  return 'تصحى على خير';
    if (h < 12) return 'صباح الخير';
    if (h < 17) return 'مساء الخير';
    return 'مساء الخير';
  }

  return (
    <div
      className="relative rounded-3xl overflow-hidden p-7 sm:p-9 mb-6"
      style={{
        background: 'var(--bg-card)',
        border:     '1px solid rgba(212,137,30,0.18)',
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 60% at 80% -10%, rgba(212,137,30,0.07) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex items-center gap-6">
        {/* Avatar */}
        {contributor.avatarUrl ? (
          <img
            src={contributor.avatarUrl}
            alt={contributor.name}
            className="rounded-full object-cover shrink-0"
            style={{ width: 60, height: 60, border: '2px solid rgba(212,137,30,0.4)' }}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center font-bold shrink-0 text-lg"
            style={{
              width:      60,
              height:     60,
              background: 'linear-gradient(135deg, rgba(212,137,30,0.9) 0%, rgba(146,79,18,0.6) 100%)',
              color:      '#0e0c09',
              border:     '2px solid rgba(212,137,30,0.3)',
            }}
          >
            {initials}
          </div>
        )}

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-mono mb-1"
            style={{ color: 'var(--text-muted)', opacity: 0.6 }}
          >
            {greeting}،
          </p>
          <h1
            className="text-xl sm:text-2xl font-arabic font-bold leading-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {contributor.name}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            {subject && (
              <span
                className="text-xs font-arabic px-2.5 py-1 rounded-full"
                style={{
                  background: 'rgba(212,137,30,0.1)',
                  border:     '1px solid rgba(212,137,30,0.25)',
                  color:      'var(--accent)',
                }}
              >
                {subject.nameAr}
              </span>
            )}
            <span
              className="text-xs font-arabic px-2.5 py-1 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border:     '1px solid var(--border-subtle)',
                color:      'var(--text-muted)',
              }}
            >
              مساهم
            </span>
            {contributor.createdAt && (
              <span
                className="text-xs font-arabic"
                style={{ color: 'var(--text-muted)', opacity: 0.5 }}
              >
                · انضم {joinedLabel(contributor.createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Profile link */}
        {contributor.username && (
          <a
            href={`/contributors/${contributor.username}`}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 hidden sm:flex items-center gap-1.5 text-xs font-arabic px-3 py-2 rounded-xl transition-all duration-200"
            style={{
              background: 'rgba(212,137,30,0.08)',
              border:     '1px solid rgba(212,137,30,0.2)',
              color:      'var(--accent)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(212,137,30,0.08)'; }}
          >
            <ExternalLink size={13} strokeWidth={1.9} />
            <span>ملفي الشخصي</span>
          </a>
        )}
      </div>

      {/* First-visit welcome banner */}
      {isFirstVisit && (
        <div
          className="relative mt-6 p-4 rounded-2xl font-arabic text-sm leading-loose"
          style={{
            background: 'rgba(212,137,30,0.06)',
            border:     '1px solid rgba(212,137,30,0.15)',
            color:      'var(--text-secondary)',
          }}
        >
          <Sparkles size={15} strokeWidth={1.8} style={{ color: 'var(--accent)', marginLeft: 6, display: 'inline' }} />
          أهلاً وسهلاً بك في نفير! هذه لوحتك الشخصية — ستجد هنا إحصائياتك، إعلانات الإدارة، وكل ما يخصّك.
          ابدأ بالتنقل في القائمة الجانبية لاكتشاف الأدوات.
        </div>
      )}
    </div>
  );
}

// ─── Impact summary ───────────────────────────────────────────────────────────
function ImpactBar({ stats }) {
  const total = (stats.lessonsCreated   || 0)
              + (stats.questionsAdded   || 0)
              + (stats.feedItemsCreated || 0)
              + (stats.blocksAdded      || 0);

  const published = stats.publishedLessons || 0;
  const totalCount = useCountUp(total);
  const pubCount   = useCountUp(published);

  if (!total && !published) return null;

  return (
    <div
      className="flex items-center justify-between flex-wrap gap-4 px-6 py-4 rounded-2xl mb-6"
      style={{
        background: 'rgba(212,137,30,0.04)',
        border:     '1px solid rgba(212,137,30,0.12)',
      }}
    >
      <div>
        <p className="text-xs font-arabic mb-0.5" style={{ color: 'var(--text-muted)' }}>
          مجموع المساهمات
        </p>
        <p
          className="text-3xl font-bold font-mono tabular-nums"
          style={{ color: 'var(--accent)' }}
        >
          {totalCount.toLocaleString('ar-EG')}
        </p>
      </div>
      {published > 0 && (
        <div className="text-left">
          <p className="text-xs font-arabic mb-0.5" style={{ color: 'var(--text-muted)' }}>
            دروس منشورة في بشير
          </p>
          <p
            className="text-3xl font-bold font-mono tabular-nums"
            style={{ color: '#7db87d' }}
          >
            {pubCount.toLocaleString('ar-EG')}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export default function DashboardPage({ contributor }) {
  const [announcements,  setAnnouncements]  = useState([]);
  const [annoLoading,    setAnnoLoading]    = useState(true);
  const [activityMap,    setActivityMap]    = useState({});
  // "first visit" flag — shown once per session via sessionStorage
  const [isFirstVisit,   setIsFirstVisit]   = useState(false);

  useEffect(() => {
    const key = 'nafeer-dashboard-visited';
    if (!sessionStorage.getItem(key)) {
      setIsFirstVisit(true);
      sessionStorage.setItem(key, '1');
    }
  }, []);

  // Fetch announcements
  useEffect(() => {
    fetch('/api/contributors/announcements')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setAnnouncements(d.data); })
      .catch(() => {})
      .finally(() => setAnnoLoading(false));
  }, []);

  // Fetch activity heatmap data
  // Wire up: GET /api/contributors/activity returns { ok, data: { 'YYYY-MM-DD': count } }
  useEffect(() => {
    fetch('/api/contributors/activity')
      .then((r) => r.json())
      .then((d) => { if (d.ok) setActivityMap(d.data); })
      .catch(() => {}); // fails silently — heatmap shows empty grid until endpoint exists
  }, []);

  const stats = contributor?.stats || {};

  return (
    <div
      className="max-w-4xl mx-auto py-6 px-1"
      dir="rtl"
      style={{ color: 'var(--text-primary)' }}
    >
      {/* ── Welcome hero ── */}
      <WelcomeHero contributor={contributor} isFirstVisit={isFirstVisit} />

      {/* ── Impact bar ── */}
      <ImpactBar stats={stats} />

      {/* ── Stats grid ── */}
      <div className="mb-8">
        <SectionLabel>إحصائياتك</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={BookOpen} value={stats.lessonsCreated   || 0} label="درس أنشأته"     delay={0}   />
          <StatCard icon={CircleHelp} value={stats.questionsAdded   || 0} label="سؤال أضفته"     delay={60}  />
          <StatCard icon={Globe2} value={stats.feedItemsCreated || 0} label="بطاقة تغذية"    delay={120} />
          <StatCard icon={Blocks} value={stats.blocksAdded      || 0} label="وحدة محتوى"     delay={180} />
          <StatCard icon={Search} value={stats.reviewsSubmitted || 0} label="مراجعة قدّمتها" delay={240} />
          <StatCard icon={Globe2} value={stats.publishedLessons || 0} label="درس منشور"      delay={300} />
        </div>
      </div>

      {/* ── Heatmap ── */}
      <div
        className="p-5 sm:p-6 rounded-2xl mb-8"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
      >
        <SectionLabel>نشاطك — 16 أسبوع الأخيرة</SectionLabel>
        <ContributionHeatmap activityMap={activityMap} />
        {stats.lastActiveAt && (
          <p
            className="text-xs font-arabic mt-3"
            style={{ color: 'var(--text-muted)', opacity: 0.55 }}
          >
            آخر نشاط: {relativeTime(stats.lastActiveAt)}
          </p>
        )}
      </div>

      {/* ── Announcements ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <SectionLabel>إعلانات الإدارة</SectionLabel>
          {announcements.some((a) => a.pinned) && (
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded"
              style={{ background: 'rgba(212,137,30,0.1)', color: 'var(--accent)' }}
            >
              {announcements.filter((a) => a.pinned).length} مثبّت
            </span>
          )}
        </div>

        {annoLoading ? (
          <div className="flex items-center gap-2 py-6" style={{ color: 'var(--text-muted)' }}>
            <span
              className="inline-block w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: 'var(--accent) var(--accent) var(--accent) transparent' }}
            />
            <span className="text-xs font-arabic">جارٍ التحميل…</span>
          </div>
        ) : announcements.length === 0 ? (
          <EmptyAnnouncements />
        ) : (
          <div className="flex flex-col gap-2">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

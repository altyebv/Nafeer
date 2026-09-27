// ─── contributorBadges.js ──────────────────────────────────────────────────────
// Rule-based badge registry. Badges are never stored — they're derived live from
// a contributor's stats (+ a few cheap extras computed by the activity API), so
// there's nothing to backfill or get out of sync when a threshold changes.
//
// To add a badge later: append an entry to BADGE_CATALOG. `test(ctx)` receives
// the object built by buildBadgeContext() below.
//
// `icon` is a string key, not a component — this file stays framework-agnostic
// (usable from a server route or a client component). The UI maps the string to
// a lucide-react icon.

const HOUR_MS = 3_600_000;

export const TIERS = {
  bronze:   { labelAr: 'برونزي', color: '#c98a4a' },
  silver:   { labelAr: 'فضي',    color: '#b9c2cc' },
  gold:     { labelAr: 'ذهبي',   color: '#e7bd4a' },
  special:  { labelAr: 'مميز',   color: '#a78bfa' },
};

export const BADGE_GROUPS = {
  content:     { labelAr: 'الإنشاء',    labelEn: 'Creation'    },
  published:   { labelAr: 'النشر',      labelEn: 'Published'   },
  community:   { labelAr: 'المجتمع',    labelEn: 'Community'   },
  dedication:  { labelAr: 'الوقت',      labelEn: 'Time'        },
  consistency: { labelAr: 'الاستمرارية', labelEn: 'Consistency' },
  special:     { labelAr: 'مميز',       labelEn: 'Special'     },
};

export const BADGE_CATALOG = [
  // ── Content creation volume ──────────────────────────────────────────────
  { id: 'content-1',   group: 'content', tier: 'bronze', icon: 'Sparkles',
    nameAr: 'أول لبنة',      nameEn: 'First Brick',
    descAr: 'أول مساهمة محتوى في نفير',
    test: (c) => c.totalContent >= 1 },
  { id: 'content-25',  group: 'content', tier: 'silver', icon: 'BookOpen',
    nameAr: 'مساهم نشط',     nameEn: 'Active Contributor',
    descAr: '25 مساهمة محتوى',
    test: (c) => c.totalContent >= 25 },
  { id: 'content-100', group: 'content', tier: 'gold', icon: 'Layers',
    nameAr: 'مساهم غزير',    nameEn: 'Prolific Contributor',
    descAr: '100 مساهمة محتوى',
    test: (c) => c.totalContent >= 100 },
  { id: 'content-500', group: 'content', tier: 'special', icon: 'Trophy',
    nameAr: 'أسطورة نفير',   nameEn: 'Nafeer Legend',
    descAr: '500 مساهمة محتوى',
    test: (c) => c.totalContent >= 500 },

  // ── Shipped, not just created ────────────────────────────────────────────
  { id: 'pub-1',  group: 'published', tier: 'bronze', icon: 'Rocket',
    nameAr: 'أول نشر',   nameEn: 'First Publish',
    descAr: 'أول درس منشور وصل للطلاب',
    test: (c) => c.publishedLessons >= 1 },
  { id: 'pub-10', group: 'published', tier: 'silver', icon: 'GraduationCap',
    nameAr: 'مُعلّم',     nameEn: 'Educator',
    descAr: '10 دروس منشورة',
    test: (c) => c.publishedLessons >= 10 },
  { id: 'pub-50', group: 'published', tier: 'gold', icon: 'Landmark',
    nameAr: 'مرجع نفير',  nameEn: 'Nafeer Reference',
    descAr: '50 درساً منشوراً',
    test: (c) => c.publishedLessons >= 50 },

  // ── Community: comments + peer review flags ──────────────────────────────
  { id: 'comm-10',      group: 'community', tier: 'bronze', icon: 'MessageCircle',
    nameAr: 'صوت المجتمع', nameEn: 'Community Voice',
    descAr: '10 تفاعلات مجتمعية (تعليقات ومراجعات)',
    test: (c) => c.commentsPosted + c.reviewsSubmitted >= 10 },
  { id: 'review-10', group: 'community', tier: 'silver', icon: 'Eye',
    nameAr: 'عين فاحصة',   nameEn: 'Sharp Eye',
    descAr: '10 مراجعات جودة قدّمتها',
    test: (c) => c.reviewsSubmitted >= 10 },
  { id: 'review-50', group: 'community', tier: 'gold', icon: 'ShieldCheck',
    nameAr: 'حارس الجودة', nameEn: 'Quality Guardian',
    descAr: '50 مراجعة جودة قدّمتها',
    test: (c) => c.reviewsSubmitted >= 50 },

  // ── Time invested ─────────────────────────────────────────────────────────
  { id: 'time-10',  group: 'dedication', tier: 'bronze', icon: 'Clock',
    nameAr: '10 ساعات',  nameEn: '10 Hours In',
    descAr: '10 ساعات مسجّلة على المنصة',
    test: (c) => c.totalTimeMs >= 10 * HOUR_MS },
  { id: 'time-100', group: 'dedication', tier: 'silver', icon: 'Hourglass',
    nameAr: '100 ساعة',  nameEn: '100 Hours In',
    descAr: '100 ساعة مسجّلة على المنصة',
    test: (c) => c.totalTimeMs >= 100 * HOUR_MS },
  { id: 'time-500', group: 'dedication', tier: 'gold', icon: 'Flame',
    nameAr: '500 ساعة',  nameEn: '500 Hours In',
    descAr: '500 ساعة مسجّلة على المنصة',
    test: (c) => c.totalTimeMs >= 500 * HOUR_MS },

  // ── Consistency ───────────────────────────────────────────────────────────
  { id: 'streak-7',  group: 'consistency', tier: 'bronze', icon: 'Flame',
    nameAr: 'أسبوع متواصل', nameEn: '7-Day Streak',
    descAr: '7 أيام متتالية من النشاط',
    test: (c) => c.streakDays >= 7 },
  { id: 'streak-30', group: 'consistency', tier: 'gold', icon: 'Flame',
    nameAr: 'شهر متواصل',   nameEn: '30-Day Streak',
    descAr: '30 يوماً متتالياً من النشاط',
    test: (c) => c.streakDays >= 30 },

  // ── Special / structural ──────────────────────────────────────────────────
  { id: 'founding', group: 'special', tier: 'special', icon: 'Crown',
    nameAr: 'عضو مؤسس',    nameEn: 'Founding Member',
    descAr: 'من أوائل 30 مساهماً في نفير',
    test: (c) => c.joinRank != null && c.joinRank <= 30 },
  { id: 'veteran', group: 'special', tier: 'special', icon: 'Star',
    nameAr: 'قدامى نفير',  nameEn: 'Nafeer Veteran',
    descAr: 'سنة كاملة من المساهمة',
    test: (c) => c.tenureDays >= 365 },
  { id: 'team-leader', group: 'special', tier: 'special', icon: 'Users',
    nameAr: 'قائد فريق',   nameEn: 'Team Leader',
    descAr: 'يقود فريقاً في نفير',
    test: (c) => c.isTeamLeader },
  { id: 'well-rounded', group: 'special', tier: 'special', icon: 'Award',
    nameAr: 'متعدد المواهب', nameEn: 'Well-Rounded',
    descAr: 'ساهم في 3 أنواع محتوى مختلفة أو أكثر',
    test: (c) => c.contentTypeBreadth >= 3 },
];

// ─── buildBadgeContext ──────────────────────────────────────────────────────
// stats: Contributor.stats subdoc (or plain object with the same keys).
// extra: { streakDays, tenureDays, joinRank, isTeamLeader }
export function buildBadgeContext(stats = {}, extra = {}) {
  const contentFields = ['lessonsCreated', 'questionsAdded', 'feedItemsCreated', 'blocksAdded', 'examsCreated'];
  const totalContent = contentFields.reduce((sum, k) => sum + (stats[k] || 0), 0);
  const contentTypeBreadth = contentFields.filter((k) => (stats[k] || 0) > 0).length;

  return {
    totalContent,
    contentTypeBreadth,
    publishedLessons: stats.publishedLessons || 0,
    commentsPosted:   stats.commentsPosted   || 0,
    reviewsSubmitted: stats.reviewsSubmitted || 0,
    editsMade:        stats.editsMade        || 0,
    totalTimeMs:      stats.totalTimeMs      || 0,
    streakDays:       extra.streakDays  || 0,
    tenureDays:       extra.tenureDays  || 0,
    joinRank:         extra.joinRank    ?? null,
    isTeamLeader:     !!extra.isTeamLeader,
  };
}

// ─── getEarnedBadges ──────────────────────────────────────────────────────────
export function getEarnedBadges(stats, extra = {}) {
  const ctx = buildBadgeContext(stats, extra);
  return BADGE_CATALOG.filter((b) => b.test(ctx));
}

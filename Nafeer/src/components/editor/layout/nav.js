import { BookOpen, CircleHelp, ClipboardCheck, Image, LayoutDashboard, Sparkles, Smartphone, UserRound } from 'lucide-react';

/**
 * EDITOR NAVIGATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Single definition shared by the desktop sidebar, the mobile bottom nav and
 * the route tree. Previously the sidebar owned this list and navigation ran
 * through an `onNavigate(id)` callback threaded down from EditorShell, so the
 * editor lived entirely at one URL: the back button left the tool, lessons
 * could not be linked, and a refresh dropped you back on the dashboard.
 */

export const NAV = [
  { id: 'dashboard', href: '/editor',          icon: LayoutDashboard, label: 'الرئيسية', sub: 'Dashboard' },
  { id: 'lessons',   href: '/editor/lessons',  icon: BookOpen,        label: 'الدروس',   sub: 'Lessons'   },
  { id: 'feeds',     href: '/editor/feeds',    icon: Smartphone,      label: 'التغذية',  sub: 'Feed'      },
  { id: 'quizbank',  href: '/editor/quizbank', icon: CircleHelp,      label: 'الأسئلة',  sub: 'Quiz Bank' },
  { id: 'concepts',  href: '/editor/concepts', icon: Sparkles,        label: 'المفاهيم', sub: 'Concepts'  },
  { id: 'media',     href: '/editor/media',    icon: Image,           label: 'الوسائط',  sub: 'Media'     },
  { id: 'profile',   href: '/editor/profile',  icon: UserRound,       label: 'ملفي',     sub: 'Profile'   },
];

/**
 * «الإشراف» — shown only to a team lead of their subject (docs/team-leads.md).
 * `group` gives the sidebar a heading above them. Later phases add the team
 * and recruiting pages here.
 */
export const LEAD_NAV = [
  { id: 'lead', href: '/editor/lead', icon: ClipboardCheck, label: 'المراجعة', sub: 'Lead inbox', group: 'الإشراف' },
];

/** The nav a contributor sees: everyone's items, then the lead's. */
export const navFor = (contributor) => (contributor?.lead?.active ? [...NAV, ...LEAD_NAV] : NAV);

/** Items that get their own slot in the mobile bottom bar; the rest go in "المزيد". */
export const MOBILE_PRIMARY = ['dashboard', 'lessons', 'quizbank', 'concepts', 'feeds'];

export const NAV_BY_ID = Object.fromEntries([...NAV, ...LEAD_NAV].map((n) => [n.id, n]));

/**
 * Which nav item owns a pathname. Nested routes count as their section, so
 * /editor/lessons/GEOGRAPHY_U1_L1 keeps "الدروس" highlighted.
 */
export function activeNavId(pathname) {
  if (!pathname || pathname === '/editor') return 'dashboard';
  const section = pathname.split('/')[2];
  return NAV_BY_ID[section] ? section : 'dashboard';
}

export const lessonHref = (lessonId) => `/editor/lessons/${encodeURIComponent(lessonId)}`;

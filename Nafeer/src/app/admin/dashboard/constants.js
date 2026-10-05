import {
  LayoutDashboard, PenLine, BookOpen, ClipboardCheck, LayoutGrid, Image as ImageIcon,
  Users, Megaphone, Mail, Smartphone, ShieldCheck, Settings,
} from 'lucide-react';
import { SUBJECTS_CATALOG, TRACK_CONFIG } from '@/shared/curriculum';

export { TRACK_CONFIG };

export const CONTRIBUTOR_STATUS = {
  pending:  { label: 'في الانتظار', dot: 'bg-amber-400',  badge: 'bg-amber-900/30 border-amber-700/40 text-amber-400'  },
  approved: { label: 'معتمد',       dot: 'bg-green-400',  badge: 'bg-green-900/30 border-green-700/40 text-green-400'  },
  rejected: { label: 'مرفوض',       dot: 'bg-red-500',    badge: 'bg-red-900/30 border-red-700/40 text-red-400'        },
};

export const REVIEW_TYPE = {
  lesson:   { label: 'درس',   color: 'bg-blue-900/30 border-blue-700/40 text-blue-400',       icon: '◈' },
  concept:  { label: 'مفهوم', color: 'bg-purple-900/30 border-purple-700/40 text-purple-400', icon: '✦' },
  feedItem: { label: 'تغذية', color: 'bg-teal-900/30 border-teal-700/40 text-teal-400',       icon: '▣' },
  question: { label: 'سؤال',  color: 'bg-amber-900/30 border-amber-700/40 text-amber-400',    icon: '◎' },
};

export const SUBJECT_MAP = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s]));
export const SUBJECTS_CATALOG_REF = SUBJECTS_CATALOG;

// Sidebar navigation, grouped by what the admin is there to do.
// `badgeKey` names a count in the dashboard's `badges` object.
export const NAV_GROUPS = [
  {
    label: null,
    items: [
      { id: 'overview',     icon: LayoutDashboard, label: 'نظرة عامة' },
    ],
  },
  {
    label: 'المحتوى',
    items: [
      { id: 'editor',       icon: PenLine,        label: 'محرر المشرف' },
      { id: 'curriculum',   icon: BookOpen,       label: 'إدارة المنهج' },
      { id: 'review',       icon: ClipboardCheck, label: 'طابور المراجعة', badgeKey: 'reviewTotal' },
      { id: 'coverage',     icon: LayoutGrid,     label: 'خريطة التغطية' },
      { id: 'media',        icon: ImageIcon,      label: 'الوسائط' },
    ],
  },
  {
    label: 'المجتمع',
    items: [
      { id: 'contributors', icon: Users,          label: 'المساهمون', badgeKey: 'pending' },
      // Announcements, surveys, and future app-level settings (feature flags, tours).
      { id: 'comms',        icon: Megaphone,      label: 'مركز التحكم' },
      { id: 'email',        icon: Mail,           label: 'البريد الإلكتروني' },
      { id: 'android',      icon: Smartphone,     label: 'تحليلات الأندرويد' },
    ],
  },
  {
    label: 'النظام',
    items: [
      { id: 'admins',       icon: ShieldCheck,    label: 'المشرفون' },
      { id: 'settings',     icon: Settings,       label: 'الإعدادات' },
    ],
  },
];

export const NAV = NAV_GROUPS.flatMap((group) => group.items);

// Pipeline stage for a pending applicant
export function getPipelineStage(c) {
  if (c.status !== 'pending') return null;
  const hasAnswers = c.interviewAnswers?.submittedAt || c.dynamicAnswersSubmittedAt;
  if (hasAnswers)       return { label: 'أكمل المقابلة', color: 'bg-green-900/30 border-green-800/40 text-green-400' };
  if (c.interviewToken) return { label: 'ينتظر المقابلة', color: 'bg-blue-900/30 border-blue-800/40 text-blue-400'   };
  return                       { label: 'طلب جديد',       color: 'bg-amber-900/30 border-amber-800/40 text-amber-500' };
}
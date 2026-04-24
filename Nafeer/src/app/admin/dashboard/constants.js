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

export const NAV = [
  { id: 'overview',      icon: '◈', label: 'نظرة عامة',     badgeKey: null          },
  { id: 'editor',        icon: '✦', label: 'المحرر',        badgeKey: null          },
  { id: 'contributors',  icon: '◉', label: 'المساهمون',     badgeKey: 'pending'     },
  { id: 'roles',         icon: '◆', label: 'الأدوار',        badgeKey: null          },
  { id: 'review',        icon: '◎', label: 'طابور المراجعة', badgeKey: 'reviewTotal' },
  { id: 'coverage',      icon: '▦', label: 'خريطة التغطية',  badgeKey: null          },
  { id: 'publish',       icon: '⬆', label: 'نشر للتطبيق',   badgeKey: null          },  // ← NEW
  { id: 'media',         icon: '⬜', label: 'الوسائط',        badgeKey: null          },
  { id: 'admins',        icon: '⬡', label: 'المشرفون',       badgeKey: null          },
  { id: 'settings',      icon: '⚙', label: 'الإعدادات',      badgeKey: null          },
  { id: 'seed',          icon: '◈', label: 'إدارة البذر',    badgeKey: null          },
];

// Pipeline stage for a pending applicant
export function getPipelineStage(c) {
  if (c.status !== 'pending') return null;
  const hasAnswers = c.interviewAnswers?.submittedAt || c.dynamicAnswersSubmittedAt;
  if (hasAnswers)       return { label: 'أكمل المقابلة', color: 'bg-green-900/30 border-green-800/40 text-green-400' };
  if (c.interviewToken) return { label: 'ينتظر المقابلة', color: 'bg-blue-900/30 border-blue-800/40 text-blue-400'   };
  return                       { label: 'طلب جديد',       color: 'bg-amber-900/30 border-amber-800/40 text-amber-500' };
}
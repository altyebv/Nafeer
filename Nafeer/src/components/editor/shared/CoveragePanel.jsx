'use client';
import { useMemo } from 'react';
import { BookOpen, Check, CircleHelp, CornerDownLeft, FileText, Smartphone } from 'lucide-react';
import { COVERAGE_LEVEL_CONFIG } from '@/hooks/useCoverageData';

// ─── CoveragePanel ────────────────────────────────────────────────────────────
//
// Shows in the LessonEditorPage sidebar area.
// Receives the raw coverage record for a single lesson.
// Displays: level badge, score bar, per-dimension pills, guidance hints.
//
// Props:
//   coverage  — object from coverageMap[lessonContentId] | null
//   loading   — boolean
//

const DIMENSION_CONFIG = [
  {
    key:     'content',
    label:   'محتوى',
    sublabel: 'أقسام + عناصر',
    weight:  40,
    icon:    BookOpen,
    getScore: (c) => {
      if (c.sections > 0 && c.blocks > 0) return 40;
      if (c.sections > 0) return 20;
      return 0;
    },
    getHint: (c) => {
      if (c.sections === 0) return 'أضف قسماً واحداً على الأقل للبدء';
      if (c.blocks === 0)   return 'أضف محتوى داخل الأقسام الموجودة';
      return null;
    },
  },
  {
    key:     'feed',
    label:   'تغذية',
    sublabel: 'بطاقات مراجعة',
    weight:  30,
    icon:    Smartphone,
    getScore: (c) => c.concepts === 0 ? 0 : Math.min(30, Math.round((c.feedItems / c.concepts) * 30)),
    getHint: (c) => {
      if (c.concepts === 0)          return 'ربط مفاهيم بالأقسام يفعّل هذا البُعد';
      if (c.feedItems === 0)         return 'أضف بطاقات تغذية مرتبطة بالمفاهيم';
      if (c.feedItems < c.concepts)  return `${c.concepts - c.feedItems} مفاهيم دون بطاقات بعد`;
      return null;
    },
  },
  {
    key:     'questions',
    label:   'أسئلة',
    sublabel: 'بنك الاختبار',
    weight:  30,
    icon:    FileText,
    getScore: (c) => c.concepts === 0 ? 0 : Math.min(30, Math.round((c.questions / (c.concepts * 2)) * 30)),
    getHint: (c) => {
      if (c.concepts === 0)                  return 'ربط مفاهيم يفعّل درجة الأسئلة';
      const target = c.concepts * 2;
      if (c.questions === 0)                 return `أضف ${target} سؤال لهذا الدرس`;
      if (c.questions < target)              return `${target - c.questions} سؤال إضافي لاكتمال التغطية`;
      return null;
    },
  },
];

export default function CoveragePanel({ coverage, loading }) {
  const levelCfg = useMemo(() => {
    if (!coverage) return COVERAGE_LEVEL_CONFIG.none;
    return COVERAGE_LEVEL_CONFIG[coverage.coverageLevel] ?? COVERAGE_LEVEL_CONFIG.none;
  }, [coverage]);

  const score = coverage?.coverageScore ?? 0;

  const dimensions = useMemo(() => {
    if (!coverage) return DIMENSION_CONFIG.map(d => ({ ...d, score: 0, hint: null }));
    return DIMENSION_CONFIG.map(d => ({
      ...d,
      score: d.getScore(coverage),
      hint:  d.getHint(coverage),
    }));
  }, [coverage]);

  const hints = dimensions.map(d => d.hint).filter(Boolean);

  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-ink-800 bg-ink-900/50 animate-pulse">
        <div className="h-3 bg-ink-800 rounded w-1/2 mb-3" />
        <div className="h-2 bg-ink-800 rounded w-full mb-2" />
        <div className="h-2 bg-ink-800 rounded w-3/4" />
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: 'rgba(0,0,0,0.2)', borderColor: levelCfg.border }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: levelCfg.bg, borderBottom: `1px solid ${levelCfg.border}` }}
      >
        <span className="text-xs font-arabic text-ink-300">تغطية الدرس</span>
        <span
          className="text-xs font-mono px-2 py-0.5 rounded-full font-semibold"
          style={{ background: levelCfg.bg, border: `1px solid ${levelCfg.border}`, color: levelCfg.color }}
        >
          {levelCfg.label} · {score}٪
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Overall bar */}
        <div>
          <div className="w-full h-1.5 rounded-full bg-ink-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${score}%`, background: levelCfg.bar }}
            />
          </div>
        </div>

        {/* Dimension pills */}
        <div className="space-y-2">
          {dimensions.map((d) => {
            const pct = d.weight > 0 ? Math.round((d.score / d.weight) * 100) : 0;
            const Icon = d.icon;
            return (
              <div key={d.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon size={13} strokeWidth={1.8} className="text-ink-500" />
                    <span className="text-xs font-arabic text-ink-400">{d.label}</span>
                    <span className="text-[10px] font-mono text-ink-700">{d.sublabel}</span>
                  </div>
                  <span className="text-[10px] font-mono text-ink-600">{d.score}/{d.weight}</span>
                </div>
                <div className="w-full h-1 rounded-full bg-ink-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: pct >= 100 ? '#22c55e' : pct > 50 ? '#f59e0b' : '#4b5563',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Raw counts */}
        {coverage && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { label: 'أقسام',    value: coverage.sections  },
              { label: 'مفاهيم',   value: coverage.concepts  },
              { label: 'أسئلة',    value: coverage.questions },
              { label: 'عناصر',    value: coverage.blocks    },
              { label: 'تغذية',    value: coverage.feedItems },
              { label: 'حالة',     value: coverage.status === 'approved' ? 'معتمد' : coverage.status ?? '—' },
            ].map((s, i) => (
              <div key={i} className="text-center p-2 rounded-lg bg-ink-900/60">
                <div className="text-sm font-mono font-bold text-sand-300">{s.value ?? 0}</div>
                <div className="text-[10px] text-ink-600 font-arabic mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Guidance hints */}
        {hints.length > 0 && (
          <div className="pt-1 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[10px] font-mono text-ink-600 mb-1.5">— خطوات لرفع التغطية</p>
            {hints.map((hint, i) => (
              <div key={i} className="flex items-start gap-2">
                <CornerDownLeft size={12} strokeWidth={1.8} className="mt-1 shrink-0 text-amber-600" />
                <p className="text-xs font-arabic text-ink-500 leading-relaxed">{hint}</p>
              </div>
            ))}
          </div>
        )}

        {score >= 80 && (
          <div className="flex items-center gap-2 pt-1">
            <Check size={13} strokeWidth={2.2} className="text-green-500" />
            <p className="text-xs font-arabic text-green-600">تغطية ممتازة — جاهز للمراجعة</p>
          </div>
        )}
      </div>
    </div>
  );
}

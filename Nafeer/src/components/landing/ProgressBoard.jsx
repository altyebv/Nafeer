'use client';

import { SUBJECTS_CATALOG, TRACK_CONFIG, getTotalLessons } from '@/shared/curriculum';

/**
 * Color map — extend if you add new colors to the catalog.
 * Keys match the `color` field in SUBJECTS_CATALOG.
 */
const colorMap = {
  sand:    { bar: 'bg-sand-500',    text: 'text-sand-400',    badge: 'bg-sand-900/40 border-sand-700/40 text-sand-400'         },
  blue:    { bar: 'bg-blue-500',    text: 'text-blue-400',    badge: 'bg-blue-900/40 border-blue-700/40 text-blue-400'         },
  purple:  { bar: 'bg-purple-500',  text: 'text-purple-400',  badge: 'bg-purple-900/40 border-purple-700/40 text-purple-400'   },
  green:   { bar: 'bg-green-500',   text: 'text-green-400',   badge: 'bg-green-900/40 border-green-700/40 text-green-400'     },
  orange:  { bar: 'bg-orange-500',  text: 'text-orange-400',  badge: 'bg-orange-900/40 border-orange-700/40 text-orange-400'  },
  teal:    { bar: 'bg-teal-500',    text: 'text-teal-400',    badge: 'bg-teal-900/40 border-teal-700/40 text-teal-400'         },
  ember:   { bar: 'bg-ember-400',   text: 'text-ember-400',   badge: 'bg-orange-900/40 border-orange-700/40 text-orange-400'  },
  yellow:  { bar: 'bg-yellow-500',  text: 'text-yellow-400',  badge: 'bg-yellow-900/40 border-yellow-700/40 text-yellow-400'  },
  cyan:    { bar: 'bg-cyan-500',    text: 'text-cyan-400',    badge: 'bg-cyan-900/40 border-cyan-700/40 text-cyan-400'         },
  emerald: { bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-900/40 border-emerald-700/40 text-emerald-400'},
  indigo:  { bar: 'bg-indigo-500',  text: 'text-indigo-400',  badge: 'bg-indigo-900/40 border-indigo-700/40 text-indigo-400'  },
  amber:   { bar: 'bg-amber-500',   text: 'text-amber-400',   badge: 'bg-amber-900/40 border-amber-700/40 text-amber-400'     },
  slate:   { bar: 'bg-slate-500',   text: 'text-slate-400',   badge: 'bg-slate-900/40 border-slate-700/40 text-slate-400'     },
};

// TODO: Replace with a live fetch from /api/progress once Atlas is wired up.
// Shape: { [subjectId]: { progress: number, contributor: string | null } }
const LIVE_PROGRESS = {};

export default function ProgressBoard() {
  const subjects = SUBJECTS_CATALOG.map((s) => ({
    ...s,
    progress:     LIVE_PROGRESS[s.id]?.progress    ?? 0,
    contributor:  LIVE_PROGRESS[s.id]?.contributor ?? null,
    totalLessons: getTotalLessons(s.id),
  }));

  const totalSubjects     = subjects.length;
  const mappedSubjects    = subjects.filter((s) => s.progress > 0).length;
  const totalContributors = subjects.filter((s) => s.contributor).length;

  return (
    <section className="py-24 px-6 relative">
      <div className="ember-line max-w-6xl mx-auto mb-24 opacity-40" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="inline-block text-sand-500 text-sm tracking-widest uppercase mb-4 font-mono">
              حالة المشروع — مباشر
            </span>
            <h2 className="text-4xl font-arabic font-bold text-sand-50">خريطة المواد</h2>
            <p className="text-ink-400 mt-3 max-w-lg leading-loose">
              كل مادة تحتاج مساهماً متخصصاً لرسم محتواها.
              هذه خريطة ما اكتمل وما ينتظرك.
            </p>
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-sand-400 stat-number">{totalSubjects}</div>
              <div className="text-xs text-ink-500 mt-1">مادة</div>
            </div>
            <div className="w-px bg-ink-800" />
            <div className="text-center">
              <div className="text-4xl font-bold text-sand-400 stat-number">{mappedSubjects}</div>
              <div className="text-xs text-ink-500 mt-1">مكتملة</div>
            </div>
            <div className="w-px bg-ink-800" />
            <div className="text-center">
              <div className="text-4xl font-bold text-sand-400 stat-number">{totalContributors}</div>
              <div className="text-xs text-ink-500 mt-1">مساهم</div>
            </div>
          </div>
        </div>

        {/* Track sections */}
        {[
          { trackKey: 'COMMON',   label: 'المواد المشتركة', desc: 'يأخذها جميع الطلاب' },
          { trackKey: 'SCIENCE',  label: 'المسار العلمي',   desc: 'مسار + تخصص (اختر واحداً من الثلاثة)' },
          { trackKey: 'LITERARY', label: 'المسار الأدبي',   desc: 'مسار + تخصص (اختر واحداً من الاثنين)' },
        ].map(({ trackKey, label, desc }) => {
          const trackSubjects = subjects.filter((s) => s.track === trackKey);
          const required      = trackSubjects.filter((s) => !s.isMajor);
          const majors        = trackSubjects.filter((s) => s.isMajor);
          return (
            <div key={trackKey} className="mb-14">
              <div className="flex items-baseline gap-3 mb-5">
                <h3 className={`text-lg font-bold ${TRACK_CONFIG[trackKey].color}`}>{label}</h3>
                <span className="text-xs text-ink-500">{desc}</span>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {required.map((s) => <SubjectCard key={s.id} subject={s} colorMap={colorMap} />)}
              </div>

              {majors.length > 0 && (
                <div className="border-t border-ink-800/60 pt-4">
                  <p className="text-xs text-ink-600 font-mono mb-3">— تخصص، اختر واحداً</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {majors.map((s) => <SubjectCard key={s.id} subject={s} colorMap={colorMap} isMajor />)}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-ink-400 mb-6">كل المواد مفتوحة للمساهمة — لديك خلفية في أي مادة؟</p>
          <a
            href="/join"
            className="inline-flex items-center gap-3 px-8 py-4 bg-sand-500 hover:bg-sand-400 text-ink-950 font-bold rounded-xl transition-all duration-300 hover:shadow-[0_0_40px_rgba(212,137,30,0.25)] hover:-translate-y-0.5"
          >
            طلب انضمام للنفير
          </a>
        </div>
      </div>
    </section>
  );
}

function SubjectCard({ subject, colorMap, isMajor = false }) {
  const c          = colorMap[subject.color] ?? colorMap.sand;
  const isAvailable = !subject.contributor;
  const trackCfg   = TRACK_CONFIG[subject.track];

  return (
    <div
      className={`relative p-5 rounded-xl border glass overflow-hidden transition-all duration-300
        ${isAvailable
          ? 'border-ink-700/40 hover:border-sand-700/50 hover:-translate-y-1 cursor-pointer group'
          : 'border-ink-800/30 opacity-70'}
        ${isMajor ? 'border-dashed' : ''}`}
    >
      {isAvailable && (
        <div className="absolute inset-0 bg-gradient-to-br from-sand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${c.badge} font-mono`}>
            {trackCfg.label}
          </span>
          {isMajor && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full border border-ink-700/50 text-ink-500 font-mono">
              تخصص
            </span>
          )}
        </div>

        <h3 className="text-base font-bold text-sand-100 mb-1">{subject.nameAr}</h3>
        <p className="text-xs text-ink-500 mb-4">
          {subject.units.length} وحدات · {subject.totalLessons} درس
        </p>

        <div className="w-full bg-ink-800 rounded-full h-1 mb-3">
          <div
            className={`${c.bar} h-1 rounded-full transition-all duration-1000`}
            style={{ width: `${subject.progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs font-mono ${c.text}`}>{subject.progress}%</span>
          {isAvailable ? (
            <a
              href="/join"
              className="text-xs text-sand-500 hover:text-sand-300 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              + انضم
            </a>
          ) : (
            <span className="text-xs text-ink-600">{subject.contributor}</span>
          )}
        </div>
      </div>
    </div>
  );
}
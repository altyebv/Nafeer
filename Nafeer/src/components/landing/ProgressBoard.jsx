'use client';

// This will eventually pull from Atlas. For now, seeded data.
const subjects = [
  { name: 'الرياضيات', path: 'علمي', progress: 0, units: 8, contributor: null, color: 'sand' },
  { name: 'الفيزياء', path: 'علمي', progress: 0, units: 6, contributor: null, color: 'blue' },
  { name: 'الكيمياء', path: 'علمي', progress: 0, units: 7, contributor: null, color: 'purple' },
  { name: 'الأحياء', path: 'علمي', progress: 0, units: 9, contributor: null, color: 'green' },
  { name: 'التاريخ', path: 'أدبي', progress: 0, units: 5, contributor: null, color: 'orange' },
  { name: 'الجغرافيا', path: 'مشترك', progress: 0, units: 6, contributor: null, color: 'teal' },
  { name: 'اللغة العربية', path: 'مشترك', progress: 0, units: 10, contributor: null, color: 'ember' },
  { name: 'الاقتصاد', path: 'أدبي', progress: 0, units: 5, contributor: null, color: 'yellow' },
];

const colorMap = {
  sand:   { bar: 'bg-sand-500',   text: 'text-sand-400',   badge: 'bg-sand-900/40 border-sand-700/40 text-sand-400' },
  blue:   { bar: 'bg-blue-500',   text: 'text-blue-400',   badge: 'bg-blue-900/40 border-blue-700/40 text-blue-400' },
  purple: { bar: 'bg-purple-500', text: 'text-purple-400', badge: 'bg-purple-900/40 border-purple-700/40 text-purple-400' },
  green:  { bar: 'bg-green-500',  text: 'text-green-400',  badge: 'bg-green-900/40 border-green-700/40 text-green-400' },
  orange: { bar: 'bg-orange-500', text: 'text-orange-400', badge: 'bg-orange-900/40 border-orange-700/40 text-orange-400' },
  teal:   { bar: 'bg-teal-500',   text: 'text-teal-400',   badge: 'bg-teal-900/40 border-teal-700/40 text-teal-400' },
  ember:  { bar: 'bg-ember-400',  text: 'text-ember-400',  badge: 'bg-orange-900/40 border-orange-700/40 text-orange-400' },
  yellow: { bar: 'bg-yellow-500', text: 'text-yellow-400', badge: 'bg-yellow-900/40 border-yellow-700/40 text-yellow-400' },
};

const totalSubjects = subjects.length;
const mappedSubjects = subjects.filter(s => s.progress > 0).length;
const totalContributors = subjects.filter(s => s.contributor).length;

export default function ProgressBoard() {
  return (
    <section className="py-24 px-6 relative">
      {/* Divider */}
      <div className="ember-line max-w-6xl mx-auto mb-24 opacity-40" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="inline-block text-sand-500 text-sm tracking-widest uppercase mb-4 font-mono">
              حالة المشروع — مباشر
            </span>
            <h2 className="text-4xl font-arabic font-bold text-sand-50">
              خريطة المواد
            </h2>
            <p className="text-ink-400 mt-3 max-w-lg leading-loose">
              كل مادة تحتاج مساهماً متخصصاً لرسم محتواها. 
              هذه خريطة ما اكتمل وما ينتظرك.
            </p>
          </div>

          {/* Stats */}
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

        {/* Subject Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {subjects.map((subject, i) => {
            const c = colorMap[subject.color];
            const isAvailable = !subject.contributor;
            return (
              <div
                key={i}
                className={`relative p-5 rounded-xl border glass overflow-hidden transition-all duration-300
                  ${isAvailable
                    ? 'border-ink-700/40 hover:border-sand-700/50 hover:-translate-y-1 cursor-pointer group'
                    : 'border-ink-800/30 opacity-70'
                  }`}
              >
                {/* Available glow on hover */}
                {isAvailable && (
                  <div className="absolute inset-0 bg-gradient-to-br from-sand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                )}

                <div className="relative z-10">
                  {/* Path badge */}
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${c.badge} mb-4 font-mono`}>
                    {subject.path}
                  </span>

                  {/* Name */}
                  <h3 className="text-base font-bold text-sand-100 mb-1">{subject.name}</h3>
                  <p className="text-xs text-ink-500 mb-4">{subject.units} وحدات</p>

                  {/* Progress bar */}
                  <div className="w-full bg-ink-800 rounded-full h-1 mb-3">
                    <div
                      className={`${c.bar} h-1 rounded-full transition-all duration-1000`}
                      style={{ width: `${subject.progress}%` }}
                    />
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono ${c.text}`}>
                      {subject.progress}%
                    </span>
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
          })}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-ink-400 mb-6">
            كل المواد مفتوحة للمساهمة — لديك خلفية في أي مادة؟
          </p>
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

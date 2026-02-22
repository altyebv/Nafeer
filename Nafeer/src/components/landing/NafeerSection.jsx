'use client';

const steps = [
  {
    num: '١',
    title: 'تقدم بطلبك',
    desc: 'أخبرنا عن خلفيتك ومادتك. نراجع الطلبات يدوياً.',
  },
  {
    num: '٢',
    title: 'احصل على صلاحياتك',
    desc: 'بعد الموافقة تحصل على حساب في منصة نفير مع المادة المخصصة لك.',
  },
  {
    num: '٣',
    title: 'ابدأ الرسم',
    desc: 'استخدم أداة التحرير لإضافة الوحدات، الدروس، المفاهيم، والأسئلة.',
  },
  {
    num: '٤',
    title: 'يصل للطلاب',
    desc: 'ما تبنيه يُصدَّر مباشرة لتطبيق بشير ويصل لآلاف الطلاب.',
  },
];

export default function NafeerSection() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      <div className="ember-line max-w-6xl mx-auto mb-24 opacity-40" />

      {/* Background text */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none select-none">
        <span className="text-[30vw] font-arabic font-bold text-sand-100 leading-none">نفير</span>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-20 max-w-2xl">
          <span className="inline-block text-sand-500 text-sm tracking-widest uppercase mb-4 font-mono">
            النفير — المساهمون
          </span>
          <h2 className="text-4xl md:text-5xl font-arabic font-bold text-sand-50 mb-6 leading-tight">
            معاً نبني ما يستحقه
            <span className="text-sand-400"> الطالب السوداني</span>
          </h2>
          <p className="text-ink-300 text-lg leading-loose">
            النفير هو مفهوم تعاون جماعي في ثقافتنا — الكل يُساهم بما يقدر عليه لصالح الجميع.
            هكذا نبني بشير: كل خبير يرسم مادته، وكل طالب يستفيد.
          </p>
        </div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-0 w-full h-px bg-gradient-to-l from-transparent via-ink-700 to-transparent pointer-events-none" />
              )}

              <div className="relative glass rounded-xl p-6 border border-ink-700/30">
                <div className="text-3xl font-bold text-sand-700 font-mono mb-4 leading-none">
                  {step.num}
                </div>
                <h3 className="text-base font-bold text-sand-100 mb-2">{step.title}</h3>
                <p className="text-ink-400 text-sm leading-loose">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* What contributors get */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: '🏅', title: 'الاعتراف', desc: 'اسمك في التطبيق على كل درس تبنيه.' },
            { icon: '🎓', title: 'الأثر', desc: 'محتواك يصل لطلاب في كل مكان — حتى بعد سنوات.' },
            { icon: '🛠️', title: 'الأدوات', desc: 'أداة تحرير مبنية خصيصاً لهذا الهدف — سهلة وسريعة.' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-ink-900/40 border border-ink-800/40">
              <span className="text-3xl mt-1">{item.icon}</span>
              <div>
                <h4 className="font-bold text-sand-200 mb-1">{item.title}</h4>
                <p className="text-ink-400 text-sm leading-loose">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

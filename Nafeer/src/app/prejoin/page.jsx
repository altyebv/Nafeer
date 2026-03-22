'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Data ──────────────────────────────────────────────────────────────────

const ROLE_CARDS = [
  {
    icon: '✦',
    title: 'بناء الدروس',
    desc: 'تحويل مفاهيم المادة إلى دروس منظّمة باستخدام أداة التحرير — نصوص، أمثلة، روابط مرئية.',
  },
  {
    icon: '◈',
    title: 'صياغة الأسئلة',
    desc: 'بناء بنك أسئلة متنوع يختبر الفهم العميق، لا الحفظ السطحي.',
  },
  {
    icon: '◇',
    title: 'تحسين المحتوى',
    desc: 'مراجعة وتطوير ما بناه الآخرون — وضوح الشرح، دقة المعلومة، تدرّج الأفكار.',
  },
];

const EXPECTATIONS = [
  {
    label: 'شغف حقيقي',
    detail: 'ليس شرطاً أن تكون معلماً — يكفي أن تعرف مادتك وتريد أن تشرحها بشكل أفضل مما تعلّمتها.',
  },
  {
    label: 'قدرة على التبسيط',
    detail: 'الاختبار الحقيقي: هل تستطيع أن تشرح الفكرة لطالب يسمعها لأول مرة؟',
  },
  {
    label: 'التزام خفيف',
    detail: 'لا ساعات محددة. درس واحد متقن يساوي عشرة مكتوبة على عجل.',
  },
  {
    label: 'روح تعاونية',
    detail: 'المحتوى يُراجَع ويُحسَّن باستمرار. النقد البنّاء جزء من العمل.',
  },
];

const GAINS = [
  {
    num: '٠١',
    title: 'أثر ملموس',
    body: 'اسمك على كل درس تبنيه. طالب يفهم اليوم ربما يُعلّم غيره غداً — وستعلم أن ذلك بدأ منك.',
  },
  {
    num: '٠٢',
    title: 'خبرة تعليمية حقيقية',
    body: 'بناء محتوى تعليمي منظّم مهارة نادرة. ستتقنها هنا بأدوات مبنية لهذا الغرض تحديداً.',
  },
  {
    num: '٠٣',
    title: 'مرجع في سيرتك',
    body: 'مساهمتك في مشروع يخدم آلاف الطلاب شيء يمكنك ذكره — في أي مكان.',
  },
  {
    num: '٠٤',
    title: 'مجتمع يشبهك',
    body: 'ستعمل مع أناس يؤمنون بنفس الفكرة: أن التعليم الجيد حق، لا امتياز.',
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function PreJoinPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Hero entrance
      gsap.fromTo('.pj-eyebrow',
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.1 }
      );
      gsap.fromTo('.pj-headline',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', delay: 0.25 }
      );
      gsap.fromTo('.pj-subline',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.45 }
      );
      gsap.fromTo('.pj-divider',
        { opacity: 0, scaleX: 0 },
        { opacity: 1, scaleX: 1, duration: 0.9, ease: 'power3.out', delay: 0.6, transformOrigin: 'right center' }
      );

      // Scroll reveals — role cards
      gsap.fromTo('.pj-role-card',
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-roles', start: 'top 85%', once: true },
        }
      );

      // Expectation items
      gsap.fromTo('.pj-expect-item',
        { opacity: 0, x: 24 },
        {
          opacity: 1, x: 0, duration: 0.6, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-expects', start: 'top 85%', once: true },
        }
      );

      // Gain cards
      gsap.fromTo('.pj-gain-card',
        { opacity: 0, y: 32 },
        {
          opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-gains', start: 'top 85%', once: true },
        }
      );

      // CTA block
      gsap.fromTo('.pj-cta-block',
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-cta-block', start: 'top 90%', once: true },
        }
      );

    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen relative" dir="rtl">

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,137,30,0.06) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      </div>

      <div className="relative z-10">

        {/* ── HERO ──────────────────────────────────────── */}
        <section className="pt-24 pb-20 sm:pt-32 sm:pb-28 px-6 max-w-4xl mx-auto">

          <p
            className="pj-eyebrow text-xs font-mono tracking-widest uppercase mb-6"
            style={{ color: 'var(--accent)', opacity: 0 }}
          >
            النفير — الانضمام
          </p>

          <h1
            className="pj-headline font-arabic font-bold leading-snug mb-7"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'var(--text-primary)',
              opacity: 0,
            }}
          >
            قبل أن تتقدم،
            <br />
            <span style={{ color: 'var(--accent)' }}>دعنا نشرح لك ما تُقدم عليه</span>
          </h1>

          <p
            className="pj-subline text-base sm:text-lg leading-loose max-w-2xl"
            style={{ color: 'var(--text-secondary)', opacity: 0 }}
          >
            بشير ليس تطبيقاً عادياً، والنفير ليست منصة محتوى عشوائية.
            نبني معاً المنهج السوداني — درساً بعد درس — ليصل لكل طالب في كل مكان، مجاناً وبلا إنترنت.
            هذه الصفحة تشرح ما يعنيه ذلك بالضبط قبل أن تقرر.
          </p>

          <div
            className="pj-divider mt-12 h-px w-24"
            style={{ background: 'var(--border-mid)', opacity: 0 }}
          />
        </section>

        {/* ── WHAT CONTRIBUTORS DO ──────────────────────── */}
        <section className="px-6 pb-24 max-w-4xl mx-auto">

          <SectionLabel text="ماذا يفعل المساهم؟" />

          <p className="text-sm sm:text-base leading-loose mb-10 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            العمل الفعلي يدور حول ثلاثة محاور. لا يُشترط أن تتقنها جميعاً —
            يكفي أن تبدأ من حيث تشعر بالقدرة.
          </p>

          <div className="pj-roles grid grid-cols-1 sm:grid-cols-3 gap-4">
            {ROLE_CARDS.map((card, i) => (
              <RoleCard key={i} {...card} />
            ))}
          </div>
        </section>

        {/* ── WHAT WE EXPECT ────────────────────────────── */}
        <section
          className="px-6 py-20 sm:py-24"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="max-w-4xl mx-auto">

            <SectionLabel text="ما الذي نبحث عنه؟" />

            <p className="text-sm sm:text-base leading-loose mb-12 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
              لا نبحث عن الكمال ولا عن الخبرة الطويلة. نبحث عن الأشياء التي لا تُعلَّم.
            </p>

            <div className="pj-expects space-y-0">
              {EXPECTATIONS.map((item, i) => (
                <ExpectItem key={i} {...item} isLast={i === EXPECTATIONS.length - 1} />
              ))}
            </div>

            {/* Honest note */}
            <div
              className="mt-12 p-5 sm:p-6 rounded-xl"
              style={{
                background: 'rgba(212,137,30,0.07)',
                border: '1px solid rgba(212,137,30,0.15)',
              }}
            >
              <p className="text-xs font-mono mb-2" style={{ color: 'var(--accent)' }}>ملاحظة صادقة</p>
              <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
                هذا المشروع في مراحله الأولى. الأدوات تتطور، العمليات تتبدّل،
                وبعض الأشياء لم تُبنَ بعد. إن كنت تبحث عن منصة ناضجة بكل شيء جاهز،
                ربما يكون الوقت مبكراً. أما إن كنت تريد أن تكون جزءاً من بناء شيء من الصفر —
                فهذا هو المكان.
              </p>
            </div>
          </div>
        </section>

        {/* ── WHAT YOU GAIN ─────────────────────────────── */}
        <section className="px-6 py-24 max-w-4xl mx-auto">

          <SectionLabel text="ما الذي تكسبه؟" />

          <p className="text-sm sm:text-base leading-loose mb-12 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
            لا رواتب ولا مكافآت مادية — هذا واضح من البداية.
            لكن ما تكسبه أصعب من أن يُشترى.
          </p>

          <div className="pj-gains grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAINS.map((item, i) => (
              <GainCard key={i} {...item} />
            ))}
          </div>
        </section>

        {/* ── WHAT HAPPENS NEXT ─────────────────────────── */}
        <section
          className="px-6 py-20 sm:py-24"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="max-w-4xl mx-auto">

            <SectionLabel text="ما الذي سيحدث بعدك؟" />

            <p className="text-sm sm:text-base leading-loose mb-10 max-w-xl" style={{ color: 'var(--text-secondary)' }}>
              التقديم ليس مجرد تعبئة نموذج. هي عملية مصممة لنفهم بعضنا قبل أن نبدأ.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: '١', label: 'تقدّم بطلبك', note: 'نموذج قصير — أقل من دقيقتين' },
                { step: '٢', label: 'محادثة قصيرة', note: 'بعض الأسئلة لنفهمك أكثر' },
                { step: '٣', label: 'مهمة صغيرة', note: 'شيء عملي يُظهر أسلوبك' },
              ].map((s, i) => (
                <div
                  key={i}
                  className="p-5 rounded-xl"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <span
                    className="block text-2xl font-bold font-mono mb-3"
                    style={{ color: 'var(--accent)', opacity: 0.7 }}
                  >{s.step}</span>
                  <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.note}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ───────────────────────────────────────── */}
        <section className="px-6 py-24 max-w-4xl mx-auto">
          <div
            className="pj-cta-block text-center py-16 px-8 rounded-2xl relative overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              opacity: 0,
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(212,137,30,0.06), transparent 65%)',
              }}
            />

            <div className="relative z-10">
              <p
                className="text-xs font-mono mb-4 tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                قررت؟
              </p>

              <h2
                className="font-arabic font-bold mb-4"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
                  color: 'var(--text-primary)',
                }}
              >
                إن كان ما قرأته يشبهك —
                <br />
                <span style={{ color: 'var(--accent)' }}>نحن نريدك</span>
              </h2>

              <p
                className="text-sm leading-loose max-w-md mx-auto mb-10"
                style={{ color: 'var(--text-secondary)' }}
              >
                التقديم لا يستغرق أكثر من دقيقتين. لا يوجد قرار نهائي الآن — مجرد خطوة أولى.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/join"
                  className="inline-flex items-center gap-3 px-10 py-4 font-bold rounded-xl transition-all duration-300 text-sm"
                  style={{ background: 'var(--accent)', color: '#0e0c09' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--accent-hover)';
                    e.currentTarget.style.boxShadow  = '0 0 50px var(--glow)';
                    e.currentTarget.style.transform  = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.boxShadow  = 'none';
                    e.currentTarget.style.transform  = 'translateY(0)';
                  }}
                >
                  <span>تقدّم الآن</span>
                  <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>←</span>
                </a>

                <a
                  href="/"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                >
                  العودة للرئيسية
                </a>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span
        className="text-xs font-mono tracking-widest uppercase"
        style={{ color: 'var(--accent)' }}
      >
        {text}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
    </div>
  );
}

function RoleCard({ icon, title, desc }) {
  return (
    <div
      className="pj-role-card p-6 rounded-xl transition-all duration-300 group"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.3)';
        e.currentTarget.style.transform   = 'translateY(-3px)';
        e.currentTarget.style.boxShadow   = '0 8px 32px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      <span
        className="block text-lg mb-4 font-mono"
        style={{ color: 'var(--accent)' }}
      >{icon}</span>
      <h3
        className="font-bold text-sm mb-2"
        style={{ color: 'var(--text-primary)' }}
      >{title}</h3>
      <p
        className="text-xs leading-loose"
        style={{ color: 'var(--text-muted)' }}
      >{desc}</p>
    </div>
  );
}

function ExpectItem({ label, detail, isLast }) {
  return (
    <div
      className="pj-expect-item flex items-start gap-5 py-5"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <span
        className="mt-0.5 text-base font-mono shrink-0"
        style={{ color: 'var(--accent)' }}
      >◆</span>
      <div>
        <p
          className="font-bold text-sm mb-1"
          style={{ color: 'var(--text-primary)' }}
        >{label}</p>
        <p
          className="text-xs sm:text-sm leading-loose"
          style={{ color: 'var(--text-muted)' }}
        >{detail}</p>
      </div>
    </div>
  );
}

function GainCard({ num, title, body }) {
  return (
    <div
      className="pj-gain-card p-6 rounded-xl relative overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.25)';
        e.currentTarget.style.transform   = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform   = 'translateY(0)';
      }}
    >
      <span
        className="block text-xs font-mono mb-4"
        style={{ color: 'var(--accent)', opacity: 0.6 }}
      >{num}</span>
      <h4
        className="font-bold text-sm mb-2"
        style={{ color: 'var(--text-primary)' }}
      >{title}</h4>
      <p
        className="text-xs sm:text-sm leading-loose"
        style={{ color: 'var(--text-muted)' }}
      >{body}</p>
    </div>
  );
}
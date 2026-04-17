'use client';
import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ─── Data ───────────────────────────────────────────────────────────────────

const PILLARS = [
  {
    icon: '◈',
    title: 'بناء الدروس',
    desc: 'حوّل ما تعرفه إلى دروس منظّمة — نصوص، أمثلة، روابط مفاهيمية. الأداة تتكفل بالباقي.',
  },
  {
    icon: '✦',
    title: 'صياغة الأسئلة',
    desc: 'اكتب أسئلة تختبر الفهم الحقيقي، لا الحفظ. هذا ما يفرق بين تعلّم يدوم وتعلّم يُنسى.',
  },
  {
    icon: '◇',
    title: 'تحسين المحتوى',
    desc: 'راجع وطوّر ما كتبه الآخرون. النظرة الثانية أحياناً أهم من الكتابة الأولى.',
  },
];

const QUALITIES = [
  {
    label: 'تفهم مادتك',
    detail: 'لا يشترط أن تكون معلماً — يكفي أن تعرف مادتك وتستطيع أن تشرحها لشخص يسمعها لأول مرة.',
  },
  {
    label: 'تقدّر تبسّط',
    detail: 'الاختبار الحقيقي: هل الفكرة واضحة بما يكفي لطالب في الثانوي؟ إن كانت كذلك — أنت جاهز.',
  },
  {
    label: 'لا تبحث عن الكمال',
    detail: 'درس واحد متقن يساوي عشرة مكتوبة على عجل. نحن نبني للمدى البعيد.',
  },
  {
    label: 'تؤمن بالفكرة',
    detail: 'المحتوى يُراجَع ويُحسَّن باستمرار. من يعمل هنا يؤمن أن التعليم الجيد حق، لا امتياز.',
  },
];

const GAINS = [
  {
    num: '٠١',
    title: 'أثر حقيقي، باسمك',
    body: 'كل درس تبنيه يحمل اسمك. طالب يفهم اليوم ربما يُعلّم غيره غداً — وستعلم أن ذلك بدأ منك.',
  },
  {
    num: '٠٢',
    title: 'مهارة نادرة',
    body: 'بناء محتوى تعليمي منظّم ومترابط مهارة قليلون يمتلكونها. ستتقنها هنا بأدوات مبنية لهذا الغرض.',
  },
  {
    num: '٠٣',
    title: 'شيء تذكره في سيرتك',
    body: 'مساهمة في مشروع يخدم آلاف الطلاب — هذا شيء يمكنك ذكره في أي مكان، بكل فخر.',
  },
  {
    num: '٠٤',
    title: 'مجتمع يشبهك',
    body: 'ستعمل مع أناس يؤمنون بنفس الشيء. أناس يرون في التعليم الجيد فرصة، لا عبئاً.',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function PreJoinPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // Hero entrance — staggered cascade
      gsap.fromTo(['.pj-eyebrow', '.pj-headline', '.pj-sub', '.pj-divider'],
        { opacity: 0, y: 22 },
        {
          opacity: 1, y: 0,
          duration: 0.85,
          ease: 'power3.out',
          stagger: 0.14,
          delay: 0.1,
        }
      );
      gsap.fromTo('.pj-divider',
        { scaleX: 0, transformOrigin: 'right center' },
        { scaleX: 1, duration: 1, ease: 'power3.out', delay: 0.62 }
      );

      // Origin block
      gsap.fromTo('.pj-origin',
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-origin', start: 'top 85%', once: true },
        }
      );

      // Pillars
      gsap.fromTo('.pj-pillar',
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.65, stagger: 0.11, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-pillars', start: 'top 85%', once: true },
        }
      );

      // Qualities
      gsap.fromTo('.pj-quality',
        { opacity: 0, x: 20 },
        {
          opacity: 1, x: 0, duration: 0.6, stagger: 0.09, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-qualities', start: 'top 85%', once: true },
        }
      );

      // Gains
      gsap.fromTo('.pj-gain',
        { opacity: 0, y: 28 },
        {
          opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-gains', start: 'top 85%', once: true },
        }
      );

      // Process steps
      gsap.fromTo('.pj-step',
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-steps', start: 'top 88%', once: true },
        }
      );

      // CTA
      gsap.fromTo('.pj-cta',
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: '.pj-cta', start: 'top 90%', once: true },
        }
      );

    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen relative" dir="rtl">

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[55vh] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(212,137,30,0.06) 0%, transparent 70%)',
            filter: 'blur(48px)',
          }}
        />
      </div>

      <div className="relative z-10">

        {/* ── HERO ──────────────────────────────────────────── */}
        <section className="pt-24 pb-20 sm:pt-32 sm:pb-28 px-6 max-w-4xl mx-auto">

          <p
            className="pj-eyebrow text-xs font-mono tracking-widest uppercase mb-6"
            style={{ color: 'var(--accent)', opacity: 0 }}
          >
            النفير — قبل أن تنضم
          </p>

          {/*
            CHANGED: Was "التعليم الجيد ليس حكراً / ونحن نبنيه معاً"
            The old headline carried an unintended edge — as if pointing a finger
            at someone who's gatekeeping. The new headline puts the focus on
            collective action and the Sudanese student specifically, which is
            the real story. It echoes the Nafeer concept from the landing page
            and opens with aspiration instead of complaint.
          */}
          <h1
            className="pj-headline font-arabic font-bold leading-snug mb-7"
            style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              color: 'var(--text-primary)',
              opacity: 0,
            }}
          >
            كل طالب سوداني يستحق
            <br />
            <span style={{ color: 'var(--accent)' }}>تعليماً يصله أينما كان</span>
          </h1>

          {/*
            CHANGED: Tightened the sub to land faster. Removed "بلا إعلانات"
            (true but feels defensive at this stage of the pitch) and replaced
            the explanatory last sentence with something that invites, not explains.
            The reader already knows why they're here — they clicked from the
            landing page. This sub should make them feel seen, not briefed.
          */}
          <p
            className="pj-sub text-base sm:text-lg leading-loose max-w-2xl"
            style={{ color: 'var(--text-secondary)', opacity: 0 }}
          >
            بشير تطبيق تعليمي مجاني مبني بالكامل للطالب السوداني —
            لا منهج يُباع، لا محتوى محاط بجدار. فقط تعليم يصل لكل طالب في كل مكان.
            هذه الصفحة لمن يفكر في المساهمة في بنائه.
          </p>

          <div
            className="pj-divider mt-12 h-px w-24"
            style={{ background: 'var(--border-mid)', opacity: 0 }}
          />
        </section>

        {/* ── ORIGIN STORY ──────────────────────────────────── */}
        <section
          className="px-6 py-20 sm:py-24"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="max-w-4xl mx-auto">

            <SectionLabel text="كيف بدأت الفكرة" />

            <div className="pj-origin mt-2">
              <p
                className="text-base sm:text-lg leading-loose max-w-2xl mb-8"
                style={{ color: 'var(--text-secondary)' }}
              >
                في ٢٠٢٤ كنت أُعيد تعلّم الرياضيات والإحصاء لدخول مجال الذكاء الاصطناعي.
                في تلك الرحلة اكتشفت شيئاً: المنهج السوداني في الأساس متين —
                لكننا نتعلمه معزولاً، بلا سياق، بلا ربط بالعالم الأوسع.
              </p>

              <p
                className="text-base sm:text-lg leading-loose max-w-2xl mb-10"
                style={{ color: 'var(--text-secondary)' }}
              >
                الفيزياء التي تعلّمناها تشرح كيف تعمل المحركات الحديثة.
                الرياضيات التي حفظناها هي لغة الخوارزميات اليوم.
                لكن لم يخبرنا أحد بذلك في الثانوي.
                بشير مبني لسد هذه الفجوة — لا لتغيير المنهج، بل لإضافة ما كان ينقصه دائماً.
              </p>

              {/* Highlight quote */}
              <div
                className="border-r-2 pr-5 py-1"
                style={{ borderColor: 'var(--accent)' }}
              >
                <p
                  className="text-base sm:text-xl font-arabic leading-loose"
                  style={{ color: 'var(--text-primary)' }}
                >
                  "لا نريد استبدال ما هو موجود —
                  نريد أن يُكمّل بعضه بعضاً."
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── WHAT BASHEER IS ───────────────────────────────── */}
        <section className="px-6 py-24 max-w-4xl mx-auto">

          <SectionLabel text="ليس مجرد تطبيق قراءة" />

          <p
            className="text-sm sm:text-base leading-loose mb-12 max-w-2xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            كل قرار في بشير مبني على سؤال واحد: ما الذي يجعل الطالب يفهم أكثر؟
            المحتوى يُنظَّم بخوارزميات تعلّم، التمارين تُبنى على فهم حقيقي،
            والتطبيق يعمل بلا إنترنت — لأن التعليم لا يجب أن ينتظر إشارة.
          </p>

          {/* Three pillars */}
          <div className="pj-pillars grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PILLARS.map((p, i) => (
              <PillarCard key={i} {...p} />
            ))}
          </div>

        </section>

        {/* ── WHY CONTRIBUTORS ──────────────────────────────── */}
        <section
          className="px-6 py-20 sm:py-24"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="max-w-4xl mx-auto">

            <SectionLabel text="لماذا المساهمون؟" />

            <p
              className="text-base sm:text-lg leading-loose max-w-2xl mb-6"
              style={{ color: 'var(--text-secondary)' }}
            >
              المحتوى الجيد لا يُصنع من فراغ — يُصنع من خبرة حقيقية بالمادة.
              معلم فيزياء يعرف أين يتعثر الطلاب. طالب جامعة أنهى الكيمياء يعرف ما الذي
              كان يتمنى أن يفهمه مبكراً. هذه المعرفة لا يمكن لأحد أن يكتبها عنك.
            </p>

            {/* University student callout */}
            <div
              className="my-10 p-6 sm:p-8 rounded-2xl"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <p
                className="text-xs font-mono mb-4 tracking-widest uppercase"
                style={{ color: 'var(--accent)' }}
              >أنت تحديداً</p>
              <p
                className="font-arabic font-bold leading-snug mb-4"
                style={{
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
                  color: 'var(--text-primary)',
                }}
              >
                طلاب بشير يحلمون بالجامعة —
                <br />
                <span style={{ color: 'var(--accent)' }}>وأنت عشت هذا الطريق</span>
              </p>
              <p
                className="text-sm sm:text-base leading-loose max-w-xl"
                style={{ color: 'var(--text-secondary)' }}
              >
                أنت لم تتعلّم الرياضيات فقط — أنت تعرف كيف تُدرَّس، وأين تُفقد، وكيف تُفهَم أخيراً.
                تعرف أي مفاهيم الفيزياء ستظهر في الجامعة وأيها مجرد حفظ يمر. تعرف ما لم يخبرك به أحد
                وكنت تتمنى أن يخبرك. هذه المعرفة — التي اكتسبتها باجتياز الطريق — هي بالضبط
                ما يحتاجه طالب الثانوي الآن.
              </p>
            </div>

            <p
              className="text-base sm:text-lg leading-loose max-w-2xl mb-12"
              style={{ color: 'var(--text-secondary)' }}
            >
              لهذا نفتح المنصة للمساهمين. لأن التعليم الذي يصنعه من عاشه
              مختلف تماماً عن التعليم الذي يصنعه من قرأ عنه.
            </p>

            {/* Qualities */}
            <div className="pj-qualities space-y-0">
              {QUALITIES.map((q, i) => (
                <QualityItem key={i} {...q} isLast={i === QUALITIES.length - 1} />
              ))}
            </div>

            {/*
              CHANGED: Honest note reframed.
              Old version led with "لا رواتب ولا مكافآت مادية" which, however
              honest, opens with what you're NOT getting. That's a conversion
              killer — it anchors the reader on absence before the value has
              landed. The new version reframes contribution as something
              voluntary and meaningful, and then addresses the early-stage
              reality with the same honesty but a different emotional stance:
              we're not apologizing for being early, we're inviting the right
              people to be part of something from the start.
            */}
            <div
              className="mt-12 p-5 sm:p-6 rounded-xl"
              style={{
                background: 'rgba(212,137,30,0.07)',
                border: '1px solid rgba(212,137,30,0.15)',
              }}
            >
              <p className="text-xs font-mono mb-2" style={{ color: 'var(--accent)' }}>بصراحة</p>
              <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
                بشير مشروع مجتمعي في جوهره — والمساهمة فيه طوعية بامتياز.
                لا نقدم مكافآت مادية، ونقول ذلك بوضوح من البداية.
                ما نقدمه هو فرصة حقيقية للإسهام في شيء يُبنى من الصفر — ويخدم طلاباً حقيقيين.
                المشروع في مراحله الأولى وبعض الأدوات لا تزال تتطور.
                إن كنت تبحث عن منصة ناضجة بكل شيء جاهز — ربما يكون الوقت مبكراً.
                أما إن كنت تريد أن تكون جزءاً من اللحظة التي يبدأ فيها شيء مهم — فأنت في المكان الصحيح.
              </p>
            </div>

          </div>
        </section>

        {/* ── WHAT YOU GAIN ─────────────────────────────────── */}
        <section className="px-6 py-24 max-w-4xl mx-auto">

          {/*
            CHANGED: Section label was "ما الذي تكسبه؟"
            Fine, but "تكسب" in Arabic can unconsciously read as material gain —
            which creates dissonance after we just said there's no money.
            "ما الذي يبقى منك" is warmer, more lasting, and reframes the
            conversation from extraction to legacy. It sets up the GAINS cards
            better because all four of them are about impact, not reward.
          */}
          <SectionLabel text="ما الذي يبقى منك" />

          {/*
            CHANGED: Old sub said "لا رواتب ولا مكافآت مادية — هذا واضح من البداية"
            We already said that in the honest note above — repeating it here
            doubles down on absence. The new sub skips the disclaimer and goes
            straight to the emotional truth: the things worth having can't be bought.
          */}
          <p
            className="text-sm sm:text-base leading-loose mb-12 max-w-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            بعض الأشياء لا يمكن شراؤها — ولا تجدها في كل فرصة.
          </p>

          <div className="pj-gains grid grid-cols-1 sm:grid-cols-2 gap-4">
            {GAINS.map((g, i) => (
              <GainCard key={i} {...g} />
            ))}
          </div>

        </section>

        {/* ── EXPANDING ROLES ───────────────────────────────── */}
        {/*
          NEW SECTION: The brief asks us to mention that we're not only looking
          for content contributors — there will be designers and an internal team.
          But since the roles aren't defined yet, we signal this lightly without
          over-promising. The section is compact by design: it anchors the content
          team as the core, then opens a door without giving it a name.
        */}
        <section
          className="px-6 py-20 sm:py-24"
          style={{ background: 'var(--bg-secondary)' }}
        >
          <div className="max-w-4xl mx-auto">

            <SectionLabel text="النفير أوسع من المحتوى" />

            <p
              className="text-base sm:text-lg leading-loose max-w-2xl mb-8"
              style={{ color: 'var(--text-secondary)' }}
            >
              فريق المحتوى هو قلب بشير — وهو ما نبنيه الآن.
              لكن مشروعاً من هذا النوع لا يقفه طاقم واحد:
              تصميم، تطوير، جودة، تواصل — هذه أدوار ستُفتح مع نمو المشروع.
            </p>

            <div
              className="p-5 sm:p-6 rounded-xl flex items-start gap-4"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-lg mt-0.5 shrink-0" style={{ color: 'var(--accent)' }}>◎</span>
              <p className="text-sm leading-loose" style={{ color: 'var(--text-secondary)' }}>
                إن كانت مهارتك خارج المحتوى — تصميم، برمجة، أو غيرها —
                قدّم طلبك الآن وأخبرنا ما الذي تجيده.
                نحن نبني قائمة الأدوار بالتوازي مع بناء المنصة، وأفضل الناس يُختارون قبل أن يُعلن عنها.
              </p>
            </div>

          </div>
        </section>

        {/* ── PROCESS ───────────────────────────────────────── */}
        <section className="px-6 py-24 max-w-4xl mx-auto">

          <SectionLabel text="ما الذي يحدث بعدها؟" />

          <p
            className="text-sm sm:text-base leading-loose mb-10 max-w-xl"
            style={{ color: 'var(--text-secondary)' }}
          >
            التقديم بسيط — لكنه مُصمَّم لنفهم بعضنا قبل أن نبدأ.
          </p>

          <div className="pj-steps grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { step: '١', label: 'تقدّم بطلبك', note: 'نموذج قصير — أقل من دقيقتين' },
              { step: '٢', label: 'نراجع طلبك', note: 'الموافقة تتم يدوياً، نُعلمك بالنتيجة' },
              { step: '٣', label: 'تبدأ المساهمة', note: 'رابط إعداد الحساب يصلك بعد القبول' },
            ].map((s, i) => (
              <div
                key={i}
                className="pj-step p-5 rounded-xl"
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

        </section>

        {/* ── CTA ───────────────────────────────────────────── */}
        <section className="px-6 pb-24 max-w-4xl mx-auto">
          <div
            className="pj-cta text-center py-16 px-8 rounded-2xl relative overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(212,137,30,0.07), transparent 65%)',
              }}
            />

            <div className="relative z-10">
              {/*
                CHANGED: Old eyebrow was "الجيل القادم ينتظر"
                True and evocative, but slightly generic. "طالب في مكان ما
                ينتظر درساً لم يُكتب بعد" is specific — it creates a mental
                image of a real person, which is more emotionally activating
                than an abstract generation.
              */}
              <p
                className="text-xs font-mono mb-5 tracking-widest uppercase"
                style={{ color: 'var(--text-muted)' }}
              >
                طالب في مكان ما ينتظر درساً لم يُكتب بعد
              </p>

              {/*
                CHANGED: Old headline was "نستطيع أن نصنع شيئاً يستحق — إن عملنا معاً"
                Solid, but ends on a condition ("إن عملنا"). The new version
                flips it into an invitation that assumes shared direction.
                "نبنيه بأيدٍ كثيرة" echoes the Nafeer spirit from the landing
                page and closes the loop the user started when they landed there.
              */}
              <h2
                className="font-arabic font-bold mb-5"
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.4rem)',
                  color: 'var(--text-primary)',
                  lineHeight: '1.4',
                }}
              >
                شيء يستحق البناء —
                <br />
                <span style={{ color: 'var(--accent)' }}>نبنيه بأيدٍ كثيرة</span>
              </h2>

              <p
                className="text-sm leading-loose max-w-md mx-auto mb-10"
                style={{ color: 'var(--text-secondary)' }}
              >
                التقديم لا يستغرق أكثر من دقيقتين.
                لا يوجد قرار نهائي الآن — مجرد خطوة أولى.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="/join"
                  className="inline-flex items-center gap-3 px-10 py-4 font-bold rounded-xl transition-all duration-300 text-sm"
                  style={{ background: 'var(--accent)', color: '#0e0c09' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background  = 'var(--accent-hover)';
                    e.currentTarget.style.boxShadow   = '0 0 50px var(--glow)';
                    e.currentTarget.style.transform   = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background  = 'var(--accent)';
                    e.currentTarget.style.boxShadow   = 'none';
                    e.currentTarget.style.transform   = 'translateY(0)';
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <span
        className="text-xs font-mono tracking-widest uppercase shrink-0"
        style={{ color: 'var(--accent)' }}
      >
        {text}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
    </div>
  );
}

function PillarCard({ icon, title, desc }) {
  return (
    <div
      className="pj-pillar p-6 rounded-xl transition-all duration-300"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(212,137,30,0.3)';
        e.currentTarget.style.transform   = 'translateY(-3px)';
        e.currentTarget.style.boxShadow   = '0 8px 32px rgba(0,0,0,0.16)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border-subtle)';
        e.currentTarget.style.transform   = 'translateY(0)';
        e.currentTarget.style.boxShadow   = 'none';
      }}
    >
      <span className="block text-lg mb-4 font-mono" style={{ color: 'var(--accent)' }}>{icon}</span>
      <h3 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-xs leading-loose" style={{ color: 'var(--text-muted)' }}>{desc}</p>
    </div>
  );
}

function QualityItem({ label, detail, isLast }) {
  return (
    <div
      className="pj-quality flex items-start gap-5 py-5"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
      }}
    >
      <span className="mt-0.5 text-base font-mono shrink-0" style={{ color: 'var(--accent)' }}>◆</span>
      <div>
        <p className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
        <p className="text-xs sm:text-sm leading-loose" style={{ color: 'var(--text-muted)' }}>{detail}</p>
      </div>
    </div>
  );
}

function GainCard({ num, title, body }) {
  return (
    <div
      className="pj-gain p-6 rounded-xl transition-all duration-300"
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
      <span className="block text-xs font-mono mb-4" style={{ color: 'var(--accent)', opacity: 0.6 }}>{num}</span>
      <h4 className="font-bold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h4>
      <p className="text-xs sm:text-sm leading-loose" style={{ color: 'var(--text-muted)' }}>{body}</p>
    </div>
  );
}
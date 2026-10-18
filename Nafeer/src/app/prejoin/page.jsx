'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button, Card } from '@/components/ui';

gsap.registerPlugin(ScrollTrigger);

// ─── /prejoin ─────────────────────────────────────────────────────────────────
// DS3: the "before you join" pitch on role tokens and the shared Card/Button.
// Content is visible without JavaScript; the gsap reveals are an enhancement
// and are skipped for people who ask for reduced motion.

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
    num: '01',
    title: 'أثر حقيقي، باسمك',
    body: 'كل درس تبنيه يحمل اسمك. طالب يفهم اليوم ربما يُعلّم غيره غداً — وستعلم أن ذلك بدأ منك.',
  },
  {
    num: '02',
    title: 'مهارة نادرة',
    body: 'بناء محتوى تعليمي منظّم ومترابط مهارة قليلون يمتلكونها. ستتقنها هنا بأدوات مبنية لهذا الغرض.',
  },
  {
    num: '03',
    title: 'شيء تذكره في سيرتك',
    body: 'مساهمة في مشروع يخدم آلاف الطلاب — هذا شيء يمكنك ذكره في أي مكان، بكل فخر.',
  },
  {
    num: '04',
    title: 'مجتمع يشبهك',
    body: 'ستعمل مع أناس يؤمنون بنفس الشيء. أناس يرون في التعليم الجيد فرصة، لا عبئاً.',
  },
];

const STEPS = [
  { step: '1', label: 'تقدّم بطلبك', note: 'نموذج قصير — أقل من دقيقتين' },
  { step: '2', label: 'نراجع طلبك', note: 'الموافقة تتم يدوياً، نُعلمك بالنتيجة' },
  { step: '3', label: 'تبدأ المساهمة', note: 'رابط إعداد الحساب يصلك بعد القبول' },
];

const LEAD = 'read t-body sm:text-lg leading-loose text-fg-muted max-w-2xl';
const CARD_HOVER = 'transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-line-accent motion-reduce:transform-none';

// ─── Component ───────────────────────────────────────────────────────────────

export default function PreJoinPage() {
  const pageRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const ctx = gsap.context(() => {
      const ease = 'power3.out';
      gsap.from(['.pj-eyebrow', '.pj-headline', '.pj-sub'], { opacity: 0, y: 22, duration: 0.85, ease, stagger: 0.14, delay: 0.1 });
      gsap.from('.pj-divider', { scaleX: 0, transformOrigin: 'right center', duration: 1, ease, delay: 0.5 });

      const reveal = (targets, trigger, from, extra = {}) =>
        gsap.from(targets, { opacity: 0, ...from, duration: 0.65, ease, ...extra, scrollTrigger: { trigger, start: 'top 85%', once: true } });
      reveal('.pj-origin', '.pj-origin', { y: 28 }, { duration: 0.8 });
      reveal('.pj-pillar', '.pj-pillars', { y: 24 }, { stagger: 0.11 });
      reveal('.pj-quality', '.pj-qualities', { x: 20 }, { stagger: 0.09 });
      reveal('.pj-gain', '.pj-gains', { y: 28 }, { stagger: 0.1 });
      reveal('.pj-step', '.pj-steps', { y: 20 }, { stagger: 0.12 });
      reveal('.pj-cta', '.pj-cta', { y: 24 }, { duration: 0.85 });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="min-h-screen bg-page text-fg font-ui" dir="rtl">

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="pt-24 pb-20 sm:pt-32 sm:pb-28 px-6 max-w-4xl mx-auto">
        <p className="pj-eyebrow t-label text-fg-accent mb-6">النفير — قبل أن تنضم</p>

        {/* The headline leads with aspiration and the Sudanese student, echoing the landing page. */}
        <h1 className="pj-headline t-display leading-snug text-fg-strong mb-7">
          كل طالب سوداني يستحق
          <br />
          <span className="text-fg-accent">تعليماً يصله أينما كان</span>
        </h1>

        <p className={`pj-sub ${LEAD}`}>
          بشير تطبيق تعليمي مجاني مبني بالكامل للطالب السوداني —
          لا منهج يُباع، لا محتوى محاط بجدار. فقط تعليم يصل لكل طالب في كل مكان.
          هذه الصفحة لمن يفكر في المساهمة في بنائه.
        </p>

        <div className="pj-divider mt-12 h-px w-24 bg-line-strong" />
      </section>

      {/* ── ORIGIN STORY ──────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-sunken">
        <div className="max-w-4xl mx-auto">
          <SectionLabel text="كيف بدأت الفكرة" />

          <div className="pj-origin mt-2">
            <p className={`${LEAD} mb-8`}>
              في 2024 كنت أُعيد تعلّم الرياضيات والإحصاء لدخول مجال الذكاء الاصطناعي.
              في تلك الرحلة اكتشفت شيئاً: المنهج السوداني في الأساس متين —
              لكننا نتعلمه معزولاً، بلا سياق، بلا ربط بالعالم الأوسع.
            </p>

            <p className={`${LEAD} mb-10`}>
              الفيزياء التي تعلّمناها تشرح كيف تعمل المحركات الحديثة.
              الرياضيات التي حفظناها هي لغة الخوارزميات اليوم.
              لكن لم يخبرنا أحد بذلك في الثانوي.
              بشير مبني لسد هذه الفجوة — لا لتغيير المنهج، بل لإضافة ما كان ينقصه دائماً.
            </p>

            <blockquote className="border-r-2 border-line-accent pr-5 py-1">
              <p className="read t-h3 font-normal leading-loose text-fg-strong">
                "لا نريد استبدال ما هو موجود —
                نريد أن يُكمّل بعضه بعضاً."
              </p>
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── WHAT BASHEER IS ───────────────────────────────── */}
      <section className="px-6 py-24 max-w-4xl mx-auto">
        <SectionLabel text="ليس مجرد تطبيق قراءة" />

        <p className={`${LEAD} mb-12`}>
          كل قرار في بشير مبني على سؤال واحد: ما الذي يجعل الطالب يفهم أكثر؟
          المحتوى يُنظَّم بخوارزميات تعلّم، التمارين تُبنى على فهم حقيقي،
          والتطبيق يعمل بلا إنترنت — لأن التعليم لا يجب أن ينتظر إشارة.
        </p>

        <div className="pj-pillars grid grid-cols-1 sm:grid-cols-3 gap-4">
          {PILLARS.map((p) => <PillarCard key={p.title} {...p} />)}
        </div>
      </section>

      {/* ── WHY CONTRIBUTORS ──────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-sunken">
        <div className="max-w-4xl mx-auto">
          <SectionLabel text="لماذا المساهمون؟" />

          <p className={`${LEAD} mb-6`}>
            المحتوى الجيد لا يُصنع من فراغ — يُصنع من خبرة حقيقية بالمادة.
            معلم فيزياء يعرف أين يتعثر الطلاب. طالب جامعة أنهى الكيمياء يعرف ما الذي
            كان يتمنى أن يفهمه مبكراً. هذه المعرفة لا يمكن لأحد أن يكتبها عنك.
          </p>

          {/* University student callout */}
          <Card padding="lg" className="my-10">
            <p className="t-label text-fg-accent mb-4">أنت تحديداً</p>
            <p className="t-h2 leading-snug text-fg-strong mb-4">
              طلاب بشير يحلمون بالجامعة —
              <br />
              <span className="text-fg-accent">وأنت عشت هذا الطريق</span>
            </p>
            <p className="read t-body leading-loose text-fg-muted max-w-xl">
              أنت لم تتعلّم الرياضيات فقط — أنت تعرف كيف تُدرَّس، وأين تُفقد، وكيف تُفهَم أخيراً.
              تعرف أي مفاهيم الفيزياء ستظهر في الجامعة وأيها مجرد حفظ يمر. تعرف ما لم يخبرك به أحد
              وكنت تتمنى أن يخبرك. هذه المعرفة — التي اكتسبتها باجتياز الطريق — هي بالضبط
              ما يحتاجه طالب الثانوي الآن.
            </p>
          </Card>

          <p className={`${LEAD} mb-12`}>
            لهذا نفتح المنصة للمساهمين. لأن التعليم الذي يصنعه من عاشه
            مختلف تماماً عن التعليم الذي يصنعه من قرأ عنه.
          </p>

          <ul className="pj-qualities divide-y divide-line">
            {QUALITIES.map((q) => <QualityItem key={q.label} {...q} />)}
          </ul>

          {/* The honest note: voluntary and early, said plainly, without leading with what's missing. */}
          <div className="mt-12 p-5 sm:p-6 rounded-card bg-accent-wash border border-line-accent">
            <p className="t-label text-fg-accent mb-2">بصراحة</p>
            <p className="read t-body leading-loose text-fg-muted">
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
        {/* "What stays of you" rather than "what you earn": legacy, not reward. */}
        <SectionLabel text="ما الذي يبقى منك" />

        <p className={`${LEAD} mb-12`}>
          بعض الأشياء لا يمكن شراؤها — ولا تجدها في كل فرصة.
        </p>

        <div className="pj-gains grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GAINS.map((g) => <GainCard key={g.num} {...g} />)}
        </div>
      </section>

      {/* ── EXPANDING ROLES ───────────────────────────────── */}
      {/* Content is the core team; other roles are signalled lightly, without naming them yet. */}
      <section className="px-6 py-20 sm:py-24 bg-sunken">
        <div className="max-w-4xl mx-auto">
          <SectionLabel text="النفير أوسع من المحتوى" />

          <p className={`${LEAD} mb-8`}>
            فريق المحتوى هو قلب بشير — وهو ما نبنيه الآن.
            لكن مشروعاً من هذا النوع لا يقفه طاقم واحد:
            تصميم، تطوير، جودة، تواصل — هذه أدوار ستُفتح مع نمو المشروع.
          </p>

          <Card className="flex items-start gap-4">
            <span aria-hidden="true" className="t-h3 text-fg-accent shrink-0">◎</span>
            <p className="read t-body leading-loose text-fg-muted">
              إن كانت مهارتك خارج المحتوى — تصميم، برمجة، أو غيرها —
              قدّم طلبك الآن وأخبرنا ما الذي تجيده.
              نحن نبني قائمة الأدوار بالتوازي مع بناء المنصة، وأفضل الناس يُختارون قبل أن يُعلن عنها.
            </p>
          </Card>
        </div>
      </section>

      {/* ── PROCESS ───────────────────────────────────────── */}
      <section className="px-6 py-24 max-w-4xl mx-auto">
        <SectionLabel text="ما الذي يحدث بعدها؟" />

        <p className={`${LEAD} mb-10`}>
          التقديم بسيط — لكنه مُصمَّم لنفهم بعضنا قبل أن نبدأ.
        </p>

        <ol className="pj-steps grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STEPS.map((s) => (
            <Card key={s.step} as="li" className="pj-step">
              <span className="block t-h2 text-fg-accent mb-3">{s.step}</span>
              <p className="t-title text-fg-strong mb-1">{s.label}</p>
              <p className="t-caption text-fg-subtle">{s.note}</p>
            </Card>
          ))}
        </ol>
      </section>

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <Card tone="accent" padding="none" className="pj-cta text-center py-16 px-6 sm:px-8">
          {/* A specific person waiting, rather than an abstract generation. */}
          <p className="t-label text-fg-muted mb-5">طالب في مكان ما ينتظر درساً لم يُكتب بعد</p>

          <h2 className="t-h1 leading-snug text-fg-strong mb-5">
            شيء يستحق البناء —
            <br />
            <span className="text-fg-accent">نبنيه بأيدٍ كثيرة</span>
          </h2>

          <p className="read t-body leading-loose text-fg-muted max-w-md mx-auto mb-10">
            التقديم لا يستغرق أكثر من دقيقتين.
            لا يوجد قرار نهائي الآن — مجرد خطوة أولى.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button as={Link} href="/join" variant="primary" size="lg">تقدّم الآن ←</Button>
            <Link href="/" className="t-label text-fg-muted hover:text-fg transition-colors">العودة للرئيسية</Link>
          </div>
        </Card>
      </section>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <h2 className="t-label text-fg-accent shrink-0">{text}</h2>
      <div className="flex-1 h-px bg-line" />
    </div>
  );
}

function PillarCard({ icon, title, desc }) {
  return (
    <Card className={`pj-pillar ${CARD_HOVER}`}>
      <span aria-hidden="true" className="block t-h3 text-fg-accent mb-4">{icon}</span>
      <h3 className="t-title text-fg-strong mb-2">{title}</h3>
      <p className="read t-label font-normal leading-loose text-fg-muted">{desc}</p>
    </Card>
  );
}

function QualityItem({ label, detail }) {
  return (
    <li className="pj-quality flex items-start gap-5 py-5">
      <span aria-hidden="true" className="mt-0.5 text-fg-accent shrink-0">◆</span>
      <div>
        <p className="t-title text-fg-strong mb-1">{label}</p>
        <p className="read t-label font-normal leading-loose text-fg-muted">{detail}</p>
      </div>
    </li>
  );
}

function GainCard({ num, title, body }) {
  return (
    <Card className={`pj-gain ${CARD_HOVER}`}>
      <span className="block t-caption text-fg-accent mb-4">{num}</span>
      <h3 className="t-title text-fg-strong mb-2">{title}</h3>
      <p className="read t-label font-normal leading-loose text-fg-muted">{body}</p>
    </Card>
  );
}

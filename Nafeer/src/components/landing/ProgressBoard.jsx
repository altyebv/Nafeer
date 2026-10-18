'use client';
import { useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMotion, reveal } from '@/lib/gsap';
import { Button, Eyebrow, cx } from '@/components/ui';
import { LandingSection } from './Section';
import { useCoverage } from './useCoverage';

// Track headings on status tones instead of per-track hex.
const TRACKS = [
  { key: 'COMMON',   label: 'المواد المشتركة', desc: 'لجميع الطلاب', tone: 'text-fg-accent' },
  { key: 'SCIENCE',  label: 'المسار العلمي',   desc: 'علمي',          tone: 'text-info' },
  { key: 'LITERARY', label: 'المسار الأدبي',   desc: 'أدبي',          tone: 'text-special' },
];

export default function ProgressBoard() {
  const sectionRef = useRef(null);
  const { subjects, total, started, open } = useCoverage();

  useMotion(sectionRef, (el) => {
    reveal('.progress-header', { y: 28, duration: 0.8 });
    reveal('.progress-stat', { trigger: '.progress-stats', y: 16, scale: 0.92, stagger: 0.1, duration: 0.5, ease: 'back.out(1.4)' });
    reveal('.subject-row', { trigger: el, y: 0, x: 12, stagger: 0.03, duration: 0.35, start: 'top 82%' });
  });

  return (
    <LandingSection ref={sectionRef} id="progress-board" width="wide"
      decoration={<div aria-hidden="true" className="ember-line absolute top-0 inset-x-0 max-w-7xl mx-auto opacity-40" />}>

      <div className="progress-header mb-10 sm:mb-14 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Eyebrow as="p" className="mb-4">مباشر — يتحدث عن نفسه</Eyebrow>
          <h2 className="text-3xl sm:text-4xl font-arabic font-bold mb-3 text-fg-strong">هذا ما بُني حتى الآن</h2>
          <p className="read max-w-md t-body leading-loose text-fg-muted">
            كل شريط تقدم بناه إنسان حقيقي.{' '}
            <span className="text-fg-accent">الأشرطة الفارغة مقاعد شاغرة.</span>
          </p>
        </div>

        <dl className="progress-stats flex gap-6 sm:gap-10 shrink-0">
          {[
            { value: total,   label: 'مادة' },
            { value: started, label: 'بُدئت' },
            { value: open,    label: 'مقعد شاغر' },
          ].map((stat) => (
            <div key={stat.label} className="progress-stat flex flex-col-reverse items-center">
              <dt className="t-caption mt-1 text-fg-muted">{stat.label}</dt>
              <dd className="t-num font-ui text-3xl sm:text-4xl font-bold text-fg-accent">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="space-y-8 sm:space-y-10">
        {TRACKS.map(({ key, label, desc, tone }) => {
          const trackSubjects = subjects.filter((s) => s.track === key);
          const required      = trackSubjects.filter((s) => !s.isMajor);
          const majors        = trackSubjects.filter((s) => s.isMajor);
          return (
            <div key={key}>
              <div className="flex items-center gap-3 mb-3">
                <h3 className={cx('t-title', tone)}>{label}</h3>
                <span className="t-caption text-fg-subtle">{desc}</span>
                <div aria-hidden="true" className="flex-1 h-px bg-line" />
              </div>

              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {required.map((s) => <SubjectRow key={s.id} subject={s} />)}
              </ul>

              {majors.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-line">
                  <p className="t-caption mb-2 text-fg-subtle">تخصص — اختر واحداً</p>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {majors.map((s) => <SubjectRow key={s.id} subject={s} isMajor />)}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-between gap-5 pt-8 sm:pt-10 border-t border-line">
        <p className="t-body text-center sm:text-right text-fg-muted">
          مادتك في انتظارك — لديك معرفة فيها؟
          <span className="block t-caption mt-0.5 text-fg-subtle">احجز مقعدك في النفير</span>
        </p>
        <Button as="a" href="/join" variant="primary" size="lg" iconEnd={ArrowLeft} className="shrink-0">طلب انضمام للنفير</Button>
      </div>
    </LandingSection>
  );
}

function SubjectRow({ subject, isMajor = false }) {
  const pct = subject.progress;
  const isAvailable = pct === 0 && !subject.contributor;
  return (
    <li className={cx('subject-row flex items-center gap-3 py-2.5 px-3.5 rounded-card border bg-raised transition-colors duration-200 hover:bg-hover hover:border-line-strong',
      isMajor ? 'border-dashed border-line' : 'border-line')}>
      <div aria-hidden="true" className={cx('w-1 self-stretch min-h-5 rounded-full shrink-0 bg-accent', pct > 0 ? 'opacity-80' : 'opacity-25')} />

      <div className="flex-1 min-w-0">
        <span className="t-label font-semibold block leading-snug text-fg-strong">{subject.nameAr}</span>
        <span className="t-caption text-fg-subtle">{subject.units.length} وحدات · {subject.totalLessons} درس</span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={`${subject.nameAr}: ${pct}%`}
          className="w-16 sm:w-24 h-1 rounded-full overflow-hidden bg-line-strong">
          <div className="h-full rounded-full bg-accent transition-[width] duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <span aria-hidden="true" className={cx('t-caption t-num w-8 text-center', pct > 0 ? 'text-fg-accent' : 'text-fg-subtle')}>{pct}%</span>
      </div>

      {isAvailable ? (
        <a href="/join" className="t-caption px-2 py-1 rounded-chip shrink-0 border border-line-accent bg-accent-wash text-fg-accent hover:bg-accent hover:text-fg-on-accent transition-colors touch-target">
          احجز<span className="sr-only"> {subject.nameAr}</span>
        </a>
      ) : subject.contributor ? (
        <span className="t-caption shrink-0 text-fg-muted">{subject.contributor}</span>
      ) : null}
    </li>
  );
}

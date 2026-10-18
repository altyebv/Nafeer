'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Blocks, BookOpen, CircleHelp, Landmark, Radio, Sparkles } from 'lucide-react';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';
import { useMotion, reveal } from '@/lib/gsap';
import { Badge, Button, Eyebrow, cx } from '@/components/ui';
import { formatNumber } from '@/lib/format';
import { LandingSection } from './Section';

const SUBJECT_LABEL = Object.fromEntries(SUBJECTS_CATALOG.map((s) => [s.id, s.nameAr]));

// ── Avatar ────────────────────────────────────────────────────────────────────
// next/image needs real numbers; these mirror w-11 / w-16 / w-24.
const DIMS = { sm: ['w-11 h-11 t-label', 44], md: ['w-16 h-16 t-title', 64], lg: ['w-24 h-24 t-h1', 96] };

function Avatar({ avatarUrl, name, size = 'md' }) {
  const [cls, px] = DIMS[size];
  const initials = (name || '؟').split(' ').slice(0, 2).map((w) => w[0]).join('');
  if (avatarUrl) {
    return <Image src={avatarUrl} alt="" width={px} height={px} className={cx(cls, 'rounded-full object-cover shrink-0 border-2 border-line-accent')} />;
  }
  return (
    <div aria-hidden="true" className={cx(cls, 'rounded-full flex items-center justify-center font-bold shrink-0 select-none bg-accent text-fg-on-accent')}>
      {initials}
    </div>
  );
}

function SubjectBadge({ subject }) {
  if (!subject) return null;
  return <Badge tone="accent" size="sm">{SUBJECT_LABEL[subject] || subject}</Badge>;
}

function EduBadge({ background, fieldOfStudy }) {
  const text = background || fieldOfStudy;
  if (!text) return null;
  return <Badge size="sm" className="max-w-[180px] truncate"><span className="truncate" title={text}>{text}</span></Badge>;
}

function StatPill({ icon: Icon, value, label }) {
  if (!value) return null;
  return (
    <span className="flex items-center gap-1.5">
      <Icon size={15} strokeWidth={1.9} className="text-fg-accent" aria-hidden="true" />
      <span className="t-num t-label font-bold text-fg-strong">{formatNumber(value)}</span>
      <span className="t-caption text-fg-muted">{label}</span>
    </span>
  );
}

function NameLink({ contributor, className }) {
  return contributor.username
    ? <Link href={`/contributor/${contributor.username}`} className={cx('hover:text-fg-accent transition-colors', className)}>{contributor.name}</Link>
    : <span className={className}>{contributor.name}</span>;
}

// ── Featured card (rank #1) ───────────────────────────────────────────────────
function FeaturedCard({ contributor }) {
  const s = contributor.stats || {};
  return (
    <article className="hall-card relative p-7 sm:p-10 rounded-panel overflow-hidden bg-raised border border-line-accent transition-shadow duration-300 hover:shadow-lift">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none l-wash-top" />

      <div className="relative flex flex-wrap items-center justify-between gap-3 mb-7">
        <span aria-hidden="true" className="t-num font-ui text-5xl sm:text-6xl font-bold select-none text-fg-strong opacity-[0.06]">#001</span>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="accent" size="sm" icon={Sparkles}>المساهم الأول</Badge>
          <SubjectBadge subject={contributor.subject} />
        </div>
      </div>

      <div className="relative flex flex-col sm:flex-row items-start gap-5 sm:gap-7 mb-7">
        <Avatar avatarUrl={contributor.avatarUrl} name={contributor.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h3 className="text-2xl sm:text-3xl font-arabic font-bold leading-tight mb-1 text-fg-strong">
            <NameLink contributor={contributor} />
          </h3>
          {contributor.username && <p dir="ltr" className="t-label font-normal mb-2.5 text-fg-subtle text-right">@{contributor.username}</p>}
          <div className="flex flex-wrap gap-2 mb-3">
            <EduBadge background={contributor.background} fieldOfStudy={contributor.fieldOfStudy} />
          </div>
          {contributor.bio && <p className="read t-body leading-loose line-clamp-3 text-fg-muted">{contributor.bio}</p>}
        </div>
      </div>

      <div className="relative flex flex-wrap gap-6 pt-5 border-t border-line">
        <StatPill icon={BookOpen}   value={s.lessonsCreated}   label="درس" />
        <StatPill icon={CircleHelp} value={s.questionsAdded}   label="سؤال" />
        <StatPill icon={Radio}      value={s.feedItemsCreated} label="تغذية" />
        <StatPill icon={Blocks}     value={s.blocksAdded}      label="وحدة" />
      </div>
    </article>
  );
}

// ── Regular contributor card ──────────────────────────────────────────────────
function ContributorCard({ contributor, rank }) {
  const s = contributor.stats || {};
  return (
    <li className="hall-card relative flex flex-col p-6 rounded-card overflow-hidden bg-raised border border-line transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-line-accent hover:shadow-lift motion-reduce:transform-none">
      <div className="flex items-center justify-between mb-4">
        <span aria-hidden="true" className="t-num t-caption font-bold select-none text-fg-subtle">#{String(rank).padStart(3, '0')}</span>
        <SubjectBadge subject={contributor.subject} />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Avatar avatarUrl={contributor.avatarUrl} name={contributor.name} size="sm" />
        <div className="min-w-0">
          <h3 className="t-title truncate text-fg-strong"><NameLink contributor={contributor} /></h3>
          {contributor.username && <p dir="ltr" className="t-caption truncate text-fg-subtle text-right">@{contributor.username}</p>}
        </div>
      </div>

      <div className="mb-3"><EduBadge background={contributor.background} fieldOfStudy={contributor.fieldOfStudy} /></div>

      {contributor.bio && <p className="read t-body leading-loose flex-1 mb-4 line-clamp-2 text-fg-muted">{contributor.bio}</p>}

      <div className="flex gap-4 pt-3 mt-auto flex-wrap border-t border-line">
        <StatPill icon={BookOpen}   value={s.lessonsCreated}   label="درس" />
        <StatPill icon={CircleHelp} value={s.questionsAdded}   label="سؤال" />
        <StatPill icon={Radio}      value={s.feedItemsCreated} label="تغذية" />
      </div>
    </li>
  );
}

function EmptyHall() {
  return (
    <div className="hall-grid text-center py-20 px-6 rounded-panel bg-raised border border-dashed border-line-strong">
      <Landmark size={34} strokeWidth={1.4} className="mx-auto mb-6 text-fg-accent opacity-40" aria-hidden="true" />
      <h3 className="t-h2 mb-3 text-fg-strong">القاعة في انتظار أعمدتها</h3>
      <p className="read t-body leading-loose mb-8 max-w-sm mx-auto text-fg-muted">
        كن من أوائل المساهمين — اسمك الأول في قاعة شرف تصنع أثراً حقيقياً لآلاف الطلاب.
      </p>
      <Button as="a" href="/join" variant="primary" size="lg">انضم للنفير</Button>
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
export default function ContributorsHallSection() {
  const sectionRef = useRef(null);
  const [contributors, setContributors] = useState(null);
  const [visible, setVisible]           = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/site-setting').then((r) => r.json()).catch(() => ({ showContributorsOnLanding: true })),
      fetch('/api/contributors/public').then((r) => r.json()).catch(() => ({ contributors: [] })),
    ]).then(([settings, data]) => {
      setVisible(settings.showContributorsOnLanding !== false);
      setContributors(data.contributors || []);
    });
  }, []);

  useMotion(sectionRef, () => {
    reveal('.hall-header', { y: 40, duration: 0.9 });
    reveal('.hall-ticker', { y: 20 });
    reveal('.hall-card', { trigger: '.hall-grid', y: 40, scale: 0.97, stagger: 0.1, duration: 0.68 });
    reveal('.hall-cta', { y: 20, start: 'top 94%' });
  }, [contributors, visible]);

  if (!visible || contributors === null) return null;

  const [featured, ...rest] = contributors;
  const sum = (key) => contributors.reduce((a, c) => a + (c.stats?.[key] || 0), 0);
  const ticker = [
    { value: contributors.length,       label: 'مساهم نشط' },
    { value: sum('lessonsCreated'),     label: 'درس مُنجز' },
    { value: sum('questionsAdded'),     label: 'سؤال في البنك' },
    { value: sum('feedItemsCreated'),   label: 'عنصر تغذية' },
  ].filter((t) => t.value > 0);

  return (
    <LandingSection ref={sectionRef} id="contributors" width="wide"
      decoration={<div aria-hidden="true" className="ember-line absolute top-0 inset-x-0 max-w-7xl mx-auto opacity-40" />}>

      <div className="hall-header mb-5">
        <Eyebrow as="p" className="mb-3">قاعة الشرف</Eyebrow>
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-arabic font-bold mb-4 text-fg-strong">وجوه خلف المحتوى</h2>
        <div aria-hidden="true" className="ember-line w-20 sm:w-28 mb-5" />
        <p className="read t-body sm:text-lg leading-loose max-w-xl text-fg-muted">
          كل درس في بشير كتبه شخص اختار أن يمنح وقته وخبرته.
          هؤلاء ليسوا موظفين —{' '}
          <span className="text-fg-accent">هم معلمون وطلاب ومتحمسون قرروا أن تحسين التعليم يستحق جهدهم.</span>
        </p>
      </div>

      {ticker.length > 0 && (
        <dl className="hall-ticker flex flex-wrap gap-8 sm:gap-12 mb-12 py-4 px-6 rounded-card bg-raised border border-line">
          {ticker.map(({ value, label }) => (
            <div key={label} className="flex items-baseline gap-2">
              <dd className="t-num font-ui text-xl font-bold text-fg-accent">{formatNumber(value)}</dd>
              <dt className="t-caption text-fg-muted">{label}</dt>
            </div>
          ))}
        </dl>
      )}

      {contributors.length === 0 ? <EmptyHall /> : (
        <div className="hall-grid space-y-6">
          {featured && <FeaturedCard contributor={featured} />}
          {rest.length > 0 && (
            <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {rest.map((c, i) => <ContributorCard key={c._id || i} contributor={c} rank={i + 2} />)}
            </ul>
          )}
          <div className="hall-cta text-center py-10 rounded-panel border border-dashed border-line-strong">
            <p className="t-body mb-4 text-fg-muted">مقعدك في القاعة ينتظرك</p>
            <Button as="a" href="/join" variant="secondary">انضم للمساهمين</Button>
          </div>
        </div>
      )}
    </LandingSection>
  );
}

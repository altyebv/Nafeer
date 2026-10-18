'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { lessonReadiness, recentLessons } from '@/lib/lessonReadiness';
import { lessonHref, NAV_BY_ID } from '@/components/editor/layout/nav';
import { Card } from '@/components/ui';

// ─── Dashboard: next step and unit progress ───────────────────────────────────
// DS2 step 8 (canvas board Dashboard). Both read the stores the editor already
// loaded and the browser's recently-opened list — no request.

function useSubjectProgress() {
  const { subject, units, lessons, sections, blocks, questions, feedItems } = useDataStore(
    useShallow((s) => ({ subject: s.subject, units: s.units, lessons: s.lessons, sections: s.sections, blocks: s.blocks, questions: s.questions, feedItems: s.feedItems })),
  );
  return useMemo(() => {
    if (!subject) return null;
    const stores = { sections, blocks, questions, feedItems };
    const sortedUnits = [...units].sort((a, b) => a.order - b.order);
    const rows = sortedUnits.map((u, i) => {
      const ls = lessons.filter((l) => l.unitId === u.id).sort((a, b) => a.order - b.order)
        .map((l, li) => ({ lesson: l, n: li + 1, r: lessonReadiness(l, stores) }));
      return {
        unit: u, n: i + 1, lessons: ls,
        ready: ls.filter((x) => x.r.done === 6).length,
        started: ls.filter((x) => x.r.counts.sections > 0).length,
      };
    });
    return { subject, rows, all: rows.flatMap((u) => u.lessons.map((x) => ({ ...x, unitN: u.n }))) };
  }, [subject, units, lessons, sections, blocks, questions, feedItems]);
}

// Which lesson to open, in order of what helps most: one the reviewer
// returned, the one being worked on, one ready to send, the first unstarted.
function pickNextStep(all, recent) {
  const returned = all.find((x) => x.lesson.reviewState?.returned);
  if (returned) return { x: returned, kicker: 'أُعيد إليك', title: `عالج ملاحظات المراجِع في «${returned.lesson.title}»`, body: 'كل ملاحظة مثبّتة في مكانها داخل الدرس. بعد معالجتها كلها يمكنك إعادة الإرسال.', cta: 'افتح الملاحظات' };

  const byId = Object.fromEntries(all.map((x) => [x.lesson.id, x]));
  const current = recent.map((r) => byId[r.id]).find((x) => x && x.r.done < 6 && x.lesson.atlasStatus === 'draft');
  if (current) return { x: current, kicker: 'تابع من حيث توقفت', title: `أكمل «${current.lesson.title}»`, body: `ينقصه: ${current.r.missing.join('، ')}.`, cta: 'تابع الدرس' };

  const ready = all.find((x) => x.r.done === 6 && x.lesson.atlasStatus === 'draft');
  if (ready) return { x: ready, kicker: 'جاهز', title: `أرسل «${ready.lesson.title}» للمراجعة`, body: 'الشروط الست مكتملة. المراجِع يقرأه ويعتمده أو يعيده بملاحظات.', cta: 'افتح وأرسل' };

  const fresh = all.find((x) => x.r.counts.sections === 0 && x.lesson.atlasStatus === 'draft');
  if (fresh) return { x: fresh, kicker: 'ابدأ', title: `ابدأ الدرس ${fresh.n} من الوحدة ${fresh.unitN}`, body: `${fresh.lesson.estimatedMinutes || 15} دقيقة تقريباً للطالب. اكتب عنواناً حقيقياً وملخصاً، ثم أضف قسمك الأول.`, cta: 'افتح الدرس' };

  return null;
}

export function NextStepCard() {
  const progress = useSubjectProgress();
  const [recent, setRecent] = useState([]);
  useEffect(() => { setRecent(recentLessons()); }, []);
  if (!progress) return null;

  const step = pickNextStep(progress.all, recent);
  if (!step) {
    return (
      <Card tone="accent" className="mb-8">
        <p className="t-body text-fg">كل دروس {progress.subject.nameAr} أُرسلت أو اعتُمدت. شكراً لك.</p>
      </Card>
    );
  }
  return (
    <section aria-label="خطوتك التالية" className="mb-8 flex items-center justify-between gap-4 flex-wrap p-5 rounded-card bg-raised border border-line-accent">
      <div className="flex flex-col gap-1 min-w-0 flex-1">
        <span className="t-caption font-semibold text-fg-accent">خطوتك التالية · {step.kicker}</span>
        <h2 className="t-h3 text-fg-strong">{step.title}</h2>
        <p className="t-label font-normal text-fg-muted">الوحدة {step.x.unitN} · الدرس {step.x.n} · {step.body}</p>
      </div>
      <Link href={lessonHref(step.x.lesson.id)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-control bg-accent hover:bg-accent-hover text-fg-on-accent t-ui font-semibold shrink-0">
        {step.cta} <ArrowLeft size={16} aria-hidden="true" />
      </Link>
    </section>
  );
}

export function UnitProgressCard() {
  const progress = useSubjectProgress();
  if (!progress) return null;
  const total = progress.all.length;
  const ready = progress.rows.reduce((n, u) => n + u.ready, 0);
  return (
    <Card title={`تقدّم ${progress.subject.nameAr}`}
      actions={<span className="t-caption text-fg-subtle tabular-nums">{ready} / {total} جاهز</span>}>
      <ul className="flex flex-col gap-3">
        {progress.rows.map((u) => {
          const n = u.lessons.length || 1;
          return (
            <li key={u.unit.id} className="flex flex-col gap-1">
              <span className="flex justify-between gap-3 t-label">
                <span className="text-fg truncate">{u.n} · {u.unit.title}</span>
                <span className="text-fg-muted tabular-nums shrink-0" dir="ltr">{u.ready} / {u.lessons.length}</span>
              </span>
              <span className="flex h-1.5 rounded-chip bg-hover overflow-hidden" role="img"
                aria-label={`${u.ready} جاهز و${u.started - u.ready} قيد العمل من ${u.lessons.length}`}>
                <span className="bg-success" style={{ width: `${(u.ready / n) * 100}%` }} />
                <span className="bg-accent" style={{ width: `${((u.started - u.ready) / n) * 100}%` }} />
              </span>
            </li>
          );
        })}
      </ul>
      <Link href={NAV_BY_ID.lessons.href} className="inline-flex items-center gap-1 mt-4 t-label text-fg-accent hover:underline">
        كل الدروس <ArrowLeft size={14} aria-hidden="true" />
      </Link>
    </Card>
  );
}

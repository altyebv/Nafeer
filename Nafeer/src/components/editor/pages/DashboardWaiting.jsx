'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, MessageCircle, Undo2 } from 'lucide-react';
import { useDataStore } from '@/store/dataStore';
import { useShallow } from 'zustand/react/shallow';
import { WAITING_KINDS, waitingItems } from '@/lib/waiting';
import { arCount, formatRelative } from '@/lib/format';
import { lessonHref } from '@/components/editor/layout/nav';

// ─── Dashboard: what is waiting for you ───────────────────────────────────────
// The rules are lib/waiting.js. Reads the stores the editor already loaded; the
// sidebar's home badge uses the same hook.

const PER_GROUP = 5;

/** The member whose list this is: nobody for the owner viewing the editor. */
export const waitingOwner = (contributor) =>
  (contributor?.role === 'admin' || !contributor?.id ? null : String(contributor.id));

export function useWaiting(me) {
  const lessons = useDataStore(useShallow((s) => s.lessons));
  return useMemo(() => waitingItems(lessons, me), [lessons, me]);
}

const GROUPS = {
  returned: {
    label: 'أُعيد إليك', icon: Undo2, tone: 'text-warn',
    detail: (i) => (i.count
      ? arCount(i.count, { one: 'ملاحظة واحدة للمعالجة', two: 'ملاحظتان للمعالجة', few: 'ملاحظات للمعالجة', many: 'ملاحظة للمعالجة' })
      : 'عولجت الملاحظات — أعد الإرسال'),
  },
  reply: {
    label: 'تعليقات على دروسك', icon: MessageCircle, tone: 'text-info',
    detail: (i) => (i.count === 1
      ? `${i.flag ? 'تنبيه' : 'تعليق'} من ${i.by || 'عضو'}`
      : arCount(i.count, { one: '', two: 'تعليقان', few: 'تعليقات', many: 'تعليقاً' })),
    href: (i) => `${lessonHref(i.lessonId)}?notes=1`,
  },
  // The heading says it all; the row shows only when.
  approved: { label: 'اعتُمد', icon: CircleCheck, tone: 'text-success', detail: () => '' },
};

function Group({ kind, items }) {
  const [all, setAll] = useState(false);
  const { label, icon: Icon, tone, detail, href = (i) => lessonHref(i.lessonId) } = GROUPS[kind];
  const shown = all ? items : items.slice(0, PER_GROUP);
  return (
    <li>
      <h3 className={`flex items-center gap-1.5 t-caption font-semibold ${tone}`}>
        <Icon size={14} aria-hidden="true" /> {label}
      </h3>
      <ul>
        {shown.map((i) => (
          <li key={i.lessonId}>
            <Link href={href(i)} className="flex items-baseline justify-between gap-3 flex-wrap py-2 px-2 -mx-2 rounded-control hover:bg-hover transition-colors">
              <span className="t-ui text-fg-strong min-w-0 truncate">{i.title}</span>
              <span className="t-caption text-fg-muted">
                {[detail(i), i.at && formatRelative(i.at)].filter(Boolean).join(' · ')}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > shown.length && (
        <button type="button" onClick={() => setAll(true)} className="t-label text-fg-accent hover:underline">
          عرض الكل ({items.length})
        </button>
      )}
    </li>
  );
}

export default function WaitingList({ me }) {
  const items = useWaiting(me);
  const loaded = useDataStore((s) => !!s.subject);
  if (!me || !loaded) return null;

  if (!items.length) {
    return <p className="mb-4 t-label font-normal text-fg-muted">لا شيء ينتظرك الآن.</p>;
  }
  return (
    <section aria-labelledby="waiting-title" className="mb-8 p-5 rounded-card bg-raised border border-line">
      <h2 id="waiting-title" className="t-h3 text-fg-strong mb-3">ينتظرك</h2>
      <ul className="flex flex-col gap-4">
        {WAITING_KINDS.map((kind) => {
          const group = items.filter((i) => i.kind === kind);
          return group.length ? <Group key={kind} kind={kind} items={group} /> : null;
        })}
      </ul>
    </section>
  );
}

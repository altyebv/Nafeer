import { Inbox } from 'lucide-react';

export function EmptyState({ text, sub }) {
  return (
    <div className="text-center py-20 px-4">
      <Inbox size={36} strokeWidth={1.25} className="mx-auto mb-4 text-ink-700" aria-hidden="true" />
      <p className="text-ink-400 font-arabic text-base">{text}</p>
      {sub && <p className="text-ink-600 font-arabic text-sm mt-1.5">{sub}</p>}
    </div>
  );
}

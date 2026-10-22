'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { MarkerQuestion } from '@/components/media/MarkerQuestion';
import { sanitiseMarkers } from '@/lib/markerUtils';
import { distractorsOf } from '@/lib/markerQuestion';

// ─── MarkerTryout ─────────────────────────────────────────────────────────────
// "Try it as a student" under a complete marker question: the real student
// view, graded by the same functions as the app. Any edit to the question
// starts the attempt over.

export default function MarkerTryout({ question }) {
  const [open, setOpen] = useState(false);
  const q = {
    ...question,
    markers: sanitiseMarkers(question.markers).map((m) => ({ ...m, answer: (m.answer || '').trim() })),
    options: distractorsOf(question),
  };
  const key = JSON.stringify([q.imageUrl, q.markerMode, q.markers, q.options]);

  return (
    <section className="rounded-card border border-line bg-raised p-4">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="flex items-center gap-2 t-label text-fg-accent hover:text-fg-strong">
        {open ? <EyeOff size={14} /> : <Eye size={14} />}
        {open ? 'إخفاء التجربة' : 'جرّب السؤال كما يراه الطالب'}
      </button>
      {open && (
        <div className="mt-4">
          {question.textAr?.trim() && <p className="t-body text-fg-strong mb-3 whitespace-pre-wrap">{question.textAr}</p>}
          <MarkerQuestion key={key} question={q} seed={question.id || 'tryout'} />
        </div>
      )}
    </section>
  );
}

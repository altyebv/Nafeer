'use client';
import { useState } from 'react';
import { Button, Dialog, Field, Textarea } from '@/components/ui';

// ─── «اعتراض» (docs/team-leads.md L5) ─────────────────────────────────────────
// A member contests a lead's decision about them — a return, an intervention
// in their lesson, or a pause. It goes to the owner, who decides; the answer
// arrives on the member's dashboard.

const TITLE = {
  return:       'الاعتراض على إعادة الدرس',
  intervention: 'الاعتراض على التدخّل في درسك',
  pause:        'الاعتراض على إيقاف التعديل',
};
const MIN = 20;

export function AppealButton({ kind, lessonId = null, size = 'sm', variant = 'ghost', className }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  if (sent) return <span role="status" className="t-caption text-fg-subtle">أُرسل اعتراضك إلى المالك</span>;
  return (
    <>
      <Button size={size} variant={variant} className={className} onClick={() => setOpen(true)}>اعتراض…</Button>
      {open && <AppealDialog kind={kind} lessonId={lessonId} onClose={() => setOpen(false)} onSent={() => { setOpen(false); setSent(true); }} />}
    </>
  );
}

function AppealDialog({ kind, lessonId, onClose, onSent }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      const res = await fetch('/api/appeals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, lessonId, text: text.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) throw new Error(json.error || 'تعذّر الإرسال');
      onSent();
    } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Dialog open onClose={onClose} title={TITLE[kind]}
      description="يصل اعتراضك إلى مالك المنصة مباشرة، لا إلى قائد الفريق. يصلك ردّه في لوحتك."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="primary" onClick={submit} loading={busy} disabled={text.trim().length < MIN}>أرسل</Button>
      </>}>
      <Field label="ما الذي تراه غير منصف، ولماذا؟" required error={error} hint={`${MIN} حرفاً على الأقل.`}>
        <Textarea rows={4} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
      </Field>
    </Dialog>
  );
}

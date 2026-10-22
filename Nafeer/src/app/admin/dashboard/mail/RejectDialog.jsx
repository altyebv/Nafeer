'use client';
import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button, Dialog } from '@/components/ui';
import { Switch } from '../screens/SubjectPage';
import { MessageEditor, PreviewPane, useTemplatePreview } from './mailKit';

// ─── RejectDialog ─────────────────────────────────────────────────────────────
// The owner's reject button. Rejecting and telling the applicant are one step:
// the apology (application_rejected) is on by default and editable here, and
// can be switched off. It never carries the reason.
//
// onConfirm({ send, subject?, body? }) does the reject; it may throw.

export function RejectDialog({ person, onClose, onConfirm }) {
  const [send, setSend]       = useState(!!person.email);
  const [edits, setEdits]     = useState({ subject: null, body: null });
  const [showPreview, setShow] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState(null);

  const preview  = useTemplatePreview('application_rejected', { name: person.name, body: edits.body ?? undefined }, edits.subject ?? undefined);
  const defaults = preview?.defaults;

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await onConfirm(send
        ? { send: true, subject: edits.subject ?? undefined, body: edits.body ?? undefined }
        : { send: false });
    } catch (e) {
      setError(e.message || 'تعذّر الرفض');
      setBusy(false);
    }
  };

  return (
    <Dialog open onClose={busy ? () => {} : onClose} size="lg"
      title={`رفض طلب ${person.name}؟`}
      description="يُغلق الطلب ويظهر للمتقدم في صفحة طلبه. يمكنك إعادته للانتظار لاحقاً."
      footer={<>
        <Button variant="ghost" onClick={onClose} disabled={busy}>إلغاء</Button>
        <Button variant="danger" onClick={submit} loading={busy}>
          {send ? 'ارفض وأرسل الرسالة' : 'ارفض بلا رسالة'}
        </Button>
      </>}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-sunken p-4">
          <div className="min-w-0">
            <p id="reject-send" className="t-label text-fg-strong">أرسل رسالة شكر واعتذار</p>
            <p className="t-caption text-fg-subtle mt-0.5 break-all">
              {person.email ? <>إلى <span dir="ltr">{person.email}</span>، بلا ذكر للسبب.</> : 'لا بريد مسجّل لهذا المتقدم.'}
            </p>
          </div>
          <Switch on={send} onChange={setSend} disabled={!person.email || busy} labelledBy="reject-send" />
        </div>

        {send && (
          <>
            <MessageEditor
              defaults={defaults}
              subject={edits.subject}
              body={edits.body}
              rows={6}
              onChange={(next) => setEdits((e) => ({ ...e, ...next }))}
            />
            <div>
              <Button size="sm" variant="ghost" icon={showPreview ? EyeOff : Eye} onClick={() => setShow((v) => !v)}>
                {showPreview ? 'إخفاء المعاينة' : 'معاينة الرسالة كما ستصل'}
              </Button>
              {showPreview && (
                <div className="mt-3">
                  <PreviewPane to={person.email} preview={preview} height="h-[420px]" />
                </div>
              )}
            </div>
          </>
        )}

        {error && <p className="t-caption text-danger" role="alert">{error}</p>}
      </div>
    </Dialog>
  );
}

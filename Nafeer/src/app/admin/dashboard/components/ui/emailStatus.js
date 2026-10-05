// Display state for one email log entry — shared by the email section's log
// and the per-contributor mail history.
//
// `status` is what the provider said when we handed the message over;
// `delivery` arrives later from the Resend webhook and takes precedence.

const GREEN = '#4ade80';
const RED   = '#f87171';
const AMBER = '#fbbf24';
const GREY  = 'rgba(255,255,255,0.45)';

const DELIVERY = {
  delivered:  { label: 'تم التسليم',    color: GREEN },
  delayed:    { label: 'تأخر التسليم',  color: AMBER },
  bounced:    { label: 'ارتدّ البريد',   color: RED   },
  complained: { label: 'بلاغ إزعاج',    color: RED   },
  failed:     { label: 'فشل التسليم',   color: RED   },
};

/**
 * @param {{ status: string; delivery?: string | null; error?: string | null; deliveryDetail?: string | null }} log
 * @returns {{ label: string; color: string; detail: string | null }}
 */
export function emailStatus(log) {
  if (log.status === 'failed') {
    return { label: 'فشل الإرسال', color: RED, detail: log.error || null };
  }
  const delivery = DELIVERY[log.delivery];
  if (delivery) return { ...delivery, detail: log.deliveryDetail || null };
  return { label: 'أُرسل', color: GREY, detail: null };
}

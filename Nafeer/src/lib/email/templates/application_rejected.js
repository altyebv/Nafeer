import { emailLayout, emailHeading, emailParagraph, emailButton, bodyBlocks } from './_layout';
import { appUrl } from '../../appUrl';

/**
 * Application rejected — sent when an applicant is turned down: by the owner
 * from the dashboard (who can edit it first, or not send it), or by a lead
 * once the decision's undo window has passed. It never carries the reason;
 * that stays internal.
 */
export function applicationRejectedDefaults() {
  return {
    subject: 'بخصوص طلب انضمامك إلى نفير',
    body: [
      'شكراً لاهتمامك بالتطوع في نفير، وللوقت الذي منحته لطلبك.',
      'راجعنا طلبك بعناية، ولن نتمكّن من قبوله لهذا الدور في الوقت الحالي. القرار مرتبط باحتياجات الفريق في هذه المرحلة، ولا ينقص من تقديرنا لرغبتك في المساعدة.',
      'أبواب نفير تبقى مفتوحة: إن وجدت دوراً آخر يناسبك، يسعدنا أن تتقدّم له.',
    ],
  };
}

/**
 * @param {{ name?: string; body?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function applicationRejectedTemplate({ name, body }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const d = applicationRejectedDefaults();

  return {
    subject: d.subject,
    ...emailLayout({
      title:     'بخصوص طلبك',
      preheader: 'شكراً لاهتمامك بالانضمام إلى نفير',
      blocks: [
        emailHeading('شكراً لك'),
        emailParagraph(greeting),
        ...bodyBlocks(body, d.body),
        emailButton({ href: appUrl('/join'), label: 'تصفّح الأدوار المتاحة' }),
        emailParagraph('إن كان لديك سؤال، يكفي أن ترد على هذه الرسالة. نتمنى لك كل التوفيق.', { muted: true }),
      ],
    }),
  };
}

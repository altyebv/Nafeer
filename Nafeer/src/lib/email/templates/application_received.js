import { emailLayout, emailHeading, emailParagraph } from './_layout';

/**
 * Application received — confirmation sent right after the join form is submitted.
 *
 * @param {{ name?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function applicationReceivedTemplate({ name }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';

  return {
    subject: 'استلمنا طلب انضمامك إلى نفير',
    ...emailLayout({
      title:     'تم استلام طلبك',
      preheader: 'سنراجع طلبك ونتواصل معك بالخطوة التالية',
      blocks: [
        emailHeading('استلمنا طلبك'),
        emailParagraph(greeting),
        emailParagraph('شكراً لرغبتك في المساهمة في منصة نفير التعليمية. وصلنا طلبك وسيراجعه الفريق قريباً.'),
        emailParagraph('سنتواصل معك عبر هذا البريد بالخطوة التالية.'),
        emailParagraph('إذا لم تتقدّم بهذا الطلب، يمكنك تجاهل هذه الرسالة.', { muted: true }),
      ],
    }),
  };
}

import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong } from './_layout';

/**
 * Interview invite — sent to a pending applicant with their written-interview link.
 *
 * @param {{ name?: string; link: string; expiresIn?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function interviewInviteTemplate({ name, link, expiresIn }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const validFor = expiresIn || '14 يوماً';

  return {
    subject: 'الخطوة التالية في طلب انضمامك إلى نفير',
    ...emailLayout({
      title:     'المقابلة الكتابية',
      preheader: `أجب عن أسئلة قصيرة لإكمال طلبك — الرابط صالح لمدة ${validFor}`,
      blocks: [
        emailHeading('الخطوة التالية: المقابلة الكتابية'),
        emailParagraph(greeting),
        emailParagraph('شكراً لتقدّمك للمساهمة في منصة نفير التعليمية. راجعنا طلبك ونودّ التعرّف عليك أكثر عبر مقابلة كتابية قصيرة تجيب عنها في الوقت الذي يناسبك.'),
        emailParagraph(['الرابط خاص بك وصالح لمدة ', strong(validFor), '.']),
        emailButton({ href: link, label: 'بدء المقابلة' }),
        emailParagraph('إذا كان لديك أي استفسار، يكفي أن ترد على هذه الرسالة.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

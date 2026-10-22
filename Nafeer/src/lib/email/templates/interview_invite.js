import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong, bodyBlocks } from './_layout';

/**
 * Interview invite — sent to a pending applicant with their written-interview link.
 *
 * @param {{ expiresIn?: string }} data
 */
export function interviewInviteDefaults({ expiresIn } = {}) {
  return {
    subject: 'الخطوة التالية في طلب انضمامك إلى نفير',
    body: [
      'شكراً لتقدّمك للمساهمة في منصة نفير التعليمية. راجعنا طلبك ونودّ التعرّف عليك أكثر عبر مقابلة كتابية قصيرة تجيب عنها في الوقت الذي يناسبك.',
      ['الرابط خاص بك وصالح لمدة ', strong(expiresIn || '14 يوماً'), '.'],
    ],
  };
}

/**
 * @param {{ name?: string; link: string; expiresIn?: string; body?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function interviewInviteTemplate({ name, link, expiresIn, body }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const validFor = expiresIn || '14 يوماً';
  const d = interviewInviteDefaults({ expiresIn });

  return {
    subject: d.subject,
    ...emailLayout({
      title:     'المقابلة الكتابية',
      preheader: `أجب عن أسئلة قصيرة لإكمال طلبك — الرابط صالح لمدة ${validFor}`,
      blocks: [
        emailHeading('الخطوة التالية: المقابلة الكتابية'),
        emailParagraph(greeting),
        ...bodyBlocks(body, d.body),
        emailButton({ href: link, label: 'بدء المقابلة' }),
        emailParagraph('إذا كان لديك أي استفسار، يكفي أن ترد على هذه الرسالة.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, bodyBlocks } from './_layout';

/**
 * Beta invite — sent to early access users.
 */
export function betaInviteDefaults() {
  return {
    subject: 'أنت مدعو إلى النسخة التجريبية من منصة نفير',
    body: [
      'يسعدنا دعوتك للانضمام إلى النسخة التجريبية المبكرة من منصة نفير التعليمية. أنت من الأوائل الذين سيشهدون كيف نُعيد تشكيل تجربة التعليم العربي.',
      'استخدم الرابط أدناه للوصول إلى المنصة:',
    ],
  };
}

/**
 * @param {{ name?: string; link: string; body?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function betaInviteTemplate({ name, link, body }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const d = betaInviteDefaults();

  return {
    subject: d.subject,
    ...emailLayout({
      title:     'دعوة بيتا',
      preheader: 'وصول حصري مبكر إلى منصة نفير التعليمية',
      blocks: [
        emailHeading('دعوتك إلى النسخة التجريبية من نفير'),
        emailParagraph(greeting),
        ...bodyBlocks(body, d.body),
        emailButton({ href: link, label: 'دخول النسخة التجريبية' }),
        emailParagraph('آراؤك وملاحظاتك تساعدنا على بناء منصة أفضل — نحن نقدر مشاركتك.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

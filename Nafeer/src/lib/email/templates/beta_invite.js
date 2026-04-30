import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink } from './_layout';

/**
 * Beta invite — sent to early access users.
 *
 * @param {{ name?: string; link: string }} data
 * @returns {{ subject: string; html: string }}
 */
export function betaInviteTemplate({ name, link }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';

  const body = `
    ${emailHeading('دعوتك إلى النسخة التجريبية من نفير')}
    ${emailParagraph(greeting)}
    ${emailParagraph('يسعدنا دعوتك للانضمام إلى النسخة التجريبية المبكرة من منصة نفير التعليمية. أنت من الأوائل الذين سيشهدون كيف نُعيد تشكيل تجربة التعليم العربي.')}
    ${emailParagraph('استخدم الرابط أدناه للوصول إلى المنصة:')}
    ${emailButton({ href: link, label: 'دخول النسخة التجريبية' })}
    ${emailParagraph('آراؤك وملاحظاتك تساعدنا على بناء منصة أفضل — نحن نقدر مشاركتك.', { muted: true })}
    ${fallbackLink(link)}
  `;

  return {
    subject: 'أنت مدعو إلى النسخة التجريبية من منصة نفير',
    html: emailLayout({
      title:    'دعوة بيتا',
      preheader: 'وصول حصري مبكر إلى منصة نفير التعليمية',
      body,
    }),
  };
}
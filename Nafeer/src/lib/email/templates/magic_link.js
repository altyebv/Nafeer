import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink } from './_layout';

/**
 * Magic link / sign-in link template.
 *
 * @param {{ name?: string; link: string; expiresIn?: string }} data
 * @returns {{ subject: string; html: string }}
 */
export function magicLinkTemplate({ name, link, expiresIn = '24 ساعة' }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';

  const body = `
    ${emailHeading('رابط الدخول الخاص بك')}
    ${emailParagraph(greeting)}
    ${emailParagraph('انقر على الزر أدناه للدخول إلى حسابك في منصة نفير التعليمية. الرابط صالح لمدة <strong style="color:#fdf8f0;">${expiresIn}</strong>.')}
    ${emailButton({ href: link, label: 'دخول إلى المنصة' })}
    ${emailParagraph('إذا لم تطلب هذا الرابط، يمكنك تجاهل هذه الرسالة بأمان. لن يتمكن أي شخص من الدخول إلا إذا استخدم هذا الرابط من جهازك.', { muted: true })}
    ${fallbackLink(link)}
  `;

  return {
    subject: 'رابط الدخول إلى منصة نفير',
    html: emailLayout({
      title:    'رابط الدخول',
      preheader: 'رابط الدخول الخاص بك — صالح لمدة ' + expiresIn,
      body,
    }),
  };
}
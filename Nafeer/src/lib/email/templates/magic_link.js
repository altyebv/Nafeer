import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong } from './_layout';

/**
 * Magic link / sign-in link template.
 *
 * @param {{ name?: string; link: string; expiresIn?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function magicLinkTemplate({ name, link, expiresIn }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const validFor = expiresIn || '24 ساعة';

  return {
    subject: 'رابط الدخول إلى منصة نفير',
    ...emailLayout({
      title:     'رابط الدخول',
      preheader: `رابط الدخول الخاص بك — صالح لمدة ${validFor}`,
      blocks: [
        emailHeading('رابط الدخول الخاص بك'),
        emailParagraph(greeting),
        emailParagraph([
          'انقر على الزر أدناه للدخول إلى حسابك في منصة نفير التعليمية. الرابط صالح لمدة ',
          strong(validFor),
          '.',
        ]),
        emailButton({ href: link, label: 'دخول إلى المنصة' }),
        emailParagraph('إذا لم تطلب هذا الرابط، يمكنك تجاهل هذه الرسالة بأمان. لا تشارك هذا الرابط مع أي شخص.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

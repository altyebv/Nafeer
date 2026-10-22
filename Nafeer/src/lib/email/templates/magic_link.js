import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong, bodyBlocks } from './_layout';

/**
 * Magic link / sign-in link template.
 *
 * @param {{ expiresIn?: string }} data
 */
export function magicLinkDefaults({ expiresIn } = {}) {
  return {
    subject: 'رابط الدخول إلى منصة نفير',
    body: [
      ['انقر على الزر أدناه للدخول إلى حسابك في منصة نفير التعليمية. الرابط صالح لمدة ', strong(expiresIn || '24 ساعة'), '.'],
    ],
  };
}

/**
 * @param {{ name?: string; link: string; expiresIn?: string; body?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function magicLinkTemplate({ name, link, expiresIn, body }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const validFor = expiresIn || '24 ساعة';
  const d = magicLinkDefaults({ expiresIn });

  return {
    subject: d.subject,
    ...emailLayout({
      title:     'رابط الدخول',
      preheader: `رابط الدخول الخاص بك — صالح لمدة ${validFor}`,
      blocks: [
        emailHeading('رابط الدخول الخاص بك'),
        emailParagraph(greeting),
        ...bodyBlocks(body, d.body),
        emailButton({ href: link, label: 'دخول إلى المنصة' }),
        emailParagraph('إذا لم تطلب هذا الرابط، يمكنك تجاهل هذه الرسالة بأمان. لا تشارك هذا الرابط مع أي شخص.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

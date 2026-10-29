import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong } from './_layout';

/**
 * Password reset link for an existing contributor account.
 *
 * @param {{ name?: string; link: string; expiresIn?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function passwordResetTemplate({ name, link, expiresIn = 'ساعة واحدة' }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';

  return {
    subject: 'إعادة تعيين كلمة المرور — نفير',
    ...emailLayout({
      title: 'إعادة تعيين كلمة المرور',
      preheader: `رابط إعادة التعيين صالح لمدة ${expiresIn}`,
      blocks: [
        emailHeading('إعادة تعيين كلمة المرور'),
        emailParagraph(greeting),
        emailParagraph(['طلبنا لك رابطاً لتعيين كلمة مرور جديدة. الرابط صالح لمدة ', strong(expiresIn), ' ويُستخدم مرة واحدة.']),
        emailButton({ href: link, label: 'تعيين كلمة مرور جديدة' }),
        emailParagraph('إذا لم تطلب إعادة التعيين، فتجاهل هذه الرسالة؛ ستبقى كلمة مرورك كما هي.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

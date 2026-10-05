import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong } from './_layout';

/**
 * Onboarding invite — sent when a contributor is approved and needs to complete setup.
 *
 * @param {{ name?: string; link: string; expiresIn?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function onboardingInviteTemplate({ name, link, expiresIn }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const validFor = expiresIn || '7 أيام';

  return {
    subject: 'تمت الموافقة على طلبك في منصة نفير',
    ...emailLayout({
      title:     'دعوة المساهم',
      preheader: 'مرحباً بك في نفير — أكمل تأهيلك الآن',
      blocks: [
        emailHeading('أهلاً بك في نفير 🎉'),
        emailParagraph(greeting),
        emailParagraph('تمت الموافقة على طلبك للانضمام كمساهم في منصة نفير التعليمية. أنت الآن جزء من فريق يبني مستقبل التعليم العربي.'),
        emailParagraph(['انقر على الزر أدناه لإكمال تأهيلك وإعداد حسابك. الرابط صالح لمدة ', strong(validFor), '.']),
        emailButton({ href: link, label: 'إكمال التأهيل' }),
        emailParagraph('إذا كان لديك أي استفسار، يكفي أن ترد على هذه الرسالة.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

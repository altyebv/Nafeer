import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong, bodyBlocks } from './_layout';

/**
 * Onboarding invite — sent when a contributor is approved and needs to complete setup.
 *
 * @param {{ expiresIn?: string }} data
 */
export function onboardingInviteDefaults({ expiresIn } = {}) {
  return {
    subject: 'تمت الموافقة على طلبك في منصة نفير',
    body: [
      'تمت الموافقة على طلبك للانضمام كمساهم في منصة نفير التعليمية. أنت الآن جزء من فريق يبني مستقبل التعليم العربي.',
      ['انقر على الزر أدناه لإكمال تأهيلك وإعداد حسابك. الرابط صالح لمدة ', strong(expiresIn || '7 أيام'), '.'],
    ],
  };
}

/**
 * @param {{ name?: string; link: string; expiresIn?: string; body?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function onboardingInviteTemplate({ name, link, expiresIn, body }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const d = onboardingInviteDefaults({ expiresIn });

  return {
    subject: d.subject,
    ...emailLayout({
      title:     'دعوة المساهم',
      preheader: 'مرحباً بك في نفير — أكمل تأهيلك الآن',
      blocks: [
        emailHeading('أهلاً بك في نفير 🎉'),
        emailParagraph(greeting),
        ...bodyBlocks(body, d.body),
        emailButton({ href: link, label: 'إكمال التأهيل' }),
        emailParagraph('إذا كان لديك أي استفسار، يكفي أن ترد على هذه الرسالة.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

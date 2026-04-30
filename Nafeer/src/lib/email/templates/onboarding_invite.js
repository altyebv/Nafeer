import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink } from './_layout';

/**
 * Onboarding invite — sent when a contributor is approved and needs to complete setup.
 *
 * @param {{ name: string; link: string }} data
 * @returns {{ subject: string; html: string }}
 */
export function onboardingInviteTemplate({ name, link }) {
  const body = `
    ${emailHeading('أهلاً بك في نفير 🎉')}
    ${emailParagraph(`مرحباً ${name}،`)}
    ${emailParagraph('تمت الموافقة على طلبك للانضمام كمساهم في منصة نفير التعليمية. أنت الآن جزء من فريق يبني مستقبل التعليم العربي.')}
    ${emailParagraph('انقر على الزر أدناه لإكمال تأهيلك وإعداد حسابك:')}
    ${emailButton({ href: link, label: 'إكمال التأهيل' })}
    ${emailParagraph('إذا كان لديك أي استفسار، تواصل مع الفريق عبر لوحة التحكم بعد إكمال التسجيل.', { muted: true })}
    ${fallbackLink(link)}
  `;

  return {
    subject: `${name}، تمت الموافقة على طلبك في منصة نفير`,
    html: emailLayout({
      title:    'دعوة المساهم',
      preheader: 'مرحباً بك في نفير — أكمل تأهيلك الآن',
      body,
    }),
  };
}
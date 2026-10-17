import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong } from './_layout';

/**
 * Application received — sent right after the join form is submitted.
 * Carries the two links the applicant needs: the interview (which they can
 * start now) and the status page, which lasts the whole application.
 *
 * @param {{ name?: string; statusLink?: string; interviewLink?: string; interviewDays?: number }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function applicationReceivedTemplate({ name, statusLink, interviewLink, interviewDays = 14 }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';

  return {
    subject: 'استلمنا طلب انضمامك إلى نفير — الخطوة التالية',
    ...emailLayout({
      title:     'تم استلام طلبك',
      preheader: 'المقابلة الكتابية بانتظارك، ورابط تتابع منه طلبك',
      blocks: [
        emailHeading('استلمنا طلبك'),
        emailParagraph(greeting),
        emailParagraph('شكراً لرغبتك في المساهمة في نفير. الخطوة التالية مقابلة كتابية قصيرة: ثلاثة أسئلة ومهمة صغيرة، نحو ربع ساعة.'),
        ...(interviewLink ? [
          emailParagraph(['رابط المقابلة صالح لمدة ', strong(`${interviewDays} يوماً`), '، وتُحفظ إجاباتك على جهازك أولاً بأول.']),
          emailButton({ href: interviewLink, label: 'ابدأ المقابلة' }),
        ] : []),
        ...(statusLink ? [
          emailParagraph('وهذا رابط طلبك: تعرف منه أين وصل، ومن ينتظر من، ويبقى صالحاً حتى ينتهي الطلب. احتفظ بهذه الرسالة.'),
          emailButton({ href: statusLink, label: 'تابع حالة طلبك' }),
        ] : []),
        emailParagraph('إذا لم تتقدّم بهذا الطلب، يمكنك تجاهل هذه الرسالة.', { muted: true }),
        ...(statusLink ? [fallbackLink(statusLink)] : []),
      ],
    }),
  };
}

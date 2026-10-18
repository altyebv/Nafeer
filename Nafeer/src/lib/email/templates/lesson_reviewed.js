import { emailLayout, emailHeading, emailParagraph, emailButton, fallbackLink, strong } from './_layout';

/**
 * Lesson reviewed — tells the author their lesson was approved or returned.
 *
 * @param {{ name?: string; title: string; outcome: 'approved' | 'returned'; comments?: number; link: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function lessonReviewedTemplate({ name, title, outcome, comments = 0, link }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const approved = outcome === 'approved';

  return {
    subject: approved ? `اعتُمد درسك «${title}»` : `أُعيد إليك «${title}» بملاحظات`,
    ...emailLayout({
      title:     approved ? 'اعتُمد درسك' : 'ملاحظات على درسك',
      preheader: approved ? 'أصبح جاهزاً للنشر في بشير' : `${comments} ملاحظة من المراجِع، كل منها في مكانها`,
      blocks: [
        emailHeading(approved ? 'اعتُمد درسك' : 'أُعيد إليك درسك بملاحظات'),
        emailParagraph(greeting),
        approved
          ? emailParagraph(['اعتمد المراجِع درس ', strong(title), '. سيصل إلى طلاب بشير مع النشر القادم للمادة. شكراً لك.'])
          : emailParagraph(['قرأ المراجِع درس ', strong(title), ` وترك ${comments} ملاحظة، كل منها مثبّتة في مكانها داخل الدرس. عالجها ثم أعد الإرسال.`]),
        emailButton({ href: link, label: approved ? 'افتح الدرس' : 'افتح الملاحظات' }),
        emailParagraph('تصلك هذه الرسالة لأنك كتبت في هذا الدرس على نفير.', { muted: true }),
        fallbackLink(link),
      ],
    }),
  };
}

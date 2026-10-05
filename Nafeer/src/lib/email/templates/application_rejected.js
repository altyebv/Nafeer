import { emailLayout, emailHeading, emailParagraph } from './_layout';

/**
 * Application rejected — sent manually by an admin; never triggered automatically.
 *
 * @param {{ name?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function applicationRejectedTemplate({ name }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';

  return {
    subject: 'بخصوص طلب انضمامك إلى نفير',
    ...emailLayout({
      title:     'بخصوص طلبك',
      preheader: 'شكراً لاهتمامك بالانضمام إلى نفير',
      blocks: [
        emailHeading('بخصوص طلب انضمامك'),
        emailParagraph(greeting),
        emailParagraph('شكراً لاهتمامك بالمساهمة في منصة نفير التعليمية وللوقت الذي خصّصته لطلبك.'),
        emailParagraph('بعد مراجعة الطلب، نعتذر عن عدم تمكّننا من قبوله في الوقت الحالي.'),
        emailParagraph('نقدّر رغبتك في المساهمة ونتمنى لك كل التوفيق.', { muted: true }),
      ],
    }),
  };
}

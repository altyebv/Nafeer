import { emailLayout, emailHeading, emailParagraph } from './_layout';

/**
 * Custom message — free-form admin message to any recipient.
 *
 * @param {{ name?: string; subject: string; message: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function customMessageTemplate({ name, subject, message }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const body     = String(message ?? '').trim();
  if (!body) throw new Error('Message text is required.');

  // Render line breaks as paragraphs for clean display
  const messageParagraphs = body
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => emailParagraph(line));

  return {
    subject: subject || 'رسالة من منصة نفير',
    ...emailLayout({
      title:     subject || 'رسالة',
      preheader: body.slice(0, 90),
      blocks: [
        emailHeading(subject || 'رسالة من فريق نفير'),
        emailParagraph(greeting),
        ...messageParagraphs,
        emailParagraph('فريق نفير التعليمي', { muted: true }),
      ],
    }),
  };
}

import { emailLayout, emailHeading, emailParagraph } from './_layout';

/**
 * Custom message — free-form admin message to any recipient.
 *
 * @param {{ name?: string; subject: string; message: string }} data
 * @returns {{ subject: string; html: string }}
 */
export function customMessageTemplate({ name, subject, message }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';

  // Render line breaks as paragraphs for clean display
  const messageParagraphs = message
    .split(/\n+/)
    .filter(Boolean)
    .map((line) => emailParagraph(line))
    .join('');

  const body = `
    ${emailHeading(subject || 'رسالة من فريق نفير')}
    ${emailParagraph(greeting)}
    ${messageParagraphs}
    ${emailParagraph('فريق نفير التعليمي', { muted: true })}
  `;

  return {
    subject: subject || 'رسالة من منصة نفير',
    html: emailLayout({
      title:    subject || 'رسالة',
      preheader: message.slice(0, 90),
      body,
    }),
  };
}
import { emailLayout, emailHeading, emailParagraph, bodyBlocks } from './_layout';

/**
 * Custom message — free-form admin message to any recipient. `notice` (the
 * platform's own mail: digests, release and appeal alerts) renders the same
 * way under its own key, so the log and the comms history tell them apart.
 *
 * The text arrives as `message`, or as `body` from the composer's editor.
 *
 * @param {{ name?: string; subject: string; message?: string; body?: string }} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function customMessageTemplate({ name, subject, message, body }) {
  const greeting = name ? `مرحباً ${name}،` : 'مرحباً،';
  const text     = String(body || message || '').trim();
  if (!text) throw new Error('Message text is required.');

  return {
    subject: subject || 'رسالة من منصة نفير',
    ...emailLayout({
      title:     subject || 'رسالة',
      preheader: text.slice(0, 90),
      blocks: [
        emailHeading(subject || 'رسالة من فريق نفير'),
        emailParagraph(greeting),
        ...bodyBlocks(text, []),
        emailParagraph('فريق نفير التعليمي', { muted: true }),
      ],
    }),
  };
}

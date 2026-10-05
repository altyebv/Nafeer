import { SITE_URL } from '../../seo';

// ─── Email building blocks ────────────────────────────────────────────────────
// Every helper returns a block: { html, text }. `emailLayout` stitches blocks
// into the branded HTML document AND a plain-text alternative, so the two
// parts can never drift apart.
//
// All interpolated values are HTML-escaped here — templates pass raw data and
// never build markup themselves. Links must be absolute http(s) URLs; anything
// else throws, which the service reports as a render error instead of sending
// a dead button.
//
// Colours mirror the dark ramp in src/app/globals.css (ink-* / sand-*). They
// are solid hex on purpose: Outlook drops rgba().
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  page:      '#0e0c09', // ink-950
  card:      '#17140f', // ink-900
  border:    '#3b3630', // ink-800
  heading:   '#faf9f7', // ink-50
  text:      '#ddd8cf', // ink-200
  muted:     '#a79e8e', // ink-400
  faint:     '#8d8474', // ink-500
  accent:    '#d4891e', // sand-500
  button:    '#c57916', // sand-600 — 6.0:1 with ink-950 text
};

const FONT      = "'Segoe UI',Tahoma,Arial,sans-serif";
const SITE_HOST = new URL(SITE_URL).host;

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(href) {
  let url;
  try {
    url = new URL(String(href ?? ''));
  } catch {
    throw new Error('Email link must be an absolute URL.');
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Email link must be an http(s) URL.');
  }
  return url.href;
}

/**
 * Marks a run of paragraph text as emphasised.
 * @param {string} text
 */
export function strong(text) {
  return { strong: text };
}

/**
 * Standard heading inside the card.
 * @param {string} text
 */
export function emailHeading(text) {
  return {
    html: `<h1 style="margin:0 0 12px;font-size:20px;line-height:1.5;font-weight:700;color:${C.heading};font-family:${FONT};">${escapeHtml(text)}</h1>`,
    text: String(text ?? ''),
  };
}

/**
 * Body paragraph. `content` is a string, or an array mixing strings and
 * `strong()` runs.
 *
 * @param {string | Array<string | { strong: string }>} content
 * @param {{ muted?: boolean }} opts
 */
export function emailParagraph(content, { muted = false } = {}) {
  const runs  = Array.isArray(content) ? content : [content];
  const color = muted ? C.muted : C.text;

  const html = runs
    .map((run) =>
      run && typeof run === 'object'
        ? `<strong style="color:${C.heading};">${escapeHtml(run.strong)}</strong>`
        : escapeHtml(run)
    )
    .join('');

  const text = runs
    .map((run) => (run && typeof run === 'object' ? run.strong : run))
    .map((run) => String(run ?? ''))
    .join('');

  return {
    html: `<p style="margin:0 0 16px;font-size:14px;line-height:1.8;color:${color};font-family:${FONT};">${html}</p>`,
    text,
  };
}

/**
 * A styled CTA button.
 * @param {{ href: string; label: string }} opts
 */
export function emailButton({ href, label }) {
  const url = safeHref(href);
  return {
    html: `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:10px;background-color:${C.button};">
      <a href="${escapeHtml(url)}"
         target="_blank"
         style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:${C.page};text-decoration:none;border-radius:10px;font-family:${FONT};">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`,
    text: `${label}:\n${url}`,
  };
}

/**
 * A dimmed raw-URL line for clients that block buttons. Adds nothing to the
 * plain-text part — the button block already prints the URL there.
 * @param {string} href
 */
export function fallbackLink(href) {
  const url = escapeHtml(safeHref(href));
  return {
    html: `
<p style="margin:12px 0 0;font-size:12px;line-height:1.7;color:${C.faint};font-family:${FONT};">إذا لم يعمل الزر، انسخ هذا الرابط إلى المتصفح:</p>
<p dir="ltr" style="margin:4px 0 0;font-size:11px;line-height:1.6;word-break:break-all;text-align:left;font-family:Consolas,monospace;"><a href="${url}" style="color:${C.faint};text-decoration:underline;">${url}</a></p>`,
    text: '',
  };
}

const FOOTER_NOTE = 'يمكنك الرد على هذه الرسالة مباشرةً للتواصل مع فريق نفير.';
const FOOTER_SITE = 'منصة نفير التعليمية';

/**
 * Wraps blocks in the branded single-column layout.
 *
 * @param {{ title: string; preheader?: string; blocks: Array<{ html: string; text: string }> }} opts
 * @returns {{ html: string; text: string }}
 */
export function emailLayout({ title, preheader = '', blocks }) {
  const body = blocks.map((b) => b.html).join('\n');

  const text = [
    ...blocks.map((b) => b.text).filter(Boolean),
    '—',
    FOOTER_NOTE,
    `${FOOTER_SITE} · ${SITE_URL}`,
  ].join('\n\n');

  const html = /* html */ `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="dark" />
  <meta name="supported-color-schemes" content="dark" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:${C.page};font-family:${FONT};direction:rtl;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:${C.page};">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background-color:${C.card};border:1px solid ${C.border};border-radius:16px;">

          <!-- Accent rule -->
          <tr>
            <td style="height:4px;line-height:4px;font-size:0;background-color:${C.accent};border-radius:16px 16px 0 0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:22px 32px 18px;border-bottom:1px solid ${C.border};">
              <a href="${SITE_URL}" target="_blank" style="font-size:26px;line-height:1.3;font-weight:700;color:${C.accent};text-decoration:none;font-family:'Amiri','Noto Naskh Arabic',Georgia,serif;">نفير</a>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 28px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 32px 26px;border-top:1px solid ${C.border};">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.7;color:${C.faint};font-family:${FONT};">${FOOTER_NOTE}</p>
              <p style="margin:0;font-size:12px;line-height:1.7;color:${C.faint};font-family:${FONT};">
                ${FOOTER_SITE} &middot; <a href="${SITE_URL}" target="_blank" dir="ltr" style="color:${C.muted};text-decoration:underline;">${SITE_HOST}</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text };
}

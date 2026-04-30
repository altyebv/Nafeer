/**
 * Minimal, inline-styled email layout.
 * Single-column, dark-warm brand aesthetic — works in all major clients.
 *
 * @param {{ title: string; preheader?: string; body: string }} opts
 * @returns {string} Full HTML string
 */
export function emailLayout({ title, preheader = '', body }) {
  return /* html */ `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0e0c09;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">

  <!-- Preheader (hidden preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#0e0c09;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:520px;background-color:#1a1713;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">

          <!-- Header bar -->
          <tr>
            <td style="background-color:#141210;border-bottom:1px solid rgba(255,255,255,0.07);padding:20px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:#d4891e;font-family:'Amiri',Georgia,serif;">نفير</span>
                    &nbsp;
                    <span style="font-size:10px;color:#6b6560;font-family:monospace;letter-spacing:2px;text-transform:uppercase;background:rgba(212,137,30,0.08);border:1px solid rgba(212,137,30,0.15);border-radius:4px;padding:2px 6px;">ADMIN</span>
                  </td>
                </tr>
              </table>
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
            <td style="padding:16px 32px 28px;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;font-size:11px;color:#4a4540;font-family:monospace;direction:ltr;text-align:left;">
                Nafeer Educational Platform &mdash; This is an automated message, please do not reply directly.
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
}

/**
 * A styled CTA button.
 * @param {{ href: string; label: string }} opts
 * @returns {string}
 */
export function emailButton({ href, label }) {
  return /* html */ `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="border-radius:10px;background-color:#d4891e;">
      <a href="${href}"
         target="_blank"
         style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#0e0c09;text-decoration:none;border-radius:10px;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

/**
 * A dimmed fallback link line (for clients that block buttons).
 * @param {string} href
 * @returns {string}
 */
export function fallbackLink(href) {
  return /* html */ `
<p style="margin:12px 0 0;font-size:11px;color:#4a4540;word-break:break-all;direction:ltr;">
  ${href}
</p>`;
}

/**
 * Standard heading inside the card.
 * @param {string} text
 * @returns {string}
 */
export function emailHeading(text) {
  return /* html */ `<h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#fdf8f0;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">${text}</h1>`;
}

/**
 * Body paragraph text.
 * @param {string} text
 * @param {{ muted?: boolean }} opts
 * @returns {string}
 */
export function emailParagraph(text, { muted = false } = {}) {
  const color = muted ? '#6b6560' : '#b7b0a3';
  return /* html */ `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${color};">${text}</p>`;
}
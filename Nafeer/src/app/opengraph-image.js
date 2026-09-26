import { ImageResponse } from 'next/og';

// ── Default Open Graph card ───────────────────────────────────────────────────
//
// Applies to every route that doesn't define its own opengraph-image. This is
// what WhatsApp, Facebook and Telegram render when someone shares a link —
// which, for this audience, is how the site actually travels.
//
// Font notes, both learned the hard way:
//
//   • Not Noto Naskh Arabic. Satori (what powers ImageResponse) cannot parse
//     its GSUB tables — it throws `lookupType: 5 - substFormat: 3` and takes
//     the whole build down with it. Same for Amiri, Noto Kufi and Scheherazade.
//     Markazi Text is the closest naskh face Satori renders cleanly.
//
//   • The old Chrome User-Agent is required. Modern UAs get woff2 back, which
//     Satori cannot read; this one gets plain woff, which it can.
//
// Satori honours `direction: rtl` for word order but not for box alignment, so
// the column is pinned with `alignItems: flex-end` to sit flush right.

export const alt         = 'بشير — رفيق الشهادة السودانية';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

const EYEBROW = 'رفيق الشهادة السودانية';
const TITLE   = 'بَشير';
const TAGLINE = 'المنهج كما يجب أن يكون — واضح، وبدون إنترنت';
const FOOTER  = 'نفير × بشير';

const FAMILY = 'Markazi Text';
const LEGACY_UA =
  'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/27.0.1453.93 Safari/537.36';

async function arabicFont(weight) {
  const url =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(FAMILY)}:wght@${weight}`;

  const css = await fetch(url, { headers: { 'User-Agent': LEGACY_UA } }).then((r) => r.text());
  const src = css.match(/src:\s*url\((.+?)\)\s*format\('(?:truetype|opentype|woff)'\)/);
  if (!src) throw new Error(`No Satori-compatible file for ${FAMILY} ${weight}`);

  return fetch(src[1]).then((r) => r.arrayBuffer());
}

// Rendered when Google Fonts is unreachable at build time. Latin-only, so it
// needs no font file — a plain card still beats a failed deploy.
function fallbackCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#15110d',
          color: '#fff8ed',
        }}
      >
        <div style={{ display: 'flex', fontSize: 84, letterSpacing: 4 }}>NAFEER × BASHEER</div>
        <div style={{ display: 'flex', marginTop: 24, fontSize: 32, color: '#d4891e' }}>
          nafeer4sudan.site
        </div>
      </div>
    ),
    size
  );
}

export default async function Image() {
  let regular, bold;
  try {
    [regular, bold] = await Promise.all([arabicFont(500), arabicFont(700)]);
  } catch {
    return fallbackCard();
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-end',
          padding: '0 86px',
          backgroundColor: '#15110d',
          // Satori has no blur filter, so the ember glow is a plain gradient.
          backgroundImage:
            'linear-gradient(225deg, rgba(212,137,30,0.18) 0%, rgba(21,17,13,0) 58%)',
          fontFamily: 'Naskh',
          direction: 'rtl',
        }}
      >
        <div style={{ display: 'flex', fontSize: 32, color: '#d4891e', fontWeight: 500 }}>
          {EYEBROW}
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 150,
            fontWeight: 700,
            color: '#fff8ed',
            lineHeight: 1.3,
            marginTop: 8,
          }}
        >
          {TITLE}
        </div>

        <div
          style={{
            width: 190,
            height: 3,
            margin: '24px 0 30px',
            backgroundImage: 'linear-gradient(270deg, #d4891e 0%, rgba(212,137,30,0) 100%)',
          }}
        />

        <div style={{ display: 'flex', fontSize: 42, color: '#d8cdbb', fontWeight: 500 }}>
          {TAGLINE}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 58,
            fontSize: 28,
            color: '#b3a590',
            fontWeight: 500,
          }}
        >
          {FOOTER}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Naskh', data: regular, weight: 500, style: 'normal' },
        { name: 'Naskh', data: bold,    weight: 700, style: 'normal' },
      ],
    }
  );
}

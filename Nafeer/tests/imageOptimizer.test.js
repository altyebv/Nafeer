import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { optimizeImage } from '@/lib/imageOptimizer';

// ─── Image optimizer against the real sharp ───────────────────────────────────
// Guards sharp upgrades (0.33 → 0.35 for the libvips advisories): the optimizer
// swallows sharp errors and returns the original bytes, so a broken sharp would
// otherwise only show up as uploads quietly staying un-optimized.

const png = (width, height) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 120, b: 30 } } })
    .png()
    .toBuffer();

describe('optimizeImage', () => {
  it('shrinks content images to 1200px wide WebP', async () => {
    const result = await optimizeImage(await png(2400, 800), 'image/png', 'content');
    expect(result).toMatchObject({ skipped: false, mimeType: 'image/webp' });
    const meta = await sharp(result.buffer).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 1200, height: 400 });
  });

  it('crops avatars to a 400px square', async () => {
    const result = await optimizeImage(await png(900, 600), 'image/png', 'avatar');
    const meta = await sharp(result.buffer).metadata();
    expect(meta).toMatchObject({ format: 'webp', width: 400, height: 400 });
  });

  it('passes GIF and SVG through untouched', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>');
    const result = await optimizeImage(svg, 'image/svg+xml');
    expect(result).toMatchObject({ skipped: true, buffer: svg });
  });
});

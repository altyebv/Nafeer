// ─── imageOptimizer.js ────────────────────────────────────────────────────────
// Sharp-based image optimization pipeline.
// All images are converted to WebP. GIFs and SVGs are returned unchanged.
//
// Presets:
//   'content'  — educational media: max 1200w, quality 85, preserve ratio
//   'avatar'   — contributor profile: max 400×400, quality 90, cover crop
//   'thumb'    — future use: max 320w, quality 80
//
// Usage:
//   const result = await optimizeImage(buffer, 'image/png', 'content');
//   // result: { buffer, mimeType, originalSize, optimizedSize, skipped }

import sharp from 'sharp';

// ─── presets ─────────────────────────────────────────────────────────────────

const PRESETS = {
  content: {
    maxWidth:  1200,
    maxHeight: null,     // unconstrained height — preserves aspect ratio
    quality:   85,
    fit:       'inside', // never upscale; shrink to fit within box
  },
  avatar: {
    maxWidth:  400,
    maxHeight: 400,
    quality:   90,
    fit:       'cover',  // crop to exact square if needed
  },
  thumb: {
    maxWidth:  320,
    maxHeight: null,
    quality:   80,
    fit:       'inside',
  },
};

// MIME types we skip entirely (pass through unchanged)
const SKIP_TYPES = new Set(['image/gif', 'image/svg+xml']);

// ─── optimizeImage ────────────────────────────────────────────────────────────
// @param  buffer       Buffer — raw file bytes
// @param  mimeType     string — original MIME type from upload
// @param  preset       'content' | 'avatar' | 'thumb'  (default: 'content')
// @returns Promise<{ buffer, mimeType, originalSize, optimizedSize, skipped }>

export async function optimizeImage(buffer, mimeType, preset = 'content') {
  const originalSize = buffer.byteLength;

  // GIF and SVG pass through unchanged
  if (SKIP_TYPES.has(mimeType)) {
    return { buffer, mimeType, originalSize, optimizedSize: originalSize, skipped: true };
  }

  const cfg = PRESETS[preset] || PRESETS.content;

  try {
    let pipeline = sharp(buffer);

    // Resize — only ever shrinks, never upscales
    const resizeOpts = {
      width:              cfg.maxWidth  || undefined,
      height:             cfg.maxHeight || undefined,
      fit:                cfg.fit,
      withoutEnlargement: true,
    };
    pipeline = pipeline.resize(resizeOpts);

    // Convert to WebP
    pipeline = pipeline.webp({ quality: cfg.quality });

    const optimizedBuffer = await pipeline.toBuffer();

    return {
      buffer:        optimizedBuffer,
      mimeType:      'image/webp',
      originalSize,
      optimizedSize: optimizedBuffer.byteLength,
      skipped:       false,
    };
  } catch (err) {
    // If sharp fails for any reason, fall through with original bytes
    console.warn('[imageOptimizer] sharp failed, using original:', err.message);
    return { buffer, mimeType, originalSize, optimizedSize: originalSize, skipped: true };
  }
}

// ─── getOptimizedExtension ───────────────────────────────────────────────────
// Returns the file extension to use after optimization.
// If the image was optimized → 'webp'; otherwise keep original ext.

export function getOptimizedExtension(originalMimeType, optimizedMimeType) {
  if (optimizedMimeType === 'image/webp') return 'webp';
  const map = {
    'image/jpeg': 'jpg', 'image/jpg': 'jpg',
    'image/png':  'png',
    'image/gif':  'gif',
    'image/svg+xml': 'svg',
  };
  return map[originalMimeType] || 'bin';
}

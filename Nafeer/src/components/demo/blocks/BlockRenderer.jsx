'use client';
import { HeadingBlock, TextBlock, TipBlock, ArabicFormulaBlock, ImagePlaceholderBlock, GifPlaceholderBlock, TableBlock } from './PrimitiveBlocks';
import { HighlightBox }  from './HighlightBox';
import { FormulaBlock }  from './FormulaBlock';
import { ExampleBlock }  from './ExampleBlock';

// ─────────────────────────────────────────────────────────────────────────────
// BlockRenderer
// Central dispatcher — mirrors Basheer's BlockRenderer.kt.
// Add new block types here as the demo grows.
// ─────────────────────────────────────────────────────────────────────────────

export default function BlockRenderer({ block }) {
  switch (block.type) {
    // ── Core text blocks ──────────────────────────────────────────────────
    case 'HEADING':           return <HeadingBlock         block={block} />;
    case 'TEXT':              return <TextBlock            block={block} />;
    case 'TIP':               return <TipBlock             block={block} />;

    // ── Highlight / callout boxes ─────────────────────────────────────────
    case 'HIGHLIGHT_BOX':     return <HighlightBox         block={block} />;

    // ── Formula blocks ────────────────────────────────────────────────────
    case 'FORMULA':           return <FormulaBlock         block={block} />;  // KaTeX / LaTeX
    case 'ARABIC_FORMULA':    return <ArabicFormulaBlock   block={block} />;  // Arabic-symbol equations

    // ── Interactive example ───────────────────────────────────────────────
    case 'EXAMPLE':           return <ExampleBlock         block={block} />;

    // ── Rich media placeholders ───────────────────────────────────────────
    case 'IMAGE_PLACEHOLDER': return <ImagePlaceholderBlock block={block} />;
    case 'GIF_PLACEHOLDER':   return <GifPlaceholderBlock   block={block} />;
    case 'TABLE':             return <TableBlock            block={block} />;

    default:                  return null;
  }
}
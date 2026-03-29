'use client';
import { HeadingBlock, TextBlock, TipBlock } from './PrimitiveBlocks';
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
    case 'HEADING':       return <HeadingBlock block={block} />;
    case 'TEXT':          return <TextBlock block={block} />;
    case 'TIP':           return <TipBlock block={block} />;
    case 'HIGHLIGHT_BOX': return <HighlightBox block={block} />;
    case 'FORMULA':       return <FormulaBlock block={block} />;
    case 'EXAMPLE':       return <ExampleBlock block={block} />;
    default:              return null;
  }
}

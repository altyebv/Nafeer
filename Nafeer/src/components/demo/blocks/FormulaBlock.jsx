'use client';
import FormulaPreview from '@/components/editor/shared/FormulaPreview';
import { FamilyBlock, Icons } from './margin';

// A display formula, typeset by the same pipeline as the Android app and in the
// subject's notation. On the page itself with no box around it: a formula is
// part of the writing. Invalid LaTeX falls back to the raw source.

export function FormulaBlock({ block }) {
  return (
    <FamilyBlock family="know" icon={Icons.functions} label={block.caption || 'قانون'}>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', overflowX: 'auto', color: 'var(--b-ink)' }}>
        <FormulaPreview latex={block.content || ''} />
      </div>
    </FamilyBlock>
  );
}

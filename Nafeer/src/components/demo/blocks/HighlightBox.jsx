'use client';
import MathText from '@/components/editor/shared/MathText';
import { FamilyBlock, Icons } from './margin';

// A passage the author set apart. Each style has its own form as well as its
// own sign, so they can be told apart without reading the label:
//  DEFINITION  bold reading text on a sunken band
//  NOTE        reading text between two ink rules
//  WARNING     the teacher's red hand, as a remark written beside the text
//  TIP         the app speaking, in its own voice and type

export function HighlightBox({ block }) {
  const text = <MathText text={block.content} />;
  switch (block.style) {
    case 'DEFINITION':
      return (
        <FamilyBlock family="know" icon={Icons.bookmark} label={block.title || 'تعريف'} banded>
          <p className="b-read" style={{ margin: 0, font: '700 16px/29px var(--font-read)', color: 'var(--b-ink)' }}>{text}</p>
        </FamilyBlock>
      );
    case 'WARNING':
      return (
        <FamilyBlock family="warn" icon={Icons.warning}>
          <p style={{
            margin: 0, font: '700 21px/32px var(--font-remark)', color: 'var(--f-warn)',
            transform: 'rotate(-1deg)', transformOrigin: 'right center',
          }}>
            انتبه: {block.title ? <b style={{ fontWeight: 700 }}>{block.title.replace(/^تنبيه[^:]*:\s*/, '')}. </b> : null}{text}
          </p>
        </FamilyBlock>
      );
    case 'TIP':
      return <StudyTip>{text}</StudyTip>;
    default:
      return (
        <FamilyBlock family="know" icon={Icons.note}>
          <div style={{ borderTop: '1px solid var(--b-ink)', borderBottom: '1px solid var(--b-ink)', padding: '8px 0' }}>
            <div style={{ font: '800 12px/18px var(--font-arabic)', color: 'var(--b-accent-text)' }}>{block.title || 'ملاحظة'}</div>
            <p className="b-read" style={{ margin: 0, font: '400 15px/27px var(--font-read)', color: 'var(--b-ink)' }}>{text}</p>
          </div>
        </FamilyBlock>
      );
  }
}

/** A study tip: the app talking to the student, so it is set in Cairo, not in reading type. */
export function StudyTip({ children }) {
  return (
    <FamilyBlock family="do" icon={Icons.bulb} label="للمذاكرة">
      <p style={{ margin: 0, font: '600 14px/22px var(--font-arabic)', color: 'var(--b-ink)' }}>{children}</p>
    </FamilyBlock>
  );
}

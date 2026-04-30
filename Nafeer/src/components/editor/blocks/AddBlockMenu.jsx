'use client';
import { BLOCK_TYPES, BLOCK_TYPE_CONFIG } from '@/shared/constants';
import {
  AlignLeft,
  BookOpen,
  CircleHelp,
  Columns3,
  Heading2,
  Image,
  List,
  Minus,
  PenLine,
  Quote,
  Sigma,
  Sparkles,
  Table2,
  X,
  Zap,
} from 'lucide-react';

// Block type color accents
const TYPE_ACCENT = {
  TEXT:          { bg: 'hover:bg-ink-800',          icon: 'text-ink-400'    },
  HEADING:       { bg: 'hover:bg-blue-900/30',       icon: 'text-blue-400'   },
  IMAGE:         { bg: 'hover:bg-green-900/30',      icon: 'text-green-400'  },
  GIF:           { bg: 'hover:bg-purple-900/30',     icon: 'text-purple-400' },
  FORMULA:       { bg: 'hover:bg-orange-900/30',     icon: 'text-orange-400' },
  HIGHLIGHT_BOX: { bg: 'hover:bg-amber-900/30',      icon: 'text-amber-400'  },
  EXAMPLE:       { bg: 'hover:bg-teal-900/30',       icon: 'text-teal-400'   },
  TIP:           { bg: 'hover:bg-ember-900/30',      icon: 'text-ember-400'  },
  LIST:          { bg: 'hover:bg-indigo-900/30',     icon: 'text-indigo-400' },
  TABLE:         { bg: 'hover:bg-cyan-900/30',       icon: 'text-cyan-400'   },
  QUOTE:         { bg: 'hover:bg-ink-800',           icon: 'text-ink-400'    },
  DIVIDER:       { bg: 'hover:bg-ink-800',           icon: 'text-ink-600'    },
  QUESTION:      { bg: 'hover:bg-amber-900/30',      icon: 'text-amber-500'  },
};

// Block types that are "interactive" — shown in a separate section
const CHECKPOINT_TYPES = new Set(['QUESTION']);

const BLOCK_ICONS = {
  TEXT: AlignLeft,
  HEADING: Heading2,
  IMAGE: Image,
  INTERACTIVE_IMAGE: Sparkles,
  GIF: Zap,
  FORMULA: Sigma,
  HIGHLIGHT_BOX: BookOpen,
  EXAMPLE: PenLine,
  TIP: Sparkles,
  LIST: List,
  TABLE: Table2,
  QUOTE: Quote,
  DIVIDER: Minus,
  QUESTION: CircleHelp,
};

export default function AddBlockMenu({ onSelect, onClose }) {
  const contentTypes    = Object.entries(BLOCK_TYPES).filter(([k]) => !CHECKPOINT_TYPES.has(k));
  const checkpointTypes = Object.entries(BLOCK_TYPES).filter(([k]) =>  CHECKPOINT_TYPES.has(k));

  const renderButton = ([key, value]) => {
    const cfg    = BLOCK_TYPE_CONFIG[key];
    const accent = TYPE_ACCENT[key] || TYPE_ACCENT.TEXT;
    const Icon   = BLOCK_ICONS[key] || Columns3;
    return (
      <button
        key={key}
        onClick={() => onSelect(value)}
        className={`
          flex flex-col items-center gap-1.5 px-2 py-3
          bg-ink-900 transition-all group
          ${accent.bg}
        `}
      >
        <Icon size={18} strokeWidth={1.8} className={`transition-colors ${accent.icon}`} />
        <span className="text-[10px] text-ink-600 group-hover:text-ink-300 font-arabic leading-none text-center transition-colors">
          {cfg.label}
        </span>
      </button>
    );
  };

  return (
    <div className="rounded-xl border border-ink-800 overflow-hidden bg-ink-900/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-800/60">
        <span className="text-xs font-semibold text-ink-400 font-arabic tracking-wide">
          إضافة عنصر
        </span>
        <button
          onClick={onClose}
          className="text-ink-700 hover:text-ink-400 transition-colors text-sm w-5 h-5 flex items-center justify-center"
        >
          <X size={15} strokeWidth={1.9} />
        </button>
      </div>

      {/* Content blocks grid */}
      <div className="grid grid-cols-6 gap-px bg-ink-800/40 p-px">
        {contentTypes.map(renderButton)}
      </div>

      {/* Checkpoint separator */}
      {checkpointTypes.length > 0 && (
        <>
          <div className="flex items-center gap-2 px-4 py-2 border-t border-ink-800/60 bg-ink-900/40">
            <span className="text-[10px] text-amber-700/80 font-arabic tracking-wide">
              تفاعلي
            </span>
            <div className="flex-1 h-px bg-amber-900/20" />
          </div>
          <div className="grid grid-cols-6 gap-px bg-ink-800/40 p-px">
            {checkpointTypes.map(renderButton)}
          </div>
        </>
      )}
    </div>
  );
}

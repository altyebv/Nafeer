'use client';
import { BLOCK_TYPES, BLOCK_TYPE_CONFIG } from '@/shared/constants';

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
};

export default function AddBlockMenu({ onSelect, onClose }) {
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
          ✕
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 gap-px bg-ink-800/40 p-px">
        {Object.entries(BLOCK_TYPES).map(([key, value]) => {
          const cfg    = BLOCK_TYPE_CONFIG[key];
          const accent = TYPE_ACCENT[key] || TYPE_ACCENT.TEXT;
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
              <span className={`text-base font-mono leading-none transition-colors ${accent.icon}`}>
                {cfg.icon}
              </span>
              <span className="text-[10px] text-ink-600 group-hover:text-ink-300 font-arabic leading-none text-center transition-colors">
                {cfg.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
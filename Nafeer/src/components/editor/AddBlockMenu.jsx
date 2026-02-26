import { BLOCK_TYPES, BLOCK_TYPE_CONFIG } from '@/shared/constants';

export default function AddBlockMenu({ onSelect, onClose }) {
  return (
    <div className="border border-ink-700 rounded-xl p-4 bg-ink-900">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-ink-300 font-arabic">اختر نوع العنصر</h4>
        <button onClick={onClose} className="text-ink-600 hover:text-ink-300 transition-colors">
          ✕
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Object.entries(BLOCK_TYPES).map(([key, value]) => {
          const config = BLOCK_TYPE_CONFIG[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(value)}
              className="flex flex-col items-center gap-1.5 p-3 bg-ink-800 border border-ink-700 rounded-lg hover:border-sand-700 hover:bg-sand-900/20 hover:text-sand-400 transition-colors group"
            >
              <span className="text-lg font-mono text-ink-400 group-hover:text-sand-400">{config.icon}</span>
              <span className="text-xs text-ink-500 group-hover:text-sand-500 font-arabic">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

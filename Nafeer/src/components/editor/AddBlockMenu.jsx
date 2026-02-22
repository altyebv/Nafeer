import { BLOCK_TYPES, BLOCK_TYPE_CONFIG } from '@/shared/constants';

export default function AddBlockMenu({ onSelect, onClose }) {
  return (
    <div className="border border-stone-200 rounded-lg p-4 bg-stone-50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-stone-700">اختر نوع العنصر</h4>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-stone-600"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {Object.entries(BLOCK_TYPES).map(([key, value]) => {
          const config = BLOCK_TYPE_CONFIG[key];
          return (
            <button
              key={key}
              onClick={() => onSelect(value)}
              className="flex flex-col items-center gap-1 p-3 bg-white border border-stone-200 rounded-lg hover:border-amber-400 hover:bg-amber-50 transition-colors"
            >
              <span className="text-xl">{config.icon}</span>
              <span className="text-xs text-stone-600">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

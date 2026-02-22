import { useDataStore } from '@/store/dataStore';
import { BLOCK_TYPE_CONFIG } from '@/shared/constants';

export default function BlockEditor({ block }) {
  const { concepts, updateBlock, deleteBlock } = useDataStore();

  const config = BLOCK_TYPE_CONFIG[block.type] || BLOCK_TYPE_CONFIG.TEXT;
  const linkedConcept = concepts.find((c) => c.id === block.conceptRef);

  const handleDelete = () => {
    if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      deleteBlock(block.id);
    }
  };

  const renderEditor = () => {
    switch (block.type) {
      case 'TEXT':
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg resize-y min-h-[100px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="اكتب النص هنا..."
          />
        );

      case 'HEADING':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="w-full px-3 py-2 text-lg font-semibold border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="عنوان القسم"
          />
        );

      case 'IMAGE':
      case 'GIF':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="مسار الصورة (مثال: images/diagram.png)"
              dir="ltr"
            />
            <input
              type="text"
              value={block.caption || ''}
              onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="وصف الصورة (اختياري)"
            />
          </div>
        );

      case 'FORMULA':
        return (
          <div className="space-y-2">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full px-3 py-2 font-mono border border-stone-200 rounded-lg resize-y min-h-[60px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="اكتب المعادلة (LaTeX أو نص)"
              dir="ltr"
            />
            <p className="text-xs text-stone-400">يمكنك استخدام صيغة LaTeX للمعادلات</p>
          </div>
        );

      case 'HIGHLIGHT_BOX':
        return (
          <div className="bg-yellow-50 border-r-4 border-yellow-400 rounded-lg p-3">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none"
              placeholder="النص المهم الذي تريد إبرازه..."
            />
          </div>
        );

      case 'EXAMPLE':
        return (
          <div className="bg-teal-50 border-r-4 border-teal-400 rounded-lg p-3">
            <p className="text-xs text-teal-600 mb-2">مثال:</p>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none"
              placeholder="اكتب المثال هنا..."
            />
          </div>
        );

      case 'TIP':
        return (
          <div className="bg-amber-50 border-r-4 border-amber-400 rounded-lg p-3">
            <p className="text-xs text-amber-600 mb-2">💡 نصيحة:</p>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none"
              placeholder="اكتب النصيحة هنا..."
            />
          </div>
        );

      case 'LIST':
        return (
          <div className="space-y-2">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg resize-y min-h-[100px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="اكتب كل عنصر في سطر جديد..."
            />
            <p className="text-xs text-stone-400">كل سطر سيظهر كعنصر منفصل في القائمة</p>
          </div>
        );

      default:
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="w-full px-3 py-2 border border-stone-200 rounded-lg resize-y min-h-[100px] focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="المحتوى..."
          />
        );
    }
  };

  return (
    <div className="border border-stone-200 rounded-lg overflow-hidden">
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border-b border-stone-200">
        <span className="text-stone-300 cursor-grab">⋮⋮</span>
        
        <span className="flex items-center gap-1 px-2 py-0.5 bg-white border border-stone-200 rounded text-xs text-stone-600">
          <span>{config.icon}</span>
          <span>{config.label}</span>
        </span>

        {/* Concept Link */}
        <select
          value={block.conceptRef || ''}
          onChange={(e) => updateBlock(block.id, { conceptRef: e.target.value || null })}
          className="text-xs px-2 py-1 border border-stone-200 rounded bg-white focus:ring-2 focus:ring-amber-500"
        >
          <option value="">ربط بمفهوم...</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.titleAr}
            </option>
          ))}
        </select>

        {linkedConcept && (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded">
            💡 {linkedConcept.titleAr}
          </span>
        )}

        <div className="flex-1" />

        <button
          onClick={handleDelete}
          className="p-1 text-stone-400 hover:text-red-600 transition-colors"
          title="حذف"
        >
          🗑️
        </button>
      </div>

      {/* Block Content */}
      <div className="p-3">{renderEditor()}</div>
    </div>
  );
}

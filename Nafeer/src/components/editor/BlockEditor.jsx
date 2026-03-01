import { useDataStore }         from '@/store/dataStore';
import { BLOCK_TYPE_CONFIG }     from '@/shared/constants';
import { LessonTableEditor }     from '@/components/editor/TableEditor';
import DeleteButton              from '@/components/editor/DeleteButton';

const inputClass =
  'w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600 resize-y';

export default function BlockEditor({ block }) {
  const { concepts, updateBlock, deleteBlock } = useDataStore();

  const config        = BLOCK_TYPE_CONFIG[block.type] || BLOCK_TYPE_CONFIG.TEXT;
  const linkedConcept = concepts.find((c) => c.id === block.conceptRef);

  const handleDelete = () => deleteBlock(block.id);

  const renderEditor = () => {
    switch (block.type) {
      case 'TEXT':
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className={`${inputClass} min-h-[100px]`}
            placeholder="اكتب النص هنا..."
          />
        );

      case 'HEADING':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className="w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-100 text-base font-semibold focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-arabic placeholder-ink-600"
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
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-500 focus:border-sand-500 focus:outline-none font-mono placeholder-ink-600"
              placeholder="images/diagram.png"
              dir="ltr"
            />
            <input
              type="text"
              value={block.caption || ''}
              onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-200 text-sm focus:ring-1 focus:ring-sand-500 focus:outline-none font-arabic placeholder-ink-600"
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
              className="w-full px-3 py-2 bg-ink-950 border border-ink-700 rounded-lg text-sand-100 text-sm font-mono focus:ring-1 focus:ring-sand-500 focus:outline-none resize-y min-h-[60px] placeholder-ink-600"
              placeholder="اكتب المعادلة (LaTeX أو نص)"
              dir="ltr"
            />
            <p className="text-xs text-ink-600 font-arabic">يمكنك استخدام صيغة LaTeX للمعادلات</p>
          </div>
        );

      case 'HIGHLIGHT_BOX':
        return (
          <div className="bg-sand-900/20 border-r-4 border-sand-600 rounded-lg p-3">
            <p className="text-xs text-sand-600 mb-2 font-arabic">⚠ تنبيه مهم</p>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-sand-200 text-sm font-arabic placeholder-ink-600"
              placeholder="النص المهم الذي تريد إبرازه..."
            />
          </div>
        );

      case 'EXAMPLE':
        return (
          <div className="bg-teal-900/20 border-r-4 border-teal-600 rounded-lg p-3">
            <p className="text-xs text-teal-500 mb-2 font-arabic">✎ مثال</p>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-teal-100 text-sm font-arabic placeholder-teal-800"
              placeholder="اكتب المثال هنا..."
            />
          </div>
        );

      case 'TIP':
        return (
          <div className="bg-ember-900/20 border-r-4 border-ember-500 rounded-lg p-3">
            <p className="text-xs text-ember-400 mb-2 font-arabic">◈ نصيحة</p>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-200 text-sm font-arabic placeholder-ink-700"
              placeholder="اكتب النصيحة هنا..."
            />
          </div>
        );

      case 'QUOTE':
        return (
          <div className="border-r-4 border-ink-600 pr-4">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="w-full bg-transparent border-none resize-y min-h-[80px] focus:outline-none text-ink-300 text-sm italic font-arabic placeholder-ink-700"
              placeholder="الاقتباس..."
            />
          </div>
        );

      case 'LIST':
        return (
          <div className="space-y-2">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className={`${inputClass} min-h-[100px]`}
              placeholder="اكتب كل عنصر في سطر جديد..."
            />
            <p className="text-xs text-ink-600 font-arabic">كل سطر سيظهر كعنصر منفصل في القائمة</p>
          </div>
        );

      case 'TABLE':
        return (
          <LessonTableEditor
            value={block.content}
            onChange={(v) => updateBlock(block.id, { content: v })}
          />
        );

      case 'DIVIDER':
        return (
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-ink-700" />
            <span className="text-ink-700 text-xs font-mono">— فاصل —</span>
            <div className="flex-1 h-px bg-ink-700" />
          </div>
        );

      default:
        return (
          <textarea
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            className={`${inputClass} min-h-[100px]`}
            placeholder="المحتوى..."
          />
        );
    }
  };

  return (
    <div className="border border-ink-800 rounded-xl overflow-hidden">
      {/* Block Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-ink-800/50 border-b border-ink-800">
        <span className="text-ink-700 cursor-grab text-sm">⋮⋮</span>

        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-ink-800 border border-ink-700 rounded text-xs text-ink-400 font-mono">
          <span>{config.icon}</span>
          <span className="font-arabic">{config.label}</span>
        </span>

        {/* Concept ref selector */}
        <select
          value={block.conceptRef || ''}
          onChange={(e) => updateBlock(block.id, { conceptRef: e.target.value || null })}
          className="text-xs px-2 py-1 bg-ink-900 border border-ink-700 rounded text-ink-400 focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic max-w-[150px]"
        >
          <option value="">ربط بمفهوم...</option>
          {concepts.map((c) => (
            <option key={c.id} value={c.id}>{c.titleAr}</option>
          ))}
        </select>

        {linkedConcept && (
          <span className="px-2 py-0.5 bg-sand-900/40 text-sand-500 text-xs rounded border border-sand-800/50 font-arabic">
            💡 {linkedConcept.titleAr}
          </span>
        )}

        <div className="flex-1" />

        <DeleteButton onDelete={handleDelete} />
      </div>

      {/* Block Content */}
      <div className="p-3 bg-ink-950/30">{renderEditor()}</div>
    </div>
  );
}
import { useState, useRef } from 'react';
import { useDataStore } from '@/store/dataStore';

export default function ExportPage() {
  const {
    exportData, importData, resetAll,
    subject, units, lessons, sections, concepts, feedItems, tags, questions, exams,
  } = useDataStore();

  const [showPreview, setShowPreview] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const data = exportData();

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `basheer-${subject?.id || 'data'}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        importData(json);
        alert('تم استيراد البيانات بنجاح!');
      } catch {
        setImportError('خطأ في قراءة الملف. تأكد من أنه ملف JSON صحيح.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      resetAll();
    }
  };

  const stats = [
    { label: 'الوحدات',      val: units.length     },
    { label: 'الدروس',       val: lessons.length   },
    { label: 'الأقسام',      val: sections.length  },
    { label: 'المفاهيم',     val: concepts.length  },
    { label: 'الوسوم',       val: tags.length      },
    { label: 'التغذية',      val: feedItems.length },
    { label: 'الأسئلة',      val: questions.length },
    { label: 'الامتحانات',   val: exams.length     },
  ];

  const jsonSize = Math.round(JSON.stringify(data).length / 1024);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-sand-200 font-arabic">تصدير البيانات</h1>
        <p className="text-ink-500 mt-0.5 text-sm font-arabic">
          تصدير ملف JSON جاهز لبذر قاعدة بيانات التطبيق
        </p>
      </div>

      {/* Subject info */}
      {subject ? (
        <div className="p-5 bg-ink-900 rounded-xl border border-ink-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-sand-200 font-arabic">{subject.nameAr}</h2>
              {subject.nameEn && <p className="text-sm text-ink-500">{subject.nameEn}</p>}
            </div>
            <span className="px-2.5 py-1 bg-ink-800 text-ink-400 text-xs rounded border border-ink-700 font-mono">
              {subject.id}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {stats.map(({ label, val }) => (
              <div key={label} className="text-center p-3 bg-ink-800 rounded-lg border border-ink-700">
                <div className="text-xl font-bold text-sand-300 font-mono">{val}</div>
                <div className="text-xs text-ink-500 mt-0.5 font-arabic">{label}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-5 bg-ink-900 rounded-xl border border-ink-800 mb-6 text-center">
          <p className="text-ink-500 font-arabic">لم يتم تحديد مادة بعد</p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={handleExport}
          disabled={!subject}
          className="flex items-center justify-center gap-3 py-4 bg-sand-700 text-ink-950 rounded-xl hover:bg-sand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <span className="text-xl">📤</span>
          <div className="text-right">
            <div className="font-semibold font-arabic">تصدير JSON</div>
            <div className="text-xs opacity-70 font-arabic">~{jsonSize}KB</div>
          </div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 py-4 bg-ink-800 text-ink-200 rounded-xl hover:bg-ink-700 transition-colors border border-ink-700"
        >
          <span className="text-xl">📥</span>
          <div className="text-right">
            <div className="font-semibold font-arabic">استيراد JSON</div>
            <div className="text-xs text-ink-500 font-arabic">استرجاع بيانات محفوظة</div>
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm font-arabic">
          {importError}
        </div>
      )}

      {/* Preview */}
      <div className="mb-6">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-2 text-ink-500 hover:text-ink-300 transition-colors text-sm font-arabic"
        >
          <span className={`text-xs transition-transform ${showPreview ? 'rotate-90' : ''}`}>▶</span>
          {showPreview ? 'إخفاء' : 'معاينة'} JSON
        </button>

        {showPreview && (
          <div className="mt-3 relative">
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
              className="absolute top-3 left-3 px-2 py-1 bg-ink-800 text-ink-400 text-xs rounded hover:bg-ink-700 transition-colors font-arabic z-10"
            >
              نسخ
            </button>
            <pre className="bg-ink-950 border border-ink-800 rounded-xl p-4 pt-10 text-xs text-ink-400 overflow-auto max-h-80 font-mono" dir="ltr">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Danger Zone */}
      <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-xl">
        <h3 className="text-sm font-semibold text-red-400 mb-2 font-arabic">منطقة الخطر</h3>
        <p className="text-xs text-ink-600 mb-3 font-arabic">
          سيتم حذف جميع البيانات المحلية. لا يمكن التراجع عن هذا الإجراء.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/50 transition-colors text-sm font-arabic"
        >
          حذف جميع البيانات
        </button>
      </div>
    </div>
  );
}

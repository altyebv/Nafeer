import { useState, useRef } from 'react';
import { useDataStore } from '@/store/dataStore';
import DeleteButton from '@/components/editor/shared/DeleteButton';
import { Check, ChevronLeft, Download, TriangleAlert, Upload } from 'lucide-react';

export default function ExportPage({ subjectId }) {
  const {
    resetAll,
    subject, units, lessons, sections, concepts, feedItems, tags, questions, exams,
  } = useDataStore();

  const [showPreview,   setShowPreview]   = useState(false);
  const [previewData,   setPreviewData]   = useState(null);
  const [importError,   setImportError]   = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportError,   setExportError]   = useState('');
  const [isExporting,   setIsExporting]   = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = async () => {
    if (!subject && !subjectId) {
      setExportError('لا يمكن التصدير: لم يتم تحميل بيانات المادة بعد.');
      return;
    }
    if (lessons.length === 0) {
      setExportError('لا يمكن التصدير: لا توجد دروس في المادة.');
      return;
    }

    setExportError('');
    setIsExporting(true);

    try {
      const exportSubjectId = subjectId || subject?.id;
      const res  = await fetch(`/api/export?subjectId=${exportSubjectId}`);
      const json = await res.json();

      if (!json.ok) throw new Error(json.error || 'خطأ في التصدير');

      const data = json.data;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `basheer-${exportSubjectId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setPreviewData(data);
    } catch (e) {
      setExportError(e.message || 'فشل التصدير — تحقق من الاتصال بالخادم.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess(false);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        setPreviewData(json);
        setImportSuccess(true);
        setTimeout(() => setImportSuccess(false), 4000);
      } catch {
        setImportError('خطأ في قراءة الملف. تأكد من أنه ملف JSON صحيح.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const stats = [
    { label: 'الوحدات',    val: units.length     },
    { label: 'الدروس',     val: lessons.length   },
    { label: 'الأقسام',    val: sections.length  },
    { label: 'المفاهيم',   val: concepts.length  },
    { label: 'الوسوم',     val: tags.length      },
    { label: 'التغذية',    val: feedItems.length },
    { label: 'الأسئلة',    val: questions.length },
    { label: 'الامتحانات', val: exams.length     },
  ];

  const exportedStats = previewData ? [
    { label: 'الوحدات',    val: previewData.units?.length     || 0 },
    { label: 'الدروس',     val: previewData.units?.flatMap(u => u.lessons || []).length || 0 },
    { label: 'المفاهيم',   val: previewData.concepts?.length  || 0 },
    { label: 'التغذية',    val: previewData.feedItems?.length || 0 },
    { label: 'الأسئلة',    val: previewData.questions?.length || 0 },
    { label: 'الامتحانات', val: previewData.exams?.length     || 0 },
  ] : null;

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
          disabled={!subject || isExporting}
          className="flex items-center justify-center gap-3 py-4 bg-sand-700 text-ink-950 rounded-xl hover:bg-sand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isExporting ? (
            <span className="inline-block w-5 h-5 border-2 border-ink-800 border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={22} strokeWidth={1.9} />
          )}
          <div className="text-right">
            <div className="font-semibold font-arabic">{isExporting ? 'جاري التصدير…' : 'تصدير JSON'}</div>
            <div className="text-xs opacity-70 font-arabic">المحتوى المعتمد فقط</div>
          </div>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-3 py-4 bg-ink-800 text-ink-200 rounded-xl hover:bg-ink-700 transition-colors border border-ink-700"
        >
          <Upload size={22} strokeWidth={1.9} />
          <div className="text-right">
            <div className="font-semibold font-arabic">معاينة JSON</div>
            <div className="text-xs text-ink-500 font-arabic">فتح ملف محلي للمعاينة</div>
          </div>
        </button>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
      </div>

      {importError && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-800/50 rounded-lg text-red-400 text-sm font-arabic">
          {importError}
        </div>
      )}

      {importSuccess && (
        <div className="mb-4 p-3 bg-emerald-900/20 border border-emerald-800/50 rounded-lg text-emerald-400 text-sm font-arabic">
          <Check size={15} strokeWidth={2} className="inline ml-1" /> تم استيراد البيانات بنجاح
        </div>
      )}

      {exportError && (
        <div className="mb-4 p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg text-amber-400 text-sm font-arabic">
          <TriangleAlert size={15} strokeWidth={1.9} className="inline ml-1" /> {exportError}
        </div>
      )}

      {/* Preview */}
      <div className="mb-6">
        <button
          onClick={() => setShowPreview(!showPreview)}
          disabled={!previewData}
          className="flex items-center gap-2 text-ink-500 hover:text-ink-300 transition-colors text-sm font-arabic disabled:opacity-40"
        >
          <ChevronLeft size={13} strokeWidth={2} className={`transition-transform ${showPreview ? '-rotate-90' : ''}`} />
          {showPreview ? 'إخفاء' : 'معاينة'} JSON
        </button>

        {showPreview && previewData && (
          <div className="mt-3 relative">
            <button
              onClick={() => navigator.clipboard.writeText(JSON.stringify(previewData, null, 2))}
              className="absolute top-3 left-3 px-2 py-1 bg-ink-800 text-ink-400 text-xs rounded hover:bg-ink-700 transition-colors font-arabic z-10"
            >
              نسخ
            </button>
            <pre className="bg-ink-950 border border-ink-800 rounded-xl p-4 pt-10 text-xs text-ink-400 overflow-auto max-h-80 font-mono" dir="ltr">
              {JSON.stringify(previewData, null, 2)}
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
        <DeleteButton
          onDelete={resetAll}
          label="حذف جميع البيانات"
          size="md"
          className="px-4 py-2 bg-red-900/30 text-red-400 border border-red-800/50 rounded-lg hover:bg-red-900/50 transition-colors text-sm font-arabic"
        />
      </div>
    </div>
  );
}

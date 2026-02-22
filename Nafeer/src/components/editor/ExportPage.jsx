import { useState, useRef } from 'react';
import { useDataStore } from '@/store/dataStore';

export default function ExportPage() {
  const { exportData, importData, resetAll, subject, units, lessons, concepts, feedItems, tags } = useDataStore();

  const [showPreview, setShowPreview] = useState(false);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef(null);

  const data = exportData();

  const handleExport = () => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
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
      } catch (error) {
        setImportError('خطأ في قراءة الملف. تأكد من أنه ملف JSON صحيح.');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    if (confirm('هل أنت متأكد من حذف جميع البيانات؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      resetAll();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    alert('تم نسخ البيانات!');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-800">تصدير / استيراد</h1>
        <p className="text-stone-500 mt-1">إدارة بيانات المشروع</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-6 gap-4 mb-8">
        <div className="p-4 bg-white border border-stone-200 rounded-xl text-center">
          <div className="text-3xl font-semibold text-amber-600">{units.length}</div>
          <div className="text-sm text-stone-500">وحدات</div>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-xl text-center">
          <div className="text-3xl font-semibold text-amber-600">{lessons.length}</div>
          <div className="text-sm text-stone-500">دروس</div>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-xl text-center">
          <div className="text-3xl font-semibold text-amber-600">{concepts.length}</div>
          <div className="text-sm text-stone-500">مفاهيم</div>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-xl text-center">
          <div className="text-3xl font-semibold text-amber-600">{feedItems.length}</div>
          <div className="text-sm text-stone-500">عناصر تغذية</div>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-xl text-center">
          <div className="text-3xl font-semibold text-amber-600">{tags.length}</div>
          <div className="text-sm text-stone-500">وسوم</div>
        </div>
        <div className="p-4 bg-white border border-stone-200 rounded-xl text-center">
          <div className="text-3xl font-semibold text-stone-400">
            {(JSON.stringify(data).length / 1024).toFixed(1)} KB
          </div>
          <div className="text-sm text-stone-500">حجم البيانات</div>
        </div>
      </div>

      {/* Format Info */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <h3 className="text-sm font-medium text-blue-800 mb-1">📋 صيغة التصدير</h3>
        <p className="text-sm text-blue-700">
          BasheerExportData v1.0 - متوافق مع تطبيق Android
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Export */}
        <div className="p-6 bg-white border border-stone-200 rounded-xl">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">📤 تصدير</h2>
          <p className="text-sm text-stone-500 mb-4">
            تحميل جميع البيانات كملف JSON للاستخدام في التطبيق
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex-1 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              تحميل JSON
            </button>
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              نسخ
            </button>
          </div>
        </div>

        {/* Import */}
        <div className="p-6 bg-white border border-stone-200 rounded-xl">
          <h2 className="text-lg font-semibold text-stone-800 mb-2">📥 استيراد</h2>
          <p className="text-sm text-stone-500 mb-4">
            استيراد بيانات من ملف JSON (سيحل محل البيانات الحالية)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className="block w-full py-2 text-center border-2 border-dashed border-stone-300 rounded-lg text-stone-500 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50 cursor-pointer transition-colors"
          >
            اختر ملف JSON
          </label>
          {importError && (
            <p className="text-sm text-red-500 mt-2">{importError}</p>
          )}
        </div>
      </div>

      {/* Preview Toggle */}
      <button
        onClick={() => setShowPreview(!showPreview)}
        className="mb-4 text-sm text-amber-600 hover:text-amber-700"
      >
        {showPreview ? '▼ إخفاء المعاينة' : '◀ عرض معاينة JSON'}
      </button>

      {/* JSON Preview */}
      {showPreview && (
        <div className="bg-stone-900 rounded-xl p-4 overflow-x-auto">
          <pre className="text-sm text-stone-300 font-mono whitespace-pre-wrap" dir="ltr">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      {/* Danger Zone */}
      <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-xl">
        <h2 className="text-lg font-semibold text-red-700 mb-2">⚠️ منطقة الخطر</h2>
        <p className="text-sm text-red-600 mb-4">
          حذف جميع البيانات نهائياً. تأكد من تصدير البيانات قبل الحذف.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          حذف جميع البيانات
        </button>
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useMediaStore } from '@/store/mediaStore';
import { SUBJECTS_CATALOG } from '@/shared/curriculum';

const ACCEPT = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';

const TYPE_BADGE = {
  IMAGE: { label: 'صورة',       bg: 'bg-green-900/40',  text: 'text-green-400',  border: 'border-green-800/50'  },
  GIF:   { label: 'متحرك',      bg: 'bg-purple-900/40', text: 'text-purple-400', border: 'border-purple-800/50' },
};

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── MediaPage ────────────────────────────────────────────────────────────────
export default function MediaPage({ subjectId, contributor }) {
  const isAdmin = contributor?.role === 'admin';

  const { media, mediaLoading, mediaError, setMedia, setMediaLoading, setMediaError,
          addMediaItem, removeMediaItem } = useMediaStore();

  // ── filter state ──────────────────────────────────────────────────────────
  const [filterSubject,  setFilterSubject]  = useState(isAdmin ? 'all' : subjectId);
  const [filterType,     setFilterType]     = useState('all');
  const [search,         setSearch]         = useState('');
  const [copiedId,       setCopiedId]       = useState(null);
  const [deletingId,     setDeletingId]     = useState(null);
  const [confirmDelete,  setConfirmDelete]  = useState(null); // contentId of item pending confirmation

  // ── upload state ──────────────────────────────────────────────────────────
  const [uploadSubject,  setUploadSubject]  = useState(subjectId || 'common');
  const [uploadAlt,      setUploadAlt]      = useState('');
  const [uploading,      setUploading]      = useState(false);
  const [uploadError,    setUploadError]    = useState(null);
  const [dragOver,       setDragOver]       = useState(false);
  const fileInputRef = useRef(null);

  // ── fetch ─────────────────────────────────────────────────────────────────
  const fetchMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const params = new URLSearchParams();
      if (isAdmin && filterSubject !== 'all') params.set('subjectId', filterSubject);
      const res  = await fetch(`/api/media?${params}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل تحميل الوسائط');
      setMedia(json.data);
    } catch (e) {
      setMediaError(e.message);
    }
  }, [isAdmin, filterSubject]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // ── upload ────────────────────────────────────────────────────────────────
  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploadError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('subjectId', uploadSubject);
      fd.append('alt', uploadAlt);

      try {
        const res  = await fetch('/api/media', { method: 'POST', body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        addMediaItem(json.data);
      } catch (e) {
        setUploadError(`فشل رفع "${file.name}": ${e.message}`);
      }
    }

    setUploading(false);
    setUploadAlt('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (contentId) => {
    setDeletingId(contentId);
    setConfirmDelete(null);
    try {
      const res  = await fetch(`/api/media/${contentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      removeMediaItem(contentId);
    } catch (e) {
      alert(`فشل الحذف: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // ── copy URL ──────────────────────────────────────────────────────────────
  const copyUrl = (url, contentId) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(contentId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── filtered list ─────────────────────────────────────────────────────────
  const filtered = media.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (search && !m.filename.toLowerCase().includes(search.toLowerCase()) &&
        !m.alt?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ── subject label helper ──────────────────────────────────────────────────
  const subjectLabel = (id) => {
    if (id === 'common') return 'مشترك';
    return SUBJECTS_CATALOG.find((s) => s.id === id)?.nameAr || id;
  };

  return (
    <div className="space-y-8 font-arabic" dir="rtl">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-sand-200">مكتبة الوسائط</h1>
          <p className="text-ink-500 text-sm mt-0.5">
            {isAdmin
              ? 'رفع وإدارة الصور لجميع المواد'
              : `الصور المتاحة لمادة ${subjectLabel(subjectId)}`}
          </p>
        </div>
        <span className="text-xs text-ink-600 font-mono">{filtered.length} ملف</span>
      </div>

      {/* ── Upload zone (admin only) ──────────────────────────────────────── */}
      {isAdmin && (
        <div className="rounded-xl border border-ink-800 overflow-hidden">
          <div className="px-4 py-3 bg-ink-900/60 border-b border-ink-800 flex items-center gap-2">
            <span className="text-sand-500 text-sm font-mono">↑</span>
            <span className="text-sm text-sand-300 font-semibold">رفع ملفات جديدة</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Subject + alt row */}
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-ink-500 mb-1.5">المادة</label>
                <select
                  value={uploadSubject}
                  onChange={(e) => setUploadSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none"
                >
                  <option value="common">مشترك (لجميع المواد)</option>
                  {SUBJECTS_CATALOG.map((s) => (
                    <option key={s.id} value={s.id}>{s.nameAr}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-ink-500 mb-1.5">النص البديل (اختياري)</label>
                <input
                  type="text"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  placeholder="وصف الصورة للقارئات الصوتية…"
                  className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm placeholder-ink-700 focus:ring-1 focus:ring-sand-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-2 p-8
                border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${dragOver
                  ? 'border-sand-500 bg-sand-900/10'
                  : 'border-ink-700 hover:border-ink-600 hover:bg-ink-900/30'}
                ${uploading ? 'pointer-events-none opacity-60' : ''}
              `}
            >
              {uploading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-sand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-ink-500 text-sm">جاري الرفع…</span>
                </>
              ) : (
                <>
                  <span className="text-2xl text-ink-600">⬆</span>
                  <span className="text-ink-400 text-sm">اسحب الملفات هنا أو اضغط للتصفح</span>
                  <span className="text-ink-700 text-xs">JPEG · PNG · GIF · WebP · SVG — حتى 10 ميغابايت</span>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />

            {uploadError && (
              <p className="text-red-400 text-xs bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                ⚠ {uploadError}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Admin: subject filter */}
        {isAdmin && (
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="px-3 py-1.5 bg-ink-900 border border-ink-800 rounded-lg text-ink-300 text-xs focus:ring-1 focus:ring-sand-600 focus:outline-none"
          >
            <option value="all">كل المواد</option>
            <option value="common">مشترك</option>
            {SUBJECTS_CATALOG.map((s) => (
              <option key={s.id} value={s.id}>{s.nameAr}</option>
            ))}
          </select>
        )}

        {/* Type filter */}
        {['all', 'IMAGE', 'GIF'].map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filterType === t
                ? 'bg-sand-800/60 text-sand-300 border-sand-700'
                : 'bg-ink-900 text-ink-500 border-ink-800 hover:border-ink-600 hover:text-ink-300'
            }`}
          >
            {t === 'all' ? 'الكل' : t === 'IMAGE' ? 'صور' : 'متحركة'}
          </button>
        ))}

        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث في الأسماء…"
          className="flex-1 min-w-[160px] px-3 py-1.5 bg-ink-900 border border-ink-800 rounded-lg text-ink-300 text-xs placeholder-ink-700 focus:ring-1 focus:ring-sand-600 focus:outline-none"
        />
      </div>

      {/* ── Error / loading states ────────────────────────────────────────── */}
      {mediaError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-900/40 rounded-xl text-red-400 text-sm">
          <span>⚠</span><span>{mediaError}</span>
          <button onClick={fetchMedia} className="mr-auto text-xs underline hover:no-underline">إعادة المحاولة</button>
        </div>
      )}

      {mediaLoading && !media.length && (
        <div className="flex items-center justify-center py-20">
          <span className="inline-block w-6 h-6 border-2 border-sand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Media grid ───────────────────────────────────────────────────── */}
      {!mediaLoading && !mediaError && (
        <>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-ink-600">
              <span className="text-4xl">🖼</span>
              <p className="text-sm font-arabic">
                {media.length === 0
                  ? (isAdmin ? 'لا توجد ملفات بعد — ارفع أول صورة أعلاه' : 'لا توجد وسائط لهذه المادة بعد')
                  : 'لا توجد نتائج لهذا البحث'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map((item) => {
                const badge     = TYPE_BADGE[item.type] || TYPE_BADGE.IMAGE;
                const isCopied  = copiedId  === item.contentId;
                const isDeleting = deletingId === item.contentId;
                const pendingDel = confirmDelete === item.contentId;

                return (
                  <div
                    key={item.contentId}
                    className="group relative rounded-xl border border-ink-800 overflow-hidden bg-ink-900/40 hover:border-ink-700 transition-all"
                  >
                    {/* Thumbnail */}
                    <div className="aspect-square bg-ink-950 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt={item.alt || item.filename}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Info row */}
                    <div className="px-2 py-2 space-y-1">
                      {/* filename */}
                      <p
                        className="text-xs text-ink-300 truncate leading-tight"
                        title={item.filename}
                      >
                        {item.filename}
                      </p>

                      {/* badges row */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {badge.label}
                        </span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] border bg-ink-800 text-ink-500 border-ink-700">
                            {subjectLabel(item.subjectId)}
                          </span>
                        )}
                        <span className="text-[10px] text-ink-700 mr-auto">{formatBytes(item.size)}</span>
                      </div>
                    </div>

                    {/* Action bar — shown on hover */}
                    <div className="flex items-center gap-0 border-t border-ink-800/60">
                      {/* Copy URL */}
                      <button
                        onClick={() => copyUrl(item.url, item.contentId)}
                        title="نسخ الرابط"
                        className={`flex-1 flex items-center justify-center py-1.5 text-xs transition-colors ${
                          isCopied ? 'text-emerald-400' : 'text-ink-600 hover:text-ink-300'
                        }`}
                      >
                        {isCopied ? '✓' : '⎘'}
                      </button>

                      {/* Open in new tab */}
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="فتح في تبويب جديد"
                        className="flex-1 flex items-center justify-center py-1.5 text-xs text-ink-600 hover:text-ink-300 transition-colors"
                      >
                        ↗
                      </a>

                      {/* Delete (admin only) */}
                      {isAdmin && (
                        pendingDel ? (
                          <>
                            <button
                              onClick={() => handleDelete(item.contentId)}
                              disabled={isDeleting}
                              className="flex-1 py-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors"
                            >
                              {isDeleting ? '…' : 'تأكيد'}
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="flex-1 py-1.5 text-xs text-ink-600 hover:text-ink-400 transition-colors"
                            >
                              إلغاء
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setConfirmDelete(item.contentId)}
                            title="حذف"
                            className="flex-1 flex items-center justify-center py-1.5 text-xs text-ink-700 hover:text-red-500 transition-colors"
                          >
                            ✕
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
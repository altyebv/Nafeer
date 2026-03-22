'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SUBJECTS_CATALOG_REF } from '../_constants';
import { SectionHeader, EmptyState, Spinner, StatChips } from './ui/shared';
import { Btn } from './ui/Btn';

const ACCEPT    = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';
const MAX_BYTES = 10 * 1024 * 1024;

const MEDIA_TYPE_BADGE = {
  IMAGE: { label: 'صورة',   bg: 'bg-green-900/30',  text: 'text-green-400',  border: 'border-green-800/40'  },
  GIF:   { label: 'متحرك', bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-800/40' },
};

function fmtBytes(b) {
  if (b < 1024)        return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function subjectLabel(id) {
  if (id === 'common') return 'مشترك';
  return SUBJECTS_CATALOG_REF.find((s) => s.id === id)?.nameAr || id;
}

// ── Lightbox ────────────────────────────────────────────────────────────────

function MediaLightbox({ item, onClose, onDelete, onCopy, copiedId }) {
  const overlayRef  = useRef(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const badge = MEDIA_TYPE_BADGE[item.type] || MEDIA_TYPE_BADGE.IMAGE;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-ink-900 border border-ink-700/60 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between px-5 py-3.5 border-b border-ink-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`text-[11px] px-2 py-0.5 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>{badge.label}</span>
            <span className="text-sm text-sand-300 font-mono truncate">{item.filename}</span>
          </div>
          <button onClick={onClose} className="shrink-0 text-ink-600 hover:text-ink-300 text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-ink-800 transition-colors">×</button>
        </div>

        <div className="flex-1 overflow-auto bg-ink-950/60 flex items-center justify-center p-4 min-h-[200px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.url} alt={item.alt || item.filename} className="max-w-full max-h-[55vh] object-contain rounded-lg" />
        </div>

        <div className="px-5 py-4 border-t border-ink-800/60 space-y-3">
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono text-ink-500">
            <span className="font-arabic">{subjectLabel(item.subjectId)}</span>
            <span>·</span><span>{fmtBytes(item.size)}</span>
            <span>·</span><span dir="ltr">{new Date(item.createdAt).toLocaleDateString('en-GB')}</span>
            {item.alt && <><span>·</span><span className="text-ink-600 font-arabic">{item.alt}</span></>}
          </div>

          <div className="flex items-center gap-2 bg-ink-950/60 rounded-lg px-3 py-2 border border-ink-800/40">
            <span className="flex-1 text-[11px] font-mono text-ink-600 truncate" dir="ltr">{item.url}</span>
            <button
              onClick={() => onCopy(item.url, item.contentId)}
              className={`shrink-0 text-xs font-mono px-2.5 py-1 rounded-lg border transition-all ${
                copiedId === item.contentId
                  ? 'bg-emerald-900/40 border-emerald-800/50 text-emerald-400'
                  : 'bg-ink-800/60 border-ink-700/50 text-ink-400 hover:text-ink-200'
              }`}
            >
              {copiedId === item.contentId ? '✓ تم النسخ' : 'نسخ'}
            </button>
            <a href={item.url} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-xs font-mono px-2.5 py-1 rounded-lg border bg-ink-800/60 border-ink-700/50 text-ink-400 hover:text-ink-200 transition-all">↗</a>
          </div>

          <div className="flex items-center justify-end gap-2">
            {confirmDel ? (
              <>
                <span className="text-xs text-red-400 font-arabic ml-auto">هل أنت متأكد؟</span>
                <Btn small variant="ghost" onClick={() => setConfirmDel(false)}>إلغاء</Btn>
                <Btn small variant="red" onClick={() => onDelete(item.contentId)}>حذف نهائي</Btn>
              </>
            ) : (
              <Btn small variant="red" onClick={() => setConfirmDel(true)}>✕ حذف</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main section ─────────────────────────────────────────────────────────────

export function MediaSection() {
  const [media,          setMedia]          = useState([]);
  const [loadingMedia,   setLoadingMedia]   = useState(true);
  const [mediaError,     setMediaError]     = useState(null);
  const [uploadSubject,  setUploadSubject]  = useState('common');
  const [uploadAlt,      setUploadAlt]      = useState('');
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [uploadError,    setUploadError]    = useState(null);
  const [dragOver,       setDragOver]       = useState(false);
  const [filterSubject,  setFilterSubject]  = useState('all');
  const [filterType,     setFilterType]     = useState('all');
  const [search,         setSearch]         = useState('');
  const [copiedId,       setCopiedId]       = useState(null);
  const [delConfirm,     setDelConfirm]     = useState(null);
  const [deleting,       setDeleting]       = useState(null);
  const [lightbox,       setLightbox]       = useState(null);
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoadingMedia(true); setMediaError(null);
    try {
      const params = new URLSearchParams();
      if (filterSubject !== 'all') params.set('subjectId', filterSubject);
      const res  = await fetch(`/api/media?${params}`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل التحميل');
      setMedia(json.data || []);
    } catch (e) { setMediaError(e.message); }
    finally { setLoadingMedia(false); }
  }, [filterSubject]);

  useEffect(() => { load(); }, [load]);

  const handleUpload = async (files) => {
    if (!files?.length) return;
    setUploadError(null); setUploading(true);
    const list = Array.from(files);
    setUploadProgress(list.map((f) => ({ name: f.name, status: 'pending' })));

    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      if (file.size > MAX_BYTES) {
        setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'error', msg: 'أكبر من 10 MB' } : x));
        continue;
      }
      setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'uploading' } : x));
      const fd = new FormData();
      fd.append('file', file); fd.append('subjectId', uploadSubject); fd.append('alt', uploadAlt);
      try {
        const res  = await fetch('/api/media', { method: 'POST', body: fd });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        setMedia((prev) => [json.data, ...prev]);
        setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'done' } : x));
      } catch (e) {
        setUploadProgress((p) => p.map((x, j) => j === i ? { ...x, status: 'error', msg: e.message } : x));
        setUploadError(`فشل رفع "${file.name}": ${e.message}`);
      }
    }
    setUploading(false); setUploadAlt('');
    if (fileRef.current) fileRef.current.value = '';
    setTimeout(() => setUploadProgress([]), 3000);
  };

  const handleDelete = async (contentId) => {
    setDeleting(contentId); setDelConfirm(null);
    try {
      const res  = await fetch(`/api/media/${contentId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setMedia((prev) => prev.filter((m) => m.contentId !== contentId));
      if (lightbox?.contentId === contentId) setLightbox(null);
    } catch (e) { setUploadError(`فشل الحذف: ${e.message}`); }
    finally { setDeleting(null); }
  };

  const copyUrl = (url, contentId) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(contentId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = media.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.filename?.toLowerCase().includes(q) && !m.alt?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const totalSize = media.reduce((acc, m) => acc + (m.size || 0), 0);

  return (
    <>
      <div>
        <SectionHeader title="مكتبة الوسائط" description="رفع وإدارة الصور والملفات المتحركة لجميع المواد">
          <StatChips stats={[
            { label: 'إجمالي الملفات', count: media.length,                         color: 'text-ink-300'    },
            { label: 'صور',            count: media.filter(m=>m.type==='IMAGE').length, color: 'text-green-400'  },
            { label: 'متحركة',         count: media.filter(m=>m.type==='GIF').length,   color: 'text-purple-400' },
            { label: 'الحجم الكلي',    count: fmtBytes(totalSize),                  color: 'text-sand-400', mono: true },
          ]} />
        </SectionHeader>

        <div className="px-8 pb-8 space-y-6">

          {/* Upload panel */}
          <div className="rounded-xl border border-ink-800/60 overflow-hidden">
            <div className="px-4 py-3 bg-ink-900/70 border-b border-ink-800/60 flex items-center gap-2">
              <span className="text-sand-500 text-sm">↑</span>
              <span className="text-sm font-semibold text-sand-300 font-arabic">رفع ملفات جديدة</span>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-ink-500 mb-1.5 font-mono">المادة</label>
                  <select
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-ink-900 border border-ink-800/60 rounded-lg text-sand-100 text-sm font-arabic focus:outline-none focus:border-sand-700 transition-colors"
                  >
                    <option value="common">مشترك — متاح لجميع المواد</option>
                    {['COMMON', 'SCIENCE', 'LITERARY'].map((track) => (
                      <optgroup key={track} label={track === 'COMMON' ? 'مشترك' : track === 'SCIENCE' ? 'علمي' : 'أدبي'}>
                        {SUBJECTS_CATALOG_REF.filter((s) => s.track === track).map((s) => (
                          <option key={s.id} value={s.id}>{s.nameAr}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-ink-500 mb-1.5 font-mono">النص البديل (اختياري)</label>
                  <input
                    type="text" value={uploadAlt}
                    onChange={(e) => setUploadAlt(e.target.value)}
                    placeholder="وصف الصورة للقارئات الصوتية…"
                    className="w-full px-3 py-2 bg-ink-900 border border-ink-800/60 rounded-lg text-sand-100 text-sm font-arabic placeholder-ink-700 focus:outline-none focus:border-sand-700 transition-colors"
                  />
                </div>
              </div>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
                onClick={() => !uploading && fileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2.5 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver   ? 'border-sand-500 bg-sand-900/10' :
                  uploading  ? 'border-ink-700 opacity-60 cursor-not-allowed' :
                               'border-ink-700/60 hover:border-ink-600 hover:bg-ink-900/30'
                }`}
              >
                {uploading ? (
                  <><span className="w-5 h-5 border-2 border-sand-500 border-t-transparent rounded-full animate-spin" /><span className="text-ink-500 text-sm font-arabic">جاري الرفع…</span></>
                ) : (
                  <><span className="text-2xl text-ink-600 select-none">⬆</span><span className="text-sm text-ink-400 font-arabic">اسحب الملفات هنا أو اضغط للتصفح</span><span className="text-xs text-ink-700 font-mono">JPEG · PNG · GIF · WebP · SVG — حتى 10 MB</span></>
                )}
              </div>
              <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

              {uploadProgress.length > 0 && (
                <div className="space-y-1.5">
                  {uploadProgress.map((f, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-ink-900/60 border border-ink-800/40">
                      <span className={`text-xs font-mono shrink-0 ${f.status==='done'?'text-green-400':f.status==='error'?'text-red-400':f.status==='uploading'?'text-sand-400 animate-pulse':'text-ink-600'}`}>
                        {f.status==='done'?'✓':f.status==='error'?'✗':f.status==='uploading'?'↑':'·'}
                      </span>
                      <span className="flex-1 text-xs text-ink-400 truncate font-mono">{f.name}</span>
                      {f.msg && <span className="text-[10px] text-red-400 shrink-0">{f.msg}</span>}
                    </div>
                  ))}
                </div>
              )}
              {uploadError && <p className="text-red-400 text-xs bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2 font-arabic">⚠ {uploadError}</p>}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-1.5 bg-ink-900 border border-ink-800/60 rounded-lg text-ink-300 text-xs font-arabic focus:outline-none focus:border-sand-700 transition-colors">
              <option value="all">كل المواد</option>
              <option value="common">مشترك</option>
              {SUBJECTS_CATALOG_REF.map((s) => <option key={s.id} value={s.id}>{s.nameAr}</option>)}
            </select>
            {['all','IMAGE','GIF'].map((t) => (
              <button key={t} onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all font-arabic ${filterType===t?'bg-sand-800/50 text-sand-300 border-sand-700/50':'bg-ink-900 text-ink-500 border-ink-800/60 hover:border-ink-600 hover:text-ink-300'}`}>
                {t==='all'?'الكل':t==='IMAGE'?'صور':'متحركة'}
              </button>
            ))}
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث في أسماء الملفات…"
              className="flex-1 min-w-[160px] px-3 py-1.5 bg-ink-900 border border-ink-800/60 rounded-lg text-ink-300 text-xs placeholder-ink-700 focus:outline-none focus:border-sand-700 transition-colors font-arabic" />
            <span className="text-xs text-ink-600 font-mono shrink-0">{filtered.length} ملف</span>
            <button onClick={load} className="px-3 py-1.5 rounded-lg border border-ink-800/60 text-ink-600 hover:text-ink-300 text-xs font-mono transition-all hover:border-ink-600">↺</button>
          </div>

          {mediaError && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-900/20 border border-red-900/40 rounded-xl text-red-400 text-sm font-arabic">
              <span>⚠</span><span>{mediaError}</span>
              <button onClick={load} className="mr-auto text-xs underline hover:no-underline">إعادة المحاولة</button>
            </div>
          )}

          {loadingMedia && media.length === 0 && <Spinner />}

          {!loadingMedia && !mediaError && (
            filtered.length === 0 ? (
              <EmptyState text={media.length === 0 ? 'لا توجد ملفات بعد — ارفع أول صورة أعلاه' : 'لا توجد نتائج لهذا البحث'} />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((item) => {
                  const badge     = MEDIA_TYPE_BADGE[item.type] || MEDIA_TYPE_BADGE.IMAGE;
                  const isCopied  = copiedId === item.contentId;
                  const isPendDel = delConfirm === item.contentId;
                  const isDel     = deleting === item.contentId;
                  return (
                    <div key={item.contentId} className="group relative rounded-xl border border-ink-800/50 overflow-hidden bg-ink-900/40 hover:border-ink-700/60 transition-all">
                      <div className="aspect-square bg-ink-950 overflow-hidden cursor-zoom-in" onClick={() => setLightbox(item)}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt={item.alt||item.filename} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                      </div>
                      <div className="px-2 py-2 space-y-1">
                        <p className="text-xs text-ink-300 truncate leading-tight" title={item.filename}>{item.filename}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] border ${badge.bg} ${badge.text} ${badge.border}`}>{badge.label}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] border bg-ink-800/60 text-ink-500 border-ink-700/40 font-arabic">{subjectLabel(item.subjectId)}</span>
                          <span className="text-[10px] text-ink-700 font-mono mr-auto">{fmtBytes(item.size)}</span>
                        </div>
                        {item.alt && <p className="text-[10px] text-ink-600 truncate font-arabic">{item.alt}</p>}
                      </div>
                      <div className="flex items-center border-t border-ink-800/40">
                        <button onClick={() => copyUrl(item.url, item.contentId)} title="نسخ الرابط"
                          className={`flex-1 flex items-center justify-center py-1.5 text-xs transition-colors ${isCopied?'text-emerald-400':'text-ink-600 hover:text-ink-300'}`}>
                          {isCopied ? '✓' : '⎘'}
                        </button>
                        <a href={item.url} target="_blank" rel="noopener noreferrer" title="فتح"
                          className="flex-1 flex items-center justify-center py-1.5 text-xs text-ink-600 hover:text-ink-300 transition-colors">↗</a>
                        {isPendDel ? (
                          <>
                            <button onClick={() => handleDelete(item.contentId)} disabled={isDel}
                              className="flex-1 py-1.5 text-xs text-red-400 hover:text-red-300 font-semibold transition-colors">
                              {isDel ? '…' : 'تأكيد'}
                            </button>
                            <button onClick={() => setDelConfirm(null)} className="flex-1 py-1.5 text-xs text-ink-600 hover:text-ink-400 transition-colors">إلغاء</button>
                          </>
                        ) : (
                          <button onClick={() => setDelConfirm(item.contentId)} title="حذف"
                            className="flex-1 flex items-center justify-center py-1.5 text-xs text-ink-700 hover:text-red-500 transition-colors">✕</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </div>

      {lightbox && (
        <MediaLightbox
          item={lightbox}
          onClose={() => setLightbox(null)}
          onDelete={handleDelete}
          onCopy={copyUrl}
          copiedId={copiedId}
        />
      )}
    </>
  );
}
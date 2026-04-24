'use client';
import { useState, useEffect, useCallback } from 'react';
import { useMediaStore } from '@/store/mediaStore';

// ─── MediaPicker ──────────────────────────────────────────────────────────────
// A lightweight modal that lets the user select a media item from the library.
// Opened from BlockEditor when the block type is IMAGE or GIF.
//
// Props:
//   type         — 'IMAGE' | 'GIF'  → pre-filters the gallery
//   subjectId    — used to scope the fetch (contributor context)
//   onSelect(item) → called when a media item is clicked
//   onClose()      → called to dismiss the modal

export default function MediaPicker({ type, subjectId, onSelect, onClose }) {
  const { media, mediaLoading, setMedia, setMediaLoading, setMediaError } = useMediaStore();

  const [filterType,  setFilterType]  = useState(type || 'all');
  const [search,      setSearch]      = useState('');
  const [localError,  setLocalError]  = useState(null);

  // Fetch once if media list is empty
  const fetchMedia = useCallback(async () => {
    if (media.length > 0) return; // already populated by MediaPage
    setMediaLoading(true);
    try {
      const res  = await fetch('/api/media');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'فشل تحميل الوسائط');
      setMedia(json.data);
    } catch (e) {
      setLocalError(e.message);
      setMediaError(e.message);
    }
  }, [media.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const filtered = media.filter((m) => {
    if (filterType !== 'all' && m.type !== filterType) return false;
    if (search && !m.filename.toLowerCase().includes(search.toLowerCase()) &&
        !m.alt?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-ink-950 border border-ink-700 rounded-2xl shadow-2xl overflow-hidden font-arabic" dir="rtl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-800">
          <div>
            <h2 className="text-sm font-bold text-sand-200">اختر وسيطاً</h2>
            <p className="text-xs text-ink-500 mt-0.5">
              {type === 'GIF' ? 'صور متحركة فقط' : type === 'IMAGE' ? 'صور ثابتة فقط' : 'كل الوسائط'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-ink-600 hover:text-ink-300 transition-colors text-base"
          >
            ✕
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-ink-800/50">
          {/* Type tabs */}
          <div className="flex gap-1">
            {['all', 'IMAGE', 'GIF'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  filterType === t
                    ? 'bg-sand-800/60 text-sand-300 border-sand-700'
                    : 'bg-ink-900 text-ink-500 border-ink-800 hover:border-ink-600 hover:text-ink-300'
                }`}
              >
                {t === 'all' ? 'الكل' : t === 'IMAGE' ? 'صور' : 'متحركة'}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث…"
            className="flex-1 px-3 py-1 bg-ink-900 border border-ink-800 rounded-lg text-ink-300 text-xs placeholder-ink-700 focus:ring-1 focus:ring-sand-600 focus:outline-none"
          />

          <span className="text-[10px] text-ink-700 font-mono shrink-0">{filtered.length}</span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {mediaLoading && !media.length && (
            <div className="flex items-center justify-center py-16">
              <span className="inline-block w-5 h-5 border-2 border-sand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {localError && (
            <div className="flex items-center justify-center py-10 text-red-400 text-sm gap-2">
              <span>⚠</span><span>{localError}</span>
            </div>
          )}

          {!mediaLoading && !localError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-ink-600">
              <span className="text-3xl">🖼</span>
              <p className="text-sm">
                {media.length === 0
                  ? 'لا توجد وسائط — اطلب من المشرف رفع صور'
                  : 'لا توجد نتائج لهذا البحث'}
              </p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {filtered.map((item) => (
                <button
                  key={item.contentId}
                  onClick={() => onSelect(item)}
                  className="group relative rounded-xl overflow-hidden border border-ink-800 hover:border-sand-600 transition-all focus:outline-none focus:ring-2 focus:ring-sand-600"
                  title={item.alt || item.filename}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-ink-950">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt || item.filename}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-sand-900/0 group-hover:bg-sand-900/20 transition-all flex items-end">
                    <div className="w-full px-2 py-1.5 bg-gradient-to-t from-black/70 to-transparent">
                      <p className="text-[10px] text-white/80 truncate text-right leading-none">
                        {item.filename}
                      </p>
                    </div>
                  </div>

                  {/* GIF badge */}
                  {item.type === 'GIF' && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-purple-900/80 text-purple-300 text-[9px] font-bold rounded">
                      GIF
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-ink-800/50 text-[10px] text-ink-700 text-center">
          اضغط على صورة لاختيارها · ESC للإغلاق
        </div>
      </div>
    </div>
  );
}
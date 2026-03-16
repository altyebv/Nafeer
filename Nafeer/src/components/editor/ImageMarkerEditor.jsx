'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { randomId } from '@/lib/markerUtils';

// ─── ImageMarkerEditor ────────────────────────────────────────────────────────
// Props:
//   imageUrl  — the image src to render the canvas on
//   markers   — array of marker objects (see shape below)
//   onChange  — called with the new markers array on every mutation
//   readOnly  — if true, shows pins but disables editing (future preview use)
//
// Marker shape:
//   { id, x, y, label, description }
//   x, y are normalised 0–1 from the top-left of the image

export default function ImageMarkerEditor({ imageUrl, markers = [], onChange, readOnly = false }) {
  const containerRef = useRef(null);
  const imgRef       = useRef(null);
  const [imgLoaded,     setImgLoaded]     = useState(false);
  const [imgError,      setImgError]      = useState(false);
  const [activeId,      setActiveId]      = useState(null);   // marker being edited in panel
  const [placingMode,   setPlacingMode]   = useState(false);  // click-to-place mode toggle
  const [draggingId,    setDraggingId]    = useState(null);
  const [dragStart,     setDragStart]     = useState(null);

  // ── helpers ────────────────────────────────────────────────────────────────

  // Convert a pointer event position to normalised (x, y) relative to the image
  const toNorm = useCallback((clientX, clientY) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left)  / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top)   / rect.height)),
    };
  }, []);

  const update  = (id, patch) => onChange(markers.map((m) => m.id === id ? { ...m, ...patch } : m));
  const remove  = (id)        => { onChange(markers.filter((m) => m.id !== id)); if (activeId === id) setActiveId(null); };

  // ── click to place ─────────────────────────────────────────────────────────
  const handleImageClick = (e) => {
    if (!placingMode || readOnly) return;
    const pos = toNorm(e.clientX, e.clientY);
    if (!pos) return;
    const newMarker = { id: randomId('mk'), x: pos.x, y: pos.y, label: '', description: '' };
    const next = [...markers, newMarker];
    onChange(next);
    setActiveId(newMarker.id);
    setPlacingMode(false);
  };

  // ── drag to reposition ─────────────────────────────────────────────────────
  const handlePinMouseDown = (e, id) => {
    if (readOnly) return;
    e.stopPropagation();
    e.preventDefault();
    setDraggingId(id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setActiveId(id);
  };

  useEffect(() => {
    if (!draggingId) return;

    const onMove = (e) => {
      const pos = toNorm(e.clientX, e.clientY);
      if (!pos) return;
      update(draggingId, { x: pos.x, y: pos.y });
    };

    const onUp = () => { setDraggingId(null); setDragStart(null); };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── active marker form ────────────────────────────────────────────────────
  const activeMarker = markers.find((m) => m.id === activeId);

  // ── render ────────────────────────────────────────────────────────────────
  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center py-10 border border-dashed border-ink-800 rounded-xl text-ink-700 text-sm font-arabic">
        اختر صورة أولاً لتتمكن من إضافة العلامات
      </div>
    );
  }

  return (
    <div className="space-y-3 font-arabic" dir="rtl">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setPlacingMode((p) => !p)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              placingMode
                ? 'bg-sand-800/60 text-sand-300 border-sand-600 ring-1 ring-sand-600/40'
                : 'bg-ink-900 text-ink-400 border-ink-700 hover:border-ink-500 hover:text-ink-200'
            }`}
          >
            <span className="text-sm">{placingMode ? '✦' : '+'}</span>
            {placingMode ? 'انقر على الصورة لإضافة علامة' : 'إضافة علامة'}
          </button>

          <span className="text-xs text-ink-700">
            {markers.length === 0
              ? 'لا توجد علامات'
              : `${markers.length} ${markers.length === 1 ? 'علامة' : 'علامات'}`}
          </span>

          {placingMode && (
            <button
              onClick={() => setPlacingMode(false)}
              className="text-xs text-ink-600 hover:text-ink-400 mr-auto"
            >
              إلغاء
            </button>
          )}
        </div>
      )}

      {/* ── Canvas ──────────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className={`relative rounded-xl overflow-hidden border border-ink-800 bg-ink-950 select-none ${
          placingMode ? 'cursor-crosshair' : ''
        } ${draggingId ? 'cursor-grabbing' : ''}`}
        onClick={handleImageClick}
      >
        {/* The image itself */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageUrl}
          alt=""
          className="w-full h-auto block"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
        />

        {/* Loading / error states */}
        {!imgLoaded && !imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
            <span className="inline-block w-5 h-5 border-2 border-sand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950 text-red-500 text-sm">
            تعذّر تحميل الصورة
          </div>
        )}

        {/* Placing mode overlay hint */}
        {placingMode && imgLoaded && (
          <div className="absolute inset-0 bg-sand-900/10 pointer-events-none flex items-start justify-center pt-3">
            <span className="px-3 py-1.5 bg-sand-900/80 text-sand-300 text-xs rounded-full border border-sand-700/60 backdrop-blur-sm">
              انقر على الصورة لوضع العلامة
            </span>
          </div>
        )}

        {/* ── Pins ─────────────────────────────────────────────────────────── */}
        {imgLoaded && markers.map((marker, index) => {
          const isActive  = marker.id === activeId;
          const isDragging = marker.id === draggingId;
          const hasLabel  = Boolean(marker.label?.trim());

          return (
            <div
              key={marker.id}
              className="absolute"
              style={{
                left: `${marker.x * 100}%`,
                top:  `${marker.y * 100}%`,
                transform: 'translate(-50%, -100%)',
                zIndex: isActive ? 20 : 10,
              }}
            >
              {/* Pin body */}
              <div
                onMouseDown={(e) => handlePinMouseDown(e, marker.id)}
                onClick={(e) => { e.stopPropagation(); setActiveId(marker.id === activeId ? null : marker.id); }}
                className={`
                  flex flex-col items-center cursor-grab
                  ${isDragging ? 'cursor-grabbing' : ''}
                `}
                title={hasLabel ? marker.label : `علامة ${index + 1}`}
              >
                {/* Label bubble */}
                <div className={`
                  px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap shadow-lg mb-0.5
                  transition-all border
                  ${isActive
                    ? 'bg-sand-500 text-ink-950 border-sand-400'
                    : 'bg-ink-900/90 text-sand-300 border-sand-700/60 backdrop-blur-sm'}
                  ${!hasLabel ? 'opacity-80' : ''}
                `}>
                  {hasLabel ? marker.label : (index + 1)}
                </div>

                {/* Stem + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-0.5 h-3 ${isActive ? 'bg-sand-400' : 'bg-sand-600/70'}`} />
                  <div className={`w-2.5 h-2.5 rounded-full border-2 shadow
                    ${isActive
                      ? 'bg-sand-400 border-sand-300'
                      : 'bg-sand-700 border-sand-500 hover:bg-sand-500 hover:border-sand-400'}
                    transition-colors`}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active marker edit panel ─────────────────────────────────────────── */}
      {activeMarker && !readOnly && (
        <MarkerEditPanel
          marker={activeMarker}
          index={markers.findIndex((m) => m.id === activeId)}
          total={markers.length}
          onChange={(patch) => update(activeMarker.id, patch)}
          onDelete={() => remove(activeMarker.id)}
          onClose={() => setActiveId(null)}
        />
      )}

      {/* ── Marker list summary ──────────────────────────────────────────────── */}
      {markers.length > 0 && (
        <div className="space-y-1">
          {markers.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id === activeId ? null : m.id)}
              className={`
                w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-right text-xs transition-all
                ${activeId === m.id
                  ? 'border-sand-700/60 bg-sand-900/20 text-sand-300'
                  : 'border-ink-800 bg-ink-900/30 text-ink-400 hover:border-ink-700 hover:text-ink-300'}
              `}
            >
              <span className={`
                w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold shrink-0
                ${activeId === m.id ? 'border-sand-600 text-sand-400' : 'border-ink-700 text-ink-600'}
              `}>
                {i + 1}
              </span>
              <span className="flex-1 truncate">
                {m.label || <span className="text-ink-700 italic">بدون عنوان</span>}
              </span>
              {m.description && (
                <span className="text-ink-700 text-[10px] truncate max-w-[120px]">{m.description}</span>
              )}
              <span className="text-[10px] text-ink-800 font-mono shrink-0">
                ({(m.x * 100).toFixed(0)}%, {(m.y * 100).toFixed(0)}%)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MarkerEditPanel ──────────────────────────────────────────────────────────
// Inline panel that appears below the canvas when a marker is selected.
function MarkerEditPanel({ marker, index, total, onChange, onDelete, onClose }) {
  return (
    <div className="rounded-xl border border-sand-800/50 bg-sand-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-sand-800/40 bg-sand-900/10">
        <span className="w-5 h-5 rounded-full border border-sand-700 text-sand-400 text-[10px] font-bold flex items-center justify-center shrink-0">
          {index + 1}
        </span>
        <span className="text-xs text-sand-400 font-semibold">
          علامة {index + 1} من {total}
        </span>
        <span className="text-[10px] text-ink-700 font-mono mr-auto">
          ({(marker.x * 100).toFixed(1)}%, {(marker.y * 100).toFixed(1)}%)
        </span>
        <button
          onClick={onClose}
          className="text-ink-600 hover:text-ink-400 transition-colors text-xs w-5 h-5 flex items-center justify-center"
        >
          ✕
        </button>
      </div>

      {/* Fields */}
      <div className="p-3 space-y-2.5">
        <div>
          <label className="block text-[11px] text-ink-500 mb-1">التسمية — تظهر على الدبوس</label>
          <input
            autoFocus
            type="text"
            value={marker.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-800 hover:border-ink-700 transition-colors"
            placeholder="مثال: النواة، الغشاء الخلوي…"
          />
        </div>

        <div>
          <label className="block text-[11px] text-ink-500 mb-1">الشرح — يظهر عند النقر على الدبوس</label>
          <textarea
            value={marker.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-800 resize-none hover:border-ink-700 transition-colors"
            placeholder="وصف مختصر يوضح أهمية هذا الجزء…"
          />
        </div>

        {/* Nudge controls for fine-tuning position */}
        <div>
          <label className="block text-[11px] text-ink-500 mb-1.5">ضبط الموضع يدوياً (0 – 100%)</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-700 font-mono w-3">X</span>
                <input
                  type="number"
                  min="0" max="100" step="0.1"
                  value={parseFloat((marker.x * 100).toFixed(1))}
                  onChange={(e) => onChange({ x: Math.min(1, Math.max(0, parseFloat(e.target.value) / 100)) })}
                  className="w-full px-2 py-1.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-xs font-mono focus:ring-1 focus:ring-sand-600 focus:outline-none hover:border-ink-700 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-700 font-mono w-3">Y</span>
                <input
                  type="number"
                  min="0" max="100" step="0.1"
                  value={parseFloat((marker.y * 100).toFixed(1))}
                  onChange={(e) => onChange({ y: Math.min(1, Math.max(0, parseFloat(e.target.value) / 100)) })}
                  className="w-full px-2 py-1.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-xs font-mono focus:ring-1 focus:ring-sand-600 focus:outline-none hover:border-ink-700 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Delete */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg border border-transparent hover:border-red-900/40 transition-all font-arabic"
          >
            <span>✕</span> حذف هذه العلامة
          </button>
        </div>
      </div>
    </div>
  );
}
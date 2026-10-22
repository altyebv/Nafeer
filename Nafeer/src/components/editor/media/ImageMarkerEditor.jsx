'use client';
import { useState, useRef, useCallback } from 'react';
import { randomId, clampNorm } from '@/lib/markerUtils';
import { LOCATE_RADIUS } from '@/lib/markerQuestion';
import { MarkerPin } from '@/components/media/MarkerPin';
import { Plus, Sparkles, X } from 'lucide-react';

// ─── ImageMarkerEditor ────────────────────────────────────────────────────────
// Props:
//   imageUrl  — the image src to render the canvas on
//   markers   — array of marker objects (see shape below)
//   onChange  — called with the new markers array on every mutation
//   readOnly  — if true, shows pins but disables editing (future preview use)
//   mode      — what a pin is for, which decides its fields:
//                 explain    lesson images: label + explanation (default)
//                 reference  pins a question refers to: label only
//                 label      a question pin: its right answer (shown as a number)
//                 locate     the one target of a find-it question: name + radius
//   onImageSize({ width, height }) — the picture's natural size, once loaded
//
// Marker shape:
//   { id, x, y, label, description, ...anything else, kept as it is }
//   x, y are normalised 0–1 from the top-left of the image, and mark the
//   centre of the pin's dot (components/media/MarkerPin.jsx).
//
// A pin is one pointer gesture: a press that doesn't travel selects it (or
// deselects it), a press that travels drags it. Pointer capture keeps the drag
// on the pin even when the finger leaves it, and `touch-none` stops the page
// from scrolling under it.

const DRAG_SLOP = 4; // px a press may wander and still count as a tap

const MAX_PINS = { explain: Infinity, reference: Infinity, label: Infinity, locate: 1 };

export default function ImageMarkerEditor({ imageUrl, markers = [], onChange, readOnly = false, mode = 'explain', onImageSize }) {
  const atMax = markers.length >= (MAX_PINS[mode] ?? Infinity);
  const imgRef       = useRef(null);
  const gestureRef   = useRef(null);   // { id, startX, startY, moved }
  const markersRef   = useRef(markers);
  markersRef.current = markers;
  const [imgLoaded,     setImgLoaded]     = useState(false);
  const [imgError,      setImgError]      = useState(false);
  const [activeId,      setActiveId]      = useState(null);   // marker being edited in panel
  const [placingMode,   setPlacingMode]   = useState(false);  // click-to-place mode toggle
  const [draggingId,    setDraggingId]    = useState(null);

  // ── helpers ────────────────────────────────────────────────────────────────

  // Convert a pointer position to normalised (x, y) relative to the image
  const toNorm = useCallback((clientX, clientY) => {
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return null;
    return {
      x: clampNorm((clientX - rect.left) / rect.width),
      y: clampNorm((clientY - rect.top)  / rect.height),
    };
  }, []);

  // Always against the latest markers: a drag fires many updates in a row.
  const update  = (id, patch) => onChange(markersRef.current.map((m) => m.id === id ? { ...m, ...patch } : m));
  const remove  = (id)        => { onChange(markers.filter((m) => m.id !== id)); if (activeId === id) setActiveId(null); };

  // ── click to place ─────────────────────────────────────────────────────────
  // Click only: a tap already ends in a click, so listening to touchend too
  // could place two markers.
  const handleImageClick = (e) => {
    if (!placingMode || readOnly) return;
    const pos = toNorm(e.clientX, e.clientY);
    if (!pos) return;
    const newMarker = {
      id: randomId('mk'), x: pos.x, y: pos.y, label: '', description: '',
      ...(mode === 'label' ? { answer: '' } : {}),
      ...(mode === 'locate' ? { radius: LOCATE_RADIUS.default } : {}),
    };
    onChange([...markers, newMarker]);
    setActiveId(newMarker.id);
    setPlacingMode(false);
  };

  // ── tap to select, drag to reposition ──────────────────────────────────────
  const onPinPointerDown = (e, id) => {
    if (readOnly || e.button > 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gestureRef.current = { id, startX: e.clientX, startY: e.clientY, moved: false };
  };

  const onPinPointerMove = (e) => {
    const g = gestureRef.current;
    if (!g) return;
    if (!g.moved && Math.hypot(e.clientX - g.startX, e.clientY - g.startY) < DRAG_SLOP) return;
    if (!g.moved) { g.moved = true; setDraggingId(g.id); setActiveId(g.id); }
    const pos = toNorm(e.clientX, e.clientY);
    if (pos) update(g.id, pos);
  };

  const onPinPointerUp = (e) => {
    const g = gestureRef.current;
    gestureRef.current = null;
    if (!g) return;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    setDraggingId(null);
    if (!g.moved) setActiveId((cur) => (cur === g.id ? null : g.id));
  };

  const onPinKeyDown = (e, marker) => {
    if (readOnly) return;
    const step = e.shiftKey ? 0.05 : 0.005;
    const move = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (move) {
      e.preventDefault();
      update(marker.id, { x: clampNorm(marker.x + move[0]), y: clampNorm(marker.y + move[1]) });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setActiveId((cur) => (cur === marker.id ? null : marker.id));
    }
  };

  // ── active marker form ────────────────────────────────────────────────────
  const activeMarker = markers.find((m) => m.id === activeId);

  // ── render ────────────────────────────────────────────────────────────────
  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center py-10 border border-dashed border-ink-800 rounded-xl text-ink-500 text-sm font-arabic">
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
            type="button"
            disabled={atMax && !placingMode}
            title={atMax ? 'لهذا النوع علامة واحدة — اسحبها لتغيير موضعها' : undefined}
            onClick={() => setPlacingMode((p) => !p)}
            className={`disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              placingMode
                ? 'bg-sand-800/60 text-sand-300 border-sand-600 ring-1 ring-sand-600/40'
                : 'bg-ink-900 text-ink-400 border-ink-700 hover:border-ink-500 hover:text-ink-200'
            }`}
          >
            {placingMode ? <Sparkles size={14} strokeWidth={1.8} /> : <Plus size={14} strokeWidth={1.9} />}
            {placingMode ? 'انقر على الصورة لإضافة علامة' : 'إضافة علامة'}
          </button>

          <span className="text-xs text-ink-500">
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
          onLoad={(e) => {
            setImgLoaded(true);
            const { naturalWidth: width, naturalHeight: height } = e.currentTarget;
            if (width && height) onImageSize?.({ width, height });
          }}
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

        {/* ── The right area of a find-it target ──────────────────────────────
            A circle: its radius is a fraction of the WIDTH, so its height in
            % of the box comes from the same px — hence aspect-square. */}
        {imgLoaded && mode === 'locate' && markers.map((m) => (
          <span key={`ring-${m.id}`} aria-hidden="true"
            className="absolute rounded-full aspect-square border-2 border-dashed border-line-accent bg-accent-wash pointer-events-none -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%`, width: `${(m.radius ?? LOCATE_RADIUS.default) * 200}%` }} />
        ))}

        {/* ── Pins ─────────────────────────────────────────────────────────── */}
        {imgLoaded && markers.map((marker, index) => (
          <MarkerPin
            key={marker.id}
            marker={mode === 'label' ? { ...marker, label: '' } : marker}
            index={index}
            active={marker.id === activeId}
            dragging={marker.id === draggingId}
            title={marker.label?.trim() || `علامة ${index + 1}`}
            {...(readOnly ? {} : {
              onPointerDown:   (e) => onPinPointerDown(e, marker.id),
              onPointerMove:   onPinPointerMove,
              onPointerUp:     onPinPointerUp,
              onPointerCancel: onPinPointerUp,
              onKeyDown:       (e) => onPinKeyDown(e, marker),
              // The tap is handled on pointerup; this only keeps the click
              // from reaching the canvas and placing a marker.
              onClick:         (e) => e.stopPropagation(),
            })}
          />
        ))}
      </div>

      {/* ── Active marker edit panel ─────────────────────────────────────────── */}
      {activeMarker && !readOnly && (
        <MarkerEditPanel
          marker={activeMarker}
          mode={mode}
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
                {(mode === 'label' ? m.answer : m.label) || <span className="text-fg-subtle italic">{mode === 'label' ? 'بلا إجابة بعد' : 'بدون عنوان'}</span>}
              </span>
              {m.description && (
                <span className="text-ink-500 text-[10px] truncate max-w-[120px]">{m.description}</span>
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
const FIELD = 'w-full px-3 py-2 bg-sunken border border-line rounded-control text-fg t-ui focus:border-line-accent focus:outline-none placeholder:text-fg-subtle hover:border-line-strong transition-colors';

function MarkerEditPanel({ marker, mode, index, total, onChange, onDelete, onClose }) {
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
        <span className="text-[10px] text-ink-500 font-mono mr-auto">
          ({(marker.x * 100).toFixed(1)}%, {(marker.y * 100).toFixed(1)}%)
        </span>
        <button
          onClick={onClose}
          className="touch-target text-ink-600 hover:text-ink-400 transition-colors text-xs w-5 h-5 flex items-center justify-center"
        >
          <X size={15} strokeWidth={1.9} />
        </button>
      </div>

      {/* Fields */}
      <div className="p-3 space-y-2.5">
        {mode === 'label' ? (
          <div>
            <label className="block t-caption text-fg-subtle mb-1">الإجابة الصحيحة — يختارها الطالب من بنك الكلمات</label>
            <input autoFocus type="text" value={marker.answer || ''} onChange={(e) => onChange({ answer: e.target.value })}
              className={FIELD} placeholder="مثال: النواة" />
          </div>
        ) : (
          <div>
            <label className="block t-caption text-fg-subtle mb-1">
              {mode === 'locate' ? 'ما يبحث عنه الطالب — يظهر في السؤال' : 'التسمية — تظهر على الدبوس'}
            </label>
            <input autoFocus type="text" value={marker.label} onChange={(e) => onChange({ label: e.target.value })}
              className={FIELD} placeholder={mode === 'locate' ? 'مثال: نهر النيل' : 'مثال: النواة، الغشاء الخلوي…'} />
          </div>
        )}

        {mode === 'locate' && (
          <div>
            <label className="block t-caption text-fg-subtle mb-1">
              المنطقة المقبولة — {Math.round((marker.radius ?? LOCATE_RADIUS.default) * 100)}% من عرض الصورة
            </label>
            <input type="range" dir="ltr" min={LOCATE_RADIUS.min} max={LOCATE_RADIUS.max} step="0.005"
              value={marker.radius ?? LOCATE_RADIUS.default}
              onChange={(e) => onChange({ radius: Number(e.target.value) })}
              className="w-full accent-accent" aria-label="نصف قطر المنطقة المقبولة" />
          </div>
        )}

        {(mode === 'explain' || mode === 'label') && <div>
          <label className="block t-caption text-fg-subtle mb-1">{mode === 'label' ? 'ملاحظة بعد الإجابة (اختيارية)' : 'الشرح — يظهر عند النقر على الدبوس'}</label>
          <textarea
            value={marker.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 bg-ink-950 border border-ink-800 rounded-lg text-sand-100 text-sm focus:ring-1 focus:ring-sand-600 focus:outline-none font-arabic placeholder-ink-600 resize-none hover:border-ink-700 transition-colors"
            placeholder={mode === 'label' ? 'تظهر للطالب بعد أن يجيب' : 'وصف مختصر يوضح أهمية هذا الجزء…'}
          />
        </div>}

        {/* Nudge controls for fine-tuning position */}
        <div>
          <label className="block text-[11px] text-ink-500 mb-1.5">ضبط الموضع يدوياً (0 – 100%)</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-500 font-mono w-3">X</span>
                <input
                  type="number"
                  min="0" max="100" step="0.1"
                  value={parseFloat((marker.x * 100).toFixed(1))}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange({ x: clampNorm(v / 100) }); }}
                  className="w-full px-2 py-1.5 bg-ink-950 border border-ink-800 rounded-lg text-sand-200 text-xs font-mono focus:ring-1 focus:ring-sand-600 focus:outline-none hover:border-ink-700 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-500 font-mono w-3">Y</span>
                <input
                  type="number"
                  min="0" max="100" step="0.1"
                  value={parseFloat((marker.y * 100).toFixed(1))}
                  onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v)) onChange({ y: clampNorm(v / 100) }); }}
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
            <X size={13} strokeWidth={1.9} /> حذف هذه العلامة
          </button>
        </div>
      </div>
    </div>
  );
}

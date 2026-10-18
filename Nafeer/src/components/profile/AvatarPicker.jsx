'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { Button, Dialog, IconButton, cx } from '@/components/ui';

// ─── Avatar picker with a crop-and-adjust dialog ──────────────────────────────
// Pick a photo, then drag to place it, zoom and rotate inside a round frame.
// Everything happens on a canvas in the browser; what leaves is one 512×512
// square (WebP, JPEG where WebP encoding is missing) that the server's
// 'avatar' preset shrinks to 400×400. No library, no upload until the caller
// decides to send it.
//
//   <AvatarPicker name="…" value={previewUrl} onChange={(blob, url) => …} />

const VIEW = 280;        // crop frame in CSS px
const OUT = 512;         // exported square
const MAX_ZOOM = 3;
const ACCEPT = 'image/jpeg,image/png,image/webp';
const MAX_BYTES = 10 * 1024 * 1024; // before cropping; the crop itself is small

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('bad image')); };
    img.src = url;
  });
}

// Size of the image as drawn, for a rotation and zoom, covering the frame.
function drawnSize(img, rot, zoom) {
  const sideways = rot % 180 !== 0;
  const w = sideways ? img.naturalHeight : img.naturalWidth;
  const h = sideways ? img.naturalWidth : img.naturalHeight;
  const cover = VIEW / Math.min(w, h);
  return { w: w * cover * zoom, h: h * cover * zoom, scale: cover * zoom };
}

function clampOffset(img, rot, zoom, { x, y }) {
  const { w, h } = drawnSize(img, rot, zoom);
  const mx = Math.max(0, (w - VIEW) / 2);
  const my = Math.max(0, (h - VIEW) / 2);
  return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
}

// Draw the crop at `size` px. The frame is VIEW px, so everything scales by size/VIEW.
function paint(ctx, img, { rot, zoom, offset }, size) {
  const k = size / VIEW;
  const { scale } = drawnSize(img, rot, zoom);
  ctx.save();
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2 + offset.x * k, size / 2 + offset.y * k);
  ctx.rotate((rot * Math.PI) / 180);
  ctx.scale(scale * k, scale * k);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  ctx.restore();
}

function exportBlob(img, state) {
  const canvas = document.createElement('canvas');
  canvas.width = OUT;
  canvas.height = OUT;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  paint(ctx, img, state, OUT);
  return new Promise((resolve) => {
    canvas.toBlob((b) => {
      if (b && b.type === 'image/webp') return resolve(b);
      canvas.toBlob(resolve, 'image/jpeg', 0.9); // Safari can't encode WebP
    }, 'image/webp', 0.9);
  });
}

// ─── The crop dialog ──────────────────────────────────────────────────────────
function CropDialog({ source, onCancel, onDone }) {
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const [state, setState] = useState({ rot: 0, zoom: 1, offset: { x: 0, y: 0 } });
  const [saving, setSaving] = useState(false);
  const img = source?.img;

  // Repaint the frame (device-pixel sharp) and dim everything outside the circle.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = VIEW * dpr;
    canvas.height = VIEW * dpr;
    const ctx = canvas.getContext('2d');
    paint(ctx, img, state, VIEW * dpr);
    ctx.save();
    ctx.fillStyle = 'black';
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.restore();
  }, [img, state]);

  const update = useCallback((patch) => {
    setState((s) => {
      const next = { ...s, ...patch };
      return { ...next, offset: clampOffset(img, next.rot, next.zoom, next.offset) };
    });
  }, [img]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: state.offset };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const { x, y, start } = drag.current;
    // The canvas is CSS-sized to VIEW, so pointer px are frame px.
    update({ offset: { x: start.x + e.clientX - x, y: start.y + e.clientY - y } });
  };
  const onPointerUp = () => { drag.current = null; };
  const onWheel = (e) => update({ zoom: Math.min(MAX_ZOOM, Math.max(1, state.zoom - e.deltaY * 0.0015)) });
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 20 : 6;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      update({ offset: { x: state.offset.x + moves[e.key][0], y: state.offset.y + moves[e.key][1] } });
    } else if (e.key === '+' || e.key === '=') update({ zoom: Math.min(MAX_ZOOM, state.zoom + 0.1) });
    else if (e.key === '-') update({ zoom: Math.max(1, state.zoom - 0.1) });
  };

  const save = async () => {
    setSaving(true);
    const blob = await exportBlob(img, state);
    setSaving(false);
    if (blob) onDone(blob);
  };

  return (
    <Dialog open={!!source} onClose={onCancel} title="ضبط الصورة" size="sm"
      description="اسحب الصورة لتضعها في الدائرة، وكبّرها أو أدرها حتى تعجبك."
      footer={(
        <div className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>إلغاء</Button>
          <Button variant="primary" onClick={save} loading={saving}>استخدم الصورة</Button>
        </div>
      )}>
      <div className="flex flex-col items-center gap-4 pb-2">
        <canvas
          ref={canvasRef}
          tabIndex={0}
          role="img"
          aria-label="معاينة القص — استخدم الأسهم للتحريك و + أو - للتكبير"
          className="w-[280px] h-[280px] max-w-full rounded-card bg-sunken border border-line cursor-grab active:cursor-grabbing touch-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onKeyDown={onKeyDown}
        />

        <div className="w-full max-w-[280px] flex items-center gap-2">
          <IconButton icon={ZoomOut} label="تصغير" size="sm" onClick={() => update({ zoom: Math.max(1, state.zoom - 0.2) })} />
          <input type="range" min={1} max={MAX_ZOOM} step={0.01} value={state.zoom} aria-label="التكبير"
            onChange={(e) => update({ zoom: Number(e.target.value) })}
            className="flex-1 accent-accent h-11 cursor-pointer" />
          <IconButton icon={ZoomIn} label="تكبير" size="sm" onClick={() => update({ zoom: Math.min(MAX_ZOOM, state.zoom + 0.2) })} />
          <IconButton icon={RotateCw} label="تدوير" size="sm" onClick={() => update({ rot: (state.rot + 90) % 360 })} />
        </div>
        <button type="button" className="t-caption text-fg-subtle hover:text-fg underline-offset-2 hover:underline"
          onClick={() => setState({ rot: 0, zoom: 1, offset: { x: 0, y: 0 } })}>
          إعادة الضبط
        </button>
      </div>
    </Dialog>
  );
}

// ─── The picker ───────────────────────────────────────────────────────────────
export function AvatarPicker({ name, value, onChange, className }) {
  const inputRef = useRef(null);
  const [source, setSource] = useState(null);   // { img, url } while the dialog is open
  const [original, setOriginal] = useState(null); // the picked file, to adjust again
  const [error, setError] = useState('');

  useEffect(() => () => { if (source?.url) URL.revokeObjectURL(source.url); }, [source]);

  const open = async (file) => {
    setError('');
    if (!file) return;
    if (!ACCEPT.split(',').includes(file.type)) { setError('الصيغ المقبولة: JPEG أو PNG أو WebP.'); return; }
    if (file.size > MAX_BYTES) { setError('الصورة أكبر من 10 ميغابايت.'); return; }
    try {
      setSource(await loadImage(file));
      setOriginal(file);
    } catch {
      setError('تعذّر قراءة هذه الصورة — جرّب صورة أخرى.');
    }
  };

  const initials = (name || 'م').split(' ').slice(0, 2).map((w) => w[0]).join('');

  return (
    <div className={cx('flex items-center gap-4', className)}>
      <button type="button" onClick={() => (original ? open(original) : inputRef.current?.click())}
        aria-label={value ? 'عدّل الصورة' : 'اختر صورة'}
        className="relative group w-20 h-20 shrink-0 rounded-full overflow-hidden border-2 border-line-accent bg-accent text-fg-on-accent flex items-center justify-center t-h2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
        {value
          // eslint-disable-next-line @next/next/no-img-element -- a local blob: preview
          ? <img src={value} alt="" className="w-full h-full object-cover" />
          : <span aria-hidden="true">{initials}</span>}
        <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-7 flex items-center justify-center bg-scrim text-fg-strong opacity-90 group-hover:opacity-100">
          <Camera size={14} strokeWidth={1.75} />
        </span>
      </button>

      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="secondary" icon={Camera} onClick={() => inputRef.current?.click()}>
            {value ? 'صورة أخرى' : 'اختر صورة'}
          </Button>
          {value && original && <Button size="sm" variant="ghost" onClick={() => open(original)}>اضبطها</Button>}
          {value && <Button size="sm" variant="ghost" onClick={() => { setOriginal(null); onChange(null, null); }}>إزالة</Button>}
        </div>
        <span className="t-caption text-fg-subtle">اختيارية — تظهر على ملفك وبجانب كل درس تكتبه.</span>
        {error && <span role="alert" className="t-caption text-danger">{error}</span>}
      </div>

      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden"
        onChange={(e) => { open(e.target.files?.[0]); e.target.value = ''; }} />

      <CropDialog
        source={source}
        onCancel={() => setSource(null)}
        onDone={(blob) => {
          if (value?.startsWith('blob:')) URL.revokeObjectURL(value);
          onChange(blob, URL.createObjectURL(blob));
          setSource(null);
        }}
      />
    </div>
  );
}

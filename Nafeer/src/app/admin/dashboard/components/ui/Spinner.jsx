export function Spinner({ label = 'جارٍ التحميل…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-ink-500" role="status">
      <span className="inline-block w-5 h-5 border-2 border-ink-700 border-t-sand-400 rounded-full animate-spin" />
      <span className="font-arabic text-sm">{label}</span>
    </div>
  );
}

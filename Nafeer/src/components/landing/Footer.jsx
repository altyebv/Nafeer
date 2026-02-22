export default function Footer() {
  return (
    <footer className="py-16 px-6 border-t border-ink-800/60">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl font-arabic font-bold text-sand-400">نفير</span>
              <span className="text-ink-600">×</span>
              <span className="text-xl font-arabic font-bold text-sand-600">بشير</span>
            </div>
            <p className="text-ink-600 text-xs">
              مدعوم بنفير — built with purpose
            </p>
          </div>

          <div className="text-center">
            <p className="text-ink-600 text-sm leading-loose">
              مشروع مفتوح للمساهمة — نبحث عن متخصصين في كل المواد
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs text-ink-700 font-mono">
            <span className="text-sand-600">🇸🇩</span>
            <span>made in sudan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

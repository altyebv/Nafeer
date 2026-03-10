export default function Footer() {
  return (
    <footer className="py-12 sm:py-16 px-4 sm:px-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg sm:text-xl font-arabic font-bold" style={{ color: 'var(--accent)' }}>نفير</span>
              <span style={{ color: 'var(--border-mid)' }}>×</span>
              <span className="text-lg sm:text-xl font-arabic font-bold" style={{ color: 'var(--text-muted)' }}>بشير</span>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              مدعوم بنفير — built with purpose
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm leading-loose" style={{ color: 'var(--text-muted)' }}>
              مشروع مفتوح للمساهمة — نبحث عن متخصصين في كل المواد
            </p>
          </div>

          <div className="flex items-center gap-1 text-xs font-mono" style={{ color: 'var(--border-mid)' }}>
            <span>🇸🇩</span>
            <span>made in sudan</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

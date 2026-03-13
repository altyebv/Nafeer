export default function Footer() {
  return (
    <footer
      className="py-14 sm:py-20 px-4 sm:px-6 relative"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span
                className="text-xl font-arabic font-bold"
                style={{ color: 'var(--accent)' }}
              >نفير</span>
              <span style={{ color: 'var(--border-mid)' }}>×</span>
              <span
                className="text-xl font-arabic font-bold"
                style={{ color: 'var(--text-muted)' }}
              >بشير</span>
            </div>
            <p
              className="text-xs leading-loose max-w-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              نبني معاً ما يستحقه الطالب السوداني —
              <br />
              محتوى جيد، أداة رائعة، وأثر يمتد.
            </p>
          </div>

          {/* Center divider + tagline */}
          <div className="hidden md:flex flex-col items-center gap-3 mx-auto">
            <div className="ember-line w-12 opacity-40" />
            <p
              className="text-xs font-mono text-center leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              مشروع مفتوح للمساهمة
              <br />
              <span style={{ color: 'var(--border-mid)' }}>open for contribution</span>
            </p>
            <div className="ember-line w-12 opacity-40" />
          </div>

          {/* Made in Sudan */}
          <div className="flex items-center gap-2 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            <span className="text-base">🇸🇩</span>
            <span>made in sudan</span>
          </div>

        </div>
      </div>
    </footer>
  );
}
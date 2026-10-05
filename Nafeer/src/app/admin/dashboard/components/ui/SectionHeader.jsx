// Sticky page header for a dashboard section. `actions` sits beside the title
// (primary buttons); `children` goes underneath (stat chips, filters, tabs).
export function SectionHeader({ title, description, actions, children }) {
  return (
    <div className="sticky top-14 lg:top-0 z-10 bg-ink-950/95 backdrop-blur-sm border-b border-ink-800/60 px-4 sm:px-6 lg:px-8 pt-5 lg:pt-7 pb-4 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold text-sand-300 font-arabic">{title}</h1>
          {description && <p className="text-sm text-ink-500 font-arabic mt-1 leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

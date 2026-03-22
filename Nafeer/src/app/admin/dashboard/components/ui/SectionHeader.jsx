export function SectionHeader({ title, description, children }) {
  return (
    <div className="sticky top-0 z-10 bg-ink-950/95 backdrop-blur-sm border-b border-ink-800/60 px-8 pt-8 pb-5 mb-6">
      <h1 className="text-xl font-bold text-sand-300 font-arabic">{title}</h1>
      {description && <p className="text-sm text-ink-600 font-arabic mt-0.5">{description}</p>}
      {children}
    </div>
  );
}
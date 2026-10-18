import { MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-14 sm:py-20 px-4 sm:px-6 lg:px-8 bg-page border-t border-line">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-12">

        {/* Brand */}
        <div>
          <p className="flex items-center gap-3 mb-3 t-h2">
            <span className="text-fg-accent">نفير</span>
            <span aria-hidden="true" className="text-fg-subtle font-normal">×</span>
            <span className="text-fg-muted">بشير</span>
          </p>
          <p className="t-label font-normal leading-loose max-w-xs text-fg-muted">
            نبني معاً ما يستحقه الطالب السوداني —
            <br />
            محتوى جيد، أداة رائعة، وأثر يمتد.
          </p>
        </div>

        {/* Center divider + tagline */}
        <div className="hidden md:flex flex-col items-center gap-3 mx-auto">
          <div aria-hidden="true" className="ember-line w-12 opacity-40" />
          <p className="t-caption text-center leading-relaxed text-fg-muted">
            مشروع مفتوح للمساهمة
            <br />
            <span dir="ltr" className="text-fg-subtle">open for contribution</span>
          </p>
          <div aria-hidden="true" className="ember-line w-12 opacity-40" />
        </div>

        {/* Made in Sudan */}
        <p dir="ltr" className="flex items-center gap-2 t-caption text-fg-muted">
          <MapPin size={17} strokeWidth={1.9} className="text-fg-accent" aria-hidden="true" />
          <span>made in sudan</span>
        </p>
      </div>
    </footer>
  );
}

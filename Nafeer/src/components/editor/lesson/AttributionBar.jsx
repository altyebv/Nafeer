'use client';

// ─── AttributionBar ───────────────────────────────────────────────────────────
// Displays who created, last edited, and reviewed a lesson.
// `attribution` shape:
//   { createdBy: {name, avatarUrl} | null,
//     updatedBy: {name, avatarUrl} | null,
//     reviewedBy: {name, avatarUrl} | null }
// `lesson` must have: createdAt, updatedAt, reviewedAt, version
//
// Rendered as a compact single-line bar inside the lesson editor header area.

function relativeTime(dateStr) {
  if (!dateStr) return null;
  const d    = new Date(dateStr);
  const now  = new Date();
  const diff = Math.floor((now - d) / 1000); // seconds

  if (diff < 60)       return 'الآن';
  if (diff < 3600)     return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400)    return `منذ ${Math.floor(diff / 3600)} س`;
  if (diff < 2592000)  return `منذ ${Math.floor(diff / 86400)} يوم`;
  return d.toLocaleDateString('ar-SD', { day: 'numeric', month: 'short' });
}

function Avatar({ name, avatarUrl, size = 18 }) {
  const initials = name
    ? name.trim().split(' ').map((w) => w[0]).slice(0, 2).join('')
    : '؟';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 ring-1 ring-ink-700"
      />
    );
  }

  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      className="rounded-full bg-ink-700 text-ink-300 flex items-center justify-center shrink-0 font-arabic ring-1 ring-ink-600 leading-none"
    >
      {initials}
    </span>
  );
}

function AttributionChip({ label, person, dateStr, accent }) {
  if (!person && !dateStr) return null;

  const accentClasses = {
    create: 'text-ink-500',
    edit:   'text-ink-500',
    review: 'text-emerald-600',
  };

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className={`text-[10px] font-arabic ${accentClasses[accent] ?? 'text-ink-600'}`}>
        {label}
      </span>
      {person && <Avatar name={person.name} avatarUrl={person.avatarUrl} size={16} />}
      {person && (
        <span className="text-[11px] text-ink-400 font-arabic">{person.name}</span>
      )}
      {dateStr && (
        <span className="text-[10px] text-ink-700 font-mono">{relativeTime(dateStr)}</span>
      )}
    </div>
  );
}

export default function AttributionBar({ lesson, attribution }) {
  if (!lesson) return null;

  const { createdBy, updatedBy, reviewedBy } = attribution || {};

  // Only show updatedBy chip if it's a different person from createdBy
  const showUpdated =
    updatedBy &&
    lesson.version > 1 &&
    updatedBy.name !== createdBy?.name;

  return (
    <div className="flex items-center gap-3 px-5 py-1.5 border-t border-ink-800/40 bg-ink-900/20 overflow-x-auto scrollbar-none">

      <AttributionChip
        label="أنشأه"
        person={createdBy}
        dateStr={lesson.createdAt}
        accent="create"
      />

      {showUpdated && (
        <>
          <span className="text-ink-800 text-[10px] shrink-0">·</span>
          <AttributionChip
            label="عدّله"
            person={updatedBy}
            dateStr={lesson.updatedAt}
            accent="edit"
          />
        </>
      )}

      {reviewedBy && (
        <>
          <span className="text-ink-800 text-[10px] shrink-0">·</span>
          <AttributionChip
            label="راجعه"
            person={reviewedBy}
            dateStr={lesson.reviewedAt}
            accent="review"
          />
        </>
      )}

      {/* Version pill — far end */}
      <div className="mr-auto shrink-0">
        <span className="text-[10px] font-mono text-ink-700 bg-ink-800/40 px-1.5 py-0.5 rounded">
          v{lesson.version ?? 1}
        </span>
      </div>
    </div>
  );
}

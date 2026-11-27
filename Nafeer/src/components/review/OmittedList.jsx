// What a release leaves out (lib/omissions.js), on the lead's release page and
// beside the owner's publish button.
export function OmittedList({ items }) {
  if (!items?.length) return null;
  return (
    <div role="note" className="flex flex-col gap-1.5 p-3 rounded-card bg-warn-surface border border-warn-border">
      <p className="t-label font-semibold text-warn">يُترك من هذا الإصدار ({items.length}) — اعتمد الناقص ثم انشر من جديد</p>
      <ul className="flex flex-col gap-1 max-h-48 overflow-y-auto">
        {items.map((o, i) => (
          <li key={i} className="t-caption text-fg">
            <span className="font-semibold">{o.what}</span>
            <span className="text-fg-muted"> · {o.reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

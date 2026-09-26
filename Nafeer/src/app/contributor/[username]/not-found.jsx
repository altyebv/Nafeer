// Rendered by notFound() in page.jsx — and, unlike the old client-side "not
// found" state, this one comes with an actual HTTP 404. Previously every
// /contributor/<anything> returned 200, which handed crawlers an unbounded
// space of soft-404 URLs to index.
export default function ContributorNotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
      background: '#080704', color: 'rgba(255,255,255,0.3)',
      fontFamily: 'monospace',
    }}>
      <span style={{ fontSize: 40, opacity: 0.2 }}>◈</span>
      <p style={{ fontSize: 14 }}>لم يُعثر على هذا المساهم</p>
      <p style={{ fontSize: 11, opacity: 0.5 }}>contributor not found</p>
    </div>
  );
}

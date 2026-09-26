// ── JSON-LD emitter ───────────────────────────────────────────────────────────
//
// Server component. Every `<` in the payload is rewritten to its JSON unicode
// escape, because a string inside the data (a contributor's bio, a name) could
// otherwise carry `</script>` and close the block early, turning the rest of
// the payload into live markup. `<` is valid JSON, so parsers still read
// it back as `<`.

export default function JsonLd({ data }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  );
}

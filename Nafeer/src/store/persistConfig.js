/**
 * PERSIST CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared localStorage options for the five persisted domain stores.
 *
 * They previously persisted with nothing but a name — no version, no migrate.
 * That meant any change to a store's shape would silently rehydrate stale data
 * into new code: a renamed field reads as undefined, a restructured array
 * throws somewhere far from the cause, and the contributor has no way to
 * recover short of clearing site data by hand.
 *
 * What makes this safe to discard rather than transform: these stores are a
 * cache, not the source of truth. EditorChrome calls bootstrapSubject() on
 * mount and refills everything from Atlas, so dropping local state on a
 * version bump costs one fetch, not a contributor's work. Unsaved edits live
 * in the same cache, which is exactly why a *silent* mismatch is worse than an
 * explicit reset.
 *
 * Bump SCHEMA_VERSION whenever a persisted shape changes.
 */

export const SCHEMA_VERSION = 1;

export function persistConfig(name, emptyState) {
  return {
    name,
    version: SCHEMA_VERSION,
    // Called only when the stored version differs from SCHEMA_VERSION.
    // Returning the empty shape resets the cached slice; Atlas refills it.
    migrate: (persistedState, fromVersion) => {
      if (process.env.NODE_ENV === 'development') {
        console.info(`[persist] ${name}: dropping v${fromVersion} cache (schema is v${SCHEMA_VERSION})`);
      }
      return { ...persistedState, ...emptyState };
    },
  };
}

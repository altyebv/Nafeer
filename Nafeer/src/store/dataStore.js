/**
 * STORE FACADE — @/store/dataStore
 * ─────────────────────────────────────────────────────────────────────────────
 * Re-exports the composite useDataStore hook from the domain-store index.
 * All editor components import from here. Keeping this shim means zero
 * component changes when the underlying store architecture evolves.
 *
 * Domain stores (each with their own localStorage persist key):
 *   useSubjectStore  → 'basheer-subject'
 *   useContentStore  → 'basheer-content'
 *   useConceptStore  → 'basheer-concepts'
 *   useFeedStore     → 'basheer-feed'
 *   useQuizStore     → 'basheer-quiz'
 *
 * NOTE: The old monolith (persist key 'basheer-data') has been removed.
 * On first load after this change, Atlas bootstrapSubject() will reload
 * everything from MongoDB, so no data is lost.
 */

export { useDataStore } from './index';
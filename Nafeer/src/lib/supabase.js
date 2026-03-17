import { createClient } from '@supabase/supabase-js';

// Supabase server client
// Uses the SERVICE ROLE KEY — server-side only, never import in client components.
//
// env vars:
//   NEXT_PUBLIC_SUPABASE_URL      — project URL (safe to expose)
//   SUPABASE_SERVICE_ROLE_KEY     — secret key (never prefix with NEXT_PUBLIC_)
//   SUPABASE_MEDIA_BUCKET         — bucket name (default: 'basheer-media')

export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'basheer-media';

// ─── Lazy client ──────────────────────────────────────────────────────────────
// Client is created on first call, not at module init.
// This prevents the ReferenceError that occurs when Next.js serverless bundling
// splits the module and the module-level variable falls out of scope.

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      '[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
    );
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// ─── uploadMedia ──────────────────────────────────────────────────────────────
export async function uploadMedia(path, buffer, mimeType) {
  const { error } = await getClient()
    .storage
    .from(MEDIA_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return getPublicUrl(path);
}

// ─── deleteMedia ──────────────────────────────────────────────────────────────
export async function deleteMedia(path) {
  const { error } = await getClient()
    .storage
    .from(MEDIA_BUCKET)
    .remove([path]);

  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

// ─── getPublicUrl ─────────────────────────────────────────────────────────────
export function getPublicUrl(path) {
  const { data } = getClient().storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}
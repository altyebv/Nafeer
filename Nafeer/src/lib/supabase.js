import { createClient } from '@supabase/supabase-js';

// Supabase server client
// Uses the SERVICE ROLE KEY — server-side only, never import in client components.
//
// env vars:
//   NEXT_PUBLIC_SUPABASE_URL      — project URL (safe to expose)
//   SUPABASE_SERVICE_ROLE_KEY     — secret key (never prefix with NEXT_PUBLIC_)
//   SUPABASE_MEDIA_BUCKET         — bucket name (default: 'basheer-media')

export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'basheer-media';

// ─── Lazy client getter ───────────────────────────────────────────────────────
// Creates the client on first call rather than at module init time.
// This avoids the ReferenceError that occurs when the Next.js serverless bundler
// splits the module and loses the closure reference to the module-level variable.
// Env vars are always read at call time, which is safe in serverless environments.

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase client not initialised — NEXT_PUBLIC_SUPABASE_URL or ' +
      'SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.'
    );
  }

  _client = createClient(url, key, {
    auth: { persistSession: false },
  });

  return _client;
}

// ─── uploadMedia ──────────────────────────────────────────────────────────────
/**
 * Upload a file buffer to the media bucket.
 * @param {string}          path     — storage path e.g. "arabic-lang/abc123.jpg"
 * @param {Buffer|Uint8Array} buffer
 * @param {string}          mimeType — e.g. "image/jpeg"
 * @returns {Promise<string>} public CDN URL
 */
export async function uploadMedia(path, buffer, mimeType) {
  const client = getClient();

  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return getPublicUrl(path);
}

// ─── deleteMedia ──────────────────────────────────────────────────────────────
/**
 * Delete a file from the media bucket.
 * @param {string} path — storage path
 */
export async function deleteMedia(path) {
  const client = getClient();

  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .remove([path]);

  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

// ─── getPublicUrl ─────────────────────────────────────────────────────────────
/**
 * Construct the public CDN URL for a given storage path.
 * Supabase public URL format:
 *   {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}
 */
export function getPublicUrl(path) {
  const client = getClient();
  const { data } = client.storage.from(MEDIA_BUCKET).getPublicUrl(path);
  return data?.publicUrl || null;
}

// ─── supabaseAdmin ────────────────────────────────────────────────────────────
// Named export for the debug endpoint and any future direct usage.
// Prefer the helper functions above for all media operations.
export const supabaseAdmin = { get: getClient };
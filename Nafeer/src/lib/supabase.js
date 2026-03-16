import { createClient } from '@supabase/supabase-js';

// Supabase server client 
// Uses the SERVICE ROLE KEY 
// Only import this file inside /api/* routes (server-side only).
//
// env vars:
//   NEXT_PUBLIC_SUPABASE_URL      — project URL (safe to expose)
//   SUPABASE_SERVICE_ROLE_KEY     — secret key (server only, never prefix NEXT_PUBLIC_)
//   SUPABASE_MEDIA_BUCKET         — bucket name (default: 'nafeer-media')

const supabaseUrl         = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'nafeer-media';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
    'Media upload/delete will not work until these are set in .env.local'
  );
}

// Singleton pattern — reuse across hot-reloads in dev
const globalForSupabase = global;
if (!globalForSupabase._supabaseAdmin) {
  globalForSupabase._supabaseAdmin = supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;
}

export const supabaseAdmin = globalForSupabase._supabaseAdmin;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to the media bucket.
 * @param {string} path       — storage path, e.g. "arabic-lang/abc123.jpg"
 * @param {Buffer|Uint8Array} buffer
 * @param {string} mimeType   — e.g. "image/jpeg"
 * @returns {Promise<string>} public URL
 */
export async function uploadMedia(path, buffer, mimeType) {
  if (!supabaseAdmin) throw new Error('Supabase client not initialised — check env vars');

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  return getPublicUrl(path);
}

/**
 * Delete a file from the media bucket.
 * @param {string} path — storage path
 */
export async function deleteMedia(path) {
  if (!supabaseAdmin) throw new Error('Supabase client not initialised — check env vars');

  const { error } = await supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .remove([path]);

  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
}

/**
 * Construct the public CDN URL for a given storage path.
 * Supabase public URL format:
 *   {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}
 */
export function getPublicUrl(path) {
  if (!supabaseAdmin) return null;
  const { data } = supabaseAdmin.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(path);
  return data?.publicUrl || null;
}
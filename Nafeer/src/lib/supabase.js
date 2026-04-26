import { createClient } from '@supabase/supabase-js';

// ─── Buckets ──────────────────────────────────────────────────────────────────
// MEDIA_BUCKET  — educational content (images, GIFs) scoped by subject
// USERS_BUCKET  — user-generated content (avatars, future: banners, etc.)
//
// env vars:
//   NEXT_PUBLIC_SUPABASE_URL      — project URL (safe to expose)
//   SUPABASE_SERVICE_ROLE_KEY     — secret key (never prefix with NEXT_PUBLIC_)
//   SUPABASE_MEDIA_BUCKET         — default: 'basheer-media'
//   SUPABASE_USERS_BUCKET         — default: 'nafeer-users'

export const MEDIA_BUCKET = process.env.SUPABASE_MEDIA_BUCKET || 'basheer-media';
export const USERS_BUCKET = process.env.SUPABASE_USERS_BUCKET || 'nafeer-users';

// ─── Lazy client ──────────────────────────────────────────────────────────────

let _client = null;

function getClient() {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  _client = createClient(url, key, { auth: { persistSession: false } });
  return _client;
}

// ─── uploadFile ───────────────────────────────────────────────────────────────
// Core upload — accepts an explicit bucket name.

export async function uploadFile(bucket, path, buffer, mimeType) {
  const { error } = await getClient()
    .storage
    .from(bucket)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Supabase upload failed (${bucket}): ${error.message}`);

  return getPublicUrl(bucket, path);
}

// ─── uploadMedia ──────────────────────────────────────────────────────────────
// Educational media → MEDIA_BUCKET.

export async function uploadMedia(path, buffer, mimeType) {
  return uploadFile(MEDIA_BUCKET, path, buffer, mimeType);
}

// ─── uploadUserFile ───────────────────────────────────────────────────────────
// User-generated content (avatars etc.) → USERS_BUCKET.
// Supports upsert: true so re-uploads replace existing avatars cleanly.

export async function uploadUserFile(path, buffer, mimeType) {
  const { error } = await getClient()
    .storage
    .from(USERS_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw new Error(`Supabase upload failed (${USERS_BUCKET}): ${error.message}`);

  return getPublicUrl(USERS_BUCKET, path);
}

// ─── deleteFile ───────────────────────────────────────────────────────────────
// Deletes a file from the given bucket.

export async function deleteFile(bucket, path) {
  const { error } = await getClient()
    .storage
    .from(bucket)
    .remove([path]);

  if (error) throw new Error(`Supabase delete failed (${bucket}): ${error.message}`);
}

// ─── deleteMedia ──────────────────────────────────────────────────────────────
// Convenience wrapper for MEDIA_BUCKET deletes (keeps existing callers happy).

export async function deleteMedia(path) {
  return deleteFile(MEDIA_BUCKET, path);
}

// ─── listFiles ────────────────────────────────────────────────────────────────
// Lists files in a bucket folder. Returns array of { name, id } objects.
// Folders have no `id` field; files do.

export async function listFiles(bucket, folder, { limit = 1000 } = {}) {
  const { data, error } = await getClient()
    .storage
    .from(bucket)
    .list(folder, { limit });

  if (error) throw new Error(`Supabase list failed (${bucket}/${folder}): ${error.message}`);
  return data || [];
}

// ─── deleteFiles ──────────────────────────────────────────────────────────────
// Bulk-delete an array of paths from a bucket. Silently returns 0 on empty input.

export async function deleteFiles(bucket, paths) {
  if (!paths?.length) return 0;
  const { error } = await getClient()
    .storage
    .from(bucket)
    .remove(paths);

  if (error) throw new Error(`Supabase bulk delete failed (${bucket}): ${error.message}`);
  return paths.length;
}

// ─── getPublicUrl ─────────────────────────────────────────────────────────────

export function getPublicUrl(bucket, path) {
  const { data } = getClient().storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl || null;
}
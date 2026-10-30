import mongoose from 'mongoose';

// ─── Which database ───────────────────────────────────────────────────────────
// MONGODB_DB names the database on the cluster, overriding the one in the URI.
// Local development sets it to `nafeer_dev` in .env.development.local — a file
// Next.js reads only for `next dev` — so the dev server never touches the live
// data. Production leaves it unset and uses the URI's database, as before.
export const DB_NAME = process.env.MONGODB_DB || null;

/** Whether this process is on a development database (`…_dev`). */
export const isDevDatabase = () => !!DB_NAME && DB_NAME.endsWith('_dev');

if (process.env.NODE_ENV === 'development' && !isDevDatabase() && !global.__nafeerDbWarned) {
  global.__nafeerDbWarned = true;
  console.warn('\n⚠️  next dev is using the LIVE database. Set MONGODB_DB=nafeer_dev in .env.development.local (docs/dev-database.md).\n');
}

// Cache connection across hot reloads in dev
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      throw new Error('MONGODB_URI environment variable is not set. Add it to .env.local');
    }

    cached.promise = mongoose.connect(mongodbUri, {
      bufferCommands: false,
      ...(DB_NAME && { dbName: DB_NAME }),
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

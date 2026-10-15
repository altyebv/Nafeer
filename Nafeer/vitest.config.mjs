import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // db.js throws at import without it; tests mock connectDB and never connect.
    env: { MONGODB_URI: 'mongodb://test.invalid/nafeer' },
  },
});

// Vercel refuses a request over 4.5MB before it reaches the app, so a larger
// cap only produced an unreadable error. Shared by the upload route and screens.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const UPLOAD_LIMIT_LABEL = '4 ميغابايت';

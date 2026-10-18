// ─── applicationLinks.js ──────────────────────────────────────────────────────
// The links an applicant receives, in one place. All three are random tokens
// stored on the Contributor (select:false) — the link is the credential.
//
//   status      /join/status?token=…   lives until the application ends; shows
//                                       where it stands and the next link
//   interview   /interview?token=…     issued at submit, 14 days
//   onboarding  /onboard?token=…       issued on approval, 7 days

import { randomBytes } from 'crypto';
import { appUrl } from '@/lib/appUrl';

const DAY_MS = 86_400_000;
export const INTERVIEW_DAYS = 14;

export const newToken = () => randomBytes(32).toString('hex');

export const statusLink     = (token) => appUrl(`/join/status?token=${token}`);
export const interviewLink  = (token) => appUrl(`/interview?token=${token}`);
export const onboardingLink = (token) => appUrl(`/onboard?token=${token}`);

/** Give a contributor a fresh interview token; returns it. Caller saves. */
export function issueInterview(contributor) {
  const token = newToken();
  contributor.interviewToken = token;
  contributor.interviewExpiresAt = new Date(Date.now() + INTERVIEW_DAYS * DAY_MS);
  return token;
}

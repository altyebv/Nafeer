// ─── Email Template Registry ──────────────────────────────────────────────────
// Each template is a pure function: (data) => { subject, html }
// Add new templates here — the service layer picks them up automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { magicLinkTemplate }       from './magic_link';
import { onboardingInviteTemplate } from './onboarding_invite';
import { betaInviteTemplate }       from './beta_invite';
import { customMessageTemplate }    from './custom_message';

/** @type {Record<string, (data: Record<string, any>) => { subject: string; html: string }>} */
export const TEMPLATES = {
  magic_link:        magicLinkTemplate,
  onboarding_invite: onboardingInviteTemplate,
  beta_invite:       betaInviteTemplate,
  custom_message:    customMessageTemplate,
};

/** All valid template keys — used for validation and UI dropdowns. */
export const TEMPLATE_KEYS = Object.keys(TEMPLATES);

/**
 * Render a template by key.
 * @param {string} template
 * @param {Record<string, any>} data
 * @returns {{ subject: string; html: string }}
 */
export function renderTemplate(template, data) {
  const fn = TEMPLATES[template];
  if (!fn) throw new Error(`Unknown email template: "${template}"`);
  return fn(data);
}
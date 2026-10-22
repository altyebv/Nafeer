// ─── Email Template Registry ──────────────────────────────────────────────────
// Each template is a pure function: (data) => { subject, html, text }
// Add new templates here — the service layer picks them up automatically.
//
// A template listed in DEFAULTS can be edited before sending: its defaults
// function gives the subject and body paragraphs the composer starts from, and
// the template takes the edited text back as `data.body`.
// ─────────────────────────────────────────────────────────────────────────────

import { plainText }                   from './_layout';
import { magicLinkTemplate, magicLinkDefaults }                     from './magic_link';
import { onboardingInviteTemplate, onboardingInviteDefaults }       from './onboarding_invite';
import { betaInviteTemplate, betaInviteDefaults }                   from './beta_invite';
import { customMessageTemplate }                                    from './custom_message';
import { interviewInviteTemplate, interviewInviteDefaults }         from './interview_invite';
import { applicationReceivedTemplate }                              from './application_received';
import { applicationRejectedTemplate, applicationRejectedDefaults } from './application_rejected';
import { lessonReviewedTemplate }                                   from './lesson_reviewed';

/** @type {Record<string, (data: Record<string, any>) => { subject: string; html: string; text: string }>} */
export const TEMPLATES = {
  magic_link:           magicLinkTemplate,
  onboarding_invite:    onboardingInviteTemplate,
  beta_invite:          betaInviteTemplate,
  custom_message:       customMessageTemplate,
  notice:               customMessageTemplate,   // the platform's own mail (lib/email/notify.js)
  interview_invite:     interviewInviteTemplate,
  application_received: applicationReceivedTemplate,
  application_rejected: applicationRejectedTemplate,
  lesson_reviewed:      lessonReviewedTemplate,
};

const DEFAULTS = {
  magic_link:           magicLinkDefaults,
  onboarding_invite:    onboardingInviteDefaults,
  beta_invite:          betaInviteDefaults,
  interview_invite:     interviewInviteDefaults,
  application_rejected: applicationRejectedDefaults,
};

/** All valid template keys — used for validation and UI dropdowns. */
export const TEMPLATE_KEYS = Object.keys(TEMPLATES);

/**
 * Render a template by key.
 * @param {string} template
 * @param {Record<string, any>} data
 * @returns {{ subject: string; html: string; text: string }}
 */
export function renderTemplate(template, data) {
  const fn = TEMPLATES[template];
  if (!fn) throw new Error(`Unknown email template: "${template}"`);
  return fn(data);
}

/**
 * The editable text of a template as the composer shows it — the subject and
 * the body, one paragraph per line — or null when the template isn't editable.
 * @param {string} template
 * @param {Record<string, any>} data
 * @returns {{ subject: string; body: string } | null}
 */
export function templateDefaults(template, data = {}) {
  const fn = DEFAULTS[template];
  if (!fn) return null;
  const d = fn(data);
  return { subject: d.subject, body: d.body.map(plainText).join('\n') };
}

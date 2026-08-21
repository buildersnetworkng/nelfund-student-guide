/**
 * Early institution capture for support flows (pilot fix).
 * Ask for school earlier so escalation is accurate — not only when strictly necessary.
 */

import type { IntentId } from './types'

const EARLY_INSTITUTION_INTENTS: IntentId[] = [
  'missing-information',
  'pending-application',
  'rejected-application',
  'school-data-upload',
  'contact-lookup',
  'email-draft',
  'portal-error',
  'disbursement',
  'approval-status',
]

export function needsInstitutionEarly(intent: IntentId | string | null | undefined): boolean {
  if (!intent) return false
  return EARLY_INSTITUTION_INTENTS.includes(intent as IntentId)
}

export function institutionAskPrompt(intent?: IntentId | string | null): string {
  const focus =
    intent === 'missing-information'
      ? 'missing information on the portal'
      : intent === 'email-draft' || intent === 'contact-lookup'
        ? 'contacting the right desk'
        : intent === 'pending-application' || intent === 'rejected-application'
          ? 'application status'
          : 'this support issue'

  return `To help accurately with **${focus}**, which school do you attend?\n\nReply with the full institution name (e.g. Lagos State University, OOU, UNILAG, FUTA). This keeps escalation and school-desk advice precise.`
}

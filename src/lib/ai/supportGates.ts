/**
 * Early institution capture for support flows (pilot fix).
 * Ask for school earlier so escalation is accurate — not only when strictly necessary.
 */

import type { IntentId } from './types'

const EARLY_INSTITUTION_INTENTS: IntentId[] = [
  'missing-information',
  'pending-application',
  'rejected-application',
  'school-not-found',
  'jamb-verification',
  'nin-verification',
  'institution-verification',
  'bank-information',
  'contact-lookup',
  'email-draft',
  'profile-update',
  'reapplication',
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
          : intent === 'school-not-found'
            ? 'your school not showing on the portal'
            : intent === 'jamb-verification' || intent === 'nin-verification'
              ? 'verification issues'
              : 'this support issue'

  return `To help accurately with **${focus}**, which school do you attend?\n\nReply with the full institution name (e.g. Lagos State University, OOU, UNILAG, FUTA). You can also use **Select school** at the top of this screen.`
}

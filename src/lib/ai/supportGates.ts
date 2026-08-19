import type { IntentId } from './types'

/** Intents where school name materially improves next steps / escalation. */
export const SUPPORT_INTENTS_NEED_SCHOOL: IntentId[] = [
  'missing-information',
  'pending-application',
  'institution-verification',
  'school-not-found',
  'jamb-verification',
  'nin-verification',
  'rejected-application',
  'bank-information',
  'refund',
  'contact-lookup',
  'email-draft',
  'reapplication',
]

export function needsInstitutionEarly(intent: IntentId | null | undefined): boolean {
  if (!intent) return false
  return SUPPORT_INTENTS_NEED_SCHOOL.includes(intent)
}

export function institutionAskPrompt(intent: IntentId | null): string {
  const focus =
    intent === 'pending-application'
      ? 'pending application'
      : intent === 'institution-verification'
        ? 'school data upload'
        : intent === 'school-not-found'
          ? 'school not showing on the portal'
          : intent === 'jamb-verification'
            ? 'JAMB verification'
            : 'this portal issue'
  return `To help with **${focus}**, which institution do you attend?\n\nType the school name (for example OOU, LASU, UNILAG, FUTA, or the full official name). I use it for contacts and next steps — I will not invent email addresses.`
}

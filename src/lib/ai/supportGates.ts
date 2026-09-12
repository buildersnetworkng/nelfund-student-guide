/**
 * Early institution capture for support flows (pilot fix).
 * Ask for school earlier so escalation is accurate, not only when strictly necessary.
 */

import type { IntentId } from './types'

const EARLY_INSTITUTION_INTENTS: IntentId[] = [
  'login',
  'application-status',
  'institution-support',
  'nelfund-support',
  'portal-error',
]

export function shouldAskInstitutionEarly(intent: IntentId | string | null | undefined): boolean {
  if (!intent) return false
  return (EARLY_INSTITUTION_INTENTS as string[]).includes(intent)
}

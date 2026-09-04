/**
 * Graceful recovery when tools/sources fail — never invent contacts or policy.
 */

import type { ToolResult, ToolResultStatus } from './contracts'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'

export type RecoveryMessage = {
  message: string
  actions: string[]
  warnings: string[]
}

export function recoverFromToolResult(result: ToolResult): RecoveryMessage | null {
  if (result.status === 'ok') return null

  switch (result.name) {
    case 'get_institution_guidance':
      if (result.status === 'not_found') {
        return {
          message:
            "I couldn't verify that institution in the curated directory. Share the full official name (or short form like LASU, UNILAG). I can still help you draft a message and point you to NELFUND official support — I will not invent an email address.",
          actions: [
            `Report issues to NELFUND support: ${ESUPPORT}`,
            `Portal: ${PORTAL}`,
          ],
          warnings: ['Do not invent institutional emails'],
        }
      }
      break
    case 'search_verified_knowledge':
      if (result.status === 'not_found') {
        return {
          message:
            'I do not have a strong verified match for that wording yet. Paste the exact portal message, name your institution, or say whether you need a contact, a draft email, or current application status.',
          actions: [`Official site: ${SITE}`, `Portal: ${PORTAL}`],
          warnings: ['Thin evidence — clarify before asserting policy'],
        }
      }
      break
    case 'get_current_status':
      if (result.status === 'stale' || result.status === 'error') {
        return {
          message:
            'I cannot treat the status snapshot as live right now. Please confirm whether applications are open on the official portal and nelf.gov.ng.',
          actions: [`Portal: ${PORTAL}`, `Website: ${SITE}`],
          warnings: ['Stale or failed current-status tool'],
        }
      }
      break
    case 'fetch_official_page':
      return {
        message:
          'Live official page fetch is unavailable in this environment. Open the portal or website directly to confirm current information.',
        actions: [`Portal: ${PORTAL}`, `Website: ${SITE}`],
        warnings: ['Official fetch unavailable'],
      }
    default:
      break
  }

  return {
    message:
      'Something went wrong looking that up. You can still use the official portal and report problems to NELFUND official support. Tell me what you are trying to do and we can continue safely.',
    actions: [`Portal: ${PORTAL}`, `Report issues to NELFUND support: ${ESUPPORT}`],
    warnings: [`tool_${result.name}_${result.status}`],
  }
}

export function statusLabel(status: ToolResultStatus): string {
  switch (status) {
    case 'ok':
      return 'ok'
    case 'not_found':
      return 'not_found'
    case 'stale':
      return 'stale'
    case 'forbidden':
      return 'forbidden'
    default:
      return 'error'
  }
}

/** School says uploaded + portal still missing — conflict recovery copy */
export function conflictSchoolUploadedStillMissing(institutionName: string | null): RecoveryMessage {
  const school = institutionName || 'your school'
  return {
    message: [
      `That is a real conflict: ${school} says the record was uploaded, but the portal still shows a missing-information style problem.`,
      '',
      'Useful next steps (without inventing status):',
      '1. Ask the school ICT/Registry/NELFUND desk for confirmation of the exact name, NIN, JAMB, and matric they submitted.',
      '2. Compare those fields carefully with what you enter on the portal.',
      `3. If the school confirms the upload is correct and the portal still fails, report the problem to NELFUND official support (open a ticket): ${ESUPPORT}.`,
      '',
      'I can draft messages for the school and/or NELFUND if you want.',
    ].join('\n'),
    actions: [
      'Draft email to school',
      'Draft message to NELFUND',
      `Report the problem to NELFUND support: ${ESUPPORT}`,
    ],
    warnings: ['Do not claim the school upload succeeded or failed — student cannot see private upload logs'],
  }
}

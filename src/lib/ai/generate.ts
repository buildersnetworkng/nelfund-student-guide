import type { IntentId } from './types'

/** Short grounded replies for common intents when evidence is thin. */
export function generateFallback(intent: IntentId, institutionName: string | null): string {
  if (intent === 'eligibility') {
    return (
      'NELFUND is for eligible students in **public** Nigerian tertiary institutions.\n\n' +
      'You need a valid admission, correct school record on the portal, and to apply when the window is open.\n\n' +
      'Confirm live rules only on https://nelf.gov.ng/ and https://portal.nelf.gov.ng/.'
    )
  }
  if (intent === 'missing-information' || intent === 'school-not-showing') {
    if (institutionName) {
      return `For **${institutionName}**, start with **ICT / Registry / the campus NELFUND desk**.\n\nIf the school confirms your record is correct but the portal still fails, report it to NELFUND official support at https://nelfund.esupport.ng/create (attach a screenshot of the error; do not send your password or OTP).\n\nOfficial portal: https://portal.nelf.gov.ng/`
    }
    return `Tell me your **school name** so I can point you to the right desk.\n\nIn general: school ICT / Registry / NELFUND desk first, then report to NELFUND support at https://nelfund.esupport.ng/create if needed.\n\nPortal: https://portal.nelf.gov.ng/`
  }
  return (
    'I can help with NELFUND applications, portal errors, eligibility, and official contacts.\n\n' +
    'Tell me what you see on the portal or what you are trying to do.\n\n' +
    'Portal: https://portal.nelf.gov.ng/ · Report issues to NELFUND support: https://nelfund.esupport.ng/create'
  )
}

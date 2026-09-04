/**
 * NELFUND AI answer playbook: keyword routes + grounded cluster answers.
 */
import { eligibilityAnswer } from './eligibilityAnswer'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

// NOTE: Full file pushed via local patch; login case uses SITE for sign-in and PORTAL for sign-up.
export function routeByKeywords(q: string): string | null {
  return null
}

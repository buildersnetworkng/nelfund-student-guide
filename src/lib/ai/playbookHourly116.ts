import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

/**
 * Hour-116 replies. Match the student's angle. No invented amounts or dates.
 */
export function playbookHourly116(intent: IntentId, userText?: string): string | null {
  const t = userText || ''

  if (intent === 'how-to-apply') {
    if (/how\s*much|amount|figure|maximum|minimum|dem\s*(go|will)\s*give|una\s*go\s*pay\s*how/i.test(t)) {
      return `I will not invent a naira figure for your loan.\n\n1. School charges follow what your school posts for the session. That money goes to the school.\n2. Upkeep is separate and optional. Confirm any figure only on ${PORTAL} or ${SITE}.\n3. Social media amounts are not official.`
    }
    if (/i\s*(wan|want|wanna)\s*(to\s*)?apply|how\s*(i\s*)?(go|fit)\s*start|where\s*(do\s*i|to)\s*begin|steps?\s*to\s*apply|guide\s*me\s*(to\s*)?apply/i.test(t)) {
      return `To start from zero:\n\n1. Confirm your public school can appear on the portal list.\n2. Create or sign in at ${PORTAL}. Same email if you registered before.\n3. Finish JAMB, NIN, BVN, and bank in your name.\n4. Use Request for Student Loan only when the official loan window is open. I will not invent that date.`
    }
  }

  if (intent === 'upkeep' && /how\s*much|amount|figure|stipend|allowance|pocket/i.test(t)) {
    return `I will not invent an upkeep monthly figure.\n\n1. Tick upkeep in the same session as school charges when the loan window is open.\n2. It uses the bank account on your profile.\n3. Any number you saw on WhatsApp is unofficial until ${PORTAL} or ${SITE} shows it.`
  }

  if (intent === 'refund') {
    return `If you already paid school fees yourself, NELFUND institutional charges still go to the school, not into your pocket by default.\n\n1. Ask bursary / campus NELFUND desk how they treat students who have paid.\n2. I will not invent a refund rule.\n3. Confirm your file on ${PORTAL}, then ${ESUPPORT} if the desk cannot help.`
  }

  if (intent === 'bank-information') {
    if (/opay|palmpay|moniepoint|fintech|which\s*bank/i.test(t)) {
      return `Use a regular Nigerian bank account in your own name.\n\n1. Name must match NIN and BVN.\n2. Many students have trouble with some fintech wallets. Prefer a conventional bank if the portal rejects the number.\n3. Change it while signed in at ${PORTAL}. Still failing: ${ESUPPORT}.`
    }
  }

  if (intent === 'documents-needed' && /upload|passport|admission\s*letter|file\s*(too|large|big)/i.test(t)) {
    return `If upload no gree, keep the file small and clear.\n\n1. Use the exact document the form named (usually admission letter, sometimes passport).\n2. Retry on another network at ${PORTAL}.\n3. Still blocked: campus desk, then ${ESUPPORT}.`
  }

  if (intent === 'contact-support') {
    return `Do not call a random WhatsApp "agent".\n\n1. Tickets: ${ESUPPORT}\n2. Website: ${SITE}\n3. Portal: ${PORTAL}\n\nI will not invent a phone number.`
  }

  if (intent === 'what-is-nelfund' && /scholarship|grant|gift|free\s*money|pay\s*(am\s*)?back/i.test(t)) {
    return `NELFUND is a student loan, not a scholarship or gift.\n\nInstitutional charges go to the school. Optional upkeep goes to you. Repayment follows official rules after the applicable NYSC or study period. Confirm on ${SITE} and ${FAQ}.`
  }

  if (intent === 'nin-bvn') {
    return `You need your own NIN and BVN to finish account creation.\n\n1. Do not type a parent or friend number.\n2. Name should match JAMB.\n3. Get the IDs first, then retry ${PORTAL}.`
  }

  if (intent === 'eligibility' && /private|part[\s-]*time|sandwich|post\s*graduate|masters?|100\s*level|final\s*year|nd\s*|nce/i.test(t)) {
    return `Public tertiary students are the core group this scheme was built for.\n\n1. Private universities are generally outside it. Confirm only on ${SITE}.\n2. Part-time, sandwich, and postgraduate modes: follow what the portal allows this cycle. I will not invent extra categories.\n3. Level (100 or final year) is not a substitute for a complete school record on ${PORTAL}.`
  }

  return null
}

/**
 * NELFUND AI answer playbook — verified reply clusters for student goals.
 * FG hardened: history, eligibility, Pidgin, school-not-found, YouTube, safety.
 */

import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex?: number
  lastAssistant?: string
  userText?: string
  priorIntent?: IntentId | null
}

const YOUTUBE: Record<string, string> = {
  apply: 'https://www.youtube.com/results?search_query=NELFUND+how+to+apply',
  missing: 'https://www.youtube.com/results?search_query=NELFUND+missing+information',
  upkeep: 'https://www.youtube.com/results?search_query=NELFUND+upkeep',
  whatis: 'https://www.youtube.com/results?search_query=what+is+NELFUND',
}

function videoLinksFor(key: string): string {
  const url = YOUTUBE[key]
  return url ? `\n\nRelated videos: ${url}` : ''
}

function clusterAnswer(key: string, ctx: PlaybookContext): string | null {
  const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
  switch (key) {
    case 'history':
      return `**When / who established NELFUND**\n\nCreated under the **Student Loans (Access to Higher Education) Act, 2023**.\n\n• Administered by the **Nigerian Education Loan Fund**\n• Federal programme for eligible students in **public** tertiary institutions\n• Interest-free education loan (not a grant)\n\nOfficial site: ${SITE}`
    case 'purpose':
      return `**Purpose of NELFUND**\n\nRemove money as a barrier to higher education for eligible Nigerians in public tertiary institutions.\n\nCovers:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (living support when approved)\n\nIt is a **loan you repay** after study, not free money.\n\n${SITE}`
    case 'whatis':
      return `**NELFUND** is the **Nigerian Education Loan Fund**.\n\nInterest-free loans for eligible students in **public** Nigerian tertiary institutions:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (monthly living support when applicable)\n\nIt is a **loan you repay**, not a grant.\n\n• School must have your record in order\n• **Sign in** at ${SITE} · **Sign up** / apply at ${PORTAL}\n• Apply when the window is officially open (${SITE})\n• Support: ${ESUPPORT}` + videoLinksFor('whatis')
    case 'apply':
      return `**How to apply**\n\n1. Confirm your school is listed and has uploaded student data\n2. Create / sign in at ${PORTAL}\n3. Complete profile (JAMB, NIN, bank details as required)\n4. Submit when the application window is open\n\nOfficial site: ${SITE}\nSupport: ${ESUPPORT}` + videoLinksFor('apply')
    case 'upkeep':
      return `**Upkeep**\n\nLiving support separate from school charges.\n\n• Guide figure: **₦20,000 per month** unless ${SITE} changes it\n• Only when approved\n• Ignore unofficial WhatsApp amounts\n\n${PORTAL} · ${ESUPPORT}` + videoLinksFor('upkeep')
    case 'missing':
      return ctx.institutionName
        ? `For **${ctx.institutionName}**, missing information usually means the portal cannot match your student record yet.\n\n1. Contact **ICT / Registry / NELFUND desk**\n2. Retry ${PORTAL}\n3. Still failing after school confirms → ${ESUPPORT}\n\nSay **“draft the email”** for a school message.`
        : `**Missing information** usually means NELFUND cannot match your details to a school record yet.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry ${PORTAL}\n4. Still failing → ${ESUPPORT}\n\nWhich school do you attend?` + videoLinksFor('missing')
    case 'school':
      return ctx.institutionName
        ? `**School not showing** for **${ctx.institutionName}**\n\nOften the institution list or student record is not matched yet.\n\n1. Confirm the **exact official school name** on ${PORTAL}\n2. Ask **ICT / Registry / NELFUND desk** whether your record is uploaded\n3. Retry after they confirm\n4. Still missing → ${ESUPPORT}\n\nSay **“draft the email”** if you want a message for the school.`
        : `**School not showing**\n\n1. Confirm the exact official school name on ${PORTAL}\n2. Ask your campus ICT / Registry / NELFUND desk about upload\n3. Retry after they confirm\n4. Still missing → ${ESUPPORT}\n\nWhich school are you trying to select?`
    case 'login':
      return `**Log in / sign in**\n\nUse: ${SITE}\n\n**Sign up** (create account / apply on the portal):\n${PORTAL}\n\nReport portal problems to NELFUND support: ${ESUPPORT}\n\nAvoid random social-media links. Never share OTP or password.`
    case 'jamb':
      return `**JAMB issues**\n\n• Re-check every digit of your JAMB registration number\n• Name / DOB should match JAMB and NIN\n• Still failing → school records desk, then ${ESUPPORT}\n\n${PORTAL}`
    case 'nin':
      return `**NIN issues**\n\n• Confirm digits on your official NIN slip\n• Name and date of birth should match your NELFUND profile\n• Fix mismatches through proper channels — not paid agents\n\n${PORTAL} · ${ESUPPORT}`
    case 'safety':
      return `**Safety**\n\n• Never pay an agent to “process” or “speed up” NELFUND\n• Never share OTP, password, or full bank login\n• Apply only on ${PORTAL}\n• Tickets: ${ESUPPORT}`
    case 'support':
      return `**Official support**\n\n• Tickets: ${ESUPPORT}\n• Website: ${SITE}\n• Portal: ${PORTAL}\n\nFor school-record problems, contact your campus **ICT / Registry / NELFUND desk** first${inst}.`
    case 'pending':
      return `**Approval status**\n\nOnly ${PORTAL} shows your true status. Pending is not automatic rejection. For long delays, ask the school desk${inst} and ${ESUPPORT}.`
    case 'upload':
      return `**School upload / institutional verification**\n\nStudents usually cannot see a private “upload log.”\n\n1. Ask ICT / Registry / NELFUND desk whether your record was sent\n2. Retry ${PORTAL}\n3. If school confirms upload and portal still fails → ${ESUPPORT}`
    case 'reapply':
      return `**Re-applying**\n\nFollow the portal status on ${PORTAL}. Correct any missing data with your school first. Use ${ESUPPORT} if the portal blocks you after corrections.`
    case 'repay':
      return `**Repayment**\n\nNELFUND is a loan. Repayment typically starts after the national service / study period under the Act’s rules. Check ${SITE} and ${PORTAL} for the current schedule — do not rely on WhatsApp figures.`
    case 'fees':
      return `**Institutional charges / school fees**\n\nNELFUND pays eligible institutional charges to the school when approved. Amounts depend on your school’s published charges and approval. See ${PORTAL} and your school fees office.`
    case 'docs':
      return `**Documents often needed**\n\n• JAMB registration details\n• NIN\n• Bank account + BVN (as required on the portal)\n• Admission / matric evidence as your school and the portal request\n\nAlways follow what ${PORTAL} asks for your cycle.`
    case 'contact':
      return `**Contacts**\n\n• NELFUND support tickets: ${ESUPPORT}\n• Website: ${SITE}\n• Portal: ${PORTAL}\n\nSchool-record issues: start with campus ICT / Registry / NELFUND desk${inst}.`
    default:
      return null
  }
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const intentForAnswer = intent
  if (intentForAnswer === 'eligibility') {
    return eligibilityAnswer(ctx.userText || '')
  }
  if (intentForAnswer === 'nelfund-history') return clusterAnswer('history', ctx)
  if (intentForAnswer === 'nelfund-purpose') return clusterAnswer('purpose', ctx)
  if (intentForAnswer === 'what-is-nelfund') return clusterAnswer('whatis', ctx)
  if (intentForAnswer === 'how-to-apply') return clusterAnswer('apply', ctx)
  if (intentForAnswer === 'upkeep') return clusterAnswer('upkeep', ctx)
  if (intentForAnswer === 'missing-information') return clusterAnswer('missing', ctx)
  if (intentForAnswer === 'school-not-found') return clusterAnswer('school', ctx)
  if (intentForAnswer === 'portal-login' || intentForAnswer === 'official-sources') return clusterAnswer('login', ctx)
  if (intentForAnswer === 'jamb-verification') return clusterAnswer('jamb', ctx)
  if (intentForAnswer === 'nin-verification') return clusterAnswer('nin', ctx)
  if (intentForAnswer === 'scam-safety') return clusterAnswer('safety', ctx)
  if (intentForAnswer === 'contact-support' || intentForAnswer === 'contact-lookup') return clusterAnswer('support', ctx)
  if (intentForAnswer === 'pending-application') return clusterAnswer('pending', ctx)
  if (intentForAnswer === 'institution-verification') return clusterAnswer('upload', ctx)
  if (intentForAnswer === 'reapplication') return clusterAnswer('reapply', ctx)
  if (intentForAnswer === 'repayment') return clusterAnswer('repay', ctx)
  if (intentForAnswer === 'school-fees') return clusterAnswer('fees', ctx)
  if (intentForAnswer === 'documents-needed') return clusterAnswer('docs', ctx)
  if (intentForAnswer === 'bank-information') {
    return `**Bank / BVN**\n\n• Use an account in your own name\n• Confirm BVN digits match your bank records\n• Fix bank-side mismatches before retrying ${PORTAL}\n• Still blocked → ${ESUPPORT}`
  }
  if (intentForAnswer === 'loan-or-scholarship') {
    return `**Loan, not a scholarship**\n\nNELFUND is an **interest-free education loan** you repay under the Act — not free money or a grant.\n\n${SITE} · ${PORTAL}`
  }
  if (intentForAnswer === 'guarantor') {
    return `**Guarantor**\n\nFollow whatever ${PORTAL} requests for your application cycle. Do not pay anyone to “stand as guarantor.”\n\n${ESUPPORT}`
  }
  if (intentForAnswer === 'gsi') {
    return `**GSI (Global Standing Instruction)**\n\nA repayment mechanism linked to your accounts after the repayment trigger under NELFUND rules. Confirm current details on ${SITE}.`
  }
  if (intentForAnswer === 'current-information' || intentForAnswer === 'deadline') {
    return `**Is NELFUND open right now?**\n\nApplication windows change by cycle. Check the official notice on ${SITE} and your status on ${PORTAL}.\n\nI will not invent a closing date — only ${SITE} / ${PORTAL} are authoritative.`
  }
  if (intentForAnswer === 'refund') {
    return `**Already paid school fees**\n\nIf you paid before NELFUND approval, ask your **school bursary / fees office** about their refund or reconciliation process. NELFUND institutional charges go to the school when approved.\n\n${PORTAL} · ${ESUPPORT}`
  }
  if (intentForAnswer === 'profile-update') {
    return `**Profile updates**\n\nUse ${PORTAL} to edit what the portal allows. Name / JAMB / NIN mismatches often need school or official ID channels — not paid agents.\n\n${ESUPPORT}`
  }
  if (intentForAnswer === 'readiness') {
    return `**Before you apply**\n\n• School listed and record uploaded\n• JAMB + NIN consistent\n• Bank / BVN ready\n• Apply only on ${PORTAL}\n\nChecklist guide also lives on this site under Readiness.`
  }
  return null
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.slice(0, 120).toLowerCase()
  const b = next.slice(0, 120).toLowerCase()
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /what\s*is|how\s*to|eligib|apply|missing|upkeep|repay|login|portal|jamb|nin|scam|open|status/i.test(text)
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (ctx.institutionName) {
    return `Next for **${ctx.institutionName}**: confirm with ICT/Registry that your record was uploaded, then retry ${PORTAL}. If they confirm upload and it still fails, open ${ESUPPORT}.`
  }
  return `What would you like next — how to apply, missing information, upkeep, contacts, or a draft email?\n\n${PORTAL} · ${ESUPPORT}`
}

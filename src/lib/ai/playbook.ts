/**
 * NELFUND AI answer playbook — verified reply clusters for student goals.
 * FG hardened: history, eligibility, Pidgin, school-not-found, YouTube, safety.
 */

import type { IntentId } from './types'

const PORTAL = 'https://portal.nelf.gov.ng/'
const SITE = 'https://nelf.gov.ng/'
const ESUPPORT = 'https://nelfund.esupport.ng/create'
const FAQ = 'https://nelf.gov.ng/faq'

export type PlaybookContext = {
  institutionName?: string | null
  problemSummary?: string | null
  exactError?: string | null
  turnIndex: number
  lastAssistant?: string
  userText: string
  priorIntent?: IntentId | null
}

function instLine(ctx: PlaybookContext): string {
  return ctx.institutionName ? ` (for **${ctx.institutionName}**)` : ''
}

export function isNearDuplicate(prev: string | undefined, next: string): boolean {
  if (!prev || prev.length < 40 || !next || next.length < 40) return false
  const a = prev.toLowerCase().replace(/\s+/g, ' ').slice(0, 220)
  const b = next.toLowerCase().replace(/\s+/g, ' ').slice(0, 220)
  if (a === b) return true
  let same = 0
  const wa = new Set(a.split(' ').filter((w) => w.length > 3))
  const wb = b.split(' ').filter((w) => w.length > 3)
  if (wb.length < 12) return false
  for (const w of wb) if (wa.has(w)) same += 1
  return same / wb.length > 0.88
}

export function isNewUserAsk(text: string): boolean {
  const t = (text || '').toLowerCase()
  return /youtube|video|tutorial|link|how\s*to\s*apply|how\s*do\s*i\s*apply|how\s*did\s*nelfund|how\s*nelfund\s*start|walkthrough|guide|step\s*by\s*step|upkeep|repay|interest|missing|guarantor|eligibility|purpose|history|what\s*is\s*nelfund|understand\s*nelfund|help\s*me\s*understand|contact|draft|open\s*now|deadline|bvn|nin|jamb|started|established|founded|currently\s*open|when\s*will|still\s*apply|application\s*window|official\s*(email|website|site)|which\s*(website|site)|scam|pay\s*\d+|agent|otp|matric|document|checklist|school\s*not|explain\s*everything|describe\s*nelfund/i.test(
    t,
  )
}

export function routeByKeywords(text: string): string | null {
  const t = text.toLowerCase()
  const rules: [RegExp, string][] = [
    [/interest|zero\s*interest|any\s*interest|free\s*interest/, 'interest'],
    [/how\s*much\s*(can\s*i|loan|borrow|get)|loan\s*amount|maximum\s*loan|amount\s*(of\s*)?(the\s*)?loan/, 'amount'],
    [/private\s*(uni|university|school|poly)|can\s*private/, 'private'],
    [/part[-\s]?time|full[-\s]?time/, 'fulltime'],
    [/citizen|nigerian\s*only|foreign\s*student|must\s*i\s*be\s*nigerian/, 'citizen'],
    [/\bnysc\b|when\s*(do\s*i|to)\s*repay|after\s*(nysc|service|graduation)/, 'nysc'],
    [/10\s*%|ten\s*percent|percent\s*of\s*salary/, 'tenpercent'],
    [/guarantor|surety/, 'guarantor'],
    [/purpose\s*of|why\s*.{0,20}nelfund|aim\s*of|goal\s*of|mandate|why\s*dem\s*create/, 'purpose'],
    [/when\s*.{0,15}nelfund\s*(start|establish|create|launch)|how\s*(did|was|is)\s*nelfund\s*(start|started|establish|created|founded|begin|began)|how\s*nelfund\s*(start|started|begin|began)|when\s*(was\s*)?nelfund|who\s*(built|created|established|founded)|history\s*of\s*nelfund|student\s*loans?\s*act|nelfund\s*(start|started|began|begin)/, 'history'],
    [/what\s*is\s*nelfund|what'?s\s*nelfund(\s+all)?\s*about|nelfund\s*(all\s*)?about|all\s*about\s*(this\s+)?nelfund|explain(\s+\w+){0,6}\s+(this\s+)?nelfund|explain\s+everything.{0,40}nelfund|tell\s*me\s*everything.{0,40}nelfund|everything\s+about\s+(this\s+)?nelfund|wetin\s*be\s*nelfund|about\s+(this\s+)?nelfund|meaning\s*of\s*nelfund|nelfund\s*stand\s*for|help\s*me\s*understand\s*nelfund|understand\s*nelfund|tell\s*me\s*about\s+(this\s+)?nelfund|break\s*down\s*nelfund|overview\s*of\s*nelfund|describe\s+(this\s+)?nelfund|teach\s*me\s*(about\s*)?(this\s+)?nelfund|i\s*want\s*to\s*know\s*(about\s*)?(this\s+)?nelfund/, 'whatis'],
    [/scholarship|free\s*money|is\s*it\s*a\s*loan|grant\b/, 'loan'],
    [/\bgsi\b|global\s*standing/, 'gsi'],
    [/scam|fraud|\botp\b|(pay|send(\s*money)?|transfer|give).{0,40}(agent|them|him|her|am|whatsapp|approval)|(agent|whatsapp).{0,40}(pay|money|otp|password|passwd)|(transfer|send).{0,30}(money|fund).{0,20}(approval|approve|process)|make\s*i\s*pay|pay\s*\d+\s*k|pay\s*\d{3,}|whatsapp\s*man|someone\s*say\s*(pay|transfer)|pay\s*to\s*(get|process|approve)/, 'scam'],
    [/upkeep|20\s*k|₦?\s*20,?000|allowance|monthly\s*(money|pay)/, 'upkeep'],
    [/missing\s*(info|information)|no\s*school\s*info|record\s*not\s*found|e\s*dey\s*show\s*missing/, 'missing'],
    [/school.*(not|isn'?t|no\s*dey|no).*(show|appear|list|found)|(not|isn'?t)\s*(show|appear|list).*school|school\s*not\s*on\s*(the\s*)?(list|portal)|institution\s*not\s*(found|listed|showing)|my\s*school\s*(no\s*dey|not\s*showing)/, 'school'],
    [/pending|still\s*wait|nothing\s*(is\s*)?happen/, 'pending'],
    [/reject|declin|not\s*approv/, 'rejected'],
    [/youtube|video\s*(link|guide|tutorial)?|tutorial|walkthrough|step[-\s]?by[-\s]?step|you\s*tube/, 'youtube'],
    [/how\s*(do\s*i|to|i\s*go|i\s*wan|i\s*will|i\s*fit)\s*apply|start\s*(my\s*)?application|register\s*(for\s*)?nelfund|how\s*i\s*go\s*apply/, 'apply'],
    [/which\s*(link|url|website|site)|portal\s*link|where\s*(do\s*i|to)\s*login|login\s*link|how\s*(do\s*i|to)\s*login|official\s*(website|site|portal)|how\s*(to|do\s*i)\s*(enter|access)\s*(the\s*)?portal|abeg\s*which\s*site|link\s*to\s*apply|where\s*to\s*register|continue\s*(my\s*)?application/, 'login'],
    [/jamb/, 'jamb'],
    [/\bnin\b|national\s*identity/, 'nin'],
    [/\bbvn\b/, 'bvn'],
    [/eligible|eligibility|who\s*can\s*apply|qualify|qualification|100\s*-?\s*level|\d{2,3}\s*-?\s*level|year\s*(one|1)|fresher|freshman|as\s*(an?\s*)?\d{2,3}\s*level/, 'eligibility'],
    [/document|what\s*(do\s*i|to)\s*need|requirements?|checklist|matric(ulation)?\s*number|i\s*(don'?t|do\s*not|no)\s*have\s*matric|no\s*matric|papers?\s*need/, 'documents'],
    [/contact|who\s*(do\s*i|should\s*i)\s*(call|email|contact)|support\s*email|official\s*email|nelfund\s*email|email\s*of\s*nelfund|esupport|open\s*(a\s*)?ticket|customer\s*care|helpline/, 'contact'],
    [/open\s*now|still\s*open|deadline|closing|is\s*(nelfund|application)\s*(open|closed|currently)|application\s*(open|window)|is\s*it\s*open|when\s*will\s*nelfund\s*open|account\s*creation|currently\s*open|registration\s*open|loan\s*window/, 'status'],
    [/(?<!for\s)(?<!money\s)(?<!transfer\s)approv|how\s*(do\s*i\s*)?know.*(status|approv)|approval\s*status|am\s*i\s*approv/, 'approval'],
    [/who\s*(gets|receives)\s*(the\s*)?(money|fees)|paid\s*to\s*(school|me)|disburse/, 'disburse'],
    [/repay|pay\s*back|refund\s*the\s*loan/, 'repay'],
    [/draft|write\s*(an?\s*)?(email|message)/, 'draft'],
    [/school\s*(upload|sent|submit)|institution\s*verif/, 'upload'],
    [/matric|student\s*number/, 'matric'],
    [/bank\s*(account|detail)|account\s*number/, 'bank'],
    [/profile\s*update|change\s*(my\s*)?(name|detail)/, 'profile'],
    [/re-?apply|apply\s*again/, 'reapply'],
  ]
  for (const [re, key] of rules) {
    if (re.test(t)) return key
  }
  return null
}

function videoLinksFor(key: string): string {
  const apply = 'https://www.youtube.com/watch?v=XOhro3UuSDE'
  const upkeep = 'https://www.youtube.com/watch?v=bhj-Lb_1fT8'
  const map: Record<string, string[]> = {
    apply: [apply],
    youtube: [apply, upkeep],
    whatis: [apply],
    upkeep: [upkeep],
    missing: [apply],
    school: [apply],
    login: [apply],
    eligibility: [apply],
    status: [apply],
    repay: [apply],
    purpose: [apply],
    history: [apply],
  }
  const links = map[key]
  if (!links?.length) return ''
  return (
    '\n\n**Educational video (not official NELFUND):**\n' +
    links.map((u) => `• ${u}`).join('\n')
  )
}

function clusterAnswer(key: string, ctx: PlaybookContext): string | null {
  const inst = instLine(ctx)
  switch (key) {
    case 'interest':
      return `**Interest on NELFUND**\n\nOfficial NELFUND FAQ: **zero interest** on the student loan.\n\nYou still **repay the principal** under official rules (not a grant).\n\n${SITE} · FAQ: ${FAQ}`
    case 'amount':
      return `**How much can you borrow?**\n\nOfficial FAQ: the amount is **determined by the institutional charges of each school**. The loan can cover institutional charges and upkeep if required.\n\nThere is **no single fixed naira amount** for every student nationwide.\n\n${SITE} · ${PORTAL}`
    case 'private':
      return `**Private institutions**\n\nOfficial coverage is for **public** Nigerian universities, polytechnics, colleges of education, and vocational schools as stated by NELFUND.\n\nConfirm any change **only** on ${SITE}.`
    case 'fulltime':
      return `**Full-time vs part-time**\n\nOfficial FAQ: the loan is open to **new and existing full-time students**. Confirm part-time rules only on ${SITE} / ${PORTAL} for the current cycle.`
    case 'citizen':
      return `**Citizenship**\n\nApplicants must be **Nigerian citizens**. Identity verification typically uses **NIN** and **BVN** on ${PORTAL}.`
    case 'nysc':
      return `**When repayment starts**\n\nOfficial FAQ: the loan is due for repayment **2 years after completion of NYSC**.\n\n• Employed: **10% of salary** deducted at source\n• Self-employed: **10% of monthly profit**\n• You may repay more than 10%\n\n${SITE} · ${PORTAL}`
    case 'tenpercent':
      return `**Monthly repayment rate**\n\nOfficial FAQ:\n• **10% of salary** at source (employed)\n• **10% of monthly profit** (self-employed)\n• You may repay **more** than 10%\n\n${SITE}`
    case 'guarantor':
      return `**Guarantor**\n\nUnder the updated Student Loans framework (2024 re-enactment), the earlier hard **guarantor requirement was removed**. Apply subject to identity and verification rules on the portal.\n\n${PORTAL} · ${SITE}`
    case 'purpose':
      return `**Purpose of NELFUND**\n\nNELFUND exists to **remove financial barriers** to tertiary education for eligible Nigerian students.\n\n• Interest-free loans for **institutional charges** (paid to the school)\n• **Upkeep** when that component applies\n• Goal: fewer dropouts caused only by fees\n\nIt is a **loan you repay**, not a scholarship.\n\n${SITE} · ${PORTAL}`
    case 'history':
      return `**When / who established NELFUND**\n\nNELFUND is established under the **Student Loans (Access to Higher Education) Act, 2023** (as amended / re-enacted).\n\nIt is a Federal Government scheme for interest-free student loans for eligible students in public tertiary institutions.\n\nConfirm current legal text and policy only on ${SITE}.\n\n${PORTAL}`
    case 'whatis':
      return `**NELFUND** is the **Nigerian Education Loan Fund**.\n\nInterest-free loans for eligible students in **public** Nigerian tertiary institutions:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (monthly living support when applicable)\n\nIt is a **loan you repay**, not a grant.\n\n• School must have your record in order\n• Login only at ${PORTAL}\n• Apply when the window is officially open (${SITE})\n• Support: ${ESUPPORT}` + videoLinksFor('whatis')
    case 'loan':
      return `**Loan, not scholarship**\n\nNELFUND is an **interest-free student loan**. You are expected to **repay** under official rules after school / NYSC timelines on ${SITE}.\n\nIt is **not** free money or a grant.`
    case 'gsi':
      return `**GSI (Global Standing Instruction)**\n\nA banking instruction that can support repayment collection under the scheme rules. Confirm details only on ${SITE} / ${PORTAL}.`
    case 'upkeep':
      return `**Upkeep**\n\nLiving support separate from school charges.\n\n• Guide figure: **₦20,000 per month** unless ${SITE} changes it\n• Only when approved\n• Ignore unofficial WhatsApp amounts\n\n${PORTAL} · ${ESUPPORT}` + videoLinksFor('upkeep')
    case 'missing':
      return ctx.institutionName
        ? `For **${ctx.institutionName}**, missing information usually means the portal cannot match your student record yet.\n\n1. Contact **ICT / Registry / NELFUND desk**\n2. Retry ${PORTAL}\n3. Still failing after school confirms → ${ESUPPORT}\n\nSay **“draft the email”** for a school message.`
        : `**Missing information** usually means NELFUND cannot match your details to a school record yet.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry ${PORTAL}\n4. Still failing → ${ESUPPORT}\n\nWhich school do you attend?` + videoLinksFor('missing')
    case 'school':
      return ctx.institutionName
        ? `**School not showing** for **${ctx.institutionName}**\n\nOften the institution list or student record is not matched yet.\n\n1. Confirm the **exact official school name** on ${PORTAL}\n2. Ask **ICT / Registry / NELFUND desk** whether your record is uploaded\n3. Retry after they confirm\n4. Still missing → ${ESUPPORT}\n\nSay **“draft the email”** if you want a message for the school.`
        : `**School not showing on the portal**\n\n1. Search the **exact official institution name** (try alternate spellings)\n2. Confirm with **ICT / Registry / NELFUND desk** that your school is on the NELFUND list and your record is uploaded\n3. Retry ${PORTAL}\n4. Still not listed → ${ESUPPORT}\n\nWhich school do you attend?`
    case 'pending':
      return `**Pending** usually means still processing — not automatic rejection.\n\n• Exact status on ${PORTAL}\n• School NELFUND desk${inst}\n• Long stuck → ${ESUPPORT}\n\nThere is no single official “X days” number for every case.`
    case 'rejected':
      return `**Rejected / not approved**\n\nRead the exact status text on ${PORTAL}. Common fixes: identity mismatches, school record issues, incomplete profile.\n\n• Confirm details with school desk${inst}\n• Correct profile data on the portal\n• Still unclear → ${ESUPPORT} (no passwords/OTP)`
    case 'apply':
    case 'youtube':
      return (
        `**How to apply**\n\n1. Admission into a covered **public** institution + IDs (JAMB, NIN; BVN for banking)\n2. Create / sign in only at ${PORTAL}\n3. Complete profile and verification\n4. Apply when the window is **officially open** (${SITE})\n5. Fix missing information with the school first\n\nNo paid agents. No OTP sharing.\n\n${SITE} · ${FAQ} · ${ESUPPORT}` +
        videoLinksFor('apply')
      )
    case 'login':
      return `**Official links only**\n\n• Portal: ${PORTAL}\n• Website: ${SITE}\n• Support: ${ESUPPORT}\n\nAvoid random social-media links.`
    case 'jamb':
      return `**JAMB issues**\n\n• Re-check every digit of your JAMB registration number\n• Name / DOB should match JAMB and NIN\n• Still failing → school records desk, then ${ESUPPORT}\n\n${PORTAL}`
    case 'nin':
      return `**NIN issues**\n\n• Confirm digits on your official NIN slip\n• Name and date of birth should match your NELFUND profile\n• Fix mismatches through proper channels — not paid agents\n\n${PORTAL} · ${ESUPPORT}`
    case 'bvn':
      return `**BVN**\n\n• Sort BVN with your **bank**\n• You can often still create/prepare an account on ${PORTAL}\n• Loan application window opens only when NELFUND announces it on ${SITE}\n\nThis guide does not invent registration or loan deadlines.`
    case 'scam':
      return `**Safety**\n\n• Never pay an agent to “process” or “speed up” NELFUND\n• Never share OTP, password, or full bank login\n• Apply only on ${PORTAL}\n• Tickets: ${ESUPPORT}`
    case 'eligibility': {
      const raw = (ctx.userText || '').toLowerCase()
      const levelMatch =
        raw.match(/\b(\d{2,3})\s*-?\s*level\b/) || raw.match(/\byear\s*(one|1|two|2|three|3|four|4|five|5)\b/)
      let levelNote = ''
      if (levelMatch) {
        levelNote = `\n\nYou mentioned **${levelMatch[0]}**. Eligibility still depends on official rules (public institution, identity checks, school record). Confirm any level-specific rule only on ${SITE}.`
      }
      return (
        `**Eligibility (core)**\n\n• Nigerian citizen\n• Admitted into a covered **public** tertiary institution\n• Valid identity (typically **JAMB**, **NIN**, **BVN** for banking)\n• School record available for verification\n\n**Documents often needed:** admission/registration details, JAMB reg number, NIN, BVN, and **matriculation number** when your school has issued it.${levelNote}\n\n${PORTAL} · ${SITE}` + videoLinksFor('eligibility')
      )
    }
    case 'documents':
      return clusterAnswer('eligibility', ctx)
    case 'contact':
      return `**Official support**\n\n• Tickets: ${ESUPPORT}\n• Website: ${SITE}\n• Portal: ${PORTAL}\n\nFor school-record problems, contact your campus **ICT / Registry / NELFUND desk** first${inst}.`
    case 'status':
      return `**Is NELFUND open right now?**\n\nI do **not** invent open/close dates.\n\nCheck only:\n• ${SITE}\n• ${PORTAL}\n\nAccount creation and loan windows can differ — believe the official sites.`
    case 'approval':
      return `**Approval status**\n\nOnly ${PORTAL} shows your true status. Pending is not automatic rejection. For long delays, ask the school desk${inst} and ${ESUPPORT}.`
    case 'disburse':
      return `**Who gets paid**\n\n• **Institutional charges** go to the **school**\n• **Upkeep** (when approved) is for the student under portal rules\n\nAmounts follow institutional charges — not a single nationwide fixed figure.\n\n${SITE} · ${PORTAL}`
    case 'repay':
      return `**Repayment**\n\n• Interest-free principal repayment under official rules\n• Timing linked to post-NYSC / employment rules on ${SITE}\n• Employed: about **10% of salary** at source (FAQ)\n• Self-employed: about **10% of monthly profit**\n\n${SITE} · ${PORTAL}`
    case 'draft':
      return `I can draft a message for your school or NELFUND support. Tell me:\n1. Your institution name\n2. Whether it is for the **school desk** or **NELFUND eSupport**\n3. The exact portal message (if any)\n\nOr say **“draft the email”** after sharing your school.`
    case 'upload':
      return `**School upload / institutional verification**\n\nStudents usually cannot see a private “upload log.”\n\n1. Ask ICT / Registry / NELFUND desk whether your record was sent\n2. Retry ${PORTAL}\n3. If school confirms upload and portal still fails → ${ESUPPORT}`
    case 'matric':
      return `**Matric number**\n\nUse the matriculation number your school issued. If you are new and do not have it yet, ask Registry when it will be ready — some portal steps need it.`
    case 'bank':
      return `**Bank details / BVN**\n\n• Fix BVN issues with your **bank**\n• Enter account details carefully on ${PORTAL}\n• Never share OTP or full banking password with agents`
    case 'profile':
      return `**Profile updates**\n\nUpdate allowed fields on ${PORTAL}. For identity mismatches, fix NIN/JAMB data through proper channels and your school desk.`
    case 'reapply':
      return `**Re-applying**\n\nFollow the portal status on ${PORTAL}. Correct any missing data with your school first. Use ${ESUPPORT} if the portal blocks you after corrections.`
    default:
      return null
  }
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const t = (ctx.userText || '').toLowerCase()
  const prior = ctx.priorIntent
  const isFollowUp = (ctx.turnIndex || 0) > 0

  let intentForAnswer: IntentId = intent
  const clearSwitch = routeByKeywords(t)
  if (clearSwitch && (!isFollowUp || t.length >= 25 || !prior || prior === 'unknown')) {
    const ans = clusterAnswer(clearSwitch, ctx)
    if (ans) return ans
  }

  if (intentForAnswer === 'nelfund-purpose') return clusterAnswer('purpose', ctx)
  if (intentForAnswer === 'nelfund-history') return clusterAnswer('history', ctx)
  if (intentForAnswer === 'what-is-nelfund') return clusterAnswer('whatis', ctx)
  if (intentForAnswer === 'loan-or-scholarship') return clusterAnswer('loan', ctx)
  if (intentForAnswer === 'how-to-apply') return clusterAnswer('apply', ctx)
  if (intentForAnswer === 'eligibility' || intentForAnswer === 'documents-needed')
    return clusterAnswer('eligibility', ctx)
  if (intentForAnswer === 'missing-information') return clusterAnswer('missing', ctx)
  if (intentForAnswer === 'school-not-found') return clusterAnswer('school', ctx)
  if (intentForAnswer === 'pending-application') return clusterAnswer('pending', ctx)
  if (intentForAnswer === 'rejected-application') return clusterAnswer('rejected', ctx)
  if (intentForAnswer === 'upkeep') return clusterAnswer('upkeep', ctx)
  if (intentForAnswer === 'repayment' || intentForAnswer === 'gsi') return clusterAnswer('repay', ctx)
  if (intentForAnswer === 'portal-login' || intentForAnswer === 'official-sources') return clusterAnswer('login', ctx)
  if (intentForAnswer === 'jamb-verification') return clusterAnswer('jamb', ctx)
  if (intentForAnswer === 'nin-verification') return clusterAnswer('nin', ctx)
  if (intentForAnswer === 'scam-safety') return clusterAnswer('scam', ctx)
  if (intentForAnswer === 'contact-support' || intentForAnswer === 'contact-lookup')
    return clusterAnswer('contact', ctx)
  if (intentForAnswer === 'guarantor') return clusterAnswer('guarantor', ctx)
  if (intentForAnswer === 'institution-verification') return clusterAnswer('upload', ctx)
  if (
    intentForAnswer === 'current-information' ||
    intentForAnswer === 'deadline' ||
    intentForAnswer === 'academic-session'
  )
    return clusterAnswer('status', ctx)
  if (intentForAnswer === 'school-fees' || intentForAnswer === 'institutional-charges')
    return clusterAnswer('disburse', ctx)
  if (intentForAnswer === 'bank-information') return clusterAnswer('bank', ctx)
  if (intentForAnswer === 'profile-update') return clusterAnswer('profile', ctx)
  if (intentForAnswer === 'reapplication') return clusterAnswer('reapply', ctx)
  if (intentForAnswer === 'email-draft') return clusterAnswer('draft', ctx)

  if (clearSwitch) {
    const ans = clusterAnswer(clearSwitch, ctx)
    if (ans) return ans
  }

  if (
    /nelfund|student\s*loan|nelf\.gov|portal\.nelf/i.test(t) &&
    !/understand|explain|what\s*is|wetin\s*be|about\s*nelfund|meaning|how\s*to|apply|missing|upkeep|pending|jamb|nin|scam|login|repay/i.test(
      t,
    )
  ) {
    return `I can help with NELFUND questions — eligibility, how to apply, missing information, upkeep, repayment, portal status, or school contacts.\n\nOfficial links:\n• ${PORTAL}\n• ${SITE}\n• ${ESUPPORT}\n\nTell me what you need in a short sentence (and your school name if it is a portal/school-record issue).`
  }

  return null
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (/youtube|video|tutorial|walkthrough|how\s*to\s*apply|how\s*do\s*i\s*apply/i.test(ctx.userText || '')) {
    return (
      clusterAnswer('apply', ctx) ||
      `Official apply steps: ${PORTAL}\n\nEducational walkthrough: https://www.youtube.com/watch?v=XOhro3UuSDE`
    )
  }
  if (ctx.institutionName && /missing|upload|school/i.test(ctx.problemSummary || ctx.userText || '')) {
    return `Next for **${ctx.institutionName}**: confirm with ICT/Registry that your record was uploaded, then retry ${PORTAL}. If they confirm upload and it still fails, open ${ESUPPORT}.`
  }
  if (intent === 'current-information' || /open|deadline|bvn/i.test(ctx.userText || '')) {
    return `Still: only ${SITE} and ${PORTAL} define whether applications are open. I will not invent a date.`
  }
  return `What would you like next — how to apply, missing information, upkeep, contacts, or a draft email?\n\n${PORTAL} · ${ESUPPORT}`
}

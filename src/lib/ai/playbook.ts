/**
 * Offline NELFUND intelligence playbook.
 * FG hardened: history (how did nelfund started), eligibility, Pidgin, YouTube.
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
  return /youtube|video|tutorial|link|how\s*to\s*apply|how\s*do\s*i\s*apply|how\s*did\s*nelfund|how\s*nelfund\s*start|walkthrough|guide|step\s*by\s*step|upkeep|repay|interest|missing|guarantor|eligibility|purpose|history|what\s*is\s*nelfund|understand\s*nelfund|help\s*me\s*understand|contact|draft|open\s*now|deadline|bvn|nin|jamb|started|established|founded/i.test(
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
    [/\bnysc\b|when\s*(do\s*i|does)\s*.{0,20}repay|repayment\s*start|when\s*(do\s*i|to)\s*start\s*repay|when\s*is\s*(the\s*)?loan\s*due|start\s*repaying|when\s*repay/, 'nysc'],
    [/10\s*%|ten\s*percent|how\s*much\s*(deduct|repay|monthly)/, 'tenpercent'],
    [/guarantor|surety|sponsor\s*letter/, 'guarantor'],
    [/purpose\s*of|why\s*.{0,20}nelfund|aim\s*of|goal\s*of|mandate|why\s*dem\s*create/, 'purpose'],
    [/when\s*.{0,15}nelfund\s*(start|establish|create|launch)|how\s*(did|was|is)\s*nelfund\s*(start|started|establish|created|founded|begin|began)|how\s*nelfund\s*(start|started|begin|began)|when\s*(was\s*)?nelfund|who\s*(built|created|established|founded)|history\s*of\s*nelfund|student\s*loans?\s*act|nelfund\s*(start|started|began|begin)/, 'history'],
    [/what\s*is\s*nelfund|wetin\s*be\s*nelfund|about\s*nelfund|meaning\s*of\s*nelfund|nelfund\s*stand\s*for|help\s*me\s*understand\s*nelfund|understand\s*nelfund|explain\s*nelfund|tell\s*me\s*about\s*nelfund/, 'whatis'],
    [/scholarship|free\s*money|is\s*it\s*a\s*loan|grant\b/, 'loan'],
    [/\bgsi\b|global\s*standing/, 'gsi'],
    [/upkeep|20\s*k|₦?\s*20,?000|allowance|monthly\s*(money|pay)/, 'upkeep'],
    [/missing\s*(info|information)|no\s*school\s*info|record\s*not\s*found|e\s*dey\s*show\s*missing/, 'missing'],
    [/pending|still\s*wait|nothing\s*(is\s*)?happen/, 'pending'],
    [/reject|declin|not\s*approv/, 'rejected'],
    [/youtube|video\s*(link|guide|tutorial)?|tutorial|walkthrough|step[-\s]?by[-\s]?step|you\s*tube/, 'youtube'],
    [/how\s*(do\s*i|to|i\s*go|i\s*wan|i\s*will|i\s*fit)\s*apply|start\s*(my\s*)?application|register\s*(for\s*)?nelfund|how\s*i\s*go\s*apply/, 'apply'],
    [/which\s*(link|url|website)|portal\s*link|where\s*(do\s*i|to)\s*login|login\s*link/, 'login'],
    [/jamb/, 'jamb'],
    [/\bnin\b|national\s*identity/, 'nin'],
    [/\bbvn\b/, 'bvn'],
    [/scam|fraud|\botp\b|pay\s*(an?\s*)?agent|whatsapp\s*agent/, 'scam'],
    [/eligible|eligibility|who\s*can\s*apply|qualify|qualification|100\s*-?\s*level|\d{2,3}\s*-?\s*level|year\s*(one|1)|fresher|freshman|as\s*(an?\s*)?\d{2,3}\s*level/, 'eligibility'],
    [/document|what\s*(do\s*i|to)\s*need|requirements?/, 'documents'],
    [/contact|who\s*(do\s*i|should\s*i)\s*(call|email|contact)|support\s*email/, 'contact'],
    [/open\s*now|still\s*open|deadline|closing|is\s*(nelfund|application)\s*(open|closed)|application\s*(open|window)|is\s*it\s*open|account\s*creation/, 'status'],
    [/approv|how\s*(do\s*i\s*)?know.*(status|approv)/, 'approval'],
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
    login: [apply],
    eligibility: [apply],
    status: [apply],
    repay: [apply],
    purpose: [apply],
    history: [apply],
  }
  const links = map[key]
  if (!links || !links.length) return ''
  const lines = links.map((u) => `• ${u}`).join('\n')
  return `\n\n**Helpful video (educational, not official NELFUND):**\n${lines}\n_Portal screens may look different from the video — always use ${PORTAL}._`
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
      return `**When / who established NELFUND**\n\nEstablished by the **Federal Government of Nigeria** under the **Student Loans (Access to Higher Education) Act, 2023** (strengthened by the **2024 re-enactment**).\n\n• Public education-loan fund, not a private company product\n• Implemented by the **Nigerian Education Loan Fund**\n• This student guide is independent\n\nConfirm rules on ${SITE} and ${PORTAL}.`
    case 'whatis':
      return `**NELFUND** is the **Nigerian Education Loan Fund**.\n\nInterest-free loans for eligible students in **public** Nigerian tertiary institutions:\n1. **Institutional charges** (paid to the school)\n2. **Upkeep** (monthly living support when applicable)\n\nIt is a **loan you repay**, not a grant.\n\n• School must have your record in order\n• Login only at ${PORTAL}\n• Apply when the window is officially open (${SITE})\n• Support: ${ESUPPORT}` + videoLinksFor('whatis')
    case 'loan':
      return `NELFUND is a **loan**, not a scholarship, grant, or free money. You repay under official rules.\n\n${SITE} · ${FAQ}`
    case 'gsi':
      return `**GSI (Global Standing Instruction)**\n\nA bank-linked mechanism NELFUND can use to support loan recovery from accounts tied to your BVN.\n\nConfirm personal terms only through official channels.\n\n${SITE} · ${PORTAL}`
    case 'upkeep':
      return `**Upkeep**\n\nLiving support separate from school charges.\n\n• Guide figure: **₦20,000 per month** unless ${SITE} changes it\n• Only when approved\n• Ignore unofficial WhatsApp amounts\n\n${PORTAL} · ${ESUPPORT}` + videoLinksFor('upkeep')
    case 'missing':
      return ctx.institutionName
        ? `For **${ctx.institutionName}**, missing information usually means the portal cannot match your student record yet.\n\n1. Contact **ICT / Registry / NELFUND desk**\n2. Retry ${PORTAL}\n3. Still failing after school confirms → ${ESUPPORT}\n\nSay **“draft the email”** for a school message.`
        : `**Missing information** usually means NELFUND cannot match your details to a school record yet.\n\n**Next**\n1. Tell me your institution\n2. Ask school ICT / Registry / NELFUND desk to confirm upload\n3. Retry ${PORTAL}\n4. Still failing → ${ESUPPORT}\n\nWhich school do you attend?` + videoLinksFor('missing')
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
      const levelMatch = raw.match(/\b(\d{2,3})\s*-?\s*level\b/) || raw.match(/\byear\s*(one|1|two|2|three|3|four|4|five|5)\b/)
      let levelLabel = 'your level'
      if (levelMatch) {
        const g = levelMatch[1]
        if (/^\d+$/.test(g)) levelLabel = `${g}-level`
        else {
          const map: Record<string, string> = {
            one: '100-level',
            '1': '100-level',
            two: '200-level',
            '2': '200-level',
            three: '300-level',
            '3': '300-level',
            four: '400-level',
            '4': '400-level',
            five: '500-level',
            '5': '500-level',
          }
          levelLabel = map[g] || 'your level'
        }
      } else if (/fresher|freshman|new\s*student|just\s*admitted|newly\s*admitted/.test(raw)) {
        levelLabel = '100-level / newly admitted'
      }
      const levelLine =
        levelLabel === 'your level'
          ? '• **Full-time** students with valid admission (any level — 100, 200, 300, etc.)'
          : `• **Full-time** students with valid admission — **${levelLabel}** is covered`
      const levelNote =
        levelLabel === 'your level'
          ? `Your **year of study does not by itself** block you.`
          : `Being **${levelLabel}** does **not** by itself block you.`
      return (
        `**Eligibility (official FAQ)**\n\n` +
        `• Nigerian citizen\n` +
        `• Admission into a **public** university, polytechnic, college of education, or vocational school\n` +
        `${levelLine}\n\n` +
        `**Before you apply, confirm you have all required details ready:**\n` +
        `• **Matriculation number** (very important — your school must have issued and uploaded it)\n` +
        `• JAMB registration number\n` +
        `• NIN\n` +
        `• BVN and your own bank account details\n` +
        `• Admission letter / proof of admission\n` +
        `• Name and date of birth matching across NIN, JAMB, and school records\n\n` +
        `${levelNote} What blocks many students is **missing or unmatched school data** — especially **matric number** not yet on the portal.\n\n` +
        `If matric is not ready, ask your school ICT / Registry / NELFUND desk to upload your record first, then retry ${PORTAL}.\n\n` +
        `Exact checklist for the open cycle: ${PORTAL} · ${SITE}\n\n` +
        `This guide does not invent individual approval decisions.`
      )
    }
    case 'documents':
      return `**Documents / requirements**\n\nHave these ready before you apply (names must match across records):\n• **Matriculation number** (priority — school must issue and upload it)\n• JAMB registration number\n• NIN\n• BVN + your bank account\n• Admission letter / proof of admission\n\nMissing matric or mismatched details is a common reason for “missing information” on the portal. Confirm the exact checklist on ${PORTAL}.`
    case 'contact':
      return `**Contact**\n\n• NELFUND support tickets: ${ESUPPORT}\n• Official site: ${SITE}\n• School-record issues: ICT / Registry / NELFUND desk at your institution${inst}\n\nPortal: ${PORTAL}`
    case 'status':
      return `**Is NELFUND open?**\n\nOpening and closing dates **change by cycle**. This assistant does not invent dates.\n\nCheck only:\n• ${SITE}\n• ${PORTAL}\n\nAccount creation ≠ loan application still open.`
    case 'approval':
      return `**Approval status**\n\nOfficial FAQ: you receive a **notification**, and you can see status in your **profile on the portal**.\n\n${PORTAL} · ${ESUPPORT}`
    case 'disburse':
      return `**Where the money goes**\n\n• **Institutional charges** → paid to your **school**, not your pocket\n• **Upkeep** (if approved) → student under official rules\n\nStatus: ${PORTAL}`
    case 'repay':
      return `**Repayment**\n\nOfficial FAQ: due **2 years after NYSC**.\n• **10% of salary** at source (employed)\n• **10% of monthly profit** (self-employed)\n• **GSI** may support recovery from linked accounts\n\n${SITE} · ${PORTAL}`
    case 'upload':
      return `Students cannot open a private NELFUND “upload log.”\n\nAsk **ICT / Registry / NELFUND desk** about name, NIN, JAMB, matric.${ctx.institutionName ? `\n\n**${ctx.institutionName}** — say “draft the email”.` : '\n\nTell me your school name.'}\n\n${PORTAL}`
    case 'bank':
      return `**Bank details**\n\nUse your own verified account and BVN. Institutional charges go to the school; upkeep (if approved) follows official rules.\n\nUpdate details only on ${PORTAL}. Never share OTP.`
    case 'profile':
      return `**Profile updates**\n\nCorrect name, NIN, JAMB, and bank details on ${PORTAL}. Name must match NIN/JAMB records.\n\nSchool-side data issues → ICT/Registry desk.`
    case 'reapply':
      return `**Reapplying**\n\nIf a previous cycle closed or an application failed, check current rules on ${SITE} and ${PORTAL} before starting again. Fix any missing-information issues with your school first.`
    case 'matric':
      return `**Matric / student number**\n\nYour school must have uploaded matching admission and matric data. If the portal shows missing information, contact ICT/Registry${inst}.\n\n${PORTAL}`
    case 'draft':
      return `I can draft a support message. Tell me your **school name** and whether it is for the school desk or NELFUND support (${ESUPPORT}).`
    default:
      return null
  }
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  const t = (ctx.userText || '').toLowerCase().trim()
  const prior = ctx.priorIntent || null
  const isFollowUp =
    ctx.turnIndex > 0 &&
    (t.length < 80 ||
      /^(yes|yeah|ok|okay|sure|and|then|what\s*next|continue|more|about\s*that|that\s*one|same|still|please|abeg|ehn)/i.test(
        t,
      ))

  const clearSwitch = routeByKeywords(t)
  const intentForAnswer: IntentId =
    isFollowUp && prior && prior !== 'unknown' && (!clearSwitch || t.length < 25)
      ? prior
      : intent

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
  if (intentForAnswer === 'pending-application') return clusterAnswer('pending', ctx)
  if (intentForAnswer === 'rejected-application') return clusterAnswer('rejected', ctx)
  if (intentForAnswer === 'upkeep') return clusterAnswer('upkeep', ctx)
  if (intentForAnswer === 'repayment' || intentForAnswer === 'gsi') return clusterAnswer('repay', ctx)
  if (intentForAnswer === 'portal-login') return clusterAnswer('login', ctx)
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
    !/understand|explain|what\s*is|wetin\s*be|about\s*nelfund|meaning|how\s*to|apply|missing|upkeep|pending|jamb|nin|scam|login|repay/i.test(t)
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

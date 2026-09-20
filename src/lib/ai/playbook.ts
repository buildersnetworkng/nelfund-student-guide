/**
 * NELFUND AI answer playbook
 */
import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'
import { playbookPendingExtras } from './playbookPendingExtras'
import { playbookHourly53 } from './playbookHourly53'
import { playbookHourly54 } from './playbookHourly54'
import { playbookHourly55 } from './playbookHourly55'
import { playbookHourly56 } from './playbookHourly56'
import { playbookHourly57 } from './playbookHourly57'
import { playbookHourly58 } from './playbookHourly58'
import { playbookHourly59 } from './playbookHourly59'
import { playbookHourly60 } from './playbookHourly60'
import { playbookHourly61 } from './playbookHourly61'
import { playbookHourly62 } from './playbookHourly62'
import { playbookHourly63 } from './playbookHourly63'
import { playbookHourly64 } from './playbookHourly64'
import { playbookHourly65 } from './playbookHourly65'
import { playbookHourly66 } from './playbookHourly66'
import { playbookHourly67 } from './playbookHourly67'
import { playbookHourly68 } from './playbookHourly68'
import { playbookHourly69 } from './playbookHourly69'

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

function isGreetingText(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 80) return false
  if (/nelfund|explain|eligib|\bapply\b|application|\bportal\b|missing|upkeep|repay|\bjamb\b|\bnin\b|\bbvn\b|\bloan\b|how\s*to|pending|login|sign\s*in/i.test(t)) return false
  return /^(hi|hii+|hello|hey|heyy+|yo|yoo+|sup|suh|wassup|whatsup|howdy|how\s*far|howfar|how\s*fa|wetin\s*dey|how\s*you\s*dey|good\s*(morning|afternoon|evening)|sharp|correct|i\s*dey|thanks|thank\s*you)(\s+\w+){0,2}$/i.test(t)
}

const WELCOME = `How far, welcome.\n\nI am here to help with **NELFUND**: applications, portal issues, eligibility, upkeep, repayment, and school-record problems.\n\nWhat do you need help with today?`

/** True when the user is continuing the same thread (not starting a brand-new topic). */
export function isConversationalFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!?.]+$/g, '').trim()
  if (!t || t.length > 120) return false
  if (
    /^(yes|yeah|yep|ok|okay|sure|please|continue|more|thanks|thank\s*you|abeg|alright|all\s*right|correct|true|go\s*on)\.?$/i.test(
      t,
    )
  )
    return true
  if (
    /^(alright|okay|ok|so|and|then|now|please|abeg)?\s*(so\s+)?(what|wetin|how|where)\b/i.test(t) &&
    /(next|do|solution|first\s*step|first\s*thing|should\s*i|will\s*i|i\s*go\s*do|wattin|wetin)/i.test(t)
  )
    return true
  if (
    /what\s*(should|will|can)\s*i\s*(do|take)|what'?s\s*(the\s*)?(next|solution|first)|what\s*next|so\s*what|wetin\s*(i\s*)?(go|to)\s*do|wattin\s*i\s*go\s*do|first\s*(step|thing)/i.test(
      t,
    )
  )
    return true
  if (t.length < 40 && /^(and|then|also|but|so)\b/i.test(t)) return true
  return false
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
  if (intent === 'missing-information' || intent === 'school-not-found' || intent === 'institution-verification') {
    return `**First step right now**${inst}\n\n1. Ask ICT / Registry / NELFUND desk to confirm your record is uploaded\n2. Retry ${PORTAL}\n3. Still failing after school confirms -> ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    return `**First step for how far / pending**\n\n1. Open ${PORTAL} and copy the exact status word. I cannot see your file from this chat.\n2. School charges go to the school. No SMS does not mean declined.\n3. Still the same word for weeks: campus NELFUND desk, then ${ESUPPORT}.`
  }
  return `**Next step**\n\n1. Open ${PORTAL} and act on the exact status or error you see\n2. If the portal asks for school confirmation, use your campus NELFUND desk\n3. Still stuck after that -> ${ESUPPORT}\n\n${PORTAL}`
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string | null {
  if (ctx.userText) {
    const extra69 = playbookHourly69(intent, ctx.userText)
    if (extra69) return extra69
    const extra68 = playbookHourly68(intent, ctx.userText)
    if (extra68) return extra68
    const extra67 = playbookHourly67(intent, ctx.userText)
    if (extra67) return extra67
    const extra66 = playbookHourly66(intent, ctx.userText)
    if (extra66) return extra66
    const extra65 = playbookHourly65(intent, ctx.userText)
    if (extra65) return extra65
    const extra64 = playbookHourly64(intent, ctx.userText)
    if (extra64) return extra64
    const extra63 = playbookHourly63(intent, ctx.userText)
    if (extra63) return extra63
    const extra62 = playbookHourly62(intent, ctx.userText)
    if (extra62) return extra62
    const extra61 = playbookHourly61(intent, ctx.userText)
    if (extra61) return extra61
    const extra60 = playbookHourly60(intent, ctx.userText)
    if (extra60) return extra60
    const extra59 = playbookHourly59(intent, ctx.userText)
    if (extra59) return extra59
    const extra58 = playbookHourly58(intent, ctx.userText)
    if (extra58) return extra58
    const extra57 = playbookHourly57(intent, ctx.userText)
    if (extra57) return extra57
    const extra56 = playbookHourly56(intent, ctx.userText)
    if (extra56) return extra56
    const extra55 = playbookHourly55(intent, ctx.userText)
    if (extra55) return extra55
    const extra54 = playbookHourly54(intent, ctx.userText)
    if (extra54) return extra54
    const extra53 = playbookHourly53(intent, ctx.userText)
    if (extra53) return extra53
  }

  if (
    ctx.userText &&
    isGreetingText(ctx.userText) &&
    !(ctx.priorIntent && ctx.priorIntent !== 'unknown' && ctx.priorIntent !== 'official-sources')
  )
    return WELCOME

  if (intent === 'eligibility') return eligibilityAnswer({ userText: ctx.userText || '' })
  if (intent === 'portal-login') {
    const otherEmail = ctx.userText && /another|someone|borrow|broda|brother|sister|friend/i.test(ctx.userText)
    const otp = ctx.userText && /\botp\b|verification\s*code|code\s*(no|not|never)\s*(come|enter)/i.test(ctx.userText)
    if (otherEmail) {
      return `**Use your own email.** Do not borrow a sibling or friend mailbox.\n\n1. Sign **in** at ${SITE} if that email already exists from last year.\n2. New students only: sign **up** with *your* email on ${PORTAL}.\n3. Forgot password: reset on ${SITE}. Do not open a second account.\n4. Still locked: ${ESUPPORT}`
    }
    if (otp) {
      return `**OTP / code no dey come**\n\n1. Check spam and wait a few minutes. Do not open a second account.\n2. Use the official reset / resend on ${SITE}.\n3. Try another network once.\n4. Still nothing: ${ESUPPORT}`
    }
    return `**Log in, do not create a new account** if that email was used before.\n\n1. Sign **in** at ${SITE} with the same email.\n2. Sign **up** only if you never created an account: ${PORTAL}\n3. Forgot password or OTP no dey come: use the reset on ${SITE}. Do not open a second account.\n4. Portal hang, error 500, or page no load: refresh once, try another network, then ${ESUPPORT}.`
  }
  if (intent === 'nin-verification' || intent === 'nin-bvn') {
    return `**NIN / BVN must be yours and must match the name on JAMB.**\n\n1. If you do not have a NIN or BVN yet, finish that first. The portal needs both in *your* name.\n2. Do not type a parent, sibling, or friend number.\n3. If the portal says invalid or name no gree, check spacing and date of birth, then retry ${PORTAL}.\n4. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not open a second account.`
  }
  if (intent === 'official-sources') {
    if (ctx.userText && /portal|link|website|sign\s*(in|up)|login|official|url/i.test(ctx.userText)) {
      return `Official only (bookmark these):\n- **Sign in:** ${SITE}\n- **Sign up / apply:** ${PORTAL}\n- **Support ticket:** ${ESUPPORT}\n- **FAQ:** ${FAQ}\n\nSign in is not the same as sign up, and that is not the same as the loan window.`
    }
    if (
      ctx.priorIntent &&
      ctx.priorIntent !== 'unknown' &&
      ctx.priorIntent !== 'official-sources' &&
      ctx.userText &&
      isConversationalFollowUp(ctx.userText)
    ) {
      return nextStepAdvance(ctx, ctx.priorIntent)
    }
    if (ctx.userText && isConversationalFollowUp(ctx.userText) && ctx.lastAssistant) {
      return nextStepAdvance(ctx, ctx.priorIntent || 'how-to-apply')
    }
    return WELCOME
  }
  if (intent === 'missing-information' || intent === 'school-not-found' || intent === 'institution-verification') {
    const inst = ctx.institutionName ? ` at **${ctx.institutionName}**` : ''
    return `**Missing information / school not on the list**${inst}\n\nUsually the school has not finished uploading your record, or the name / date of birth does not match JAMB and NIN.\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. If faculty, department, or course changed, that is a school-record job, not a second account.\n4. Retry ${PORTAL}. Still failing: ${ESUPPORT}`
  }
  if (intent === 'pending-application') {
    const extra = ctx.userText ? playbookPendingExtras(ctx.userText) : null
    if (extra) return extra
    return `**How far / money never enter** means your file is still waiting. Do not open a second account.\n\n1. Open ${PORTAL} and copy the exact status word. I cannot see your dashboard from this chat.\n2. School charges go to the institution. You can wait weeks with no SMS even after the school is paid.\n3. Upkeep only lands in your bank if you ticked it in the same session, and it can come later than school fees.\n4. I will not invent a pay date. Same word for a long time: campus NELFUND desk, then ${ESUPPORT}.`
  }
  if (intent === 'how-to-apply') {
    if (ctx.userText && /\b(agent|middleman|pay\s*(una|dem|somebody)|who\s*go\s*help\s*me\s*apply)\b/i.test(ctx.userText)) {
      return `**Do not pay an agent.** NELFUND apply is free on the official portal.\n\n1. Sign up only if you never had an account: ${PORTAL}\n2. Already registered last year: sign in at ${SITE}, do not create a second account.\n3. Confirm school record is uploaded. I will not invent a loan deadline.\n4. Stuck: campus NELFUND desk, then ${ESUPPORT}`
    }
    return `**How to apply**\n\n1. Confirm school listed and record uploaded.\n2. Create or sign in at ${PORTAL}.\n3. Complete profile (JAMB, NIN, BVN).\n4. Use Request for Student Loan only when the official loan window is open. Confirm on ${SITE} / ${PORTAL}. I will not invent dates.`
  }
  if (intent === 'what-is-nelfund' || intent === 'nelfund-purpose' || intent === 'nelfund-history') {
    return `**Why NELFUND exists:** the Students Loans (Access to Higher Education) Act set up the Nigeria Education Loan Fund so eligible students in **public** tertiary institutions can get **interest-free** loans for school charges and living costs.\n\nInstitutional charges go to the **school**. Optional monthly upkeep goes to the **student**. It is a loan, not a scholarship.\n\n${SITE} / ${PORTAL}`
  }
  if (intent === 'upkeep' || intent === 'upkeep-payment' || intent === 'upkeep-vs-fees') {
    return `**Upkeep** is living support, separate from school charges.\n\n1. Tick it in the **same** session as institutional charges when the loan window is open.\n2. It goes to the bank account on your profile, not a wallet-only account.\n3. I will not invent a monthly figure or pay date. Confirm on ${PORTAL}.`
  }
  if (intent === 'repayment' || intent === 'gsi') {
    const rumour = ctx.userText && /life\s*(jail|imprison)|jail\s*for\s*life|prison|fake\s*(news|headline)/i.test(ctx.userText)
    if (rumour) {
      return `**Life jail for unpaid student loans is not official NELFUND policy.** Treat circulating newspaper graphics as fake unless you see the same text on ${SITE}.\n\nRepayment, when it starts, follows the Students Loans Act: after the applicable NYSC / study period, and only under the official rules. Confirm on ${SITE} and ${PORTAL}. I will not invent a jail term, start date, or percentage.`
    }
    return `**Repayment** starts after the applicable NYSC or study period under official NELFUND rules, not on a date I invent here.\n\n1. Confirm the exact rule on ${SITE} and ${PORTAL}. I will not invent a start date, percentage, or jail term.\n2. Circulating life-jail graphics are not official unless the same text is on ${SITE}.\n3. GSI / salary deduction, if it applies later, follows the Act, not WhatsApp rumours.\n4. Still studying or serving: you are not in a repayment window I can invent.`
  }
  if (intent === 'current-information' || intent === 'deadline') {
    return `**As of today:** account creation can be OPEN while the **loan and upkeep window is not confirmed** for this cycle.\n\n- Create account, finish profile, sort BVN: ${PORTAL}\n- Already registered last year: sign **in** at ${SITE}, do not open a new account\n\nDo not use social media for opening or closing dates. Confirm on the portal. I will not invent a deadline.`
  }
  if (intent === 'jamb-verification') {
    return `**Invalid JAMB / JAMB wahala**\n\n1. Type the JAMB number exactly as on the admission letter. No extra space.\n2. Name and date of birth must match JAMB and NIN.\n3. Direct Entry still uses a JAMB registration, not a made-up number. Old-year JAMB can fail if CAPS / school record is not aligned.\n4. Still failing: campus NELFUND desk, then ${ESUPPORT}. Do not create a second account.`
  }
  if (intent === 'scam-safety') {
    return `**Safety**\n\n- Never pay an agent.\n- Never share OTP or password.\n- Apply only on ${PORTAL}\n- Tickets: ${ESUPPORT}`
  }
  if (intent === 'contact-support' || intent === 'contact-lookup') {
    return `**Official support only**\n\n- Tickets: ${ESUPPORT}\n- Website: ${SITE}\n- Portal: ${PORTAL}\n\nI will not invent a WhatsApp group, personal phone line, or agent number. If a flyer gives a number, ignore it.`
  }
  if (intent === 'bank-information') {
    return `**Bank on the profile**\n\n1. Use a regular Nigerian bank account in your name. Some wallets (OPay, PalmPay, and similar) get rejected if the portal wants a deposit bank.\n2. Name must match NIN / BVN.\n3. Fix it on ${PORTAL} while signed in. Do not open a second account.\n4. Still failing: ${ESUPPORT}`
  }
  if (intent === 'refund') {
    return `**You already paid school fees yourself.** Institutional charges from NELFUND go to the **school**, not your pocket. Ask the campus bursary / NELFUND desk about any refund process. I will not invent a refund rule. Confirm status on ${PORTAL}.`
  }
  if (intent === 'guarantor') {
    return `**Guarantor / surety:** follow only what ${PORTAL} and ${FAQ} ask for this cycle. I will not invent extra people you must attach. If the form has no guarantor field, do not pay anyone to stand for you.`
  }
  if (intent === 'documents-needed') {
    return `**Documents commonly asked on the portal**\n\n1. JAMB admission letter (usually required).\n2. Clear passport photo or school ID only if the form asks (JPEG or PDF).\n3. NIN, BVN, and a bank account in your name.\n4. Upload on ${PORTAL}. Confirm the live form, do not invent extra papers.`
  }
  if (ctx.userText && isConversationalFollowUp(ctx.userText) && ctx.priorIntent && ctx.priorIntent !== 'unknown') {
    return nextStepAdvance(ctx, ctx.priorIntent)
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
  const t = text.trim().toLowerCase()
  if (isConversationalFollowUp(t)) return false
  if (/^(so\s+)?(what('?s|\s+is)?\s+)?(the\s+)?(solution|next|first\s*step)/i.test(t)) return false
  if (/wetin\s*(i\s*)?(go|to)\s*do|what\s*next|what'?s\s*next/i.test(t)) return false
  return /what\s*is\s*nelfund|how\s*to\s*apply|eligib|missing\s*information|upkeep|repay|login|jamb|scam|is\s*(nelfund|application)\s*open/i.test(t)
}

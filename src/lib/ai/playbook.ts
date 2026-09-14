/**
 * NELFUND AI playbook, adaptive replies that match what the student asked.
 * Clear distinctions: sign-up vs login vs loan application; school fees vs upkeep.
 * Never returns empty/null for residual or unknown intents.
 */

import type { IntentId } from './types'
import { eligibilityAnswer } from './eligibilityAnswer'
import { playbookPortalLogin } from './playbookLogin'
import { playbookPendingExtras } from './playbookPendingExtras'

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
  userText?: string | null
  priorIntent?: IntentId | null
}

const MENU = `Pick one:\n• Sign **up** (new account): ${PORTAL}\n• Sign **in** / login: ${SITE}\n• Loan application (fees / upkeep)\n• Pending / under review status\n• Missing information / school not on list\n• Upkeep vs school fees / repayment\n• Support ticket: ${ESUPPORT}\n\nPidgin or English is fine. Official pages only: ${SITE}`

function isFeesUpkeepContrast(t: string): boolean {
  return /\bupkeep\b|monthly\s*allowance|stipend/.test(t) && /school\s*fees|institutional\s*charges|tuition|school\s*money/.test(t)
}

function feesVsUpkeepAnswer(): string {
  return `**School fees vs upkeep** (two different things)\n\n• **Institutional charges / school fees:** paid **to your school**, not your personal account.\n• **Upkeep:** monthly living allowance paid **to you**, if you applied for it.\n\nOfficial FAQ: apply for **both** at registration. An institutional-only application does not later get upkeep.\n\nAmounts and pay dates only on ${PORTAL} / ${SITE}. FAQ: ${FAQ}`
}

export function playbookAnswer(intent: IntentId, ctx: PlaybookContext): string {
  const t = (ctx.userText || '').trim()

  if (intent === 'eligibility') return eligibilityAnswer({ userText: t })

  if (intent === 'official-sources') {
    return `Official only (bookmark these):\n• **Sign in:** ${SITE}\n• **Sign up / apply:** ${PORTAL}\n• **Support ticket:** ${ESUPPORT}\n• **FAQ:** ${FAQ}\n\nSign in ≠ sign up ≠ loan application. Ignore WhatsApp or Telegram portal links.\n\nIf you pasted a long error, say whether it is login, pending, JAMB, or missing school.`
  }

  if (intent === 'what-is-nelfund') {
    return `**Why NELFUND was created:** the Students Loans (Access to Higher Education) Act set up the Nigeria Education Loan Fund so eligible students in **public** tertiary institutions can get **interest-free** loans for school charges and living costs. Official aim is access to higher education, not a grant.\n\n**What it is:** institutional charges go **to the school**; optional **monthly upkeep** goes **to the student**.\n\nIt is a **loan**, not a scholarship. Official FAQ: repayment starts **2 years after NYSC** (10% of salary / profit).\n\nOfficial site: ${SITE} · Apply: ${PORTAL} · FAQ: ${FAQ}`
  }

  if (intent === 'pending-application') {
    const extra = playbookPendingExtras(t)
    if (extra) return extra
    if (/\b(approv(ed|al)|successful)\b/i.test(t) && /(no|never|not|nothing|no\s*see|no\s*alert).{0,30}(money|upkeep|alert|pay|enter|drop)|but\s*(no|never|nothing)/i.test(t)) {
      return `**Approved / successful on the portal does not mean upkeep is already in your bank.**\n\n1. Open ${PORTAL} and copy the exact status word plus whether **institutional charges** show paid to the school.\n2. School fees go to the **institution first**. Upkeep (only if you ticked it in the same session) can arrive later.\n3. Confirm the account number on the profile is a real bank account, not a wallet.\n4. I will not invent a pay date. Same status for a long time? Ticket ${ESUPPORT} with name, school, and that status word.`
    }
    if (/institution(al)?\s*(fee|charge)|school\s*(don|has|have)\s*(receive|collect|get)|paid\s*to\s*(the\s*)?school/i.test(t)) {
      return `**School paid, you still waiting** is still a status question.\n\n1. Institutional charges go **to the school first**. That is not the same as upkeep in your account.\n2. Open ${PORTAL} and copy the exact status word plus whether upkeep is listed.\n3. Upkeep only if you ticked it in the **same** registration session.\n4. I will not invent when your alert will drop. Long same-word wait: ticket ${ESUPPORT}.`
    }
    if (/how\s*(do\s*i|i\s*go|can\s*i)\s*(know|confirm|see)/i.test(t)) {
      return `**How to confirm payment or approval**\n\n1. Only ${PORTAL} shows *your* status word (Pending, Under review, Approved, Declined).\n2. Institutional charges paid = money to the **school**, not always an alert to you.\n3. Upkeep alert comes to the account on your profile, and only if you applied for upkeep.\n4. I cannot see your file. Long wait on the same word: ticket ${ESUPPORT}.`
    }
    if (/how\s*long|when\s*(will|go)\s*(money|upkeep|loan|alert|they|dem|una)|when\s*(dem|they|una)\s*(go\s*)?pay|pay\s*(my\s*)?(school\s*)?fees/i.test(t)) {
      return `**How long / when money or school fees enter** is a wait question, not a new application.\n\n1. Only ${PORTAL} shows *your* status word. There is no public SLA I can invent.\n2. Institutional charges go to the **school first**. Upkeep (if you ticked it) can land later.\n3. Same word for a long time? Ticket ${ESUPPORT} with name, school, and that exact status.\n\nI will not invent a pay date or batch date.`
    }
    if (/already\s*appl|i\s*don\s*apply|i\s*have\s*appl|submitted|money\s*no\s*drop|when\s*(will|go)\s*(they|dem)|next\s*(batch|payment)|second\s*batch|re-?apply/i.test(t)) {
      return `You already applied: that is a **wait / status** question, not a new sign-up.\n\n1. Open ${PORTAL} and copy the exact status word (Pending, Under review, Approved, Declined).\n2. Institution charges go to the **school first**. Upkeep (if you ticked it) can arrive later.\n3. I will not invent a pay date or a batch date. If the same status sits for a long time, ticket ${ESUPPORT} with name, school, and that status word.`
    }
    return `**How far / pending / money never enter** is not a rejection.\n\nDo this now:\n1. Open ${PORTAL} and copy the exact status word (Pending, Under review, Approved, Declined).\n2. Check whether your school has uploaded your record. If the school is missing, ask the campus NELFUND desk first.\n3. Upkeep can arrive after the institution is paid. Look at the portal before assuming nobody paid you.\n4. Still the same after a long wait? Ticket: ${ESUPPORT} with your name, school, and the portal status word.\n\nI cannot see your personal file and I will not invent a pay date.`
  }

  if (intent === 'jamb-verification') {
    return `**JAMB / profile verification failed** is usually a format or data mismatch, not a ban.\n\n1. Type the JAMB number **exactly** as on your JAMB profile (no extra spaces or letters).\n2. Direct Entry students still need a JAMB number (official FAQ).\n3. If the portal says *invalid JAMB number format*, fix the number and retry, do not create a second account.\n4. Still failing? Ticket: ${ESUPPORT} and keep a screenshot.\n\nPortal: ${PORTAL}`
  }

  if (intent === 'current-information' || intent === 'deadline') {
    if (/why\s+(was|is|dem|they|una|fg|government)|purpose|wetin\s*(be|mean|nelfund|make)|what\s*(is|does)\s*(this\s+)?nelfund|nelfund\s+(mean|meaning|purpose)|na\s+wetin/i.test(t)) {
      return playbookAnswer('what-is-nelfund', ctx)
    }
    if (!t) {
      return `Empty message received, I can still help.\n\n${MENU}\n\nPortal: ${PORTAL} · Support: ${ESUPPORT}`
    }
    const vagueOnly = /^(help|abeg|stuck|wahala|what\s*next|empty|una\s*fit|reply|are\s*you\s*there|this\s*thing|i\s*no\s*sabi|confused|pls+|please)[.!? ]*$/i.test(t)
    if (vagueOnly) {
      return `I can still help even if the question is short or mixed (Pidgin is fine).\n\n${MENU}\n\nIf you pasted a portal error, say **login**, **pending**, **JAMB**, or **missing school**. I will not invent NELFUND policy or dates.`
    }
    return `For **live** open/closed and dates, use the home status card and ${PORTAL}.\n\nI only report what official pages support. I will not invent a closing date.\n\nSign **up** and loan window are different. Confirm on ${PORTAL} / ${SITE}.`
  }

  if (intent === 'upkeep' || intent === 'school-fees') {
    if (isFeesUpkeepContrast(t)) return feesVsUpkeepAnswer()
  }

  if (intent === 'upkeep') {
    if (/hostel|accommodation|accomodation|house\s*rent/i.test(t)) {
      return `**Hostel / rent is not a separate NELFUND product.**\n\n1. Institutional charges go **to the school**.\n2. Monthly **upkeep** (only if you ticked it in the same session) is the living-cost line paid **to you**.\n3. NELFUND does not run a hostel allocation desk in this chat.\n4. Amounts and pay dates: ${PORTAL} · FAQ: ${FAQ}`
    }
    if (/how\s*much|amount|wetin\s*(dem|they)\s*dey\s*(pay|give)|20,?000/i.test(t)) {
      return `**How much:** this guide's currently confirmed upkeep figure is **₦20,000 per month**, paid to you only if you applied for upkeep.\n\nTreat other figures on WhatsApp as unconfirmed. Institutional charges (school fees) are a different amount paid **to the school**, not to you.\n\nLive amount and pay date: ${PORTAL} · FAQ: ${FAQ}. I will not invent a new official figure.`
    }
    return `**Upkeep** is the monthly living allowance paid **to you** if you applied for it.\n\nIt is separate from school fees (paid to the school). Official FAQ: apply for institutional charges and upkeep in the same registration session.\n\nAmounts and payment dates only on ${PORTAL}. FAQ: ${FAQ}`
  }

  if (intent === 'school-fees') {
    if (/already\s*paid|i\s*don\s*pay|i\s*have\s*paid/i.test(t)) {
      return `Paying school fees yourself does **not** block a NELFUND application.\n\nInstitutional charges still go **to the school** if NELFUND later approves. Confirm live on ${PORTAL}. Upkeep is separate and only if you ticked it in the same session.\n\nFAQ: ${FAQ}`
    }
    return `**Institutional charges / school fees** go **to your school**, not your personal account.\n\nUpkeep is different: monthly to you.\n\nIf you already paid fees yourself, still apply if eligible, NELFUND does not replace that decision on this chat. Confirm live on ${PORTAL}. FAQ: ${FAQ}`
  }

  if (intent === 'repayment') {
    return `**Repayment (official FAQ):** due **2 years after NYSC**. Employers deduct **10% of salary**; self-employed remit 10% of monthly profit. You may pay earlier.\n\nNo job after that window: notify NELFUND with a sworn affidavit every 3 months.\n\nViral life-imprisonment claims for unpaid loans are **not** official policy as stated on nelf.gov.ng FAQ. Default can bring penalties / credit damage, read the FAQ, do not trust WhatsApp posters.\n\nFAQ: ${FAQ}`
  }

  if (intent === 'gsi') {
    return `**GSI** (Global Standing Instruction) is a bank instruction some lenders use so repayments can be collected from your accounts when due.\n\nNELFUND repayment on the official FAQ is: 10% of salary at source after the NYSC + 2 years window, or 10% of profit if self-employed. Confirm any GSI checkbox **on the portal itself** before you tick it.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`
  }

  if (intent === 'loan-or-scholarship') {
    return `**Loan, not scholarship.** NELFUND is an interest-free student **loan** under the Students Loans Act. It is not a grant and not free money.\n\n1. School charges go to your **institution**.\n2. Upkeep (only if you ticked it in the same application) goes to **your** bank account.\n3. Official FAQ: repayment starts **2 years after NYSC** (10% of salary or profit).\n4. Do not pay an agent to convert it to a scholarship.\n\nFAQ: ${FAQ} · Portal: ${PORTAL} · Site: ${SITE}`
  }

  if (intent === 'missing-information' || intent === 'school-not-found') {
    const school = ctx.institutionName ? ` You mentioned **${ctx.institutionName}**.` : ''
    if (/^(unilag|lasu|oou|yabatech|unilorin|uniben|oau|unijos|noun|futo|futa|abu|my\s*school)[.!? ]*$/i.test(t)) {
      return `School name noted.${school}\n\nIf the portal says **missing information** or the school is not on the list:\n1. Confirm it is a **public** institution on the NELFUND list.\n2. Ask the campus NELFUND desk whether your record is uploaded.\n3. Retry ${PORTAL}. Still missing? Ticket ${ESUPPORT}.\n\nIf you meant how to apply instead, say **sign up** or **next step**.`
    }
    return `**Missing information / school not on the list** usually means the institution has not finished uploading your record, or the name does not match NELFUND's public-institution list.${school}\n\n1. Confirm you attend a **public** university, poly, COE, or vocational school.\n2. Ask your school's NELFUND desk whether your data is uploaded.\n3. Retry on ${PORTAL}. If the school still does not appear, ticket: ${ESUPPORT}\n\nPrivate institutions are not in the current public-institution scheme described on nelf.gov.ng.`
  }

  if (intent === 'how-to-apply') {
    if (/(cannot|can\s*not|e\s*no\s*gree|no\s*gree)\s*(submit|send)|submit\s*(button\s*)?(no|not|never)\s*(gree|work)|form\s*(no|not)\s*(gree|submit)/i.test(t)) {
      return `**If the form will not submit**\n\n1. Use ${PORTAL} (new) or ${SITE} (existing login). Do not open a second account.\n2. Finish every required profile field: NIN, BVN, JAMB number, admission / matric, bank account.\n3. If a red line appears, copy the **exact** sentence (invalid JAMB, missing school, session expired).\n4. Tick institutional charges and upkeep in the **same** session before submit.\n5. Still blocked? Ticket ${ESUPPORT} with that exact sentence and a screenshot.`
    }
    if (/what\s*(do\s*i\s*do\s*)?next|wetin\s*(i\s*)?go\s*do|after\s*(i\s*)?(register|sign\s*up|create)|then\s*what|next\s*step|i\s*don\s*(create|register)/i.test(t)) {
      return `**Next after the account**\n1. Sign in only if the account already exists: ${SITE}\n2. Finish **profile**: NIN, BVN, JAMB number, admission / matric.\n3. Submit **institutional charges**. If you need living money, tick **upkeep in the same session**.\n4. After submit, track the exact status word on ${PORTAL}. That is not the same as creating the account.\n\nStuck on a red error? Send the exact portal sentence (JAMB invalid, school missing, or pending).`
    }
    if (/re-?apply|apply\s*(again|twice|two\s*times)|second\s*application|another\s*application/i.test(t)) {
      return `**Apply again / second application**\n\n1. Do **not** open a second account if one already exists. Sign **in** at ${SITE}.\n2. If this cycle still shows Pending / Under review, wait on that file - a duplicate does not speed pay.\n3. A new academic session is a live portal question: check ${PORTAL}, I will not invent the next window date.\n4. Same status for a long time? Ticket ${ESUPPORT} with name, school, and the exact status word.`
    }
    if (/screenshot|screen\s*shot|picture|photo|image/i.test(t)) {
      return `I can work from a short description if the picture does not load.\n\nTell me the **exact portal sentence** you see (Pending, Under review, invalid JAMB, school not on list, cannot submit). Then I route that error - not a generic template.\n\nPortal: ${PORTAL} · Ticket: ${ESUPPORT}`
    }
    if (/\bnin\b|\bbvn\b/i.test(t)) {
      return `**NIN and BVN** are profile fields on the application, not a separate loan.\n\n1. Open ${PORTAL} (new account) or ${SITE} (existing login).\n2. Enter NIN and BVN exactly as issued. Do not send them in this chat.\n3. Then add JAMB + admission / matric and submit institutional charges + optional upkeep together.\n\nMismatch after several tries: ticket ${ESUPPORT} with a screenshot, not a second account.`
    }
    return `**How to apply (step by step)**\n1. New account only: ${PORTAL}\n2. Fill profile: NIN, BVN, JAMB registration number, admission / matric.\n3. Submit **institutional charges** (paid to the school). If you need monthly living money, apply for **upkeep in the same session**.\n4. After submit, watch status on the portal. Approval notice also shows in profile (official FAQ).\n\nExisting account = sign **in** at ${SITE}, not another sign-up. I will not invent a closing date here.`
  }

  if (intent === 'portal-login') {
    return playbookPortalLogin(t)
  }

  if (intent === 'scam-safety') {
    return `**Scam warning:** NELFUND does **not** collect application fees through WhatsApp, Telegram, or random agents.\n\n• Only use ${SITE} and ${PORTAL}\n• Never send OTP, BVN, or NIN to private numbers\n• Support ticket: ${ESUPPORT}\n\nIf someone asked you to pay to process a loan, stop and use the official portal only.`
  }

  if (intent === 'documents-needed') {
    if (/phone|email|profile|number/i.test(t) && /change|edit|update|wrong/i.test(t)) {
      return `**Change phone / email / profile**\n\n1. Sign **in** at ${SITE}. Do not create a second account to fix a typo.\n2. Open profile and edit the field the portal allows.\n3. Do **not** send NIN, BVN, or OTPs in this chat.\n4. If the field is locked, ticket ${ESUPPORT} with a screenshot of the locked field only.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`
    }
    if (/bank|account\s*number|wrong\s*account|update\s*(my\s*)?(bank|account|profile)/i.test(t)) {
      return `**Bank / profile details**\n\n1. Sign **in** at ${SITE} (do not create a second account).\n2. Open profile and correct the bank account used for upkeep. Use a real bank account, not a wallet, if the portal asks for one.\n3. Do **not** send account numbers, BVN, or NIN in this chat.\n4. If the portal will not save the change, ticket ${ESUPPORT} with a screenshot of the error only.\n\nPortal: ${PORTAL} · FAQ: ${FAQ}`
    }
    return `**Typical portal profile items** (confirm live on the portal):\n• NIN and BVN\n• JAMB registration number\n• Admission / matric details\n• Bank account for upkeep if you apply for it.\n\nExact document list can change, use ${PORTAL} and FAQ: ${FAQ}. Do not email BVN/NIN to strangers.`
  }

  if (intent === 'contact-support' || intent === 'email-draft') {
    return `Official support:\n• Ticket: ${ESUPPORT}\n• Site: ${SITE}\n• Portal: ${PORTAL}\n• FAQ: ${FAQ}\n\nSay your full name, school, JAMB number, and the exact portal error. Do not send BVN/NIN in random chats.`
  }

  if (intent === 'unknown' || !intent) {
    return `I am here for NELFUND, pick a lane so I answer the right thing:\n\n${MENU}\n\nPortal: ${PORTAL} · Ticket: ${ESUPPORT}`
  }

  return `${MENU}\n\nCheck live status on ${PORTAL}. Reply with the exact portal message or whether you mean **sign up**, **login**, **loan application**, **pending**, **school fees**, or **upkeep**.`
}

export function isNearDuplicate(prev: string, next: string): boolean {
  if (!prev || !next) return false
  const a = prev.toLowerCase().replace(/\s+/g, ' ').slice(0, 180)
  const b = next.toLowerCase().replace(/\s+/g, ' ').slice(0, 180)
  return a === b || (a.length > 40 && b.includes(a.slice(0, 40)))
}

export function isNewUserAsk(text: string): boolean {
  return /\b(new\s*question|different\s*issue|another\s*problem|something\s*else)\b/i.test(text)
}

export function nextStepAdvance(ctx: PlaybookContext, intent: IntentId): string {
  if (intent === 'pending-application') return `Next: open ${PORTAL} and tell me the exact status word (Pending, Under review, Approved).`
  if (intent === 'missing-information' || intent === 'school-not-found') return 'Which school do you attend? (e.g. UNILAG, LASU, OOU, YABATECH), that lets me narrow the next step.'
  if (intent === 'how-to-apply') return 'Are you stuck on **sign up**, **profile**, or **submit loan**? Those are different steps.'
  if (intent === 'portal-login') return 'Still on login, wrong password, session expired, or blank page?'
  return `Portal: ${PORTAL} · Ticket: ${ESUPPORT}`
}

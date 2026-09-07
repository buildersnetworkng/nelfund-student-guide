/**
 * NELFUND AI — primary conversational intelligence (owned, in-repo).
 * Greetings never swallow real questions. Intent + playbook + multi-turn.
 */

import { getInstitution } from '../data'
import { buildEscalationPlan, resolveInstitutionFromText } from '../escalation'
import { answerQuestion } from './answer'
import { resolveCapability } from './capabilities'
import { buildCurrentInformationAnswerLive } from './current'
import { draftSupportEmail, describeContactLookup } from './generate'
import { classifyIntent } from './intent'
import { isNearDuplicate, isNewUserAsk, nextStepAdvance, playbookAnswer } from './playbook'
import { institutionAskPrompt, needsInstitutionEarly } from './supportGates'
import type {
  AgentCapability,
  ConversationTurn,
  GroundedAnswer,
  IntentId,
} from './types'
import { understandPortalText } from './screenshotUnderstand'

export type ConversationPhase = 'open' | 'clarify' | 'gather' | 'act' | 'resolve'

export interface ConversationSlots {
  institutionId: string | null
  institutionName: string | null
  intent: IntentId | null
  exactError: string | null
  studentName: string | null
  matric: string | null
  jamb: string | null
  nin: string | null
  problemSummary: string | null
  objective: string | null
  phase: ConversationPhase
  awaitingInstitution: boolean
  pendingClarify: string | null
  lastCapability: AgentCapability | null
  errorConfirmed: boolean
  actionsTaken: string[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  text: string
  answer?: GroundedAnswer | null
  imagePreview?: string | null
  isFollowUp?: boolean
  timestamp: number
}

export interface AgentTurnResult {
  messages: ChatMessage[]
  slots: ConversationSlots
  diagnosed: boolean
  capability: AgentCapability
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createInitialSlots(uiInstitutionId?: string | null): ConversationSlots {
  const institutionId = uiInstitutionId || null
  let institutionName: string | null = null
  if (institutionId) {
    const inst = getInstitution(institutionId)
    if (inst) institutionName = inst.name
  }
  return {
    institutionId,
    institutionName,
    intent: null,
    exactError: null,
    studentName: null,
    matric: null,
    jamb: null,
    nin: null,
    problemSummary: null,
    objective: null,
    phase: 'open',
    awaitingInstitution: false,
    pendingClarify: null,
    lastCapability: null,
    errorConfirmed: false,
    actionsTaken: [],
  }
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: uid('sys'),
    role: 'assistant',
    text: 'Ask about NELFUND in your own words — portal errors, school contacts, drafts, eligibility, or current status.',
    timestamp: Date.now(),
  }
}

export function extractErrorSignals(text: string): string | null {
  const m =
    text.match(/missing\s*information[^.]{0,80}/i) ||
    text.match(/record\s*not\s*found[^.]{0,40}/i) ||
    text.match(/no\s*school\s*info(?:rmation)?[^.]{0,40}/i)
  return m ? m[0].trim() : null
}

function mergeQuery(user: string, ocr: string | null): string {
  if (user && ocr) return `${user}\n${ocr}`
  return user || ocr || ''
}

function applyInstitutionToSlots(
  slots: ConversationSlots,
  text: string,
  uiInstitutionId: string | null,
): ConversationSlots {
  const next = { ...slots }
  if (uiInstitutionId && !next.institutionId) {
    next.institutionId = uiInstitutionId
    const inst = getInstitution(uiInstitutionId)
    if (inst) next.institutionName = inst.name
  }
  const found = resolveInstitutionFromText(text)
  if (found) {
    next.institutionId = found
    const inst = getInstitution(found)
    if (inst) next.institutionName = inst.name
    next.awaitingInstitution = false
    next.pendingClarify = next.pendingClarify === 'institution' ? null : next.pendingClarify
  }
  return next
}

function lightAnswer(
  intent: IntentId,
  text: string,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources'] },
): GroundedAnswer {
  return {
    hasEvidence: true,
    intent,
    confidence: 0.88,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    whatThisMeans: null,
    nextActions: opts?.next || [],
    clarifyingQuestions: [],
    evidence: [],
    sources: opts?.sources || [
      { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
      { id: 'site', label: 'NELFUND website', url: 'https://nelf.gov.ng/', official: true },
      { id: 'esupport', label: 'NELFUND eSupport', url: 'https://nelfund.esupport.ng/create', official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
  }
}

function lastAssistantText(history: ConversationTurn[]): string {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'assistant') return history[i].text || ''
  }
  return ''
}

function userTurnCount(history: ConversationTurn[]): number {
  return history.filter((h) => h.role === 'user').length
}

function isShortFollowUp(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (t.length > 70) return false
  if (
    /\b(what\s*is\s*nelfund|how\s*to\s*apply|missing\s*information|upkeep|repay|guarantor|private\s*uni|interest)\b/i.test(
      t,
    ) &&
    t.length > 25
  )
    return false
  if (/\?|bvn|account|open|expire|deadline|apply|nelfund|missing|portal|school|loan/i.test(t) && t.length > 35)
    return false
  return /^(yes|yeah|yep|ok|okay|sure|please|do\s*it|go\s*ahead|draft\s*(it|the\s*email|one)|send\s*it|what\s*next|and\s*then|continue|more|tell\s*me\s*more|about\s*that|that\s*one|same\s*issue|still|thanks|thank\s*you|na\s*im|abeg|ehn|ehe|hmm|okay\s*what)\.?$/i.test(
    t,
  ) || (t.length < 25 && /^(and|then|also|but|so)\b/i.test(t))
}

function isGreeting(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!.,?]+$/g, '').trim()
  if (!t || t.length > 80) return false
  if (
    /nelfund|explain|eligib|\bapply\b|application|\bportal\b|missing|upkeep|repay|\bjamb\b|\bnin\b|\bbvn\b|\bscam\b|\botp\b|matric|\bloan\b|scholarship|document|school\s*(not|fee)|what\s*is|wetin\s*be|overview|describe|teach\s*me|tell\s*me\s*(about|everything)|break\s*down|about\s*(this\s+)?nelf|how\s*to|pending|reject/i.test(
      t,
    )
  ) {
    return false
  }
  if (
    /^(hi|hii+|hello|hey|heyy+|hiya|yo|yoo+|sup|wassup|whatsup|howdy|hi\s*there|hello\s*there)(\s+(there|man|bro|sis|guys|guy|dear|boss|sir|ma|pal|fam))?$/i.test(
      t,
    )
  )
    return true
  if (/^(good\s*)?(morning|afternoon|evening|day|night)(\s*(sir|ma|boss|bro|sis|man))?$/i.test(t))
    return true
  if (
    /^(how\s*far|howfar|how\s*fa|howfa|wetin\s*dey|wetin\s*dey\s*happen|how\s*you\s*dey|how\s*una\s*dey|how\s*is\s*it|how\s*are\s*you|how\s*r\s*you|whats?\s*up|what'?s\s*up|wass?up|what\s*is\s*up|how\s*you|you\s*good|you\s*dey|na\s*how|kedu|bawo|sannu|salam|peace)(\s*(nah|now|o|oh|abeg|man|bro|sis))?$/i.test(
      t,
    )
  )
    return true
  if (/^(thanks|thank\s*you|tenki|merci|bless\s*you)(\s*(you|so\s*much))?$/i.test(t) && t.length < 30)
    return true
  if (
    /^(hi|hello|hey|how\s*far|howfar|wassup|whatsup|sup|yo|good\s*(morning|afternoon|evening))(\s+(man|bro|sis|sir|ma))?$/i.test(
      t,
    )
  )
    return true
  return false
}

function greetingReply(): string {
  return `How far — welcome.\n\nI am here to help with **NELFUND**: applications, portal issues, eligibility, upkeep, repayment, and school-record problems.\n\nWhat do you need help with today?`
}

function isOffTopic(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t || t.length < 2) return false
  if (isGreeting(text)) return false
  if (
    /nelfund|nelf\.gov|portal\.nelf|student\s*loan|upkeep|jamb|\bnin\b|\bbvn\b|matric|missing\s*info|institutional\s*charge|school\s*fees?|guarantor|\bgsi\b|nysc|esupport|polytechnic|university|college\s*of\s*education|tertiary|loan.*school|school.*loan|youtube|video|tutorial|apply|website|portal|login|sign\s*in|registration|application|loan\s*window|eligibility|eligible|matriculation|100\s*-?\s*level|200\s*-?\s*level|official\s*email|support\s*email|which\s*site|which\s*website/i.test(
      t,
    )
  ) {
    return false
  }
  if (
    /\b(weather|football|soccer|nba|champions\s*league|premier\s*league|match|score|movie|netflix|recipe|cook|girlfriend|boyfriend|dating|love\s*letter|crypto|bitcoin|forex|game\s*pass|playstation|iphone\s*price|android|whatsapp\s*hack|exam\s*malpractice|assignment\s*write|essay\s*write|poem|joke|riddle|horoscope|lottery|betting|sport\s*bet|politics|election|president|music|song|lyrics|translate\s*this|write\s*code|python\s*script|javascript)\b/i.test(
      t,
    )
  ) {
    return true
  }
  if (
    t.length > 40 &&
    !/school|student|loan|fee|portal|apply|admission|university|poly|college|education|nelfund|matric|jamb|nin|bvn|youtube|video/i.test(
      t,
    )
  ) {
    return true
  }
  return false
}

function offTopicReply(): string {
  return `I understand your request, but I can only help with **NELFUND** — the Nigerian Education Loan Fund (applications, portal issues, eligibility, upkeep, repayment, and school-record problems).\n\nWould you like help with any of these?\n• How to apply or log in\n• Missing information on the portal\n• Eligibility / documents\n• Upkeep or repayment\n• Contacting your school or NELFUND support\n\nJust tell me what you need in a short sentence.`
}

function finalize(
  userMsg: ChatMessage,
  slots: ConversationSlots,
  intent: IntentId,
  text: string,
  capability: AgentCapability,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources']; escalation?: GroundedAnswer['escalation'] },
): AgentTurnResult {
  const answer = lightAnswer(intent, text, opts)
  if (opts?.escalation) answer.escalation = opts.escalation
  slots.intent = intent
  slots.phase = slots.awaitingInstitution ? 'clarify' : 'resolve'
  slots.lastCapability = capability
  return {
    messages: [
      userMsg,
      { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
    ],
    slots,
    diagnosed: true,
    capability,
  }
}

export async function processUserTurn(opts: {
  userText: string
  ocrText?: string | null
  imagePreview?: string | null
  uiInstitutionId?: string | null
  slots: ConversationSlots
  history?: ConversationTurn[]
}): Promise<AgentTurnResult> {
  const history = opts.history || []
  const rawUser = (opts.userText || '').trim()
  const ocr = opts.ocrText || null
  const combined = mergeQuery(rawUser, ocr)
  const prevAsst = lastAssistantText(history)
  const turnIndex = userTurnCount(history)
  const priorIntent = opts.slots.intent
  const wasAwaitingInstitution = opts.slots.awaitingInstitution || opts.slots.pendingClarify === 'institution'

  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
    imagePreview: opts.imagePreview || null,
    timestamp: Date.now(),
  }

  if (!ocr && rawUser && isGreeting(rawUser)) {
    return finalize(userMsg, { ...opts.slots }, 'official-sources', greetingReply(), 'conversation')
  }

  if (!ocr && rawUser && isOffTopic(rawUser)) {
    return finalize(userMsg, { ...opts.slots }, 'official-sources', offTopicReply(), 'conversation')
  }

  // Early factual route: never show troubleshooting menu for clear knowledge questions
  {
    const earlyIntent = classifyIntent(combined || rawUser).intent
    const early = playbookAnswer(earlyIntent !== 'unknown' ? earlyIntent : 'unknown', {
      institutionName: opts.slots.institutionName,
      problemSummary: opts.slots.problemSummary,
      exactError: opts.slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: combined || rawUser,
      priorIntent: opts.slots.intent,
    })
    if (
      early &&
      (/\*\*|Official|NELFUND|Portal:|zero interest|Act, 2023|How to apply|Missing information|Upkeep|Repayment|Eligibility|Safety|Guarantor|Private institutions|School not showing/i.test(
        early,
      ) ||
        early.length > 80)
    ) {
      let intentGuess: IntentId =
        earlyIntent !== 'unknown' ? earlyIntent : opts.slots.intent || 'unknown'
      if (intentGuess === 'unknown') {
        if (/Act, 2023|who established|When \/ who established/i.test(early)) intentGuess = 'nelfund-history'
        else if (/Purpose of NELFUND/i.test(early)) intentGuess = 'nelfund-purpose'
        else if (/\*\*NELFUND\*\* is the/i.test(early)) intentGuess = 'what-is-nelfund'
        else if (/How to apply/i.test(early)) intentGuess = 'how-to-apply'
        else if (/Missing information/i.test(early)) intentGuess = 'missing-information'
        else if (/School not showing/i.test(early)) intentGuess = 'school-not-found'
        else if (/Invalid JAMB|JAMB Profile/i.test(early)) intentGuess = 'jamb-verification'
        else if (/pending|under review/i.test(early)) intentGuess = 'pending-application'
        else if (/Repayment|NYSC/i.test(early)) intentGuess = 'repayment'
        else if (/Upkeep/i.test(early)) intentGuess = 'upkeep'
        else if (/zero interest/i.test(early)) intentGuess = 'what-is-nelfund'
        else if (/Log in \/ sign in|Sign up/i.test(early)) intentGuess = 'portal-login'
        else if (/Never pay|scam|OTP/i.test(early)) intentGuess = 'scam-safety'
        else if (/Eligibility/i.test(early)) intentGuess = 'eligibility'
      }
      return finalize(userMsg, { ...opts.slots, intent: intentGuess }, intentGuess, early, 'conversation', {
        next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/', 'https://nelfund.esupport.ng/create'],
      })
    }
  }

  const slots: ConversationSlots = applyInstitutionToSlots(
    { ...opts.slots, actionsTaken: [...(opts.slots.actionsTaken || [])] },
    combined,
    opts.uiInstitutionId ?? null,
  )

  const err = extractErrorSignals(combined)
  if (err) {
    slots.exactError = err
    slots.errorConfirmed = true
    slots.problemSummary = err
    if (slots.pendingClarify === 'exact-error') slots.pendingClarify = null
  }

  if (wasAwaitingInstitution && slots.institutionId && slots.institutionName) {
    slots.awaitingInstitution = false
    slots.pendingClarify = null
    const resumeIntent: IntentId =
      priorIntent && priorIntent !== 'unknown' ? priorIntent : 'missing-information'
    try {
      const esc = buildEscalationPlan(resumeIntent, slots.institutionId, {
        errorMessage: slots.exactError || slots.problemSummary,
      })
      const pb =
        playbookAnswer(resumeIntent, {
          institutionName: slots.institutionName,
          problemSummary: slots.problemSummary,
          exactError: slots.exactError,
          turnIndex,
          lastAssistant: prevAsst,
          userText: `${combined} ${slots.problemSummary || ''}`,
          priorIntent,
        }) ||
        `Thanks — I have **${slots.institutionName}** on this conversation.\n\nFor your issue, start with the school ICT / Registry / NELFUND desk, then use https://nelfund.esupport.ng/create if the portal still fails after the school confirms your record.\n\nPortal: https://portal.nelf.gov.ng/\nSay **“draft the email”** if you want a message for the school.`
      const answer = lightAnswer(resumeIntent, pb, {
        next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create', 'https://nelf.gov.ng/'],
      })
      if (esc) answer.escalation = esc
      slots.intent = resumeIntent
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'conversation',
      }
    } catch {
      /* fall through */
    }
  }

  {
    const screen = understandPortalText(combined || ocr || rawUser || '')
    if (screen && (screen.kind === 'dashboard' || screen.kind === 'error' || screen.kind === 'login')) {
      if (screen.exactError) {
        slots.exactError = screen.exactError
        slots.problemSummary = screen.exactError
        slots.errorConfirmed = true
      }
      let explanation = screen.explanation
      if (!isNewUserAsk(combined) && isNearDuplicate(prevAsst, explanation)) {
        explanation = nextStepAdvance(
          {
            institutionName: slots.institutionName,
            problemSummary: slots.problemSummary,
            exactError: slots.exactError,
            turnIndex,
            lastAssistant: prevAsst,
            userText: combined,
            priorIntent,
          },
          screen.kind === 'error' ? 'missing-information' : 'current-information',
        )
      }
      const intentScr: IntentId = screen.kind === 'error' ? 'missing-information' : 'current-information'
      if (needsInstitutionEarly(intentScr) && !slots.institutionId) {
        slots.awaitingInstitution = true
        slots.pendingClarify = 'institution'
        explanation = `${explanation}\n\n${institutionAskPrompt(intentScr)}`
      }
      return finalize(userMsg, slots, intentScr, explanation, 'conversation', {
        next: screen.nextActions.slice(0, 4),
      })
    }
  }

  const intentMeta = classifyIntent(combined || rawUser, history)
  let intent: IntentId = intentMeta.intent
  if (
    priorIntent &&
    priorIntent !== 'unknown' &&
    (intent === 'unknown' ||
      (rawUser.length < 60 && isShortFollowUp(rawUser)) ||
      (rawUser.length < 40 && intentMeta.confidence < 0.7))
  ) {
    if (!isNewUserAsk(rawUser)) intent = priorIntent
  }
  slots.intent = intent
  if (intentMeta.problem) slots.problemSummary = slots.problemSummary || intentMeta.problem

  const capability = resolveCapability(intent, combined || rawUser)
  slots.lastCapability = capability

  if (intent === 'contact-support' || intent === 'official-sources') {
    const pb = playbookAnswer(intent, {
      institutionName: slots.institutionName,
      problemSummary: slots.problemSummary,
      exactError: slots.exactError,
      turnIndex,
      lastAssistant: prevAsst,
      userText: combined,
      priorIntent,
    })
    if (pb) {
      return finalize(userMsg, slots, intent, pb, capability, {
        next: ['https://nelfund.esupport.ng/create', 'https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'],
      })
    }
  }

  if (needsInstitutionEarly(intent) && !slots.institutionId) {
    slots.awaitingInstitution = true
    slots.pendingClarify = 'institution'
    const brief =
      playbookAnswer(intent, {
        institutionName: null,
        problemSummary: slots.problemSummary,
        exactError: slots.exactError,
        turnIndex,
        lastAssistant: prevAsst,
        userText: combined,
        priorIntent,
      }) || null
    const ask = institutionAskPrompt(intent)
    const firstLine = brief ? brief.split('\n\n')[0] : null
    const text =
      firstLine && turnIndex === 0 && firstLine.length < 280
        ? `${firstLine}\n\n${ask}`
        : ask
    return finalize(userMsg, slots, intent, text, capability, {
      next: ['Share your school name', 'https://portal.nelf.gov.ng/'],
    })
  }

  const pb = playbookAnswer(intent, {
    institutionName: slots.institutionName,
    problemSummary: slots.problemSummary,
    exactError: slots.exactError,
    turnIndex,
    lastAssistant: prevAsst,
    userText: combined,
    priorIntent,
  })
  if (pb) {
    let text = pb
    if (!isNewUserAsk(combined) && isNearDuplicate(prevAsst, text)) {
      text = nextStepAdvance(
        {
          institutionName: slots.institutionName,
          problemSummary: slots.problemSummary,
          exactError: slots.exactError,
          turnIndex,
          lastAssistant: prevAsst,
          userText: combined,
          priorIntent,
        },
        intent,
      )
    }
    let escalation = null as GroundedAnswer['escalation']
    try {
      if (slots.institutionId) {
        escalation = buildEscalationPlan(intent, slots.institutionId, {
          errorMessage: slots.exactError || slots.problemSummary,
        })
      }
    } catch {
      /* ignore */
    }
    return finalize(userMsg, slots, intent, text, capability, {
      next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/', 'https://nelfund.esupport.ng/create'],
      escalation,
    })
  }

  try {
    const grounded = await answerQuestion(combined || rawUser, {
      history,
      institutionId: slots.institutionId,
      ocrText: ocr,
    })
    if (grounded?.answer) {
      slots.intent = grounded.intent || intent
      return {
        messages: [
          userMsg,
          {
            id: uid('asst'),
            role: 'assistant',
            text: grounded.answer,
            answer: grounded,
            timestamp: Date.now(),
          },
        ],
        slots,
        diagnosed: grounded.intent !== 'unknown',
        capability,
      }
    }
  } catch {
    /* fall through */
  }

  const fallback =
    'I can help with NELFUND applications, portal errors, eligibility, upkeep, and repayment.\n\nTell me the exact portal message, your school name, or what you are trying to do.\n\nPortal: https://portal.nelf.gov.ng/\nWebsite: https://nelf.gov.ng/\nSupport: https://nelfund.esupport.ng/create'
  return finalize(userMsg, slots, intent, fallback, capability, {
    next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/', 'https://nelfund.esupport.ng/create'],
  })
}

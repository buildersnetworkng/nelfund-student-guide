/**
 * Offline conversational agent — primary intelligence when no LLM API is configured.
 */

import { getInstitution } from '../data'
import { buildEscalationPlan, resolveInstitutionFromText } from '../escalation'
import { answerQuestion } from './answer'
import { resolveCapability } from './capabilities'
import { buildCurrentInformationAnswerLive } from './current'
import { draftSupportEmail, describeContactLookup } from './generate'
import { classifyIntent } from './intent'
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
  let institutionId = uiInstitutionId || null
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
  }
  return next
}

function conversationalFallback(intent: IntentId): string {
  if (intent === 'pending-application')
    return 'If your **application status** is pending, that usually means still processing — not rejected. (Dashboard “Pending Loans” counters are different.)'
  if (intent === 'missing-information')
    return 'Missing information on the portal is usually about school record matching.'
  return 'Understood.'
}

function lightAnswer(
  intent: IntentId,
  text: string,
  opts?: { next?: string[]; sources?: GroundedAnswer['sources'] },
): GroundedAnswer {
  return {
    hasEvidence: true,
    intent,
    confidence: 0.7,
    responseMode: 'conversation',
    problem: null,
    answer: text,
    whatThisMeans: null,
    nextActions: opts?.next || [],
    clarifyingQuestions: [],
    evidence: [],
    sources: opts?.sources || [
      { id: 'portal', label: 'NELFUND portal', url: 'https://portal.nelf.gov.ng/', official: true },
    ],
    video: null,
    insufficientReason: null,
    officialFallbackUrl: 'https://portal.nelf.gov.ng/',
    escalation: null,
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

  const userMsg: ChatMessage = {
    id: uid('user'),
    role: 'user',
    text: rawUser || (ocr ? '[Screenshot uploaded]' : ''),
    imagePreview: opts.imagePreview || null,
    timestamp: Date.now(),
  }

  let slots: ConversationSlots = applyInstitutionToSlots(
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

  {
    const screen = understandPortalText(combined || ocr || rawUser || '')
    if (screen && (screen.kind === 'dashboard' || screen.kind === 'error' || screen.kind === 'login')) {
      if (screen.exactError) {
        slots.exactError = screen.exactError
        slots.problemSummary = screen.exactError
        slots.errorConfirmed = true
      }
      const answer: GroundedAnswer = {
        hasEvidence: true,
        intent: screen.kind === 'error' ? 'missing-information' : 'current-information',
        confidence: 0.9,
        responseMode: 'conversation',
        problem: screen.exactError || screen.kind,
        answer: screen.explanation,
        whatThisMeans: null,
        nextActions: screen.nextActions.slice(0, 4),
        clarifyingQuestions: [],
        evidence: [],
        sources: [
          {
            id: 'portal',
            label: 'NELFUND portal',
            url: 'https://portal.nelf.gov.ng/',
            official: true,
          },
        ],
        video: null,
        insufficientReason: null,
        officialFallbackUrl: 'https://portal.nelf.gov.ng/',
        escalation: null,
      }
      slots.phase = 'resolve'
      slots.lastCapability = 'conversation'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'conversation',
      }
    }
  }

  const intentMeta = classifyIntent(combined || rawUser, history)
  const intent = intentMeta.intent
  slots.intent = intent

  const capability = resolveCapability(intent, combined || rawUser)
  slots.lastCapability = capability

  if (slots.pendingClarify === 'problem' && /^\s*[1-6]\s*$/.test(rawUser)) {
    const n = rawUser.trim()
    const map: Record<string, string> = {
      '1': 'which website do I use to login to NELFUND',
      '2': 'portal shows missing information',
      '3': 'how do I know if my school uploaded my data',
      '4': 'who should I contact about missing information',
      '5': 'draft an email to my school about missing information',
      '6': 'is NELFUND open right now',
    }
    slots.pendingClarify = null
    return processUserTurn({
      ...opts,
      userText: map[n] || rawUser,
      slots,
      history: [...history, { role: 'user', text: rawUser }, { role: 'assistant', text: '...' }],
    })
  }

  if (
    /whatsapp|telegram|pay\s*(#?|naira|₦)?\s*\d|fast\s*track|agent\s*(said|told|messaged)|send\s*(money|otp|pin)/i.test(
      combined,
    ) ||
    (/pay/i.test(combined) && /nelfund|loan|application/i.test(combined) && /agent|man|guy|someone/i.test(combined))
  ) {
    const answer = lightAnswer(
      'contact-support',
      '**Do not pay anyone** to “fast-track” NELFUND, and **never share OTP, PIN, or password** with WhatsApp/Telegram “agents.”\n\nOfficial channels only:\n• Portal: https://portal.nelf.gov.ng/\n• Site: https://nelf.gov.ng/\n• Support tickets: https://nelfund.esupport.ng/create\n\nNELFUND does not ask students to pay random people to process applications.',
      {
        next: [
          'https://portal.nelf.gov.ng/',
          'https://nelfund.esupport.ng/create',
          'https://nelf.gov.ng/',
        ],
      },
    )
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
  }

  if (/forgot\s*(my\s*)?password|reset\s*(my\s*)?password|can'?t\s*log\s*in|cannot\s*log\s*in/i.test(combined)) {
    const answer = lightAnswer(
      'portal-login',
      'I cannot reset passwords for you. Use only the official portal:\n\n1. Open https://portal.nelf.gov.ng/\n2. Use the portal’s own **Forgot password / reset** option if shown.\n3. Never send your password or OTP to anyone in chat, email, or WhatsApp.\n\nIf reset fails, open a ticket at https://nelfund.esupport.ng/create describing the login problem (no secrets).',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'portal-login',
    }
  }

  if (
    /password\s*(is|=|:)|my\s*password\s*is|otp\s*(is|=)/i.test(combined) ||
    /send\s*(my\s*)?(otp|password|pin)|share\s*(my\s*)?(otp|password|pin)|give\s*(my\s*)?(otp|password)/i.test(
      combined,
    )
  ) {
    const answer = lightAnswer(
      'portal-login',
      'Do not share passwords, OTP, or PINs in chat — I cannot and should not use them. Sign in only at https://portal.nelf.gov.ng/ and use official reset options if you are locked out.',
      { next: ['https://portal.nelf.gov.ng/', 'Never send credentials to anyone'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'portal-login',
    }
  }

  if (
    capability === 'portal-login' ||
    intent === 'portal-login' ||
    /which\s*(website|link|url|site).{0,60}(login|log\s*in|sign\s*in|application|continue|enter|nelfund)/i.test(
      combined,
    ) ||
    /continue\s*(my\s*)?application/i.test(combined) ||
    /(which|wetin)\s*(site|link|website).{0,40}(enter|login|open|use).{0,20}nelfund/i.test(combined) ||
    /abeg.{0,30}(site|link|website).{0,40}(nelfund|login|enter)/i.test(combined)
  ) {
    const answer = lightAnswer(
      'portal-login',
      'Use the official student portal only: https://portal.nelf.gov.ng/ — never third-party login pages.',
      {
        next: ['Open https://portal.nelf.gov.ng/', 'Never share OTP or password in chat'],
      },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'portal-login',
    }
  }

  if (/contact\s*nelfund|nelfund\s*support|how\s*i\s*go\s*contact\s*nelfund|reach\s*nelfund/i.test(combined)) {
    const answer = lightAnswer(
      'contact-support',
      'To contact **NELFUND**:\n\n• Support tickets: https://nelfund.esupport.ng/create\n• Portal: https://portal.nelf.gov.ng/\n• Site: https://nelf.gov.ng/\n\nNo passwords or OTP in any message.',
      {
        next: [
          'https://nelfund.esupport.ng/create',
          'https://portal.nelf.gov.ng/',
          'https://nelf.gov.ng/',
        ],
      },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'contact-lookup',
    }
  }

  if (capability === 'contact-lookup' || intent === 'contact-lookup' || intent === 'contact-support') {
    if (
      /nelfund|nelf\.gov|esupport/i.test(combined) &&
      !/school|university|poly|my\s*institution|LASU|OOU|UNILAG/i.test(combined)
    ) {
      const answer = lightAnswer(
        'contact-support',
        'To contact **NELFUND** (not your school):\n\n• Support tickets: https://nelfund.esupport.ng/create\n• Portal: https://portal.nelf.gov.ng/\n• Official site: https://nelf.gov.ng/\n\nDescribe the issue clearly and attach a screenshot with passwords/OTP hidden. Do not send login secrets to anyone.',
        {
          next: [
            'https://nelfund.esupport.ng/create',
            'https://portal.nelf.gov.ng/',
            'https://nelf.gov.ng/',
          ],
        },
      )
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'contact-lookup',
      }
    }
    if (!slots.institutionId) {
      slots.awaitingInstitution = true
      slots.pendingClarify = 'institution'
      slots.phase = 'clarify'
      const answer = lightAnswer(
        'contact-lookup',
        'Which institution do you attend? Once I know the school, I can point you to curated contacts or official channels — I will not invent email addresses.',
      )
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'contact-lookup',
      }
    }
    try {
      const esc = buildEscalationPlan('missing-information' as IntentId, slots.institutionId)
      const described = describeContactLookup(slots.institutionName, esc)
      const answer = lightAnswer('contact-lookup', described, {
        next: ['https://nelfund.esupport.ng/create', 'https://portal.nelf.gov.ng/'],
      })
      if (esc) answer.escalation = esc
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'contact-lookup',
      }
    } catch {
      /* fall through */
    }
  }

  if (
    capability === 'email-draft' ||
    intent === 'email-draft' ||
    /draft|write\s*(an?\s*)?(email|message)/i.test(combined)
  ) {
    if (!slots.institutionId && !/nelfund/i.test(combined)) {
      slots.awaitingInstitution = true
      slots.pendingClarify = 'institution'
      slots.phase = 'clarify'
      const answer = lightAnswer(
        'email-draft',
        'I can draft that. Which school should the message go to, and is it for your institution office or NELFUND support?',
      )
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'email-draft',
      }
    }
    try {
      const draft = draftSupportEmail({
        institutionId: slots.institutionId,
        institutionName: slots.institutionName,
        exactError: slots.exactError || slots.problemSummary,
        recipient: /nelfund/i.test(combined) ? 'nelfund' : 'school',
      })
      const body = `Here is a draft you can adapt:\n\nSubject: ${draft.subject}\n\n${draft.body}`
      const answer = lightAnswer('email-draft', body, {
        next: ['Copy and send only via official channels', 'https://nelfund.esupport.ng/create'],
      })
      answer.draft = draft
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
        ],
        slots,
        diagnosed: true,
        capability: 'email-draft',
      }
    } catch {
      /* fall through */
    }
  }

  if (
    /polytechnic|college\s+of\s+education|COE\b|poly\b/i.test(combined) &&
    /eligib|can\s+I\s+apply|qualify|allowed/i.test(combined)
  ) {
    const answer = lightAnswer(
      'eligibility',
      'NELFUND is aimed at students in eligible **Nigerian tertiary institutions**, which can include universities, polytechnics, and colleges of education when those institutions participate in the current cycle.\n\nThis guide cannot guarantee your personal eligibility. Confirm on https://nelf.gov.ng/ and whether your school appears in the portal at https://portal.nelf.gov.ng/.',
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (
    capability === 'current-information' ||
    intent === 'current-information' ||
    intent === 'deadline' ||
    intent === 'academic-session'
  ) {
    try {
      const live = await buildCurrentInformationAnswerLive()
      if (live?.answer) {
        const answer = lightAnswer('current-information', live.answer, {
          next: live.nextActions?.slice(0, 4),
          sources: live.sources as GroundedAnswer['sources'],
        })
        slots.phase = 'resolve'
        return {
          messages: [
            userMsg,
            { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
          ],
          slots,
          diagnosed: true,
          capability: 'current-information',
        }
      }
    } catch {
      /* fall through */
    }
  }

  if (
    slots.institutionId &&
    rawUser.length < 80 &&
    /^(my\s+school\s+is|i\s+attend|i\s+am\s+at|school\s*:)/i.test(rawUser.trim())
  ) {
    const answer = lightAnswer(
      intent,
      `Noted — **${slots.institutionName || 'your institution'}**. What do you need next: portal error help, a contact, a draft email, or current application status?`,
    )
    slots.phase = 'gather'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (/school\s*not\s*(on\s*)?(the\s*)?list|institution\s*not\s*found|my\s*school\s*(is\s*)?not\s*(showing|listed|on)/i.test(combined)) {
    const answer = lightAnswer(
      'school-not-found',
      'If your school does not appear on the portal, it may not be participating in the current cycle yet, or the name search does not match the official listing.\n\nWhat to do:\n1. Search alternate spellings / short name on https://portal.nelf.gov.ng/\n2. Ask your school ICT / Registry whether they are onboarded for NELFUND this cycle.\n3. Confirm announcements on https://nelf.gov.ng/\n4. If needed, ticket: https://nelfund.esupport.ng/create\n\nI will not invent a school list entry that is not on the official portal.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
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
  }

  if (/how\s*long.{0,30}(approv|pending|process)|when\s*will.{0,20}(approv|disburse)|approval\s*time/i.test(combined)) {
    const answer = lightAnswer(
      'pending-application',
      'There is no fixed public “X days” guarantee for every application. Processing time depends on the current cycle, complete records, and official reviews.\n\nPractical steps:\n• Check status only on https://portal.nelf.gov.ng/\n• Ensure school records match (name, NIN, JAMB, matric)\n• Watch https://nelf.gov.ng/ for official updates\n\nAnyone promising instant approval for a fee is not official.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'] },
    )
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
  }

  if (/apply\s*twice|re-?apply|second\s*application|apply\s*again/i.test(combined)) {
    const answer = lightAnswer(
      'reapplication',
      'Whether you can re-apply depends on the official rules for the current cycle and your previous application outcome.\n\nDo not rely on social media. Check https://nelf.gov.ng/ and your status on https://portal.nelf.gov.ng/. If the portal or support guidance allows a new application for your case, follow only those official steps.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
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
  }

  if (slots.pendingClarify === 'institution' && slots.institutionId && rawUser.length < 100) {
    slots.awaitingInstitution = false
    slots.pendingClarify = null
    const answer = lightAnswer(
      'missing-information',
      `Noted — **${slots.institutionName}**. For missing information, ask that school’s ICT / Registry / NELFUND desk to confirm your record (name, NIN, JAMB, matric). I can also draft a message for them — just say “draft the email.”`,
      { next: ['Say “draft the email”', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = 'gather'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (
    (intent === 'missing-information' ||
      /missing\s*information|no\s*school\s*info|record\s*not\s*found/i.test(combined)) &&
    !/explain|mean|simple|pidgin|plain/i.test(combined)
  ) {
    const answer = lightAnswer(
      'missing-information',
      '**Missing information** on the NELFUND portal usually means your details are not matched to a school record yet — name, NIN, JAMB, or matric may not match what your institution submitted.\n\nNext steps:\n1. Tell me your institution so I can point you to the right office.\n2. Ask school ICT / Registry / NELFUND desk to confirm your record was uploaded correctly.\n3. If the school confirms but the portal still fails → https://nelfund.esupport.ng/create (no passwords).',
      { next: ['Share your school name', 'https://nelfund.esupport.ng/create'] },
    )
    slots.phase = slots.institutionId ? 'resolve' : 'clarify'
    if (!slots.institutionId) {
      slots.awaitingInstitution = true
      slots.pendingClarify = 'institution'
    }
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (/missing\s*information/i.test(combined) && /explain|mean|simple|pidgin|plain/i.test(combined)) {
    const answer = lightAnswer(
      'missing-information',
      'In simple terms: **missing information** means the NELFUND portal cannot match your details to a record from your school.\n\nIt is usually not that the website is “broken.” Often the school has not submitted your data yet, or name / NIN / JAMB / matric do not match exactly.\n\nWhat to do: confirm your details with your school’s ICT, Registry, or NELFUND desk. If they say it is correct but the portal still fails, open a ticket at https://nelfund.esupport.ng/create (no passwords).',
      { next: ['Ask your school records desk', 'https://nelfund.esupport.ng/create'] },
    )
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
  }

  if (
    intent === 'eligibility' ||
    /disqualif|lose\s*(the\s*)?(chance|loan)|who\s*can\s*apply|ineligib/i.test(combined)
  ) {
    const groundedElig = answerQuestion(combined || rawUser, slots.institutionId, history)
    if (groundedElig.hasEvidence && groundedElig.answer) {
      groundedElig.responseMode = 'conversation'
      groundedElig.whatThisMeans = null
      slots.phase = 'resolve'
      return {
        messages: [
          userMsg,
          {
            id: uid('asst'),
            role: 'assistant',
            text: groundedElig.answer,
            answer: groundedElig,
            timestamp: Date.now(),
          },
        ],
        slots,
        diagnosed: true,
        capability: 'verified-knowledge',
      }
    }
    const answer = lightAnswer(
      'eligibility',
      'Eligibility depends on official NELFUND rules for the current cycle (identity, admission, institution participation, and any published conditions). This guide will not invent a personal yes/no decision. Check requirements on https://nelf.gov.ng/ and apply only via https://portal.nelf.gov.ng/.',
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (
    /no\s*dey\s*open|not\s*open|cannot\s*apply|can'?t\s*apply|e\s*no\s*dey\s*open|window\s*(is\s*)?closed|registration\s*closed/i.test(
      combined,
    )
  ) {
    const answer = lightAnswer(
      'current-information',
      'If the portal will not let you start or submit an application, the registration window for that session may be closed or not yet open.\n\nCheck only:\n• https://portal.nelf.gov.ng/\n• https://nelf.gov.ng/\n\nDo not use third-party “application” sites. If your account exists but counters are zero, that is different from a pending review — upload a screenshot of the yellow notice dates if you want me to read them.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'current-information',
    }
  }

  if (/verification\s*fee|pay\s*(to\s*)?verify|pay\s*for\s*(upload|admission|clearance)/i.test(combined)) {
    const answer = lightAnswer(
      'contact-support',
      'Be careful: NELFUND applications are handled on official channels. Random “verification fees” demanded on WhatsApp or by unknown agents are a common scam pattern.\n\nUse only:\n• https://portal.nelf.gov.ng/\n• https://nelf.gov.ng/\n• https://nelfund.esupport.ng/create\n\nNever pay individuals to process your loan.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
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
  }

  if (/friend\s*used\s*my\s*nin|used\s*my\s*nin|share[d]?\s*my\s*nin|someone\s*used\s*my\s*(nin|bvn)/i.test(combined)) {
    const answer = lightAnswer(
      'nin-verification',
      'Your NIN should only be used by you for official processes. If someone else used your NIN on a NELFUND or other application, treat it as identity misuse.\n\nSteps:\n1. Do not share NIN, BVN, OTP, or passwords with friends or agents.\n2. Check your own portal status only at https://portal.nelf.gov.ng/\n3. Open a support ticket at https://nelfund.esupport.ng/create if a wrong application appears under your identity.\n4. Consider reporting serious identity fraud through official national channels.\n\nThis guide cannot cancel applications for you.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
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
  }

  if (
    /pay(ment)?\s*(has\s*been\s*)?(made|received)|money\s*(enter|enter\s*my|in\s*my)\s*account|disburse|when\s*will\s*they\s*pay/i.test(
      combined,
    )
  ) {
    const answer = lightAnswer(
      'current-information',
      'Disbursement status is shown on the official portal for your application — not on social media.\n\n1. Log in at https://portal.nelf.gov.ng/\n2. Check loan / payment status there\n3. Confirm bank details on the portal only\n4. For payment issues after official confirmation, use https://nelfund.esupport.ng/create\n\nNever pay anyone to “release” funds.',
      { next: ['https://portal.nelf.gov.ng/', 'https://nelfund.esupport.ng/create'] },
    )
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
  }

  if (
    /part[- ]?time|postgraduate|masters|phd|outside\s*nigeria|abroad|foreign/i.test(combined) &&
    /eligib|can\s*i\s*apply|cover|work\s*for/i.test(combined)
  ) {
    const answer = lightAnswer(
      'eligibility',
      'Eligibility for part-time, postgraduate, or students outside Nigeria depends on the official rules for the current NELFUND cycle and participating institutions.\n\nThis guide will not invent a personal yes/no. Confirm on:\n• https://nelf.gov.ng/\n• https://portal.nelf.gov.ng/\n\nIf your programme or location is excluded in official guidance, the portal is the authority.',
      { next: ['https://nelf.gov.ng/', 'https://portal.nelf.gov.ng/'] },
    )
    slots.phase = 'resolve'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'verified-knowledge',
    }
  }

  if (/name\s*no\s*dey|name\s*not\s*(on|in)\s*(the\s*)?(school\s*)?list|not\s*on\s*school\s*list/i.test(combined)) {
    const answer = lightAnswer(
      'school-not-found',
      'If your name is not on the school’s NELFUND list, your record may not have been submitted or may not match (name, NIN, JAMB, matric).\n\n1. Contact your school ICT / Registry / NELFUND desk with your details\n2. Ask them to confirm upload / correction\n3. Retry the portal after they confirm: https://portal.nelf.gov.ng/\n4. If school confirms but portal still fails: https://nelfund.esupport.ng/create\n\nTell me your institution if you want a draft message.',
      { next: ['Share your school name', 'https://nelfund.esupport.ng/create'] },
    )
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
  }

  if (
    intent === 'unknown' &&
    (combined.trim().length < 60 || /help\s*(me)?|nelfund\s*thing|stuck|wahala/i.test(combined))
  ) {
    const answer = lightAnswer(
      'unknown',
      'I can help — what is going wrong right now?\n\n1. Login / which website to use\n2. Missing information on the portal\n3. Whether my school uploaded my data\n4. Contact school or NELFUND\n5. Draft an email\n6. Is application open\n\nReply with a number or a short description (and your school name if relevant).',
    )
    slots.phase = 'clarify'
    slots.pendingClarify = 'problem'
    return {
      messages: [
        userMsg,
        { id: uid('asst'), role: 'assistant', text: answer.answer, answer, timestamp: Date.now() },
      ],
      slots,
      diagnosed: true,
      capability: 'conversation',
    }
  }

  if (
    intent === 'institution-verification' ||
    /upload|school.*(submit|sent|upload)|university.*(submit|sent|upload)|know.*school.*(upload|submit|sent)/i.test(
      combined,
    )
  ) {
    const answer = lightAnswer(
      'institution-verification',
      'You cannot see a private NELFUND admin “upload log.” Practical signs:\n\n• Portal still shows missing information / no school data → record may not be matched yet.\n• Ask your school ICT / Registry / NELFUND desk whether they submitted your name, NIN, JAMB, and matric correctly.\n• If the school confirms upload but the portal still fails, open a ticket at https://nelfund.esupport.ng/create with evidence (no passwords).\n\nTell me your institution if you want contact guidance or a draft message.',
      {
        next: [
          'Ask school NELFUND desk',
          'https://nelfund.esupport.ng/create',
          'https://portal.nelf.gov.ng/',
        ],
      },
    )
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
  }

  const grounded = answerQuestion(combined || rawUser, slots.institutionId, history)
  const text = grounded.answer || conversationalFallback(intent)
  if (grounded.responseMode !== 'conversation') {
    grounded.responseMode = 'conversation'
    grounded.whatThisMeans = null
  }
  grounded.answer = text

  slots.phase = grounded.clarifyingQuestions?.length ? 'clarify' : 'resolve'

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
    diagnosed: grounded.hasEvidence,
    capability,
  }
}

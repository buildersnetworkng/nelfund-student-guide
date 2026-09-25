/**
 * Understanding layer — interpret what the student *means*, not only keyword hits.
 * Handles English + Nigerian Pidgin, typos, and OCR-ish text.
 * Sits above playbook/intent: normalize language, resolve references to the prior
 * answer, detect speech acts (define term, clarify, expand, new ask).
 * Does not invent policy; only structures meaning for routing.
 */
import type { IntentId } from './types'

export type SpeechAct =
  | 'define_term'
  | 'clarify'
  | 'expand'
  | 'acknowledge'
  | 'new_question'
  | 'off_topic'
  | 'unknown'

export type UnderstoodTurn = {
  /** Cleaned / expanded text used for downstream classify */
  normalized: string
  /** Original trimmed text */
  raw: string
  speechAct: SpeechAct
  /** Best intent guess from meaning (may still run full classify) */
  suggestedIntent: IntentId | null
  /** Term the user is asking to define, if any */
  focusTerm: string | null
  /** Confidence 0–1 in this interpretation */
  confidence: number
  /** Why we chose this (debug / eval) */
  reason: string
}

/** Common student typos / Pidgin → standard tokens for matching. */
const NORMALIZE_MAP: Array<[RegExp, string]> = [
  [/\bnelfun\b/gi, 'nelfund'],
  [/\bnelfond\b/gi, 'nelfund'],
  [/\bnel fund\b/gi, 'nelfund'],
  [/\bnelf\s*fund\b/gi, 'nelfund'],
  [/\bstudent\s*loan\s*fund\b/gi, 'nelfund'],
  [/\bchargers?\b/gi, 'charges'],
  [/\binstitutional\s*charger\b/gi, 'institutional charges'],
  [/\bschool\s*fees?\b/gi, 'school fees'],
  [/\bi no (you|u) am\b/gi, 'I do not know'],
  [/\bi no sabi\b/gi, 'I do not know'],
  [/\bi no know\b/gi, 'I do not know'],
  [/\bi no understand\b/gi, 'I do not understand'],
  [/\bwetin be\b/gi, 'what is'],
  [/\bwetin mean\b/gi, 'what does it mean'],
  [/\bwetin dey\b/gi, 'what is'],
  [/\bna wetin\b/gi, 'what is'],
  [/\bhow e take be\b/gi, 'how does it work'],
  [/\bhow e be\b/gi, 'how is it'],
  [/\bhow far\b/gi, 'how far'],
  [/\babeg\b/gi, 'please'],
  [/\bpls\b/gi, 'please'],
  [/\bplz\b/gi, 'please'],
  [/\buna\b/gi, 'you'],
  [/\bwey\b/gi, 'that'],
  [/\bdem\b/gi, 'they'],
  [/\bdon\b/gi, 'have'],
  [/\bnever\b/gi, 'not yet'],
  [/\bno dey\b/gi, 'is not'],
  [/\bno show\b/gi, 'is not showing'],
  [/\bno gree\b/gi, 'refused'],
  [/\be no gree\b/gi, 'it refused'],
  [/\be no work\b/gi, 'it does not work'],
  [/\be no open\b/gi, 'it is not open'],
  [/\bstill dey open\b/gi, 'is still open'],
  [/\bdem don close\b/gi, 'they have closed'],
  [/\bdem never pay\b/gi, 'they have not paid'],
  [/\bmoney never enter\b/gi, 'money has not entered'],
  [/\bmy school no dey\b/gi, 'my school is not showing'],
  [/\bschool no show\b/gi, 'school is not showing'],
  [/\bemail don use\b/gi, 'email already used'],
  [/\bpassword no work\b/gi, 'password does not work'],
  [/\bi forget password\b/gi, 'I forgot my password'],
  [/\bi no remember password\b/gi, 'I forgot my password'],
  [/\bexpanciate\b/gi, 'elaborate'],
  [/\bexpantiate\b/gi, 'elaborate'],
  [/\bloging\b/gi, 'logging'],
  [/\bsignning\b/gi, 'signing'],
  [/\baplication\b/gi, 'application'],
  [/\beligiblity\b/gi, 'eligibility'],
  [/\brepayement\b/gi, 'repayment'],
  [/\bpendding\b/gi, 'pending'],
  [/\binvalid jamb\b/gi, 'invalid JAMB'],
  [/\bjamb number\b/gi, 'JAMB number'],
  [/\bdisurment\b/gi, 'disbursement'],
  [/\bdisbursment\b/gi, 'disbursement'],
  [/\bdisburstment\b/gi, 'disbursement'],
  [/\bdisburst\b/gi, 'disburse'],
  [/\bdisburse?ment\b/gi, 'disbursement'],
  [/\bwhen money go enter\b/gi, 'when will disbursement happen'],
  [/\bmoney never enter\b/gi, 'money has not been disbursed'],
  [/\bwhat next\b/gi, 'what should I do next'],
  [/\bwetin next\b/gi, 'what should I do next'],
  [/\bwetin i go do\b/gi, 'what should I do'],
  [/\bwhat should i do first\b/gi, 'what should I do first'],
  [/\bfirst step\b/gi, 'what should I do first'],
  [/\braise dispute\b/gi, 'raise a dispute'],
  [/\bfee dispute\b/gi, 'fee dispute'],
  [/\bno result found\b/gi, 'no result found'],
  [/\bschool not showing\b/gi, 'school is not showing'],
  [/\bhow i go apply\b/gi, 'how do I apply'],
  [/\bhow to apply\b/gi, 'how do I apply'],
  [/\bis it open\b/gi, 'is the application open'],
  [/\bstill open\b/gi, 'is the application still open'],
]

const TERM_BANK: Array<{ keys: RegExp; label: string; intent: IntentId }> = [
  {
    keys: /institutional\s*charges?|institution\s*charges?|school\s*charges?/i,
    label: 'institutional charges',
    intent: 'institutional-charges',
  },
  {
    keys: /\bupkeep\b|stipend|living\s*support|allowance/i,
    label: 'upkeep',
    intent: 'upkeep',
  },
  {
    keys: /\bgsi\b|global\s*standing\s*instruction/i,
    label: 'GSI',
    intent: 'gsi',
  },
  {
    keys: /school\s*fees?|tuition/i,
    label: 'school fees',
    intent: 'school-fees',
  },
  {
    keys: /\bportal\b/i,
    label: 'portal',
    intent: 'portal-login',
  },
  {
    keys: /\bbvn\b|bank\s*verification/i,
    label: 'BVN',
    intent: 'bank-information',
  },
  {
    keys: /\bnin\b|national\s*identity/i,
    label: 'NIN',
    intent: 'nin-verification',
  },
  {
    keys: /disburse|disbursement|disurment|disbursment|payout/i,
    label: 'disbursement',
    intent: 'pending-application',
  },
  {
    keys: /fee\s*dispute|raise\s*(a\s*)?dispute/i,
    label: 'fee dispute',
    intent: 'pending-application',
  },
  {
    keys: /\bpending\b/i,
    label: 'pending',
    intent: 'pending-application',
  },
  {
    keys: /repayment|when\s*(do\s*i\s*)?repay/i,
    label: 'repayment',
    intent: 'repayment',
  },
]

function normalizeText(text: string): string {
  let t = (text || '').trim()
  for (const [re, rep] of NORMALIZE_MAP) {
    t = t.replace(re, rep)
  }
  t = t.replace(/\s+/g, ' ').trim()
  return t
}

function isAck(text: string): boolean {
  const t = text.trim().toLowerCase().replace(/[!?.]+$/g, '')
  return /^(alright|all\s*right|ok|okay|thanks|thank\s*you|sharp|correct|got\s*it|noted|fine|cool|nice|true|yes|yeah|yep|abeg|boss|e don clear|i understand)(\s+boss)?\.?$/i.test(
    t,
  )
}

function isExpand(text: string): boolean {
  return /tell\s*me\s*more|elaborate|expanciate|expand|explain\s*more|more\s*details?|go\s*deeper|break\s*(it\s*)?down|what\s*next|wetin\s*next|continue|go on|what\s*should\s*i\s*do(\s*(next|first|now))?|first\s*step|wetin\s*i\s*go\s*do|so\s*what(\s*now)?/i.test(
    text,
  )
}

/** Split one message that packs 2–5 questions into ordered parts. */
export function splitMultiQuestions(text: string): string[] {
  const raw = (text || '').trim()
  if (!raw || raw.length < 25) return [raw]
  let parts = raw
    .split(/(?<=[?])\s+|\n+|\d+[.)]\s+|\band\s+also\b|\balso[,:]?\s+(?=[A-Z])/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 8)
  if (parts.length < 2) {
    const alt = raw.split(/\?(?=\s)/).map((p) => p.trim()).filter((p) => p.length > 8)
    if (alt.length >= 2) parts = alt.map((p) => (p.endsWith('?') ? p : p + '?'))
  }
  return parts.slice(0, 5).length >= 2 ? parts.slice(0, 5) : [raw]
}

export function isMultiQuestion(text: string): boolean {
  const parts = splitMultiQuestions(text)
  return parts.length >= 2
}

function isClarify(text: string): boolean {
  const t = text.trim()
  if (/^(i\s*)?(meant|mean|was\s*asking|am\s*asking)\b/i.test(t)) return true
  if (/\b(loan\s+and\s+upkeep|upkeep\s+and\s+(the\s+)?loan|fees?\s+and\s+upkeep)\b/i.test(t))
    return true
  return false
}

function isDefineAsk(text: string): boolean {
  const t = text.trim()
  if (t.length > 160) return false
  if (/what\s+do\s+(you|u)\s+mean/i.test(t)) return true
  if (/wetin\s+(be|mean)/i.test(t)) return true
  if (/what\s+(is|are|does|mean)/i.test(t) && t.length < 120) return true
  if (/what'?s\s+/i.test(t) && t.length < 80) return true
  if (/meaning\s+of|define\b/i.test(t)) return true
  return false
}

function findTermIn(text: string): { label: string; intent: IntentId } | null {
  for (const row of TERM_BANK) {
    if (row.keys.test(text)) return { label: row.label, intent: row.intent }
  }
  return null
}

const MEANING_INTENTS: Array<{ re: RegExp; intent: IntentId; conf: number; reason: string }> = [
  { re: /how\s*(do\s*i|to|i\s*go)\s*apply|steps?\s*to\s*apply|where\s*(do\s*i\s*)?apply/i, intent: 'how-to-apply', conf: 0.92, reason: 'apply' },
  { re: /is\s*(the\s*)?(loan|application|window|it)\s*open|still\s*open|dem\s*don\s*close/i, intent: 'current-information', conf: 0.92, reason: 'open' },
  { re: /pending|how\s*far\s*(my\s*)?(loan|money|application)|money\s*never|disburse|disurment/i, intent: 'pending-application', conf: 0.9, reason: 'pending' },
  { re: /cancel\s*(loan|application)|should\s*i\s*cancel|can\s*i\s*cancel/i, intent: 'pending-application', conf: 0.91, reason: 'cancel' },
  { re: /school\s*(no|not)\s*(show|on\s*list|found)|no\s*result\s*found|select\s*institution/i, intent: 'school-not-found', conf: 0.93, reason: 'school' },
  { re: /invalid\s*jamb|jamb\s*(number|verification)/i, intent: 'jamb-verification', conf: 0.9, reason: 'jamb' },
  { re: /email\s*already|registered\s*last\s*year|forgot\s*password|how\s*(do\s*i|to)\s*log\s*in/i, intent: 'portal-login', conf: 0.88, reason: 'login' },
  { re: /upkeep|school\s*fees?\s*vs|institutional\s*charges|difference\s*between/i, intent: 'upkeep-vs-fees', conf: 0.9, reason: 'fees_upkeep' },
  { re: /repay|when\s*(do\s*i\s*)?start\s*repay|after\s*nysc/i, intent: 'repayment', conf: 0.9, reason: 'repay' },
  { re: /eligib|who\s*can\s*apply|can\s*i\s*apply/i, intent: 'eligibility', conf: 0.88, reason: 'elig' },
  { re: /raise\s*(a\s*)?dispute|fee\s*dispute|wrong\s*(fee|amount)/i, intent: 'pending-application', conf: 0.9, reason: 'dispute' },
  { re: /what\s*(should\s*i\s*do|next|first)|wetin\s*(next|i\s*go\s*do)|first\s*step/i, intent: 'how-to-apply', conf: 0.85, reason: 'next_step' },
]

/**
 * True if the text is about student-loan / portal topics even without the word "NELFUND".
 */
export function isDomainRelated(text: string, lastAssistant?: string | null): boolean {
  const t = (text || '').toLowerCase()
  if (!t) return false
  if (
    /nelfund|student\s*loan|portal\.nelf|nelf\.gov|jamb|bvn|nin|upkeep|institutional|school\s*fees?|disburse|disurment|pending|repay|gsi|matric|eligibility|admission\s*letter|fee\s*dispute|raise\s*a\s*dispute|no\s*result\s*found|school\s*(not|no)\s*(on|show)|forgot\s*password|email\s*already|how\s*(do\s*i|to)\s*apply|is\s*(it|application)\s*open|login|sign\s*in|cancel\s*(loan|application)/i.test(
      t,
    )
  )
    return true
  if (lastAssistant && lastAssistant.length > 40) {
    if (/nelfund|portal|loan|upkeep|pending|apply|login|school|jamb|disburse/i.test(lastAssistant)) {
      if (
        /what\s*(next|should)|wetin|how|why|when|where|can\s*i|should\s*i|and\s+(then|also)|about\s+that|the\s*(loan|fee|status|portal)/i.test(
          t,
        )
      )
        return true
    }
  }
  return false
}

export function understandTurn(
  userText: string,
  lastAssistant?: string | null,
  priorIntent?: IntentId | null,
): UnderstoodTurn {
  const raw = (userText || '').trim()
  const normalized = normalizeText(raw)

  if (!normalized) {
    return {
      normalized: '',
      raw,
      speechAct: 'unknown',
      suggestedIntent: null,
      focusTerm: null,
      confidence: 0,
      reason: 'empty',
    }
  }

  if (isAck(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'acknowledge',
      suggestedIntent: priorIntent || null,
      focusTerm: null,
      confidence: 0.9,
      reason: 'ack',
    }
  }

  if (isExpand(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'expand',
      suggestedIntent: priorIntent || 'how-to-apply',
      focusTerm: null,
      confidence: 0.85,
      reason: 'expand',
    }
  }

  if (isDefineAsk(normalized)) {
    const inUser = findTermIn(normalized)
    if (inUser) {
      return {
        normalized,
        raw,
        speechAct: 'define_term',
        suggestedIntent: inUser.intent,
        focusTerm: inUser.label,
        confidence: 0.92,
        reason: 'define_in_user',
      }
    }
    const prior = (lastAssistant || '').slice(0, 1200)
    const inPrior = findTermIn(prior)
    if (inPrior) {
      return {
        normalized: `what is ${inPrior.label}`,
        raw,
        speechAct: 'define_term',
        suggestedIntent: inPrior.intent,
        focusTerm: inPrior.label,
        confidence: 0.88,
        reason: 'define_from_prior',
      }
    }
  }

  for (const row of MEANING_INTENTS) {
    if (row.re.test(normalized)) {
      return {
        normalized,
        raw,
        speechAct: 'new_question',
        suggestedIntent: row.intent,
        focusTerm: null,
        confidence: row.conf,
        reason: row.reason,
      }
    }
  }

  if (
    priorIntent &&
    priorIntent !== 'unknown' &&
    priorIntent !== 'official-sources' &&
    normalized.length < 80 &&
    (/^(and|but|so|what about|about|for|also|then)\b/i.test(normalized) ||
      /what\s*(should\s*i\s*do|next)|wetin\s*(next|i\s*go\s*do)|first\s*step|and\s+then/i.test(normalized))
  ) {
    return {
      normalized,
      raw,
      speechAct: 'clarify',
      suggestedIntent: priorIntent,
      focusTerm: null,
      confidence: 0.82,
      reason: 'short_followup_or_next',
    }
  }

  if (isMultiQuestion(normalized)) {
    const parts = splitMultiQuestions(normalized)
    const first = parts[0]
    for (const row of MEANING_INTENTS) {
      if (row.re.test(first)) {
        return {
          normalized: first,
          raw,
          speechAct: 'new_question',
          suggestedIntent: row.intent,
          focusTerm: null,
          confidence: row.conf * 0.95,
          reason: 'multi_q_first:' + parts.length,
        }
      }
    }
  }

  return {
    normalized,
    raw,
    speechAct: 'new_question',
    suggestedIntent: null,
    focusTerm: null,
    confidence: 0.45,
    reason: 'pass_to_classifier',
  }
}

export function normalizeStudentText(text: string): string {
  return normalizeText(text)
}

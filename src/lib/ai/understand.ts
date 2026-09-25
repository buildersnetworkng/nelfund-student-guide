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
  [/\bmates don collect\b/gi, 'mates have received payment'],
  [/\bi wan apply\b/gi, 'I want to apply'],
  [/\bi wan login\b/gi, 'I want to log in'],
  [/\bhow i go apply\b/gi, 'how do I apply'],
  [/\bhow i go login\b/gi, 'how do I log in'],
  [/\bhow i go reset\b/gi, 'how do I reset'],
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
  return /tell\s*me\s*more|elaborate|expanciate|expand|explain\s*more|more\s*details?|go\s*deeper|break\s*(it\s*)?down|what\s*next|wetin\s*next|continue|go on/i.test(
    text,
  )
}

function isClarify(text: string): boolean {
  const t = text.trim()
  if (/^(i\s*)?(meant|mean|was\s*asking|am\s*asking)\b/i.test(t)) return true
  if (/\b(loan\s+and\s+upkeep|upkeep\s+and\s+(the\s+)?loan|fees?\s+and\s+upkeep)\b/i.test(t)) return true
  if (/^(actually|rather|instead)\b/i.test(t) && t.length < 90) return true
  return false
}

function isDefineAsk(text: string): boolean {
  const t = text.trim()
  if (/what'?s?\s+(an?\s+)?/i.test(t) && t.length < 100) return true
  if (/what\s+(is|are|be|does|mean|means)\b/i.test(t) && t.length < 100) return true
  if (/wetin\s+(be|mean)\b/i.test(t) && t.length < 100) return true
  if (/meaning\s+of\b|define\b|explain\s+(this|that|it)\b/i.test(t) && t.length < 100) return true
  return false
}

function findTermIn(text: string): { label: string; intent: IntentId } | null {
  for (const row of TERM_BANK) {
    if (row.keys.test(text)) return { label: row.label, intent: row.intent }
  }
  return null
}

const MEANING_INTENTS: Array<{ re: RegExp; intent: IntentId; conf: number; reason: string }> = [
  { re: /is\s+(the\s+)?(loan|application|nelfund|window).{0,40}open|application\s+open|still\s+open|have\s+they\s+closed|when\s+(will|does|do).{0,20}(open|close)/i, intent: 'current-information', conf: 0.92, reason: 'open_window' },
  { re: /how\s+(do\s+i\s+|to\s+)?(log\s*in|sign\s*in)|want\s+to\s+(log|sign)\s*in|login\s*link|sign\s*in\s*link/i, intent: 'portal-login', conf: 0.92, reason: 'login' },
  { re: /forgot?\s*(my\s*)?password|reset\s*(my\s*)?password|password\s*(does\s*)?not\s*work|cannot\s*login|can'?t\s*log\s*in/i, intent: 'password-reset', conf: 0.93, reason: 'password' },
  { re: /email\s*(already\s*)?(used|taken|exist)|registered\s*last\s*year|old\s*email|returning\s*student/i, intent: 'email-already-used', conf: 0.92, reason: 'email_used' },
  { re: /how\s+(do\s+i\s+|to\s+)?apply|want\s+to\s+apply|apply\s+for\s+(the\s+)?(loan|nelfund)|steps?\s+to\s+apply/i, intent: 'how-to-apply', conf: 0.9, reason: 'apply' },
  { re: /eligib|can\s+i\s+apply|who\s+can\s+apply|qualify|am\s+i\s+qualified/i, intent: 'eligibility', conf: 0.9, reason: 'eligibility' },
  { re: /pending|under\s*review|how\s+far\s*(is\s*)?(my\s*)?(loan|application|money)|money\s+has\s+not\s+entered|mates\s+have\s+received/i, intent: 'pending-application', conf: 0.9, reason: 'pending' },
  { re: /invalid\s*jamb|jamb\s*(number\s*)?(invalid|wrong|not\s*working)|utme/i, intent: 'jamb-verification', conf: 0.91, reason: 'jamb' },
  { re: /school\s*(is\s*)?not\s*(showing|on\s*the\s*list|listed)|cannot\s*find\s*(my\s*)?school|no\s*result\s*found/i, intent: 'school-not-found', conf: 0.91, reason: 'school_list' },
  { re: /missing\s*information|incomplete\s*profile|profile\s*not\s*complete/i, intent: 'missing-information', conf: 0.9, reason: 'missing_info' },
  { re: /difference\s*(between\s*)?(school\s*)?fees?\s*(and|vs|versus)\s*upkeep|upkeep\s*(and|vs|versus)\s*(school\s*)?fees?|fees?\s*vs\s*upkeep/i, intent: 'upkeep-vs-fees', conf: 0.94, reason: 'fees_vs_upkeep' },
  { re: /\bupkeep\b.*(what|mean|explain)|what\s+is\s+upkeep|upkeep\s+allowance/i, intent: 'upkeep', conf: 0.88, reason: 'upkeep' },
  { re: /institutional\s*charges?|what\s+is\s+institutional/i, intent: 'institutional-charges', conf: 0.9, reason: 'inst_charges' },
  { re: /when\s+(do\s+i\s+|to\s+)?(start\s+)?repay|repayment|after\s+nysc|gsi/i, intent: 'repayment', conf: 0.88, reason: 'repay' },
  { re: /scam|otp|whatsapp\s*(agent|man)|pay\s*(before|to\s+apply)|never\s*share\s*(pin|otp)/i, intent: 'scam-safety', conf: 0.95, reason: 'scam' },
  { re: /contact\s*(support|nelfund)|esupport|help\s*desk|open\s*ticket/i, intent: 'contact-support', conf: 0.9, reason: 'support' },
  { re: /what\s+is\s+nelfund|tell\s+me\s+about\s+nelfund|how\s+nelfund\s+works|i\s+do\s+not\s+know/i, intent: 'what-is-nelfund', conf: 0.88, reason: 'overview' },
  { re: /documents?\s*(needed|required)|what\s+(do\s+i\s+)?need\s+to\s+(upload|carry)|admission\s*letter/i, intent: 'documents-needed', conf: 0.88, reason: 'documents' },
  { re: /cancel\s*(loan|application)|don'?t\s*cancel|yes,?\s*cancel/i, intent: 'pending-application', conf: 0.9, reason: 'cancel' },
  { re: /loan\s*(or|vs)\s*scholarship|is\s*(it\s*)?(a\s*)?scholarship|free\s*money/i, intent: 'loan-or-scholarship', conf: 0.9, reason: 'loan_vs_scholarship' },
]

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
      confidence: 0.2,
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

  if (isClarify(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'clarify',
      suggestedIntent: priorIntent || null,
      focusTerm: null,
      confidence: 0.75,
      reason: 'clarify',
    }
  }

  if (isExpand(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'expand',
      suggestedIntent: priorIntent || null,
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
    normalized.length < 40 &&
    /^(and|but|so|what about|about|for)\b/i.test(normalized)
  ) {
    return {
      normalized,
      raw,
      speechAct: 'clarify',
      suggestedIntent: priorIntent,
      focusTerm: null,
      confidence: 0.7,
      reason: 'short_followup',
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

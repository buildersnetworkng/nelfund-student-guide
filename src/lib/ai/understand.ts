/**
 * Understanding layer — interpret what the student *means*, not only keyword hits.
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
  [/\bchargers?\b/gi, 'charges'],
  [/\bexpanciate\b/gi, 'elaborate'],
  [/\bexpantiate\b/gi, 'elaborate'],
  [/\bnelfun\b/gi, 'nelfund'],
  [/\bnelfond\b/gi, 'nelfund'],
  [/\bnel fund\b/gi, 'nelfund'],
  [/\bi no (you|u) am\b/gi, 'I do not know'],
  [/\bi no sabi\b/gi, 'I do not know'],
  [/\bi no know\b/gi, 'I do not know'],
  [/\bwetin be\b/gi, 'what is'],
  [/\bwetin mean\b/gi, 'what does it mean'],
  [/\bna wetin\b/gi, 'what is'],
  [/\babeg\b/gi, 'please'],
  [/\bpls\b/gi, 'please'],
  [/\bhow far\b/gi, 'how far'],
  [/\bmates don collect\b/gi, 'mates have received payment'],
  [/\bmoney never enter\b/gi, 'money has not entered'],
  [/\bdem never pay\b/gi, 'they have not paid'],
  [/\binstitutional charger\b/gi, 'institutional charges'],
]

/** Terms we can define when the user points at them (or they appeared in prior reply). */
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
    keys: /\brepayment\b|pay\s*back|repay/i,
    label: 'repayment',
    intent: 'repayment',
  },
  {
    keys: /\beligibility\b|eligible/i,
    label: 'eligibility',
    intent: 'eligibility',
  },
  {
    keys: /\bportal\b/i,
    label: 'portal',
    intent: 'portal-login',
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
  return /^(alright|all\s*right|ok|okay|thanks|thank\s*you|sharp|correct|got\s*it|noted|fine|cool|nice|true|yes|yeah|yep|abeg|boss)(\s+boss)?\.?$/i.test(
    t,
  )
}

function isExpand(text: string): boolean {
  return /tell\s*me\s*more|elaborate|expanciate|expand|explain\s*more|more\s*details?|go\s*deeper|break\s*(it\s*)?down|what\s*next|wetin\s*next/i.test(
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
  if (/meaning\s+of\b|define\b/i.test(t) && t.length < 100) return true
  return false
}

function findTermIn(text: string): { label: string; intent: IntentId } | null {
  for (const row of TERM_BANK) {
    if (row.keys.test(text)) return { label: row.label, intent: row.intent }
  }
  return null
}

/**
 * Core understanding pass.
 * Uses prior assistant text so "what's that?" / "what's institutional charges?"
 * resolve to the term just used, not a full NELFUND intro.
 */
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
      suggestedIntent: priorIntent && priorIntent !== 'unknown' ? priorIntent : null,
      focusTerm: null,
      confidence: 0.9,
      reason: 'acknowledge',
    }
  }

  if (isClarify(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'clarify',
      suggestedIntent: priorIntent && priorIntent !== 'unknown' ? priorIntent : 'how-to-apply',
      focusTerm: null,
      confidence: 0.88,
      reason: 'clarify_prior',
    }
  }

  if (isExpand(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'expand',
      suggestedIntent: priorIntent && priorIntent !== 'unknown' ? priorIntent : null,
      focusTerm: null,
      confidence: 0.85,
      reason: 'expand_prior',
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
        confidence: 0.95,
        reason: 'define_term_in_question',
      }
    }
    if (lastAssistant) {
      const inPrior = findTermIn(lastAssistant)
      if (inPrior) {
        return {
          normalized: `what is ${inPrior.label}`,
          raw,
          speechAct: 'define_term',
          suggestedIntent: inPrior.intent,
          focusTerm: inPrior.label,
          confidence: 0.9,
          reason: 'define_term_from_prior_answer',
        }
      }
    }
  }

  if (/how\s+(to\s+)?(log\s*in|sign\s*in)|login|sign\s*in/i.test(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'new_question',
      suggestedIntent: 'portal-login',
      focusTerm: null,
      confidence: 0.9,
      reason: 'cluster_login',
    }
  }
  if (/how\s+to\s+apply|want\s+to\s+apply|apply\s+for\s+(the\s+)?(loan|nelfund)/i.test(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'new_question',
      suggestedIntent: 'how-to-apply',
      focusTerm: null,
      confidence: 0.88,
      reason: 'cluster_apply',
    }
  }
  if (/eligib|can\s+i\s+apply|who\s+can\s+apply|qualify/i.test(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'new_question',
      suggestedIntent: 'eligibility',
      focusTerm: null,
      confidence: 0.88,
      reason: 'cluster_eligibility',
    }
  }
  if (/\bupkeep\b|stipend|living\s+support/i.test(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'new_question',
      suggestedIntent: 'upkeep',
      focusTerm: 'upkeep',
      confidence: 0.86,
      reason: 'cluster_upkeep',
    }
  }
  if (/institutional\s*charges?|school\s*charges?/i.test(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'new_question',
      suggestedIntent: 'institutional-charges',
      focusTerm: 'institutional charges',
      confidence: 0.9,
      reason: 'cluster_institutional',
    }
  }
  if (/tell\s+me\s+about|what\s+is\s+nelfund|how\s+nelfund\s+works|i\s+do\s+not\s+know/i.test(normalized)) {
    return {
      normalized,
      raw,
      speechAct: 'new_question',
      suggestedIntent: 'what-is-nelfund',
      focusTerm: null,
      confidence: 0.85,
      reason: 'cluster_what_is',
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

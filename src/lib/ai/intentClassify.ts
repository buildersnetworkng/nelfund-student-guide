import type { IntentResult, ConversationTurn } from './types'
import {
  detectEntities,
  expandWithContext,
  isPortalDump,
  lastUserIntent,
  residualSoftRoute,
} from './residualRoute'
import { PURPOSE_RE, liveOpenRe, lastUtterance } from './intent'

export function isPurposeAsk(text: string): boolean {
  const q = lastUtterance(text)
  if (!q) return false
  if (liveOpenRe().test(q) && !PURPOSE_RE.test(q)) return false
  return PURPOSE_RE.test(q)
}

function hitIntent(
  intent: IntentResult['intent'],
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

export function classifyIntent(text: string, history?: ConversationTurn[]): IntentResult {
  const raw = lastUtterance(text)
  const expanded = expandWithContext(raw, history)
  const entities = detectEntities(`${raw} ${expanded}`)
  const prior = lastUserIntent(history)

  if (!raw.trim()) {
    return hitIntent('official-sources', 0.4, ['empty'], 'Empty message', 'unknown', entities)
  }

  // Live open/closed must beat purpose (e.g. is nelfund loan application open)
  if (liveOpenRe().test(raw) || liveOpenRe().test(expanded)) {
    return hitIntent('current-information', 0.92, ['open-status', 'current'], 'Live open / deadline', 'exploring', entities)
  }

  if (PURPOSE_RE.test(raw) || PURPOSE_RE.test(expanded)) {
    return hitIntent('what-is-nelfund', 0.94, ['what-is'], 'What / why NELFUND', 'exploring', entities)
  }

  if (isPortalDump(raw) || isPortalDump(expanded)) {
    if (/pending|under\s*review|how\s*far|approved|declin/i.test(raw)) {
      return hitIntent('pending-application', 0.86, ['pending-status'], 'Portal dump with status', 'waiting', entities, true)
    }
    if (/invalid\s*jamb|jamb/i.test(raw)) {
      return hitIntent('jamb-verification', 0.86, ['jamb'], 'Portal dump with JAMB', 'applying', entities, true)
    }
    if (/missing\s*information|not\s*on\s*(the\s*)?list/i.test(raw)) {
      return hitIntent('missing-information', 0.86, ['missing'], 'Portal dump missing info', 'applying', entities, true)
    }
  }

  if (/invalid\s*jamb|jamb\s*(no|not|never|invalid|fail)|utme\s*(no|not|invalid)|jamb\s*caps|direct\s*entry/i.test(raw)) {
    return hitIntent('jamb-verification', 0.9, ['jamb'], 'JAMB invalid / verification', 'applying', entities, true)
  }

  if (/life\s*(jail|imprison)|jail\s*for\s*life|prison\s*for\s*(unpaid|default)/i.test(raw)) {
    return hitIntent('repayment', 0.92, ['repayment', 'life-jail-rumour'], 'Life-jail rumour', 'repaying', entities)
  }

  if (/\bgsi\b|global\s*standing\s*instruction/i.test(raw)) {
    return hitIntent('gsi', 0.9, ['gsi'], 'GSI question', 'repaying', entities)
  }

  if (/how\s*much\s*(is\s*)?(the\s*)?(upkeep|stipend|allowance)|upkeep\s*(amount|how\s*much)/i.test(raw)) {
    return hitIntent('upkeep', 0.9, ['upkeep'], 'How much upkeep', 'exploring', entities)
  }

  if (/part[\s-]*time|sandwich\s*student|post\s*graduate|postgraduate|private\s*(uni|university|school)|who\s*(fit|can)\s*apply/i.test(raw)) {
    return hitIntent('eligibility', 0.88, ['eligibility'], 'Who can apply / mode of study', 'exploring', entities)
  }

  if (/already\s*paid\s*(my\s*)?(school\s*)?fee|refund\s*(my\s*)?(fee|money)|paid\s*from\s*pocket/i.test(raw)) {
    return hitIntent('refund', 0.88, ['refund'], 'Already paid fees', 'waiting', entities, true)
  }

  if (/change\s*(my\s*)?(bank|account\s*number)|wrong\s*bank|wallet\s*(no|not)\s*(work|accept)/i.test(raw)) {
    return hitIntent('bank-information', 0.88, ['bank'], 'Change bank', 'applying', entities, true)
  }

  if (/repay|after\s*nysc|nysc.*pay|scholarship|loan\s*or\s*scholarship|na\s*scholarship/i.test(raw) && !/pending|how\s*far|never\s*enter/i.test(raw)) {
    if (/scholarship|grant|free\s*money|loan\s*or\s*scholarship/i.test(raw)) {
      return hitIntent('loan-or-scholarship', 0.88, ['scholarship', 'loan'], 'Loan vs scholarship', 'exploring', entities)
    }
    return hitIntent('repayment', 0.88, ['repayment'], 'Repayment / NYSC', 'repaying', entities)
  }

  if (
    /how\s*far|money\s*(never|no)\s*(enter|drop|show)|still\s*pending|under\s*review|i\s*don\s*apply|when\s*(dem|they|una)\s*(go|will)\s*pay|no\s*alert|approved.{0,24}(no|never|not).{0,16}(money|alert|upkeep)|una\s*no\s*pay\s*me|dem\s*no\s*pay\s*me|application\s*(dey|is)\s*processing|disburs(e|ement)|i\s*wan\s*check\s*(my\s*)?(loan|application)|name\s*(no|not)\s*dey\s*(the\s*)?(pay\s*)?list|nothing\s*don\s*drop|dem\s*don\s*pay\s*(others|my\s*mates)|my\s*mates\s*(don|have)\s*(collect|receive)|class\s*(don|have)\s*collect/i.test(
      raw,
    )
  ) {
    return hitIntent('pending-application', 0.9, ['pending-status'], 'Pending / payout wait', 'waiting', entities, true)
  }

  if (/create\s*(account|profile)|sign\s*up|how\s*(to|i\s*go)\s*apply|step\s*by\s*step|walk\s*me/i.test(raw)) {
    return hitIntent('how-to-apply', 0.88, ['how-to-apply'], 'How to apply', 'preparing', entities)
  }

  if (/how\s*(do\s*i|to|i\s*go)\s*(check|see)\s*(my\s*)?(status|application)|where\s*(i|to)\s*(check|see)\s*(status|application)/i.test(raw)) {
    return hitIntent('pending-application', 0.88, ['pending-status'], 'Check application status', 'waiting', entities, true)
  }

  if (/documents?\s*(i\s*)?(need|required)|wetin\s*i\s*go\s*carry|requirements?\s*to\s*apply/i.test(raw)) {
    return hitIntent('documents-needed', 0.86, ['documents'], 'Documents needed', 'preparing', entities)
  }

  if (
    /email\s*(already\s*)?(used|exist|exists|registered)|already\s*(used|registered|exist).{0,20}(email|account)|registered\s*(last|last\s*year|before)|account\s*(already\s*)?(exist|exists)|forgot\s*(my\s*)?password|cannot\s*(login|sign\s*in)|portal\s*(no|not)\s*(open|load)|otp\s*(no|not|never|no\s*dey)|verification\s*code\s*(no|not|never)/i.test(
      raw,
    )
  ) {
    return hitIntent('portal-login', 0.9, ['login'], 'Login / email already used / OTP', 'applying', entities, true)
  }

  if (/customer\s*care|phone\s*(number|no|line)|nelfund\s*(hotline|number)|who\s*(do\s*i|to)\s*call|office\s*address/i.test(raw)) {
    return hitIntent('contact-support', 0.88, ['other'], 'Phone / office / hotline', 'exploring', entities)
  }

  if (/(pay|paid)\s*(an?\s*)?agent|buy\s*(slot|form)|nelfund\s*agent/i.test(raw)) {
    return hitIntent('scam-safety', 0.92, ['other'], 'Agent / paid slot', 'exploring', entities)
  }

  if (/apply\s*(last\s*)?(year|session)|reapply|re-apply|this\s*(year|session)\s*again/i.test(raw) && !/email\s*(already|used)/i.test(raw)) {
    return hitIntent('reapplication', 0.86, ['other'], 'Last year apply / reapply', 'applying', entities)
  }

  const soft = residualSoftRoute(expanded || raw, entities)
  if (soft && soft.intent !== 'unknown') return soft

  // Conversational follow-ups keep the prior intent (from history or previous assistant)
  const followish =
    raw.length < 120 &&
    /^(alright|okay|ok|so|and|then|now|please|abeg)?\s*(so\s+)?(what|wetin|how|where|which)?/i.test(raw) &&
    /(next|do|solution|first|should|will\s*i|i\s*go|wattin|wetin)/i.test(raw)
  if (prior && prior !== 'unknown' && (raw.length < 80 || followish)) {
    return hitIntent(prior, 0.72, ['follow-up'], 'Follow-up keeps prior intent', 'unknown', entities)
  }
  if (followish && history && history.length > 0) {
    const asstIntent = [...history].reverse().find((h) => h.role === 'assistant' && h.intent)?.intent
    if (asstIntent && asstIntent !== 'unknown') {
      return hitIntent(asstIntent, 0.7, ['follow-up'], 'Follow-up from assistant intent', 'unknown', entities)
    }
  }

  return hitIntent('official-sources', 0.4, ['other'], 'Unclassified residual', 'exploring', entities)
}

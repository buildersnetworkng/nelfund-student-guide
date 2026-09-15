import type { IntentId, IntentResult } from './types'

function hit(
  intent: IntentId,
  confidence: number,
  topics: string[],
  problem: string,
  stage: IntentResult['stage'],
  entities: string[],
  isTroubleshooting = false,
): IntentResult {
  return { intent, confidence, topics, problem, stage, entities, isTroubleshooting }
}

function liveish(q: string): boolean {
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close/i.test(q)
}

/** More leftover routes for admin unknown topic `other`. */
export function residualOtherMore(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (/account\s*(already\s*)?(exist|exists)|email\s*(already|don)\s*(exist|register|use)|i\s*don\s*get\s*account|already\s*register/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'existing-account'], 'Account already exists leftover', 'applying', entities, true)
  }
  if (/portal\s*(no|not|never)\s*(open|load|dey)|site\s*(no|not)\s*(open|load)|cannot\s*open\s*(the\s*)?portal|504|502|503|site\s*(is\s*)?down|network\s*error/i.test(q)) {
    return hit('portal-login', 0.84, ['login', 'portal-down'], 'Portal not loading leftover', 'applying', entities, true)
  }
  if (/forgot\s*(my\s*)?(password|email|mail)|reset\s*(my\s*)?password|change\s*(my\s*)?password/i.test(q)) {
    return hit('portal-login', 0.88, ['login', 'reset'], 'Forgot password leftover', 'applying', entities, true)
  }
  if (/how\s*(do\s*i|to|i\s*go)\s*(check|see)\s*(my\s*)?(status|application)|where\s*(i|to)\s*(check|see)\s*(status|application)/i.test(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'check'], 'How to check status leftover', 'waiting', entities, true)
  }
  if (/approved.{0,30}(no|never|not|zero).{0,20}(money|alert|upkeep)|school\s*(don|has)\s*(collect|receive|get).{0,24}(no|never|not).{0,16}upkeep|upkeep\s*(never|no)\s*(enter|drop|show)/i.test(q)) {
    return hit('pending-application', 0.88, ['pending-status', 'school-paid-no-upkeep'], 'Approved / school paid no upkeep leftover', 'waiting', entities, true)
  }
  if (/compulsory|must\s*i\s*apply|do\s*i\s*(have\s*to|need\s*to)\s*apply|na\s*force|is\s*it\s*mandatory/i.test(q)) {
    return hit('what-is-nelfund', 0.8, ['what-is', 'optional'], 'Is it compulsory leftover', 'exploring', entities)
  }
  if (/\b(200|300|400|500)\s*level\b|\b(200|300|400)l\b|final\s*year|last\s*year\s*student|spill\s*over/i.test(q) && !liveish(q) && !/pending|how\s*far/.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'level'], 'Level / final year leftover', 'exploring', entities)
  }
  if (/i\s*never\s*(apply|register|submit)|i\s*never\s*start|i\s*wan(t)?\s*begin/i.test(q) && !liveish(q)) {
    return hit('how-to-apply', 0.84, ['how-to-apply', 'not-started'], 'Never applied leftover', 'preparing', entities)
  }
  if (/documents?\s*(i\s*)?(need|required)|wetin\s*i\s*go\s*carry|what\s*(do\s*i|to)\s*bring|requirements?\s*to\s*apply/i.test(q)) {
    return hit('documents-needed', 0.86, ['documents'], 'Documents needed leftover', 'preparing', entities)
  }
  if (/physically\s*challenged|disabilit|special\s*need|wheelchair|blind\s*student/i.test(q)) {
    return hit('eligibility', 0.82, ['eligibility', 'disability'], 'Disability leftover', 'exploring', entities)
  }
  if (/indigene|state\s*of\s*origin|federal\s*character|catchment/i.test(q)) {
    return hit('eligibility', 0.8, ['eligibility', 'origin'], 'State of origin leftover', 'exploring', entities)
  }
  if (/after\s*nd\b|from\s*nd\s*to\s*hnd|hnd\s*after\s*nd|i\s*don\s*finish\s*nd/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'nd-hnd'], 'ND to HND leftover', 'exploring', entities)
  }
  if (/help\s*me\s*(login|sign\s*in)|i\s*no\s*fit\s*(login|sign\s*in)|cannot\s*(login|sign\s*in)/i.test(q)) {
    return hit('portal-login', 0.86, ['login'], 'Cannot login leftover', 'applying', entities, true)
  }
  return null
}

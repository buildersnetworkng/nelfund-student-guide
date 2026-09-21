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

/** Pending-status leftovers that previously fell into admin topic `other`. */
export function residualPendingMore(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (/my\s*(application|loan|file)\s*(status|na\s*wetin)|wetin\s*(be|dey)\s*(my\s*)?(status|application)|check\s*(my\s*)?(application|loan|status)|status\s*(of\s*)?(my\s*)?(loan|application)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'status-check'], 'Check my application leftover', 'waiting', entities, true)
  }
  if (/still\s*(waiting|dey\s*wait)|i\s*dey\s*wait|waiting\s*(for\s*)?(approval|payment|upkeep|money)|dem\s*never\s*(pay|approve)\s*me|never\s*(pay|approve)\s*me/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'still-waiting'], 'Still waiting leftover', 'waiting', entities, true)
  }
  if (/approv(ed|al).{0,40}(no|never|not|nothing).{0,24}(money|alert|upkeep|pay|enter|drop)|successful.{0,24}(no|never).{0,16}(money|alert)/i.test(q)) {
    return hit('pending-application', 0.88, ['pending-status', 'approved-no-pay'], 'Approved but no money leftover', 'waiting', entities, true)
  }
  if (/how\s*far\s*(my\s*)?(loan|application|nelfund|am)|my\s*loan\s*how\s*far/i.test(q)) {
    return hit('pending-application', 0.88, ['pending-status', 'how-far'], 'How far my loan leftover', 'waiting', entities, true)
  }
  if (/tracking\s*(number|id)|track\s*(my\s*)?(application|loan)|where\s*(is|dey)\s*(my\s*)?(application|loan)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.8, ['pending-status', 'track'], 'Track application leftover', 'waiting', entities, true)
  }
  if (/school\s*(don|has)\s*(collect|receive|get).{0,40}(upkeep|i|me|alert).{0,16}(no|never|not)|upkeep\s*(no|never|not)\s*(enter|drop|show|come|dey)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'upkeep-wait'], 'School paid, upkeep wait leftover', 'waiting', entities, true)
  }
  if (/since\s+(january|february|march|april|may|june|july|august|september|october|november|december|last\s+(month|year)|\d{4}).{0,40}(never|no|not)\s+(pay|enter|drop|approve)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'long-wait'], 'Long wait since date leftover', 'waiting', entities, true)
  }
  if (/^(how\s*far|how\s*far\s*na|how\s*far\s*now|abeg\s*how\s*far)[.!? ]*$/i.test(q)) {
    return hit('pending-application', 0.9, ['pending-status', 'how-far'], 'Bare how far leftover', 'waiting', entities, true)
  }
  if (/money\s*(never|no|not)\s*(enter|drop|show|come|dey)|e\s*never\s*(enter|drop|show)|never\s*enter\s*(my\s*)?(account|bank)|account\s*(never|no)\s*(see|show)\s*(money|alert)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.88, ['pending-status', 'money-never-enter'], 'Money never enter leftover', 'waiting', entities, true)
  }
  if (/dem\s*never\s*(credit|pay|send)|una\s*never\s*(credit|pay)|no\s*(credit|alert)\s*(since|at\s*all)|i\s*never\s*see\s*(my\s*)?(money|alert|upkeep)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'no-credit'], 'Never credited leftover', 'waiting', entities, true)
  }
  if (/pending\s*since|under\s*review\s*since|e\s*dey\s*pending|still\s*under\s*review|na\s*pending\s*i\s*see/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'still-pending'], 'Still pending leftover', 'waiting', entities, true)
  }
  if (/i\s*apply\s*(last|since)|i\s*don\s*apply\s*(since|last)|submitted\s*(since|last)|apply\s*(for|since)\s*(months?|weeks?)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'applied-long'], 'Applied long ago leftover', 'waiting', entities, true)
  }
  if (/disburse(d|ment)?\s*(no|never|not)|no\s*disburse|when\s*disburse/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'disburse'], 'Disbursement leftover', 'waiting', entities, true)
  }
  if (/dashboard\s*(empty|blank|no\s*dey|nothing)|no\s*(loan|application)\s*(on\s*)?(my\s*)?(dashboard|portal)|i\s*no\s*see\s*(anything|loan)\s*(for|on)\s*(dashboard|portal)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'empty-dashboard'], 'Empty dashboard leftover', 'waiting', entities, true)
  }
  if (/dem\s*never\s*(call|message|text|sms)|nobody\s*(don|has)\s*(call|contact)|no\s*(mail|sms|call)\s*from\s*nelfund|una\s*never\s*reach\s*me/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.84, ['pending-status', 'no-contact'], 'Never called leftover', 'waiting', entities, true)
  }
  if (/invalid\s*matric|matric\s*(no|not|never|invalid)|matriculation\s*(number\s*)?(no|not|invalid)/i.test(q) && !/jamb/i.test(q)) {
    return hit('missing-information', 0.84, ['missing', 'matric'], 'Invalid matric leftover', 'applying', entities, true)
  }
  if (/institution\s*(not\s*)?(captured|listed|found)|school\s*(not\s*)?captured|record\s*(no|not)\s*(captured|uploaded)/i.test(q) && !liveish(q)) {
    return hit('institution-verification', 0.86, ['missing', 'institution-verification'], 'Institution not captured leftover', 'applying', entities, true)
  }
  if (/^(any\s*update|update\s*abeg|una\s*update|new\s*update|wetin\s*be\s*update)[.!? ]*$/i.test(q)) {
    return hit('pending-application', 0.8, ['pending-status', 'any-update'], 'Any update leftover', 'waiting', entities, true)
  }
  if (/i\s*no\s*see\s*(my\s*)?(upkeep|stipend|allowance)|upkeep\s*(never|no)\s*(land|enter|drop)/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.86, ['pending-status', 'upkeep-wait'], 'No upkeep leftover', 'waiting', entities, true)
  }
  if (/status\s*still\s*(processing|pending|submitted)|still\s*processing|e\s*still\s*dey\s*process/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.9, ['pending-status', 'still-processing'], 'Status still processing leftover', 'waiting', entities, true)
  }
  if (/why\s*(my\s*)?(own|application|tin)\s*(no|not|never)\s*move|my\s*own\s*(no|never)\s*move/i.test(q) && !liveish(q)) {
    return hit('pending-application', 0.9, ['pending-status', 'not-moving'], 'Why my own no move leftover', 'waiting', entities, true)
  }
  return null
}

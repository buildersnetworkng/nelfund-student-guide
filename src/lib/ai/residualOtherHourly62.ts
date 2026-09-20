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

/**
 * Hour-62 leftover catcher.
 * Admin 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40, empty 30, open-status 26.
 * Target: school not on list, email already used, invalid JAMB, how-far money, purpose vs status.
 */
export function residualOtherHourly62(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (
    /what\s*(is|are)\s*(the\s+)?(purpose|aim|point|goal)|wetin\s*(be|mean)\s*(this\s+)?(nelfund|loan)|why\s+(dem|they|una|fg|government).{0,20}(create|start|bring|form)|nelfund\s+na\s+wetin|^nelfund\??$/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is'], 'Purpose leftover 62', 'exploring', entities)
  }

  if (
    /is\s+(nelfund|loan|portal|application).{0,20}(open|close)|still\s+(open|accept|dey\s+open)|deadline|as\s+of\s+(today|now)|can\s+i\s+still\s+apply|dem\s+don\s+close|when\s+(will|go).{0,16}(open|start)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.93, ['open-status', 'current'], 'Open status leftover 62', 'exploring', entities)
  }

  if (
    /how\s*far|money\s*(never|no|not)\s*(enter|drop|show)|alert\s*(never|no)\s*(come|enter)|still\s*pending|under\s*review|when\s*(dem|they|una)\s*(go|will)\s*pay|nothing\s*don\s*drop|mates?\s*(don|have)\s*(collect|receive)|i\s*don\s*apply|check\s*(my\s*)?(status|loan|application)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status'], 'Pending leftover 62', 'waiting', entities, true)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|not|never|invalid|fail|wahala)|utme\s*(no|not|invalid)|jamb\s*caps|direct\s*entry.{0,20}jamb/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 62', 'applying', entities, true)
  }

  if (
    /email\s*(already\s*)?(used|exist|registered)|registered\s*(last\s*)?year|account\s*already\s*(exist|dey)|forgot\s*(my\s*)?password|cannot\s*(login|sign\s*in)|otp\s*(no|not|never)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email used leftover 62', 'applying', entities, true)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear|on\s*(the\s*)?list)|institution\s*(no|not)\s*(show|listed)|cannot\s*find\s*(my\s*)?school|my\s*school\s*(no|not)\s*(dey|show)|not\s*on\s*(the\s*)?(school\s*)?list/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School not showing leftover 62', 'applying', entities, true)
  }

  if (
    /\bopay\b|\bpalmpay\b|wallet\s*(account|no|not)|change\s*(my\s*)?(bank|account\s*number)|wrong\s*bank/i.test(q)
  ) {
    return hit('bank-information', 0.9, ['bank', 'other'], 'Bank/wallet leftover 62', 'applying', entities, true)
  }

  if (
    /private\s*(uni|university|school|poly)|part[\s-]*time|sandwich|masters?|m\.sc|phd|post\s*graduate|who\s*(fit|can)\s*apply|mature\s*student/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.9, ['eligibility', 'other'], 'Who can apply leftover 62', 'exploring', entities)
  }

  if (
    /admission\s*letter|passport\s*(photo|size)|wetin\s*i\s*go\s*upload|documents?\s*(i\s*)?(need|required)|requirements?\s*(to\s*)?apply/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.88, ['documents', 'other'], 'Docs leftover 62', 'preparing', entities)
  }

  if (/apply\s*(last\s*)?(year|session)|reapply|re-apply|this\s*(year|session)\s*again/i.test(q)) {
    return hit('reapplication', 0.88, ['other'], 'Reapply leftover 62', 'applying', entities)
  }

  return null
}

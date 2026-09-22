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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal|application)\s*(open|start|close)|application\s*window|account\s*creation\s*(open|close)|fit\s*i\s*still\s*apply|is\s*(nelfund|application|portal)\s*(still\s*)?(open|closed)|dem\s*still\s*dey\s*accept/i.test(
    q,
  )
}

/**
 * Hour-116 leftover catcher. Live 2026-09-22: unknownAi 438, other 324.
 * Catch leftover "other" that is really amount, refund, bank, docs, contact, apply-start, scholarship.
 */
export function residualOtherHourly116(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create|explain\s*(this|dis)\s*loan/i.test(q))
    return null

  if (
    /how\s*much\s*(will|go|dem|they|una)\s*(give|pay|send|credit)|how\s*much\s*(is\s*)?(the\s*)?(loan|money|nelfund)|wetin\s*(be\s*)?(the\s*)?(amount|figure)|loan\s*amount|dem\s*(go|will)\s*give\s*(me\s*)?how\s*much|una\s*go\s*pay\s*how\s*much|maximum\s*(loan|amount)|minimum\s*(loan|amount)/i.test(
      q,
    )
  ) {
    if (/upkeep|stipend|allowance|pocket/i.test(q)) {
      return hit('upkeep', 0.93, ['other', 'upkeep'], 'How much upkeep leftover 116', 'exploring', entities)
    }
    return hit('how-to-apply', 0.9, ['other'], 'How much loan leftover 116', 'exploring', entities)
  }

  if (
    /i\s*(don|have|already)\s*(pay|paid)\s*(my\s*)?(school\s*)?fees?|i\s*pay\s*fees\s*(myself|by\s*myself)|already\s*paid\s*(tuition|school)|refund\s*(my\s*)?(fees?|money)|dem\s*(go|will)\s*refund/i.test(
      q,
    )
  ) {
    return hit('refund', 0.93, ['other'], 'Already paid fees leftover 116', 'waiting', entities, true)
  }

  if (
    /which\s*bank|bank\s*(account|details?)\s*(reject|fail|no\s*gree|invalid)|account\s*number\s*(no|not|never)\s*(gree|work)|use\s*(opal|moniepoint|opay|palmpay)|fintech\s*account|savings\s*account\s*(no|not)/i.test(
      q,
    )
  ) {
    return hit('bank-information', 0.93, ['other'], 'Bank leftover 116', 'applying', entities, true)
  }

  if (
    /upload\s*(no|not|never)\s*(gree|work|go)|cannot\s*upload|document\s*(no|not)\s*(upload|attach)|passport\s*(no|not)\s*(gree|upload)|file\s*(too\s*)?(large|big|small)|admission\s*letter\s*(no|not)\s*(gree|upload)/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.92, ['other'], 'Upload leftover 116', 'applying', entities, true)
  }

  if (
    /nelfund\s*(phone|whatsapp|hotline|number|customer\s*care)|which\s*number\s*(to\s*)?call|una\s*whatsapp|agent\s*number|customer\s*care\s*(number|line)|who\s*(do\s*i|to)\s*call/i.test(
      q,
    )
  ) {
    return hit('contact-support', 0.94, ['other'], 'Contact leftover 116', 'exploring', entities)
  }

  if (
    /na\s*(scholarship|grant|gift)|is\s*(this|nelfund|it)\s*(a\s*)?(scholarship|grant|gift)|free\s*money|dem\s*go\s*collect\s*(am\s*)?back|do\s*i\s*(need\s*to\s*)?pay\s*(am\s*)?back/i.test(
      q,
    ) &&
    !/when\s*(do\s*i|to)\s*repay|after\s*nysc|gsi/i.test(q)
  ) {
    return hit('what-is-nelfund', 0.92, ['what-is', 'other'], 'Loan vs scholarship leftover 116', 'exploring', entities)
  }

  if (
    /i\s*(wan|want|wanna)\s*(to\s*)?apply|how\s*(i\s*)?(go|fit)\s*start(\s*application)?|first\s*thing\s*(to\s*)?apply|where\s*(do\s*i|to)\s*begin\s*(application|apply)|i\s*never\s*apply\s*before|guide\s*me\s*(to\s*)?apply|steps?\s*to\s*apply/i.test(
      q,
    ) &&
    !/pending|how\s*far\s*my|money\s*never/i.test(q)
  ) {
    return hit('how-to-apply', 0.91, ['other'], 'Apply start leftover 116', 'applying', entities)
  }

  if (
    /no\s*(nin|bvn)|without\s*(nin|bvn)|nin\s*(no|not|never)\s*(ready|dey|gree)|bvn\s*(no|not|never)\s*(ready|dey|gree)|parent\s*(nin|bvn)/i.test(
      q,
    )
  ) {
    return hit('nin-bvn', 0.93, ['other'], 'NIN BVN leftover 116', 'applying', entities, true)
  }

  if (
    /private\s*(uni|university|poly|school)|part[\s-]*time\s*(fit|can)|sandwich|post\s*graduate|masters?\s*(fit|can)|100\s*level\s*(fit|can)|final\s*year\s*(fit|can)|nd\s*(student|fit)|nce\s*(fit|can)|who\s*(fit|can)\s*collect/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.9, ['other'], 'Who qualifies leftover 116', 'exploring', entities)
  }

  if (
    /dashboard\s*(still\s*)?(show|dey)\s*(0|zero|empty|nil)|batch\s*\d+\s*(no|not|never)|mates?\s*(don|have)\s*(collect|receive)\s*(theirs?|theirs\s*own)|my\s*own\s*(still\s*)?(dey|is)\s*(there|pending)|i\s*check\s*(am\s*)?(everyday|every\s*day)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.94, ['pending-status'], 'Pending leftover 116', 'waiting', entities, true)
  }

  return null
}

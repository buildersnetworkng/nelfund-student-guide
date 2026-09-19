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

/** Hour 51: leftover unknown/other + pending-status misfires. */
export function residualOtherHourly51(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Empty ask leftover 51', 'exploring', entities)
  }

  if (/^[.?!,\-]+$/.test(q) || q.length < 2) {
    return hit('how-to-apply', 0.45, ['empty', 'other'], 'Punctuation-only leftover 51', 'exploring', entities)
  }

  if (
    /(course\s*)?mates?\s*(don|have|has)\s*(collect|collecte|receive|see|get).{0,32}(me\s*)?(never|no|not)|everybody\s*(don|has)\s*(collect|receive).{0,24}(except|but)\s*me|dem\s*don\s*pay\s*(my\s*)?(mates|friends|hostel|class)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.94,
      ['pending-status', 'other'],
      'Mates paid leftover 51',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /e\s*no\s*enter\s*since|apply\s*last\s*(session|year|semester).{0,24}(money|upkeep|alert)\s*(no|never)|i\s*apply\s*(since|last).{0,20}(nothing|no\s*pay)|waiting\s*since\s*(january|february|march|april|may|june|july|august|september|october|november|december|2024|2025)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.93,
      ['pending-status', 'other'],
      'Long wait leftover 51',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /wetin\s*(i\s*)?(go|to)\s*do\s*(now|next)|after\s*(i\s*)?(don\s*)?apply\s*wetin|next\s*step\s*after\s*(apply|submit)|i\s*don\s*submit\s*(now\s*)?wetin/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.9,
      ['pending-status', 'other'],
      'What next after apply leftover 51',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /bvn\s*(no|not|never|mismatch|invalid|fail|reject)|nin\s*(no|not|never|mismatch|invalid|fail)|nin\s*no\s*gree|bvn\s*no\s*gree|phone\s*(no|not)\s*(match|gree)/i.test(
      q,
    )
  ) {
    return hit(
      'missing-information',
      0.92,
      ['missing-info', 'other'],
      'NIN BVN leftover 51',
      'applying',
      entities,
      true,
    )
  }

  if (
    /screenshot|i\s*(send|don\s*send|upload)\s*(pic|picture|photo|image|snap)|see\s*(the\s*)?(pic|photo|image|snap)|look\s*(this|dis)\s*(pic|photo)/i.test(
      q,
    )
  ) {
    return hit(
      'pending-application',
      0.86,
      ['pending-status', 'other'],
      'Screenshot leftover 51',
      'waiting',
      entities,
      true,
    )
  }

  if (
    /i\s*(don|have|had)\s*(register|registered|apply|applied)\s*last\s*year|email\s*(from\s*)?last\s*year|old\s*nelfund\s*(mail|email|account)|use\s*(the\s*)?same\s*email/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login', 'other'], 'Last-year email leftover 51', 'applying', entities, true)
  }

  if (
    /loan\s*(still\s*)?(dey|is)\s*(open|close)|upkeep\s*window|una\s*still\s*dey\s*(register|collect)|fit\s*i\s*still\s*create\s*account|as\s*of\s*now\s*(nelfund|loan|portal)/i.test(
      q,
    )
  ) {
    return hit('current-information', 0.91, ['open-status', 'other'], 'Open window leftover 51', 'exploring', entities)
  }

  if (
    /na\s*(scholarship|grant)\s*(or|abi)\s*loan|nelfund\s*na\s*(free|grant|scholarship)|wetin\s*nelfund\s*stand\s*for|nelfund\s*full\s*meaning/i.test(
      q,
    )
  ) {
    return hit('what-is-nelfund', 0.94, ['what-is', 'other'], 'Grant vs loan leftover 51', 'exploring', entities)
  }

  if (/when\s*(i|we)\s*go\s*(start\s*)?repay|how\s*(i|to)\s*pay\s*back|interest\s*rate|after\s*(nysc|school)\s*repay/i.test(q)) {
    return hit('repayment', 0.91, ['repayment', 'other'], 'Repay leftover 51', 'exploring', entities)
  }

  if (
    /my\s*school\s*(name\s*)?(no|not|never)\s*(dey|show)|search\s*school\s*(no|not)\s*(work|show)|institution\s*drop\s*down\s*(empty|blank)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.92, ['school-list', 'other'], 'School dropdown leftover 51', 'applying', entities, true)
  }

  if (/jamb\s*(reg|number|no)\s*(no|not|never)\s*(work|gree|match)|utme\s*(no|not)\s*gree|caps\s*not\s*linked/i.test(q)) {
    return hit('jamb-verification', 0.93, ['jamb', 'other'], 'JAMB leftover 51', 'applying', entities, true)
  }

  return null
}

import type { IntentId, IntentResult } from './types'
import { residualOtherHourly154 } from './residualOtherHourly154'

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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s+today|can\s*i\s*still\s*apply|closing\s*date|loan\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hourly 155 2026-09-24: OTP / scam Pidgin, documents carry-list,
 * school not listed fragments, interest vs scholarship, contact desk.
 * Behaviour only — no invented amounts.
 */
export function residualOtherHourly155(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return hit('official-sources', 0.45, ['empty'], 'Empty residual 155', 'unknown', entities)

  try {
    const newer = residualOtherHourly154(q, entities)
    if (newer && newer.intent !== 'unknown') return newer
  } catch {
    /* optional */
  }

  if (liveish(q)) {
    return hit('current-information', 0.9, ['open-status'], 'Hourly 155 open / deadline', 'exploring', entities)
  }

  if (
    /otp|one[- ]time\s*(pin|code|password)|share\s*(my\s*)?(pin|password|nin|bvn)|agent\s*(ask|wan|want)|pay\s*(am|them|una)\s*(make|to)\s*(process|apply)|whatsapp\s*(man|guy|agent)|dem\s*say\s*make\s*i\s*pay/i.test(
      q,
    )
  ) {
    return hit('scam-safety', 0.92, ['scam', 'otp'], 'Hourly 155 OTP / agent scam', 'applying', entities, true)
  }

  if (
    /wetin\s*(i|una)\s*(go|suppose|need)\s*(carry|upload|bring)|which\s*(paper|doc|document)s?\s*(i\s*)?(need|dey)|admission\s*letter\s*(and|,)\s*(nin|bvn)|documents?\s*for\s*(nelfund|loan)/i.test(
      q,
    )
  ) {
    return hit('documents-needed', 0.9, ['documents'], 'Hourly 155 documents carry list', 'preparing', entities)
  }

  if (
    /school\s*(no|not|never)\s*(dey|show|appear)\s*(for|on)\s*(the\s*)?list|school\s*not\s*listed|una\s*no\s*put\s*(my\s*)?school|my\s*school\s*no\s*dey\s*there/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.9, ['school-list'], 'Hourly 155 school not listed', 'applying', entities, true)
  }

  if (/na\s*(scholarship|grant|free\s*money)|loan\s*(or|vs|abi)\s*scholarship|dem\s*go\s*collect\s*am\s*back/i.test(q)) {
    return hit('loan-or-scholarship', 0.9, ['loan-vs-grant'], 'Hourly 155 loan vs scholarship', 'exploring', entities)
  }

  if (/interest[- ]?free|zero\s*interest|does\s*(am|it|nelfund)\s*(get|carry)\s*interest|interest\s*rate/i.test(q)) {
    return hit('repayment', 0.86, ['interest'], 'Hourly 155 interest-free leftover', 'exploring', entities)
  }

  if (
    /how\s*(i|to)\s*(go\s*)?contact|esupport|open\s*(a\s*)?ticket|campus\s*(nelfund\s*)?desk|who\s*(i\s*)?(go|fit)\s*call/i.test(
      q,
    )
  ) {
    return hit('contact-support', 0.88, ['contact'], 'Hourly 155 contact support', 'applying', entities)
  }

  if (
    /invalid\s*jamb|jamb\s*(no|number)\s*(no|not|never)\s*(gree|work|dey)|utme\s*(no|not)\s*correct/i.test(q)
  ) {
    return hit('jamb-verification', 0.9, ['jamb'], 'Hourly 155 JAMB leftover', 'applying', entities, true)
  }

  return null
}

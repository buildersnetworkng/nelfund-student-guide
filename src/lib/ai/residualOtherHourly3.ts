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

/** 16 Sep 02:00 WAT hourly: leftover admin `other` that still missed prior residual layers. */
export function residualOtherHourly3(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (/life\s*(jail|imprison)|jail\s*for\s*life|prison\s*for\s*(unpaid|default)|go\s*jail\s*if\s*(i\s*)?(no|not)\s*pay/i.test(q)) {
    return hit('repayment', 0.9, ['repayment', 'life-jail-rumour'], 'Life-jail repayment rumour leftover', 'repaying', entities)
  }
  if (/\bgsi\b|global\s*standing\s*instruction|standing\s*order|auto[\s-]*debit/i.test(q) && !liveish(q)) {
    return hit('gsi', 0.88, ['gsi', 'repayment'], 'GSI leftover', 'repaying', entities)
  }
  if (/change\s*of\s*institution|i\s*change\s*(my\s*)?school|transfer\s*(to|from)\s*(another\s*)?(uni|school|poly)|new\s*school\s*(for|on)\s*(the\s*)?portal/i.test(q)) {
    return hit('profile-update', 0.86, ['profile', 'change-institution'], 'Change of institution leftover', 'applying', entities, true)
  }
  if (/session\s*(no|not|never)\s*(dey|show|appear)|no\s*session\s*(for|on)\s*(the\s*)?(portal|list)|which\s*session\s*(i|to)\s*(choose|pick)/i.test(q)) {
    return hit('academic-session', 0.86, ['session', 'missing'], 'Session not showing leftover', 'applying', entities, true)
  }
  if (/already\s*paid\s*(my\s*)?(school\s*)?fee|i\s*(don|have)\s*pay\s*(school\s*)?fee|self[\s-]*pay|paid\s*from\s*pocket|refund\s*(my\s*)?fee/i.test(q) && !liveish(q)) {
    return hit('refund', 0.86, ['refund', 'already-paid'], 'Already paid fees leftover', 'waiting', entities, true)
  }
  if (/declin(ed|e)|reject(ed)?|unsuccessful|not\s*approv/i.test(q) && !liveish(q)) {
    return hit('rejected-application', 0.86, ['pending-status', 'declined'], 'Declined leftover', 'rejected', entities, true)
  }
  if (/reprint|application\s*(id|number|ref)|reference\s*number|print\s*(my\s*)?(form|application)/i.test(q)) {
    return hit('pending-application', 0.82, ['pending-status', 'reprint'], 'Reprint / application ID leftover', 'waiting', entities, true)
  }
  if (/two\s*account|second\s*account|another\s*account|duplicate\s*account|i\s*(get|have)\s*two\s*(nelfund\s*)?login/i.test(q)) {
    return hit('portal-login', 0.86, ['login', 'duplicate-account'], 'Two accounts leftover', 'applying', entities, true)
  }
  if (/master'?s|msc\b|post\s*grad|postgraduate|\bphd\b|pgd\b/i.test(q) && /eligib|qualify|fit\s*apply|can\s*i\s*apply|apply/i.test(q) && !liveish(q)) {
    return hit('eligibility', 0.86, ['eligibility', 'postgrad'], 'Postgraduate leftover', 'exploring', entities)
  }
  if (/vocational|innovation\s*institute|nce\s*part[\s-]*time|monotechnic/i.test(q) && !liveish(q) && !/pending|how\s*far/.test(q)) {
    return hit('eligibility', 0.84, ['eligibility', 'vocational'], 'Vocational / monotechnic leftover', 'exploring', entities)
  }
  if (/i\s*(don|have)\s*graduat|i\s*be\s*graduate|finish\s*school|alumni\s*(fit|can)\s*apply/i.test(q) && !/repay|after\s*nysc/.test(q.toLowerCase())) {
    return hit('eligibility', 0.84, ['eligibility', 'graduate'], 'Already graduated leftover', 'exploring', entities)
  }
  if (/appeal|review\s*(my\s*)?(file|case)|make\s*una\s*look\s*again|reconsider/i.test(q) && !liveish(q)) {
    return hit('rejected-application', 0.8, ['pending-status', 'appeal'], 'Appeal leftover', 'rejected', entities, true)
  }
  if (/apply\s*again|reapply|next\s*cycle|another\s*session\s*loan/i.test(q) && !liveish(q)) {
    return hit('reapplication', 0.84, ['reapply'], 'Reapply leftover', 'preparing', entities)
  }
  if (/matric\s*(no|not|never)|no\s*matric|i\s*no\s*get\s*matric/i.test(q)) {
    return hit('missing-information', 0.84, ['missing', 'matric'], 'No matric leftover', 'applying', entities, true)
  }
  if (/nin\s*(and|with)\s*jamb|jamb\s*(and|with)\s*nin|name\s*(no|not)\s*match/i.test(q)) {
    return hit('nin-verification', 0.84, ['nin', 'jamb'], 'NIN/JAMB name mismatch leftover', 'applying', entities, true)
  }

  return null
}

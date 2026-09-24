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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s+today|can\s*i\s*still\s*apply|closing\s*date|loan\s*window|account\s*creation\s*(open|close)/i.test(
    q,
  )
}

/**
 * Hourly 149 2026-09-24: leftover "other" bucket.
 * Eligibility, missing docs, apply start, pending leftovers, login leftovers.
 * Formal, casual, Pidgin, fragments, typos.
 */
export function residualOtherHourly149(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /who\s*(fit|can|cannot|no\s*fit)\s*(apply|collect|benefit)|am\s*i\s*(eligible|qualify)|i\s*(fit|can)\s*apply\?|do\s*i\s*qualify|eligibility\s*(for|of)\s*(nelfund|the\s*loan)|part\s*time\s*(student\s*)?(fit|can)|nd\s*(student\s*)?(fit|can)|hnd\s*(student\s*)?(fit|can)|nysc\s*(fit|can)\s*apply|fresh\s*student\s*(fit|can)|who\s*the\s*loan\s*cover|does\s*nelfund\s*cover\s*me|i\s*be\s*(part\s*time|postgraduate|pg|masters)\s*.{0,20}(qualify|eligible|fit)/i.test(
      q,
    )
  ) {
    return hit('eligibility', 0.92, ['other', 'eligibility'], 'Eligibility leftover 149', 'exploring', entities)
  }

  if (
    /nin\s*(no|not|never)\s*(gree|work|verify)|bvn\s*(no|not|never)\s*(gree|match|work)|cannot\s*complete\s*(sign\s*up|signup|account)|portal\s*ask\s*(for\s*)?(nin|bvn|jamb).{0,16}(no|not|never)|missing\s*(nin|bvn|document|docs)|information\s*incomplete|profile\s*(no|not)\s*complete|i\s*no\s*get\s*(nin|bvn)|account\s*creation\s*(stuck|incomplete)|sign\s*up\s*no\s*finish|signup\s*hang/i.test(
      q,
    )
  ) {
    return hit('missing-information', 0.92, ['other', 'missing'], 'Missing docs leftover 149', 'applying', entities, true)
  }

  if (
    /how\s*(i\s*)?(go|fit|do)\s*take\s*(the\s*)?(loan|form)|walk\s*me\s*through\s*(apply|application|register)|one\s*by\s*one\s*(how\s*)?(i\s*)?apply|register\s*step\s*by\s*step|i\s*wan\s*enter\s*(the\s*)?portal\s*(now|abeg)|show\s*apply\s*road|how\s*person\s*take\s*apply|start\s*application\s*from\s*scratch|teach\s*apply\s*process/i.test(
      q,
    )
  ) {
    return hit('how-to-apply', 0.9, ['other', 'apply'], 'Apply leftover 149', 'applying', entities)
  }

  if (
    /nothing\s*don\s*drop|kobo\s*no\s*dey|alert\s*no\s*dey|disburse\s*(no|not|never)|my\s*wallet\s*(empty|zero)|no\s*credit\s*alert|bank\s*never\s*show|transfer\s*never\s*land|upkeep\s*never\s*drop|fees\s*never\s*reach\s*school|school\s*say\s*dem\s*never\s*see\s*(money|pay)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Disburse leftover 149', 'waiting', entities, true)
  }

  if (
    /same\s*mail\s*last\s*session|cannot\s*open\s*new\s*account|create\s*account\s*fail(ed)?\s*(email|mail)|email\s*taken\s*already|this\s*address\s*(is\s*)?(already|already\s*been)\s*(used|registered)|i\s*use\s*am\s*last\s*year\s*abeg/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['login'], 'Email leftover 149', 'applying', entities, true)
  }

  if (
    /jamb\s*caps\s*(no|not)|admission\s*status\s*(fail|invalid)|utme\s*reg\s*(no|not)\s*(valid|gree)|portal\s*say\s*invalid\s*reg|reg\s*number\s*(no|not)\s*valid/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 149', 'applying', entities, true)
  }

  if (
    /school\s*name\s*(no|not)\s*(dey|show)|poly\s*no\s*dey\s*list|college\s*of\s*edu(cation)?\s*(no|not)\s*(dey|list)|my\s*campus\s*no\s*appear|search\s*box\s*(empty|blank)|institution\s*search\s*fail/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School leftover 149', 'applying', entities, true)
  }

  if (
    /who\s*go\s*pay\s*back|after\s*service\s*year|nysc\s*finish\s*(how|when)\s*pay|how\s*dem\s*go\s*collect|salary\s*go\s*cut|gsi\s*mean\s*wetin|repay\s*plan\s*dey|i\s*go\s*pay\s*till\s*when/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repay leftover 149', 'repaying', entities)
  }

  if (
    /i\s*just\s*wan\s*see\s*wetin\s*dey|give\s*me\s*the\s*headings\s*again|topics\s*una\s*handle|wetin\s*i\s*fit\s*yarn\s*here|i\s*no\s*know\s*which\s*question|pick\s*topic\s*for\s*me|student\s*guide\s*menu/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague menu leftover 149', 'exploring', entities)
  }

  return null
}

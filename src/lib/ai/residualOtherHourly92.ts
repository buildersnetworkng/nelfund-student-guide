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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)\s*(open|start)|application\s*window/i.test(
    q,
  )
}

/**
 * Hour-92 leftover catcher.
 * Live 2026-09-21: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: other -> official-sources (Pidgin + vague help). Skip live-status and purpose.
 */
export function residualOtherHourly92(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null

  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of|why\s*dem\s*create/i.test(q)) return null

  if (
    /abeg\s*make\s*(you\s*)?(show|yarn)\s*me\s*(the\s*)?road|i\s*no\s*sabi\s*where\s*to\s*(begin|start)|help\s*me\s*arrange\s*myself|una\s*fit\s*yarn\s*me\s*how\s*e\s*take\s*work|just\s*point\s*me\s*small|i\s*need\s*(small\s*)?direction\s*(abeg)?|show\s*me\s*how\s*e\s*dey\s*go|i\s*wan\s*enter\s*but\s*i\s*confused|make\s*una\s*direct\s*me|i\s*just\s*need\s*orientation|where\s*i\s*go\s*start\s*from\s*abeg|help\s*me\s*find\s*my\s*bearing|i\s*dey\s*lost\s*for\s*this\s*(loan|nelfund)|yarn\s*me\s*the\s*first\s*thing\s*to\s*click/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.91, ['other', 'vague-help'], 'Vague Pidgin help leftover 92', 'exploring', entities)
  }

  if (
    /^(help|help\s*me|pls\s*help|please\s*help|abeg\s*help|i\s*need\s*help|assist\s*me|guide\s*me)\s*[.!?]*$/i.test(q) ||
    /^(hi|hello|hey)\s+(help|guide|assist)\s*(me)?[.!?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Bare help leftover 92', 'exploring', entities)
  }

  if (
    /my\s*(matter|case)\s*(no|not|never)\s*(move|change)|e\s*never\s*shift\s*since|i\s*don\s*submit\s*everything\s*but\s*(nothing|e\s*still)|batch\s*(don\s*)?pass\s*(me|my\s*own)|dem\s*skip\s*my\s*name|i\s*no\s*see\s*my\s*name\s*for\s*(the\s*)?(list|batch)|how\s*far\s*my\s*(own|file|loan)\s*(now|abeg)|una\s*forget\s*my\s*application|my\s*tin\s*still\s*dey\s*pending|i\s*apply\s*long\s*time\s*ago\s*(nothing|no\s*update)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.93, ['pending-status'], 'Pending leftover 92', 'waiting', entities, true)
  }

  if (
    /jamb\s*(reg|registration)?\s*(no|number)?\s*(no|not|never)\s*(match|correct)|caps\s*(say|says|show)\s*(not\s*admitted|pending)|utme\s*(pin|code)\s*(no|not)\s*work|jamb\s*profile\s*(no|not)\s*(dey|show)|verification\s*of\s*jamb\s*(fail|failed)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.93, ['jamb'], 'JAMB leftover 92', 'applying', entities, true)
  }

  if (
    /email\s*(i\s*)?use[d]?\s*last\s*(year|session)|last\s*year\s*(i\s*)?(register|registered)|same\s*mail\s*from\s*(last|previous)|old\s*nelfund\s*(mail|email|account)|i\s*don\s*register\s*before\s*with\s*(this\s*)?(mail|email)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.93, ['other', 'email-used'], 'Email used leftover 92', 'applying', entities, true)
  }

  if (
    /my\s*(poly|polytechnic|college)\s*(no|not)\s*(dey|show)|school\s*name\s*(no|not)\s*appear|dropdown\s*(no|not)\s*get\s*(my\s*)?school|search\s*(no|not)\s*bring\s*(my\s*)?(school|uni)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.93, ['school-list'], 'School list leftover 92', 'applying', entities, true)
  }

  if (
    /how\s*(do|does|will)\s*(i|one)\s*repay|when\s*(do|does)\s*repayment\s*start|i\s*wan\s*pay\s*back|how\s*to\s*pay\s*(the\s*)?(loan|nelfund)\s*back|repayment\s*(plan|schedule|portal)|dem\s*go\s*cut\s*my\s*salary/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.92, ['repayment'], 'Repayment leftover 92', 'repaying', entities)
  }

  return null
}

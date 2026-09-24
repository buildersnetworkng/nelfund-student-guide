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
 * Hourly 152 2026-09-24: residual other bucket (Pidgin + vague help).
 * Formal, casual, Pidgin, fragments, typos. Never invent policy.
 */
export function residualOtherHourly152(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  if (liveish(q)) return null
  if (/what\s*is\s*nelfund|wetin\s*be\s*nelfund|purpose\s*of\s*(the\s*)?(scheme|loan)|why\s*dem\s*create/i.test(q))
    return null

  if (
    /i\s*(just\s*)?(need|wan|want)\s*(una\s*)?(help|guidance|direction)|abeg\s*(una\s*)?(help|yarn|guide)\s*me|make\s*una\s*(just\s*)?(help|show|guide)\s*me|i\s*dey\s*(lost|confused|blank|stranded)\s*(here|for\s*here)?|i\s*no\s*sabi\s*(wetin|anything|where)\s*(to\s*)?(ask|do|start)?|wetin\s*una\s*(fit|dey)\s*(do|help)|how\s*(this|dis)\s*(chat|guide|page|bot)\s*(dey|fit)\s*work|gimme\s*(short\s*)?(menu|options|list)|give\s*me\s*(short\s*)?(menu|options)|list\s*(the\s*)?(topics|things)\s*(you|una)\s*(can|fit)\s*help|what\s*topics\s*(do\s*you|una)\s*cover|i\s*just\s*open\s*(this|dis)\s*(thing|app|site)|start\s*me\s*(small|soft|easy)|onboard\s*me\s*(please|pls|abeg)?|i\s*am\s*new\s*(here|to\s*(this|nelfund))|kindly\s*(assist|orient|direct)\s*me|biko\s*(help|guide)|oga\s*(abeg|help)|please\s*i\s*need\s*(clarity|direction|a\s*menu)|i\s*wan\s*ask\s*something\s*(small|abeg)?|una\s*dey\s*there\s*(abeg|pls)?|i\s*dey\s*find\s*(road|help)|help\s*me\s*pick\s*(a\s*)?topic|confused\s*student\s*(dey\s*)?here|just\s*show\s*me\s*where\s*to\s*start|i\s*no\s*get\s*idea\s*(at\s*all)?|no\s*idea\s*(abeg|pls)|anything\s*to\s*know\s*(abeg|pls)?|tell\s*me\s*how\s*(this|dis)\s*work\s*small|show\s*(me\s*)?road\s*(abeg|pls)|nelfund\s*(help|guide)\s*(abeg|pls)|student\s*loan\s*(help|guide)\s*(abeg|pls)|una\s*fit\s*assist\s*me\s*(abeg|pls)?|please\s*i\s*need\s*help\s*with\s*(this|dis)\s*(loan|nelfund|matter)|i\s*need\s*someone\s*to\s*guide|talk\s*am\s*simple|use\s*simple\s*(english|pidgin)|no\s*long\s*thing\s*(abeg|pls)?|make\s*e\s*simple|portal\s*(dey\s*)?confus(e|ing)|site\s*(dey\s*)?confus(e|ing)|wetin\s*be\s*next\s*(step|action)|what\s*should\s*i\s*ask\s*(first|now)?|i\s*no\s*know\s*wetin\s*to\s*type|wetin\s*i\s*fit\s*ask|i\s*just\s*dey\s*here|e\s*no\s*make\s*sense\s*(to\s*me)?|i\s*(dey\s*)?confused\s*(ooo+|well|pass)?|guide\s*abeg|menu\s*abeg|options\s*abeg|wetin\s*una\s*sabi|una\s*fit\s*yarn|explain\s*small|break\s*am\s*down|keep\s*am\s*short|brief\s*(me|am)|where\s*i\s*go\s*start|how\s*i\s*take\s*enter|i\s*never\s*start|i\s*wan\s*begin|first\s*thing\s*first|wetin\s*come\s*first|start\s*from\s*where|how\s*to\s*begin\s*(abeg|pls)?|helep\s*me|helpp+|plsss+|abeggg+|nelfnd|nelfun|nel\s*fund|i\s*nid\s*help|asist\s*me|guied\s*me|infomation|informatn|pls\s*una|una\s*pls/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.9, ['other', 'greeting-vague'], 'Vague Pidgin help leftover 152', 'exploring', entities)
  }

  if (
    /who\s*fit\s*help|i\s*dey\s*find\s*(nelfund|help|loan)|nelfund\s*matter|loan\s*matter\s*(abeg|pls)?|i\s*just\s*wan\s*know|make\s*una\s*help\s*me|abeg\s*i\s*get\s*wahala|e\s*no\s*dey\s*work(\s*abeg)?$|portal\s*no\s*gree|site\s*no\s*gree|i\s*dey\s*try\s*(since|tire)|i\s*don\s*tire\s*(of\s*)?(this|dis)|una\s*fit\s*yarn\s*me|talk\s*nelfund|explain\s*nelfund\s*small|i\s*need\s*una\s*help|help\s*me\s*(joor|jare)|abeg\s*joor|i\s*wan\s*ask\s*una|can\s*somebody\s*help|is\s*anybody\s*there|human\s*help|real\s*person|i\s*no\s*see\s*road|show\s*me\s*light|i\s*just\s*enter\s*here|first\s*time\s*here|new\s*here\s*(abeg|pls)?|orient\s*me|walk\s*me\s*through|hold\s*my\s*hand|from\s*scratch|start\s*afresh|i\s*no\s*know\s*where\s*to\s*begin|beginner\s*(abeg|pls)?|simple\s*steps?\s*(abeg|pls)?|keep\s*am\s*simple\s*abeg|no\s*grammar|use\s*pidgin|yarn\s*pidgin|i\s*no\s*too\s*sabi\s*english/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Hourly other Pidgin menu 152', 'exploring', entities)
  }

  if (
    /^(pls|plz|please|abeg|help|assist|guide|info|information|nelfund\s*loan|student\s*loan|loan\s*matter|matter|issue|wahala|question|ask|menu|options)\s*[.!?]*$/i.test(
      q,
    ) ||
    /^(wetin|how|what)\s*(now|next|be|happen)\s*[.!?]*$/i.test(q) ||
    /^(hmm+|hmmm+|ok(ay)?\s*na|ehn+|abi|shey|ba|k|kk|yo+|help\s*me\s*oo+|abeg\s*na+|pls\s*oo+)\s*[.!?]*$/i.test(q)
  ) {
    return hit('official-sources', 0.82, ['other', 'greeting-vague'], 'Fragment leftover 152', 'exploring', entities)
  }

  return null
}

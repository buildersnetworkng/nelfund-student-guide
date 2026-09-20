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
  return /still\s*(open|dey\s*open)|deadline|as\s*of\s*today|can\s*i\s*still\s*apply|closing\s*date|dem\s*don\s*close|loan\s*window|when\s*(will|go)\s*(nelfund|portal)/i.test(
    q,
  )
}

/**
 * Hour-75 leftover catcher.
 * Live 2026-09-20: unknownAi 438, other 324, pending-status 70, jamb 40.
 * Focus: residual other = Pidgin + vague help, never live-status dump.
 */
export function residualOtherHourly75(text: string, entities: string[]): IntentResult | null {
  const q = (text || '').trim()
  if (!q) return null
  const low = q.toLowerCase()

  if (liveish(q) && !/pending|how\s*far|never\s*(enter|reflect|show|drop)|processing|under\s*review|approved/.test(low)) {
    return null
  }

  if (
    /how\s*i\s*(go|fit)\s*(take\s*)?start|una\s*fit\s*show\s*me\s*(the\s*)?way|i\s*no\s*sabi\s*(wetin|where)\s*(to|i)\s*(do|start)|just\s*show\s*me\s*(wetin|what)\s*(to|i)\s*do|i\s*dey\s*confused\s*(abeg|pls)?|confused\s*about\s*(dis|this)\s*(loan|nelfund)|help\s*me\s*(arrange|sort)\s*(am|dis|this)|make\s*una\s*yarn\s*me\s*small|i\s*wan\s*ask\s*small\s*tin|abeg\s*orientate\s*me|give\s*me\s*(brief|short)\s*(guide|menu)|wetin\s*una\s*fit\s*do\s*for\s*me|i\s*need\s*small\s*help\s*(abeg|pls)?|pls\s*orient\s*me|kindly\s*assist\s*me\s*(sir|ma)?|i\s*no\s*know\s*how\s*e\s*take\s*be/i.test(
      q,
    )
  ) {
    return hit('official-sources', 0.88, ['other', 'greeting-vague'], 'Vague Pidgin help leftover 75', 'exploring', entities)
  }

  if (
    /how\s*far\s*(with\s*)?(dis|this)\s*(my\s*)?(own|matter|case)|my\s*matter\s*never\s*(move|shift)|e\s*still\s*dey\s*there|dem\s*never\s*do\s*(my\s*)?(own|file)|una\s*forget\s*my\s*file|i\s*don\s*dey\s*wait\s*(tire|well\s*well)|waiting\s*tire|no\s*update\s*since|since\s*(january|february|march|april|may|june|july|august|september)\s*(nothing|no\s*update)/i.test(
      q,
    )
  ) {
    return hit('pending-application', 0.92, ['pending-status'], 'Pending leftover 75', 'waiting', entities, true)
  }

  if (
    /jamb\s*(no|not)\s*gree\s*(enter|verify)|utme\s*(no|not)\s*correct|caps\s*(status|no\s*gree)|admission\s*letter\s*(jamb|no\s*gree)|reg\s*number\s*(for\s*)?jamb\s*(wrong|invalid)/i.test(
      q,
    )
  ) {
    return hit('jamb-verification', 0.92, ['jamb'], 'JAMB leftover 75', 'applying', entities, true)
  }

  if (
    /school\s*name\s*(no|not)\s*dey|poly\s*(no|not)\s*showing|college\s*of\s*edu(cation)?\s*(no|not)\s*(show|dey)|search\s*(my\s*)?school\s*(no|not)\s*(work|show)/i.test(
      q,
    )
  ) {
    return hit('school-not-found', 0.91, ['school-list'], 'School list leftover 75', 'applying', entities, true)
  }

  if (
    /dat\s*mail\s*(don|already)\s*(dey|exist)|i\s*use\s*(am|dis\s*mail)\s*last\s*year|last\s*session\s*account\s*still\s*dey|cannot\s*register\s*(again|anoda|another)/i.test(
      q,
    )
  ) {
    return hit('portal-login', 0.92, ['email-used'], 'Email used leftover 75', 'applying', entities, true)
  }

  if (
    /how\s*(i\s*)?(go|to)\s*pay\s*(am|back)|when\s*(i\s*)?(go|will)\s*start\s*(to\s*)?pay|dem\s*go\s*hold\s*(my\s*)?salary|after\s*service\s*(i\s*)?(go|will)\s*pay/i.test(
      q,
    )
  ) {
    return hit('repayment', 0.9, ['repayment'], 'Repayment leftover 75', 'repaying', entities)
  }

  return null
}
